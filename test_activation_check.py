#!/usr/bin/env python3
"""
Test activation check after clearing activation.json
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.license_manager import check_activation, get_machine_id

print("=" * 70)
print("🔍 Testing Activation Check")
print("=" * 70)

machine_id = get_machine_id()
print(f"\n💻 Machine ID: {machine_id}")

status = check_activation()
print(f"\n📊 Activation Status:")
print(f"   Activated: {status.get('activated')}")

if status.get('activated'):
    print(f"   Key Code: {status.get('key_code')}")
    print(f"   Expires: {status.get('expires_at', 'Lifetime')}")
    print(f"   Is Lifetime: {status.get('is_lifetime', False)}")
else:
    print(f"   ⚠️  Machine is not activated!")
    print(f"   Error: {status.get('error', 'No error message')}")

print("\n" + "=" * 70)
