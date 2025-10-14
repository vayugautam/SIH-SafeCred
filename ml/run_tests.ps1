# SafeCred ML API - Comprehensive Test Suite
# Tests all endpoints with different scenarios

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   SafeCred ML API - Test Suite" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://127.0.0.1:8002"
$allTestsPassed = $true

# Helper function to display test results
function Test-Endpoint {
    param(
        [string]$TestName,
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null
    )
    
    Write-Host "Testing: $TestName" -ForegroundColor Yellow
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri "$baseUrl$Endpoint" -Method Get -TimeoutSec 10
        } else {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-RestMethod -Uri "$baseUrl$Endpoint" -Method Post -Body $jsonBody -ContentType "application/json" -TimeoutSec 10
        }
        
        Write-Host "  ✅ PASSED" -ForegroundColor Green
        Write-Host "  Response: $($response | ConvertTo-Json -Compress -Depth 2)" -ForegroundColor Gray
        Write-Host ""
        return $true
    }
    catch {
        Write-Host "  ❌ FAILED" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
        Write-Host ""
        return $false
    }
}

# Test 1: Health Check
Write-Host "[1/5] Health Check Endpoint" -ForegroundColor Cyan
if (-not (Test-Endpoint -TestName "GET /health" -Method "GET" -Endpoint "/health")) {
    $allTestsPassed = $false
}

# Test 2: New User with Alternative Proxies (Poor Income)
Write-Host "[2/5] New User - Low Income with Alternative Proxies" -ForegroundColor Cyan
$newUserLowIncome = @{
    name = "Ramesh Kumar"
    mobile = "9876543210"
    age = 25
    declared_income = 8000
    loan_amount = 15000
    tenure_months = 12
    has_children = $false
    is_socially_disadvantaged = $true
    consent_recharge = $true
    consent_electricity = $true
    recharge_history = @{
        total_amount = 3600
        frequency = 12
        avg_amount = 300
        consistency_score = 0.9
    }
    electricity_bills = @{
        total_paid = 12000
        frequency = 12
        avg_payment = 1000
        consistency = 0.85
        ontime_ratio = 0.9
    }
}
if (-not (Test-Endpoint -TestName "POST /apply (New User - Low Income)" -Method "POST" -Endpoint "/apply" -Body $newUserLowIncome)) {
    $allTestsPassed = $false
}

# Test 3: High Income User with Repayment History
Write-Host "[3/5] High Income User with Repayment History" -ForegroundColor Cyan
$highIncomeUser = @{
    name = "Priya Sharma"
    mobile = "9123456789"
    age = 35
    declared_income = 50000
    loan_amount = 100000
    tenure_months = 24
    has_children = $true
    is_socially_disadvantaged = $false
    consent_repayment_history = $true
    consent_bank_statement = $true
    bank_statement = @{
        monthly_credits = 55000
        avg_balance = 25000
        total_debits = 40000
        salary_count = 1
        bounce_count = 0
        total_credits = 660000
    }
    repayment_history = @{
        total_loans = 3
        defaulted_count = 0
        timely_payments = 36
        total_payments = 36
        avg_utilization = 0.65
    }
}
if (-not (Test-Endpoint -TestName "POST /apply (High Income User)" -Method "POST" -Endpoint "/apply" -Body $highIncomeUser)) {
    $allTestsPassed = $false
}

# Test 4: New User with Education Fees (Has Children)
Write-Host "[4/5] New User with Children - Education Fees" -ForegroundColor Cyan
$userWithEducation = @{
    name = "Suresh Patel"
    mobile = "9988776655"
    age = 40
    declared_income = 20000
    loan_amount = 50000
    tenure_months = 18
    has_children = $true
    is_socially_disadvantaged = $false
    consent_education = $true
    education_fees = @{
        total_paid = 48000
        frequency = 12
        avg_fee = 4000
        consistency = 0.95
        ontime_ratio = 1.0
    }
}
if (-not (Test-Endpoint -TestName "POST /apply (Education Fees)" -Method "POST" -Endpoint "/apply" -Body $userWithEducation)) {
    $allTestsPassed = $false
}

# Test 5: Comprehensive Application (All Data)
Write-Host "[5/5] Comprehensive Application - All Data Sources" -ForegroundColor Cyan
$comprehensiveApp = @{
    name = "Anjali Verma"
    mobile = "9876501234"
    age = 30
    declared_income = 35000
    loan_amount = 80000
    tenure_months = 36
    has_children = $true
    is_socially_disadvantaged = $false
    consent_recharge = $true
    consent_electricity = $true
    consent_education = $true
    consent_bank_statement = $true
    consent_repayment_history = $true
    recharge_history = @{
        total_amount = 6000
        frequency = 12
        avg_amount = 500
        consistency_score = 0.9
    }
    electricity_bills = @{
        total_paid = 18000
        frequency = 12
        avg_payment = 1500
        consistency = 0.88
        ontime_ratio = 0.92
    }
    education_fees = @{
        total_paid = 60000
        frequency = 12
        avg_fee = 5000
        consistency = 0.95
        ontime_ratio = 0.95
    }
    bank_statement = @{
        monthly_credits = 38000
        avg_balance = 15000
        total_debits = 30000
        salary_count = 1
        bounce_count = 0
        total_credits = 456000
    }
    repayment_history = @{
        total_loans = 2
        defaulted_count = 0
        timely_payments = 24
        total_payments = 24
        avg_utilization = 0.7
    }
}
if (-not (Test-Endpoint -TestName "POST /apply (Comprehensive)" -Method "POST" -Endpoint "/apply" -Body $comprehensiveApp)) {
    $allTestsPassed = $false
}

# Summary
Write-Host "================================================" -ForegroundColor Cyan
if ($allTestsPassed) {
    Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "The ML API is working correctly." -ForegroundColor Green
} else {
    Write-Host "❌ SOME TESTS FAILED!" -ForegroundColor Red
    Write-Host "Please check the server logs for errors." -ForegroundColor Yellow
}
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Provide next steps
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Set up ngrok for remote access: .\setup_ngrok.ps1" -ForegroundColor White
Write-Host "2. View API documentation: http://127.0.0.1:8002/docs" -ForegroundColor White
Write-Host "3. Share documentation with team (see DEPLOYMENT_SUCCESS.md)" -ForegroundColor White
Write-Host ""
