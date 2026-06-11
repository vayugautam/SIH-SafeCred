import re
import io
import datetime
import structlog
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential
from ingestion_service.validators.schema import ConsumptionRecord

try:
    from PIL import Image
    import pytesseract
    from pdf2image import convert_from_bytes
except ImportError:
    Image = None
    pytesseract = None
    convert_from_bytes = None

logger = structlog.get_logger()

# Indian DISCOM Regex Patterns
DISCOM_PATTERNS = {
    "MSEDCL": {
        "provider": "MSEDCL",
        "account_number": r"(?i)Consumer Number\s*:\s*(\d{10,12})",
        "units": r"(?i)Units\s*:\s*([\d,]+(\.\d+)?)",
        "amount": r"(?i)Amount Due\s*:\s*Rs\.?\s*([\d,]+(\.\d+)?)",
        "billing_month": r"(?i)Bill Month\s*:\s*([A-Za-z]+\s*\d{4}|\d{2}/\d{4})",
        "payment_status": r"(?i)Status\s*:\s*([A-Za-z]+)"
    },
    "BESCOM": {
        "provider": "BESCOM",
        "account_number": r"(?i)Account ID\s*:\s*(\d{10})",
        "units": r"(?i)Consumption\s*:\s*([\d,]+)",
        "amount": r"(?i)Amount Due\s*:\s*([\d,]+(\.\d+)?)",
        "billing_month": r"(?i)Billing Period\s*:\s*([A-Za-z]+\s*\d{4}|\d{2}/\d{4})",
        "payment_status": r"(?i)Payment Status\s*:\s*([A-Za-z]+)"
    },
    "BSES": {
        "provider": "BSES",
        "account_number": r"(?i)CA No\s*:\s*(\d{9})",
        "units": r"(?i)Billed Units\s*:\s*([\d,]+)",
        "amount": r"(?i)Total Amount\s*:\s*([\d,]+(\.\d+)?)",
        "billing_month": r"(?i)Bill Month\s*:\s*([A-Za-z]+\s*\d{4}|\d{2}/\d{4})",
        "payment_status": r"(?i)Status\s*:\s*([A-Za-z]+)"
    },
    "UPPCL": {
        "provider": "UPPCL",
        "account_number": r"(?i)Account No\s*:\s*(\d{10,12})",
        "units": r"(?i)Consumed Units\s*:\s*([\d,]+)",
        "amount": r"(?i)Amount Due\s*:\s*([\d,]+(\.\d+)?)",
        "billing_month": r"(?i)Month\s*:\s*([A-Za-z]+\s*\d{4}|\d{2}/\d{4})",
        "payment_status": r"(?i)Status\s*:\s*([A-Za-z]+)"
    },
    "TATA_POWER": {
        "provider": "TATA Power",
        "account_number": r"(?i)Contract Account\s*:\s*(\d{12})",
        "units": r"(?i)Units \(kWh\)\s*:\s*([\d,]+)",
        "amount": r"(?i)Net Payable\s*:\s*([\d,]+(\.\d+)?)",
        "billing_month": r"(?i)Bill Month\s*:\s*([A-Za-z]+\s*\d{4}|\d{2}/\d{4})",
        "payment_status": r"(?i)Status\s*:\s*([A-Za-z]+)"
    }
}

