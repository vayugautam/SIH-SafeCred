# SafeCred Manual Setup Guide# 🚀 SafeCred - Quick Setup Script

# Follow these steps to set up SafeCred

Write-Host "================================================" -ForegroundColor Cyan

Write-Host "========================================" -ForegroundColor CyanWrite-Host "   SafeCred Full-Stack Application Setup" -ForegroundColor Cyan

Write-Host "  SafeCred Manual Setup Guide" -ForegroundColor CyanWrite-Host "================================================" -ForegroundColor Cyan

Write-Host "========================================" -ForegroundColor CyanWrite-Host ""

Write-Host ""

$rootDir = "e:\SIH Synapse\SIH-SafeCred"

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.PathSet-Location $rootDir

$APP_DIR = Join-Path $SCRIPT_DIR "app"

$ML_DIR = Join-Path $SCRIPT_DIR "ml"# Check if PostgreSQL is running

Write-Host "📊 Checking PostgreSQL..." -ForegroundColor Yellow

Write-Host "Step 1: Database Configuration" -ForegroundColor Yellow$pgRunning = Get-Process postgres -ErrorAction SilentlyContinue

Write-Host "--------------------------------------" -ForegroundColor Grayif (-not $pgRunning) {

Write-Host "Please provide your PostgreSQL details:" -ForegroundColor White    Write-Host "⚠️  PostgreSQL not running. Please start PostgreSQL first!" -ForegroundColor Red

Write-Host ""    Write-Host ""

    Write-Host "To start PostgreSQL:" -ForegroundColor Yellow

$dbUser = Read-Host "PostgreSQL username (default: postgres)"    Write-Host "  - Windows: Start 'PostgreSQL' service from Services" -ForegroundColor Gray

if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "postgres" }    Write-Host "  - Or use: pg_ctl start" -ForegroundColor Gray

    Write-Host ""

$dbPassword = Read-Host "PostgreSQL password" -AsSecureString    $continue = Read-Host "Continue anyway? (y/n)"

$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(    if ($continue -ne 'y') {

    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)        exit

)    }

}

$dbHost = Read-Host "PostgreSQL host (default: localhost)"

if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "localhost" }# Setup Backend

Write-Host ""

$dbPort = Read-Host "PostgreSQL port (default: 5432)"Write-Host "📦 Setting up Backend..." -ForegroundColor Yellow

if ([string]::IsNullOrWhiteSpace($dbPort)) { $dbPort = "5432" }Set-Location "$rootDir\backend"



$dbName = Read-Host "Database name (default: safecred_db)"if (-not (Test-Path ".env")) {

if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "safecred_db" }    Write-Host "Creating .env file..." -ForegroundColor Gray

    Copy-Item ".env.example" ".env"

$DATABASE_URL = "postgresql://${dbUser}:${dbPasswordPlain}@${dbHost}:${dbPort}/${dbName}?schema=public"    Write-Host "⚠️  Please edit backend/.env and update DATABASE_URL with your PostgreSQL password!" -ForegroundColor Red

    $continue = Read-Host "Press Enter after updating .env file..."

Write-Host ""}

Write-Host "Step 2: Generate NextAuth Secret" -ForegroundColor Yellow

Write-Host "--------------------------------------" -ForegroundColor GrayWrite-Host "Installing backend dependencies..." -ForegroundColor Gray

npm install

$bytes = New-Object Byte[] 32

[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)Write-Host "Generating Prisma Client..." -ForegroundColor Gray

$NEXTAUTH_SECRET = [Convert]::ToBase64String($bytes)npm run prisma:generate



Write-Host "[OK] Generated NEXTAUTH_SECRET" -ForegroundColor GreenWrite-Host "Running database migrations..." -ForegroundColor Gray

Write-Host ""npm run prisma:migrate



Write-Host "Step 3: Create .env file" -ForegroundColor YellowWrite-Host "✅ Backend setup complete!" -ForegroundColor Green

Write-Host "--------------------------------------" -ForegroundColor Gray

# Setup Frontend

$envContent = @"Write-Host ""

# DatabaseWrite-Host "📦 Setting up Frontend..." -ForegroundColor Yellow

DATABASE_URL="$DATABASE_URL"Set-Location "$rootDir\frontend"



# NextAuthif (-not (Test-Path ".env.local")) {

NEXTAUTH_URL="http://localhost:3000"    Write-Host "Creating .env.local file..." -ForegroundColor Gray

NEXTAUTH_SECRET="$NEXTAUTH_SECRET"    Copy-Item ".env.local.example" ".env.local"

}

# ML API

ML_API_URL="http://localhost:8001"Write-Host "Installing frontend dependencies..." -ForegroundColor Gray

npm install

# App Configuration

NODE_ENV="development"Write-Host "✅ Frontend setup complete!" -ForegroundColor Green

"@

# Check ML Server

$envFile = Join-Path $APP_DIR ".env"Write-Host ""

Set-Content -Path $envFile -Value $envContentWrite-Host "🤖 Checking ML Server..." -ForegroundColor Yellow

try {

Write-Host "[OK] Created .env file" -ForegroundColor Green    $mlHealth = Invoke-RestMethod -Uri "http://127.0.0.1:8002/health" -Method Get -ErrorAction Stop

Write-Host ""    Write-Host "✅ ML Server is running!" -ForegroundColor Green

} catch {

Write-Host "Step 4: Create Database" -ForegroundColor Yellow    Write-Host "⚠️  ML Server not running!" -ForegroundColor Red

Write-Host "--------------------------------------" -ForegroundColor Gray    Write-Host "Starting ML Server..." -ForegroundColor Yellow

    Set-Location "$rootDir\ml"

$env:PGPASSWORD = $dbPasswordPlain    Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\start_server.ps1"

$dbExists = psql -U $dbUser -h $dbHost -p $dbPort -lqt 2>$null | Select-String -Pattern $dbName -Quiet    Start-Sleep -Seconds 5

}

