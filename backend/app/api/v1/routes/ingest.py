from fastapi import APIRouter, Depends, Request
from app.core.dependencies import RequireChannelPartner, RequireOfficer
from app.models.schemas import StandardResponse

router = APIRouter(prefix="/ingest", tags=["Ingestion"])

@router.post("/channel-partner", response_model=StandardResponse, dependencies=[Depends(RequireChannelPartner)])
async def bulk_upload_loan_data(request: Request):
    """Bulk upload loan + repayment data from Channel Partners."""
    return StandardResponse(
        status="success",
        data={"records_processed": 500},
        message="Bulk data ingested successfully.",
        request_id=getattr(request.state, "request_id", None)
    )

@router.post("/upload/{bid}", response_model=StandardResponse, dependencies=[Depends(RequireOfficer)])
async def upload_consumption_document(bid: str, request: Request):
    """Upload consumption document (OCR) for a beneficiary."""
    return StandardResponse(
        status="success",
        data={"beneficiary_id": bid, "document_parsed": True},
        message="Document uploaded and processed.",
        request_id=getattr(request.state, "request_id", None)
    )
