import pytest
import numpy as np
from unittest.mock import MagicMock, patch
from intelligence.models.bayesian_updater import BayesianIncomeUpdater

@pytest.fixture
def mock_mongo():
    with patch("intelligence.models.bayesian_updater.MongoClient") as mock_client:
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_client.return_value.__getitem__.return_value = mock_db
        mock_db.__getitem__.return_value = mock_collection
        yield mock_collection

def test_initialization(mock_mongo):
    mock_mongo.find_one.return_value = None
    updater = BayesianIncomeUpdater()
    
    # Should trigger init and insert
    updater.update("B123", "ELECTRICITY", 100)
    assert mock_mongo.insert_one.called

def test_bayesian_convergence_simulation(mock_mongo):
    updater = BayesianIncomeUpdater()
    
    # We will simulate the DB locally for the test since we need state across 10 calls
    db_state = {}
    
    def mock_find_one(query):
        return db_state.get(query["beneficiary_id"])
        
    def mock_insert_one(record):
        db_state[record["beneficiary_id"]] = record
        
    def mock_update_one(query, update_dict):
        bid = query["beneficiary_id"]
        if bid in db_state:
            # Apply $set
            for k, v in update_dict["$set"].items():
                db_state[bid][k] = v
            # Mocking $push would go here if we needed to check history array size
            
    mock_mongo.find_one.side_effect = mock_find_one
    mock_mongo.insert_one.side_effect = mock_insert_one
    mock_mongo.update_one.side_effect = mock_update_one
    
    bid = "B_CONVERGE"
    
    # We simulate a HIG (Band 5) user who uses high electricity and high recharges
    signals = [
        ("ELECTRICITY", 700),      # Likelihood strongly favors band 5
        ("MOBILE_RECHARGE", 1200), # Likelihood strongly favors band 5
        ("ELECTRICITY", 800),
        ("MOBILE_RECHARGE", 900),
        ("LOAN_REPAYMENT", True),  # Slight pull towards 1 & 2
        ("ELECTRICITY", 650),
        ("MOBILE_RECHARGE", 1100),
        ("ELECTRICITY", 750),
        ("MOBILE_RECHARGE", 950),
        ("ELECTRICITY", 800)
    ]
    
    for s_type, s_val in signals:
        result = updater.update(bid, s_type, s_val)
        
    # After 10 signals dominating in band 5, the posterior should converge towards band 5
    final_probs = db_state[bid]["probabilities"]
    predicted_band = int(np.argmax(final_probs)) + 1
    
    # Verify convergence towards the true label
    assert predicted_band == 5
    assert final_probs[4] > 0.5 # Probability of band 5 should be dominant

def test_strong_prior_replacement(mock_mongo):
    updater = BayesianIncomeUpdater()
    db_state = {}
    mock_mongo.find_one.side_effect = lambda q: db_state.get(q["beneficiary_id"])
    mock_mongo.insert_one.side_effect = lambda r: db_state.update({r["beneficiary_id"]: r})
    mock_mongo.update_one.side_effect = lambda q, u: db_state[q["beneficiary_id"]].update(u["$set"])

    bid = "B_SURVEY"
    
    # User looks poor based on electricity
    updater.update(bid, "ELECTRICITY", 30) # band 1 dominant
    
    # Govt survey hits showing they are actually middle income (Band 3)
    survey_probs = [0.05, 0.1, 0.7, 0.1, 0.05]
    updater.update(bid, "GOVT_SURVEY", survey_probs)
    
    # The strong prior replacement should make band 3 the dominant one instantly
    predicted_band = int(np.argmax(db_state[bid]["probabilities"])) + 1
    assert predicted_band == 3
