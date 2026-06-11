import hvac
import os
from typing import Dict, Any

class VaultClient:
    def __init__(self):
        # Typically set via Kubernetes service account or env
        self.url = os.getenv("VAULT_ADDR", "http://localhost:8200")
        self.token = os.getenv("VAULT_TOKEN", "root")
        self.client = hvac.Client(url=self.url, token=self.token)
        
    def renew_token_if_needed(self):
        if self.client.is_authenticated():
            token_info = self.client.auth.token.lookup_self()
            # If TTL is less than 5 minutes, renew
            if token_info.get("data", {}).get("ttl", 0) < 300:
                self.client.auth.token.renew_self()

    def get_secret(self, path: str, mount_point: str = "secret") -> Dict[str, Any]:
        self.renew_token_if_needed()
        try:
            read_response = self.client.secrets.kv.v2.read_secret_version(
                mount_point=mount_point,
                path=path,
            )
            return read_response['data']['data']
        except Exception as e:
            print(f"[VAULT WARNING] Could not read secret '{path}': {e}")
            return {}

vault = VaultClient()
