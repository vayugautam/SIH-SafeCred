import pytest
from intelligence.feature_engine.composite_scorer import CompositeScoreAggregator

@pytest.fixture
def base_aggregator():
    return CompositeScoreAggregator()

@pytest.mark.parametrize("ccs_score, expected_band, is_eligible", [
    (750, "A", True),
    (749, "B", False),
    (600, "B", False),
    (599, "C", False),
    (450, "C", False),
    (449, "D", False),
    (300, "D", False),
    (299, "E", False),
])
def test_composite_band_boundaries(base_aggregator, ccs_score, expected_band, is_eligible):
    """
    Test exact cutoff boundaries as per the ML spec.
    Band A >= 750, Band B >= 600, Band C >= 450, Band D >= 300, Band E < 300.
    """
    # Overriding internal math logic dynamically for tests or testing the public compute method
    # Assuming the module has a `determine_band_and_eligibility(ccs, income_band, dpd, completeness)`
    # Since the internal code applies formulas, we mock the inputs that perfectly yield these ccs_scores
    
    # Mocking a direct band assignment test
    result = base_aggregator._assign_band(
        ccs_raw=ccs_score, 
        income_band=1, 
        max_dpd=0, 
        completeness_score=0.9
    )
    
    assert result['band'] == expected_band
    assert result['eligible_for_digital_lending'] == is_eligible

def test_missing_data_degradation():
    """
    Test penalty rules:
    if completeness_score < 0.5: ccs = ccs_raw * (0.8 + 0.4 * completeness_score)
    """
    agg = CompositeScoreAggregator()
    # 0.4 completeness -> penalty multiplier = 0.8 + (0.4 * 0.4) = 0.96
    # 0.2 completeness -> penalty multiplier = 0.8 + (0.4 * 0.2) = 0.88
    res_high = agg.aggregate_scores(rs=800, ics=800, sei=800, completeness=0.9, income_band=2, max_dpd=0)
    assert res_high.ccs == 800 # (0.55*800 + 0.35*800 + 0.10*800)
    
    res_low = agg.aggregate_scores(rs=800, ics=800, sei=800, completeness=0.2, income_band=2, max_dpd=0)
    assert res_low.ccs == int(800 * 0.88)
