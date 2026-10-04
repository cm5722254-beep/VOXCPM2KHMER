@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ===============================================================================
echo  BUILD SDACH_ATITEB_PRO.EXE - ALL LIBRARIES BUNDLED
echo  Supports Windows 7 / 8 / 10 / 11 (x64)
echo ===============================================================================
echo.

set "PYINST=.venv\Scripts\pyinstaller.exe"
set "PIP=.venv\Scripts\pip.exe"

if not exist "!PYINST!" (
    where pyinstaller >nul 2>nul
    if %errorlevel% equ 0 (
        set "PYINST=pyinstaller"
    ) else (
        echo [ERROR] pyinstaller not found!
        pause
        exit /b 1
    )
)

if not exist "!PIP!" (
    where pip >nul 2>nul
    if %errorlevel% equ 0 (
        set "PIP=pip"
    )
)

echo [1/3] Upgrading PyInstaller...
"!PIP!" install -q --upgrade pyinstaller pyinstaller-hooks-contrib
echo Done.
echo.

echo [2/3] Building frontend (npm run build)...
call npm run build
echo Frontend done.
echo.

echo [3/3] Running PyInstaller...
echo Please wait 3-10 minutes...
echo.
"!PYINST!" animeclone.spec --noconfirm --clean
echo.

if exist "dist\SDACH_ATITEB_PRO.exe" (
    copy /y "dist\SDACH_ATITEB_PRO.exe" "SDACH_ATITEB_PRO.exe" >nul
    echo ===============================================================================
    echo  BUILD SUCCESS! File: SDACH_ATITEB_PRO.exe
    echo  Works on Windows 7/8/10/11 - No Python needed!
    echo ===============================================================================
) else (
    echo [ERROR] Build FAILED. Check output above for errors.
)
echo.
pause
