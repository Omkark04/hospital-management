from rest_framework import serializers
from .models import Product, ProductCategory, ProductEnquiry


class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = '__all__'


class ProductPublicSerializer(serializers.ModelSerializer):
    """Read-only serializer for public product listing."""
    category_name = serializers.CharField(source='category.name', read_only=True, default="Health Product")
    final_price = serializers.ReadOnlyField()
    whatsapp_link = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'category', 'category_name', 'price', 'final_price', 
            'discount_percentage', 'description', 'image_url', 'whatsapp_link', 
            'stock_quantity', 'display_quantity', 'features'
        )

    def get_whatsapp_link(self, obj):
        return obj.get_whatsapp_link()


class ProductSerializer(serializers.ModelSerializer):
    """Full serializer for Owner management."""
    category_name = serializers.CharField(source='category.name', read_only=True, default="Health Product")
    final_price = serializers.ReadOnlyField()
    whatsapp_link = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at', 'final_price')

    def get_whatsapp_link(self, obj):
        return obj.get_whatsapp_link()


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
