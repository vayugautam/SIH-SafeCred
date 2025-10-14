# Test the /apply endpoint with a realistic sample

$body = @{
    name = "Rajesh Kumar"
    mobile = "9876543210"
    age = 28
    declared_income = 15000
    loan_amount = 30000
    tenure_months = 12
    has_children = $false
    is_socially_disadvantaged = $false
    consent_recharge = $true
    consent_electricity = $false
    consent_education = $false
    consent_bank_statement = $false
    consent_repayment_history = $false
    recharge_history = @{
        total_amount = 2400
        frequency = 12
        avg_amount = 200
        consistency_score = 0.85
    }
} | ConvertTo-Json

Write-Host "Testing /apply endpoint..." -ForegroundColor Cyan
Write-Host "Request Body:" -ForegroundColor Yellow
Write-Host $body

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8002/apply" -Method Post -Body $body -ContentType "application/json"
    
    Write-Host "`n✅ SUCCESS! Response:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
}
catch {
    Write-Host "`n❌ ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host "Details:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message
    }
}
