"""
apps/branches/views.py
"""
from rest_framework import viewsets, permissions
from .models import Branch
from .serializers import BranchSerializer, BranchListSerializer
from apps.core.permissions import IsOwner


class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.filter(is_active=True)
    serializer_class = BranchSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsOwner()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "list":
            return BranchListSerializer
        return BranchSerializer
