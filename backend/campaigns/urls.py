from django.urls import path
from .views import (
    CampaignListCreateView, CampaignDetailView,
    CampaignManagerAssignView, MyCampaignsView,
    CampaignPatientListCreateView, CampaignAttendanceListCreateView,
    CampaignSaleListCreateView,
)

app_name = 'campaigns'

urlpatterns = [
    path('', CampaignListCreateView.as_view(), name='campaign-list-create'),
    path('<int:pk>/', CampaignDetailView.as_view(), name='campaign-detail'),
    path('assign-manager/', CampaignManagerAssignView.as_view(), name='assign-manager'),
    path('my-campaigns/', MyCampaignsView.as_view(), name='my-campaigns'),
    path('<int:campaign_id>/patients/', CampaignPatientListCreateView.as_view(), name='campaign-patients'),
    path('<int:campaign_id>/attendance/', CampaignAttendanceListCreateView.as_view(), name='campaign-attendance'),
    path('<int:campaign_id>/sales/', CampaignSaleListCreateView.as_view(), name='campaign-sales'),
]
