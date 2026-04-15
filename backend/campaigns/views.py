from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.permissions import IsOwner
from users.models import UserRole
from .models import Campaign, CampaignManagerAssignment, CampaignPatient, CampaignAttendance, CampaignSale
from .serializers import (
    CampaignSerializer, CampaignManagerAssignmentSerializer,
    CampaignPatientSerializer, CampaignAttendanceSerializer, CampaignSaleSerializer
)


def is_campaign_manager(user, campaign):
    """Check if user is assigned as manager for this campaign."""
    return CampaignManagerAssignment.objects.filter(
        campaign=campaign, user=user, is_active=True
    ).exists()


class CampaignListCreateView(generics.ListCreateAPIView):
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        from branches.models import Branch
        ids = Branch.objects.filter(hospital__owner=self.request.user).values_list('id', flat=True)
        return Campaign.objects.filter(branch_id__in=ids)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class CampaignDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.OWNER:
            from branches.models import Branch
            ids = Branch.objects.filter(hospital__owner=user).values_list('id', flat=True)
            return Campaign.objects.filter(branch_id__in=ids)
        # Doctors/Employees see campaigns where they are assigned as managers
        assigned = CampaignManagerAssignment.objects.filter(user=user, is_active=True).values_list('campaign_id', flat=True)
        return Campaign.objects.filter(id__in=assigned)


class CampaignManagerAssignView(generics.CreateAPIView):
    serializer_class = CampaignManagerAssignmentSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)


class MyCampaignsView(generics.ListAPIView):
    """Returns campaigns where current user is assigned as manager."""
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        assigned = CampaignManagerAssignment.objects.filter(
            user=self.request.user, is_active=True
        ).values_list('campaign_id', flat=True)
        return Campaign.objects.filter(id__in=assigned, status='active')


class CampaignPatientListCreateView(generics.ListCreateAPIView):
    serializer_class = CampaignPatientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CampaignPatient.objects.filter(campaign_id=self.kwargs['campaign_id'])

    def perform_create(self, serializer):
        serializer.save(
            campaign_id=self.kwargs['campaign_id'],
            registered_by=self.request.user
        )


class CampaignAttendanceListCreateView(generics.ListCreateAPIView):
    serializer_class = CampaignAttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CampaignAttendance.objects.filter(campaign_id=self.kwargs['campaign_id'])


class CampaignSaleListCreateView(generics.ListCreateAPIView):
    serializer_class = CampaignSaleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CampaignSale.objects.filter(campaign_id=self.kwargs['campaign_id'])

    def perform_create(self, serializer):
        serializer.save(
            campaign_id=self.kwargs['campaign_id'],
            sold_by=self.request.user
        )
