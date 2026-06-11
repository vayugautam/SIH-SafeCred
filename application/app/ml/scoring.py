import pandas as pd
import numpy as np
import xgboost as xgb
import lightgbm as lgb
import shap

class ScoringEngine:
    """
    STEP 6 & 7 | Scoring Engine
    XGBoost -> Repayment Score (RS)
    LightGBM -> Income Category Score (ICS)
    Composite Score = 0.55*RS + 0.35*ICS + 0.10*SEI -> Risk Band assigned (A-E)
    """
    def __init__(self):
        # We instantiate dummy models for the prototype, normally we would load .pkl files
        self.xgb_model = xgb.XGBRegressor(n_estimators=10, max_depth=3)
        self.lgb_model = lgb.LGBMRegressor(n_estimators=10, max_depth=3)
        
        # Pre-train with synthetic data so they can run inference
        X_dummy = pd.DataFrame(np.random.rand(100, 8), columns=[
            "historical_defaults", "on_time_repayment_ratio", "monthly_power_consumption", 
            "avg_bill_amount", "secc_wealth_index", "literacy_rate", 
            "synthetic_feature_1", "synthetic_feature_2"
        ])
        y_rs_dummy = np.random.randint(300, 900, 100)
        y_ics_dummy = np.random.randint(300, 900, 100)
        
        self.xgb_model.fit(X_dummy, y_rs_dummy)
        self.lgb_model.fit(X_dummy, y_ics_dummy)
        
        self.explainer = shap.TreeExplainer(self.xgb_model)
        
    def generate_shap_report(self, feature_vector: pd.DataFrame) -> dict:
        """
        STEP 9 | SHAP values computed -> stored as human-readable compliance report.
        """
        shap_values = self.explainer.shap_values(feature_vector)
        feature_importance = dict(zip(feature_vector.columns, shap_values[0]))
        
        report = {
            "top_positive_factors": {k: v for k, v in feature_importance.items() if v > 0},
            "top_negative_factors": {k: v for k, v in feature_importance.items() if v < 0},
            "base_value": float(self.explainer.expected_value),
            "shap_array": shap_values[0].tolist()
        }
        return report

    def score(self, feature_vector: pd.DataFrame) -> dict:
        print("[SCORING ENGINE] Executing XGBoost and LightGBM models...")
        
        # 1. XGBoost -> Repayment Score
        rs = self.xgb_model.predict(feature_vector)[0]
        
        # 2. LightGBM -> Income Category Score
        ics = self.lgb_model.predict(feature_vector)[0]
        
        # 3. Macro SEI
        sei = feature_vector['secc_wealth_index'].iloc[0] * 900 # Scale 0-1 to 0-900
        
        # 4. Composite Score
        composite_score = int(0.55 * rs + 0.35 * ics + 0.10 * sei)
        
        # Clamp between 300 and 900
        composite_score = max(300, min(900, composite_score))
        
        # 5. Risk Band Assignment
        band = "E"
        if composite_score >= 750:
            band = "A"
        elif composite_score >= 600:
            band = "B"
        elif composite_score >= 450:
            band = "C"
        elif composite_score >= 300:
            band = "D"
            
        print(f"[SCORING ENGINE] Computed Score: {composite_score} (Band {band})")
        
        # Generate SHAP Compliance Report
        shap_report = self.generate_shap_report(feature_vector)
        
        return {
            "repayment_score": float(rs),
            "income_category_score": float(ics),
            "composite_score": composite_score,
            "band": band,
            "shap_report": shap_report
        }

scoring_engine = ScoringEngine()
