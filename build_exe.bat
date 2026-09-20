@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   CheatZ Dabber PRO - Windows EXE Build Script
echo   ==========================================
echo   Output: dist\CheatZDabberPro\CheatZDabberPro.exe
echo ============================================================
echo.

:: Check that we are in the project directory
if not exist "server.py" (
    echo ERROR: Run this script from the animeclone project folder.
    pause
    exit /b 1
)

:: ── Step 1: Build React Frontend ────────────────────────────────────────────
echo [1/5] Building React Frontend (npm run build)...
call npm run build
if errorlevel 1 (
    echo ERROR: npm run build failed. Check your Node.js / TypeScript errors.
    pause
    exit /b 1
)
echo       React frontend built to public/ - OK
echo.

:: ── Step 2: Install Python dependencies ─────────────────────────────────────
echo [2/5] Installing Python dependencies...
.venv\Scripts\pip.exe install -q pywebview>=5.0.0 pyinstaller>=6.0.0
if errorlevel 1 (
    echo WARNING: Some packages may not have installed. Continuing...
)
echo       Python packages installed - OK
echo.

:: ── Step 3: Clean previous build ────────────────────────────────────────────
echo [3/5] Cleaning previous build artifacts...
if exist "dist\CheatZDabberPro" rmdir /s /q "dist\CheatZDabberPro"
if exist "build" rmdir /s /q "build"
echo       Cleaned - OK
echo.

:: ── Step 4: Run PyInstaller ──────────────────────────────────────────────────
echo [4/5] Running PyInstaller (this may take 2-5 minutes)...
.venv\Scripts\pyinstaller.exe animeclone.spec --noconfirm --clean
if errorlevel 1 (
    echo ERROR: PyInstaller failed. Check the error output above.
    pause
    exit /b 1
)
echo       PyInstaller completed - OK
echo.

:: ── Step 5: Copy runtime folders to dist ────────────────────────────────────
echo [5/5] Copying runtime data to dist...
if not exist "dist\CheatZDabberPro\data" mkdir "dist\CheatZDabberPro\data"
if not exist "dist\CheatZDabberPro\uploads" mkdir "dist\CheatZDabberPro\uploads"
if not exist "dist\CheatZDabberPro\outputs" mkdir "dist\CheatZDabberPro\outputs"

:: Copy env template if .env is not bundled
if exist ".env" copy /y ".env" "dist\CheatZDabberPro\.env" > nul

echo       Runtime folders created - OK
echo.

:: ── Done ────────────────────────────────────────────────────────────────────
echo ============================================================
echo   BUILD COMPLETE!
echo   
echo   Run the app:
echo   dist\CheatZDabberPro\CheatZDabberPro.exe
echo.
echo   To distribute, ZIP the entire folder:
echo   dist\CheatZDabberPro\
echo ============================================================
echo.

pause
