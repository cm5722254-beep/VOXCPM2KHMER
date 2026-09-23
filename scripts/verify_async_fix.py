#!/usr/bin/env python3
"""
Verification script for V2.3.1PRO async fix update
Verifies that the WebSocket/SSE fix was applied correctly
"""

import os
import sys

def verify_async_fix():
    """Verify that async queue fix is present in server.py"""
    print("🔍 Verifying V2.3.1PRO async fix...")
    
    server_path = os.path.join(os.path.dirname(__file__), '..', 'server.py')
    
    if not os.path.exists(server_path):
        print("❌ ERROR: server.py not found")
        return False
    
    with open(server_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for required fixes
    checks = [
        ('import asyncio', 'asyncio import'),
        ('asyncio.Queue()', 'async queue usage'),
        ('put_nowait(', 'non-blocking put method'),
        ('asyncio.wait_for(', 'async wait_for usage'),
        ('asyncio.TimeoutError', 'async timeout exception')
    ]
    
    all_passed = True
    for check_text, check_name in checks:
        if check_text in content:
            print(f"✅ {check_name} - OK")
        else:
            print(f"❌ {check_name} - MISSING")
            all_passed = False
    
    if all_passed:
        print("\n✅ All async fix verifications passed!")
        print("🎉 V2.3.1PRO update successful - WebSocket error fixed")
        return True
    else:
        print("\n❌ Some verifications failed")
        return False

if __name__ == '__main__':
    success = verify_async_fix()
    sys.exit(0 if success else 1)
