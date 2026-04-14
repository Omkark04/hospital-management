"""
apps/notifications/models.py
"""
from django.db import models
from apps.core.models import BaseModel


class Notification(BaseModel):
    class Type(models.TextChoices):
        APPOINTMENT = "appointment", "Appointment"
        BILLING = "billing", "Billing"
        HR = "hr", "HR"
        CAMPAIGN = "campaign", "Campaign"
        GENERAL = "general", "General"

    recipient = models.ForeignKey(
        "authentication.User",
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=Type.choices, default=Type.GENERAL)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    action_url = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = "notifications_notification"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} → {self.recipient.email}"
