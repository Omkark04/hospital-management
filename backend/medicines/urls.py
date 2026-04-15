from django.urls import path
from .views import (
    MedicineListCreateView, MedicineDetailView,
    PrescriptionListCreateView, PrescriptionDetailView,
)

app_name = 'medicines'

urlpatterns = [
    path('', MedicineListCreateView.as_view(), name='medicine-list-create'),
    path('<int:pk>/', MedicineDetailView.as_view(), name='medicine-detail'),
    path('prescriptions/', PrescriptionListCreateView.as_view(), name='prescription-list-create'),
    path('prescriptions/<int:pk>/', PrescriptionDetailView.as_view(), name='prescription-detail'),
]
