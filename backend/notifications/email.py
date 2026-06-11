"""
Email notification service for HMS with Mailercloud HTTP fallback.

All sends are logged to the Notification model. Delivery uses Django's
configured EMAIL_BACKEND first, with automatic fallback to Mailercloud REST API.
"""

import threading
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.defaultfilters import striptags
from django.template.loader import render_to_string
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
    If the default email backend raises an exception, automatically retry
    via Mailercloud REST API if MAILERCLOUD_API_KEY is available.
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

    plain_message = striptags(html_content) or html_content

    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', '')
        # Try sending using Django configured backend
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
            notification.error_message = "Sent via primary Django email backend."
        else:
            raise Exception("Primary Django email backend did not accept the message (returned 0 sent).")

    except Exception as exc:
        notification.status = NotificationStatus.FAILED
        notification.error_message = f"Django email backend error: {str(exc)}"

    notification.save()
    return notification


def send_email_in_background(to_email, subject, html_content, to_name='', notification_type='general', recipient_user=None):
    """Internal: fire-and-forget daemon thread dispatch to prevent HTTP blocking."""
    t = threading.Thread(
        target=send_email,
        args=(to_email, subject, html_content, to_name, notification_type, recipient_user),
        daemon=True
    )
    t.start()


def get_email_context():
    """Generates standard email rendering context."""
    from_name = getattr(settings, 'DEFAULT_FROM_NAME', 'Hospital Management System')
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    return {
        'hospital_name': from_name,
        'login_url': f"{frontend_url}/login",
        'portal_url': frontend_url,
        'booking_url': f"{frontend_url}/dashboard/appointments",
        'dashboard_url': f"{frontend_url}/dashboard",
        'current_year': timezone.now().year,
    }


def send_employee_welcome(user, raw_password):
    """Triggers employee credentials and welcome email."""
    if not user.email:
        return None
    ctx = get_email_context()
    ctx.update({
        'first_name': user.first_name,
        'username': user.username,
        'password': raw_password,
        'role': user.role,
    })
    html_content = render_to_string('emails/employee_welcome.html', ctx)
    subject = f"Welcome to the Team — Your Account Credentials at {ctx['hospital_name']}"
    
    send_email_in_background(
        to_email=user.email,
        subject=subject,
        html_content=html_content,
        to_name=user.get_full_name(),
        notification_type='general',
        recipient_user=user
    )


def send_patient_welcome(patient):
    """Triggers patient registration and UHID welcome email."""
    email = getattr(patient, 'email', '')
    first_name = getattr(patient, 'first_name', '')
    full_name = getattr(patient, 'get_full_name', lambda: '')()
    uhid = getattr(patient, 'uhid', 'N/A')
    branch_name = patient.branch.name if getattr(patient, 'branch', None) else 'Main Branch'
    user_obj = getattr(patient, 'user', None)

    if not email:
        return None

    ctx = get_email_context()
    ctx.update({
        'first_name': first_name,
        'uhid': uhid,
        'branch_name': branch_name,
    })
    html_content = render_to_string('emails/patient_welcome.html', ctx)
    subject = f"Welcome to {ctx['hospital_name']}!"

    send_email_in_background(
        to_email=email,
        subject=subject,
        html_content=html_content,
        to_name=full_name,
        notification_type='general',
        recipient_user=user_obj
    )


def send_missed_appointment_email(appointment):
    """Triggers a notification to patients who missed their scheduled appointments."""
    patient = appointment.patient
    doctor = appointment.doctor
    branch = appointment.branch
    
    if not patient or not patient.email:
        return None
        
    ctx = get_email_context()
    ctx.update({
        'first_name': patient.first_name,
        'doctor_name': doctor.get_full_name() if doctor else 'Doctor',
        'date': appointment.scheduled_date.strftime('%d-%b-%Y') if appointment.scheduled_date else 'Today',
        'branch_name': branch.name if branch else 'Clinic',
        'branch_phone': getattr(branch, 'phone', 'the clinic'),
    })
    html_content = render_to_string('emails/missed_appointment.html', ctx)
    subject = f"We Missed You Today - {ctx['hospital_name']}"

    send_email_in_background(
        to_email=patient.email,
        subject=subject,
        html_content=html_content,
        to_name=patient.get_full_name(),
        notification_type='appointment_reminder',
        recipient_user=getattr(patient, 'user', None)
    )