class BeneficiaryUploadParser:

    def _normalize_amount(self, val: str) -> float:
        if not val: return 0.0
        val = val.replace(",", "")
        try:
            return float(val)
        except ValueError:
            return 0.0

    def _normalize_month(self, val: str) -> str:
        if not val: return val
        # Convert "Jan 2023" to "2023-01"
        try:
            if "/" in val:
                m, y = val.split("/")
                return f"{y}-{m.zfill(2)}"
            else:
                parsed = datetime.datetime.strptime(val.strip(), "%b %Y")
                return parsed.strftime("%Y-%m")
        except Exception:
            return val

    def _normalize_status(self, val: str) -> str:
        if not val: return "UNPAID"
        v = val.strip().upper()
        if v in ["PAID", "SUCCESS"]: return "PAID"
        if v in ["OVERDUE", "LATE"]: return "OVERDUE"
        return "UNPAID"

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def parse_electricity_bill(self, file_bytes: bytes, filename: str, confidence_threshold: float = 60.0) -> ConsumptionRecord:
        """
        Parses PDF or Image of electricity bill using Tesseract OCR.
        Identifies DISCOM and extracts structured fields with normalization.
        """
        if not pytesseract or not convert_from_bytes:
            raise RuntimeError("Missing dependencies: pytesseract and pdf2image must be installed (Tesseract and Poppler required).")

        logger.info("parsing_electricity_bill", filename=filename)
        
        images = []
        if filename.lower().endswith(".pdf"):
            try:
                images = convert_from_bytes(file_bytes)
            except Exception as e:
                raise RuntimeError(f"Poppler PDF conversion failed: {e}")
        else:
            try:
                images = [Image.open(io.BytesIO(file_bytes))]
            except Exception as e:
                raise RuntimeError(f"Image conversion failed: {e}")

        if not images:
            return ConsumptionRecord(type="electricity", needs_manual_review=True, ocr_confidence=0.0)
            
        full_text = ""
        min_confidence = 100.0
        
        for img in images:
            try:
                data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
            except Exception as e:
                raise RuntimeError(f"Tesseract OCR failed: {e}")

            for i in range(len(data['text'])):
                word = data['text'][i].strip()
                if word:
                    conf = float(data['conf'][i])
                    if conf > 0 and conf < min_confidence:
                        min_confidence = conf
                    full_text += word + " "
                    
            full_text += "\n"

        needs_review = min_confidence < confidence_threshold
        
        record = ConsumptionRecord(
            type="electricity",
            needs_manual_review=needs_review,
            ocr_confidence=min_confidence
        )
        
        matched_discom = False
        for discom_name, patterns in DISCOM_PATTERNS.items():
            if re.search(patterns["provider"], full_text, re.IGNORECASE):
                matched_discom = True
                record.provider = patterns["provider"]
                
                acc_match = re.search(patterns["account_number"], full_text)
                if acc_match: record.account_number = acc_match.group(1)
                else: record.needs_manual_review = True
                
                units_match = re.search(patterns["units"], full_text)
                if units_match: record.units_consumed_kwh = self._normalize_amount(units_match.group(1))
                else: record.needs_manual_review = True
                
                amt_match = re.search(patterns["amount"], full_text)
                if amt_match: record.amount = self._normalize_amount(amt_match.group(1))
                else: record.needs_manual_review = True

                month_match = re.search(patterns["billing_month"], full_text)
                if month_match: record.billing_month = self._normalize_month(month_match.group(1))
                
                status_match = re.search(patterns["payment_status"], full_text)
                if status_match: record.payment_status = self._normalize_status(status_match.group(1))
                else: record.payment_status = "UNPAID"
                
                break
                
        if not matched_discom:
            record.needs_manual_review = True

        logger.info("electricity_bill_parsed", provider=record.provider, review_needed=record.needs_manual_review, conf=min_confidence)
        return record

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def parse_recharge_sms(self, text: str) -> ConsumptionRecord:
        logger.info("parsing_recharge_sms", text_length=len(text))
        record = ConsumptionRecord(type="mobile_recharge", needs_manual_review=False, ocr_confidence=100.0)
        
        if "jio" in text.lower(): record.operator = "Jio"
        elif "airtel" in text.lower(): record.operator = "Airtel"
        elif "vi" in text.lower() or "vodafone" in text.lower(): record.operator = "Vi"
        else:
            record.operator = "Unknown"
            record.needs_manual_review = True
            
        if "postpaid" in text.lower() or "bill" in text.lower(): record.provider = "postpaid"
        else: record.provider = "prepaid"
        
        amt_match = re.search(r"(?:Rs\.?|INR)\s*([\d,]+(\.\d+)?)", text, re.IGNORECASE)
        if amt_match: record.amount = self._normalize_amount(amt_match.group(1))
        else: record.needs_manual_review = True
        
        date_match = re.search(r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})", text)
        if date_match:
            try:
                d_str = date_match.group(1).replace("-", "/")
                parts = d_str.split("/")
                if len(parts[2]) == 2: parts[2] = "20" + parts[2]
                record.billing_date = datetime.datetime.strptime(f"{parts[0]}/{parts[1]}/{parts[2]}", "%d/%m/%Y")
            except ValueError:
                pass
                
        return record