if ($dbExists) {

    Write-Host "Database '$dbName' already exists" -ForegroundColor Yellow# Summary

    $recreate = Read-Host "Drop and recreate? (yes/no)"Write-Host ""

    if ($recreate -eq "yes") {Write-Host "================================================" -ForegroundColor Cyan

        psql -U $dbUser -h $dbHost -p $dbPort -c "DROP DATABASE IF EXISTS $dbName;" 2>$nullWrite-Host "   ✅ Setup Complete!" -ForegroundColor Green

        psql -U $dbUser -h $dbHost -p $dbPort -c "CREATE DATABASE $dbName;" 2>$nullWrite-Host "================================================" -ForegroundColor Cyan

        Write-Host "[OK] Database recreated" -ForegroundColor GreenWrite-Host ""

    }Write-Host "🌐 To start the application:" -ForegroundColor Yellow

} else {Write-Host ""

    psql -U $dbUser -h $dbHost -p $dbPort -c "CREATE DATABASE $dbName;" 2>$nullWrite-Host "1. Start Backend:" -ForegroundColor White

    Write-Host "[OK] Database created" -ForegroundColor GreenWrite-Host "   cd backend" -ForegroundColor Gray

}Write-Host "   npm run dev" -ForegroundColor Gray

Write-Host ""

Remove-Item Env:PGPASSWORDWrite-Host "2. Start Frontend:" -ForegroundColor White

Write-Host ""Write-Host "   cd frontend" -ForegroundColor Gray

Write-Host "   npm run dev" -ForegroundColor Gray

Write-Host "Step 5: Install Node Dependencies" -ForegroundColor YellowWrite-Host ""

Write-Host "--------------------------------------" -ForegroundColor GrayWrite-Host "3. Access Application:" -ForegroundColor White

Set-Location $APP_DIRWrite-Host "   Frontend: http://localhost:3000" -ForegroundColor Gray

Write-Host "   Backend:  http://localhost:3001" -ForegroundColor Gray

Write-Host "Installing npm packages..." -ForegroundColor CyanWrite-Host "   ML API:   http://127.0.0.1:8002" -ForegroundColor Gray

npm installWrite-Host ""

Write-Host "📖 Read FULLSTACK_README.md for detailed documentation" -ForegroundColor Cyan

if ($LASTEXITCODE -eq 0) {Write-Host ""

    Write-Host "[OK] Node dependencies installed" -ForegroundColor Green

} else {$startNow = Read-Host "Start servers now? (y/n)"

    Write-Host "[ERROR] Failed to install Node dependencies" -ForegroundColor Redif ($startNow -eq 'y') {

    exit 1    Set-Location "$rootDir\backend"

}    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

    

Write-Host ""    Start-Sleep -Seconds 3

    

Write-Host "Step 6: Setup Prisma" -ForegroundColor Yellow    Set-Location "$rootDir\frontend"

Write-Host "--------------------------------------" -ForegroundColor Gray    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

    

Write-Host "Generating Prisma Client..." -ForegroundColor Cyan    Write-Host ""

npx prisma generate    Write-Host "✅ Servers starting in new windows!" -ForegroundColor Green

    Write-Host "Visit http://localhost:3000 when ready" -ForegroundColor Cyan

if ($LASTEXITCODE -ne 0) {}

    Write-Host "[ERROR] Failed to generate Prisma Client" -ForegroundColor Red

    exit 1Set-Location $rootDir

}

Write-Host "Running database migrations..." -ForegroundColor Cyan
npx prisma migrate dev --name init

if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Migration failed, trying deploy..." -ForegroundColor Yellow
    npx prisma migrate deploy
}

Write-Host "Seeding database..." -ForegroundColor Cyan
npx prisma db seed

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Database seeded" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Seeding failed (may already be seeded)" -ForegroundColor Yellow
}

Write-Host ""

Write-Host "Step 7: Install Python Dependencies" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray
Set-Location $ML_DIR

Write-Host "Installing Python packages..." -ForegroundColor Cyan
pip install -r requirements_ml.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Python dependencies installed" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to install Python dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start SafeCred:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Use the quick run script" -ForegroundColor Cyan
Write-Host "  cd 'e:\SIH Synapse\SIH-SafeCred'" -ForegroundColor White
Write-Host "  .\RUN.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Manual start" -ForegroundColor Cyan
Write-Host "  Terminal 1 (ML API):" -ForegroundColor White
Write-Host "    cd 'e:\SIH Synapse\SIH-SafeCred\ml'" -ForegroundColor White
Write-Host "    `$env:DATABASE_URL='$DATABASE_URL'" -ForegroundColor White
Write-Host "    python application_api.py" -ForegroundColor White
Write-Host ""
Write-Host "  Terminal 2 (Next.js):" -ForegroundColor White
Write-Host "    cd 'e:\SIH Synapse\SIH-SafeCred\app'" -ForegroundColor White
Write-Host "    npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Demo Accounts:" -ForegroundColor Yellow
Write-Host "  User:  demo@safecred.com / User@123" -ForegroundColor White
Write-Host "  Admin: admin@safecred.com / Admin@123" -ForegroundColor White
Write-Host ""
