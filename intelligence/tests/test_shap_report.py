import pytest
import pandas as pd
import numpy as np
from unittest.mock import MagicMock, patch
from intelligence.feature_engine.shap_report import SHAPReportGenerator, get_risk_band, READABLE_LABELS

@pytest.fixture
def mock_explainer():
    class MockExplainer:
        def shap_values(self, X):
            # Mock shap values logic
            return np.array([[-0.5, 0.2, 0.8, -0.1]])
    return MockExplainer()

@pytest.fixture
def mock_model():
    return MagicMock()

@pytest.fixture
def background_data():
    return pd.DataFrame({
        "emi_hit_rate": [50, 60],
        "prepayment_ratio": [0.1, 0.2],
        "avg_monthly_electricity_units": [100, 200],
        "delinquency_trend": [0, 1]
    })

@patch("intelligence.feature_engine.shap_report.MongoClient")
@patch("intelligence.feature_engine.shap_report.shap.TreeExplainer")
def test_all_5_risk_bands(mock_shap, mock_mongo, mock_model, background_data, mock_explainer):
    mock_shap.return_value = mock_explainer
    generator = SHAPReportGenerator(mock_model, background_data)
    
    vector = pd.DataFrame({
        "emi_hit_rate": [95],
        "prepayment_ratio": [0.5],
        "avg_monthly_electricity_units": [150],
        "delinquency_trend": [-0.5]
    })
    
    scores = [200, 350, 500, 650, 800]
    expected_bands = [
        "E - High Risk - Low Need",
        "D - High Risk - High Need",
        "C - Med Risk - High Need",
        "B - Low Risk - Low Need",
        "A - Low Risk - High Need"
    ]
    
    for score, expected_band in zip(scores, expected_bands):
        exp = generator.generate_explanation_dict("B123", vector, score, 90.0, [])
        assert exp["risk_band"] == expected_band
        assert exp["composite_score"] == score
        
@patch("intelligence.feature_engine.shap_report.MongoClient")
@patch("intelligence.feature_engine.shap_report.shap.TreeExplainer")
def test_all_features_have_labels(mock_shap, mock_mongo, mock_model, background_data, mock_explainer):
    mock_shap.return_value = mock_explainer
    generator = SHAPReportGenerator(mock_model, background_data)
    
    # We check if some known features resolve correctly
    vector = pd.DataFrame({
        "emi_hit_rate": [95],
        "unknown_feature_xyz": [0]
    })
    # modify mock explainer to match vector len
    class MockExplainer2:
        def shap_values(self, X):
            return np.array([[0.5, 0.5]])
    mock_shap.return_value = MockExplainer2()
    
    # recreate with new mock
    generator = SHAPReportGenerator(mock_model, background_data)
    exp = generator.generate_explanation_dict("B123", vector, 700, 100.0, [])
    
    # Check translation
    labels = [f["readable_label"] for f in exp["top_positive_factors"]]
    assert "Loan Repayment Rate" in labels
    assert "unknown_feature_xyz" in labels  # Fallback to variable name

@patch("intelligence.feature_engine.shap_report.MongoClient")
@patch("intelligence.feature_engine.shap_report.shap.TreeExplainer")
def test_pdf_generation(mock_shap, mock_mongo, mock_model, background_data, mock_explainer):
    mock_shap.return_value = mock_explainer
    generator = SHAPReportGenerator(mock_model, background_data)
    
    vector = pd.DataFrame({
        "emi_hit_rate": [95],
        "prepayment_ratio": [0.5],
        "avg_monthly_electricity_units": [150],
        "delinquency_trend": [-0.5]
    })
    
    exp = generator.generate_explanation_dict("B123", vector, 700, 100.0, [])
    pdf_bytes = generator.generate_pdf(exp)
    
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 0
    assert pdf_bytes.startswith(b"%PDF")
