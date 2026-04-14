"""
apps/hr/models.py
"""
from django.db import models
from apps.core.models import BaseModel


class Employee(BaseModel):
    user = models.OneToOneField(
        "authentication.User",
        on_delete=models.CASCADE,
        related_name="employee_profile",
    )
    employee_id = models.CharField(max_length=20, unique=True)
    department = models.CharField(max_length=100)
    designation = models.CharField(max_length=100)
    date_of_joining = models.DateField()
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    bank_account = models.CharField(max_length=30, blank=True)
    ifsc_code = models.CharField(max_length=15, blank=True)
    documents_url = models.URLField(blank=True, help_text="Dropbox shared folder link")

    class Meta:
        db_table = "hr_employee"

    def __str__(self):
        return f"{self.employee_id} — {self.user.get_full_name()}"


class Attendance(BaseModel):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="attendances")
    date = models.DateField()
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    is_present = models.BooleanField(default=True)
    is_leave = models.BooleanField(default=False)
    notes = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = "hr_attendance"
        unique_together = ["employee", "date"]


class LeaveRequest(BaseModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    class LeaveType(models.TextChoices):
        SICK = "sick", "Sick Leave"
        CASUAL = "casual", "Casual Leave"
        EARNED = "earned", "Earned Leave"
        UNPAID = "unpaid", "Unpaid Leave"

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="leave_requests")
    leave_type = models.CharField(max_length=20, choices=LeaveType.choices)
    from_date = models.DateField()
    to_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    reviewed_by = models.ForeignKey(
        "authentication.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_leaves",
    )
    review_note = models.TextField(blank=True)

    class Meta:
        db_table = "hr_leaverequest"
