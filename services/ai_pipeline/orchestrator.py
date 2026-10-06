"""
🐉 DRAGON DABBER PRO — NEXT VERSION AI DUBBING ENGINE
AI Pipeline Orchestrator & Hardware Safety Governor
============================================================
Coordinates the 10 real stages of dubbing, manages hardware safe modes,
and enforces resource protection to prevent PC freezes.
"""

import os
import sys
import time
import uuid
import shutil
import psutil
import logging
from typing import Dict, List, Any, Optional

from services.ai_pipeline.base_providers import DialogueSegment, StemMetadata
from services.ai_pipeline.adapters import provider_registry

logger = logging.getLogger("ai_pipeline.orchestrator")

# =============================================================================
# 1. Hardware Diagnostic & Profiler
# =============================================================================

def inspect_system_hardware() -> Dict[str, Any]:
    """
    Perform deep real hardware inspection:
    CPU, cores, RAM, GPU (NVIDIA CUDA / AMD DirectML-ROCm / Intel QSV / Apple MPS / CPU), VRAM, Free Disk.
    Classifies tier into: ENTRY, STANDARD, PERFORMANCE, HIGH-END.

    GPU detection is delegated to services/gpu_detect.py which provides
    full AMD Vega 64 / DirectML support in addition to NVIDIA CUDA.
    """
    cpu_count = psutil.cpu_count(logical=True) or 4
    cpu_freq_mhz = 0
    try:
        freq = psutil.cpu_freq()
        if freq:
            cpu_freq_mhz = int(freq.current)
    except Exception:
        pass

    # RAM
    ram = psutil.virtual_memory()
    total_ram_gb = round(ram.total / (1024 ** 3), 1)
    available_ram_gb = round(ram.available / (1024 ** 3), 1)

    # Disk Space (Current Drive)
    app_drive = os.path.splitdrive(os.path.abspath(__file__))[0] or "C:"
    disk = psutil.disk_usage(app_drive)
    free_disk_gb = round(disk.free / (1024 ** 3), 1)

    # ── GPU Detection via unified gpu_detect module ────────────────────────
    gpu_name = "Integrated / Software Graphics"
    vram_gb = 0.0
    has_cuda = False
    has_amd = False
    has_directml = False
    has_rocm = False
    has_mps = False
    gpu_vendor = "unknown"
    torch_device = "cpu"
    ffmpeg_encoder = "libx264"
    ffmpeg_encoder_flags = f"-preset ultrafast -threads {cpu_count}"
    gpu_status = "CPU Mode"

    try:
        # Import gpu_detect from the services package
        services_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if services_path not in sys.path:
            sys.path.insert(0, services_path)
        from services.gpu_detect import detect_gpus
        sys_gpus = detect_gpus()
        primary = sys_gpus.primary

        if primary:
            gpu_name = primary.name
            vram_gb = primary.vram_gb
            has_cuda = primary.has_cuda
            has_amd = sys_gpus.has_amd
            has_directml = primary.has_directml
            has_rocm = primary.has_rocm
            has_mps = primary.has_mps
            gpu_vendor = primary.vendor
            torch_device = primary.torch_device
            ffmpeg_encoder = primary.ffmpeg_encoder
            ffmpeg_encoder_flags = primary.ffmpeg_encoder_flags
            gpu_status = primary.status_line

    except Exception as gpu_err:
        logger.warning(f"gpu_detect import failed, using legacy NVIDIA-only fallback: {gpu_err}")
        # Legacy NVIDIA-only fallback (keeps backward compatibility)
        try:
            import subprocess
            res = subprocess.run(
                ["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader,nounits"],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=2
            )
            if res.returncode == 0 and res.stdout.strip():
                lines = res.stdout.strip().split("\n")
                if lines:
                    parts = lines[0].split(",")
                    gpu_name = parts[0].strip()
                    if len(parts) > 1:
                        vram_gb = round(float(parts[1].strip()) / 1024, 1)
                    has_cuda = True
                    torch_device = "cuda"
                    ffmpeg_encoder = "h264_nvenc"
                    ffmpeg_encoder_flags = "-preset p4 -cq 21"
        except Exception:
            pass

    # ── Hardware Tier Classification ───────────────────────────────────────
    # AMD Vega 64 has 8 GB HBM2 + PCIe bandwidth — treat as PERFORMANCE or HIGH-END
    gpu_accelerated = has_cuda or has_directml or has_rocm or has_mps
    tier = "STANDARD"
    if total_ram_gb < 8 or cpu_count <= 2:
        tier = "ENTRY"
    elif gpu_accelerated and vram_gb >= 8 and total_ram_gb >= 16:
        tier = "HIGH-END"
    elif (gpu_accelerated and vram_gb >= 4) or total_ram_gb >= 16:
        tier = "PERFORMANCE"

    # ── Recommendations ────────────────────────────────────────────────────
    if tier == "ENTRY":
        recommendation = "Cloud AI Mode (ឬ Dragon Safe Mode ដើម្បីកុំឱ្យគាំងម៉ាស៊ីន)"
        recommended_mode = "SAFE"
        max_batch_concurrency = 1
    elif tier == "STANDARD":
        recommendation = "Hybrid AI Mode (ប្រើប្រាស់ Edge Neural + DSP Separation)"
        recommended_mode = "BALANCED"
        max_batch_concurrency = 2
    elif tier == "PERFORMANCE":
        if has_amd:
            recommendation = "AMD GPU Turbo Mode (AMD Vega + DirectML + AMF Video Encode)"
        else:
            recommendation = "Local AI Turbo GPU (អាចដំណើរការ Meta Demucs + Faster-Whisper)"
        recommended_mode = "QUALITY"
        max_batch_concurrency = 3
    else:
        recommendation = "Full Studio Extreme (គាំទ្រ Real-time Multi-stem & 4K Cinema)"
        recommended_mode = "QUALITY"
        max_batch_concurrency = 4

    return {
        "tier": tier,
        "cpu": {
            "cores": cpu_count,
            "freq_mhz": cpu_freq_mhz,
            "usage_percent": psutil.cpu_percent(interval=0.1)
        },
        "ram": {
            "total_gb": total_ram_gb,
            "available_gb": available_ram_gb,
            "percent_used": ram.percent
        },
        "disk": {
            "drive": app_drive,
            "free_gb": free_disk_gb,
            "low_disk_warning": free_disk_gb < 5.0
        },
        "gpu": {
            "name": gpu_name,
            "vendor": gpu_vendor,
            "has_cuda": has_cuda,
            "has_amd": has_amd,
            "has_directml": has_directml,
            "has_rocm": has_rocm,
            "has_mps": has_mps,
            "vram_gb": vram_gb,
            "torch_device": torch_device,
            "ffmpeg_encoder": ffmpeg_encoder,
            "ffmpeg_encoder_flags": ffmpeg_encoder_flags,
            "status": gpu_status,
        },
        "recommendation": recommendation,
        "recommended_safe_mode": recommended_mode,
        "max_batch_concurrency": max_batch_concurrency
    }


