"""
╔══════════════════════════════════════════════════════════════════╗
║  🐉 DRAGON DABBER PRO — Unified GPU Detection Utility            ║
║  Supports: NVIDIA CUDA · AMD Vega (DirectML/ROCm) ·              ║
║            Intel QSV · Apple MPS · CPU Fallback                  ║
╚══════════════════════════════════════════════════════════════════╝

gpu_detect.py  —  Single source of truth for GPU detection.
Called by orchestrator.py, local_voxcpm_server.py, adapters.py, audio_processor.py.

AMD Vega 64 on Windows uses DirectML (torch-directml).
AMD Vega 64 on Linux uses ROCm (if installed).
Intel GPUs use QSV/OpenCL.
Apple Silicon uses MPS (Metal Performance Shaders).
NVIDIA uses CUDA.
"""

from __future__ import annotations

import os
import sys
import logging
import subprocess
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger("gpu_detect")

# ─────────────────────────────────────────────────────────────────────────────
# Data classes
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class GPUInfo:
    """Hardware information for a single detected GPU."""
    name: str = "Unknown GPU"
    vendor: str = "unknown"          # "nvidia" | "amd" | "intel" | "apple" | "unknown"
    vram_gb: float = 0.0
    # Compute backend availability
    has_cuda: bool = False
    has_directml: bool = False        # AMD/Intel on Windows via torch-directml
    has_rocm: bool = False            # AMD on Linux via torch ROCm build
    has_mps: bool = False             # Apple Silicon Metal
    has_opencl: bool = False          # Intel integrated / AMD fallback
    # Recommended torch device string for this GPU
    torch_device: str = "cpu"
    # Recommended FFmpeg hardware encoder
    ffmpeg_encoder: str = "libx264"
    ffmpeg_encoder_flags: str = ""
    # Compute type for faster-whisper
    compute_type: str = "int8"        # float16 | float32 | int8_float16 | int8
    # Human-readable status line
    status_line: str = "CPU Mode"


@dataclass
class SystemGPUs:
    """Collection of all detected GPUs and the best one to use."""
    all_gpus: list[GPUInfo] = field(default_factory=list)
    primary: Optional[GPUInfo] = None
    has_nvidia: bool = False
    has_amd: bool = False
    has_intel_gpu: bool = False
    has_apple_mps: bool = False


# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────

def _run(cmd: list[str], timeout: int = 4) -> str:
    """Run a subprocess command and return stdout, or '' on error."""
    try:
        res = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=timeout
        )
        return res.stdout.strip() if res.returncode == 0 else ""
    except Exception:
        return ""


def _detect_nvidia() -> list[GPUInfo]:
    """Query nvidia-smi for all NVIDIA GPUs."""
    gpus: list[GPUInfo] = []
    out = _run(["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader,nounits"])
    if not out:
        return gpus
    for line in out.splitlines():
        parts = line.split(",")
        name = parts[0].strip() if parts else "NVIDIA GPU"
        vram = 0.0
        if len(parts) > 1:
            try:
                vram = round(float(parts[1].strip()) / 1024, 1)
            except ValueError:
                pass
        gpu = GPUInfo(
            name=name,
            vendor="nvidia",
            vram_gb=vram,
            has_cuda=True,
            torch_device="cuda",
            ffmpeg_encoder="h264_nvenc",
            ffmpeg_encoder_flags="-preset p4 -cq 21",
            compute_type="float16",
            status_line=f"✅ NVIDIA CUDA — {name} ({vram}GB VRAM)",
        )
        gpus.append(gpu)
    return gpus


