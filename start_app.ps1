# WellDoc Coach Startup Script (PowerShell)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    WELLDOC COACH - STARTUP SCRIPT" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set location to script directory
Set-Location $PSScriptRoot

# Check if virtual environment exists
if (!(Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "ERROR: Virtual environment not found!" -ForegroundColor Red
    Write-Host "Please run: python -m venv venv" -ForegroundColor Yellow
    Write-Host "Then: pip install -r requirements.txt" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if node_modules exists
if (!(Test-Path "nurture-coach-main\nurture-coach-main\node_modules")) {
    Write-Host "WARNING: Frontend dependencies not found!" -ForegroundColor Yellow
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location "nurture-coach-main\nurture-coach-main"
    npm install
    Set-Location $PSScriptRoot
    Write-Host ""
}

Write-Host "Starting WellDoc Coach Application..." -ForegroundColor Green
Write-Host ""

# Start Backend Server
Write-Host "[1/2] Starting Backend Server (FastAPI)..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PSScriptRoot
    & "venv\Scripts\Activate.ps1"
    python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
}

# Wait for backend to start
Start-Sleep -Seconds 3

# Start Frontend Server  
Write-Host "[2/2] Starting Frontend Server (Vite + React)..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "$using:PSScriptRoot\nurture-coach-main\nurture-coach-main"
    npm run dev
}

# Wait for frontend to start
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    APPLICATION STARTED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend Server:       http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "API Documentation:    http://127.0.0.1:8000/docs" -ForegroundColor Cyan  
Write-Host "Frontend App:         http://localhost:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening application in browser..." -ForegroundColor Yellow

# Wait a moment then open browser
Start-Sleep -Seconds 2
Start-Process "http://localhost:8080"

Write-Host ""
Write-Host "Both servers are running in background jobs." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop both servers and exit." -ForegroundColor Yellow
Write-Host ""

# Keep script running and monitor jobs
try {
    while ($true) {
        if ($backendJob.State -eq "Failed" -or $frontendJob.State -eq "Failed") {
            Write-Host "One of the servers failed. Stopping..." -ForegroundColor Red
            break
        }
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    Stop-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Write-Host "Servers stopped." -ForegroundColor Green
}
