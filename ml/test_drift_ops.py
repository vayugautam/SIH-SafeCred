import pytest
import numpy as np
import pandas as pd
from unittest.mock import MagicMock, patch
from ml.drift_detection import ModelDriftDetector
from ml.auto_retrain import AutoRetrainingPipeline

# --- Drift Detection Tests ---

def test_psi_calculation_no_drift():
    detector = ModelDriftDetector(None, None, None, None)
    
    # Same distribution
    np.random.seed(42)
    expected = np.random.normal(0, 1, 1000)
    actual = np.random.normal(0, 1, 1000)
    
    psi = detector.calculate_psi(expected, actual)
    
    # PSI should be very close to 0
    assert psi < 0.1

def test_psi_calculation_severe_drift():
    detector = ModelDriftDetector(None, None, None, None)
    
    # Completely shifted distribution
    np.random.seed(42)
    expected = np.random.normal(0, 1, 1000)
    actual = np.random.normal(5, 1, 1000) # Mean shifted by 5 std devs
    
    psi = detector.calculate_psi(expected, actual)
    
    # Severe drift > 0.2
    assert psi > 0.2

def test_detect_feature_drift():
    detector = ModelDriftDetector(None, None, None, None)
    
    baseline = pd.DataFrame({
        'f1': np.random.normal(0, 1, 1000),
        'f2': np.random.normal(0, 1, 1000)
    })
    
    current = pd.DataFrame({
        'f1': np.random.normal(0, 1, 1000), # Stable
        'f2': np.random.normal(2, 1, 1000)  # Drifted
    })
    
    report = detector.detect_feature_drift(baseline, current, threshold=0.2)
    
    assert 'f1' not in report
    assert 'f2' in report
    assert report['f2'] > 0.2

def test_detect_performance_drift():
    detector = ModelDriftDetector(None, None, None, None)
    
    y_true = np.array([0, 0, 1, 1])
    y_prob_current = np.array([0.1, 0.4, 0.35, 0.8])
    
    baseline_auc = 0.90
    
    # AUC for above probabilities is 0.75
    # Drop is 0.90 - 0.75 = 0.15 > 0.03 threshold
    
    is_drift = detector.detect_performance_drift(y_true, y_prob_current, baseline_auc, drop_threshold=0.03)
    assert is_drift is True

@patch('ml.drift_detection.requests.post')
@patch('ml.drift_detection.Github')
def test_alert_triggering(mock_github, mock_post):
    mock_mongo = MagicMock()
    detector = ModelDriftDetector(mock_mongo, "token", "repo/name", "http://slack")
    
    drift_report = {"f2": 0.45}
    is_perf_drift = True
    current_auc = 0.75
    
    detector.trigger_alerts(drift_report, is_perf_drift, current_auc)
    
    # Verify Mongo Insert
    mock_mongo.insert_one.assert_called_once()
    
    # Verify Slack Webhook
    mock_post.assert_called_once()
    assert "0.750" in mock_post.call_args[1]['json']['text']
    assert "f2" in mock_post.call_args[1]['json']['text']
    
    # Verify GitHub Issue
    mock_repo = mock_github.return_value.get_repo.return_value
    mock_repo.create_issue.assert_called_once()


# --- Auto Retraining Tests ---

@patch('ml.auto_retrain.config.load_incluster_config')
@patch('ml.auto_retrain.client.AppsV1Api')
def test_canary_rollout_patching(mock_api, mock_config):
    # Ensure Kubernetes patch body matches Istio/Nginx canary requirements
    mock_api_instance = MagicMock()
    mock_api.return_value = mock_api_instance
    
    pipeline = AutoRetrainingPipeline(None, "scoring-service", "ml-namespace")
    
    pipeline.trigger_canary_rollout("v2")
    
    mock_api_instance.patch_namespaced_deployment.assert_called_once()
    call_args = mock_api_instance.patch_namespaced_deployment.call_args[1]
    
    assert call_args['name'] == "scoring-service"
    assert call_args['namespace'] == "ml-namespace"
    
    patch_body = call_args['body']
    annotations = patch_body["metadata"]["annotations"]
    assert annotations["safecred.ai/canary-version"] == "v2"
    assert annotations["safecred.ai/canary-weight"] == "10"
