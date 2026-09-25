$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [System.Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $Desktop "PRO_STUDIO_APP.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "d:\Voxcpm2khmer\Launch_Pro_Studio.vbs"
$Shortcut.WorkingDirectory = "d:\Voxcpm2khmer"
$Icon = "d:\Voxcpm2khmer\app_icon.ico"
if (Test-Path $Icon) {
    $Shortcut.IconLocation = $Icon
}
$Shortcut.Description = "PRO STUDIO AI Khmer Dubbing App"
$Shortcut.Save()
Write-Host "SUCCESS: Shortcut created at: $ShortcutPath"
