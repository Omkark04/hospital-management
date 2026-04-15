from rest_framework import serializers
from .models import Campaign, CampaignManagerAssignment, CampaignPatient, CampaignAttendance, CampaignSale


class CampaignSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    managers = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = '__all__'
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')

    def get_managers(self, obj):
        assignments = obj.manager_assignments.filter(is_active=True).select_related('user')
        return [{'id': a.user.id, 'name': a.user.get_full_name(), 'role': a.user.role} for a in assignments]


class CampaignManagerAssignmentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    campaign_name = serializers.CharField(source='campaign.name', read_only=True)

    class Meta:
        model = CampaignManagerAssignment
        fields = '__all__'
        read_only_fields = ('id', 'assigned_by', 'assigned_at')


class CampaignPatientSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_uhid = serializers.CharField(source='patient.uhid', read_only=True)

    class Meta:
        model = CampaignPatient
        fields = '__all__'
        read_only_fields = ('id', 'registered_by', 'created_at')


class CampaignAttendanceSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = CampaignAttendance
        fields = '__all__'
        read_only_fields = ('id',)


class CampaignSaleSerializer(serializers.ModelSerializer):
    sold_by_name = serializers.CharField(source='sold_by.get_full_name', read_only=True)

    class Meta:
        model = CampaignSale
        fields = '__all__'
        read_only_fields = ('id', 'sold_by', 'created_at')
