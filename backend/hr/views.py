from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsOwnerOrDoctor, IsDoctor, IsEmployee, IsOwner
from users.models import UserRole
from .models import Employee, Attendance, LeaveApplication
from .serializers import EmployeeSerializer, AttendanceSerializer, LeaveApplicationSerializer, LeaveReviewSerializer


def branch_qs(qs, user, prefix=''):
    """Filter queryset to the user's branch scope."""
    if user.role == UserRole.OWNER:
        from branches.models import Branch
        ids = Branch.objects.filter(hospital__owner=user).values_list('id', flat=True)
        return qs.filter(**{f"{prefix}branch_id__in": ids})
    # Doctor — sees only their own branch
    return qs.filter(**{f"{prefix}branch": user.branch})


# ─────────────────── Employees ───────────────────────────────

class EmployeeListCreateView(generics.ListCreateAPIView):
    """Owner and Doctor can list/create employees for their branch."""
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctor]

    def get_queryset(self):
        return branch_qs(Employee.objects.filter(is_active=True), self.request.user).order_by('id')

    def perform_create(self, serializer):
        if self.request.user.role != UserRole.OWNER:
            serializer.save(branch=self.request.user.branch)
        else:
            serializer.save()


class EmployeeDetailView(generics.RetrieveUpdateAPIView):
    """Owner and Doctor can view/edit an employee."""
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctor]

    def get_queryset(self):
        return branch_qs(Employee.objects.all(), self.request.user)


class MyEmployeeProfileView(generics.RetrieveAPIView):
    """Any staff member views their own employee profile."""
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        try:
            return Employee.objects.get(user=self.request.user)
        except Employee.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('Employee profile not found for this user.')


# ─────────────────── Attendance (Read-Only — marked only via QR) ──────────────

class AttendanceListView(generics.ListAPIView):
    """
    Owner sees all attendance across all branches.
    Doctor sees only their branch attendance.
    All other roles are denied — they use /attendance/me/ instead.
    """
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctor]

    def get_queryset(self):
        qs = Attendance.objects.select_related('employee__branch')
        qs = branch_qs(qs, self.request.user, prefix='employee__')
        date = self.request.query_params.get('date')
        if date:
            qs = qs.filter(date=date)
        employee_id = self.request.query_params.get('employee')
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        return qs


class MyAttendanceView(generics.ListAPIView):
    """Any logged-in staff member can view their own attendance records."""
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in [UserRole.PATIENT, UserRole.OWNER]:
            return Attendance.objects.none()
        employee = Employee.objects.filter(user=user).first()
        if not employee:
            return Attendance.objects.none()
        return Attendance.objects.filter(employee=employee)


# ─────────────────── Leave Applications ──────────────────────

