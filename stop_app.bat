@echo off
echo ========================================
echo    STOPPING WELLDOC COACH SERVERS
echo ========================================
echo.

echo Stopping all Python processes (Backend)...
taskkill /f /im python.exe 2>nul
taskkill /f /im uvicorn.exe 2>nul

echo Stopping all Node processes (Frontend)...
taskkill /f /im node.exe 2>nul

echo.
echo Stopping processes on specific ports...
echo Stopping Backend (Port 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do taskkill /f /pid %%a 2>nul

echo Stopping Frontend (Port 8080)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8080" ^| find "LISTENING"') do taskkill /f /pid %%a 2>nul

echo.
echo ========================================
echo    ALL SERVERS STOPPED
echo ========================================
echo.
pause
