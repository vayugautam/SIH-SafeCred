import pytest
import numpy as np
import pandas as pd
from ml.income_model import IncomeEstimationModel

@pytest.fixture
def dummy_data():
    np.random.seed(42)
    
    n_samples = 200
    df = pd.DataFrame({
        'avg_monthly_electricity_units': np.random.uniform(50, 500, n_samples),
        'avg_monthly_recharge_amount': np.random.uniform(100, 1000, n_samples),
        'utility_diversity_score': np.random.randint(1, 5, n_samples),
        'district_economic_index': np.random.uniform(0.1, 0.9, n_samples),
        'govt_survey_income_category': np.random.choice(['A', 'B', 'C'], n_samples),
        
        # Labels
        'income_band': np.random.randint(1, 6, n_samples), # 1 to 5
        'district': np.random.choice(['Dist1', 'Dist2', 'Dist3'], n_samples)
    })
    
    return df

@pytest.fixture
def model(dummy_data):
    m = IncomeEstimationModel()
    
    X = dummy_data[m.features]
    # LightGBM requires 0-indexed classes internally
    y = dummy_data['income_band'] - 1 
    
    m.fit(X, y)
    return m

def test_geographic_stratified_split(dummy_data):
    m = IncomeEstimationModel()
    
    train, test = m.geographic_stratified_split(dummy_data, target_col='income_band', district_col='district', test_size=0.2)
    
    assert len(train) == 160
    assert len(test) == 40
    
    # Ensure all bands are present in both
    assert len(train['income_band'].unique()) == 5
    assert len(test['income_band'].unique()) == 5
    
    # Ensure all districts are present
    assert len(train['district'].unique()) == 3
    assert len(test['district'].unique()) == 3

def test_prediction_high_coverage(model, dummy_data):
    # Pass a row with all 5 features present (coverage = 1.0)
    row = dummy_data[model.features].iloc[[0]]
    
    result = model.predict(row)
    
    assert "predicted_band" in result
    assert 1 <= result["predicted_band"] <= 5
    assert len(result["probabilities"]) == 5
    assert result["signal_coverage"] == 1.0
    assert result["fallback_triggered"] is False

def test_prediction_pro_poor_fallback(model, dummy_data):
    # Pass a row with 4 out of 5 features missing (coverage = 0.2 < 0.4)
    row = dummy_data[model.features].iloc[[0]].copy()
    row['avg_monthly_electricity_units'] = np.nan
    row['avg_monthly_recharge_amount'] = np.nan
    row['utility_diversity_score'] = np.nan
    row['govt_survey_income_category'] = np.nan
    
    result = model.predict(row)
    
    # Fallback logic should instantly trigger EWS Band 1
    assert result["predicted_band"] == 1
    assert result["confidence"] == "LOW"
    assert result["probabilities"] == [1.0, 0.0, 0.0, 0.0, 0.0]
    assert result["signal_coverage"] == 0.2
    assert result["fallback_triggered"] is True
