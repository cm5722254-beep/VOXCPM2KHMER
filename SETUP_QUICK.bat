@echo off
title Dubber Dang Pro - Quick Setup v3.1
color 0A
echo.
echo  ██████╗ ██╗   ██╗██████╗ ██████╗ ███████╗██████╗
echo  ██╔══██╗██║   ██║██╔══██╗██╔══██╗██╔════╝██╔══██╗
echo  ██║  ██║██║   ██║██████╔╝██████╔╝█████╗  ██████╔╝
echo  ██║  ██║██║   ██║██╔══██╗██╔══██╗██╔══╝  ██╔══██╗
echo  ██████╔╝╚██████╔╝██████╔╝██████╔╝███████╗██║  ██║
echo  ╚═════╝  ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝
echo.
echo  DANG PRO v3.1 - CapCut Edition
echo  =====================================
echo.

:: Step 1: Check Python
echo [1/5] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Python not found. Install Python 3.10+ first.
    pause
    exit /b 1
)
echo  OK: Python found

:: Step 2: Check Node.js
echo [2/5] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Node.js not found. Install Node.js 18+ first.
    pause
    exit /b 1
)
echo  OK: Node.js found

:: Step 3: Install Python deps
echo [3/5] Installing Python dependencies...
if exist ".venv\Scripts\python.exe" (
    echo  OK: Virtual environment already exists
) else (
    python -m venv .venv
    call .venv\Scripts\activate.bat
    pip install fastapi uvicorn edge-tts demucs torch pillow requests python-dotenv pywebview psutil
)

:: Step 4: Install Node deps + Build
echo [4/5] Installing Node dependencies and building frontend...
if not exist "node_modules" (
    npm install
)
npm run build

:: Step 5: Start App
echo [5/5] Launching Dubber Dang Pro...
echo.
echo  Application will open at: http://localhost:3000
echo  Press Ctrl+C to stop the server
echo.
python desktop_app.py

pause
