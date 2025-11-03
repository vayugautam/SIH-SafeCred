# Income-Based Alternative Proxy Access Control

## Overview
The system now **dynamically controls access to alternative proxy consents** (mobile recharge, electricity bills, education fees) based on declared income. High-income applicants cannot use alternative proxies designed for underserved populations.

---

## Key Changes

### 1. **Frontend - Dynamic Form Logic** (`app/src/app/apply/page.tsx`)

#### Income Barrier Detection
- Loads dynamic income barrier from ML model metadata via `/api/ml-metadata`
- Default barrier: ₹15,000 (falls back if ML API unavailable)
- Current barrier from model: **₹9,764** (calculated from training data)

#### Conditional Consent Display
```typescript
const declaredIncomeNum = Number(formData.declaredIncome) || 0
const isHighIncome = declaredIncomeNum >= incomeBarrier
const showAlternativeProxies = !isHighIncome
```

**Behavior:**
- **Low/Middle Income (< barrier)**: Full access to all consent options
- **High Income (≥ barrier)**: Alternative proxy consents **hidden** and **disabled**

#### Auto-Reset Mechanism
```typescript
useEffect(() => {
  if (isHighIncome) {
    setFormData((prev) => ({
      ...prev,
      consentRecharge: false,
      consentElectricity: false,
      consentEducation: false,
    }))
  }
}, [isHighIncome])
```

When declared income crosses the barrier:
- Alternative proxy consents automatically **unchecked**
- Alternative proxy data fields **hidden from form**
- User sees blue notification explaining restriction

---

### 2. **Backend - API Metadata Endpoint** (`app/src/app/api/ml-metadata/route.ts`)

**Endpoint:** `GET /api/ml-metadata`

**Response:**
```json
{
  "incomeBarrier": 9764,
  "modelVersion": "2.0.0",
  "timestamp": "2025-11-02T10:30:00.000Z"
}
```

**Features:**
- Fetches barrier from ML API root endpoint (`/`)
- Graceful fallback to ₹15,000 if ML API down
- Returns 200 even on error (prevents frontend breakage)

---

### 3. **ML Scoring - Barrier Enforcement** (`ml/scoring.py`)

#### User Segmentation
```python
if declared_income >= income_barrier:
    if is_new_user or prev_loans < 2:
        user_segment = "high_income_no_history_manual_review"
        # Forced manual review, heavy fraud penalty
    else:
        user_segment = "high_income_repayment_only"
        # Repayment-focused evaluation
else:
    user_segment = "low_income_alternative_proxies"
    # Full fairness system with alternative proxies
```

#### Pillar Weights by Segment

| Segment | Financial | Repayment | Consumption | History |
|---------|-----------|-----------|-------------|---------|
| Low-income | 0.25 | 0.30 | **0.30** | 0.15 |
| High-income (with history) | 0.30 | **0.60** | **0.00** | 0.10 |
| High-income (no history) | 0.60 | 0.00 | **0.00** | 0.40 |

**Key Logic:**
- `consumption_weight = 0.0` for high-income users → **blocks alternative proxies**
- Consumption pillar returns neutral `0.5` when blocked (not penalty `0.0`)

---

### 4. **ML API - Manual Review Enforcement** (`ml/application_api.py`)

#### Flag Detection
```python
no_history_manual_flag = score_details.get("no_history_manual_flag", False)
alternative_proxies_blocked = score_details.get("alternative_proxies_blocked", False)
```

#### Auto-Approval Prevention
```python
qualifies_high_confidence = (
    ml_prob >= 0.82 and
    composite_score >= 60 and
    loan_to_income_ratio <= 0.6 and
    not no_history_manual_flag  # ← Blocks auto-approval
)
```

**Behavior:**
- High-income users without repayment history → **forced manual review**
- Cannot auto-approve regardless of ML score
- Custom message explains restriction

---

## User Segmentation Examples

