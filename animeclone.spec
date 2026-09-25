# -*- mode: python ; coding: utf-8 -*-
# =============================================================================
#  ATITEBDABBERPRO — PyInstaller Build Spec (Single Standalone Executable)
#  Produces a single self-contained: dist/ATITEBDABBERPRO.exe
# =============================================================================
import os, sys
from PyInstaller.utils.hooks import collect_submodules, collect_data_files

block_cipher = None

HERE = os.path.abspath(os.path.dirname(SPEC))

datas = [
    (os.path.join(HERE, 'public'),                    'public'),
    (os.path.join(HERE, 'bin', 'ffmpeg.exe'),         'bin'),
    (os.path.join(HERE, 'bin', 'ffprobe.exe'),        'bin'),
    (os.path.join(HERE, 'services'),                  'services'),
    (os.path.join(HERE, 'samples'),                   'samples'),
    (os.path.join(HERE, 'data'),                      'data'),
    (os.path.join(HERE, 'extracted_characters.json'), '.'),
    (os.path.join(HERE, '.env'),                      '.'),
    (os.path.join(HERE, 'app_icon.ico'),              '.'),
    # Auto-Update System files
    (os.path.join(HERE, 'update_config.json'),        '.'),
    (os.path.join(HERE, 'app_version.json'),          '.'),
    (os.path.join(HERE, 'updates'),                   'updates'),
]

datas += collect_data_files('edge_tts', include_py_files=False)
datas += collect_data_files('certifi')

hiddenimports = [
    'uvicorn', 'uvicorn.main', 'uvicorn.config', 'uvicorn.logging',
    'uvicorn.lifespan', 'uvicorn.lifespan.on', 'uvicorn.protocols',
    'uvicorn.protocols.http', 'uvicorn.protocols.http.h11_impl',
    'uvicorn.protocols.http.httptools_impl',
    'uvicorn.protocols.websockets', 'uvicorn.protocols.websockets.websockets_impl',
    'uvicorn.protocols.websockets.wsproto_impl',
    'uvicorn.loops', 'uvicorn.loops.asyncio', 'uvicorn.loops.uvloop',
    'fastapi', 'fastapi.middleware', 'fastapi.middleware.cors',
    'starlette', 'starlette.responses', 'starlette.staticfiles',
    'starlette.middleware', 'starlette.middleware.cors',
    'webview', 'webview.platforms', 'webview.platforms.winforms',
    'webview.platforms.edgechromium',
    'edge_tts', 'edge_tts.communicate',
    'httpx', 'httpx._transports', 'httpx._transports.default',
    'anyio', 'anyio._backends', 'anyio._backends._asyncio',
    'PIL', 'PIL.Image', 'PIL.ImageDraw', 'PIL.ImageFont',
    'google', 'google.genai',
    'multipart', 'python_multipart',
    'aiofiles', 'dotenv', 'python_dotenv',
    'sqlite3', 'json', 'asyncio', 'threading',
    'email', 'email.mime', 'email.mime.text',
    'services', 'services.auth_db', 'services.supabase_db',
    'services.audio_processor', 'services.khmer_dubber',
    'services.elevenlabs_service',
    # Auto-Update System
    'services.update_manager', 'services.module_loader',
    'importlib', 'importlib.util',
]

hiddenimports += collect_submodules('uvicorn')
hiddenimports += collect_submodules('starlette')
hiddenimports += collect_submodules('fastapi')

a = Analysis(
    [os.path.join(HERE, 'desktop_app.py')],
    pathex=[HERE],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'matplotlib', 'scipy', 'sklearn',
        'IPython', 'notebook', 'jupyter',
        'tkinter', 'PyQt5', 'PyQt6', 'wx', 'cv2',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='SDACH_ATITEB_PRO',
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
    icon=os.path.join(HERE, 'app_icon.ico'),
)


