import pytest
from unittest.mock import patch, MagicMock
from ingestion_service.connectors.beneficiary_upload import BeneficiaryUploadParser

@pytest.fixture
def parser():
    return BeneficiaryUploadParser()

def mock_tesseract_output(text_words, conf_scores):
    """Helper to mock pytesseract.image_to_data output"""
    return {
        "text": text_words,
        "conf": conf_scores
    }

# --- CLEAR SCAN TESTS (1 per DISCOM) ---

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
@patch('ingestion_service.connectors.beneficiary_upload.convert_from_bytes')
async def test_clear_scan_msedcl(mock_convert, mock_ocr, parser):
    mock_convert.return_value = [MagicMock()]
    mock_ocr.return_value = mock_tesseract_output(
        ["MSEDCL", "Consumer", "Number:", "123456789012", "Units:", "150.5", "Amount", "Due:", "Rs.", "1,200.50", "Bill", "Month:", "Jan", "2023", "Status:", "PAID"],
        [90, 95, 95, 99, 90, 95, 90, 90, 90, 98, 99, 99, 99, 99, 99, 99]
    )
    result = await parser.parse_electricity_bill(b"fake_pdf", "bill.pdf")
    assert result.provider == "MSEDCL"
    assert result.account_number == "123456789012"
    assert result.units_consumed_kwh == 150.5
    assert result.amount == 1200.5  # Commas removed
    assert result.billing_month == "2023-01" # Normalized
    assert result.payment_status == "PAID"
    assert result.needs_manual_review == False
    assert result.ocr_confidence == 90.0

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
@patch('ingestion_service.connectors.beneficiary_upload.convert_from_bytes')
async def test_clear_scan_bescom(mock_convert, mock_ocr, parser):
    mock_convert.return_value = [MagicMock()]
    mock_ocr.return_value = mock_tesseract_output(
        ["BESCOM", "Account", "ID:", "9876543210", "Consumption:", "200", "Amount", "Due:", "1500.50"],
        [90, 95, 95, 99, 90, 95, 90, 90, 98]
    )
    result = await parser.parse_electricity_bill(b"fake_pdf", "bill.pdf")
    assert result.provider == "BESCOM"
    assert result.account_number == "9876543210"
    assert result.units_consumed_kwh == 200.0
    assert result.amount == 1500.5
    assert result.needs_manual_review == False

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
@patch('ingestion_service.connectors.beneficiary_upload.convert_from_bytes')
async def test_clear_scan_bses(mock_convert, mock_ocr, parser):
    mock_convert.return_value = [MagicMock()]
    mock_ocr.return_value = mock_tesseract_output(
        ["BSES", "CA", "No:", "123456789", "Billed", "Units:", "300", "Total", "Amount:", "2,500"],
        [99]*10
    )
    result = await parser.parse_electricity_bill(b"fake_pdf", "bill.pdf")
    assert result.provider == "BSES"
    assert result.account_number == "123456789"
    assert result.units_consumed_kwh == 300.0
    assert result.amount == 2500.0
    assert result.needs_manual_review == False

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
@patch('ingestion_service.connectors.beneficiary_upload.convert_from_bytes')
async def test_clear_scan_uppcl(mock_convert, mock_ocr, parser):
    mock_convert.return_value = [MagicMock()]
    mock_ocr.return_value = mock_tesseract_output(
        ["UPPCL", "Account", "No:", "1020304050", "Consumed", "Units:", "400", "Amount", "Due:", "3200"],
        [99]*10
    )
    result = await parser.parse_electricity_bill(b"fake_pdf", "bill.pdf")
    assert result.provider == "UPPCL"
    assert result.account_number == "1020304050"
    assert result.units_consumed_kwh == 400.0
    assert result.needs_manual_review == False

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
@patch('ingestion_service.connectors.beneficiary_upload.convert_from_bytes')
async def test_clear_scan_tata_power(mock_convert, mock_ocr, parser):
    mock_convert.return_value = [MagicMock()]
    mock_ocr.return_value = mock_tesseract_output(
        ["TATA", "Power", "Contract", "Account:", "111122223333", "Units", "(kWh):", "50", "Net", "Payable:", "500"],
        [99]*11
    )
    result = await parser.parse_electricity_bill(b"fake_pdf", "bill.pdf")
    assert result.provider == "TATA Power"
    assert result.account_number == "111122223333"
    assert result.units_consumed_kwh == 50.0
    assert result.amount == 500.0
    assert result.needs_manual_review == False

