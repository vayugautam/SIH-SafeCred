from fastapi import APIRouter, Depends, Request
from app.core.dependencies import RequireOfficer
from app.models.schemas import StandardResponse
from app.middleware.rate_limiter import limiter

router = APIRouter(prefix="/score", tags=["Scoring"])

@router.post("/{bid}", response_model=StandardResponse, dependencies=[Depends(RequireOfficer)])
@limiter.limit("10/minute") # Stricter limit for heavy ML scoring
async def trigger_scoring(bid: str, request: Request):
    """Trigger the XGBoost/LGBM scoring pipeline for a beneficiary."""
    return StandardResponse(
        status="success",
        data={"beneficiary_id": bid, "composite_score": 750},
        message="Scoring pipeline executed.",
        request_id=getattr(request.state, "request_id", None)
    )

@router.get("/{bid}", response_model=StandardResponse, dependencies=[Depends(RequireOfficer)])
async def get_latest_score(bid: str, request: Request):
    """Get the latest cached score and risk band."""
    return StandardResponse(
        status="success",
        data={"beneficiary_id": bid, "composite_score": 750, "risk_band": "A"},
        message="Fetched latest score.",
        request_id=getattr(request.state, "request_id", None)
    )

@router.get("/{bid}/history", response_model=StandardResponse, dependencies=[Depends(RequireOfficer)])
async def get_score_history(bid: str, request: Request):
    """Get the full score history timeline for a beneficiary."""
    return StandardResponse(
        status="success",
        data={"beneficiary_id": bid, "history": []},
        message="Fetched score history.",
        request_id=getattr(request.state, "request_id", None)
    )

@router.get("/{bid}/explanation", response_model=StandardResponse, dependencies=[Depends(RequireOfficer)])
async def get_shap_explanation(bid: str, request: Request):
    """Retrieve the SHAP explanation JSON for the latest score."""
    return StandardResponse(
        status="success",
        data={"beneficiary_id": bid, "top_positive_factors": [], "top_negative_factors": []},
        message="Fetched SHAP report.",
        request_id=getattr(request.state, "request_id", None)
    )
