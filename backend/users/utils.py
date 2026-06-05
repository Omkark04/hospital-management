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
    Sends a welcome email with credentials to a newly registered staff member.

    IMPORTANT: The actual SMTP call is dispatched on a **daemon thread** so it
    never blocks the HTTP request or the surrounding @transaction.atomic block.
    If the SMTP server is slow or unreachable the DB transaction still commits
    and the API returns a 201 to the client immediately.
    """
    if not user.email:
        return False

    from_name = getattr(settings, 'DEFAULT_FROM_NAME', 'Hospital Management System')
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@hospitalmanagement.com')

    # Build the login URL from settings (falls back to the production URL)
    login_url = getattr(settings, 'FRONTEND_URL', 'https://hospital-management-production-66d3.up.railway.app') + '/login'

    subject = f"Welcome to {from_name} \u2014 Your Account Credentials"
    message = (
        f"Hi {user.first_name},\n\n"
        f"Your account has been created successfully.\n"
        f"You can now log in to the system using the following credentials:\n\n"
        f"  Username : {user.username}\n"
        f"  Password : {raw_password}\n"
        f"  Role     : {user.role.capitalize()}\n\n"
        f"Login Link: {login_url}\n\n"
        f"Please change your password after your first login for security purposes.\n\n"
        f"Best regards,\n"
        f"Hospital Administration\n"
    )

    # Console log for debugging — always reliable regardless of SMTP status
    print("\n" + "\u2605" * 60)
    print("AUTOMATED CREDENTIALS NOTIFICATION EMAIL DISPATCH")
    print(f"RECIPIENT : {user.email} ({user.get_full_name()})")
    print(f"SUBJECT   : {subject}")
    print(message)
    print("\u2605" * 60 + "\n")

    # Fire-and-forget: run in a daemon thread so the DB transaction commits
    # and the HTTP response returns BEFORE any SMTP network I/O starts.
    t = threading.Thread(
        target=_send_email_in_background,
        args=(subject, message, from_email, [user.email]),
        daemon=True,
    )
    t.start()
    return True
