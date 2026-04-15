from django.contrib import admin
from .models import Patient, Appointment, VisitNote, LabReport


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('uhid', 'get_full_name', 'phone', 'gender', 'blood_group', 'branch', 'is_active', 'created_at')
    list_filter = ('gender', 'blood_group', 'branch', 'is_active')
    search_fields = ('uhid', 'first_name', 'last_name', 'phone', 'email')
    readonly_fields = ('uhid', 'created_at', 'updated_at')


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'branch', 'scheduled_date', 'scheduled_time', 'status')
    list_filter = ('status', 'branch', 'scheduled_date')
    search_fields = ('patient__first_name', 'patient__uhid', 'doctor__first_name')


@admin.register(VisitNote)
class VisitNoteAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'diagnosis', 'created_at')
    search_fields = ('patient__first_name', 'patient__uhid', 'diagnosis')


@admin.register(LabReport)
class LabReportAdmin(admin.ModelAdmin):
    list_display = ('patient', 'report_name', 'report_date', 'uploaded_by')
    search_fields = ('patient__first_name', 'patient__uhid', 'report_name')
