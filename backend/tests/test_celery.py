import pytest
import asyncio
from unittest.mock import patch, MagicMock

# Import the actual tasks
from app.tasks import rescore_tasks

@patch('app.tasks.rescore_tasks.scoring_service')
def test_extract_repayment_task_bridge(mock_service):
    # Mock the async function to return a future
    async def mock_async_fn(bid, ctx):
        return {"result": "success"}
        
    mock_service.extract_repayment_features_async.side_effect = mock_async_fn
    
    ctx = {"request_id": "REQ1"}
    
    # We call the internal python function behind the celery task wrapper
    result = rescore_tasks.extract_repayment_task("BEN1", ctx)
    
    # Assert asyncio.run bridge worked
    assert result == {"result": "success"}
    mock_service.extract_repayment_features_async.assert_called_once_with("BEN1", ctx)

@patch('app.tasks.rescore_tasks.scoring_service')
def test_persist_score_callback_idempotence(mock_service):
    async def mock_async_persist(bid, features, ctx):
        return {"event_emitted": True}
        
    mock_service.persist_score_and_notify_async.side_effect = mock_async_persist
    
    # Simulated chord header results
    chord_results = [
        {"avg_days_past_due": 5.0},
        {"avg_monthly_recharge": 250},
        {"district": "Aligarh"}
    ]
    
    ctx = {"request_id": "REQ1", "correlation_id": "CORR1"}
    
    result = rescore_tasks.persist_score_task(chord_results, "BEN1", ctx)
    
    assert result["event_emitted"] is True
    mock_service.persist_score_and_notify_async.assert_called_once_with("BEN1", chord_results, ctx)
