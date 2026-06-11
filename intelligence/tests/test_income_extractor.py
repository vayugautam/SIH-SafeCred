import pytest
from datetime import datetime
from dateutil.relativedelta import relativedelta
from intelligence.feature_engine.income_proxy_extractor import IncomeProxyExtractor

def test_imputation_fallback_triggered():
    district_data = {"district_median_electricity_units": 150.0}
    # Provide only 2 records, min required is 3
    now = datetime.now()
    recs = [
        {"type": "electricity", "units_consumed_kwh": 200.0, "date": now},
        {"type": "electricity", "units_consumed_kwh": 220.0, "date": now - relativedelta(months=1)},
    ]
    features = IncomeProxyExtractor.extract_features(recs, district_data)
    # Should fall back to 150.0 because len is 2
    assert features["avg_monthly_electricity_units"] == 150.0

def test_no_fallback_when_sufficient_data():
    district_data = {"district_median_electricity_units": 150.0}
    now = datetime.now()
    recs = [
        {"type": "electricity", "units_consumed_kwh": 200.0, "date": now},
        {"type": "electricity", "units_consumed_kwh": 220.0, "date": now - relativedelta(months=1)},
        {"type": "electricity", "units_consumed_kwh": 210.0, "date": now - relativedelta(months=2)},
    ]
    features = IncomeProxyExtractor.extract_features(recs, district_data)
    assert features["avg_monthly_electricity_units"] == 210.0 # Average of 200, 220, 210

def test_digital_payment_flag():
    district_data = {}
    recs = [{"type": "mobile_recharge", "payment_mode": "UPI", "date": datetime.now()}]
    features = IncomeProxyExtractor.extract_features(recs, district_data)
    assert features["payment_mode_digital_flag"] == 1.0
