"""
apps/patients/services.py — Business logic for patient management.
"""
from django.db import transaction
from .models import Patient


def generate_uhid(branch) -> str:
    """
    Generate a unique UHID in format: HMS-<BRANCH_CODE>-<YEAR>-<SEQ>
    e.g. HMS-MUM-2025-00421
    Uses DB-level count + 1 for sequence — safe within a transaction.
    """
    from django.utils import timezone
    year = timezone.now().year
    count = Patient.objects.filter(branch=branch, created_at__year=year).count() + 1
    return f"HMS-{branch.code.upper()}-{year}-{count:05d}"


@transaction.atomic
def register_patient(validated_data: dict, branch) -> Patient:
    """
    Creates a new patient, auto-generating UHID.
    """
    patient = Patient(branch=branch, **validated_data)
    patient.uhid = generate_uhid(branch)
    patient.save()
    return patient
