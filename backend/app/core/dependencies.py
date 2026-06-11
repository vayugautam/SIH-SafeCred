from fastapi import Depends, HTTPException, status
from typing import List, Callable
from app.core.security import get_current_user

class RequireRole:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = set(allowed_roles)

    def __call__(self, user: dict = Depends(get_current_user)):
        # Extract roles from Keycloak-style JWT claim: realm_access.roles
        realm_access = user.get("realm_access", {})
        user_roles = set(realm_access.get("roles", []))
        
        # Admin overrides everything
        if "ADMIN" in user_roles:
            return user
            
        if not self.allowed_roles.intersection(user_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Requires one of: {self.allowed_roles}"
            )
        return user

# Pre-configured dependency aliases for fast routing
RequireOfficer = RequireRole(["OFFICER"])
RequireManager = RequireRole(["MANAGER"])
RequireAdmin = RequireRole(["ADMIN"])
RequireAuditor = RequireRole(["AUDITOR", "ADMIN"])
RequireChannelPartner = RequireRole(["CHANNEL_PARTNER"])
