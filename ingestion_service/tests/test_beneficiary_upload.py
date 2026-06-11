import pytest
from unittest.mock import patch, MagicMock
from ingestion_service.connectors.beneficiary_upload import BeneficiaryUploadParser

@pytest.fixture
def parser():
    return BeneficiaryUploadParser()

def mock_pytesseract_data(text_list, conf_list):
    return {
        'text': text_list,
        'conf': [str(c) for c in conf_list]
    }

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.convert_from_bytes')
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
async def test_parse_electricity_bill_tata_power_clear(mock_ocr, mock_pdf, parser):
    mock_ocr.return_value = mock_pytesseract_data(
        ['TATA', 'Power', 'CA', 'No:', '123456789', 'Bill', 'Month:', 'Jan', '24', 'Units', 'Consumed:', '250.5', 'Net', 'Amount', 'Payable:', 'Rs', '1500.00', 'Paid'],
        [99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99]
    )
    result = await parser.parse_electricity_bill(b"fake_image", "bill.jpg")
    assert result.provider == "TATA Power"
    assert result.account_number == "123456789"
    assert result.units_consumed_kwh == 250.5
    assert result.amount == 1500.0
    assert result.payment_status == "Paid"
    assert result.needs_manual_review is False

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
async def test_parse_electricity_bill_bses_clear(mock_ocr, parser):
    mock_ocr.return_value = mock_pytesseract_data(
        ['BSES', 'Rajdhani', 'Contract', 'Account:', '987654321', 'Amount', 'Due', '2000.50'],
        [95] * 8
    )
    result = await parser.parse_electricity_bill(b"fake", "bill.png")
    assert result.provider == "BSES"
    assert result.account_number == "987654321"
    assert result.amount == 2000.5
    assert result.needs_manual_review is False

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
async def test_parse_electricity_bill_bescom_clear(mock_ocr, parser):
    mock_ocr.return_value = mock_pytesseract_data(
        ['BESCOM', 'Account', 'No', '1122334455', 'Total', 'Due:', '550'],
        [90] * 7
    )
    result = await parser.parse_electricity_bill(b"fake", "bill.png")
    assert result.provider == "BESCOM"
    assert result.account_number == "1122334455"
    assert result.amount == 550.0

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
async def test_parse_electricity_bill_tangedco_clear(mock_ocr, parser):
    mock_ocr.return_value = mock_pytesseract_data(
        ['TANGEDCO', 'Consumer', 'No:', '0987654321', 'Payable', 'Amount:', '₹', '300'],
        [90] * 8
    )
    result = await parser.parse_electricity_bill(b"fake", "bill.png")
    assert result.provider == "TANGEDCO"
    assert result.account_number == "0987654321"
    assert result.amount == 300.0

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
async def test_parse_electricity_bill_msedcl_clear(mock_ocr, parser):
    mock_ocr.return_value = mock_pytesseract_data(
        ['MSEDCL', 'Consumer', 'Number:', '5544332211', 'Amount', 'Due', '1250'],
        [90] * 7
    )
    result = await parser.parse_electricity_bill(b"fake", "bill.png")
    assert result.provider == "MSEDCL"
    assert result.account_number == "5544332211"

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
async def test_parse_electricity_bill_low_confidence_blurry(mock_ocr, parser):
    # Confidence < 60 averages to low
    mock_ocr.return_value = mock_pytesseract_data(
        ['TATA', 'CA', 'No:', '123456789', 'Amount', 'Due', '1000'],
        [50, 50, 50, 50, 50, 50, 50]
    )
    result = await parser.parse_electricity_bill(b"fake", "bill.jpg")
    assert result.needs_manual_review is True
    assert result.account_number is None  # Should be cleared because of low conf
    assert result.amount == 1000.0  # Amount is kept but record flagged

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
async def test_parse_electricity_bill_missing_essential_fields(mock_ocr, parser):
    # High confidence but missing CA NO and Amount
    mock_ocr.return_value = mock_pytesseract_data(
        ['Welcome', 'to', 'Electricity', 'Board', 'Thank', 'you'],
        [90] * 6
    )
    result = await parser.parse_electricity_bill(b"fake", "bill.jpg")
    assert result.needs_manual_review is True
    assert result.account_number is None
    assert result.amount is None

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
async def test_parse_electricity_bill_wrong_document(mock_ocr, parser):
    mock_ocr.return_value = mock_pytesseract_data(
        ['Grocery', 'Store', 'Milk', 'Bread', 'Total:', 'Rs', '150'],
        [95] * 7
    )
    result = await parser.parse_electricity_bill(b"fake", "bill.jpg")
    assert result.needs_manual_review is True
    assert result.provider == "Unknown DISCOM"

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.convert_from_bytes')
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
async def test_parse_electricity_bill_pdf_format(mock_ocr, mock_pdf, parser):
    mock_pdf.return_value = [MagicMock(), MagicMock()] # 2 pages
    mock_ocr.side_effect = [
        mock_pytesseract_data(['BSES'], [90]),
        mock_pytesseract_data(['CA', 'No:', '123456789', 'Amount', 'Due:', '500'], [90, 90, 90, 90, 90, 90])
    ]
    result = await parser.parse_electricity_bill(b"fake_pdf_bytes", "bill.pdf")
    assert result.provider == "BSES"
    assert result.account_number == "123456789"
    assert result.amount == 500.0

