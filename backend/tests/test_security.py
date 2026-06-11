import pytest
import jwt
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)

def create_mock_jwt(roles: list, expired: bool = False):
    import time
    payload = {
        "sub": "user_123",
        "realm_access": {"roles": roles},
        "exp": time.time() - 3600 if expired else time.time() + 3600
    }
    return jwt.encode(payload, settings.TEST_PUBLIC_KEY, algorithm="HS256")

def test_missing_token_returns_401():
    # Attempting to access an OFFICER route
    response = client.post("/api/v1/score/BEN1")
    assert response.status_code == 401

def test_invalid_signature_returns_401():
    # Altered token
    bad_token = jwt.encode({"sub": "user_123"}, "wrong_key", algorithm="HS256")
    response = client.post("/api/v1/score/BEN1", headers={"Authorization": f"Bearer {bad_token}"})
    assert response.status_code == 401

def test_expired_token_returns_401():
    token = create_mock_jwt(["OFFICER"], expired=True)
    response = client.post("/api/v1/score/BEN1", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401

def test_officer_success():
    token = create_mock_jwt(["OFFICER"])
    response = client.post("/api/v1/score/BEN1", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_officer_cannot_access_admin():
    token = create_mock_jwt(["OFFICER"])
    # POST /api/v1/admin/rescore/bulk requires ADMIN
    response = client.post("/api/v1/admin/rescore/bulk", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403

def test_admin_can_access_admin():
    token = create_mock_jwt(["ADMIN"])
    response = client.post("/api/v1/admin/rescore/bulk", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200

def test_channel_partner_cannot_approve_loans():
    token = create_mock_jwt(["CHANNEL_PARTNER"])
    # PUT /api/v1/lending/APP1/approve requires MANAGER
    response = client.put("/api/v1/lending/APP1/approve", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403

def test_standard_envelope_format():
    token = create_mock_jwt(["OFFICER"])
    response = client.get("/api/v1/score/BEN1", headers={"Authorization": f"Bearer {token}"})
    data = response.json()
    assert "status" in data
    assert "data" in data
    assert "message" in data
    assert "request_id" in data
    assert "timestamp" in data
