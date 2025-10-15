"""
application_api.py

✅ **ONLINE DATA PROCESSING API** - NO offline files required!

This API accepts loan applications with LIVE user data directly from frontend.
All consumption data (recharge, electricity, education, bank) provided by user.

🔄 **BREAKING CHANGE**: System no longer reads from CSV/JSON files.
   Old endpoints /predict and /predict_full are deprecated.
   
✅ **ACTIVE ENDPOINTS**:
   - POST /apply - Main application endpoint (accepts EnhancedLoanApplication)
   - POST /apply_direct - Alias for /apply
   - GET /health - Server health check
   - GET /status/{app_id} - Check application status

❌ **DEPRECATED** (HTTP 410):
   - POST /predict - Use /apply instead
   - POST /predict_full - Use /apply instead

📚 **Migration Guide**: See docs/MIGRATION_OFFLINE_TO_ONLINE.md
"""

import os
import json
import joblib
import pandas as pd
from datetime import datetime
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from enum import Enum

# from features import extract_features_for_user  # ⚠️ Old file removed - no longer needed
from scoring import compute_composite_score, combine_ml_and_composite, map_sci_to_riskband
from features_direct import extract_features_from_application_data, validate_application_data
from models_enhanced import EnhancedLoanApplication

ROOT = os.path.dirname(__file__)
MODELS_DIR = os.path.join(ROOT, "models")
DATA_DIR = os.path.join(ROOT, "data")

app = FastAPI(
    title="SafeCred - Online Data Processing API",
    version="3.0.0",
    description="✅ Real-time loan processing with LIVE user data (NO offline files)"
)

# Load ML Model artifacts
try:
    MODEL_PATH = os.path.join(MODELS_DIR, "safecred_model.pkl")
    SCALER_PATH = os.path.join(MODELS_DIR, "scaler.pkl")
    FEATURE_ORDER_PATH = os.path.join(MODELS_DIR, "feature_order.pkl")

    clf = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    feature_order = joblib.load(FEATURE_ORDER_PATH)

    META_PATH = os.path.join(MODELS_DIR, "model_metadata.json")
    with open(META_PATH, "r") as f:
        model_meta = json.load(f)
    DYNAMIC_BARRIER = model_meta.get("dynamic_income_barrier", 15000)
    
    print(f"✅ Model loaded successfully with {len(feature_order)} features")
    print(f"✅ Dynamic income barrier: ₹{round(DYNAMIC_BARRIER, 2)}")
except Exception as e:
    print(f"⚠️ Failed to load model artifacts: {e}")
    clf, scaler, feature_order = None, None, []


class RiskBand(str, Enum):
    LOW = "Low Risk"
    MEDIUM = "Medium Risk"
    HIGH = "High Risk"
    REJECT = "Reject"


class ConsentData(BaseModel):
    recharge: bool = Field(default=False, description="Consent for mobile recharge data")
    electricity: bool = Field(default=False, description="Consent for electricity bill data")
    education: bool = Field(default=False, description="Consent for education fee data")


class BeneficiaryProfile(BaseModel):
    name: str = Field(..., description="Full name of the beneficiary")
    mobile: str = Field(..., description="Mobile number (10 digits)")
    email: Optional[str] = Field(None, description="Email address")
    age: Optional[int] = Field(None, ge=18, le=100, description="Age of the applicant")
    has_children: bool = Field(default=False, description="Does the applicant have children?")
    is_socially_disadvantaged: bool = Field(default=False, description="Belongs to socially disadvantaged group (SC/ST/OBC)")


class LoanDetails(BaseModel):
    loan_amount: float = Field(..., ge=1000, le=100000, description="Requested loan amount in INR")
    tenure_months: int = Field(..., ge=1, le=36, description="Loan tenure in months")
    purpose: Optional[str] = Field(None, description="Purpose of the loan")


