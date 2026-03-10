@echo off
echo ===================================================
echo Starting Video Streaming Platform (No Docker Mode)
echo ===================================================

cd /d "%~dp0"

echo.
echo 1. Installing/Verifying Backend Requirements...
pip install -r backend/requirements.txt

echo.
echo 2. Starting Backend (FastAPI)...
start "vPlyer Backend" cmd /k "python -m uvicorn backend.main:app --reload --port 8000"

echo.
echo 3. Starting Frontend (React)...
cd frontend
echo Installing Frontend Dependencies (if needed)...
call npm.cmd install
echo Starting Frontend Server...
start "vPlyer Frontend" cmd /k "npm.cmd run dev"

echo.
echo ===================================================
echo BOTH SERVERS STARTING...
echo Backend: http://localhost:8000/docs
echo Frontend: http://localhost:5173
echo.
pause
