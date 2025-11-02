"""
train_v2.py

Enhanced SafeCred training script with dynamic poverty barrier.

✅ Improvements:
- Derives poverty barrier dynamically using income + repayment + socio-economic data
- Stores barrier in model_metadata.json for use by scoring & frontend
- Auto-adjusts barrier upward for socially disadvantaged groups
- Includes weighted percentile logic for fairness
- Trains RandomForest baseline model
"""

import os
import joblib
import json
from datetime import datetime
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.preprocessing import StandardScaler

from features import build_feature_matrix
from scoring import compute_composite_score, aggregate_loan_history_metrics

ROOT = os.path.dirname(__file__)
DATA_DIR = os.path.join(ROOT, "data")
MODELS_DIR = os.path.join(ROOT, "models")
os.makedirs(MODELS_DIR, exist_ok=True)


def compute_dynamic_barrier(df: pd.DataFrame) -> float:
    """
    Computes dynamic 'poor income barrier' based on data distribution.

    Logic:
    1️⃣ Start from 35th percentile of declared income.
    2️⃣ Weight low-income applicants with good repayment behaviour higher.
    3️⃣ Adjust upward slightly if dataset contains socially disadvantaged groups.

    Returns a float (₹ barrier).
    """
    try:
        # Defensive check
        if "declared_income" not in df.columns or df["declared_income"].isna().all():
            print("⚠️ No declared_income found, using default ₹15000.")
            return 15000.0

        df["declared_income"] = pd.to_numeric(df["declared_income"], errors="coerce").fillna(0)

        # Weight = repayment reliability (if available)
        if "avg_prev_repayment_ratio" in df.columns:
            df["repay_weight"] = df["avg_prev_repayment_ratio"].fillna(0.5)
        else:
            df["repay_weight"] = 1.0

        # Weighted percentile (35th)
        sorted_df = df.sort_values("declared_income")
        cumsum = (sorted_df["repay_weight"] / sorted_df["repay_weight"].sum()).cumsum()
        cutoff_index = (cumsum - 0.35).abs().idxmin()
        barrier_value = sorted_df.loc[cutoff_index, "declared_income"]
        import numpy as np
        import datetime
        # Only allow int or float, not complex, date, timedelta, or None
        if isinstance(barrier_value, np.generic):
            value = barrier_value.item()
        else:
            value = barrier_value

        if isinstance(value, (int, float, np.integer, np.floating)):
            barrier = float(value)
        else:
            # fallback if value is not convertible
            print(f"⚠️ Invalid barrier value type: {type(value)}, using default ₹15000.")
            barrier = 15000.0

        # Adjust upward slightly if many socially disadvantaged users exist
        if "is_socially_disadvantaged" in df.columns:
            disadvantaged_ratio = df["is_socially_disadvantaged"].mean()
            if disadvantaged_ratio > 0.3:
                barrier *= (1 + 0.05 * disadvantaged_ratio)  # 1–5% bump

        barrier = round(barrier, -2)  # nearest ₹100
        print(f"✅ Dynamic Income Barrier computed: ₹{barrier}")
        return barrier

    except Exception as e:
        print(f"⚠️ Error computing dynamic barrier: {e}")
        return 15000.0


def train_and_save():
    # --- Step 1: Load datasets ---
    applications_path = os.path.join(DATA_DIR, "applications.csv")
    labels_path = os.path.join(DATA_DIR, "labels.csv")
    loan_history_path = os.path.join(DATA_DIR, "loan_history.csv")

    print("📂 Loading data ...")
    features_df = build_feature_matrix(applications_path)
    labels_df = pd.read_csv(labels_path)
    loan_df = pd.read_csv(loan_history_path) if os.path.exists(loan_history_path) else None

    # --- Step 2: Merge base labels ---
    df = features_df.merge(labels_df, on="user_id", how="left").fillna(0)

    # --- Step 3: Aggregate loan history metrics ---
    print("📊 Aggregating loan history metrics ...")
    agg_data = []
    for uid in df["user_id"]:
        agg = aggregate_loan_history_metrics(loan_df, uid) if loan_df is not None else {}
        agg["user_id"] = uid
        agg_data.append(agg)
    agg_df = pd.DataFrame(agg_data)
    df = df.merge(agg_df, on="user_id", how="left")

    # --- Step 4: Compute composite score (behavioral) ---
    print("🧮 Computing composite scores ...")
    composite_scores = []
    is_new_flags, has_bank_flags = [], []

    for _, row in df.iterrows():
        feats = row.to_dict()
        comp, breakdown = compute_composite_score(feats)
        composite_scores.append(comp)
        is_new_flags.append(breakdown.get("is_new_user", False))
        has_bank_flags.append(breakdown.get("has_bank_data", True))

    df["composite_score"] = composite_scores
    df["is_new_user"] = is_new_flags
    df["has_bank_data"] = has_bank_flags

    if "suspicion_score" in df.columns:
        df["suspicion_score"] = df["suspicion_score"].fillna(0)

    # --- Step 5: Compute dynamic income barrier ---
    print("\n📈 Calculating dynamic poor-income barrier ...")
    dynamic_barrier = compute_dynamic_barrier(df)

    # --- Step 6: Prepare training data ---
    print("🧠 Preparing training matrix ...")
    df.fillna(0, inplace=True)
    X = df.drop(columns=["user_id", "target"], errors="ignore")
    y = df["target"]

    X_numeric = X.select_dtypes(include=["number"])
    feature_names = list(X_numeric.columns)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_numeric)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )

    # --- Step 7: Train model ---
    print("🚀 Training RandomForest ...")
    clf = RandomForestClassifier(
        n_estimators=250,
        random_state=42,
        class_weight="balanced_subsample",
        n_jobs=-1
    )
    clf.fit(X_train, y_train)

    # --- Step 8: Evaluate model ---
    print("\n📊 Evaluation:")
    preds = clf.predict(X_test)
    probs = clf.predict_proba(X_test)[:, 1]

    print(classification_report(y_test, preds))
    print("ROC-AUC:", round(roc_auc_score(y_test, probs), 3))

    # --- Step 9: Save model artifacts ---
    model_path = os.path.join(MODELS_DIR, "safecred_model.pkl")
    scaler_path = os.path.join(MODELS_DIR, "scaler.pkl")
    meta_path = os.path.join(MODELS_DIR, "model_metadata.json")
    feature_path = os.path.join(MODELS_DIR, "feature_order.pkl")

    joblib.dump(clf, model_path)
    joblib.dump(scaler, scaler_path)
    joblib.dump(feature_names, feature_path)

    meta = {
        "version": "2.1.0",
        "model": "RandomForestClassifier",
        "train_time": datetime.now().isoformat(),
        "n_samples": len(df),
        "n_features": len(feature_names),
        "features": feature_names,
        "dynamic_income_barrier": dynamic_barrier,
        "logic": {
            "percentile_base": 35,
            "repayment_weight": True,
            "socio_adjustment": True
        }
    }

    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"\n✅ Model and metadata saved in {MODELS_DIR}")
    print(f"   • safecred_model.pkl")
    print(f"   • scaler.pkl")
    print(f"   • feature_order.pkl")
    print(f"   • model_metadata.json (includes data-driven barrier ₹{dynamic_barrier})")

    # --- Step 10: Sample verification ---
    print("\n🔍 Sample entries:")
    print(df[["user_id", "declared_income", "composite_score", "target"]].head())

    return model_path, scaler_path, meta_path, feature_path


if __name__ == "__main__":
    train_and_save()
