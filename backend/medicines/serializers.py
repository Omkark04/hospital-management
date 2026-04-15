from rest_framework import serializers
from .models import Medicine, Prescription, PrescriptionItem


class MedicineSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Medicine
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class PrescriptionItemSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    medicine_price = serializers.DecimalField(source='medicine.price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = PrescriptionItem
        fields = ('id', 'medicine', 'medicine_name', 'medicine_price', 'dosage', 'duration', 'instructions', 'quantity')


class PrescriptionSerializer(serializers.ModelSerializer):
    items = PrescriptionItemSerializer(many=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_uhid = serializers.CharField(source='patient.uhid', read_only=True)

    class Meta:
        model = Prescription
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        prescription = Prescription.objects.create(**validated_data)
        for item_data in items_data:
            PrescriptionItem.objects.create(prescription=prescription, **item_data)
        return prescription

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        instance = super().update(instance, validated_data)
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                PrescriptionItem.objects.create(prescription=instance, **item_data)
        return instance
