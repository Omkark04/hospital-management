from django.urls import path
from .views import MyNotificationsView, AllNotificationsView, SendNotificationView

app_name = 'notifications'

urlpatterns = [
    path('mine/', MyNotificationsView.as_view(), name='my-notifications'),
    path('all/', AllNotificationsView.as_view(), name='all-notifications'),
    path('send/', SendNotificationView.as_view(), name='send-notification'),
]
