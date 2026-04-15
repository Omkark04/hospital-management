from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsOwnerOrDoctorOrReceptionist
from .models import Referral
from .serializers import ReferralSerializer, ReferralStatusUpdateSerializer


class ReferralCreateView(generics.CreateAPIView):
    """Public or authenticated — anyone can submit a referral."""
    serializer_class = ReferralSerializer
    permission_classes = []
    authentication_classes = []

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(referred_by_user=user)


class ReferralListView(generics.ListAPIView):
    """Staff views all referrals in their branch."""
    serializer_class = ReferralSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def get_queryset(self):
        from users.models import UserRole
        user = self.request.user
        qs = Referral.objects.all()
        if user.role == UserRole.OWNER:
            from branches.models import Branch
            ids = Branch.objects.filter(hospital__owner=user).values_list('id', flat=True)
            qs = qs.filter(branch_id__in=ids)
        else:
            qs = qs.filter(branch=user.branch)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class ReferralStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def patch(self, request, pk):
        try:
            referral = Referral.objects.get(pk=pk)
        except Referral.DoesNotExist:
            return Response({'detail': 'Referral not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ReferralStatusUpdateSerializer(referral, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ReferralSerializer(referral).data)
