from dataclasses import dataclass
from datetime import datetime

@dataclass
class CompositeScore:
    ccs: int
    band: str
    repayment_score: int
    income_score: int
    sei: int
    confidence_level: str
    eligible_for_digital_lending: bool
    scored_at: datetime
    model_version: str

class CompositeScoreAggregator:
    def __init__(self, model_version: str = "1.0.0"):
        self.model_version = model_version

    def _get_confidence(self, completeness: float) -> str:
        """Determines categorical confidence level from completeness percentage."""
        if completeness >= 0.8: return "HIGH"
        if completeness >= 0.6: return "MEDIUM"
        if completeness >= 0.3: return "LOW"
        return "VERY_LOW"

    def aggregate(self, repayment_score: int, income_category_score: int, 
                  socioeconomic_index: int, completeness_score: float, 
                  income_band: int, max_days_past_due: int) -> CompositeScore:
                  
        # Enforce strict boundary bounds to prevent overflow errors
        repayment_score = max(0, min(1000, int(repayment_score)))
        income_category_score = max(0, min(1000, int(income_category_score)))
        socioeconomic_index = max(0, min(1000, int(socioeconomic_index)))
        completeness_score = max(0.0, min(1.0, float(completeness_score)))
        income_band = max(1, min(5, int(income_band)))
        
        # Step 1 - Raw CCS fusion logic
        ccs_raw = (0.55 * repayment_score) + (0.35 * income_category_score) + (0.10 * socioeconomic_index)
        
        # Step 2 - Completeness penalty
        if completeness_score < 0.5:
            # Scaled penalty: e.g. at 0.0 completeness, multiply by 0.8. At 0.49 completeness, multiply by ~0.996
            ccs_float = ccs_raw * (0.8 + 0.4 * completeness_score)
        else:
            ccs_float = ccs_raw
            
        ccs = int(round(max(0, min(1000, ccs_float))))
        
        # Step 3 - Band assignment cascade logic
        if ccs < 300 or income_band == 5:
            band = "E"
        elif ccs >= 750 and income_band in [1, 2] and max_days_past_due < 30:
            band = "A"
        elif ccs >= 600 and income_band in [1, 2, 3]:
            band = "B"
        elif ccs >= 450 and income_band in [1, 2]:
            band = "C"
        else:
            # Fallback for ccs >= 300 that don't meet strict targeting rules 
            # (e.g. MIG-II users seeking loans, or high DPD users)
            band = "D"
            
        # Step 4 - Digital lending eligibility
        eligible = (band == 'A') and (completeness_score > 0.6) and (max_days_past_due < 30)
        
        return CompositeScore(
            ccs=ccs,
            band=band,
            repayment_score=repayment_score,
            income_score=income_category_score,
            sei=socioeconomic_index,
            confidence_level=self._get_confidence(completeness_score),
            eligible_for_digital_lending=eligible,
            scored_at=datetime.utcnow(),
            model_version=self.model_version
        )
