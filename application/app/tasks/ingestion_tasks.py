import io
import pytesseract
from PIL import Image
from pdf2image import convert_from_bytes
from celery import shared_task
from app.db.mongodb import mongo_db
import re

@shared_task
def process_loan_csv(csv_content: str, filename: str):
    """
    STEP 1 | ETL Worker validates & ingests Channel Partners CSV.
    """
    lines = csv_content.strip().split("\n")
    if not lines:
        return {"status": "empty"}
    
    headers = lines[0].split(",")
    records = []
    for line in lines[1:]:
        values = line.split(",")
        record = dict(zip(headers, values))
        records.append(record)
        
    # Ingest into MongoDB (in a real scenario, validate types first)
    if records:
        mongo_db.partner_loans.insert_many(records)
        print(f"[ETL WORKER] Ingested {len(records)} loan records from {filename}")
        
    return {"inserted": len(records)}

@shared_task
def process_electricity_bill_ocr(beneficiary_id: str, file_bytes: bytes, content_type: str):
    """
    STEP 2 | OCR parser extracts structured fields -> MongoDB.
    """
    print(f"[OCR WORKER] Starting OCR for {beneficiary_id}")
    
    extracted_text = ""
    
    try:
        # Convert to Image
        if content_type == 'application/pdf':
            images = convert_from_bytes(file_bytes)
            for img in images:
                extracted_text += pytesseract.image_to_string(img)
        else:
            img = Image.open(io.BytesIO(file_bytes))
            extracted_text = pytesseract.image_to_string(img)
            
        # Extract structured fields using Regex
        # Simulated patterns for an Indian Electricity Bill
        amount_match = re.search(r'(?i)(?:total amount|net payable|bill amount|amount payable)\s*[:\-\s]*(?:Rs\.?|INR)?\s*([\d,]+\.?\d*)', extracted_text)
        units_match = re.search(r'(?i)(?:units consumed|consumption)\s*[:\-\s]*(\d+)', extracted_text)
        
        amount_due = float(amount_match.group(1).replace(',', '')) if amount_match else None
        units_consumed = int(units_match.group(1)) if units_match else None
        
        parsed_data = {
            "beneficiary_id": beneficiary_id,
            "document_type": "electricity_bill",
            "extracted_text_raw": extracted_text[:500], # Store preview
            "amount_due": amount_due,
            "units_consumed": units_consumed,
            "status": "PROCESSED" if amount_due is not None else "MANUAL_REVIEW_NEEDED"
        }
        
        mongo_db.alternative_data.insert_one(parsed_data)
        print(f"[OCR WORKER] Successfully parsed bill for {beneficiary_id}. Amount: {amount_due}, Units: {units_consumed}")
        
        return {"beneficiary_id": beneficiary_id, "amount": amount_due, "units": units_consumed}
        
    except Exception as e:
        print(f"[OCR WORKER] OCR Failed: {str(e)}")
        mongo_db.alternative_data.insert_one({
            "beneficiary_id": beneficiary_id,
            "document_type": "electricity_bill",
            "status": "FAILED",
            "error": str(e)
        })
        return {"error": str(e)}
