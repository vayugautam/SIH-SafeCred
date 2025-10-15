# SafeCred Quick Run Script
# Use this after initial setup is complete

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SafeCred Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$APP_DIR = Join-Path $SCRIPT_DIR "app"
$ML_DIR = Join-Path $SCRIPT_DIR "ml"

# Check if .env exists
if (-not (Test-Path (Join-Path $APP_DIR ".env"))) {
    Write-Host "⚠ .env file not found. Please run SETUP_AND_RUN.ps1 first." -ForegroundColor Red
    exit 1
}

# Load environment variables
Get-Content (Join-Path $APP_DIR ".env") | ForEach-Object {
    if ($_ -match '^DATABASE_URL="(.+)"$') {
        $env:DATABASE_URL = $matches[1]
    }
}

Write-Host "Starting ML API Server..." -ForegroundColor Yellow
Set-Location $ML_DIR

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ML_DIR'; `$env:DATABASE_URL='$($env:DATABASE_URL)'; python application_api.py" -WindowStyle Normal

Write-Host "  ✓ ML API starting on http://localhost:8001" -ForegroundColor Green
Write-Host ""

Start-Sleep -Seconds 3

Write-Host "Starting Next.js Development Server..." -ForegroundColor Yellow
Set-Location $APP_DIR

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$APP_DIR'; npm run dev" -WindowStyle Normal

Write-Host "  ✓ Next.js starting on http://localhost:3000" -ForegroundColor Green
Write-Host ""

Start-Sleep -Seconds 5

Write-Host "========================================" -ForegroundColor Green
Write-Host "  SafeCred is running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  ML API:   http://localhost:8001" -ForegroundColor White
Write-Host ""
Write-Host "Demo Accounts:" -ForegroundColor Cyan
Write-Host "  User:  demo@safecred.com / User@123" -ForegroundColor White
Write-Host "  Admin: admin@safecred.com / Admin@123" -ForegroundColor White
Write-Host ""

Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"

Write-Host "Browser opened. Press Ctrl+C in server windows to stop." -ForegroundColor Yellow
