import pytest
import asyncio
from unittest.mock import MagicMock, patch
from application.services.digital_lending import DigitalLendingOrchestrator, LoanState

@pytest.fixture
def orchestrator():
    # Provide a mock redis URL or patch it. Since we are using redis.asyncio, we should patch it.
    with patch("application.services.digital_lending.Redis.from_url") as mock_redis:
        mock_instance = MagicMock()
        # Ensure async methods on redis mock
        mock_instance.get = AsyncMock(return_value=None)
        
        # Pipeline mock
        pipe_mock = MagicMock()
        pipe_mock.incr = MagicMock()
        pipe_mock.expire = MagicMock()
        pipe_mock.execute = AsyncMock()
        mock_instance.pipeline.return_value = pipe_mock
        
        mock_redis.return_value = mock_instance
        o = DigitalLendingOrchestrator("redis://mock")
        # Override Kafka and SMS for clean async testing
        o.kafka.publish = AsyncMock()
        o.sms.send_sms = AsyncMock()
        o.kyc.verify = AsyncMock(return_value=True)
        o.bank.verify = AsyncMock(return_value=True)
        
        yield o

# Helper class to mock async methods easily
class AsyncMock(MagicMock):
    async def __call__(self, *args, **kwargs):
        return super(AsyncMock, self).__call__(*args, **kwargs)

@pytest.mark.asyncio
async def test_successful_lending_pipeline(orchestrator):
    # 1. Initiate
    init_res = await orchestrator.initiate("BEN123", 50000.00, "officer_1")
    app_id = init_res.application_id
    assert init_res.status == "INITIATED"
    assert orchestrator.db[app_id]["loan_amount_paise"] == 5000000 # 50k INR * 100
    
    # 2. Score Verify
    await orchestrator.verify_score(app_id)
    assert orchestrator.db[app_id]["state"] == LoanState.SCORE_VERIFIED
    
    # 3. KYC
    await orchestrator.run_kyc(app_id)
    assert orchestrator.db[app_id]["state"] == LoanState.KYC_DONE
    
    # 4. Bank
    await orchestrator.verify_bank(app_id)
    assert orchestrator.db[app_id]["state"] == LoanState.BANK_VERIFIED
    
    # 5. Approve & Disburse
    res = await orchestrator.approve_and_disburse(app_id, "officer1.jwt.token")
    assert res.status == "SUCCESS"
    assert orchestrator.db[app_id]["state"] == LoanState.DISBURSED
    
    # Check audit trail length (INITIATED, SCORE_VERIFIED, KYC_PENDING, KYC_DONE, BANK_VERIFIED, APPROVED, DISBURSED)
    assert len(orchestrator.db[app_id]["audit_trail"]) == 7

@pytest.mark.asyncio
async def test_dual_approval_required_for_large_loans(orchestrator):
    # Initiate 3 Lakh INR loan
    init_res = await orchestrator.initiate("BEN123", 300000.00, "officer_1")
    app_id = init_res.application_id
    
    # Fast forward to Bank Verified
    orchestrator.db[app_id]["state"] = LoanState.BANK_VERIFIED
    
    # Try to approve with only 1 officer
    res = await orchestrator.approve_and_disburse(app_id, "officer1.token")
    assert res.status == "ESCALATED"
    assert orchestrator.db[app_id]["state"] == LoanState.MANUAL_REVIEW
    
    # Reset and try with 2 valid distinct tokens
    orchestrator.db[app_id]["state"] = LoanState.BANK_VERIFIED
    res2 = await orchestrator.approve_and_disburse(app_id, "officer1.token", "officer2.token")
    assert res2.status == "SUCCESS"
    assert orchestrator.db[app_id]["state"] == LoanState.DISBURSED

@pytest.mark.asyncio
async def test_daily_limit_circuit(orchestrator):
    # Mock redis to return 50 auto-approvals already done
    orchestrator.redis.get = AsyncMock(return_value="50")
    
    init_res = await orchestrator.initiate("BEN123", 10000.00, "officer_1")
    app_id = init_res.application_id
    orchestrator.db[app_id]["state"] = LoanState.BANK_VERIFIED
    
    res = await orchestrator.approve_and_disburse(app_id, "officer1.token")
    assert res.status == "ESCALATED"
    assert orchestrator.db[app_id]["state"] == LoanState.MANUAL_REVIEW
