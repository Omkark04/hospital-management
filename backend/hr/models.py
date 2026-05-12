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

