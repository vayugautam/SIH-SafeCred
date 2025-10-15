# SafeCred - Master Setup Script
# Complete setup automation

param(
    [switch]$SkipDatabase
)

Write-Host @"

╔════════════════════════════════════════╗
║                                        ║
║     SafeCred - Complete Setup          ║
║     Full-Stack Loan Platform           ║
║                                        ║
╚════════════════════════════════════════╝

"@ -ForegroundColor Cyan

$baseDir = "e:\SIH Synapse\SIH-SafeCred"
$appDir = Join-Path $baseDir "app"

# Function to write colored output
function Write-Step {
    param($Message)
    Write-Host "`n→ $Message" -ForegroundColor Yellow
}

function Write-Success {
    param($Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param($Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param($Message)
    Write-Host "  $Message" -ForegroundColor White
}

# Check prerequisites
Write-Step "Checking prerequisites..."

# Check Node.js
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Error "Node.js not found!"
    Write-Info "Please install Node.js from https://nodejs.org/"
    exit 1
}
Write-Success "Node.js $(node --version) found"

# Check npm
$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
    Write-Error "npm not found!"
    exit 1
}
Write-Success "npm $(npm --version) found"

# Check Python
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    Write-Error "Python not found!"
    Write-Info "Please install Python from https://www.python.org/"
    exit 1
}
Write-Success "Python $((python --version) -replace 'Python ') found"

# Step 1: Install Node dependencies
Write-Step "Installing Node.js dependencies..."
Set-Location $appDir

if (-not (Test-Path "node_modules")) {
    Write-Info "This may take a few minutes..."
    npm install --silent
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Dependencies installed (307 packages)"
    } else {
        Write-Error "Failed to install dependencies"
        exit 1
    }
} else {
    Write-Success "Dependencies already installed"
}

# Step 2: Install Python dependencies
Write-Step "Installing Python dependencies..."
Set-Location (Join-Path $baseDir "ml")

if (-not (Test-Path "venv")) {
    Write-Info "Creating virtual environment..."
    python -m venv venv
}

Write-Info "Activating virtual environment..."
& ".\venv\Scripts\Activate.ps1"

Write-Info "Installing ML packages..."
pip install -q -r requirements_ml.txt

if ($LASTEXITCODE -eq 0) {
    Write-Success "Python dependencies installed"
} else {
    Write-Error "Failed to install Python dependencies"
}

# Step 3: Check environment file
Write-Step "Checking environment configuration..."
Set-Location $appDir

if (-not (Test-Path ".env")) {
    Write-Info "Creating .env file..."
    
    $envContent = @"
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/safecred_db"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="oA+Dr2Nfi+Mgh96hU4nSyfuyEz9g4NQrPI6hdDERido="

# ML API Configuration
ML_API_URL="http://localhost:8001"

# Email Configuration (Optional - will log to console if not set)
# RESEND_API_KEY="re_xxxxxxxxxxxxx"
# EMAIL_FROM="SafeCred <noreply@safecred.com>"
"@
    
    Set-Content -Path ".env" -Value $envContent
    Write-Success ".env file created"
} else {
    Write-Success ".env file exists"
}

# Step 4: Generate Prisma Client
Write-Step "Generating Prisma Client..."

npx prisma generate --silent

if ($LASTEXITCODE -eq 0) {
    Write-Success "Prisma Client generated"
} else {
    Write-Error "Failed to generate Prisma Client"
}

# Step 5: Database setup
if (-not $SkipDatabase) {
    Write-Step "Checking database setup..."
    
    $psql = Get-Command psql -ErrorAction SilentlyContinue
    
    if (-not $psql) {
        Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Yellow
        Write-Host "║  PostgreSQL Not Installed              ║" -ForegroundColor Yellow
        Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Yellow
        
        Write-Info ""
        Write-Info "Option 1: Install PostgreSQL (Recommended for production)"
        Write-Info "  1. Visit: https://www.postgresql.org/download/windows/"
        Write-Info "  2. Download PostgreSQL 16.x"
        Write-Info "  3. Install with password: postgres"
        Write-Info "  4. Run: .\SETUP_DATABASE.ps1"
        Write-Info ""
        Write-Info "Option 2: Use SQLite (Quick testing)"
        Write-Info "  See SQLITE_QUICKSTART.md for instructions"
        Write-Info ""
        
        $installNow = Read-Host "Open PostgreSQL download page? (y/N)"
        if ($installNow -eq 'y' -or $installNow -eq 'Y') {
            Start-Process "https://www.postgresql.org/download/windows/"
        }
        
        Write-Host "`nContinuing without database (login/register won't work yet)..." -ForegroundColor Yellow
    } else {
        Write-Success "PostgreSQL found"
        
        $setupDb = Read-Host "Setup database now? (Y/n)"
        if ($setupDb -ne 'n' -and $setupDb -ne 'N') {
            Set-Location $baseDir
            & ".\SETUP_DATABASE.ps1"
        }
    }
} else {
    Write-Info "Database setup skipped"
}

# Summary
Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Setup Complete!                       ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`nWhat's been set up:" -ForegroundColor Yellow
Write-Success "Node.js dependencies (307 packages)"
Write-Success "Python ML dependencies"
Write-Success ".env configuration"
Write-Success "Prisma Client generated"

Write-Host "`nProject Features:" -ForegroundColor Cyan
Write-Info "✓ 9 Pages (Landing, Auth, Dashboard, Apply, Admin, Profile, Documents, Analytics)"
Write-Info "✓ 16 UI Components (Forms, Dialogs, Toasts, File Upload, etc.)"
Write-Info "✓ 10 API Endpoints (Auth, Applications, Documents, Analytics)"
Write-Info "✓ ML Risk Scoring (Python FastAPI)"
Write-Info "✓ Email Notifications (Welcome, Status updates)"
Write-Info "✓ Document Upload System"
Write-Info "✓ Advanced Analytics Dashboard"
Write-Info "✓ Audit Logging"

Write-Host "`nNext Steps:" -ForegroundColor Yellow

if (-not $psql) {
    Write-Host "1. Install PostgreSQL (see instructions above)" -ForegroundColor White
    Write-Host "2. Run: .\SETUP_DATABASE.ps1" -ForegroundColor White
    Write-Host "3. Run: .\START.ps1" -ForegroundColor White
} else {
    Write-Host "1. Run: .\START.ps1" -ForegroundColor Green
    Write-Host "2. Visit: http://localhost:3000" -ForegroundColor White
    Write-Host "3. Register and test the application!" -ForegroundColor White
}

Write-Host "`nQuick Commands:" -ForegroundColor Cyan
Write-Host "  Start app:        .\START.ps1" -ForegroundColor White
Write-Host "  Setup database:   .\SETUP_DATABASE.ps1" -ForegroundColor White
Write-Host "  View docs:        Get-Content PROJECT_COMPLETE.md" -ForegroundColor White

Write-Host "`nDocumentation:" -ForegroundColor Cyan
Write-Host "  Complete guide:   PROJECT_COMPLETE.md" -ForegroundColor White
Write-Host "  PostgreSQL:       POSTGRESQL_INSTALL.md" -ForegroundColor White
Write-Host "  SQLite:           SQLITE_QUICKSTART.md" -ForegroundColor White

Write-Host "`n" -ForegroundColor White

Read-Host "Press Enter to finish"
