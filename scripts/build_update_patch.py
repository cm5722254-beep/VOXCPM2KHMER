#!/usr/bin/env python3
"""
ATITEBDABBERPRO - Update Patch Builder & Release Tool
បង្កើត Update Patch ZIP និង Version Manifest សម្រាប់ទម្លាក់ Version ថ្មីទៅ App ទាំងអស់
ដោយមិនចាំបាច់ដំឡើង EXE ឡើងវិញ។
"""

import os
import sys
import json
import shutil
import zipfile
import argparse
import subprocess
from datetime import datetime

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Root workspace directory
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(ROOT_DIR, 'dist')
PUBLIC_DIR = os.path.join(ROOT_DIR, 'public')
SERVICES_DIR = os.path.join(ROOT_DIR, 'services')
PATCHES_DIR = os.path.join(ROOT_DIR, 'patches')
DATA_DIR = os.path.join(ROOT_DIR, 'data')
VERSION_FILE = os.path.join(DATA_DIR, 'app_version.json')
ROOT_VERSION_FILE = os.path.join(ROOT_DIR, 'app_version.json')


def run_cmd(cmd, cwd=ROOT_DIR):
    print(f"--> Executing: {cmd}")
    res = subprocess.run(cmd, shell=True, cwd=cwd)
    if res.returncode != 0:
        print(f"❌ Command failed with code {res.returncode}: {cmd}")
        sys.exit(res.returncode)


def build_patch(
    version: str,
    changelog: list,
    skip_build: bool = False,
    custom_download_url: str = ""
):
    print("=" * 60)
    print(f"🚀 ATITEBDABBERPRO Patch Builder: Version {version}")
    print("=" * 60)

    # 1. Compile React Frontend
    if not skip_build:
        print("\n[1/4] Compiling React Frontend (npm run build)...")
        run_cmd("npm run build")
    else:
        print("\n[1/4] Skipping React build (using existing public/)...")

    if not os.path.exists(PUBLIC_DIR) or not os.listdir(PUBLIC_DIR):
        print("❌ Error: public/ folder is missing or empty! Build failed.")
        sys.exit(1)

    # 2. Prepare output zip file in dist/
    os.makedirs(DIST_DIR, exist_ok=True)
    clean_ver = version.replace(' ', '_').replace('/', '_')
    zip_filename = f"update_patch_{clean_ver}.zip"
    zip_path = os.path.join(DIST_DIR, zip_filename)

    if os.path.exists(zip_path):
        os.remove(zip_path)

    print(f"\n[2/4] Packaging assets into {zip_filename}...")
    with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        # Add public/
        for root, _, files in os.walk(PUBLIC_DIR):
            for file in files:
                abs_f = os.path.join(root, file)
                rel_f = os.path.relpath(abs_f, ROOT_DIR)
                zf.write(abs_f, rel_f)
                
        # Add services/ (python backend code)
        if os.path.exists(SERVICES_DIR):
            for root, _, files in os.walk(SERVICES_DIR):
                if '__pycache__' in root:
                    continue
                for file in files:
                    if file.endswith('.py') or file.endswith('.json') or file.endswith('.js'):
                        abs_f = os.path.join(root, file)
                        rel_f = os.path.relpath(abs_f, ROOT_DIR)
                        zf.write(abs_f, rel_f)

        # Add patches/ if exists
        if os.path.exists(PATCHES_DIR):
            for root, _, files in os.walk(PATCHES_DIR):
                if '__pycache__' in root:
                    continue
                for file in files:
                    abs_f = os.path.join(root, file)
                    rel_f = os.path.relpath(abs_f, ROOT_DIR)
                    zf.write(abs_f, rel_f)

    patch_size_bytes = os.path.getsize(zip_path)
    patch_size_mb = round(patch_size_bytes / (1024 * 1024), 2)
    print(f"      Bundle created: {zip_path} ({patch_size_mb} MB)")

    # 3. Create app_version.json manifest
    print("\n[3/4] Updating Version Manifests...")
    default_download_url = custom_download_url or f"https://github.com/mazercheat-dotcom/animeducksystem/releases/download/{version}/{zip_filename}"

    manifest = {
        "current_version": version,
        "latest_version": version,
        "has_update": True,
        "release_date": datetime.now().strftime('%Y-%m-%d'),
        "download_url": default_download_url,
        "patch_size_mb": patch_size_mb,
        "changelog": changelog or [
            {"type": "NEW", "text": f"{version} Feature Update"},
            {"type": "IMPROVED", "text": "Enhanced performance and stability"},
            {"type": "FIXED", "text": "System bug fixes and optimizations"}
        ]
    }

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(VERSION_FILE, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    with open(ROOT_VERSION_FILE, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"      Saved: {VERSION_FILE}")
    print(f"      Saved: {ROOT_VERSION_FILE}")

    # 4. Instructions for publishing
    print("\n" + "=" * 60)
    print(f"🎉 PATCH READY: {zip_filename} ({patch_size_mb} MB)")
    print("=" * 60)
    print("\nជំហានបន្ទាប់ដើម្បីទម្លាក់ Update ទៅកាន់ Users ទាំងអស់៖")
    print("------------------------------------------------------------")
    print(f"1. បង្កើត GitHub Release (Tag: {version}):")
    print(f"   Upload ឯកសារ: {zip_path}")
    print(f"2. Push កូដ និង Version file ទៅ GitHub:")
    print("   git add data/app_version.json app_version.json")
    print(f"   git commit -m \"Release update {version}\"")
    print("   git push origin main")
    print("3. នៅពេល Users បើក App EXE គ្រប់កុំព្យូទ័រ វានឹង Check ឃើញ")
    print(f"   ហើយបង្ហាញ Badge 'Update {version}' ភ្លាមៗ!")
    print("=" * 60 + "\n")


def main():
    parser = argparse.ArgumentParser(description="ATITEBDABBERPRO In-App Patch Builder")
    parser.add_argument('--version', '-v', type=str, default='V2.2PRO', help="Version code (e.g. V2.2PRO)")
    parser.add_argument('--skip-build', action='store_true', help="Skip npm run build")
    parser.add_argument('--url', type=str, default='', help="Custom download URL for the patch zip")
    parser.add_argument('--changelog', type=str, default='', help="JSON array of changelog items")
    args = parser.parse_args()

    changelog_items = []
    if args.changelog:
        try:
            changelog_items = json.loads(args.changelog)
        except Exception:
            changelog_items = [{"type": "NEW", "text": args.changelog}]

    build_patch(
        version=args.version,
        changelog=changelog_items,
        skip_build=args.skip_build,
        custom_download_url=args.url
    )


if __name__ == '__main__':
    main()
