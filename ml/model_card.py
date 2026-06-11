import json
import os
from datetime import datetime

def generate_model_card(metrics_path, output_path="docs/ML_MODEL_CARD.md"):
    if not os.path.exists(metrics_path):
        print(f"Metrics file not found: {metrics_path}")
        return
        
    with open(metrics_path, "r") as f:
        metrics = json.load(f)
        
    card = f"""# SafeCred ML Model Card

## Model Details
- **Model Type**: {metrics.get("selected_model", "Unknown")}
- **Version**: {metrics.get("version", "1.0")}
- **Date Trained**: {metrics.get("training_date", datetime.now().isoformat())}

## Intended Use
- **Primary Use Case**: Credit risk prediction for thin-file borrowers.
- **Out of Scope Use Cases**: High-income traditional underwriting.

## Training Data
- **Dataset Size**: {metrics.get("dataset", {}).get("n_samples", 0)} samples
- **Split**: {metrics.get("dataset", {}).get("n_train", 0)} train / {metrics.get("dataset", {}).get("n_test", 0)} test
- **Temporal Split**: Used application date for out-of-time validation.

## Features
- Total Features: {metrics.get("n_features", 0)}
- Note: `composite_score` was explicitly removed to prevent data leakage.

## Evaluation Metrics (Test Set)
- **ROC-AUC**: {metrics.get("metrics", {}).get("roc_auc", "N/A")}
- **Brier Score (Calibration)**: {metrics.get("metrics", {}).get("brier_score", "N/A")}
- **Gini Coefficient**: {metrics.get("metrics", {}).get("gini", "N/A")}

## Fairness Analysis
The model was evaluated for fairness across demographic groups (Equal Opportunity and Demographic Parity).
{json.dumps(metrics.get("fairness_metrics", {}), indent=2)}

## Limitations
- **Synthetic Data**: The current model is trained on a realistic but synthetic dataset.
- **Proxy Reliance**: Heavily relies on alternative data proxies which may shift over time.
"""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        f.write(card)
    print(f"✅ Model card generated at {output_path}")

if __name__ == "__main__":
    generate_model_card("models/evaluation_report.json")
