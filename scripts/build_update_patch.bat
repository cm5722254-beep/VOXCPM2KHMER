@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   ATITEBDABBERPRO - In-App Hot Update Patch Builder
echo   ទម្លាក់ Version ថ្មីដោយមិនចាំបាច់ដំឡើង EXE ឡើងវិញ
echo ============================================================
echo.

set "PYTHON=.venv312\Scripts\python.exe"
if not exist "%PYTHON%" set "PYTHON=.venv\Scripts\python.exe"
if not exist "%PYTHON%" set "PYTHON=python"

set /p NEW_VER="បញ្ចូលលេខ Version ថ្មី (ឧ. V2.2PRO) [ចុច Enter យក V2.2PRO]: "
if "%NEW_VER%"=="" set "NEW_VER=V2.2PRO"

echo.
echo [1/2] កំពុងដំណើរការ build_update_patch.py សម្រាប់ Version: %NEW_VER%...
"%PYTHON%" scripts\build_update_patch.py --version "%NEW_VER%"

if errorlevel 1 (
    echo.
    echo [ERROR] Build patch បរាជ័យ! សូមពិនិត្យ error ខាងលើ។
    pause
    exit /b 1
)

echo.
pause
