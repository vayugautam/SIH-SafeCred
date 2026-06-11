import pytest
from datetime import datetime, timedelta
from intelligence.feature_engine.repayment_extractor import RepaymentFeatureExtractor

def test_empty_lists():
    res = RepaymentFeatureExtractor.extract_features([], [])
    assert res["emi_hit_rate"] == 0.0
    assert res["repeat_borrower_flag"] == 0.0

def test_single_loan_no_repayments():
    loans = [{"amount": 1000, "status": "open", "tenure_months": 12, "purpose": "edu", "channel_partner_id": "CP1"}]
    res = RepaymentFeatureExtractor.extract_features(loans, [])
    assert res["repeat_borrower_flag"] == 0.0
    assert res["loan_purpose_diversity"] == 1.0
    assert res["avg_loan_tenure_months"] == 12.0
    assert res["channel_partner_diversity"] == 1.0
    assert res["emi_hit_rate"] == 0.0

def test_multiple_loans_basic():
    loans = [
        {"amount": 1000, "status": "closed", "purpose": "edu", "channel_partner_id": "CP1"},
        {"amount": 2000, "status": "open", "purpose": "med", "channel_partner_id": "CP2"}
    ]
    res = RepaymentFeatureExtractor.extract_features(loans, [])
    assert res["repeat_borrower_flag"] == 1.0
    assert res["loan_purpose_diversity"] == 2.0
    assert res["channel_partner_diversity"] == 2.0
    assert res["tenure_completion_rate"] == 0.5

def test_loan_utilisation_rate_normal():
    loans = [{"disbursed_amount": 800, "approved_amount": 1000}]
    res = RepaymentFeatureExtractor.extract_features(loans, [])
    assert res["loan_utilisation_rate"] == 0.8

def test_loan_utilisation_rate_zero_approved():
    loans = [{"disbursed_amount": 0, "approved_amount": 0}]
    res = RepaymentFeatureExtractor.extract_features(loans, [])
    assert res["loan_utilisation_rate"] == 0.0

def test_early_repayment_flag_positive():
    loans = [{"status": "closed", "closed_early_months": 4}]
    res = RepaymentFeatureExtractor.extract_features(loans, [])
    assert res["early_repayment_flag"] == 1.0

def test_early_repayment_flag_negative():
    loans = [{"status": "closed", "closed_early_months": 2}]
    res = RepaymentFeatureExtractor.extract_features(loans, [])
    assert res["early_repayment_flag"] == 0.0

def test_avg_loan_size_growth_positive():
    d1 = datetime(2025, 1, 1)
    d2 = datetime(2026, 1, 1)
    loans = [
        {"amount": 1000, "applied_at": d1},
        {"amount": 1500, "applied_at": d2}
    ]
    res = RepaymentFeatureExtractor.extract_features(loans, [])
    assert res["avg_loan_size_growth"] == 0.5

def test_avg_loan_size_growth_negative():
    d1 = datetime(2025, 1, 1)
    d2 = datetime(2026, 1, 1)
    loans = [
        {"amount": 1000, "applied_at": d1},
        {"amount": 800, "applied_at": d2}
    ]
    res = RepaymentFeatureExtractor.extract_features(loans, [])
    assert res["avg_loan_size_growth"] == -0.2

def test_emi_hit_rate_basic():
    reps = [
        {"dpd": 0, "is_late": False},
        {"dpd": 5, "is_late": True},
        {"dpd": 0, "is_late": False},
        {"dpd": 0, "is_late": False}
    ]
    res = RepaymentFeatureExtractor.extract_features([], reps)
    assert res["emi_hit_rate"] == 75.0

def test_max_and_avg_days_past_due():
    reps = [{"dpd": 0}, {"dpd": 10}, {"dpd": 20}]
    res = RepaymentFeatureExtractor.extract_features([], reps)
    assert res["max_days_past_due"] == 20.0
    assert res["avg_days_past_due"] == 15.0

def test_prepayment_ratio():
    reps = [{"is_prepayment": True}, {"is_prepayment": False}]
    res = RepaymentFeatureExtractor.extract_features([], reps)
    assert res["prepayment_ratio"] == 0.5

def test_delinquency_trend_positive():
    now = datetime.now()
    reps = [
        {"dpd": 0, "paid_at": now - timedelta(days=50)},
        {"dpd": 5, "paid_at": now - timedelta(days=40)},
        {"dpd": 10, "paid_at": now - timedelta(days=30)}
    ]
    res = RepaymentFeatureExtractor.extract_features([], reps)
    assert res["delinquency_trend"] > 0.0

def test_delinquency_trend_negative():
    now = datetime.now()
    reps = [
        {"dpd": 10, "paid_at": now - timedelta(days=50)},
        {"dpd": 5, "paid_at": now - timedelta(days=40)},
        {"dpd": 0, "paid_at": now - timedelta(days=30)}
    ]
    res = RepaymentFeatureExtractor.extract_features([], reps)
    assert res["delinquency_trend"] < 0.0

def test_payment_consistency_score_single():
    reps = [{"dpd": 0}]
    res = RepaymentFeatureExtractor.extract_features([], reps)
    assert res["payment_consistency_score"] == 100.0

def test_payment_consistency_score_variable():
    # Large variance in dpd -> lower score
    reps = [{"dpd": 0}, {"dpd": 60}, {"dpd": 0}]
    res = RepaymentFeatureExtractor.extract_features([], reps)
    assert res["payment_consistency_score"] < 100.0

def test_consecutive_on_time_streak():
    reps = [{"dpd": 0}, {"dpd": 0}, {"dpd": 5}, {"dpd": 0}, {"dpd": 0}, {"dpd": 0}]
    res = RepaymentFeatureExtractor.extract_features([], reps)
    assert res["consecutive_on_time_streak"] == 3.0

def test_worst_delinquency_bucket():
    assert RepaymentFeatureExtractor.extract_features([], [{"dpd": 0}])["worst_delinquency_bucket"] == 0.0
    assert RepaymentFeatureExtractor.extract_features([], [{"dpd": 15}])["worst_delinquency_bucket"] == 1.0
    assert RepaymentFeatureExtractor.extract_features([], [{"dpd": 45}])["worst_delinquency_bucket"] == 2.0
    assert RepaymentFeatureExtractor.extract_features([], [{"dpd": 75}])["worst_delinquency_bucket"] == 3.0
    assert RepaymentFeatureExtractor.extract_features([], [{"dpd": 120}])["worst_delinquency_bucket"] == 4.0

def test_partial_payment_rate():
    reps = [{"is_partial": True}, {"is_partial": False}, {"is_partial": False}, {"is_partial": False}]
    res = RepaymentFeatureExtractor.extract_features([], reps)
    assert res["partial_payment_rate"] == 0.25

def test_recovery_rate():
    d = datetime.now()
    reps = [
        {"dpd": 0, "paid_at": d}, # Start clean
        {"dpd": 5, "paid_at": d + timedelta(days=1)}, # Episode 1 starts
        {"dpd": 10, "paid_at": d + timedelta(days=2)}, # Still in Episode 1
        {"dpd": 0, "paid_at": d + timedelta(days=3)}, # Recovered
        {"dpd": 5, "paid_at": d + timedelta(days=4)}, # Episode 2 starts
        {"dpd": 5, "paid_at": d + timedelta(days=5)}  # Did not recover
    ]
    res = RepaymentFeatureExtractor.extract_features([], reps)
    assert res["recovery_rate"] == 0.5 # 1 recovery out of 2 episodes
