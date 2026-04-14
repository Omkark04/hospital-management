"""
apps/patients/serializers.py
"""
from rest_framework import serializers
from .models import Patient, MedicalHistory


class MedicalHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalHistory
        fields = [
            "id", "condition", "notes", "diagnosed_at",
            "is_chronic", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PatientListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views and dropdowns."""
    full_name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        model = Patient
        fields = ["id", "uhid", "full_name", "phone", "gender", "blood_group"]


class PatientSerializer(serializers.ModelSerializer):
    """Full patient serializer with nested medical history."""
    full_name = serializers.CharField(source="get_full_name", read_only=True)
    medical_history = MedicalHistorySerializer(many=True, read_only=True)
    age = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            "id", "uhid", "full_name",
            "first_name", "last_name", "date_of_birth", "age",
            "gender", "blood_group",
            "phone", "email", "address",
            "emergency_contact_name", "emergency_contact_phone",
            "user_account", "referred_by",
            "branch", "is_active",
            "medical_history",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "uhid", "created_at", "updated_at", "medical_history"]

    def get_age(self, obj):
        from django.utils import timezone
        today = timezone.now().date()
        dob = obj.date_of_birth
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


class PatientCreateSerializer(serializers.ModelSerializer):
    """Used for registering a new patient (excludes UHID — auto-generated)."""

    class Meta:
        model = Patient
        fields = [
            "first_name", "last_name", "date_of_birth", "gender", "blood_group",
            "phone", "email", "address",
            "emergency_contact_name", "emergency_contact_phone",
            "user_account", "referred_by",
        ]
