from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
import datetime

from users.models import CustomUser
from .models import Employee, LeaveApplication, LeaveStatus, Attendance, AttendanceStatus

@receiver(post_save, sender=Employee)
def sync_user_branch(sender, instance, created, **kwargs):
    """Sync the user's branch when the employee's branch changes."""
    user = instance.user
    if user.branch != instance.branch:
        user.branch = instance.branch
        user.save()

@receiver(post_save, sender=LeaveApplication)
def create_attendance_for_leave(sender, instance, created, **kwargs):
    """When a leave is approved, mark the corresponding attendance records."""
    if instance.status == LeaveStatus.APPROVED:
        current_date = instance.from_date
        while current_date <= instance.to_date:
            # Decide the status
            status = AttendanceStatus.HALF_DAY if instance.is_half_day else AttendanceStatus.ON_LEAVE
            
            # Use get_or_create to update or create
            attendance, att_created = Attendance.objects.get_or_create(
                employee=instance.employee,
                date=current_date,
                defaults={
                    'status': status,
                    'is_flagged': False,
                    'notes': f"Auto-marked via Leave App #{instance.id}"
                }
            )
            
            # If it exists but was absent, change it to leave
            if not att_created and attendance.status == AttendanceStatus.ABSENT:
                attendance.status = status
                attendance.notes = f"Auto-marked via Leave App #{instance.id}"
                attendance.save()
            
            current_date += datetime.timedelta(days=1)
