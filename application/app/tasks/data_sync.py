from celery import shared_task
from app.db.mongodb import mongo_db
import random
from datetime import datetime

@shared_task
def sync_secc_pmgdisha_data():
    """
    STEP 3 | Airflow DAG runs nightly (mapped to Celery Beat here):
    Fetches SECC / NSS / PMGDISHA data -> normalises -> upserts socioeconomic_indices table.
    """
    print(f"[DATA SYNC] Starting nightly sync for SECC and PMGDISHA data at {datetime.now()}")
    
    # Mock fetching from Government APIs
    mock_new_data = [
        {"district": "New Delhi", "secc_wealth_index": random.uniform(0.6, 0.9), "pmgdisha_literacy_rate": random.uniform(0.7, 0.95), "last_updated": datetime.now()},
        {"district": "North East Delhi", "secc_wealth_index": random.uniform(0.2, 0.5), "pmgdisha_literacy_rate": random.uniform(0.4, 0.6), "last_updated": datetime.now()},
        {"district": "South Delhi", "secc_wealth_index": random.uniform(0.5, 0.8), "pmgdisha_literacy_rate": random.uniform(0.6, 0.85), "last_updated": datetime.now()}
    ]
    
    # Upsert into MongoDB
    for record in mock_new_data:
        mongo_db.socioeconomic_indices.update_one(
            {"district": record["district"]},
            {"$set": record},
            upsert=True
        )
        
    print(f"[DATA SYNC] Successfully normalized and upserted {len(mock_new_data)} district indices.")
    return {"status": "SUCCESS", "records_synced": len(mock_new_data)}
