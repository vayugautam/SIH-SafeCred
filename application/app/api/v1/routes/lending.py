from fastapi import APIRouter, Query
from app.db.mongodb import mongo_db
import pymongo

router = APIRouter()

@router.get("/")
async def list_loans(limit: int = Query(10), sort: str = Query("applied_at")):
    """
    P02 - Genuine Route for Recent Applications
    Fetches the latest lending decisions from MongoDB.
    """
    sort_field = "timestamp" if sort == "applied_at" else sort
    
    cursor = mongo_db.lending_decisions.find({}).sort(sort_field, pymongo.DESCENDING).limit(limit)
    decisions = list(cursor)
    
    # Format for JSON response
    for d in decisions:
        d["_id"] = str(d["_id"])
        
    return {"status": "SUCCESS", "data": decisions}
