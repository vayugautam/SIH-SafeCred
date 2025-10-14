# ml/scoring.py
"""
Scoring utilities for SafeCred.

Provides:
- compute_composite_score(features, training_stats=None)
- combine_ml_and_composite(ml_prob, composite_score, ml_weight=0.6)
- map_sci_to_riskband(final_sci, socio_flag, thresholds=(70,50))
- aggregate_loan_history_metrics(loan_history_df, user_id)

Features expected: numeric keys produced by your parsers/features:
  monthly_credits, salary_std, avg_balance, on_time_ratio,
  avg_payment_delay_days, bill_consistency, recharge_freq_per_month,
  avg_prev_repayment_ratio, previous_defaults, previous_loans_count,
  declared_income, socio_flag (0/1)
All missing values are handled gracefully.
"""

from typing import Dict, Optional, Tuple
import math

import numpy as np

# ---- Defaults / caps (tunable) ----
DEFAULT_CAPS = {
    "income_cap": 40000.0,      # 90th pct income proxy
    "std_cap": 20000.0,         # large std => unstable
    "balance_cap": 50000.0,     # buffer cap
    "delay_cap": 30.0,          # days
    "recharge_freq_cap": 10.0,  # per month
    "bill_consistency_cap": 1.0 # relative std (0..inf)
}

# Pillar weights (sum to 1.0)
PILLAR_WEIGHTS = {
    "financial": 0.35,
    "repayment": 0.30,
    "consumption": 0.20,
    "history": 0.15
}

def _safe_div(a, b, default=0.0):
    try:
        return a / b
    except Exception:
        return default

def _clip01(x: float) -> float:
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return 0.0
    return float(max(0.0, min(1.0, x)))

