# SafeCred ML API - Quick Start Script
# Run this to start the ML API server easily

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   SafeCred ML API - Starting Server" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
if (-Not (Test-Path "E:\SIH Synapse\.venv\Scripts\python.exe")) {
    Write-Host "❌ Virtual environment not found!" -ForegroundColor Red
    Write-Host "Please ensure the virtual environment is set up at: E:\SIH Synapse\.venv" -ForegroundColor Yellow
    exit 1
}

# Navigate to ml directory
Set-Location "e:\SIH Synapse\SIH-SafeCred\ml"

Write-Host "✅ Checking dependencies..." -ForegroundColor Green
$pythonPath = "E:/SIH Synapse/.venv/Scripts/python.exe"

# Quick dependency check
try {
    & $pythonPath -c "import fastapi, uvicorn, pandas, sklearn, joblib" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ All dependencies installed" -ForegroundColor Green
    } else {
        throw "Dependencies missing"
    }
}
catch {
    Write-Host "⚠️  Some dependencies may be missing. Installing..." -ForegroundColor Yellow
    & $pythonPath -m pip install -q fastapi uvicorn pydantic scikit-learn pandas numpy joblib scipy python-multipart
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting ML API Server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Server will be available at:" -ForegroundColor Yellow
Write-Host "  - Local:  http://127.0.0.1:8002" -ForegroundColor White
Write-Host "  - Health: http://127.0.0.1:8002/health" -ForegroundColor White
Write-Host "  - Docs:   http://127.0.0.1:8002/docs" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Start the server
& $pythonPath application_api.py
