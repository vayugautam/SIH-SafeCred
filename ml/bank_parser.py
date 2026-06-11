import pandas as pd
import numpy as np

def extract_bank_features(transactions):
    """
    transactions: list of dicts with 'date', 'description', 'amount', 'type' (CREDIT/DEBIT), 'balance'
    Returns cash-flow features.
    """
    if not transactions:
        return {}
        
    df = pd.DataFrame(transactions)
    df['date'] = pd.to_datetime(df['date'])
    df['amount'] = pd.to_numeric(df['amount'])
    
    credits = df[df['type'].str.upper() == 'CREDIT']
    debits = df[df['type'].str.upper() == 'DEBIT']
    
    # 1. Income Volatility (CV of monthly credits)
    monthly_credits = credits.set_index('date').resample('M')['amount'].sum()
    income_volatility = monthly_credits.std() / monthly_credits.mean() if monthly_credits.mean() > 0 else 0
    
    # 2. Expense-to-income ratio
    total_credit = credits['amount'].sum()
    total_debit = debits['amount'].sum()
    expense_ratio = total_debit / total_credit if total_credit > 0 else 1.0
    
    # 3. Minimum balance days
    min_bal_days = (df['balance'] < 1000).sum()
    
    # 4. Bounced payments
    bounced_keywords = ['bounce', 'return', 'reversal', 'insufficient', 'penalty']
    bounced_count = df['description'].str.lower().apply(
        lambda x: any(k in x for k in bounced_keywords)
    ).sum()
    
    return {
        "income_volatility": round(income_volatility, 3),
        "expense_ratio": round(expense_ratio, 3),
        "min_balance_days": int(min_bal_days),
        "bounced_count": int(bounced_count),
        "avg_daily_balance": round(df['balance'].mean(), 2)
    }
