from rest_framework import serializers
from .models import Patient, Appointment, VisitNote, LabReport


class PatientListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    registered_by_name = serializers.CharField(source='registered_by.get_full_name', read_only=True)

    class Meta:
        model = Patient
        fields = (
            'id', 'uhid', 'full_name', 'first_name', 'last_name', 'phone',
            'email', 'gender', 'blood_group', 'dob', 'branch', 'branch_name',
            'registered_by_name', 'is_active', 'created_at'
        )
        read_only_fields = ('id', 'uhid', 'created_at')

    def get_full_name(self, obj):
        return obj.get_full_name()


class PatientDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Patient
        fields = '__all__'
        read_only_fields = ('id', 'uhid', 'created_at', 'updated_at')

    def get_full_name(self, obj):
        return obj.get_full_name()

    def validate_phone(self, value):
        # Duplicate detection by phone in the same branch
        branch = self.initial_data.get('branch') or (self.instance.branch_id if self.instance else None)
        qs = Patient.objects.filter(phone=value, branch_id=branch, is_active=True)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                f'A patient with this phone number is already registered at this branch (UHID: {qs.first().uhid}).'
            )
        return value


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_uhid = serializers.CharField(source='patient.uhid', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class VisitNoteSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)

    class Meta:
        model = VisitNote
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class LabReportSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)

    class Meta:
        model = LabReport
        fields = '__all__'
        read_only_fields = ('id', 'created_at')
