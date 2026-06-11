import pandas as pd
import numpy as np

class FeatureStore:
    """
    STEP 4 | Feature Engine reads all three stores -> computes 45+ features -> writes feature vector to Feature Store.
    """
    
    @staticmethod
    def compute_features(beneficiary_id: str, loan_data: dict, ocr_data: dict, secc_data: dict) -> pd.DataFrame:
        """
        Simulates the extraction of 45+ features from raw data.
        Returns a single-row Pandas DataFrame representing the feature vector.
        """
        print(f"[FEATURE ENGINE] Computing 45+ features for {beneficiary_id}...")
        
        # 1. Repayment History Features (from Channel Partners)
        historical_defaults = loan_data.get("historical_defaults", 0)
        on_time_repayment_ratio = loan_data.get("on_time_repayment_ratio", 0.0)
        
        # 2. Alternative Data Features (from OCR Electricity Bills)
        monthly_power_consumption = ocr_data.get("units_consumed", np.nan)
        avg_bill_amount = ocr_data.get("amount_due", np.nan)
        
        # 3. Macroeconomic Indices (from Airflow/Celery sync)
        secc_wealth_index = secc_data.get("secc_wealth_index", np.nan)
        literacy_rate = secc_data.get("pmgdisha_literacy_rate", np.nan)
        
        # Construct the raw feature vector
        raw_features = {
            "historical_defaults": historical_defaults,
            "on_time_repayment_ratio": on_time_repayment_ratio,
            "monthly_power_consumption": monthly_power_consumption,
            "avg_bill_amount": avg_bill_amount,
            "secc_wealth_index": secc_wealth_index,
            "literacy_rate": literacy_rate,
            # ... Mocking the other 39 features ...
            "synthetic_feature_1": np.random.rand(),
            "synthetic_feature_2": np.random.rand(),
        }
        
        # Convert to DataFrame
        df = pd.DataFrame([raw_features])
        return df

feature_store = FeatureStore()
