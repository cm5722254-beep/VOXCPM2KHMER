@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ===============================================================================
echo   BUILD STANDALONE WINDOWS .EXE - ALL LIBRARIES BUNDLED
echo   SDACH ATITEB PRO - Supports Windows 7 / 8 / 10 / 11 (x64)
echo ===============================================================================
echo.

:: ── Locate Python / venv ─────────────────────────────────────────────────────
set "PYTHON=.venv\Scripts\python.exe"
set "PIP=.venv\Scripts\pip.exe"
set "PYINST=.venv\Scripts\pyinstaller.exe"

if not exist "!PYTHON!" (
    where python >nul 2>nul
    if %errorlevel% equ 0 (
        set "PYTHON=python"
        set "PIP=pip"
        set "PYINST=pyinstaller"
    ) else (
        echo [ERROR] Python not found! Please activate your virtual environment.
        pause & exit /b 1
    )
)

:: ── Install / upgrade PyInstaller ────────────────────────────────────────────
echo [0/4] Checking PyInstaller...
"!PIP!" install --quiet --upgrade pyinstaller pyinstaller-hooks-contrib
echo       PyInstaller ready.
echo.

:: ── Step 1: Install ALL requirements ─────────────────────────────────────────
echo [1/4] Installing ALL Python dependencies...
"!PIP!" install --quiet -r requirements.txt
"!PIP!" install --quiet pywebview[qt] pywebview[winforms]
echo       Dependencies installed.
echo.

:: ── Step 2: Build React Frontend ─────────────────────────────────────────────
echo [2/4] Building React Frontend (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    echo [WARNING] npm build failed. Continuing with existing dist/public...
)
echo       Frontend build done.
echo.

:: ── Step 3: PyInstaller - Build EXE ──────────────────────────────────────────
echo [3/4] Compiling to Standalone .EXE with ALL libraries bundled...
echo       This may take 3-10 minutes depending on your machine...
echo.

if not exist "!PYINST!" (
    where pyinstaller >nul 2>nul
    if %errorlevel% equ 0 ( set "PYINST=pyinstaller" ) else (
        echo [ERROR] pyinstaller not found!
        pause & exit /b 1
    )
)

"!PYINST!" animeclone.spec --noconfirm --clean
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] PyInstaller build FAILED!
    echo [HINT] Try running: pip install pyinstaller --upgrade
    pause & exit /b 1
)

:: ── Step 4: Copy output EXE to root ──────────────────────────────────────────
echo [4/4] Copying .EXE to project root for easy access...
if exist "dist\SDACH_ATITEB_PRO.exe" (
    copy /y "dist\SDACH_ATITEB_PRO.exe" "SDACH_ATITEB_PRO.exe" > nul
    copy /y "dist\SDACH_ATITEB_PRO.exe" "ស្ទូឌីយោសម្រាយរឿង_AI_PRO.exe" > nul
    echo       EXE copied successfully!
) else (
    echo [WARNING] dist\SDACH_ATITEB_PRO.exe not found!
)

echo.
echo ===============================================================================
echo   BUILD SUCCESSFUL!
echo   Output: SDACH_ATITEB_PRO.exe
echo   Works on: Windows 7 / 8 / 10 / 11 (x64) - No Python needed!
echo   Note: WebView2 Runtime required for GUI (auto-installs on Win10/11)
echo ===============================================================================
echo.
pause
