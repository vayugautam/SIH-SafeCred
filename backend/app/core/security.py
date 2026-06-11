from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status, Request, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import base64
import json

from app.core.config import settings

security_scheme = HTTPBearer(auto_error=False)

def verify_test_token(token: str) -> Dict[str, Any]:
    try:
        # Mock token parsing for the base64 encoded token from auth.py
        # token format: mock_header.<base64>.mock_signature
        parts = token.split(".")
        if len(parts) == 3:
            encoded_payload = parts[1]
            decoded_bytes = base64.b64decode(encoded_payload)
            return json.loads(decoded_bytes.decode())
        
        # Fallback for arbitrary mock tokens
        return {"sub": "admin123", "realm_access": {"roles": ["ADMIN"]}}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Test token invalid: {str(e)}"
        )

def get_current_user(request: Request, creds: HTTPAuthorizationCredentials = Security(security_scheme)) -> Dict[str, Any]:
    if settings.AUTH_MODE == "development":
        # Allow special headers for instant local testing without tokens
        dev_user = request.headers.get("X-Dev-User")
        dev_roles = request.headers.get("X-Dev-Roles")
        if dev_user and dev_roles:
            return {"sub": dev_user, "realm_access": {"roles": dev_roles.split(",")}}
            
    if not creds:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
        
    token = creds.credentials
    return verify_test_token(token)
