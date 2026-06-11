import datetime
import urllib.parse
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from billing.models import Bill

class Command(BaseCommand):
    help = 'Send email reminders for Udhari (credit) bills due tomorrow or today'

    def handle(self, *args, **options):
        today = timezone.now().date()
        tomorrow = today + datetime.timedelta(days=1)
        
        # Fetch bills where is_udhari=True and due date is today or tomorrow
        # and we haven't sent a reminder today
        bills = Bill.objects.filter(
            is_udhari=True,
            udhari_due_date__in=[today, tomorrow]
        ).exclude(
            udhari_last_reminder_date=today
        ).select_related('patient', 'branch')
        
        self.stdout.write(f"Found {bills.count()} bills requiring Udhari reminders.")
        
        sent_count = 0
        for bill in bills:
            patient = bill.patient
            branch = bill.branch
            balance = bill.balance_due
            
            if balance <= 0:
                # Safely resolve if already paid
                bill.is_udhari = False
                bill.save()
                continue
                
            due_str = bill.udhari_due_date.strftime('%d-%b-%Y')
            is_due_today = (bill.udhari_due_date == today)
            timing_label = "TODAY" if is_due_today else "TOMORROW"
            
            # WhatsApp link
            raw_phone = patient.phone or ""
            phone = "".join(c for c in raw_phone if c.isdigit())
            clean_phone = f"91{phone}" if len(phone) == 10 else phone
            wa_text = f"Hi {patient.get_full_name()}, this is a friendly reminder that an outstanding payment of Rs. {balance} is due {timing_label.lower()} ({due_str}) for your bill #{bill.id} at {branch.name}. Thank you."
            wa_link = f"https://wa.me/{clean_phone}?text={urllib.parse.quote(wa_text)}"
            
            subject = f"Friendly Reminder: Pending Payment due {timing_label} - {branch.name}"
            
            message = (
                f"Dear {patient.get_full_name()},\n\n"
                f"This is a friendly reminder regarding your outstanding bill #{bill.id} at {branch.name}.\n\n"
                f"Details of the payment:\n"
                f" - Pending Amount: Rs. {balance:.2f}\n"
                f" - Due Date: {due_str} ({timing_label.lower()})\n\n"
                f"You can quickly connect with us on WhatsApp or pay at the clinic:\n"
                f"WhatsApp Quick Contact: {wa_link}\n\n"
                f"If you have already settled this payment, please disregard this message.\n\n"
                f"Best regards,\n"
                f"{branch.name} Administration"
            )
            
            # Print console notification for debugging
            self.stdout.write(f"\n==================================================")
            self.stdout.write(f"SENDING UDHARI REMINDER ({timing_label})")
            self.stdout.write(f"Patient  : {patient.get_full_name()} ({patient.phone})")
            self.stdout.write(f"Email    : {patient.email}")
            self.stdout.write(f"Balance  : Rs. {balance}")
            self.stdout.write(f"WA Link  : {wa_link}")
            self.stdout.write(f"==================================================")
            
            # Send email
            if patient.email:
                try:
                    from notifications.email import send_udhari_reminder_email
                    send_udhari_reminder_email(bill, wa_link)
                    self.stdout.write(self.style.SUCCESS(f"Email sent successfully to {patient.email}"))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Failed to send email to {patient.email}: {e}"))
            
            # Update reminder fields
            bill.udhari_last_reminder_date = today
            if is_due_today:
                bill.udhari_reminder_sent = True
            bill.save()
            sent_count += 1
            
        self.stdout.write(self.style.SUCCESS(f"Completed sending {sent_count} reminders."))
