from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import QuickNote, CallLog
from .serializers import QuickNoteSerializer, CallLogSerializer

class QuickNoteListView(generics.ListAPIView):
    serializer_class = QuickNoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return QuickNote.objects.filter(is_active=True)

class CallLogListCreateView(generics.ListCreateAPIView):
    serializer_class = CallLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = CallLog.objects.all()
        # Optionally filter by patient
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        
        # Branch-wise filtering: restrict to patients in the caller's branch
        # or the hospital owned by the caller (if owner)
        user = self.request.user
        if user.role == 'owner':
            qs = qs.filter(patient__branch__hospital__owner=user)
        elif hasattr(user, 'branch') and user.branch:
            qs = qs.filter(patient__branch=user.branch)
            
        return qs

    def perform_create(self, serializer):
        serializer.save(caller=self.request.user)
