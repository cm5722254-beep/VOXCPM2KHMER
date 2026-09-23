# 🔄 Auto-Update System Documentation

## ទិដ្ឋភាពទូទៅ (Overview)

Auto-Update System នេះអនុញ្ញាតឱ្យ app អាច update features និង functions ថ្មីៗបានដោយស្វ័យប្រវត្តិ **ដោយមិនចាំបាច់ reinstall EXE file ថ្មី**។ System នេះប្រើ:

- 🔄 **Hot Module Reloading** - Load Python modules ថ្មីដោយមិនចាំបាច់ restart app
- 📦 **Incremental Updates** - Download តែ files ដែលប្រែប្រួលប៉ុណ្ណោះ
- 💾 **Automatic Backups** - បង្កើត backup ស្វ័យប្រវត្តិមុនពេល update
- ⏮️ **Easy Rollback** - Rollback ទៅ version មុនបានយ៉ាងងាយស្រួល
- 🎨 **Beautiful UI** - Notification UI ស្អាតៗសម្រាប់ user experience

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Desktop App (desktop_app.py)            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  UpdateManager Service                                │  │
│  │  - Auto-check for updates every 1 hour              │  │
│  │  - Download & install updates                        │  │
│  │  - Create backups before updating                    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ModuleLoader Service                                 │  │
│  │  - Hot-swap Python modules at runtime               │  │
│  │  - Priority-based module search (patches > services) │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↕️
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Server (server.py)               │
│  API Endpoints:                                             │
│  - POST /api/update/check        - Check for updates       │
│  - POST /api/update/download     - Download updates        │
│  - POST /api/update/install      - Install updates         │
│  - POST /api/update/rollback     - Rollback to backup      │
│  - GET  /api/update/backups      - List backups            │
│  - POST /api/modules/reload      - Reload specific module  │
│  - POST /api/modules/reload-all  - Reload all modules      │
└─────────────────────────────────────────────────────────────┘
                           ↕️
┌─────────────────────────────────────────────────────────────┐
│              Web UI (update-manager.js + CSS)               │
│  - Auto-check for updates on page load                     │
│  - Beautiful notification popups                            │
│  - Download & installation progress tracking               │
│  - Rollback interface                                       │
└─────────────────────────────────────────────────────────────┘
                           ↕️
┌─────────────────────────────────────────────────────────────┐
│              Update Server (GitHub/Cloud)                   │
│  - manifest.json - Version info & changelog                │
│  - Update files (*.py, CSS, JS, etc.)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
Voxcpm2khmer/
├── services/
│   ├── update_manager.py        # Core update management
│   └── module_loader.py         # Hot module reloading
├── updates/
│   ├── manifest.json            # Update manifest (local copy)
│   └── [downloaded files]       # Temporary downloaded files
├── backups/
│   └── backup_YYYYMMDD_HHMMSS/  # Automatic backups
├── patches/                     # Hot-swappable modules (highest priority)
├── public/
│   ├── css/
│   │   └── update-notification.css  # UI styles
│   ├── js/
│   │   └── update-manager.js        # Client-side update logic
│   └── index.html               # Main HTML (includes update UI)
├── update_config.json           # Update configuration
├── app_version.json             # Current version info
├── desktop_app.py               # Entry point (initializes UpdateManager)
├── server.py                    # FastAPI server (Update API endpoints)
└── scripts/
    └── test_auto_update.py      # Test script
```

---

## ⚙️ Configuration

### `update_config.json`

```json
{
  "update_server": "https://raw.githubusercontent.com/YOUR_REPO/main/updates",
  "update_manifest_url": "https://raw.githubusercontent.com/YOUR_REPO/main/updates/manifest.json",
  "check_interval_seconds": 3600,        // Check every hour
  "auto_check_enabled": true,            // Auto-check on startup
  "auto_download_enabled": true,         // Auto-download when update available
  "auto_install_enabled": false,         // Manual install (requires user confirmation)
  "allow_beta_updates": false,
  "modules_updatable": [
    "services/*.py",
    "patches/*.py",
    "static/**/*",
    "templates/**/*"
  ],
  "modules_protected": [
    "desktop_app.py",
    "server.py"
  ]
}
```

### `app_version.json`

```json
{
  "current_version": "V2.2PRO",
  "latest_version": "V2.3PRO",
  "has_update": true,
  "release_date": "2026-09-22",
  "manifest": { ... }
}
```

---

## 🚀 How It Works

### 1. **Startup Flow**

```
Desktop App Starts
    ↓
Initialize UpdateManager
    ↓
Start Auto-Check Thread (runs every 1 hour)
    ↓
Wait 5 seconds
    ↓
Perform Initial Update Check
    ↓
If update available → Show notification
```

### 2. **Update Flow**

```
User Clicks "Download & Install"
    ↓
1. Download update files from server
   ├─ Show progress: 0% → 50%
   └─ Save to updates/ directory
    ↓
2. Create backup of current files
   └─ Save to backups/backup_YYYYMMDD_HHMMSS/
    ↓
3. Install files
   ├─ Copy from updates/ to target locations
   ├─ Show progress: 50% → 100%
   └─ Update app_version.json
    ↓
4. Hot-reload modules
   └─ Call /api/modules/reload-all
    ↓
✅ Update complete! New features available
```

### 3. **Rollback Flow**

```
User Clicks "Rollback"
    ↓
Confirm action
    ↓
Find latest backup
    ↓
Restore all files from backup
    ↓
Hot-reload modules
    ↓
