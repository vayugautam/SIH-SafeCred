import os
import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

def generate_dataset(num_samples=5000, output_dir="data"):
    os.makedirs(output_dir, exist_ok=True)
    np.random.seed(42)
    random.seed(42)
    
    # 1. Applications
    data = []
    end_date = datetime(2025, 4, 1)
    start_date = end_date - timedelta(days=365*2) # 2 years of data
    
    states = ["Maharashtra", "UP", "Bihar", "Karnataka", "Tamil Nadu", "Delhi"]
    social_cats = ["General", "OBC", "SC", "ST"]
    genders = ["Male", "Female", "Other"]
    
    for i in range(num_samples):
        app_date = start_date + timedelta(days=random.randint(0, 365*2))
        
        income = np.random.lognormal(mean=9.5, sigma=0.5) # Median ~13k
        income = np.clip(income, 5000, 150000)
        
        # Correlated expenses & savings
        expenses = income * np.random.uniform(0.4, 0.9)
        savings = income * np.random.uniform(0.0, 0.4)
        assets = income * np.random.uniform(0, 20)
        
        loan_amount = income * np.random.uniform(0.5, 3.0)
        loan_amount = np.clip(loan_amount, 5000, 500000)
        
        social = np.random.choice(social_cats, p=[0.4, 0.3, 0.2, 0.1])
        is_socially_disadvantaged = social in ["SC", "ST", "OBC"]
        
        row = {
            "user_id": f"U{i:05d}",
            "application_id": f"APP{i:05d}",
            "application_date": app_date.strftime("%Y-%m-%d"),
            "declared_income": round(income, 2),
            "monthly_expenses": round(expenses, 2),
            "savings_balance": round(savings, 2),
            "asset_value": round(assets, 2),
            "loan_amount": round(loan_amount, 2),
            "tenure": random.choice([6, 12, 24, 36]),
            "age": random.randint(18, 65),
            "gender": np.random.choice(genders, p=[0.6, 0.38, 0.02]),
            "state": random.choice(states),
            "social_category": social,
            "is_socially_disadvantaged": is_socially_disadvantaged,
            "has_children": random.choice([True, False]),
            "guarantor_available": random.choice([True, False]),
            "purpose": random.choice(["Business", "Education", "Medical", "Home Repair"]),
            "mobile_age_months": random.randint(1, 120),
            "address_stability_years": random.randint(0, 20)
        }
        data.append(row)
        
    app_df = pd.DataFrame(data)
    app_df.to_csv(os.path.join(output_dir, "applications.csv"), index=False)
    
    # 2. Loan History
    loan_history = []
    for uid in app_df["user_id"]:
        num_loans = random.randint(0, 5)
        for _ in range(num_loans):
            repay_ratio = np.random.beta(a=8, b=2) # Left skewed, mostly good
            loan_history.append({
                "user_id": uid,
                "loan_id": f"L{random.randint(1000,9999)}",
                "loan_amount": round(random.uniform(5000, 100000), 2),
                "repayment_ratio": round(repay_ratio, 2),
                "defaulted": 1 if repay_ratio < 0.3 else 0,
                "closed": 1,
                "time_since_last_loan_months": random.randint(1, 48)
            })
    loan_df = pd.DataFrame(loan_history)
    loan_df.to_csv(os.path.join(output_dir, "loan_history.csv"), index=False)
    
    # 3. Target Labels (Realistic Default Generation)
    # Target = 1 (Good), 0 (Bad/Default)
    labels = []
    for idx, row in app_df.iterrows():
        # Heuristic probability of good repayment
        prob_good = 0.8 # Base
        
        dti = row["loan_amount"] / (row["tenure"] * max(row["declared_income"], 1))
        if dti > 0.6: prob_good -= 0.3
        elif dti > 0.4: prob_good -= 0.15
        
        # Adjust based on prior history if available
        user_loans = loan_df[loan_df["user_id"] == row["user_id"]]
        if not user_loans.empty:
            avg_repay = user_loans["repayment_ratio"].mean()
            prob_good += (avg_repay - 0.5) * 0.4
            
        if row["savings_balance"] / row["declared_income"] > 0.5:
            prob_good += 0.1
            
        prob_good = np.clip(prob_good, 0.05, 0.95)
        label = 1 if random.random() < prob_good else 0
        
        labels.append({
            "user_id": row["user_id"],
            "application_id": row["application_id"],
            "target": label, # 1=Good, 0=Bad
            "prob_good": round(prob_good, 3)
        })
        
    labels_df = pd.DataFrame(labels)
    labels_df.to_csv(os.path.join(output_dir, "labels.csv"), index=False)
    
    # Optional files like bank_data, recharge_data, etc. can be created similarly
    # Here we write dummy empty DFs or minimal rows to satisfy the script if needed
    
    print(f"✅ Generated {num_samples} realistic samples in {output_dir}")

if __name__ == "__main__":
    generate_dataset()
