from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.db.models import Q
from .models import Therapy, TherapyTimeline, PatientTherapy
from .serializers import TherapySerializer, PatientTherapySerializer
from patients.models import Appointment, AppointmentStatus

class TherapyListCreateView(generics.ListCreateAPIView):
    serializer_class = TherapySerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'owner':
            return Therapy.objects.all()
        elif user.role == 'doctor' and user.branch:
            return Therapy.objects.filter(branches=user.branch)
        return Therapy.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'doctor':
            therapy = serializer.save(created_by=user)
            if user.branch:
                therapy.branches.set([user.branch])
        else:
            serializer.save(created_by=user)


class TherapyDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TherapySerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'owner':
            return Therapy.objects.all()
        elif user.role == 'doctor' and user.branch:
            return Therapy.objects.filter(branches=user.branch)
        return Therapy.objects.none()

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role == 'owner':
            instance.delete()
        else:
            instance.is_active = False
            instance.save()


class PatientTherapyAssignView(generics.CreateAPIView):
    serializer_class = PatientTherapySerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Save PatientTherapy
        patient_therapy = serializer.save(
            assigned_by=request.user,
            branch=request.user.branch if request.user.role == 'doctor' else serializer.validated_data['patient'].branch
        )
        
        # Now create appointments if passed
        appointments_data = request.data.get('appointments', [])
        created_appointments = []
        for appt in appointments_data:
            scheduled_date = appt.get('scheduled_date')
            scheduled_time = appt.get('scheduled_time')
            doctor_id = appt.get('doctor', request.user.id)
            
            if scheduled_date and scheduled_time:
                # Check for existing appointment for that patient/day/time
                appointment = Appointment.objects.create(
                    patient=patient_therapy.patient,
                    doctor_id=doctor_id,
                    branch=patient_therapy.branch,
                    scheduled_date=scheduled_date,
                    scheduled_time=scheduled_time,
                    status=AppointmentStatus.SCHEDULED,
                    reason=f"Therapy Session: {patient_therapy.therapy.name}",
                    booked_by=request.user
                )
                created_appointments.append(appointment)
        
        res_data = serializer.data
        res_data['appointments_created'] = len(created_appointments)
        return Response(res_data, status=status.HTTP_201_CREATED)


class PatientTherapyListView(generics.ListAPIView):
    serializer_class = PatientTherapySerializer

    def get_queryset(self):
        patient_id = self.kwargs.get('patient_id')
        return PatientTherapy.objects.filter(patient_id=patient_id)


class PatientTherapyDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PatientTherapySerializer
    queryset = PatientTherapy.objects.all()
