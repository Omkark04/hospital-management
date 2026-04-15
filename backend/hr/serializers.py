from rest_framework import serializers
from .models import Employee, Attendance, LeaveApplication


class EmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Employee
        fields = (
            'id', 'user', 'full_name', 'username', 'phone', 'email', 'role',
            'branch', 'branch_name', 'designation', 'salary',
            'date_of_joining', 'is_active', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    marked_by_name = serializers.CharField(source='marked_by.get_full_name', read_only=True)

    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ('id', 'created_at')


class LeaveApplicationSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True, allow_null=True)
    total_days = serializers.IntegerField(read_only=True)

    class Meta:
        model = LeaveApplication
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'status', 'reviewed_by', 'review_notes')


class LeaveReviewSerializer(serializers.ModelSerializer):
    """For Receptionist/Owner to approve or reject leave."""
    class Meta:
        model = LeaveApplication
        fields = ('status', 'review_notes')
