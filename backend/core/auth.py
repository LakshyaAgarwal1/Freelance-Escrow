from datetime import timedelta
from django.utils import timezone
from eth_account.messages import encode_defunct
from eth_account import Account
from .models import WalletAccount, AuthChallenge, UserProfile

def create_auth_challenge(wallet_address: str) -> tuple[str, str]:
    """Generates an expiring challenge nonce for EIP-191 personal_sign authentication."""
    norm_address = wallet_address.strip().lower()
    expires_at = timezone.now() + timedelta(minutes=5)
    
    challenge = AuthChallenge.objects.create(
        wallet_address=norm_address,
        expires_at=expires_at
    )
    
    message = (
        f"Sign this challenge to authenticate with Freelance Escrow.\n\n"
        f"Wallet: {norm_address}\n"
        f"Nonce: {challenge.nonce}\n"
        f"Expires: {expires_at.isoformat()}"
    )
    return challenge.nonce, message

def verify_wallet_signature(wallet_address: str, nonce: str, signature: str) -> tuple[bool, str, WalletAccount | None]:
    """Verifies cryptographic signature against stored nonce and marks challenge used."""
    norm_address = wallet_address.strip().lower()
    
    try:
        challenge = AuthChallenge.objects.filter(
            wallet_address=norm_address,
            nonce=nonce,
            is_used=False
        ).order_by('-created_at').first()
        
        if not challenge or not challenge.is_valid():
            return False, "Challenge nonce is invalid or expired.", None
            
        message = (
            f"Sign this challenge to authenticate with Freelance Escrow.\n\n"
            f"Wallet: {norm_address}\n"
            f"Nonce: {challenge.nonce}\n"
            f"Expires: {challenge.expires_at.isoformat()}"
        )
        
        signable_message = encode_defunct(text=message)
        recovered_address = Account.recover_message(signable_message, signature=signature)
        
        if recovered_address.lower() != norm_address:
            return False, "Cryptographic signature verification failed.", None
            
        # Replay protection: mark used
        challenge.is_used = True
        challenge.save(update_fields=['is_used'])
        
        wallet, _ = WalletAccount.objects.get_or_create(address=norm_address)
        wallet.last_login = timezone.now()
        wallet.save(update_fields=['last_login'])
        
        # Ensure profile exists
        UserProfile.objects.get_or_create(wallet=wallet)
        
        return True, "Verification successful.", wallet
        
    except Exception as e:
        return False, f"Signature recovery error: {str(e)}", None
