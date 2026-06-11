from sqlalchemy.types import TypeDecorator, String
from cryptography.fernet import Fernet
import os

# Initial fallback key (should be overridden by Vault on app startup)
_FERNET_KEY = os.getenv("FERNET_KEY", Fernet.generate_key().decode('utf-8'))
_fernet = Fernet(_FERNET_KEY.encode('utf-8'))

def set_fernet_key(key: str):
    """Sets the global encryption key, dynamically fetched from Vault on startup."""
    global _fernet
    _fernet = Fernet(key.encode('utf-8'))

class EncryptedString(TypeDecorator):
    """
    SQLAlchemy TypeDecorator for field-level database encryption.
    Encrypts string values silently before SQL INSERT/UPDATE.
    Decrypts string values silently after SQL SELECT.
    """
    impl = String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        return _fernet.encrypt(str(value).encode('utf-8')).decode('utf-8')

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return _fernet.decrypt(value.encode('utf-8')).decode('utf-8')
