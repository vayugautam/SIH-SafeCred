import pytest
from datetime import datetime, timedelta
import json
from unittest.mock import MagicMock, AsyncMock

from app.models.db_models import AuditTrail
from app.services.audit_logger import AuditLogger

@pytest.fixture
def mock_session():
    session = AsyncMock()
    return session

@pytest.mark.asyncio
async def test_audit_log_genesis(mock_session):
    # Mock empty db (no previous records)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_session.execute.return_value = mock_result
    
    logger = AuditLogger(mock_session)
    record = await logger.log(
        entity_type="LOAN",
        entity_id="L123",
        action="CREATE",
        actor_id="user_1",
        actor_role="OFFICER",
        old_val=None,
        new_val={"amount": 5000},
        reason="Initial Request"
    )
    
    assert record.entity_id == "L123"
    assert record.hash is not None
    # Genesis hash computation verification could be done here.
    assert mock_session.add.called
    assert mock_session.flush.called

@pytest.mark.asyncio
async def test_verify_chain_valid():
    # We construct a mock chain of 2 records
    r1 = AuditTrail(
        entity_type="LOAN", entity_id="L123", action="CREATE",
        actor_id="U1", actor_role="OFF", old_value={}, new_value={"v": 1}, reason="R1"
    )
    
    r2 = AuditTrail(
        entity_type="LOAN", entity_id="L123", action="UPDATE",
        actor_id="U1", actor_role="OFF", old_value={"v": 1}, new_value={"v": 2}, reason="R2"
    )
    
    import hashlib
    # Compute valid hashes
    c1 = json.dumps({"entity_type": "LOAN", "entity_id": "L123", "action": "CREATE", "actor_id": "U1", "actor_role": "OFF", "old_value": {}, "new_value": {"v":1}, "reason": "R1"}, sort_keys=True)
    h1 = hashlib.sha256(("GENESIS_HASH" + c1).encode('utf-8')).hexdigest()
    r1.hash = h1
    
    c2 = json.dumps({"entity_type": "LOAN", "entity_id": "L123", "action": "UPDATE", "actor_id": "U1", "actor_role": "OFF", "old_value": {"v":1}, "new_value": {"v":2}, "reason": "R2"}, sort_keys=True)
    h2 = hashlib.sha256((h1 + c2).encode('utf-8')).hexdigest()
    r2.hash = h2
    
    mock_session = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [r1, r2]
    mock_session.execute.return_value = mock_result
    
    logger = AuditLogger(mock_session)
    is_valid = await logger.verify_chain("L123")
    assert is_valid is True

@pytest.mark.asyncio
async def test_verify_chain_invalid():
    # Construct broken chain
    r1 = AuditTrail(
        entity_type="LOAN", entity_id="L123", action="CREATE",
        actor_id="U1", actor_role="OFF", old_value={}, new_value={"v": 1}, reason="R1",
        hash="valid_hash_1"
    )
    r2 = AuditTrail(
        entity_type="LOAN", entity_id="L123", action="UPDATE",
        actor_id="U1", actor_role="OFF", old_value={"v": 1}, new_value={"v": 2}, reason="R2",
        hash="invalid_tampered_hash"
    )
    
    mock_session = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [r1, r2]
    mock_session.execute.return_value = mock_result
    
    logger = AuditLogger(mock_session)
    is_valid = await logger.verify_chain("L123")
    assert is_valid is False
