import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime
from dateutil.relativedelta import relativedelta

class IncomeProxyExtractor:
    FEATURE_METADATA = {
        "avg_monthly_electricity_units": {
            "expected_range": "0 - 1500 kWh",
            "min_records_needed": 3,
            "imputation_fallback": "district_median_electricity_units"
        },
        "electricity_payment_regularity": {
            "expected_range": "0.0 - 100.0",
            "min_records_needed": 3,
            "imputation_fallback": "district_median_payment_regularity"
        },
        "electricity_spend_trend": {
            "expected_range": "-1000 to +1000",
            "min_records_needed": 3,
            "imputation_fallback": "district_median_spend_trend"
        },
        "avg_monthly_recharge_amount": {
            "expected_range": "0 - 2000 INR",
            "min_records_needed": 3,
            "imputation_fallback": "district_median_recharge_amount"
        },
        "recharge_frequency_score": {
            "expected_range": "0.0 - 100.0",
            "min_records_needed": 3,
            "imputation_fallback": "district_median_recharge_frequency"
        },
        "high_value_recharge_flag": {
            "expected_range": "0 or 1",
            "min_records_needed": 1,
            "imputation_fallback": "0"  # Categorical, assumes 0 if no records
        },
        "utility_diversity_score": {
            "expected_range": "0 - 10",
            "min_records_needed": 1,
            "imputation_fallback": "0"
        },
        "water_bill_payment_flag": {
            "expected_range": "0 or 1",
            "min_records_needed": 1,
            "imputation_fallback": "0"
        },
        "lpg_refill_frequency": {
            "expected_range": "0 - 12",
            "min_records_needed": 3,
            "imputation_fallback": "district_median_lpg_frequency"
        },
        "estimated_consumption_percentile": {
            "expected_range": "0.0 - 100.0",
            "min_records_needed": 3,
            "imputation_fallback": "50.0" # Default 50th percentile
        },
        "payment_mode_digital_flag": {
            "expected_range": "0 or 1",
            "min_records_needed": 1,
            "imputation_fallback": "0"
        },
        "consumption_growth_rate": {
            "expected_range": "-1.0 to 1.0 (-100% to 100%)",
            "min_records_needed": 6,  # 3 months + 3 months
            "imputation_fallback": "district_median_growth_rate"
        }
    }

    @staticmethod
    def _apply_fallback(feature_name: str, computed_value: Optional[float], 
                        data_points: int, district_data: Dict[str, float]) -> float:
        meta = IncomeProxyExtractor.FEATURE_METADATA[feature_name]
        if data_points < meta["min_records_needed"] or computed_value is None:
            fallback_key = meta["imputation_fallback"]
            # Try to get from district data, else if it's a numeric literal string like "0" or "50.0", use it
            try:
                return float(fallback_key)
            except ValueError:
                return district_data.get(fallback_key, 0.0)
        return float(computed_value)

    @staticmethod
    def extract_features(consumption_records: List[Dict[str, Any]], 
                         district_data: Dict[str, float]) -> Dict[str, float]:
        features = {}
        now = datetime.now()
        six_months_ago = now - relativedelta(months=6)

        # Filter active types
        elec_records = [r for r in consumption_records if r.get("type") == "electricity" and r.get("date")]
        elec_records.sort(key=lambda x: x["date"])
        
        recharge_records = [r for r in consumption_records if r.get("type") == "mobile_recharge" and r.get("date")]
        recharge_records.sort(key=lambda x: x["date"])

        lpg_records = [r for r in consumption_records if r.get("type") == "lpg" and r.get("date")]

        # 1. avg_monthly_electricity_units (6 month rolling)
        elec_6m = [r for r in elec_records if r["date"] >= six_months_ago and r.get("units_consumed_kwh") is not None]
        val1 = np.mean([r["units_consumed_kwh"] for r in elec_6m]) if elec_6m else None
        features["avg_monthly_electricity_units"] = IncomeProxyExtractor._apply_fallback("avg_monthly_electricity_units", val1, len(elec_6m), district_data)

        # 2. electricity_payment_regularity
        on_time = [r for r in elec_records if r.get("payment_status", "").lower() in ["paid", "on-time", "success"]]
        val2 = (len(on_time) / len(elec_records) * 100) if elec_records else None
        features["electricity_payment_regularity"] = IncomeProxyExtractor._apply_fallback("electricity_payment_regularity", val2, len(elec_records), district_data)

        # 3. electricity_spend_trend
        if len(elec_records) >= 3:
            y = [r.get("amount", 0) for r in elec_records]
            x = list(range(len(y)))
            slope, _ = np.polyfit(x, y, 1)
            val3 = slope
        else:
            val3 = None
        features["electricity_spend_trend"] = IncomeProxyExtractor._apply_fallback("electricity_spend_trend", val3, len(elec_records), district_data)

        # 4. avg_monthly_recharge_amount
        # Compute total amount over unique months
        if recharge_records:
            months = len(set(f"{r['date'].year}-{r['date'].month}" for r in recharge_records))
            total = sum(r.get("amount", 0) for r in recharge_records)
            val4 = total / months if months > 0 else 0
        else:
            val4 = None
        features["avg_monthly_recharge_amount"] = IncomeProxyExtractor._apply_fallback("avg_monthly_recharge_amount", val4, len(recharge_records), district_data)

        # 5. recharge_frequency_score
        if recharge_records:
            months = len(set(f"{r['date'].year}-{r['date'].month}" for r in recharge_records))
            freq = len(recharge_records) / months if months > 0 else 0
            val5 = min(100.0, freq * 20.0) # Assume 5 recharges/mo = 100 score
        else:
            val5 = None
        features["recharge_frequency_score"] = IncomeProxyExtractor._apply_fallback("recharge_frequency_score", val5, len(recharge_records), district_data)

        # 6. high_value_recharge_flag
        recharge_6m = [r for r in recharge_records if r["date"] >= six_months_ago]
        val6 = 1.0 if any(r.get("amount", 0) > 500 for r in recharge_6m) else 0.0
        features["high_value_recharge_flag"] = IncomeProxyExtractor._apply_fallback("high_value_recharge_flag", val6, len(recharge_6m), district_data)

        # 7. utility_diversity_score
        distinct_types = len(set(r.get("type") for r in consumption_records if r.get("type")))
        features["utility_diversity_score"] = IncomeProxyExtractor._apply_fallback("utility_diversity_score", distinct_types, len(consumption_records), district_data)

        # 8. water_bill_payment_flag
        water_records = [r for r in consumption_records if r.get("type") == "water"]
        val8 = 1.0 if water_records else 0.0
        features["water_bill_payment_flag"] = IncomeProxyExtractor._apply_fallback("water_bill_payment_flag", val8, len(consumption_records), district_data)

        # 9. lpg_refill_frequency (per year)
        if lpg_records:
            years = (now - lpg_records[0]["date"]).days / 365.25
            val9 = len(lpg_records) / years if years > 0.5 else float(len(lpg_records))
        else:
            val9 = None
        features["lpg_refill_frequency"] = IncomeProxyExtractor._apply_fallback("lpg_refill_frequency", val9, len(lpg_records), district_data)

        # 10. estimated_consumption_percentile
        total_monthly_avg = features.get("avg_monthly_recharge_amount", 0)
        if elec_records:
            months = len(set(f"{r['date'].year}-{r['date'].month}" for r in elec_records))
            total_elec = sum(r.get("amount", 0) for r in elec_records)
            total_monthly_avg += (total_elec / months) if months > 0 else 0
            
        dist_avg = district_data.get("avg_monthly_consumption", 1000)
        # basic percentile estimation: simple ratio map to percentile (naive approach for feature)
        ratio = total_monthly_avg / dist_avg if dist_avg > 0 else 0
        val10 = min(100.0, max(0.0, ratio * 50.0)) 
        features["estimated_consumption_percentile"] = IncomeProxyExtractor._apply_fallback("estimated_consumption_percentile", val10, len(consumption_records), district_data)

        # 11. payment_mode_digital_flag
        val11 = 1.0 if any(r.get("payment_mode", "").lower() in ["upi", "card", "netbanking"] for r in consumption_records) else 0.0
        features["payment_mode_digital_flag"] = IncomeProxyExtractor._apply_fallback("payment_mode_digital_flag", val11, len(consumption_records), district_data)

        # 12. consumption_growth_rate (last 3m vs previous 3m)
        three_months_ago = now - relativedelta(months=3)
        last_3m_recs = [r for r in consumption_records if r.get("date") and r["date"] >= three_months_ago]
        prev_3m_recs = [r for r in consumption_records if r.get("date") and three_months_ago > r["date"] >= six_months_ago]
        
        # Need distinct months to ensure we actually have 6 records (data points) spanning the 6 months as per rule
        distinct_months = len(set(f"{r['date'].year}-{r['date'].month}" for r in last_3m_recs + prev_3m_recs))
        
        last_3m_spend = sum(r.get("amount", 0) for r in last_3m_recs)
        prev_3m_spend = sum(r.get("amount", 0) for r in prev_3m_recs)
        
        if prev_3m_spend > 0:
            val12 = (last_3m_spend - prev_3m_spend) / prev_3m_spend
        else:
            val12 = None
            
        features["consumption_growth_rate"] = IncomeProxyExtractor._apply_fallback("consumption_growth_rate", val12, distinct_months, district_data)

        return features
