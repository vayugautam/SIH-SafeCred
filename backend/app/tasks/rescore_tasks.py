import asyncio
import uuid
from celery import chord
from app.tasks.celery_app import celery_app
from app.services import scoring_service

# --- ASYNC BOUNDARIES ---

@celery_app.task(bind=True, name="tasks.extract_repayment")
def extract_repayment_task(self, bid: str, ctx: dict):
    # The asyncio.run bridge as requested
    return asyncio.run(scoring_service.extract_repayment_features_async(bid, ctx))

@celery_app.task(bind=True, name="tasks.extract_income")
def extract_income_task(self, bid: str, ctx: dict):
    return asyncio.run(scoring_service.extract_income_features_async(bid, ctx))

@celery_app.task(bind=True, name="tasks.extract_demographic")
def extract_demographic_task(self, bid: str, ctx: dict):
    return asyncio.run(scoring_service.extract_demographic_features_async(bid, ctx))

@celery_app.task(bind=True, name="tasks.persist_score")
def persist_score_task(self, feature_results: list, bid: str, ctx: dict):
    """
    Idempotent callback. 
    `feature_results` is injected automatically by the Celery chord.
    """
    return asyncio.run(scoring_service.persist_score_and_notify_async(bid, feature_results, ctx))


# --- ORCHESTRATION TASKS ---

@celery_app.task(bind=True, name="tasks.rescore_beneficiary")
def rescore_beneficiary(self, bid: str, correlation_id: str = None):
    """
    Kicks off a Fan-Out / Fan-In Chord.
    1. Spawns 3 feature extraction tasks in parallel.
    2. Waits for all 3 to complete.
    3. Triggers persist_score_task.
    """
    req_id = self.request.id or str(uuid.uuid4())
    corr_id = correlation_id or req_id
    
    ctx = {
        "request_id": req_id,
        "beneficiary_id": bid,
        "correlation_id": corr_id
    }
    
    # Define the parallel header
    header = [
        extract_repayment_task.s(bid, ctx),
        extract_income_task.s(bid, ctx),
        extract_demographic_task.s(bid, ctx)
    ]
    
    # Define the callback
    callback = persist_score_task.s(bid, ctx)
    
    # Execute the chord
    result = chord(header)(callback)
    return f"Chord initiated: {result.id}"

@celery_app.task(bind=True, name="tasks.rescore_bulk")
def rescore_bulk(self, bids: list):
    """Fans out individual rescore workflows."""
    corr_id = self.request.id or str(uuid.uuid4())
    for bid in bids:
        rescore_beneficiary.delay(bid, correlation_id=corr_id)
    return {"bulk_job_id": corr_id, "count": len(bids)}

@celery_app.task(bind=True, name="tasks.rescore_stale_periodic")
def rescore_stale_periodic(self):
    """Queries DB for stale profiles and kicks off bulk rescore."""
    # In a real system, asyncio.run(feature_store.list_stale_beneficiaries(30))
    stale_bids = ["BEN1", "BEN2", "BEN3"]
    rescore_bulk.delay(stale_bids)
    return f"Triggered stale rescore for {len(stale_bids)} beneficiaries."

@celery_app.task(bind=True, name="tasks.rescore_on_new_data")
def rescore_on_new_data(self, event: dict):
    """Kafka consumer trigger."""
    bid = event.get("beneficiary_id")
    if bid:
        rescore_beneficiary.delay(bid, correlation_id=event.get("kafka_offset_id"))
