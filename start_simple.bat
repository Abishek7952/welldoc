@echo off
echo Starting WellDoc Coach...

:: Start Backend
start "Backend" cmd /k "venv\Scripts\activate && python -m uvicorn app.main:app --reload"

:: Wait 3 seconds
timeout /t 3 /nobreak >nul

:: Start Frontend  
start "Frontend" cmd /k "cd nurture-coach-main\nurture-coach-main && npm run dev"

:: Wait 5 seconds then open browser
timeout /t 5 /nobreak >nul
start http://localhost:8080

echo Both servers started! Check the separate windows.
pause
