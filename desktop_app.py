import os
import sys
import time
import threading
import multiprocessing
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
# Resolve BASE_DIR and BUNDLE_DIR correctly whether running:
#   a) As a plain Python script
#   b) As a PyInstaller one-file standalone EXE
# ──────────────────────────────────────────────────────────────────────────────
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(os.path.abspath(sys.executable))
    BUNDLE_DIR = getattr(sys, '_MEIPASS', BASE_DIR)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    BUNDLE_DIR = BASE_DIR

# Add bin/ to PATH so FFmpeg & FFprobe are found automatically
EXTRA_PATHS = [
    os.path.join(BUNDLE_DIR, 'bin'),
    os.path.join(BASE_DIR, 'bin'),
    '/opt/homebrew/bin',
    '/usr/local/bin',
    '/opt/local/bin',
]
for p in EXTRA_PATHS:
    if os.path.exists(p) and p not in os.environ.get('PATH', ''):
        os.environ['PATH'] = p + os.pathsep + os.environ.get('PATH', '')

# Change working directory to BASE_DIR so relative paths work properly
os.chdir(BASE_DIR)

# Prepend persistent patches and services to sys.path so hot updates override bundled modules
for p in [os.path.join(BASE_DIR, 'patches'), os.path.join(BASE_DIR, 'services'), BASE_DIR]:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

# ──────────────────────────────────────────────────────────────────────────────
# Import FastAPI app (after setting BASE_DIR / CWD and PATH)
# ──────────────────────────────────────────────────────────────────────────────
from server import app  # noqa: E402

# ──────────────────────────────────────────────────────────────────────────────
# Initialize Auto-Update Manager
# ──────────────────────────────────────────────────────────────────────────────
try:
    from services.update_manager import get_update_manager
    update_manager = get_update_manager()
    # Start automatic update checking in background
    update_manager.start_auto_check()
    print("🔄 Auto-Update Manager initialized and running")
except Exception as e:
    print(f"⚠️ Auto-Update Manager initialization failed: {e}")
    update_manager = None


def start_server():
    """Run FastAPI server in a background thread."""
    uvicorn.run(app, host='0.0.0.0', port=3000, log_level='warning')


# Keep global reference to mutex to prevent garbage collection
_app_mutex = None

def main():
    global _app_mutex

    # 1. Windows single instance check: if already running, focus/open browser and exit
    if sys.platform == 'win32':
        import ctypes
        _app_mutex = ctypes.windll.kernel32.CreateMutexW(None, False, "Local\\ATITEBDABBERPRO_SingleInstance")
        if ctypes.windll.kernel32.GetLastError() == 183:  # ERROR_ALREADY_EXISTS
            import webbrowser
            webbrowser.open('http://127.0.0.1:3000')
            sys.exit(0)

    # 2. Start FastAPI server thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # 3. Wait for server to bind
    time.sleep(2.0)

    # 4. Perform initial update check (non-blocking)
    if update_manager:
        def initial_update_check():
            time.sleep(5.0)  # Wait for server and UI to fully load
            try:
                result = update_manager.check_for_updates()
                if result.get('status') == 'update_available':
                    print(f"✨ New update available: {result.get('latest_version')}")
            except Exception as e:
                print(f"⚠️ Initial update check failed: {e}")
        
        threading.Thread(target=initial_update_check, daemon=True).start()

    # 5. Launch Native Desktop Window (Edge WebView2 on Windows) with browser fallback
    try:
        window = webview.create_window(
            title='🎬 ស្ដេចអាទិទេព PRO — AI Khmer Dubbing Studio',
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
    except Exception as ex:
        print(f"WebView2 notice: {ex}. Falling back to default web browser...")
        import webbrowser
        webbrowser.open('http://127.0.0.1:3000')
        while True:
            time.sleep(1)
    
    # 6. Cleanup on exit
    finally:
        if update_manager:
            update_manager.stop_auto_check()
            print("🛑 Auto-Update Manager stopped")


if __name__ == '__main__':
    multiprocessing.freeze_support()
    main()

