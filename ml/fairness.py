import pandas as pd
import numpy as np

def compute_fairness_metrics(y_true, y_pred, sensitive_attributes):
    """
    Computes fairness metrics across sensitive groups.
    sensitive_attributes: pd.Series
    Returns a dictionary of metrics per group.
    """
    df = pd.DataFrame({
        "y_true": y_true,
        "y_pred": y_pred,
        "group": sensitive_attributes
    })
    
    metrics = {}
    for group in df["group"].unique():
        group_df = df[df["group"] == group]
        if len(group_df) == 0: continue
        
        tp = ((group_df["y_true"] == 1) & (group_df["y_pred"] == 1)).sum()
        fp = ((group_df["y_true"] == 0) & (group_df["y_pred"] == 1)).sum()
        tn = ((group_df["y_true"] == 0) & (group_df["y_pred"] == 0)).sum()
        fn = ((group_df["y_true"] == 1) & (group_df["y_pred"] == 0)).sum()
        
        approval_rate = (tp + fp) / len(group_df)
        tpr = tp / (tp + fn) if (tp + fn) > 0 else 0 # Equal opportunity
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0 # Equalized odds component
        
        group_key = str(group)
        metrics[group_key] = {
            "approval_rate": round(approval_rate, 3),
            "tpr": round(tpr, 3),
            "fpr": round(fpr, 3),
            "count": len(group_df)
        }
        
    return metrics
