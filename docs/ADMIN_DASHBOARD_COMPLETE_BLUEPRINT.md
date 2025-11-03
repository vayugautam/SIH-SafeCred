# SAFE-CRED Admin Dashboard - Complete Implementation Guide

## 🎯 Executive Summary

This guide outlines the complete admin dashboard system for SafeCred, designed for NBCFDC officials to monitor creditworthiness assessment, detect fraud, manage direct digital lending, and ensure compliance.

## 📊 Dashboard Architecture

### Current Status: ✅ Foundation Complete
- **Implemented**: Core analytics endpoint with fraud detection, risk distribution, score insights
- **In Progress**: Multi-section dashboard frontend
- **Planned**: 9 comprehensive dashboard sections

---

## 🔹 1. OVERVIEW DASHBOARD (Home Page)

### Purpose
Give NBCFDC officials a top-level summary of beneficiaries, credit trends, and risk distribution at a glance.

### API Endpoint
```typescript
GET /api/admin/overview
```

### Key Metrics Displayed
- **Total Beneficiaries Processed**: 12,480 (unique users across all applications)
- **This Month Statistics**:
  - Applications: 1,250
  - Approved: 890 (71.2%)
  - Pending: 280 (22.4%)
  - Flagged: 80 (6.4%)
- **Average SCI Score**: 74.5
- **Average Processing Time**: 2.3 days (vs 7-day baseline = 67% improvement)

### Risk Band Distribution (Donut Chart)
```json
{
  "Low Risk - High Need": 420,     // 33.6% - Priority approvals
  "Low Risk - Low Need": 310,      // 24.8%
  "Medium Risk": 280,              // 22.4%
  "High Risk": 180,                // 14.4%
  "Very High Risk": 60             // 4.8%
}
```

### Quick Alerts System
```typescript
alerts: {
  🔴 incomeInconsistency: 80,          // Beneficiaries flagged for income fraud
  🟡 pendingReScore: 45,               // Manual reviews awaiting decision
  🟢 sameDayApprovals: 150             // Instant approvals completed today
}
```

### Visual Design
- **Top Bar**: 4 metric cards (Total Beneficiaries, Monthly Apps, Avg SCI, Processing Time)
- **Center**: Donut chart showing risk distribution with color coding
- **Bottom**: 14-day trend graph (applications, approvals, avg scores over time)
- **Right Sidebar**: Alert panel with color-coded notifications

---

## 🔹 2. BENEFICIARY SCORING INSIGHTS

### Purpose
View and drill down into each beneficiary's AI-generated composite credit score.

### API Endpoints
```typescript
GET /api/admin/beneficiaries?page=1&limit=20&search=&riskBand=&status=
GET /api/admin/beneficiaries/:id
```

### Beneficiary Table Columns
| Beneficiary ID | Name | Income Declared | SCI Score | Risk Band | Approval Status | Last Updated | Flags |
|----------------|------|-----------------|-----------|-----------|-----------------|--------------|-------|
| BEN-2024-0001 | Rajesh Kumar | ₹15,000 | 82.5 | Low Risk - High Need | APPROVED | 2024-10-14 | ✅ |
| BEN-2024-0002 | Priya Sharma | ₹45,000 | 68.3 | Medium Risk | PROCESSING | 2024-10-14 | 🟡 Pending Review |
| BEN-2024-0003 | Amit Patel | ₹40,000 | 42.1 | High Risk | REJECTED | 2024-10-13 | 🔴 Income Mismatch |

### Drill-Down Modal (Click on any row)

#### Pillar Scores Breakdown
```json
{
  "financial": 78,        // Income stability, employment
  "repayment": 90,        // Past loan repayment history
  "consumption": 68,      // Lifestyle spending patterns
  "history": 74           // Credit bureau history
}
```

