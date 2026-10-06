# 🐉 Tool AI Speak Khmer - Dragon Dabber Pro

**AI-Powered Professional Khmer Dubbing Studio & Voice Cloning Platform**

![Version](https://img.shields.io/badge/version-3.0.0-blue)
![Python](https://img.shields.io/badge/python-3.10+-green)
![Node.js](https://img.shields.io/badge/node-18+-green)
![License](https://img.shields.io/badge/license-Proprietary-red)

---

## 📝 Overview

Dragon Dabber Pro is a professional-grade AI dubbing studio specifically designed for Khmer language content creation. This tool combines cutting-edge AI voice cloning, video dubbing automation, and audio processing capabilities into one powerful desktop application.

### ✨ Key Features

- 🎙️ **AI Voice Cloning** - Clone and synthesize Khmer voices with natural intonation
- 🎬 **Automated Video Dubbing** - Full pipeline from subtitle translation to final render
- 🗣️ **Multi-Character Management** - Organize and manage voice profiles for multiple characters
- 📝 **Subtitle Translation & Timing** - AI-powered translation with automatic timing adjustment
- 🎵 **Audio Separation** - Separate vocals from background music using Demucs
- ⚡ **Batch Processing** - Process multiple videos efficiently
- 🎨 **Video Editing Tools** - Cut, merge, and render videos with custom settings
- 🌐 **Web-Based UI** - Modern React interface with real-time progress tracking

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+** - [Download here](https://www.python.org/downloads/)
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/downloads)
- **Windows 7/8/10/11** (64-bit)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/cm5722254-beep/Tool_ai_speak_khmer.git
   cd Tool_ai_speak_khmer
   ```

2. **Run setup script:**
   ```bash
   SETUP.bat
   ```
   This will:
   - Create Python virtual environment
   - Install all Python dependencies
   - Install Node.js dependencies
   - Build frontend assets

3. **Start the application:**
   ```bash
   START_TOOL.bat
   ```

4. **Open your browser:**
   ```
   http://localhost:3000
   ```

---

## 📦 Project Size

| Component | Size |
|-----------|------|
| Source Code | ~10 MB |
| FFmpeg Binary | 84 MB |
| Frontend Assets | 14 MB |
| **Total (without dependencies)** | **~103 MB** |

**Dependencies** (installed via SETUP.bat):
- Python packages: ~980 MB
- Node.js modules: ~120 MB

---

## 🛠️ Usage

### Development Mode
```bash
# Start development server
npm run dev

# Build frontend
npm run build

# Start Python server
npm run start
```

### Build Standalone Executable
```bash
# Create Windows executable (no Python/Node needed to run)
.\build_now.bat
```

This generates `Dragon_Dabber_Pro.exe` - a standalone application that works on any Windows machine without requiring Python or Node.js installation.

---

## 📁 Project Structure

```
Tool_ai_speak_khmer/
├── bin/                # FFmpeg binaries
├── data/               # Database & configuration files
├── public/             # Frontend static assets
├── src/                # React/TypeScript source code
├── services/           # Backend service modules
│   ├── audio_processor.py
│   ├── khmer_dubber.py
│   ├── ai_pipeline/
│   └── ...
├── scripts/            # Build and utility scripts
├── uploads/            # User uploads (runtime)
├── outputs/            # Rendered outputs (runtime)
├── patches/            # Hot-fix modules
├── server.py           # FastAPI backend server
├── desktop_app.py      # Desktop app entry point
├── requirements.txt    # Python dependencies
├── package.json        # Node.js dependencies
├── SETUP.bat           # Installation script
├── START_TOOL.bat      # Launch script
└── README.md           # This file
```

---

## ⚙️ Configuration

Create a `.env` file in the root directory:

```env
# VoxCPM Mode (local/colab/api)
VOXCPM_MODE=local
VOXCPM_URL=http://localhost:8000

# Optional: ElevenLabs API
ELEVENLABS_API_KEY=your_key_here

# Optional: Google AI
GOOGLE_AI_KEY=your_key_here

# Server Settings
HOST=0.0.0.0
PORT=3000
```

---

## 🎯 Workflow Example

1. **Upload Video** - Upload your video file or YouTube URL
2. **Extract Audio** - Automatically extract audio track
3. **Generate Subtitles** - AI-powered subtitle generation
4. **Translate** - Translate subtitles to Khmer (optional)
5. **Assign Voices** - Match characters to voice profiles
6. **Generate Dubbing** - AI generates Khmer voice for each line
7. **Review & Edit** - Fine-tune timing and pronunciation
8. **Render Video** - Export final dubbed video

---

## 🔧 Troubleshooting

### Server won't start
```bash
# Check Python installation
python --version

# Reinstall dependencies
.\.venv\Scripts\pip.exe install -r requirements.txt
```

### Frontend not loading
```bash
# Rebuild frontend
npm run build
```

### FFmpeg errors
- Ensure `bin/ffmpeg.exe` exists
- Download FFmpeg: https://ffmpeg.org/download.html

### Voice cloning not working
- Check VoxCPM server is running
- Verify `.env` configuration
- Check `VOXCPM_MODE` setting

---

## 🌟 Advanced Features

### Custom Voice Models
Add custom voice models in `data/checkpoints/` folder.

### Batch Processing
Process multiple videos using the batch interface.

### API Access
The tool exposes a REST API at `http://localhost:3000/api/`

### Plugin System
Add custom modules in `patches/` folder for hot-fixes and extensions.

---

## 📊 System Requirements

### Minimum
- Windows 7 64-bit
- 4 GB RAM
- 2 GB free disk space
- Intel Core i3 or equivalent

### Recommended
- Windows 10/11 64-bit
- 16 GB RAM
- 10 GB free disk space
- Intel Core i7 or AMD Ryzen 7
- NVIDIA GPU with 4GB VRAM (for faster processing)

---

## 🤝 Contributing

This is a proprietary tool. For collaboration inquiries, please contact the development team.

---

## 📄 License

Copyright © 2024 Dragon Dabber Pro Team. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

## 📞 Support

For technical support or inquiries:
- Check logs: `server_run.log`, `server_err.log`
- Verify Python: `python --version` (requires 3.10+)
- Verify Node.js: `node --version` (requires 18+)

---

## 🔮 Roadmap

- [ ] Real-time voice synthesis
- [ ] Mobile app support
- [ ] Cloud rendering
- [ ] Multi-language support beyond Khmer
- [ ] Advanced emotion detection
- [ ] Voice style transfer

---

**Made with ❤️ for the Khmer content creation community** 🇰🇭

🐉 **Dragon Dabber Pro** - Empowering Khmer Dubbing with AI
