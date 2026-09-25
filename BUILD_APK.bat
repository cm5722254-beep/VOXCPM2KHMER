@echo off
title Build Cheatz Dabber APK
echo ========================================================
echo   Building Cheatz Dabber Mobile APK (Release Mode)
echo ========================================================
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;C:\Users\DI Fight\flutter\bin;%PATH%"

cd /d "%~dp0flutter_app"

echo [1/2] Running Flutter APK build...
call flutter build apk --release

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed! Check the output above.
    pause
    exit /b %ERRORLEVEL%
)

echo [2/2] Copying APK to project root and public download folder...
copy /Y "build\app\outputs\flutter-apk\app-release.apk" "..\CheatzDabber_v4.0.apk"
copy /Y "build\app\outputs\flutter-apk\app-release.apk" "..\CheatzDabber_v2.1.apk"
copy /Y "build\app\outputs\flutter-apk\app-release.apk" "..\public\CheatzDabber_Khmer_v1.0.apk"

echo.
echo ========================================================
echo   SUCCESS! APK built successfully:
echo   %~dp0CheatzDabber_v4.0.apk
echo ========================================================
echo.
pause
