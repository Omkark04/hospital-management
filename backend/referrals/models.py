from django.db import models


class ReferralStatus(models.TextChoices):
    NEW = 'new', 'New'
    CONTACTED = 'contacted', 'Contacted'
    REGISTERED = 'registered', 'Registered as Patient'
    CLOSED = 'closed', 'Closed'


class Referral(models.Model):
    # The person who referred (optional — authenticated user)
    referred_by_user = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='referrals_made'
    )
    # Free-text referrer info (for public/unauthenticated submissions)
    referred_by_name = models.CharField(max_length=100, blank=True)
    referred_by_phone = models.CharField(max_length=15, blank=True)

    # Referred patient details
    patient_name = models.CharField(max_length=100)
    patient_phone = models.CharField(max_length=15)
    patient_email = models.EmailField(blank=True)
    patient_address = models.TextField(blank=True)
    reason = models.TextField(blank=True, help_text='Why are you referring this patient?')

    # Which branch to refer to
    branch = models.ForeignKey(
        'branches.Branch', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='referrals'
    )

    status = models.CharField(max_length=15, choices=ReferralStatus.choices, default=ReferralStatus.NEW)

    # Once the referred patient is registered, link them
    registered_patient = models.ForeignKey(
        'patients.Patient', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='referral'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Referral'
        verbose_name_plural = 'Referrals'
        db_table = 'referrals'
        ordering = ['-created_at']

    def __str__(self):
        return f'Referral: {self.patient_name} ({self.patient_phone}) — {self.status}'