#### AI Explainability Section
```
"Approved due to excellent repayment consistency (96%) and stable income 
proxy (₹12K/month via electricity bills). Minor deductions for limited 
consumption data (-5 points) and recent employment (<1 year, -3 points)."

Confidence Level: 89%
```

#### Decision Rationale Timeline
```typescript
[
  { date: '2024-10-01', event: 'Application Submitted', score: 0 },
  { date: '2024-10-01', event: 'Data Collection Complete', score: 65 },
  { date: '2024-10-02', event: 'AI Scoring Complete', score: 82 },
  { date: '2024-10-02', event: 'Auto-Approved', score: 82.5 }
]
```

### Top Contributing Factors (Horizontal Bar Chart)
```json
[
  { "factor": "repayment_consistency", "score": +12.5, "description": "96% on-time payments" },
  { "factor": "electricity_proxy_income", "score": +8.3, "description": "₹12K estimated from bills" },
  { "factor": "employment_tenure", "score": -3.2, "description": "< 1 year in current job" },
  { "factor": "bank_balance_volatility", "score": -2.1, "description": "High account fluctuations" },
  { "factor": "high_need_boost", "score": +5.0, "description": "2 children, priority segment" }
]
```

---

## 🔹 3. RISK & COMPLIANCE CENTER

### Purpose
Provide auditors and compliance officers transparency on fairness, bias, and data quality.

### API Endpoint
```typescript
GET /api/admin/risk-compliance
```

### Bias Monitoring Heatmap

#### Gender Fairness
```json
{
  "male": {
    "total": 5420,
    "approved": 3890,
    "approvalRate": 71.8%,
    "avgScore": 73.2,
    "fairnessScore": 92
  },
  "female": {
    "total": 6280,
    "approved": 4510,
    "approvalRate": 71.8%,
    "avgScore": 75.1,
    "fairnessScore": 95
  },
  "other": {
    "total": 780,
    "approved": 550,
    "approvalRate": 70.5%,
    "avgScore": 72.8,
    "fairnessScore": 90
  }
}
```

#### Regional Fairness (by State)
```json
{
  "Maharashtra": { "total": 2500, "avgScore": 74.8, "approvalRate": 72% },
  "Karnataka": { "total": 2100, "avgScore": 73.2, "approvalRate": 71% },
  "Tamil Nadu": { "total": 1900, "avgScore": 75.1, "approvalRate": 73% },
  "West Bengal": { "total": 1800, "avgScore": 72.5, "approvalRate": 69% }
}
```

#### Income Group Fairness
```json
{
  "<10000": { "total": 3200, "avgScore": 68.5, "approvalRate": 65% },
  "10000-25000": { "total": 5800, "avgScore": 73.8, "approvalRate": 72% },
  "25000-50000": { "total": 2600, "avgScore": 76.2, "approvalRate": 75% },
  ">50000": { "total": 880, "avgScore": 79.1, "approvalRate": 78% }
}
```

### Audit Trail Viewer
```typescript
logs: [
  {
    timestamp: '2024-10-14 10:25:30',
    action: 'SCORE_UPDATED',
    applicationId: 'APP-2024-1234',
    previousScore: 75.2,
    newScore: 78.5,
    reason: 'Additional consumption data uploaded',
    adminUser: 'officer@nbcfdc.gov.in'
  },
  {
    timestamp: '2024-10-14 09:15:22',
    action: 'MANUAL_OVERRIDE',
    applicationId: 'APP-2024-1235',
    previousStatus: 'REJECTED',
    newStatus: 'APPROVED',
    reason: 'Officer reviewed supporting documents',
    adminUser: 'manager@nbcfdc.gov.in'
  }
]
```

### Data Completeness Meter
```json
{
  "overall": 87.5%,
  "breakdown": {
    "fullData": 10850,    // 87% - All fields present
    "partialData": 1430,  // 11% - Some fields missing
    "minimalData": 200    // 2% - Only basic info
  },
  "missingFields": {
    "utilityBills": 1800,        // 14.4%
    "rechargeLogs": 2100,        // 16.8%
    "bankStatements": 950,       // 7.6%
    "repaymentHistory": 3200     // 25.6%
  }
}
```

