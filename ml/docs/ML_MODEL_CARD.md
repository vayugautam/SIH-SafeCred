# SafeCred ML Model Card

## Model Details
- **Model Type**: HistGradientBoosting
- **Version**: 1.0
- **Date Trained**: 2026-06-11T22:24:21.713765

## Intended Use
- **Primary Use Case**: Credit risk prediction for thin-file borrowers.
- **Out of Scope Use Cases**: High-income traditional underwriting.

## Training Data
- **Dataset Size**: 5000 samples
- **Split**: 4000 train / 1000 test
- **Temporal Split**: Used application date for out-of-time validation.

## Features
- Total Features: 16
- Note: `composite_score` was explicitly removed to prevent data leakage.

## Evaluation Metrics (Test Set)
- **ROC-AUC**: 0.641
- **Brier Score (Calibration)**: 0.0947
- **Gini Coefficient**: 0.283

## Fairness Analysis
The model was evaluated for fairness across demographic groups (Equal Opportunity and Demographic Parity).
{
  "False": {
    "approval_rate": 1.0,
    "tpr": 1.0,
    "fpr": 1.0,
    "count": 407
  },
  "True": {
    "approval_rate": 1.0,
    "tpr": 1.0,
    "fpr": 1.0,
    "count": 593
  }
}

## Limitations
- **Synthetic Data**: The current model is trained on a realistic but synthetic dataset.
- **Proxy Reliance**: Heavily relies on alternative data proxies which may shift over time.