### Scenario 1: Low-Income Applicant (₹8,000/month)
```
Declared Income: ₹8,000 (< ₹9,764 barrier)
Form Display:
  ✅ Bank statement consent
  ✅ Mobile recharge consent
  ✅ Electricity bills consent
  ✅ Education fees consent
  ✅ Alternative proxy data fields visible

ML Scoring:
  user_segment: "low_income_alternative_proxies"
  Weights: Financial=0.25, Repayment=0.30, Consumption=0.30, History=0.15
  Alternative proxies: ENABLED
  Fairness bonuses: ACTIVE
```

### Scenario 2: High-Income First-Timer (₹25,000/month)
```
Declared Income: ₹25,000 (≥ ₹9,764 barrier)
Form Display:
  ✅ Bank statement consent
  ❌ Alternative proxy consents HIDDEN
  ❌ Alternative proxy data fields HIDDEN
  ℹ️ Blue notice: "High-income users evaluated on repayment history only"

ML Scoring:
  user_segment: "high_income_no_history_manual_review"
  Weights: Financial=0.60, Repayment=0.00, Consumption=0.00, History=0.40
  Alternative proxies: BLOCKED (consumption_weight=0.0)
  Fraud penalty: 0.25 (forces manual review)
  no_history_manual_flag: True

Application Status: MANUAL_REVIEW (cannot auto-approve)
```

### Scenario 3: High-Income with Good History (₹30,000/month, 3 previous loans)
```
Declared Income: ₹30,000 (≥ ₹9,764 barrier)
Form Display:
  ✅ Bank statement consent
  ❌ Alternative proxy consents HIDDEN
  ❌ Alternative proxy data fields HIDDEN

ML Scoring:
  user_segment: "high_income_repayment_only"
  Weights: Financial=0.30, Repayment=0.60, Consumption=0.00, History=0.10
  Alternative proxies: BLOCKED (consumption_weight=0.0)
  Repayment pillar dominates evaluation
  alternative_proxies_blocked: True

Application Status: CAN auto-approve if:
  - Strong repayment history (on_time_ratio ≥ 0.85)
  - Low loan-to-income ratio (≤ 0.6x)
  - ML probability ≥ 0.82
```

---

## Comprehensive Test Data

### Seed Script: `SEED_COMPREHENSIVE_USERS.ps1`

**Run:**
```powershell
.\SEED_COMPREHENSIVE_USERS.ps1
```

**Creates 14 users across three segments:**

#### Low-Income Segment (₹6k-₹9k) - 5 users
| Mobile | Name | Income | Consent Pattern | Previous Loans |
|--------|------|--------|----------------|----------------|
| 9100000001 | Ramesh Kumar | ₹6,000 | None | No |
| 9100000002 | Lakshmi Devi | ₹7,500 | Bank only | No |
| 9100000003 | Suresh Yadav | ₹8,000 | Bank + 1 alt | Yes (3) |
| 9100000004 | Anita Singh | ₹8,500 | Bank + 2 alt | Yes (3) |
| 9100000005 | Rajesh Patel | ₹9,000 | All consents | Yes (3) |

#### Middle-Income Segment (₹11k-₹14k) - 4 users
| Mobile | Name | Income | Consent Pattern | Previous Loans |
|--------|------|--------|----------------|----------------|
| 9100000006 | Priya Sharma | ₹11,000 | None | No |
| 9100000007 | Vijay Reddy | ₹12,500 | Bank only | Yes (3) |
| 9100000008 | Meena Nair | ₹13,500 | Bank + 2 alt | Yes (2, has defaults) |
| 9100000009 | Arun Kumar | ₹14,000 | All consents | Yes (3) |

#### High-Income Segment (₹18k-₹50k) - 5 users
| Mobile | Name | Income | Consent Pattern | Previous Loans |
|--------|------|--------|----------------|----------------|
| 9100000010 | Amit Verma | ₹18,000 | None | No (first-timer) |
| 9100000011 | Sneha Gupta | ₹22,000 | Bank only | No (first-timer) |
| 9100000012 | Karthik Iyer | ₹25,000 | Bank only | Yes (3, good) |
| 9100000013 | Deepa Menon | ₹30,000 | Bank only | Yes (2, some defaults) |
| 9100000014 | Rohan Kapoor | ₹50,000 | Bank only | Yes (3, excellent) |

