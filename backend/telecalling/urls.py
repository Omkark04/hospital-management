from django.urls import path
from .views import QuickNoteListView, CallLogListCreateView, TelecallingSmartListView
from .views_export import TelecallingExportView

app_name = 'telecalling'

urlpatterns = [
    path('quick-notes/', QuickNoteListView.as_view(), name='quicknote-list'),
    path('logs/', CallLogListCreateView.as_view(), name='calllog-list-create'),
    path('logs/export/', TelecallingExportView.as_view(), name='calllog-export'),
    path('smart-lists/', TelecallingSmartListView.as_view(), name='telecalling-smart-list'),
]
