from django.urls import path
from .views import (
    BillListCreateView, BillDetailView, PaymentUpdateView, 
    MyBillsView, BillPDFView
)

app_name = 'billing'

urlpatterns = [
    path('', BillListCreateView.as_view(), name='bill-list-create'),
    path('<int:pk>/', BillDetailView.as_view(), name='bill-detail'),
    path('<int:pk>/pay/', PaymentUpdateView.as_view(), name='payment-update'),
    path('<int:pk>/pdf/', BillPDFView.as_view(), name='bill-pdf'),
    path('my-bills/', MyBillsView.as_view(), name='my-bills'),
]