def _detect_amd_windows() -> list[GPUInfo]:
    """
    Detect AMD GPUs on Windows using wmic and/or DirectML probe.

    AMD Vega 64 appears in wmic as 'Radeon RX Vega 64' (sometimes
    'Radeon(TM) RX Vega 64'). VRAM is reported in bytes.

    For AI compute we use torch-directml which wraps DirectX 12 ML
    and works on any DX12-capable GPU (Vega 10 architecture onwards).
    """
    gpus: list[GPUInfo] = []

    # --- WMIC path
    wmic_out = _run(["wmic", "path", "win32_VideoController",
                     "get", "Name,AdapterRAM", "/format:csv"])
    if not wmic_out:
        # Fallback: PowerShell
        wmic_out = _run([
            "powershell", "-NoProfile", "-Command",
            "Get-WmiObject Win32_VideoController | "
            "Select-Object Name,AdapterRAM | "
            "ConvertTo-Csv -NoTypeInformation"
        ], timeout=6)

    for line in wmic_out.splitlines():
        line = line.strip()
        if not line or line.lower().startswith("node") or line.lower().startswith('"node"'):
            continue
        parts = line.split(",")
        if len(parts) < 2:
            continue
        # Strip quotes from CSV output
        parts = [p.strip().strip('"') for p in parts]

        # WMIC CSV from wmic.exe: Node,AdapterRAM,Name
        # WMIC CSV from PowerShell: Name,AdapterRAM
        name_col = -1
        ram_col = -1
        for i, p in enumerate(parts):
            if p and not p.isdigit() and "AMD" not in p.upper() and "RADEON" not in p.upper() and i > 0:
                pass
            # Identify AMD/Radeon columns
            lower_p = p.lower()
            if any(kw in lower_p for kw in ("radeon", "rx vega", "rx 5", "rx 6", "rx 7", "vega", "amd")):
                name_col = i
            try:
                ram_val = int(p)
                if ram_val > 1_000_000:       # must be at least 1MB to be VRAM
                    ram_col = i
            except ValueError:
                pass

        if name_col == -1:
            continue

        name = parts[name_col]
        vram_bytes = int(parts[ram_col]) if ram_col != -1 else 0
        vram_gb = round(vram_bytes / (1024 ** 3), 1)
        # Vega 64 has 8 GiB HBM2 — wmic may report slightly lower due to system reserve
        if vram_gb < 0.1 and "vega" in name.lower():
            vram_gb = 8.0   # known hardware spec for RX Vega 64

        # Check if torch-directml is installed
        has_dml = _check_directml()

        gpu = GPUInfo(
            name=name,
            vendor="amd",
            vram_gb=vram_gb,
            has_directml=has_dml,
            torch_device="privateuseone:0" if has_dml else "cpu",
            ffmpeg_encoder="h264_amf",
            ffmpeg_encoder_flags=_best_amf_flags(name),
            compute_type=_amd_compute_type(has_dml, vram_gb),
            status_line=(
                f"✅ AMD DirectML — {name} ({vram_gb}GB VRAM)"
                if has_dml
                else f"⚠️ AMD GPU detected ({name}) — install torch-directml for GPU acceleration"
            ),
        )
        gpus.append(gpu)

    return gpus


