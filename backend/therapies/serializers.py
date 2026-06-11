from rest_framework import serializers
from .models import Therapy, TherapyTimeline, PatientTherapy
from medicines.serializers import MedicineSerializer
from products.serializers import ProductSerializer
from branches.serializers import BranchMinimalSerializer

class TherapyTimelineSerializer(serializers.ModelSerializer):
    class Meta:
        model = TherapyTimeline
        fields = '__all__'
        read_only_fields = ('id', 'therapy')


class TherapyTimelineDetailSerializer(serializers.ModelSerializer):
    medicines_on_day_details = MedicineSerializer(source='medicines_on_day', many=True, read_only=True)
    products_on_day_details = ProductSerializer(source='products_on_day', many=True, read_only=True)

    class Meta:
        model = TherapyTimeline
        fields = '__all__'
        read_only_fields = ('id', 'therapy')


class TherapySerializer(serializers.ModelSerializer):
    timeline = TherapyTimelineSerializer(many=True, required=False)
    branches_details = BranchMinimalSerializer(source='branches', many=True, read_only=True)
    medicines_details = MedicineSerializer(source='medicines', many=True, read_only=True)
    products_details = ProductSerializer(source='products', many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Therapy
        fields = '__all__'
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')

    def create(self, validated_data):
        timeline_data = validated_data.pop('timeline', [])
        branches = validated_data.pop('branches', [])
        medicines = validated_data.pop('medicines', [])
        products = validated_data.pop('products', [])

        therapy = Therapy.objects.create(**validated_data)
        therapy.branches.set(branches)
        therapy.medicines.set(medicines)
        therapy.products.set(products)

        for day_data in timeline_data:
            day_medicines = day_data.pop('medicines_on_day', [])
            day_products = day_data.pop('products_on_day', [])
            timeline_entry = TherapyTimeline.objects.create(therapy=therapy, **day_data)
            timeline_entry.medicines_on_day.set(day_medicines)
            timeline_entry.products_on_day.set(day_products)

        return therapy

    def update(self, instance, validated_data):
        timeline_data = validated_data.pop('timeline', None)
        branches = validated_data.pop('branches', None)
        medicines = validated_data.pop('medicines', None)
        products = validated_data.pop('products', None)

        instance = super().update(instance, validated_data)

        if branches is not None:
            instance.branches.set(branches)
        if medicines is not None:
            instance.medicines.set(medicines)
        if products is not None:
            instance.products.set(products)

        if timeline_data is not None:
            instance.timeline.all().delete()
            for day_data in timeline_data:
                day_medicines = day_data.pop('medicines_on_day', [])
                day_products = day_data.pop('products_on_day', [])
                timeline_entry = TherapyTimeline.objects.create(therapy=instance, **day_data)
                timeline_entry.medicines_on_day.set(day_medicines)
                timeline_entry.products_on_day.set(day_products)

        return instance

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['timeline'] = TherapyTimelineDetailSerializer(instance.timeline.all(), many=True).data
        return rep


class PatientTherapySerializer(serializers.ModelSerializer):
    therapy_name = serializers.CharField(source='therapy.name', read_only=True)
    therapy_type = serializers.CharField(source='therapy.therapy_type', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.get_full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)

    class Meta:
        model = PatientTherapy
        fields = '__all__'
        read_only_fields = ('id', 'assigned_by', 'created_at')
