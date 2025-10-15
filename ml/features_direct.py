"""
features_direct.py

Direct feature extraction from user-provided data (frontend form)
instead of reading from offline CSV/JSON files.

This is used when user submits their data through the application form.
"""

def extract_features_from_application_data(application_data: dict) -> dict:
    """
    Extract features directly from application form data.
    MUST match exact feature names expected by the trained model!
    
    Args:
        application_data: Dictionary containing user's input data
        
    Returns:
        Dictionary with all features ready for ML model (41 features)
    """
    
    features = {}
    
    # ==================== BASIC INFO (from model feature_order) ====================
    features["declared_income"] = application_data.get("declared_income", 25000)
    features["loan_amount"] = application_data.get("loan_amount", 50000)
    features["tenure"] = application_data.get("tenure_months", 12)
    features["has_children"] = 1 if application_data.get("has_children", False) else 0
    features["socio_flag"] = 1 if application_data.get("is_socially_disadvantaged", False) else 0
    features["consent_recharge"] = 1 if application_data.get("consent_recharge", False) else 0
    features["consent_electricity"] = 1 if application_data.get("consent_electricity", False) else 0
    features["consent_education"] = 1 if application_data.get("consent_education", False) else 0
    
    # ==================== BANK STATEMENT DATA (aligned with model) ====================
    bank_data = application_data.get("bank_statement", {})
    declared_income = features["declared_income"]
    
    if bank_data and bank_data.get("monthly_credits"):
        features["bank_monthly_credits"] = bank_data.get("monthly_credits", declared_income)
        features["bank_salary_median"] = bank_data.get("monthly_credits", declared_income)
        features["bank_salary_std"] = bank_data.get("monthly_credits", 0) * 0.1  # 10% std
        features["bank_salary_missing_months"] = 0
        features["bank_expected_payments"] = 0
        features["bank_payments_made"] = 0
        features["bank_avg_balance"] = bank_data.get("avg_balance", declared_income * 0.5)
        features["bank_on_time_ratio"] = 1.0
        features["bank_num_months"] = 6
    else:
        # Defaults for new users
        features["bank_monthly_credits"] = declared_income
        features["bank_salary_median"] = declared_income
        features["bank_salary_std"] = declared_income * 0.1
        features["bank_salary_missing_months"] = 0
        features["bank_expected_payments"] = 0
        features["bank_payments_made"] = 0
        features["bank_avg_balance"] = declared_income * 0.5
        features["bank_on_time_ratio"] = 0.5
        features["bank_num_months"] = 3
    
    # ==================== RECHARGE DATA (aligned with model) ====================
    recharge_data = application_data.get("recharge_history", {})
    consent_recharge = features["consent_recharge"]
    
    if consent_recharge and recharge_data:
        features["recharge_recharge_count"] = recharge_data.get("frequency", 12)
        features["recharge_avg_recharge_amount"] = recharge_data.get("avg_amount", 300)
        features["recharge_median_recharge_amount"] = recharge_data.get("avg_amount", 300)
        features["recharge_last_recharge_days_ago"] = 15
        features["recharge_recharge_freq_per_month"] = recharge_data.get("frequency", 12) / 6.0
    else:
        features["recharge_recharge_count"] = 0
        features["recharge_avg_recharge_amount"] = 0
        features["recharge_median_recharge_amount"] = 0
        features["recharge_last_recharge_days_ago"] = 90
        features["recharge_recharge_freq_per_month"] = 0
    
    # ==================== ELECTRICITY DATA (aligned with model) ====================
    electricity_data = application_data.get("electricity_bills", {})
    consent_electricity = features["consent_electricity"]
    
    if consent_electricity and electricity_data:
        features["elec_bills_count"] = electricity_data.get("frequency", 6)
        features["elec_avg_units"] = electricity_data.get("avg_payment", 1000) / 6.0  # Assume ₹6/unit
        features["elec_avg_amount"] = electricity_data.get("avg_payment", 1000)
        features["elec_unpaid_count"] = 0
        features["elec_avg_payment_delay_days"] = 0
        features["elec_bill_consistency"] = electricity_data.get("consistency", 0.8)
    else:
        features["elec_bills_count"] = 0
        features["elec_avg_units"] = 0
        features["elec_avg_amount"] = 0
        features["elec_unpaid_count"] = 0
        features["elec_avg_payment_delay_days"] = 0
        features["elec_bill_consistency"] = 0.5
    
    # ==================== EDUCATION DATA (aligned with model) ====================
    education_data = application_data.get("education_fees", {})
    consent_education = features["consent_education"]
    has_children = features["has_children"]
    
    if consent_education and education_data and has_children:
        features["edu_avg_fee_amount"] = education_data.get("avg_fee", 5000)
        features["edu_fee_consistency"] = education_data.get("consistency", 0.8)
        features["edu_on_time_payment_ratio"] = education_data.get("ontime_ratio", 0.8)
        features["edu_records"] = education_data.get("frequency", 3)
    else:
        features["edu_avg_fee_amount"] = 0
        features["edu_fee_consistency"] = 0.5
        features["edu_on_time_payment_ratio"] = 0.5
        features["edu_records"] = 0
    
    # ==================== REPAYMENT HISTORY (aligned with model) ====================
    repayment_data = application_data.get("repayment_history", {})
    existing_loan_amt = application_data.get("existing_loan_amt", 0)
    
    if repayment_data or existing_loan_amt > 0:
        # Extract actual values from repayment history if provided
        features["on_time_ratio"] = repayment_data.get("on_time_ratio", 0.5)
        features["avg_payment_delay_days"] = repayment_data.get("avg_payment_delay_days", 0)
        features["previous_loans_count"] = repayment_data.get("previous_loans_count", 1 if existing_loan_amt > 0 else 0)
        features["previous_defaults"] = repayment_data.get("missed_count", 0)
        features["avg_prev_repayment_ratio"] = repayment_data.get("avg_repayment_ratio", 0.5)
        features["time_since_last_loan"] = repayment_data.get("time_since_last_loan", 12)  # Assume 12 months
    else:
        # New user - no loan history
        features["on_time_ratio"] = 0.5
        features["avg_payment_delay_days"] = 0
        features["previous_loans_count"] = 0
        features["previous_defaults"] = 0
        features["avg_prev_repayment_ratio"] = 0.5
        features["time_since_last_loan"] = 999  # Never had a loan
    
    # ==================== DERIVED FEATURES (aligned with model) ====================
    monthly_income = features["bank_monthly_credits"]
    loan_amount = features["loan_amount"]
    tenure = features["tenure"]
    
    # Debt-to-income ratio
    monthly_emi = loan_amount / max(1, tenure)  # Simple EMI calculation
    existing_payments = existing_loan_amt / 12.0 if existing_loan_amt > 0 else 0
    total_monthly_payment = monthly_emi + existing_payments
    features["debt_to_income_ratio"] = round(total_monthly_payment / max(1000, monthly_income), 3)
    
    # Average monthly saving
    features["avg_monthly_saving"] = monthly_income - total_monthly_payment
    
    # Lifestyle index
    recharge_signal = min(
        (features.get("recharge_avg_recharge_amount", 0) * features.get("recharge_recharge_count", 0)) / 3600.0,
        1.0
    )
    elec_signal = min(features.get("elec_avg_amount", 0) / 2000.0, 1.0)
    edu_signal = min(features.get("edu_avg_fee_amount", 0) / 5000.0, 1.0)
    
    lifestyle_index = round(0.3 * recharge_signal + 0.4 * elec_signal + 0.3 * edu_signal, 3)
    features["lifestyle_index"] = lifestyle_index
    
    # Suspicion score (income vs lifestyle mismatch)
    declared_income = features["declared_income"]
    if declared_income < 15000:
        features["suspicion_score"] = round(
            min(lifestyle_index * (15000 / max(1000, declared_income)), 1.0), 3
        )
    else:
        features["suspicion_score"] = round(lifestyle_index * 0.5, 3)
    
    # Composite score placeholder (will be calculated later)
    features["composite_score"] = 0
    
    return features


def validate_application_data(application_data: dict):
    """
    Validate that application data has minimum required fields.
    
    Returns:
        (is_valid: bool, error_message: str)
    """
    
    required_fields = ["declared_income", "loan_amount"]
    
    for field in required_fields:
        if field not in application_data or application_data[field] <= 0:
            return False, f"Missing or invalid required field: {field}"
    
    # Validate loan amount is reasonable
    loan_amount = application_data["loan_amount"]
    if loan_amount < 1000 or loan_amount > 100000:
        return False, "Loan amount must be between ₹1,000 and ₹1,00,000"
    
    # Validate income is reasonable
    declared_income = application_data["declared_income"]
    if declared_income < 1000:
        return False, "Declared income must be at least ₹1,000"
    
    return True, "Valid"
