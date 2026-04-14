"""
Django project root URL configuration.
All app URLs are versioned under /api/v1/.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("api.v1.urls")),
]
