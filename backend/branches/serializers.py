from rest_framework import serializers
from .models import Hospital, Branch, BranchService


class BranchServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = BranchService
        fields = ('id', 'branch', 'name', 'description', 'price', 'is_active', 'created_at')
        read_only_fields = ('id', 'created_at')


class BranchSerializer(serializers.ModelSerializer):
    services = BranchServiceSerializer(many=True, read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)

    class Meta:
        model = Branch
        fields = ('id', 'hospital', 'hospital_name', 'name', 'address', 'phone', 'email', 'is_active', 'services', 'created_at')
        read_only_fields = ('id', 'created_at')


class BranchMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ('id', 'name', 'address', 'phone', 'is_active')


class HospitalSerializer(serializers.ModelSerializer):
    branches = BranchMinimalSerializer(many=True, read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)

    class Meta:
        model = Hospital
        fields = ('id', 'name', 'owner', 'owner_name', 'phone', 'email', 'address', 'logo_url', 'branches', 'created_at')
        read_only_fields = ('id', 'owner', 'created_at')
