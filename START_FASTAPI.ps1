# SafeCred FastAPI + Vite Startup Script
# This script starts SafeCred with the FastAPI Python Backend, ML API, and React/Vite Frontend.

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  SafeCred FastAPI + Vite Startup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$FRONTEND_DIR = Join-Path $SCRIPT_DIR "frontend"
$BACKEND_DIR = Join-Path $SCRIPT_DIR "backend"
$ML_DIR = Join-Path $SCRIPT_DIR "ml"

function Stop-PortIfBusy {
    param([Parameter(Mandatory = $true)][int]$Port)

    $lines = netstat -ano | Select-String ":$Port"
    if (-not $lines) { return }

    foreach ($line in $lines) {
        $parts = $line.ToString().Trim() -split '\s+'
        $procId = $parts[-1]

        if ($procId -match '^[0-9]+$') {
            try {
                Write-Host "  ⚠ Port $Port in use by PID $procId. Terminating..." -ForegroundColor Yellow
                taskkill /PID $procId /F | Out-Null
            } catch {
                Write-Host "  ❌ Failed to terminate PID $procId on port $Port" -ForegroundColor Red
            }
        }
    }
}

Write-Host "[1/4] Checking frontend dependencies..." -ForegroundColor Yellow
if (-Not (Test-Path "$FRONTEND_DIR\node_modules")) {
    Write-Host "Installing Frontend dependencies..." -ForegroundColor Cyan
    Set-Location $FRONTEND_DIR
    npm install
} else {
    Write-Host "[OK] Frontend dependencies found" -ForegroundColor Green
}
Write-Host ""

Write-Host "Stopping any processes using ports 8000, 8002, 3000..." -ForegroundColor Yellow
Stop-PortIfBusy -Port 8000
Stop-PortIfBusy -Port 8002
Stop-PortIfBusy -Port 3000
Write-Host ""

# 1. Start ML API
Write-Host "[2/4] Starting ML API Server (8002)..." -ForegroundColor Yellow
$mlCommand = @"
    cd '$ML_DIR'
    Write-Host 'Starting ML API Server on http://localhost:8002...' -ForegroundColor Green
    if (Test-Path '.\venv\Scripts\Activate.ps1') { . '.\venv\Scripts\Activate.ps1' }
    elseif (Test-Path '.\.venv\Scripts\Activate.ps1') { . '.\.venv\Scripts\Activate.ps1' }
    python application_api.py
    Read-Host 'Press Enter to close'
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $mlCommand

# 2. Start FastAPI Backend
Write-Host "[3/4] Starting FastAPI Backend (8000)..." -ForegroundColor Yellow
$backendCommand = @"
    cd '$BACKEND_DIR'
    Write-Host 'Starting FastAPI Backend on http://127.0.0.1:8000...' -ForegroundColor Green
    if (Test-Path '.\venv\Scripts\Activate.ps1') { . '.\venv\Scripts\Activate.ps1' }
    elseif (Test-Path '.\.venv\Scripts\Activate.ps1') { . '.\.venv\Scripts\Activate.ps1' }
    uvicorn app.main:app --reload --port 8000
    Read-Host 'Press Enter to close'
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand

# 3. Start Frontend
Write-Host "[4/4] Starting Vite Frontend (3000)..." -ForegroundColor Yellow
$frontendCommand = @"
    cd '$FRONTEND_DIR'
    Write-Host 'Starting React/Vite Frontend on http://localhost:3000...' -ForegroundColor Green
    npm run dev
    Read-Host 'Press Enter to close'
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  SafeCred is Starting!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "  Vite Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  FastAPI Backend: http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  ML API Server:   http://localhost:8002" -ForegroundColor White
Write-Host ""
Write-Host "Demo Credentials for Auth:" -ForegroundColor Yellow
Write-Host "  Username: admin123  (or admin)" -ForegroundColor White
Write-Host "  Password: admin123  (or password)" -ForegroundColor White
Write-Host ""
Write-Host "Opening browser in 5 seconds..." -ForegroundColor Cyan

Start-Sleep -Seconds 5
Start-Process "http://localhost:3000"
