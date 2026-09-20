import os
import sys
import time
import threading
import uvicorn
import webview

# ──────────────────────────────────────────────────────────────────────────────
# UTF-8 output on Windows
# ──────────────────────────────────────────────────────────────────────────────
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# ──────────────────────────────────────────────────────────────────────────────
# Resolve BASE_DIR correctly whether running:
#   a) As a plain Python script  → use __file__
#   b) As a PyInstaller one-dir EXE → sys.executable is CheatZDabberPro.exe
#      inside dist/CheatZDabberPro/; data files sit alongside the EXE
# ──────────────────────────────────────────────────────────────────────────────
if getattr(sys, 'frozen', False):
    # Running inside PyInstaller bundle
    BASE_DIR = os.path.dirname(sys.executable)
else:
    # Running as a normal Python script
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Add bin/ to PATH so FFmpeg is found automatically
EXTRA_PATHS = [
    os.path.join(BASE_DIR, 'bin'),
    '/opt/homebrew/bin',
    '/usr/local/bin',
    '/opt/local/bin',
]
for p in EXTRA_PATHS:
    if os.path.exists(p) and p not in os.environ.get('PATH', ''):
        os.environ['PATH'] = p + os.pathsep + os.environ.get('PATH', '')

# Change working directory to BASE_DIR so relative paths in server.py work
os.chdir(BASE_DIR)

# ──────────────────────────────────────────────────────────────────────────────
# Import FastAPI app (after setting BASE_DIR / CWD)
# ──────────────────────────────────────────────────────────────────────────────
from server import app  # noqa: E402


def start_server():
    """Run FastAPI server in a background thread."""
    uvicorn.run(app, host='127.0.0.1', port=3000, log_level='warning')


def main():
    # 1. Start FastAPI server thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # 2. Wait for server to bind (give it a moment)
    time.sleep(1.5)

    # 3. Launch Native Desktop Window (Edge WebView2 on Windows)
    window = webview.create_window(
        title='🎬 CheatZ Dabber PRO — AI Dubbing Studio',
        url='http://127.0.0.1:3000',
        width=1440,
        height=900,
        min_size=(1100, 700),
        text_select=True,
        zoomable=True,
    )

    if sys.platform == 'win32':
        webview.start(gui='edgechromium', debug=False)
    else:
        webview.start(debug=False)


if __name__ == '__main__':
    main()
