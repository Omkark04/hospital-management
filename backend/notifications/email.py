"""
Email notification service for HMS.

All sends are logged to the Notification model. Delivery uses Django's
configured EMAIL_BACKEND, so SMTP, SendGrid SMTP, and console development
backends all flow through the same code.
"""

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.defaultfilters import striptags
from django.utils import timezone


def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    to_name: str = '',
    notification_type: str = 'general',
    recipient_user=None,
):
    """
    Send an email using Django's configured email backend and log it.

    Args:
        to_email: Recipient email address.
        subject: Email subject line.
        html_content: HTML body of the email.
        to_name: Display name of the recipient.
        notification_type: One of NotificationType choices.
        recipient_user: CustomUser instance (optional).

    Returns:
        Notification instance with sent/failed status.
    """
    from .models import Notification, NotificationStatus

    notification = Notification.objects.create(
        recipient=recipient_user,
        recipient_email=to_email,
        recipient_name=to_name,
        notification_type=notification_type,
        subject=subject,
        message=html_content,
        status=NotificationStatus.PENDING,
    )

    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', '')
        plain_message = striptags(html_content) or html_content

        email = EmailMultiAlternatives(
            subject=subject,
            body=plain_message,
            from_email=from_email,
            to=[to_email],
        )
        email.attach_alternative(html_content, 'text/html')

        sent_count = email.send(fail_silently=False)
        if sent_count:
            notification.status = NotificationStatus.SENT
            notification.sent_at = timezone.now()
        else:
            notification.status = NotificationStatus.FAILED
            notification.error_message = 'Email backend did not accept the message.'

    except Exception as exc:
        notification.status = NotificationStatus.FAILED
        notification.error_message = str(exc)

    notification.save()
    return notification


def send_appointment_reminder(
    patient_name: str,
    patient_email: str,
    appointment_date: str,
    appointment_time: str,
    doctor_name: str,
):
    subject = f'Appointment Reminder - {appointment_date}'
    html_content = f"""
    <h2>Appointment Reminder</h2>
    <p>Dear {patient_name},</p>
    <p>This is a reminder for your appointment:</p>
    <ul>
        <li><strong>Date:</strong> {appointment_date}</li>
        <li><strong>Time:</strong> {appointment_time}</li>
        <li><strong>Doctor:</strong> {doctor_name}</li>
    </ul>
    <p>Please arrive 10 minutes early.<br>Thank you.</p>
    """
    return send_email(patient_email, subject, html_content, patient_name, 'appointment_reminder')


def send_bill_notification(
    patient_name: str,
    patient_email: str,
    bill_id: int,
    amount: float,
    balance_due: float,
):
    subject = f'Bill #{bill_id} - Hospital Management System'
    html_content = f"""
    <h2>Bill Generated</h2>
    <p>Dear {patient_name},</p>
    <p>Your bill has been generated:</p>
    <ul>
        <li><strong>Bill ID:</strong> #{bill_id}</li>
        <li><strong>Total Amount:</strong> Rs. {amount}</li>
        <li><strong>Balance Due:</strong> Rs. {balance_due}</li>
    </ul>
    <p>Please contact the reception for payment.<br>Thank you.</p>
    """
    return send_email(patient_email, subject, html_content, patient_name, 'bill_generated')


def send_prescription_ready(patient_name: str, patient_email: str, doctor_name: str):
    subject = 'Your Prescription is Ready'
    html_content = f"""
    <h2>Prescription Ready</h2>
    <p>Dear {patient_name},</p>
    <p>Your prescription from <strong>Dr. {doctor_name}</strong> is ready.</p>
    <p>Please log in to your patient dashboard to view it, or collect it from the reception.</p>
    <p>Thank you for choosing our hospital.</p>
    """
    return send_email(patient_email, subject, html_content, patient_name, 'prescription_ready')


def send_referral_confirmation(referrer_name: str, referrer_email: str, patient_name: str):
    subject = 'Referral Submitted Successfully'
    html_content = f"""
    <h2>Referral Confirmation</h2>
    <p>Dear {referrer_name},</p>
    <p>Thank you for referring <strong>{patient_name}</strong> to us.</p>
    <p>Our team will contact them shortly.</p>
    <p>We appreciate your trust in our services.</p>
    """
    return send_email(referrer_email, subject, html_content, referrer_name, 'referral_update')
