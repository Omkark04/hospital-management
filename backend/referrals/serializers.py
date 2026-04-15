from rest_framework import serializers
from .models import Referral


class ReferralSerializer(serializers.ModelSerializer):
    referred_by_user_name = serializers.CharField(
        source='referred_by_user.get_full_name', read_only=True, allow_null=True
    )

    class Meta:
        model = Referral
        fields = '__all__'
        read_only_fields = ('id', 'referred_by_user', 'status', 'registered_patient', 'created_at', 'updated_at')


class ReferralStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Referral
        fields = ('status', 'registered_patient')
