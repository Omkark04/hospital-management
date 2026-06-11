from django.db import models
from django.conf import settings

class Therapy(models.Model):
    THERAPY_TYPES = [
        ('sujok', 'Sujok'),
        ('acupuncture', 'Acupuncture'),
        ('physiotherapy', 'Physiotherapy'),
        ('ayurvedic', 'Ayurvedic'),
        ('yoga', 'Yoga'),
        ('panchakarma', 'Panchakarma'),
        ('other', 'Other')
    ]

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    therapy_type = models.CharField(max_length=50, choices=THERAPY_TYPES)
    
    # Materials / medicines needed
    materials_needed = models.TextField(blank=True, help_text='Herbs, oils, equipment, etc.')
    medicines = models.ManyToManyField('medicines.Medicine', blank=True)
    products = models.ManyToManyField('products.Product', blank=True)

    # Duration
    total_duration_days = models.PositiveIntegerField(help_text='Total therapy program length in days')
    sessions_per_week = models.PositiveIntegerField(default=2)
    session_duration_minutes = models.PositiveIntegerField(default=60)

    # Branch access
    branches = models.ManyToManyField('branches.Branch', blank=True,
        help_text='Which branches offer this therapy')

    # Status
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Therapy'
        verbose_name_plural = 'Therapies'
        db_table = 'therapies'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_therapy_type_display()})"


class TherapyTimeline(models.Model):
    """Day-by-day or session-by-session schedule"""
    therapy = models.ForeignKey(Therapy, on_delete=models.CASCADE, related_name='timeline')
    day_number = models.PositiveIntegerField(help_text='Day 1, Day 7, Day 14...')
    session_label = models.CharField(max_length=100, help_text='e.g. "Initial Assessment"')
    practices = models.TextField(help_text='What to do on this day')
    medicines_on_day = models.ManyToManyField('medicines.Medicine', blank=True)
    products_on_day = models.ManyToManyField('products.Product', blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'therapy_timelines'
        ordering = ['day_number']

    def __str__(self):
        return f"{self.therapy.name} - Day {self.day_number}: {self.session_label}"


class PatientTherapy(models.Model):
    """Therapy assigned to a specific patient"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('paused', 'Paused')
    ]

    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='therapies')
    therapy = models.ForeignKey(Therapy, on_delete=models.PROTECT)
    branch = models.ForeignKey('branches.Branch', on_delete=models.PROTECT)
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    start_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'patient_therapies'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.therapy.name} assigned to {self.patient.get_full_name()} ({self.start_date})"
