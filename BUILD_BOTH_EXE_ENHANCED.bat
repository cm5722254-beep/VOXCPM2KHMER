@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo.
echo ═══════════════════════════════════════════════════════════════
echo    💎 DABBER PRO - Build Both EXE Files (Enhanced)
echo ═══════════════════════════════════════════════════════════════
echo.
echo Building:
echo   1️⃣  CheatDabberTool.exe (Main Application)
echo   2️⃣  LicenseKeyGenerator.exe (Enhanced GUI Admin Tool)
echo.
echo ═══════════════════════════════════════════════════════════════
echo.

REM Check if virtual environment exists
if not exist ".venv\Scripts\activate" (
    echo ❌ Virtual environment not found!
    echo Please run: python -m venv .venv
    pause
    exit /b 1
)

REM Activate virtual environment
call .venv\Scripts\activate

REM Check PyInstaller
python -c "import PyInstaller" 2>nul
if errorlevel 1 (
    echo 📦 Installing PyInstaller...
    pip install pyinstaller
    if errorlevel 1 (
        echo ❌ Failed to install PyInstaller
        pause
        exit /b 1
    )
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
echo This may take 5-10 minutes...
pyinstaller animeclone.spec --noconfirm --clean
if errorlevel 1 (
    echo ❌ ERROR: Main app build failed
    pause
    exit /b 1
)

if exist "dist\CheatDabberTool.exe" (
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
REM Build 2: License Key Generator GUI (Admin Tool)
REM ═══════════════════════════════════════════════════════════════
echo.
echo ┌─────────────────────────────────────────────────────────────┐
echo │ [2/2] Building Admin Tool: LicenseKeyGenerator.exe (GUI)   │
echo └─────────────────────────────────────────────────────────────┘
echo.

REM Clean previous build
if exist "dist\LicenseKeyGenerator.exe" del /f /q "dist\LicenseKeyGenerator.exe" 2>nul
if exist "build" rmdir /s /q "build" 2>nul

REM Build License Generator GUI EXE
echo Building LicenseKeyGenerator.exe with animated GUI...
pyinstaller build_license_generator_gui.spec --noconfirm --clean
if errorlevel 1 (
    echo ❌ ERROR: License generator build failed
    pause
    exit /b 1
)

if exist "dist\LicenseKeyGenerator.exe" (
    for %%A in ("dist\LicenseKeyGenerator.exe") do set "size2=%%~zA"
    set /a "sizeMB2=!size2! / 1048576"
    echo.
    echo ✅ LicenseKeyGenerator.exe built successfully
    echo    📦 Size: !sizeMB2! MB
    echo    📁 Location: dist\LicenseKeyGenerator.exe
    echo    ✨ Features: Animated GUI, Tabs, Statistics Dashboard
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
echo        ├─ Main application for end users
echo        ├─ AI Dubbing Studio with license activation
echo        ├─ Size: !sizeMB1! MB
echo        └─ Location: dist\CheatDabberTool.exe
echo.
echo    2️⃣  LicenseKeyGenerator.exe
echo        ├─ Enhanced GUI admin tool
echo        ├─ Animated interface with tabs
echo        ├─ Generate, manage, and track licenses
echo        ├─ Statistics dashboard
echo        ├─ Size: !sizeMB2! MB
echo        └─ Location: dist\LicenseKeyGenerator.exe
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo 📝 Next Steps:
echo    • Test CheatDabberTool.exe (end user app)
echo    • Test LicenseKeyGenerator.exe (GUI admin tool)
echo    • Distribute CheatDabberTool.exe to customers
echo    • Keep LicenseKeyGenerator.exe for admin only
echo.
echo 💡 Admin Tool Features:
echo    ⚡ Generate Keys Tab - Create new license keys
echo    📋 Manage Keys Tab - View and search all keys
echo    💻 Activations Tab - View and deactivate machines
echo    📊 Statistics Tab - Dashboard with key metrics
echo.
echo ═══════════════════════════════════════════════════════════════
echo.

REM Create summary file
echo Creating build summary...
(
echo # 🎉 Build Complete - %DATE% %TIME%
echo.
echo ## Built Applications
echo.
echo ### 1. CheatDabberTool.exe
echo - **Size**: !sizeMB1! MB
echo - **Purpose**: Main AI Dubbing Studio for end users
echo - **Features**: License activation, VoxCPM2, Pure Khmer, ElevenLabs
echo.
echo ### 2. LicenseKeyGenerator.exe
echo - **Size**: !sizeMB2! MB
echo - **Purpose**: Admin tool for license management
echo - **Interface**: Enhanced GUI with animations
echo - **Features**:
echo   - ⚡ Generate license keys with custom validity
echo   - 📋 Manage and search all license keys
echo   - 💻 View and deactivate machine activations
echo   - 📊 Statistics dashboard
echo.
echo ## Distribution
echo.
echo ### For End Users
echo ```
echo dist\CheatDabberTool.exe
echo ```
echo.
echo ### For Administrators
echo ```
echo dist\LicenseKeyGenerator.exe
echo ```
echo.
echo ## Build Environment
echo - Python: %PYTHON_VERSION%
echo - Node: npm v%NPM_VERSION%
echo - PyInstaller: Installed
echo - Build Date: %DATE% %TIME%
echo.
) > "ENHANCED_BUILD_SUMMARY.md"

echo ✅ Build summary saved to ENHANCED_BUILD_SUMMARY.md
echo.

pause
