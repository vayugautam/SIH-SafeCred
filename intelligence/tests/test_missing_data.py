import pytest
import numpy as np
from intelligence.feature_engine.missing_data import MissingDataHandler, BeneficiaryMeta

@pytest.fixture
def mock_stats():
    district = {"D123": {"emi_hit_rate": 85.0, "avg_monthly_electricity_units": 100.0, "prepayment_ratio": 0.2}}
    state = {"S01": {"emi_hit_rate": 80.0, "avg_monthly_electricity_units": 120.0, "delinquency_trend": 0.1}}
    national = {"INDIA": {"emi_hit_rate": 75.0, "avg_monthly_electricity_units": 150.0, "utility_diversity_score": 2.0}}
    return district, state, national

@pytest.fixture
def handler(mock_stats):
    return MissingDataHandler(mock_stats[0], mock_stats[1], mock_stats[2])

@pytest.fixture
def meta():
    return BeneficiaryMeta(district_code="D123", state_code="S01", caste_category="GEN", loan_count=0)

def test_imputation_0_percent_missing(handler, meta):
    fv = {
        "emi_hit_rate": 90.0,
        "avg_days_past_due": 5.0,
        "avg_monthly_electricity_units": 200.0,
        "avg_monthly_recharge_amount": 300.0,
        "delinquency_trend": 0.05,
        "prepayment_ratio": 0.1,
        "utility_diversity_score": 3.0
    }
    res = handler.impute(fv, meta)
    
    assert res.completeness_score == 1.0
    assert len(res.low_confidence_flags) == 0
    assert res.ccs_cap == 1000.0
    assert not res.imputation_metadata

def test_imputation_30_percent_missing(handler, meta):
    # Missing prepayment_ratio and utility_diversity_score
    fv = {
        "emi_hit_rate": 90.0,
        "avg_days_past_due": 5.0,
        "avg_monthly_electricity_units": 200.0,
        "avg_monthly_recharge_amount": 300.0,
        "delinquency_trend": 0.05,
        "prepayment_ratio": None,
        "utility_diversity_score": np.nan
    }
    res = handler.impute(fv, meta)
    
    # Missing weights = 0.05 + 0.05 = 0.10. Score should be ~0.9
    assert 0.8 < res.completeness_score < 1.0
    assert len(res.low_confidence_flags) == 2
    assert "prepayment_ratio" in res.imputation_metadata
    assert "utility_diversity_score" in res.imputation_metadata
    
    # Prepayment Ratio: Hits District Tier 1 (0.2)
    assert res.imputation_metadata["prepayment_ratio"]["tier_used"] == 1
    assert res.features["prepayment_ratio"] == 0.2
    
    # Utility Diversity: Hits National Tier 3 (2.0)
    # But it's an income proxy, so safety rule applies (x0.5) => 1.0
    assert res.imputation_metadata["utility_diversity_score"]["tier_used"] == 3
    assert res.features["utility_diversity_score"] == 1.0
    
    assert res.ccs_cap == 1000.0

def test_imputation_60_percent_missing(handler, meta):
    # Provide only 2 features
    fv = {
        "emi_hit_rate": 90.0,
        "avg_days_past_due": None,
        "avg_monthly_electricity_units": 200.0,
        "avg_monthly_recharge_amount": None,
        "delinquency_trend": None,
        "prepayment_ratio": None,
        "utility_diversity_score": None
    }
    res = handler.impute(fv, meta)
    
    # Provided weights: 0.15 + 0.10 = 0.25
    # Total weight: ~0.60
    # Score = ~0.41, so it shouldn't cap below 0.3
    assert res.completeness_score > 0.3
    assert len(res.low_confidence_flags) == 5
    assert res.ccs_cap == 1000.0

def test_imputation_100_percent_missing(handler, meta):
    # Empty feature vector
    res = handler.impute({}, meta)
    
    assert res.completeness_score == 0.0
    assert res.ccs_cap == 600.0  # Capped!
    assert len(res.low_confidence_flags) > 0
    assert "emi_hit_rate" in res.imputation_metadata
    
    # Emi_hit_rate hits District (85.0)
    assert res.imputation_metadata["emi_hit_rate"]["tier_used"] == 1
    assert res.features["emi_hit_rate"] == 85.0
    
    # avg_monthly_electricity_units hits District (100.0). 
    # Since it's an income proxy, it should be halved (50.0)
    assert res.imputation_metadata["avg_monthly_electricity_units"]["tier_used"] == 1
    assert res.features["avg_monthly_electricity_units"] == 50.0