def compute_subscores(features: Dict, caps: Dict = None) -> Dict:
    """Compute normalized sub-scores (0..1) for pillars. Returns breakdown dict."""
    caps = caps or DEFAULT_CAPS

    # --- Financial Subcomponents ---
    monthly = features.get("monthly_credits")
    income_score = _clip01((monthly or 0.0) / caps["income_cap"])

    salary_std = features.get("salary_std")
    stability_score = 1.0 - _clip01((salary_std or 0.0) / caps["std_cap"])

    avg_balance = features.get("avg_balance")
    balance_score = _clip01((avg_balance or 0.0) / caps["balance_cap"])

    # --- Detect newcomer (no previous loans) ---
    prev_loans = features.get("previous_loans_count", 0)
    is_new_user = prev_loans == 0

    # --- Repayment Subcomponents ---
    if is_new_user:
        ontime_score = 0.5
        delay_score = 0.5
    else:
        on_time = features.get("on_time_ratio")
        ontime_score = _clip01(on_time if on_time is not None else 0.0)
        avg_delay = features.get("avg_payment_delay_days")
        delay_score = 1.0 - _clip01((avg_delay or 0.0) / caps["delay_cap"])

    # --- Consumption Subcomponents ---
    bill_consistency = features.get("bill_consistency")
    elec_consistency_score = 1.0 - _clip01((bill_consistency or 0.0) / caps["bill_consistency_cap"])
    recharge_freq = features.get("recharge_freq_per_month")
    recharge_score = _clip01((recharge_freq or 0.0) / caps["recharge_freq_cap"])

    # --- Education proxy (only active if user has children) ---
    has_children = features.get("has_children", 0)
    if has_children:
        edu_consistency = features.get("edu_fee_consistency", 0.5)
        edu_ontime = features.get("edu_on_time_payment_ratio", 0.5)
    else:
        edu_consistency, edu_ontime = 0.5, 0.5
    education_score = 0.6 * edu_consistency + 0.4 * edu_ontime

    # --- History Subcomponents ---
    prev_repay_ratio = features.get("avg_prev_repayment_ratio")
    history_score = _clip01(prev_repay_ratio if prev_repay_ratio is not None else 0.5)

    # --- Load dynamic income barrier safely ---
    import os, json
    ROOT = os.path.dirname(__file__)
    META_PATH = os.path.join(ROOT, "models", "model_metadata.json")
    try:
        with open(META_PATH, "r") as f:
            meta = json.load(f)
            barrier = float(meta.get("dynamic_income_barrier", 15000))
    except Exception:
        barrier = 15000  # fallback default

    # --- Adjust pillar weights based on income & data availability ---
    # 🎯 ENHANCED LOGIC: Different evaluation strategies for different income groups
    
    has_bank_data = bool(features.get("monthly_credits") and features.get("avg_balance"))
    income = features.get("monthly_credits") or features.get("declared_income", 0)
    loan_amount = features.get("loan_amount", 0)
    
    # Calculate loan-to-income ratio (important for all users)
    loan_to_income_ratio = _safe_div(loan_amount, income, default=0.0) if income > 0 else 0.0
    
    # Determine user segment
    user_segment = "unknown"
    
    if not has_bank_data:
        # 🆕 NEW USERS / NO BANK DATA
        # Strategy: Heavy reliance on alternative proxies + anti-fraud checks
        user_segment = "new_user_no_bank_data"
        pillar_weights_local = {
            "financial": 0.15,      # Limited financial data, use declared income
            "repayment": 0.10,      # No repayment history
            "consumption": 0.50,    # 🔥 HIGH weight on alternative proxies
            "history": 0.25         # Check for any previous loan patterns
        }
        
        # 🚨 ANTI-FRAUD: New users get penalty if loan amount is too high relative to income
        if loan_to_income_ratio > 0.5:  # Asking for >50% of monthly income
            fraud_risk_penalty = 0.20  # 20% penalty on composite score
        else:
            fraud_risk_penalty = 0.0
            
    elif income < barrier:
        # 🏚️ POOR / LOW-INCOME USERS (Below barrier, e.g., <₹15K/month)
        # Strategy: Evaluate through ALTERNATIVE PROXIES + Loan-to-Income Ratio
        user_segment = "low_income_alternative_proxies"
        pillar_weights_local = {
            "financial": 0.20,      # Basic income stability check
            "repayment": 0.20,      # Some repayment history if available
            "consumption": 0.45,    # 🔥 HIGH weight on alternative proxies (recharge, electricity, education)
            "history": 0.15         # Previous loan behavior
        }
        fraud_risk_penalty = 0.0
        
        # ✅ FAIR LENDING: If loan-to-income is reasonable (<30%), give bonus
        if loan_to_income_ratio < 0.3:
            fair_lending_bonus = 0.05  # 5% bonus
        else:
            fair_lending_bonus = 0.0
            
    else:
        # 💰 RICH / HIGH-INCOME USERS (Above barrier, e.g., ≥₹15K/month)
        # Strategy: Evaluate through REPAYMENT HISTORY + Loan-to-Income Ratio
        user_segment = "high_income_repayment_focused"
        pillar_weights_local = {
            "financial": 0.35,      # Income and stability matter
            "repayment": 0.50,      # 🔥 HIGH weight on repayment history
            "consumption": 0.05,    # Minimal weight on proxies (they can afford these)
            "history": 0.10         # Past loan performance
        }
        fraud_risk_penalty = 0.0
        fair_lending_bonus = 0.0
        
        # ✅ RESPONSIBLE LENDING: Penalty if asking for too much
        if loan_to_income_ratio > 1.0:  # Asking for more than monthly income
            fraud_risk_penalty = 0.15  # 15% penalty

    # --- Pillar-level scores ---
    financial_sub = (0.5 * income_score + 0.3 * stability_score + 0.2 * balance_score)
    repayment_sub = 0.5 * ontime_score + 0.5 * delay_score
    consumption_sub = (
        0.4 * elec_consistency_score +
        0.3 * recharge_score +
        0.3 * education_score
    ) if pillar_weights_local.get("consumption", 0) > 0 else 0.0
    history_sub = history_score
    
    # 🆕 LOAN-TO-INCOME SCORE (Important for all users)
    # Lower ratio = better (more responsible borrowing)
    if loan_to_income_ratio <= 0.3:
        loan_to_income_score = 1.0  # Excellent - asking for <30% of income
    elif loan_to_income_ratio <= 0.5:
        loan_to_income_score = 0.8  # Good - asking for 30-50% of income
    elif loan_to_income_ratio <= 0.8:
        loan_to_income_score = 0.5  # Moderate - asking for 50-80% of income
    elif loan_to_income_ratio <= 1.0:
        loan_to_income_score = 0.3  # High risk - asking for 80-100% of income
    else:
        loan_to_income_score = 0.1  # Very high risk - asking for >100% of income
    
    # Incorporate loan-to-income into financial pillar
    financial_sub = 0.7 * financial_sub + 0.3 * loan_to_income_score

    # --- Return all breakdowns ---
    return {
        "financial": _clip01(financial_sub),
        "repayment": _clip01(repayment_sub),
        "consumption": _clip01(consumption_sub),
        "history": _clip01(history_sub),
        "pillar_weights_used": pillar_weights_local,
        "is_new_user": is_new_user,
        "has_bank_data": has_bank_data,
        "income_barrier_used": barrier,
        "user_segment": user_segment,  # 🆕 Track which strategy was used
        "loan_to_income_ratio": round(loan_to_income_ratio, 3),  # 🆕 For transparency
        "fraud_risk_penalty": fraud_risk_penalty,  # 🆕 Anti-fraud adjustment
        "fair_lending_bonus": fair_lending_bonus if 'fair_lending_bonus' in locals() else 0.0,  # 🆕 Fair lending bonus
        "components": {
            "income_score": income_score,
            "stability_score": stability_score,
            "balance_score": balance_score,
            "ontime_score": ontime_score,
            "delay_score": delay_score,
            "elec_consistency_score": elec_consistency_score,
            "recharge_score": recharge_score,
            "edu_consistency": edu_consistency,
            "edu_ontime": edu_ontime,
            "education_score": education_score,
            "history_score": history_score,
            "loan_to_income_score": loan_to_income_score  # 🆕 New component
        }
    }

