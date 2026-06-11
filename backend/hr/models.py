from django.db import models


class AttendanceStatus(models.TextChoices):
    PRESENT = 'present', 'Present'
    ABSENT = 'absent', 'Absent'
    HALF_DAY = 'half_day', 'Half Day'
    ON_LEAVE = 'on_leave', 'On Leave'
    HOLIDAY = 'holiday', 'Holiday'


class LeaveType(models.TextChoices):
    SICK = 'sick', 'Sick Leave'
    CASUAL = 'casual', 'Casual Leave'
    ANNUAL = 'annual', 'Annual Leave'
    OTHER = 'other', 'Other'


class LeaveStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'

class SalaryType(models.TextChoices):
    DAILY = 'daily', 'Daily'
    MONTHLY = 'monthly', 'Monthly'


class Employee(models.Model):
    user = models.OneToOneField('users.CustomUser', on_delete=models.CASCADE, related_name='employee_profile')
    branch = models.ForeignKey('branches.Branch', on_delete=models.CASCADE, related_name='employees')
    designation = models.CharField(max_length=100)
    salary_type = models.CharField(max_length=10, choices=SalaryType.choices, default=SalaryType.MONTHLY)
    salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    date_of_joining = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'
        db_table = 'employees'

    def __str__(self):
        return f'{self.user.get_full_name()} — {self.designation} @ {self.branch.name}'


class Attendance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=15, choices=AttendanceStatus.choices, default=AttendanceStatus.PRESENT)
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    recorded_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    recorded_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_flagged = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    marked_by = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL,
        null=True, related_name='marked_attendance'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Attendance'
        verbose_name_plural = 'Attendance Records'
        db_table = 'attendance'
        unique_together = ('employee', 'date')
        ordering = ['-date']

    def __str__(self):
        return f'{self.employee.user.get_full_name()} — {self.date} — {self.status}'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.check_in and self.check_out and self.status in [AttendanceStatus.PRESENT, AttendanceStatus.HALF_DAY]:
            import datetime
            t_in = self.check_in
            t_out = self.check_out
            dt_in = datetime.datetime.combine(self.date, t_in)
            dt_out = datetime.datetime.combine(self.date, t_out)
            if dt_out < dt_in:
                dt_out += datetime.timedelta(days=1)
            duration = dt_out - dt_in
            total_hours = duration.total_seconds() / 3600.0
            if total_hours > 8.0:
                overtime_hrs = total_hours - 8.0
                OvertimeRecord.objects.update_or_create(
                    employee=self.employee,
                    date=self.date,
                    defaults={
                        'check_in': t_in,
                        'check_out': t_out,
                        'regular_hours': 8.0,
                        'overtime_hours': round(overtime_hrs, 2),
                    }
                )
            else:
                OvertimeRecord.objects.filter(employee=self.employee, date=self.date).delete()
        else:
            # If check_in or check_out removed, delete overtime record
            OvertimeRecord.objects.filter(employee=self.employee, date=self.date).delete()


class LeaveApplication(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_applications')
    leave_type = models.CharField(max_length=10, choices=LeaveType.choices)
    from_date = models.DateField()
    to_date = models.DateField()
    is_half_day = models.BooleanField(default=False)
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=LeaveStatus.choices, default=LeaveStatus.PENDING)
    reviewed_by = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='reviewed_leaves'
    )
    review_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Leave Application'
        verbose_name_plural = 'Leave Applications'
        db_table = 'leave_applications'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.employee.user.get_full_name()} — {self.leave_type} ({self.from_date} to {self.to_date}) — {self.status}'

    @property
    def total_days(self):
        days = (self.to_date - self.from_date).days + 1
        return days * 0.5 if self.is_half_day else days


class PayrollStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    PAID = 'paid', 'Paid'

class PayrollSlip(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='payroll_slips')
    month = models.CharField(max_length=7, help_text='Format: YYYY-MM')
    base_salary = models.DecimalField(max_digits=12, decimal_places=2)
    salary_type = models.CharField(max_length=10, choices=SalaryType.choices)
    
    # Computed metrics
    present_days = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    paid_leave_days = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    absent_days = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    holiday_days = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    
    # Overtime & LOP
    overtime_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    overtime_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    lop_days = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    
    total_payable = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=10, choices=PayrollStatus.choices, default=PayrollStatus.PENDING)
    payment_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Payroll Slip'
        verbose_name_plural = 'Payroll Slips'
        db_table = 'payroll_slips'
        unique_together = ('employee', 'month')

    def __str__(self):
        return f"{self.employee.user.get_full_name()} - {self.month} ({self.status})"


class BranchOvertimeConfig(models.Model):
    RATE_TYPE_CHOICES = [
        ('flat', 'Flat Hourly Rate'),
        ('1.5x', '1.5x Base Hourly Rate'),
        ('2x', '2.0x Base Hourly Rate')
    ]
    branch = models.OneToOneField('branches.Branch', on_delete=models.CASCADE, related_name='overtime_config')
    rate_type = models.CharField(max_length=10, choices=RATE_TYPE_CHOICES, default='1.5x')
    flat_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text='Only used if rate_type is flat')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'branch_overtime_configs'

    def __str__(self):
        return f"{self.branch.name} Overtime Config ({self.get_rate_type_display()})"


class OvertimeRecord(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    ]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='overtime_records')
    date = models.DateField()
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    regular_hours = models.DecimalField(max_digits=5, decimal_places=2, default=8.00)
    overtime_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey('users.CustomUser', null=True, blank=True, on_delete=models.SET_NULL, related_name='approved_overtimes')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'overtime_records'
        unique_together = ('employee', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.employee.user.get_full_name()} — {self.date} — {self.overtime_hours} hrs ({self.status})"

