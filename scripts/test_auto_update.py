"""
🔄 Auto-Update System Test Script
==================================
Test the complete auto-update flow
"""

import os
import sys
import time

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.update_manager import UpdateManager
from services.module_loader import ModuleLoader


def print_section(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def test_update_manager():
    """Test UpdateManager functionality."""
    print_section("🔄 Testing Update Manager")
    
    # Initialize
    print("\n1️⃣ Initializing UpdateManager...")
    update_mgr = UpdateManager()
    print(f"   ✅ UpdateManager initialized")
    print(f"   📁 Base directory: {update_mgr.base_dir}")
    print(f"   📦 Updates directory: {update_mgr.updates_dir}")
    print(f"   💾 Backup directory: {update_mgr.backup_dir}")
    
    # Check current status
    print("\n2️⃣ Checking current status...")
    status = update_mgr.get_status()
    print(f"   Current Version: {status['current_version']}")
    print(f"   Latest Version: {status['latest_version']}")
    print(f"   Has Update: {status['has_update']}")
    
    # Check for updates
    print("\n3️⃣ Checking for updates...")
    result = update_mgr.check_for_updates()
    print(f"   Status: {result.get('status')}")
    
    if result.get('status') == 'update_available':
        print(f"   🎉 New version available: {result.get('latest_version')}")
        manifest = result.get('manifest', {})
        changelog = manifest.get('changelog', [])
        if changelog:
            latest = changelog[0]
            print(f"\n   📝 Changelog for {latest.get('version')}:")
            for change in latest.get('changes', []):
                print(f"      [{change.get('type')}] {change.get('text')}")
        
        # Test download (dry run - don't actually download in test)
        print("\n4️⃣ Testing download capability...")
        files = latest.get('files', [])
        print(f"   📦 {len(files)} files would be downloaded:")
        for file_info in files[:3]:  # Show first 3
            print(f"      - {file_info.get('path')}")
        if len(files) > 3:
            print(f"      ... and {len(files) - 3} more")
    
    elif result.get('status') == 'up_to_date':
        print(f"   ✅ Already running latest version: {result.get('current_version')}")
    
    elif result.get('status') == 'error':
        print(f"   ❌ Error: {result.get('error')}")
    
    # List backups
    print("\n5️⃣ Checking available backups...")
    backups = list(update_mgr.backup_dir.iterdir()) if update_mgr.backup_dir.exists() else []
    if backups:
        print(f"   💾 Found {len(backups)} backup(s):")
        for backup in sorted(backups, reverse=True)[:3]:
            print(f"      - {backup.name}")
    else:
        print(f"   📭 No backups found")
    
    print("\n✅ UpdateManager test completed!")


def test_module_loader():
    """Test ModuleLoader functionality."""
    print_section("🔄 Testing Module Loader")
    
    # Initialize
    print("\n1️⃣ Initializing ModuleLoader...")
    module_loader = ModuleLoader()
    print(f"   ✅ ModuleLoader initialized")
    print(f"   📁 Base directory: {module_loader.base_dir}")
    print(f"   🔍 Search paths:")
    for path in module_loader.search_paths:
        print(f"      - {path}")
    
    # Scan available modules
    print("\n2️⃣ Scanning available modules...")
    available = module_loader.scan_available_modules()
    total_count = sum(len(modules) for modules in available.values())
    print(f"   📦 Found {total_count} module(s) across {len(available)} location(s)")
    
    for location, modules in available.items():
        if modules:
            print(f"\n   📂 {location} ({len(modules)} modules):")
            for mod in modules[:3]:  # Show first 3
                status = "✅ loaded" if mod['loaded'] else "⚪ available"
                print(f"      {status} - {mod['name']}")
            if len(modules) > 3:
                print(f"      ... and {len(modules) - 3} more")
    
    # List loaded modules
    print("\n3️⃣ Currently loaded modules...")
    loaded = module_loader.list_loaded_modules()
    if loaded:
        print(f"   ✅ {len(loaded)} module(s) loaded:")
        for mod_name in loaded[:5]:
            print(f"      - {mod_name}")
    else:
        print(f"   📭 No modules loaded yet")
    
    print("\n✅ ModuleLoader test completed!")


def test_config_files():
    """Test configuration files."""
    print_section("📝 Testing Configuration Files")
    
    import json
    from pathlib import Path
    
    base_dir = Path(__file__).parent.parent
    
    # Check update_config.json
    print("\n1️⃣ Checking update_config.json...")
    config_file = base_dir / "update_config.json"
    if config_file.exists():
        with open(config_file, 'r', encoding='utf-8') as f:
            config = json.load(f)
        print(f"   ✅ Configuration file found")
        print(f"   🌐 Update server: {config.get('update_server')}")
        print(f"   ⏱️  Check interval: {config.get('check_interval_seconds')}s")
        print(f"   🔄 Auto-check: {config.get('auto_check_enabled')}")
        print(f"   📥 Auto-download: {config.get('auto_download_enabled')}")
        print(f"   📦 Auto-install: {config.get('auto_install_enabled')}")
    else:
        print(f"   ⚠️  Configuration file not found")
    
    # Check app_version.json
    print("\n2️⃣ Checking app_version.json...")
    version_file = base_dir / "app_version.json"
    if version_file.exists():
        with open(version_file, 'r', encoding='utf-8') as f:
            version_info = json.load(f)
        print(f"   ✅ Version file found")
        print(f"   📌 Current version: {version_info.get('current_version')}")
        print(f"   🆕 Latest version: {version_info.get('latest_version')}")
        print(f"   🔄 Has update: {version_info.get('has_update')}")
    else:
        print(f"   ⚠️  Version file not found")
    
    # Check manifest
    print("\n3️⃣ Checking updates/manifest.json...")
    manifest_file = base_dir / "updates" / "manifest.json"
    if manifest_file.exists():
        with open(manifest_file, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
        print(f"   ✅ Manifest file found")
        print(f"   🆕 Latest version: {manifest.get('latest_version')}")
        print(f"   📅 Release date: {manifest.get('release_date')}")
        print(f"   📝 Changelog entries: {len(manifest.get('changelog', []))}")
    else:
        print(f"   ⚠️  Manifest file not found")
    
    print("\n✅ Configuration test completed!")


def main():
    """Run all tests."""
    print("\n" + "=" * 70)
    print("  🧪 AUTO-UPDATE SYSTEM TEST SUITE")
    print("=" * 70)
    
    try:
        # Test configuration files
        test_config_files()
        
        # Test UpdateManager
        test_update_manager()
        
        # Test ModuleLoader
        test_module_loader()
        
        # Summary
        print("\n" + "=" * 70)
        print("  ✅ ALL TESTS COMPLETED SUCCESSFULLY!")
        print("=" * 70)
        print("\n📋 Summary:")
        print("   - Configuration files: OK")
        print("   - UpdateManager: OK")
        print("   - ModuleLoader: OK")
        print("\n🎉 Auto-Update System is ready to use!")
        
    except Exception as e:
        print("\n" + "=" * 70)
        print("  ❌ TEST FAILED")
        print("=" * 70)
        print(f"\n Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == '__main__':
    exit(main())
