from django.urls import path
from .views import OwnerSummaryView, DoctorSummaryView

app_name = 'reports'

urlpatterns = [
    path('owner-summary/', OwnerSummaryView.as_view(), name='owner-summary'),
    path('doctor-summary/', DoctorSummaryView.as_view(), name='doctor-summary'),
]
