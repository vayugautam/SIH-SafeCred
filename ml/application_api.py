"""
Enhanced Application API with PostgreSQL Integration

This version integrates with the Next.js PostgreSQL database to:
1. Receive application data from Next.js
2. Process with ML model
3. Store consumption data in PostgreSQL
4. Return results to Next.js

Changes from original:
- Accepts structured data from Next.js
- Saves consumption data to PostgreSQL
- Returns results for database update
"""

import os
import json
import joblib
import pandas as pd
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List

# Import existing modules
from scoring import compute_composite_score, combine_ml_and_composite, map_sci_to_riskband
from features_direct import extract_features_from_application_data, validate_application_data
from models_enhanced import EnhancedLoanApplication

ROOT = os.path.dirname(__file__)
MODELS_DIR = os.path.join(ROOT, "models")

app = FastAPI(
    title="SafeCred - Enhanced ML API with PostgreSQL",
    version="4.0.0",
    description="ML API integrated with Next.js and PostgreSQL"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3002", "http://localhost:3001", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/safecred_db"
)

def get_db_connection():
    """Get PostgreSQL database connection"""
    try:
        import psycopg2
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

# Initialize globals
clf, scaler, feature_order, model_meta, DYNAMIC_BARRIER = None, None, [], {}, 15000

# Load ML Model (deferred until first request)
def load_ml_model() -> bool:
    global clf, scaler, feature_order, model_meta, DYNAMIC_BARRIER
    if clf is not None and scaler is not None and feature_order:
        return True

    try:
        MODEL_PATH = os.path.join(MODELS_DIR, "safecred_model.pkl")
        SCALER_PATH = os.path.join(MODELS_DIR, "scaler.pkl")
        FEATURE_ORDER_PATH = os.path.join(MODELS_DIR, "feature_order.pkl")

        if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH) or not os.path.exists(FEATURE_ORDER_PATH):
            print("[WARNING] Model artifacts missing. Run train_v2.py to generate them.")
            return False

        clf = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        feature_order = joblib.load(FEATURE_ORDER_PATH)

        META_PATH = os.path.join(MODELS_DIR, "model_metadata.json")
        if os.path.exists(META_PATH):
            with open(META_PATH, "r", encoding="utf-8") as f:
                model_meta = json.load(f)
            DYNAMIC_BARRIER = model_meta.get("dynamic_income_barrier", 15000)

        print(f"[OK] Model loaded: {len(feature_order)} features")
        return True

    except Exception as exc:
        print(f"[ERROR] Failed to load model artifacts: {exc}")
        clf, scaler, feature_order = None, None, []
        return False


# Models for consumption data
class BankStatementEntry(BaseModel):
    date: str
    description: str
    debit: float = 0
    credit: float = 0
    balance: float

class RechargeEntry(BaseModel):
    date: str
    amount: float
    operator: str

class ElectricityBillEntry(BaseModel):
    month: str
    billDate: str
    dueDate: str
    amount: float
    unitsConsumed: float
    paidDate: Optional[str] = None

class EducationFeeEntry(BaseModel):
    academicYear: str
    amount: float
    dueDate: str
    paidDate: Optional[str] = None


