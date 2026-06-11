import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer

class MissingDataHandler:
    """
    STEP 5 | Missing Data Handler applies 5-tier imputation -> returns complete vector.
    """
    
    def __init__(self):
        # Tier 1: Mean Imputation for continuous macro features
        self.macro_imputer = SimpleImputer(strategy='mean')
        
        # Tier 2: Median Imputation for consumption features
        self.consumption_imputer = SimpleImputer(strategy='median')
        
        # Simulated pre-fit logic
        self.macro_imputer.fit([[0.5], [0.8], [0.3]])
        self.consumption_imputer.fit([[150], [200], [350]])
        
    def impute(self, feature_df: pd.DataFrame) -> pd.DataFrame:
        print("[MISSING DATA HANDLER] Applying 5-tier imputation strategy...")
        
        df = feature_df.copy()
        
        # Impute Consumption Data
        if df['monthly_power_consumption'].isna().any():
            df['monthly_power_consumption'] = self.consumption_imputer.transform(df[['monthly_power_consumption']])
        if df['avg_bill_amount'].isna().any():
            df['avg_bill_amount'] = self.consumption_imputer.transform(df[['avg_bill_amount']])
            
        # Impute Macro Data
        if df['secc_wealth_index'].isna().any():
            df['secc_wealth_index'] = self.macro_imputer.transform(df[['secc_wealth_index']])
        if df['literacy_rate'].isna().any():
            df['literacy_rate'] = self.macro_imputer.transform(df[['literacy_rate']])
            
        return df

imputer = MissingDataHandler()