class DocumentUpload(BaseModel):
    bank_statement_url: Optional[str] = Field(None, description="URL/path to uploaded bank statement")
    income_proof_url: Optional[str] = Field(None, description="URL/path to income proof document")
    id_proof_url: Optional[str] = Field(None, description="URL/path to ID proof")


class LoanApplication(BaseModel):
    """Complete loan application from frontend"""
    applicant: BeneficiaryProfile
    loan_details: LoanDetails
    declared_income: float = Field(..., ge=0, description="Monthly income declared by applicant in INR")
    consents: ConsentData = Field(default_factory=ConsentData)
    documents: Optional[DocumentUpload] = Field(None)
    application_id: Optional[str] = Field(None, description="Unique application ID (auto-generated if not provided)")


class ApplicationResponse(BaseModel):
    """Response sent back to frontend"""
    application_id: str
    status: str  # "processing", "approved", "rejected", "manual_review"
    risk_band: str
    loan_offer: Optional[float] = None
    interest_rate: Optional[float] = None
    ml_probability: Optional[float] = None
    composite_score: Optional[float] = None
    final_sci: Optional[float] = None
    message: str
    timestamp: str
    details: Optional[Dict[str, Any]] = None


def generate_application_id() -> str:
    """Generate unique application ID"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"APP{timestamp}"


# ======================================================================
# ⚠️ OLD OFFLINE FUNCTIONS REMOVED (save_application_to_csv, process_loan_application)
# These used deleted files: features.py, parse_*.py
# All endpoints now use online processing via features_direct.py
# ======================================================================


@app.get("/")
def root():
    return {
        "message": "SafeCred Application Processing API",
        "version": "3.0.0",
        "status": "running",
        "endpoints": {
            "backend_integration": {
                "POST /predict": "Get prediction for existing user_id (Backend → ML)",
                "POST /predict_full": "Get prediction from form data without user_id"
            },
            "direct_frontend": {
                "POST /apply": "Complete application submission (Frontend → ML)"
            },
            "utilities": {
                "GET /status/{application_id}": "Check application status",
                "GET /health": "Health check",
                "GET /docs": "Interactive API documentation"
            }
        },
        "integration_flow": {
            "step_1": "Frontend form → Backend /register → saves to DB → gets user_id",
            "step_2": "Backend → ML /predict with user_id → gets credit assessment",
            "step_3": "Backend saves result → Frontend dashboard displays score"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": clf is not None,
        "timestamp": datetime.now().isoformat()
    }


@app.post("/predict")
def predict_by_user_id(req: dict):
    """
    ⚠️ DEPRECATED - Use /apply or /apply_direct instead
    
    This endpoint previously read from offline files.
    Now it requires full application data.
    
    Please use /apply or /apply_direct endpoint which accepts complete user data.
    """
    raise HTTPException(
        status_code=410,
        detail={
            "error": "This endpoint is deprecated",
            "message": "Please use POST /apply or /apply_direct with complete application data",
            "reason": "System no longer uses offline CSV/JSON files",
            "new_endpoints": ["/apply", "/apply_direct"],
            "documentation": "/docs"
        }
    )


@app.post("/predict_full")
def predict_full(req: dict):
    """
    ⚠️ DEPRECATED - Use /apply or /apply_direct instead
    
    This endpoint is deprecated. Please use the new structured endpoints.
    """
    raise HTTPException(
        status_code=410,
        detail={
            "error": "This endpoint is deprecated",
            "message": "Please use POST /apply or /apply_direct with structured data",
            "reason": "Moved to better structured models",
            "new_endpoints": ["/apply", "/apply_direct"],
            "documentation": "/docs"
        }
    )


@app.post("/apply", response_model=ApplicationResponse)
async def submit_application(application: EnhancedLoanApplication):
    """
    🆕 MAIN APPLICATION ENDPOINT - Uses LIVE user data (NO offline files)
    
    This endpoint accepts ALL user data directly from frontend.
    NO dependency on offline CSV/JSON files!
    
    Flow:
    1. Beneficiary fills complete form on frontend with:
       - Personal details
       - Loan requirements
       - Consumption data (recharge, electricity, education)
       - Bank statement summary (if available)
       - Repayment history (if available)
    2. Frontend sends POST request to /apply with all details
    3. ML processes LIVE data immediately
    4. Returns risk assessment, loan offer, and status
    
    Example request body:
    ```json
    {
        "name": "Ramesh Kumar",
        "mobile": "9876543210",
        "age": 28,
        "declared_income": 15000,
        "loan_amount": 30000,
        "tenure_months": 12,
        "has_children": false,
        "consent_recharge": true,
        "consent_electricity": true,
        "recharge_history": {
            "total_amount": 2400,
            "frequency": 12,
            "avg_amount": 200,
            "consistency": 0.9
        },
        "electricity_bills": {
            "total_paid": 6000,
            "frequency": 12,
            "avg_payment": 500,
            "ontime_ratio": 0.9
        }
    }
    ```
    """
    
    # This now uses the SAME logic as /apply_direct
    # NO offline file reading!
    return await submit_application_with_data(application)


@app.get("/status/{application_id}")
def get_application_status(application_id: str):
    """
    Check the status of a loan application
    """
    try:
        applications_file = os.path.join(DATA_DIR, "applications.csv")
        
        if not os.path.exists(applications_file):
            raise HTTPException(status_code=404, detail="No applications found")
        
        df = pd.read_csv(applications_file)
        app_data = df[df["application_id"] == application_id]
        
        if app_data.empty:
            raise HTTPException(status_code=404, detail=f"Application {application_id} not found")
        
        return {
            "application_id": application_id,
            "status": app_data.iloc[0]["status"],
            "timestamp": app_data.iloc[0]["timestamp"],
            "applicant_name": app_data.iloc[0]["name"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/apply_direct", response_model=ApplicationResponse)
async def submit_application_with_data(application: EnhancedLoanApplication):
    """
    🆕 DIRECT DATA APPLICATION ENDPOINT
    
    This endpoint accepts ALL user data directly from the frontend form,
    including recharge history, electricity bills, education fees, etc.
    
    ✅ NO OFFLINE FILES NEEDED!
    ✅ User provides data through frontend
    ✅ Real-time processing
    
    Example Request:
    ```json
    {
        "name": "Ramesh Kumar",
        "mobile": "9876543210",
        "age": 28,
        "declared_income": 15000,
        "loan_amount": 30000,
        "tenure_months": 12,
        "has_children": false,
        "consent_recharge": true,
        "consent_electricity": true,
        "recharge_history": {
            "total_amount": 2400,
            "frequency": 12,
            "avg_amount": 200,
            "consistency": 0.9
        },
        "electricity_bills": {
            "total_paid": 6000,
            "frequency": 12,
            "avg_payment": 500,
            "consistency": 0.85,
            "ontime_ratio": 0.9
        }
    }
    ```
    """
    
    if clf is None or scaler is None:
        raise HTTPException(
            status_code=500,
            detail="ML model not loaded. Please contact system administrator."
        )
    
    try:
        # Generate application ID
        app_id = application.application_id or generate_application_id()
        
        # Convert Pydantic model to dict
        app_dict = application.model_dump()
        app_dict["application_id"] = app_id
        
        # Validate application data
        is_valid, error_msg = validate_application_data(app_dict)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)
        
        # ✨ EXTRACT FEATURES DIRECTLY FROM USER INPUT
        # This uses the data user provided, NOT offline files
        features = extract_features_from_application_data(app_dict)
        
        print(f"✅ Extracted features from user input:")
        print(f"   - Income: ₹{features.get('declared_income', 0)}")
        print(f"   - Loan: ₹{features.get('loan_amount', 0)}")
        print(f"   - Recharge data: {bool(features.get('recharge_total_amount'))}")
        print(f"   - Electricity data: {bool(features.get('electricity_total_paid'))}")
        print(f"   - Bank data: {bool(features.get('monthly_credits'))}")
        
        # Calculate composite score using our enhanced scoring logic
        composite_score, breakdown = compute_composite_score(features)
        
        print(f"✅ Composite Score: {composite_score}/100")
        print(f"   - User Segment: {breakdown.get('user_segment')}")
        print(f"   - LTI Ratio: {breakdown.get('loan_to_income_ratio', 0):.2f}")
        print(f"   - Fraud Penalty: {breakdown.get('fraud_risk_penalty', 0):.1%}")
        print(f"   - Fair Lending Bonus: {breakdown.get('fair_lending_bonus', 0):.1%}")
        
        # Prepare features for ML model (align with feature_order)
        X_dict = {}
        for feat_name in feature_order:
            X_dict[feat_name] = features.get(feat_name, 0)
        
        X = pd.DataFrame([X_dict])[feature_order]
        X_scaled = scaler.transform(X)
        
        # ML model prediction
        ml_prob = float(clf.predict_proba(X_scaled)[0][1])
        
        # Combine ML + Composite using our scoring logic
        final_sci, details = combine_ml_and_composite(ml_prob, composite_score)
        
        # Map to risk band
        risk_band, need_label = map_sci_to_riskband(
            final_sci, 
            socio_flag=features.get("socio_flag", 0)
        )
        
        # Calculate loan offer
        loan_requested = features["loan_amount"]
        
        if "High Risk" in risk_band or "Reject" in risk_band:
            status = "rejected"
            loan_offer = 0.0
            interest_rate = None
            message = f"Application rejected. Risk assessment: {risk_band}"
        elif "Medium Risk" in risk_band:
            status = "manual_review"
            loan_offer = loan_requested * 0.7
            interest_rate = 14.0
            message = f"Application requires manual review. Preliminary offer: ₹{loan_offer:,.0f}"
        else:  # Low Risk
            status = "approved"
            loan_offer = loan_requested
            interest_rate = 10.5
            message = f"Application approved! Loan offer: ₹{loan_offer:,.0f}"
        
        # Build response
        response = ApplicationResponse(
            application_id=app_id,
            status=status,
            risk_band=risk_band,
            loan_offer=loan_offer,
            interest_rate=interest_rate,
            ml_probability=ml_prob,
            composite_score=composite_score,
            final_sci=final_sci,
            message=message,
            timestamp=datetime.now().isoformat(),
            details={
                "breakdown": breakdown,
                "pillar_scores": breakdown.get("pillar_scores", {}),
                "user_segment": breakdown.get("user_segment"),
                "loan_to_income_ratio": breakdown.get("loan_to_income_ratio"),
                "fraud_risk_penalty": breakdown.get("fraud_risk_penalty"),
                "fair_lending_bonus": breakdown.get("fair_lending_bonus"),
            }
        )
        
        print(f"✅ Application {app_id} processed: {status}")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*70)
    print("🚀 SafeCred API v3.0 - ONLINE DATA PROCESSING")
    print("="*70)
    print("✅ ACTIVE ENDPOINTS:")
    print("   POST /apply - Main application endpoint (with complete user data)")
    print("   POST /apply_direct - Alias for /apply")
    print("   GET /health - Server health check")
    print("   GET /status/{app_id} - Application status")
    print("\n❌ DEPRECATED ENDPOINTS (HTTP 410):")
    print("   POST /predict - Use /apply instead")
    print("   POST /predict_full - Use /apply instead")
    print("\n📋 Migration Guide: docs/MIGRATION_OFFLINE_TO_ONLINE.md")
    print("📖 API Docs: http://localhost:8002/docs")
    print("="*70 + "\n")
    uvicorn.run(app, host="127.0.0.1", port=8002)