---

## 🔹 4. INCOME VERIFICATION MONITOR

### Purpose
Validate declared income through proxy consumption indicators and flag fraud.

### API Endpoint
```typescript
GET /api/admin/income-verification
```

### Inconsistency Alerts Table
| Application ID | Beneficiary | Declared Income | Proxy Income (Consumption) | Electricity | Mismatch % | Flag |
|----------------|-------------|-----------------|---------------------------|-------------|------------|------|
| APP-2024-1256 | Vikram Singh | ₹40,000 | ₹12,500 | ₹200/month | -68.75% | 🔴 HIGH |
| APP-2024-1299 | Anita Desai | ₹25,000 | ₹18,200 | ₹450/month | -27.2% | 🟡 MEDIUM |
| APP-2024-1305 | Ravi Gupta | ₹18,000 | ₹16,800 | ₹380/month | -6.67% | 🟢 LOW |

### Income-Consumption Correlation Graph (Scatter Plot)
```javascript
// X-axis: Declared Income, Y-axis: Consumption Proxy Income
dataPoints: [
  { declaredIncome: 15000, proxyIncome: 14200, sciScore: 82 },
  { declaredIncome: 25000, proxyIncome: 23500, sciScore: 78 },
  { declaredIncome: 40000, proxyIncome: 12000, sciScore: 45 },  // Outlier - flagged
  { declaredIncome: 35000, proxyIncome: 32000, sciScore: 75 },
  // ... more data points
]
```

### Household Size Normalization
```json
{
  "applied": 8950,
  "total": 12480,
  "percentage": 71.7%,
  "examples": [
    {
      "householdSize": 5,
      "rawConsumption": ₹800,
      "perCapitaConsumption": ₹160,
      "adjustedIncome": ₹20000
    }
  ]
}
```

### Proxy Source Reliability Scores
```json
{
  "electricity": {
    "reliability": 92%,
    "coverage": 98%,          // % of applications with this data
    "accuracy": 89%,          // Correlation with actual income
    "description": "Most reliable proxy due to consistent usage patterns"
  },
  "mobileRecharge": {
    "reliability": 81%,
    "coverage": 95%,
    "accuracy": 78%,
    "description": "Good indicator for discretionary spending"
  },
  "utilityBills": {
    "reliability": 75%,
    "coverage": 72%,
    "accuracy": 71%,
    "description": "Useful for urban beneficiaries"
  },
  "bankStatements": {
    "reliability": 95%,
    "coverage": 45%,
    "accuracy": 92%,
    "description": "Highest accuracy but limited availability"
  },
  "repaymentHistory": {
    "reliability": 88%,
    "coverage": 35%,
    "accuracy": 85%,
    "description": "Strong predictor for repeat borrowers"
  }
}
```

---

## 🔹 5. MODEL MANAGEMENT & RE-SCORING

### Purpose
Allow admins to trigger re-scoring, view ML model versioning, and monitor retraining.

### API Endpoints
```typescript
GET /api/admin/model-management
POST /api/admin/model/rescore
```

### Current Model Status Panel
```json
{
  "currentModel": {
    "version": "v1.3",
    "trainedOn": "2024-10-10",
    "datasetSize": 10000,
    "features": 45,
    "accuracy": 91.2%,
    "precision": 89.5%,
    "recall": 91.8%,
    "f1Score": 90.6%,
    "auc": 0.94
  },
  "performanceMetrics": {
    "falsePositiveRate": 8.5%,
    "falseNegativeRate": 8.2%,
    "avgPredictionTime": "250ms",
    "confidenceThreshold": 82%
  }
}
```

