from django.db import models


class MedicineCategory(models.TextChoices):
    TABLET = 'tablet', 'Tablet'
    CAPSULE = 'capsule', 'Capsule'
    SYRUP = 'syrup', 'Syrup'
    INJECTION = 'injection', 'Injection'
    CREAM = 'cream', 'Cream'
    DROPS = 'drops', 'Drops'
    AYURVEDIC = 'ayurvedic', 'Ayurvedic'
    OTHER = 'other', 'Other'


class Medicine(models.Model):
    branch = models.ForeignKey('branches.Branch', on_delete=models.CASCADE, related_name='medicines')
    name = models.CharField(max_length=200)
    generic_name = models.CharField(max_length=200, blank=True)
    manufacturer = models.CharField(max_length=200, blank=True)
    category = models.CharField(max_length=20, choices=MedicineCategory.choices, default=MedicineCategory.OTHER)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.PositiveIntegerField(default=0)
    unit = models.CharField(max_length=50, blank=True, help_text='e.g., mg, ml, strip')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Medicine'
        verbose_name_plural = 'Medicines'
        db_table = 'medicines'
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.category}) — ₹{self.price}'


class Prescription(models.Model):
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='prescriptions')
    doctor = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL, null=True,
        related_name='prescriptions', limit_choices_to={'role': 'doctor'}
    )
    appointment = models.OneToOneField(
        'patients.Appointment', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='prescription'
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Prescription'
        verbose_name_plural = 'Prescriptions'
        db_table = 'prescriptions'
        ordering = ['-created_at']

    def __str__(self):
        return f'Rx for {self.patient.get_full_name()} by Dr.{self.doctor.get_full_name() if self.doctor else "N/A"}'


class PrescriptionItem(models.Model):
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='items')
    medicine = models.ForeignKey('medicines.Medicine', on_delete=models.PROTECT, related_name='prescription_items', null=True, blank=True)
    product = models.ForeignKey('products.Product', on_delete=models.PROTECT, related_name='prescription_items', null=True, blank=True)
    dosage = models.CharField(max_length=100, help_text='e.g., 1-0-1, 500mg')
    duration = models.CharField(max_length=100, help_text='e.g., 5 days, 1 week')
    instructions = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        verbose_name = 'Prescription Item'
        verbose_name_plural = 'Prescription Items'
        db_table = 'prescription_items'

    def __str__(self):
        return f'{self.medicine.name} — {self.dosage} for {self.duration}'
