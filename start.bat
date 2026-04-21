@echo off
echo ================================================
echo   CS231 Mock Exam System
echo ================================================
echo.

echo [1/3] Installing backend dependencies...
cd /d "%~dp0backend"
pip install -r requirements.txt -q
if %errorlevel% neq 0 (
    echo ERROR: pip install failed. Make sure Python is installed.
    pause
    exit /b 1
)

echo [2/3] Seeding question database...
python seed_data.py

echo [3/3] Starting servers...
echo.
echo   Backend API  : http://localhost:8000
echo   Frontend App : http://localhost:5173
echo   Admin Panel  : http://localhost:5173/admin
echo.

start "CS231 Backend" cmd /k "cd /d "%~dp0backend" && uvicorn main:app --reload --port 8000"
timeout /t 2 /nobreak >nul

cd /d "%~dp0frontend"
if not exist node_modules (
    echo Installing frontend dependencies ^(first run, takes ~1 min^)...
    call npm install
)
start "CS231 Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo Both servers running. Close their windows to stop.
pause