### Retraining History & Model Lifecycle
```typescript
retrainingHistory: [
  {
    version: 'v1.3',
    date: '2024-10-10',
    datasetSize: 10000,
    accuracy: 91.2%,
    improvements: [
      'Added consumption proxy features (+3.5% accuracy)',
      'Enhanced repayment history weights (+2.1% precision)',
      'Implemented household size normalization'
    ],
    trainingTime: '45 minutes',
    status: 'ACTIVE'
  },
  {
    version: 'v1.2',
    date: '2024-09-15',
    datasetSize: 8500,
    accuracy: 88.5%,
    improvements: [
      'Integrated electricity bill analysis',
      'Added mobile recharge patterns'
    ],
    trainingTime: '38 minutes',
    status: 'DEPRECATED'
  },
  {
    version: 'v1.1',
    date: '2024-08-20',
    datasetSize: 7000,
    accuracy: 85.2%,
    improvements: ['Initial production model'],
    trainingTime: '30 minutes',
    status: 'ARCHIVED'
  }
]
```

### Re-Score Trigger Controls

#### By Region
```json
{
  "options": ["All States", "Maharashtra", "Karnataka", "Tamil Nadu", "West Bengal"],
  "affectedApplications": 2500,
  "estimatedTime": "15-20 minutes"
}
```

#### By Loan Type
```json
{
  "options": ["Education", "Business", "Agriculture", "Personal", "Emergency"],
  "affectedApplications": 1800,
  "estimatedTime": "10-15 minutes"
}
```

#### By Risk Segment
```json
{
  "options": ["High Risk", "Medium Risk", "Low Risk", "Manual Review", "All"],
  "affectedApplications": 450,
  "estimatedTime": "5-8 minutes"
}
```

### Pending Re-Score Queue
```json
{
  "total": 120,
  "reasons": {
    "newDataUploaded": 45,
    "policyChange": 30,
    "manualReviewRequest": 25,
    "modelUpdate": 20
  }
}
```

---

## 🔹 6. DIRECT DIGITAL LENDING CONTROL PANEL

### Purpose
Manage instant approval pipeline and loan sanction tracking for direct lending enablement.

### API Endpoint
```typescript
GET /api/admin/direct-lending
```

### Same-Day Approval Tracker
```json
{
  "count": 150,
  "total": 1250,
  "percentage": 12%,
  "criteria": "SCI ≥ 80 AND Confidence ≥ 82%",
  "avgLoanSize": ₹45000,
  "totalDisbursed": ₹6750000
}
```

### Manual Review Queue
| Application ID | Beneficiary | Loan Amount | SCI | Reason | Days Waiting | Priority |
|----------------|-------------|-------------|-----|--------|--------------|----------|
| APP-2024-1310 | Suresh Reddy | ₹85,000 | 62.5 | Additional Verification | 3 | 🔴 HIGH |
| APP-2024-1315 | Meena Kumari | ₹50,000 | 58.2 | Low Credit Score | 2 | 🟡 MEDIUM |
| APP-2024-1322 | Arjun Singh | ₹120,000 | 68.9 | High Loan Amount | 1 | 🟢 LOW |

### Loan Amount Recommendation Table
| Beneficiary | Monthly Income | Recommended Loan | Actual Sanctioned | Loan-to-Income Ratio | Warning |
|-------------|----------------|------------------|-------------------|---------------------|---------|
| Rajesh Kumar | ₹15,000 | ₹45,000 (3x) | ₹40,000 | 2.67x | ✅ Safe |
| Priya Sharma | ₹25,000 | ₹75,000 (3x) | ₹90,000 | 3.60x | ⚠️ Monitor |
| Amit Patel | ₹18,000 | ₹54,000 (3x) | ₹80,000 | 4.44x | 🔴 Exceeds Threshold |

