import asyncio
import logging

logger = logging.getLogger(__name__)

async def extract_repayment_features_async(bid: str, ctx: dict) -> dict:
    """Async wrapper for the RepaymentFeatureExtractor"""
    # Simulate DB/Kafka IO
    await asyncio.sleep(0.1)
    return {"bid": bid, "avg_days_past_due": 5.0, "emi_hit_rate": 95.0, "context": ctx}

async def extract_income_features_async(bid: str, ctx: dict) -> dict:
    """Async wrapper for the IncomeProxyExtractor"""
    await asyncio.sleep(0.1)
    return {"bid": bid, "avg_monthly_recharge_amount": 250, "context": ctx}

async def extract_demographic_features_async(bid: str, ctx: dict) -> dict:
    """Async extraction of District/State priors"""
    await asyncio.sleep(0.1)
    return {"bid": bid, "district": "Aligarh", "context": ctx}

async def persist_score_and_notify_async(bid: str, features: list, ctx: dict) -> dict:
    """Idempotent final callback for the chord."""
    # features will be a list of results from the 3 parallel extractors
    await asyncio.sleep(0.2)
    
    # Calculate fake CCS for demo
    new_ccs = 720
    new_band = "B"
    old_band = "C" # Simulated DB fetch
    
    event_emitted = False
    if new_band != old_band:
        # We would use our stateful get_kafka_producer() here
        logger.info(f"[{ctx.get('request_id')}] BAND CHANGE for {bid}: {old_band} -> {new_band}")
        event_emitted = True
        
    return {
        "beneficiary_id": bid,
        "composite_score": new_ccs,
        "risk_band": new_band,
        "event_emitted": event_emitted,
        "correlation_id": ctx.get("correlation_id")
    }
