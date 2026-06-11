import numpy as np
from datetime import datetime
from pymongo import MongoClient
from typing import Any, List, Dict, Union

class BayesianIncomeUpdater:
    def __init__(self, mongo_uri: str = "mongodb://localhost:27017/", db_name: str = "safecred"):
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self.collection = self.db["income_posteriors"]

    def _get_electricity_likelihood(self, kwh: float) -> np.ndarray:
        """Mapping from monthly kWh to income band probabilities."""
        if kwh < 50: return np.array([0.6, 0.2, 0.1, 0.05, 0.05])
        if kwh < 150: return np.array([0.2, 0.5, 0.2, 0.05, 0.05])
        if kwh < 300: return np.array([0.05, 0.2, 0.5, 0.2, 0.05])
        if kwh < 600: return np.array([0.05, 0.05, 0.2, 0.5, 0.2])
        return np.array([0.05, 0.05, 0.05, 0.2, 0.65])

    def _get_recharge_likelihood(self, amount: float) -> np.ndarray:
        """Mapping from recharge amount to income band probabilities."""
        if amount < 150: return np.array([0.5, 0.3, 0.1, 0.05, 0.05])
        if amount < 300: return np.array([0.2, 0.4, 0.3, 0.05, 0.05])
        if amount < 600: return np.array([0.05, 0.2, 0.5, 0.2, 0.05])
        if amount < 1000: return np.array([0.05, 0.05, 0.2, 0.5, 0.2])
        return np.array([0.05, 0.05, 0.05, 0.2, 0.65])

    def _init_beneficiary(self, beneficiary_id: str, district_nss_distribution: List[float] = None) -> Dict:
        """Initialises Dirichlet prior. If no district dist provided, use uniform."""
        if district_nss_distribution is None:
            # Uniform prior pseudo-counts (alpha=2 to avoid 0s)
            alphas = [2.0, 2.0, 2.0, 2.0, 2.0]
        else:
            # Scale distribution to alpha pseudo-counts
            alphas = [max(1.0, float(p) * 10) for p in district_nss_distribution]
            
        record = {
            "beneficiary_id": beneficiary_id,
            "alphas": alphas,
            "probabilities": (np.array(alphas) / sum(alphas)).tolist(),
            "signal_history": [],
            "estimate_history": [],
            "updated_at": datetime.utcnow()
        }
        self.collection.insert_one(record)
        return record

    def update(self, beneficiary_id: str, signal_type: str, signal_value: Any) -> Dict[str, Any]:
        record = self.collection.find_one({"beneficiary_id": beneficiary_id})
        if not record:
            record = self._init_beneficiary(beneficiary_id)

        alphas = np.array(record["alphas"])
        weight = 1.0

        if signal_type == "ELECTRICITY":
            L = self._get_electricity_likelihood(float(signal_value))
        elif signal_type == "MOBILE_RECHARGE":
            L = self._get_recharge_likelihood(float(signal_value))
        elif signal_type == "LOAN_REPAYMENT":
            # signal_value is boolean: True = repaid on time
            if signal_value:
                # Slight positive update on band 1&2
                L = np.array([0.4, 0.3, 0.15, 0.1, 0.05])
            else:
                L = np.array([0.1, 0.1, 0.2, 0.3, 0.3])
            weight = 0.5  # Slight update
        elif signal_type == "GOVT_SURVEY":
            # signal_value is the actual distribution [p1, p2, p3, p4, p5]
            L = np.array(signal_value)
            weight = 5.0  # Strong signal
            alphas = np.array([1.0, 1.0, 1.0, 1.0, 1.0])  # Strong prior replacement
        else:
            raise ValueError(f"Unknown signal type: {signal_type}")

        # Dirichlet update: posterior alphas = prior alphas + observed counts
        # We treat L * weight as the observed pseudo-counts
        new_alphas = alphas + (L * weight)
        new_probs = new_alphas / np.sum(new_alphas)

        # Build signal entry
        signal_entry = {
            "signal_type": signal_type,
            "signal_value": signal_value,
            "timestamp": datetime.utcnow()
        }
        
        # Estimate entry for history
        estimate_entry = {
            "predicted_band": int(np.argmax(new_probs)) + 1,
            "probabilities": new_probs.tolist(),
            "timestamp": datetime.utcnow()
        }

        # Update in MongoDB (Append and keep last 50)
        self.collection.update_one(
            {"beneficiary_id": beneficiary_id},
            {
                "$set": {
                    "alphas": new_alphas.tolist(),
                    "probabilities": new_probs.tolist(),
                    "updated_at": datetime.utcnow()
                },
                "$push": {
                    "signal_history": {
                        "$each": [signal_entry],
                        "$slice": -50
                    },
                    "estimate_history": {
                        "$each": [estimate_entry],
                        "$slice": -50
                    }
                }
            }
        )

        return {
            "beneficiary_id": beneficiary_id,
            "predicted_band": int(np.argmax(new_probs)) + 1,
            "probabilities": new_probs.tolist()
        }

    def get_current_estimate(self, beneficiary_id: str) -> Union[Dict[str, Any], None]:
        record = self.collection.find_one({"beneficiary_id": beneficiary_id})
        if not record:
            return None
        return {
            "beneficiary_id": beneficiary_id,
            "predicted_band": int(np.argmax(record["probabilities"])) + 1,
            "probabilities": record["probabilities"],
            "last_updated": record["updated_at"]
        }

    def get_estimate_history(self, beneficiary_id: str) -> List[Dict[str, Any]]:
        record = self.collection.find_one({"beneficiary_id": beneficiary_id})
        if not record:
            return []
        return record.get("estimate_history", [])

    def reset_to_prior(self, beneficiary_id: str, district_nss_distribution: List[float] = None):
        self.collection.delete_one({"beneficiary_id": beneficiary_id})
        self._init_beneficiary(beneficiary_id, district_nss_distribution)
