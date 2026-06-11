from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from users.models import UserRole
from users.permissions import (
    IsOwnerOrDoctorOrReceptionist, IsDoctor, IsOwnerOrReceptionist,
    IsPatient, IsOwner, IsSameBranchOrOwner
)
from .models import Patient, Appointment, VisitNote, LabReport, Department, Treatment
from .serializers import (
    PatientListSerializer, PatientDetailSerializer,
    AppointmentSerializer, VisitNoteSerializer, LabReportSerializer,
    DepartmentSerializer, TreatmentSerializer
)


def branch_filtered_queryset(qs, user):
    """Scope queryset to user's branch unless user is Owner."""
    if user.role == UserRole.OWNER:
        from branches.models import Branch
        branch_ids = Branch.objects.filter(hospital__owner=user).values_list('id', flat=True)
        return qs.filter(branch_id__in=branch_ids)
    elif user.role == UserRole.PATIENT:
        return qs.none()  # Patients use dedicated endpoints
    return qs.filter(branch=user.branch)

# ─────────────────── Master Data ─────────────────────────────
class DepartmentListView(generics.ListAPIView):
    queryset = Department.objects.filter(is_active=True)
    serializer_class = DepartmentSerializer
    permission_classes = [AllowAny]

class TreatmentListView(generics.ListAPIView):
    queryset = Treatment.objects.filter(is_active=True)
    serializer_class = TreatmentSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        qs = super().get_queryset()
        dept_id = self.request.query_params.get('department')
        if dept_id:
            qs = qs.filter(department_id=dept_id)
        return qs


# ─────────────────── Patients ────────────────────────────────
class PatientListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PatientDetailSerializer
        return PatientListSerializer

    def get_queryset(self):
        qs = Patient.objects.filter(is_active=True)
        qs = branch_filtered_queryset(qs, self.request.user)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                first_name__icontains=search
            ) | qs.filter(
                last_name__icontains=search
            ) | qs.filter(
                uhid__icontains=search
            ) | qs.filter(
                phone__icontains=search
            )

        # Filter by last visit: 7d/30d/90d
        last_visit = self.request.query_params.get('last_visit')
        if last_visit in ['7d', '30d', '90d']:
            import datetime
            days = int(last_visit[:-1])
            cutoff_date = datetime.date.today() - datetime.timedelta(days=days)
            qs = qs.filter(appointments__scheduled_date__gte=cutoff_date, appointments__status='completed').distinct()

        # Annotate appointment count to sort by appointments
        from django.db.models import Count
        qs = qs.annotate(appointment_count=Count('appointments'))

        ordering = self.request.query_params.get('ordering')
        if ordering:
            valid_orderings = (
                'created_at', '-created_at', 
                'first_name', '-first_name', 
                'uhid', '-uhid',
                'dob', '-dob',
                'age', '-age',
                'appointment_count', '-appointment_count'
            )
            if ordering in valid_orderings:
                if ordering == 'first_name':
                    qs = qs.order_by('first_name', 'last_name')
                elif ordering == '-first_name':
                    qs = qs.order_by('-first_name', '-last_name')
                elif ordering == 'age':
                    # Younger first = larger dob (newer birthdate)
                    qs = qs.order_by('-dob')
                elif ordering == '-age':
                    # Older first = smaller dob
                    qs = qs.order_by('dob')
                else:
                    qs = qs.order_by(ordering)
                return qs
        # Always ensure a stable ordering to avoid pagination inconsistency warnings
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        from branches.models import Branch

        patient = None
        if user.branch_id:
            patient = serializer.save(registered_by=user, branch_id=user.branch_id)
        elif user.role == UserRole.OWNER:
            branch = serializer.validated_data.get('branch')
            owner_branches = Branch.objects.filter(hospital__owner=user, is_active=True)

            if branch and not owner_branches.filter(pk=branch.pk).exists():
                raise ValidationError({'branch': ['Select a branch from your hospital.']})

            branch = branch or owner_branches.first()
            if not branch:
                raise ValidationError({'branch': ['Create a branch before registering patients.']})

            patient = serializer.save(registered_by=user, branch=branch)
        else:
            raise ValidationError({'branch': ['Cannot determine branch for this user.']})

        if patient:
            from notifications.email import send_patient_welcome
            send_patient_welcome(patient)


