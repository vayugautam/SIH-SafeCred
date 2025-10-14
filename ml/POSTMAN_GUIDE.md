# 📬 Postman Testing Guide for SafeCred ML API

## 🚀 Quick Start

### Server Information
- **Base URL**: `http://127.0.0.1:8002`
- **Status**: Server must be running (check with `/health`)

---

## 📋 Step-by-Step Guide

### 1️⃣ Health Check (GET Request)

**Purpose**: Verify server is running

**Setup in Postman:**
1. Create new request
2. Set method to **GET**
3. Enter URL: `http://127.0.0.1:8002/health`
4. Click **Send**

**Expected Response:**
```json
{
    "status": "healthy",
    "model_loaded": true,
    "timestamp": "2025-10-14T19:35:41.899993"
}
```

---

### 2️⃣ Main Application Endpoint (POST /apply)

**Purpose**: Submit complete loan application and get instant decision

#### Postman Setup:

1. **Method**: POST
2. **URL**: `http://127.0.0.1:8002/apply`
3. **Headers**: 
   - Click "Headers" tab
   - Add: `Content-Type` = `application/json`
4. **Body**:
   - Click "Body" tab
   - Select "raw"
   - Select "JSON" from dropdown
   - Paste the JSON below

#### Sample Request Body:

**Scenario 1: Complete Application (All Consents)**
```json
{
  "applicant": {
    "name": "Rahul Kumar",
    "mobile": "9876543210",
    "email": "rahul.kumar@email.com",
    "age": 28,
    "has_children": false,
    "is_socially_disadvantaged": false
  },
  "declared_income": 25000,
  "loan_details": {
    "loan_amount": 15000,
    "tenure_months": 12,
    "purpose": "Business expansion"
  },
  "consents": {
    "recharge": true,
    "electricity": true,
    "education": false
  },
  "documents": {
    "bank_statements": [
      {
        "date": "2025-09-01",
        "description": "Salary Credit",
        "debit": 0,
        "credit": 25000,
        "balance": 45000
      },
      {
        "date": "2025-09-05",
        "description": "Rent Payment",
        "debit": 10000,
        "credit": 0,
        "balance": 35000
      },
      {
        "date": "2025-09-10",
        "description": "Grocery Shopping",
        "debit": 3000,
        "credit": 0,
        "balance": 32000
      },
      {
        "date": "2025-09-15",
        "description": "Online Transfer",
        "debit": 5000,
        "credit": 0,
        "balance": 27000
      }
    ],
    "recharge_data": [
      {
        "date": "2025-09-01",
        "amount": 299,
        "operator": "Jio"
      },
      {
        "date": "2025-09-15",
        "amount": 499,
        "operator": "Jio"
      }
    ],
    "electricity_bills": [
      {
        "month": "2025-08",
        "amount": 850,
        "units": 150,
        "paid_on_time": true
      },
      {
        "month": "2025-09",
        "amount": 920,
        "units": 165,
        "paid_on_time": true
      }
    ],
    "education_fees": []
  }
}
```

**Scenario 2: Minimal Application (New User)**
```json
{
  "applicant": {
    "name": "Priya Sharma",
    "mobile": "8765432109",
    "email": "priya@email.com",
    "age": 24,
    "has_children": false,
    "is_socially_disadvantaged": false
  },
  "declared_income": 18000,
  "loan_details": {
    "loan_amount": 8000,
    "tenure_months": 6,
    "purpose": "Medical emergency"
  },
  "consents": {
    "recharge": false,
    "electricity": false,
    "education": false
  },
  "documents": {
    "bank_statements": [],
    "recharge_data": [],
    "electricity_bills": [],
    "education_fees": []
  }
}
```

**Scenario 3: Socially Disadvantaged (Lower Income Barrier)**
```json
{
  "applicant": {
    "name": "Amit Singh",
    "mobile": "7654321098",
    "email": "amit@email.com",
    "age": 32,
    "has_children": true,
    "is_socially_disadvantaged": true
  },
  "declared_income": 12000,
  "loan_details": {
    "loan_amount": 10000,
    "tenure_months": 12,
    "purpose": "Agricultural tools"
  },
  "consents": {
    "recharge": true,
    "electricity": true,
    "education": true
  },
  "documents": {
    "bank_statements": [
      {
        "date": "2025-09-01",
        "description": "Salary",
        "debit": 0,
        "credit": 12000,
        "balance": 15000
      }
    ],
    "recharge_data": [
      {
        "date": "2025-09-10",
        "amount": 199,
        "operator": "Airtel"
      }
    ],
    "electricity_bills": [
      {
        "month": "2025-09",
        "amount": 450,
        "units": 80,
        "paid_on_time": true
      }
    ],
    "education_fees": [
      {
        "month": "2025-09",
        "amount": 2500,
        "institution": "Local School",
        "paid_on_time": true
      }
    ]
  }
}
```

#### Expected Response:

