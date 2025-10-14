"""
features_direct.py

Direct feature extraction from user-provided data (frontend form)
instead of reading from offline CSV/JSON files.

This is used when user submits their data through the application form.
"""

def extract_features_from_application_data(application_data: dict) -> dict:
    """
    Extract features directly from application form data.
    
    Args:
        application_data: Dictionary containing user's input data
        
    Returns:
        Dictionary with all features ready for ML model
    """
    
    features = {}
    
    # ==================== BASIC INFO ====================
    features["declared_income"] = application_data.get("declared_income", 0)
    features["loan_amount"] = application_data.get("loan_amount", 0)
    features["age"] = application_data.get("age", 0)
    features["has_children"] = application_data.get("has_children", 0)
    features["socio_flag"] = application_data.get("socio_flag", 0)
    features["existing_loan_amt"] = application_data.get("existing_loan_amt", 0)
    features["dependents"] = application_data.get("dependents", 0)
    
    # ==================== BANK STATEMENT DATA ====================
    # If user provided bank statement data
    bank_data = application_data.get("bank_statement", {})
    
    if bank_data:
        features["monthly_credits"] = bank_data.get("monthly_credits", 0)
        features["avg_balance"] = bank_data.get("avg_balance", 0)
        features["total_debits"] = bank_data.get("total_debits", 0)
        features["salary_count"] = bank_data.get("salary_count", 0)
        features["bank_bounce_count"] = bank_data.get("bounce_count", 0)
        features["bank_total_credits"] = bank_data.get("total_credits", 0)
        features["bank_total_debits"] = bank_data.get("total_debits", 0)
        features["bank_avg_balance"] = bank_data.get("avg_balance", 0)
        features["bank_salary_credits"] = bank_data.get("salary_count", 0)
    else:
        # No bank data - user is new or didn't provide
        features["monthly_credits"] = None
        features["avg_balance"] = None
        features["total_debits"] = None
        features["salary_count"] = 0
        features["bank_bounce_count"] = 0
    
    # ==================== RECHARGE DATA ====================
    recharge_data = application_data.get("recharge_history", {})
    consent_recharge = application_data.get("consent_recharge", 0)
    
    if consent_recharge and recharge_data:
        features["recharge_total_amount"] = recharge_data.get("total_amount", 0)
        features["recharge_frequency"] = recharge_data.get("frequency", 0)
        features["recharge_avg_amount"] = recharge_data.get("avg_amount", 0)
        features["recharge_consistency"] = recharge_data.get("consistency", 0.5)
        features["recharge_count"] = recharge_data.get("recharge_count", 0)
    else:
        features["recharge_total_amount"] = 0
        features["recharge_frequency"] = 0
        features["recharge_avg_amount"] = 0
        features["recharge_consistency"] = 0.5
        features["recharge_count"] = 0
    
    # ==================== ELECTRICITY DATA ====================
    electricity_data = application_data.get("electricity_bills", {})
    consent_electricity = application_data.get("consent_electricity", 0)
    
    if consent_electricity and electricity_data:
        features["electricity_total_paid"] = electricity_data.get("total_paid", 0)
        features["electricity_payment_frequency"] = electricity_data.get("frequency", 0)
        features["electricity_avg_payment"] = electricity_data.get("avg_payment", 0)
        features["electricity_consistency"] = electricity_data.get("consistency", 0.5)
        features["electricity_ontime_ratio"] = electricity_data.get("ontime_ratio", 0.5)
    else:
        features["electricity_total_paid"] = 0
        features["electricity_payment_frequency"] = 0
        features["electricity_avg_payment"] = 0
        features["electricity_consistency"] = 0.5
        features["electricity_ontime_ratio"] = 0.5
    
    # ==================== EDUCATION DATA ====================
    education_data = application_data.get("education_fees", {})
    consent_education = application_data.get("consent_education", 0)
    has_children = features.get("has_children", 0)
    
    if consent_education and education_data and has_children:
        features["education_total_fees_paid"] = education_data.get("total_paid", 0)
        features["education_payment_frequency"] = education_data.get("frequency", 0)
        features["education_avg_fee"] = education_data.get("avg_fee", 0)
        features["edu_fee_consistency"] = education_data.get("consistency", 0.5)
        features["edu_on_time_payment_ratio"] = education_data.get("ontime_ratio", 0.5)
    else:
        # Neutralize education data if no children or no consent
        features["education_total_fees_paid"] = 0
        features["education_payment_frequency"] = 0
        features["education_avg_fee"] = 0
        features["edu_fee_consistency"] = 0.5
        features["edu_on_time_payment_ratio"] = 0.5
    
    # ==================== REPAYMENT HISTORY ====================
    repayment_data = application_data.get("repayment_history", {})
    
    if repayment_data:
        features["repay_ontime_count"] = repayment_data.get("ontime_count", 0)
        features["repay_late_count"] = repayment_data.get("late_count", 0)
        features["repay_missed_count"] = repayment_data.get("missed_count", 0)
        features["avg_prev_repayment_ratio"] = repayment_data.get("avg_repayment_ratio", 0.5)
    else:
        # New user - no repayment history
        features["repay_ontime_count"] = 0
        features["repay_late_count"] = 0
        features["repay_missed_count"] = 0
        features["avg_prev_repayment_ratio"] = 0.5
    
    # ==================== DERIVED FEATURES ====================
    monthly_income = features.get("monthly_credits") or features.get("declared_income", 0)
    loan_amount = features.get("loan_amount", 0)
    
    # Debt-to-income ratio
    expected_payments = features.get("existing_loan_amt", 0) / 12.0  # Monthly payment estimate
    features["debt_to_income_ratio"] = expected_payments / max(1.0, monthly_income)
    features["avg_monthly_saving"] = monthly_income - expected_payments
    
    # Lifestyle index
    recharge_signal = min(
        (features.get("recharge_avg_amount", 0) * features.get("recharge_count", 0)) / 1000.0,
        1.0
    )
    elec_signal = min(features.get("electricity_avg_payment", 0) / 2000.0, 1.0)
    edu_signal = min(features.get("education_avg_fee", 0) / 3000.0, 1.0)
    
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
    
    return features


def validate_application_data(application_data: dict) -> tuple[bool, str]:
    """
    Validate that application data has minimum required fields.
    
    Returns:
        (is_valid, error_message)
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
