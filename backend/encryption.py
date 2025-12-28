"""
Encryption service for sensitive data using Fernet symmetric encryption.
API keys are encrypted before storage and decrypted when retrieved.
"""
import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

# Get or generate encryption key
# In production, this MUST be set as an environment variable
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

if not ENCRYPTION_KEY:
    # For development only - generate a key if not set
    # WARNING: This means data won't survive restarts if key isn't persisted
    print("⚠️  ENCRYPTION_KEY not set - generating temporary key (dev only)")
    ENCRYPTION_KEY = Fernet.generate_key().decode()
    print(f"   Generated key (save this to .env): {ENCRYPTION_KEY}")

# Initialize Fernet cipher
try:
    cipher = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)
except Exception as e:
    print(f"❌ Invalid ENCRYPTION_KEY: {e}")
    print("   Generate a new key with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\"")
    cipher = None


def encrypt_value(plaintext: str) -> str:
    """
    Encrypt a plaintext string.
    Returns encrypted string that can be stored in database.
    """
    if not cipher:
        raise ValueError("Encryption not configured - set ENCRYPTION_KEY")

    if not plaintext:
        return ""

    encrypted = cipher.encrypt(plaintext.encode())
    return encrypted.decode()


def decrypt_value(encrypted_text: str) -> str:
    """
    Decrypt an encrypted string.
    Returns original plaintext.
    """
    if not cipher:
        raise ValueError("Encryption not configured - set ENCRYPTION_KEY")

    if not encrypted_text:
        return ""

    decrypted = cipher.decrypt(encrypted_text.encode())
    return decrypted.decode()


def is_encrypted(value: str) -> bool:
    """
    Check if a value appears to be encrypted (Fernet format).
    Fernet tokens are base64 encoded and start with 'gAAAAA'.
    """
    if not value:
        return False
    return value.startswith("gAAAAA") and len(value) > 50
