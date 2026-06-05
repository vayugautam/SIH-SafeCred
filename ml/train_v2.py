"""
train_v2.py

Enhanced SafeCred training script with dynamic poverty barrier.

✅ Improvements:
- Derives poverty barrier dynamically using income + repayment + socio-economic data
- Stores barrier in model_metadata.json for use by scoring & frontend
- Auto-adjusts barrier upward for socially disadvantaged groups
- Includes weighted percentile logic for fairness
- Trains RandomForest baseline model
- Computes derived features (debt_to_income, lifestyle_index, etc.) matching inference
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

    # --- Step 4b: Add derived features matching features_direct.py ---
    print("🔧 Computing derived features ...")

    # Repayment features from loan history aggregation
    if "previous_loans_count" not in df.columns:
        df["previous_loans_count"] = 0
    if "previous_defaults" not in df.columns:
        df["previous_defaults"] = 0
    if "avg_prev_repayment_ratio" not in df.columns:
        df["avg_prev_repayment_ratio"] = 0.5
    if "time_since_last_loan" not in df.columns:
        df["time_since_last_loan"] = 999

    # on_time_ratio and avg_payment_delay_days (derive from repayment ratio)
    if "on_time_ratio" not in df.columns:
        df["on_time_ratio"] = df["avg_prev_repayment_ratio"].fillna(0.5)
    if "avg_payment_delay_days" not in df.columns:
        df["avg_payment_delay_days"] = (1.0 - df["on_time_ratio"].fillna(0.5)) * 15.0

    # debt_to_income_ratio
    monthly_emi = df["loan_amount"] / df["tenure"].clip(lower=1)
    df["debt_to_income_ratio"] = (monthly_emi / df["declared_income"].clip(lower=1000)).round(3)

    # avg_monthly_saving
    df["avg_monthly_saving"] = df["declared_income"] - monthly_emi

    # lifestyle_index (proxy from available consumption data)
    recharge_signal = np.zeros(len(df))
    elec_signal = np.zeros(len(df))
    edu_signal = np.zeros(len(df))

    for col_prefix, signal_arr, divisor in [
        ("recharge_avg_recharge_amount", recharge_signal, 3600.0),
        ("elec_avg_amount", elec_signal, 2000.0),
        ("edu_avg_fee_amount", edu_signal, 5000.0),
    ]:
        if col_prefix in df.columns:
            signal_arr[:] = np.clip(df[col_prefix].fillna(0).values / divisor, 0, 1)

    df["lifestyle_index"] = (0.3 * recharge_signal + 0.4 * elec_signal + 0.3 * edu_signal).round(3)

    # suspicion_score
    _tmp_barrier = 15000.0
    if "suspicion_score" not in df.columns or df["suspicion_score"].sum() == 0:
        df["suspicion_score"] = np.where(
            df["declared_income"] < _tmp_barrier,
            np.clip(df["lifestyle_index"] * (_tmp_barrier / df["declared_income"].clip(lower=1000)), 0, 1),
            df["lifestyle_index"] * 0.5
        ).round(3)

    # --- Step 5: Compute dynamic income barrier ---
    print("\n📈 Calculating dynamic poor-income barrier ...")
    dynamic_barrier = compute_dynamic_barrier(df)

    # --- Step 6: Prepare training data ---
    print("🧠 Preparing training matrix ...")
    df.fillna(0, inplace=True)
    X = df.drop(columns=["user_id", "target", "repay_weight"], errors="ignore")
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
        "version": "2.2.0",
        "model": "RandomForestClassifier",
        "train_time": datetime.now().isoformat(),
        "n_samples": len(df),
        "n_features": len(feature_names),
        "features": feature_names,
        "dynamic_income_barrier": dynamic_barrier,
        "logic": {
            "percentile_base": 35,
            "repayment_weight": True,
            "socio_adjustment": True,
            "derived_features": [
                "debt_to_income_ratio",
                "avg_monthly_saving",
                "lifestyle_index",
                "suspicion_score",
                "on_time_ratio",
                "avg_payment_delay_days",
            ]
        }
    }

    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"\n✅ Model and metadata saved in {MODELS_DIR}")
    print(f"   • safecred_model.pkl")
    print(f"   • scaler.pkl")
    print(f"   • feature_order.pkl ({len(feature_names)} features)")
    print(f"   • model_metadata.json (includes data-driven barrier ₹{dynamic_barrier})")

    # --- Step 10: Sample verification ---
    print("\n🔍 Sample entries:")
    print(df[["user_id", "declared_income", "composite_score", "target"]].head())

    return model_path, scaler_path, meta_path, feature_path


if __name__ == "__main__":
    train_and_save()
