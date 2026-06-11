import hashlib
import os
from sqlalchemy.types import TypeDecorator, String, LargeBinary
from cryptography.fernet import Fernet
from app.core.vault_client import vault_client

class EncryptedString(TypeDecorator):
    """
    SQLAlchemy TypeDecorator that encrypts strings on the way in 
    and decrypts them on the way out using Fernet symmetric encryption.
    The Fernet key MUST be initialized in memory via HashiCorp Vault.
    """
    impl = LargeBinary
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if not vault_client.fernet_key:
             raise RuntimeError("Encryption key not loaded from Vault!")
        f = Fernet(vault_client.fernet_key)
        return f.encrypt(value.encode('utf-8'))

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if not vault_client.fernet_key:
             raise RuntimeError("Decryption key not loaded from Vault!")
        f = Fernet(vault_client.fernet_key)
        return f.decrypt(value).decode('utf-8')

def hash_identity_field(value: str, salt: str) -> str:
    """
    Generates a deterministic SHA-256 salted hash for unrecoverable 
    identity matching (e.g. Aadhaar, PAN).
    """
    if not value:
        return ""
    # Ensure canonical string format
    normalized = value.strip().upper()
    return hashlib.sha256((normalized + salt).encode('utf-8')).hexdigest()

def generate_record_salt() -> str:
    """Generates a secure 16-byte hex salt per record."""
    return os.urandom(16).hex()
