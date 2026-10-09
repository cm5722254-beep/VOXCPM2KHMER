#!/usr/bin/env python3
"""
Deactivate current machine for testing
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.license_manager import deactivate_machine, get_machine_id, check_activation

print("=" * 70)
print("🔓 Deactivating Current Machine")
print("=" * 70)

machine_id = get_machine_id()
print(f"\n💻 Machine ID: {machine_id}")

# Check current status
status = check_activation()
if status.get('activated'):
    print(f"\n✅ Currently activated with key: {status.get('key_code')}")
else:
    print(f"\n⚠️  Already not activated")
    sys.exit(0)

# Deactivate
print(f"\n🔓 Deactivating...")
result = deactivate_machine(machine_id)

if result.get('success'):
    print(f"✅ {result.get('message')}")
    
    # Verify
    status = check_activation()
    if not status.get('activated'):
        print(f"✅ Deactivation verified!")
    else:
        print(f"⚠️  Still showing as activated")
else:
    print(f"❌ {result.get('error')}")

print("\n" + "=" * 70)
