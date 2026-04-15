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
    StaffCreateSerializer, StaffListSerializer,
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
        user = self.request.user
        qs = CustomUser.objects.exclude(role=UserRole.PATIENT)
        if user.role == UserRole.OWNER:
            # Owner sees all staff in their branches
            from branches.models import Branch
            branch_ids = Branch.objects.filter(hospital__owner=user).values_list('id', flat=True)
            qs = qs.filter(branch_id__in=branch_ids)
        else:
            # Receptionist sees staff in own branch only
            qs = qs.filter(branch=user.branch)
        # Optional filter by role
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class StaffDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StaffListSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    queryset = CustomUser.objects.exclude(role=UserRole.PATIENT)

    def destroy(self, request, *args, **kwargs):
        """Soft delete — deactivate instead of hard delete."""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response({'detail': 'Staff member deactivated.'}, status=status.HTTP_200_OK)
