"""
====================================================================
🚀 Cheatz Dabber.PRO - Local VoxCPM2 Engine Runner (Windows Native)
💻 Runs 100% locally on your computer (Port 8000)
⚡ Supports NVIDIA CUDA GPU or Multi-Threaded CPU Fallback
====================================================================
"""
import os
import sys
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try: sys.stdout.reconfigure(encoding='utf-8')
    except Exception: pass
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    try: sys.stderr.reconfigure(encoding='utf-8')
    except Exception: pass
import time
import re
import shutil
import asyncio
from typing import Optional

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EXTRA_PATHS = [
    os.path.join(BASE_DIR, 'bin'),
    '/opt/homebrew/bin',      # Apple Silicon Mac (M1/M2/M3/M4) Homebrew
    '/usr/local/bin',          # Intel Mac Homebrew & standard UNIX tools
    '/opt/local/bin',          # MacPorts
]
for p in EXTRA_PATHS:
    if os.path.exists(p) and p not in os.environ.get('PATH', ''):
        os.environ['PATH'] = p + os.pathsep + os.environ.get('PATH', '')

UPLOADS_DIR = os.path.join(BASE_DIR, "scratch", "voxcpm_uploads")
OUTPUTS_DIR = os.path.join(BASE_DIR, "scratch", "voxcpm_outputs")
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)

import torch
try:
    import soundfile as sf
except ImportError:
    sf = None
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import subprocess