def compute_composite_score(features: Dict,
                            pillar_weights: Dict = None,
                            caps: Dict = None) -> Tuple[float, Dict]:
    """
    Compute composite score (0..100) and return breakdown.
    
    🎯 ENHANCED LOGIC:
    - Poor users: Evaluated via alternative proxies + loan-to-income
    - Rich users: Evaluated via repayment history + loan-to-income
    - New users: Anti-fraud checks + fair lending bonus
    
    If some pillars are missing, weights are rescaled among available pillars.
    """
    pillar_weights = pillar_weights or PILLAR_WEIGHTS
    caps = caps or DEFAULT_CAPS

    subs = compute_subscores(features, caps=caps)
    
    # Extract pillar scores
    available = {}
    for k in ["financial", "repayment", "consumption", "history"]:
        val = subs.get(k)
        if val is not None:
            available[k] = val

    # Get the dynamic weights from subscores
    dynamic_weights = subs.get("pillar_weights_used", pillar_weights)
    
    # Compute normalized weights across available pillars
    total_weight = sum(dynamic_weights.get(k, 0) for k in available.keys())
    if total_weight <= 0:
        # Fallback neutral score
        final_01 = 0.5
    else:
        final_01 = 0.0
        for k, s in available.items():
            w = dynamic_weights.get(k, 0.0)
            normalized_w = w / total_weight
            final_01 += s * normalized_w

    # 🆕 APPLY ADJUSTMENTS
    fraud_penalty = subs.get("fraud_risk_penalty", 0.0)
    fair_bonus = subs.get("fair_lending_bonus", 0.0)
    
    # Apply penalty (multiplicative - reduces score)
    final_01 = final_01 * (1.0 - fraud_penalty)
    
    # Apply bonus (additive - but capped at 1.0)
    final_01 = min(1.0, final_01 + fair_bonus)
    
    composite_score = round(final_01 * 100.0, 2)

    breakdown = {
        "composite_score": composite_score,
        "composite_score_01": final_01,
        "pillar_scores": {
            k: round(float(v), 4) 
            for k, v in subs.items() 
            if k in ["financial","repayment","consumption","history"]
        },
        "pillar_weights_used": dynamic_weights,  # 🆕 Show which weights were used
        "user_segment": subs.get("user_segment", "unknown"),  # 🆕 Evaluation strategy
        "loan_to_income_ratio": subs.get("loan_to_income_ratio", 0),  # 🆕 Risk indicator
        "fraud_risk_penalty": fraud_penalty,  # 🆕 Anti-fraud adjustment
        "fair_lending_bonus": fair_bonus,  # 🆕 Fair lending bonus
        "is_new_user": subs.get("is_new_user", False),
        "has_bank_data": subs.get("has_bank_data", False),
        "income_barrier": subs.get("income_barrier_used", 15000),
        "components": {k: float(v) for k, v in subs.get("components", {}).items()}
    }
    
    return composite_score, breakdown

