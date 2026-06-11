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
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Patients see only their own prescriptions (matched via phone)
        if user.role == UserRole.PATIENT:
            from patients.models import Patient
            patient = Patient.objects.filter(phone=user.phone, is_active=True).first()
            if patient:
                return Prescription.objects.filter(patient=patient)
            return Prescription.objects.none()

        # Doctor / Receptionist / Owner sees prescriptions scoped by branch
        qs = Prescription.objects.all()
        if user.role == UserRole.OWNER:
            from branches.models import Branch
            ids = Branch.objects.filter(hospital__owner=user).values_list('id', flat=True)
            qs = qs.filter(patient__branch_id__in=ids)
        else:
            qs = qs.filter(patient__branch=user.branch)

        # Search by patient name, phone, or UHID
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(patient__first_name__icontains=search) |
                Q(patient__last_name__icontains=search) |
                Q(patient__phone__icontains=search) |
                Q(patient__uhid__icontains=search)
            ).distinct()

        # Filter by patient_id
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)

        # Filter by date range (created_after/created_before on created_at)
        created_after = self.request.query_params.get('created_after')
        if created_after:
            qs = qs.filter(created_at__date__gte=created_after)
        created_before = self.request.query_params.get('created_before')
        if created_before:
            qs = qs.filter(created_at__date__lte=created_before)

        # Filter by branch from query params (Owner only)
        branch_id = self.request.query_params.get('branch')
        if branch_id and user.role == UserRole.OWNER:
            qs = qs.filter(patient__branch_id=branch_id)

        # Ordering (default is -created_at)
        ordering = self.request.query_params.get('ordering')
        if ordering:
            valid_orderings = ('created_at', '-created_at')
            if ordering in valid_orderings:
                qs = qs.order_by(ordering)
        else:
            qs = qs.order_by('-created_at')

        return qs

    def perform_create(self, serializer):
        # Only doctors can create prescriptions
        if self.request.user.role != UserRole.DOCTOR:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only doctors can create prescriptions.')
        serializer.save(doctor=self.request.user)


class PrescriptionDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.PATIENT:
            from patients.models import Patient
            patient = Patient.objects.filter(phone=user.phone, is_active=True).first()
            if patient:
                return Prescription.objects.filter(patient=patient)
            return Prescription.objects.none()
            
        # Scoped to branch for doctor/receptionist, and all for owner
        if user.role == UserRole.OWNER:
            from branches.models import Branch
            ids = Branch.objects.filter(hospital__owner=user).values_list('id', flat=True)
            return Prescription.objects.filter(patient__branch_id__in=ids)
        return Prescription.objects.filter(patient__branch=user.branch)

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
