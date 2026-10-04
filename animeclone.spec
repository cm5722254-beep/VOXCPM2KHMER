# -*- mode: python ; coding: utf-8 -*-
# =============================================================================
#  កូននាគសម្រាយរឿង — PyInstaller Build Spec (Single Standalone Executable)
#  App Name : កូននាគសម្រាយរឿង (KounNeak SamraiRoeung)
#  ✅ Bundles ALL libraries & dependencies
#  ✅ Supports Windows 7 / 8 / 10 / 11 (x64)
#  Produces: dist/KounNeak_SamraiRoeung.exe
# =============================================================================
import os, sys
from PyInstaller.utils.hooks import collect_submodules, collect_data_files

block_cipher = None

HERE = os.path.abspath(os.path.dirname(SPEC))

# ─── DATA FILES / ASSETS ─────────────────────────────────────────────────────
datas = []

# Core asset directories
for dir_name in ['public', 'services', 'samples', 'data', 'patches', 'updates']:
    full = os.path.join(HERE, dir_name)
    if os.path.exists(full):
        datas.append((full, dir_name))

# Individual files
for extra_file, target_dir in [
    ('extracted_characters.json', '.'),
    ('.env',                       '.'),
    ('app_icon.ico',               '.'),
    ('update_config.json',         '.'),
    ('app_version.json',           '.'),
    ('server.py',                  '.'),
    ('license_manager.py',         '.'),
    (os.path.join('bin', 'ffmpeg.exe'),   'bin'),
    (os.path.join('bin', 'ffprobe.exe'),  'bin'),
]:
    full_path = os.path.join(HERE, extra_file)
    if os.path.exists(full_path):
        datas.append((full_path, target_dir))

# Library data files
for lib in ['edge_tts', 'certifi', 'httpx', 'pydantic', 'fastapi',
            'starlette', 'uvicorn', 'webview', 'psutil']:
    try:
        datas += collect_data_files(lib, include_py_files=False)
    except Exception:
        pass

try:
    datas += collect_data_files('google.genai', include_py_files=False)
except Exception:
    pass

