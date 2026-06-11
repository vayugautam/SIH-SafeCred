from fastapi import APIRouter
from app.db.mongodb import mongo_db
from datetime import datetime, timedelta
import time

router = APIRouter()

@router.get("/summary")
async def get_dashboard_summary():
    """
    P02 - Genuine KPI Aggregations from MongoDB
    """
    # 1. Total Scored
    total_scored = mongo_db.lending_decisions.count_documents({})
    
    # 2. Average Composite Score
    # Using MongoDB Aggregation Pipeline
    avg_score_pipeline = [
        {"$group": {"_id": None, "avg_score": {"$avg": "$score_snapshot"}}}
    ]
    avg_score_result = list(mongo_db.lending_decisions.aggregate(avg_score_pipeline))
    avg_score = int(avg_score_result[0]["avg_score"]) if avg_score_result else 0
    
    # 3. Disbursals Today
    # Get start of today epoch
    start_of_today = time.mktime(datetime.today().replace(hour=0, minute=0, second=0, microsecond=0).timetuple())
    disbursals_today = mongo_db.lending_decisions.count_documents({
        "decision": "AUTO_APPROVED",
        "timestamp": {"$gte": start_of_today}
    })
    
    # 4. Pending Manual Reviews
    pending_reviews = mongo_db.lending_decisions.count_documents({
        "decision": "MANUAL_REVIEW"
    })
    
    return {
        "total_scored": total_scored,
        "avg_score": avg_score,
        "disbursals_today": disbursals_today,
        "pending_reviews": pending_reviews
    }

@router.get("/bands/distribution")
async def get_band_distribution():
    """
    P02 - Band Distribution for Recharts BarChart
    """
    pipeline = [
        {"$group": {"_id": "$band_snapshot", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    results = list(mongo_db.lending_decisions.aggregate(pipeline))
    
    # Format for Recharts
    chart_data = []
    # Ensure all bands A-E exist
    band_counts = {r["_id"]: r["count"] for r in results if r["_id"]}
    for band in ["A", "B", "C", "D", "E"]:
        chart_data.append({
            "name": f"Band {band}",
            "value": band_counts.get(band, 0)
        })
        
    return chart_data

@router.get("/score/histogram")
async def get_score_histogram():
    """
    P02 - Score Histogram (100 point buckets)
    """
    # Create buckets using $bucket
    pipeline = [
        {
            "$bucket": {
                "groupBy": "$score_snapshot",
                "boundaries": [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
                "default": "Other",
                "output": {"count": {"$sum": 1}}
            }
        }
    ]
    results = list(mongo_db.lending_decisions.aggregate(pipeline))
    
    chart_data = []
    bucket_counts = {r["_id"]: r["count"] for r in results if isinstance(r["_id"], int)}
    for i in range(0, 1000, 100):
        chart_data.append({
            "range": f"{i}-{i+100}",
            "count": bucket_counts.get(i, 0)
        })
        
    return chart_data

@router.get("/export")
async def export_dashboard_pdf():
    """
    Stub for PDF Export as requested.
    """
    return {"status": "success", "message": "PDF Generation Stub. Real implementation deferred to separate sprint."}

from fastapi import WebSocket, WebSocketDisconnect
import asyncio

@router.websocket("/ws/activity")
async def websocket_activity_endpoint(websocket: WebSocket):
    """
    P02 - Genuine WebSocket for Activity Feed
    """
    await websocket.accept()
    try:
        # Mocking real-time event pushing for now. In a full production system, 
        # this would subscribe to a Redis Pub/Sub channel or Kafka topic.
        while True:
            # Fetch the latest 5 compliance reports from MongoDB
            cursor = mongo_db.shap_compliance_reports.find({}).sort("timestamp", -1).limit(5)
            latest_events = list(cursor)
            
            payload = []
            for ev in latest_events:
                payload.append({
                    "id": str(ev["_id"]),
                    "beneficiary_id": ev.get("beneficiary_id", "Unknown"),
                    "message": f"Re-scored: Base Value {ev.get('base_value', 0):.2f}",
                    "timestamp": ev.get("timestamp", time.time())
                })
                
            await websocket.send_json({"type": "ACTIVITY_UPDATE", "data": payload})
            await asyncio.sleep(5) # Poll every 5 seconds
    except WebSocketDisconnect:
        print("[WEBSOCKET] Client disconnected from activity feed.")
