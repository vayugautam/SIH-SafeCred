# Admin Dashboard Testing Guide

## Overview
The admin dashboard provides comprehensive insights into SafeCred operations, including fraud detection, risk analysis, and detailed analytics.

## Access Requirements

### Admin Email Configuration
Add your admin email to the backend `.env` file:
```env
ADMIN_EMAILS=admin@safecred.com,youremail@example.com
```

Multiple emails can be comma-separated.

## Features

### 1. Fraud Detection Tab 🛡️
**Purpose**: Monitor income verification and detect fraudulent applications

**Metrics Displayed**:
- **Income Inflation Cases**: Applications where consumption-based income verification shows mismatches
- **Suspected Fraud Cases**: Applications flagged by negative score adjustments or low consumption scores
- **Clean Applications**: Total applications minus suspected fraud

**Fraud Indicators** (sorted by severity):
- Income-Consumption Mismatch (High Severity)
- Negative Score Adjustments (Medium Severity)
- Missing Verification Data (Low Severity)

**Income Verification Methods**:
- Consumption-Based: Using electricity bills, recharges, and spending patterns
- Bank Statements: Traditional verification via bank account analysis
- Repayment History: Checking past loan repayment behavior

### 2. Risk Analysis Tab 📊
**Purpose**: Understand risk distribution and borrower demographics

**Components**:

#### Risk Distribution
5-band breakdown:
- Very Low Risk (Green)
- Low Risk (Blue)
- Medium Risk (Yellow)
- High Risk (Orange)
- Very High Risk (Red)

#### Need Category Matrix
6-category grid showing distribution across:
- Low Need + Low Risk
- Low Need + Medium Risk
- Low Need + High Risk
- High Need + Low Risk
- High Need + Medium Risk
- High Need + High Risk

#### Demographics
- **Age Groups**: 18-25, 26-35, 36-45, 46-60, 60+
- **Has Children**: Yes/No with average score comparison
- **Socially Disadvantaged**: Yes/No with average score comparison

#### Score Insights
- Average Final SCI
- Average Composite Score
- High Confidence Approvals (ML probability > 0.8)
- Auto Approval Rate
- Manual Review Rate

#### Loan Metrics
- Total Disbursed (count & amount)
- Average Loan Size
- Largest/Smallest Loans

### 3. Trends Tab 📈
**Purpose**: Track temporal patterns in application processing

Shows 14-day rolling window with:
- Daily application count
- Daily approval count
- Average risk score per day

### 4. Recent Decisions Tab 🎯
**Purpose**: Detailed view of last 10 processed applications

**For Each Decision**:
- Application ID
- Status (Approved/Rejected/Processing)
- Risk Band
- Need Category
- Final SCI score
- Composite score
- **Top 3 Score Factors**: Shows which factors contributed most to the final decision
  - Green badges: Positive contribution
  - Red badges: Negative contribution

## API Endpoint

**Endpoint**: `GET /api/admin/analytics`

**Authentication**: Required (JWT token)

**Authorization**: User's email must be in `ADMIN_EMAILS` environment variable

## Testing Steps

### 1. Setup Admin Access
```bash
# In backend/.env
ADMIN_EMAILS=admin@safecred.com
```

### 2. Start Services
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: ML Service (if testing score details)
cd ml
python application_api.py
```

### 3. Register Admin User
1. Go to http://localhost:3000/register
2. Register with email: `admin@safecred.com`
3. Complete registration

### 4. Login as Admin
1. Go to http://localhost:3000/login
2. Login with admin credentials
3. Navigate to http://localhost:3000/admin

### 5. Test Dashboard Features

#### Fraud Detection Testing
- Submit test applications with:
  - High income but low consumption → Should flag as income inflation
  - Missing consumption data → Should show in verification stats
- Check fraud indicators update correctly

#### Risk Analysis Testing
- Verify risk distribution shows correct percentages
- Check need category matrix populates based on applications
- Confirm demographics calculations are accurate

#### Trends Testing
- Submit applications on different days
- Verify 14-day rolling window updates
- Check approval/rejection trends

#### Recent Decisions Testing
- Process some applications (approve/reject)
- Verify they appear in recent decisions
- Check score breakdown displays correctly

## Expected Behavior

### Access Control
- ✅ Admin users see full dashboard
- ❌ Non-admin users get 403 Forbidden error and redirect to /dashboard

### Data Accuracy
- All percentages should sum to 100% where applicable
- Fraud detection should catch consumption-income mismatches
- Risk bands should align with SCI scores:
  - 80+ → Very Low Risk
  - 65-79 → Low Risk
  - 50-64 → Medium Risk
  - 35-49 → High Risk
  - <35 → Very High Risk

### Performance
- Dashboard should load within 2 seconds for <1000 applications
- Refresh button should update all metrics
- No console errors

## SIH Compliance Checklist

✅ **Fraud Detection**: Income verification via consumption patterns  
✅ **Risk Banding**: 5-level classification  
✅ **Need Categorization**: 6-category matrix (Need × Risk)  
✅ **Transparent Scoring**: Score breakdown visible in Recent Decisions  
✅ **Direct Lending**: Auto-approval metrics tracked  
✅ **Income Assessment**: Multiple verification methods (consumption, bank, repayment)  
✅ **Demographics**: Children, socially disadvantaged tracking  
✅ **Temporal Analysis**: 14-day trends  
✅ **Owner Visibility**: Complete operational overview  

## Troubleshooting

### "Admin access required" Error
- Check `ADMIN_EMAILS` in backend `.env`
- Verify email matches exactly (case-insensitive)
- Restart backend server after changing env file

### Empty Dashboard
- Ensure applications exist in database
- Run `npm run dev` in backend to check Prisma connection
- Verify ML service is running for score details

### Missing Score Details
- ML service must be running to generate score breakdowns
- Check `scoreDetails` field in database is populated
- Verify application was processed through ML scoring endpoint

### Compilation Errors
```bash
# Backend
cd backend
npm install
npm run build

# Frontend
cd frontend
npm install
npm run dev
```

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live dashboard
2. **Data Export**: Download analytics as CSV/PDF
3. **Alerts**: Email notifications for high fraud percentage
4. **Filters**: Date range, status, risk band filtering
5. **Charts**: Visual graphs for trends and distributions
6. **User Management**: Add/remove admin users from UI
7. **Audit Logs**: Track all admin actions

## Support

For issues or questions:
1. Check backend logs: `cd backend && npm run dev`
2. Check frontend console: Browser DevTools (F12)
3. Verify ML service: `curl http://localhost:8001/health`
4. Review Prisma schema: `backend/prisma/schema.prisma`
