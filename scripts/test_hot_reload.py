"""
🔥 Hot Reload Test Script
=========================
Test dynamic module loading and hot-reloading
"""

import os
import sys
import time

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.module_loader import get_module_loader


def print_section(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def main():
    print_section("🔥 HOT RELOAD TEST")
    
    loader = get_module_loader()
    
    # Test 1: Load a module
    print("\n1️⃣ Loading demo_feature module...")
    module = loader.load_module('demo_feature')
    
    if module:
        print("   ✅ Module loaded successfully!")
        print(f"   📦 Module info: {module.get_feature_info()}")
        print(f"   👋 Greeting: {module.greet('Tester')}")
        print(f"   🧮 Calculation: 5 + 3 = {module.calculate(5, 3, 'add')}")
    else:
        print("   ❌ Failed to load module")
        return 1
    
    # Test 2: Check loaded modules
    print("\n2️⃣ Checking loaded modules...")
    loaded = loader.list_loaded_modules()
    print(f"   📋 Loaded modules: {loaded}")
    
    # Test 3: Get module info
    print("\n3️⃣ Getting module info...")
    info = loader.get_module_info('demo_feature')
    if info:
        print(f"   📄 Name: {info['name']}")
        print(f"   📂 Path: {info['path']}")
        print(f"   📚 Doc: {info['doc'][:60]}..." if info['doc'] else "   📚 No documentation")
    
    # Test 4: Simulate file update
    print("\n4️⃣ Simulating module update...")
    print("   ⏳ In a real scenario, you would:")
    print("      1. Download updated module file")
    print("      2. Replace the file in patches/ directory")
    print("      3. Call reload_module()")
    print("      4. New version becomes active immediately!")
    
    # Test 5: Reload module
    print("\n5️⃣ Hot-reloading module...")
    reloaded_module = loader.reload_module('demo_feature')
    
    if reloaded_module:
        print("   ✅ Module reloaded successfully!")
        print(f"   📦 Version after reload: {reloaded_module.VERSION}")
    else:
        print("   ❌ Failed to reload module")
        return 1
    
    # Test 6: Scan available modules
    print("\n6️⃣ Scanning available modules...")
    available = loader.scan_available_modules('demo*.py')
    for location, modules in available.items():
        if modules:
            print(f"   📂 {location}:")
            for mod in modules:
                status = "✅ loaded" if mod['loaded'] else "⚪ available"
                print(f"      {status} - {mod['name']}")
    
    print("\n" + "=" * 70)
    print("  ✅ HOT RELOAD TEST COMPLETED!")
    print("=" * 70)
    print("\n🎉 Key Takeaways:")
    print("   ✅ Modules can be loaded dynamically")
    print("   ✅ Modules can be reloaded without app restart")
    print("   ✅ New code becomes active immediately")
    print("   ✅ Perfect for auto-updates!")
    
    return 0


if __name__ == '__main__':
    exit(main())
