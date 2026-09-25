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
# Resolve BASE_DIR and BUNDLE_DIR
# ──────────────────────────────────────────────────────────────────────────────
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(os.path.abspath(sys.executable))
    BUNDLE_DIR = getattr(sys, '_MEIPASS', BASE_DIR)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    BUNDLE_DIR = BASE_DIR

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

os.chdir(BASE_DIR)

for p in [os.path.join(BASE_DIR, 'patches'), os.path.join(BASE_DIR, 'services'), BASE_DIR]:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

from server import app  # noqa: E402

try:
    from services.update_manager import get_update_manager
    update_manager = get_update_manager()
    update_manager.start_auto_check()
    print("🔄 Auto-Update Manager active")
except Exception as e:
    update_manager = None

def is_port_in_use(port=3000):
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def start_server():
    if not is_port_in_use(3000):
        uvicorn.run(app, host='0.0.0.0', port=3000, log_level='warning')

_app_mutex = None

def main():
    global _app_mutex

    # 1. Single instance mutex check
    if sys.platform == 'win32':
        import ctypes
        _app_mutex = ctypes.windll.kernel32.CreateMutexW(None, False, "Local\\ATITEBDABBER_PRO_STUDIO_SingleInstance")
        if ctypes.windll.kernel32.GetLastError() == 183:
            import webbrowser
            webbrowser.open('http://127.0.0.1:3000')
            sys.exit(0)

    # 2. Start server in background if not already running
    if not is_port_in_use(3000):
        server_thread = threading.Thread(target=start_server, daemon=True)
        server_thread.start()
        time.sleep(1.8)

    # 3. Create Clean Modern Studio Desktop Window
    try:
        window = webview.create_window(
            title='🎬 ស្ដេចអាទិទេព PRO STUDIO — AI Khmer Dubbing',
            url='http://127.0.0.1:3000',
            width=1440,
            height=920,
            min_size=(1100, 720),
            text_select=True,
            zoomable=True,
            background_color='#0b0f19',
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
    finally:
        if update_manager:
            update_manager.stop_auto_check()

if __name__ == '__main__':
    multiprocessing.freeze_support()
    main()
