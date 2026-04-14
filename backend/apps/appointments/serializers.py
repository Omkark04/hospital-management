"""
apps/appointments/serializers.py
"""
from rest_framework import serializers
from .models import Appointment, TimeSlot


class TimeSlotSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source="doctor.get_full_name", read_only=True)
    booked_count = serializers.SerializerMethodField()

    class Meta:
        model = TimeSlot
        fields = [
            "id", "doctor", "doctor_name",
            "date", "start_time", "end_time",
            "is_available", "max_appointments", "booked_count",
            "branch", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_booked_count(self, obj):
        return obj.appointment_set.filter(
            status__in=["pending", "confirmed"]
        ).count()


class AppointmentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    patient_name = serializers.CharField(source="patient.get_full_name", read_only=True)
    patient_uhid = serializers.CharField(source="patient.uhid", read_only=True)
    doctor_name = serializers.CharField(source="doctor.get_full_name", read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "id", "patient_name", "patient_uhid", "doctor_name",
            "appointment_date", "appointment_time", "status", "reason",
        ]


class AppointmentSerializer(serializers.ModelSerializer):
    """Full appointment detail serializer."""
    patient_name = serializers.CharField(source="patient.get_full_name", read_only=True)
    patient_uhid = serializers.CharField(source="patient.uhid", read_only=True)
    doctor_name = serializers.CharField(source="doctor.get_full_name", read_only=True)
    booked_by_name = serializers.CharField(source="booked_by.get_full_name", read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "id",
            "patient", "patient_name", "patient_uhid",
            "doctor", "doctor_name",
            "time_slot",
            "appointment_date", "appointment_time",
            "reason", "status", "notes",
            "booked_by", "booked_by_name",
            "branch", "is_active",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "booked_by", "created_at", "updated_at"]


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """Used when booking a new appointment."""

    class Meta:
        model = Appointment
        fields = [
            "patient", "doctor", "time_slot",
            "appointment_date", "appointment_time", "reason",
        ]

    def validate(self, attrs):
        slot = attrs.get("time_slot")
        doctor = attrs.get("doctor")
        date = attrs.get("appointment_date")
        time = attrs.get("appointment_time")

        # If slot is given, validate it belongs to the selected doctor
        if slot and slot.doctor != doctor:
            raise serializers.ValidationError(
                {"time_slot": "The selected slot does not belong to this doctor."}
            )

        # Block double-booking on same doctor + date + time
        existing = Appointment.objects.filter(
            doctor=doctor,
            appointment_date=date,
            appointment_time=time,
            status__in=["pending", "confirmed"],
        )
        if existing.exists():
            raise serializers.ValidationError(
                "This doctor already has an appointment at the selected date and time."
            )
        return attrs


class AppointmentStatusSerializer(serializers.ModelSerializer):
    """Used for status-change PATCH action only."""

    class Meta:
        model = Appointment
        fields = ["status", "notes"]
