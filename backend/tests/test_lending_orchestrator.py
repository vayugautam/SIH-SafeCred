import pytest
import asyncio
from unittest.mock import MagicMock, AsyncMock
from backend.services.lending_orchestrator import DigitalLendingOrchestrator, LendingState

@pytest.fixture
def mock_mongo():
    return MagicMock()

@pytest.fixture
def mock_redis():
    mock = AsyncMock()
    # Default to returning 1 for incr to stay under the 50 limit
    mock.incr.return_value = 1
    return mock

@pytest.fixture
def mock_kafka():
    # Kafka send_and_wait must be an async method
    mock = AsyncMock()
    return mock

@pytest.fixture
def orchestrator(mock_mongo, mock_redis, mock_kafka):
    return DigitalLendingOrchestrator(mock_mongo, mock_redis, mock_kafka)

@pytest.mark.asyncio
async def test_initiate_float_error(orchestrator):
    # Should throw TypeError if passing floats
    with pytest.raises(TypeError):
        await orchestrator.initiate("BEN1", 50000.50, "OFFICER1")

@pytest.mark.asyncio
async def test_happy_path(orchestrator, mock_kafka):
    # INITIATED
    res1 = await orchestrator.initiate("BEN1", 50000_00, "OFFICER1")
    assert res1.state == LendingState.INITIATED
    mock_kafka.send_and_wait.assert_called_once()
    
    # KYC
    res2 = await orchestrator.run_kyc(res1.application_id, "BEN1")
    assert res2.state == LendingState.KYC_DONE
    
    # Disburse (under 2 Lakh, single JWT is fine)
    res3 = await orchestrator.approve_and_disburse(
        res1.application_id, 
        "BEN1", 
        100000_00, # 1 Lakh
        "OFFICER_JWT_1"
    )
    assert res3.state == LendingState.DISBURSED

@pytest.mark.asyncio
async def test_4_eyes_principle_rejection(orchestrator):
    res1 = await orchestrator.initiate("BEN1", 250000_00, "OFFICER1")
    
    # Disburse 2.5 Lakh with only 1 officer
    res2 = await orchestrator.approve_and_disburse(
        res1.application_id, 
        "BEN1", 
        250000_00, 
        "OFFICER_JWT_1"
    )
    
    # Must escalate
    assert res2.state == LendingState.MANUAL_REVIEW

@pytest.mark.asyncio
async def test_4_eyes_principle_approval(orchestrator):
    res1 = await orchestrator.initiate("BEN1", 250000_00, "OFFICER1")
    
    # Disburse 2.5 Lakh with 2 distinct officers
    res2 = await orchestrator.approve_and_disburse(
        res1.application_id, 
        "BEN1", 
        250000_00, 
        "OFFICER_JWT_1",
        "OFFICER_JWT_2"
    )
    
    # Must succeed
    assert res2.state == LendingState.DISBURSED

@pytest.mark.asyncio
async def test_redis_rate_limit(orchestrator, mock_redis):
    # Simulate officer who already approved 50 loans today
    mock_redis.incr.return_value = 51
    
    res1 = await orchestrator.initiate("BEN1", 50000_00, "OFFICER1")
    
    res2 = await orchestrator.approve_and_disburse(
        res1.application_id, 
        "BEN1", 
        50000_00, 
        "OFFICER_JWT_1"
    )
    
    # Should escalate to manual
    assert res2.state == LendingState.MANUAL_REVIEW

@pytest.mark.asyncio
async def test_kafka_failure_halts_transition(orchestrator, mock_kafka):
    # If Kafka goes down, the orchestrator MUST NOT transition state
    mock_kafka.send_and_wait.side_effect = Exception("Kafka Cluster Down")
    
    with pytest.raises(RuntimeError):
        await orchestrator.initiate("BEN1", 50000_00, "OFFICER1")
