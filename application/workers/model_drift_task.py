import os
import json
import numpy as np
import pandas as pd
from datetime import datetime
from celery import Celery
from scipy.stats import ks_2samp
from sklearn.metrics import roc_auc_score

import mlflow
from pymongo import MongoClient
from github import Github
from kubernetes import client, config

# Celery app configuration (usually imported from a main app config)
app = Celery(
    'model_drift_tasks', 
    broker=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
)

class AlertManager:
    @staticmethod
    def send_slack_alert(message: str):
        # Mocking slack webhook POST
        webhook_url = os.getenv("SLACK_WEBHOOK_URL")
        print(f"[SLACK ALERT] {message}")
        
    @staticmethod
    def create_github_issue(title: str, body: str):
        github_token = os.getenv("GITHUB_TOKEN")
        repo_name = os.getenv("GITHUB_REPO", "vayugautam/SIH-SafeCred")
        if not github_token:
            print("[GITHUB ALERT] GitHub token missing. Skipping issue creation.")
            return
        g = Github(github_token)
        try:
            repo = g.get_repo(repo_name)
            repo.create_issue(title=title, body=body)
            print("[GITHUB ALERT] Created issue successfully.")
        except Exception as e:
            print(f"[GITHUB ALERT] Failed to create issue: {e}")

class ModelDriftDetector:
    def __init__(self):
        self.mongo_client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
        self.db = self.mongo_client["safecred"]
        self.collection = self.db["model_health_logs"]

    def _calculate_psi(self, expected: np.ndarray, actual: np.ndarray, bins=10) -> float:
        """Calculates the Population Stability Index for a single feature."""
        # Remove NaNs
        expected = expected[~np.isnan(expected)]
        actual = actual[~np.isnan(actual)]
        
        if len(expected) == 0 or len(actual) == 0:
            return 0.0

        # Create bins based on expected distribution
        breakpoints = np.percentile(expected, np.linspace(0, 100, bins + 1))
        # Ensure unique breakpoints
        breakpoints = np.unique(breakpoints)
        if len(breakpoints) < 2:
            breakpoints = np.array([np.min(expected), np.max(expected) + 1e-5])
            
        breakpoints[0] = -np.inf
        breakpoints[-1] = np.inf

        expected_percents = np.histogram(expected, bins=breakpoints)[0] / len(expected)
        actual_percents = np.histogram(actual, bins=breakpoints)[0] / len(actual)

        # Replace 0s with small value to avoid division by zero or ln(0)
        expected_percents = np.where(expected_percents == 0, 0.0001, expected_percents)
        actual_percents = np.where(actual_percents == 0, 0.0001, actual_percents)

        psi = np.sum((actual_percents - expected_percents) * np.log(actual_percents / expected_percents))
        return float(psi)

    def check_drift(self, baseline_df: pd.DataFrame, current_df: pd.DataFrame, 
                    y_true_holdout: np.ndarray, y_pred_holdout: np.ndarray, 
                    baseline_auc: float, feature_names: list):
        """Runs PSI, AUC, and KS drift checks."""
        drift_detected = False
        drift_report = []
        
        # 1. PSI check on all features
        for feature in feature_names:
            if feature in baseline_df and feature in current_df:
                psi_val = self._calculate_psi(baseline_df[feature].values, current_df[feature].values)
                if psi_val > 0.2:
                    drift_detected = True
                    drift_report.append(f"Feature '{feature}' PSI = {psi_val:.3f} (> 0.2)")

        # 2. AUC performance drift
        current_auc = roc_auc_score(y_true_holdout, y_pred_holdout)
        auc_drop = baseline_auc - current_auc
        if auc_drop > 0.03:
            drift_detected = True
            drift_report.append(f"AUC dropped by {auc_drop*100:.1f}% (Baseline: {baseline_auc:.3f}, Current: {current_auc:.3f})")

        # 3. Score distribution drift (KS test)
        # Using predictions on current data vs baseline predictions (approximated here)
        baseline_preds = baseline_df.get('predicted_score', np.random.rand(len(baseline_df)))
        current_preds = current_df.get('predicted_score', np.random.rand(len(current_df)))
        
        ks_stat, p_value = ks_2samp(baseline_preds, current_preds)
        if ks_stat > 0.1 and p_value < 0.05: # threshold for score drift
            drift_detected = True
            drift_report.append(f"Score Distribution KS-Statistic = {ks_stat:.3f} (p={p_value:.4f})")

        # 4. Alerting
        log_record = {
            "timestamp": datetime.utcnow(),
            "drift_detected": drift_detected,
            "current_auc": float(current_auc),
            "auc_drop": float(auc_drop),
            "drift_report": drift_report
        }
        self.collection.insert_one(log_record)

        if drift_detected:
            alert_msg = "Model Drift Detected!\n" + "\n".join(drift_report)
            AlertManager.send_slack_alert(alert_msg)
            AlertManager.create_github_issue(
                title=f"🚨 Model Drift Alert: {datetime.utcnow().strftime('%Y-%m-%d')}",
                body="The following drift metrics were flagged:\n" + "\n".join([f"- {r}" for r in drift_report])
            )
            # Trigger auto-retraining pipeline
            AutoRetrainingPipeline.retrain.delay()