class LeaveListCreateView(generics.ListCreateAPIView):
    """
    Doctor, Receptionist, Employee can apply for leave (POST).
    Owner and Doctor can also see all/branch leaves (GET).
    Receptionist and Employee only see their own leaves.
    """
    serializer_class = LeaveApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.PATIENT:
            return LeaveApplication.objects.none()
        if user.role == UserRole.OWNER:
            from branches.models import Branch
            ids = Branch.objects.filter(hospital__owner=user).values_list('id', flat=True)
            return LeaveApplication.objects.filter(employee__branch_id__in=ids)
        if user.role == UserRole.DOCTOR:
            return LeaveApplication.objects.filter(employee__branch=user.branch)
        # Receptionist and Employee — own leaves only
        employee = Employee.objects.filter(user=user).first()
        return LeaveApplication.objects.filter(employee=employee) if employee else LeaveApplication.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        employee = Employee.objects.get(user=user)
        serializer.save(employee=employee)

    def create(self, request, *args, **kwargs):
        if request.user.role == UserRole.OWNER:
            return Response({'detail': 'Owners cannot apply for leave.'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role == UserRole.PATIENT:
            return Response({'detail': 'Patients cannot apply for leave.'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)


class LeaveDetailView(generics.RetrieveAPIView):
    """View a single leave application — scoped by role."""
    serializer_class = LeaveApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.DOCTOR:
            return LeaveApplication.objects.filter(employee__branch=user.branch)
        if user.role == UserRole.OWNER:
            from branches.models import Branch
            ids = Branch.objects.filter(hospital__owner=user).values_list('id', flat=True)
            return LeaveApplication.objects.filter(employee__branch_id__in=ids)
        employee = Employee.objects.filter(user=user).first()
        return LeaveApplication.objects.filter(employee=employee)


class LeaveReviewView(APIView):
    """Branch Doctor approves or rejects a leave application."""
    permission_classes = [IsAuthenticated, IsDoctor]

    def patch(self, request, pk):
        user = request.user
        try:
            leave = LeaveApplication.objects.get(pk=pk)
        except LeaveApplication.DoesNotExist:
            return Response({'detail': 'Leave application not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Doctor can only review leaves for their own branch
        if leave.employee.branch != user.branch:
            return Response({'detail': 'You can only review leave requests for your branch.'}, status=status.HTTP_403_FORBIDDEN)
            
        if leave.employee.user == user:
            return Response({'detail': 'You cannot review your own leave application.'}, status=status.HTTP_403_FORBIDDEN)

        if leave.status != 'pending':
            return Response({'detail': 'This leave has already been reviewed.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = LeaveReviewSerializer(leave, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(reviewed_by=user)
        return Response(LeaveApplicationSerializer(leave).data)


# ─────────────────── Close Day & Payroll ─────────────────────

import datetime
import calendar
from .models import AttendanceStatus, SalaryType, PayrollSlip
from .serializers import PayrollSlipSerializer

class CloseDayView(APIView):
    """Marks absent for non-scanned employees and auto-checkouts open attendances."""
    permission_classes = [IsAuthenticated, IsOwnerOrDoctor]

    def post(self, request):
        user = request.user
        date_str = request.data.get('date', str(datetime.date.today()))
        try:
            target_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)
            
        # Get branch scope
        from branches.models import Branch
        if user.role == UserRole.OWNER:
            branches = Branch.objects.filter(hospital__owner=user)
        else:
            branches = [user.branch]

        employees = Employee.objects.filter(branch__in=branches, is_active=True)
        
        absent_count = 0
        auto_checkout_count = 0
        
        for emp in employees:
            attendance = Attendance.objects.filter(employee=emp, date=target_date).first()
            if not attendance:
                # Mark absent
                Attendance.objects.create(
                    employee=emp,
                    date=target_date,
                    status=AttendanceStatus.ABSENT,
                    notes='Auto-marked absent (End of day)'
                )
                absent_count += 1
            elif attendance.check_in and not attendance.check_out:
                # Auto checkout at 18:00
                attendance.check_out = datetime.time(18, 0)
                attendance.notes = attendance.notes + "\nAuto-checkout applied." if attendance.notes else "Auto-checkout applied."
                attendance.save()
                auto_checkout_count += 1
                
        return Response({
            'message': f'Closed day for {date_str}. Marked {absent_count} absent, auto-checked out {auto_checkout_count}.'
        })


class PayrollSlipListView(generics.ListCreateAPIView):
    """Calculates and lists payroll slips."""
    serializer_class = PayrollSlipSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctor]

    def get_queryset(self):
        qs = PayrollSlip.objects.select_related('employee__branch')
        return branch_qs(qs, self.request.user, prefix='employee__')

    def create(self, request, *args, **kwargs):
        employee_id = request.data.get('employee')
        month = request.data.get('month') # YYYY-MM
        
        if not employee_id or not month:
            return Response({'error': 'employee and month are required'}, status=400)
            
        try:
            employee = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=404)
            
        if request.user.role == UserRole.DOCTOR and employee.branch != request.user.branch:
            return Response({'error': 'Not authorized for this branch'}, status=403)
            
        try:
            year, month_num = map(int, month.split('-'))
            _, num_days = calendar.monthrange(year, month_num)
        except Exception:
            return Response({'error': 'Invalid month format. Use YYYY-MM'}, status=400)
        
        # Aggregate attendance
        attendances = Attendance.objects.filter(employee=employee, date__startswith=month)
        
        present_days = half_days = paid_leave_days = absent_days = holiday_days = 0
        
        for att in attendances:
            if att.status == AttendanceStatus.PRESENT: present_days += 1
            elif att.status == AttendanceStatus.HALF_DAY: half_days += 1
            elif att.status == AttendanceStatus.ON_LEAVE: paid_leave_days += 1
            elif att.status == AttendanceStatus.ABSENT: absent_days += 1
            elif att.status == AttendanceStatus.HOLIDAY: holiday_days += 1
                
        effective_present = present_days + (half_days * 0.5)
        base_salary = float(employee.salary or 0)
        
        if employee.salary_type == SalaryType.MONTHLY:
            total_payable = (base_salary / num_days) * float(effective_present + paid_leave_days + holiday_days)
        else: # Daily
            total_payable = base_salary * float(effective_present)
            
        slip, created = PayrollSlip.objects.update_or_create(
            employee=employee,
            month=month,
            defaults={
                'base_salary': base_salary,
                'salary_type': employee.salary_type,
                'present_days': effective_present,
                'paid_leave_days': paid_leave_days,
                'absent_days': absent_days,
                'holiday_days': holiday_days,
                'total_payable': total_payable,
            }
        )
        
        return Response(PayrollSlipSerializer(slip).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class PayrollSlipDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = PayrollSlipSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctor]
    
    def get_queryset(self):
        qs = PayrollSlip.objects.select_related('employee__branch')
        return branch_qs(qs, self.request.user, prefix='employee__')
