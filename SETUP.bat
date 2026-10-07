@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ===============================================================================
echo  🐉 DRAGON DABBER PRO - SETUP SCRIPT
echo  Setting up Python & Node.js environments...
echo ===============================================================================
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found! Please install Python 3.10+ first.
    echo Download: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please install Node.js 18+ first.
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Creating Python virtual environment...
if exist ".venv" (
    echo Virtual environment already exists.
) else (
    python -m venv .venv
    echo Done.
)
echo.

echo [2/4] Installing Python dependencies...
if exist ".venv\Scripts\pip.exe" (
    .\.venv\Scripts\pip.exe install --upgrade pip
    .\.venv\Scripts\pip.exe install -r requirements.txt
) else (
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt
)
echo Done.
echo.

echo [3/4] Installing Node.js dependencies...
if exist "node_modules" (
    echo Node modules already installed. Skipping...
) else (
    call npm install
)
echo Done.
echo.

echo [4/4] Building frontend...
call npm run build
echo Done.
echo.

echo ===============================================================================
echo  ✅ SETUP COMPLETE!
echo  Run: START_TOOL.bat to launch the application
echo ===============================================================================
pause
