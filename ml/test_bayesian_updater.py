import pytest
import numpy as np
from unittest.mock import MagicMock
from ml.bayesian_updater import DemographicRegistry, DemographicPrior, BayesianIncomeUpdater

@pytest.fixture
def mock_mongo():
    # A simple mock simulating a MongoDB collection dictionary store
    class MockCollection:
        def __init__(self):
            self.store = {}
            
        def find_one(self, query):
            return self.store.get(query["beneficiary_id"])
            
        def insert_one(self, doc):
            self.store[doc["beneficiary_id"]] = doc
            
        def update_one(self, query, update):
            doc = self.store.get(query["beneficiary_id"])
            if "$set" in update:
                doc.update(update["$set"])
            if "$push" in update:
                push_op = update["$push"]
                for key, val in push_op.items():
                    if "$each" in val:
                        doc[key].extend(val["$each"])
                        if "$slice" in val:
                            doc[key] = doc[key][val["$slice"]:]
                            
    return MockCollection()

@pytest.fixture
def registry():
    district_priors = {
        "Aligarh": DemographicPrior([0.32, 0.28, 0.20, 0.14, 0.06]),
        "Lucknow": DemographicPrior([0.18, 0.24, 0.27, 0.20, 0.11])
    }
    return DemographicRegistry(district_priors=district_priors)

def test_demographic_prior_initialization(registry, mock_mongo):
    updater = BayesianIncomeUpdater(mock_mongo, registry, concentration_factor=100)
    
    # Initialize a user from Aligarh
    updater.update("USER1", "UNKNOWN", "UNKNOWN", district="Aligarh")
    
    doc = mock_mongo.find_one({"beneficiary_id": "USER1"})
    
    # Alphas should be 100 * [0.32, 0.28, 0.20, 0.14, 0.06]
    # Except our UNKNOWN signal added [0,0,0,0,0], so it equals the initial
    np.testing.assert_array_almost_equal(doc["alphas"], [32.0, 28.0, 20.0, 14.0, 6.0])

def test_fallback_chain_uniform(registry, mock_mongo):
    updater = BayesianIncomeUpdater(mock_mongo, registry, concentration_factor=100)
    
    # Initialize a user from an unknown district
    updater.update("USER2", "UNKNOWN", "UNKNOWN", district="UnknownPlace")
    
    doc = mock_mongo.find_one({"beneficiary_id": "USER2"})
    # Should use flat uniform fallback [1.0, 1.0, 1.0, 1.0, 1.0]
    np.testing.assert_array_almost_equal(doc["alphas"], [1.0, 1.0, 1.0, 1.0, 1.0])

def test_bayesian_convergence(registry, mock_mongo):
    updater = BayesianIncomeUpdater(mock_mongo, registry, concentration_factor=10)
    
    # Start with Aligarh (Strong bias toward Band 1 and 2)
    b_id = "USER_CONVERGE"
    
    initial = updater.update(b_id, "UNKNOWN", "UNKNOWN", district="Aligarh")
    # Band 1 probability should be initially highest due to [0.32, 0.28, ...]
    assert initial["predicted_band"] == 1
    
    # Simulate 10 sequential 'HIGH' electricity signals indicating High Income (Bands 4 and 5)
    # The electricity_mapping for HIGH is [0.0, 0.0, 0.1, 0.4, 0.5]
    for _ in range(10):
        res = updater.update(b_id, "ELECTRICITY", "HIGH", district="Aligarh")
        
    # The posterior should now be completely overwhelmed by the 10 evidence signals
    # Band 5 should emerge as the highest probability.
    assert res["predicted_band"] == 5
    
    # Verify history is truncated (1 UNKNOWN + 10 HIGH = 11 entries < 50)
    history = updater.get_estimate_history(b_id)
    assert len(history) == 11
