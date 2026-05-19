from rest_framework import generics, status
from django.db.models import F
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsOwner, IsOwnerOrDoctorOrReceptionist
from users.models import UserRole
from .models import Product, ProductCategory, ProductEnquiry
from .serializers import (
    ProductSerializer, ProductPublicSerializer,
    ProductCategorySerializer,
    ProductEnquirySerializer, EnquiryStatusUpdateSerializer,
    ProductStockLedgerSerializer
)


def get_owner(user):
    if user.role == UserRole.OWNER:
        return user
    if hasattr(user, 'branch') and user.branch:
        return user.branch.hospital.owner
    return None

# ─────────────────── Categories ──────────────────────────────
class ProductCategoryListCreateView(generics.ListCreateAPIView):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    permission_classes = [AllowAny]  # Public can see categories

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsOwner()]
        return [AllowAny()]


class ProductCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    permission_classes = [IsAuthenticated, IsOwner]


# ─────────────────── Public Product Listing ───────────────────
class PublicProductListView(generics.ListAPIView):
    serializer_class = ProductPublicSerializer
    permission_classes = []
    authentication_classes = []

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True, for_public=True)
        category = self.request.query_params.get('category')
        if category:
            if category.isdigit():
                qs = qs.filter(category_id=category)
            else:
                qs = qs.filter(category__name__iexact=category)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)
        return qs


class PublicProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductPublicSerializer
    permission_classes = []
    authentication_classes = []
    queryset = Product.objects.filter(is_active=True, for_public=True)


class PrescriptionProductListView(generics.ListAPIView):
    """View for Doctors to see products available for patients."""
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True, for_patients=True)
        
        # Allow filtering by branch from query params
        branch_id = self.request.query_params.get('branch')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        elif self.request.user.role != UserRole.OWNER and hasattr(self.request.user, 'branch'):
            qs = qs.filter(branch=self.request.user.branch)
        return qs


# ─────────────────── Owner Product Management ─────────────────
class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def get_queryset(self):
        owner = get_owner(self.request.user)
        if self.request.user.role == UserRole.OWNER:
            qs = Product.objects.filter(owner=owner, for_public=True)
        else:
            qs = Product.objects.filter(owner=owner, branch=getattr(self.request.user, 'branch', None), for_public=False)
            
        branch_id = self.request.query_params.get('branch')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        return qs

    def perform_create(self, serializer):
        owner = get_owner(self.request.user)
        if self.request.user.role != UserRole.OWNER:
            serializer.save(
                owner=owner, 
                branch=getattr(self.request.user, 'branch', None),
                for_public=False, 
                for_patients=True
            )
        else:
            serializer.save(owner=owner, for_patients=False)

class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def get_queryset(self):
        owner = get_owner(self.request.user)
        qs = Product.objects.filter(owner=owner)
        
        if self.request.user.role != UserRole.OWNER:
            qs = qs.filter(branch=getattr(self.request.user, 'branch', None), for_public=False)
        return qs

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response({'detail': 'Product deactivated.'}, status=status.HTTP_200_OK)


# ─────────────────── Product Enquiries ────────────────────────
class ProductEnquiryCreateView(generics.CreateAPIView):
    """Public endpoint — anyone can submit an enquiry."""
    serializer_class = ProductEnquirySerializer
    permission_classes = []
    authentication_classes = []


class ProductEnquiryListView(generics.ListAPIView):
    """Owner views all enquiries for their products."""
    serializer_class = ProductEnquirySerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        qs = ProductEnquiry.objects.filter(product__owner=self.request.user)
        enc_status = self.request.query_params.get('status')
        if enc_status:
            qs = qs.filter(status=enc_status)
        return qs


class EnquiryStatusUpdateView(APIView):
    """Owner updates enquiry status (contacted / closed)."""
    permission_classes = [IsAuthenticated, IsOwner]

    def patch(self, request, pk):
        try:
            enquiry = ProductEnquiry.objects.get(pk=pk, product__owner=request.user)
        except ProductEnquiry.DoesNotExist:
            return Response({'detail': 'Enquiry not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = EnquiryStatusUpdateSerializer(enquiry, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProductEnquirySerializer(enquiry).data)

# ─────────────────── Inventory & Ledger ───────────────────
class LowStockProductView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def get_queryset(self):
        owner = get_owner(self.request.user)
        qs = Product.objects.filter(owner=owner, is_active=True, stock_quantity__lte=F('low_stock_threshold'))
        if self.request.user.role != UserRole.OWNER:
            qs = qs.filter(branch=getattr(self.request.user, 'branch', None), for_public=False)
        return qs

class ProductStockMovementView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def post(self, request):
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 0))
        movement_type = request.data.get('movement_type') # 'in', 'out', 'adjustment'
        reference = request.data.get('reference', '')
        notes = request.data.get('notes', '')

        if quantity <= 0:
            return Response({'detail': 'Quantity must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            owner = get_owner(request.user)
            product = Product.objects.get(id=product_id, owner=owner)
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        if movement_type == 'out' and product.stock_quantity < quantity:
            return Response({'detail': 'Insufficient stock.'}, status=status.HTTP_400_BAD_REQUEST)

        if movement_type == 'in':
            product.stock_quantity += quantity
        elif movement_type == 'out':
            product.stock_quantity -= quantity
        elif movement_type == 'adjustment':
            product.stock_quantity = quantity
            quantity = abs(product.stock_quantity - quantity) or quantity
        
        product.save()

        from .models import ProductStockLedger
        branch = getattr(request.user, 'branch', None)
        ProductStockLedger.objects.create(
            product=product,
            branch=branch,
            movement_type=movement_type,
            quantity=quantity,
            reference=reference,
            notes=notes,
            performed_by=request.user
        )
        return Response({'detail': 'Stock updated.', 'current_stock': product.stock_quantity})

class ProductLedgerListView(generics.ListAPIView):
    serializer_class = ProductStockLedgerSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def get_queryset(self):
        from .models import ProductStockLedger
        owner = get_owner(self.request.user)
        qs = ProductStockLedger.objects.filter(product__owner=owner)
        product_id = self.request.query_params.get('product')
        if product_id:
            qs = qs.filter(product_id=product_id)
        return qs
