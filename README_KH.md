# 🐉 Dragon Dabber Pro - AI Khmer Dubbing Studio

## 📝 ពិពណ៌នា

Dragon Dabber Pro គឺជា AI-powered professional dubbing studio សម្រាប់ភាសាខ្មែរ។

### 🎯 មុខងារសំខាន់

- ✅ **Voice Cloning** - Clone សំឡេងខ្មែរដោយប្រើ AI
- ✅ **Video Dubbing** - Dub វីដេអូដោយស្វ័យប្រវត្តិ
- ✅ **Subtitle Translation** - បកប្រែ និង timing subtitles
- ✅ **Character Management** - គ្រប់គ្រងតួអង្គនិងសំឡេង
- ✅ **Batch Processing** - ដំណើរការជាច្រើនឯកសារ
- ✅ **Audio Separation** - បំបែកសំឡេង vocal/instrumental
- ✅ **Video Editing** - កាត់, merge, render វីដេអូ

---

## 🚀 របៀបដំឡើង

### តម្រូវការ

- **Python 3.10+** - [ទាញយកនៅទីនេះ](https://www.python.org/downloads/)
- **Node.js 18+** - [ទាញយកនៅទីនេះ](https://nodejs.org/)
- **FFmpeg** - រួមបញ្ចូលរួចក្នុង `bin/` folder

### ជំហានដំឡើង

1. **ដំឡើង Python & Node.js** (ប្រសិនមិនទាន់មាន)

2. **Run Setup Script:**
   ```bash
   SETUP.bat
   ```
   នេះនឹង:
   - បង្កើត Python virtual environment
   - ដំឡើង Python dependencies
   - ដំឡើង Node.js dependencies
   - Build frontend assets

3. **ដំណើរការ Application:**
   ```bash
   START_TOOL.bat
   ```

4. **បើក Browser ទៅកាន់:**
   ```
   http://localhost:3000
   ```

---

## 📦 ទំហំគម្រោង

| ប្រភេទ | ទំហំ |
|---------|------|
| Source Code | ~10 MB |
| FFmpeg Binary | 84 MB |
| Frontend Assets | 14 MB |
| **សរុប (មិនរួម dependencies)** | **~103 MB** |

**Dependencies (នឹងបង្កើតដោយ SETUP.bat):**
- Python packages: ~980 MB
- Node modules: ~120 MB

---

## 🛠️ Commands

### Development
```bash
# Start server (Python)
npm run start

# Development mode
npm run dev

# Build frontend
npm run build
```

### Build Standalone EXE
```bash
# Build desktop executable
.\build_now.bat
```

---

## 📁 រចនាសម្ព័ន្ធគម្រោង

```
VOXCPM2KHMER/
├── bin/              # FFmpeg binaries
├── data/             # Database & config files
├── public/           # Frontend static assets
├── src/              # React/TypeScript source code
├── services/         # Backend service modules
├── scripts/          # Build scripts
├── uploads/          # User uploads (runtime)
├── outputs/          # Rendering outputs (runtime)
├── patches/          # Hot-fix modules
├── server.py         # FastAPI backend server
├── desktop_app.py    # Desktop app entry point
├── requirements.txt  # Python dependencies
├── package.json      # Node.js dependencies
├── SETUP.bat         # Setup script
└── START_TOOL.bat    # Launch script
```

---

## ⚙️ Configuration

ផ្លាស់ប្តូរការកំណត់ក្នុង `.env` file:

```env
# AI Provider
VOXCPM_MODE=local
VOXCPM_URL=http://localhost:8000

# ElevenLabs (optional)
ELEVENLABS_API_KEY=your_key_here

# Google AI (optional)
GOOGLE_AI_KEY=your_key_here
```

---

## 🔧 Troubleshooting

### Server មិនដំណើរការ
```bash
# ពិនិត្យ Python dependencies
.\.venv\Scripts\python.exe -m pip list

# Install again
.\.venv\Scripts\pip.exe install -r requirements.txt
```

### Frontend មិនបង្ហាញ
```bash
# Rebuild frontend
npm run build
```

### FFmpeg Error
- ប្រាកដថា `bin/ffmpeg.exe` មានក្នុង folder
- ទាញយក FFmpeg នៅ: https://ffmpeg.org/download.html

---

## 📞 Support

ប្រសិនមានបញ្ហា សូមពិនិត្យមើល:
- Python version: `python --version` (ត្រូវការ 3.10+)
- Node version: `node --version` (ត្រូវការ 18+)
- Logs: `server_run.log`, `server_err.log`

---

## 📄 License

រក្សាសិទ្ធិ © 2024 Dragon Dabber Pro Team

---

✨ **សូមរីករាយក្នុងការប្រើប្រាស់!** 🐉
