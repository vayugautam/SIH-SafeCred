-- ================================================================
-- SEED SCRIPT: Create Test User with 80+ Credit Score Guarantee
-- ================================================================
-- This script creates a user with excellent financial profile
-- to achieve 80+ credit score on first loan application
-- ================================================================

-- Step 1: Create a test user (Age 20, No Children)
INSERT INTO "User" (
    id, 
    email, 
    name, 
    password, 
    role, 
    mobile, 
    age, 
    "hasChildren", 
    "isSociallyDisadvantaged",
    "isActive",
    "isVerified",
    "createdAt", 
    "updatedAt"
)
VALUES (
    'test-user-80plus',
    'testuser80@safecred.com',
    'Test User 80Plus',
    '$2a$10$YourHashedPasswordHere123456789012345678901234567890',  -- Password: Test@123
    'USER',
    '9876543210',
    20,                    -- Age: 20
    false,                 -- No children
    false,                 -- Not socially disadvantaged
    true,                  -- Active account
    true,                  -- Verified
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Insert Bank Statement Data (Excellent Financials)
INSERT INTO "BankStatement" (
    id,
    "userId",
    "monthlyCredits",      -- ₹35,000 monthly income (high income segment)
    "salaryStd",           -- Low variance (very stable income)
    "avgBalance",          -- High savings buffer
    "createdAt",
    "updatedAt"
)
VALUES (
    gen_random_uuid(),
    'test-user-80plus',
    35000,                 -- ₹35K monthly income → income_score = 0.875
    1500,                  -- Very stable (low std) → stability_score = 0.925
    45000,                 -- Good savings → balance_score = 0.90
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- Step 3: Insert Repayment History (Excellent Payment Discipline)
-- Note: This is aggregated data from previous loans
INSERT INTO "RepaymentHistory" (
    id,
    "userId",
    "onTimeRatio",         -- 98% on-time payments
    "avgPaymentDelayDays", -- Only 1 day average delay
    "previousLoansCount",  -- 3 previous loans
    "previousDefaults",    -- ZERO defaults
    "avgPrevRepaymentRatio", -- 95% repayment ratio
    "createdAt",
    "updatedAt"
)
VALUES (
    gen_random_uuid(),
    'test-user-80plus',
    0.98,                  -- 98% on-time → ontime_score = 0.98
    1,                     -- 1 day delay → delay_score = 0.97
    3,                     -- 3 previous loans
    0,                     -- ZERO defaults (critical!)
    0.95,                  -- 95% repayment → history_score = 0.95
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- Step 4: Insert Recharge History (Good Consumption Pattern)
INSERT INTO "RechargeHistory" (
    id,
    "userId",
    "rechargeFreqPerMonth", -- 8 recharges per month
    "avgRechargeAmount",    -- Average ₹299
    "totalRechargeAmount",  -- Total ₹2,392 per month
    "createdAt",
    "updatedAt"
)
VALUES (
    gen_random_uuid(),
    'test-user-80plus',
    8,                     -- Regular recharges → recharge_score = 0.80
    299,
    2392,
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- Step 5: Insert Electricity Bill Data (Very Consistent)
INSERT INTO "ElectricityBill" (
    id,
    "userId",
    "billConsistency",     -- Very low variance (consistent)
    "avgMonthlyUnits",     -- Average units consumed
    "avgMonthlyAmount",    -- Average bill amount
    "createdAt",
    "updatedAt"
)
VALUES (
    gen_random_uuid(),
    'test-user-80plus',
    0.10,                  -- Very consistent → elec_score = 0.90
    150,                   -- 150 units per month
    1200,                  -- ₹1,200 average bill
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Check if user was created
SELECT 
    email, 
    name, 
    mobile, 
    age, 
    "hasChildren",
    "isSociallyDisadvantaged"
FROM "User" 
WHERE id = 'test-user-80plus';

-- Check bank statement
SELECT 
    "monthlyCredits" as "Monthly Income",
    "salaryStd" as "Income Variance",
    "avgBalance" as "Average Balance"
FROM "BankStatement" 
WHERE "userId" = 'test-user-80plus';

-- Check repayment history
SELECT 
    "onTimeRatio" as "On-Time %",
    "avgPaymentDelayDays" as "Avg Delay (days)",
    "previousLoansCount" as "Previous Loans",
    "previousDefaults" as "Defaults",
    "avgPrevRepaymentRatio" as "Repayment %"
FROM "RepaymentHistory" 
WHERE "userId" = 'test-user-80plus';

-- Check consumption data
SELECT 
    (SELECT "rechargeFreqPerMonth" FROM "RechargeHistory" WHERE "userId" = 'test-user-80plus') as "Recharges/Month",
    (SELECT "billConsistency" FROM "ElectricityBill" WHERE "userId" = 'test-user-80plus') as "Bill Consistency"
;

-- ================================================================
-- EXPECTED CREDIT SCORE CALCULATION
-- ================================================================
-- 
-- USER SEGMENT: high_income_repayment_focused (income ≥ ₹15K)
--
-- PILLAR SCORES:
--   Financial:   0.91  (income 0.875 + stability 0.925 + balance 0.90 + loan-to-income 1.0)
--   Repayment:   0.975 (on-time 0.98 + delay 0.97)
--   Consumption: 0.75  (electricity 0.90 + recharge 0.80)
--   History:     0.95  (excellent repayment ratio)
--
-- PILLAR WEIGHTS (high income user):
--   Financial:   35%
--   Repayment:   50% (highest weight!)
--   Consumption:  5%
--   History:     10%
--
-- COMPOSITE SCORE:
--   = 0.35×0.91 + 0.50×0.975 + 0.05×0.75 + 0.10×0.95
--   = 0.3185 + 0.4875 + 0.0375 + 0.095
--   = 0.9385
--   = 93.85/100 ✅
--
-- ML PROBABILITY (with this profile): ~0.78-0.82
--
-- FINAL SCI:
--   = 0.6 × 0.80 + 0.4 × 93.85
--   = 48.0 + 37.54
--   = 85.54/100 ✅✅
--
-- ================================================================

-- ================================================================
-- CLEANUP (if needed - removes test user)
-- ================================================================
-- Uncomment to delete test user and all related data:
/*
DELETE FROM "ElectricityBill" WHERE "userId" = 'test-user-80plus';
DELETE FROM "RechargeHistory" WHERE "userId" = 'test-user-80plus';
DELETE FROM "RepaymentHistory" WHERE "userId" = 'test-user-80plus';
DELETE FROM "BankStatement" WHERE "userId" = 'test-user-80plus';
DELETE FROM "Application" WHERE "userId" = 'test-user-80plus';
DELETE FROM "User" WHERE id = 'test-user-80plus';
*/
