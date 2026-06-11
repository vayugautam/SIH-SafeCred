from pydantic import BaseModel
from typing import Any, Optional, Generic, TypeVar
from datetime import datetime

T = TypeVar('T')

class StandardResponse(BaseModel, Generic[T]):
    status: str
    data: Optional[T] = None
    message: str = "Success"
    request_id: Optional[str] = None
    timestamp: str = ""

    def __init__(self, **data):
        super().__init__(**data)
        if not self.timestamp:
            self.timestamp = datetime.utcnow().isoformat()

# --- Beneficiary PII Masking Schemas ---

class BeneficiaryUpdate(BaseModel):
    """
    PATCH semantics. Only updates explicitly provided fields.
    Missing fields are ignored by FastAPI/Pydantic automatically.
    """
    address: Optional[str] = None
    mobile_number: Optional[str] = None
    bank_account: Optional[str] = None
    ifsc_code: Optional[str] = None

class BeneficiaryResponse(BaseModel):
    """
    Standard Response model. 
    By default, masks PII using properties/serializers.
    """
    id: str
    first_name: str
    last_name: str
    aadhaar_last4: str
    mobile_number: Optional[str] = None
    bank_account: Optional[str] = None
    address: Optional[str] = None
    
    @property
    def masked_mobile(self) -> Optional[str]:
        if not self.mobile_number: return None
        return f"XXXXXX{self.mobile_number[-4:]}" if len(self.mobile_number) > 4 else "XXXXXX"
        
    @property
    def masked_bank(self) -> Optional[str]:
        if not self.bank_account: return None
        return f"XXXXXX{self.bank_account[-4:]}" if len(self.bank_account) > 4 else "XXXXXX"
    
    # We serialize the masked fields to the output JSON and omit the raw ones
    def model_dump(self, *args, **kwargs):
        # In Pydantic V2, we can use @field_serializer, but doing it in model_dump or via property overrides is also standard
        data = super().model_dump(*args, **kwargs)
        if data.get('mobile_number'):
            data['mobile_number'] = self.masked_mobile
        if data.get('bank_account'):
            data['bank_account'] = self.masked_bank
        return data

class BeneficiaryRevealRequest(BaseModel):
    """Payload for the Audited Reveal Endpoint"""
    reason: str
