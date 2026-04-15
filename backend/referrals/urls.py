from django.urls import path
from .views import ReferralCreateView, ReferralListView, ReferralStatusUpdateView

app_name = 'referrals'

urlpatterns = [
    path('', ReferralCreateView.as_view(), name='referral-create'),
    path('list/', ReferralListView.as_view(), name='referral-list'),
    path('<int:pk>/status/', ReferralStatusUpdateView.as_view(), name='referral-status'),
]
