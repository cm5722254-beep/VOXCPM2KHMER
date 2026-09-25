@echo off
title Install PyTorch CUDA 12.4 for NVIDIA RTX GPU
chcp 65001 > nul
cd /d "%~dp0"

echo ====================================================================
echo 🚀 ដំឡើង PyTorch CUDA 12.4 សម្រាប់កាត NVIDIA RTX (RTX 4060, 3060...)
echo ====================================================================
echo.

if exist ".venv\Scripts\pip.exe" (
    echo [INFO] កំពុងដំឡើង PyTorch CUDA 12.4 ចូលទៅក្នុង .venv...
    .venv\Scripts\pip.exe install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
    echo.
    echo ====================================================================
    echo [CHECK] ត្រួតពិនិត្យ CUDA Status:
    .venv\Scripts\python.exe -c "import torch; print('CUDA Available:', torch.cuda.is_available()); print('GPU Name:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None')"
    echo ====================================================================
) else (
    echo [ERROR] រកមិនឃើញ .venv សូមដំណើរការ run.bat ជាមុនសិន។
)

echo.
echo រួចរាល់! សូមចុច Enter ដើម្បីបិទ។
pause > nul
