import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import mlflow
import shap
from typing import Tuple, Dict, Any, List

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import RobustScaler, OrdinalEncoder
from category_encoders import TargetEncoder
from sklearn.ensemble import StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import roc_auc_score, confusion_matrix, ConfusionMatrixDisplay
from scipy.stats import ks_2samp

from xgboost import XGBClassifier
from lightgbm import LGBMClassifier

class SafeCredMLPipeline:
    def __init__(self, num_features: List[str], cat_low_cardinality: List[str], cat_high_cardinality: List[str]):
        self.num_features = num_features
        self.cat_low_cardinality = cat_low_cardinality
        self.cat_high_cardinality = cat_high_cardinality
        
        # 1. Preprocessing
        # Numeric: add missing indicators, impute median, robust scale
        numeric_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median', add_indicator=True)),
            ('scaler', RobustScaler())
        ])

        # Categorical Low Cardinality (< 20 categories)
        cat_low_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='most_frequent', add_indicator=True)),
            ('ordinal', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1))
        ])

        # Categorical High Cardinality (>= 20 categories)
        cat_high_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='most_frequent', add_indicator=True)),
            ('target', TargetEncoder())
        ])

        self.preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, self.num_features),
                ('cat_low', cat_low_transformer, self.cat_low_cardinality),
                ('cat_high', cat_high_transformer, self.cat_high_cardinality)
            ],
            remainder='drop'
        )

        # 2. Base Models
        self.model_1_xgb = XGBClassifier(
            n_estimators=500,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_weight=5,
            reg_alpha=0.1,
            eval_metric='auc',
            use_label_encoder=False,
            random_state=42
        )

        self.model_2_lgbm = LGBMClassifier(
            n_estimators=400,
            num_leaves=63,
            learning_rate=0.05,
            class_weight='balanced',
            subsample=0.8,
            colsample_bytree=0.7,
            random_state=42,
            verbose=-1
        )

        # 3. Stacking
        # StackingClassifier automatically uses StratifiedKFold cross_val_predict for OOF predictions
        self.stacking_clf = StackingClassifier(
            estimators=[
                ('xgb', self.model_1_xgb),
                ('lgbm', self.model_2_lgbm)
            ],
            final_estimator=LogisticRegression(C=0.1, random_state=42),
            cv=5,
            passthrough=False
        )

        # 4. Calibration
        # We wrap the stacker in an isotonic calibrator
        self.calibrated_model = CalibratedClassifierCV(
            estimator=self.stacking_clf, 
            method='isotonic', 
            cv=5
        )

        self.full_pipeline = Pipeline(steps=[
            ('preprocessor', self.preprocessor),
            ('calibrated_classifier', self.calibrated_model)
        ])

    def _compute_ks_statistic(self, y_true: np.ndarray, y_prob: np.ndarray) -> float:
        """Computes the Kolmogorov-Smirnov (KS) statistic."""
        positives = y_prob[y_true == 1]
        negatives = y_prob[y_true == 0]
        if len(positives) == 0 or len(negatives) == 0:
            return 0.0
        ks_stat, _ = ks_2samp(negatives, positives)
        return ks_stat

    def train_and_evaluate(self, X: pd.DataFrame, y: pd.Series, experiment_name: str = "SafeCred_Production_Pipeline"):
        mlflow.set_experiment(experiment_name)
        
        with mlflow.start_run():
            # Log params
            mlflow.log_params({
                "xgb_n_estimators": 500,
                "xgb_max_depth": 6,
                "xgb_learning_rate": 0.05,
                "lgbm_n_estimators": 400,
                "lgbm_num_leaves": 63,
                "stacking_final_estimator": "LogisticRegression(C=0.1)",
                "calibration_method": "isotonic",
                "calibration_cv": 5
            })

            # CV Evaluation Metrics
            skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
            oof_preds = np.zeros(len(y))
            
            # Note: We do CV just to compute OOF metrics reliably before final training
            # We must apply preprocessing per fold to avoid data leakage
            fold_metrics = []
            
            for fold, (train_idx, val_idx) in enumerate(skf.split(X, y)):
                X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
                y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]
                
                # Clone pipeline to avoid state issues
                from sklearn.base import clone
                fold_pipe = clone(self.full_pipeline)
                fold_pipe.fit(X_train, y_train)
                
                y_pred_prob = fold_pipe.predict_proba(X_val)[:, 1]
                oof_preds[val_idx] = y_pred_prob
                
                fold_auc = roc_auc_score(y_val, y_pred_prob)
                fold_metrics.append(fold_auc)

            # Final Training on all data
            self.full_pipeline.fit(X, y)

            # Calculate OOF Metrics
            auc = roc_auc_score(y, oof_preds)
            gini = 2 * auc - 1
            ks = self._compute_ks_statistic(y, oof_preds)
            
            metrics = {
                "cv_mean_auc": float(np.mean(fold_metrics)),
                "oof_roc_auc": float(auc),
                "oof_gini": float(gini),
                "oof_ks_statistic": float(ks)
            }
            mlflow.log_metrics(metrics)

            # Generate Confusion Matrix Artifact
            y_pred_class = (oof_preds > 0.5).astype(int)
            cm = confusion_matrix(y, y_pred_class)
            disp = ConfusionMatrixDisplay(confusion_matrix=cm)
            fig, ax = plt.subplots()
            disp.plot(ax=ax)
            plt.title("OOF Confusion Matrix")
            fig.savefig("confusion_matrix.png")
            mlflow.log_artifact("confusion_matrix.png")
            plt.close(fig)

            # Generate SHAP Importance Artifact
            # Because of stacking and calibration, we extract SHAP values from the base XGBoost model
            # trained on the preprocessed whole dataset
            try:
                X_preprocessed = self.preprocessor.fit_transform(X, y)
                xgb_model = self.model_1_xgb.fit(X_preprocessed, y)
                explainer = shap.TreeExplainer(xgb_model)
                # Sample 500 rows for SHAP plot to speed up execution
                sample_size = min(500, X_preprocessed.shape[0])
                shap_values = explainer.shap_values(X_preprocessed[:sample_size])
                
                fig = plt.figure()
                shap.summary_plot(shap_values, X_preprocessed[:sample_size], show=False)
                fig.savefig("shap_summary.png", bbox_inches='tight')
                mlflow.log_artifact("shap_summary.png")
                plt.close(fig)
            except Exception as e:
                print(f"SHAP generation failed (expected if categorical features aren't fully numeric yet): {e}")

            # Save the final sklearn pipeline to MLflow
            mlflow.sklearn.log_model(self.full_pipeline, "model")
            print("Model training and logging completed successfully.")
            return metrics

    def predict_score(self, X: pd.DataFrame) -> np.ndarray:
        """
        Returns a scaled 0-1000 score.
        Multiplies the calibrated probability by 1000 and rounds.
        """
        probs = self.full_pipeline.predict_proba(X)[:, 1]
        scores = np.round(probs * 1000).astype(int)
        return scores
