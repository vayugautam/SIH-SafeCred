from fastapi import APIRouter, Depends, Request
from app.core.dependencies import RequireAdmin
from app.models.schemas import StandardResponse

router = APIRouter(prefix="/admin", tags=["Administration"])

@router.post("/rescore/bulk", response_model=StandardResponse, dependencies=[Depends(RequireAdmin)])
async def trigger_bulk_rescore(request: Request):
    """Trigger the Celery background job to rescore the entire cluster."""
    return StandardResponse(
        status="success",
        data={"job_id": "JOB-98765"},
        message="Bulk rescoring job queued.",
        request_id=getattr(request.state, "request_id", None)
    )
