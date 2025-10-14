# SafeCred ML API - ngrok Setup Guide
# This script helps you set up ngrok for remote team access

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   SafeCred ML API - ngrok Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "What is ngrok?" -ForegroundColor Yellow
Write-Host "ngrok creates a secure tunnel from a public URL to your local server." -ForegroundColor White
Write-Host "This allows your remote backend and frontend teammates to access" -ForegroundColor White
Write-Host "your ML API without being on the same network." -ForegroundColor White
Write-Host ""

# Check if ngrok is already installed
$ngrokPath = $null
$commonPaths = @(
    "C:\ngrok\ngrok.exe",
    "$env:USERPROFILE\ngrok\ngrok.exe",
    "$env:USERPROFILE\Downloads\ngrok.exe",
    "E:\ngrok\ngrok.exe"
)

foreach ($path in $commonPaths) {
    if (Test-Path $path) {
        $ngrokPath = $path
        Write-Host "✅ ngrok found at: $ngrokPath" -ForegroundColor Green
        break
    }
}

if (-not $ngrokPath) {
    Write-Host "❌ ngrok not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please follow these steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "STEP 1: Download ngrok" -ForegroundColor Cyan
    Write-Host "  1. Visit: https://ngrok.com/download" -ForegroundColor White
    Write-Host "  2. Create a free account (required)" -ForegroundColor White
    Write-Host "  3. Download the Windows version" -ForegroundColor White
    Write-Host "  4. Extract ngrok.exe to a folder (e.g., C:\ngrok)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "STEP 2: Get your auth token" -ForegroundColor Cyan
    Write-Host "  1. After signing up, visit: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
    Write-Host "  2. Copy your auth token" -ForegroundColor White
    Write-Host ""
    
    Write-Host "STEP 3: Authenticate ngrok" -ForegroundColor Cyan
    Write-Host "  Run this command (replace YOUR_AUTH_TOKEN with your actual token):" -ForegroundColor White
    Write-Host ""
    Write-Host "  cd C:\ngrok" -ForegroundColor Yellow
    Write-Host "  .\ngrok authtoken YOUR_AUTH_TOKEN" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "STEP 4: Start ngrok tunnel" -ForegroundColor Cyan
    Write-Host "  Run this command:" -ForegroundColor White
    Write-Host ""
    Write-Host "  .\ngrok http 8002" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "STEP 5: Copy the public URL" -ForegroundColor Cyan
    Write-Host "  You'll see output like:" -ForegroundColor White
    Write-Host ""
    Write-Host "  Forwarding    https://abc123-xyz.ngrok.io -> http://localhost:8002" -ForegroundColor Green
    Write-Host ""
    Write-Host "  The URL https://abc123-xyz.ngrok.io is your public ML API URL!" -ForegroundColor White
    Write-Host "  Share this URL with your backend team." -ForegroundColor White
    Write-Host ""
    
    Write-Host "IMPORTANT NOTES:" -ForegroundColor Yellow
    Write-Host "  • Keep the ngrok terminal window open" -ForegroundColor White
    Write-Host "  • Keep the ML API server running (start_server.ps1)" -ForegroundColor White
    Write-Host "  • Free ngrok URLs change when you restart ngrok" -ForegroundColor White
    Write-Host "  • If you restart, notify your backend team of the new URL" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Opening ngrok download page in your browser..." -ForegroundColor Yellow
    Start-Process "https://ngrok.com/download"
    
    exit 0
}

# If ngrok is found, check if it's authenticated
Write-Host ""
Write-Host "Checking ngrok authentication..." -ForegroundColor Yellow

$ngrokDir = Split-Path -Parent $ngrokPath
$configPath = "$env:USERPROFILE\.ngrok2\ngrok.yml"

if (-not (Test-Path $configPath)) {
    Write-Host "⚠️  ngrok is not authenticated yet" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To authenticate:" -ForegroundColor Cyan
    Write-Host "  1. Get your auth token from: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
    Write-Host "  2. Run this command:" -ForegroundColor White
    Write-Host ""
    Write-Host "     cd `"$ngrokDir`"" -ForegroundColor Yellow
    Write-Host "     .\ngrok authtoken YOUR_AUTH_TOKEN" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor White
    Write-Host ""
    
    Write-Host "Opening ngrok dashboard in your browser..." -ForegroundColor Yellow
    Start-Process "https://dashboard.ngrok.com/get-started/your-authtoken"
    
    exit 0
}

# ngrok is installed and authenticated
Write-Host "✅ ngrok is authenticated" -ForegroundColor Green
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Ready to Start ngrok Tunnel!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Make sure your ML API server is running!" -ForegroundColor Yellow
Write-Host "If not, run: .\start_server.ps1" -ForegroundColor Yellow
Write-Host ""

$response = Read-Host "Is the ML API server running? (Y/N)"

if ($response -ne "Y" -and $response -ne "y") {
    Write-Host ""
    Write-Host "Please start the ML API server first:" -ForegroundColor Yellow
    Write-Host "  .\start_server.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor White
    exit 0
}

Write-Host ""
Write-Host "Starting ngrok tunnel..." -ForegroundColor Cyan
Write-Host ""
Write-Host "This will open a new window with ngrok running." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: Look for the line that says:" -ForegroundColor Yellow
Write-Host "  Forwarding    https://XXXXX.ngrok.io -> http://localhost:8002" -ForegroundColor Green
Write-Host ""
Write-Host "Copy the https://XXXXX.ngrok.io URL and share it with your backend team!" -ForegroundColor White
Write-Host ""
Write-Host "Keep this ngrok window open while your team is integrating." -ForegroundColor Yellow
Write-Host ""

Start-Sleep -Seconds 2

# Start ngrok in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$ngrokDir`" ; Write-Host 'Starting ngrok tunnel on port 8002...' -ForegroundColor Cyan; Write-Host ''; .\ngrok http 8002"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ ngrok tunnel started!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Copy the public URL from the ngrok window (https://XXXXX.ngrok.io)" -ForegroundColor White
Write-Host "2. Test it: https://YOUR_URL.ngrok.io/health" -ForegroundColor White
Write-Host "3. Share with backend team (see DEPLOYMENT_SUCCESS.md for email templates)" -ForegroundColor White
Write-Host ""

Write-Host "Quick Test:" -ForegroundColor Cyan
Write-Host "Once you have the URL, run this command to test it:" -ForegroundColor White
Write-Host ""
Write-Host "  Invoke-RestMethod -Uri 'https://YOUR_URL.ngrok.io/health' -Method Get" -ForegroundColor Yellow
Write-Host ""

Write-Host "Documentation to share:" -ForegroundColor Cyan
Write-Host "  • Backend Team: docs\BACKEND_TEAM_GUIDE.md" -ForegroundColor White
Write-Host "  • Frontend Team: docs\FRONTEND_CLEAN_GUIDE.md" -ForegroundColor White
Write-Host "  • QA Team: docs\TESTING_POSTMAN_GUIDE.md" -ForegroundColor White
Write-Host ""