### Automated Alerts
```json
{
  "exceedingRisk": {
    "count": 35,
    "description": "Applications with SCI < 35 (Very High Risk)"
  },
  "missingDocuments": {
    "count": 82,
    "description": "Applications missing required verification data"
  },
  "highValueLoans": {
    "count": 28,
    "description": "Loan requests > ₹500,000 requiring senior approval"
  },
  "repeatedApplications": {
    "count": 12,
    "description": "Same beneficiary applied multiple times within 30 days"
  }
}
```

---

## 🔹 7. DATA UPLOAD & API INTEGRATION PANEL

### Purpose
Enable seamless data flow from NBCFDC channel partners and track integration health.

### API Endpoint
```typescript
GET /api/admin/data-integration
POST /api/admin/data/upload
```

### Bulk CSV Upload Interface
```typescript
supportedFormats: [
  {
    type: 'beneficiaryData',
    fields: ['name', 'mobile', 'income', 'loanAmount', 'purpose'],
    template: 'Download Template',
    maxRows: 1000,
    validationRules: 'Income > 0, Mobile = 10 digits'
  },
  {
    type: 'repaymentHistory',
    fields: ['beneficiaryId', 'loanId', 'emiDate', 'amountPaid', 'status'],
    template: 'Download Template',
    maxRows: 5000,
    validationRules: 'EMI date in past, Amount > 0'
  },
  {
    type: 'consumptionData',
    fields: ['beneficiaryId', 'dataType', 'amount', 'date'],
    template: 'Download Template',
    maxRows: 10000,
    validationRules: 'Data type in [electricity, recharge, utility]'
  }
]
```

### API Usage Logs
```json
{
  "last24Hours": {
    "totalHits": 12450,
    "successRate": 98.5%,
    "avgLatency": "185ms",
    "errors": 187,
    "topEndpoints": [
      { "endpoint": "/api/applications/submit", "hits": 4200 },
      { "endpoint": "/api/admin/analytics", "hits": 850 },
      { "endpoint": "/api/auth/login", "hits": 3200 }
    ]
  },
  "errorBreakdown": {
    "400": 120,  // Bad Request
    "401": 45,   // Unauthorized
    "500": 22    // Server Error
  }
}
```

### Data Source Registry
| Partner Name | Data Type | Last Sync | Status | Records | Freshness |
|--------------|-----------|-----------|--------|---------|-----------|
| NBCFDC HQ | Beneficiary Data | 2024-10-14 08:00 | ✅ Active | 8,500 | 6 hours |
| Regional Office - Mumbai | Repayment History | 2024-10-14 06:30 | ✅ Active | 12,300 | 8 hours |
| Utility Provider API | Electricity Bills | 2024-10-14 09:15 | ✅ Active | 9,800 | 3 hours |
| Telecom Partner | Mobile Recharge | 2024-10-13 22:00 | ⚠️ Delayed | 7,200 | 16 hours |

### Auto Sync Controls
```typescript
syncSettings: {
  beneficiaryData: { frequency: 'daily', time: '06:00', enabled: true },
  repaymentHistory: { frequency: 'daily', time: '05:00', enabled: true },
  consumptionData: { frequency: 'hourly', enabled: true },
  notifications: { email: 'admin@nbcfdc.gov.in', slack: '#data-sync' }
}
```

---

## 🔹 8. ANALYTICS & REPORTING SUITE

### Purpose
Generate compliance and policy insights for NBCFDC leadership.

### API Endpoint
```typescript
GET /api/admin/analytics-reports?type=&startDate=&endDate=
POST /api/admin/reports/export
```

### Available Reports

#### 1. Risk Distribution by Region
```json
{
  "Maharashtra": {
    "Low Risk": 1200,
    "Medium Risk": 800,
    "High Risk": 500
  },
  "Karnataka": {
    "Low Risk": 1050,
    "Medium Risk": 700,
    "High Risk": 350
  }
  // ... more states
}
```

