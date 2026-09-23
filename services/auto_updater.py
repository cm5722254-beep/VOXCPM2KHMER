"""
Auto-Update System for ATITEBDABBERPRO
ទម្លាក់ Version ថ្មីដោយស្វ័យប្រវត្តិ និង In-App Hot Update ដោយមិនចាំបាច់ដំឡើង EXE ថ្មី
"""

import os
import sys
import json
import shutil
import zipfile
import tempfile
import urllib.request
from datetime import datetime
from typing import Optional, Dict, Any, List

import requests

from services.checkpoint_manager import checkpoint_manager

# Setup paths (handle both PyInstaller frozen EXE and python script)
if getattr(sys, 'frozen', False):
    APP_DIR = os.path.dirname(sys.executable)
    BUNDLE_DIR = getattr(sys, '_MEIPASS', APP_DIR)
else:
    APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    BUNDLE_DIR = APP_DIR

DATA_DIR = os.path.join(APP_DIR, 'data')
VERSION_FILE = os.path.join(DATA_DIR, 'app_version.json')
UPDATE_TEMP_DIR = os.path.join(DATA_DIR, 'updates')

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPDATE_TEMP_DIR, exist_ok=True)

# Default GitHub Raw and Repository configuration
GITHUB_RAW_VERSION_URL = os.getenv(
    'UPDATE_GITHUB_URL',
    'https://raw.githubusercontent.com/mazercheat-dotcom/animeducksystem/main/data/app_version.json'
)
GITHUB_RAW_ROOT_URL = 'https://raw.githubusercontent.com/mazercheat-dotcom/animeducksystem/main/app_version.json'


