@echo off
echo ========================================================
echo Starting Astria React + Vite Frontend (Port 5173)
echo ========================================================

cd /d "%~dp0"

:: Auto-detect Node.js if not yet in current terminal PATH
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "%LOCALAPPDATA%\Programs\node-v20.18.0-win-x64\node.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\node-v20.18.0-win-x64;%PATH%"
    ) else if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
    ) else if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;%PATH%"
    )
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not detected. Please ensure Node.js is installed.
    pause
    exit /b 1
)

echo Node Version:
node -v
echo npm Version:
call npm.cmd -v

if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm.cmd install
)

echo Starting Vite dev server on http://localhost:5173 ...
call npm.cmd run dev
pause
