from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsOwnerOrReceptionist, IsPatient
from users.models import UserRole
from .models import Bill
from .serializers import BillSerializer, PaymentUpdateSerializer


def branch_qs(qs, user):
    if user.role == UserRole.OWNER:
        from branches.models import Branch
        ids = Branch.objects.filter(hospital__owner=user).values_list('id', flat=True)
        return qs.filter(branch_id__in=ids)
    return qs.filter(branch=user.branch)


class BillListCreateView(generics.ListCreateAPIView):
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReceptionist]

    def get_queryset(self):
        qs = Bill.objects.all()
        qs = branch_qs(qs, self.request.user)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(payment_status=status_filter)
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class BillDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReceptionist]

    def get_queryset(self):
        return branch_qs(Bill.objects.all(), self.request.user)


class PaymentUpdateView(APIView):
    """Quick endpoint to update payment amount only (Receptionist workflow)."""
    permission_classes = [IsAuthenticated, IsOwnerOrReceptionist]

    def patch(self, request, pk):
        try:
            bill = Bill.objects.get(pk=pk)
        except Bill.DoesNotExist:
            return Response({'detail': 'Bill not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = PaymentUpdateSerializer(bill, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(BillSerializer(bill).data)


class MyBillsView(generics.ListAPIView):
    """Patient views their own bills."""
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated, IsPatient]

    def get_queryset(self):
        return Bill.objects.filter(patient__phone=self.request.user.phone)
