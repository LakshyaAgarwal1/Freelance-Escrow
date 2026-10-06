from rest_framework import serializers
from .models import (
    WalletAccount,
    UserProfile,
    AgreementMetadata,
    MilestoneMetadata,
    DeliverableSubmission,
    DisputeCase,
    TransactionEvent,
    Notification,
)

class UserProfileSerializer(serializers.ModelSerializer):
    wallet_address = serializers.CharField(source='wallet.address', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'wallet_address', 'display_name', 'email', 'bio', 'avatar_url', 'created_at']

class MilestoneMetadataSerializer(serializers.ModelSerializer):
    class Meta:
        model = MilestoneMetadata
        fields = ['index', 'title', 'description', 'amount_eth', 'deadline']

class AgreementMetadataSerializer(serializers.ModelSerializer):
    milestones = MilestoneMetadataSerializer(many=True, required=False)

    class Meta:
        model = AgreementMetadata
        fields = [
            'id',
            'agreement_id',
            'title',
            'description',
            'acceptance_criteria',
            'terms_hash',
            'client_address',
            'freelancer_address',
            'arbitrator_address',
            'milestones',
            'created_at',
            'updated_at',
        ]

    def create(self, validated_data):
        milestones_data = validated_data.pop('milestones', [])
        agreement = AgreementMetadata.objects.create(**validated_data)
        for ms in milestones_data:
            MilestoneMetadata.objects.create(agreement=agreement, **ms)
        return agreement

class DeliverableSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliverableSubmission
        fields = '__all__'

class DisputeCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = DisputeCase
        fields = '__all__'

class TransactionEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionEvent
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
