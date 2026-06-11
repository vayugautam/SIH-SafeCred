import os
import sys
from pymongo import MongoClient, ASCENDING, DESCENDING

def run_migration():
    # If python-dotenv is available, try to load .env
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass

    # Use MONGO_URI from env if inside docker, otherwise use the localhost equivalent for the host machine
    mongo_uri = os.getenv("MONGO_URI", "mongodb://mongo_user:mongo_pass@localhost:27017/safecred?authSource=admin")
    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        db = client.safecred
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        sys.exit(1)

    # 1. income_posteriors Validator
    income_posteriors_validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["beneficiary_id", "posterior", "predicted_band", "confidence"],
            "properties": {
                "beneficiary_id": {"bsonType": "string", "description": "must be a string and is required"},
                "posterior": {
                    "bsonType": "array",
                    "minItems": 5,
                    "maxItems": 5,
                    "items": {"bsonType": "double"}
                },
                "predicted_band": {"bsonType": "int", "minimum": 1, "maximum": 5},
                "confidence": {"bsonType": "double"},
                "signal_history": {
                    "bsonType": "array",
                    "items": {
                        "bsonType": "object",
                        "required": ["type", "value", "ts", "weight"],
                        "properties": {
                            "type": {"bsonType": "string"},
                            "value": {"bsonType": ["double", "int", "string"]},
                            "ts": {"bsonType": "date"},
                            "weight": {"bsonType": "double"}
                        }
                    }
                },
                "prior_source": {"bsonType": "string"},
                "updated_at": {"bsonType": "date"}
            }
        }
    }

    # 2. raw_consumption_docs Validator
    raw_consumption_docs_validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["beneficiary_id", "file_type", "file_hash", "uploaded_at"],
            "properties": {
                "beneficiary_id": {"bsonType": "string"},
                "file_type": {"bsonType": "string"},
                "file_hash": {"bsonType": "string"},
                "ocr_raw_text": {"bsonType": "string"},
                "extracted_fields": {"bsonType": "object"},
                "ocr_confidence": {"bsonType": "double"},
                "parsing_version": {"bsonType": "string"},
                "uploaded_at": {"bsonType": "date"},
                "processed_at": {"bsonType": "date"}
            }
        }
    }

    # 3. shap_explanations Validator
    shap_explanations_validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["beneficiary_id", "score_id", "shap_values", "base_value", "top_factors", "generated_at"],
            "properties": {
                "beneficiary_id": {"bsonType": "string"},
                "score_id": {"bsonType": "string"},
                "shap_values": {"bsonType": "object"},
                "base_value": {"bsonType": "double"},
                "top_factors": {
                    "bsonType": "array",
                    "items": {
                        "bsonType": "object",
                        "required": ["feature", "contribution", "label", "value"]
                    }
                },
                "income_band_reason": {"bsonType": "string"},
                "data_completeness_pct": {"bsonType": "double"},
                "model_version": {"bsonType": "string"},
                "generated_at": {"bsonType": "date"}
            }
        }
    }

    # 4. model_health_logs Validator
    model_health_logs_validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["check_date", "model_version", "auc_score", "drift_detected", "checked_at"],
            "properties": {
                "check_date": {"bsonType": "date"},
                "model_version": {"bsonType": "string"},
                "auc_score": {"bsonType": "double"},
                "psi_scores": {"bsonType": "object"},
                "ks_statistic": {"bsonType": "double"},
                "drift_detected": {"bsonType": "bool"},
                "drift_features": {
                    "bsonType": "array",
                    "items": {"bsonType": "string"}
                },
                "action_taken": {"bsonType": "string"},
                "checked_at": {"bsonType": "date"}
            }
        }
    }

    # List of collections mapping to their validator rules
    collections_to_create = [
        ("income_posteriors", income_posteriors_validator),
        ("raw_consumption_docs", raw_consumption_docs_validator),
        ("shap_explanations", shap_explanations_validator),
        ("model_health_logs", model_health_logs_validator)
    ]

    existing_collections = db.list_collection_names()

    # Step 1: Create Collections & Apply Schema Validation
    for coll_name, validator in collections_to_create:
        if coll_name not in existing_collections:
            db.create_collection(coll_name, validator=validator)
            print(f"[+] Created collection '{coll_name}' with $jsonSchema validators.")
        else:
            db.command("collMod", coll_name, validator=validator)
            print(f"[*] Updated $jsonSchema validators for existing collection '{coll_name}'.")

    # Step 2: Build Indexes
    print("Building indexes...")
    
    # income_posteriors
    db.income_posteriors.create_index([("beneficiary_id", ASCENDING)], unique=True, background=True)
    
    # raw_consumption_docs
    db.raw_consumption_docs.create_index([("file_hash", ASCENDING)], unique=True, background=True)
    # TTL Index: expire after 720 days (62,208,000 seconds)
    db.raw_consumption_docs.create_index([("uploaded_at", ASCENDING)], expireAfterSeconds=62208000, background=True)
    
    # shap_explanations
    db.shap_explanations.create_index([("score_id", ASCENDING)], background=True)
    
    # model_health_logs
    db.model_health_logs.create_index([("check_date", ASCENDING)], background=True)
    db.model_health_logs.create_index([("model_version", ASCENDING), ("check_date", ASCENDING)], background=True)

    print("MongoDB Migration successfully completed.")

if __name__ == "__main__":
    run_migration()
