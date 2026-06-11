import pytest
from datetime import datetime, timedelta
import numpy as np
from ml.repayment_features import RepaymentFeatureExtractor

@pytest.fixture
def extractor():
    return RepaymentFeatureExtractor(reference_date=datetime(2023, 12, 1))

# --- Edge Cases ---

def test_empty_lists(extractor):
    feats = extractor.compute_features([], [])
    assert feats['emi_hit_rate'] == 0.0
    assert feats['delinquency_trend'] == 0.0
    assert feats['max_days_past_due'] == 0.0

def test_single_payment(extractor):
    # Tests that std dev and linear slope don't crash on length 1
    reps = [{"due_date": "2023-01-01", "paid_date": "2023-01-05", "amount_due": 100, "amount_paid": 100}]
    loans = [{"approved_amount": 100}]
    feats = extractor.compute_features(loans, reps)
    assert feats['max_days_past_due'] == 4.0
    assert feats['avg_days_past_due'] == 4.0
    assert feats['delinquency_trend'] == 0.0
    assert feats['payment_consistency_score'] == 100.0

def test_missing_dates_fallback(extractor):
    # Test ValueError when everything is missing
    with pytest.raises(ValueError, match="Repayment record must contain due_date"):
        extractor.compute_features([], [{"amount_due": 100}])

def test_missing_paid_date(extractor):
    # Test DPD calculated against reference_date
    reps = [{"due_date": "2023-11-01"}] # ref date is 2023-12-01
    feats = extractor.compute_features([], reps)
    assert feats['max_days_past_due'] == 30.0

# --- Math & Metric Specific Tests ---

def test_emi_hit_rate(extractor):
    reps = [
        {"due_date": "2023-01-01", "paid_date": "2023-01-01"}, # On time
        {"due_date": "2023-02-01", "paid_date": "2023-02-05"}, # Late
        {"due_date": "2023-03-01", "paid_date": "2023-02-28"}, # Early
        {"due_date": "2023-04-01", "paid_date": "2023-04-10"}  # Late
    ]
    feats = extractor.compute_features([], reps)
    assert feats['emi_hit_rate'] == 50.0 # 2 on time / early, 2 late

def test_consecutive_on_time_streak(extractor):
    reps = [
        {"due_date": "2023-01-01", "paid_date": "2023-01-01"}, 
        {"due_date": "2023-02-01", "paid_date": "2023-02-01"}, 
        {"due_date": "2023-03-01", "paid_date": "2023-03-05"}, # Break streak
        {"due_date": "2023-04-01", "paid_date": "2023-04-01"}
    ]
    feats = extractor.compute_features([], reps)
    assert feats['consecutive_on_time_streak'] == 2.0

def test_delinquency_trend_positive(extractor):
    # Payments getting increasingly late
    reps = [
        {"due_date": "2023-01-01", "paid_date": "2023-01-01"}, # dpd 0
        {"due_date": "2023-02-01", "paid_date": "2023-02-05"}, # dpd 4
        {"due_date": "2023-03-01", "paid_date": "2023-03-10"}  # dpd 9
    ]
    feats = extractor.compute_features([], reps)
    assert feats['delinquency_trend'] > 0 # Positive slope

def test_delinquency_trend_negative(extractor):
    # Payments getting better
    reps = [
        {"due_date": "2023-01-01", "paid_date": "2023-01-10"}, # dpd 9
        {"due_date": "2023-02-01", "paid_date": "2023-02-05"}, # dpd 4
        {"due_date": "2023-03-01", "paid_date": "2023-03-01"}  # dpd 0
    ]
    feats = extractor.compute_features([], reps)
    assert feats['delinquency_trend'] < 0 # Negative slope

def test_prepayment_ratio(extractor):
    reps = [
        {"due_date": "2023-01-05", "paid_date": "2023-01-01"}, # Prepayment
        {"due_date": "2023-02-05", "paid_date": "2023-02-05"}  # Exact time
    ]
    feats = extractor.compute_features([], reps)
    assert feats['prepayment_ratio'] == 0.5 # 1 out of 2

