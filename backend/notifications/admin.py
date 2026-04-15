from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('notification_type', 'recipient_email', 'subject', 'status', 'created_at', 'sent_at')
    list_filter = ('status', 'notification_type')
    search_fields = ('recipient_email', 'subject')
    readonly_fields = ('created_at', 'sent_at', 'error_message')
