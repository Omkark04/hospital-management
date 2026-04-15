from django.db import models
from django.utils import timezone


class GenderChoices(models.TextChoices):
    MALE = 'male', 'Male'
    FEMALE = 'female', 'Female'
    OTHER = 'other', 'Other'


class BloodGroupChoices(models.TextChoices):
    A_POS = 'A+', 'A+'
    A_NEG = 'A-', 'A-'
    B_POS = 'B+', 'B+'
    B_NEG = 'B-', 'B-'
    AB_POS = 'AB+', 'AB+'
    AB_NEG = 'AB-', 'AB-'
    O_POS = 'O+', 'O+'
    O_NEG = 'O-', 'O-'
    UNKNOWN = 'unknown', 'Unknown'


class AppointmentStatus(models.TextChoices):
    SCHEDULED = 'scheduled', 'Scheduled'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'
    RESCHEDULED = 'rescheduled', 'Rescheduled'
    NO_SHOW = 'no_show', 'No Show'


def generate_uhid(branch):
    """
    Generate UHID in format: BRANCHCODE-YEAR-SEQNO
    e.g., GEN-2026-00001
    """
    year = timezone.now().year
    prefix = f"{branch.code}-{year}-"
    last_patient = (
        Patient.objects.filter(uhid__startswith=prefix)
        .order_by('-uhid')
        .first()
    )
    if last_patient:
        try:
            last_seq = int(last_patient.uhid.split('-')[-1])
        except ValueError:
            last_seq = 0
    else:
        last_seq = 0
    return f"{prefix}{str(last_seq + 1).zfill(5)}"


class Patient(models.Model):
    uhid = models.CharField(max_length=30, unique=True, editable=False)
    branch = models.ForeignKey('branches.Branch', on_delete=models.PROTECT, related_name='patients')
    registered_by = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL,
        null=True, related_name='registered_patients'
    )

    # Personal info
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GenderChoices.choices, default=GenderChoices.OTHER)
    blood_group = models.CharField(max_length=10, choices=BloodGroupChoices.choices, default=BloodGroupChoices.UNKNOWN)
    address = models.TextField(blank=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=15, blank=True)

    # Medical history
    medical_history = models.TextField(blank=True, help_text='General past medical history')
    allergies = models.TextField(blank=True)
    chronic_conditions = models.TextField(blank=True)

    # Storage (URLs populated once Cloudinary/Dropbox enabled)
    photo_url = models.URLField(blank=True, help_text='Cloudinary URL')

    # Referral
    referred_by = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='referred_patients'
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Patient'
        verbose_name_plural = 'Patients'
        db_table = 'patients'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_full_name()} ({self.uhid})'

    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    def save(self, *args, **kwargs):
        if not self.uhid:
            self.uhid = generate_uhid(self.branch)
        super().save(*args, **kwargs)


class Appointment(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL,
        null=True, related_name='doctor_appointments',
        limit_choices_to={'role': 'doctor'}
    )
    branch = models.ForeignKey('branches.Branch', on_delete=models.PROTECT, related_name='appointments')
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField()
    status = models.CharField(max_length=15, choices=AppointmentStatus.choices, default=AppointmentStatus.SCHEDULED)
    reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    booked_by = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL,
        null=True, related_name='booked_appointments'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Appointment'
        verbose_name_plural = 'Appointments'
        db_table = 'appointments'
        ordering = ['scheduled_date', 'scheduled_time']

    def __str__(self):
        return f'{self.patient.get_full_name()} with Dr.{self.doctor.get_full_name() if self.doctor else "N/A"} on {self.scheduled_date}'


class VisitNote(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='visit_notes')
    doctor = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL,
        null=True, related_name='visit_notes',
        limit_choices_to={'role': 'doctor'}
    )
    appointment = models.OneToOneField(
        Appointment, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='visit_note'
    )
    chief_complaint = models.TextField(blank=True)
    diagnosis = models.TextField()
    treatment_plan = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    follow_up_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Visit Note'
        verbose_name_plural = 'Visit Notes'
        db_table = 'visit_notes'
        ordering = ['-created_at']

    def __str__(self):
        return f'Visit note for {self.patient.get_full_name()} on {self.created_at.date()}'


class LabReport(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='lab_reports')
    uploaded_by = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL,
        null=True, related_name='uploaded_reports'
    )
    report_name = models.CharField(max_length=200)
    report_date = models.DateField()
    # Dropbox URL — populated once Dropbox is enabled
    report_file_url = models.URLField(blank=True, help_text='Dropbox URL')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Lab Report'
        verbose_name_plural = 'Lab Reports'
        db_table = 'lab_reports'
        ordering = ['-report_date']

    def __str__(self):
        return f'{self.report_name} — {self.patient.get_full_name()}'
