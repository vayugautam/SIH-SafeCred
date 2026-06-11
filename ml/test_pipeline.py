import pytest
import numpy as np
import pandas as pd
from ml.pipeline import ProductionCreditModel
from sklearn.datasets import make_classification

@pytest.fixture
def dummy_data():
    X_num, y = make_classification(n_samples=200, n_features=3, n_informative=2, random_state=42)
    
    df = pd.DataFrame(X_num, columns=['num1', 'num2', 'num3'])
    
    # Introduce NaNs to test Missing Flags (add_indicator=True)
    df.loc[0:20, 'num1'] = np.nan 
    
    # Add Categoricals
    df['cat_high'] = np.random.choice(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] * 10, size=200) # Simulating high cardinal
    df['cat_low'] = np.random.choice(['Y', 'N'], size=200)
    
    return df, pd.Series(y)

@pytest.fixture
def model():
    return ProductionCreditModel(
        numeric_features=['num1', 'num2', 'num3'],
        cat_high_card=['cat_high'],
        cat_low_card=['cat_low']
    )

def test_preprocessing_missing_flags(model, dummy_data):
    X, _ = dummy_data
    
    # Fit preprocessor
    preprocessor = model.pipeline.named_steps['preprocessor']
    X_trans = preprocessor.fit_transform(X, pd.Series(np.zeros(200))) # target needed for TargetEncoder
    
    # 3 num + 1 missing_flag + 1 cat_high + 1 cat_low = 6 columns
    assert X_trans.shape[1] == 6

def test_pipeline_fit_and_score(model, dummy_data):
    X, y = dummy_data
    
    # We will fit the pipeline using the inner model to skip MLFlow run/tracking overhead in unit test
    model.pipeline.fit(X, y)
    
    # Generate scores
    scores = model.predict_score(X)
    
    # Verify shape
    assert len(scores) == 200
    
    # Verify 0-1000 scaling and integer type
    assert np.issubdtype(scores.dtype, np.integer)
    assert all(0 <= s <= 1000 for s in scores)

def test_ks_statistic(model):
    y_true = np.array([1, 1, 0, 0])
    y_prob = np.array([0.9, 0.8, 0.2, 0.1])
    
    ks = model.calculate_ks_statistic(y_true, y_prob)
    
    # Perfect separation means KS = 1.0
    assert ks == 1.0
