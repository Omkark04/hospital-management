from django.db import models


class NotificationType(models.TextChoices):
    APPOINTMENT_REMINDER = 'appointment_reminder', 'Appointment Reminder'
    BILL_GENERATED = 'bill_generated', 'Bill Generated'
    PAYMENT_RECEIVED = 'payment_received', 'Payment Received'
    PRESCRIPTION_READY = 'prescription_ready', 'Prescription Ready'
    REFERRAL_UPDATE = 'referral_update', 'Referral Update'
    GENERAL = 'general', 'General'


class NotificationStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    SENT = 'sent', 'Sent'
    FAILED = 'failed', 'Failed'


class Notification(models.Model):
    recipient = models.ForeignKey(
        'users.CustomUser', on_delete=models.CASCADE,
        related_name='notifications', null=True, blank=True
    )
    # For non-user recipients (e.g., public referral submitter — email only)
    recipient_email = models.EmailField(blank=True)
    recipient_name = models.CharField(max_length=100, blank=True)

    notification_type = models.CharField(
        max_length=30, choices=NotificationType.choices,
        default=NotificationType.GENERAL
    )
    subject = models.CharField(max_length=300)
    message = models.TextField()
    status = models.CharField(max_length=10, choices=NotificationStatus.choices, default=NotificationStatus.PENDING)
    error_message = models.TextField(blank=True)  # Store SendGrid error if failed

    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.notification_type}] to {self.recipient_email or (self.recipient.email if self.recipient else "N/A")} — {self.status}'
