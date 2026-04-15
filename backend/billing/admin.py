from django.contrib import admin
from .models import Bill, BillItem


class BillItemInline(admin.TabularInline):
    model = BillItem
    extra = 1
    readonly_fields = ('total_price',)


@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'branch', 'total_amount', 'paid_amount', 'payment_status', 'payment_method', 'created_at')
    list_filter = ('payment_status', 'payment_method', 'branch')
    search_fields = ('patient__first_name', 'patient__uhid')
    inlines = [BillItemInline]
    readonly_fields = ('total_amount', 'created_at', 'updated_at')
