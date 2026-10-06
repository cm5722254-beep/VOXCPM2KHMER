@echo off
chcp 65001 > nul
echo ===============================================================================
echo  🐉 DRAGON DABBER PRO - SETUP SCRIPT
echo  Setting up Python & Node.js environments...
echo ===============================================================================
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found! Please install Python 3.10+ first.
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo [1/4] Creating Python virtual environment...
python -m venv .venv
echo Done.
echo.

echo [2/4] Installing Python dependencies...
.\.venv\Scripts\pip.exe install --upgrade pip
.\.venv\Scripts\pip.exe install -r requirements.txt
echo Done.
echo.

echo [3/4] Installing Node.js dependencies...
call npm install
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
