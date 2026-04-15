from django.contrib import admin
from .models import Referral


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ('patient_name', 'patient_phone', 'referred_by_name', 'branch', 'status', 'created_at')
    list_filter = ('status', 'branch')
    search_fields = ('patient_name', 'patient_phone', 'referred_by_name')
