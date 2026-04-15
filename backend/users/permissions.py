from rest_framework.permissions import BasePermission
from .models import UserRole


class IsOwner(BasePermission):
    """Allows access only to Owner role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.OWNER)


class IsDoctor(BasePermission):
    """Allows access only to Doctor role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.DOCTOR)


class IsReceptionist(BasePermission):
    """Allows access only to Receptionist role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.RECEPTIONIST)


class IsEmployee(BasePermission):
    """Allows access only to Employee role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.EMPLOYEE)


class IsPatient(BasePermission):
    """Allows access only to Patient role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.PATIENT)


class IsOwnerOrDoctor(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in [UserRole.OWNER, UserRole.DOCTOR]
        )


class IsOwnerOrReceptionist(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in [UserRole.OWNER, UserRole.RECEPTIONIST]
        )


class IsOwnerOrDoctorOrReceptionist(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in [UserRole.OWNER, UserRole.DOCTOR, UserRole.RECEPTIONIST]
        )


class IsNotPatient(BasePermission):
    """All staff can access — blocks Patient only."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role != UserRole.PATIENT
        )


class IsSameBranchOrOwner(BasePermission):
    """Object-level: Owner sees all; others check branch match."""
    def has_object_permission(self, request, view, obj):
        if request.user.role == UserRole.OWNER:
            return True
        branch_id = getattr(obj, 'branch_id', None)
        return branch_id == request.user.branch_id
