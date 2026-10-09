# Build Both Desktop Applications
# CheatDabberTool.exe + LicenseKeyGenerator.exe

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DABBER PRO - Build Both Applications" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Building:" -ForegroundColor Yellow
Write-Host "  1. CheatDabberTool.exe (Main Application)" -ForegroundColor White
Write-Host "  2. LicenseKeyGenerator.exe (Enhanced GUI Admin Tool)`n" -ForegroundColor White

# Check virtual environment
if (-not (Test-Path ".venv\Scripts\activate.ps1")) {
    Write-Host "ERROR: Virtual environment not found!" -ForegroundColor Red
    Write-Host "Please run: python -m venv .venv" -ForegroundColor Yellow
    exit 1
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& ".venv\Scripts\Activate.ps1"

# Check PyInstaller
Write-Host "Checking PyInstaller..." -ForegroundColor Cyan
python -c "import PyInstaller" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing PyInstaller..." -ForegroundColor Yellow
    pip install pyinstaller
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install PyInstaller" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  [1/2] Building CheatDabberTool.exe" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Build Frontend
Write-Host "[Step 1/3] Building React Frontend..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "Frontend built successfully!`n" -ForegroundColor Green

# Clean previous build
Write-Host "[Step 2/3] Cleaning previous build..." -ForegroundColor Cyan
if (Test-Path "dist\CheatDabberTool.exe") {
    Remove-Item "dist\CheatDabberTool.exe" -Force
}
if (Test-Path "build") {
    Remove-Item "build" -Recurse -Force
}
Write-Host "Cleaned!`n" -ForegroundColor Green

# Build Main EXE
Write-Host "[Step 3/3] Building CheatDabberTool.exe..." -ForegroundColor Cyan
Write-Host "This may take 5-10 minutes...`n" -ForegroundColor Yellow
pyinstaller animeclone.spec --noconfirm --clean

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Main app build failed" -ForegroundColor Red
    exit 1
}

if (Test-Path "dist\CheatDabberTool.exe") {
    $size1 = (Get-Item "dist\CheatDabberTool.exe").Length / 1MB
    Write-Host "`nCheatDabberTool.exe built successfully!" -ForegroundColor Green
    Write-Host "  Size: $([math]::Round($size1, 2)) MB" -ForegroundColor White
    Write-Host "  Location: dist\CheatDabberTool.exe`n" -ForegroundColor White
} else {
    Write-Host "ERROR: CheatDabberTool.exe not found" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  [2/2] Building LicenseKeyGenerator.exe" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Clean previous build
if (Test-Path "dist\LicenseKeyGenerator.exe") {
    Remove-Item "dist\LicenseKeyGenerator.exe" -Force
}
if (Test-Path "build") {
    Remove-Item "build" -Recurse -Force
}

# Build License Generator GUI
Write-Host "Building LicenseKeyGenerator.exe with animated GUI..." -ForegroundColor Cyan
pyinstaller build_license_generator_gui.spec --noconfirm --clean

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: License generator build failed" -ForegroundColor Red
    exit 1
}

if (Test-Path "dist\LicenseKeyGenerator.exe") {
    $size2 = (Get-Item "dist\LicenseKeyGenerator.exe").Length / 1MB
    Write-Host "`nLicenseKeyGenerator.exe built successfully!" -ForegroundColor Green
    Write-Host "  Size: $([math]::Round($size2, 2)) MB" -ForegroundColor White
    Write-Host "  Location: dist\LicenseKeyGenerator.exe" -ForegroundColor White
    Write-Host "  Features: Animated GUI, Tabs, Statistics Dashboard`n" -ForegroundColor Cyan
} else {
    Write-Host "ERROR: LicenseKeyGenerator.exe not found" -ForegroundColor Red
    exit 1
}

# Success Summary
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  BUILD COMPLETE! Both EXE files ready" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Built Files:`n" -ForegroundColor Yellow
Write-Host "  1. CheatDabberTool.exe" -ForegroundColor White
Write-Host "     - Main application for end users" -ForegroundColor Gray
Write-Host "     - AI Dubbing Studio with license activation" -ForegroundColor Gray
Write-Host "     - Size: $([math]::Round($size1, 2)) MB`n" -ForegroundColor Gray

Write-Host "  2. LicenseKeyGenerator.exe" -ForegroundColor White
Write-Host "     - Enhanced GUI admin tool" -ForegroundColor Gray
Write-Host "     - Animated interface with tabs" -ForegroundColor Gray
Write-Host "     - Generate, manage, and track licenses" -ForegroundColor Gray
Write-Host "     - Size: $([math]::Round($size2, 2)) MB`n" -ForegroundColor Gray

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  - Test CheatDabberTool.exe (end user app)" -ForegroundColor White
Write-Host "  - Test LicenseKeyGenerator.exe (GUI admin tool)" -ForegroundColor White
Write-Host "  - Distribute CheatDabberTool.exe to customers" -ForegroundColor White
Write-Host "  - Keep LicenseKeyGenerator.exe for admin only`n" -ForegroundColor White

Write-Host "Admin Tool Features:" -ForegroundColor Yellow
Write-Host "  - Generate Keys Tab: Create new license keys" -ForegroundColor White
Write-Host "  - Manage Keys Tab: View and search all keys" -ForegroundColor White
Write-Host "  - Activations Tab: View and deactivate machines" -ForegroundColor White
Write-Host "  - Statistics Tab: Dashboard with key metrics`n" -ForegroundColor White

Write-Host "========================================`n" -ForegroundColor Green

# Create summary
$summary = @"
# Build Complete - $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Built Applications

### 1. CheatDabberTool.exe
- **Size**: $([math]::Round($size1, 2)) MB
- **Purpose**: Main AI Dubbing Studio for end users
- **Features**: License activation, VoxCPM2, Pure Khmer, ElevenLabs

### 2. LicenseKeyGenerator.exe
- **Size**: $([math]::Round($size2, 2)) MB
- **Purpose**: Admin tool for license management
- **Interface**: Enhanced GUI with animations
- **Features**:
  - Generate license keys with custom validity
  - Manage and search all license keys
  - View and deactivate machine activations
  - Statistics dashboard

## Distribution

### For End Users
``````
dist\CheatDabberTool.exe
``````

### For Administrators
``````
dist\LicenseKeyGenerator.exe
``````

## Build Environment
- Build Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
- Python: $(python --version)
- Node: $(npm --version)
- PyInstaller: Installed
"@

$summary | Out-File "ENHANCED_BUILD_SUMMARY.md" -Encoding UTF8
Write-Host "Build summary saved to ENHANCED_BUILD_SUMMARY.md" -ForegroundColor Green
Write-Host ""
