from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from users.permissions import IsOwnerOrDoctorOrReceptionist, IsDoctor
from users.models import UserRole
from .models import Medicine, Prescription
from .serializers import MedicineSerializer, PrescriptionSerializer


def branch_qs(qs, user):
    if user.role == UserRole.OWNER:
        from branches.models import Branch
        ids = Branch.objects.filter(hospital__owner=user).values_list('id', flat=True)
        return qs.filter(branch_id__in=ids)
    return qs.filter(branch=user.branch)


class MedicineListCreateView(generics.ListCreateAPIView):
    serializer_class = MedicineSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def get_queryset(self):
        qs = Medicine.objects.filter(is_active=True)
        qs = branch_qs(qs, self.request.user)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(generic_name__icontains=search)
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return qs


class MedicineDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MedicineSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def get_queryset(self):
        return branch_qs(Medicine.objects.all(), self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        from rest_framework.response import Response
        from rest_framework import status
        return Response({'detail': 'Medicine deactivated.'}, status=status.HTTP_200_OK)


class PrescriptionListCreateView(generics.ListCreateAPIView):
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated, IsDoctor]

    def get_queryset(self):
        patient_id = self.request.query_params.get('patient')
        qs = Prescription.objects.filter(doctor=self.request.user)
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)


class PrescriptionDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated, IsDoctor]

    def get_queryset(self):
        return Prescription.objects.filter(doctor=self.request.user)
