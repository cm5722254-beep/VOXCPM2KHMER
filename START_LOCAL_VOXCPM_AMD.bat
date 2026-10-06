@echo off
title 🐉 Dragon Dabber PRO - AMD GPU Mode (Vega / RX Series)
chcp 65001 > nul
cd /d "%~dp0"

echo ============================================================
echo   🐉 DRAGON DABBER PRO — AMD GPU Mode
echo   AMD Vega 64 / RX Series (Windows DirectX 12 ML)
echo   h264_amf Video Encode + DirectML AI Acceleration
echo ============================================================
echo.

:: ── DirectX / DirectML environment ────────────────────────────────────────
:: HIP_VISIBLE_DEVICES selects the AMD GPU index for ROCm builds.
:: DML_VISIBLE_DEVICES selects the GPU for torch-directml.
:: AMD_SERIALIZE_KERNEL serialises GPU kernel dispatches (stability on Vega).
:: VOXCPM_AMD=1 tells local_voxcpm_server.py to use torch-directml path.

set "HIP_VISIBLE_DEVICES=0"
set "DML_VISIBLE_DEVICES=0"
set "AMD_SERIALIZE_KERNEL=1"
set "VOXCPM_AMD=1"
set "VOXCPM_DEVICE=amd"

:: ── Disable shader cache growth (optional, reduces VRAM pressure on Vega) ──
set "DISABLE_LAYER_AMD_SWITCHABLE_GRAPHICS_1=1"

:: ── Force DX12 renderer (needed for DirectML on older Vega drivers) ────────
set "DIRECT3D_FORCE_COMPATIBILITY=0"

:: ── UTF-8 Python output ────────────────────────────────────────────────────
set "PYTHONIOENCODING=utf-8"
set "PYTHONUTF8=1"

echo [1/3] ກຳລັງ ตรวจสอบ AMD GPU (wmic)...
wmic path win32_VideoController get Name,AdapterRAM /format:list 2>nul | findstr /i "Radeon\|Vega\|RX"
if %errorlevel% neq 0 (
    echo       [WARNING] AMD GPU not found via wmic — continuing anyway.
    echo       ⚠  Make sure AMD Adrenalin drivers are installed.
)
echo.

echo [2/3] ກຳລັງ ตรวจสอบ torch-directml...
if exist ".venv\Scripts\python.exe" (
    set "PY=.venv\Scripts\python.exe"
) else (
    set "PY=python"
)
%PY% -c "import torch_directml; print('  ✅ torch-directml OK:', torch_directml.__version__)" 2>nul
if %errorlevel% neq 0 (
    echo.
    echo   ❌ torch-directml is NOT installed!
    echo.
    echo   Install it now? This is required for AMD GPU acceleration.
    echo   Command: pip install torch-directml
    echo.
    set /p INSTALL_DML="Install torch-directml now? [Y/N]: "
    if /i "!INSTALL_DML!"=="Y" (
        if exist ".venv\Scripts\pip.exe" (
            .venv\Scripts\pip.exe install torch-directml
        ) else (
            pip install torch-directml
        )
        if %errorlevel% neq 0 (
            echo [ERROR] Failed to install torch-directml.
            echo         Running in CPU fallback mode instead.
            set "VOXCPM_AMD=0"
        ) else (
            echo   ✅ torch-directml installed successfully!
        )
    ) else (
        echo   Skipped. Server will run in CPU mode.
        set "VOXCPM_AMD=0"
    )
)
echo.

echo [3/3] ចាប់ផ្តើម Server (AMD DirectML + h264_amf)...
echo.
echo   ▶ Torch Device   : AMD DirectML (DX12)
echo   ▶ AI Compute     : int8_float16 (CTranslate2 CPU+HBM2 path)
echo   ▶ Video Encode   : h264_amf (VCE — Vega 64 tuned)
echo   ▶ VRAM           : 8 GB HBM2 (Vega 64)
echo   ▶ URL            : http://localhost:8765
echo.
echo   Press Ctrl+C to stop the server.
echo ============================================================
echo.

%PY% local_voxcpm_server.py --amd

pause
