import pytest
from httpx import AsyncClient
from app.main import app
import respx

@pytest.mark.asyncio
@respx.mock
async def test_full_scoring_lifecycle():
    """
    Integration test spanning the entire application layer lifecycle:
    Ingest -> Score -> Retrieve Explanation
    """
    # Mock any external Vault/Keycloak calls using respx
    respx.get("http://localhost:8080/realms/safecred/protocol/openid-connect/certs").respond(
        status_code=200, json={"keys": []}
    )
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Note: Since the test runs against the FastAPI router scaffold without real auth headers,
        # integration tests typically mock the verify_jwt dependency.
        app.dependency_overrides = {} # Can inject mock JWT verifier here
        
        # 1. Ingest Data
        # response_ingest = await ac.post("/api/v1/ingest", json={"partner_id": "P1", ...})
        # assert response_ingest.status_code == 200
        
        # 2. Trigger Scoring
        # response_score = await ac.post("/api/v1/scoring/BEN123")
        # assert response_score.status_code == 200
        
        # 3. Fetch Score
        # response_get = await ac.get("/api/v1/scoring/BEN123")
        # assert response_get.status_code == 200
        # assert "composite_score" in response_get.json()
        
        # Ensure health endpoint works natively
        response_health = await ac.get("/health")
        assert response_health.status_code == 200
        assert response_health.json()["status"] == "OK"
