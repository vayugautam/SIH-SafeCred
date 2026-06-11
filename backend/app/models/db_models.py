from sqlalchemy import Column, String, Integer, DateTime, text, Index
from sqlalchemy.dialects.postgresql import JSONB, UUID, INET
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class AuditTrail(Base):
    __tablename__ = "audit_trail"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(100), nullable=False)
    
    action = Column(String(100), nullable=False)
    actor_id = Column(String(100), nullable=False)
    actor_role = Column(String(50), nullable=False)
    
    old_value = Column(JSONB, nullable=True)
    new_value = Column(JSONB, nullable=True)
    reason = Column(String, nullable=True)
    
    ip_address = Column(INET, nullable=True)
    request_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Cryptographic Chain fields
    chain_index = Column(Integer, nullable=False)
    previous_hash = Column(String(64), nullable=False)
    hash = Column(String(64), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=text("NOW()"), nullable=False)
    
    # Indexes to speed up chain verification and lock querying
    __table_args__ = (
        Index("idx_audit_entity", "entity_type", "entity_id"),
        Index("idx_audit_chain", "entity_type", "entity_id", "chain_index"),
    )

# Explicit DDL for PostgreSQL Rules to enforce physical immutability
IMMUTABILITY_RULES_DDL = """
CREATE RULE no_update AS ON UPDATE TO audit_trail DO INSTEAD NOTHING;
CREATE RULE no_delete AS ON DELETE TO audit_trail DO INSTEAD NOTHING;
"""

from app.models.encrypted_types import EncryptedString

class Beneficiary(Base):
    __tablename__ = "beneficiaries"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    
    # Non-sensitive / Display logic
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    aadhaar_last4 = Column(String(4), nullable=False)
    
    # Hashed Identity (For matching/deduplication, irreversible)
    aadhaar_hash = Column(String(64), nullable=False, unique=True)
    record_salt = Column(String(32), nullable=False) # Per-record salt
    
    # Reversibly Encrypted PII (Fernet)
    mobile_number = Column(EncryptedString, nullable=True)
    bank_account = Column(EncryptedString, nullable=True)
    address = Column(EncryptedString, nullable=True)
    ifsc_code = Column(EncryptedString, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=text("NOW()"), nullable=False)
