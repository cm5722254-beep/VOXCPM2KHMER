@echo off
title ស្ដេចអាទិទេព PRO STUDIO — Clean & Eye-Friendly AI Dubbing
chcp 65001 > nul
cd /d "%~dp0"

echo ====================================================
echo 🎬 កំពុងបើក ស្ដេចអាទិទេព PRO STUDIO (Clean UI Edition)
echo ====================================================

REM Check python virtual environment
set "PY=.venv\Scripts\python.exe"
if not exist "%PY%" (
    set "PY=.venv312\Scripts\python.exe"
)
if not exist "%PY%" (
    set "PY=python.exe"
)

"%PY%" desktop_app_pro_studio.py
