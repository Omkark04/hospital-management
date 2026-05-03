from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import UserRole
from users.permissions import (
    IsOwnerOrDoctorOrReceptionist, IsDoctor, IsOwnerOrReceptionist,
    IsPatient, IsOwner, IsSameBranchOrOwner
)
from .models import Patient, Appointment, VisitNote, LabReport, Department, Treatment
from .serializers import (
    PatientListSerializer, PatientDetailSerializer,
    AppointmentSerializer, VisitNoteSerializer, LabReportSerializer,
    DepartmentSerializer, TreatmentSerializer
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

# ─────────────────── Master Data ─────────────────────────────
class DepartmentListView(generics.ListAPIView):
    queryset = Department.objects.filter(is_active=True)
    serializer_class = DepartmentSerializer
    permission_classes = [AllowAny]

class TreatmentListView(generics.ListAPIView):
    queryset = Treatment.objects.filter(is_active=True)
    serializer_class = TreatmentSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        qs = super().get_queryset()
        dept_id = self.request.query_params.get('department')
        if dept_id:
            qs = qs.filter(department_id=dept_id)
        return qs


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

# ─────────────────── Reviews ──────────────────────────────────
from .models import Review, ReviewStatus
from .serializers import ReviewSerializer
from rest_framework.permissions import AllowAny
from datetime import datetime

class PublicReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Review.objects.filter(status=ReviewStatus.APPROVED)

class AdminReviewListView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReceptionist]

    def get_queryset(self):
        qs = Review.objects.all()
        return branch_filtered_queryset(qs, self.request.user)

class AdminReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReceptionist]
    queryset = Review.objects.all()


# ─────────────────── Public Booking ───────────────────────────
from .models import AppointmentStatus

class PublicAvailableSlotsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        target_date_str = request.query_params.get('date')
        if not target_date_str:
            return Response({'error': 'date parameter is required (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'invalid date format'}, status=status.HTTP_400_BAD_REQUEST)

        branch_id = request.query_params.get('branch')
        
        MAX_CAPACITY = 5
        slots = []
        for hour in range(9, 19):
            slot_time = f"{hour:02d}:00:00"
            
            qs = Appointment.objects.filter(
                scheduled_date=target_date, 
                scheduled_time=slot_time,
                status__in=[AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED]
            )
            if branch_id:
                qs = qs.filter(branch_id=branch_id)
                
            booked_count = qs.count()
            
            if booked_count < MAX_CAPACITY:
                slots.append({
                    'time': f"{hour:02d}:00",
                    'available_capacity': MAX_CAPACITY - booked_count
                })
                
        return Response({'slots': slots})


class PublicBookAppointmentView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        data = request.data
        name = data.get('name')
        phone = data.get('phone')
        email = data.get('email', '')
        branch_id = data.get('branch')
        dept_id = data.get('department')
        treatment_id = data.get('treatment')
        scheduled_date = data.get('scheduled_date')
        scheduled_time = data.get('scheduled_time')
        reason = data.get('message', '')

        if not all([name, phone, branch_id, scheduled_date, scheduled_time]):
            return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)

        from branches.models import Branch
        try:
            branch = Branch.objects.get(id=branch_id)
        except Branch.DoesNotExist:
            return Response({'error': 'Invalid branch'}, status=status.HTTP_400_BAD_REQUEST)

        # Find or create patient
        patient = Patient.objects.filter(phone=phone, branch=branch).first()
        if not patient:
            first_name = name.split(' ')[0]
            last_name = ' '.join(name.split(' ')[1:]) if len(name.split(' ')) > 1 else ''
            patient = Patient.objects.create(
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                email=email,
                branch=branch,
                primary_department_id=dept_id,
                interested_treatment_id=treatment_id
            )

        # Create appointment
        appointment = Appointment.objects.create(
            patient=patient,
            branch=branch,
            scheduled_date=scheduled_date,
            scheduled_time=scheduled_time,
            status=AppointmentStatus.SCHEDULED,
            reason=reason
        )

        return Response({'message': 'Appointment booked successfully', 'appointment_id': appointment.id}, status=status.HTTP_201_CREATED)
