import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Tuple, List, Dict, Any

import mlflow
import shap
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import RobustScaler, OrdinalEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import StackingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import roc_auc_score, confusion_matrix
import xgboost as xgb
import lightgbm as lgb
from category_encoders import TargetEncoder

class ProductionCreditModel:
    def __init__(self, numeric_features: List[str], cat_high_card: List[str], cat_low_card: List[str]):
        self.numeric_features = numeric_features
        self.cat_high_card = cat_high_card
        self.cat_low_card = cat_low_card
        self.pipeline = self._build_pipeline()
        
    def _build_pipeline(self) -> Pipeline:
        """Constructs the robust Preprocessing and Modeling pipeline."""
        
        # 1. Preprocessing
        numeric_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median', add_indicator=True)),
            ('scaler', RobustScaler())
        ])
        
        high_card_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
            ('target_encoder', TargetEncoder())
        ])
        
        low_card_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
            ('ordinal', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1))
        ])
        
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, self.numeric_features),
                ('cat_high', high_card_transformer, self.cat_high_card),
                ('cat_low', low_card_transformer, self.cat_low_card)
            ],
            remainder='drop'
        )

        # 2. Base Models
        xgb_model = xgb.XGBClassifier(
            n_estimators=500,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_weight=5,
            reg_alpha=0.1,
            eval_metric='auc',
            use_label_encoder=False,
            n_jobs=-1
        )
        
        lgb_model = lgb.LGBMClassifier(
            n_estimators=400,
            num_leaves=63,
            learning_rate=0.05,
            class_weight='balanced',
            subsample=0.8,
            colsample_bytree=0.7,
            n_jobs=-1,
            verbose=-1
        )
        
        # 3. Stacking
        stacker = StackingClassifier(
            estimators=[
                ('repayment_xgb', xgb_model),
                ('income_lgbm', lgb_model)
            ],
            final_estimator=LogisticRegression(C=0.1),
            cv=5,
            n_jobs=-1
        )
        
        # 4. Calibration
        calibrated_stacker = CalibratedClassifierCV(
            estimator=stacker, 
            method='isotonic', 
            cv=5
        )
        
        # Full Pipeline
        return Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('calibrated_model', calibrated_stacker)
        ])

    def calculate_ks_statistic(self, y_true: np.ndarray, y_prob: np.ndarray) -> float:
        """Calculates Kolmogorov-Smirnov (KS) Statistic."""
        df = pd.DataFrame({'true': y_true, 'prob': y_prob})
        df = df.sort_values(by='prob', ascending=False)
        df['good'] = 1 - df['true']
        df['bad'] = df['true']
        
        df['cum_good'] = df['good'].cumsum() / df['good'].sum()
        df['cum_bad'] = df['bad'].cumsum() / df['bad'].sum()
        
        df['ks'] = np.abs(df['cum_good'] - df['cum_bad'])
        return float(df['ks'].max())

    def plot_confusion_matrix(self, y_true: np.ndarray, y_pred: np.ndarray, path: str):
        """Generates and saves confusion matrix."""
        cm = confusion_matrix(y_true, y_pred)
        plt.figure(figsize=(6, 5))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
        plt.title('Confusion Matrix')
        plt.ylabel('Actual Label')
        plt.xlabel('Predicted Label')
        plt.tight_layout()
        plt.savefig(path)
        plt.close()

    def generate_shap_plots(self, X: pd.DataFrame, y: pd.Series, output_dir: str):
        """Generates SHAP plots for base learners."""
        os.makedirs(output_dir, exist_ok=True)
        
        # Preprocess data to pass to SHAP
        X_trans = self.pipeline.named_steps['preprocessor'].transform(X)
        feature_names = [f"f{i}" for i in range(X_trans.shape[1])] # Simplified fallback
        
        try:
            # Extract base models from Calibrated -> Stacking -> Base
            calibrated = self.pipeline.named_steps['calibrated_model']
            # Access first calibrated base estimator (Stacker)
            stacker = calibrated.calibrated_classifiers_[0].estimator
            
            xgb_model = stacker.named_estimators_['repayment_xgb']
            explainer_xgb = shap.TreeExplainer(xgb_model)
            shap_values_xgb = explainer_xgb.shap_values(X_trans)
            plt.figure()
            shap.summary_plot(shap_values_xgb, X_trans, feature_names=feature_names, show=False)
            plt.savefig(os.path.join(output_dir, "shap_xgb.png"), bbox_inches='tight')
            plt.close()
            
            lgb_model = stacker.named_estimators_['income_lgbm']
            explainer_lgb = shap.TreeExplainer(lgb_model)
            shap_values_lgb = explainer_lgb.shap_values(X_trans)
            plt.figure()
            shap.summary_plot(shap_values_lgb, X_trans, feature_names=feature_names, show=False)
            plt.savefig(os.path.join(output_dir, "shap_lgb.png"), bbox_inches='tight')
            plt.close()
        except Exception as e:
            print(f"Warning: SHAP generation failed: {e}")

    def train_and_evaluate(self, X: pd.DataFrame, y: pd.Series, experiment_name: str = "Credit_Scoring_V1"):
        """Executes full training with MLFlow tracking."""
        mlflow.set_experiment(experiment_name)
        
        with mlflow.start_run() as run:
            # 1. Log Hyperparameters
            mlflow.log_params({
                "xgb_estimators": 500,
                "xgb_max_depth": 6,
                "lgb_estimators": 400,
                "lgb_num_leaves": 63,
                "stacker_meta": "LogisticRegression(C=0.1)",
                "calibration": "Isotonic_CV5"
            })
            
            # 2. Cross Validation for Metrics
            skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
            auc_scores, gini_scores, ks_scores = [], [], []
            
            print("Running 5-Fold Stratified CV...")
            for train_idx, val_idx in skf.split(X, y):
                X_tr, X_va = X.iloc[train_idx], X.iloc[val_idx]
                y_tr, y_va = y.iloc[train_idx], y.iloc[val_idx]
                
                # Clone pipeline to avoid data leakage
                from sklearn.base import clone
                cv_pipe = clone(self.pipeline)
                cv_pipe.fit(X_tr, y_tr)
                
                y_prob = cv_pipe.predict_proba(X_va)[:, 1]
                
                auc = roc_auc_score(y_va, y_prob)
                gini = (2 * auc) - 1
                ks = self.calculate_ks_statistic(y_va.values, y_prob)
                
                auc_scores.append(auc)
                gini_scores.append(gini)
                ks_scores.append(ks)
                
            # 3. Log CV Metrics
            mlflow.log_metrics({
                "cv_mean_auc": np.mean(auc_scores),
                "cv_mean_gini": np.mean(gini_scores),
                "cv_mean_ks": np.mean(ks_scores)
            })
            
            # 4. Final Fit on all data
            print("Fitting final production model...")
            self.pipeline.fit(X, y)
            
            # 5. Generate Artifacts on Training Set
            y_prob_final = self.pipeline.predict_proba(X)[:, 1]
            y_pred_final = (y_prob_final > 0.5).astype(int)
            
            self.plot_confusion_matrix(y, y_pred_final, "confusion_matrix.png")
            mlflow.log_artifact("confusion_matrix.png")
            
            self.generate_shap_plots(X, y, "shap_artifacts")
            mlflow.log_artifacts("shap_artifacts", artifact_path="shap")
            
            # Log Model
            mlflow.sklearn.log_model(self.pipeline, "calibrated_stacking_model")
            print(f"Training Complete. MLFlow Run ID: {run.info.run_id}")
            
    def predict_score(self, X: pd.DataFrame) -> np.ndarray:
        """
        Outputs highly calibrated integer score (0-1000).
        """
        # Ensure model is fitted
        y_prob = self.pipeline.predict_proba(X)[:, 1]
        
        # Scale to 0-1000 and round
        scores = np.round(y_prob * 1000).astype(int)
        
        # Clip to ensure bounds
        return np.clip(scores, 0, 1000)
