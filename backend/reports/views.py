from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsOwner
from patients.models import Patient, Appointment, VisitNote
from billing.models import Bill
from django.db.models import Count, Sum
from django.db.models.functions import TruncDay
from datetime import timedelta
from django.utils import timezone

class OwnerSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]

    def get(self, request):
        hospital = request.user.hospitals.first()
        if not hospital:
            return Response({'error': 'No hospital found for owner'}, status=400)
            
        patients = Patient.objects.filter(branch__hospital=hospital)
        
        # Patients by gender
        by_gender = list(patients.values('gender').annotate(count=Count('id')))
        
        # Patients by branch
        by_branch = list(patients.values('branch__name').annotate(count=Count('id')))
        
        # Patients by department
        by_department = list(patients.values('primary_department__name').annotate(count=Count('id')))
        
        # Day-wise busy appointments for last 7 days
        seven_days_ago = timezone.now().date() - timedelta(days=7)
        appointments = Appointment.objects.filter(branch__hospital=hospital, scheduled_date__gte=seven_days_ago, scheduled_date__lte=timezone.now().date())
        # Returning raw datetime list for charting (can group by hour in frontend)
        appointments_list = list(appointments.values('scheduled_date', 'scheduled_time'))
        
        # Finances - last 7 days
        bills = Bill.objects.filter(branch__hospital=hospital, created_at__date__gte=seven_days_ago)
        bills = bills.annotate(day=TruncDay('created_at')).values('day').annotate(revenue=Sum('total_amount'), collected=Sum('paid_amount')).order_by('day')
        
        return Response({
            'patients_by_gender': by_gender,
            'patients_by_branch': by_branch,
            'patients_by_department': by_department,
            'appointments': appointments_list,
            'finances': list(bills),
        })

class DoctorSummaryView(APIView):
    permission_classes = [IsAuthenticated] 

    def get(self, request):
        if request.user.role != 'doctor':
             return Response({'error': 'Only doctors can access this'}, status=403)
             
        doctor = request.user
        
        # Patient footfall
        seven_days_ago = timezone.now().date() - timedelta(days=7)
        appointments = Appointment.objects.filter(doctor=doctor, scheduled_date__gte=seven_days_ago, status='completed')
        footfall = list(appointments.values('scheduled_date').annotate(count=Count('id')).order_by('scheduled_date'))
        
        # Appointment Conversion
        status_counts = list(Appointment.objects.filter(doctor=doctor, scheduled_date__gte=seven_days_ago).values('status').annotate(count=Count('id')))
        
        # Next 7 Days Outlook
        seven_days_ahead = timezone.now().date() + timedelta(days=7)
        upcoming = list(Appointment.objects.filter(doctor=doctor, scheduled_date__gte=timezone.now().date(), scheduled_date__lte=seven_days_ahead, status='scheduled').values('scheduled_date').annotate(count=Count('id')).order_by('scheduled_date'))

        # Therapies & Treatments Distribution (derived from visit notes)
        visit_notes = VisitNote.objects.filter(doctor=doctor, created_at__date__gte=seven_days_ago)
        diagnoses = list(visit_notes.values('diagnosis').annotate(count=Count('id')))

        return Response({
            'footfall': footfall,
            'status_counts': status_counts,
            'upcoming': upcoming,
            'diagnoses': diagnoses,
        })
