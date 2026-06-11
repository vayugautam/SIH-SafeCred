import hvac
import logging
from app.core.config import settings

logger = logging.getLogger("vault_client")

class VaultClient:
    def __init__(self):
        self.url = getattr(settings, "VAULT_ADDR", "http://localhost:8200")
        self.token = getattr(settings, "VAULT_TOKEN", "dev-only-token")
        self.client = hvac.Client(url=self.url, token=self.token)
        
        # In-memory cached secrets
        self.db_creds = {}
        self.api_keys = {}
        self.fernet_key = None

    def initialize(self):
        """Called on FastAPI startup to fetch memory-only secrets."""
        if not self.client.is_authenticated():
            logger.error("Vault authentication failed!")
            # In a real setup, we might raise an exception, but for robust dev fallback:
            self._load_dev_fallbacks()
            return
            
        try:
            # 1. Fetch DB Credentials
            db_res = self.client.secrets.kv.v2.read_secret_version(path='database')
            self.db_creds = db_res['data']['data']
            
            # 2. Fetch API Keys
            api_res = self.client.secrets.kv.v2.read_secret_version(path='api_keys')
            self.api_keys = api_res['data']['data']
            
            # 3. Fetch Fernet Encryption Key
            fernet_res = self.client.secrets.kv.v2.read_secret_version(path='encryption')
            self.fernet_key = fernet_res['data']['data']['fernet_key']
            
            logger.info("Successfully ingested HashiCorp Vault secrets.")
        except Exception as e:
            logger.error(f"Failed to read from Vault: {e}")
            self._load_dev_fallbacks()

    def renew_token_if_needed(self):
        """Called periodically by a background task."""
        if self.client.is_authenticated():
            self.client.auth.token.renew_self()

    def _load_dev_fallbacks(self):
        """Strictly for local development if Vault container is down."""
        if settings.ENV != "production":
            logger.warning("Using insecure developer fallback secrets due to Vault failure.")
            # Default Fernet key generated via cryptography.fernet.Fernet.generate_key()
            self.fernet_key = b"A8pY0G1V9xZ8t2b4Lq7_E1d1J5v0R9u4y7S2g8F5w0A="
        else:
            raise RuntimeError("Vault is strictly required in PRODUCTION.")

vault_client = VaultClient()
