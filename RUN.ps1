# SafeCred Quick Run Script
# Use this after initial setup is complete

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SafeCred Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$APP_DIR = Join-Path $SCRIPT_DIR "app"
$BACKEND_DIR = Join-Path $SCRIPT_DIR "backend"
$ML_DIR = Join-Path $SCRIPT_DIR "ml"

function Stop-PortIfBusy {
    param(
        [Parameter(Mandatory = $true)][int]$Port
    )

    $lines = netstat -ano | Select-String ":$Port"
    if (-not $lines) {
        return
    }

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

Write-Host "Stopping any processes using required ports..." -ForegroundColor Yellow
Stop-PortIfBusy -Port 8002
Stop-PortIfBusy -Port 3001
Stop-PortIfBusy -Port 3002
Write-Host ""

Write-Host "Starting ML API Server (Port 8002)..." -ForegroundColor Yellow
Set-Location $ML_DIR

$mlCommand = @(
    "cd '$ML_DIR'",
    "if (Test-Path .\\.venv\\Scripts\\Activate.ps1) { . .\\.venv\\Scripts\\Activate.ps1 }",
    "`$env:DATABASE_URL='$($env:DATABASE_URL)'",
    "python application_api.py"
) -join '; '

Start-Process powershell -ArgumentList "-NoExit", "-Command", $mlCommand -WindowStyle Normal

Write-Host "  ✓ ML API starting on http://localhost:8002" -ForegroundColor Green
Write-Host ""

Start-Sleep -Seconds 3

Write-Host "Starting Backend API (Port 3001)..." -ForegroundColor Yellow
Set-Location $BACKEND_DIR

$backendCommand = "cd '$BACKEND_DIR'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand -WindowStyle Normal

Write-Host "  ✓ Backend starting on http://localhost:3001" -ForegroundColor Green
Write-Host ""

Start-Sleep -Seconds 3

Write-Host "Starting Next.js Frontend (Port 3002)..." -ForegroundColor Yellow
Set-Location $APP_DIR

$frontendCommand = "cd '$APP_DIR'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand -WindowStyle Normal

Write-Host "  ✓ Frontend starting on http://localhost:3002" -ForegroundColor Green
Write-Host ""

Start-Sleep -Seconds 5

Write-Host "========================================" -ForegroundColor Green
Write-Host "  SafeCred is running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3002" -ForegroundColor White
Write-Host "  Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "  ML API:   http://localhost:8002" -ForegroundColor White
Write-Host ""
Write-Host "Demo Accounts:" -ForegroundColor Cyan
Write-Host "  User:  demo@safecred.com / User@123" -ForegroundColor White
Write-Host "  Admin: admin@safecred.com / Admin@123" -ForegroundColor White
Write-Host ""

Start-Sleep -Seconds 2
Start-Process "http://localhost:3002"

Write-Host "Browser opened. Press Ctrl+C in server windows to stop." -ForegroundColor Yellow
