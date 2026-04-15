from django.contrib import admin
from .models import Medicine, Prescription, PrescriptionItem


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'stock_quantity', 'branch', 'is_active')
    list_filter = ('category', 'is_active', 'branch')
    search_fields = ('name', 'generic_name', 'manufacturer')


class PrescriptionItemInline(admin.TabularInline):
    model = PrescriptionItem
    extra = 1


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'created_at')
    inlines = [PrescriptionItemInline]
    search_fields = ('patient__first_name', 'patient__uhid', 'doctor__first_name')
