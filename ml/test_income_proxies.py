import pytest
from datetime import datetime, timedelta
from ml.income_proxies import IncomeProxyExtractor, DistrictMedians

@pytest.fixture
def extractor():
    return IncomeProxyExtractor(reference_date=datetime(2023, 12, 1))

@pytest.fixture
def default_medians():
    return DistrictMedians(
        median_electricity_kwh=150.0,
        median_electricity_regularity=80.0,
        median_electricity_spend_trend=5.0,
        median_recharge_amount=299.0,
        median_recharge_frequency=50.0,
        median_utility_diversity=2.0,
        median_lpg_frequency=6.0,
        estimated_consumption_percentile=65.0,
        median_consumption_growth_rate=0.05
    )

def test_missing_medians_value_error(extractor):
    # Empty arrays (<3 records) without district_medians should raise ValueError
    with pytest.raises(ValueError, match="district_medians required"):
        extractor.compute_features([], [])

def test_imputation_fallback_electricity(extractor, default_medians):
    # Only 2 electricity records, < 3 rule should trigger fallback
    utils = [
        {"type": "electricity", "units_consumed_kwh": 300, "billing_date": "2023-11-01"},
        {"type": "electricity", "units_consumed_kwh": 310, "billing_date": "2023-10-01"}
    ]
    feats = extractor.compute_features(utils, [], default_medians)
    # Average of 300 and 310 is 305, but fallback is 150.0
    assert feats["avg_monthly_electricity_units"] == 150.0
    assert feats["electricity_payment_regularity"] == 80.0
    assert feats["electricity_spend_trend"] == 5.0

def test_electricity_computation_valid(extractor, default_medians):
    # 3 records, should compute mathematically
    utils = [
        {"type": "electricity", "units_consumed_kwh": 300, "amount": 1000, "payment_status": "PAID", "billing_date": "2023-11-01"},
        {"type": "electricity", "units_consumed_kwh": 310, "amount": 1100, "payment_status": "PAID", "billing_date": "2023-10-01"},
        {"type": "electricity", "units_consumed_kwh": 290, "amount": 900, "payment_status": "UNPAID", "billing_date": "2023-09-01"}
    ]
    feats = extractor.compute_features(utils, [], default_medians)
    assert feats["avg_monthly_electricity_units"] == 300.0  # (300+310+290)/3
    assert feats["electricity_payment_regularity"] == pytest.approx(66.666, 0.01) # 2/3 PAID
    assert "electricity_spend_trend" in feats # Handled by polyfit

def test_imputation_fallback_telecom(extractor, default_medians):
    # Only 1 telecom record
    telecoms = [
        {"type": "mobile_recharge", "amount": 200, "billing_date": "2023-11-01"}
    ]
    feats = extractor.compute_features([], telecoms, default_medians)
    # High value flag is min_records_needed: 1
    assert feats["high_value_recharge_flag"] == 0.0
    # But averages fallback
    assert feats["avg_monthly_recharge_amount"] == 299.0
    assert feats["recharge_frequency_score"] == 50.0

def test_telecom_computation_valid(extractor, default_medians):
    # 4 telecom records (>=3)
    telecoms = [
        {"type": "mobile_recharge", "amount": 200, "billing_date": "2023-11-01"},
        {"type": "mobile_recharge", "amount": 200, "billing_date": "2023-10-01"},
        {"type": "mobile_recharge", "amount": 200, "billing_date": "2023-09-01"},
        {"type": "mobile_recharge", "amount": 600, "billing_date": "2023-08-01"} # High value!
    ]
    feats = extractor.compute_features([], telecoms, default_medians)
    assert feats["avg_monthly_recharge_amount"] == pytest.approx(1200 / 6.0) # Sum 1200 over 6 months
    assert feats["high_value_recharge_flag"] == 1.0 # 600 > 500

def test_utility_diversity_and_flags(extractor, default_medians):
    utils = [
        {"type": "electricity", "billing_date": "2023-11-01", "payment_method": "UPI"},
        {"type": "water", "billing_date": "2023-11-01", "payment_method": "cash"},
        {"type": "LPG", "billing_date": "2023-11-01", "payment_method": "UPI"}
    ]
    feats = extractor.compute_features(utils, [], default_medians)
    assert feats["utility_diversity_score"] == 3.0
    assert feats["water_bill_payment_flag"] == 1.0
    assert feats["payment_mode_digital_flag"] == 1.0 # Due to UPI

def test_lpg_frequency_annualized(extractor, default_medians):
    utils = [
        {"type": "electricity", "billing_date": "2023-11-01"},
        {"type": "electricity", "billing_date": "2023-10-01"},
        {"type": "electricity", "billing_date": "2023-09-01"},
        {"type": "LPG", "billing_date": "2023-11-01"},
        {"type": "LPG", "billing_date": "2023-09-01"}
    ]
    feats = extractor.compute_features(utils, [], default_medians)
    # 2 refills in 6 months -> 4 annualized
    assert feats["lpg_refill_frequency"] == 4.0

def test_consumption_growth_rate_fallback(extractor, default_medians):
    # Needs 6 records minimum, passing 4
    utils = [{"type": "electricity", "amount": 100, "billing_date": "2023-11-01"} for _ in range(4)]
    feats = extractor.compute_features(utils, [], default_medians)
    assert feats["consumption_growth_rate"] == 0.05 # Falls back to median

def test_consumption_growth_rate_valid(extractor, default_medians):
    utils = [
        # Last 3 months (Nov, Oct, Sep)
        {"type": "electricity", "amount": 200, "billing_date": "2023-11-01"},
        {"type": "electricity", "amount": 200, "billing_date": "2023-10-01"},
        {"type": "electricity", "amount": 200, "billing_date": "2023-09-01"},
        # Previous 3 months (Aug, Jul, Jun)
        {"type": "electricity", "amount": 100, "billing_date": "2023-08-01"},
        {"type": "electricity", "amount": 100, "billing_date": "2023-07-01"},
        {"type": "electricity", "amount": 100, "billing_date": "2023-06-15"}
    ]
    feats = extractor.compute_features(utils, [], default_medians)
    # prev = 300, last = 600. Growth = (600 - 300) / 300 = 1.0 (100%)
    assert feats["consumption_growth_rate"] == 1.0