class AutoUpdater:
    """
    Auto-Update Engine:
    - Checks remote version from GitHub, Supabase, or Custom Server
    - Downloads patch ZIP safely
    - Automatically creates safety Checkpoints prior to updating
    - Extracts & hot-applies updates to public/, services/, patches/
    - Restores checkpoint automatically on failure
    """

    def __init__(self):
        self.update_server_url = os.getenv('UPDATE_SERVER_URL', '').rstrip('/')
        self.last_checked_info: Optional[Dict[str, Any]] = None

    def get_local_version_info(self) -> Dict[str, Any]:
        """Get current local version info from data/app_version.json."""
        default_info = {
            "current_version": "V2.1PRO",
            "latest_version": "V2.1PRO",
            "has_update": False,
            "release_date": datetime.now().strftime('%Y-%m-%d'),
            "download_url": "",
            "patch_size_mb": 0.0,
            "changelog": [
                {"type": "NEW", "text": "In-App Auto-Update & Checkpoint / Restore System"},
                {"type": "IMPROVED", "text": "Hot-Patch UI & Services without EXE reinstallation"}
            ]
        }
        if os.path.exists(VERSION_FILE):
            try:
                with open(VERSION_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    default_info.update(data)
                    return default_info
            except Exception:
                pass
        return default_info

    def check_for_updates(self, force_remote: bool = True) -> Dict[str, Any]:
        """
        Check for updates across multi-channels:
        1. Custom UPDATE_SERVER_URL (if provided)
        2. GitHub Raw JSON (zero-config remote broadcast)
        3. Supabase Database app_versions table (if configured)
        4. Local fallback
        """
        local_info = self.get_local_version_info()
        cur_version = local_info.get('current_version', 'V2.1PRO')

        remote_info = None

        if force_remote:
            # 1. Try Custom Update Server
            if self.update_server_url:
                try:
                    resp = requests.get(f"{self.update_server_url}/api/system/version", timeout=5)
                    if resp.status_code == 200:
                        remote_info = resp.json()
                except Exception as e:
                    print(f"[AutoUpdate] Custom server check skipped: {e}")

            # 2. Try GitHub Raw Manifest
            if not remote_info:
                remote_info = self._check_github_version()

            # 3. Try Supabase
            if not remote_info:
                remote_info = self._check_supabase_version()

        if remote_info:
            latest_version = remote_info.get('latest_version') or remote_info.get('version_code') or cur_version
            has_update = bool(latest_version and latest_version != cur_version)
            
            merged = {
                'current_version': cur_version,
                'latest_version': latest_version,
                'has_update': has_update,
                'release_date': remote_info.get('release_date', local_info.get('release_date')),
                'download_url': remote_info.get('download_url', ''),
                'patch_size_mb': remote_info.get('patch_size_mb', 0.0),
                'changelog': remote_info.get('changelog', local_info.get('changelog', [])),
                'source': remote_info.get('source', 'remote')
            }
            self.last_checked_info = merged
            # Cache latest_version info in local version file for fast UI load
            if has_update:
                try:
                    local_info.update(merged)
                    with open(VERSION_FILE, 'w', encoding='utf-8') as f:
                        json.dump(local_info, f, ensure_ascii=False, indent=2)
                except Exception:
                    pass
            return merged

        # Fallback to local manifest
        has_update = local_info.get('current_version') != local_info.get('latest_version')
        local_info['has_update'] = has_update
        return local_info

    def _check_github_version(self) -> Optional[Dict[str, Any]]:
        """Fetch remote version metadata from GitHub."""
        urls = [GITHUB_RAW_VERSION_URL, GITHUB_RAW_ROOT_URL]
        for url in urls:
            try:
                headers = {'User-Agent': 'ATITEBDABBER-PRO-Updater/2.0'}
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=6) as response:
                    if response.status == 200:
                        data = json.loads(response.read().decode('utf-8'))
                        data['source'] = 'github'
                        return data
            except Exception:
                continue
        return None

    def _check_supabase_version(self) -> Optional[Dict[str, Any]]:
        """Fetch latest version from Supabase if enabled."""
        try:
            from services import supabase_db
            if not supabase_db.is_supabase_enabled():
                return None
            records = supabase_db.sb_get('app_versions', {'order': 'release_date.desc', 'limit': '1'})
            if records and len(records) > 0:
                row = records[0]
                return {
                    'latest_version': row.get('version_code', 'V2.1PRO'),
                    'release_date': row.get('release_date'),
                    'changelog': row.get('changelog', []),
                    'download_url': row.get('download_url'),
                    'patch_size_mb': row.get('patch_size_mb', 0),
                    'source': 'supabase'
                }
        except Exception:
            pass
        return None

    def download_patch(self, download_url: str, progress_callback=None) -> str:
        """Download patch zip file to temporary folder."""
        timestamp = int(datetime.now().timestamp())
        zip_path = os.path.join(UPDATE_TEMP_DIR, f"patch_{timestamp}.zip")

        headers = {'User-Agent': 'ATITEBDABBER-PRO-Updater/2.0'}
        with requests.get(download_url, headers=headers, stream=True, timeout=90) as r:
            r.raise_for_status()
            total_length = int(r.headers.get('content-length', 0))
            downloaded = 0
            with open(zip_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=16384):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        if progress_callback and total_length > 0:
                            percent = int((downloaded / total_length) * 100)
                            progress_callback(percent)

        if not os.path.exists(zip_path) or os.path.getsize(zip_path) < 100:
            raise ValueError("ឯកសារ Update ដែលទាញយកមកទទេ ឬខូច!")
        return zip_path

    def apply_update_from_zip(
        self,
        zip_path: str,
        target_version: Optional[str] = None,
        changelog: Optional[List[Dict[str, str]]] = None,
        progress_callback=None
    ) -> Dict[str, Any]:
        """
        Extract and apply update from zip file:
        1. Auto-create pre-update safety checkpoint
        2. Extract & copy public/, services/, patches/, data/
        3. Update local app_version.json
        4. Auto-rollback if any step fails
        """
        local_info = self.get_local_version_info()
        cur_version = local_info.get('current_version', 'V2.1PRO')
        new_version = target_version or local_info.get('latest_version') or cur_version

        # 1. Create Pre-Update Checkpoint
        if progress_callback:
            progress_callback(15, "កំពុងបង្កើត Checkpoint Backup សុវត្ថិភាព...")
        
        pre_checkpoint = checkpoint_manager.create_checkpoint(
            name=f"Auto Backup មុន Update (ទៅ {new_version})",
            cp_type="pre_update",
            version=cur_version,
            note=f"Automatic safety checkpoint before installing {new_version}"
        )
        pre_checkpoint_id = pre_checkpoint['id']

        extract_dir = os.path.join(UPDATE_TEMP_DIR, f"extract_{int(datetime.now().timestamp())}")
        os.makedirs(extract_dir, exist_ok=True)

        updated_dirs = []

        try:
            if progress_callback:
                progress_callback(35, "កំពុងពន្លាឯកសារ Update Package...")

            with zipfile.ZipFile(zip_path, 'r') as zf:
                zf.extractall(extract_dir)

            # Check if root is nested (e.g. folder inside zip)
            entries = os.listdir(extract_dir)
            content_root = extract_dir
            if len(entries) == 1 and os.path.isdir(os.path.join(extract_dir, entries[0])):
                # Only collapse if the inner folder is not named public or services
                if entries[0] not in ['public', 'services', 'patches', 'data']:
                    content_root = os.path.join(extract_dir, entries[0])

            if progress_callback:
                progress_callback(60, "កំពុងដំឡើង UI & Frontend Components...")

            # 2. Update public/ (React frontend)
            pub_src = os.path.join(content_root, 'public')
            pub_dst = os.path.join(APP_DIR, 'public')
            if os.path.exists(pub_src):
                if os.path.exists(pub_dst):
                    shutil.rmtree(pub_dst)
                shutil.copytree(pub_src, pub_dst)
                updated_dirs.append('public')
                print(f"[AutoUpdate] Installed new frontend into {pub_dst}")

            if progress_callback:
                progress_callback(75, "កំពុងដំឡើង Services & Backend Engines...")

            # 3. Update services/ (Python backend modules)
            serv_src = os.path.join(content_root, 'services')
            serv_dst = os.path.join(APP_DIR, 'services')
            if os.path.exists(serv_src):
                os.makedirs(serv_dst, exist_ok=True)
                for item in os.listdir(serv_src):
                    if item == '__pycache__':
                        continue
                    s = os.path.join(serv_src, item)
                    d = os.path.join(serv_dst, item)
                    if os.path.isfile(s):
                        shutil.copy2(s, d)
                    elif os.path.isdir(s):
                        if os.path.exists(d):
                            shutil.rmtree(d)
                        shutil.copytree(s, d)
                updated_dirs.append('services')

            # 4. Update patches/ (Hot modules & routes)
            patch_src = os.path.join(content_root, 'patches')
            patch_dst = os.path.join(APP_DIR, 'patches')
            if os.path.exists(patch_src):
                if os.path.exists(patch_dst):
                    shutil.rmtree(patch_dst)
                shutil.copytree(patch_src, patch_dst)
                updated_dirs.append('patches')

            # 5. Update data/ non-database files
            data_src = os.path.join(content_root, 'data')
            if os.path.exists(data_src):
                for item in os.listdir(data_src):
                    # Never overwrite SQLite databases or active user checkpoints
                    if item in ['studio_auth.db', 'unified_studio.db', 'checkpoints', 'updates']:
                        continue
                    s = os.path.join(data_src, item)
                    d = os.path.join(DATA_DIR, item)
                    if os.path.isfile(s):
                        shutil.copy2(s, d)

            # Check if an embedded app_version.json exists in package
            pkg_version_file = os.path.join(content_root, 'app_version.json')
            if not os.path.exists(pkg_version_file):
                pkg_version_file = os.path.join(content_root, 'data', 'app_version.json')

            final_changelog = changelog
            if os.path.exists(pkg_version_file):
                try:
                    with open(pkg_version_file, 'r', encoding='utf-8') as f:
                        meta = json.load(f)
                        if not target_version:
                            new_version = meta.get('latest_version') or meta.get('current_version') or new_version
                        if not final_changelog:
                            final_changelog = meta.get('changelog')
                except Exception:
                    pass

            if progress_callback:
                progress_callback(90, "កំពុងធ្វើបច្ចុប្បន្នភាព Version...")

            # 6. Save final app_version.json
            updated_info = {
                'current_version': new_version,
                'latest_version': new_version,
                'has_update': False,
                'release_date': datetime.now().strftime('%Y-%m-%d'),
                'download_url': '',
                'patch_size_mb': round(os.path.getsize(zip_path) / (1024 * 1024), 2),
                'changelog': final_changelog or local_info.get('changelog', []),
                'applied_at': datetime.now().isoformat()
            }
            with open(VERSION_FILE, 'w', encoding='utf-8') as f:
                json.dump(updated_info, f, ensure_ascii=False, indent=2)

            # Cleanup extract temp
            shutil.rmtree(extract_dir, ignore_errors=True)
            checkpoint_manager.cleanup_old_checkpoints(keep_last_n=5)

            if progress_callback:
                progress_callback(100, f"✅ បាន Update ទៅ {new_version} ជោគជ័យ!")

            return {
                'success': True,
                'message': f"បានធ្វើបច្ចុប្បន្នភាពទៅ {new_version} ជោគជ័យ! (Updated: {', '.join(updated_dirs)})",
                'new_version': new_version,
                'pre_checkpoint_id': pre_checkpoint_id,
                'updated_components': updated_dirs
            }

        except Exception as e:
            print(f"[AutoUpdate] Error during update apply: {e}. Initiating auto-rollback...")
            # Auto-rollback from pre-update checkpoint
            try:
                checkpoint_manager.restore_checkpoint(pre_checkpoint_id)
                print(f"[AutoUpdate] Auto-rollback to {cur_version} successful.")
            except Exception as rollback_err:
                print(f"[AutoUpdate] Auto-rollback failed: {rollback_err}")

            shutil.rmtree(extract_dir, ignore_errors=True)
            raise RuntimeError(f"ការ Update បរាជ័យ: {str(e)} (បានស្តារ Checkpoint មុនមកវិញ)")


# Global singleton instance
auto_updater = AutoUpdater()