#### 2. Creditworthiness per Income Band
```json
{
  "<10000": { "count": 3200, "avgSCI": 68.5, "approvalRate": 65% },
  "10000-25000": { "count": 5800, "avgSCI": 73.8, "approvalRate": 72% },
  "25000-50000": { "count": 2600, "avgSCI": 76.2, "approvalRate": 75% },
  ">50000": { "count": 880, "avgSCI": 79.1, "approvalRate": 78% }
}
```

#### 3. Processing Time vs Traditional Flow
```json
{
  "current": {
    "avgTime": 2.3 days,
    "sameDayApprovals": 12%,
    "within48Hours": 68%
  },
  "traditional": {
    "avgTime": 7 days,
    "sameDayApprovals": 0%,
    "within48Hours": 5%
  },
  "improvement": "+67% faster processing"
}
```

#### 4. Default Rate Trend (Previous Borrowers)
```json
{
  "q1-2024": { "loansIssued": 2500, "defaults": 125, "rate": 5.0% },
  "q2-2024": { "loansIssued": 2800, "defaults": 112, "rate": 4.0% },
  "q3-2024": { "loansIssued": 3200, "defaults": 128, "rate": 4.0% },
  "prediction-q4-2024": { "estimated": 3500, "predictedRate": 3.5% }
}
```

#### 5. Gender-wise Inclusion Index
```json
{
  "male": { "count": 5420, "percentage": 43.4%, "avgLoan": ₹48000 },
  "female": { "count": 6280, "percentage": 50.3%, "avgLoan": ₹45000 },
  "other": { "count": 780, "percentage": 6.3%, "avgLoan": ₹42000 }
}
```

#### 6. District-wise Penetration
```json
[
  { "district": "Mumbai", "applications": 1850, "penetration": "15.2%" },
  { "district": "Pune", "applications": 1420, "penetration": "11.7%" },
  { "district": "Bangalore", "applications": 1680, "penetration": "13.8%" },
  // ... top 20 districts
]
```

### Export Options
```typescript
exportFormats: ['CSV', 'Excel', 'PDF', 'JSON'],
scheduleReports: {
  frequency: ['Daily', 'Weekly', 'Monthly', 'Quarterly'],
  recipients: ['admin@nbcfdc.gov.in', 'reports@nbcfdc.gov.in'],
  autoSend: true
}
```

---

## 🔹 9. ADMIN CONTROLS

### Purpose
Manage system users, security, and privacy compliance.

### API Endpoints
```typescript
GET /api/admin/users
POST /api/admin/users/add
DELETE /api/admin/users/:id
GET /api/admin/security-logs
POST /api/admin/privacy/revoke-consent
```

### User Management Table
| User ID | Name | Email | Role | Status | Last Login | Actions |
|---------|------|-------|------|--------|------------|---------|
| USR-001 | Ramesh Kumar | officer@nbcfdc.gov.in | Officer | Active | 2024-10-14 10:30 | Edit / Disable |
| USR-002 | Sunita Sharma | manager@nbcfdc.gov.in | Manager | Active | 2024-10-14 09:15 | Edit / Disable |
| USR-003 | Vikram Singh | analyst@nbcfdc.gov.in | Analyst | Active | 2024-10-13 16:45 | Edit / Disable |

### Role-based Access Control (RBAC)
```json
{
  "admin": {
    "permissions": ["*"],
    "description": "Full system access"
  },
  "manager": {
    "permissions": [
      "view:all_applications",
      "approve:high_value_loans",
      "edit:user_accounts",
      "export:reports"
    ],
    "description": "Senior officers with approval authority"
  },
  "officer": {
    "permissions": [
      "view:assigned_applications",
      "approve:standard_loans",
      "view:analytics"
    ],
    "description": "Standard loan processing officers"
  },
  "analyst": {
    "permissions": [
      "view:analytics",
      "export:reports",
      "view:all_applications"
    ],
    "description": "Data analysts and compliance team"
  },
  "channel_partner": {
    "permissions": [
      "submit:applications",
      "view:own_submissions",
      "upload:beneficiary_data"
    ],
    "description": "External channel partners"
  }
}
```