class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PatientDetailSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def get_queryset(self):
        return branch_filtered_queryset(Patient.objects.all(), self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response({'detail': 'Patient deactivated.'}, status=status.HTTP_200_OK)


class MyPatientProfileView(generics.RetrieveUpdateAPIView):
    """Patient views their own profile."""
    serializer_class = PatientDetailSerializer
    permission_classes = [IsAuthenticated, IsPatient]

    def get_object(self):
        patient = Patient.objects.filter(
            phone=self.request.user.phone, is_active=True
        ).first()
        if not patient:
            from branches.models import Branch
            default_branch = Branch.objects.first()
            if default_branch:
                patient = Patient.objects.create(
                    branch=default_branch,
                    registered_by=self.request.user,
                    first_name=self.request.user.first_name,
                    last_name=self.request.user.last_name,
                    phone=self.request.user.phone,
                    email=self.request.user.email or "",
                )
        return patient


# ─────────────────── Appointments ────────────────────────────
class AppointmentListCreateView(generics.ListCreateAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.PATIENT:
            # Patient sees only their own appointments
            return Appointment.objects.filter(patient__phone=user.phone)
        qs = Appointment.objects.all()
        qs = branch_filtered_queryset(qs, user)
        
        # Search by patient name, phone, or UHID
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(patient__first_name__icontains=search) |
                Q(patient__last_name__icontains=search) |
                Q(patient__phone__icontains=search) |
                Q(patient__uhid__icontains=search)
            ).distinct()

        # Filter by date (exact match)
        date = self.request.query_params.get('date')
        if date:
            qs = qs.filter(scheduled_date=date)
            
        # Filter by date range (created_after/created_before on scheduled_date)
        created_after = self.request.query_params.get('created_after')
        if created_after:
            qs = qs.filter(scheduled_date__gte=created_after)
        created_before = self.request.query_params.get('created_before')
        if created_before:
            qs = qs.filter(scheduled_date__lte=created_before)

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        # Filter by branch (Owner only)
        branch_id = self.request.query_params.get('branch')
        if branch_id and user.role == UserRole.OWNER:
            qs = qs.filter(branch_id=branch_id)

        doctor_id = self.request.query_params.get('doctor')
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)

        # Ordering (default is -scheduled_date)
        ordering = self.request.query_params.get('ordering')
        if ordering:
            valid_orderings = ('scheduled_date', '-scheduled_date', 'status', '-status')
            if ordering in valid_orderings:
                qs = qs.order_by(ordering)
        else:
            qs = qs.order_by('-scheduled_date', '-scheduled_time')
            
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        # Enforce: one appointment per patient per day
        patient = serializer.validated_data.get('patient')
        scheduled_date = serializer.validated_data.get('scheduled_date')
        if patient and scheduled_date:
            existing = Appointment.objects.filter(
                patient=patient,
                scheduled_date=scheduled_date,
                status__in=[AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED, AppointmentStatus.COMPLETED]
            ).exists()
            if existing:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({
                    'scheduled_date': [f'{patient.get_full_name()} already has an appointment on {scheduled_date}. Please choose a different date.']
                })
        appointment = serializer.save(booked_by=user)
        from notifications.email import send_appointment_booking_confirmation
        send_appointment_booking_confirmation(appointment)


class AppointmentDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.PATIENT:
            return Appointment.objects.filter(patient__phone=user.phone)
        return branch_filtered_queryset(Appointment.objects.all(), user)

    def perform_update(self, serializer):
        old_status = self.get_object().status
        appointment = serializer.save()
        if appointment.status == AppointmentStatus.NO_SHOW and old_status != AppointmentStatus.NO_SHOW:
            from notifications.email import send_missed_appointment_email
            send_missed_appointment_email(appointment)


# ─────────────────── Visit Notes ─────────────────────────────
class VisitNoteListCreateView(generics.ListCreateAPIView):
    serializer_class = VisitNoteSerializer
    permission_classes = [IsAuthenticated, IsDoctor]

    def get_queryset(self):
        patient_id = self.kwargs.get('patient_id')
        return VisitNote.objects.filter(patient_id=patient_id)

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)


class VisitNoteDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = VisitNoteSerializer
    permission_classes = [IsAuthenticated, IsDoctor]
    queryset = VisitNote.objects.all()


# ─────────────────── Lab Reports ─────────────────────────────
class LabReportListCreateView(generics.ListCreateAPIView):
    serializer_class = LabReportSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def get_queryset(self):
        patient_id = self.kwargs.get('patient_id')
        return LabReport.objects.filter(patient_id=patient_id)

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

class LabReportDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = LabReportSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]
    queryset = LabReport.objects.all()


# ─────────────────── Patient Full History ────────────────────
class PatientFullHistoryView(APIView):
    """Returns aggregated medical history for a patient."""
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def get(self, request, patient_id, *args, **kwargs):
        try:
            patient = Patient.objects.get(id=patient_id, is_active=True)
        except Patient.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)

        # Prescriptions
        from medicines.models import Prescription, PrescriptionItem
        from medicines.serializers import PrescriptionSerializer
        prescriptions = Prescription.objects.filter(patient=patient).order_by('-created_at')[:20]
        rx_data = PrescriptionSerializer(prescriptions, many=True).data

        # Bills
        from billing.models import Bill
        from billing.serializers import BillSerializer
        try:
            bills = Bill.objects.filter(patient=patient).order_by('-created_at')[:20]
            bills_data = BillSerializer(bills, many=True).data
        except Exception:
            bills_data = []

        # Appointments
        appointments = Appointment.objects.filter(patient=patient).order_by('-scheduled_date')[:30]
        apt_data = AppointmentSerializer(appointments, many=True).data

        # Telecalling logs
        try:
            from telecalling.models import CallLog
            from telecalling.serializers import CallLogSerializer
            call_logs = CallLog.objects.filter(patient=patient).order_by('-timestamp')[:20]
            calls_data = CallLogSerializer(call_logs, many=True).data
        except Exception:
            calls_data = []

        # Patient info
        from .serializers import PatientDetailSerializer
        patient_data = PatientDetailSerializer(patient).data

        return Response({
            'patient': patient_data,
            'prescriptions': rx_data,
            'bills': bills_data,
            'appointments': apt_data,
            'call_logs': calls_data,
        })