def _detect_amd_linux() -> list[GPUInfo]:
    """Detect AMD GPUs on Linux via rocm-smi or lspci."""
    gpus: list[GPUInfo] = []

    # rocm-smi
    rocm_out = _run(["rocm-smi", "--showproductname", "--showmeminfo", "vram", "--csv"])
    if rocm_out:
        for line in rocm_out.splitlines():
            if line.lower().startswith("gpu") or line.lower().startswith("device"):
                parts = line.split(",")
                if len(parts) >= 2:
                    name = parts[0].strip()
                    vram_mb = 0.0
                    try:
                        vram_mb = float(parts[1].strip())
                    except ValueError:
                        pass
                    # Check if PyTorch ROCm is available
                    has_rocm = _check_rocm()
                    gpu = GPUInfo(
                        name=name,
                        vendor="amd",
                        vram_gb=round(vram_mb / 1024, 1),
                        has_rocm=has_rocm,
                        torch_device="cuda" if has_rocm else "cpu",  # ROCm exposes as 'cuda'
                        ffmpeg_encoder="h264_amf",
                        ffmpeg_encoder_flags="-usage transcoding -quality speed",
                        compute_type="float16" if has_rocm else "int8",
                        status_line=f"✅ AMD ROCm — {name}",
                    )
                    gpus.append(gpu)
        return gpus

    # lspci fallback
    lspci_out = _run(["lspci"])
    for line in lspci_out.splitlines():
        if "amd" in line.lower() or "radeon" in line.lower() or "vega" in line.lower():
            name = line.split(":")[-1].strip() if ":" in line else line.strip()
            has_rocm = _check_rocm()
            gpu = GPUInfo(
                name=name,
                vendor="amd",
                vram_gb=8.0 if "vega 64" in name.lower() else 0.0,
                has_rocm=has_rocm,
                torch_device="cuda" if has_rocm else "cpu",
                ffmpeg_encoder="h264_amf",
                ffmpeg_encoder_flags="-usage transcoding -quality speed",
                compute_type="float16" if has_rocm else "int8",
                status_line=f"⚠️ AMD GPU ({name}) — ROCm {'available' if has_rocm else 'not installed'}",
            )
            gpus.append(gpu)

    return gpus


def _detect_intel_gpu() -> list[GPUInfo]:
    """Detect Intel integrated / Arc GPUs (QSV)."""
    gpus: list[GPUInfo] = []
    if sys.platform == "win32":
        wmic_out = _run(["wmic", "path", "win32_VideoController", "get", "Name", "/value"])
        for line in wmic_out.splitlines():
            if "intel" in line.lower() and ("uhd" in line.lower() or "iris" in line.lower()
                                             or "arc" in line.lower() or "hd graphics" in line.lower()):
                name = line.split("=")[-1].strip()
                gpus.append(GPUInfo(
                    name=name,
                    vendor="intel",
                    ffmpeg_encoder="h264_qsv",
                    ffmpeg_encoder_flags="-global_quality 22",
                    compute_type="int8",
                    status_line=f"🔵 Intel GPU — {name} (QSV encode)",
                ))
    else:
        lspci_out = _run(["lspci"])
        for line in lspci_out.splitlines():
            if "intel" in line.lower() and ("graphics" in line.lower() or "uhd" in line.lower()):
                name = line.split(":")[-1].strip()
                gpus.append(GPUInfo(
                    name=name,
                    vendor="intel",
                    ffmpeg_encoder="h264_qsv",
                    ffmpeg_encoder_flags="-global_quality 22",
                    compute_type="int8",
                    status_line=f"🔵 Intel GPU — {name} (QSV encode)",
                ))
    return gpus


def _detect_apple_mps() -> list[GPUInfo]:
    """Detect Apple Silicon MPS on macOS."""
    gpus: list[GPUInfo] = []
    if sys.platform != "darwin":
        return gpus
    try:
        import torch
        if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            gpus.append(GPUInfo(
                name="Apple Silicon GPU (Metal / MPS)",
                vendor="apple",
                vram_gb=0.0,    # unified memory — not separately reported
                has_mps=True,
                torch_device="mps",
                ffmpeg_encoder="h264_videotoolbox",
                ffmpeg_encoder_flags="-q:v 60",
                compute_type="int8",
                status_line="🍎 Apple Silicon MPS (Metal Performance Shaders)",
            ))
    except ImportError:
        pass
    return gpus


# ─────────────────────────────────────────────────────────────────────────────
# AMD-specific helpers
# ─────────────────────────────────────────────────────────────────────────────

def _check_directml() -> bool:
    """Return True if torch-directml is importable (Windows AMD/Intel DML)."""
    try:
        import torch_directml  # noqa: F401
        return True
    except ImportError:
        return False


