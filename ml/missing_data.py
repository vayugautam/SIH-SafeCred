from dataclasses import dataclass, field
from typing import Dict, List, Any

@dataclass
class BeneficiaryMeta:
    district_code: str
    state_code: str
    caste_category: str
    loan_count: int

@dataclass
class ImputedFeatureVector:
    features: Dict[str, Any]
    imputation_metadata: Dict[str, Dict[str, Any]]
    completeness_score: float
    requires_ccs_cap: bool
    policy_flags: Dict[str, bool] = field(default_factory=dict)

class MissingDataHandler:
    # Features where higher is "wealthier". We must not impute a wealthy proxy 
    # for someone who is missing data.
    INCOME_PROXIES = {
        'avg_monthly_recharge_amount',
        'avg_monthly_electricity_units',
        'utility_diversity_score',
        'electricity_spend_trend',
        'high_value_recharge_flag'
    }

    # Used for weighted completeness score. Core financial traits are heavily weighted.
    FEATURE_WEIGHTS = {
        'avg_days_past_due': 1.5,
        'emi_hit_rate': 1.5,
        'delinquency_trend': 1.2,
        'avg_monthly_electricity_units': 1.0,
        'avg_monthly_recharge_amount': 1.0,
        'utility_diversity_score': 0.8,
        'repeat_borrower_flag': 0.5
    }
    DEFAULT_WEIGHT = 1.0

    def __init__(self, district_stats: dict, state_stats: dict, national_stats: dict):
        self.district_stats = district_stats
        self.state_stats = state_stats
        self.national_stats = national_stats

    def compute_completeness_score(self, original_fv: dict) -> float:
        """Computes a weighted ratio of present features to total expected features."""
        if not original_fv:
            return 0.0
            
        total_weight = 0.0
        present_weight = 0.0
        
        for feat, val in original_fv.items():
            weight = self.FEATURE_WEIGHTS.get(feat, self.DEFAULT_WEIGHT)
            total_weight += weight
            # We consider None or NaN as missing
            if val is not None and not (isinstance(val, float) and val != val):
                present_weight += weight
                
        if total_weight == 0.0:
            return 0.0
            
        return present_weight / total_weight

    def flag_low_confidence_features(self, original_fv: dict) -> List[str]:
        """Returns a list of features that are entirely missing in the original vector."""
        low_conf = []
        for feat, val in original_fv.items():
             if val is None or (isinstance(val, float) and val != val):
                 low_conf.append(feat)
        return low_conf

    def impute(self, fv: dict, meta: BeneficiaryMeta) -> ImputedFeatureVector:
        """Executes the tiered fallback imputation chain."""
        features = fv.copy()
        imputation_metadata = {}
        
        completeness_score = self.compute_completeness_score(fv)
        
        for feat, val in features.items():
            if val is None or (isinstance(val, float) and val != val):
                # Needs imputation
                imputed_val = None
                tier_used = None
                
                # 1. Try District
                if meta.district_code in self.district_stats and feat in self.district_stats[meta.district_code]:
                    imputed_val = self.district_stats[meta.district_code][feat]
                    tier_used = "district"
                # 2. Try State
                elif meta.state_code in self.state_stats and feat in self.state_stats[meta.state_code]:
                    imputed_val = self.state_stats[meta.state_code][feat]
                    tier_used = "state"
                # 3. Try National
                elif feat in self.national_stats:
                    imputed_val = self.national_stats[feat]
                    tier_used = "national"
                else:
                    # Absolute fallback to 0.0 to prevent pipeline crashes
                    imputed_val = 0.0
                    tier_used = "absolute_fallback"

                # Apply Safety Rule: Never impute upward for income proxies
                if feat in self.INCOME_PROXIES:
                    # If the imputed demographic average is higher than national median, pull it down.
                    # Assume national_stats[feat] contains the median as a baseline.
                    national_val = self.national_stats.get(feat, 0.0)
                    if isinstance(imputed_val, (int, float)) and imputed_val > national_val:
                        imputed_val = national_val
                        tier_used += "_capped_conservative"

                features[feat] = imputed_val
                imputation_metadata[feat] = {
                    "tier_used": tier_used,
                    "source": f"{tier_used}_stats",
                    "imputed_value": imputed_val
                }

        # Determine Policy Flags
        requires_ccs_cap = False
        ccs_cap_reason = None
        
        if completeness_score < 0.3:
            requires_ccs_cap = True
            ccs_cap_reason = "LOW_FEATURE_COMPLETENESS"
            imputation_metadata["ccs_cap_reason"] = ccs_cap_reason

        policy_flags = {
            "requires_ccs_cap": requires_ccs_cap,
            "requires_manual_review": completeness_score < 0.1,
            "requires_income_verification": requires_ccs_cap
        }

        return ImputedFeatureVector(
            features=features,
            imputation_metadata=imputation_metadata,
            completeness_score=completeness_score,
            requires_ccs_cap=requires_ccs_cap,
            policy_flags=policy_flags
        )
