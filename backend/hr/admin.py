from django.contrib import admin
from .models import Employee, Attendance, LeaveApplication


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('user', 'designation', 'branch', 'salary', 'is_active', 'date_of_joining')
    list_filter = ('is_active', 'branch')
    search_fields = ('user__first_name', 'user__last_name', 'designation')


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date', 'status', 'check_in', 'check_out', 'marked_by')
    list_filter = ('status', 'date', 'employee__branch')
    search_fields = ('employee__user__first_name',)


@admin.register(LeaveApplication)
class LeaveApplicationAdmin(admin.ModelAdmin):
    list_display = ('employee', 'leave_type', 'from_date', 'to_date', 'status', 'reviewed_by')
    list_filter = ('status', 'leave_type')
    search_fields = ('employee__user__first_name',)
