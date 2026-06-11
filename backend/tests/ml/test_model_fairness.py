import pytest
import numpy as np
from app.ml.bayesian_engine import BayesianIncomeUpdater
from app.ml.inference import CreditScoringModel

# =========================================================================
# ML MODEL FAIRNESS SUITE
# Testing Approval Rate Parity, Score Distribution, and Calibration Drift
# =========================================================================

def generate_synthetic_profiles_for_caste(caste_category: str, n=100):
    """Generates identically distributed financial profiles tagged with different castes."""
    profiles = []
    for _ in range(n):
        # We enforce that the underlying financial reality is identical across castes
        profile = {
            "caste_category": caste_category,
            "repayment_history": {"emi_hit_rate": 0.85, "days_past_due_avg": 5},
            "income_proxy": {"electricity_bill": 1200, "mobile_recharge": 499},
            "sei": {"digital_literacy": 0.6}
        }
        profiles.append(profile)
    return profiles

@pytest.fixture
def ml_model():
    # Mocking the loaded model for isolated testing
    return CreditScoringModel()

def test_fairness_approval_rate_parity(ml_model):
    """
    Ensures that identical financial profiles receive statistically identical
    approval rates (score > 450) regardless of Caste Category.
    """
    castes = ["SC", "ST", "OBC", "General"]
    approval_rates = {}

    for caste in castes:
        profiles = generate_synthetic_profiles_for_caste(caste, n=200)
        approved_count = 0
        
        for profile in profiles:
            score = ml_model.predict(profile)["composite_score"]
            if score >= 450:
                approved_count += 1
                
        approval_rates[caste] = approved_count / len(profiles)

    # Assert that the maximum divergence in approval rate is <= 5%
    rates = list(approval_rates.values())
    max_divergence = max(rates) - min(rates)
    
    assert max_divergence <= 0.05, f"Approval Rate Parity Failed: {approval_rates}"

def test_fairness_score_distribution_parity(ml_model):
    """
    Ensures the mean composite score for identical financial realities 
    does not diverge by more than 10 points across demographic groups.
    """
    castes = ["SC", "ST", "OBC", "General"]
    mean_scores = {}

    for caste in castes:
        profiles = generate_synthetic_profiles_for_caste(caste, n=100)
        scores = [ml_model.predict(p)["composite_score"] for p in profiles]
        mean_scores[caste] = np.mean(scores)

    scores_list = list(mean_scores.values())
    max_divergence = max(scores_list) - min(scores_list)

    assert max_divergence <= 10.0, f"Score Distribution Parity Failed: {mean_scores}"
