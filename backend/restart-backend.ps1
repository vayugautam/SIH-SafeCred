# Kill all node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3

# Regenerate Prisma Client
Set-Location "e:\SIH Synapse\SIH-SafeCred\backend"
npx prisma generate

# Start server in a new CMD window
cmd /c "start cmd /k npx ts-node src/server.ts"

Write-Host "✅ Server started in new window on port 3001"
Write-Host "⏳ Waiting 10 seconds for server to initialize..."
Start-Sleep -Seconds 10

# Test registration
Write-Host "🧪 Testing registration endpoint..."
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/register' `
        -Method POST `
        -ContentType 'application/json' `
        -Body '{"email":"restart@example.com","password":"TestPass123!","name":"Restart Test","mobile":"3333333333","role":"borrower"}'
    
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Registration failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
