from rest_framework import serializers
from .models import QuickNote, CallLog

class QuickNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuickNote
        fields = '__all__'

class CallLogSerializer(serializers.ModelSerializer):
    caller_name = serializers.CharField(source='caller.get_full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_phone = serializers.CharField(source='patient.phone', read_only=True)
    quick_note_text = serializers.CharField(source='quick_note.title', read_only=True)

    class Meta:
        model = CallLog
        fields = '__all__'
        read_only_fields = ('caller', 'timestamp')


from patients.models import Patient

class TelecallingPatientSerializer(serializers.ModelSerializer):
    last_appointment_date = serializers.DateField(read_only=True)
    next_appointment_date = serializers.DateField(read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = Patient
        fields = ('id', 'first_name', 'last_name', 'full_name', 'uhid', 'phone', 'last_appointment_date', 'next_appointment_date')
