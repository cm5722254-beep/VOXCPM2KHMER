"""
clean_project.py - Professional Cleaner for Dragon Dabber Pro (VOXCPM2KHMER)
Cleans intermediate slices, caches, logs, and temp files to keep the project
lightweight and ready for high-performance builds without bloat.
"""

import os
import sys
import shutil
import glob

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUTS_DIR = os.path.join(BASE_DIR, 'outputs')
BUILD_DIR = os.path.join(BASE_DIR, 'build')
DIST_DIR = os.path.join(BASE_DIR, 'dist')
ARCHIVE_BUILDS_DIR = os.path.join(BASE_DIR, 'archive_builds')

def log(msg):
    print(f"🧹 {msg}")

def clean_pycache():
    removed_count = 0
    for root, dirs, files in os.walk(BASE_DIR):
        if '__pycache__' in dirs:
            pycache_path = os.path.join(root, '__pycache__')
            try:
                shutil.rmtree(pycache_path, ignore_errors=True)
                removed_count += 1
            except Exception:
                pass
    log(f"Removed {removed_count} __pycache__ directories.")

def clean_stray_root_files():
    stray_files = [
        '6.0.0',
        'test_gemini_audio.js',
        'theme-test.html',
        'fix_snakes.js',
        'fix_light_mode.js',
        'apply_dark_mode.js',
        'update_theme.js',
    ]
    cleaned = 0
    for f in stray_files:
        p = os.path.join(BASE_DIR, f)
        if os.path.exists(p):
            try:
                os.remove(p)
                cleaned += 1
            except Exception as e:
                print(f"  Notice {f}: {e}")
    log(f"Removed {cleaned} obsolete root test/patch files.")

def archive_old_root_exes():
    os.makedirs(ARCHIVE_BUILDS_DIR, exist_ok=True)
    moved = 0
    for exe in ['KounNeak_SamraiRoeung.exe', 'SDACH_ATITEB_PRO.exe']:
        src = os.path.join(BASE_DIR, exe)
        if os.path.exists(src):
            dst = os.path.join(ARCHIVE_BUILDS_DIR, exe)
            try:
                shutil.move(src, dst)
                moved += 1
                size_mb = os.path.getsize(dst) / (1024 * 1024)
                log(f"Moved {exe} ({size_mb:.1f} MB) -> archive_builds/{exe}")
            except Exception as e:
                print(f"  Notice moving {exe}: {e}")
    if moved == 0:
        log("No giant exes in root to archive.")

def clean_temp_outputs():
    if not os.path.exists(OUTPUTS_DIR):
        return
    
    freed_bytes = 0
    file_count = 0
    patterns = [
        'temp_segment_*.wav',
        'fitted_py_*.wav',
        'fitted_slow_py_*.wav',
        'auto_studio_line_py_*.wav',
        'line_*_char_*.wav',
        'line_*_speaker_*.wav',
        'dialogue_master_*.wav',
        'custom_master_dialogue_py_*.wav',
    ]
    
    for pat in patterns:
        for f in glob.glob(os.path.join(OUTPUTS_DIR, pat)):
            try:
                sz = os.path.getsize(f)
                os.remove(f)
                freed_bytes += sz
                file_count += 1
            except Exception:
                pass

    # Clean temporary chunk directories
    for d in glob.glob(os.path.join(OUTPUTS_DIR, 'chunks_py_*')):
        try:
            shutil.rmtree(d, ignore_errors=True)
            file_count += 1
        except Exception:
            pass

    freed_mb = freed_bytes / (1024 * 1024)
    log(f"Cleaned {file_count} temporary audio slice files ({freed_mb:.1f} MB freed) in outputs/.")

def clean_build_artifacts():
    if os.path.exists(BUILD_DIR):
        try:
            shutil.rmtree(BUILD_DIR, ignore_errors=True)
            log("Removed build/ directory.")
        except Exception:
            pass

def clean_logs_and_tmps():
    count = 0
    for root, dirs, files in os.walk(BASE_DIR):
        # Do not scan inside .venv or node_modules
        if '.venv' in root or 'node_modules' in root or '.git' in root:
            continue
        for f in files:
            if f.endswith('.log') or f.endswith('.tmp') or f.startswith('temp_'):
                try:
                    os.remove(os.path.join(root, f))
                    count += 1
                except Exception:
                    pass
    log(f"Cleaned {count} .log and .tmp files.")

def main():
    print("=" * 65)
    print("🐉 DRAGON DABBER PRO - PROJECT DEEP CLEANER")
    print("=" * 65)
    clean_stray_root_files()
    archive_old_root_exes()
    clean_temp_outputs()
    clean_build_artifacts()
    clean_pycache()
    clean_logs_and_tmps()
    print("=" * 65)
    print("✨ CLEANUP COMPLETE! Project is lightweight & ready for clean EXE build.")
    print("=" * 65)

if __name__ == '__main__':
    main()
