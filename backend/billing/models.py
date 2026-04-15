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
    notes = models.TextField(blank=True)
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

    def save(self, *args, **kwargs):
        # Auto-update payment_status based on paid_amount
        net = self.total_amount - self.discount
        if self.paid_amount <= 0:
            self.payment_status = PaymentStatus.PENDING
        elif self.paid_amount < net:
            self.payment_status = PaymentStatus.PARTIAL
        else:
            self.payment_status = PaymentStatus.PAID
        super().save(*args, **kwargs)


class BillItem(models.Model):
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=300)
    medicine = models.ForeignKey(
        'medicines.Medicine', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='bill_items'
    )
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        verbose_name = 'Bill Item'
        verbose_name_plural = 'Bill Items'
        db_table = 'bill_items'

    def save(self, *args, **kwargs):
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.description} x{self.quantity} = ₹{self.total_price}'
