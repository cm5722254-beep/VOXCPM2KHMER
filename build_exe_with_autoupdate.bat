@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   ATITEBDABBERPRO V2.3PRO - Build with Auto-Update System
echo ============================================================
echo   🔄 Features: Hot Module Reloading + No EXE Reinstall
echo ============================================================
echo.

:: ── Step 1: Verify Auto-Update System Files ────────────────────────────────
echo [1/6] Verifying Auto-Update System files...
set "MISSING=0"

if not exist "services\update_manager.py" (
    echo   ❌ Missing: services\update_manager.py
    set "MISSING=1"
)
if not exist "services\module_loader.py" (
    echo   ❌ Missing: services\module_loader.py
    set "MISSING=1"
)
if not exist "update_config.json" (
    echo   ❌ Missing: update_config.json
    set "MISSING=1"
)
if not exist "app_version.json" (
    echo   ❌ Missing: app_version.json
    set "MISSING=1"
)
if not exist "public\js\update-manager.js" (
    echo   ❌ Missing: public\js\update-manager.js
    set "MISSING=1"
)
if not exist "public\css\update-notification.css" (
    echo   ❌ Missing: public\css\update-notification.css
    set "MISSING=1"
)

if !MISSING! equ 1 (
    echo.
    echo ❌ ERROR: Some Auto-Update System files are missing!
    echo    Please ensure all files are present before building.
    pause
    exit /b 1
)

echo   ✅ All Auto-Update System files present
echo.

:: ── Step 2: Run Auto-Update Tests ──────────────────────────────────────────
echo [2/6] Running Auto-Update System tests...
python scripts\test_auto_update.py
if errorlevel 1 (
    echo.
    echo ⚠️  WARNING: Auto-Update tests failed!
    echo    Continue anyway? (Y/N)
    set /p CONTINUE=
    if /i not "!CONTINUE!"=="Y" exit /b 1
)
echo   ✅ Tests passed
echo.

:: ── Step 3: Build React Frontend ────────────────────────────────────────────
echo [3/6] Building React Frontend...
if not exist "server.py" (
    echo ❌ ERROR: server.py not found
    exit /b 1
)

call npm run build
if errorlevel 1 (
    echo ❌ ERROR: npm run build failed
    exit /b 1
)
echo   ✅ React frontend built
echo.

:: ── Step 4: Prepare PyInstaller ────────────────────────────────────────────
echo [4/6] Checking PyInstaller...
set "PYINST=.venv312\Scripts\pyinstaller.exe"
if not exist "!PYINST!" set "PYINST=.venv\Scripts\pyinstaller.exe"

if not exist "!PYINST!" (
    echo   Installing PyInstaller...
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
echo   ✅ PyInstaller ready
echo.

:: ── Step 5: Clean and Build ────────────────────────────────────────────────
echo [5/6] Cleaning previous build...
if exist "dist\ATITEBDABBERPRO" rmdir /s /q "dist\ATITEBDABBERPRO" 2>nul
if exist "dist\ATITEBDABBERPRO.exe" del /f /q "dist\ATITEBDABBERPRO.exe" 2>nul
if exist "build" rmdir /s /q "build" 2>nul
echo   ✅ Cleaned
echo.

echo [6/6] Building EXE with PyInstaller...
echo   📦 Including Auto-Update System components...
"!PYINST!" animeclone.spec --noconfirm --clean
if errorlevel 1 (
    echo ❌ ERROR: PyInstaller build failed
    exit /b 1
)
echo   ✅ Build completed
echo.

:: ── Copy EXE to root ────────────────────────────────────────────────────────
if exist "dist\ATITEBDABBERPRO.exe" (
    copy /y "dist\ATITEBDABBERPRO.exe" "ATITEBDABBERPRO.exe" > nul
    echo   ✅ Copied to: ATITEBDABBERPRO.exe
)

:: ── Create directories for runtime ─────────────────────────────────────────
if not exist "patches" mkdir "patches"
if not exist "backups" mkdir "backups"
echo   ✅ Created runtime directories

:: ── Done ────────────────────────────────────────────────────────────────────
echo.
echo ============================================================
echo   ✅ BUILD SUCCESSFUL - V2.3PRO with Auto-Update System
echo ============================================================
echo.
echo   📦 Output: ATITEBDABBERPRO.exe
echo   📁 Size: 
for %%A in ("ATITEBDABBERPRO.exe") do echo      %%~zA bytes (%%~zKA KB)
echo.
echo   🎉 Features Included:
echo      ✅ Auto-Update System (no EXE reinstall needed)
echo      ✅ Hot Module Reloading
echo      ✅ Automatic Backups
echo      ✅ Rollback Support
echo      ✅ Beautiful Update UI
echo.
echo   📝 Next Steps:
echo      1. Test the EXE: .\ATITEBDABBERPRO.exe
echo      2. Check for updates in the UI
echo      3. Read: QUICK_START_UPDATE.md
echo.
echo ============================================================
pause
