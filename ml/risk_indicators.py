def compute_dpd_buckets(loan_history):
    """
    loan_history: list of dicts with 'days_past_due'
    """
    buckets = {
        "dpd_current": 0,
        "dpd_30": 0,
        "dpd_60": 0,
        "dpd_90_plus": 0
    }
    
    if not loan_history:
        return buckets
        
    for loan in loan_history:
        dpd = loan.get("days_past_due", 0)
        if dpd == 0:
            buckets["dpd_current"] += 1
        elif dpd <= 30:
            buckets["dpd_30"] += 1
        elif dpd <= 60:
            buckets["dpd_60"] += 1
        else:
            buckets["dpd_90_plus"] += 1
            
    return buckets

def comprehensive_dti(declared_income, emi, discovered_obligations=0):
    """
    Calculates DTI considering other discovered obligations.
    """
    total_obligations = emi + discovered_obligations
    return total_obligations / max(declared_income, 1)

def fraud_signals(application):
    """
    Basic synthetic fraud flags.
    """
    signals = []
    if application.get('declared_income', 0) > 100000 and application.get('asset_value', 0) < 5000:
        signals.append("income_expense_mismatch")
    
    # Check if age matches employment years etc.
    if application.get('age', 100) - application.get('employment_years', 0) < 18:
        signals.append("suspicious_employment_history")
        
    return signals