def _check_rocm() -> bool:
    """Return True if PyTorch was built with ROCm support (Linux AMD)."""
    try:
        import torch
        return torch.cuda.is_available() and "rocm" in torch.version.hip if hasattr(torch.version, "hip") and torch.version.hip else False
    except Exception:
        return False


def _best_amf_flags(gpu_name: str) -> str:
    """
    Return optimal h264_amf FFmpeg flags tuned for specific AMD GPU families.

    AMD Vega 64 (Vega 10 / gfx900) — VCE 3.4 engine:
      - quality=speed is fastest  (balanced = better quality, slow = highest)
      - rc=vbr_latency gives best rate control for dubbing output
      - bf=0 disables B-frames (Vega VCE doesn't benefit from B-frames at transcoding speed)
      - enforce_hrd=1 ensures HRD compliance for player compatibility

    RX 5000/6000/7000 use newer VCN engine and can use quality=balanced.
    """
    name_lower = gpu_name.lower()

    # AMD Vega 64 / Vega 56 (Vega 10 / 12 — GCN 5th gen)
    if "vega 64" in name_lower or "vega64" in name_lower:
        return (
            "-usage transcoding -quality speed "
            "-rc vbr_latency -b:v 4M -maxrate 6M -bufsize 8M "
            "-bf 0 -enforce_hrd 1"
        )

    # Vega 56
    if "vega 56" in name_lower or "vega56" in name_lower:
        return (
            "-usage transcoding -quality speed "
            "-rc vbr_latency -b:v 3M -maxrate 5M -bufsize 6M "
            "-bf 0 -enforce_hrd 1"
        )

    # RDNA 1 — RX 5000 series (VCN 2.0)
    if any(x in name_lower for x in ("rx 5600", "rx 5700", "rx 5500")):
        return "-usage transcoding -quality balanced -rc cbr -b:v 5M"

    # RDNA 2 — RX 6000 series (VCN 3.0)
    if any(x in name_lower for x in ("rx 6600", "rx 6700", "rx 6800", "rx 6900")):
        return "-usage transcoding -quality balanced -rc cbr -b:v 6M"

    # RDNA 3 — RX 7000 series (VCN 4.0)
    if any(x in name_lower for x in ("rx 7600", "rx 7700", "rx 7800", "rx 7900")):
        return "-usage transcoding -quality balanced -rc cbr -b:v 8M"

    # Generic AMD fallback
    return "-usage transcoding -quality speed"


def _amd_compute_type(has_dml: bool, vram_gb: float) -> str:
    """
    Return the optimal faster-whisper compute_type for AMD GPU.

    DirectML on Windows:
      - Vega 64 has 8 GB HBM2 — float16 is safe
      - Integrated / low-VRAM: int8
    Without DirectML: always int8 (CPU)
    """
    if not has_dml:
        return "int8"
    if vram_gb >= 6.0:
        return "float16"
    elif vram_gb >= 3.0:
        return "int8_float16"
    return "int8"


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

_CACHED_SYSTEM_GPUS: Optional[SystemGPUs] = None