### Add Channel Partner Account Form
```typescript
{
  partnerName: string,
  organizationType: 'NGO' | 'MFI' | 'Cooperative' | 'Bank',
  contactPerson: string,
  email: string,
  mobile: string,
  region: string,
  role: 'channel_partner',
  apiAccess: boolean,
  rateLimit: number  // API calls per hour
}
```

### Encryption & Security Logs
```json
{
  "jwtTokenExpiry": "24 hours",
  "passwordPolicy": {
    "minLength": 12,
    "requireUppercase": true,
    "requireNumbers": true,
    "requireSpecialChars": true,
    "expiryDays": 90
  },
  "recentSecurityEvents": [
    {
      "timestamp": "2024-10-14 10:45:22",
      "event": "FAILED_LOGIN_ATTEMPT",
      "user": "officer@nbcfdc.gov.in",
      "ipAddress": "203.192.45.18",
      "location": "Mumbai"
    },
    {
      "timestamp": "2024-10-14 09:30:15",
      "event": "PASSWORD_CHANGED",
      "user": "manager@nbcfdc.gov.in",
      "ipAddress": "203.192.45.22",
      "location": "Delhi"
    }
  ]
}
```

### Consent Revocation & Privacy Reports
```json
{
  "consentRequests": 12480,
  "activeConsents": 12200,
  "revoked": 280,
  "pending": 0,
  "recentRevocations": [
    {
      "beneficiaryId": "BEN-2024-1256",
      "name": "Rajesh Kumar",
      "revokedDate": "2024-10-13",
      "dataTypes": ["electricity", "recharge"],
      "action": "Data deleted within 24 hours"
    }
  ]
}
```

---

## 📱 UI/UX Design Guidelines

### Color Scheme
```css
:root {
  --primary: #1e40af;        /* Blue for primary actions */
  --success: #10b981;        /* Green for approvals */
  --warning: #f59e0b;        /* Orange for warnings */
  --danger: #ef4444;         /* Red for errors/fraud */
  --info: #3b82f6;           /* Light blue for info */
  --bg-dark: #0f172a;        /* Dark background */
  --bg-card: rgba(255,255,255,0.1);  /* Glassmorphism cards */
}
```

### Visual Components

#### 1. Donut Chart (Risk Distribution)
```javascript
// Using Chart.js or Recharts
<DonutChart
  data={riskDistribution}
  colors={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#991b1b']}
  centerText="12,480 Total"
  legend={true}
/>
```

#### 2. Scatter Plot (Income Correlation)
```javascript
<ScatterPlot
  xAxis="Declared Income"
  yAxis="Proxy Income"
  data={correlationData}
  highlightOutliers={true}
  regressionLine={true}
/>
```

#### 3. Heatmap (Bias Monitoring)
```javascript
<Heatmap
  rows={['Male', 'Female', 'Other']}
  columns={['<10K', '10-25K', '25-50K', '>50K']}
  values={fairnessScores}
  colorScale={['#ef4444', '#f59e0b', '#10b981']}
  threshold={85}  // Below this = red flag
/>
```

#### 4. Trend Graph (14-day trends)
```javascript
<LineChart
  data={temporalTrends}
  lines={['Applications', 'Approvals', 'Avg Score']}
  xAxis="Date"
  yAxis="Count / Score"
  smooth={true}
/>
```

