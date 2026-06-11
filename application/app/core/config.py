from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "SafeCred Digital Lending API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Keycloak OIDC
    KEYCLOAK_JWKS_URL: str = "http://localhost:8080/realms/safecred/protocol/openid-connect/certs"
    KEYCLOAK_AUDIENCE: str = "account"
    
    # Infra
    REDIS_URL: str = "redis://localhost:6379/0"
    DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost:5432/safecred"
    
    SENTRY_DSN: Optional[str] = None
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
