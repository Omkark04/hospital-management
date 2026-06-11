from django.contrib import admin
from .models import Therapy, TherapyTimeline, PatientTherapy

@admin.register(Therapy)
class TherapyAdmin(admin.ModelAdmin):
    list_display = ('name', 'therapy_type', 'total_duration_days', 'sessions_per_week', 'is_active')
    list_filter = ('therapy_type', 'is_active')
    search_fields = ('name', 'description')

@admin.register(TherapyTimeline)
class TherapyTimelineAdmin(admin.ModelAdmin):
    list_display = ('therapy', 'day_number', 'session_label')
    list_filter = ('therapy',)
    ordering = ('therapy', 'day_number')

@admin.register(PatientTherapy)
class PatientTherapyAdmin(admin.ModelAdmin):
    list_display = ('therapy', 'patient', 'start_date', 'status', 'assigned_by')
    list_filter = ('status', 'start_date')
    search_fields = ('patient__first_name', 'patient__last_name', 'therapy__name')
