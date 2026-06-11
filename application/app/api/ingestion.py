from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from typing import Dict, Any
from app.tasks.ingestion_tasks import process_loan_csv, process_electricity_bill_ocr

router = APIRouter(prefix="/ingestion", tags=["Ingestion"])

@router.post("/loan-csv")
async def ingest_loan_csv(background_tasks: BackgroundTasks, file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    STEP 1 | Channel partners POST loan + repayment CSVs.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    # Read file content
    content = await file.read()
    
    # Send to Celery worker for ETL validation and DB ingestion
    process_loan_csv.delay(content.decode("utf-8"), file.filename)
    
    return {
        "status": "Accepted",
        "message": f"CSV {file.filename} is being processed by the ETL worker in the background."
    }

@router.post("/ocr/electricity-bill")
async def ingest_electricity_bill(beneficiary_id: str, file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    STEP 2 | Beneficiary uploads electricity bill.
    OCR parser extracts structured fields -> MongoDB.
    """
    if not file.content_type.startswith('image/') and file.content_type != 'application/pdf':
        raise HTTPException(status_code=400, detail="Only Images and PDFs are supported for OCR")
    
    content = await file.read()
    
    # Send to Celery worker for OCR extraction
    process_electricity_bill_ocr.delay(beneficiary_id, content, file.content_type)
    
    return {
        "status": "Accepted",
        "message": f"Document submitted for OCR extraction for beneficiary {beneficiary_id}."
    }