#### 5. Gauge Chart (Reliability Scores)
```javascript
<GaugeChart
  value={92}
  min={0}
  max={100}
  label="Electricity Data Reliability"
  thresholds={[60, 80, 90]}
  colors={['#ef4444', '#f59e0b', '#10b981']}
/>
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (✅ Complete)
- [x] Core analytics endpoint
- [x] Fraud detection logic
- [x] Risk distribution
- [x] Basic admin dashboard UI

### Phase 2: Core Features (🔄 In Progress)
- [ ] Overview dashboard with donut chart
- [ ] Beneficiary scoring table with pagination
- [ ] Drill-down modals with pillar scores
- [ ] Income verification monitor

### Phase 3: Advanced Features
- [ ] Risk & compliance center with heatmaps
- [ ] Model management interface
- [ ] Direct lending control panel
- [ ] Data upload & API integration

### Phase 4: Reporting & Admin
- [ ] Analytics reports suite
- [ ] Export functionality (CSV/Excel/PDF)
- [ ] User management system
- [ ] Audit trail viewer

### Phase 5: Polish & Optimization
- [ ] Real-time WebSocket updates
- [ ] Advanced filtering and search
- [ ] Custom dashboard builder
- [ ] Mobile responsive design

---

## 🧪 Testing Data

### Sample Beneficiary Records
```json
[
  {
    "id": "BEN-2024-0001",
    "name": "Rajesh Kumar",
    "age": 32,
    "income": 15000,
    "loanAmount": 40000,
    "sciScore": 82.5,
    "riskBand": "Low Risk - High Need",
    "status": "APPROVED",
    "pillars": { "financial": 78, "repayment": 90, "consumption": 68, "history": 74 },
    "flags": []
  },
  {
    "id": "BEN-2024-0002",
    "name": "Priya Sharma",
    "age": 28,
    "income": 45000,
    "loanAmount": 90000,
    "sciScore": 68.3,
    "riskBand": "Medium Risk",
    "status": "PROCESSING",
    "pillars": { "financial": 72, "repayment": 65, "consumption": 70, "history": 66 },
    "flags": ["Pending Review"]
  },
  {
    "id": "BEN-2024-0003",
    "name": "Amit Patel",
    "age": 45,
    "income": 40000,
    "loanAmount": 80000,
    "sciScore": 42.1,
    "riskBand": "High Risk",
    "status": "REJECTED",
    "pillars": { "financial": 38, "repayment": 42, "consumption": 28, "history": 50 },
    "flags": ["Income Mismatch", "Low Consumption Score"]
  }
]
```

---

## 📚 API Documentation

### Authentication
```typescript
// All admin endpoints require JWT token
headers: {
  'Authorization': 'Bearer <jwt_token>',
  'Content-Type': 'application/json'
}
```

### Response Format
```typescript
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2024-10-14T10:30:00Z",
    "version": "v1.3"
  }
}
```

### Error Handling
```typescript
{
  "success": false,
  "error": {
    "code": "ADMIN_ACCESS_REQUIRED",
    "message": "Admin access required",
    "statusCode": 403
  }
}
```

---

## 🔐 Security Considerations

1. **Admin Email Whitelist**: Configure via `ADMIN_EMAILS` environment variable
2. **Rate Limiting**: 100 requests per minute for admin endpoints
3. **Audit Logging**: All admin actions logged with timestamp, user, IP
4. **Data Encryption**: All sensitive data encrypted at rest and in transit
5. **Role-based Access**: Granular permissions per user role
6. **Session Management**: JWT tokens with 24-hour expiry

---

## 📞 Support & Maintenance

- **Technical Support**: tech@safecred.com
- **Documentation**: https://docs.safecred.com
- **Issue Tracking**: GitHub Issues
- **Slack Channel**: #safecred-admin

---

## ✅ Compliance Checklist

- [x] NBCFDC transparency requirements
- [x] AI/ML explainability standards
- [x] Fraud detection mechanisms
- [x] Income verification via consumption proxies
- [x] Risk banding (5 levels)
- [x] Need categorization (High/Low Need × Risk Levels)
- [x] Direct digital lending enablement
- [x] Bias monitoring and fairness scoring
- [x] Data privacy and consent management
- [x] Audit trail maintenance

---

**Version**: 1.0  
**Last Updated**: October 14, 2024  
**Prepared By**: SafeCred Technical Team
