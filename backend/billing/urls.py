from django.urls import path
from .views import BillListCreateView, BillDetailView, PaymentUpdateView, MyBillsView

app_name = 'billing'

urlpatterns = [
    path('', BillListCreateView.as_view(), name='bill-list-create'),
    path('<int:pk>/', BillDetailView.as_view(), name='bill-detail'),
    path('<int:pk>/pay/', PaymentUpdateView.as_view(), name='payment-update'),
    path('my-bills/', MyBillsView.as_view(), name='my-bills'),
]
