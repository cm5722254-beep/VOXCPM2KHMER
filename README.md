# 🎬 Cheatz Dabber PRO v3 — AI Khmer Voice Cloning & Dubbing Studio
### ប្រព័ន្ធស្ទូឌីយោបញ្ជូលសំឡេង និងក្លូនសំឡេងតួអង្គភាពយន្ត AI មកជាភាសាខ្មែរស្វ័យប្រវត្តិកម្រិតខ្ពស់

> **Zero-Shot AI Multi-Character Voice Cloning & Dubbing Studio** — គាំទ្រទាំង **Windows 10/11** (NVIDIA GPU / CPU) និង **macOS** (Apple Silicon M1/M2/M3/M4 & Intel)។

---

## 📑 មាតិកា (Table of Contents)
- [✨ លក្ខណៈពិសេសចម្បង (Core Features)](#-លក្ខណៈពិសេសចម្បង-core-features)
- [📂 រចនាសម្ព័ន្ធ Folder (Project Structure)](#-រចនាសម្ព័ន្ធ-folder-project-structure)
- [🚀 របៀបទាញយក និងដំឡើង (Clone & Setup)](#-របៀបទាញយក-និងដំឡើង-clone--setup)
- [💻 របៀបបើកដំណើរការលើ Windows](#-របៀបបើកដំណើរការលើ-windows)
- [🍏 របៀបបើកដំណើរការលើ macOS](#-របៀបបើកដំណើរការលើ-macos)
- [⚡ របៀបដំណើរការ Local VoxCPM2 Engine](#-របៀបដំណើរការ-local-voxcpm2-engine)
- [🔨 របៀប Build Frontend & Windows EXE](#-របៀប-build-frontend--windows-exe)
- [⚙️ ការកំណត់ API Keys ក្នុង `.env`](#️-ការកំណត់-api-keys-ក្នុង-env)
- [🎬 ដំណើរការ Workflow ទាំង ៥ ជំហាន](#-ដំណើរការ-workflow-ទាំង-៥-ជំហាន)
- [📚 ឯកសារណែនាំលម្អិតបន្ថែម (Documentation)](#-ឯកសារណែនាំលម្អិតបន្ថែម-documentation)

---

## ✨ លក្ខណៈពិសេសចម្បង (Core Features)

1. **🎭 Auto-Diarization & Multi-Character Recognition:**
   - កំណត់អត្តសញ្ញាណតួអង្គក្នុងរឿងដោយស្វ័យប្រវត្តិ (តួឯកប្រុស, តួឯកស្រី, តួកាច, ចាស់ទុំ, មេទ័ព...)
   - បំបែកសំឡេងតួអង្គម្នាក់ៗដាក់លើ Timeline Multi-Track ដាច់ដោយឡែក។
2. **🎙️ Zero-Shot AI Voice Cloning & Khmer Dubbing:**
   - Clone សំឡេងផ្ទាល់ពីរឿងដើម ឬប្រើប្រាស់សំឡេងតួអង្គខ្មែរដែលមានស្រាប់ (Pre-trained Character Casts)។
   - គាំទ្រទាំង **VoxCPM2 Local/Online API** និង **ElevenLabs AI Voice Engine**។
3. **🎵 Vocal Suppression & Full BGM Preservation:**
   - បច្ចេកវិទ្យាលុបសំឡេងនិយាយដើម (Vocal Isolation/Removal) ដោយរក្សាភ្លេងកំដរ (BGM) និង Sound Effects (SFX) ដើម ១០០%។
4. **🧠 Google Gemini Flash Integration:**
   - ស្ដាប់សំឡេងដើម (ZH / EN / TH / JP / KR) ដោយផ្ទាល់ និងបកប្រែមកជាភាសាខ្មែរភាពយន្តបែបបុរាណរស់រវើក ត្រូវកាលៈទេសៈ។
5. **⚡ Hardware Acceleration (GPU Turbo):**
   - គាំទ្រ **NVIDIA NVENC GPU**, **Intel QuickSync (QSV)** និង **Apple Metal MPS** សម្រាប់ Render វីដេអូកម្រិត 4K/1080p ល្បឿនលឿនបំផុត។

---

## 📂 រចនាសម្ព័ន្ធ Folder (Project Structure)

```text
animeclone/
├── data/                  # ទិន្នន័យប្រព័ន្ធ (Database, shelf, project state)
├── docs/                  # ឯកសារណែនាំលម្អិត និងក្បួនប្រើប្រាស់ទាំងអស់ (All Guides)
│   ├── ALL_FUNCTIONS_WORKING.md
│   ├── EMOTIONAL_VOICE_GUIDE.md
│   ├── FEATURE_TEST_CHECKLIST.md
│   ├── របៀបប្រើប្រាស់_SIDEBAR.md
│   └── ...
├── public/                # Static Web Assets (HTML, Icons, Vite Build Output)
├── samples/               # គំរូសំឡេង និងឯកសារសាកល្បង (Audio Samples)
├── scripts/               # ស្គ្រីបជំនួយ Python (Character extraction, 3D audio, etc.)
├── services/              # ស្នូល Backend Services (FastAPI, Dubber, Audio, Auth)
├── src/                   # កូដ Frontend React + TypeScript + TailwindCSS
│   ├── components/        # UI Components (Timeline, Studio, Modals, etc.)
│   ├── services/          # Frontend API Client
│   └── utils/             # Helper Utilities
├── build_exe.bat          # ស្គ្រីប Build Windows Standalone EXE
├── run.bat                # ស្គ្រីបបើកកម្មវិធីលើ Windows (One-Click)
├── START_STUDIO_MAC.command # ស្គ្រីបបើកកម្មវិធីលើ macOS
├── server.py              # Backend FastAPI Application Server
├── requirements.txt       # បញ្ជី Python Dependencies
└── package.json           # បញ្ជី Node.js Dependencies & Scripts
```

---

## 🚀 របៀបទាញយក និងដំឡើង (Clone & Setup)

នៅពេលទាញយក (Clone) ទៅកាន់កុំព្យូទ័រថ្មី គ្រាន់តែអនុវត្តតាមជំហានខាងក្រោម៖

### ១. ទាញយកកូដពី GitHub (Clone Repository):
```bash
git clone https://github.com/mazercheat-dotcom/animeducksystem.git
cd animeducksystem
```

### ២. បង្កើតឯកសារ `.env`:
ចម្លងពី `.env.example` ឬបង្កើតឯកសារថ្មីឈ្មោះ `.env` រួចបំពេញ API Key៖
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
GEMINI_MODEL=gemini-3.5-flash
VOXCPM2_ONLINE_URL=
VOXCPM2_MODE=online
```

---

## 💻 របៀបបើកដំណើរការលើ Windows

### វិធីទី ១ (រហ័សបំផុត - One-Click):
- គ្រាន់តែ **Double-Click** លើឯកសារ `run.bat` ឬ `Launch_Studio_App.vbs`
- កម្មវិធីនឹងរៀបចំ Python Virtualenv ដោយស្វ័យប្រវត្តិ រួចបើក Web Browser ទៅកាន់ `http://localhost:3000`

### វិធីទី ២ (តាមរយៈ Command Line):
```powershell
# ១. បង្កើត Virtualenv និងដំឡើង Dependencies
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

# ២. បើក Server
python server.py
```
បើក Browser របស់អ្នកចូលទៅកាន់ `http://localhost:3000`។

---

## 🍏 របៀបបើកដំណើរការលើ macOS

### ជំហានទី ១ (ដំឡើងលើកដំបូងតែម្ដងគត់):
បើក Terminal ក្នុង Folder នេះ រួចវាយ៖
```bash
chmod +x install_mac.sh START_STUDIO_MAC.command START_LOCAL_VOXCPM_MAC.command
bash install_mac.sh
```

### ជំហានទី ២ (បើកដំណើរការជាប្រចាំ):
- គ្រាន់តែ **Double-Click** លើឯកសារ `START_STUDIO_MAC.command` ក្នុង Finder!
- វានឹងដំណើរការស្ទូឌីយោ និងបើក Browser ទៅកាន់ `http://localhost:3000` ភ្លាមៗ។

---

## ⚡ របៀបដំណើរការ Local VoxCPM2 Engine

ប្រសិនបើលោកអ្នកចង់ Clone សំឡេងដោយប្រើ GPU/CPU ក្នុងម៉ាស៊ីនផ្ទាល់ដោយមិនបាច់ប្រើ Internet៖
- **លើ Windows (GPU/CPU):** Double-Click `START_LOCAL_VOXCPM.bat`
- **លើ Windows (CPU Only):** Double-Click `START_LOCAL_VOXCPM_CPU.bat`
- **លើ macOS (Metal/MPS):** Double-Click `START_LOCAL_VOXCPM_MAC.command`
- Local Engine នឹងដំណើរការលើ `http://localhost:8000`។

---

## 🔨 របៀប Build Frontend & Windows EXE

### ១. Build React Frontend (Vite):
```bash
npm run build
```
*(Files ទាំងអស់នឹងត្រូវដាក់បញ្ចូលទៅក្នុង `public/assets/` ដោយស្វ័យប្រវត្តិ)*

### ២. Build Windows Standalone EXE:
```cmd
build_exe.bat
```
*(Output EXE នឹងស្ថិតនៅ `dist/CheatZDabberPro/CheatZDabberPro.exe` អាចយកទៅប្រើលើម៉ាស៊ីនណាផ្សេងក៏បានដោយមិនបាច់ដំឡើង Python ឬ Node.js ឡើយ)*

---

## 🎬 ដំណើរការ Workflow ទាំង ៥ ជំហាន

1. **ជំហានទី ១ (Upload):** ទម្លាក់វីដេអូរឿង ឬ Donghua (MP4, MKV, MOV...)
2. **ជំហានទី ២ (Language & Settings):** ជ្រើសរើសភាសាដើម និងមុខងារលុបសំឡេង
3. **ជំហានទី ៣ (Diarization & Translation):** ប្រព័ន្ធ AI នឹងស្តាប់ សម្គាល់តួអង្គ និងបកប្រែជាភាសាខ្មែរ
4. **ជំហានទី ៤ (Voice Casting):** ជ្រើសរើសសំឡេងតួអង្គនីមួយៗ (Clone សំឡេងដើម ឬសំឡេង Pre-made)
5. **ជំហានទី ៥ (Render & Export):** នាំចេញវីដេអូដែលបានបញ្ចូលសំឡេងខ្មែររួចរាល់ កម្រិតច្បាស់ 1080p/4K

---

## 📚 ឯកសារណែនាំលម្អិតបន្ថែម (Documentation)

លោកអ្នកអាចចូលមើលឯកសារបច្ចេកទេស និងក្បួនណែនាំបន្ថែមក្នុង Folder [docs/](docs/)៖
- 📘 [WORKFLOW_STATUS.md](docs/WORKFLOW_STATUS.md) — ស្ថានភាព និងរចនាសម្ព័ន្ធដំណើរការ Workflow
- 🎙️ [EMOTIONAL_VOICE_GUIDE.md](docs/EMOTIONAL_VOICE_GUIDE.md) — របៀបប្រើប្រាស់សំឡេងតាមអារម្មណ៍តួអង្គ
- 🎛️ [KHMER_SIDEBAR_GUIDE.md](docs/KHMER_SIDEBAR_GUIDE.md) — មុខងារ និងការបញ្ជាលើ Sidebar
- 📑 [KHMER_ALL_FEATURES_GUIDE.md](docs/KHMER_ALL_FEATURES_GUIDE.md) — សៀវភៅណែនាំមុខងារសរុបទាំងអស់
- ✅ [FEATURE_TEST_CHECKLIST.md](docs/FEATURE_TEST_CHECKLIST.md) — បញ្ជីត្រួតពិនិត្យមុខងារទាំងអស់

---

**CheatZ Dabber Studio** — រក្សាសិទ្ធិគ្រប់យ៉ាង © 2026
