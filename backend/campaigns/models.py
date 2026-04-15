from django.db import models


class CampaignStatus(models.TextChoices):
    PLANNED = 'planned', 'Planned'
    ACTIVE = 'active', 'Active'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'


class Campaign(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    branch = models.ForeignKey('branches.Branch', on_delete=models.CASCADE, related_name='campaigns')
    created_by = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL,
        null=True, related_name='created_campaigns',
        limit_choices_to={'role': 'owner'}
    )
    start_date = models.DateField()
    end_date = models.DateField()
    location = models.CharField(max_length=300, blank=True)
    objective = models.TextField(blank=True)
    status = models.CharField(max_length=15, choices=CampaignStatus.choices, default=CampaignStatus.PLANNED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Campaign'
        verbose_name_plural = 'Campaigns'
        db_table = 'campaigns'
        ordering = ['-start_date']

    def __str__(self):
        return f'{self.name} ({self.start_date} to {self.end_date}) — {self.status}'


class CampaignManagerAssignment(models.Model):
    """
    Overlay role: assigns an existing Doctor or Employee as campaign manager.
    The campaign tab appears on their dashboard when this record is active.
    """
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='manager_assignments')
    user = models.ForeignKey(
        'users.CustomUser', on_delete=models.CASCADE,
        related_name='campaign_assignments',
        limit_choices_to={'role__in': ['doctor', 'employee']}
    )
    assigned_by = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL,
        null=True, related_name='campaign_assignments_given'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Campaign Manager Assignment'
        db_table = 'campaign_manager_assignments'
        unique_together = ('campaign', 'user')

    def __str__(self):
        return f'{self.user.get_full_name()} -> {self.campaign.name}'


class CampaignPatient(models.Model):
    """Patients registered during a campaign (separate from main branch patients)."""
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='campaign_patients')
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='campaign_registrations')
    treatment_notes = models.TextField(blank=True)
    registered_by = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL,
        null=True, related_name='campaign_patient_registrations'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Campaign Patient'
        db_table = 'campaign_patients'
        unique_together = ('campaign', 'patient')

    def __str__(self):
        return f'{self.patient.get_full_name()} @ {self.campaign.name}'


class CampaignAttendance(models.Model):
    """Attendance of campaign team members on campaign days."""
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='team_attendance')
    user = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE, related_name='campaign_attendance')
    date = models.DateField()
    is_present = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Campaign Attendance'
        db_table = 'campaign_attendance'
        unique_together = ('campaign', 'user', 'date')

    def __str__(self):
        return f'{self.user.get_full_name()} — {self.campaign.name} — {self.date} — {"Present" if self.is_present else "Absent"}'


class CampaignSale(models.Model):
    """Product/medicine sales recorded during a campaign."""
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='sales')
    product = models.ForeignKey(
        'products.Product', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='campaign_sales'
    )
    medicine = models.ForeignKey(
        'medicines.Medicine', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='campaign_sales'
    )
    item_name = models.CharField(max_length=200, blank=True, help_text='Fallback if product/medicine not linked')
    quantity = models.PositiveIntegerField(default=1)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    sold_by = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL,
        null=True, related_name='campaign_sales'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Campaign Sale'
        db_table = 'campaign_sales'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.item_name or "Sale"} x{self.quantity} — ₹{self.amount} @ {self.campaign.name}'
