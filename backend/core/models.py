from django.db import models
from django.utils import timezone
import uuid

class WalletAccount(models.Model):
    address = models.CharField(max_length=42, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.address

class AuthChallenge(models.Model):
    wallet_address = models.CharField(max_length=42, db_index=True)
    nonce = models.CharField(max_length=64, default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at

    def __str__(self):
        return f"Challenge for {self.wallet_address} ({self.nonce})"

class UserProfile(models.Model):
    wallet = models.OneToOneField(WalletAccount, on_delete=models.CASCADE, related_name='profile')
    display_name = models.CharField(max_length=120, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    bio = models.TextField(blank=True, default='')
    avatar_url = models.URLField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.display_name or self.wallet.address

class AgreementMetadata(models.Model):
    agreement_id = models.PositiveBigIntegerField(unique=True, db_index=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    acceptance_criteria = models.TextField(blank=True, default='')
    terms_hash = models.CharField(max_length=66, db_index=True)
    client_address = models.CharField(max_length=42, db_index=True)
    freelancer_address = models.CharField(max_length=42, db_index=True)
    arbitrator_address = models.CharField(max_length=42, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"#{self.agreement_id} - {self.title}"

class MilestoneMetadata(models.Model):
    agreement = models.ForeignKey(AgreementMetadata, on_delete=models.CASCADE, related_name='milestones')
    index = models.PositiveIntegerField()
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    amount_eth = models.DecimalField(max_digits=18, decimal_places=6)
    deadline = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('agreement', 'index')
        ordering = ['index']

    def __str__(self):
        return f"Agreement #{self.agreement.agreement_id} Milestone #{self.index}: {self.title}"

class DeliverableSubmission(models.Model):
    agreement_id = models.PositiveBigIntegerField(db_index=True)
    milestone_index = models.PositiveIntegerField()
    submission_reference = models.CharField(max_length=512)
    notes = models.TextField(blank=True, default='')
    submitted_by = models.CharField(max_length=42)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Submission #{self.agreement_id} MS#{self.milestone_index}"

class DisputeCase(models.Model):
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('IN_REVIEW', 'Under Review'),
        ('RESOLVED', 'Resolved'),
    ]

    agreement_id = models.PositiveBigIntegerField(db_index=True)
    milestone_index = models.PositiveIntegerField()
    reason = models.TextField()
    evidence_reference = models.CharField(max_length=512, blank=True, default='')
    initiator_address = models.CharField(max_length=42)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    ruling_notes = models.TextField(blank=True, default='')
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dispute on Agreement #{self.agreement_id} (MS #{self.milestone_index})"

class TransactionEvent(models.Model):
    tx_hash = models.CharField(max_length=66, db_index=True)
    block_number = models.PositiveBigIntegerField()
    event_name = models.CharField(max_length=64, db_index=True)
    agreement_id = models.PositiveBigIntegerField(null=True, blank=True, db_index=True)
    event_payload = models.JSONField(default=dict)
    indexed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['tx_hash', 'event_name']),
        ]

    def __str__(self):
        return f"{self.event_name} ({self.tx_hash[:10]}...)"

class Notification(models.Model):
    wallet_address = models.CharField(max_length=42, db_index=True)
    title = models.CharField(max_length=200)
    message = models.TextField()
    link = models.CharField(max_length=255, blank=True, default='')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.wallet_address}: {self.title}"
