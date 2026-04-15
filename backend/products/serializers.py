from rest_framework import serializers
from .models import Product, ProductEnquiry


class ProductPublicSerializer(serializers.ModelSerializer):
    """Read-only serializer for public product listing."""
    whatsapp_link = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ('id', 'name', 'category', 'price', 'description', 'image_url', 'whatsapp_link', 'stock_quantity')

    def get_whatsapp_link(self, obj):
        return obj.get_whatsapp_link()


class ProductSerializer(serializers.ModelSerializer):
    """Full serializer for Owner management."""
    whatsapp_link = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at')

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
