from django.db import models


class PaymentStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    PARTIAL = 'partial', 'Partial'
    PAID = 'paid', 'Paid'
    CANCELLED = 'cancelled', 'Cancelled'


class PaymentMethod(models.TextChoices):
    CASH = 'cash', 'Cash'
    CARD = 'card', 'Card'
    UPI = 'upi', 'UPI'
    INSURANCE = 'insurance', 'Insurance'
    UDHARI = 'udhari', 'Udhari (Credit)'
    OTHER = 'other', 'Other'


class Bill(models.Model):
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='bills')
    branch = models.ForeignKey('branches.Branch', on_delete=models.PROTECT, related_name='bills')
    created_by = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL,
        null=True, related_name='created_bills'
    )
    prescription = models.OneToOneField(
        'medicines.Prescription', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='bill'
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_status = models.CharField(max_length=15, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    payment_method = models.CharField(max_length=15, choices=PaymentMethod.choices, default=PaymentMethod.CASH)
    is_udhari = models.BooleanField(default=False)
    udhari_due_date = models.DateField(null=True, blank=True)
    udhari_reminder_sent = models.BooleanField(default=False)
    udhari_last_reminder_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    pdf_url = models.URLField(blank=True, null=True, help_text='Link to generated PDF on Dropbox')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Bill'
        verbose_name_plural = 'Bills'
        db_table = 'bills'
        ordering = ['-created_at']

    def __str__(self):
        return f'Bill #{self.id} — {self.patient.get_full_name()} — ₹{self.total_amount} ({self.payment_status})'

    @property
    def balance_due(self):
        return self.total_amount - self.discount - self.paid_amount

    @property
    def next_followup(self):
        # Find the earliest appointment for this patient scheduled after the bill's created_at date
        followup = self.patient.appointments.filter(
            scheduled_date__gt=self.created_at.date()
        ).order_by('scheduled_date', 'scheduled_time').first()
        return followup

    def save(self, *args, **kwargs):
        # Auto-update payment_status based on paid_amount
        net = self.total_amount - self.discount
        if self.paid_amount <= 0:
            self.payment_status = PaymentStatus.PENDING
        elif self.paid_amount < net:
            self.payment_status = PaymentStatus.PARTIAL
        else:
            self.payment_status = PaymentStatus.PAID
            self.is_udhari = False
        super().save(*args, **kwargs)


class BillItem(models.Model):
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=300)
    medicine = models.ForeignKey(
        'medicines.Medicine', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='bill_items'
    )
    product = models.ForeignKey(
        'products.Product', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='bill_items'
    )
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        verbose_name = 'Bill Item'
        verbose_name_plural = 'Bill Items'
        db_table = 'bill_items'

    @property
    def dosage(self):
        if self.medicine:
            if self.bill.prescription:
                rx_item = self.bill.prescription.items.filter(medicine=self.medicine).first()
                if rx_item and rx_item.dosage:
                    return rx_item.dosage
            from medicines.models import PrescriptionItem
            last_rx_item = PrescriptionItem.objects.filter(
                prescription__patient=self.bill.patient,
                medicine=self.medicine
            ).order_by('-prescription__created_at').first()
            if last_rx_item and last_rx_item.dosage:
                return last_rx_item.dosage
        return "—"

    def save(self, *args, **kwargs):
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.description} x{self.quantity} = ₹{self.total_price}'
