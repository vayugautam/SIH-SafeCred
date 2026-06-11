from typing import Dict, Any, List
from dataclasses import dataclass, field
import numpy as np

@dataclass
class BeneficiaryMeta:
    district_code: str
    state_code: str
    caste_category: str
    loan_count: int

@dataclass
class ImputedFeatureVector:
    features: Dict[str, float]
    imputation_metadata: Dict[str, Dict[str, Any]]
    completeness_score: float
    low_confidence_flags: List[str]
    ccs_cap: float

class MissingDataHandler:
    def __init__(self, district_stats: dict, state_stats: dict, national_stats: dict):
        self.district_stats = district_stats
        self.state_stats = state_stats
        self.national_stats = national_stats

        # Approximate feature importance for weighting completeness score
        self.importance_weights = {
            "emi_hit_rate": 0.15,
            "avg_days_past_due": 0.10,
            "avg_monthly_electricity_units": 0.10,
            "avg_monthly_recharge_amount": 0.10,
            "delinquency_trend": 0.08,
            "prepayment_ratio": 0.05,
            "utility_diversity_score": 0.05
        }
        
        # Explicit income proxy features
        self.income_proxy_features = {
            "avg_monthly_electricity_units",
            "avg_monthly_recharge_amount",
            "utility_diversity_score",
            "consumption_growth_rate",
            "estimated_consumption_percentile"
        }

    def compute_completeness_score(self, fv: dict) -> float:
        """Computes 0.0-1.0 score weighted by feature importance."""
        score = 0.0
        # If dict is empty, total weight shouldn't divide by zero
        total_weight = sum(self.importance_weights.get(k, 0.02) for k in (fv.keys() if fv else self.importance_weights.keys()))
        if total_weight == 0: 
            return 0.0
        
        for k, v in fv.items():
            if v is not None and not np.isnan(v):
                score += self.importance_weights.get(k, 0.02)
                
        return float(min(1.0, score / total_weight))

    def flag_low_confidence_features(self, fv: dict) -> List[str]:
        """Flags features that are entirely missing before imputation."""
        return [k for k, v in fv.items() if v is None or np.isnan(v)]

    def _get_tiered_stat(self, feature: str, meta: BeneficiaryMeta, is_income_proxy: bool) -> tuple:
        """Applies tiered fallback: District -> State -> National"""
        tier = 3
        source = "national"
        val = self.national_stats.get("INDIA", {}).get(feature, 0.0)

        # Tier 1: District
        d_val = self.district_stats.get(meta.district_code, {}).get(feature)
        if d_val is not None:
            tier, source, val = 1, f"district_{meta.district_code}", d_val
        else:
            # Tier 2: State
            s_val = self.state_stats.get(meta.state_code, {}).get(feature)
            if s_val is not None:
                tier, source, val = 2, f"state_{meta.state_code}", s_val

        # Safety rule: Never impute upward for income-proxy features.
        # We apply a conservative 0.5x multiplier to the median to ensure we take a lower estimate.
        if is_income_proxy:
            val = val * 0.5

        return tier, source, val

    def impute(self, fv: dict, meta: BeneficiaryMeta) -> ImputedFeatureVector:
        if not fv:
            # Reconstruct empty dict based on known important features for baseline
            fv = {k: None for k in self.importance_weights.keys()}
            
        completeness = self.compute_completeness_score(fv)
        low_conf = self.flag_low_confidence_features(fv)
        
        imputed_fv = {}
        metadata = {}
        
        for feature, val in fv.items():
            if val is None or np.isnan(val):
                is_proxy = feature in self.income_proxy_features
                tier, source, imp_val = self._get_tiered_stat(feature, meta, is_proxy)
                imputed_fv[feature] = imp_val
                metadata[feature] = {
                    "tier_used": tier,
                    "source": source,
                    "imputed_value": imp_val
                }
            else:
                imputed_fv[feature] = float(val)
                
        # Safety rule: If completeness < 0.3, cap Composite Credit Score (CCS) to 600 max
        ccs_cap = 600.0 if completeness < 0.3 else 1000.0
        
        return ImputedFeatureVector(
            features=imputed_fv,
            imputation_metadata=metadata,
            completeness_score=completeness,
            low_confidence_flags=low_conf,
            ccs_cap=ccs_cap
        )