# --- BLURRY SCAN TESTS (Confidence < 60%) ---

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
@patch('ingestion_service.connectors.beneficiary_upload.convert_from_bytes')
async def test_blurry_scan_msedcl(mock_convert, mock_ocr, parser):
    mock_convert.return_value = [MagicMock()]
    mock_ocr.return_value = mock_tesseract_output(
        ["MSEDCL", "Consumer", "Number:", "123456789012", "Units:", "150", "Amount", "Due:", "Rs.", "1200"],
        [90, 95, 95, 55, 90, 95, 90, 90, 90, 98] # Notice the 55 conf on account number
    )
    result = await parser.parse_electricity_bill(b"fake_pdf", "bill.pdf")
    assert result.provider == "MSEDCL"
    assert result.needs_manual_review == True
    assert result.ocr_confidence == 55.0

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
@patch('ingestion_service.connectors.beneficiary_upload.convert_from_bytes')
async def test_blurry_scan_bescom(mock_convert, mock_ocr, parser):
    mock_convert.return_value = [MagicMock()]
    mock_ocr.return_value = mock_tesseract_output(
        ["BESCOM", "Account", "ID:", "9876543210", "Consumption:", "200", "Amount", "Due:", "1500.50"],
        [90, 95, 95, 99, 90, 40, 90, 90, 98] # 40 conf on units
    )
    result = await parser.parse_electricity_bill(b"fake_pdf", "bill.pdf")
    assert result.provider == "BESCOM"
    assert result.needs_manual_review == True

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
@patch('ingestion_service.connectors.beneficiary_upload.convert_from_bytes')
async def test_blurry_scan_bses(mock_convert, mock_ocr, parser):
    mock_convert.return_value = [MagicMock()]
    mock_ocr.return_value = mock_tesseract_output(
        ["BSES", "CA", "No:", "123456789", "Billed", "Units:", "300", "Total", "Amount:", "2500"],
        [99, 99, 99, 99, 99, 99, 99, 99, 99, 59] # 59 conf on amount
    )
    result = await parser.parse_electricity_bill(b"fake_pdf", "bill.pdf")
    assert result.provider == "BSES"
    assert result.needs_manual_review == True

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
@patch('ingestion_service.connectors.beneficiary_upload.convert_from_bytes')
async def test_blurry_scan_uppcl(mock_convert, mock_ocr, parser):
    mock_convert.return_value = [MagicMock()]
    mock_ocr.return_value = mock_tesseract_output(
        ["UPPCL", "Account", "No:", "1020304050", "Consumed", "Units:", "400", "Amount", "Due:", "3200"],
        [50, 99, 99, 99, 99, 99, 99, 99, 99, 99] # 50 conf on provider
    )
    result = await parser.parse_electricity_bill(b"fake_pdf", "bill.pdf")
    assert result.needs_manual_review == True

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
@patch('ingestion_service.connectors.beneficiary_upload.convert_from_bytes')
async def test_blurry_scan_tata_power(mock_convert, mock_ocr, parser):
    mock_convert.return_value = [MagicMock()]
    mock_ocr.return_value = mock_tesseract_output(
        ["TATA", "Power", "Contract", "Account:", "111122223333", "Units", "(kWh):", "50", "Net", "Payable:", "500"],
        [99]*11
    )
    mock_ocr.return_value["conf"][5] = 10 # extremely low conf on Units
    result = await parser.parse_electricity_bill(b"fake_pdf", "bill.pdf")
    assert result.needs_manual_review == True

