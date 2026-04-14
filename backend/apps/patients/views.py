"""
apps/patients/views.py
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.core.mixins import BranchFilterMixin
from apps.core.permissions import IsOwner, IsDoctor, IsReceptionist
from .models import Patient, MedicalHistory
from .serializers import (
    PatientSerializer,
    PatientListSerializer,
    PatientCreateSerializer,
    MedicalHistorySerializer,
)
from .services import register_patient


class PatientViewSet(BranchFilterMixin, viewsets.ModelViewSet):
    """
    CRUD API for patients.

    Endpoints:
        GET    /api/v1/patients/              — list (branch-scoped)
        POST   /api/v1/patients/              — register new patient
        GET    /api/v1/patients/<id>/         — patient detail
        PATCH  /api/v1/patients/<id>/         — update patient info
        DELETE /api/v1/patients/<id>/         — soft-delete (owner only)
        GET    /api/v1/patients/<id>/history/ — medical history list
        POST   /api/v1/patients/<id>/history/ — add medical history entry
    """
    queryset = Patient.objects.filter(is_active=True).select_related("branch", "user_account")
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["gender", "blood_group", "branch"]
    search_fields = ["uhid", "first_name", "last_name", "phone", "email"]
    ordering_fields = ["created_at", "first_name", "last_name"]

    def get_permissions(self):
        if self.action == "destroy":
            return [IsOwner()]
        if self.action in ["create", "update", "partial_update"]:
            return [permissions.IsAuthenticated(), (IsReceptionist() or IsOwner())]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "list":
            return PatientListSerializer
        if self.action == "create":
            return PatientCreateSerializer
        return PatientSerializer

    def perform_create(self, serializer):
        """Use the service layer to register patient with UHID generation."""
        branch = self.request.user.branch
        patient = register_patient(serializer.validated_data, branch)
        # Return the created patient so DRF can build the response
        serializer.instance = patient

    def perform_destroy(self, instance):
        """Soft-delete: set is_active=False instead of deleting from DB."""
        instance.is_active = False
        instance.save(update_fields=["is_active"])

    @action(detail=True, methods=["get", "post"], url_path="history")
    def history(self, request, pk=None):
        """
        GET  /api/v1/patients/<id>/history/ — list medical history
        POST /api/v1/patients/<id>/history/ — add new history entry
        """
        patient = self.get_object()

        if request.method == "GET":
            qs = patient.medical_history.all()
            serializer = MedicalHistorySerializer(qs, many=True)
            return Response(serializer.data)

        serializer = MedicalHistorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(patient=patient)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MedicalHistoryViewSet(viewsets.ModelViewSet):
    """
    Direct CRUD for medical history entries.
    Doctors and Owners can modify; others read-only.

    Endpoints:
        GET    /api/v1/patients/medical-history/
        GET    /api/v1/patients/medical-history/<id>/
        PATCH  /api/v1/patients/medical-history/<id>/
        DELETE /api/v1/patients/medical-history/<id>/
    """
    queryset = MedicalHistory.objects.select_related("patient")
    serializer_class = MedicalHistorySerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsDoctor() or IsOwner()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == "owner":
            return qs
        if user.role == "patient" and hasattr(user, "patient_profile"):
            return qs.filter(patient=user.patient_profile)
        return qs.filter(patient__branch=user.branch)
