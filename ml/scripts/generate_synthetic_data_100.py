# ml/scripts/generate_synthetic_data_100.py
"""
Generate synthetic dataset for 100 diverse beneficiaries:
- applications.csv (user info + consent + children)
- labels.csv (good/bad borrowers)
- loan_history.csv (repeat borrowers)
- per-user proxy data:
    bank_statements/{id}.csv
    recharge/{id}.json
    electricity/{id}.json
    education_fees/{id}.json
"""

import os
import json
import random
from datetime import datetime, timedelta
from faker import Faker
import numpy as np
import pandas as pd
from pathlib import Path

# ----------------- Setup Paths -----------------
BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
BANK_DIR = DATA_DIR / "bank_statements"
RECH_DIR = DATA_DIR / "recharge"
ELEC_DIR = DATA_DIR / "electricity"
EDU_DIR = DATA_DIR / "education_fees"

for d in (DATA_DIR, BANK_DIR, RECH_DIR, ELEC_DIR, EDU_DIR):
    d.mkdir(parents=True, exist_ok=True)

# ----------------- Configuration -----------------
fake = Faker()
random.seed(42)
np.random.seed(42)
N = 100  # ✅ smaller dataset for testing

# ----------------- Helper Generators -----------------
def synth_bank_history(user_id, months=12):
    base_income = int(max(4000, np.random.normal(15000, 8000)))
    irregular = np.random.rand() < 0.15
    rows, balance = [], max(0, base_income * 1.2)

    for m in range(months):
        salary = int(np.clip(np.random.normal(base_income, base_income * 0.25), 0, None))
        if irregular and random.random() < 0.25:
            salary = 0
        emi = int(max(0, np.random.normal(base_income * 0.15, base_income * 0.05)))
        bills = int(max(0, np.random.normal(base_income * 0.08, base_income * 0.03)))
        balance = balance + salary - emi - bills + int(np.random.normal(0, 500))
        rows.append({
            "date": (datetime.now() - timedelta(days=30 * (months - m))).strftime("%Y-%m-%d"),
            "salary_credit": salary,
            "emi_debit": emi,
            "bill_debit": bills,
            "closing_balance": int(balance)
        })
    return rows


def synth_recharge(user_id):
    n = random.choices(range(0, 10), weights=[1, 2, 3, 5, 10, 12, 15, 15, 10, 7])[0]
    events = []
    for _ in range(n):
        date = (datetime.now() - timedelta(days=random.randint(0, 360))).strftime("%Y-%m-%d")
        amount = random.choice([49, 99, 149, 199, 299, 399, 499])
        events.append({"date": date, "amount": amount})
    return sorted(events, key=lambda x: x["date"])


def synth_electricity(user_id):
    n = random.randint(6, 12)
    records = []
    for i in range(n):
        date = (datetime.now() - timedelta(days=30 * (n - i))).strftime("%Y-%m-%d")
        units = max(50, int(np.random.normal(250, 120)))
        amount = max(100, int(units * np.random.uniform(3.0, 6.0)))
        paid = random.random() > 0.1  # 10% unpaid bills
        delay = 0 if paid else random.randint(5, 60)
        records.append({
            "date": date,
            "units": units,
            "amount": amount,
            "paid": paid,
            "payment_delay_days": delay
        })
    return records


def synth_education_fees(user_id):
    n = random.randint(3, 6)
    records = []
    for i in range(n):
        date = (datetime.now() - timedelta(days=30 * (n - i))).strftime("%Y-%m-%d")
        amount = int(np.random.normal(1500, 500))
        paid_on_time = random.random() > 0.1
        records.append({
            "date": date,
            "amount": amount,
            "paid_on_time": paid_on_time
        })
    return records


def synth_loan_history(user_id):
    count = random.choices([0, 1, 2, 3], weights=[40, 30, 20, 10])[0]
    loans = []
    for i in range(count):
        amount = int(max(1000, np.random.normal(15000, 10000)))
        tenure = random.choice([6, 12, 24, 36])
        defaulted = random.random() < 0.1
        utilization = round(np.clip(np.random.normal(0.9, 0.15), 0.3, 1.0), 2)
        loans.append({
            "loan_id": f"{user_id}-{i+1}",
            "amount": amount,
            "tenure": tenure,
            "defaulted": int(defaulted),
            "timely": int(not defaulted),
            "utilization": utilization
        })
    return loans


# ----------------- Main Generation -----------------
apps, labels, loan_history_rows = [], [], []

for user_id in range(1, N + 1):
    socio_flag = random.random() < 0.35
    declared_income = int(max(3000, np.random.normal(14000 if not socio_flag else 9000, 7000)))
    loan_amount = int(max(2000, np.random.normal(12000 if not socio_flag else 8000, 8000)))
    tenure = random.choice([6, 12, 24, 36])
    has_children = random.random() < 0.6

    consent_recharge = random.random() < 0.8
    consent_electricity = random.random() < 0.75
    consent_education = has_children and (random.random() < 0.7)

    # --- Generate per-user data ---
    months = random.choice([6, 12, 18])
    bank_rows = synth_bank_history(user_id, months)
    pd.DataFrame(bank_rows).to_csv(BANK_DIR / f"{user_id}.csv", index=False)

    if consent_recharge:
        with open(RECH_DIR / f"{user_id}.json", "w") as f:
            json.dump(synth_recharge(user_id), f)
    if consent_electricity:
        with open(ELEC_DIR / f"{user_id}.json", "w") as f:
            json.dump(synth_electricity(user_id), f)
    if has_children and consent_education:
        with open(EDU_DIR / f"{user_id}.json", "w") as f:
            json.dump(synth_education_fees(user_id), f)

    # --- Loan history ---
    loans = synth_loan_history(user_id)
    for l in loans:
        loan_history_rows.append({
            "user_id": user_id,
            **l
        })

    # --- Target Label ---
    income_median = np.median([r["salary_credit"] for r in bank_rows])
    past_defaults = sum(l["defaulted"] for l in loans)
    unpaid_elec = 0
    if consent_electricity:
        unpaid_elec = sum(1 for r in synth_electricity(user_id) if not r["paid"])
    risk_score = 0.3 * (1 if income_median < 8000 else 0) + 0.3 * past_defaults + 0.2 * unpaid_elec
    prob_bad = min(0.95, risk_score * 0.4 + random.random() * 0.2)
    label = 0 if random.random() < prob_bad else 1

    apps.append({
        "user_id": user_id,
        "declared_income": declared_income,
        "loan_amount": loan_amount,
        "tenure": tenure,
        "socio_flag": int(socio_flag),
        "has_children": int(has_children),
        "consent_recharge": int(consent_recharge),
        "consent_electricity": int(consent_electricity),
        "consent_education": int(consent_education)
    })
    labels.append({"user_id": user_id, "target": label})

# ----------------- Save Outputs -----------------
pd.DataFrame(apps).to_csv(DATA_DIR / "applications.csv", index=False)
pd.DataFrame(labels).to_csv(DATA_DIR / "labels.csv", index=False)
pd.DataFrame(loan_history_rows).to_csv(DATA_DIR / "loan_history.csv", index=False)

print(f"✅ Generated {N} diverse synthetic users under {DATA_DIR}")
