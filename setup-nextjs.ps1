# SafeCred Platform - Complete Setup Script
# Run this in PowerShell

Write-Host "🚀 SafeCred Setup Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check if running in correct directory
$currentPath = Get-Location
if (-not (Test-Path ".\app")) {
    Write-Host "❌ Error: Please run this script from the SIH-SafeCred root directory" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Installing Next.js dependencies..." -ForegroundColor Yellow
Set-Location ".\app"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "Step 2: Setting up environment file..." -ForegroundColor Yellow
if (-not (Test-Path ".\.env")) {
    Copy-Item ".\.env.example" ".\.env"
    Write-Host "⚠️  Please edit .env file with your database credentials" -ForegroundColor Yellow
    Write-Host "   - Update DATABASE_URL with your PostgreSQL connection string" -ForegroundColor Yellow
    Write-Host "   - Generate NEXTAUTH_SECRET with: node -e `"console.log(require('crypto').randomBytes(32).toString('hex'))`"" -ForegroundColor Yellow
    
    $continue = Read-Host "Press Enter when you've updated .env, or type 'skip' to continue anyway"
    if ($continue -ne "skip") {
        Write-Host "✅ Environment configured" -ForegroundColor Green
    }
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 3: Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma Client generated" -ForegroundColor Green

Write-Host ""
Write-Host "Step 4: Running database migrations..." -ForegroundColor Yellow
Write-Host "⚠️  Make sure PostgreSQL is running and DATABASE_URL is correct" -ForegroundColor Yellow
$runMigration = Read-Host "Run migration now? (y/n)"
if ($runMigration -eq "y") {
    npx prisma migrate dev --name init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to run migrations" -ForegroundColor Red
        Write-Host "   Please check your database connection" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Database migrated successfully" -ForegroundColor Green
    }
} else {
    Write-Host "⏭️  Skipped migration" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 5: Seeding database..." -ForegroundColor Yellow
$runSeed = Read-Host "Seed database with default users? (y/n)"
if ($runSeed -eq "y") {
    npm run prisma:seed
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database seeded successfully" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Default Users Created:" -ForegroundColor Cyan
        Write-Host "   Admin: admin@safecred.com / Admin@123" -ForegroundColor White
        Write-Host "   Officer: officer@safecred.com / Officer@123" -ForegroundColor White
        Write-Host "   Demo User: demo@safecred.com / User@123" -ForegroundColor White
    }
} else {
    Write-Host "⏭️  Skipped seeding" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 6: Installing Python ML dependencies..." -ForegroundColor Yellow
Set-Location "..\ml"
$hasPsycopg2 = pip list | Select-String "psycopg2"
if (-not $hasPsycopg2) {
    pip install psycopg2-binary
    Write-Host "✅ Python dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Python dependencies already installed" -ForegroundColor Green
}

Set-Location "..\app"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start Python ML API:" -ForegroundColor White
Write-Host "   cd ..\ml" -ForegroundColor Gray
Write-Host "   python application_api_enhanced.py" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start Next.js App (in new terminal):" -ForegroundColor White
Write-Host "   cd app" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Access the application:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host "   ML API: http://localhost:8001" -ForegroundColor Gray
Write-Host "   ML Docs: http://localhost:8001/docs" -ForegroundColor Gray
Write-Host "   Prisma Studio: npm run prisma:studio" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Login with default users (see above)" -ForegroundColor White
Write-Host ""
Write-Host "📖 For more information, see app/README.md" -ForegroundColor Cyan
Write-Host ""
