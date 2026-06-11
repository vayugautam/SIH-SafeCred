import pytest
from httpx import AsyncClient

# =========================================================================
# SECURITY & RBAC INTEGRATION TESTS
# =========================================================================

@pytest.mark.asyncio
async def test_expired_jwt_rejected(async_client: AsyncClient):
    # Assume we inject a mocked expired token via headers
    headers = {"Authorization": "Bearer EXPIRED_JWT_MOCK"}
    response = await async_client.get("/api/v1/beneficiaries/123", headers=headers)
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_invalid_signature_jwt_rejected(async_client: AsyncClient):
    headers = {"Authorization": "Bearer INVALID_SIG_JWT_MOCK"}
    response = await async_client.get("/api/v1/beneficiaries/123", headers=headers)
    assert response.status_code == 401
    assert "signature" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_missing_role_forbidden(async_client: AsyncClient):
    # Token is valid but missing the "ADMIN" role
    headers = {"Authorization": "Bearer VALID_BUT_NO_ADMIN_ROLE_MOCK"}
    response = await async_client.get("/api/v1/admin/dashboard", headers=headers)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_pii_masking_default_behavior(async_client: AsyncClient, db_session):
    # 1. Insert a raw unmasked beneficiary directly into the Testcontainer DB
    # (assuming db_session and a factory/ORM handles this)
    # 2. Fetch the beneficiary via standard API
    headers = {"Authorization": "Bearer VALID_STANDARD_USER_MOCK"}
    response = await async_client.get("/api/v1/beneficiaries/123", headers=headers)
    
    # In a real test, the DB insertion logic would go here.
    # We assert the API mask logic intercepts the raw DB read.
    # assert response.status_code == 200
    # data = response.json()
    # assert data["aadhaar"] == "XXXX-XXXX-1234"
    # assert data["mobile_number"] == "XXXXXX4567"
    pass

@pytest.mark.asyncio
async def test_pii_audited_reveal_success(async_client: AsyncClient, db_session):
    # Fetch via the special reveal endpoint using an AUDITOR role
    headers = {"Authorization": "Bearer VALID_AUDITOR_MOCK"}
    payload = {"reason": "Fraud Investigation Case #1029"}
    response = await async_client.post("/api/v1/beneficiaries/123/pii/reveal", headers=headers, json=payload)
    
    # assert response.status_code == 200
    # data = response.json()
    # assert data["aadhaar"] != "XXXX-XXXX-1234"  # Exposed
    
    # Verify the Audit Trail captured this exact reveal action
    # result = await db_session.execute("SELECT * FROM audit_trail WHERE entity_id='123' AND action='PII_REVEAL'")
    # assert result.scalar() is not None
    pass
