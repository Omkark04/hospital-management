"""
apps/appointments/views.py
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.core.mixins import BranchFilterMixin
from apps.core.permissions import IsOwner, IsDoctor, IsReceptionist, IsPatient
from .models import Appointment, TimeSlot
from .serializers import (
    AppointmentSerializer,
    AppointmentListSerializer,
    AppointmentCreateSerializer,
    AppointmentStatusSerializer,
    TimeSlotSerializer,
)
from .services import book_appointment, get_available_slots


class TimeSlotViewSet(BranchFilterMixin, viewsets.ModelViewSet):
    """
    Manage doctor time slots.

    Endpoints:
        GET    /api/v1/appointments/slots/                    — list slots
        POST   /api/v1/appointments/slots/                    — create slot (Doctor/Owner)
        GET    /api/v1/appointments/slots/<id>/               — slot detail
        PATCH  /api/v1/appointments/slots/<id>/               — update slot
        DELETE /api/v1/appointments/slots/<id>/               — delete slot
        GET    /api/v1/appointments/slots/available/?doctor=<id>&date=<YYYY-MM-DD>
    """
    queryset = TimeSlot.objects.select_related("doctor", "branch")
    serializer_class = TimeSlotSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["doctor", "date", "is_available", "branch"]
    ordering_fields = ["date", "start_time"]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsDoctor() or IsOwner()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(branch=self.request.user.branch)

    @action(detail=False, methods=["get"], url_path="available")
    def available(self, request):
        """
        GET /api/v1/appointments/slots/available/?doctor=<uuid>&date=<YYYY-MM-DD>
        Returns available time slots for the given doctor on the given date.
        """
        doctor_id = request.query_params.get("doctor")
        date = request.query_params.get("date")

        if not doctor_id or not date:
            return Response(
                {"error": "Both 'doctor' and 'date' query params are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        slots = get_available_slots(doctor_id=doctor_id, date=date)
        serializer = TimeSlotSerializer(slots, many=True)
        return Response(serializer.data)


class AppointmentViewSet(BranchFilterMixin, viewsets.ModelViewSet):
    """
    Appointment CRUD + status transitions.

    Endpoints:
        GET    /api/v1/appointments/           — list (branch-scoped, role-filtered)
        POST   /api/v1/appointments/           — book appointment
        GET    /api/v1/appointments/<id>/      — detail
        PATCH  /api/v1/appointments/<id>/      — update
        DELETE /api/v1/appointments/<id>/      — soft-cancel
        PATCH  /api/v1/appointments/<id>/status/ — change status only
        GET    /api/v1/appointments/today/     — today's appointments
        GET    /api/v1/appointments/upcoming/  — upcoming appointments
    """
    queryset = Appointment.objects.filter(is_active=True).select_related(
        "patient", "doctor", "time_slot", "booked_by", "branch"
    )
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "doctor", "patient", "appointment_date", "branch"]
    search_fields = [
        "patient__first_name", "patient__last_name", "patient__uhid",
        "doctor__first_name", "doctor__last_name",
    ]
    ordering_fields = ["appointment_date", "appointment_time", "created_at", "status"]

    def get_permissions(self):
        if self.action == "destroy":
            return [IsOwner() or IsReceptionist()]
        if self.action == "create":
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "list":
            return AppointmentListSerializer
        if self.action == "create":
            return AppointmentCreateSerializer
        if self.action == "set_status":
            return AppointmentStatusSerializer
        return AppointmentSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Patients only see their own appointments
        if user.role == "patient" and hasattr(user, "patient_profile"):
            return qs.filter(patient=user.patient_profile)
        # Doctors only see their own appointments
        if user.role == "doctor":
            return qs.filter(doctor=user)
        return qs

    def perform_create(self, serializer):
        appointment = book_appointment(
            validated_data=serializer.validated_data,
            branch=self.request.user.branch,
            booked_by=self.request.user,
        )
        serializer.instance = appointment

    def perform_destroy(self, instance):
        """Soft-cancel: mark as cancelled + is_active=False."""
        instance.status = Appointment.Status.CANCELLED
        instance.is_active = False
        instance.save(update_fields=["status", "is_active"])

    # ── Custom actions ────────────────────────────────────────────────────────

    @action(detail=True, methods=["patch"], url_path="status")
    def set_status(self, request, pk=None):
        """
        PATCH /api/v1/appointments/<id>/status/
        Body: {"status": "confirmed"|"completed"|"cancelled"|"no_show", "notes": "..."}
        """
        appointment = self.get_object()
        serializer = AppointmentStatusSerializer(appointment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(AppointmentSerializer(appointment).data)

    @action(detail=False, methods=["get"], url_path="today")
    def today(self, request):
        """GET /api/v1/appointments/today/ — appointments for today, scoped to role."""
        from django.utils import timezone
        today = timezone.now().date()
        qs = self.get_queryset().filter(appointment_date=today)
        serializer = AppointmentListSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="upcoming")
    def upcoming(self, request):
        """GET /api/v1/appointments/upcoming/ — all future confirmed/pending appointments."""
        from django.utils import timezone
        today = timezone.now().date()
        qs = self.get_queryset().filter(
            appointment_date__gte=today,
            status__in=["pending", "confirmed"],
        )
        serializer = AppointmentListSerializer(qs, many=True)
        return Response(serializer.data)
