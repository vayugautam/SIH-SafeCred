# PostgreSQL Database Setup Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SafeCred - PostgreSQL Database Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if PostgreSQL is installed
Write-Host "Checking for PostgreSQL installation..." -ForegroundColor Yellow

$psqlPath = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psqlPath) {
    Write-Host "`nPostgreSQL is not installed!" -ForegroundColor Red
    Write-Host "`nPlease follow these steps:" -ForegroundColor Yellow
    Write-Host "1. Visit: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "2. Download PostgreSQL 16.x installer" -ForegroundColor White
    Write-Host "3. Run installer with these settings:" -ForegroundColor White
    Write-Host "   - Password: postgres" -ForegroundColor Green
    Write-Host "   - Port: 5432" -ForegroundColor Green
    Write-Host "   - Install ALL components" -ForegroundColor Green
    Write-Host "4. After installation, run this script again`n" -ForegroundColor White
    
    Write-Host "Alternative: Use SQLite (faster setup)" -ForegroundColor Cyan
    Write-Host "See SQLITE_QUICKSTART.md for instructions`n" -ForegroundColor Cyan
    
    Read-Host "Press Enter to exit"
    exit
}

Write-Host "PostgreSQL found!" -ForegroundColor Green
Write-Host "Version: $(psql --version)" -ForegroundColor White

# Check if PostgreSQL service is running
Write-Host "`nChecking PostgreSQL service..." -ForegroundColor Yellow
$service = Get-Service -Name "*postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1

if ($service) {
    if ($service.Status -ne 'Running') {
        Write-Host "Starting PostgreSQL service..." -ForegroundColor Yellow
        Start-Service $service.Name
        Start-Sleep -Seconds 2
    }
    Write-Host "PostgreSQL service is running!" -ForegroundColor Green
} else {
    Write-Host "Warning: Could not find PostgreSQL service. Continuing anyway..." -ForegroundColor Yellow
}

# Database creation
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Database Creation" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "This will create the 'safecred_db' database" -ForegroundColor White
Write-Host "Default PostgreSQL password: postgres`n" -ForegroundColor Yellow

$createDb = Read-Host "Create database now? (Y/n)"
if ($createDb -ne 'n' -and $createDb -ne 'N') {
    
    Write-Host "`nAttempting to create database..." -ForegroundColor Yellow
    
    # Create database using psql
    $createDbCommand = @"
DO `$`$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'safecred_db') THEN
        CREATE DATABASE safecred_db;
    END IF;
END
`$`$;
"@
    
    $createDbCommand | psql -U postgres -h localhost -p 5432 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database created successfully!" -ForegroundColor Green
    } else {
        Write-Host "Database creation may have failed. Continuing..." -ForegroundColor Yellow
        Write-Host "You can create it manually: CREATE DATABASE safecred_db;" -ForegroundColor White
    }
}

# Run Prisma migrations
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Database Migrations" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Set-Location "e:\SIH Synapse\SIH-SafeCred\app"

Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "Prisma Client generated!" -ForegroundColor Green
} else {
    Write-Host "Error generating Prisma Client!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

Write-Host "`nRunning database migrations..." -ForegroundColor Yellow
npx prisma migrate dev --name init

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migrations completed successfully!" -ForegroundColor Green
} else {
    Write-Host "`nMigration failed!" -ForegroundColor Red
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "1. Check DATABASE_URL in .env file" -ForegroundColor White
    Write-Host "2. Verify PostgreSQL is running" -ForegroundColor White
    Write-Host "3. Confirm password is correct (default: postgres)`n" -ForegroundColor White
    Read-Host "Press Enter to exit"
    exit
}

# Seed database
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Seed Database" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$seedDb = Read-Host "Seed database with sample data? (Y/n)"
if ($seedDb -ne 'n' -and $seedDb -ne 'N') {
    Write-Host "`nSeeding database..." -ForegroundColor Yellow
    npx prisma db seed
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database seeded successfully!" -ForegroundColor Green
    } else {
        Write-Host "Seeding failed (this is optional)" -ForegroundColor Yellow
    }
}

# Verify setup
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Verification" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Checking database tables..." -ForegroundColor Yellow

$listTables = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
$tables = $listTables | psql -U postgres -d safecred_db -t 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDatabase tables created:" -ForegroundColor Green
    Write-Host $tables -ForegroundColor White
} else {
    Write-Host "Could not verify tables" -ForegroundColor Yellow
}

# Success message
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start the application: .\START.ps1" -ForegroundColor White
Write-Host "2. Visit http://localhost:3000" -ForegroundColor White
Write-Host "3. Register a new account" -ForegroundColor White
Write-Host "4. Test loan application flow`n" -ForegroundColor White

Write-Host "Database connection:" -ForegroundColor Cyan
Write-Host "postgresql://postgres:postgres@localhost:5432/safecred_db`n" -ForegroundColor White

Write-Host "Admin panel:" -ForegroundColor Cyan
Write-Host "http://localhost:3000/admin/dashboard`n" -ForegroundColor White

Read-Host "Press Enter to exit"
