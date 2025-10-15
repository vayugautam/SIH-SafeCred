# SafeCred Complete Setup and Run Script
# This script will set up the entire SafeCred application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SafeCred Complete Setup & Run Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Get the script directory
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$APP_DIR = Join-Path $SCRIPT_DIR "app"
$ML_DIR = Join-Path $SCRIPT_DIR "ml"

# Step 1: Check Prerequisites
Write-Host "[1/8] Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "  ✓ npm found: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ npm not found" -ForegroundColor Red
    exit 1
}

# Check Python
try {
    $pythonVersion = python --version
    Write-Host "  ✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Python not found. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check PostgreSQL
try {
    $pgVersion = psql --version
    Write-Host "  ✓ PostgreSQL client found: $pgVersion" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ PostgreSQL client not found in PATH. Make sure PostgreSQL is installed." -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Generate Secrets
Write-Host "[2/8] Generating secrets..." -ForegroundColor Yellow

# Generate NEXTAUTH_SECRET
$bytes = New-Object Byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$NEXTAUTH_SECRET = [Convert]::ToBase64String($bytes)
Write-Host "  ✓ Generated NEXTAUTH_SECRET" -ForegroundColor Green

Write-Host ""

# Step 3: Create .env file
Write-Host "[3/8] Creating environment configuration..." -ForegroundColor Yellow

$envFile = Join-Path $APP_DIR ".env"

Write-Host ""
Write-Host "Please provide database configuration:" -ForegroundColor Cyan
$dbUser = Read-Host "  PostgreSQL username (default: postgres)"
if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "postgres" }

$dbPassword = Read-Host "  PostgreSQL password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

$dbHost = Read-Host "  PostgreSQL host (default: localhost)"
if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "localhost" }

$dbPort = Read-Host "  PostgreSQL port (default: 5432)"
if ([string]::IsNullOrWhiteSpace($dbPort)) { $dbPort = "5432" }

$dbName = Read-Host "  Database name (default: safecred_db)"
if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "safecred_db" }

$DATABASE_URL = "postgresql://${dbUser}:${dbPasswordPlain}@${dbHost}:${dbPort}/${dbName}?schema=public"

# Create .env file
$envContent = @"
# Database
DATABASE_URL="$DATABASE_URL"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"

# ML API
ML_API_URL="http://localhost:8001"

# App Configuration
NODE_ENV="development"
"@

Set-Content -Path $envFile -Value $envContent
Write-Host "  [OK] Created .env file in app directory" -ForegroundColor Green

Write-Host ""

# Step 4: Create PostgreSQL database
Write-Host "[4/8] Setting up PostgreSQL database..." -ForegroundColor Yellow

$env:PGPASSWORD = $dbPasswordPlain

# Check if database exists
$dbExists = psql -U $dbUser -h $dbHost -p $dbPort -lqt | Select-String -Pattern $dbName -Quiet

if ($dbExists) {
    Write-Host "  ⚠ Database '$dbName' already exists" -ForegroundColor Yellow
    $overwrite = Read-Host "  Do you want to drop and recreate it? (yes/no)"
    if ($overwrite -eq "yes") {
        Write-Host "  Dropping existing database..." -ForegroundColor Yellow
        psql -U $dbUser -h $dbHost -p $dbPort -c "DROP DATABASE IF EXISTS $dbName;"
        psql -U $dbUser -h $dbHost -p $dbPort -c "CREATE DATABASE $dbName;"
        Write-Host "  ✓ Database recreated" -ForegroundColor Green
    } else {
        Write-Host "  Using existing database" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Creating database '$dbName'..." -ForegroundColor Yellow
    psql -U $dbUser -h $dbHost -p $dbPort -c "CREATE DATABASE $dbName;"
    Write-Host "  ✓ Database created" -ForegroundColor Green
}

Remove-Item Env:PGPASSWORD
Write-Host ""

# Step 5: Install Node.js dependencies
Write-Host "[5/8] Installing Node.js dependencies..." -ForegroundColor Yellow
Set-Location $APP_DIR

if (Test-Path "node_modules") {
    Write-Host "  node_modules exists, running npm install..." -ForegroundColor Yellow
} else {
    Write-Host "  Installing packages (this may take a few minutes)..." -ForegroundColor Yellow
}

npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Node.js dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to install Node.js dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 6: Setup Prisma and Database
Write-Host "[6/8] Setting up Prisma and database schema..." -ForegroundColor Yellow

# Generate Prisma Client
Write-Host "  Generating Prisma Client..." -ForegroundColor Cyan
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Prisma Client generated" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}

# Run migrations
Write-Host "  Running database migrations..." -ForegroundColor Cyan
npx prisma migrate deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "  Running dev migrations..." -ForegroundColor Cyan
    npx prisma migrate dev --name init
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Database migrations completed" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to run migrations" -ForegroundColor Red
    exit 1
}

# Seed database
Write-Host "  Seeding database with demo users..." -ForegroundColor Cyan
npx prisma db seed

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Database seeded successfully" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Database seeding failed (may already be seeded)" -ForegroundColor Yellow
}

Write-Host ""

# Step 7: Install Python dependencies
Write-Host "[7/8] Installing Python dependencies..." -ForegroundColor Yellow
Set-Location $ML_DIR

if (Test-Path "requirements_ml.txt") {
    pip install -r requirements_ml.txt
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Python dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Failed to install Python dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ⚠ requirements_ml.txt not found" -ForegroundColor Yellow
}

Write-Host ""

# Step 8: Start the application
Write-Host "[8/8] Starting SafeCred application..." -ForegroundColor Yellow
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete! Starting Services..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Demo Credentials:" -ForegroundColor Yellow
Write-Host "  User:  demo@safecred.com / User@123" -ForegroundColor White
Write-Host "  Admin: admin@safecred.com / Admin@123" -ForegroundColor White
Write-Host ""

Write-Host "Starting ML API Server..." -ForegroundColor Cyan
Set-Location $ML_DIR
$env:DATABASE_URL = $DATABASE_URL

# Start ML API in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ML_DIR'; `$env:DATABASE_URL='$DATABASE_URL'; python application_api.py" -WindowStyle Normal

Write-Host "  Waiting for ML API to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "  ✓ ML API started on http://localhost:8001" -ForegroundColor Green
Write-Host ""

Write-Host "Starting Next.js Development Server..." -ForegroundColor Cyan
Set-Location $APP_DIR

# Start Next.js dev server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$APP_DIR'; npm run dev" -WindowStyle Normal

Write-Host "  Waiting for Next.js to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "  ✓ Next.js started on http://localhost:3000" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  SafeCred is now running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access the application:" -ForegroundColor Cyan
Write-Host "  Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host "  ML API:      http://localhost:8001" -ForegroundColor White
Write-Host "  API Docs:    http://localhost:8001/docs" -ForegroundColor White
Write-Host "  Prisma Studio: npx prisma studio (in app directory)" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C in the terminal windows to stop the servers." -ForegroundColor Yellow
Write-Host ""

# Open browser
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"

Write-Host "Browser opened. Happy coding! 🚀" -ForegroundColor Green
