import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.model_selection import StratifiedShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
import lightgbm as lgb
from category_encoders import TargetEncoder

class IncomeEstimationModel:
    # Manual heuristic weights documented for fusion logic (Option C style approach if needed)
    SIGNAL_WEIGHTS = {
        'avg_monthly_electricity_units': 0.25,
        'avg_monthly_recharge_amount': 0.20,
        'utility_diversity_score': 0.15,
        'govt_survey_income_category': 0.25,
        'district_economic_index': 0.15
    }

    def __init__(self):
        self.features = list(self.SIGNAL_WEIGHTS.keys())
        self.pipeline = self._build_pipeline()
        
    def _build_pipeline(self) -> Pipeline:
        """Constructs the LightGBM Multiclass Pipeline."""
        
        numeric_features = [
            'avg_monthly_electricity_units', 
            'avg_monthly_recharge_amount', 
            'utility_diversity_score', 
            'district_economic_index'
        ]
        
        cat_features = ['govt_survey_income_category']
        
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', SimpleImputer(strategy='median'), numeric_features),
                ('cat', TargetEncoder(), cat_features)
            ],
            remainder='drop'
        )
        
        lgbm = lgb.LGBMClassifier(
            objective='multiclass',
            num_class=5,
            class_weight='balanced',
            n_estimators=200,
            learning_rate=0.05,
            n_jobs=-1,
            verbose=-1
        )
        
        return Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', lgbm)
        ])

    def geographic_stratified_split(self, df: pd.DataFrame, target_col: str, district_col: str, test_size: float = 0.2) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Splits data 80/20 ensuring proportions of both Band and District are maintained 
        to prevent geographic leakage.
        """
        # Create a synthetic compound strata: "BandX_DistrictY"
        # We must cast to string and handle potential NaNs
        strata = df[target_col].astype(str) + "_" + df[district_col].astype(str)
        
        # Handle rare classes that might have only 1 instance by combining them
        counts = strata.value_counts()
        rare_classes = counts[counts < 2].index
        strata = strata.replace(rare_classes, 'RARE_COMBINATION')
        
        splitter = StratifiedShuffleSplit(n_splits=1, test_size=test_size, random_state=42)
        
        train_idx, test_idx = next(splitter.split(df, strata))
        
        return df.iloc[train_idx], df.iloc[test_idx]

    def fit(self, X: pd.DataFrame, y: pd.Series):
        """Fits the underlying pipeline."""
        self.pipeline.fit(X, y)

    def predict(self, feature_vector: pd.DataFrame) -> Dict[str, Any]:
        """
        Generates predictions with the exact required schema and implements the 
        Pro-Poor Fallback logic based on signal coverage.
        """
        # 1. Calculate Signal Coverage
        # Check how many of our 5 key features are non-null
        present_features = feature_vector[self.features].notna().sum(axis=1).iloc[0]
        signal_coverage = float(present_features / len(self.features))
        
        # 2. Pro-Poor Fallback
        if signal_coverage < 0.4:
            return {
                "predicted_band": 1,
                "probabilities": [1.0, 0.0, 0.0, 0.0, 0.0],
                "confidence": "LOW",
                "signal_coverage": signal_coverage,
                "fallback_triggered": True
            }
            
        # 3. Model Prediction
        # LGBM predicts class probabilities
        probs = self.pipeline.predict_proba(feature_vector)[0]
        
        predicted_band = int(np.argmax(probs) + 1) # +1 because classes are 0-indexed internally but bands are 1-5
        max_prob = float(np.max(probs))
        
        # Determine confidence string
        confidence = "HIGH"
        if max_prob < 0.5:
            confidence = "LOW"
        elif max_prob < 0.75:
            confidence = "MEDIUM"
            
        return {
            "predicted_band": predicted_band,
            "probabilities": [float(p) for p in probs],
            "confidence": confidence,
            "signal_coverage": signal_coverage,
            "fallback_triggered": False
        }
