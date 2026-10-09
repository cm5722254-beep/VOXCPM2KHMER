# Changelog — Dubber Dang Pro (KH Dabber)

All notable changes to this project are documented here.

---

## [3.1.0] — 2026-10-09 · CapCut Edition

### Added
- `CapCutDubbingLayout.tsx` — Full CapCut-style dubbing studio layout
  - Dubber Dang Pro top bar with branding, nav tabs, token counter
  - Far-left icon rail (Dashboard / Media / Voice / Audio / Text / Effects)
  - Video preview panel with mini toolbar and seek/playback controls
  - Dialogue table: Start | End | Dub Text | Voice Profile | Audio per-line
  - RECAP right panel with AI generation (Short/Medium/Long)
  - Bottom timeline: Video + Audio tracks, red playhead, zoom 0.2x–4x
- `generate_license.py` — Admin CLI to generate license keys
- `license_key_generator_gui.py` — GUI license key generator
- `license_key_generator_gui_enhanced.py` — Enhanced GUI (batch mode)
- `MachineActivationModal.tsx` — Machine ID activation UI
- `services/license_manager.py` — License validation service
- Somleng custom voice samples: vid6–vid23.mp3
- `RUN_APP_ENHANCED.bat` — One-click launch script

### Changed
- `main.tsx` — Fixed to import full production `App` (was pointing to prototype)
- `App.tsx` — `tab-dubbing` now renders `CapCutDubbingLayout` instead of `EnhancedDubbingStudio`
- `app_version.json` — Bumped to 3.1.0
- `update_config.json` — Updated to v3.1 stable channel

### Fixed
- Frontend build now correctly serves the production app at port 3000
- `.gitignore` updated to exclude `data/*.db` and `data/activation.json`

---

## [3.0.0] — 2026-10-08 · Enhanced Studio

### Added
- `EnhancedDubbingStudio.tsx` — 3-panel layout (video / dialogue / timeline)
- `DialogueManagerPanel.tsx` — Professional dialogue table view
- `ProfessionalTimeline.tsx` — Color-coded multi-track timeline
- `DragonHardwareReport.tsx` — GPU/CPU hardware detection report
- `OneClickDragonDubbingModal.tsx` — 1-Click 7-step auto-dubbing
- `BatchDubbingStudio.tsx` — Batch episode processing
- Machine activation / license gate system
- Desktop app (`desktop_app.py`) with pywebview window

### Changed
- Complete UI rebrand to Dragon Dabber Pro dark theme
- Backend migrated to FastAPI + Uvicorn
- GPU acceleration support (CUDA / ROCm / CPU fallback)

---

## [2.1.0] — 2026-10-06 · Dragon Rebrand

### Added
- Dragon Dabber Pro branding and crimson/midnight themes
- `DragonVoiceLab.tsx` — Advanced voice cloning studio
- `NarratorStudio.tsx` — AI narrator with Khmer TTS
- `PosterForgeStudio.tsx` — Cinematic poster generator
- `VideoEffectsPanel.tsx` — 3D effects, color grading, overlays
- `AudioMixerConsole.tsx` — Professional audio mixing
- Open Tool mode (`openTool.py`) with AMD GPU support

### Changed
- Migrated from Supabase to local SQLite database
- Edge TTS upgraded to v7.2.8

---

## [1.0.0] — 2026-10-03 · Initial Release

### Added
- Khmer AI dubbing pipeline (extract → transcribe → translate → TTS → mix)
- React + Vite + TypeScript frontend
- FastAPI Python backend
- Edge TTS Khmer voice support
- Demucs vocal separation
- Gemini AI translation integration
- S3/CDN presigned URL support
- Docker + Render deployment configs
