# SafeCred Platform
— AI-Assisted Credit Scoring for NBCFDC Microfinance

> Transparent, consent-driven credit scoring for concessional lending to underserved populations — built for **Smart India Hackathon 2025**.

---

## 🎯 What SafeCred Does

SafeCred replaces traditional credit-bureau-only scoring with a **composite beneficiary scoring** system designed for India's informal-economy borrowers who lack formal credit histories. It evaluates applicants using:

- **Consumption proxies** — mobile recharge patterns, electricity bill consistency, education fee payments
- **Bank statement analysis** — salary regularity, average balance, payment behaviour
- **ML probability** — RandomForest model trained on historical application + repayment data
- **Composite scoring** — weighted pillar scores (financial, repayment, consumption, history) combined into a 0–100 SafeCred Index (SCI)
- **Agentic AI review** — LLM-powered loan officer agent generates human-readable explanations

The system is designed around NBCFDC's non-profit, zero-interest concessional lending model.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and **npm**
- **Python 3.10+** with pip
- **PostgreSQL** (or a Neon serverless instance)

### All-in-One Start
```powershell
.\START.ps1
```

### Manual Start (3 terminals)

**Terminal 1 — ML Scoring Service (Port 8002)**
```bash
cd ml
pip install -r requirements_ml.txt
python application_api.py
```

**Terminal 2 — Backend Setup (Express API on Port 3001)**
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

**Terminal 3 — Frontend Setup (React Vite on Port 5173)**
```bash
cd frontend
npm install
npm run dev
```

**Open the app:** http://localhost:5173

---

## 📂 Project Structure

```
SIH-SafeCred/
├── frontend/                   # React + Vite (primary frontend)
│   ├── src/                    # React components and hooks
│   └── package.json
│
├── ml/                         # Python ML scoring service (FastAPI)
│   ├── application_api.py      # Main API — POST /apply_direct
│   ├── scoring.py              # Composite scoring engine (4 pillars)
│   ├── features_direct.py      # Feature extraction from application data
│   ├── models_enhanced.py      # Pydantic request models
│   ├── agents.py               # Agentic AI loan officer
│   ├── nlp_utils.py            # NLP analysis for loan purpose
│   ├── train_v2.py             # Model training with dynamic income barrier
│   ├── test_scoring.py         # Unit tests for scoring logic
│   ├── models/                 # Trained model artifacts (.pkl, metadata)
│   └── data/                   # Training data (CSV)
│
├── backend/                    # Express.js backend
│   ├── src/controllers/        # Application, auth controllers
│   ├── prisma/schema.prisma    # Backend DB schema
│   └── package.json
│
├── docs/                       # Documentation & diagrams
├── HOW_TO_RUN.md               # Detailed setup guide
└── START.ps1                   # One-command launcher
```

---

## 📡 ML Scoring API

**Base URL:** `http://localhost:8002`

### `POST /apply_direct` — Score a Loan Application

**Request:**
```json
{
  "name": "Ramesh Kumar",
  "mobile": "9876543210",
  "email": "ramesh@example.com",
  "age": 35,
  "has_children": true,
  "is_socially_disadvantaged": true,
  "dependents": 2,
  "declared_income": 12000,
  "loan_amount": 25000,
  "tenure_months": 12,
  "purpose": "Small business expansion",
  "existing_loan_amt": 0,
  "consent_recharge": true,
  "consent_electricity": true,
  "consent_education": true,
  "consent_bank": true,
  "bank_statement": {
    "monthly_credits": 12000,
    "avg_balance": 5000
  },
  "recharge_history": {
    "frequency": 8,
    "avg_amount": 249
  },
  "electricity_bills": {
    "frequency": 6,
    "avg_payment": 800,
    "consistency": 0.85
  }
}
```

**Response:**
```json
{
  "application_id": "APP20260605120000",
  "status": "approved",
  "risk_band": "Low Risk",
  "risk_category": "High Need",
  "loan_offer": 23000,
  "ml_probability": 0.856,
  "composite_score": 68.5,
  "final_sci": 74.2,
  "message": "Congratulations! Your responsible borrowing pattern qualifies you for ₹23,000.",
  "details": {
    "score_breakdown": {
      "user_segment": "low_income_with_proxy_data",
      "pillar_weights_used": {
        "financial": 0.20,
        "repayment": 0.10,
        "consumption": 0.50,
        "history": 0.20
      },
      "no_history_manual_flag": false
    },
    "combine_details": { "ml_weight": 0.6, "composite_weight": 0.4 },
    "proxy_quality_bonus": 3000,
    "proxy_quality_reasons": ["healthy recharge pattern", "consistent utility payments"],
    "base_offer": 20000
  }
}
```