# --- MISSING FIELDS TESTS ---

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
@patch('ingestion_service.connectors.beneficiary_upload.convert_from_bytes')
async def test_missing_account_number(mock_convert, mock_ocr, parser):
    mock_convert.return_value = [MagicMock()]
    mock_ocr.return_value = mock_tesseract_output(
        ["MSEDCL", "Units:", "150", "Amount", "Due:", "Rs.", "1200"],
        [90, 95, 95, 90, 90, 90, 98]
    )
    result = await parser.parse_electricity_bill(b"fake_pdf", "bill.pdf")
    assert result.provider == "MSEDCL"
    assert result.account_number == None
    assert result.needs_manual_review == True

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
@patch('ingestion_service.connectors.beneficiary_upload.convert_from_bytes')
async def test_missing_amount(mock_convert, mock_ocr, parser):
    mock_convert.return_value = [MagicMock()]
    mock_ocr.return_value = mock_tesseract_output(
        ["BESCOM", "Account", "ID:", "9876543210", "Consumption:", "200"],
        [90, 95, 95, 99, 90, 95]
    )
    result = await parser.parse_electricity_bill(b"fake_pdf", "bill.pdf")
    assert result.provider == "BESCOM"
    assert result.amount == 0.0 # Normalizer returns 0.0 if not found
    assert result.needs_manual_review == True

# --- SMS PARSING TESTS ---

@pytest.mark.asyncio
async def test_sms_prepaid_jio(parser):
    sms = "Recharge of Rs.299 successful for Jio Number 9876543210 on 12-08-2023."
    result = await parser.parse_recharge_sms(sms)
    assert result.amount == 299.0
    assert result.operator == "Jio"
    assert result.provider == "prepaid"
    assert result.needs_manual_review == False

@pytest.mark.asyncio
async def test_sms_postpaid_airtel(parser):
    sms = "Your Airtel Postpaid bill of INR 850.50 is generated. Please pay by 15/09/2023."
    result = await parser.parse_recharge_sms(sms)
    assert result.amount == 850.50
    assert result.operator == "Airtel"
    assert result.provider == "postpaid"
    assert result.needs_manual_review == False

# --- WRONG DOCUMENT TEST ---

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
@patch('ingestion_service.connectors.beneficiary_upload.convert_from_bytes')
async def test_wrong_document(mock_convert, mock_ocr, parser):
    mock_convert.return_value = [MagicMock()]
    mock_ocr.return_value = mock_tesseract_output(
        ["Recipe", "for", "Chicken", "Tikka", "Masala:", "1.", "Marinate"],
        [99]*7
    )
    result = await parser.parse_electricity_bill(b"fake_pdf", "bill.pdf")
    assert result.provider == None
    assert result.needs_manual_review == True

# --- 16th TEST: SPECIFIC PDF MULTI-PAGE HANDLING ---

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
@patch('ingestion_service.connectors.beneficiary_upload.convert_from_bytes')
async def test_multipage_pdf_scan(mock_convert, mock_ocr, parser):
    # Simulate pdf2image returning 2 pages
    mock_convert.return_value = [MagicMock(), MagicMock()]
    # Mock OCR returning MSEDCL on page 1, and random text on page 2
    mock_ocr.side_effect = [
        mock_tesseract_output(["MSEDCL", "Consumer", "Number:", "123456789012"], [99, 99, 99, 99]),
        mock_tesseract_output(["Units:", "150.5", "Amount", "Due:", "Rs.", "1,200.50"], [99, 99, 99, 99, 99, 99])
    ]
    result = await parser.parse_electricity_bill(b"fake_pdf_bytes", "multi_page_bill.pdf")
    assert result.provider == "MSEDCL"
    assert result.account_number == "123456789012"
    assert result.units_consumed_kwh == 150.5
    assert result.amount == 1200.5
    assert result.needs_manual_review == False
