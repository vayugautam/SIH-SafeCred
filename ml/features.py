# features.py
# Feature engineering for SafeCred ML pipeline

import pandas as pd

def build_feature_matrix(applications_path: str) -> pd.DataFrame:
    """
    Loads application data and constructs feature matrix for model training.
    Extend this function with additional feature engineering as needed.
    """
    df = pd.read_csv(applications_path)
    # Example: Add more feature engineering here
    return df
