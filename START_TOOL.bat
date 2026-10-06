@echo off
chcp 65001 > nul
echo ===============================================================================
echo  🐉 DRAGON DABBER PRO - AI Khmer Dubbing Studio
echo  Starting server...
echo ===============================================================================
echo.

REM Check if virtual environment exists
if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found!
    echo Please run SETUP.bat first.
    pause
    exit /b 1
)

REM Start the server
echo Server running at: http://localhost:3000
echo Press Ctrl+C to stop
echo.
.\.venv\Scripts\python.exe server.py

pause
