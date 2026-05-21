from django.urls import path
from .views import (
    HospitalListCreateView, HospitalDetailView,
    BranchListCreateView, BranchDetailView, BranchStatsView,
    BranchServiceListCreateView, BranchServiceDetailView,
    PublicBranchListView, ResolveMapLinkView, BranchSlotCapacityView,
)

app_name = 'branches'

urlpatterns = [
    # Hospitals
    path('hospitals/', HospitalListCreateView.as_view(), name='hospital-list-create'),
    path('hospitals/<int:pk>/', HospitalDetailView.as_view(), name='hospital-detail'),

    # Branches
    path('', BranchListCreateView.as_view(), name='branch-list-create'),
    path('stats/', BranchStatsView.as_view(), name='branch-stats'),
    path('resolve-map-link/', ResolveMapLinkView.as_view(), name='resolve-map-link'),
    path('slot-capacity/', BranchSlotCapacityView.as_view(), name='branch-slot-capacity'),
    path('<int:pk>/', BranchDetailView.as_view(), name='branch-detail'),

    # Branch services
    path('<int:branch_id>/services/', BranchServiceListCreateView.as_view(), name='service-list-create'),
    path('services/<int:pk>/', BranchServiceDetailView.as_view(), name='service-detail'),

    # Public
    path('public/', PublicBranchListView.as_view(), name='public-branch-list'),
]
