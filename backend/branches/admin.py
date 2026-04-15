from django.contrib import admin
from .models import Hospital, Branch, BranchService


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'phone', 'email', 'created_at')
    search_fields = ('name', 'owner__username')


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ('name', 'hospital', 'phone', 'is_active', 'created_at')
    list_filter = ('is_active', 'hospital')
    search_fields = ('name', 'hospital__name')


@admin.register(BranchService)
class BranchServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'branch', 'price', 'is_active')
    list_filter = ('is_active', 'branch')
