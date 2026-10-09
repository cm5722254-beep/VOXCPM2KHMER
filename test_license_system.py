#!/usr/bin/env python3
"""
Quick test script for license system
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.license_manager import (
    create_license_key,
    validate_license_key,
    activate_license,
    check_activation,
    get_machine_id,
    list_all_license_keys,
    list_all_activations
)

def test_license_system():
    print("=" * 70)
    print("🧪 Testing License System")
    print("=" * 70)
    
    # 1. Get machine ID
    print("\n1️⃣ Getting Machine ID...")
    machine_id = get_machine_id()
    print(f"   ✅ Machine ID: {machine_id}")
    
    # 2. Check current activation status
    print("\n2️⃣ Checking current activation status...")
    status = check_activation()
    if status.get('activated'):
        print(f"   ✅ Already activated!")
        print(f"   Key: {status.get('key_code')}")
        print(f"   Expires: {status.get('expires_at', 'Lifetime')}")
    else:
        print(f"   ⚠️  Not activated yet")
    
    # 3. Generate a test license key (30 days)
    print("\n3️⃣ Generating test license key (30 days)...")
    test_key = create_license_key(days_valid=30, max_activations=1, notes="Test Key - 30 days")
    print(f"   ✅ Generated: {test_key}")
    
    # 4. Validate the key
    print("\n4️⃣ Validating license key...")
    validation = validate_license_key(test_key)
    if validation.get('valid'):
        print(f"   ✅ Key is valid!")
        print(f"   Days valid: {validation.get('days_valid')}")
        print(f"   Max activations: {validation.get('max_activations')}")
    else:
        print(f"   ❌ Validation failed: {validation.get('error')}")
        return
    
    # 5. Activate the license
    print("\n5️⃣ Activating license on this machine...")
    activation = activate_license(test_key)
    if activation.get('success'):
        print(f"   ✅ Activation successful!")
        print(f"   Message: {activation.get('message')}")
        print(f"   Expires: {activation.get('expires_at')}")
    else:
        print(f"   ❌ Activation failed: {activation.get('error')}")
        return
    
    # 6. Check activation again
    print("\n6️⃣ Verifying activation...")
    status = check_activation()
    if status.get('activated'):
        print(f"   ✅ Machine is now activated!")
        print(f"   Key: {status.get('key_code')}")
        print(f"   Expires: {status.get('expires_at', 'Lifetime')}")
    else:
        print(f"   ❌ Activation check failed")
    
    # 7. List all keys
    print("\n7️⃣ Listing all license keys...")
    keys = list_all_license_keys()
    print(f"   📋 Total keys: {len(keys)}")
    for key in keys[:3]:  # Show first 3
        print(f"      • {key['key_code']} - Activations: {key['current_activations']}/{key['max_activations']}")
    
    # 8. List all activations
    print("\n8️⃣ Listing all activations...")
    activations = list_all_activations()
    print(f"   💻 Total activations: {len(activations)}")
    for act in activations[:3]:  # Show first 3
        print(f"      • {act['computer_name']} - {act['key_code']}")
    
    print("\n" + "=" * 70)
    print("✅ License system test completed successfully!")
    print("=" * 70)
    print(f"\n🔑 Test Key Generated: {test_key}")
    print("💡 Use this key to test the UI activation flow")
    print("=" * 70)

if __name__ == '__main__':
    try:
        test_license_system()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
