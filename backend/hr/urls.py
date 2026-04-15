from django.urls import path
from .views import (
    EmployeeListCreateView, EmployeeDetailView, MyEmployeeProfileView,
    AttendanceListCreateView, AttendanceDetailView, MyAttendanceView,
    LeaveListCreateView, LeaveDetailView, LeaveReviewView,
)

app_name = 'hr'

urlpatterns = [
    # Employees
    path('employees/', EmployeeListCreateView.as_view(), name='employee-list-create'),
    path('employees/<int:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
    path('employees/me/', MyEmployeeProfileView.as_view(), name='my-employee-profile'),

    # Attendance
    path('attendance/', AttendanceListCreateView.as_view(), name='attendance-list-create'),
    path('attendance/<int:pk>/', AttendanceDetailView.as_view(), name='attendance-detail'),
    path('attendance/me/', MyAttendanceView.as_view(), name='my-attendance'),

    # Leave
    path('leaves/', LeaveListCreateView.as_view(), name='leave-list-create'),
    path('leaves/<int:pk>/', LeaveDetailView.as_view(), name='leave-detail'),
    path('leaves/<int:pk>/review/', LeaveReviewView.as_view(), name='leave-review'),
]
