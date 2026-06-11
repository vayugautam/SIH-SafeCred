import enum
import uuid
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from circuitbreaker import circuit
from redis.asyncio import Redis

class LoanState(enum.Enum):
    INITIATED = "INITIATED"
    SCORE_VERIFIED = "SCORE_VERIFIED"
    KYC_PENDING = "KYC_PENDING"
    KYC_DONE = "KYC_DONE"
    BANK_VERIFIED = "BANK_VERIFIED"
    APPROVED = "APPROVED"
    DISBURSED = "DISBURSED"
    REJECTED = "REJECTED"
    MANUAL_REVIEW = "MANUAL_REVIEW"
    SUSPENDED = "SUSPENDED"

# --- Mocks for External Services ---
class KafkaStub:
    async def publish(self, topic: str, message: dict):
        pass

class Fast2SMSStub:
    @circuit(failure_threshold=3, expected_exception=Exception)
    async def send_sms(self, phone: str, message: str):
        # Stub logic
        pass

class KYCProviderStub:
    @circuit(failure_threshold=3, expected_exception=Exception)
    async def verify(self, beneficiary_id: str) -> bool:
        # Stub logic
        return True

class BankProviderStub:
    @circuit(failure_threshold=3, expected_exception=Exception)
    async def verify(self, beneficiary_id: str) -> bool:
        # Stub logic
        return True

# --- Return Models (Using basic dataclasses for simplicity) ---
from dataclasses import dataclass

@dataclass
class ApplicationResult:
    application_id: str
    status: str

@dataclass
class ScoreCheckResult:
    application_id: str
    status: str

@dataclass
class KYCResult:
    application_id: str
    status: str

@dataclass
class BankVerifyResult:
    application_id: str
    status: str

@dataclass
class DisbursalResult:
    application_id: str
    status: str
    message: str

@dataclass
class RejectionResult:
    application_id: str
    status: str

@dataclass
class EscalationResult:
    application_id: str
    status: str
    reason: str

