"""
apps/branches/serializers.py
"""
from rest_framework import serializers
from .models import Branch, BranchService


class BranchServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = BranchService
        fields = ["id", "name", "description", "price", "is_active"]


class BranchSerializer(serializers.ModelSerializer):
    services = BranchServiceSerializer(many=True, read_only=True)

    class Meta:
        model = Branch
        fields = [
            "id", "name", "code", "address", "city", "state",
            "pincode", "phone", "email", "is_active", "services",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class BranchListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for dropdowns."""
    class Meta:
        model = Branch
        fields = ["id", "name", "code", "city"]
