import os
import json
import requests
import numpy as np
import pandas as pd
from datetime import datetime
from github import Github
from sklearn.metrics import roc_auc_score
from scipy.stats import ks_2samp

class ModelDriftDetector:
    def __init__(self, mongo_collection, github_token: str, repo_name: str, slack_webhook: str):
        self.mongo_collection = mongo_collection
        self.gh = Github(github_token) if github_token else None
        self.repo_name = repo_name
        self.slack_webhook = slack_webhook

    def calculate_psi(self, expected: np.ndarray, actual: np.ndarray, bins: int = 10) -> float:
        """Calculates Population Stability Index for a single continuous feature."""
        # Handle empty arrays
        if len(expected) == 0 or len(actual) == 0:
            return 0.0

        # Define bins based on expected distribution quantiles
        breakpoints = np.percentile(expected, np.linspace(0, 100, bins + 1))
        
        # Calculate percentages in each bin
        expected_pct, _ = np.histogram(expected, bins=breakpoints)
        actual_pct, _ = np.histogram(actual, bins=breakpoints)
        
        # Convert to percentages
        expected_pct = expected_pct / len(expected)
        actual_pct = actual_pct / len(actual)
        
        # Replace 0s with small value to avoid division by zero or log(0)
        expected_pct = np.where(expected_pct == 0, 0.0001, expected_pct)
        actual_pct = np.where(actual_pct == 0, 0.0001, actual_pct)
        
        # Calculate PSI
        psi_values = (actual_pct - expected_pct) * np.log(actual_pct / expected_pct)
        return float(np.sum(psi_values))

    def detect_feature_drift(self, baseline_df: pd.DataFrame, current_df: pd.DataFrame, threshold: float = 0.2) -> dict:
        """Runs PSI on all features and flags those exceeding threshold."""
        drift_report = {}
        for col in baseline_df.columns:
            if np.issubdtype(baseline_df[col].dtype, np.number):
                psi = self.calculate_psi(baseline_df[col].dropna().values, current_df[col].dropna().values)
                if psi > threshold:
                    drift_report[col] = float(psi)
        return drift_report

    def detect_performance_drift(self, y_true: np.ndarray, y_prob_current: np.ndarray, baseline_auc: float, drop_threshold: float = 0.03) -> bool:
        """Calculates current AUC and flags if it dropped below baseline by more than threshold."""
        if len(np.unique(y_true)) < 2:
            return False # Cannot calculate AUC on single class
            
        current_auc = roc_auc_score(y_true, y_prob_current)
        if (baseline_auc - current_auc) > drop_threshold:
            return True
        return False
        
    def detect_score_distribution_drift(self, baseline_scores: np.ndarray, current_scores: np.ndarray, p_value_threshold: float = 0.05) -> bool:
        """Runs KS test on score outputs to see if distributions are statistically different."""
        if len(baseline_scores) == 0 or len(current_scores) == 0:
            return False
            
        stat, p_value = ks_2samp(baseline_scores, current_scores)
        return bool(p_value < p_value_threshold)

    def trigger_alerts(self, drift_report: dict, is_perf_drift: bool, current_auc: float):
        """Dispatches alerts to GitHub, Slack, and MongoDB."""
        
        # 1. MongoDB Logging
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "drift_detected": bool(drift_report) or is_perf_drift,
            "feature_drift": drift_report,
            "performance_drift": is_perf_drift,
            "current_auc": float(current_auc)
        }
        if self.mongo_collection is not None:
            self.mongo_collection.insert_one(log_entry)

        if not log_entry["drift_detected"]:
            return

        alert_text = "🚨 *Model Drift Detected!* 🚨\n\n"
        if is_perf_drift:
            alert_text += f"⚠️ *Performance Drop*: Current holdout AUC is {current_auc:.3f}\n"
        if drift_report:
            alert_text += f"⚠️ *Feature Drift (PSI > 0.2)*:\n"
            for feat, psi in drift_report.items():
                alert_text += f"- {feat}: {psi:.3f}\n"

        # 2. Slack Webhook
        if self.slack_webhook:
            try:
                requests.post(self.slack_webhook, json={"text": alert_text})
            except Exception as e:
                print(f"Failed to send Slack alert: {e}")

        # 3. GitHub Issue
        if self.gh and self.repo_name:
            try:
                repo = self.gh.get_repo(self.repo_name)
                repo.create_issue(
                    title=f"[Auto-Alert] Model Drift Detected - {datetime.utcnow().strftime('%Y-%m-%d')}",
                    body=alert_text,
                    labels=["bug", "mlops", "drift"]
                )
            except Exception as e:
                print(f"Failed to create GitHub issue: {e}")

    def run_monthly_check(self, baseline_df: pd.DataFrame, current_df: pd.DataFrame, 
                          y_true: np.ndarray, y_prob: np.ndarray, 
                          baseline_auc: float, baseline_scores: np.ndarray, current_scores: np.ndarray):
        """Main orchestration method run by Celery."""
        
        drift_report = self.detect_feature_drift(baseline_df, current_df)
        
        # Handle edge cases where holdout might be empty
        current_auc = baseline_auc
        is_perf_drift = False
        if len(y_true) > 0:
            current_auc = roc_auc_score(y_true, y_prob)
            is_perf_drift = self.detect_performance_drift(y_true, y_prob, baseline_auc)
            
        score_drift = self.detect_score_distribution_drift(baseline_scores, current_scores)
        
        # Alert if anything triggers
        if drift_report or is_perf_drift or score_drift:
            self.trigger_alerts(drift_report, is_perf_drift or score_drift, current_auc)
            return True
        return False
