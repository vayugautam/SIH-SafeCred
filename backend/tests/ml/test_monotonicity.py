import pytest
import copy
from app.ml.inference import CreditScoringModel

# =========================================================================
# ML MONOTONICITY SUITE
# Ensuring safe, predictable mathematical invariants in Model outputs.
# =========================================================================

@pytest.fixture
def ml_model():
    return CreditScoringModel()

def generate_base_profile():
    return {
        "caste_category": "General",
        "repayment_history": {"emi_hit_rate": 0.50, "days_past_due_avg": 30},
        "income_proxy": {"electricity_bill": 500, "mobile_recharge": 200},
        "sei": {"digital_literacy": 0.5}
    }

def test_monotonicity_emi_hit_rate(ml_model):
    """Higher EMI hit rate => score should NOT decrease."""
    base_profile = generate_base_profile()
    
    better_profile = copy.deepcopy(base_profile)
    better_profile["repayment_history"]["emi_hit_rate"] = 0.95
    
    base_score = ml_model.predict(base_profile)["composite_score"]
    better_score = ml_model.predict(better_profile)["composite_score"]
    
    assert better_score >= base_score, f"Monotonicity violation: Better EMI ({better_score}) scored lower than Base ({base_score})"

def test_monotonicity_days_past_due(ml_model):
    """Lower DPD (Days Past Due) => score should NOT decrease."""
    base_profile = generate_base_profile()
    
    better_profile = copy.deepcopy(base_profile)
    better_profile["repayment_history"]["days_past_due_avg"] = 0  # Perfect
    
    base_score = ml_model.predict(base_profile)["composite_score"]
    better_score = ml_model.predict(better_profile)["composite_score"]
    
    assert better_score >= base_score, f"Monotonicity violation: Lower DPD ({better_score}) scored lower than Base ({base_score})"

def test_monotonicity_income_proxy(ml_model):
    """Higher consistent utility consumption => score should NOT decrease."""
    base_profile = generate_base_profile()
    
    better_profile = copy.deepcopy(base_profile)
    better_profile["income_proxy"]["electricity_bill"] = 2000
    better_profile["income_proxy"]["mobile_recharge"] = 1000
    
    base_score = ml_model.predict(base_profile)["composite_score"]
    better_score = ml_model.predict(better_profile)["composite_score"]
    
    assert better_score >= base_score, f"Monotonicity violation: Higher Proxy Income ({better_score}) scored lower than Base ({base_score})"
