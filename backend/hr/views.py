from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsOwnerOrDoctor, IsDoctor, IsEmployee, IsOwner
from users.models import UserRole
from .models import Employee, Attendance, LeaveApplication, BranchOvertimeConfig, OvertimeRecord, PayrollSlip
from .serializers import (
    EmployeeSerializer, AttendanceSerializer, LeaveApplicationSerializer, LeaveReviewSerializer,
    BranchOvertimeConfigSerializer, OvertimeRecordSerializer, PayrollSlipSerializer
)


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
        qs = branch_qs(Employee.objects.filter(is_active=True), self.request.user)
        
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__phone__icontains=search) |
                Q(designation__icontains=search)
            )
            
        branch_id = self.request.query_params.get('branch')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
            
        designation = self.request.query_params.get('designation')
        if designation:
            qs = qs.filter(designation__iexact=designation)
            
        return qs.order_by('id')

    def perform_create(self, serializer):
        if self.request.user.role != UserRole.OWNER:
            serializer.save(branch=self.request.user.branch)
        else:
            serializer.save()


class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Owner and Doctor can view/edit/deactivate an employee."""
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctor]

    def get_queryset(self):
        return branch_qs(Employee.objects.all(), self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.role == UserRole.OWNER and request.query_params.get('hard') == 'true':
            user = instance.user
            instance.delete()
            if user:
                user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        instance.is_active = False
        instance.save()
        if instance.user:
            instance.user.is_active = False
            instance.user.save()
        return Response({'detail': 'Employee deactivated.'}, status=status.HTTP_200_OK)


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
        leave = serializer.save(employee=employee)
        from notifications.email import send_leave_application_to_doctor
        send_leave_application_to_doctor(leave)

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
        from notifications.email import send_leave_decision_to_employee
        send_leave_decision_to_employee(leave)
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
        
        # Calculate working days excluding Sundays
        working_days = 0
        for day in range(1, num_days + 1):
            dt = datetime.date(year, month_num, day)
            if dt.weekday() != 6:  # 6 is Sunday
                working_days += 1

        # Aggregate attendance
        attendances = Attendance.objects.filter(employee=employee, date__startswith=month)
        
        present_days = half_days = paid_leave_days = absent_days = holiday_days = 0
        
        for att in attendances:
            if att.status == AttendanceStatus.PRESENT: present_days += 1
            elif att.status == AttendanceStatus.HALF_DAY: half_days += 1
            elif att.status == AttendanceStatus.ON_LEAVE: paid_leave_days += 1
            elif att.status == AttendanceStatus.ABSENT: absent_days += 1
            elif att.status == AttendanceStatus.HOLIDAY: holiday_days += 1
                
        effective_present = float(present_days) + (float(half_days) * 0.5)
        base_salary = float(employee.salary or 0)
        
        # Overtime calculation
        overtime_records = OvertimeRecord.objects.filter(employee=employee, date__startswith=month, status='approved')
        overtime_hours = 0.0
        overtime_amount = 0.0
        
        config = BranchOvertimeConfig.objects.filter(branch=employee.branch).first()
        rate_type = config.rate_type if config else '1.5x'
        flat_rate = float(config.flat_rate) if config else 0.0
        
        # Base hourly rate
        if employee.salary_type == SalaryType.MONTHLY:
            base_hourly = (base_salary / working_days) / 8.0 if working_days > 0 else 0.0
        else:
            base_hourly = base_salary / 8.0
            
        for record in overtime_records:
            hrs = float(record.overtime_hours)
            overtime_hours += hrs
            if rate_type == 'flat':
                rate = flat_rate
            elif rate_type == '2x':
                rate = base_hourly * 2.0
            else:  # '1.5x'
                rate = base_hourly * 1.5
            overtime_amount += hrs * rate

        # LOP Days calculation
        # LOP days = max(0, working_days - (effective_present + paid_leave_days + holidays))
        lop_days = max(0.0, float(working_days) - float(effective_present + paid_leave_days + holiday_days))
        
        if employee.salary_type == SalaryType.MONTHLY:
            lop_deduction = (base_salary / working_days) * lop_days if working_days > 0 else 0.0
            total_payable = base_salary - lop_deduction + overtime_amount
        else: # Daily
            lop_days = 0.0 # No LOP concept for daily, since pay is per day worked
            total_payable = (base_salary * effective_present) + overtime_amount
            
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
                'overtime_hours': overtime_hours,
                'overtime_amount': overtime_amount,
                'lop_days': lop_days,
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


class BranchOvertimeConfigListCreateView(generics.ListCreateAPIView):
    serializer_class = BranchOvertimeConfigSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctor]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.OWNER:
            return BranchOvertimeConfig.objects.all()
        # Doctor sees their branch's config
        return BranchOvertimeConfig.objects.filter(branch=user.branch)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == UserRole.DOCTOR:
            serializer.save(branch=user.branch)
        else:
            serializer.save()


class BranchOvertimeConfigDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BranchOvertimeConfigSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctor]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.OWNER:
            return BranchOvertimeConfig.objects.all()
        return BranchOvertimeConfig.objects.filter(branch=user.branch)


class OvertimeRecordListView(generics.ListAPIView):
    serializer_class = OvertimeRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.OWNER:
            qs = OvertimeRecord.objects.all()
            branch_id = self.request.query_params.get('branch')
            if branch_id:
                qs = qs.filter(employee__branch_id=branch_id)
            return qs
        elif user.role == UserRole.DOCTOR:
            return OvertimeRecord.objects.filter(employee__branch=user.branch)
        else:
            # Employee / receptionist sees their own
            employee = Employee.objects.filter(user=user).first()
            if not employee:
                return OvertimeRecord.objects.none()
            return OvertimeRecord.objects.filter(employee=employee)


class OvertimeRecordReviewView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrDoctor]

    def patch(self, request, pk):
        try:
            record = OvertimeRecord.objects.get(pk=pk)
        except OvertimeRecord.DoesNotExist:
            return Response({'detail': 'Overtime record not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if user.role == UserRole.DOCTOR and record.employee.branch != user.branch:
            return Response({'detail': 'Not authorized for this branch.'}, status=status.HTTP_403_FORBIDDEN)

        status_val = request.data.get('status')
        if status_val not in ['approved', 'rejected']:
            return Response({'detail': 'Invalid status. Must be approved or rejected.'}, status=status.HTTP_400_BAD_REQUEST)

        notes = request.data.get('notes', record.notes)
        record.status = status_val
        record.notes = notes
        if status_val == 'approved':
            record.approved_by = user
        else:
            record.approved_by = None
        record.save()
        return Response(OvertimeRecordSerializer(record).data)
