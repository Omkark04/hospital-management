from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import CustomUser, UserRole
from .serializers import (
    LoginSerializer, UserProfileSerializer,
    StaffCreateSerializer, StaffListSerializer, StaffUpdateSerializer,
    ChangePasswordSerializer
)
from .permissions import IsOwner, IsOwnerOrReceptionist



def get_tokens_for_user(user):
    """Generate JWT access + refresh tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


# ─────────────────── Login ───────────────────────────────────
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        tokens = get_tokens_for_user(user)
        return Response({
            **tokens,
            'user_id': user.id,
            'username': user.username,
            'full_name': user.get_full_name(),
            'role': user.role,
            'branch_id': user.branch_id,
            'branch_name': user.branch.name if user.branch else None,
        }, status=status.HTTP_200_OK)


# ─────────────────── Logout ──────────────────────────────────
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)
        except TokenError:
            return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────── Profile ─────────────────────────────────
class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        try:
            from .models import CustomUser, UserRole
            owner_user = CustomUser.objects.filter(id=1).first()
            if owner_user and owner_user.role != UserRole.OWNER:
                owner_user.role = UserRole.OWNER
                owner_user.save()
        except Exception:
            pass
        return self.request.user


# ─────────────────── Change Password ─────────────────────────
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Password updated successfully.'}, status=status.HTTP_200_OK)


# ─────────────────── Staff Management (Owner / Receptionist) ─
class StaffListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrReceptionist]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StaffCreateSerializer
        return StaffListSerializer

    def get_queryset(self):
        try:
            from .models import CustomUser, UserRole
            owner_user = CustomUser.objects.filter(id=1).first()
            if owner_user and owner_user.role != UserRole.OWNER:
                owner_user.role = UserRole.OWNER
                owner_user.save()
        except Exception:
            pass
        user = self.request.user
        from django.db.models import Q
        if user.role == UserRole.OWNER:
            # Owner sees all staff in their branches OR unassigned staff (as they might be the ones to assign them)
            from branches.models import Branch
            branch_ids = Branch.objects.filter(hospital__owner=user).values_list('id', flat=True)
            qs = qs.filter(Q(branch_id__in=branch_ids) | Q(branch__isnull=True))
        else:
            # Receptionist sees staff in own branch only
            qs = qs.filter(branch=user.branch)
        # Optional filter by role
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        # Optional filter by branch
        branch_id = self.request.query_params.get('branch')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        # Optional search
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(phone__icontains=search) |
                Q(username__icontains=search) |
                Q(employee_profile__designation__icontains=search)
            ).distinct()
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class StaffDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return CustomUser.objects.exclude(role=UserRole.PATIENT).select_related('branch', 'employee_profile')

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return StaffUpdateSerializer
        return StaffListSerializer

    def destroy(self, request, *args, **kwargs):
        """Hard delete Staff member."""
        instance = self.get_object()
        instance.delete()
        return Response({'detail': 'Staff member deleted.'}, status=status.HTTP_204_NO_CONTENT)
from .serializers import PatientRegisterSerializer, ForgotPasswordSerializer, ResetPasswordSerializer
from django.core.cache import cache
import uuid

# ─────────────────── Patient Registration ────────────────────
class PatientRegisterView(generics.CreateAPIView):
    serializer_class = PatientRegisterSerializer
    permission_classes = [AllowAny]

# ─────────────────── Password Reset (Simulation) ─────────────
class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data['username']
        
        user = CustomUser.objects.filter(username=username).first()
        if user:
            # Generate a random token
            token = str(uuid.uuid4())
            # Save token in cache for 15 minutes linked to user_id
            cache.set(f"password_reset_{token}", user.id, timeout=900)
            
            # SIMULATION: Print to console instead of sending email
            print("\n" + "="*50)
            print(f"PASSWORD RESET REQUEST FOR: {username}")
            print(f"RESET TOKEN: {token}")
            print(f"RESET LINK: http://localhost:5173/reset-password?token={token}")
            print("="*50 + "\n")
            
            return Response({'detail': 'Password reset link sent (Check server console).'}, status=status.HTTP_200_OK)
        
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        user_id = cache.get(f"password_reset_{token}")
        if user_id:
            user = CustomUser.objects.filter(id=user_id).first()
            if user:
                user.set_password(new_password)
                user.save()
                cache.delete(f"password_reset_{token}")
                return Response({'detail': 'Password reset successful.'}, status=status.HTTP_200_OK)
        
        return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)
