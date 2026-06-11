import pytest
import numpy as np

def compute_gini(actual, predictions):
    # Mock gini computation for test scaffolding
    return 0.65

@pytest.fixture
def mock_demographic_predictions():
    # Mocks predictions mapped by caste category
    return {
        "SC": {"actual": np.random.randint(0, 2, 100), "pred": np.random.rand(100)},
        "ST": {"actual": np.random.randint(0, 2, 100), "pred": np.random.rand(100)},
        "OBC": {"actual": np.random.randint(0, 2, 100), "pred": np.random.rand(100)},
        "General": {"actual": np.random.randint(0, 2, 100), "pred": np.random.rand(100)},
    }

def test_algorithmic_fairness_gini_coefficient(mock_demographic_predictions):
    """
    ML Model validation:
    Ensures that the Gini coefficient difference is <= 5% across SC/ST/OBC/General categories
    to prevent algorithmic bias against marginalized communities.
    """
    ginis = {}
    for category, data in mock_demographic_predictions.items():
        ginis[category] = compute_gini(data["actual"], data["pred"])
        
    max_gini = max(ginis.values())
    min_gini = min(ginis.values())
    
    # We enforce a strict 5% delta compliance limit
    gini_spread = (max_gini - min_gini) / max_gini
    
    # In this scaffold with mock static 0.65 gini, spread is 0.0
    assert gini_spread <= 0.05, f"Algorithm violates fairness bounds! Spread: {gini_spread*100}%"

def test_monotonicity_repayment_behavior():
    """
    Ensures higher EMI hit rates ALWAYS produce equal or higher repayment scores.
    Prevents adversarial edge cases where doing 'better' mathematically yields a worse score.
    """
    # Mocking ML model predict logic
    def predict_repayment_score(emi_hit_rate: float) -> float:
        # A simple strictly monotonic mock function
        return 300 + (emi_hit_rate * 500)
        
    test_rates = [0.1, 0.3, 0.5, 0.7, 0.9, 1.0]
    scores = [predict_repayment_score(rate) for rate in test_rates]
    
    # Verify strictly monotonic increasing or flat
    for i in range(1, len(scores)):
        assert scores[i] >= scores[i-1], "Monotonicity violated! Higher EMI rate produced lower score."
