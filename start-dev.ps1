# PropertyMarket Online - Development Startup Script
# Run this script to start both frontend and backend servers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PropertyMarket Online - Dev Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start Backend in a new terminal
Write-Host "[1/2] Starting Backend (Port 3002)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host 'Backend Server' -ForegroundColor Green; npm run start:dev"

# Wait for backend to initialize
Write-Host "Waiting for backend to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Start Frontend in a new terminal  
Write-Host "[2/2] Starting Frontend (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\FRONTEND\property-market'; Write-Host 'Frontend Server' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Servers are starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:3002" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:3002/api/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Two new terminal windows have been opened." -ForegroundColor Gray
Write-Host "Press any key to exit this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
