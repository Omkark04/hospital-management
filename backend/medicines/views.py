from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from users.permissions import IsOwnerOrDoctorOrReceptionist, IsDoctor
from users.models import UserRole
from .models import Medicine, Prescription
from .serializers import MedicineSerializer, PrescriptionSerializer, MedicineStockLedgerSerializer
from django.db.models import F
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


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
        # Auto-migrate legacy branch-specific products into Medicines so they appear natively
        try:
            from products.models import Product
            legacy_prods = Product.objects.filter(for_public=False, branch__isnull=False)
            for prod in legacy_prods:
                Medicine.objects.get_or_create(
                    branch=prod.branch,
                    name=prod.name,
                    defaults={
                        'description': prod.description or '',
                        'price': prod.price,
                        'stock_quantity': prod.stock_quantity,
                        'low_stock_threshold': getattr(prod, 'low_stock_threshold', 10),
                        'is_active': prod.is_active,
                        'category': 'other',
                    }
                )
        except Exception:
            pass

        qs = Medicine.objects.filter(is_active=True)
        
        # Allow filtering by branch from query params (e.g., for consultations)
        branch_id = self.request.query_params.get('branch')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        else:
            qs = branch_qs(qs, self.request.user)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(generic_name__icontains=search)
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return qs

    def perform_create(self, serializer):
        serializer.save(branch=self.request.user.branch)


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

# ─────────────────── Inventory & Ledger ───────────────────
class LowStockMedicineView(generics.ListAPIView):
    serializer_class = MedicineSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def get_queryset(self):
        qs = Medicine.objects.filter(is_active=True, stock_quantity__lte=F('low_stock_threshold'))
        return branch_qs(qs, self.request.user)

class MedicineStockMovementView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def post(self, request):
        medicine_id = request.data.get('medicine_id')
        quantity = int(request.data.get('quantity', 0))
        movement_type = request.data.get('movement_type') # 'in', 'out', 'adjustment'
        reference = request.data.get('reference', '')
        notes = request.data.get('notes', '')

        if quantity <= 0:
            return Response({'detail': 'Quantity must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            medicine = Medicine.objects.get(id=medicine_id)
        except Medicine.DoesNotExist:
            return Response({'detail': 'Medicine not found.'}, status=status.HTTP_404_NOT_FOUND)

        if movement_type == 'out' and medicine.stock_quantity < quantity:
            return Response({'detail': 'Insufficient stock.'}, status=status.HTTP_400_BAD_REQUEST)

        if movement_type == 'in':
            medicine.stock_quantity += quantity
        elif movement_type == 'out':
            medicine.stock_quantity -= quantity
        elif movement_type == 'adjustment':
            medicine.stock_quantity = quantity # for adjustment quantity is the absolute new stock
            # compute actual difference for ledger? let's keep it simple
            quantity = abs(medicine.stock_quantity - quantity) or quantity
        
        medicine.save()

        from .models import MedicineStockLedger
        MedicineStockLedger.objects.create(
            medicine=medicine,
            branch=medicine.branch,
            movement_type=movement_type,
            quantity=quantity,
            reference=reference,
            notes=notes,
            performed_by=request.user
        )
        return Response({'detail': 'Stock updated.', 'current_stock': medicine.stock_quantity})

class MedicineLedgerListView(generics.ListAPIView):
    serializer_class = MedicineStockLedgerSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def get_queryset(self):
        from .models import MedicineStockLedger
        qs = MedicineStockLedger.objects.all()
        if self.request.user.role != UserRole.OWNER:
            qs = qs.filter(branch=self.request.user.branch)
        medicine_id = self.request.query_params.get('medicine')
        if medicine_id:
            qs = qs.filter(medicine_id=medicine_id)
        return qs