✅ Rollback complete!
```

---

## 🔧 Usage

### For End Users

1. **Check for Updates Manually:**
   - Open app
   - Wait for notification (auto-check runs in background)
   - Or click "Check for Updates" button (if implemented in UI)

2. **Install Update:**
   - Click "Download & Install" button in notification
   - Wait for download & installation (progress shown)
   - ✅ Done! New features available immediately

3. **Rollback (if needed):**
   - If something goes wrong after update
   - Click "Rollback" button
   - Confirm action
   - ✅ Previous version restored

### For Developers

#### 1. **Testing the System**

```bash
# Run test script
python scripts/test_auto_update.py
```

#### 2. **Creating a New Update**

1. **Update the manifest** (`updates/manifest.json`):

```json
{
  "latest_version": "V2.3PRO",
  "changelog": [
    {
      "version": "V2.3PRO",
      "date": "2026-09-22",
      "changes": [
        { "type": "NEW", "text": "New feature added" },
        { "type": "IMPROVED", "text": "Performance improvements" },
        { "type": "FIXED", "text": "Bug fixes" }
      ],
      "files": [
        {
          "path": "services/my_new_feature.py",
          "url": "https://raw.githubusercontent.com/.../my_new_feature.py",
          "action": "add_or_update"
        }
      ]
    }
  ]
}
```

2. **Upload files to server:**
   - Upload manifest.json to update server
   - Upload all update files to their respective URLs

3. **Test the update:**
   - Open app
   - Wait for update notification
   - Install update
   - Verify new features work

#### 3. **Hot Module Reloading (for immediate updates)**

```python
# In your Python code
from services.module_loader import get_module_loader

# Reload a specific module
loader = get_module_loader()
my_module = loader.reload_module('my_module_name')

# Or reload all modules
loader.reload_all()
```

#### 4. **Manual Rollback via API**

```javascript
// JavaScript
fetch('/api/update/rollback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
}).then(res => res.json())
  .then(data => console.log('Rollback result:', data));
```

```python
# Python
import requests
response = requests.post('http://localhost:3000/api/update/rollback')
print(response.json())
```

---

## 🎨 UI Components

### Update Notification

- **Types:**
  - `info` - Update available (purple gradient)
  - `success` - Update successful (green gradient)
  - `error` - Update failed (red gradient)

- **Features:**
  - Auto-slide in from right
  - Animated progress bar
  - Changelog display with badges (NEW, IMPROVED, FIXED)
  - Action buttons (Download & Install, Dismiss, Rollback)
  - Auto-close after timeout

### Progress Tracking

- Real-time progress updates (0% → 100%)
- Status messages (Downloading... → Installing... → Complete!)
- Animated progress bar with gradient
- Loading spinner

---

## 🔒 Security & Safety

1. **Automatic Backups:**
   - Backup created before every update
   - Stored in `backups/` directory
   - Can be manually restored

2. **Protected Files:**
   - Core files (desktop_app.py, server.py) are protected
   - Only updatable modules can be modified

3. **Rollback Capability:**
   - Easy one-click rollback
   - Multiple backup versions available

4. **Error Handling:**
   - All update operations wrapped in try-catch
   - Graceful error messages
   - Failed updates don't break the app

---

## 📊 API Reference

### POST `/api/update/check`
Check for available updates.

**Response:**
```json
{
  "success": true,
  "result": {
    "status": "update_available",
    "current_version": "V2.2PRO",
    "latest_version": "V2.3PRO",
    "manifest": { ... }
  }
}
```

### POST `/api/update/download`
Download available updates.

**Response:**
```json
{
  "success": true,
  "message": "ទាញយក Update ជោគជ័យ!",
  "result": {
    "status": "success",
    "downloaded_files": ["services/update_manager.py", ...],
    "total_files": 5
  }
}
```

### POST `/api/update/install`
Install downloaded updates.

**Response:**
```json
{
  "success": true,
  "message": "បាន Install Update ជោគជ័យ! Version: V2.3PRO",
  "result": {
    "status": "success",
    "installed_files": [...],
    "version": "V2.3PRO"
  }
}
```

### POST `/api/update/rollback`
Rollback to previous version.

**Body (optional):**
```json
{
  "backup_name": "backup_20260922_150000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "បាន Rollback ជោគជ័យ!",
  "result": {
    "status": "success",
    "restored_files": [...],
    "backup": "backup_20260922_150000"
  }
}
```

### GET `/api/update/backups`
List all available backups.

**Response:**
```json
{
  "success": true,
  "backups": [
    {
      "name": "backup_20260922_150000",
      "date": "2026-09-22 15:00:00",
      "size": 1048576
    }
  ],
  "count": 1
}
```

### POST `/api/modules/reload`
Reload a specific module.

**Body:**
```json
{
  "module_name": "services.my_module"
}
```

### POST `/api/modules/reload-all`
Reload all loaded modules.

---

## 🐛 Troubleshooting

### Update Check Fails
- Check internet connection
- Verify `update_manifest_url` in `update_config.json`
- Check server is accessible

### Download Fails
- Check internet connection
- Verify file URLs in manifest
- Check disk space

### Install Fails
- Check file permissions
- Check disk space
- Review error logs

### Rollback Not Working
- Verify backup exists in `backups/` directory
- Check file permissions

---

## 📝 Notes

- Updates happen **without restarting the app**
- Only updatable files (services, patches, static) can be modified
- Core files (desktop_app.py, server.py) are protected
- Backups are created automatically before each update
- Multiple backups can be kept (old ones can be manually deleted)

---

## 🎉 Benefits

✅ **No EXE Reinstallation** - Users don't need to download new EXE files  
✅ **Instant Updates** - New features available immediately  
✅ **Safe Updates** - Automatic backups + easy rollback  
✅ **Great UX** - Beautiful notifications and progress tracking  
✅ **Developer Friendly** - Easy to create and deploy updates  

---

**Created by:** Kiro AI Assistant  
**Date:** 2026-09-22  
**Version:** 1.0
