from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.utils.html import escape

from users.permissions import IsOwner, IsOwnerOrDoctorOrReceptionist
from .models import Notification, NotificationType
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
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def post(self, request):
        to_email = (request.data.get('to_email') or '').strip()
        subject = (request.data.get('subject') or '').strip()
        message = (request.data.get('message') or '').strip()
        notification_type = request.data.get('notification_type') or NotificationType.GENERAL

        if not all([to_email, subject, message]):
            return Response({'detail': 'to_email, subject, and message are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_email(to_email)
        except ValidationError:
            return Response({'detail': 'Enter a valid recipient email address.'}, status=status.HTTP_400_BAD_REQUEST)

        valid_types = {choice[0] for choice in NotificationType.choices}
        if notification_type not in valid_types:
            return Response({'detail': 'Invalid notification_type.'}, status=status.HTTP_400_BAD_REQUEST)

        html_message = '<br>'.join(escape(line) for line in message.splitlines())

        notification = send_email(
            to_email=to_email,
            subject=subject,
            html_content=f'<p>{html_message}</p>',
            to_name=(request.data.get('to_name') or '').strip(),
            notification_type=notification_type,
            recipient_user=request.user,
        )
        return Response(NotificationSerializer(notification).data, status=status.HTTP_201_CREATED)
