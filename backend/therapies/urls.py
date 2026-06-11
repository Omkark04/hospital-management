from django.urls import path
from .views import (
    TherapyListCreateView,
    TherapyDetailView,
    PatientTherapyAssignView,
    PatientTherapyListView,
    PatientTherapyDetailView
)

app_name = 'therapies'

urlpatterns = [
    path('', TherapyListCreateView.as_view(), name='therapy-list-create'),
    path('<int:pk>/', TherapyDetailView.as_view(), name='therapy-detail'),
    path('assign/', PatientTherapyAssignView.as_view(), name='patient-therapy-assign'),
    path('patient/<int:patient_id>/', PatientTherapyListView.as_view(), name='patient-therapy-list'),
    path('assigned/<int:pk>/', PatientTherapyDetailView.as_view(), name='patient-therapy-detail'),
]
