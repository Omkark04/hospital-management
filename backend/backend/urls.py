"""
Root URL configuration for HMS backend.
All app URLs are namespaced under /api/
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),

    # JWT token refresh (shared across all roles)
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Auth (login, logout, profile, password)
    path('api/auth/', include('users.urls', namespace='users')),

    # Hospital & Branch management
    path('api/branches/', include('branches.urls', namespace='branches')),

    # Patient management & appointments
    path('api/patients/', include('patients.urls', namespace='patients')),

    # Medicine catalog & prescriptions
    path('api/medicines/', include('medicines.urls', namespace='medicines')),

    # Billing & payments
    path('api/billing/', include('billing.urls', namespace='billing')),

    # HR — employees, attendance, leave
    path('api/hr/', include('hr.urls', namespace='hr')),

    # Campaigns
    path('api/campaigns/', include('campaigns.urls', namespace='campaigns')),

    # Products & enquiries
    path('api/products/', include('products.urls', namespace='products')),

    # Referral form
    path('api/referrals/', include('referrals.urls', namespace='referrals')),

    # Notifications
    path('api/notifications/', include('notifications.urls', namespace='notifications')),
]
