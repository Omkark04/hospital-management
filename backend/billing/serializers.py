from decimal import Decimal
from rest_framework import serializers
from .models import Bill, BillItem

class BillItemSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True, allow_null=True)
    product_name = serializers.CharField(source='product.name', read_only=True, allow_null=True)

    class Meta:
        model = BillItem
        fields = ('id', 'bill', 'description', 'medicine', 'medicine_name', 'product', 'product_name', 'quantity', 'unit_price', 'total_price')
        read_only_fields = ('id', 'total_price')


class BillSerializer(serializers.ModelSerializer):
    items = BillItemSerializer(many=True)
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_uhid = serializers.CharField(source='patient.uhid', read_only=True)
    patient_phone = serializers.CharField(source='patient.phone', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    balance_due = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Bill
        fields = '__all__'
        read_only_fields = ('id', 'total_amount', 'payment_status', 'created_at', 'updated_at')

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        bill = Bill.objects.create(**validated_data)
        total = Decimal('0.00')
        for item_data in items_data:
            item_data.pop('total_price', None)
            item_data.pop('bill', None)
            item_data.pop('id', None)
            item = BillItem.objects.create(bill=bill, **item_data)
            total += item.total_price
        bill.total_amount = total
        bill.save()
        return bill

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        instance = super().update(instance, validated_data)
        if items_data is not None:
            instance.items.all().delete()
            total = Decimal('0.00')
            for item_data in items_data:
                item_data.pop('total_price', None)
                item_data.pop('bill', None)
                item_data.pop('id', None)
                item = BillItem.objects.create(bill=instance, **item_data)
                total += item.total_price
            instance.total_amount = total
            instance.save()
        return instance


class PaymentUpdateSerializer(serializers.ModelSerializer):
    """Lightweight serializer for updating paid_amount and payment_method only."""
    class Meta:
        model = Bill
        fields = ('paid_amount', 'payment_method', 'notes')