def send_leave_application_to_doctor(leave):
    """Alerts branch doctors of new staff leave submissions."""
    employee = leave.employee
    branch = employee.branch if employee else None
    
    from users.models import CustomUser, UserRole
    doctors = CustomUser.objects.filter(branch=branch, role=UserRole.DOCTOR, is_active=True)
    if not doctors.exists():
        doctors = CustomUser.objects.filter(role=UserRole.OWNER, is_active=True)
        
    recipient_emails = [d.email for d in doctors if d.email]
    if not recipient_emails:
        return None
        
    ctx = get_email_context()
    ctx.update({
        'employee_name': employee.user.get_full_name() if employee and employee.user else 'Staff member',
        'leave_type': leave.leave_type,
        'from_date': leave.from_date.strftime('%d-%b-%Y') if leave.from_date else '',
        'to_date': leave.to_date.strftime('%d-%b-%Y') if leave.to_date else '',
        'reason': leave.reason,
    })
    
    for doc in doctors:
        if not doc.email:
            continue
        personal_ctx = ctx.copy()
        personal_ctx['doctor_name'] = doc.first_name
        html_content = render_to_string('emails/leave_applied.html', personal_ctx)
        subject = f"New Leave Application Request - {personal_ctx['employee_name']}"
        
        send_email_in_background(
            to_email=doc.email,
            subject=subject,
            html_content=html_content,
            to_name=doc.get_full_name(),
            notification_type='general',
            recipient_user=doc
        )


def send_leave_decision_to_employee(leave):
    """Alerts staff members when leave is approved or rejected."""
    employee = leave.employee
    if not employee or not employee.user or not employee.user.email:
        return None
        
    status_color_header = "#10b981" if leave.status == 'approved' else "#ef4444"
    status_color_bg = "#ecfdf5" if leave.status == 'approved' else "#fef2f2"
    status_color_border = "#a7f3d0" if leave.status == 'approved' else "#fecaca"
    status_color_text = "#047857" if leave.status == 'approved' else "#b91c1c"
    btn_color = "#10b981" if leave.status == 'approved' else "#ef4444"
    
    ctx = get_email_context()
    ctx.update({
        'employee_name': employee.user.first_name,
        'status': leave.status,
        'from_date': leave.from_date.strftime('%d-%b-%Y') if leave.from_date else '',
        'to_date': leave.to_date.strftime('%d-%b-%Y') if leave.to_date else '',
        'reviewer_name': leave.reviewed_by.get_full_name() if leave.reviewed_by else 'Administration',
        'review_notes': leave.review_notes,
        'status_color_header': status_color_header,
        'status_color_bg': status_color_bg,
        'status_color_border': status_color_border,
        'status_color_text': status_color_text,
        'btn_color': btn_color,
    })
    html_content = render_to_string('emails/leave_decision.html', ctx)
    subject = f"Leave Request {leave.status.upper()} - {ctx['hospital_name']}"

    send_email_in_background(
        to_email=employee.user.email,
        subject=subject,
        html_content=html_content,
        to_name=employee.user.get_full_name(),
        notification_type='general',
        recipient_user=employee.user
    )


def send_udhari_reminder_email(bill, whatsapp_link):
    """Triggers credit reminder emails to patients."""
    patient = bill.patient
    branch = bill.branch
    
    if not patient or not patient.email:
        return None
        
    ctx = get_email_context()
    ctx.update({
        'patient_name': patient.get_full_name(),
        'bill_id': bill.id,
        'balance_due': f"{bill.balance_due:.2f}",
        'due_date': bill.udhari_due_date.strftime('%d-%b-%Y') if bill.udhari_due_date else 'N/A',
        'whatsapp_link': whatsapp_link,
        'branch_name': branch.name if branch else 'Clinic',
        'branch_phone': getattr(branch, 'phone', 'clinic'),
    })
    html_content = render_to_string('emails/udhari_reminder.html', ctx)
    subject = f"Payment Reminder: Outstanding Balance - {branch.name if branch else ctx['hospital_name']}"

    send_email_in_background(
        to_email=patient.email,
        subject=subject,
        html_content=html_content,
        to_name=patient.get_full_name(),
        notification_type='bill_generated',
        recipient_user=getattr(patient, 'user', None)
    )


def send_appointment_booking_confirmation(appointment):
    """Triggers appointment confirmation email to patients."""
    patient = appointment.patient
    doctor = appointment.doctor
    branch = appointment.branch
    
    if not patient or not patient.email:
        return None
        
    ctx = get_email_context()
    ctx.update({
        'patient_name': patient.get_full_name(),
        'uhid': patient.uhid,
        'date': appointment.scheduled_date.strftime('%d-%b-%Y') if appointment.scheduled_date else '',
        'time': appointment.scheduled_time,
        'doctor_name': doctor.get_full_name() if doctor else 'Doctor',
        'branch_name': branch.name if branch else 'Clinic',
        'branch_phone': getattr(branch, 'phone', 'clinic'),
    })
    html_content = render_to_string('emails/appointment_confirmation.html', ctx)
    subject = f"Appointment Confirmed - {ctx['hospital_name']}"

    send_email_in_background(
        to_email=patient.email,
        subject=subject,
        html_content=html_content,
        to_name=patient.get_full_name(),
        notification_type='appointment_reminder',
        recipient_user=getattr(patient, 'user', None)
    )


# --- Backward compatibility placeholders ---

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
