import pytest
from intelligence.feature_engine.composite_scorer import CompositeScoreAggregator

@pytest.fixture
def aggregator():
    return CompositeScoreAggregator()

def test_ccs_bounds(aggregator):
    # Test lower bounds
    res1 = aggregator.aggregate(
        repayment_score=-100, 
        income_category_score=-50, 
        socioeconomic_index=-200, 
        completeness_score=0.0, 
        income_band=1, 
        max_days_past_due=0
    )
    assert res1.ccs == 0
    
    # Test upper bounds
    res2 = aggregator.aggregate(
        repayment_score=1500, 
        income_category_score=2000, 
        socioeconomic_index=1100, 
        completeness_score=1.5, 
        income_band=1, 
        max_days_past_due=0
    )
    assert res2.ccs == 1000
    
def test_completeness_penalty(aggregator):
    # Base scores: RS=1000, IS=1000, SEI=1000 -> Raw CCS = 1000
    # completeness = 0.4 -> penalty factor = 0.8 + 0.4(0.4) = 0.96 -> CCS = 960
    res = aggregator.aggregate(1000, 1000, 1000, 0.4, 1, 0)
    assert res.ccs == 960
    assert res.confidence_level == "LOW"

def test_band_A_logic(aggregator):
    # CCS=800, Income Band=2, DPD=0 -> Band A
    res = aggregator.aggregate(800, 800, 800, 1.0, 2, 0)
    assert res.band == "A"
    assert res.eligible_for_digital_lending is True
    
    # Band A rejection due to income band 3 -> should fallback to Band B
    res2 = aggregator.aggregate(800, 800, 800, 1.0, 3, 0)
    assert res2.band == "B"
    
    # Band A rejection due to max_dpd >= 30 -> should fallback to Band B (since ccs>=600)
    res3 = aggregator.aggregate(800, 800, 800, 1.0, 2, 45)
    assert res3.band == "B"
    assert res3.eligible_for_digital_lending is False

def test_band_B_logic(aggregator):
    # CCS=650, Income Band=3 -> Band B
    res = aggregator.aggregate(650, 650, 650, 1.0, 3, 0)
    assert res.band == "B"
    
    # Rejection due to CCS drop to 550 -> Falls to Band C (since band=1,2 allow C)
    res2 = aggregator.aggregate(550, 550, 550, 1.0, 2, 0)
    assert res2.band == "C"

def test_band_C_logic(aggregator):
    # CCS=500, Income Band=2 -> Band C
    res = aggregator.aggregate(500, 500, 500, 1.0, 2, 0)
    assert res.band == "C"
    
    # Rejection due to Income Band=3 -> CCS=500 but band=3 is not allowed in C -> Falls to D
    res2 = aggregator.aggregate(500, 500, 500, 1.0, 3, 0)
    assert res2.band == "D"

def test_band_D_logic(aggregator):
    # CCS=350, Income Band=4 -> Band D (catch all for >= 300)
    res = aggregator.aggregate(350, 350, 350, 1.0, 4, 0)
    assert res.band == "D"
    
    # Drop below 300 -> Band E
    res2 = aggregator.aggregate(250, 250, 250, 1.0, 2, 0)
    assert res2.band == "E"

def test_band_E_logic_HIG_reject(aggregator):
    # Even with perfect CCS (1000), if income band is 5 (HIG), they go to Band E (Reject for concessional)
    res = aggregator.aggregate(1000, 1000, 1000, 1.0, 5, 0)
    assert res.band == "E"

def test_digital_lending_eligibility(aggregator):
    # Needs Band A, completeness > 0.6, max_dpd < 30
    
    # Fails completeness
    res = aggregator.aggregate(800, 800, 800, 0.5, 1, 0)
    # Note: 0.5 completeness on raw 800 = 800 * (0.8 + 0.4*0.5) = 800. Still Band A.
    assert res.band == "A"
    assert res.eligible_for_digital_lending is False # Because completeness <= 0.6
