import pytest
import numpy as np
from ml.missing_data import MissingDataHandler, BeneficiaryMeta, ImputedFeatureVector

@pytest.fixture
def mock_demographics():
    district = {
        "D1": {
            "avg_days_past_due": 10.0,
            "avg_monthly_recharge_amount": 250.0
        }
    }
    state = {
        "S1": {
            "avg_days_past_due": 15.0,
            "avg_monthly_recharge_amount": 300.0,
            "emi_hit_rate": 85.0
        }
    }
    national = {
        "avg_days_past_due": 20.0,
        "avg_monthly_recharge_amount": 200.0, # Notice National is lower than State/District
        "emi_hit_rate": 80.0,
        "utility_diversity_score": 2.0
    }
    return district, state, national

@pytest.fixture
def handler(mock_demographics):
    d, s, n = mock_demographics
    return MissingDataHandler(district_stats=d, state_stats=s, national_stats=n)

@pytest.fixture
def meta():
    return BeneficiaryMeta(district_code="D1", state_code="S1", caste_category="GEN", loan_count=1)

def test_0_percent_missing(handler, meta):
    # All required features present
    fv = {
        "avg_days_past_due": 0.0,
        "avg_monthly_recharge_amount": 500.0,
        "emi_hit_rate": 100.0,
        "utility_diversity_score": 4.0
    }
    
    result = handler.impute(fv, meta)
    
    assert result.completeness_score == 1.0
    assert result.requires_ccs_cap is False
    assert len(result.imputation_metadata) == 0
    # Values unchanged
    assert result.features["avg_monthly_recharge_amount"] == 500.0

def test_30_percent_missing(handler, meta):
    # Missing some features, > 0.3 completeness
    fv = {
        "avg_days_past_due": 0.0,
        "emi_hit_rate": 100.0,
        "avg_monthly_recharge_amount": None, # Missing, should hit district
        "utility_diversity_score": None # Missing, should hit national
    }
    
    result = handler.impute(fv, meta)
    
    # 2/4 present. Weights: avg_days (1.5) + emi (1.5) = 3.0. 
    # Total: 3.0 + recharge (1.0) + utility (0.8) = 4.8.
    # Score: 3.0 / 4.8 = 0.625 > 0.3
    
    assert result.completeness_score > 0.3
    assert result.requires_ccs_cap is False
    
    # Recharge hit District (250), but wait, recharge is an income proxy. 
    # District is 250, National is 200. It should CAP downward to 200 to be conservative!
    assert result.features["avg_monthly_recharge_amount"] == 200.0
    assert "capped_conservative" in result.imputation_metadata["avg_monthly_recharge_amount"]["tier_used"]
    
    # Utility hit National
    assert result.features["utility_diversity_score"] == 2.0
    assert result.imputation_metadata["utility_diversity_score"]["tier_used"] == "national"

def test_60_percent_missing(handler, meta):
    # Mostly missing, should trigger capping
    fv = {
        "avg_days_past_due": None,
        "emi_hit_rate": None,
        "avg_monthly_recharge_amount": None,
        "utility_diversity_score": 4.0 # Only one present. Weight: 0.8 / 4.8 = 0.16 < 0.3
    }
    
    result = handler.impute(fv, meta)
    
    assert result.completeness_score < 0.3
    assert result.requires_ccs_cap is True
    assert result.policy_flags["requires_ccs_cap"] is True
    assert result.imputation_metadata["ccs_cap_reason"] == "LOW_FEATURE_COMPLETENESS"

def test_100_percent_missing(handler, meta):
    # Total empty dictionary
    fv = {
        "avg_days_past_due": None,
        "emi_hit_rate": None,
        "avg_monthly_recharge_amount": None,
        "utility_diversity_score": None
    }
    
    # Should not crash
    result = handler.impute(fv, meta)
    
    assert result.completeness_score == 0.0
    assert result.requires_ccs_cap is True
    
    # Verify fallback tiering cascaded down
    assert result.features["avg_days_past_due"] == 10.0 # Hit district
    assert result.features["emi_hit_rate"] == 85.0 # Hit state
    assert result.features["utility_diversity_score"] == 2.0 # Hit national
