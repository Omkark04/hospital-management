from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

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
        return Branch.objects.filter(hospital__owner=self.request.user).order_by('id')

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

class BranchStatsView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]

    def get(self, request):
        branches = Branch.objects.filter(hospital__owner=request.user, is_active=True)
        stats = []
        for b in branches:
            patients_count = b.patient_set.count() if hasattr(b, 'patient_set') else 0
            employees_count = b.users.count() if hasattr(b, 'users') else 0
            
            from billing.models import Bill
            from django.db.models import Sum
            revenue = Bill.objects.filter(branch=b).aggregate(total=Sum('paid_amount'))['total'] or 0
            
            stats.append({
                'id': b.id,
                'name': b.name,
                'patients': patients_count,
                'employees': employees_count,
                'revenue': revenue
            })
        return Response(stats)


import re
import urllib.request

class ResolveMapLinkView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]

    def post(self, request):
        url = request.data.get('url', '').strip()
        if not url:
            return Response({'error': 'No URL provided.'}, status=400)
        
        # If the user pasted an expanded link already containing coordinates, extract immediately
        match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', url)
        if match:
            lat, lng = match.groups()
            return Response({'latitude': lat, 'longitude': lng, 'resolved_url': url})
        
        try:
            req = urllib.request.Request(
                url, 
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                final_url = response.geturl()
                
            match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', final_url)
            if match:
                lat, lng = match.groups()
                return Response({'latitude': lat, 'longitude': lng, 'resolved_url': final_url})
            
            return Response({'error': 'Could not extract coordinates from expanded link.', 'resolved_url': final_url}, status=400)
        except Exception as e:
            return Response({'error': f'Failed to resolve map link: {str(e)}'}, status=400)


class BranchSlotCapacityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.branch:
            return Response({'detail': 'User is not assigned to any branch.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            'branch_id': user.branch.id,
            'branch_name': user.branch.name,
            'max_patients_per_slot': user.branch.max_patients_per_slot
        })

    def post(self, request):
        user = request.user
        if not user.branch:
            return Response({'detail': 'User is not assigned to any branch.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if user.role not in ['doctor', 'receptionist', 'owner']:
            return Response({'detail': 'Only doctors, receptionists, or owners can update slot capacity.'}, status=status.HTTP_403_FORBIDDEN)

        val = request.data.get('max_patients_per_slot')
        if val is None:
            return Response({'detail': 'max_patients_per_slot field is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            val = int(val)
            if val < 1:
                raise ValueError()
        except ValueError:
            return Response({'detail': 'max_patients_per_slot must be a positive integer.'}, status=status.HTTP_400_BAD_REQUEST)

        branch = user.branch
        branch.max_patients_per_slot = val
        branch.save()
        return Response({
            'detail': 'Slot capacity updated successfully.',
            'max_patients_per_slot': branch.max_patients_per_slot
        })
