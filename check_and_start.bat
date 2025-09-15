@echo off
echo ========================================
echo    WELLDOC COACH - SMART STARTUP
echo ========================================
echo.

:: Check if backend is running
echo Checking backend server (Port 8000)...
python -c "import requests; requests.get('http://127.0.0.1:8000/', timeout=2); print('Backend is running!')" 2>nul
if %errorlevel% equ 0 (
    echo ✓ Backend server is already running
    set BACKEND_RUNNING=1
) else (
    echo ✗ Backend server is not running
    set BACKEND_RUNNING=0
)

:: Check if frontend is running  
echo Checking frontend server (Port 8080)...
python -c "import requests; requests.get('http://localhost:8080/', timeout=2); print('Frontend is running!')" 2>nul
if %errorlevel% equ 0 (
    echo ✓ Frontend server is already running
    set FRONTEND_RUNNING=1
) else (
    echo ✗ Frontend server is not running
    set FRONTEND_RUNNING=0
)

echo.

:: Start backend if not running
if %BACKEND_RUNNING% equ 0 (
    echo Starting Backend Server...
    start "WellDoc Backend" cmd /k "cd /d "%~dp0" && venv\Scripts\activate && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
    timeout /t 3 /nobreak >nul
)

:: Start frontend if not running
if %FRONTEND_RUNNING% equ 0 (
    echo Starting Frontend Server...
    start "WellDoc Frontend" cmd /k "cd /d "%~dp0\nurture-coach-main\nurture-coach-main" && npm run dev"
    timeout /t 3 /nobreak >nul
)

:: Open browser if either server was started
if %BACKEND_RUNNING% equ 0 (
    echo Opening application in browser...
    timeout /t 5 /nobreak >nul
    start http://localhost:8080
) else if %FRONTEND_RUNNING% equ 0 (
    echo Opening application in browser...
    timeout /t 5 /nobreak >nul
    start http://localhost:8080
) else (
    echo Both servers are already running!
    echo Opening application in browser...
    start http://localhost:8080
)

echo.
echo ========================================
echo    STATUS CHECK COMPLETE
echo ========================================
echo.
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:8080
echo.
pause
