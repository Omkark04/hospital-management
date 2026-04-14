"""
apps/patients/signals.py
Currently UHID is generated in services.register_patient() during atomic create.
This file is kept for future signal needs (e.g., sending welcome SMS on patient registration).
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Patient


@receiver(post_save, sender=Patient)
def on_patient_created(sender, instance, created, **kwargs):
    """
    Placeholder: trigger notifications or side-effects when a patient is created.
    e.g., send welcome SMS, create portal account link, etc.
    """
    if created:
        pass  # TODO: integrate notification service
