@echo off
chcp 65001 >nul
title 👑 CHEAT DABBER TOOL - License Key Generator

echo.
echo ================================================================
echo    👑 CHEAT DABBER TOOL - License Key Generator (Admin)
echo ================================================================
echo.

REM Check if virtual environment exists
if exist ".venv\Scripts\python.exe" (
    echo [INFO] Using virtual environment Python...
    ".venv\Scripts\python.exe" generate_license.py
) else if exist "python.exe" (
    echo [INFO] Using bundled Python...
    python.exe generate_license.py
) else (
    echo [INFO] Using system Python...
    python generate_license.py
)

echo.
echo.
pause
