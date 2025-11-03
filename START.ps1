# SafeCred Simple Startup Script
# This script starts SafeCred with minimal configuration

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  SafeCred Simple Startup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$APP_DIR = "e:\SIH Synapse\SIH-SafeCred\app"
$BACKEND_DIR = "e:\SIH Synapse\SIH-SafeCred\backend"
$ML_DIR = "e:\SIH Synapse\SIH-SafeCred\ml"

function Stop-PortIfBusy {
    param([Parameter(Mandatory = $true)][int]$Port)

    $lines = netstat -ano | Select-String ":$Port"
    if (-not $lines) { return }

    foreach ($line in $lines) {
        $parts = $line.ToString().Trim().Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)
        $pid = $parts[-1]

        if ($pid -match '^[0-9]+$') {
            try {
                Write-Host "  ⚠ Port $Port in use by PID $pid. Terminating..." -ForegroundColor Yellow
                taskkill /PID $pid /F | Out-Null
            } catch {
                Write-Host "  ❌ Failed to terminate PID $pid on port $Port" -ForegroundColor Red
            }
        }
    }
}

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

Write-Host "Stopping any processes using ports 8002, 3001, 3002..." -ForegroundColor Yellow
Stop-PortIfBusy -Port 8002
Stop-PortIfBusy -Port 3001
Stop-PortIfBusy -Port 3002
Write-Host ""

Write-Host "[3/6] Starting ML API Server (8002)..." -ForegroundColor Yellow
Write-Host "Opening new terminal for ML API..." -ForegroundColor Cyan

$mlCommand = @(
    "cd '$ML_DIR'",
    "Write-Host 'Starting ML API Server on http://localhost:8002...' -ForegroundColor Green",
    "if (Test-Path .\\.venv\\Scripts\\Activate.ps1) { . .\\.venv\\Scripts\\Activate.ps1 }",
    "python application_api.py",
    "Read-Host 'Press Enter to close'"
) -join '; '

Start-Process powershell -ArgumentList "-NoExit", "-Command", $mlCommand

Write-Host "[OK] ML API terminal opened" -ForegroundColor Green
Write-Host ""

Write-Host "[4/6] Starting Backend API (3001)..." -ForegroundColor Yellow
Write-Host "Opening new terminal for backend..." -ForegroundColor Cyan

$backendCommand = "cd '$BACKEND_DIR'; Write-Host 'Starting Backend API on http://localhost:3001...' -ForegroundColor Green; npm run dev; Read-Host 'Press Enter to close'"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand

Write-Host "[OK] Backend terminal opened" -ForegroundColor Green
Write-Host ""

Write-Host "[5/6] Starting Next.js Development Server (3002)..." -ForegroundColor Yellow
Write-Host "Opening new terminal for Next.js..." -ForegroundColor Cyan

$nextCommand = "cd '$APP_DIR'; Write-Host 'Starting Next.js Development Server on http://localhost:3002...' -ForegroundColor Green; npm run dev; Read-Host 'Press Enter to close'"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $nextCommand

Write-Host "[OK] Next.js terminal opened" -ForegroundColor Green
Write-Host ""

Start-Sleep -Seconds 5

Write-Host "[6/6] Launching browser..." -ForegroundColor Yellow

Write-Host "=====================================" -ForegroundColor Green
Write-Host "  SafeCred is Starting!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Please wait for both servers to start..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3002" -ForegroundColor White
Write-Host "  Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "  ML API:   http://localhost:8002" -ForegroundColor White
Write-Host "  API Docs: http://localhost:8002/docs" -ForegroundColor White
Write-Host ""
Write-Host "Demo Accounts:" -ForegroundColor Yellow
Write-Host "  User:  demo@safecred.com / User@123" -ForegroundColor White
Write-Host "  Admin: admin@safecred.com / Admin@123" -ForegroundColor White
Write-Host ""
Write-Host "Opening browser in 10 seconds..." -ForegroundColor Cyan

Start-Sleep -Seconds 10
Start-Process "http://localhost:3002"

Write-Host ""
Write-Host "Browser opened! Close the terminal windows to stop servers." -ForegroundColor Green
