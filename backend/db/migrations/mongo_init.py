import os
from pymongo import MongoClient, ASCENDING, DESCENDING
import logging

logger = logging.getLogger(__name__)

def init_mongo_db():
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
    client = MongoClient(mongo_url)
    db = client["safecred_ml_store"]
    
    # =========================================================================
    # 1. income_posteriors
    # =========================================================================
    income_posteriors_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["beneficiary_id", "posterior", "predicted_band", "confidence"],
            "properties": {
                "beneficiary_id": {"bsonType": "string"},
                "posterior": {
                    "bsonType": "array",
                    "minItems": 5,
                    "maxItems": 5,
                    "items": {
                        "bsonType": "double",
                        "minimum": 0.0,
                        "maximum": 1.0
                    }
                },
                "predicted_band": {"bsonType": "int", "minimum": 1, "maximum": 5},
                "confidence": {"bsonType": "double", "minimum": 0.0, "maximum": 1.0},
                "signal_history": {"bsonType": "array"},
                "prior_source": {"bsonType": "string"},
                "model_version": {"bsonType": "string"},
                "updated_at": {"bsonType": "date"},
                "created_at": {"bsonType": "date"}
            }
        }
    }
    
    if "income_posteriors" not in db.list_collection_names():
        db.create_collection("income_posteriors", validator=income_posteriors_schema)
    else:
        db.command("collMod", "income_posteriors", validator=income_posteriors_schema)
        
    db["income_posteriors"].create_index([("beneficiary_id", ASCENDING)], unique=True)
    db["income_posteriors"].create_index([("updated_at", DESCENDING)])


    # =========================================================================
    # 2. raw_consumption_docs
    # =========================================================================
    raw_consumption_docs_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["beneficiary_id", "file_type", "file_hash", "ocr_raw_text"],
            "properties": {
                "beneficiary_id": {"bsonType": "string"},
                "file_type": {"bsonType": "string"},
                "file_hash": {"bsonType": "string"},
                "document_type": {"bsonType": "string"},
                "ocr_raw_text": {"bsonType": "string"},
                "extracted_fields": {"bsonType": "object"},
                "ocr_confidence": {"bsonType": "double", "minimum": 0.0, "maximum": 1.0},
                "needs_manual_review": {"bsonType": "bool"},
                "parsing_version": {"bsonType": "string"},
                "uploaded_at": {"bsonType": "date"},
                "processed_at": {"bsonType": ["date", "null"]}
            }
        }
    }
    
    if "raw_consumption_docs" not in db.list_collection_names():
        db.create_collection("raw_consumption_docs", validator=raw_consumption_docs_schema)
    else:
        db.command("collMod", "raw_consumption_docs", validator=raw_consumption_docs_schema)
        
    db["raw_consumption_docs"].create_index([("file_hash", ASCENDING)], unique=True)
    # 720 Days TTL Index natively purges old documents
    db["raw_consumption_docs"].create_index([("uploaded_at", ASCENDING)], expireAfterSeconds=62208000)


    # =========================================================================
    # 3. shap_explanations
    # =========================================================================
    shap_explanations_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["beneficiary_id", "score_id", "shap_values"],
            "properties": {
                "beneficiary_id": {"bsonType": "string"},
                "score_id": {"bsonType": "string"},
                "shap_values": {"bsonType": "object"},
                "base_value": {"bsonType": "double"},
                "top_factors": {"bsonType": "array"},
                "income_band_reason": {"bsonType": "string"},
                "data_completeness_pct": {"bsonType": "double"},
                "model_version": {"bsonType": "string"},
                "generated_at": {"bsonType": "date"}
            }
        }
    }
    
    if "shap_explanations" not in db.list_collection_names():
        db.create_collection("shap_explanations", validator=shap_explanations_schema)
    else:
        db.command("collMod", "shap_explanations", validator=shap_explanations_schema)
        
    db["shap_explanations"].create_index([("beneficiary_id", ASCENDING), ("score_id", ASCENDING)], unique=True)


    # =========================================================================
    # 4. model_health_logs
    # =========================================================================
    model_health_logs_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["model_version", "check_date", "auc_score"],
            "properties": {
                "model_version": {"bsonType": "string"},
                "check_date": {"bsonType": "date"},
                "auc_score": {"bsonType": "double"},
                "psi_scores": {"bsonType": "object"},
                "ks_statistic": {"bsonType": "double"},
                "drift_detected": {"bsonType": "bool"},
                "drift_features": {"bsonType": "array"},
                "action_taken": {"bsonType": "string"},
                "checked_at": {"bsonType": "date"}
            }
        }
    }
    
    if "model_health_logs" not in db.list_collection_names():
        db.create_collection("model_health_logs", validator=model_health_logs_schema)
    else:
        db.command("collMod", "model_health_logs", validator=model_health_logs_schema)
        
    db["model_health_logs"].create_index([("model_version", ASCENDING), ("check_date", DESCENDING)])
    
    print("Successfully initialized MongoDB collections, schemas, and indexes.")

if __name__ == "__main__":
    init_mongo_db()
