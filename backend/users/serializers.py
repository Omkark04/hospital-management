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

    class Meta:
        model = CustomUser
        fields = (
            'username', 'password', 'confirm_password',
            'first_name', 'last_name', 'email', 'phone', 'role', 'branch'
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

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user


class StaffListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    branch_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'full_name', 'email', 'phone', 'role', 'branch', 'branch_name', 'is_active')

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_branch_name(self, obj):
        return obj.branch.name if obj.branch else None


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
