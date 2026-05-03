from decimal import Decimal
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
    product_name = serializers.CharField(source='product.name', read_only=True)
    item_name = serializers.SerializerMethodField()
    item_price = serializers.SerializerMethodField()

    class Meta:
        model = PrescriptionItem
        fields = (
            'id', 'medicine', 'medicine_name', 'product', 'product_name', 
            'item_name', 'item_price', 'dosage', 'duration', 'instructions', 'quantity'
        )

    def get_item_name(self, obj):
        if obj.medicine: return obj.medicine.name
        if obj.product: return obj.product.name
        return "Unknown Item"

    def get_item_price(self, obj):
        if obj.medicine: return obj.medicine.price
        if obj.product: return obj.product.final_price
        return 0


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
        
        # 1. Update Appointment Status if exists
        if prescription.appointment:
            from patients.models import AppointmentStatus
            prescription.appointment.status = AppointmentStatus.COMPLETED
            prescription.appointment.save()

        # 2. Create Bill (Transition to Receptionist)
        from billing.models import Bill, BillItem
        from django.db.models import Sum
        
        # Determine branch from patient or doctor fallback
        branch = prescription.patient.branch or prescription.doctor.branch
        
        bill = Bill.objects.create(
            patient=prescription.patient,
            branch=branch,
            prescription=prescription,
            created_by=prescription.doctor,
            total_amount=0 # Will be updated via BillItems
        )

        # 3. Add Consultation Fee (Doctor's Fee) - Modifiable by Receptionist
        BillItem.objects.create(
            bill=bill,
            description=f"Consultation Fee - Dr. {prescription.doctor.get_full_name()}",
            quantity=1,
            unit_price=Decimal('500.00'), # Default fee
            total_price=Decimal('500.00')
        )

        # 4. Add Medicines/Products to Bill
        total = Decimal('500.00')
        for item in prescription.items.all():
            if not item.medicine and not item.product:
                continue
            item_name = item.medicine.name if item.medicine else item.product.name
            price = item.medicine.price if item.medicine else Decimal(str(item.product.final_price))
            
            BillItem.objects.create(
                bill=bill,
                description=item_name,
                medicine=item.medicine,
                product=item.product,
                quantity=item.quantity,
                unit_price=price,
                total_price=price * Decimal(str(item.quantity))
            )
            total += (price * Decimal(str(item.quantity)))
        
        bill.total_amount = total
        bill.save()

        return prescription

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        instance = super().update(instance, validated_data)
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                PrescriptionItem.objects.create(prescription=instance, **item_data)
        return instance
