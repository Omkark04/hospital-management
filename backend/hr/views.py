from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsOwnerOrReceptionist, IsEmployee, IsOwner
from users.models import UserRole
from .models import Employee, Attendance, LeaveApplication
from .serializers import EmployeeSerializer, AttendanceSerializer, LeaveApplicationSerializer, LeaveReviewSerializer


def branch_qs(qs, user):
    if user.role == UserRole.OWNER:
        from branches.models import Branch
        ids = Branch.objects.filter(hospital__owner=user).values_list('id', flat=True)
        return qs.filter(branch_id__in=ids)
    return qs.filter(branch=user.branch)


# ─────────────────── Employees ───────────────────────────────
class EmployeeListCreateView(generics.ListCreateAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReceptionist]

    def get_queryset(self):
        return branch_qs(Employee.objects.filter(is_active=True), self.request.user)


class EmployeeDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReceptionist]

    def get_queryset(self):
        return branch_qs(Employee.objects.all(), self.request.user)


class MyEmployeeProfileView(generics.RetrieveAPIView):
    """Employee views their own profile."""
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, IsEmployee]

    def get_object(self):
        return Employee.objects.get(user=self.request.user)


# ─────────────────── Attendance ──────────────────────────────
class AttendanceListCreateView(generics.ListCreateAPIView):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReceptionist]

    def get_queryset(self):
        qs = Attendance.objects.select_related('employee__branch')
        qs = branch_qs(qs, self.request.user)
        date = self.request.query_params.get('date')
        if date:
            qs = qs.filter(date=date)
        employee_id = self.request.query_params.get('employee')
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(marked_by=self.request.user)


class AttendanceDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReceptionist]

    def get_queryset(self):
        return branch_qs(Attendance.objects.all(), self.request.user)


class MyAttendanceView(generics.ListAPIView):
    """Employee views their own attendance."""
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, IsEmployee]

    def get_queryset(self):
        employee = Employee.objects.filter(user=self.request.user).first()
        if not employee:
            return Attendance.objects.none()
        return Attendance.objects.filter(employee=employee)


# ─────────────────── Leave Applications ──────────────────────
class LeaveListCreateView(generics.ListCreateAPIView):
    serializer_class = LeaveApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.EMPLOYEE:
            employee = Employee.objects.filter(user=user).first()
            return LeaveApplication.objects.filter(employee=employee) if employee else LeaveApplication.objects.none()
        return branch_qs(LeaveApplication.objects.all(), user)

    def perform_create(self, serializer):
        employee = Employee.objects.get(user=self.request.user)
        serializer.save(employee=employee)


class LeaveDetailView(generics.RetrieveAPIView):
    serializer_class = LeaveApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.EMPLOYEE:
            employee = Employee.objects.filter(user=user).first()
            return LeaveApplication.objects.filter(employee=employee)
        return branch_qs(LeaveApplication.objects.all(), user)


class LeaveReviewView(APIView):
    """Receptionist/Owner approves or rejects a leave application."""
    permission_classes = [IsAuthenticated, IsOwnerOrReceptionist]

    def patch(self, request, pk):
        try:
            leave = LeaveApplication.objects.get(pk=pk)
        except LeaveApplication.DoesNotExist:
            return Response({'detail': 'Leave application not found.'}, status=status.HTTP_404_NOT_FOUND)
        if leave.status != 'pending':
            return Response({'detail': 'This leave has already been reviewed.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = LeaveReviewSerializer(leave, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(reviewed_by=request.user)
        return Response(LeaveApplicationSerializer(leave).data)