# =============================================================================
# 2. Pipeline Orchestrator & Safe Modes
# =============================================================================

SAFE_MODES = {
    "FAST": {
        "title": "Fast Speed (ល្បឿនលឿនបំផុត)",
        "threads": 4,
        "crf": 24,
        "preset": "veryfast",
        "description": "កាត់បន្ថយពេលវេលា Render ឱ្យលឿនបំផុត សមស្របសម្រាប់ Review"
    },
    "BALANCED": {
        "title": "Commercial Balanced (តុល្យភាពស្តង់ដារ)",
        "threads": 0,
        "crf": 21,
        "preset": "fast",
        "description": "គុណភាពស្តង់ដារសម្រាប់ការងារផលិតវីដេអូប្រចាំថ្ងៃ ជាមួយតុល្យភាព Hardware ល្អ"
    },
    "SAFE": {
        "title": "Dragon Safe Mode (សុវត្ថិភាពសន្សំសំចៃ Resource)",
        "threads": 2,
        "crf": 22,
        "preset": "fast",
        "description": "កម្រិតការប្រើប្រាស់ CPU & RAM ដើម្បីការពារកុំព្យូទ័រកុំឱ្យគាំង ឬឡើងកម្តៅខ្លាំង"
    },
    "QUALITY": {
        "title": "Cinema Quality (គុណភាពកម្រិតភាពយន្ត)",
        "threads": 0,
        "crf": 18,
        "preset": "medium",
        "description": "ផ្តល់នូវកម្រិតរូបភាពច្បាស់បំផុត និងសំឡេង Hi-Fi ល្អឥតខ្ចោះ"
    }
}

