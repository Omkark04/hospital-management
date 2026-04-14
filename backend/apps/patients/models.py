"""
apps/patients/models.py
"""
from django.db import models
from apps.core.models import BaseModel


class Patient(BaseModel):
    uhid = models.CharField(max_length=30, unique=True, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(
        max_length=10,
        choices=[("male", "Male"), ("female", "Female"), ("other", "Other")],
    )
    blood_group = models.CharField(max_length=5, blank=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    user_account = models.OneToOneField(
        "authentication.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="patient_profile",
    )
    referred_by = models.ForeignKey(
        "referrals.Referral",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "patients_patient"

    def __str__(self):
        return f"{self.uhid} — {self.first_name} {self.last_name}"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"


class MedicalHistory(BaseModel):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="medical_history")
    condition = models.CharField(max_length=200)
    notes = models.TextField(blank=True)
    diagnosed_at = models.DateField(null=True, blank=True)
    is_chronic = models.BooleanField(default=False)

    class Meta:
        db_table = "patients_medicalhistory"
        verbose_name_plural = "Medical histories"
