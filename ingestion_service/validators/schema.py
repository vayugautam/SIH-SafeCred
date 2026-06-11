from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class LoanRecord(BaseModel):
    partner_id: str
    beneficiary_id: str
    amount: float = Field(..., gt=0)
    interest_rate: float
    start_date: datetime
    status: str
    
class RepaymentRecord(BaseModel):
    partner_id: str
    loan_id: str
    amount_paid: float = Field(..., gt=0)
    payment_date: datetime
    payment_method: str
    
class ConsumptionRecord(BaseModel):
    beneficiary_id: Optional[str] = None
    type: str # 'electricity', 'mobile_recharge'
    amount: Optional[float] = None
    billing_date: Optional[datetime] = None
    provider: Optional[str] = None
    account_number: Optional[str] = None
    units_consumed_kwh: Optional[float] = None
    payment_status: Optional[str] = None
    operator: Optional[str] = None
    needs_manual_review: bool = False
    ocr_confidence: Optional[float] = None

class JobResult(BaseModel):
    job_id: str
    status: str
    records_processed: int = 0
    errors: List[str] = []
