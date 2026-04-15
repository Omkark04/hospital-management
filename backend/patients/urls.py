from django.urls import path
from .views import (
    PatientListCreateView, PatientDetailView, MyPatientProfileView,
    AppointmentListCreateView, AppointmentDetailView,
    VisitNoteListCreateView, VisitNoteDetailView,
    LabReportListCreateView, LabReportDetailView,
)

app_name = 'patients'

urlpatterns = [
    # Patients
    path('', PatientListCreateView.as_view(), name='patient-list-create'),
    path('<int:pk>/', PatientDetailView.as_view(), name='patient-detail'),
    path('me/', MyPatientProfileView.as_view(), name='my-profile'),

    # Appointments
    path('appointments/', AppointmentListCreateView.as_view(), name='appointment-list-create'),
    path('appointments/<int:pk>/', AppointmentDetailView.as_view(), name='appointment-detail'),

    # Visit Notes (nested under patient)
    path('<int:patient_id>/visit-notes/', VisitNoteListCreateView.as_view(), name='visit-note-list-create'),
    path('visit-notes/<int:pk>/', VisitNoteDetailView.as_view(), name='visit-note-detail'),

    # Lab Reports (nested under patient)
    path('<int:patient_id>/lab-reports/', LabReportListCreateView.as_view(), name='lab-report-list-create'),
    path('lab-reports/<int:pk>/', LabReportDetailView.as_view(), name='lab-report-detail'),
]
