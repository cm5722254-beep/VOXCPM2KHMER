@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ============================================================
echo   🐉 BUILD openTool.exe — VOXCPM2KHMER Launcher
echo   AMD RX Vega 64 / NVIDIA / Intel GPU Edition
echo   Output: dist\openTool.exe
echo ============================================================
echo.

:: ── Locate pip and pyinstaller from the project venv ─────────────────────────
set "PY=.venv\Scripts\python.exe"
set "PIP=.venv\Scripts\pip.exe"
set "PYINST=.venv\Scripts\pyinstaller.exe"

if not exist "!PY!" (
    where python >nul 2>nul
    if !errorlevel! equ 0 (
        set "PY=python"
    ) else (
        echo [ERROR] Python not found. Run INSTALL_ALL_WINDOWS.bat first.
        pause & exit /b 1
    )
)
if not exist "!PIP!" (
    where pip >nul 2>nul
    if !errorlevel! equ 0 ( set "PIP=pip" )
)
if not exist "!PYINST!" (
    where pyinstaller >nul 2>nul
    if !errorlevel! equ 0 (
        set "PYINST=pyinstaller"
    ) else (
        echo [ERROR] PyInstaller not found. Installing...
        "!PIP!" install pyinstaller
    )
)

echo [1/4] Installing / updating launcher dependencies...
echo       pystray  ^(system tray^)
echo       Pillow   ^(tray icon image generation^)
echo       psutil   ^(process management^)
echo.
"!PIP!" install -q --upgrade pystray Pillow psutil
if !errorlevel! neq 0 (
    echo [WARN] Some packages may not have installed — continuing anyway.
)
echo Done.
echo.

echo [2/4] Upgrading PyInstaller...
"!PIP!" install -q --upgrade pyinstaller pyinstaller-hooks-contrib
echo Done.
echo.

echo [3/4] Building openTool.exe with PyInstaller...
echo       Spec file : openTool.spec
echo       Entry     : openTool.py
echo       Mode      : Single-file, no console window
echo       GPU       : AMD Vega 64 / NVIDIA CUDA / Intel QSV / CPU
echo.
"!PYINST!" openTool.spec --noconfirm --clean
echo.

:: ── Copy to project root ──────────────────────────────────────────────────────
if exist "dist\openTool.exe" (
    copy /y "dist\openTool.exe" "openTool.exe" >nul
    echo ============================================================
    echo  ✅ BUILD SUCCESS!
    echo.
    echo  Files created:
    echo     dist\openTool.exe   ^(PyInstaller output^)
    echo     openTool.exe        ^(copy in project root^)
    echo.
    echo  How to use:
    echo     Double-click  openTool.exe
    echo     · Detects AMD Vega 64 / NVIDIA / Intel GPU automatically
    echo     · Starts local_voxcpm_server.py with AMD DirectML env vars
    echo     · Opens browser at http://localhost:8765
    echo     · System tray icon with Start / Stop / Restart / GPU Info
    echo ============================================================
) else (
    echo ============================================================
    echo  ❌ BUILD FAILED — dist\openTool.exe not found.
    echo     Check the PyInstaller output above for errors.
    echo ============================================================
)
echo.

:: ── [4/4] Syntax-check the source before declaring done ───────────────────────
echo [4/4] Syntax verification...
"!PY!" -m py_compile openTool.py
if !errorlevel! equ 0 (
    echo       openTool.py   OK
) else (
    echo       openTool.py   SYNTAX ERROR
)
echo.

pause
