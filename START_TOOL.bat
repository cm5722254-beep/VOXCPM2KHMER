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
    echo Please run SETUP.bat first to install dependencies.
    echo.
    pause
    exit /b 1
)

REM Check if frontend is built
if not exist "public\assets\index-*.js" (
    echo [WARNING] Frontend assets not found!
    echo The app will show a setup page. Run SETUP.bat to build the frontend.
    echo.
)

REM Start the server
echo Server will start at: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
.\.venv\Scripts\python.exe server.py

pause
