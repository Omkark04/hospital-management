from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import CustomUser, UserRole


# ─────────────────── Login ───────────────────────────────────
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs['username'], password=attrs['password'])
        if not user:
            raise serializers.ValidationError('Invalid username or password.')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled. Contact administrator.')
        attrs['user'] = user
        return attrs


class TokenResponseSerializer(serializers.Serializer):
    """Serializer for returning JWT token pair + user info."""
    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(read_only=True)
    user_id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    role = serializers.CharField(read_only=True)
    branch_id = serializers.IntegerField(read_only=True, allow_null=True)
    branch_name = serializers.CharField(read_only=True, allow_null=True)


# ─────────────────── Profile ─────────────────────────────────
class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    branch_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'role', 'branch', 'branch_name', 'date_joined'
        )
        read_only_fields = ('id', 'username', 'role', 'branch', 'date_joined')

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_branch_name(self, obj):
        return obj.branch.name if obj.branch else None


# ─────────────────── Staff Registration ──────────────────────
class StaffCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)
    # HR profile fields (write-only; stored on Employee model)
    designation = serializers.CharField(required=False, allow_blank=True, default='')
    salary_type = serializers.ChoiceField(choices=['daily', 'monthly'], required=False, default='monthly')
    salary = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    date_of_joining = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = CustomUser
        fields = (
            'username', 'password', 'confirm_password',
            'first_name', 'last_name', 'email', 'phone', 'role', 'branch',
            'designation', 'salary_type', 'salary', 'date_of_joining',
        )

    def validate_role(self, value):
        # Only Owner can register Doctors; Receptionist can register Employees
        request = self.context.get('request')
        if request and request.user.role == UserRole.RECEPTIONIST:
            if value not in [UserRole.EMPLOYEE]:
                raise serializers.ValidationError('Receptionists can only register Employees.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        from .utils import send_registration_email
        from hr.models import Employee
        # Pop HR fields before creating the user
        designation = validated_data.pop('designation', '')
        salary_type = validated_data.pop('salary_type', 'monthly')
        salary = validated_data.pop('salary', None)
        date_of_joining = validated_data.pop('date_of_joining', None)

        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()

        # Create / update Employee Profile for HR tracking
        if user.role != UserRole.PATIENT and user.branch:
            Employee.objects.update_or_create(
                user=user,
                defaults={
                    'branch': user.branch,
                    'designation': designation or user.role.title(),
                    'salary_type': salary_type,
                    'salary': salary,
                    'date_of_joining': date_of_joining,
                }
            )

        # Send email with credentials
        send_registration_email(user, password)

        return user


class StaffListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    branch_name = serializers.SerializerMethodField()
    # HR profile fields (read-only — sourced from Employee model)
    employee_id = serializers.SerializerMethodField()
    designation = serializers.SerializerMethodField()
    salary = serializers.SerializerMethodField()
    salary_type = serializers.SerializerMethodField()
    date_of_joining = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'first_name', 'last_name', 'full_name', 'email', 'phone', 'role',
            'branch', 'branch_name', 'is_active',
            'employee_id', 'designation', 'salary', 'salary_type', 'date_of_joining',
        )

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_branch_name(self, obj):
        return obj.branch.name if obj.branch else None

    def _emp(self, obj):
        """Safe access to employee_profile."""
        try:
            return obj.employee_profile
        except Exception:
            return None

    def get_employee_id(self, obj):
        emp = self._emp(obj)
        return emp.id if emp else None

    def get_designation(self, obj):
        emp = self._emp(obj)
        return emp.designation if emp else None

    def get_salary(self, obj):
        emp = self._emp(obj)
        return str(emp.salary) if emp and emp.salary is not None else None

    def get_salary_type(self, obj):
        emp = self._emp(obj)
        return emp.salary_type if emp else None

    def get_date_of_joining(self, obj):
        emp = self._emp(obj)
        return emp.date_of_joining if emp else None


class StaffUpdateSerializer(serializers.ModelSerializer):
    """Used for PUT/PATCH on /auth/staff/<id>/ — updates user fields and HR profile."""
    designation = serializers.CharField(required=False, allow_blank=True)
    salary_type = serializers.ChoiceField(choices=['daily', 'monthly'], required=False)
    salary = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    date_of_joining = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = CustomUser
        fields = ('first_name', 'last_name', 'email', 'phone', 'role', 'branch', 'is_active',
                  'designation', 'salary_type', 'salary', 'date_of_joining')

    @transaction.atomic
    def update(self, instance, validated_data):
        from hr.models import Employee
        # Pop HR fields
        designation = validated_data.pop('designation', None)
        salary_type = validated_data.pop('salary_type', None)
        salary = validated_data.pop('salary', None)
        date_of_joining = validated_data.pop('date_of_joining', None)

        # Update the User record
        instance = super().update(instance, validated_data)

        # Update or create Employee profile
        if instance.role != UserRole.PATIENT and instance.branch:
            emp, _ = Employee.objects.get_or_create(
                user=instance,
                defaults={'branch': instance.branch, 'designation': instance.role.title()}
            )
            if designation is not None:
                emp.designation = designation
            if salary_type is not None:
                emp.salary_type = salary_type
            if salary is not None:
                emp.salary = salary
            if date_of_joining is not None:
                emp.date_of_joining = date_of_joining
            # Keep branch in sync with user
            emp.branch = instance.branch
            emp.save()

        return instance


# ─────────────────── Change Password ─────────────────────────
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)
    confirm_new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_new_password']:
            raise serializers.ValidationError({'confirm_new_password': 'Passwords do not match.'})
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value
# ─────────────────── Patient Registration ────────────────────
class PatientRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ('username', 'password', 'confirm_password', 'first_name', 'last_name', 'email', 'phone')

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.role = UserRole.PATIENT
        user.set_password(password)
        user.save()

        # Create corresponding Patient record
        from patients.models import Patient
        from branches.models import Branch
        default_branch = Branch.objects.first()
        if default_branch:
            Patient.objects.create(
                branch=default_branch,
                registered_by=user,
                first_name=user.first_name,
                last_name=user.last_name,
                phone=user.phone,
                email=user.email or ""
            )
        return user


# ─────────────────── Password Reset ──────────────────────────
class ForgotPasswordSerializer(serializers.Serializer):
    username = serializers.CharField()


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs
