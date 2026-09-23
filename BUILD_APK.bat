@echo off
title Build Cheatz Dabber APK
echo ========================================================
echo   Building Cheatz Dabber Mobile APK (Release Mode)
echo ========================================================
cd /d "%~dp0flutter_app"

echo [1/2] Running Flutter APK build...
call flutter build apk --release

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed! Check the output above.
    pause
    exit /b %ERRORLEVEL%
)

echo [2/2] Copying APK to project root...
copy /Y "build\app\outputs\flutter-apk\app-release.apk" "..\CheatzDabber_v2.1.apk"
copy /Y "build\app\outputs\flutter-apk\app-release.apk" "..\CheatzDabber_v2.0.apk"

echo.
echo ========================================================
echo   SUCCESS! APK built successfully:
echo   %~dp0CheatzDabber_v2.1.apk
echo ========================================================
echo.
pause
