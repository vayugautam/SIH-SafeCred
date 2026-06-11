import time
from celery import shared_task, chord
from typing import List, Dict, Any
from app.tasks.celery_app import celery_app
from app.db.mongodb import mongo_db
from app.ml.feature_engine import feature_store
from app.ml.imputer import imputer
from app.ml.scoring import scoring_engine
from app.services.lending import lending_engine
import asyncio

# --- Mocks for DB Fetching ---
def fetch_old_score(bid: str):
    return {"ccs": 650, "band": "B"}

def publish_band_change_event(bid: str, old_band: str, new_band: str):
    print(f"[KAFKA EVENT] Beneficiary {bid} moved from Band {old_band} to Band {new_band}")

def get_stale_beneficiaries(days: int = 30) -> List[str]:
    return [f"BEN_{i}" for i in range(1, 101)]
# --------------------------

@shared_task(bind=True, acks_late=True, reject_on_worker_lost=True, rate_limit='500/m')
def rescore_beneficiary(self, bid: str) -> dict:
    """
    STEP 10 | Celery re-scoring task fires on new data event or monthly schedule.
    Executes the entire dataflow: Feature Store -> Imputer -> Scoring -> Lending.
    """
    # 1. Fetch old state
    old_state = fetch_old_score(bid)
    old_band = old_state["band"]
    
    # 2. Extract Data from DBs (Simulated)
    loan_data = mongo_db.partner_loans.find_one({"beneficiary_id": bid}) or {}
    ocr_data = mongo_db.alternative_data.find_one({"beneficiary_id": bid, "status": "PROCESSED"}) or {}
    secc_data = mongo_db.socioeconomic_indices.find_one({"district": "New Delhi"}) or {}
    
    # 3. Feature Engine
    raw_feature_vector = feature_store.compute_features(bid, loan_data, ocr_data, secc_data)
    
    # 4. Missing Data Handler (Imputation)
    complete_feature_vector = imputer.impute(raw_feature_vector)
    
    # 5. Scoring Engine & SHAP Compliance
    score_result = scoring_engine.score(complete_feature_vector)
    new_ccs = score_result["composite_score"]
    new_band = score_result["band"]
    
    # Save the compliance report to MongoDB
    shap_doc = score_result["shap_report"]
    shap_doc["beneficiary_id"] = bid
    shap_doc["timestamp"] = time.time()
    mongo_db.shap_compliance_reports.insert_one(shap_doc)
    
    # 6. Digital Lending Engine Check (Simulated $40k loan request)
    lending_engine.process_loan_decision(bid, score_result, requested_amount=40000)
    
    # 7. Compare and trigger event
    band_changed = (old_band != new_band)
    if band_changed:
        publish_band_change_event(bid, old_band, new_band)
        
    return {
        "bid": bid,
        "old_band": old_band,
        "new_band": new_band,
        "band_changed": band_changed,
        "new_ccs": new_ccs
    }

@shared_task
def rescore_bulk_report(results: List[dict]) -> dict:
    """Callback for the Celery Chord. Aggregates results of the fan-out."""
    changed_count = sum(1 for r in results if r.get("band_changed"))
    report = {
        "total_rescored": len(results),
        "total_band_changes": changed_count,
        "timestamp": time.time(),
        "status": "COMPLETED"
    }
    print(f"[BULK REPORT] Rescored {len(results)} users. {changed_count} changed bands.")
    return report

@shared_task
def rescore_bulk(bids: List[str]):
    """Fans out individual rescore tasks via Celery Chord."""
    # Create a chord: [task1, task2...] -> callback
    task_signatures = [rescore_beneficiary.s(bid) for bid in bids]
    callback = rescore_bulk_report.s()
    
    workflow = chord(task_signatures)(callback)
    return "BULK_CHORD_DISPATCHED"

@shared_task
def rescore_stale_periodic():
    """Triggered on the 1st of each month by Celery Beat."""
    bids = get_stale_beneficiaries(30)
    print(f"[CRON] Rescoring {len(bids)} stale beneficiaries...")
    if bids:
        rescore_bulk.delay(bids)
    return f"Triggered rescore for {len(bids)} profiles."

@shared_task(countdown=600) # Execute exactly 10 minutes after dispatch
def rescore_on_new_data(event_payload: dict):
    """
    Triggered by a Kafka Consumer listening to DataIngestionEvents.
    Fires with a 10 minute countdown to allow related batch data to arrive.
    """
    bid = event_payload.get("beneficiary_id")
    if bid:
        print(f"[NEW DATA EVENT] Re-scoring {bid} due to fresh repayment/consumption data...")
        return rescore_beneficiary(bid)
