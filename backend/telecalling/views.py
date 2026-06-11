import datetime
from django.utils import timezone
from django.db.models import Subquery, OuterRef, Q, Max
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from patients.models import Patient, Appointment, AppointmentStatus
from .models import QuickNote, CallLog
from .serializers import QuickNoteSerializer, CallLogSerializer, TelecallingPatientSerializer


class QuickNoteListView(generics.ListAPIView):
    serializer_class = QuickNoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return QuickNote.objects.filter(is_active=True)


class CallLogListCreateView(generics.ListCreateAPIView):
    serializer_class = CallLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = CallLog.objects.all()
        # Optionally filter by patient
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        
        # Branch-wise filtering: restrict to patients in the caller's branch
        # or the hospital owned by the caller (if owner)
        user = self.request.user
        if user.role == 'owner':
            qs = qs.filter(patient__branch__hospital__owner=user)
        elif hasattr(user, 'branch') and user.branch:
            qs = qs.filter(patient__branch=user.branch)
            
        return qs

    def perform_create(self, serializer):
        serializer.save(caller=self.request.user)


class TelecallingSmartListView(generics.ListAPIView):
    serializer_class = TelecallingPatientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        today = datetime.date.today()
        
        # Subqueries to obtain last and next appointment dates
        last_apt_sub = Appointment.objects.filter(
            patient=OuterRef('pk'),
            scheduled_date__lt=today
        ).exclude(
            status=AppointmentStatus.CANCELLED
        ).order_by('-scheduled_date').values('scheduled_date')[:1]

        next_apt_sub = Appointment.objects.filter(
            patient=OuterRef('pk'),
            scheduled_date__gte=today,
            status__in=[AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED]
        ).order_by('scheduled_date').values('scheduled_date')[:1]

        # Base annotated queryset
        qs = Patient.objects.filter(is_active=True).annotate(
            last_appointment_date=Subquery(last_apt_sub),
            next_appointment_date=Subquery(next_apt_sub),
            max_apt_date=Max('appointments__scheduled_date', filter=~Q(appointments__status=AppointmentStatus.CANCELLED))
        )

        # Scope by branch
        from users.models import UserRole
        if user.role == UserRole.OWNER:
            from branches.models import Branch
            branch_ids = Branch.objects.filter(hospital__owner=user).values_list('id', flat=True)
            qs = qs.filter(branch_id__in=branch_ids)
        else:
            qs = qs.filter(branch=user.branch)

        # Apply segment-specific criteria
        list_type = self.request.query_params.get('list')
        
        if list_type == 'today':
            qs = qs.filter(
                appointments__scheduled_date=today,
                appointments__status__in=[AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED]
            ).distinct()
        elif list_type == 'tomorrow':
            qs = qs.filter(
                appointments__scheduled_date=today + datetime.timedelta(days=1),
                appointments__status__in=[AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED]
            ).distinct()
        elif list_type == 'missed_7':
            qs = qs.filter(
                max_apt_date__gte=today - datetime.timedelta(days=7),
                max_apt_date__lte=today - datetime.timedelta(days=6)
            )
        elif list_type == 'missed_15':
            qs = qs.filter(
                max_apt_date__gte=today - datetime.timedelta(days=15),
                max_apt_date__lte=today - datetime.timedelta(days=8)
            )
        elif list_type == 'missed_30':
            qs = qs.filter(
                max_apt_date__gte=today - datetime.timedelta(days=30),
                max_apt_date__lte=today - datetime.timedelta(days=16)
            )
        elif list_type == 'missed_90_180':
            qs = qs.filter(
                max_apt_date__gte=today - datetime.timedelta(days=180),
                max_apt_date__lte=today - datetime.timedelta(days=31)
            )

        # Search support within lists
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(phone__icontains=search) |
                Q(uhid__icontains=search)
            ).distinct()

        return qs.order_by('first_name', 'last_name')

    def list(self, request, *args, **kwargs):
        if request.query_params.get('export') == 'csv':
            import csv
            from django.http import HttpResponse
            
            queryset = self.get_queryset()
            list_type = request.query_params.get('list', 'all')
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="telecalling_list_{list_type}.csv"'
            
            writer = csv.writer(response)
            writer.writerow(['UHID', 'Patient Name', 'Phone', 'Last Appointment Date', 'Next Appointment Date'])
            
            for patient in queryset:
                writer.writerow([
                    patient.uhid,
                    patient.get_full_name(),
                    patient.phone,
                    patient.last_appointment_date if patient.last_appointment_date else '',
                    patient.next_appointment_date if patient.next_appointment_date else ''
                ])
            return response
            
        return super().list(request, *args, **kwargs)
