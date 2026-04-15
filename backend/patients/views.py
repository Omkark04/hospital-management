from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import UserRole
from users.permissions import (
    IsOwnerOrDoctorOrReceptionist, IsDoctor, IsOwnerOrReceptionist,
    IsPatient, IsOwner, IsSameBranchOrOwner
)
from .models import Patient, Appointment, VisitNote, LabReport
from .serializers import (
    PatientListSerializer, PatientDetailSerializer,
    AppointmentSerializer, VisitNoteSerializer, LabReportSerializer
)


def branch_filtered_queryset(qs, user):
    """Scope queryset to user's branch unless user is Owner."""
    if user.role == UserRole.OWNER:
        from branches.models import Branch
        branch_ids = Branch.objects.filter(hospital__owner=user).values_list('id', flat=True)
        return qs.filter(branch_id__in=branch_ids)
    elif user.role == UserRole.PATIENT:
        return qs.none()  # Patients use dedicated endpoints
    return qs.filter(branch=user.branch)


# ─────────────────── Patients ────────────────────────────────
class PatientListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PatientDetailSerializer
        return PatientListSerializer

    def get_queryset(self):
        qs = Patient.objects.filter(is_active=True)
        qs = branch_filtered_queryset(qs, self.request.user)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                first_name__icontains=search
            ) | qs.filter(
                last_name__icontains=search
            ) | qs.filter(
                uhid__icontains=search
            ) | qs.filter(
                phone__icontains=search
            )
        return qs

    def perform_create(self, serializer):
        serializer.save(registered_by=self.request.user)


class PatientDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = PatientDetailSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def get_queryset(self):
        return branch_filtered_queryset(Patient.objects.all(), self.request.user)


class MyPatientProfileView(generics.RetrieveUpdateAPIView):
    """Patient views their own profile."""
    serializer_class = PatientDetailSerializer
    permission_classes = [IsAuthenticated, IsPatient]

    def get_object(self):
        return Patient.objects.filter(
            phone=self.request.user.phone, is_active=True
        ).first()


# ─────────────────── Appointments ────────────────────────────
class AppointmentListCreateView(generics.ListCreateAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.PATIENT:
            # Patient sees only their own appointments
            return Appointment.objects.filter(patient__phone=user.phone)
        qs = Appointment.objects.all()
        qs = branch_filtered_queryset(qs, user)
        # Filter by date
        date = self.request.query_params.get('date')
        if date:
            qs = qs.filter(scheduled_date=date)
        doctor_id = self.request.query_params.get('doctor')
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(booked_by=self.request.user)


class AppointmentDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.PATIENT:
            return Appointment.objects.filter(patient__phone=user.phone)
        return branch_filtered_queryset(Appointment.objects.all(), user)


# ─────────────────── Visit Notes ─────────────────────────────
class VisitNoteListCreateView(generics.ListCreateAPIView):
    serializer_class = VisitNoteSerializer
    permission_classes = [IsAuthenticated, IsDoctor]

    def get_queryset(self):
        patient_id = self.kwargs.get('patient_id')
        return VisitNote.objects.filter(patient_id=patient_id)

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)


class VisitNoteDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = VisitNoteSerializer
    permission_classes = [IsAuthenticated, IsDoctor]
    queryset = VisitNote.objects.all()


# ─────────────────── Lab Reports ─────────────────────────────
class LabReportListCreateView(generics.ListCreateAPIView):
    serializer_class = LabReportSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def get_queryset(self):
        patient_id = self.kwargs.get('patient_id')
        return LabReport.objects.filter(patient_id=patient_id)

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class LabReportDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = LabReportSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]
    queryset = LabReport.objects.all()
