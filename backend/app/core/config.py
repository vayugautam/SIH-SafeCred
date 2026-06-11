import os

class Settings:
    PROJECT_NAME: str = "SafeCred API"
    VERSION: str = "1.0.0"
    
    ENV: str = os.getenv("ENV", "development") # production, test, development
    AUTH_MODE: str = os.getenv("AUTH_MODE", "development")
    
    KEYCLOAK_URL: str = os.getenv("KEYCLOAK_URL", "http://localhost:8080/auth/realms/safecred")
    
    TEST_PRIVATE_KEY: str = os.getenv("TEST_PRIVATE_KEY", "default_test_priv")
    TEST_PUBLIC_KEY: str = os.getenv("TEST_PUBLIC_KEY", "default_test_pub")
    
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    KAFKA_BROKER: str = os.getenv("KAFKA_BROKER", "localhost:9092")
    
    SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")

    def __init__(self, **kwargs):
        if self.ENV == "production" and self.AUTH_MODE != "production":
            raise RuntimeError("Production environment strictly requires AUTH_MODE=production")

settings = Settings()
