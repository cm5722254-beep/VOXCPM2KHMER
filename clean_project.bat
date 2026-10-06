@echo off
chcp 65001 > nul
cd /d "%~dp0"
title Dragon Dabber Pro - Project Cleaner

echo [INFO] កំពុងសម្អាត Project, Cache, Log និង File បណ្ដោះអាសន្ន...
if exist ".venv\Scripts\python.exe" (
    .venv\Scripts\python.exe scripts\clean_project.py
) else (
    python scripts\clean_project.py
)

echo.
pause
