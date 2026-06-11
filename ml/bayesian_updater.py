import numpy as np
from datetime import datetime
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

@dataclass
class DemographicPrior:
    income_bucket_ratios: List[float]
    
    def __post_init__(self):
        if len(self.income_bucket_ratios) != 5:
            raise ValueError("Must provide exactly 5 bucket ratios.")
        if any(r < 0 for r in self.income_bucket_ratios):
            raise ValueError("Ratios cannot be negative.")
            
        total = sum(self.income_bucket_ratios)
        if total == 0:
            raise ValueError("Sum of ratios cannot be zero.")
            
        # Normalize
        self.income_bucket_ratios = [r / total for r in self.income_bucket_ratios]

@dataclass
class DemographicRegistry:
    district_priors: Dict[str, DemographicPrior] = field(default_factory=dict)
    state_priors: Dict[str, DemographicPrior] = field(default_factory=dict)
    national_prior: Optional[DemographicPrior] = None

class BayesianIncomeUpdater:
    def __init__(self, mongo_collection, registry: DemographicRegistry, concentration_factor: float = 10.0):
        self.collection = mongo_collection
        self.registry = registry
        self.concentration_factor = concentration_factor
        
        # Hardcoded static mappings for likelihood updates
        self.electricity_mapping = {
            'LOW': [0.4, 0.4, 0.2, 0.0, 0.0],
            'MEDIUM': [0.0, 0.2, 0.5, 0.2, 0.1],
            'HIGH': [0.0, 0.0, 0.1, 0.4, 0.5]
        }
        
        self.recharge_mapping = {
            'LOW': [0.5, 0.3, 0.2, 0.0, 0.0],
            'MEDIUM': [0.1, 0.2, 0.4, 0.2, 0.1],
            'HIGH': [0.0, 0.0, 0.2, 0.4, 0.4]
        }

    def _get_initial_alphas(self, district: str = None, state: str = None) -> List[float]:
        """Resolves fallback chain: District -> State -> National -> Uniform"""
        prior = None
        if district and district in self.registry.district_priors:
            prior = self.registry.district_priors[district]
        elif state and state in self.registry.state_priors:
            prior = self.registry.state_priors[state]
        elif self.registry.national_prior:
            prior = self.registry.national_prior
            
        if prior:
            return [self.concentration_factor * r for r in prior.income_bucket_ratios]
            
        # Uniform fallback
        return [1.0, 1.0, 1.0, 1.0, 1.0]

    def _fetch_or_create_document(self, beneficiary_id: str, district: str = None, state: str = None) -> Dict[str, Any]:
        """Gets current state or creates new flat prior."""
        doc = self.collection.find_one({"beneficiary_id": beneficiary_id})
        if doc:
            return doc
            
        alphas = self._get_initial_alphas(district, state)
        
        doc = {
            "beneficiary_id": beneficiary_id,
            "alphas": alphas,
            "district": district,
            "state": state,
            "signal_history": []
        }
        # Insert atomic
        self.collection.insert_one(doc)
        return doc

    def _calculate_likelihood(self, signal_type: str, signal_value: Any) -> List[float]:
        """Converts incoming signals into Dirichlet pseudo-counts."""
        if signal_type == 'ELECTRICITY':
            # expects 'LOW', 'MEDIUM', 'HIGH'
            return self.electricity_mapping.get(signal_value, [0.0]*5)
            
        elif signal_type == 'MOBILE_RECHARGE':
             # expects 'LOW', 'MEDIUM', 'HIGH'
            return self.recharge_mapping.get(signal_value, [0.0]*5)
            
        elif signal_type == 'LOAN_REPAYMENT':
            if signal_value == 'ON_TIME':
                # Slight bump to bands 1 and 2
                return [0.5, 0.5, 0.0, 0.0, 0.0]
            elif signal_value == 'DEFAULT':
                return [0.0, 0.0, 0.0, 0.0, 0.0]
                
        elif signal_type == 'GOVT_SURVEY':
            # e.g., value is an integer index 1-5 representing strong verified match
            # Apply massive weight to override prior
            idx = int(signal_value) - 1
            bump = [0.0] * 5
            if 0 <= idx < 5:
                bump[idx] = 5.0
            return bump
            
        return [0.0]*5

    def update(self, beneficiary_id: str, signal_type: str, signal_value: Any, district: str = None, state: str = None) -> Dict[str, Any]:
        """Performs Bayesian Dirichlet conjugate addition and stores in MongoDB."""
        doc = self._fetch_or_create_document(beneficiary_id, district, state)
        current_alphas = doc["alphas"]
        
        likelihood = self._calculate_likelihood(signal_type, signal_value)
        
        # Conjugate update: add pseudo-counts
        new_alphas = [a + b for a, b in zip(current_alphas, likelihood)]
        
        signal_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "signal_type": signal_type,
            "signal_value": signal_value,
            "posterior_alphas": new_alphas
        }
        
        # Atomic MongoDB Update
        self.collection.update_one(
            {"beneficiary_id": beneficiary_id},
            {
                "$set": {"alphas": new_alphas},
                "$push": {
                    "signal_history": {
                        "$each": [signal_entry],
                        "$slice": -50  # Keep only last 50
                    }
                }
            }
        )
        
        return self.get_current_estimate(beneficiary_id)

    def get_current_estimate(self, beneficiary_id: str) -> Optional[Dict[str, Any]]:
        """Returns normalized probability distribution."""
        doc = self.collection.find_one({"beneficiary_id": beneficiary_id})
        if not doc:
            return None
            
        alphas = doc["alphas"]
        total = sum(alphas)
        probs = [a / total for a in alphas]
        
        predicted_band = int(np.argmax(probs) + 1)
        
        return {
            "beneficiary_id": beneficiary_id,
            "predicted_band": predicted_band,
            "probabilities": probs,
            "alphas": alphas
        }

    def get_estimate_history(self, beneficiary_id: str) -> List[Dict[str, Any]]:
        """Returns up to 50 historical steps."""
        doc = self.collection.find_one({"beneficiary_id": beneficiary_id})
        if not doc:
            return []
        return doc.get("signal_history", [])

    def reset_to_prior(self, beneficiary_id: str):
        """Wipes history and resets to initial demographic prior."""
        doc = self.collection.find_one({"beneficiary_id": beneficiary_id})
        if not doc:
            return
            
        district = doc.get("district")
        state = doc.get("state")
        
        initial_alphas = self._get_initial_alphas(district, state)
        
        self.collection.update_one(
            {"beneficiary_id": beneficiary_id},
            {
                "$set": {
                    "alphas": initial_alphas,
                    "signal_history": []
                }
            }
        )
