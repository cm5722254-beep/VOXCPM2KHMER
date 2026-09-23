"""
Checkpoint & Restore System for ATITEBDABBERPRO
ប្រព័ន្ធគ្រប់គ្រង Checkpoint និង Restore Version ចាស់ៗ
"""

import os
import sys
import json
import shutil
import time
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Setup paths (handle both PyInstaller frozen EXE and python script)
if getattr(sys, 'frozen', False):
    APP_DIR = os.path.dirname(sys.executable)
    BUNDLE_DIR = getattr(sys, '_MEIPASS', APP_DIR)
else:
    APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    BUNDLE_DIR = APP_DIR

DATA_DIR = os.path.join(APP_DIR, 'data')
CHECKPOINTS_DIR = os.path.join(DATA_DIR, 'checkpoints')
MANIFEST_FILE = os.path.join(CHECKPOINTS_DIR, 'manifest.json')
VERSION_FILE = os.path.join(DATA_DIR, 'app_version.json')

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(CHECKPOINTS_DIR, exist_ok=True)


def _get_dir_size_mb(path: str) -> float:
    """Calculate total size of directory in megabytes."""
    total_bytes = 0
    if not os.path.exists(path):
        return 0.0
    for root, _, files in os.walk(path):
        for f in files:
            fp = os.path.join(root, f)
            try:
                total_bytes += os.path.getsize(fp)
            except Exception:
                pass
    return round(total_bytes / (1024 * 1024), 2)


def _count_files(path: str) -> int:
    """Count total files in directory."""
    count = 0
    if not os.path.exists(path):
        return 0
    for root, _, files in os.walk(path):
        count += len(files)
    return count


