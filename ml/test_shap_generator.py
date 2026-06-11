import os
import pytest
import pandas as pd
import numpy as np
from unittest.mock import MagicMock, patch
from ml.shap_generator import SHAPReportGenerator
from sklearn.tree import DecisionTreeClassifier

# --- Mock Model and Data ---
@pytest.fixture
def mock_model():
    # A tiny real model so TreeExplainer doesn't crash on mocked attributes
    X = pd.DataFrame({
        'emi_hit_rate': [0, 1, 0, 1], 
        'avg_days_past_due': [10, 0, 5, 0],
        'utility_diversity_score': [1, 2, 1, 3]
    })
    y = [0, 1, 0, 1]
    model = DecisionTreeClassifier().fit(X, y)
    return model, X

@pytest.fixture
def mock_feature_vector():
    return pd.DataFrame({
        'emi_hit_rate': [0.8], 
        'avg_days_past_due': [2.0],
        'utility_diversity_score': [2.0]
    })

# --- Tests ---

def test_explainer_instantiation_interventional(mock_model):
    model, bg_data = mock_model
    # Should use interventional because background_data is provided
    generator = SHAPReportGenerator(model, background_data=bg_data, max_background_rows=10)
    assert generator.perturbation_type == "interventional"
    assert generator.background_rows == 4

def test_explainer_instantiation_fallback(mock_model):
    model, _ = mock_model
    # Should fallback to tree_path_dependent
    generator = SHAPReportGenerator(model, background_data=None)
    assert generator.perturbation_type == "tree_path_dependent"
    assert generator.background_rows == 0

def test_labels_completeness():
    # Check that some key features from both extractors are present
    labels = SHAPReportGenerator.FEATURE_LABELS
    assert 'emi_hit_rate' in labels
    assert 'avg_days_past_due' in labels
    assert 'electricity_payment_regularity' in labels
    assert 'consumption_growth_rate' in labels
    # Verify tuple structure
    assert len(labels['emi_hit_rate']) == 2

def test_explanation_generation(mock_model, mock_feature_vector):
    model, bg_data = mock_model
    generator = SHAPReportGenerator(model, background_data=bg_data)
    
    explanation = generator.generate_explanation(
        beneficiary_id="BEN123",
        feature_vector=mock_feature_vector,
        composite_score=750,
        risk_band="B",
        imputed_features=["electricity_payment_regularity"]
    )
    
    assert explanation["beneficiary_id"] == "BEN123"
    assert explanation["composite_score"] == 750
    assert explanation["feature_perturbation"] == "interventional"
    assert explanation["data_completeness_pct"] < 100.0 # because of 1 imputed feature
    # We passed 3 features in the mock. Max top positive is 5, negative is 3.
    # It should sort all 3 into the respective buckets.
    total_factors = len(explanation["top_positive_factors"]) + len(explanation["top_negative_factors"])
    assert total_factors == 3

def test_mongodb_save(mock_model):
    model, _ = mock_model
    generator = SHAPReportGenerator(model)
    
    mock_collection = MagicMock()
    explanation = {"test": "data"}
    
    generator.save_to_mongodb(mock_collection, explanation)
    mock_collection.insert_one.assert_called_once_with({"test": "data"})

def test_pdf_generation_all_bands(mock_model, tmp_path):
    model, _ = mock_model
    generator = SHAPReportGenerator(model)
    
    # Generate mock explanation
    base_explanation = {
        "beneficiary_id": "BEN_TEST",
        "composite_score": 500,
        "top_positive_factors": [{"feature": "f1", "readable_label": "F1", "feature_value": 1.0, "contribution": 0.5}],
        "top_negative_factors": [{"feature": "f2", "readable_label": "F2", "feature_value": 0.0, "contribution": -0.5}],
        "generated_at": "2023-01-01",
        "model_version": "v1.0",
        "data_completeness_pct": 100.0
    }
    
    # Test all 5 bands to ensure ReportLab color mapping doesn't crash
    bands = ['A', 'B', 'C', 'D', 'E']
    for band in bands:
        explanation = base_explanation.copy()
        explanation["risk_band"] = band
        output_file = os.path.join(tmp_path, f"report_{band}.pdf")
        
        generator.generate_pdf(explanation, output_file)
        
        assert os.path.exists(output_file)
        assert os.path.getsize(output_file) > 1000 # Verify it wrote actual PDF binary data
