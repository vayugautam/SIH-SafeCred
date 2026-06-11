import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass

@dataclass
class DistrictMedians:
    median_electricity_kwh: float = 0.0
    median_electricity_regularity: float = 0.0
    median_electricity_spend_trend: float = 0.0
    median_recharge_amount: float = 0.0
    median_recharge_frequency: float = 0.0
    median_utility_diversity: float = 0.0
    median_lpg_frequency: float = 0.0
    estimated_consumption_percentile: float = 50.0
    median_consumption_growth_rate: float = 0.0

FEATURE_METADATA = {
    "avg_monthly_electricity_units": {
        "expected_range": "0 - 5000 kWh",
        "min_records_needed": 3,
        "imputation_fallback": "DistrictMedians.median_electricity_kwh"
    },
    "electricity_payment_regularity": {
        "expected_range": "0 - 100 %",
        "min_records_needed": 3,
        "imputation_fallback": "DistrictMedians.median_electricity_regularity"
    },
    "electricity_spend_trend": {
        "expected_range": "-1000 to +1000 (INR/month)",
        "min_records_needed": 3,
        "imputation_fallback": "DistrictMedians.median_electricity_spend_trend"
    },
    "avg_monthly_recharge_amount": {
        "expected_range": "0 - 5000 INR",
        "min_records_needed": 3,
        "imputation_fallback": "DistrictMedians.median_recharge_amount"
    },
    "recharge_frequency_score": {
        "expected_range": "0 - 100",
        "min_records_needed": 3,
        "imputation_fallback": "DistrictMedians.median_recharge_frequency"
    },
    "high_value_recharge_flag": {
        "expected_range": "0 or 1",
        "min_records_needed": 1,
        "imputation_fallback": "Defaults to 0"
    },
    "utility_diversity_score": {
        "expected_range": "0 - 10",
        "min_records_needed": 1,
        "imputation_fallback": "DistrictMedians.median_utility_diversity"
    },
    "water_bill_payment_flag": {
        "expected_range": "0 or 1",
        "min_records_needed": 1,
        "imputation_fallback": "Defaults to 0"
    },
    "lpg_refill_frequency": {
        "expected_range": "0 - 24 refills/year",
        "min_records_needed": 3,
        "imputation_fallback": "DistrictMedians.median_lpg_frequency"
    },
    "estimated_consumption_percentile": {
        "expected_range": "0.0 - 100.0",
        "min_records_needed": 1, # requires district medians calculation
        "imputation_fallback": "DistrictMedians.estimated_consumption_percentile"
    },
    "payment_mode_digital_flag": {
        "expected_range": "0 or 1",
        "min_records_needed": 1,
        "imputation_fallback": "Defaults to 0"
    },
    "consumption_growth_rate": {
        "expected_range": "-1.0 to 1.0 (Percentage)",
        "min_records_needed": 6,
        "imputation_fallback": "DistrictMedians.median_consumption_growth_rate"
    }
}

