"""
🌐 Auto-Update API Test Script
==============================
Test all update-related API endpoints
"""

import requests
import json
import time


BASE_URL = "http://localhost:3000"


def print_section(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def test_endpoint(method, endpoint, data=None, description=""):
    """Test an API endpoint."""
    url = f"{BASE_URL}{endpoint}"
    
    print(f"\n🔗 Testing: {method} {endpoint}")
    if description:
        print(f"   📝 {description}")
    
    try:
        if method == "GET":
            response = requests.get(url, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=5)
        else:
            print(f"   ❌ Unsupported method: {method}")
            return False
        
        print(f"   📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Success: {result.get('success', False)}")
            
            # Print relevant info
            if 'status' in result:
                print(f"   📌 Status: {result['status']}")
            if 'result' in result:
                res = result['result']
                if isinstance(res, dict):
                    if 'status' in res:
                        print(f"   📌 Result Status: {res['status']}")
                    if 'current_version' in res:
                        print(f"   📌 Current Version: {res['current_version']}")
                    if 'latest_version' in res:
                        print(f"   📌 Latest Version: {res['latest_version']}")
            if 'message' in result:
                print(f"   💬 Message: {result['message']}")
            
            return True
        else:
            print(f"   ❌ Failed with status {response.status_code}")
            print(f"   💬 Response: {response.text[:200]}")
            return False
    
    except requests.exceptions.ConnectionError:
        print(f"   ❌ Connection Error - Is the server running?")
        print(f"   💡 Tip: Start the server first with 'python desktop_app.py'")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def main():
    print_section("🌐 AUTO-UPDATE API TEST SUITE")
    
    print("\n⚠️  IMPORTANT: Server must be running on http://localhost:3000")
    print("   If not running, start it with: python desktop_app.py")
    
    input("\nPress Enter to continue (or Ctrl+C to cancel)...")
    
    results = {}
    
    # Test 1: Get update status
    print_section("1️⃣ Get Update Status")
    results['status'] = test_endpoint(
        "GET", 
        "/api/update/status",
        description="Get current update manager status"
    )
    
    # Test 2: Check for updates
    print_section("2️⃣ Check for Updates")
    results['check'] = test_endpoint(
        "POST",
        "/api/update/check",
        description="Check if new updates are available"
    )
    
    # Test 3: List backups
    print_section("3️⃣ List Backups")
    results['backups'] = test_endpoint(
        "GET",
        "/api/update/backups",
        description="List all available backup snapshots"
    )
    
    # Test 4: List loaded modules
    print_section("4️⃣ List Loaded Modules")
    results['modules_list'] = test_endpoint(
        "GET",
        "/api/modules/list",
        description="List all dynamically loaded modules"
    )
    
    # Test 5: Reload demo module (if exists)
    print_section("5️⃣ Reload Module (demo)")
    results['module_reload'] = test_endpoint(
        "POST",
        "/api/modules/reload",
        data={"module_name": "demo_feature"},
        description="Reload demo_feature module"
    )
    
    # Summary
    print_section("📊 TEST SUMMARY")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    print(f"\n✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {total - passed}/{total}")
    
    print("\n📋 Detailed Results:")
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status} - {test_name}")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        print("\n✅ Auto-Update API is working correctly!")
        return 0
    else:
        print("\n⚠️  Some tests failed")
        print("\n💡 Tips:")
        print("   - Make sure the server is running")
        print("   - Check server logs for errors")
        print("   - Verify all update services are initialized")
        return 1


if __name__ == '__main__':
    try:
        exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Test cancelled by user")
        exit(1)
