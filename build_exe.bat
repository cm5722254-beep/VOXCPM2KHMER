@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   CheatZ Dabber PRO - Standalone Windows Portable Builder
echo   ========================================================
echo   Target: dist\CheatZDabberPro\ (100%% Portable, No Install Needed)
echo ============================================================
echo.

if not exist "server.py" (
    exit /b 1
)

:: ── Step 1: Build React Frontend ────────────────────────────────────────────
echo [1/5] Building React Frontend (npm run build)...
call npm run build
if errorlevel 1 (
    echo ERROR: npm run build failed.
    exit /b 1
)
echo       React frontend built to public/ - OK
echo.

:: ── Step 2: Ensure PyInstaller Python 3.12 ──────────────────────────────────
echo [2/5] Checking PyInstaller...
set "PYINST=.venv312\Scripts\pyinstaller.exe"
if not exist "!PYINST!" set "PYINST=.venv\Scripts\pyinstaller.exe"

if not exist "!PYINST!" (
    echo [INFO] Preparing Python 3.12 build venv...
    where uv >nul 2>nul
    if !errorlevel! equ 0 (
        uv venv .venv312 --python 3.12
        uv pip install -r requirements.txt pyinstaller pywebview --python .venv312\Scripts\python.exe
    ) else (
        python -m venv .venv312
        .venv312\Scripts\pip install -r requirements.txt pyinstaller pywebview
    )
    set "PYINST=.venv312\Scripts\pyinstaller.exe"
)
echo       PyInstaller ready at !PYINST! - OK
echo.

:: ── Step 3: Clean previous build ────────────────────────────────────────────
echo [3/4] Cleaning previous build artifacts...
if exist "dist\ATITEBDABBERPRO" rmdir /s /q "dist\ATITEBDABBERPRO" 2>nul
if exist "dist\ATITEBDABBERPRO.exe" del /f /q "dist\ATITEBDABBERPRO.exe" 2>nul
if exist "build" rmdir /s /q "build" 2>nul
echo       Cleaned - OK
echo.

:: ── Step 4: Run PyInstaller (Single Standalone Executable) ───────────────────
echo [4/4] Running PyInstaller (Compiling into ONE Standalone .EXE)...
echo       Bundling Python 3.12 runtime, FastAPI, Webview, React UI and FFmpeg...
"!PYINST!" animeclone.spec --noconfirm --clean
if errorlevel 1 (
    echo ERROR: PyInstaller compilation failed.
    exit /b 1
)
echo       PyInstaller single-file build completed - OK
echo.

if exist "dist\ATITEBDABBERPRO.exe" (
    copy /y "dist\ATITEBDABBERPRO.exe" "ATITEBDABBERPRO.exe" > nul
)

:: ── Done ────────────────────────────────────────────────────────────────────
echo ============================================================
echo   BUILD SUCCESSFUL! (100%% SINGLE STANDALONE EXECUTABLE)
echo ============================================================
echo.
echo   DONE.
echo ============================================================
echo.



