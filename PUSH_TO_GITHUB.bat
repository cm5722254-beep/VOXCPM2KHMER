@echo off
chcp 65001 > nul
echo ===============================================================================
echo  🐉 PUSH TO GITHUB - Tool AI Speak Khmer
echo ===============================================================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed!
    echo.
    echo Please install Git first:
    echo https://git-scm.com/downloads
    echo.
    pause
    exit /b 1
)

echo [1/6] Initializing Git repository...
if not exist ".git" (
    git init
    echo Repository initialized.
) else (
    echo Repository already exists.
)
echo.

echo [2/6] Adding remote repository...
git remote remove origin 2>nul
git remote add origin https://github.com/cm5722254-beep/Tool_ai_speak_khmer.git
git remote -v
echo.

echo [3/6] Creating .gitignore...
if not exist ".gitignore" (
    echo node_modules/ > .gitignore
    echo .venv/ >> .gitignore
    echo __pycache__/ >> .gitignore
    echo *.pyc >> .gitignore
    echo *.exe >> .gitignore
    echo *.log >> .gitignore
    echo .env >> .gitignore
    echo uploads/* >> .gitignore
    echo outputs/* >> .gitignore
    echo dist/ >> .gitignore
    echo build/ >> .gitignore
    echo *.db >> .gitignore
    echo Created .gitignore
)
echo.

echo [4/6] Staging all files...
git add .
git status
echo.

echo [5/6] Creating commit...
git commit -m "Initial commit: Dragon Dabber Pro - AI Khmer Dubbing Studio"
echo.

echo [6/6] Setting branch to main and pushing...
git branch -M main
echo.
echo Ready to push to GitHub!
echo.
echo ⚠️  You will be prompted for GitHub credentials.
echo If you have 2FA enabled, use a Personal Access Token instead of password.
echo.
pause

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ===============================================================================
    echo  ✅ SUCCESS! Repository pushed to GitHub
    echo  https://github.com/cm5722254-beep/Tool_ai_speak_khmer
    echo ===============================================================================
) else (
    echo.
    echo ===============================================================================
    echo  ❌ PUSH FAILED
    echo  Please check your credentials and try again
    echo ===============================================================================
)

echo.
pause
