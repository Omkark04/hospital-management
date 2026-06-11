from django.db import transaction
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Employee, Attendance, LeaveApplication

User = get_user_model()


from branches.models import Branch

class EmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    # Write-only fields for creating new employee users
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    phone_number = serializers.CharField(write_only=True, required=False)
    raw_email = serializers.CharField(write_only=True, required=False, allow_blank=True)
    raw_username = serializers.CharField(write_only=True, required=False)
    raw_password = serializers.CharField(write_only=True, required=False)
    role_type = serializers.CharField(write_only=True, required=False)

    user = serializers.PrimaryKeyRelatedField(read_only=True)
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all(), required=False, allow_null=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Employee
        fields = (
            'id', 'user', 'full_name', 'username', 'phone', 'email', 'role',
            'branch', 'branch_name', 'designation', 'salary_type', 'salary',
            'date_of_joining', 'is_active', 'created_at',
            'first_name', 'last_name', 'phone_number', 'raw_email', 'raw_username', 'raw_password', 'role_type'
        )
        read_only_fields = ('id', 'created_at')

    def validate(self, attrs):
        from users.models import UserRole
        request = self.context.get('request')
        if request:
            if request.user.role == UserRole.OWNER:
                if not attrs.get('branch') and not (self.instance and self.instance.branch):
                    raise serializers.ValidationError({'branch': 'A branch must be assigned.'})
            else:
                if not request.user.branch:
                    raise serializers.ValidationError({'non_field_errors': 'Your account is not assigned to any branch. Please contact your administrator.'})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        # Pop write-only fields
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', '')
        phone = validated_data.pop('phone_number', '')
        raw_email = validated_data.pop('raw_email', '')
        username = validated_data.pop('raw_username', None)
        password = validated_data.pop('raw_password', None)
        role_type = validated_data.pop('role_type', 'employee')
        
        if role_type not in ['receptionist', 'employee']:
            role_type = 'employee'
        
        if first_name and username and password:
            # Create user
            user = User.objects.create_user(
                username=username,
                password=password,
                first_name=first_name,
                last_name=last_name,
                email=raw_email if raw_email else None,
                phone=phone,
                role=role_type
            )
            validated_data['user'] = user

            # Send unified registration credential email notification
            from users.utils import send_registration_email
            send_registration_email(user, password)
        
        return super().create(validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        # Pop write-only fields during updates so they don't break ModelSerializer update
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        phone = validated_data.pop('phone_number', None)
        raw_email = validated_data.pop('raw_email', None)
        validated_data.pop('raw_username', None)
        validated_data.pop('raw_password', None)
        validated_data.pop('role_type', None)

        user = instance.user
        user_updated = False
        if first_name is not None:
            user.first_name = first_name
            user_updated = True
        if last_name is not None:
            user.last_name = last_name
            user_updated = True
        if phone is not None:
            user.phone = phone
            user_updated = True
        if raw_email is not None:
            user.email = raw_email if raw_email else None
            user_updated = True
        
        if user_updated:
            user.save()

        return super().update(instance, validated_data)


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    employee_designation = serializers.CharField(source='employee.designation', read_only=True)
    marked_by_name = serializers.CharField(source='marked_by.get_full_name', read_only=True)

    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ('id', 'created_at')


class LeaveApplicationSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True, allow_null=True)
    total_days = serializers.DecimalField(max_digits=5, decimal_places=1, read_only=True)

    class Meta:
        model = LeaveApplication
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'status', 'reviewed_by', 'review_notes')


class LeaveReviewSerializer(serializers.ModelSerializer):
    """For Receptionist/Owner to approve or reject leave."""
    class Meta:
        model = LeaveApplication
        fields = ('status', 'review_notes')


from .models import PayrollSlip, BranchOvertimeConfig, OvertimeRecord

class PayrollSlipSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    designation = serializers.CharField(source='employee.designation', read_only=True)
    branch_name = serializers.CharField(source='employee.branch.name', read_only=True)

    class Meta:
        model = PayrollSlip
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class BranchOvertimeConfigSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = BranchOvertimeConfig
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class OvertimeRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    designation = serializers.CharField(source='employee.designation', read_only=True)
    branch_name = serializers.CharField(source='employee.branch.name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)

    class Meta:
        model = OvertimeRecord
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'approved_by')