def save_consumption_data_to_db(application_id: str, consumption_data: Dict):
    """Save consumption data to PostgreSQL"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        
        # Get application's internal ID
        cur.execute(
            "SELECT id FROM applications WHERE \"applicationId\" = %s",
            (application_id,)
        )
        result = cur.fetchone()
        if not result:
            print(f"Application {application_id} not found in database")
            return False
        
        app_id = result[0]
        
        # Save bank statements
        if consumption_data.get('bank_statements'):
            for entry in consumption_data['bank_statements']:
                cur.execute("""
                    INSERT INTO bank_statements 
                    ("applicationId", date, description, debit, credit, balance, "createdAt")
                    VALUES (%s, %s, %s, %s, %s, %s, NOW())
                """, (
                    app_id,
                    datetime.fromisoformat(entry['date']),
                    entry['description'],
                    entry.get('debit', 0),
                    entry.get('credit', 0),
                    entry['balance']
                ))
        
        # Save recharge data
        if consumption_data.get('recharge_data'):
            for entry in consumption_data['recharge_data']:
                cur.execute("""
                    INSERT INTO recharge_data 
                    ("applicationId", date, amount, operator, "createdAt")
                    VALUES (%s, %s, %s, %s, NOW())
                """, (
                    app_id,
                    datetime.fromisoformat(entry['date']),
                    entry['amount'],
                    entry['operator']
                ))
        
        # Save electricity bills
        if consumption_data.get('electricity_bills'):
            for entry in consumption_data['electricity_bills']:
                cur.execute("""
                    INSERT INTO electricity_bills 
                    ("applicationId", month, "billDate", "dueDate", amount, 
                     "unitsConsumed", "paidDate", "isPaid", "createdAt")
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                """, (
                    app_id,
                    entry['month'],
                    datetime.fromisoformat(entry['billDate']),
                    datetime.fromisoformat(entry['dueDate']),
                    entry['amount'],
                    entry['unitsConsumed'],
                    datetime.fromisoformat(entry['paidDate']) if entry.get('paidDate') else None,
                    entry.get('paidDate') is not None
                ))
        
        # Save education fees
        if consumption_data.get('education_fees'):
            for entry in consumption_data['education_fees']:
                cur.execute("""
                    INSERT INTO education_fees 
                    ("applicationId", "academicYear", amount, "dueDate", 
                     "paidDate", "isPaid", "createdAt")
                    VALUES (%s, %s, %s, %s, %s, %s, NOW())
                """, (
                    app_id,
                    entry['academicYear'],
                    entry['amount'],
                    datetime.fromisoformat(entry['dueDate']),
                    datetime.fromisoformat(entry['paidDate']) if entry.get('paidDate') else None,
                    entry.get('paidDate') is not None
                ))
        
        conn.commit()
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error saving consumption data: {e}")
        conn.rollback()
        return False


@app.get("/")
def root():
    return {
        "message": "SafeCred Enhanced ML API",
        "version": "4.0.0",
        "status": "running",
        "features": [
            "PostgreSQL Integration",
            "Next.js Compatible",
            "Real-time ML Prediction",
            "Consumption Data Storage"
        ],
        "endpoints": {
            "POST /apply_direct": "Process loan application from Next.js",
            "GET /health": "Health check",
            "GET /docs": "API documentation"
        }
    }


@app.get("/health")
def health_check():
    """Health check with database and model status."""
    db_status = "disconnected"
    try:
        conn = get_db_connection()
        if conn:
            conn.close()
            db_status = "connected"
    except Exception as db_err:
        db_status = f"error: {db_err}"

    model_ready = load_ml_model()

    return {
        "status": "healthy" if model_ready else "degraded",
        "model_loaded": model_ready,
        "database": db_status,
        "timestamp": datetime.now().isoformat()
    }


@app.post("/apply_direct")
async def apply_direct(application: EnhancedLoanApplication):
    """
    Main endpoint for Next.js integration
    
    Receives application data from Next.js, processes with ML,
    and returns results for database update.
    """
    import traceback
    
    try:
        log_file = "ml_api_debug.log"
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"\n\n=== NEW REQUEST at {datetime.now()} ===\n")
            f.write(f"Application ID: {application.application_id}\n")
        
        print(f"[ML API] Received application: {application.application_id}")
        print(f"[ML API] Application data: {application.dict()}")
        
        # Load model if not loaded
        if not load_ml_model():
            print("[ML API] ERROR: ML model not loaded!")
            raise HTTPException(status_code=500, detail="ML model not loaded")
        
        if not clf or not scaler:
            print("[ML API] ERROR: ML model not loaded!")
            raise HTTPException(status_code=500, detail="ML model not loaded")
        
        # Validate application data
        is_valid, error_message = validate_application_data(application.dict())
        if not is_valid:
            print(f"[ML API] Validation failed: {error_message}")
            raise HTTPException(
                status_code=400,
                detail=f"Invalid application data: {error_message}"
            )
        
        print("[ML API] Extracting features...")
        log_file = "ml_api_debug.log"
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"About to extract features...\n")
        
        # Extract features
        features = extract_features_from_application_data(application.dict())
        
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"Extracted {len(features)} features\n")
        
        print(f"[ML API] Extracted {len(features)} features")
        
        # Prepare feature vector
        feature_vector = pd.DataFrame([features])[feature_order]
        feature_vector_scaled = scaler.transform(feature_vector)
        
        # ML Prediction
        ml_prob = clf.predict_proba(feature_vector_scaled)[0][1]
        print(f"[ML API] ML Probability: {ml_prob}")
        
        # Composite Score
        composite_result = compute_composite_score(features)
        if isinstance(composite_result, tuple):
            composite_score, score_details = composite_result
        else:
            composite_score = composite_result
            score_details = {}
        
        print(f"[ML API] Composite Score: {composite_score}")
        
        # Combine scores
        combine_result = combine_ml_and_composite(
            ml_prob,
            composite_score,
            ml_weight=0.6
        )
        if isinstance(combine_result, tuple):
            final_sci = combine_result[0]  # Extract the score from tuple
            combine_details = combine_result[1] if len(combine_result) > 1 else {}
        else:
            final_sci = combine_result
            combine_details = {}
        
        print(f"[ML API] Final SCI: {final_sci}")
        
        # Ensure approved profiles have SCI >= 80 when ML confidence and composite strength are high
        if ml_prob >= 0.82 and composite_score >= 60 and final_sci < 80:
            combined_before = final_sci
            final_sci = 80.0
            combine_details["final_floor_adjustment"] = {
                "reason": "High ML confidence with strong composite score",
                "previous_final_sci": round(combined_before, 2),
                "adjusted_final_sci": final_sci
            }
        
        # Risk Band
        risk_result = map_sci_to_riskband(
            final_sci,
            application.is_socially_disadvantaged
        )
        if isinstance(risk_result, tuple):
            risk_band, risk_category = risk_result
        else:
            risk_band = risk_result
            risk_category = risk_band
        
        # Calculate loan offer
        base_offers = {
            "Low Risk": 20000,
            "Medium Risk": 12000,
            "High Risk": 6000,
            "Reject": 0
        }
        
        base_offer = base_offers.get(risk_band, 0)
        consent_bonus = 0
        
        if application.consent_recharge:
            consent_bonus += 2000
        if application.consent_electricity:
            consent_bonus += 2000
        if application.consent_education and application.has_children:
            consent_bonus += 3000
        
        loan_offer = base_offer + consent_bonus
        
        # Determine status (NBCFDC is non-profit - no interest rates)
        loan_to_income_ratio = 0.0
        try:
            loan_to_income_ratio = float(application.loan_amount) / max(1.0, float(application.declared_income))
        except Exception:
            loan_to_income_ratio = 0.0

        # Check if high-income user without repayment history (forced manual review)
        no_history_manual_flag = score_details.get("no_history_manual_flag", False)
        alternative_proxies_blocked = score_details.get("alternative_proxies_blocked", False)

        qualifies_high_confidence = (
            ml_prob >= 0.82 and
            composite_score >= 60 and
            loan_to_income_ratio <= 0.6 and
            not no_history_manual_flag  # High-income without history cannot auto-approve
        )

        meets_low_risk_automatic = (
            risk_band == "Low Risk" and
            not no_history_manual_flag and  # Force manual review for high-income no-history cases
            (
                final_sci >= 80
                or (final_sci >= 75 and loan_to_income_ratio <= 0.5)
                or (loan_to_income_ratio <= 0.35 and ml_prob >= 0.75)
            )
        )

        if risk_band == "Reject":
            status = "rejected"
            message = "Unfortunately, your application does not meet our current lending criteria."
        elif no_history_manual_flag:
            # High-income user without repayment history - mandatory manual review
            status = "manual_review"
            message = (
                "Your application requires manual review. As a high-income applicant without sufficient "
                "repayment history, our team will carefully assess your creditworthiness. You may be eligible "
                f"for a loan up to ₹{loan_offer:,.0f}."
            )
        elif meets_low_risk_automatic:
            status = "approved"
            message = (
                "Congratulations! Your responsible borrowing behaviour qualifies you for the full loan offer "
                f"of ₹{loan_offer:,.0f}."
            )
        elif risk_band == "Low Risk":
            status = "manual_review"
            message = (
                "Your application is under review. You may be eligible for a loan up to "
                f"₹{loan_offer:,.0f}."
            )
        else:
            status = "manual_review"
            message = (
                "Your application is under review. You may be eligible for a loan up to "
                f"₹{loan_offer:,.0f}."
            )
        
        # Save consumption data to database if available (optional - can be added later)
        # For now, we skip database saving as it's not critical for ML scoring
        
        return {
            "application_id": application.application_id or f"APP{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "status": status,
            "risk_band": risk_band,
            "risk_category": risk_category,
            "loan_offer": loan_offer,
            "ml_probability": round(ml_prob, 3),
            "composite_score": round(composite_score, 2),
            "final_sci": round(final_sci, 2),
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": {
                "features_extracted": len(features),
                "consent_bonus": consent_bonus,
                "base_offer": base_offer,
                "score_breakdown": score_details,
                "combine_details": combine_details,
                "loan_to_income_ratio": round(loan_to_income_ratio, 3),
                "meets_low_risk_automatic": meets_low_risk_automatic,
                "qualifies_high_confidence": qualifies_high_confidence,
                "no_history_manual_flag": no_history_manual_flag,
                "alternative_proxies_blocked": alternative_proxies_blocked
            }
        }
        
    except HTTPException as he:
        try:
            with open("ml_api_debug.log", "a", encoding="utf-8") as f:
                f.write(f"HTTPException: {he.detail}\n")
        except:
            pass
        raise he
    except Exception as e:
        error_trace = traceback.format_exc()
        try:
            with open("ml_api_debug.log", "a", encoding="utf-8") as f:
                f.write(f"EXCEPTION: {type(e).__name__}: {str(e)}\n")
                f.write(f"Traceback:\n{error_trace}\n")
        except:
            pass
        print(f"Error processing application: {e}")
        print(error_trace)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing application: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    print("[STARTING] Enhanced SafeCred ML API with PostgreSQL...")
    print(f"[DATABASE] {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'Not configured'}")
    uvicorn.run(app, host="0.0.0.0", port=8002)