def test_loan_utilisation_rate(extractor):
    loans = [{"approved_amount": 10000, "disbursed_amount": 5000}]
    feats = extractor.compute_features(loans, [])
    assert feats['loan_utilisation_rate'] == 0.5

def test_repeat_borrower_flag(extractor):
    feats = extractor.compute_features([{"id": 1}, {"id": 2}], [])
    assert feats['repeat_borrower_flag'] == 1.0
    feats2 = extractor.compute_features([{"id": 1}], [])
    assert feats2['repeat_borrower_flag'] == 0.0

def test_tenure_completion_rate(extractor):
    loans = [{"status": "CLOSED"}, {"status": "ACTIVE"}]
    feats = extractor.compute_features(loans, [])
    assert feats['tenure_completion_rate'] == 0.5

def test_avg_loan_size_growth(extractor):
    loans = [{"approved_amount": 1000}, {"approved_amount": 1500}] # 50% growth
    feats = extractor.compute_features(loans, [])
    assert feats['avg_loan_size_growth'] == 0.5

def test_worst_delinquency_bucket(extractor):
    # 0=never, 1=1-30, 2=31-60, 3=61-90, 4=90+
    feats1 = extractor.compute_features([], [{"dpd": 0}])
    assert feats1['worst_delinquency_bucket'] == 0.0
    feats2 = extractor.compute_features([], [{"dpd": 15}])
    assert feats2['worst_delinquency_bucket'] == 1.0
    feats3 = extractor.compute_features([], [{"dpd": 45}])
    assert feats3['worst_delinquency_bucket'] == 2.0
    feats4 = extractor.compute_features([], [{"dpd": 100}])
    assert feats4['worst_delinquency_bucket'] == 4.0

def test_partial_payment_rate(extractor):
    reps = [
        {"amount_due": 100, "amount_paid": 50},  # Partial
        {"amount_due": 100, "amount_paid": 100}  # Full
    ]
    feats = extractor.compute_features([], reps)
    assert feats['partial_payment_rate'] == 0.5

def test_diversity_metrics(extractor):
    loans = [
        {"purpose": "EDUCATION", "channel_partner": "PartnerA"},
        {"purpose": "MEDICAL", "channel_partner": "PartnerA"}
    ]
    feats = extractor.compute_features(loans, [])
    assert feats['loan_purpose_diversity'] == 2.0
    assert feats['channel_partner_diversity'] == 1.0

def test_avg_loan_tenure(extractor):
    loans = [{"tenure_months": 12}, {"tenure_months": 24}]
    feats = extractor.compute_features(loans, [])
    assert feats['avg_loan_tenure_months'] == 18.0

def test_early_repayment_flag(extractor):
    # closed_date > 3 months (90 days) before maturity
    loans = [
        {"status": "CLOSED", "closed_date": "2023-01-01", "maturity_date": "2023-06-01"}
    ]
    feats = extractor.compute_features(loans, [])
    assert feats['early_repayment_flag'] == 1.0

def test_dpd_aggregates(extractor):
    reps = [{"dpd": 10}, {"dpd": 40}, {"dpd": 70}, {"dpd": 100}]
    feats = extractor.compute_features([], reps)
    assert feats['max_days_past_due'] == 100.0
    assert feats['current_days_past_due'] == 100.0
    assert feats['30_plus_dpd_count'] == 3.0
    assert feats['60_plus_dpd_count'] == 2.0
    assert feats['90_plus_dpd_count'] == 1.0

def test_on_time_late_ratios(extractor):
    reps = [
        {"due_date": "2023-01-01", "paid_date": "2023-01-01"}, # On time
        {"due_date": "2023-02-01", "paid_date": "2023-02-05"}  # Late
    ]
    feats = extractor.compute_features([], reps)
    assert feats['on_time_payment_ratio'] == 0.5
    assert feats['late_payment_ratio'] == 0.5