app = FastAPI(
    title="Cheatz Dabber - Local VoxCPM2 Engine",
    description="Cross-Platform Local Voice Cloning Engine (Windows & macOS)",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ─────────────────────────────────────────────────────────────────────────────
# Cross-platform GPU Device Selection
# Priority: CUDA > Apple MPS > AMD DirectML > CPU
# AMD Vega 64 on Windows uses torch-directml (DirectX 12 ML backend).
# ─────────────────────────────────────────────────────────────────────────────
force_cpu = (
    os.getenv("FORCE_CPU", "").lower() in ("1", "true", "yes")
    or "--cpu" in sys.argv
    or os.getenv("VOXCPM_DEVICE", "").lower() == "cpu"
)
force_amd = (
    os.getenv("VOXCPM_AMD", "").lower() in ("1", "true", "yes")
    or "--amd" in sys.argv
    or os.getenv("VOXCPM_DEVICE", "").lower() == "amd"
)

if not force_cpu and torch.cuda.is_available():
    device = "cuda"
    gpu_name = torch.cuda.get_device_name(0)
    print(f"✅ NVIDIA CUDA GPU: {gpu_name}")

elif not force_cpu and hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
    device = "mps"
    gpu_name = "Apple Silicon GPU (Metal / MPS)"
    print(f"🍎 Apple Silicon MPS: {gpu_name}")

elif not force_cpu and (force_amd or os.getenv("VOXCPM_DEVICE", "").lower() == "amd"):
    # Explicit AMD mode: use torch-directml on Windows
    try:
        import torch_directml
        dml_device_index = int(os.getenv("DML_VISIBLE_DEVICES", "0"))
        device = torch_directml.device(dml_device_index)
        gpu_name = f"AMD GPU (DirectML device:{dml_device_index})"
        print(f"✅ AMD DirectML GPU: {gpu_name}")
    except ImportError:
        print("⚠️  torch-directml not installed — falling back to CPU.")
        print("   Install with: pip install torch-directml")
        device = "cpu"
        gpu_name = "CPU (torch-directml missing)"

elif not force_cpu:
    # Auto-detect AMD via gpu_detect even without explicit --amd flag
    _dml_detected = False
    try:
        _gpu_detect_path = os.path.join(BASE_DIR, "services", "gpu_detect.py")
        if os.path.exists(_gpu_detect_path):
            import importlib.util as _ilu
            _spec = _ilu.spec_from_file_location("gpu_detect", _gpu_detect_path)
            _gd = _ilu.module_from_spec(_spec)
            _spec.loader.exec_module(_gd)
            _sys_gpus = _gd.detect_gpus()
            _primary = _sys_gpus.primary
            if _primary and _primary.vendor == "amd" and _primary.has_directml:
                import torch_directml
                device = torch_directml.device(0)
                gpu_name = f"AMD DirectML — {_primary.name} ({_primary.vram_gb}GB)"
                print(f"✅ AMD GPU auto-detected: {gpu_name}")
                _dml_detected = True
    except Exception as _e:
        pass  # fall through to CPU

    if not _dml_detected:
        device = "cpu"
        gpu_name = "Local Computer (CPU Mode)"
        # Optimise CPU multi-threading — Intel Xeon and Ryzen tuning
        try:
            cpu_threads = min(16, max(4, (os.cpu_count() or 4) // 2 if (os.cpu_count() or 4) > 8 else (os.cpu_count() or 4)))
            torch.set_num_threads(cpu_threads)
            os.environ["OMP_NUM_THREADS"] = str(cpu_threads)
            os.environ["MKL_NUM_THREADS"] = str(cpu_threads)
            print(f"⚡ CPU Multi-Threading active: {cpu_threads} worker threads")
        except Exception:
            pass

else:
    device = "cpu"
    gpu_name = "CPU Mode (forced)"
    try:
        cpu_threads = min(16, max(4, (os.cpu_count() or 4) // 2 if (os.cpu_count() or 4) > 8 else (os.cpu_count() or 4)))
        torch.set_num_threads(cpu_threads)
        os.environ["OMP_NUM_THREADS"] = str(cpu_threads)
        os.environ["MKL_NUM_THREADS"] = str(cpu_threads)
        print(f"⚡ CPU Multi-Threading active: {cpu_threads} worker threads")
    except Exception:
        pass

print(f"🔧 Active Device: {device}  |  GPU: {gpu_name}")

model = None
model_loading = False
model_load_error = None

def get_model():
    global model, model_loading, model_load_error
    if model is not None:
        return model
    if model_loading:
        return None

    model_loading = True
    try:
        print("=" * 65)
        print(f"📥 Loading VoxCPM2 Model onto {device.upper()} ({gpu_name})...")
        print("=" * 65)
        import voxcpm
        try:
            # optimize=False avoids torch.compile which is unsupported on Windows CPU
            model = voxcpm.VoxCPM.from_pretrained(
                "openbmb/VoxCPM2",
                device=device,
                optimize=(device == "cuda"),
                load_denoiser=False
            )
            print(f"✅ VoxCPM2 Model loaded successfully on {device.upper()}!")
        except Exception as opt_err:
            print(f"⚠️ Notice: {opt_err}, attempting standard load fallback...")
            try:
                model = voxcpm.VoxCPM.from_pretrained("openbmb/VoxCPM2", device=device, optimize=False, load_denoiser=False)
                print(f"✅ VoxCPM2 Model loaded successfully on {device.upper()}!")
            except Exception as e_cuda:
                if device == "cuda":
                    print(f"⚠️ GPU VRAM error ({e_cuda}). Auto-falling back to CPU...")
                    try:
                        torch.cuda.empty_cache()
                    except Exception: pass
                    model = voxcpm.VoxCPM.from_pretrained("openbmb/VoxCPM2", device="cpu", optimize=False, load_denoiser=False)
                    print(f"✅ VoxCPM2 Model loaded successfully on CPU fallback!")
                else:
                    raise e_cuda
        model_load_error = None
        return model
    except Exception as e:
        model_load_error = str(e)
        print(f"⚠️ Local VoxCPM2 model notice: {e}")
        return None
    finally:
        model_loading = False

@app.on_event("startup")
def startup_event():
    import threading
    threading.Thread(target=get_model, daemon=True).start()

@app.post("/api/load-model")
@app.get("/api/load-model")
def trigger_load_model():
    import threading
    if model is None and not model_loading:
        threading.Thread(target=get_model, daemon=True).start()
        return {"success": True, "message": "Model loading started in background"}
    return {"success": True, "message": "Model already loaded or loading", "modelLoaded": model is not None, "modelLoading": model_loading}

@app.get("/")
def home():
    return {
        "status": "ok",
        "service": "Cheatz Dabber Local VoxCPM2 Engine",
        "device": device,
        "gpuName": gpu_name,
        "modelLoaded": model is not None,
        "modelLoading": model_loading,
        "modelLoadError": model_load_error,
        "port": 8000,
        "local": True
    }

@app.get("/api/status")
def get_status():
    vram_display = "N/A (CPU)"
    if torch.cuda.is_available():
        vram_display = f"{torch.cuda.memory_allocated(0)/(1024**2):.1f} MB (CUDA)"
    elif device == "mps":
        vram_display = "Apple Metal GPU Active"

    return {
        "online": True,
        "device": device,
        "gpuName": gpu_name,
        "modelReady": model is not None,
        "modelLoading": model_loading,
        "modelLoadError": model_load_error,
        "memoryVRAM": vram_display
    }

@app.post("/api/clone-and-speak")
async def clone_and_speak(
    text: str = Form(...),
    reference_audio: Optional[UploadFile] = File(None),
    timesteps: int = Form(10),
    cfg_value: float = Form(2.0)
):
    try:
        ref_path = None
        if reference_audio and reference_audio.filename:
            ref_path = os.path.join(UPLOADS_DIR, f"ref_{int(time.time()*1000)}_{os.path.basename(reference_audio.filename)}")
            content = await reference_audio.read()
            with open(ref_path, "wb") as f:
                f.write(content)

        # Clean Thai characters
        clean_text = re.sub(r'[\u0E00-\u0E7F]+', '', text).strip()
        if not clean_text:
            clean_text = "បាទ"

        active_model = get_model()
        out_file = os.path.join(OUTPUTS_DIR, f"voice_{int(time.time()*1000)}.wav")

        if active_model is not None:
            try:
                gen_kwargs = {
                    "text": clean_text,
                    "cfg_value": cfg_value,
                    "inference_timesteps": timesteps,
                    "normalize": True,
                    "denoise": True
                }
                if ref_path and os.path.exists(ref_path) and os.path.getsize(ref_path) > 1000:
                    gen_kwargs["reference_wav_path"] = ref_path

                wav = active_model.generate(**gen_kwargs)
                sf.write(out_file, wav, 48000)
                return FileResponse(out_file, media_type="audio/wav")
            except Exception as gen_err:
                print(f"⚠️ GPU/Generation notice: {gen_err}. Using Khmer Studio Neural Audio...")

        # High quality fallback synthesizer using edge-tts
        import edge_tts
        tts = edge_tts.Communicate(clean_text, "km-KH-PisethNeural")
        temp_mp3 = out_file.replace(".wav", ".mp3")
        await tts.save(temp_mp3)
        # Cross-platform convert to wav 48kHz
        try:
            subprocess.run(
                ['ffmpeg', '-nostdin', '-y', '-i', temp_mp3, '-ar', '48000', '-ac', '2', out_file],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False
            )
        except Exception:
            pass
        if not os.path.exists(out_file):
            out_file = temp_mp3
        return FileResponse(out_file, media_type="audio/wav" if out_file.endswith(".wav") else "audio/mpeg")

    except Exception as e:
        print(f"❌ Error in local clone-and-speak: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = 8000
    print("=" * 68)
    print("[SERVER] Cheatz Dabber.PRO - Local VoxCPM2 Engine")
    print(f"[SERVER] Engine Local URL:  http://127.0.0.1:{port}")
    print(f"[SERVER] Hardware Device:   {device.upper()} ({gpu_name})")
    print("=" * 68)
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
