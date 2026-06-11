from fastapi import APIRouter, Depends, Request
from app.core.dependencies import RequireOfficer, RequireManager
from app.models.schemas import StandardResponse

router = APIRouter(prefix="/lending", tags=["Lending Orchestration"])

@router.post("/apply", response_model=StandardResponse, dependencies=[Depends(RequireOfficer)])
async def initiate_loan_application(request: Request):
    """Initiate digital loan application through the State Machine."""
    return StandardResponse(
        status="success",
        data={"application_id": "APP-123456", "state": "INITIATED"},
        message="Loan application initiated.",
        request_id=getattr(request.state, "request_id", None)
    )

@router.get("/{app_id}/status", response_model=StandardResponse, dependencies=[Depends(RequireOfficer)])
async def get_application_status(app_id: str, request: Request):
    """Track the exact current state of the application."""
    return StandardResponse(
        status="success",
        data={"application_id": app_id, "state": "KYC_PENDING"},
        message="Fetched application state.",
        request_id=getattr(request.state, "request_id", None)
    )

@router.put("/{app_id}/approve", response_model=StandardResponse, dependencies=[Depends(RequireManager)])
async def manual_approval_override(app_id: str, request: Request):
    """Manual approval override (Restricted to MANAGER)."""
    return StandardResponse(
        status="success",
        data={"application_id": app_id, "state": "APPROVED"},
        message="Application manually approved.",
        request_id=getattr(request.state, "request_id", None)
    )
