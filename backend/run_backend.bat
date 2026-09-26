@echo off
echo ========================================================
echo Starting Astria FastAPI Backend (Port 8000)
echo ========================================================
cd /d "%~dp0"

if exist ".venv\Scripts\python.exe" (
    echo Using backend virtual environment (.venv)...
    .venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
) else (
    echo Virtual environment not found, falling back to system python...
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
)

pause