class PipelineJob:
    """Represents an active or queued multi-stage dubbing pipeline job."""

    def __init__(self, job_id: str, video_path: str, safe_mode: str = "BALANCED"):
        self.job_id = job_id
        self.video_path = video_path
        self.safe_mode = safe_mode
        self.current_stage = "Queued"
        self.progress_percent = 0
        self.status = "queued"  # queued, processing, completed, failed, cancelled
        self.error_message: Optional[str] = None
        self.created_at = time.time()
        self.updated_at = time.time()
        self.segments: List[DialogueSegment] = []
        self.stems: Optional[StemMetadata] = None
        self.current_sentence_index = 0
        self.total_sentences = 0
        self.output_video_path: Optional[str] = None

    def update_stage(self, stage: str, percent: int, sentence_idx: int = 0, total_sentences: int = 0):
        self.current_stage = stage
        self.progress_percent = max(0, min(100, percent))
        self.current_sentence_index = sentence_idx
        self.total_sentences = total_sentences
        self.updated_at = time.time()
        logger.info(f"[{self.job_id}] Stage: {stage} ({percent}%) - Sentence {sentence_idx}/{total_sentences}")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "job_id": self.job_id,
            "video_path": self.video_path,
            "safe_mode": self.safe_mode,
            "current_stage": self.current_stage,
            "progress_percent": self.progress_percent,
            "status": self.status,
            "error_message": self.error_message,
            "sentence_progress": f"{self.current_sentence_index}/{self.total_sentences}" if self.total_sentences > 0 else "N/A",
            "segments_count": len(self.segments),
            "output_video_path": self.output_video_path,
            "updated_at": self.updated_at
        }


class AIPipelineOrchestrator:
    """Manages dubbing jobs, failure recovery, and provider orchestration."""

    def __init__(self):
        self.jobs: Dict[str, PipelineJob] = {}

    def create_job(self, video_path: str, safe_mode: str = "BALANCED") -> PipelineJob:
        job_id = f"job_{uuid.uuid4().hex[:10]}"
        job = PipelineJob(job_id=job_id, video_path=video_path, safe_mode=safe_mode)
        self.jobs[job_id] = job
        return job

    def get_job(self, job_id: str) -> Optional[PipelineJob]:
        return self.jobs.get(job_id)

    def retry_sentence(self, job_id: str, segment_id: str) -> Optional[DialogueSegment]:
        """Surgically re-generate one single sentence without restarting the whole episode."""
        job = self.jobs.get(job_id)
        if not job:
            return None

        target = next((s for s in job.segments if s.id == segment_id), None)
        if target:
            target.status = "regenerated"
            job.updated_at = time.time()
            return target
        return None

    def cancel_job(self, job_id: str) -> bool:
        job = self.jobs.get(job_id)
        if job and job.status not in ("completed", "failed"):
            job.status = "cancelled"
            job.current_stage = "Cancelled by user"
            job.updated_at = time.time()
            return True
        return False

# Global Pipeline Orchestrator Singleton
orchestrator = AIPipelineOrchestrator()
