# 🚀 Quick Start Guide - Auto-Update System

## ជាភាសាខ្មែរ (In Khmer)

### តើវាជាអ្វី?
Auto-Update System នេះអនុញ្ញាតឱ្យ app របស់អ្នក update features និង functions ថ្មីៗបានដោយស្វ័យប្រវត្តិ **ដោយមិនចាំបាច់ reinstall EXE file ថ្មី**!

### របៀបប្រើប្រាស់

#### 1. សម្រាប់ Users (អ្នកប្រើប្រាស់)

**ជំហានទី 1:** បើក App ជាធម្មតា
```bash
# Run the app
python desktop_app.py
```
ឬ double-click លើ `ATITEBDABBERPRO.exe`

**ជំហានទី 2:** រង់ចាំ Notification
- App នឹង check for updates ដោយស្វ័យប្រវត្តិពេលបើក
- បើមាន update ថ្មី notification នឹងលេចឡើង

**ជំហានទី 3:** Click "Download & Install"
- Progress bar នឹងបង្ហាញ download និង installation status
- រង់ចាំឱ្យបញ្ចប់ (មិនចាំបាច់ restart app)

**ជំហានទី 4:** ✅ រួចរាល់!
- Features ថ្មីៗអាចប្រើបានភ្លាមៗ
- មិនចាំបាច់ reinstall EXE ថ្មីទេ!

#### 2. សម្រាប់ Developers (អ្នកអភិវឌ្ឍន៍)

**ជំហានទី 1:** Run Tests
```bash
# Test configuration and services
python scripts/test_auto_update.py

# Test hot module reloading
python scripts/test_hot_reload.py

# Test API endpoints (server must be running)
python scripts/test_update_api.py
```

**ជំហានទី 2:** បង្កើត Update ថ្មី

1. Edit `updates/manifest.json`:
```json
{
  "latest_version": "V2.4PRO",
  "changelog": [{
    "version": "V2.4PRO",
    "changes": [
      { "type": "NEW", "text": "Feature ថ្មី..." }
    ],
    "files": [
      {
        "path": "services/my_feature.py",
        "url": "https://your-server.com/updates/my_feature.py",
        "action": "add_or_update"
      }
    ]
  }]
}
```

2. Upload files to server
3. Test update process

**ជំហានទី 3:** Hot Reload Module
```python
from services.module_loader import get_module_loader

loader = get_module_loader()
loader.reload_module('my_module')  # Reload specific module
loader.reload_all()  # Reload all modules
```

---

## In English

### What is it?
The Auto-Update System allows your app to update features and functions automatically **without requiring users to reinstall the EXE file**!

### How to Use

#### 1. For Users

**Step 1:** Open the app normally
```bash
python desktop_app.py
```
Or double-click `ATITEBDABBERPRO.exe`

**Step 2:** Wait for notification
- App will automatically check for updates on startup
- If update available, a notification will appear

**Step 3:** Click "Download & Install"
- Progress bar shows download & installation status
- Wait for completion (no app restart needed)

**Step 4:** ✅ Done!
- New features are immediately available
- No EXE reinstallation required!

#### 2. For Developers

**Step 1:** Run Tests
```bash
# Test configuration and services
python scripts/test_auto_update.py

# Test hot module reloading
python scripts/test_hot_reload.py

# Test API endpoints (server must be running)
python scripts/test_update_api.py
```

**Step 2:** Create a New Update

1. Edit `updates/manifest.json`
2. Upload files to your update server
3. Users will receive update notification automatically

**Step 3:** Hot Reload Modules
```python
from services.module_loader import get_module_loader

loader = get_module_loader()
loader.reload_module('my_module')
```

---

## 🔧 Configuration

### Update Frequency
Edit `update_config.json`:
```json
{
  "check_interval_seconds": 3600,  // Check every hour
  "auto_check_enabled": true,      // Auto-check on startup
  "auto_download_enabled": true,   // Auto-download updates
  "auto_install_enabled": false    // Manual install (user confirmation)
}
```

### Update Server
Change update server URL in `update_config.json`:
```json
{
  "update_server": "https://your-server.com/updates",
  "update_manifest_url": "https://your-server.com/updates/manifest.json"
}
```

---

## 🐛 Troubleshooting

### Problem: No update notification appears
**Solution:**
- Check internet connection
- Verify `update_manifest_url` in `update_config.json`
- Check browser console for errors

### Problem: Update download fails
**Solution:**
- Check internet connection
- Verify file URLs in manifest.json
- Check disk space

### Problem: Need to rollback
**Solution:**
```javascript
// In browser console
updateManager.rollbackUpdate()
```
Or use API:
```bash
curl -X POST http://localhost:3000/api/update/rollback
```

---

## 📁 Important Files

```
├── services/
│   ├── update_manager.py       # Core update logic
│   └── module_loader.py        # Hot module reloading
├── public/
│   ├── css/update-notification.css  # UI styles
│   └── js/update-manager.js         # Client-side logic
├── updates/
│   └── manifest.json           # Update manifest
├── update_config.json          # Configuration
├── app_version.json            # Version tracking
└── AUTO_UPDATE_README.md       # Full documentation
```

---

## 📞 Support

បើមានបញ្ហា ឬចង់សួរ សូមអាន:
- `AUTO_UPDATE_README.md` - Full documentation
- `scripts/test_*.py` - Test scripts with examples

---

**ចំណាំ:** System នេះធ្វើការ update **ដោយមិនចាំបាច់ restart app**! 🎉
