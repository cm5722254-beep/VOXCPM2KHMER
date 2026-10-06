@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ===============================================================================
echo   🎬 ស្ទូឌីយោសម្រាយរឿង AI & KHMER DUBBING PRO - WINDOWS INSTALLER
echo   កម្មវិធីសម្រាប់កុំព្យូទ័រ Windows ទាំងអស់ (Win 10, Win 11, Win 7/8 64-bit)
echo ===============================================================================
echo.

:: 1. Check if running with admin rights
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] កំពុងស្នើសិទ្ធិ Administrator...
)

:: 2. Check if pre-built standalone EXE exists
if exist "dist\Dragon_Dabber_Pro.exe" (
    set "EXE_SRC=dist\Dragon_Dabber_Pro.exe"
) else if exist "Dragon_Dabber_Pro.exe" (
    set "EXE_SRC=Dragon_Dabber_Pro.exe"
) else if exist "dist\SDACH_ATITEB_PRO.exe" (
    set "EXE_SRC=dist\SDACH_ATITEB_PRO.exe"
) else if exist "ស្ដេចអាទិទេព_PRO.exe" (
    set "EXE_SRC=ស្ដេចអាទិទេព_PRO.exe"
) else if exist "SDACH_ATITEB_PRO.exe" (
    set "EXE_SRC=SDACH_ATITEB_PRO.exe"
) else if exist "dist\ATITEBDABBERPRO.exe" (
    set "EXE_SRC=dist\ATITEBDABBERPRO.exe"
) else (
    set "EXE_SRC="
)

if defined EXE_SRC (
    echo [1/3] បានរកឃើញ Standalone Executable: !EXE_SRC!
    copy /y "!EXE_SRC!" "%USERPROFILE%\Desktop\🐉_DRAGON_DABBER_PRO.exe" > nul
    echo [2/3] បានបង្កើត Shortcut នៅលើ Desktop: "🐉_DRAGON_DABBER_PRO.exe"
    echo [3/3] ការដំឡើងជោគជ័យ 100%%!
    echo.
    echo ===============================================================================
    echo   🎉 រួចរាល់! លោកអ្នកអាចចុចលើ Desktop Shortcut ដើម្បីបើកកម្មវិធីបានភ្លាមៗ!
    echo ===============================================================================
    pause
    exit /b 0
)

:: 3. If standalone exe not compiled yet, prepare runtime environment
echo [1/4] កំពុងពិនិត្យ Python Runtime...
if exist ".venv\Scripts\python.exe" (
    set "PY=.venv\Scripts\python.exe"
) else (
    where python >nul 2>nul
    if %errorlevel% equ 0 (
        python -m venv .venv
        .venv\Scripts\pip install -r requirements.txt
        set "PY=.venv\Scripts\python.exe"
    ) else (
        echo [ERROR] មិនទាន់មាន Python នៅក្នុងកុំព្យូទ័រទេ!
        pause
        exit /b 1
    )
)

echo [2/4] កំពុងពិនិត្យ Frontend Build...
if not exist "public\index.html" (
    call npm run build
)

:: ── GPU Detection & Optional torch-directml Install ────────────────────────
echo.
echo ============================================================
echo   GPU ចំណាត់ថ្នាក់ — GPU Hardware Detection
echo ============================================================
echo.

:: Check for NVIDIA GPU first
where nvidia-smi >nul 2>nul
if %errorlevel% equ 0 (
    nvidia-smi --query-gpu=name --format=csv,noheader 2>nul
    if !errorlevel! equ 0 (
        echo   ✅ NVIDIA GPU detected — CUDA mode will be used automatically.
        echo      No additional packages needed.
        goto :GPU_DONE
    )
)

:: Check for AMD GPU via wmic
echo   ⏳ Checking for AMD GPU (wmic)...
wmic path win32_VideoController get Name /format:list 2>nul | findstr /i "Radeon\|Vega\|RX" >nul 2>nul
if %errorlevel% equ 0 (
    echo.
    echo   ✅ AMD GPU detected!
    wmic path win32_VideoController get Name /format:list 2>nul | findstr /i "Radeon\|Vega\|RX"
    echo.
    echo   AMD Vega 64 / RX Series requires torch-directml for GPU-accelerated AI.
    echo   Without it, the AI pipeline falls back to CPU (slower but works).
    echo.
    %PY% -c "import torch_directml; print('  ✅ torch-directml already installed:', torch_directml.__version__)" 2>nul
    if !errorlevel! neq 0 (
        set /p INSTALL_AMD="   Install torch-directml for AMD GPU support? [Y/N]: "
        if /i "!INSTALL_AMD!"=="Y" (
            echo   Installing torch-directml...
            %PY% -m pip install torch-directml
            if !errorlevel! equ 0 (
                echo   ✅ torch-directml installed successfully!
                echo   ✅ Use START_LOCAL_VOXCPM_AMD.bat to launch with AMD GPU mode.
            ) else (
                echo   ⚠ Installation failed. You can try manually:
                echo     pip install torch-directml
            )
        ) else (
            echo   Skipped. Server will run in CPU mode for AI tasks.
            echo   You can install later with: pip install torch-directml
        )
    ) else (
        echo   ✅ torch-directml already installed!
        echo   ✅ Use START_LOCAL_VOXCPM_AMD.bat to launch with AMD GPU mode.
    )
    goto :GPU_DONE
)

echo   ⚪ No dedicated GPU detected — server will run in CPU mode.
echo      This still works well for dubbing with multi-threaded CPU acceleration.

:GPU_DONE
echo.

echo [3/4] កំពុងបង្កើត Desktop Shortcut...
set "TARGET_DIR=%~dp0"
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([System.IO.Path]::Combine([Environment]::GetFolderPath('Desktop'), 'ស្ទូឌីយោសម្រាយរឿង_AI_PRO.lnk')); $s.TargetPath = [System.IO.Path]::Combine('%TARGET_DIR%', 'START_LOCAL_VOXCPM.bat'); $s.WorkingDirectory = '%TARGET_DIR%'; if (Test-Path '%TARGET_DIR%app_icon.ico') { $s.IconLocation = '%TARGET_DIR%app_icon.ico' }; $s.Save()"

echo [4/4] ការរៀបចំដំឡើងជោគជ័យ!
echo.
echo ===============================================================================
echo   🎉 ដំឡើងបានជោគជ័យ! លោកអ្នកអាចចុចលើ Shortcut នៅលើ Desktop ដើម្បីប្រើប្រាស់បាន!
echo ===============================================================================
pause