**Interactive API docs:** http://localhost:8002/docs

---

## 🧠 How Scoring Works

```
Applicant submits loan → POST /apply_direct
    │
    ├─ 1. Extract features from application data
    │     (bank, recharge, electricity, education, repayment)
    │
    ├─ 2. Compute Composite Score (0–100)
    │     ├─ Financial pillar  (income stability, savings)
    │     ├─ Repayment pillar  (loan history, on-time ratio)
    │     ├─ Consumption pillar (proxy behaviour consistency)
    │     └─ History pillar    (time since last loan, defaults)
    │
    ├─ 3. ML Model predicts default probability
    │     (RandomForest, 13 features, composite_score included)
    │
    ├─ 4. Combine: Final SCI = 0.6 × ML + 0.4 × Composite
    │
    ├─ 5. Map to Risk Band + Need Category
    │
    ├─ 6. Agentic AI generates explanation
    │
    └─ 7. Return decision (< 500ms)
```

### Risk Bands

| Band | SCI Threshold | Base Offer | Decision |
|------|--------------|------------|----------|
| **Low Risk** | ≥ 70 | ₹20,000 | Auto-approved (if no manual flags) |
| **Medium Risk** | ≥ 50 | ₹12,000 | Manual review |
| **High Risk** | ≥ 40 | ₹6,000 | Manual review |
| **Reject** | < 40 | ₹0 | Rejected |

> **Note:** NBCFDC concessional lending charges no interest. Offers are capped at the requested loan amount. Additional bonus (₹1,500–₹2,000) is added per proxy channel only when the uploaded data shows positive behaviour — consent alone does not boost offers.

### Applicant Segmentation

| Segment | Trigger | Evaluation Focus |
|---------|---------|-----------------|
| Low Income, No Bank Data | Income < barrier, no bank statement | 50% consumption weight |
| Low Income, With Bank Data | Income < barrier, bank data present | 35% financial, 45% consumption |
| High Income, Good History | Income ≥ barrier, repayment data | 40% repayment weight |
| High Income, No History | Income ≥ barrier, no prior loans | ⚠️ Forced manual review |
| New User, No Data | First-time, no proxies | Conservative defaults |

---

## 🧪 Testing

### ML Scoring Tests
```bash
cd ml
python test_scoring.py -v
```

Tests cover:
- Low-income no-bank → correct consumption weighting
- High-income no-history → forced manual review
- High-income good-history → can achieve low risk
- Reject band for SCI < 40
- Consent without data → no fake bonus
- `consent_bank` / `consent_bank_statement` alias compatibility

### Build Verification
```bash
cd frontend && npm run build # Vite build check
cd backend && npm run build  # Express build check
```

---

## 🔧 Tech Stack

## Tech Stack

- **Frontend:** React + Vite, Tailwind CSS, TypeScript
- **Backend:** Node.js, Express, Prisma
- **Database:** PostgreSQL (Aiven)
- **ML Engine:** Python (FastAPI, Scikit-learn, XGBoost)
- **Email:** Resend

## Setup Instructions

### 1. Database & Environment

```bash
# Add your environment variables in the root directory (or respective backend/frontend directories)
cp .env.example .env
```

---

## 🔒 Trust Boundaries & Fairness

- **Consent-gated data**: Proxy features are only extracted when the user explicitly grants consent for each channel
- **Quality-aware bonuses**: Loan offer bonuses require positive behavioural data — consent alone is not enough
- **Trusted repayment only**: Only stored/partner/admin repayment records affect automated scoring; self-reported history is logged but ignored
- **No hardcoded overrides**: Scoring API returns raw SCI — no backend route independently inflates scores
- **Explainable decisions**: Every response includes `score_breakdown` with segment, pillar weights, and flag explanations
- **Dynamic poverty barrier**: Income threshold for low-income segmentation is computed from data distribution, not hardcoded

---

## 👨‍💻 Team

| Member | Role |
|--------|------|
| **Divya Ratna Gautam** | Lead — ML, API, system architecture |
| **Ayush Singh** | AI/ML — scoring logic, model training |
| **Sudhanshu Pal** | Backend — Express API, DB schema |
| **Arvind Kumar Singh** | Full-stack — React UI, form validation |
| **Vivek Chaudhary** | Frontend — styling, user experience |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

**Built for Smart India Hackathon 2025**
**Last Updated:** June 2026
