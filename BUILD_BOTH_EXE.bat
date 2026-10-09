@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo.
echo ═══════════════════════════════════════════════════════════════
echo    👑 CHEAT DABBER TOOL - Build Both EXE Files
echo ═══════════════════════════════════════════════════════════════
echo.
echo Building:
echo   1️⃣  CheatDabberTool.exe (Main Application)
echo   2️⃣  LicenseKeyGenerator.exe (Admin Tool)
echo.
echo ═══════════════════════════════════════════════════════════════
echo.

REM Check PyInstaller
set "PYINST=.venv\Scripts\pyinstaller.exe"
if not exist "!PYINST!" (
    echo ❌ PyInstaller not found in .venv
    echo Please run: pip install pyinstaller
    pause
    exit /b 1
)

REM ═══════════════════════════════════════════════════════════════
REM Build 1: Main Application (CheatDabberTool.exe)
REM ═══════════════════════════════════════════════════════════════
echo.
echo ┌─────────────────────────────────────────────────────────────┐
echo │ [1/2] Building Main Application: CheatDabberTool.exe       │
echo └─────────────────────────────────────────────────────────────┘
echo.

REM Build React Frontend
echo [Step 1/3] Building React Frontend...
call npm run build
if errorlevel 1 (
    echo ❌ ERROR: Frontend build failed
    pause
    exit /b 1
)
echo ✅ Frontend built successfully
echo.

REM Clean previous build
echo [Step 2/3] Cleaning previous build...
if exist "dist\CheatDabberTool.exe" del /f /q "dist\CheatDabberTool.exe" 2>nul
if exist "build" rmdir /s /q "build" 2>nul
echo ✅ Cleaned
echo.

REM Build Main EXE
echo [Step 3/3] Building CheatDabberTool.exe...
"!PYINST!" animeclone.spec --noconfirm --clean
if errorlevel 1 (
    echo ❌ ERROR: Main app build failed
    pause
    exit /b 1
)

if exist "dist\CheatDabberTool.exe" (
    set "size1="
    for %%A in ("dist\CheatDabberTool.exe") do set "size1=%%~zA"
    set /a "sizeMB1=!size1! / 1048576"
    echo.
    echo ✅ CheatDabberTool.exe built successfully
    echo    📦 Size: !sizeMB1! MB
    echo    📁 Location: dist\CheatDabberTool.exe
) else (
    echo ❌ ERROR: CheatDabberTool.exe not found
    pause
    exit /b 1
)

REM ═══════════════════════════════════════════════════════════════
REM Build 2: License Key Generator (Admin Tool)
REM ═══════════════════════════════════════════════════════════════
echo.
echo ┌─────────────────────────────────────────────────────────────┐
echo │ [2/2] Building Admin Tool: LicenseKeyGenerator.exe         │
echo └─────────────────────────────────────────────────────────────┘
echo.

REM Clean previous build
if exist "dist\LicenseKeyGenerator.exe" del /f /q "dist\LicenseKeyGenerator.exe" 2>nul
if exist "build" rmdir /s /q "build" 2>nul

REM Build License Generator EXE
echo Building LicenseKeyGenerator.exe...
"!PYINST!" build_license_generator.spec --noconfirm --clean
if errorlevel 1 (
    echo ❌ ERROR: License generator build failed
    pause
    exit /b 1
)

if exist "dist\LicenseKeyGenerator.exe" (
    set "size2="
    for %%A in ("dist\LicenseKeyGenerator.exe") do set "size2=%%~zA"
    set /a "sizeMB2=!size2! / 1048576"
    echo.
    echo ✅ LicenseKeyGenerator.exe built successfully
    echo    📦 Size: !sizeMB2! MB
    echo    📁 Location: dist\LicenseKeyGenerator.exe
) else (
    echo ❌ ERROR: LicenseKeyGenerator.exe not found
    pause
    exit /b 1
)

REM ═══════════════════════════════════════════════════════════════
REM Success Summary
REM ═══════════════════════════════════════════════════════════════
echo.
echo ═══════════════════════════════════════════════════════════════
echo    ✅ BUILD COMPLETE! Both EXE files ready
echo ═══════════════════════════════════════════════════════════════
echo.
echo 📦 Built Files:
echo.
echo    1️⃣  CheatDabberTool.exe
echo        └─ Main application for users
echo        └─ Size: !sizeMB1! MB
echo        └─ Location: dist\CheatDabberTool.exe
echo.
echo    2️⃣  LicenseKeyGenerator.exe
echo        └─ Admin tool (license key management)
echo        └─ Size: !sizeMB2! MB
echo        └─ Location: dist\LicenseKeyGenerator.exe
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo 📝 Next Steps:
echo    • Test CheatDabberTool.exe (for users)
echo    • Test LicenseKeyGenerator.exe (admin tool)
echo    • Distribute CheatDabberTool.exe to customers
echo    • Keep LicenseKeyGenerator.exe for admin only
echo.
echo ═══════════════════════════════════════════════════════════════
echo.

pause
