"""
apps/appointments/admin.py
"""
from django.contrib import admin
from .models import Appointment, TimeSlot


@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ["doctor", "date", "start_time", "end_time", "is_available", "max_appointments", "branch"]
    list_filter = ["date", "is_available", "branch", "doctor"]
    search_fields = ["doctor__first_name", "doctor__last_name"]
    ordering = ["date", "start_time"]


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = [
        "get_patient_uhid", "get_patient_name", "get_doctor_name",
        "appointment_date", "appointment_time", "status", "branch",
    ]
    list_filter = ["status", "appointment_date", "branch", "doctor"]
    search_fields = [
        "patient__uhid", "patient__first_name", "patient__last_name",
        "doctor__first_name", "doctor__last_name",
    ]
    readonly_fields = ["booked_by", "created_at", "updated_at"]
    ordering = ["appointment_date", "appointment_time"]

    def get_patient_uhid(self, obj):
        return obj.patient.uhid
    get_patient_uhid.short_description = "UHID"

    def get_patient_name(self, obj):
        return obj.patient.get_full_name()
    get_patient_name.short_description = "Patient"

    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.get_full_name()}"
    get_doctor_name.short_description = "Doctor"
