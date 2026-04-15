from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.permissions import IsOwner, IsNotPatient
from .models import Hospital, Branch, BranchService
from .serializers import HospitalSerializer, BranchSerializer, BranchServiceSerializer


# ─────────────────── Hospital ────────────────────────────────
class HospitalListCreateView(generics.ListCreateAPIView):
    serializer_class = HospitalSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Hospital.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class HospitalDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = HospitalSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Hospital.objects.filter(owner=self.request.user)


# ─────────────────── Branch ──────────────────────────────────
class BranchListCreateView(generics.ListCreateAPIView):
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Branch.objects.filter(hospital__owner=self.request.user)

    def create(self, request, *args, **kwargs):
        # Ensure the hospital belongs to the requesting owner
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        hospital = serializer.validated_data['hospital']
        if hospital.owner != request.user:
            return Response({'detail': 'You do not own this hospital.'}, status=status.HTTP_403_FORBIDDEN)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BranchDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Branch.objects.filter(hospital__owner=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response({'detail': 'Branch deactivated.'}, status=status.HTTP_200_OK)


# ─────────────────── Branch Services ─────────────────────────
class BranchServiceListCreateView(generics.ListCreateAPIView):
    serializer_class = BranchServiceSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return BranchService.objects.filter(
            branch__hospital__owner=self.request.user,
            branch_id=self.kwargs.get('branch_id')
        )


class BranchServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BranchServiceSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return BranchService.objects.filter(branch__hospital__owner=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response({'detail': 'Service deactivated.'}, status=status.HTTP_200_OK)


# ─────────────────── Public branch list (for dropdowns) ──────
class PublicBranchListView(generics.ListAPIView):
    serializer_class = BranchSerializer
    permission_classes = []
    authentication_classes = []

    def get_queryset(self):
        return Branch.objects.filter(is_active=True)
