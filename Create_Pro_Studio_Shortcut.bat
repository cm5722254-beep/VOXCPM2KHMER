@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo [INFO] កំពុងបង្កើត Shortcut "ស្ដេចអាទិទេព PRO STUDIO" លើ Desktop...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$WshShell = New-Object -ComObject WScript.Shell; " ^
  "$Desktop = [System.Environment]::GetFolderPath('Desktop'); " ^
  "$Shortcut = $WshShell.CreateShortcut(\"$Desktop\ស្ដេចអាទិទេព PRO STUDIO.lnk\"); " ^
  "$Shortcut.TargetPath = \"$PSScriptRoot\Launch_Pro_Studio.vbs\"; " ^
  "if (-not $Shortcut.TargetPath -or $Shortcut.TargetPath -eq '') { $Shortcut.TargetPath = (Get-Location).Path + '\Launch_Pro_Studio.vbs' }; " ^
  "$Shortcut.WorkingDirectory = (Get-Location).Path; " ^
  "$Icon = (Get-Location).Path + '\app_icon.ico'; " ^
  "if (Test-Path $Icon) { $Shortcut.IconLocation = $Icon }; " ^
  "$Shortcut.Description = 'ស្ដេចអាទិទេព PRO STUDIO — AI Khmer Dubbing App'; " ^
  "$Shortcut.Save(); " ^
  "Write-Host '✅ បានបង្កើត Shortcut លើ Desktop ជោគជ័យ!'"

echo.
pause
