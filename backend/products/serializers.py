from rest_framework import serializers
from .models import Product, ProductCategory, ProductEnquiry, ProductStockLedger


class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = '__all__'


class ProductPublicSerializer(serializers.ModelSerializer):
    """Read-only serializer for public product listing."""
    category_name = serializers.CharField(source='category.name', read_only=True, default="Health Product")
    final_price = serializers.ReadOnlyField()
    whatsapp_link = serializers.SerializerMethodField()
    is_low_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'category', 'category_name', 'price', 'final_price', 
            'discount_percentage', 'description', 'image_url', 'whatsapp_link', 
            'stock_quantity', 'display_quantity', 'features', 'is_low_stock', 'low_stock_threshold'
        )

    def get_whatsapp_link(self, obj):
        return obj.get_whatsapp_link()

    def get_is_low_stock(self, obj):
        return obj.stock_quantity <= obj.low_stock_threshold


class ProductSerializer(serializers.ModelSerializer):
    """Full serializer for Owner management."""
    category_name = serializers.CharField(source='category.name', read_only=True, default="Health Product")
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    final_price = serializers.ReadOnlyField()
    whatsapp_link = serializers.SerializerMethodField()
    is_low_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at', 'final_price')

    def get_whatsapp_link(self, obj):
        return obj.get_whatsapp_link()

    def get_is_low_stock(self, obj):
        return obj.stock_quantity <= obj.low_stock_threshold

class ProductStockLedgerSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = ProductStockLedger
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'performed_by')


class ProductEnquirySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = ProductEnquiry
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'status')


class EnquiryStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductEnquiry
        fields = ('status',)