def combine_ml_and_composite(ml_prob: float, composite_score: float, ml_weight: float = 0.6) -> Tuple[float, dict]:
    """
    Combine ML probability (0..1) and composite_score (0..100) into final SCI (0..100).
    ml_weight: fraction weight for ML probability; composite gets (1-ml_weight)
    Returns tuple of (final SCI as float (0..100), details dict).
    """
    ml_prob = float(ml_prob or 0.0)
    composite01 = float((composite_score or 0.0) / 100.0)
    final01 = ml_weight * ml_prob + (1.0 - ml_weight) * composite01
    final_sci = round(final01 * 100.0, 2)
    
    details = {
        "ml_probability": ml_prob,
        "composite_score": composite_score,
        "ml_weight": ml_weight,
        "composite_weight": 1.0 - ml_weight,
        "final_sci": final_sci
    }
    
    return final_sci, details

def map_sci_to_riskband(final_sci: float, socio_flag: int = 0, thresholds: Tuple[int, int] = (70, 50)) -> Tuple[str, str]:
    """
    Map final SCI to risk bands with Need (socio_flag).
    thresholds: (low_risk_threshold, medium_risk_threshold)
    Returns tuple of (risk_band, need_label) e.g., ("Low Risk", "High Need")
    """
    high_thr, med_thr = thresholds
    need = "High Need" if int(socio_flag) else "Low Need"
    if final_sci >= high_thr:
        band = "Low Risk"
    elif final_sci >= med_thr:
        band = "Medium Risk"
    else:
        band = "High Risk"
    return band, need

# Optional helper to aggregate loan history DataFrame for a user
def aggregate_loan_history_metrics(loan_history_df, user_id):
    """
    loan_history_df: pandas DataFrame with columns user_id, defaulted (0/1), timely (0/1), utilization (0..1), amount, loan_id
    Returns dict with previous_loans_count, previous_defaults, avg_prev_repayment_ratio, time_since_last_loan (days or None)
    """
    try:
        import pandas as pd
    except Exception:
        pd = None

    if loan_history_df is None or pd is None:
        return {
            "previous_loans_count": 0,
            "previous_defaults": 0,
            "avg_prev_repayment_ratio": None,
            "time_since_last_loan": None
        }
    df = loan_history_df[loan_history_df["user_id"] == user_id]
    if df.shape[0] == 0:
        return {
            "previous_loans_count": 0,
            "previous_defaults": 0,
            "avg_prev_repayment_ratio": None,
            "time_since_last_loan": None
        }
    prev_loans = int(df.shape[0])
    prev_defaults = int(df["defaulted"].sum()) if "defaulted" in df.columns else 0
    # repayment ratio: timely / total
    prepaid = int(df["timely"].sum()) if "timely" in df.columns else None
    avg_prev_repayment_ratio = None
    if prepaid is not None:
        avg_prev_repayment_ratio = _safe_div(prepaid, prev_loans, default=None)
    # time since last loan: if loan_id contains date or if there's a loan_date column
    if "loan_date" in df.columns:
        last_date = pd.to_datetime(df["loan_date"]).max()
        time_since_last = (pd.Timestamp.now() - last_date).days
    else:
        time_since_last = None

    return {
        "previous_loans_count": prev_loans,
        "previous_defaults": prev_defaults,
        "avg_prev_repayment_ratio": float(avg_prev_repayment_ratio) if avg_prev_repayment_ratio is not None else None,
        "time_since_last_loan": int(time_since_last) if time_since_last is not None else None
    }
