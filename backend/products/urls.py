from django.urls import path
from .views import (
    PublicProductListView, PublicProductDetailView,
    ProductListCreateView, ProductDetailView,
    ProductEnquiryCreateView, ProductEnquiryListView, EnquiryStatusUpdateView,
)

app_name = 'products'

urlpatterns = [
    # Public
    path('public/', PublicProductListView.as_view(), name='public-product-list'),
    path('public/<int:pk>/', PublicProductDetailView.as_view(), name='public-product-detail'),
    path('enquiry/', ProductEnquiryCreateView.as_view(), name='enquiry-create'),

    # Owner
    path('', ProductListCreateView.as_view(), name='product-list-create'),
    path('<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('enquiries/', ProductEnquiryListView.as_view(), name='enquiry-list'),
    path('enquiries/<int:pk>/status/', EnquiryStatusUpdateView.as_view(), name='enquiry-status'),
]
