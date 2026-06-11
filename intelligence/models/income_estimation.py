import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from lightgbm import LGBMClassifier
from sklearn.model_selection import train_test_split

class IncomeEstimationModel:
    def __init__(self):
        # LGBM Multi-class configuration
        self.model = LGBMClassifier(
            objective='multiclass',
            num_class=5,
            class_weight='balanced',
            random_state=42,
            n_estimators=400,
            num_leaves=63,
            learning_rate=0.05
        )
        self.is_trained = False

        # Define the 5 core signals and their theoretical weights
        # We can use these weights for a baseline fusion feature or simply to track coverage
        self.signal_weights = {
            "avg_monthly_electricity_units": 0.25,
            "avg_monthly_recharge_amount": 0.20,
            "utility_diversity_score": 0.15,
            "govt_survey_income_category": 0.25,
            "district_economic_index": 0.15
        }
        self.feature_cols = list(self.signal_weights.keys())

    def _compute_signal_coverage(self, row: pd.Series) -> float:
        """
        Computes signal coverage based on presence of non-null, non-zero (if applicable) values.
        Since govt_survey might be categorical, we check for pd.notna
        """
        weight_sum = 0.0
        for f, w in self.signal_weights.items():
            val = row.get(f)
            # Consider it 'present' if it's not null and (if numeric) > 0 for typical proxies, 
            # but standard is just pd.notna
            if pd.notna(val) and val != "":
                weight_sum += w
        return weight_sum

    def prepare_data_split(self, df: pd.DataFrame, target_col: str = "income_band", district_col: str = "district") -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
        """
        Creates an 80/20 train/test split.
        Stratifies by band AND district to prevent geographic leakage.
        """
        # Create a combined stratification key
        stratify_key = df[target_col].astype(str) + "_" + df[district_col].astype(str)
        
        # In case some strata have only 1 member, handle gracefully
        # by removing them or stratifying on just target if necessary
        # Assuming sufficient data for now
        
        X = df[self.feature_cols]
        y = df[target_col]
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, 
            test_size=0.20, 
            random_state=42, 
            stratify=stratify_key
        )
        return X_train, X_test, y_train, y_test

    def train(self, X_train: pd.DataFrame, y_train: pd.Series):
        """Trains the LGBM model on the 5 core proxy features."""
        # Note: LightGBM handles NaNs natively, but if needed, an imputer should be used here.
        # Ensure only feature_cols are used
        X = X_train[self.feature_cols].copy()
        
        # y_train should be mapped to 0-4 for LightGBM if bands are 1-5
        # We assume y_train is 1,2,3,4,5. We shift to 0,1,2,3,4
        y = y_train - 1
        
        self.model.fit(X, y)
        self.is_trained = True

    def predict_beneficiary(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predicts income band for a single beneficiary.
        Output: {predicted_band: int, probabilities: [p1..p5], confidence: float, signal_coverage: float}
        Safe default applied if coverage < 0.4
        """
        if not self.is_trained:
            raise ValueError("Model is not trained yet.")

        # Convert to single-row dataframe
        df = pd.DataFrame([features])
        
        # Ensure all required columns exist
        for col in self.feature_cols:
            if col not in df.columns:
                df[col] = np.nan
                
        row = df.iloc[0]
        
        # 1. Compute Coverage
        coverage = self._compute_signal_coverage(row)
        
        # 2. Safe Default (Pro-poor)
        if coverage < 0.4:
            return {
                "predicted_band": 1,
                "probabilities": [1.0, 0.0, 0.0, 0.0, 0.0],
                "confidence": "LOW",
                "signal_coverage": coverage,
                "reason": "Safe default applied (EWS) due to low signal coverage (<0.4)"
            }
            
        # 3. Predict via Model
        X = df[self.feature_cols]
        # LightGBM predict_proba returns array of shape (1, 5)
        probs = self.model.predict_proba(X)[0]
        
        # Model output is 0-4, shift back to 1-5
        pred_class = int(np.argmax(probs))
        max_prob = float(probs[pred_class])
        predicted_band = pred_class + 1
        
        # Confidence interpretation
        if max_prob > 0.8:
            confidence_str = "HIGH"
        elif max_prob > 0.5:
            confidence_str = "MEDIUM"
        else:
            confidence_str = "LOW"
            
        return {
            "predicted_band": predicted_band,
            "probabilities": probs.tolist(),
            "confidence": confidence_str,
            "confidence_score": max_prob,
            "signal_coverage": coverage,
            "reason": f"Model prediction (max_prob={max_prob:.2f})"
        }

