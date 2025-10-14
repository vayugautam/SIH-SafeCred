"""
train_v2.py

Enhanced SafeCred training script.

✅ New features:
- Integrates loan_history.csv (repeat borrower metrics)
- Includes composite score computation per user
- Saves model, scaler, and feature_order.pkl for inference alignment
- Handles missing values gracefully
- Prints evaluation metrics and sample scores

Model: RandomForestClassifier baseline (can easily switch to LightGBM)
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
    is_new_flags = []
    has_bank_flags = []

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


    # --- Step 5: Prepare training data ---
    print("🧠 Preparing training matrix ...")
    df.fillna(0, inplace=True)
    X = df.drop(columns=["user_id", "target"], errors="ignore")
    y = df["target"]

    # numeric-only features
    X_numeric = X.select_dtypes(include=["number"])
    feature_names = list(X_numeric.columns)

    # --- Step 6: Scaling ---
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_numeric)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )

    # --- Step 7: Train model ---
    print("🚀 Training RandomForest ...")
    clf = RandomForestClassifier(
        n_estimators=250,
        max_depth=None,
        random_state=42,
        class_weight="balanced_subsample",
        n_jobs=-1
    )
    clf.fit(X_train, y_train)

        # --- Step 8: Evaluate model ---
    print("\n📈 Evaluation:")
    preds = clf.predict(X_test)
    probs = clf.predict_proba(X_test)[:, 1]

    print(classification_report(y_test, preds))
    print("ROC-AUC:", round(roc_auc_score(y_test, probs), 3))

    # --- Step 9: Compute dynamic income barrier (self-learning boundary) ---
    income_values = df["declared_income"].fillna(0).values
    dynamic_barrier = float(np.percentile(income_values, 35))  # 35th percentile = cutoff for "poor"
    print(f"Dynamic Income Barrier (35th percentile): ₹{round(dynamic_barrier, 2)}")

    # --- Step 10: Save model artifacts ---
    model_path = os.path.join(MODELS_DIR, "safecred_model.pkl")
    scaler_path = os.path.join(MODELS_DIR, "scaler.pkl")
    meta_path = os.path.join(MODELS_DIR, "model_metadata.json")
    feature_path = os.path.join(MODELS_DIR, "feature_order.pkl")

    joblib.dump(clf, model_path)
    joblib.dump(scaler, scaler_path)
    joblib.dump(feature_names, feature_path)

    # ✅ Single meta dictionary with dynamic barrier included
    meta = {
        "version": "2.0.0",
        "model": "RandomForest",
        "train_time": datetime.now().isoformat(),
        "features": feature_names,
        "n_samples": len(df),
        "n_features": len(feature_names),
        "dynamic_income_barrier": dynamic_barrier  # 🔥 kept safely here
    }

    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"\n✅ Model and artifacts saved in {MODELS_DIR}")
    print(f"   - safecred_model.pkl")
    print(f"   - scaler.pkl")
    print(f"   - feature_order.pkl ({len(feature_names)} features)")
    print(f"   - model_metadata.json (includes dynamic income barrier)")

    # --- Step 11: Sample output ---
    print("\n🔍 Sample scores:")
    print(df[["user_id", "composite_score", "target"]].head())

    return model_path, scaler_path, meta_path, feature_path


if __name__ == "__main__":
    train_and_save()