@pytest.mark.asyncio
async def test_parse_recharge_sms_prepaid_valid(parser):
    sms = "Recharge of Rs 299 successful on your Jio prepaid number on 15/05/2026."
    result = await parser.parse_recharge_sms(sms)
    assert result.amount == 299.0
    assert result.provider.lower() == "jio"
    assert result.is_postpaid is False
    assert result.needs_manual_review is False

@pytest.mark.asyncio
async def test_parse_recharge_sms_postpaid_valid(parser):
    sms = "Thank you for paying Rs 499 towards Airtel postpaid bill on 10-06-2026."
    result = await parser.parse_recharge_sms(sms)
    assert result.amount == 499.0
    assert result.provider.lower() == "airtel"
    assert result.is_postpaid is True
    assert result.needs_manual_review is False

@pytest.mark.asyncio
async def test_parse_recharge_sms_missing_amount(parser):
    sms = "Your Vodafone recharge was successful today."
    result = await parser.parse_recharge_sms(sms)
    assert result.needs_manual_review is True
    assert result.amount is None

@pytest.mark.asyncio
async def test_parse_recharge_sms_missing_operator(parser):
    sms = "Recharge of Rs 100 successful on your number."
    result = await parser.parse_recharge_sms(sms)
    assert result.needs_manual_review is True
    assert result.provider is None

@pytest.mark.asyncio
async def test_parse_recharge_sms_malformed_date(parser):
    sms = "Recharge of Rs 199 for Vi successful on 99/99/9999."
    result = await parser.parse_recharge_sms(sms)
    # The date parser will fail on 99/99/9999, so it falls back to now
    assert result.amount == 199.0
    assert result.provider.lower() == "vi"
    assert result.needs_manual_review is False # amount and operator are present

@pytest.mark.asyncio
@patch('ingestion_service.connectors.beneficiary_upload.pytesseract.image_to_data')
async def test_parse_electricity_bill_mixed_confidence(mock_ocr, parser):
    # Average conf > 60, should not be flagged for low conf
    mock_ocr.return_value = mock_pytesseract_data(
        ['TATA', 'CA', 'No:', '123456789', 'Amount', 'Due', '1000'],
        [95, 90, 90, 90, 40, 40, 90] # avg ~76
    )
    result = await parser.parse_electricity_bill(b"fake", "bill.jpg")
    assert result.needs_manual_review is False
    assert result.account_number == "123456789"
