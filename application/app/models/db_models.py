from sqlalchemy.orm import declarative_base, Mapped, mapped_column
from sqlalchemy import String, Text, DateTime, func, DDL, event
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
import uuid

Base = declarative_base()

class AuditTrail(Base):
    __tablename__ = 'audit_trail'
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    actor_id: Mapped[str] = mapped_column(String(100), nullable=False)
    actor_role: Mapped[str] = mapped_column(String(50), nullable=True)
    
    old_value: Mapped[dict] = mapped_column(JSONB, nullable=True)
    new_value: Mapped[dict] = mapped_column(JSONB, nullable=True)
    
    reason: Mapped[str] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str] = mapped_column(INET, nullable=True)
    request_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=True)
    hash: Mapped[str] = mapped_column(String(64), nullable=False)
    
    created_at = mapped_column(DateTime(timezone=True), server_default=func.now())

# Event listeners bind the Postgres rules immediately after table creation
@event.listens_for(AuditTrail.__table__, 'after_create')
def create_append_only_rules(target, connection, **kw):
    connection.execute(DDL("CREATE RULE no_update AS ON UPDATE TO audit_trail DO INSTEAD NOTHING;"))
    connection.execute(DDL("CREATE RULE no_delete AS ON DELETE TO audit_trail DO INSTEAD NOTHING;"))
