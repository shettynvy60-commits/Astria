@echo off
echo ========================================================
echo Launching Astria Full Stack Application
echo ========================================================
echo.
echo Starting FastAPI Backend on http://localhost:8000 ...
start "Astria Backend (FastAPI - Port 8000)" cmd /k "cd /d %~dp0backend && run_backend.bat"

echo Starting React + Vite Frontend on http://localhost:5173 ...
start "Astria Frontend (React + Vite - Port 5173)" cmd /k "cd /d %~dp0frontend && run_frontend.bat"

echo.
echo ========================================================
echo Astria is running!
echo - API Documentation: http://localhost:8000/docs
echo - Web Dashboard:     http://localhost:5173
echo ========================================================
echo.
pause
