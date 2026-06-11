import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Tuple

import mlflow
from kubernetes import client, config

from ml.pipeline import ProductionCreditModel

class AutoRetrainingPipeline:
    def __init__(self, db_session_maker, deployment_name: str, namespace: str = "default"):
        self.db_session_maker = db_session_maker
        self.deployment_name = deployment_name
        self.namespace = namespace
        
        # We assume this runs inside the cluster as defined in the plan
        try:
            config.load_incluster_config()
            self.k8s_api = client.AppsV1Api()
        except Exception as e:
            print(f"Warning: Could not load Kubernetes in-cluster config: {e}")
            self.k8s_api = None

    async def fetch_historical_data(self) -> Tuple[pd.DataFrame, pd.Series]:
        """Pulls the last 12 months of labeled data from PostgreSQL feature_vectors."""
        # Simplified query representation. In production, this would join with loan outcomes.
        cutoff_date = datetime.utcnow() - timedelta(days=365)
        
        async with self.db_session_maker() as session:
            # We assume a 'label' column or join exists in reality
            from sqlalchemy import text
            result = await session.execute(
                text("SELECT features, label FROM feature_vectors WHERE created_at >= :cutoff AND label IS NOT NULL"),
                {"cutoff": cutoff_date}
            )
            rows = result.fetchall()
            
        if not rows:
            raise ValueError("No historical labeled data found for retraining.")
            
        features_list = [row[0] for row in rows]
        labels = [row[1] for row in rows]
        
        X = pd.DataFrame(features_list)
        y = pd.Series(labels)
        
        return X, y

    def trigger_canary_rollout(self, new_model_version: str):
        """Patches the Kubernetes Deployment to route 10% traffic to the new model."""
        if not self.k8s_api:
            print("Kubernetes API not configured. Skipping canary rollout.")
            return

        patch_body = {
            "metadata": {
                "annotations": {
                    "safecred.ai/canary-version": new_model_version,
                    "safecred.ai/canary-weight": "10" # Used by Istio/Nginx for traffic splitting
                }
            }
        }
        
        try:
            self.k8s_api.patch_namespaced_deployment(
                name=self.deployment_name,
                namespace=self.namespace,
                body=patch_body
            )
            print(f"Successfully triggered Canary rollout for {new_model_version} on deployment {self.deployment_name}")
        except Exception as e:
            print(f"Failed to patch Kubernetes deployment: {e}")

    async def run_pipeline(self, current_baseline_auc: float):
        """Orchestrates pulling data, retraining, and promoting the model."""
        print("Starting Auto-Retraining Pipeline...")
        
        # 1. Pull 12 months of data
        try:
            X, y = await self.fetch_historical_data()
        except ValueError as e:
            print(e)
            return False
            
        # Time-based split for true hold-out evaluation (last 1 month as hold-out)
        split_idx = int(len(X) * 0.9)
        X_train, y_train = X.iloc[:split_idx], y.iloc[:split_idx]
        X_test, y_test = X.iloc[split_idx:], y.iloc[split_idx:]
        
        # 2. Instantiate the canonical production pipeline
        numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
        cat_cols = X.select_dtypes(exclude=[np.number]).columns.tolist()
        
        model = ProductionCreditModel(
            numeric_features=numeric_cols,
            cat_high_card=cat_cols, # Simplification
            cat_low_card=[]
        )
        
        # 3. Train
        model.pipeline.fit(X_train, y_train)
        
        # 4. Evaluate on Hold-out
        y_prob = model.pipeline.predict_proba(X_test)[:, 1]
        from sklearn.metrics import roc_auc_score
        new_auc = roc_auc_score(y_test, y_prob)
        
        print(f"Retraining Complete. New Hold-out AUC: {new_auc:.4f} vs Baseline: {current_baseline_auc:.4f}")
        
        # 5. Promotion Logic
        if new_auc > current_baseline_auc:
            print("New model outperformed baseline! Registering to MLFlow...")
            
            mlflow.set_experiment("SafeCred_Auto_Retrain")
            with mlflow.start_run() as run:
                mlflow.log_metric("holdout_auc", new_auc)
                mlflow.sklearn.log_model(model.pipeline, "model")
                
                # Register Model
                model_uri = f"runs:/{run.info.run_id}/model"
                mv = mlflow.register_model(model_uri, "ProductionCreditModel")
                print(f"Registered as version {mv.version}")
                
                # 6. Trigger Canary
                self.trigger_canary_rollout(f"v{mv.version}")
                
            return True
        else:
            print("New model did NOT outperform baseline. Discarding.")
            return False
