from fastapi import APIRouter, Depends, Request
from app.core.dependencies import RequireAdmin
from app.models.schemas import StandardResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard Reporting"])

@router.get("/summary", response_model=StandardResponse, dependencies=[Depends(RequireAdmin)])
async def get_summary_kpis(request: Request):
    """Aggregate KPI statistics for the Admin dashboard."""
    return StandardResponse(
        status="success",
        data={"total_loans": 1500, "total_disbursed_paise": 50000000_00},
        message="Fetched KPIs.",
        request_id=getattr(request.state, "request_id", None)
    )

@router.get("/bands/distribution", response_model=StandardResponse, dependencies=[Depends(RequireAdmin)])
async def get_band_distribution(request: Request):
    """Risk band distribution data for pie charts."""
    return StandardResponse(
        status="success",
        data={"bands": {"A": 500, "B": 300, "C": 200}},
        message="Fetched distribution.",
        request_id=getattr(request.state, "request_id", None)
    )