```json
{
  "application_id": "APP20251014193000",
  "status": "approved",
  "risk_band": "Low Risk (Income-Adjusted: ₹9,763.95)",
  "loan_offer": 20000,
  "interest_rate": 8.5,
  "ml_probability": 0.823,
  "composite_score": 75.5,
  "final_sci": 782,
  "message": "Congratulations! Your loan application has been approved...",
  "timestamp": "2025-10-14T19:45:00.123456",
  "details": {
    "consent_bonus_received": 6000,
    "base_limit": 20000,
    "has_bank_data": true,
    "is_new_user": false,
    "breakdown": {
      "bank_score": 45.2,
      "recharge_score": 8.5,
      "electricity_score": 12.3,
      "education_score": 9.5
    }
  }
}
```

---

### 3️⃣ Check Application Status (GET Request)

**Setup in Postman:**
1. **Method**: GET
2. **URL**: `http://127.0.0.1:8002/status/APP20251014193000`
   - Replace `APP20251014193000` with actual application_id from response
3. Click **Send**

**Expected Response:**
```json
{
  "application_id": "APP20251014193000",
  "status": "approved",
  "message": "Application found",
  "details": { ... }
}
```

---

### 4️⃣ API Documentation (GET Request)

**URL**: `http://127.0.0.1:8002/docs`

Open this in your browser to see interactive Swagger documentation where you can test all endpoints!

---

## 🎯 Testing Different Scenarios

### Test Case 1: High Income + All Consents = Approved
- Income: ₹25,000+
- All consents: true
- Bank statements: 4+ entries
- Expected: **Approved**, Low Risk, ₹20,000+ offer

### Test Case 2: Low Income + No Data = Rejected/Review
- Income: ₹8,000
- All consents: false
- No bank statements
- Expected: **Manual Review** or **Rejected**

### Test Case 3: Medium Income + Partial Consents = Review
- Income: ₹15,000
- Some consents: true
- Some bank data
- Expected: **Manual Review**, Medium Risk

### Test Case 4: Socially Disadvantaged = Lower Barrier
- is_socially_disadvantaged: true
- Income: ₹12,000 (below normal barrier)
- Expected: **Should pass barrier check** (barrier = ₹9,763.95)

---

## 🔍 Debugging Tips

### If Server Not Responding:
1. Check server is running:
   ```powershell
   cd "e:\SIH Synapse\SIH-SafeCred\ml"
   .\start_server.ps1
   ```

2. Verify in another Postman tab:
   ```
   GET http://127.0.0.1:8002/health
   ```

### If Getting Errors:

**400 Bad Request** = Invalid JSON format
- Check JSON syntax in Body
- Ensure all required fields present

**422 Unprocessable Entity** = Validation error
- Check field types (numbers vs strings)
- Ensure required fields not missing

**500 Internal Server Error** = Server issue
- Check terminal for error logs
- Verify model files exist

---

## 📦 Postman Collection (Import Ready)

You can create a collection in Postman:

1. Click **Collections** → **New Collection**
2. Name it "SafeCred ML API"
3. Add these requests:
   - GET /health
   - GET / (root)
   - POST /apply (with 3 different scenarios)
   - GET /status/{app_id}
   - GET /docs

4. Set collection variable:
   - Variable: `base_url`
   - Value: `http://127.0.0.1:8002`
   - Then use `{{base_url}}/apply` in URLs

---

## 🎨 Quick Copy-Paste Test

**1. Start Server:**
```powershell
cd "e:\SIH Synapse\SIH-SafeCred\ml"
.\start_server.ps1
```

**2. In Postman:**
- Method: **POST**
- URL: `http://127.0.0.1:8002/apply`
- Headers: `Content-Type: application/json`
- Body: Copy Scenario 1 JSON above
- Click **Send**

**3. See Result** → Should get approved with loan offer!

---

## 📊 Understanding the Response

| Field | Meaning |
|-------|---------|
| `application_id` | Unique ID for this application |
| `status` | `approved`, `rejected`, or `manual_review` |
| `risk_band` | Risk classification with income barrier info |
| `loan_offer` | Maximum loan amount approved (₹) |
| `interest_rate` | Annual interest rate (%) |
| `ml_probability` | ML model confidence (0-1) |
| `composite_score` | Combined score from all data sources |
| `final_sci` | Synthetic Credit Index (300-900) |
| `message` | Human-readable decision message |

---

## 🚀 Advanced: Using Postman Tests

Add this to the **Tests** tab in Postman to auto-validate responses:

```javascript
// Check response status
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Check response has required fields
pm.test("Response has application_id", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('application_id');
    pm.expect(jsonData).to.have.property('status');
    pm.expect(jsonData).to.have.property('final_sci');
});

// Validate SCI range
pm.test("SCI is in valid range", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.final_sci).to.be.within(300, 900);
});

// Save app_id for next request
pm.environment.set("app_id", pm.response.json().application_id);
```

---

## 📞 Need Help?

- **API Docs**: http://127.0.0.1:8002/docs (Interactive testing)
- **Health Check**: http://127.0.0.1:8002/health
- **See Logs**: Check PowerShell terminal running the server

Happy Testing! 🎉
