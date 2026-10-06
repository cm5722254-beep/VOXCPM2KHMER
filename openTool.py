# -*- coding: utf-8 -*-
"""
╔══════════════════════════════════════════════════════════════════════════╗
║  openTool.py  —  VOXCPM2KHMER Launcher                                  ║
║  🐉 Dragon Dabber PRO — AMD RX Vega 64 Edition                          ║
║                                                                          ║
║  Features:                                                               ║
║  · AMD Vega 64 GPU detection (DirectML / ROCm / h264_amf)               ║
║  · NVIDIA CUDA / Intel QSV / Apple MPS detection                        ║
║  · Start / Stop local FastAPI server (local_voxcpm_server.py)           ║
║  · Open browser at http://localhost:8765                                 ║
║  · Windows System Tray icon with menu                                    ║
║  · Live GPU + server status window                                       ║
║  · One-click AMD environment setup (sets DML / HIP env vars)            ║
║                                                                          ║
║  Packaged via:  openTool.spec  →  openTool.exe  (PyInstaller)           ║
║  Build with:    BUILD_OPENTOOL.bat                                       ║
╚══════════════════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import os
import sys
import time
import socket
import subprocess
import threading
import webbrowser
import logging
import json
import ctypes
import platform

# ──────────────────────────────────────────────────────────────────────────────
# Resolve base directory (works both from source and inside PyInstaller bundle)
# ──────────────────────────────────────────────────────────────────────────────
if getattr(sys, "frozen", False):
    BASE_DIR    = os.path.dirname(os.path.abspath(sys.executable))
    BUNDLE_DIR  = getattr(sys, "_MEIPASS", BASE_DIR)
else:
    BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
    BUNDLE_DIR  = BASE_DIR

# Add bundled bin/ (ffmpeg) and project root to PATH / sys.path
for _p in [os.path.join(BUNDLE_DIR, "bin"), os.path.join(BASE_DIR, "bin"), BASE_DIR]:
    if os.path.isdir(_p) and _p not in os.environ.get("PATH", ""):
        os.environ["PATH"] = _p + os.pathsep + os.environ.get("PATH", "")
for _p in [os.path.join(BASE_DIR, "services"), BASE_DIR, BUNDLE_DIR]:
    if os.path.isdir(_p) and _p not in sys.path:
        sys.path.insert(0, _p)

os.chdir(BASE_DIR)

# ──────────────────────────────────────────────────────────────────────────────
# UTF-8 on Windows console
# ──────────────────────────────────────────────────────────────────────────────
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("openTool")

# ──────────────────────────────────────────────────────────────────────────────
# Server constants
# ──────────────────────────────────────────────────────────────────────────────
SERVER_HOST  = "127.0.0.1"
SERVER_PORT  = 8765
SERVER_URL   = f"http://{SERVER_HOST}:{SERVER_PORT}"
SERVER_READY_TIMEOUT = 30   # seconds to wait for server to respond
SERVER_SCRIPT = os.path.join(BASE_DIR, "local_voxcpm_server.py")

# Determine Python executable
_venv_python = os.path.join(BASE_DIR, ".venv", "Scripts", "python.exe")
if os.path.isfile(_venv_python):
    PYTHON_EXE = _venv_python
else:
    PYTHON_EXE = sys.executable


# ══════════════════════════════════════════════════════════════════════════════
# §1  AMD / GPU Detection
# ══════════════════════════════════════════════════════════════════════════════

class GPUInfo:
    """Holds the result of GPU detection for display in the UI."""
    def __init__(self):
        self.name:           str  = "Detecting..."
        self.vendor:         str  = "unknown"       # nvidia | amd | intel | apple | unknown
        self.vram_gb:        float = 0.0
        self.is_amd:         bool  = False
        self.is_nvidia:      bool  = False
        self.has_directml:   bool  = False
        self.has_rocm:       bool  = False
        self.ffmpeg_encoder: str  = "libx264"
        self.torch_device:   str  = "cpu"
        self.status_emoji:   str  = "⚪"
        self.backend_label:  str  = "CPU Mode"
        self.env_vars:       dict  = {}             # env vars to inject for AMD

    def summary_line(self) -> str:
        return (
            f"{self.status_emoji}  {self.name}"
            + (f"  ({self.vram_gb:.1f} GB VRAM)" if self.vram_gb else "")
            + f"  [{self.backend_label}]"
        )


def _run_silent(cmd: list[str], timeout: int = 5) -> str:
    """Run a subprocess and return stdout; return '' on any failure."""
    try:
        flags = 0
        if sys.platform == "win32":
            flags = subprocess.CREATE_NO_WINDOW  # type: ignore[attr-defined]
        r = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout,
            creationflags=flags
        )
        return r.stdout.strip() if r.returncode == 0 else ""
    except Exception:
        return ""


def _try_import(name: str) -> bool:
    """Return True if a Python module can be imported."""
    try:
        __import__(name)
        return True
    except Exception:
        return False


def detect_gpu() -> GPUInfo:
    """
    Detect the primary GPU.  Priority order:
      1. NVIDIA  (nvidia-smi)
      2. AMD     (wmic on Windows / lspci on Linux)
      3. Intel   (wmic / lspci)
      4. CPU fallback
    Then determine the best torch device and ffmpeg encoder.
    """
    info = GPUInfo()

    # ── 1. NVIDIA ────────────────────────────────────────────────────────────
    nvidia_out = _run_silent([
        "nvidia-smi",
        "--query-gpu=name,memory.total,memory.free",
        "--format=csv,noheader,nounits",
    ])
    if nvidia_out:
        parts = [p.strip() for p in nvidia_out.splitlines()[0].split(",")]
        if len(parts) >= 2:
            info.name        = parts[0]
            info.vram_gb     = round(float(parts[1]) / 1024.0, 1)
            info.vendor      = "nvidia"
            info.is_nvidia   = True
            info.torch_device  = "cuda"
            info.ffmpeg_encoder = "h264_nvenc"
            info.status_emoji  = "🟢"
            info.backend_label = "NVIDIA CUDA"
            return info

    # ── 2. AMD (Windows: wmic) ────────────────────────────────────────────────
    if sys.platform == "win32":
        wmic_out = _run_silent([
            "wmic", "path", "win32_VideoController",
            "get", "Name,AdapterRAM",
            "/format:csv",
        ])
        for line in wmic_out.splitlines():
            ln = line.strip()
            if not ln or ln.lower().startswith("node"):
                continue
            parts = ln.split(",")
            if len(parts) >= 3:
                gpu_name = parts[2].strip()
                ram_str  = parts[1].strip()
            elif len(parts) >= 2:
                gpu_name = parts[1].strip()
                ram_str  = "0"
            else:
                continue

            if not gpu_name:
                continue

            name_lower = gpu_name.lower()
            if any(k in name_lower for k in ("radeon", "amd", "vega", "rx ", "r9 ", "r7 ")):
                try:
                    vram_bytes = int(ram_str) if ram_str.isdigit() else 0
                except ValueError:
                    vram_bytes = 0
                info.name   = gpu_name
                info.vram_gb = round(vram_bytes / (1024 ** 3), 1)
                info.vendor = "amd"
                info.is_amd = True
                # Check DirectML
                info.has_directml = _try_import("directml_provider") or _try_import("torch_directml")
                # Check ROCm
                info.has_rocm = bool(_run_silent(["rocm-smi", "--showproductname"]))
                # Determine best torch device
                if info.has_directml:
                    info.torch_device  = "dml"
                    info.backend_label = "AMD DirectML (DX12)"
                elif info.has_rocm:
                    info.torch_device  = "cuda"   # ROCm uses CUDA API
                    info.backend_label = "AMD ROCm"
                else:
                    info.torch_device  = "cpu"
                    info.backend_label = "AMD (CPU fallback — install torch-directml)"
                info.ffmpeg_encoder = "h264_amf"
                info.status_emoji   = "🔴"
                # Env vars for AMD acceleration
                info.env_vars = {
                    "VOXCPM_AMD":             "1",
                    "HIP_VISIBLE_DEVICES":    "0",
                    "DML_VISIBLE_DEVICES":    "0",
                    "AMD_SERIALIZE_KERNEL":   "1",
                    "HSA_OVERRIDE_GFX_VERSION": "9.0.0",   # Vega 64 = gfx900
                }
                return info

            if any(k in name_lower for k in ("intel", "uhd", "hd graphics", "iris")):
                info.name           = gpu_name
                info.vendor         = "intel"
                info.ffmpeg_encoder = "h264_qsv"
                info.status_emoji   = "🔵"
                info.backend_label  = "Intel GPU (QSV)"
                return info

    # ── 2b. AMD / Intel (Linux: lspci) ───────────────────────────────────────
    lspci_out = _run_silent(["lspci"])
    for line in lspci_out.splitlines():
        ll = line.lower()
        if "amd" in ll or "radeon" in ll or "vega" in ll:
            info.name          = line.split(":", 2)[-1].strip()
            info.vendor        = "amd"
            info.is_amd        = True
            info.has_rocm      = bool(_run_silent(["rocm-smi"]))
            info.torch_device  = "cuda" if info.has_rocm else "cpu"
            info.ffmpeg_encoder = "h264_amf"
            info.status_emoji  = "🔴"
            info.backend_label = "AMD ROCm" if info.has_rocm else "AMD (CPU fallback)"
            info.env_vars      = {"VOXCPM_AMD": "1", "HIP_VISIBLE_DEVICES": "0"}
            return info

    # ── 3. Apple MPS ─────────────────────────────────────────────────────────
    if sys.platform == "darwin":
        try:
            import torch  # type: ignore
            if torch.backends.mps.is_available():
                info.name          = "Apple Silicon / Metal GPU"
                info.vendor        = "apple"
                info.torch_device  = "mps"
                info.ffmpeg_encoder = "h264_videotoolbox"
                info.status_emoji  = "⚪"
                info.backend_label = "Apple MPS (Metal)"
                return info
        except Exception:
            pass

    # ── 4. CPU fallback ───────────────────────────────────────────────────────
    info.name          = f"CPU Mode — {platform.processor() or 'Unknown CPU'}"
    info.vendor        = "cpu"
    info.torch_device  = "cpu"
    info.ffmpeg_encoder = "libx264"
    info.status_emoji  = "⚪"
    info.backend_label = "CPU Multi-Thread"
    return info


# ══════════════════════════════════════════════════════════════════════════════
# §2  Server Management
# ══════════════════════════════════════════════════════════════════════════════

class ServerManager:
    """Start / stop / check the VOXCPM2KHMER local server process."""

    def __init__(self, gpu: GPUInfo):
        self.gpu     = gpu
        self._proc:  subprocess.Popen | None = None
        self._lock   = threading.Lock()
        self._status = "stopped"   # stopped | starting | running | error

    @property
    def status(self) -> str:
        return self._status

    def is_port_open(self) -> bool:
        """True if something is already listening on SERVER_PORT."""
        try:
            with socket.create_connection((SERVER_HOST, SERVER_PORT), timeout=1):
                return True
        except OSError:
            return False

    def start(self) -> bool:
        """
        Launch local_voxcpm_server.py in a subprocess with AMD env vars injected.
        Returns True if the server became reachable within SERVER_READY_TIMEOUT.
        """
        with self._lock:
            if self.is_port_open():
                log.info("Server already running on port %d", SERVER_PORT)
                self._status = "running"
                return True

            if not os.path.isfile(SERVER_SCRIPT):
                log.error("Server script not found: %s", SERVER_SCRIPT)
                self._status = "error"
                return False

            env = os.environ.copy()
            # Inject AMD environment variables
            for k, v in self.gpu.env_vars.items():
                env[k] = v
            # If AMD, add --amd flag and set device
            cmd = [PYTHON_EXE, SERVER_SCRIPT]
            if self.gpu.is_amd:
                cmd.append("--amd")

            log.info("Starting server: %s", " ".join(cmd))
            self._status = "starting"
            try:
                flags = 0
                if sys.platform == "win32":
                    flags = subprocess.CREATE_NO_WINDOW  # type: ignore[attr-defined]
                self._proc = subprocess.Popen(
                    cmd,
                    cwd=BASE_DIR,
                    env=env,
                    creationflags=flags,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                )
            except Exception as e:
                log.error("Failed to start server: %s", e)
                self._status = "error"
                return False

        # Wait until the port is open
        deadline = time.time() + SERVER_READY_TIMEOUT
        while time.time() < deadline:
            if self.is_port_open():
                self._status = "running"
                log.info("Server ready at %s", SERVER_URL)
                return True
            time.sleep(0.5)

        log.warning("Server did not become ready within %ds", SERVER_READY_TIMEOUT)
        self._status = "error"
        return False

    def stop(self):
        """Terminate the server subprocess."""
        with self._lock:
            if self._proc and self._proc.poll() is None:
                log.info("Stopping server (PID %d)...", self._proc.pid)
                self._proc.terminate()
                try:
                    self._proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    self._proc.kill()
                log.info("Server stopped.")
            self._proc   = None
            self._status = "stopped"

    def restart(self) -> bool:
        self.stop()
        time.sleep(1)
        return self.start()


# ══════════════════════════════════════════════════════════════════════════════
# §3  System Tray  (uses pystray + Pillow)
# ══════════════════════════════════════════════════════════════════════════════

def _make_tray_icon_image(color: tuple[int, int, int] = (220, 50, 50)):
    """Generate a simple 64×64 coloured circle as the tray icon image."""
    try:
        from PIL import Image, ImageDraw  # type: ignore
        img  = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw.ellipse([4, 4, 60, 60], fill=color + (255,), outline=(255, 255, 255, 180))
        # Small inner highlight
        draw.ellipse([18, 18, 36, 36], fill=(255, 255, 255, 100))
        return img
    except Exception:
        return None


def _build_tray(gpu: GPUInfo, server: ServerManager):
    """Build and run the pystray system tray icon (blocking call)."""
    try:
        import pystray                       # type: ignore
        from pystray import MenuItem as item, Menu  # type: ignore
    except ImportError:
        log.warning("pystray not installed — tray icon unavailable.")
        return

    # Choose tray icon colour by vendor
    colour_map = {
        "nvidia": (118, 185, 0),
        "amd":    (237, 28, 36),
        "intel":  (0, 120, 212),
        "apple":  (180, 180, 180),
    }
    colour = colour_map.get(gpu.vendor, (100, 100, 100))
    icon_img = _make_tray_icon_image(colour)
    if icon_img is None:
        log.warning("PIL not available — skipping tray icon.")
        return

    def on_open_browser(icon, item):
        webbrowser.open(SERVER_URL)

    def on_start_server(icon, item):
        icon.notify("Starting server...", "VOXCPM2KHMER")
        ok = server.start()
        if ok:
            icon.notify("✅ Server running!", "VOXCPM2KHMER")
            webbrowser.open(SERVER_URL)
        else:
            icon.notify("❌ Server failed to start.", "VOXCPM2KHMER")

    def on_stop_server(icon, item):
        server.stop()
        icon.notify("Server stopped.", "VOXCPM2KHMER")

    def on_restart_server(icon, item):
        icon.notify("Restarting server...", "VOXCPM2KHMER")
        ok = server.restart()
        if ok:
            icon.notify("✅ Server restarted!", "VOXCPM2KHMER")
        else:
            icon.notify("❌ Restart failed.", "VOXCPM2KHMER")

    def on_show_gpu_info(icon, item):
        msg_lines = [
            f"GPU      : {gpu.name}",
            f"Vendor   : {gpu.vendor.upper()}",
            f"VRAM     : {gpu.vram_gb:.1f} GB",
            f"Backend  : {gpu.backend_label}",
            f"Encoder  : {gpu.ffmpeg_encoder}",
            f"Torch    : {gpu.torch_device}",
            f"DirectML : {'Yes' if gpu.has_directml else 'No'}",
            f"ROCm     : {'Yes' if gpu.has_rocm else 'No'}",
        ]
        icon.notify("\n".join(msg_lines), f"{gpu.status_emoji} GPU Status")

    def on_install_directml(icon, item):
        """Open a console window and pip install torch-directml."""
        if sys.platform != "win32":
            icon.notify("DirectML is Windows-only.", "VOXCPM2KHMER")
            return
        pip = os.path.join(BASE_DIR, ".venv", "Scripts", "pip.exe")
        if not os.path.isfile(pip):
            pip = "pip"
        subprocess.Popen(
            f'start "Install torch-directml" cmd /k "{pip}" install torch-directml',
            shell=True, cwd=BASE_DIR
        )

    def on_quit(icon, item):
        server.stop()
        icon.stop()

    # Dynamic menu items
    amd_items = []
    if gpu.is_amd:
        amd_items = [
            item(
                f"🔴 AMD {gpu.name[:30]}  ({gpu.vram_gb:.1f} GB)",
                lambda i, m: None, enabled=False
            ),
            item(
                "DirectML: " + ("✅ Active" if gpu.has_directml else "⚠ Not installed — click to install"),
                on_install_directml if not gpu.has_directml else (lambda i, m: None),
            ),
            pystray.Menu.SEPARATOR,
        ]

    menu = Menu(
        *amd_items,
        item("🌐 Open VOXCPM2KHMER",  on_open_browser, default=True),
        pystray.Menu.SEPARATOR,
        item("▶  Start Server",        on_start_server),
        item("⏹  Stop Server",         on_stop_server),
        item("🔄 Restart Server",      on_restart_server),
        pystray.Menu.SEPARATOR,
        item(f"{gpu.status_emoji} GPU Info",  on_show_gpu_info),
        pystray.Menu.SEPARATOR,
        item("❌ Quit",                on_quit),
    )

    icon = pystray.Icon(
        "VOXCPM2KHMER",
        icon_img,
        f"VOXCPM2KHMER — {gpu.backend_label}",
        menu,
    )
    log.info("System tray icon active.")
    icon.run()


# ══════════════════════════════════════════════════════════════════════════════
# §4  Status window  (tkinter — lightweight, no extra install)
# ══════════════════════════════════════════════════════════════════════════════

def _show_status_window(gpu: GPUInfo, server: ServerManager):
    """
    Show a small Tkinter status window with GPU info + server controls.
    Falls back gracefully if tkinter is not available.
    """
    try:
        import tkinter as tk
        from tkinter import ttk
    except ImportError:
        log.info("tkinter not available — skipping status window.")
        return

    root = tk.Tk()
    root.title("🐉 VOXCPM2KHMER — openTool")
    root.geometry("520x360")
    root.resizable(False, False)
    root.configure(bg="#0b0f19")

    # ── Colour scheme ──────────────────────────────────────────────────────
    BG   = "#0b0f19"
    CARD = "#131929"
    ACC  = "#ef4444" if gpu.is_amd else ("#22c55e" if gpu.is_nvidia else "#64748b")
    FG   = "#f1f5f9"
    DIM  = "#64748b"

    # ── Header ─────────────────────────────────────────────────────────────
    hdr = tk.Frame(root, bg=ACC, height=4)
    hdr.pack(fill="x")

    title_frame = tk.Frame(root, bg=BG, pady=10)
    title_frame.pack(fill="x", padx=16)
    tk.Label(
        title_frame,
        text="🐉  VOXCPM2KHMER  openTool",
        font=("Segoe UI", 13, "bold"),
        bg=BG, fg=FG
    ).pack(anchor="w")
    tk.Label(
        title_frame,
        text="Dragon Dabber PRO — GPU Launcher",
        font=("Segoe UI", 9),
        bg=BG, fg=DIM
    ).pack(anchor="w")

    # ── GPU Info Card ──────────────────────────────────────────────────────
    gpu_card = tk.Frame(root, bg=CARD, padx=14, pady=10, bd=0)
    gpu_card.pack(fill="x", padx=16, pady=(0, 8))

    def _row(label: str, value: str, val_colour: str = FG):
        row = tk.Frame(gpu_card, bg=CARD)
        row.pack(fill="x", pady=1)
        tk.Label(row, text=label, width=14, anchor="w",
                 font=("Segoe UI", 9), bg=CARD, fg=DIM).pack(side="left")
        tk.Label(row, text=value, anchor="w",
                 font=("Segoe UI", 9, "bold"), bg=CARD, fg=val_colour).pack(side="left")

    tk.Label(
        gpu_card,
        text=f"{gpu.status_emoji}  GPU Detected",
        font=("Segoe UI", 10, "bold"),
        bg=CARD, fg=ACC
    ).pack(anchor="w", pady=(0, 6))

    _row("Name",        gpu.name[:42])
    _row("Vendor",      gpu.vendor.upper(), ACC)
    _row("VRAM",        f"{gpu.vram_gb:.1f} GB" if gpu.vram_gb else "N/A")
    _row("Backend",     gpu.backend_label, ACC)
    _row("Torch",       gpu.torch_device)
    _row("FFmpeg",      gpu.ffmpeg_encoder)
    if gpu.is_amd:
        _row("DirectML", "✅ Active" if gpu.has_directml else "⚠ Not installed", "#fbbf24")
        _row("ROCm",     "✅ Active" if gpu.has_rocm else "—")

    # ── Server status label ────────────────────────────────────────────────
    status_var = tk.StringVar(value="⚪ Server: checking...")
    status_lbl = tk.Label(
        root, textvariable=status_var,
        font=("Segoe UI", 9), bg=BG, fg=DIM
    )
    status_lbl.pack(pady=(2, 0))

    def _refresh_status():
        if server.is_port_open():
            status_var.set(f"🟢 Server running — {SERVER_URL}")
            status_lbl.config(fg="#22c55e")
        else:
            status_var.set("🔴 Server stopped")
            status_lbl.config(fg=ACC)
        root.after(3000, _refresh_status)

    root.after(500, _refresh_status)

    # ── Buttons ────────────────────────────────────────────────────────────
    btn_frame = tk.Frame(root, bg=BG)
    btn_frame.pack(pady=10)

    BTN_STYLE = dict(
        font=("Segoe UI", 9, "bold"),
        relief="flat", cursor="hand2",
        padx=14, pady=6, bd=0
    )

    def _btn_start():
        status_var.set("⏳ Starting server...")
        status_lbl.config(fg="#fbbf24")
        threading.Thread(target=lambda: server.start(), daemon=True).start()

    def _btn_stop():
        server.stop()
        status_var.set("🔴 Server stopped")

    def _btn_open():
        webbrowser.open(SERVER_URL)

    tk.Button(
        btn_frame, text="▶  Start Server", bg="#22c55e", fg="#0b0f19",
        command=_btn_start, **BTN_STYLE
    ).pack(side="left", padx=4)

    tk.Button(
        btn_frame, text="⏹  Stop", bg="#ef4444", fg="#ffffff",
        command=_btn_stop, **BTN_STYLE
    ).pack(side="left", padx=4)

    tk.Button(
        btn_frame, text="🌐 Open Browser", bg="#3b82f6", fg="#ffffff",
        command=_btn_open, **BTN_STYLE
    ).pack(side="left", padx=4)

    if gpu.is_amd and not gpu.has_directml:
        def _install_dml():
            pip = os.path.join(BASE_DIR, ".venv", "Scripts", "pip.exe")
            if not os.path.isfile(pip):
                pip = "pip"
            subprocess.Popen(
                f'start "Install torch-directml" cmd /k "{pip}" install torch-directml',
                shell=True, cwd=BASE_DIR
            )
        tk.Button(
            root,
            text="⚡ Install torch-directml (AMD AI Acceleration)",
            bg="#fbbf24", fg="#0b0f19",
            command=_install_dml, **BTN_STYLE
        ).pack(pady=(2, 6))

    # ── Footer ─────────────────────────────────────────────────────────────
    tk.Label(
        root,
        text=f"Server → {SERVER_URL}   |   AMD RX Vega 64 Edition",
        font=("Segoe UI", 8), bg=BG, fg=DIM
    ).pack(pady=(0, 8))

    root.mainloop()


# ══════════════════════════════════════════════════════════════════════════════
# §5  Single-instance mutex  (Windows)
# ══════════════════════════════════════════════════════════════════════════════

_MUTEX_HANDLE = None

def _ensure_single_instance() -> bool:
    """
    Return True if this is the first instance.
    On Windows, create a named mutex; on duplicate, open browser and exit.
    """
    global _MUTEX_HANDLE
    if sys.platform != "win32":
        return True
    try:
        _MUTEX_HANDLE = ctypes.windll.kernel32.CreateMutexW(  # type: ignore[attr-defined]
            None, False, "Local\\VOXCPM2KHMER_openTool_SingleInstance"
        )
        if ctypes.windll.kernel32.GetLastError() == 183:   # ERROR_ALREADY_EXISTS
            webbrowser.open(SERVER_URL)
            return False
    except Exception:
        pass
    return True


# ══════════════════════════════════════════════════════════════════════════════
# §6  Main entry point
# ══════════════════════════════════════════════════════════════════════════════

def main():
    log.info("openTool  —  VOXCPM2KHMER Launcher  (AMD Vega 64 Edition)")
    log.info("BASE_DIR  : %s", BASE_DIR)

    # Single instance
    if not _ensure_single_instance():
        log.info("Another instance is already running — opening browser.")
        sys.exit(0)

    # ── Detect GPU ──────────────────────────────────────────────────────────
    log.info("Detecting GPU...")
    gpu = detect_gpu()
    log.info("GPU detected: %s", gpu.summary_line())

    if gpu.is_amd:
        log.info("AMD GPU found — injecting DirectML/HIP environment variables.")
        for k, v in gpu.env_vars.items():
            os.environ[k] = v
            log.info("  %s = %s", k, v)

    # ── Server manager ──────────────────────────────────────────────────────
    server = ServerManager(gpu)

    # ── Start server in background ──────────────────────────────────────────
    def _start_server_bg():
        ok = server.start()
        if ok:
            log.info("Server started — opening browser.")
            # Small delay so the page is ready
            time.sleep(1)
            webbrowser.open(SERVER_URL)
        else:
            log.error("Server failed to start.")

    threading.Thread(target=_start_server_bg, daemon=True).start()

    # ── Try system tray (requires pystray + Pillow) ─────────────────────────
    # Run tray icon in its own thread; fall back to plain tkinter window
    tray_available = False
    try:
        import pystray  # noqa: F401 — just check
        from PIL import Image  # noqa: F401
        tray_available = True
    except ImportError:
        pass

    if tray_available:
        # Show small status window briefly, then let tray take over
        tray_thread = threading.Thread(
            target=_build_tray, args=(gpu, server), daemon=False
        )
        tray_thread.start()
        # Also show status window in main thread
        _show_status_window(gpu, server)
        tray_thread.join()
    else:
        # No tray — just show the status window (it stays open)
        _show_status_window(gpu, server)

    # ── Cleanup on exit ─────────────────────────────────────────────────────
    log.info("openTool exiting — stopping server.")
    server.stop()


if __name__ == "__main__":
    main()
