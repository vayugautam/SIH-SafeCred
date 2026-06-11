from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2AuthorizationCodeBearer
from jose import jwt, JWTError
import httpx
from typing import List, Dict, Any
from app.core.config import settings

oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl="http://localhost:8080/realms/safecred/protocol/openid-connect/auth",
    tokenUrl="http://localhost:8080/realms/safecred/protocol/openid-connect/token"
)

# In-memory JWKS cache
_jwks: Dict[str, Any] = {}

async def get_jwks():
    global _jwks
    if not _jwks:
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(settings.KEYCLOAK_JWKS_URL, timeout=5.0)
                resp.raise_for_status()
                _jwks = resp.json()
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to fetch JWKS: {str(e)}")
    return _jwks

async def verify_jwt(token: str = Depends(oauth2_scheme)) -> dict:
    jwks = await get_jwks()
    try:
        # Decode unverified header to get kid
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        for key in jwks.get("keys", []):
            if key["kid"] == unverified_header.get("kid"):
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break
        
        if not rsa_key:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: kid not found")

        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=settings.KEYCLOAK_AUDIENCE,
            issuer=settings.KEYCLOAK_JWKS_URL.replace("/protocol/openid-connect/certs", "")
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_role(allowed_roles: List[str]):
    """RBAC Dependency enforcing one of the allowed roles."""
    async def role_checker(token_payload: dict = Depends(verify_jwt)):
        # Keycloak normally embeds roles in realm_access or resource_access
        realm_access = token_payload.get("realm_access", {})
        user_roles = realm_access.get("roles", [])
        
        has_role = any(role in allowed_roles for role in user_roles)
        if not has_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required one of: {allowed_roles}"
            )
        return token_payload
    return role_checker

# Pre-defined role dependencies
class Roles:
    CHANNEL_PARTNER = "CHANNEL_PARTNER"
    OFFICER = "OFFICER"
    MANAGER = "MANAGER"
    ADMIN = "ADMIN"
    AUDITOR = "AUDITOR"
