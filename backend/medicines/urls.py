from django.urls import path
from .views import (
    MedicineListCreateView, MedicineDetailView,
    PrescriptionListCreateView, PrescriptionDetailView,
    LowStockMedicineView, MedicineStockMovementView, MedicineLedgerListView,
)

app_name = 'medicines'

urlpatterns = [
    path('', MedicineListCreateView.as_view(), name='medicine-list-create'),
    path('<int:pk>/', MedicineDetailView.as_view(), name='medicine-detail'),
    path('low-stock/', LowStockMedicineView.as_view(), name='medicine-low-stock'),
    path('stock-movement/', MedicineStockMovementView.as_view(), name='medicine-stock-movement'),
    path('ledger/', MedicineLedgerListView.as_view(), name='medicine-ledger'),
    path('prescriptions/', PrescriptionListCreateView.as_view(), name='prescription-list-create'),
    path('prescriptions/<int:pk>/', PrescriptionDetailView.as_view(), name='prescription-detail'),
]