# --- Orchestrator Engine ---
class DigitalLendingOrchestrator:
    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self.redis = Redis.from_url(redis_url, decode_responses=True)
        self.kafka = KafkaStub()
        self.sms = Fast2SMSStub()
        self.kyc = KYCProviderStub()
        self.bank = BankProviderStub()
        
        # In-memory DB representation for demonstration
        self.db: Dict[str, Any] = {}

    async def _transition(self, app_id: str, new_state: LoanState, 
                          metadata: dict = None, phone: str = "9999999999"):
        app = self.db.get(app_id)
        if not app:
            raise ValueError("Application not found")
            
        old_state = app["state"]
        app["state"] = new_state
        
        event = {
            "application_id": app_id,
            "old_state": old_state.value if old_state else None,
            "new_state": new_state.value,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {}
        }
        
        # 1. Append to audit trail
        app["audit_trail"].append(event)
        
        # 2. Publish to Kafka
        await self.kafka.publish('lending_events', event)
        
        # 3. Fast2SMS Notification (circuit broken)
        try:
            await self.sms.send_sms(phone, f"Your loan status changed to {new_state.value}")
        except Exception:
            # Circuit open or SMS failed, log and continue. Orchestration shouldn't fail due to SMS.
            pass

    async def initiate(self, beneficiary_id: str, loan_amount_inr: float, requested_by: str) -> ApplicationResult:
        app_id = str(uuid.uuid4())
        
        # Store monetary amounts strictly in paise (integers) to prevent float inaccuracies
        amount_paise = int(round(loan_amount_inr * 100))
        
        self.db[app_id] = {
            "application_id": app_id,
            "beneficiary_id": beneficiary_id,
            "loan_amount_paise": amount_paise,
            "requested_by": requested_by,
            "state": None,
            "audit_trail": []
        }
        
        await self._transition(app_id, LoanState.INITIATED)
        return ApplicationResult(application_id=app_id, status="INITIATED")

    async def verify_score(self, application_id: str) -> ScoreCheckResult:
        app = self.db.get(application_id)
        if app["state"] != LoanState.INITIATED:
            raise ValueError(f"Invalid state transition from {app['state']} to SCORE_VERIFIED")
            
        await self._transition(application_id, LoanState.SCORE_VERIFIED)
        return ScoreCheckResult(application_id=application_id, status="VERIFIED")

    async def run_kyc(self, application_id: str) -> KYCResult:
        await self._transition(application_id, LoanState.KYC_PENDING)
        try:
            kyc_valid = await self.kyc.verify(self.db[application_id]["beneficiary_id"])
            if kyc_valid:
                await self._transition(application_id, LoanState.KYC_DONE)
                return KYCResult(application_id=application_id, status="SUCCESS")
            else:
                await self.escalate_to_manual(application_id, "KYC failed verification")
                return KYCResult(application_id=application_id, status="FAILED")
        except Exception as e:
            # Circuit breaker trip or network failure
            await self.escalate_to_manual(application_id, f"KYC Service Error: {str(e)}")
            return KYCResult(application_id=application_id, status="ESCALATED")

    async def verify_bank(self, application_id: str) -> BankVerifyResult:
        try:
            bank_valid = await self.bank.verify(self.db[application_id]["beneficiary_id"])
            if bank_valid:
                await self._transition(application_id, LoanState.BANK_VERIFIED)
                return BankVerifyResult(application_id=application_id, status="SUCCESS")
            else:
                await self.escalate_to_manual(application_id, "Bank verification failed")
                return BankVerifyResult(application_id=application_id, status="FAILED")
        except Exception as e:
            await self.escalate_to_manual(application_id, f"Bank Service Error: {str(e)}")
            return BankVerifyResult(application_id=application_id, status="ESCALATED")

    async def approve_and_disburse(self, application_id: str, officer_jwt: str, secondary_jwt: str = None) -> DisbursalResult:
        app = self.db.get(application_id)
        if app["state"] != LoanState.BANK_VERIFIED:
            return DisbursalResult(application_id=application_id, status="ERROR", message="Application must be BANK_VERIFIED before approval")

        officer_id = officer_jwt.split(".")[0] if officer_jwt else "system"
        
        # Rule 1: Max 50 auto-approvals per officer per day
        today = datetime.utcnow().strftime("%Y-%m-%d")
        redis_key = f"approvals:{officer_id}:{today}"
        count = await self.redis.get(redis_key)
        
        if count and int(count) >= 50:
            await self.escalate_to_manual(application_id, f"Officer {officer_id} exceeded daily auto-approval limit (50).")
            return DisbursalResult(application_id=application_id, status="ESCALATED", message="Approval limit reached")

        # Rule 2: Disbursals > INR 2 Lakh require dual officer approval
        two_lakh_paise = 200000 * 100
        if app["loan_amount_paise"] > two_lakh_paise:
            if not secondary_jwt or secondary_jwt == officer_jwt:
                await self.escalate_to_manual(application_id, "Loans > 2 Lakh INR require secondary officer JWT token.")
                return DisbursalResult(application_id=application_id, status="ESCALATED", message="Missing 4-eyes approval for large loan")

        # Approval Success
        await self._transition(application_id, LoanState.APPROVED, {"approved_by": officer_id})
        
        # Increment Redis Counter (Daily TTL)
        pipe = self.redis.pipeline()
        pipe.incr(redis_key)
        pipe.expire(redis_key, 86400) # 24 hours
        await pipe.execute()

        # Disbursal Success
        await self._transition(application_id, LoanState.DISBURSED, {"amount_paise": app["loan_amount_paise"]})
        return DisbursalResult(application_id=application_id, status="SUCCESS", message="Amount disbursed via IMPS")

    async def reject(self, application_id: str, reason: str) -> RejectionResult:
        await self._transition(application_id, LoanState.REJECTED, {"reason": reason})
        return RejectionResult(application_id=application_id, status="REJECTED")

    async def escalate_to_manual(self, application_id: str, reason: str) -> EscalationResult:
        await self._transition(application_id, LoanState.MANUAL_REVIEW, {"reason": reason})
        return EscalationResult(application_id=application_id, status="ESCALATED", reason=reason)
