from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsOwner
from users.models import UserRole
from .models import Notification
from .serializers import NotificationSerializer
from .email import send_email


class MyNotificationsView(generics.ListAPIView):
    """Returns notifications for the current authenticated user."""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class AllNotificationsView(generics.ListAPIView):
    """Owner views all sent notifications."""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        qs = Notification.objects.all()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class SendNotificationView(APIView):
    """
    Owner/Staff can manually trigger an email notification.
    POST body: { to_email, to_name, subject, message, notification_type }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        to_email = request.data.get('to_email')
        subject = request.data.get('subject')
        message = request.data.get('message')
        if not all([to_email, subject, message]):
            return Response({'detail': 'to_email, subject, and message are required.'}, status=status.HTTP_400_BAD_REQUEST)

        notification = send_email(
            to_email=to_email,
            subject=subject,
            html_content=message,
            to_name=request.data.get('to_name', ''),
            notification_type=request.data.get('notification_type', 'general'),
            recipient_user=None,
        )
        return Response(NotificationSerializer(notification).data, status=status.HTTP_201_CREATED)