class CheckpointManager:
    """
    Manages snapshots of application frontend and backend assets:
    - public/ (compiled web UI)
    - services/ (python backend modules)
    - patches/ (hot dynamic modules)
    - data/app_version.json (version manifest)
    """

    def __init__(self):
        self._ensure_manifest()

    def _ensure_manifest(self):
        if not os.path.exists(MANIFEST_FILE):
            try:
                with open(MANIFEST_FILE, 'w', encoding='utf-8') as f:
                    json.dump([], f, ensure_ascii=False, indent=2)
            except Exception:
                pass

    def _load_manifest(self) -> List[Dict[str, Any]]:
        self._ensure_manifest()
        try:
            with open(MANIFEST_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return []

    def _save_manifest(self, items: List[Dict[str, Any]]) -> bool:
        try:
            with open(MANIFEST_FILE, 'w', encoding='utf-8') as f:
                json.dump(items, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"[Checkpoint] Error saving manifest: {e}")
            return False

    def get_current_app_version(self) -> str:
        """Read current version string from app_version.json."""
        try:
            if os.path.exists(VERSION_FILE):
                with open(VERSION_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get('current_version', 'V2.1PRO')
        except Exception:
            pass
        return 'V2.1PRO'

    def create_checkpoint(
        self,
        name: Optional[str] = None,
        cp_type: str = "manual",  # "manual" | "pre_update" | "stable"
        version: Optional[str] = None,
        note: str = ""
    ) -> Dict[str, Any]:
        """
        Creates a snapshot of the current app files.
        Returns checkpoint metadata dict.
        """
        cur_version = version or self.get_current_app_version()
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        checkpoint_id = f"cp_{timestamp}_{cp_type}_{cur_version.lower().replace('.', '_')}"

        if not name:
            if cp_type == "pre_update":
                name = f"Auto Backup មុន Update (ទៅ {cur_version})"
            else:
                name = f"Checkpoint {cur_version} ({datetime.now().strftime('%d/%m/%Y %H:%M')})"

        target_dir = os.path.join(CHECKPOINTS_DIR, checkpoint_id)
        os.makedirs(target_dir, exist_ok=True)

        copied_components = []

        # 1. Snapshot public/ (Frontend UI)
        # Priority: Check APP_DIR/public first, then BUNDLE_DIR/public
        app_public = os.path.join(APP_DIR, 'public')
        bundle_public = os.path.join(BUNDLE_DIR, 'public')
        src_public = app_public if os.path.exists(app_public) else bundle_public
        if os.path.exists(src_public):
            dst_pub = os.path.join(target_dir, 'public')
            shutil.copytree(src_public, dst_pub, dirs_exist_ok=True)
            copied_components.append('public')

        # 2. Snapshot services/ (Backend logic)
        app_services = os.path.join(APP_DIR, 'services')
        if os.path.exists(app_services):
            dst_serv = os.path.join(target_dir, 'services')
            shutil.copytree(
                app_services,
                dst_serv,
                ignore=shutil.ignore_patterns('__pycache__', '*.pyc'),
                dirs_exist_ok=True
            )
            copied_components.append('services')

        # 3. Snapshot patches/ (Dynamic hot patches)
        app_patches = os.path.join(APP_DIR, 'patches')
        if os.path.exists(app_patches):
            dst_patch = os.path.join(target_dir, 'patches')
            shutil.copytree(
                app_patches,
                dst_patch,
                ignore=shutil.ignore_patterns('__pycache__', '*.pyc'),
                dirs_exist_ok=True
            )
            copied_components.append('patches')

        # 4. Snapshot app_version.json
        if os.path.exists(VERSION_FILE):
            shutil.copy2(VERSION_FILE, os.path.join(target_dir, 'app_version.json'))
            copied_components.append('version_file')

        size_mb = _get_dir_size_mb(target_dir)
        total_files = _count_files(target_dir)

        checkpoint_meta = {
            'id': checkpoint_id,
            'name': name,
            'version': cur_version,
            'type': cp_type,
            'created_at': datetime.now().isoformat(),
            'formatted_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'size_mb': size_mb,
            'files_count': total_files,
            'components': copied_components,
            'note': note,
            'folder': target_dir
        }

        # Save to manifest
        manifest = self._load_manifest()
        # Add to beginning (newest first)
        manifest.insert(0, checkpoint_meta)
        self._save_manifest(manifest)

        print(f"[Checkpoint] Created successfully: {checkpoint_id} ({size_mb} MB, {total_files} files)")
        return checkpoint_meta

    def list_checkpoints(self) -> List[Dict[str, Any]]:
        """List all available checkpoints, newest first."""
        manifest = self._load_manifest()
        # Validate that folders actually exist
        valid_items = []
        changed = False
        for item in manifest:
            folder = item.get('folder') or os.path.join(CHECKPOINTS_DIR, item.get('id', ''))
            if os.path.exists(folder):
                item['folder'] = folder
                valid_items.append(item)
            else:
                changed = True

        if changed:
            self._save_manifest(valid_items)

        return valid_items

    def restore_checkpoint(self, checkpoint_id: str) -> Dict[str, Any]:
        """
        Restores application assets from a checkpoint:
        - Restores APP_DIR/public
        - Restores APP_DIR/services
        - Restores APP_DIR/patches
        - Restores data/app_version.json
        """
        manifest = self._load_manifest()
        target_meta = next((item for item in manifest if item['id'] == checkpoint_id), None)
        checkpoint_folder = os.path.join(CHECKPOINTS_DIR, checkpoint_id)

        if not os.path.exists(checkpoint_folder):
            raise FileNotFoundError(f"រកមិនឃើញ Folder Checkpoint នេះឡើយ: {checkpoint_id}")

        restored_components = []

        # 1. Restore public/
        cp_public = os.path.join(checkpoint_folder, 'public')
        app_public = os.path.join(APP_DIR, 'public')
        if os.path.exists(cp_public):
            if os.path.exists(app_public):
                shutil.rmtree(app_public)
            shutil.copytree(cp_public, app_public)
            restored_components.append('public')

        # 2. Restore services/
        cp_services = os.path.join(checkpoint_folder, 'services')
        app_services = os.path.join(APP_DIR, 'services')
        if os.path.exists(cp_services):
            # Only overwrite individual files to protect active logs / configs
            os.makedirs(app_services, exist_ok=True)
            for root, _, files in os.walk(cp_services):
                rel_dir = os.path.relpath(root, cp_services)
                dst_root = os.path.join(app_services, rel_dir) if rel_dir != '.' else app_services
                os.makedirs(dst_root, exist_ok=True)
                for f in files:
                    if f.endswith('.py') or f.endswith('.json') or f.endswith('.js'):
                        shutil.copy2(os.path.join(root, f), os.path.join(dst_root, f))
            restored_components.append('services')

        # 3. Restore patches/
        cp_patches = os.path.join(checkpoint_folder, 'patches')
        app_patches = os.path.join(APP_DIR, 'patches')
        if os.path.exists(cp_patches):
            if os.path.exists(app_patches):
                shutil.rmtree(app_patches)
            shutil.copytree(cp_patches, app_patches)
            restored_components.append('patches')

        # 4. Restore app_version.json
        cp_version_file = os.path.join(checkpoint_folder, 'app_version.json')
        if os.path.exists(cp_version_file):
            shutil.copy2(cp_version_file, VERSION_FILE)
            restored_components.append('version_file')

        restored_version = target_meta.get('version', 'V2.1PRO') if target_meta else self.get_current_app_version()

        print(f"[Checkpoint] Restored: {checkpoint_id} -> Version: {restored_version}")
        return {
            'success': True,
            'message': f"បាន Restore Checkpoint ជោគជ័យ! Version បច្ចុប្បន្ន: {restored_version}",
            'checkpoint_id': checkpoint_id,
            'restored_version': restored_version,
            'restored_components': restored_components
        }

    def delete_checkpoint(self, checkpoint_id: str) -> bool:
        """Delete a checkpoint folder and remove from manifest."""
        checkpoint_folder = os.path.join(CHECKPOINTS_DIR, checkpoint_id)
        if os.path.exists(checkpoint_folder):
            try:
                shutil.rmtree(checkpoint_folder)
            except Exception as e:
                print(f"Error removing checkpoint dir: {e}")

        manifest = self._load_manifest()
        manifest = [item for item in manifest if item['id'] != checkpoint_id]
        return self._save_manifest(manifest)

    def cleanup_old_checkpoints(self, keep_last_n: int = 5) -> int:
        """Keep only last N checkpoints and remove older ones."""
        manifest = self._load_manifest()
        if len(manifest) <= keep_last_n:
            return 0

        to_keep = manifest[:keep_last_n]
        to_delete = manifest[keep_last_n:]

        deleted_count = 0
        for item in to_delete:
            folder = item.get('folder') or os.path.join(CHECKPOINTS_DIR, item.get('id', ''))
            if os.path.exists(folder):
                try:
                    shutil.rmtree(folder)
                    deleted_count += 1
                except Exception:
                    pass

        self._save_manifest(to_keep)
        return deleted_count


# Global singleton instance
checkpoint_manager = CheckpointManager()
