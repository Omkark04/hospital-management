from django.contrib import admin
from .models import Product, ProductEnquiry


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'stock_quantity', 'is_active', 'owner')
    list_filter = ('category', 'is_active')
    search_fields = ('name',)


@admin.register(ProductEnquiry)
class ProductEnquiryAdmin(admin.ModelAdmin):
    list_display = ('product', 'enquirer_name', 'enquirer_phone', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('enquirer_name', 'enquirer_phone', 'product__name')
