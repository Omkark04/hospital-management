from django.urls import path
from .views import (
    LoginView, LogoutView, ProfileView,
    ChangePasswordView, StaffListCreateView, StaffDetailView,
    PatientRegisterView, ForgotPasswordView, ResetPasswordView
)

app_name = 'users'

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('staff/', StaffListCreateView.as_view(), name='staff-list-create'),
    path('staff/<int:pk>/', StaffDetailView.as_view(), name='staff-detail'),
    path('register/', PatientRegisterView.as_view(), name='register'),
    path('password-reset/', ForgotPasswordView.as_view(), name='password-reset'),
    path('password-reset-confirm/', ResetPasswordView.as_view(), name='password-reset-confirm'),
]