# ─── HIDDEN IMPORTS ──────────────────────────────────────────────────────────
hiddenimports = [
    # Uvicorn full stack
    'uvicorn', 'uvicorn.main', 'uvicorn.config', 'uvicorn.logging',
    'uvicorn.lifespan', 'uvicorn.lifespan.on', 'uvicorn.lifespan.off',
    'uvicorn.protocols', 'uvicorn.protocols.utils',
    'uvicorn.protocols.http', 'uvicorn.protocols.http.h11_impl',
    'uvicorn.protocols.http.httptools_impl',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.websockets_impl',
    'uvicorn.protocols.websockets.wsproto_impl',
    'uvicorn.loops', 'uvicorn.loops.asyncio', 'uvicorn.loops.uvloop',
    'uvicorn.middleware', 'uvicorn.middleware.proxy_headers',
    'uvicorn.middleware.message_logger',
    # FastAPI / Starlette
    'fastapi', 'fastapi.middleware', 'fastapi.middleware.cors',
    'fastapi.responses', 'fastapi.staticfiles', 'fastapi.templating',
    'fastapi.security', 'fastapi.security.oauth2',
    'fastapi.background', 'fastapi.routing',
    'starlette', 'starlette.responses', 'starlette.staticfiles',
    'starlette.middleware', 'starlette.middleware.cors',
    'starlette.middleware.base', 'starlette.requests',
    'starlette.routing', 'starlette.applications', 'starlette.background',
    'starlette.websockets', 'starlette.testclient',
    # PyWebView / WebView2
    'webview', 'webview.platforms', 'webview.platforms.winforms',
    'webview.platforms.edgechromium', 'webview.platforms.gtk',
    'webview.platforms.cocoa', 'webview.platforms.qt',
    'webview.dom', 'webview.event', 'webview.screen',
    # Edge TTS
    'edge_tts', 'edge_tts.communicate', 'edge_tts.list_voices',
    'edge_tts.models', 'edge_tts.exceptions',
    # HTTP / Networking
    'httpx', 'httpx._transports', 'httpx._transports.default',
    'httpx._transports.asgi', 'httpx._transports.wsgi',
    'httpx._client', 'httpx._config', 'httpx._exceptions',
    'requests', 'requests.adapters', 'requests.auth',
    'requests.cookies', 'requests.exceptions', 'requests.models',
    'requests.sessions', 'requests.utils',
    'urllib3', 'urllib3.contrib', 'urllib3.util',
    'urllib3.util.retry', 'urllib3.util.ssl_',
    'charset_normalizer', 'certifi', 'idna',
    # Async
    'anyio', 'anyio._backends', 'anyio._backends._asyncio',
    'anyio._backends._trio', 'anyio.streams',
    'asyncio', 'asyncio.events', 'asyncio.tasks', 'asyncio.queues',
    'aiofiles', 'aiofiles.threadpool', 'aiofiles.os',
    # Pydantic
    'pydantic', 'pydantic_core',
    'pydantic.fields', 'pydantic.validators',
    # Google GenAI
    'google', 'google.genai', 'google.genai.types',
    'google.genai.client', 'google.genai.models',
    'google.auth', 'google.auth.credentials',
    # PIL / Pillow
    'PIL', 'PIL.Image', 'PIL.ImageDraw', 'PIL.ImageFont',
    'PIL.ImageFilter', 'PIL.ImageOps', 'PIL.ImageColor',
    # Multipart / Forms
    'multipart', 'python_multipart',
    # Env / Config
    'dotenv', 'python_dotenv',
    # Standard Library extras
    'sqlite3', 'json', 'asyncio', 'threading', 'multiprocessing',
    'email', 'email.mime', 'email.mime.text', 'email.mime.multipart',
    'email.mime.base', 'email.encoders',
    'importlib', 'importlib.util', 'importlib.metadata',
    'ctypes', 'ctypes.util', 'ctypes.wintypes',
    'webbrowser', 'base64', 'hashlib', 'hmac',
    'pathlib', 'shutil', 'tempfile', 'uuid',
    'logging', 'logging.handlers',
    'subprocess', 'signal', 'queue', 'socket',
    'ssl', 'http', 'http.client',
    'zipfile', 'tarfile', 'gzip', 'zlib',
    'io', 'copy', 'functools', 'itertools',
    'collections', 'collections.abc',
    'typing', 'typing_extensions',
    'concurrent', 'concurrent.futures',
    'contextlib', 'abc', 'weakref',
    # System Info
    'psutil',
    # h11 / httptools (async HTTP)
    'h11', 'h11._events', 'h11._readers', 'h11._writers',
    'httptools', 'httptools.parser',
    'websockets', 'websockets.client', 'websockets.server',
    'websockets.connection', 'websockets.frames',
    'wsproto', 'wsproto.connection', 'wsproto.frame_protocol',
    # Services (local modules)
    'services', 'services.auth_db', 'services.supabase_db',
    'services.audio_processor', 'services.khmer_dubber',
    'services.elevenlabs_service', 'services.update_manager',
    'services.module_loader', 'services.machine_id',
    'services.unified_db', 'services.auto_updater',
    'services.progress_tracker', 'services.checkpoint_manager',
    'services.video_cutter_service', 'services.vocal_separator',
]

# Auto-collect all submodules
for mod in ['uvicorn', 'starlette', 'fastapi', 'services', 'edge_tts',
            'httpx', 'pydantic', 'anyio', 'aiofiles', 'requests',
            'urllib3', 'google', 'psutil', 'webview', 'PIL',
            'certifi', 'charset_normalizer', 'h11', 'websockets', 'wsproto']:
    try:
        hiddenimports += collect_submodules(mod)
    except Exception:
        pass

# Optional heavy ML libraries (demucs audio separation)
for mod in ['demucs', 'julius', 'torchaudio', 'tqdm', 'soundfile', 'librosa']:
    try:
        hiddenimports += collect_submodules(mod)
    except Exception:
        pass

# Deduplicate
hiddenimports = list(set(hiddenimports))

# ─── ANALYSIS ────────────────────────────────────────────────────────────────
a = Analysis(
    [os.path.join(HERE, 'desktop_app.py')],
    pathex=[HERE, os.path.join(HERE, 'services')],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'matplotlib', 'IPython', 'notebook', 'jupyter',
        'tkinter', 'PyQt5', 'PyQt6', 'wx', 'cv2',
        'tensorflow', 'keras', 'pandas', 'sklearn',
        '_pytest', 'pytest',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

# ─── EXE ─────────────────────────────────────────────────────────────────────
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='KounNeak_SamraiRoeung',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=os.path.join(HERE, 'app_icon.ico') if os.path.exists(os.path.join(HERE, 'app_icon.ico')) else None,
)


