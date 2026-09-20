from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsOwner
from patients.models import Patient, Appointment, VisitNote
from billing.models import Bill, BillItem
from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncDay
from datetime import timedelta
from django.utils import timezone


def _parse_days(request, param_name='days', default=30):
    """Read param_name from query params and return (days_val, cutoff_date)."""
    val = request.query_params.get(param_name)
    if val == 'all':
        return 'all', timezone.make_aware(timezone.datetime(2000, 1, 1))
    
    try:
        days = int(val) if val else default
    except (ValueError, TypeError):
        days = default
    if days <= 0:
        days = default
    cutoff = timezone.now().date() - timedelta(days=days)
    return days, cutoff


class OwnerSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]

    def get(self, request):
        hospital = request.user.hospitals.first()
        if not hospital:
            return Response({'error': 'No hospital found for owner'}, status=400)

        # Allow per-chart day overrides, fallback to 'days'
        dept_days_val = request.query_params.get('dept_days', request.query_params.get('days'))
        request.GET = request.GET.copy()
        
        days_main, cutoff_main = _parse_days(request, 'days', default=30)
        _, cutoff_dept = _parse_days(request, 'dept_days', default=30) if 'dept_days' in request.query_params else ('', cutoff_main)
        _, cutoff_gender = _parse_days(request, 'gender_days', default=30) if 'gender_days' in request.query_params else ('', cutoff_main)
        _, cutoff_finance = _parse_days(request, 'finance_days', default=30) if 'finance_days' in request.query_params else ('', cutoff_main)
        _, cutoff_peak = _parse_days(request, 'peak_days', default=7) if 'peak_days' in request.query_params else ('', cutoff_main)

        branch_id = request.query_params.get('branch_id')

        patients_base = Patient.objects.filter(branch__hospital=hospital, is_active=True)
        appointments_base = Appointment.objects.filter(branch__hospital=hospital, scheduled_date__lte=timezone.now().date())
        bills_base = Bill.objects.filter(branch__hospital=hospital)

        if branch_id:
            patients_base = patients_base.filter(branch_id=branch_id)
            appointments_base = appointments_base.filter(branch_id=branch_id)
            bills_base = bills_base.filter(branch_id=branch_id)

        # Patients by gender
        by_gender = list(patients_base.filter(created_at__date__gte=cutoff_gender).values('gender').annotate(count=Count('id')))

        # Patients by branch
        by_branch = list(patients_base.filter(created_at__date__gte=cutoff_main).values('branch__name').annotate(count=Count('id')))

        # Patients by department
        by_department = list(patients_base.filter(created_at__date__gte=cutoff_dept).values('primary_department__name').annotate(count=Count('id')))

        # Day-wise appointments
        appointments_list = list(appointments_base.filter(scheduled_date__gte=cutoff_peak).values('scheduled_date', 'scheduled_time'))

        # Finances
        bills_finance = bills_base.filter(created_at__date__gte=cutoff_finance)
        finance_by_day_raw = list(
            bills_finance
            .annotate(day=TruncDay('created_at'))
            .values('day')
            .annotate(revenue=Sum('total_amount'), collected=Sum('paid_amount'))
            .order_by('day')
        )
        
        finance_by_day = []
        for row in finance_by_day_raw:
            d = row['day']
            day_str = d.strftime('%Y-%m-%d') if d else 'Unknown'
            finance_by_day.append({
                'day': day_str,
                'revenue': float(row['revenue'] or 0),
                'collected': float(row['collected'] or 0)
            })

        # Revenue totals
        bills_totals = bills_base.filter(created_at__date__gte=cutoff_main)
        revenue_totals = bills_totals.aggregate(
            gross=Sum('total_amount'),
            collected=Sum('paid_amount'),
            discount=Sum('discount'),
        )
        revenue_totals = {k: float(v or 0) for k, v in revenue_totals.items()}
        revenue_totals['pending'] = revenue_totals['gross'] - revenue_totals['discount'] - revenue_totals['collected']

        # Inventory insights
        billitem_base = BillItem.objects.filter(bill__in=bills_totals)
        top_items = list(
            billitem_base
            .values('description')
            .annotate(total_qty=Sum('quantity'), total_revenue=Sum('total_price'))
            .order_by('-total_qty')[:5]
        )

        return Response({
            'patients_by_gender': by_gender,
            'patients_by_branch': by_branch,
            'patients_by_department': by_department,
            'appointments': appointments_list,
            'finances': finance_by_day,
            'revenue_totals': revenue_totals,
            'top_items': top_items,
            'days': days_main,
        })


class DoctorSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'doctor':
            return Response({'error': 'Only doctors can access this'}, status=403)

        doctor = request.user
        days_main, cutoff_main = _parse_days(request, 'days', default=7)
        
        _, cutoff_footfall = _parse_days(request, 'footfall_days', default=7) if 'footfall_days' in request.query_params else ('', cutoff_main)
        _, cutoff_diagnosis = _parse_days(request, 'diagnosis_days', default=7) if 'diagnosis_days' in request.query_params else ('', cutoff_main)
        _, cutoff_conversion = _parse_days(request, 'conversion_days', default=7) if 'conversion_days' in request.query_params else ('', cutoff_main)

        # Patient footfall
        appointments = Appointment.objects.filter(doctor=doctor, scheduled_date__gte=cutoff_footfall, status='completed')
        footfall = list(appointments.values('scheduled_date').annotate(count=Count('id')).order_by('scheduled_date'))

        # Appointment Conversion
        status_counts = list(
            Appointment.objects.filter(doctor=doctor, scheduled_date__gte=cutoff_conversion)
            .values('status').annotate(count=Count('id'))
        )

        # Next 7 Days Outlook
        seven_days_ahead = timezone.now().date() + timedelta(days=7)
        upcoming = list(
            Appointment.objects.filter(
                doctor=doctor,
                scheduled_date__gte=timezone.now().date(),
                scheduled_date__lte=seven_days_ahead,
                status='scheduled'
            ).values('scheduled_date').annotate(count=Count('id')).order_by('scheduled_date')
        )

        # Diagnoses from visit notes
        visit_notes = VisitNote.objects.filter(doctor=doctor, created_at__date__gte=cutoff_diagnosis)
        diagnoses = list(visit_notes.values('diagnosis').annotate(count=Count('id')))

        # Revenue earned by doctor (bills for patients seen by this doctor during the period)
        doctor_patient_ids = Appointment.objects.filter(
            doctor=doctor, scheduled_date__gte=cutoff_main
        ).values_list('patient_id', flat=True)
        revenue = Bill.objects.filter(
            patient_id__in=doctor_patient_ids,
            created_at__date__gte=cutoff_main
        ).aggregate(total=Sum('total_amount'), collected=Sum('paid_amount'))
        revenue = {k: float(v or 0) for k, v in revenue.items()}

        return Response({
            'footfall': footfall,
            'status_counts': status_counts,
            'upcoming': upcoming,
            'diagnoses': diagnoses,
            'revenue': revenue,
            'days': days_main,
        })
