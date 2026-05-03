from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsOwner
from .models import Product, ProductCategory, ProductEnquiry
from .serializers import (
    ProductSerializer, ProductPublicSerializer,
    ProductCategorySerializer,
    ProductEnquirySerializer, EnquiryStatusUpdateSerializer
)



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
        return Product.objects.filter(is_active=True, for_patients=True)


# ─────────────────── Owner Product Management ─────────────────
class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Product.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Product.objects.filter(owner=self.request.user)

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
