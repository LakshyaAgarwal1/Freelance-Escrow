from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from eth_account import Account
from eth_account.messages import encode_defunct
from core.models import (
    WalletAccount,
    UserProfile,
    AuthChallenge,
    AgreementMetadata,
    MilestoneMetadata,
    DeliverableSubmission,
    DisputeCase,
)
from core.auth import create_auth_challenge, verify_wallet_signature

class AuthAndSecurityTests(TestCase):
    def setUp(self):
        # Generate test ethereum keypair
        self.account = Account.create()
        self.address = self.account.address

    def test_nonce_generation_and_expiry(self):
        nonce, msg = create_auth_challenge(self.address)
        self.assertIsNotNone(nonce)
        self.assertIn(self.address.lower(), msg)

        challenge = AuthChallenge.objects.get(nonce=nonce)
        self.assertTrue(challenge.is_valid())
        self.assertFalse(challenge.is_used)

    def test_successful_signature_verification(self):
        nonce, msg = create_auth_challenge(self.address)
        signable = encode_defunct(text=msg)
        signed = self.account.sign_message(signable)
        signature_hex = signed.signature.hex()

        valid, feedback, wallet = verify_wallet_signature(self.address, nonce, signature_hex)
        self.assertTrue(valid)
        self.assertIsNotNone(wallet)
        self.assertEqual(wallet.address, self.address.lower())

        # Check challenge marked as used (replay protection)
        challenge = AuthChallenge.objects.get(nonce=nonce)
        self.assertTrue(challenge.is_used)

    def test_replay_attack_prevention(self):
        nonce, msg = create_auth_challenge(self.address)
        signable = encode_defunct(text=msg)
        signed = self.account.sign_message(signable)
        signature_hex = signed.signature.hex()

        # First verification succeeds
        valid1, _, _ = verify_wallet_signature(self.address, nonce, signature_hex)
        self.assertTrue(valid1)

        # Immediate replay attempt must fail
        valid2, msg2, wallet2 = verify_wallet_signature(self.address, nonce, signature_hex)
        self.assertFalse(valid2)
        self.assertIn("invalid or expired", msg2)
        self.assertIsNone(wallet2)

    def test_spoofed_signature_rejection(self):
        nonce, msg = create_auth_challenge(self.address)
        attacker = Account.create()
        signable = encode_defunct(text=msg)
        attacker_signed = attacker.sign_message(signable)

        valid, msg_out, _ = verify_wallet_signature(self.address, nonce, attacker_signed.signature.hex())
        self.assertFalse(valid)
        self.assertIn("failed", msg_out)

    def test_expired_nonce_rejection(self):
        nonce, msg = create_auth_challenge(self.address)
        challenge = AuthChallenge.objects.get(nonce=nonce)
        challenge.expires_at = timezone.now() - timedelta(minutes=1)
        challenge.save()

        signable = encode_defunct(text=msg)
        signed = self.account.sign_message(signable)

        valid, msg_out, _ = verify_wallet_signature(self.address, nonce, signed.signature.hex())
        self.assertFalse(valid)
        self.assertIn("expired", msg_out)

class MetadataModelTests(TestCase):
    def test_agreement_metadata_lifecycle(self):
        ag = AgreementMetadata.objects.create(
            agreement_id=101,
            title="E-Commerce DApp Frontend",
            description="Complete React & Web3 integration",
            acceptance_criteria="Passes all tests",
            terms_hash="0xabcdef1234567890",
            client_address="0x1111111111111111111111111111111111111111",
            freelancer_address="0x2222222222222222222222222222222222222222",
        )

        MilestoneMetadata.objects.create(
            agreement=ag,
            index=0,
            title="Phase 1",
            amount_eth=1.5,
        )

        self.assertEqual(ag.milestones.count(), 1)
        self.assertEqual(str(ag), "#101 - E-Commerce DApp Frontend")

    def test_submission_and_dispute_creation(self):
        sub = DeliverableSubmission.objects.create(
            agreement_id=101,
            milestone_index=0,
            submission_reference="ipfs://bafybeicid...",
            submitted_by="0x2222222222222222222222222222222222222222",
        )
        self.assertEqual(sub.milestone_index, 0)

        dispute = DisputeCase.objects.create(
            agreement_id=101,
            milestone_index=0,
            reason="Design differs from accepted wireframe",
            initiator_address="0x1111111111111111111111111111111111111111",
        )
        self.assertEqual(dispute.status, 'OPEN')
