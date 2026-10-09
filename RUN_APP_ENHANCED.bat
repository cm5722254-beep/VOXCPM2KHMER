@echo off
chcp 65001 > nul
cls

echo.
echo ═══════════════════════════════════════════════════════════════
echo    🎬 DABBER PRO - Enhanced UI with Professional Interface
echo ═══════════════════════════════════════════════════════════════
echo.
echo ✅ New Features:
echo    • Professional Dialogue Manager (Table View)
echo    • Color-Coded Timeline (Multi-Track)
echo    • 3 VoxCPM2 Options (Computer/Cloud/Offline)
echo    • 7-Step Auto Dubbing Workflow
echo    • Character Voice Assignment
echo    • Real-time Progress Tracking
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo Starting application...
echo.

REM Check if virtual environment exists
if not exist ".venv\Scripts\python.exe" (
    echo ❌ Virtual environment not found!
    echo Please run: python -m venv .venv
    pause
    exit /b 1
)

REM Activate virtual environment
call .venv\Scripts\activate

REM Check if frontend is built
if not exist "public\assets" (
    echo 📦 Building frontend...
    call npm run build
    if errorlevel 1 (
        echo ❌ Frontend build failed
        pause
        exit /b 1
    )
)

REM Start the application
echo.
echo 🚀 Starting Dabber Pro Studio...
echo 🌐 Opening browser at http://localhost:3000
echo.
echo ⚠️  Press Ctrl+C to stop the server
echo.

REM Start in same window
python desktop_app.py

pause