class IncomeProxyExtractor:
    def __init__(self, reference_date: datetime = None):
        self.reference_date = reference_date or datetime.utcnow()
        self.six_months_ago = self.reference_date - timedelta(days=180)

    def _parse_date(self, date_val) -> datetime:
        if pd.isna(date_val) or not date_val:
            return None
        if isinstance(date_val, datetime):
            return date_val
        if isinstance(date_val, str):
            try:
                return pd.to_datetime(date_val).to_pydatetime()
            except Exception:
                return None
        return None

    def compute_features(
        self, 
        utility_records: List[Dict[str, Any]], 
        telecom_records: List[Dict[str, Any]], 
        district_medians: Optional[DistrictMedians] = None
    ) -> Dict[str, float]:
        """
        Computes 12 consumption-based proxies for income.
        Applies < 3 records imputation rule via injected district_medians.
        """
        features = {}
        all_records = utility_records + telecom_records
        
        # Helper: Ensure date formats are proper and filter last 6 months
        recent_utils = []
        for r in utility_records:
            d = self._parse_date(r.get("billing_date"))
            if d and d >= self.six_months_ago:
                r["_parsed_date"] = d
                recent_utils.append(r)
                
        recent_telecoms = []
        for r in telecom_records:
            d = self._parse_date(r.get("billing_date"))
            if d and d >= self.six_months_ago:
                r["_parsed_date"] = d
                recent_telecoms.append(r)

        # 1. avg_monthly_electricity_units
        elec_records = [r for r in recent_utils if str(r.get("type")).lower() == "electricity"]
        if len(elec_records) < 3:
            if not district_medians: raise ValueError("district_medians required when fewer than 3 records are available")
            features["avg_monthly_electricity_units"] = district_medians.median_electricity_kwh
        else:
            units = [float(r.get("units_consumed_kwh", 0)) for r in elec_records if r.get("units_consumed_kwh")]
            features["avg_monthly_electricity_units"] = float(np.mean(units)) if units else 0.0

        # 2. electricity_payment_regularity
        if len(elec_records) < 3:
            if not district_medians: raise ValueError("district_medians required when fewer than 3 records are available")
            features["electricity_payment_regularity"] = district_medians.median_electricity_regularity
        else:
            paid_on_time = sum(1 for r in elec_records if str(r.get("payment_status")).upper() == "PAID")
            features["electricity_payment_regularity"] = (paid_on_time / len(elec_records)) * 100.0

        # 3. electricity_spend_trend
        if len(elec_records) < 3:
            if not district_medians: raise ValueError("district_medians required when fewer than 3 records are available")
            features["electricity_spend_trend"] = district_medians.median_electricity_spend_trend
        else:
            sorted_elec = sorted(elec_records, key=lambda x: x["_parsed_date"])
            amounts = [float(r.get("amount", 0)) for r in sorted_elec]
            x = np.arange(len(amounts))
            try:
                slope, _ = np.polyfit(x, amounts, 1)
                features["electricity_spend_trend"] = float(slope)
            except Exception:
                features["electricity_spend_trend"] = 0.0

        # 4. avg_monthly_recharge_amount
        if len(recent_telecoms) < 3:
            if not district_medians: raise ValueError("district_medians required when fewer than 3 records are available")
            features["avg_monthly_recharge_amount"] = district_medians.median_recharge_amount
        else:
            amts = [float(r.get("amount", 0)) for r in recent_telecoms]
            features["avg_monthly_recharge_amount"] = float(np.sum(amts) / 6.0) # divided by 6 months

        # 5. recharge_frequency_score
        if len(recent_telecoms) < 3:
            if not district_medians: raise ValueError("district_medians required when fewer than 3 records are available")
            features["recharge_frequency_score"] = district_medians.median_recharge_frequency
        else:
            freq_per_month = len(recent_telecoms) / 6.0
            # Normalize 0-100 (assuming 4 recharges/month is max score 100)
            score = min(100.0, (freq_per_month / 4.0) * 100.0)
            features["recharge_frequency_score"] = float(score)

        # 6. high_value_recharge_flag
        high_vals = [float(r.get("amount", 0)) for r in recent_telecoms if float(r.get("amount", 0)) > 500]
        features["high_value_recharge_flag"] = 1.0 if high_vals else 0.0

        # 7. utility_diversity_score
        types = set(str(r.get("type")).lower() for r in all_records if r.get("type"))
        features["utility_diversity_score"] = float(len(types))

        # 8. water_bill_payment_flag
        features["water_bill_payment_flag"] = 1.0 if "water" in types else 0.0

        # 9. lpg_refill_frequency
        lpg_records = [r for r in all_records if str(r.get("type")).lower() in ["lpg", "pahal"]]
        if len(lpg_records) < 3 and len(utility_records) >= 3: 
            # If they have general utility history but <3 LPG, they might just not use LPG often. No fallback needed.
            features["lpg_refill_frequency"] = float(len(lpg_records) * 2) # annualized from 6 months
        elif len(utility_records) < 3:
            if not district_medians: raise ValueError("district_medians required when fewer than 3 records are available")
            features["lpg_refill_frequency"] = district_medians.median_lpg_frequency
        else:
            features["lpg_refill_frequency"] = float(len(lpg_records) * 2)

        # 10. estimated_consumption_percentile
        # For simplicity in feature extractor, we rely on the injected dataclass for the percentile score directly.
        if not district_medians: raise ValueError("district_medians required when fewer than 3 records are available")
        features["estimated_consumption_percentile"] = district_medians.estimated_consumption_percentile

        # 11. payment_mode_digital_flag
        digital_methods = ["upi", "card", "netbanking", "digital"]
        is_digital = any(
            str(r.get("payment_method", "")).lower() in digital_methods 
            for r in all_records
        )
        features["payment_mode_digital_flag"] = 1.0 if is_digital else 0.0

        # 12. consumption_growth_rate
        # Calculate spend last 3 months vs previous 3 months
        parsed_all = []
        for r in all_records:
            d = self._parse_date(r.get("billing_date"))
            if d:
                parsed_all.append({"date": d, "amount": float(r.get("amount", 0))})
                
        if len(parsed_all) < 6:
            if not district_medians: raise ValueError("district_medians required when fewer than 3 records are available")
            features["consumption_growth_rate"] = district_medians.median_consumption_growth_rate
        else:
            three_months_ago = self.reference_date - timedelta(days=90)
            last_3_spend = sum(r["amount"] for r in parsed_all if r["date"] >= three_months_ago)
            prev_3_spend = sum(r["amount"] for r in parsed_all if self.six_months_ago <= r["date"] < three_months_ago)
            
            if prev_3_spend > 0:
                features["consumption_growth_rate"] = (last_3_spend - prev_3_spend) / prev_3_spend
            else:
                features["consumption_growth_rate"] = 0.0

        return features