def detect_gpus(force_refresh: bool = False) -> SystemGPUs:
    """
    Detect all GPUs on this system and return a SystemGPUs object.

    Results are cached after the first call for performance.
    Pass force_refresh=True to re-detect (e.g., after driver install).

    Detection order (priority for primary selection):
      1. NVIDIA CUDA
      2. Apple MPS (macOS only)
      3. AMD ROCm (Linux) / AMD DirectML (Windows)
      4. Intel QSV
      5. CPU fallback
    """
    global _CACHED_SYSTEM_GPUS
    if _CACHED_SYSTEM_GPUS is not None and not force_refresh:
        return _CACHED_SYSTEM_GPUS

    all_gpus: list[GPUInfo] = []

    # NVIDIA
    nvidia_gpus = _detect_nvidia()
    all_gpus.extend(nvidia_gpus)

    # Apple Silicon
    apple_gpus = _detect_apple_mps()
    all_gpus.extend(apple_gpus)

    # AMD
    if sys.platform == "win32":
        amd_gpus = _detect_amd_windows()
    else:
        amd_gpus = _detect_amd_linux()
    all_gpus.extend(amd_gpus)

    # Intel
    intel_gpus = _detect_intel_gpu()
    all_gpus.extend(intel_gpus)

    # Build SystemGPUs summary
    sys_info = SystemGPUs(
        all_gpus=all_gpus,
        has_nvidia=any(g.vendor == "nvidia" for g in all_gpus),
        has_amd=any(g.vendor == "amd" for g in all_gpus),
        has_intel_gpu=any(g.vendor == "intel" for g in all_gpus),
        has_apple_mps=any(g.vendor == "apple" for g in all_gpus),
    )

    # Select primary GPU by priority
    for gpu in all_gpus:
        if gpu.has_cuda:
            sys_info.primary = gpu
            break
    if sys_info.primary is None:
        for gpu in all_gpus:
            if gpu.has_mps:
                sys_info.primary = gpu
                break
    if sys_info.primary is None:
        for gpu in all_gpus:
            if gpu.vendor == "amd":
                sys_info.primary = gpu
                break
    if sys_info.primary is None:
        for gpu in all_gpus:
            if gpu.vendor == "intel":
                sys_info.primary = gpu
                break

    # CPU fallback
    if sys_info.primary is None:
        cpu_threads = min(16, os.cpu_count() or 4)
        sys_info.primary = GPUInfo(
            name="CPU Fallback",
            vendor="cpu",
            torch_device="cpu",
            ffmpeg_encoder="libx264",
            ffmpeg_encoder_flags=f"-preset ultrafast -threads {cpu_threads}",
            compute_type="int8",
            status_line=f"⚪ CPU Mode — {cpu_threads} threads (no dedicated GPU acceleration)",
        )

    _CACHED_SYSTEM_GPUS = sys_info

    # Log summary
    logger.info("GPU Detection complete:")
    for g in all_gpus:
        logger.info(f"  {g.status_line}")
    logger.info(f"  Primary selected: {sys_info.primary.name} | torch={sys_info.primary.torch_device} | ffmpeg={sys_info.primary.ffmpeg_encoder}")

    return sys_info


def get_primary_gpu() -> GPUInfo:
    """Convenience wrapper — returns the primary GPU info."""
    return detect_gpus().primary


def get_torch_device() -> str:
    """Return the best torch device string for this system."""
    return get_primary_gpu().torch_device


def get_ffmpeg_encoder() -> tuple[str, str]:
    """Return (encoder_codec, encoder_flags) for the best available hardware encoder."""
    gpu = get_primary_gpu()
    return gpu.ffmpeg_encoder, gpu.ffmpeg_encoder_flags


def get_compute_type() -> str:
    """Return optimal faster-whisper compute_type for this system."""
    return get_primary_gpu().compute_type


def print_gpu_report() -> None:
    """Print a human-readable GPU report to stdout (used in launch scripts)."""
    sys_info = detect_gpus()
    print("=" * 60)
    print("  🐉 DRAGON DABBER PRO — GPU Hardware Report")
    print("=" * 60)
    if not sys_info.all_gpus:
        print("  ⚪ No dedicated GPU detected — CPU Mode only")
    else:
        for g in sys_info.all_gpus:
            print(f"  {g.status_line}")
    print()
    p = sys_info.primary
    print(f"  ▶ Active Device   : {p.name}")
    print(f"  ▶ Torch Backend   : {p.torch_device}")
    print(f"  ▶ FFmpeg Encoder  : {p.ffmpeg_encoder}  {p.ffmpeg_encoder_flags}")
    print(f"  ▶ Compute Type    : {p.compute_type}")
    print("=" * 60)


# ─────────────────────────────────────────────────────────────────────────────
# CLI self-test
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    print_gpu_report()
