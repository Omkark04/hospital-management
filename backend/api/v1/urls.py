"""
api/v1/urls.py — Aggregates all app URLs under /api/v1/
"""
from django.urls import path, include

urlpatterns = [
    path("auth/", include("apps.authentication.urls")),
    path("branches/", include("apps.branches.urls")),
    path("patients/", include("apps.patients.urls")),
    path("appointments/", include("apps.appointments.urls")),
    path("billing/", include("apps.billing.urls")),
    path("hr/", include("apps.hr.urls")),
    path("products/", include("apps.products.urls")),
    path("campaigns/", include("apps.campaigns.urls")),
    path("referrals/", include("apps.referrals.urls")),
    path("notifications/", include("apps.notifications.urls")),
    path("public/", include("apps.public.urls")),
    path("users/", include("apps.users.urls")),
]
