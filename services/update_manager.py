"""
🔄 Auto-Update Manager
======================
Manages automatic updates for features and modules without requiring EXE reinstallation.
"""

import os
import sys
import json
import hashlib
import requests
import threading
import time
import shutil
from pathlib import Path
from typing import Dict, List, Optional, Callable
from datetime import datetime, timezone


class UpdateManager:
    """Handles automatic updates for app modules and features."""
    
    def __init__(self, base_dir: str = None):
        self.base_dir = Path(base_dir or os.getcwd())
        self.config_file = self.base_dir / "update_config.json"
        self.version_file = self.base_dir / "app_version.json"
        self.updates_dir = self.base_dir / "updates"
        self.backup_dir = self.base_dir / "backups"
        self.patches_dir = self.base_dir / "patches"
        self.services_dir = self.base_dir / "services"
        
        # Create necessary directories
        for d in [self.updates_dir, self.backup_dir, self.patches_dir, self.services_dir]:
            d.mkdir(exist_ok=True)
        
        self.config = self._load_config()
        self.version_info = self._load_version_info()
        self.update_callbacks: List[Callable] = []
        self.is_checking = False
        self.is_downloading = False
        self.download_progress = 0.0
        self._auto_check_thread: Optional[threading.Thread] = None
        self._stop_auto_check = threading.Event()
    
    def _load_config(self) -> Dict:
        """Load update configuration."""
        if self.config_file.exists():
            with open(self.config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {
            "update_server": "https://raw.githubusercontent.com/mazercheat-dotcom/animeducksystem/main/updates",
            "check_interval_seconds": 3600,
            "auto_check_enabled": True,
            "auto_download_enabled": True,
            "auto_install_enabled": False,
            "update_manifest_url": "https://raw.githubusercontent.com/mazercheat-dotcom/animeducksystem/main/updates/manifest.json"
        }
    
    def _load_version_info(self) -> Dict:
        """Load current version information."""
        if self.version_file.exists():
            with open(self.version_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {
            "current_version": "V2.2PRO",
            "latest_version": "V2.2PRO",
            "has_update": False
        }
    
    def _save_version_info(self):
        """Save version information to disk."""
        with open(self.version_file, 'w', encoding='utf-8') as f:
            json.dump(self.version_info, f, indent=2, ensure_ascii=False)
    
    def register_callback(self, callback: Callable):
        """Register a callback for update events."""
        self.update_callbacks.append(callback)
    
    def _notify_callbacks(self, event: str, data: Dict):
        """Notify all registered callbacks."""
        for callback in self.update_callbacks:
            try:
                callback(event, data)
            except Exception as e:
                print(f"❌ Callback error: {e}")
    
    def check_for_updates(self) -> Dict:
        """Check if updates are available."""
        if self.is_checking:
            return {"status": "already_checking"}
        
        self.is_checking = True
        try:
            print("🔍 Checking for updates...")
            manifest_url = self.config.get("update_manifest_url")
            
            response = requests.get(manifest_url, timeout=10)
            response.raise_for_status()
            manifest = response.json()
            
            latest_version = manifest.get("latest_version", "")
            current_version = self.version_info.get("current_version", "")
            
            has_update = self._compare_versions(latest_version, current_version)
            
            if has_update:
                print(f"✅ New update available: {latest_version}")
                self.version_info["latest_version"] = latest_version
                self.version_info["has_update"] = True
                self.version_info["manifest"] = manifest
                self._save_version_info()
                
                self._notify_callbacks("update_available", {
                    "current_version": current_version,
                    "latest_version": latest_version,
                    "manifest": manifest
                })
                
                return {
                    "status": "update_available",
                    "current_version": current_version,
                    "latest_version": latest_version,
                    "manifest": manifest
                }
            else:
                print(f"✅ You are running the latest version: {current_version}")
                self.version_info["has_update"] = False
                self._save_version_info()
                
                return {
                    "status": "up_to_date",
                    "current_version": current_version
                }
        
        except Exception as e:
            print(f"❌ Update check failed: {e}")
            return {"status": "error", "error": str(e)}
        finally:
            self.is_checking = False
    
    def _compare_versions(self, version1: str, version2: str) -> bool:
        """Compare two version strings. Returns True if version1 > version2."""
        try:
            # Extract numeric parts (e.g., "V2.3PRO" -> [2, 3])
            v1_parts = [int(x) for x in version1.replace("V", "").replace("PRO", "").replace("BETA", "").split(".") if x.isdigit()]
            v2_parts = [int(x) for x in version2.replace("V", "").replace("PRO", "").replace("BETA", "").split(".") if x.isdigit()]
            
            return v1_parts > v2_parts
        except:
            return version1 != version2
    
    def download_update(self, manifest: Dict = None) -> Dict:
        """Download update files."""
        if self.is_downloading:
            return {"status": "already_downloading"}
        
        if manifest is None:
            manifest = self.version_info.get("manifest")
            if not manifest:
                return {"status": "error", "error": "No manifest available"}
        
        self.is_downloading = True
        self.download_progress = 0.0
        
        try:
            print("📥 Downloading updates...")
            changelog = manifest.get("changelog", [])
            if not changelog:
                return {"status": "error", "error": "Empty changelog"}
            
            latest_update = changelog[0]
            files = latest_update.get("files", [])
            
            if not files:
                return {"status": "error", "error": "No files to download"}
            
            total_files = len(files)
            downloaded_files = []
            
            for idx, file_info in enumerate(files):
                file_path = Path(file_info["path"])
                file_url = file_info["url"]
                
                print(f"📦 Downloading {file_path.name}...")
                
                try:
                    response = requests.get(file_url, timeout=30)
                    response.raise_for_status()
                    
                    # Save to updates directory temporarily
                    target_path = self.updates_dir / file_path
                    target_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    with open(target_path, 'wb') as f:
                        f.write(response.content)
                    
                    downloaded_files.append(str(file_path))
                    self.download_progress = ((idx + 1) / total_files) * 100
                    
                    self._notify_callbacks("download_progress", {
                        "progress": self.download_progress,
                        "file": str(file_path)
                    })
                
                except Exception as e:
                    print(f"❌ Failed to download {file_path}: {e}")
                    continue
            
            print(f"✅ Downloaded {len(downloaded_files)}/{total_files} files")
            
            return {
                "status": "success",
                "downloaded_files": downloaded_files,
                "total_files": total_files
            }
        
        except Exception as e:
            print(f"❌ Download failed: {e}")
            return {"status": "error", "error": str(e)}
        finally:
            self.is_downloading = False
    
    def install_update(self, backup=True) -> Dict:
        """Install downloaded updates by copying files to their destinations."""
        try:
            print("📦 Installing updates...")
            
            manifest = self.version_info.get("manifest")
            if not manifest:
                return {"status": "error", "error": "No manifest available"}
            
            changelog = manifest.get("changelog", [])
            if not changelog:
                return {"status": "error", "error": "Empty changelog"}
            
            latest_update = changelog[0]
            files = latest_update.get("files", [])
            
            # Backup current files
            if backup:
                print("💾 Creating backup...")
                backup_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                backup_path = self.backup_dir / f"backup_{backup_timestamp}"
                backup_path.mkdir(exist_ok=True)
                
                for file_info in files:
                    file_path = self.base_dir / file_info["path"]
                    if file_path.exists():
                        backup_file = backup_path / file_info["path"]
                        backup_file.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(file_path, backup_file)
            
            # Install files
            installed_files = []
            for file_info in files:
                source_path = self.updates_dir / file_info["path"]
                target_path = self.base_dir / file_info["path"]
                
                if not source_path.exists():
                    print(f"⚠️ Skipping {file_info['path']} (not downloaded)")
                    continue
                
                try:
                    target_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(source_path, target_path)
                    installed_files.append(file_info["path"])
                    print(f"✅ Installed {file_info['path']}")
                except Exception as e:
                    print(f"❌ Failed to install {file_info['path']}: {e}")
            
            # Update version info
            self.version_info["current_version"] = manifest["latest_version"]
            self.version_info["has_update"] = False
            self.version_info["last_update_date"] = datetime.now(timezone.utc).isoformat()
            self._save_version_info()
            
            print(f"✅ Update installed successfully! ({len(installed_files)} files)")
            
            self._notify_callbacks("update_installed", {
                "version": manifest["latest_version"],
                "installed_files": installed_files
            })
            
            return {
                "status": "success",
                "installed_files": installed_files,
                "version": manifest["latest_version"]
            }
        
        except Exception as e:
            print(f"❌ Installation failed: {e}")
            return {"status": "error", "error": str(e)}
    
    def rollback_update(self, backup_name: str = None) -> Dict:
        """Rollback to a previous backup."""
        try:
            backups = sorted([d for d in self.backup_dir.iterdir() if d.is_dir()], reverse=True)
            
            if not backups:
                return {"status": "error", "error": "No backups available"}
            
            if backup_name:
                backup_path = self.backup_dir / backup_name
            else:
                backup_path = backups[0]  # Latest backup
            
            if not backup_path.exists():
                return {"status": "error", "error": "Backup not found"}
            
            print(f"⏮️ Rolling back to {backup_path.name}...")
            
            restored_files = []
            for backup_file in backup_path.rglob("*"):
                if backup_file.is_file():
                    relative_path = backup_file.relative_to(backup_path)
                    target_path = self.base_dir / relative_path
                    target_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(backup_file, target_path)
                    restored_files.append(str(relative_path))
            
            print(f"✅ Rollback complete! Restored {len(restored_files)} files")
            
            return {
                "status": "success",
                "restored_files": restored_files,
                "backup": backup_path.name
            }
        
        except Exception as e:
            print(f"❌ Rollback failed: {e}")
            return {"status": "error", "error": str(e)}
    
    def start_auto_check(self):
        """Start automatic update checking in background."""
        if self._auto_check_thread and self._auto_check_thread.is_alive():
            return
        
        self._stop_auto_check.clear()
        self._auto_check_thread = threading.Thread(target=self._auto_check_loop, daemon=True)
        self._auto_check_thread.start()
        print("🔄 Auto-update checker started")
    
    def stop_auto_check(self):
        """Stop automatic update checking."""
        self._stop_auto_check.set()
        if self._auto_check_thread:
            self._auto_check_thread.join(timeout=2)
        print("🛑 Auto-update checker stopped")
    
    def _auto_check_loop(self):
        """Background loop for automatic update checking."""
        interval = self.config.get("check_interval_seconds", 3600)
        
        while not self._stop_auto_check.is_set():
            if self.config.get("auto_check_enabled", True):
                result = self.check_for_updates()
                
                if result.get("status") == "update_available":
                    if self.config.get("auto_download_enabled", True):
                        self.download_update()
                        
                        if self.config.get("auto_install_enabled", False):
                            self.install_update()
            
            # Wait for next check
            self._stop_auto_check.wait(timeout=interval)
    
    def get_status(self) -> Dict:
        """Get current update manager status."""
        return {
            "current_version": self.version_info.get("current_version"),
            "latest_version": self.version_info.get("latest_version"),
            "has_update": self.version_info.get("has_update", False),
            "is_checking": self.is_checking,
            "is_downloading": self.is_downloading,
            "download_progress": self.download_progress,
            "auto_check_enabled": self.config.get("auto_check_enabled", True)
        }


# Global instance
_update_manager: Optional[UpdateManager] = None


def get_update_manager() -> UpdateManager:
    """Get or create global UpdateManager instance."""
    global _update_manager
    if _update_manager is None:
        _update_manager = UpdateManager()
    return _update_manager
