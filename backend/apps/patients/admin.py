"""
apps/patients/admin.py
"""
from django.contrib import admin
from .models import Patient, MedicalHistory


class MedicalHistoryInline(admin.TabularInline):
    model = MedicalHistory
    extra = 0
    fields = ["condition", "diagnosed_at", "is_chronic", "notes"]


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ["uhid", "get_full_name", "phone", "gender", "blood_group", "branch", "is_active"]
    list_filter = ["gender", "blood_group", "branch", "is_active"]
    search_fields = ["uhid", "first_name", "last_name", "phone", "email"]
    readonly_fields = ["uhid", "created_at", "updated_at"]
    inlines = [MedicalHistoryInline]

    def get_full_name(self, obj):
        return obj.get_full_name()
    get_full_name.short_description = "Name"


@admin.register(MedicalHistory)
class MedicalHistoryAdmin(admin.ModelAdmin):
    list_display = ["patient", "condition", "diagnosed_at", "is_chronic"]
    list_filter = ["is_chronic"]
    search_fields = ["patient__uhid", "patient__first_name", "condition"]
