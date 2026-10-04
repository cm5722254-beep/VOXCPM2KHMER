@echo off
title Khmer Dubbing Pro - License Manager PRO
chcp 65001 >nul
cd /d "%~dp0"

echo ====================================================
echo   Khmer Dubbing Pro — License Manager PRO 2026
echo   Opening Admin Key Management ^& Voucher Tool...
echo ====================================================

if exist "Generate_License_Key.exe" (
    start "" "Generate_License_Key.exe"
) else if exist ".venv\Scripts\python.exe" (
    start "" ".venv\Scripts\python.exe" license_manager.py
) else (
    start "" python license_manager.py
)
exit