**Note:** All users have password `test123`

---

## Testing Checklist

### ✅ Test 1: Low-Income User Sees All Options
1. Login as `9100000005` (₹9,000 income)
2. Navigate to `/apply`
3. Enter declared income: `9000`
4. **Expected:** All consent checkboxes visible (recharge, electricity, education)

### ✅ Test 2: High-Income User Options Hidden
1. Login as `9100000010` (₹18,000 income)
2. Navigate to `/apply`
3. Enter declared income: `18000`
4. **Expected:** 
   - Alternative proxy consents **disappear**
   - Blue notification appears explaining restriction
   - Alternative data fields **hidden**

### ✅ Test 3: Dynamic Threshold Crossing
1. Login as any user
2. Navigate to `/apply`
3. Enter declared income: `8000` → alternative proxies **visible**
4. Change to: `20000` → alternative proxies **disappear** + consents auto-unchecked
5. Change back to: `8000` → alternative proxies **reappear**

### ✅ Test 4: High-Income First-Timer Manual Review
1. Login as `9100000011` (₹22k, no history)
2. Submit application with bank consent only
3. **Expected:**
   - `user_segment`: `"high_income_no_history_manual_review"`
   - `no_history_manual_flag`: `true`
   - Status: `"manual_review"` (cannot auto-approve)

### ✅ Test 5: High-Income with History Auto-Approval
1. Login as `9100000014` (₹50k, 3 good loans)
2. Submit application with:
   - Loan amount: ₹20,000 (low LTI ratio)
   - Good repayment history data (on_time_ratio=0.95)
3. **Expected:**
   - `user_segment`: `"high_income_repayment_only"`
   - `alternative_proxies_blocked`: `true`
   - Repayment pillar weight: **0.60**
   - Status: `"approved"` (if ML score high)

---

## Key Security Features

### 1. **Frontend Validation**
- Alternative proxy consents disabled when income ≥ barrier
- Auto-unchecked when income changes to high
- Visual notification explains restriction

### 2. **Backend Enforcement**
- ML scoring **ignores** alternative proxy data for high-income users
- Consumption pillar weight forced to `0.0`
- No way to bypass via API manipulation

### 3. **Manual Review Safeguard**
- High-income users without history **cannot auto-approve**
- `no_history_manual_flag` prevents ML bypass
- Requires human verification

### 4. **Income Verification** (Already Implemented)
- Declared income checked against NBCFDC database
- >10% mismatch → application blocked
- Fraud counter incremented

---

## Benefits

### For System Integrity
✅ Prevents wealthy users from gaming alternative proxy system  
✅ Preserves fairness mechanisms for intended beneficiaries  
✅ Reduces fraud risk from high-income applicants without history  

### For User Experience
✅ Clear visual feedback on available options  
✅ Transparent explanation of restrictions  
✅ Dynamic barrier (adjusts with model retraining)  

### For Fairness
✅ Alternative proxies reserved for low-income/underserved  
✅ High-income users evaluated on proven credit history  
✅ No loopholes for exploiting consumption patterns  

---

## Files Modified

1. **app/src/app/apply/page.tsx** - Dynamic form logic, conditional rendering
2. **app/src/app/api/ml-metadata/route.ts** - NEW: Barrier metadata endpoint
3. **ml/scoring.py** - Barrier-based segmentation, consumption weight blocking
4. **ml/application_api.py** - Manual review flag enforcement
5. **app/seed-comprehensive-users.ts** - NEW: Comprehensive test data
6. **SEED_COMPREHENSIVE_USERS.ps1** - NEW: Seeding automation script

---

## Next Steps

1. **Run seeding script:**
   ```powershell
   .\SEED_COMPREHENSIVE_USERS.ps1
   ```

2. **Test all scenarios** (see Testing Checklist above)

3. **Monitor barrier adjustments** - When model retrains, barrier updates automatically

4. **Admin dashboard** - Add analytics for:
   - % of applications blocked by income barrier
   - High-income users attempting alternative proxies
   - Manual review rate for high-income no-history cases
