import asyncio
import json
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from circuitbreaker import circuit

class LendingState(str, Enum):
    INITIATED = "INITIATED"
    SCORE_VERIFIED = "SCORE_VERIFIED"
    KYC_PENDING = "KYC_PENDING"
    KYC_DONE = "KYC_DONE"
    BANK_VERIFIED = "BANK_VERIFIED"
    APPROVED = "APPROVED"
    DISBURSED = "DISBURSED"
    # Failure states
    REJECTED = "REJECTED"
    MANUAL_REVIEW = "MANUAL_REVIEW"
    SUSPENDED = "SUSPENDED"

@dataclass
class ApplicationResult:
    application_id: str
    state: LendingState
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    message: str = "Success"

class DigitalLendingOrchestrator:
    # 4-eyes principle threshold: INR 2 Lakh (in paise)
    TWO_LAKH_PAISE = 200_000_00 * 100

    def __init__(self, mongo_collection, redis_client, kafka_producer):
        self.mongo = mongo_collection
        self.redis = redis_client
        self.kafka = kafka_producer

    async def _send_sms_stub(self, beneficiary_id: str, message: str):
        """Fire and forget SMS notification."""
        print(f"[SMS STUB] To {beneficiary_id}: {message}")
        await asyncio.sleep(0.1) # Simulate network

    async def _transition_state(self, application_id: str, old_state: Optional[LendingState], new_state: LendingState, payload: Dict[str, Any]) -> ApplicationResult:
        """
        Handles atomic state transitions:
        1. Write Audit Log
        2. Await Kafka publish (Event Consistency)
        3. Dispatch SMS
        """
        # Audit Trail
        audit_entry = {
            "application_id": application_id,
            "old_state": old_state.value if old_state else None,
            "new_state": new_state.value,
            "timestamp": datetime.utcnow().isoformat(),
            "payload": payload
        }
        self.mongo.insert_one(audit_entry)

        # Await Kafka Acknowledgment (Strict Consistency)
        event_payload = json.dumps(audit_entry).encode('utf-8')
        try:
            # We assume a mock or aiokafka signature like send_and_wait
            await self.kafka.send_and_wait("lending_events", event_payload)
        except Exception as e:
            print(f"Failed to publish to Kafka: {e}")
            raise RuntimeError("Kafka event dropped, halting state transition.")

        # Fire and forget SMS
        asyncio.create_task(self._send_sms_stub(payload.get("beneficiary_id", "UNKNOWN"), f"Loan status updated to {new_state.value}"))

        return ApplicationResult(application_id=application_id, state=new_state)

    async def initiate(self, beneficiary_id: str, loan_amount_paise: int, requested_by: str) -> ApplicationResult:
        if not isinstance(loan_amount_paise, int):
            raise TypeError("loan_amount_paise MUST be an integer to avoid float errors.")
            
        import uuid
        app_id = f"APP-{uuid.uuid4().hex[:8].upper()}"
        
        payload = {
            "beneficiary_id": beneficiary_id,
            "loan_amount_paise": loan_amount_paise,
            "requested_by": requested_by
        }
        
        return await self._transition_state(app_id, None, LendingState.INITIATED, payload)

    async def verify_score(self, application_id: str, beneficiary_id: str) -> ApplicationResult:
        # In a real app, this fetches state from DB. We mock the flow.
        return await self._transition_state(application_id, LendingState.INITIATED, LendingState.SCORE_VERIFIED, {"beneficiary_id": beneficiary_id})

    @circuit(failure_threshold=3, expected_exception=Exception)
    async def _external_kyc_call(self):
        """Simulated external KYC vendor call."""
        pass

    async def run_kyc(self, application_id: str, beneficiary_id: str) -> ApplicationResult:
        try:
            await self._external_kyc_call()
            return await self._transition_state(application_id, LendingState.SCORE_VERIFIED, LendingState.KYC_DONE, {"beneficiary_id": beneficiary_id})
        except Exception as e:
            return await self._transition_state(application_id, LendingState.SCORE_VERIFIED, LendingState.SUSPENDED, {"beneficiary_id": beneficiary_id, "error": str(e)})

    @circuit(failure_threshold=3, expected_exception=Exception)
    async def _external_bank_call(self):
        """Simulated external Bank Verification call."""
        pass

    async def verify_bank(self, application_id: str, beneficiary_id: str) -> ApplicationResult:
        try:
            await self._external_bank_call()
            return await self._transition_state(application_id, LendingState.KYC_DONE, LendingState.BANK_VERIFIED, {"beneficiary_id": beneficiary_id})
        except Exception as e:
            return await self._transition_state(application_id, LendingState.KYC_DONE, LendingState.SUSPENDED, {"beneficiary_id": beneficiary_id, "error": str(e)})

    async def approve_and_disburse(
        self, 
        application_id: str, 
        beneficiary_id: str,
        loan_amount_paise: int, 
        primary_officer_jwt: str, 
        secondary_officer_jwt: Optional[str] = None
    ) -> ApplicationResult:
        
        if not isinstance(loan_amount_paise, int):
            raise TypeError("loan_amount_paise MUST be an integer.")

        # 4-Eyes Principle
        if loan_amount_paise > self.TWO_LAKH_PAISE:
            if not secondary_officer_jwt or primary_officer_jwt == secondary_officer_jwt:
                return await self.escalate_to_manual(application_id, beneficiary_id, "Disbursal > 2 Lakh requires distinct secondary_officer_jwt.")

        # Redis Auto-Approval Rate Limiting
        today = datetime.utcnow().strftime("%Y-%m-%d")
        redis_key = f"auto_approvals:{primary_officer_jwt}:{today}"
        
        # Increment counter
        count = await self.redis.incr(redis_key)
        if count == 1:
            await self.redis.expire(redis_key, 86400) # Daily TTL
            
        if count > 50:
            return await self.escalate_to_manual(application_id, beneficiary_id, "Officer exceeded 50 auto-approvals limit for the day.")

        # Approve
        await self._transition_state(application_id, LendingState.BANK_VERIFIED, LendingState.APPROVED, {"beneficiary_id": beneficiary_id})
        
        # Disburse
        return await self._transition_state(application_id, LendingState.APPROVED, LendingState.DISBURSED, {
            "beneficiary_id": beneficiary_id,
            "loan_amount_paise": loan_amount_paise,
            "disbursed_by": primary_officer_jwt,
            "co_approved_by": secondary_officer_jwt
        })

    async def reject(self, application_id: str, beneficiary_id: str, reason: str) -> ApplicationResult:
        return await self._transition_state(application_id, None, LendingState.REJECTED, {"beneficiary_id": beneficiary_id, "reason": reason})

    async def escalate_to_manual(self, application_id: str, beneficiary_id: str, reason: str) -> ApplicationResult:
        return await self._transition_state(application_id, None, LendingState.MANUAL_REVIEW, {"beneficiary_id": beneficiary_id, "reason": reason})
