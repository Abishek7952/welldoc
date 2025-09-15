@echo off
echo ========================================
echo    WELLDOC COACH - STARTUP SCRIPT
echo ========================================
echo.

:: Set the working directory to the script location
cd /d "%~dp0"

:: Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo ERROR: Virtual environment not found!
    echo Please make sure the 'venv' folder exists in the project directory.
    echo Run: python -m venv venv
    echo Then: pip install -r requirements.txt
    pause
    exit /b 1
)

:: Check if node_modules exists for frontend
if not exist "nurture-coach-main\nurture-coach-main\node_modules" (
    echo WARNING: Frontend dependencies not found!
    echo Installing frontend dependencies...
    cd nurture-coach-main\nurture-coach-main
    call npm install
    cd ..\..
    echo.
)

echo Starting WellDoc Coach Application...
echo.

:: Start Backend Server
echo [1/2] Starting Backend Server (FastAPI)...
start "WellDoc Backend" cmd /k "cd /d "%~dp0" && venv\Scripts\activate && echo Backend Server Starting... && echo Available at: http://127.0.0.1:8000 && echo API Docs at: http://127.0.0.1:8000/docs && echo. && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: Start Frontend Server
echo [2/2] Starting Frontend Server (Vite + React)...
start "WellDoc Frontend" cmd /k "cd /d "%~dp0\nurture-coach-main\nurture-coach-main" && echo Frontend Server Starting... && echo Available at: http://localhost:8080 && echo. && npm run dev"

:: Wait a moment for frontend to start
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo    APPLICATION STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Backend Server:  http://127.0.0.1:8000
echo API Documentation: http://127.0.0.1:8000/docs
echo Frontend App:    http://localhost:8080
echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
echo Opening application in browser...
timeout /t 2 /nobreak >nul

:: Open the application in default browser
start http://localhost:8080

echo.
echo Press any key to close this window...
pause >nul
