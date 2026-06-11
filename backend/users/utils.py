import threading
from django.conf import settings


def _send_email_in_background(subject, message, from_email, recipient_list):
    """Internal: send email in a daemon thread so it never blocks the HTTP worker."""
    try:
        from django.core.mail import send_mail
        send_mail(
            subject,
            message,
            from_email,
            recipient_list,
            fail_silently=True,
        )
    except Exception as e:
        # Swallow ALL exceptions — this runs in a background thread after the
        # HTTP response has already been sent. Logging here is best-effort only.
        print(f"[Email background thread] SMTP error: {e}")


def send_registration_email(user, raw_password):
    """
    Sends a welcome email with credentials to a newly registered staff member/employee.
    Delegates to notifications.email.send_employee_welcome.
    """
    from notifications.email import send_employee_welcome
    try:
        send_employee_welcome(user, raw_password)
        return True
    except Exception as e:
        print(f"[Email delegation] Error: {e}")
        return False
