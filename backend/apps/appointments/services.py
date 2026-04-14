"""
apps/appointments/services.py — Business logic for appointment booking.
"""
from django.db import transaction
from django.utils import timezone

from .models import Appointment, TimeSlot


def get_available_slots(doctor_id: str, date: str):
    """
    Return TimeSlots for a doctor on a given date where:
    - is_available = True
    - The number of active bookings < max_appointments
    """
    slots = TimeSlot.objects.filter(
        doctor_id=doctor_id,
        date=date,
        is_available=True,
    ).prefetch_related("appointment_set")

    available = []
    for slot in slots:
        booked = slot.appointment_set.filter(
            status__in=["pending", "confirmed"]
        ).count()
        if booked < slot.max_appointments:
            available.append(slot)

    return available


@transaction.atomic
def book_appointment(validated_data: dict, branch, booked_by) -> Appointment:
    """
    Creates an appointment record.
    Marks the time slot as unavailable if max_appointments reached.
    """
    slot: TimeSlot | None = validated_data.get("time_slot")

    appointment = Appointment(
        branch=branch,
        booked_by=booked_by,
        **validated_data,
    )
    appointment.save()

    # If slot is linked, check and update availability
    if slot:
        booked_count = slot.appointment_set.filter(
            status__in=["pending", "confirmed"]
        ).count()
        if booked_count >= slot.max_appointments:
            slot.is_available = False
            slot.save(update_fields=["is_available"])

    return appointment


def cancel_appointment(appointment: Appointment, cancelled_by=None) -> Appointment:
    """
    Cancels an appointment and frees up the time slot if applicable.
    """
    appointment.status = Appointment.Status.CANCELLED
    appointment.is_active = False
    appointment.save(update_fields=["status", "is_active"])

    # Re-open slot if it was marked unavailable
    slot = appointment.time_slot
    if slot and not slot.is_available:
        slot.is_available = True
        slot.save(update_fields=["is_available"])

    return appointment
