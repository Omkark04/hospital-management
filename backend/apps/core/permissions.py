"""
apps/core/permissions.py — Role-based DRF permission classes.
"""
from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """Hospital owner — has global access across all branches."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "owner")


class IsDoctor(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "doctor")


class IsReceptionist(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "receptionist")


class IsPatient(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "patient")


class IsHR(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "hr")


class IsEmployee(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "employee")


class IsCampaignManager(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "campaign_manager")


class IsBranchMember(BasePermission):
    """Ensures user belongs to the branch they're querying."""
    def has_object_permission(self, request, view, obj):
        if request.user.role == "owner":
            return True
        return obj.branch == request.user.branch
