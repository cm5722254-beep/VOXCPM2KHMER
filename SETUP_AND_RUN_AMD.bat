@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
cd /d "%~dp0"
title 🐉 VOXCPM2KHMER — AMD Vega 64 Setup + Build openTool.exe

echo.
echo ============================================================
echo   🐉 VOXCPM2KHMER — AMD RX Vega 64 Complete Setup
echo   ➤ Install pystray, torch-directml, Pillow, psutil
echo   ➤ Build openTool.exe
echo   ➤ Test GPU detection
echo   ➤ Launch the app
echo ============================================================
echo.

:: ── Find Python ──────────────────────────────────────────────────────────────
set "PY="
set "PIP="
set "PYINST="

if exist ".venv\Scripts\python.exe" (
    set "PY=.venv\Scripts\python.exe"
    set "PIP=.venv\Scripts\pip.exe"
    set "PYINST=.venv\Scripts\pyinstaller.exe"
    echo [OK] Using project venv: .venv\Scripts\python.exe
) else (
    where python >nul 2>nul
    if !errorlevel! equ 0 (
        set "PY=python"
        set "PIP=pip"
        set "PYINST=pyinstaller"
        echo [OK] Using system Python
    ) else (
        echo [ERROR] Python not found!
        echo         Run INSTALL_ALL_WINDOWS.bat first.
        pause & exit /b 1
    )
)
echo.

:: ── Step 1: Install AMD-required packages ────────────────────────────────────
echo [1/5] Installing pystray (system tray icon)...
"!PIP!" install -q --upgrade pystray
if !errorlevel! equ 0 (
    echo       pystray : OK
) else (
    echo [WARN] pystray install failed — tray icon will be disabled.
)
echo.

echo [2/5] Installing Pillow + psutil (tray icon image, process management)...
"!PIP!" install -q --upgrade Pillow psutil
echo       Pillow + psutil : OK
echo.

echo [3/5] Installing torch-directml (AMD GPU AI acceleration)...
echo       This enables AMD Vega 64 GPU acceleration for AI tasks.
echo       Package size ~300MB — may take a few minutes...
echo.
"!PIP!" install torch-directml
if !errorlevel! equ 0 (
    echo       torch-directml : INSTALLED OK
    echo       AMD Vega 64 DirectML acceleration is now ACTIVE!
) else (
    echo [WARN] torch-directml install failed.
    echo        AI tasks will run on CPU instead of GPU.
    echo        You can try manually: pip install torch-directml
)
echo.

:: ── Step 2: Upgrade PyInstaller ──────────────────────────────────────────────
echo [4/5] Upgrading PyInstaller...
"!PIP!" install -q --upgrade pyinstaller pyinstaller-hooks-contrib
echo       PyInstaller : OK
echo.

:: ── Step 3: Build openTool.exe ───────────────────────────────────────────────
echo [5/5] Building openTool.exe...
echo       Please wait ~2-5 minutes...
echo.

if not exist "!PYINST!" (
    where pyinstaller >nul 2>nul
    if !errorlevel! equ 0 (
        set "PYINST=pyinstaller"
    ) else (
        echo [ERROR] pyinstaller not found even after install!
        pause & exit /b 1
    )
)

"!PYINST!" openTool.spec --noconfirm --clean
echo.

:: ── Copy exe to root ─────────────────────────────────────────────────────────
if exist "dist\openTool.exe" (
    copy /y "dist\openTool.exe" "openTool.exe" >nul
    echo ============================================================
    echo  ✅ openTool.exe BUILT SUCCESSFULLY!
    echo ============================================================
    echo.
) else (
    echo ============================================================
    echo  ❌ Build failed — dist\openTool.exe not found.
    echo     See PyInstaller output above for errors.
    echo ============================================================
    echo.
    echo  Tip: You can still run the app directly without the .exe:
    echo       .venv\Scripts\python.exe openTool.py
    echo.
    pause & exit /b 1
)

:: ── Step 4: GPU Detection Test ───────────────────────────────────────────────
echo == GPU Detection Test ==
"!PY!" -c "
import sys; sys.path.insert(0,'.')
from openTool import detect_gpu
gpu = detect_gpu()
print('  GPU     :', gpu.name)
print('  Vendor  :', gpu.vendor.upper())
print('  VRAM    :', gpu.vram_gb, 'GB')
print('  Backend :', gpu.backend_label)
print('  Encoder :', gpu.ffmpeg_encoder)
print('  Torch   :', gpu.torch_device)
print('  DirectML:', 'YES' if gpu.has_directml else 'NO')
print()
print('  Status  :', gpu.summary_line())
" 2>&1
echo.

:: ── Step 5: AMD env vars summary ─────────────────────────────────────────────
echo == AMD Environment Variables (injected automatically when app starts) ==
echo   VOXCPM_AMD             = 1
echo   HIP_VISIBLE_DEVICES    = 0   (select GPU 0)
echo   DML_VISIBLE_DEVICES    = 0   (DirectML GPU 0)
echo   AMD_SERIALIZE_KERNEL   = 1   (stability on Vega)
echo   HSA_OVERRIDE_GFX_VERSION = 9.0.0  (Vega 64 = gfx900)
echo.

:: ── Step 6: Launch ───────────────────────────────────────────────────────────
echo ============================================================
echo  Ready to launch!
echo.
echo  Options:
echo    [1] Run openTool.exe  (compiled exe — no Python needed)
echo    [2] Run openTool.py   (direct Python — for debugging)
echo    [3] Exit
echo ============================================================
echo.
set /p CHOICE="Your choice (1/2/3): "

if "!CHOICE!"=="1" (
    echo Starting openTool.exe...
    start "" "openTool.exe"
) else if "!CHOICE!"=="2" (
    echo Starting openTool.py directly...
    start "" "!PY!" openTool.py
) else (
    echo Done. Run openTool.exe any time to launch the app.
)

echo.
pause
