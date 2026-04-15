from django.contrib import admin
from .models import Campaign, CampaignManagerAssignment, CampaignPatient, CampaignAttendance, CampaignSale


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ('name', 'branch', 'start_date', 'end_date', 'location', 'status')
    list_filter = ('status', 'branch')
    search_fields = ('name', 'location')


@admin.register(CampaignManagerAssignment)
class CampaignManagerAssignmentAdmin(admin.ModelAdmin):
    list_display = ('campaign', 'user', 'assigned_by', 'is_active', 'assigned_at')
    list_filter = ('is_active',)


@admin.register(CampaignPatient)
class CampaignPatientAdmin(admin.ModelAdmin):
    list_display = ('campaign', 'patient', 'registered_by', 'created_at')


@admin.register(CampaignAttendance)
class CampaignAttendanceAdmin(admin.ModelAdmin):
    list_display = ('campaign', 'user', 'date', 'is_present')


@admin.register(CampaignSale)
class CampaignSaleAdmin(admin.ModelAdmin):
    list_display = ('campaign', 'item_name', 'quantity', 'amount', 'sold_by', 'created_at')