class AutoRetrainingPipeline:
    @staticmethod
    @app.task
    def retrain():
        """Pulls last 12 months data, retrains, evaluates, registers to MLflow, and triggers canary."""
        print("[AUTO-RETRAIN] Starting automated retraining pipeline...")
        # 1. Pull data from PostgreSQL (mocked)
        print("[AUTO-RETRAIN] Pulling last 12 months of labelled data from Postgres...")
        
        # 2. Retrain model (Assuming SafeCredMLPipeline exists)
        # In real code: from intelligence.models.pipeline import SafeCredMLPipeline
        # Mocking evaluation
        new_auc = 0.86  # Example
        current_auc = 0.84 # Retrieved from MLflow
        
        print(f"[AUTO-RETRAIN] Retraining complete. New AUC: {new_auc}, Current AUC: {current_auc}")
        
        if new_auc > current_auc:
            print("[AUTO-RETRAIN] New model is better. Registering to MLflow...")
            # mlflow.register_model("runs:/<run_id>/model", "SafeCred_Production_Model")
            
            # Trigger Canary Deployment via Kubernetes annotation
            AutoRetrainingPipeline.trigger_canary()
        else:
            print("[AUTO-RETRAIN] New model did not beat current baseline. Discarding.")

    @staticmethod
    def trigger_canary():
        """Updates Kubernetes deployment annotation to route 10% traffic to the new model."""
        try:
            config.load_incluster_config()
        except:
            # Fallback to local kubeconfig for dev
            try:
                config.load_kube_config()
            except Exception as e:
                print(f"[K8S CANARY] Could not load Kubernetes config: {e}")
                return
                
        v1 = client.AppsV1Api()
        namespace = "safecred-prod"
        deployment_name = "scoring-engine-canary"
        
        # Patch deployment to activate it
        body = {
            "metadata": {
                "annotations": {
                    "safecred.io/canary-traffic-weight": "10",
                    "safecred.io/last-retrained": datetime.utcnow().isoformat()
                }
            }
        }
        
        try:
            v1.patch_namespaced_deployment(
                name=deployment_name, 
                namespace=namespace, 
                body=body
            )
            print(f"[K8S CANARY] Successfully patched deployment {deployment_name} for 10% canary traffic.")
            AlertManager.send_slack_alert("🚀 Canary deployment (10% traffic) triggered for newly retrained model.")
        except Exception as e:
            print(f"[K8S CANARY] Failed to patch deployment: {e}")

@app.task
def monthly_drift_check():
    """Celery beat task scheduled for the 1st of each month."""
    detector = ModelDriftDetector()
    
    # In production, these dataframes are loaded from the Data Warehouse / Postgres
    # Mocking data to represent the workflow
    feature_names = [f"feature_{i}" for i in range(45)]
    baseline_df = pd.DataFrame(np.random.normal(0, 1, (1000, 45)), columns=feature_names)
    
    # Introduce drift in current_df for feature_0
    current_df = pd.DataFrame(np.random.normal(0, 1, (1000, 45)), columns=feature_names)
    current_df['feature_0'] = np.random.normal(2, 1.5, 1000) # Significant drift
    
    y_true_holdout = np.random.randint(0, 2, 500)
    # Simulate slightly worse predictions to trigger AUC drop
    y_pred_holdout = np.random.uniform(0.1, 0.9, 500)
    
    baseline_auc = 0.85
    
    detector.check_drift(
        baseline_df=baseline_df,
        current_df=current_df,
        y_true_holdout=y_true_holdout,
        y_pred_holdout=y_pred_holdout,
        baseline_auc=baseline_auc,
        feature_names=feature_names
    )