# ─────────────────── Reviews ──────────────────────────────────
from .models import Review, ReviewStatus
from .serializers import ReviewSerializer
from rest_framework.permissions import AllowAny
from datetime import datetime

class PublicReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Review.objects.filter(status=ReviewStatus.APPROVED)

class AdminReviewListView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReceptionist]

    def get_queryset(self):
        qs = Review.objects.all()
        return branch_filtered_queryset(qs, self.request.user)

class AdminReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReceptionist]
    queryset = Review.objects.all()


# ─────────────────── Public Booking ───────────────────────────
from .models import AppointmentStatus

class PublicAvailableSlotsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        target_date_str = request.query_params.get('date')
        if not target_date_str:
            return Response({'error': 'date parameter is required (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'invalid date format'}, status=status.HTTP_400_BAD_REQUEST)

        branch_id = request.query_params.get('branch')
        
        max_capacity = 5
        if branch_id:
            try:
                from branches.models import Branch
                branch = Branch.objects.get(id=branch_id)
                max_capacity = getattr(branch, 'max_patients_per_slot', 5)
            except Branch.DoesNotExist:
                pass
        
        slots = []
        for hour in range(9, 19):
            slot_time = f"{hour:02d}:00:00"
            
            qs = Appointment.objects.filter(
                scheduled_date=target_date, 
                scheduled_time=slot_time,
                status__in=[AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED]
            )
            if branch_id:
                qs = qs.filter(branch_id=branch_id)
                
            booked_count = qs.count()
            available_capacity = max(0, max_capacity - booked_count)
            
            # Format time labels nicely, e.g., 09:00 AM - 10:00 AM
            am_pm = "AM" if hour < 12 else "PM"
            display_hour = hour if hour <= 12 else hour - 12
            if display_hour == 0:
                display_hour = 12
            
            next_hour = hour + 1
            next_am_pm = "AM" if next_hour < 12 else "PM"
            display_next_hour = next_hour if next_hour <= 12 else next_hour - 12
            if display_next_hour == 0:
                display_next_hour = 12
                
            time_label = f"{display_hour:02d}:00 {am_pm} - {display_next_hour:02d}:00 {next_am_pm}"
            
            slots.append({
                'time': f"{hour:02d}:00",
                'label': time_label,
                'date': target_date_str,
                'day': target_date.strftime('%A'),
                'patient_count': booked_count,
                'available_capacity': available_capacity,
                'max_capacity': max_capacity
            })
                
        return Response({'slots': slots})


class PublicBookAppointmentView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        data = request.data
        name = data.get('name')
        phone = data.get('phone')
        email = data.get('email', '')
        branch_id = data.get('branch')
        dept_id = data.get('department')
        treatment_id = data.get('treatment')
        scheduled_date = data.get('scheduled_date')
        scheduled_time = data.get('scheduled_time')
        reason = data.get('message', '')

        if not all([name, phone, branch_id, scheduled_date, scheduled_time]):
            return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)

        from branches.models import Branch
        try:
            branch = Branch.objects.get(id=branch_id)
        except Branch.DoesNotExist:
            return Response({'error': 'Invalid branch'}, status=status.HTTP_400_BAD_REQUEST)

        # Find or create patient
        patient = Patient.objects.filter(phone=phone, branch=branch).first()
        if not patient:
            first_name = name.split(' ')[0]
            last_name = ' '.join(name.split(' ')[1:]) if len(name.split(' ')) > 1 else ''
            patient = Patient.objects.create(
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                email=email,
                branch=branch,
                primary_department_id=dept_id,
                interested_treatment_id=treatment_id
            )

        # Create appointment
        appointment = Appointment.objects.create(
            patient=patient,
            branch=branch,
            scheduled_date=scheduled_date,
            scheduled_time=scheduled_time,
            status=AppointmentStatus.SCHEDULED,
            reason=reason
        )

        return Response({'message': 'Appointment booked successfully', 'appointment_id': appointment.id}, status=status.HTTP_201_CREATED)


class PatientBulkDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def post(self, request, *args, **kwargs):
        patient_ids = request.data.get('patient_ids', [])
        if not patient_ids:
            return Response({'error': 'No patient IDs provided.'}, status=status.HTTP_400_BAD_REQUEST)

        qs = Patient.objects.filter(id__in=patient_ids, is_active=True)
        qs = branch_filtered_queryset(qs, request.user)

        count = qs.update(is_active=False)
        return Response({'detail': f'Successfully deactivated {count} patients.'}, status=status.HTTP_200_OK)
