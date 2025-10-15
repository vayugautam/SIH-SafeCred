# SafeCred Simple Startup Script
# This script starts SafeCred with minimal configuration

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  SafeCred Simple Startup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$APP_DIR = "e:\SIH Synapse\SIH-SafeCred\app"
$ML_DIR = "e:\SIH Synapse\SIH-SafeCred\ml"

Write-Host "[1/4] Checking if dependencies are installed..." -ForegroundColor Yellow

if (-Not (Test-Path "$APP_DIR\node_modules")) {
    Write-Host "Installing Node.js dependencies..." -ForegroundColor Cyan
    Set-Location $APP_DIR
    npm install
} else {
    Write-Host "[OK] Node.js dependencies found" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/4] Checking database setup..." -ForegroundColor Yellow

if (-Not (Test-Path "$APP_DIR\.env")) {
    Write-Host "[ERROR] .env file not found!" -ForegroundColor Red
    Write-Host "Please create app\.env with your database configuration" -ForegroundColor Yellow
    Write-Host "See app\.env.example for template" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] .env file found" -ForegroundColor Green
Write-Host ""

Write-Host "[3/4] Starting ML API Server..." -ForegroundColor Yellow
Write-Host "Opening new terminal for ML API..." -ForegroundColor Cyan

$mlCommand = "cd '$ML_DIR'; Write-Host 'Starting ML API Server...' -ForegroundColor Green; python application_api.py; Read-Host 'Press Enter to close'"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $mlCommand

Write-Host "[OK] ML API terminal opened" -ForegroundColor Green
Write-Host ""

Write-Host "[4/4] Starting Next.js Development Server..." -ForegroundColor Yellow
Write-Host "Opening new terminal for Next.js..." -ForegroundColor Cyan

$nextCommand = "cd '$APP_DIR'; Write-Host 'Starting Next.js Development Server...' -ForegroundColor Green; npm run dev; Read-Host 'Press Enter to close'"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $nextCommand

Write-Host "[OK] Next.js terminal opened" -ForegroundColor Green
Write-Host ""

Start-Sleep -Seconds 5

Write-Host "=====================================" -ForegroundColor Green
Write-Host "  SafeCred is Starting!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Please wait for both servers to start..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  ML API:   http://localhost:8001" -ForegroundColor White
Write-Host "  API Docs: http://localhost:8001/docs" -ForegroundColor White
Write-Host ""
Write-Host "Demo Accounts:" -ForegroundColor Yellow
Write-Host "  User:  demo@safecred.com / User@123" -ForegroundColor White
Write-Host "  Admin: admin@safecred.com / Admin@123" -ForegroundColor White
Write-Host ""
Write-Host "Opening browser in 10 seconds..." -ForegroundColor Cyan

Start-Sleep -Seconds 10
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Browser opened! Close the terminal windows to stop servers." -ForegroundColor Green
