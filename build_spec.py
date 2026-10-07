# -*- mode: python ; coding: utf-8 -*-
# =============================================================================
#  🐉 DRAGON DABBER PRO — PyInstaller Build Spec (Universal Windows Support)
#  Optimized for Windows 7 / 8 / 10 / 11 (32-bit & 64-bit)
# =============================================================================
import os
import sys
from PyInstaller.utils.hooks import collect_submodules, collect_data_files

block_cipher = None
HERE = os.path.abspath(os.path.dirname(__file__))

# ─── DATA FILES ──────────────────────────────────────────────────────────────
datas = []

# Core asset directories
for dir_name in ['public', 'services', 'data', 'patches']:
    full = os.path.join(HERE, dir_name)
    if os.path.exists(full):
        datas.append((full, dir_name))

# Individual files
for extra_file, target_dir in [
    ('extracted_characters.json', '.'),
    ('.env', '.'),
    ('app_icon.ico', '.'),
    ('update_config.json', '.'),
    ('app_version.json', '.'),
    ('server.py', '.'),
    ('license_manager.py', '.'),
    (os.path.join('bin', 'ffmpeg.exe'), 'bin'),
]:
    full_path = os.path.join(HERE, extra_file)
    if os.path.exists(full_path):
        datas.append((full_path, target_dir))

# Library data files
for lib in ['edge_tts', 'certifi', 'httpx', 'pydantic', 'fastapi', 'starlette', 'uvicorn', 'webview']:
    try:
        datas += collect_data_files(lib, include_py_files=False)
    except Exception:
        pass

# ─── HIDDEN IMPORTS ──────────────────────────────────────────────────────────
hiddenimports = [
    'uvicorn', 'uvicorn.main', 'uvicorn.logging', 'uvicorn.protocols.http.h11_impl',
    'fastapi', 'fastapi.middleware.cors', 'starlette', 'starlette.staticfiles',
    'webview', 'webview.platforms.edgechromium',
    'edge_tts', 'httpx', 'pydantic', 'psutil',
    'services', 'services.audio_processor', 'services.khmer_dubber',
]

# Auto-collect submodules
for mod in ['uvicorn', 'starlette', 'fastapi', 'services', 'edge_tts', 'httpx', 'pydantic', 'webview']:
    try:
        hiddenimports += collect_submodules(mod)
    except Exception:
        pass

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
    excludes=['matplotlib', 'IPython', 'notebook', 'tkinter', 'PyQt5', 'cv2'],
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
    name='DragonDabberPro',
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
