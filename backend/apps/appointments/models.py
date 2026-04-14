"""
apps/appointments/models.py
"""
from django.db import models
from apps.core.models import BaseModel


class TimeSlot(BaseModel):
    doctor = models.ForeignKey(
        "authentication.User",
        on_delete=models.CASCADE,
        related_name="time_slots",
        limit_choices_to={"role": "doctor"},
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    max_appointments = models.PositiveSmallIntegerField(default=1)

    class Meta:
        db_table = "appointments_timeslot"
        unique_together = ["doctor", "date", "start_time"]

    def __str__(self):
        return f"Dr.{self.doctor.get_full_name()} — {self.date} {self.start_time}"


class Appointment(BaseModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"
        NO_SHOW = "no_show", "No Show"

    patient = models.ForeignKey("patients.Patient", on_delete=models.CASCADE, related_name="appointments")
    doctor = models.ForeignKey(
        "authentication.User",
        on_delete=models.CASCADE,
        related_name="doctor_appointments",
        limit_choices_to={"role": "doctor"},
    )
    time_slot = models.ForeignKey(TimeSlot, on_delete=models.SET_NULL, null=True, blank=True)
    appointment_date = models.DateField()
    appointment_time = models.TimeField()
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    notes = models.TextField(blank=True)
    booked_by = models.ForeignKey(
        "authentication.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="booked_appointments",
    )

    class Meta:
        db_table = "appointments_appointment"
        ordering = ["appointment_date", "appointment_time"]

    def __str__(self):
        return f"{self.patient} → Dr.{self.doctor.get_full_name()} on {self.appointment_date}"
