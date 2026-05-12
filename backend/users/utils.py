from django.core.mail import send_mail
from django.conf import settings

def send_registration_email(user, raw_password):
    """
    Sends an email to the newly registered staff member with their credentials.
    """
    if not user.email:
        return False
        
    from_name = getattr(settings, 'DEFAULT_FROM_NAME', 'Hospital Management System')
    subject = f"Welcome to {from_name} — Your Account Credentials"
    message = f"""
Hi {user.first_name},

Your account has been created successfully. 
You can now log in to the system using the following credentials:

Username: {user.username}
Password: {raw_password}
Role: {user.role.capitalize()}

Login Link: http://localhost:5173/login

Please change your password after your first login for security purposes.

Best regards,
Hospital Administration
"""
    
    # Print clearly to the console for absolute reliability during offline local testing
    print("\n" + "★"*60)
    print(f"AUTOMATED CREDENTIALS NOTIFICATION EMAIL DISPATCH")
    print(f"RECIPIENT: {user.email} ({user.get_full_name()})")
    print(f"SUBJECT: {subject}")
    print(message)
    print("★"*60 + "\n")

    try:
        send_mail(
            subject,
            message,
            getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@hospitalmanagement.com'),
            [user.email],
            fail_silently=True,
        )
        return True
    except Exception as e:
        print(f"Silent SMTP dispatch notification failed: {e}")
        return False
