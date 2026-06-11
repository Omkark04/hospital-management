from django.urls import path
from .views import (
    EmployeeListCreateView, EmployeeDetailView, MyEmployeeProfileView,
    AttendanceListView, MyAttendanceView,
    LeaveListCreateView, LeaveDetailView, LeaveReviewView,
    CloseDayView, PayrollSlipListView, PayrollSlipDetailView,
    BranchOvertimeConfigListCreateView, BranchOvertimeConfigDetailView,
    OvertimeRecordListView, OvertimeRecordReviewView
)
from .views_attendance_qr import GenerateQRTokenView, ScanQRAttendanceView

app_name = 'hr'

urlpatterns = [
    # Employees — Owner and Doctor only
    path('employees/', EmployeeListCreateView.as_view(), name='employee-list-create'),
    path('employees/<int:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
    path('employees/me/', MyEmployeeProfileView.as_view(), name='my-employee-profile'),

    # Attendance — READ ONLY (Owner = all, Doctor = branch)
    # All actual marking is done via QR scan below
    path('attendance/', AttendanceListView.as_view(), name='attendance-list'),
    path('attendance/me/', MyAttendanceView.as_view(), name='my-attendance'),

    # QR Attendance — kiosk generates token, employee scans
    path('attendance/qr-token/', GenerateQRTokenView.as_view(), name='attendance-qr-token'),
    path('attendance/scan/', ScanQRAttendanceView.as_view(), name='attendance-scan'),

    # Leave Applications
    path('leaves/', LeaveListCreateView.as_view(), name='leave-list-create'),
    path('leaves/<int:pk>/', LeaveDetailView.as_view(), name='leave-detail'),
    path('leaves/<int:pk>/review/', LeaveReviewView.as_view(), name='leave-review'),

    # Day Closing & Payroll
    path('attendance/close-day/', CloseDayView.as_view(), name='close-day'),
    path('payroll/', PayrollSlipListView.as_view(), name='payroll-list'),
    path('payroll/<int:pk>/', PayrollSlipDetailView.as_view(), name='payroll-detail'),

    # Overtime Config & Approvals
    path('overtime/configs/', BranchOvertimeConfigListCreateView.as_view(), name='overtime-config-list-create'),
    path('overtime/configs/<int:pk>/', BranchOvertimeConfigDetailView.as_view(), name='overtime-config-detail'),
    path('overtime/records/', OvertimeRecordListView.as_view(), name='overtime-record-list'),
    path('overtime/records/<int:pk>/review/', OvertimeRecordReviewView.as_view(), name='overtime-record-review'),
]
