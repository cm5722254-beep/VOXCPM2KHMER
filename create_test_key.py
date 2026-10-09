#!/usr/bin/env python3
"""
Quick script to create a test license key
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.license_manager import create_license_key, get_machine_id

print("=" * 70)
print("🔑 Creating Test License Key")
print("=" * 70)

# Get machine ID
machine_id = get_machine_id()
print(f"\n💻 Your Machine ID: {machine_id}")

# Create a 7-day trial key
trial_key = create_license_key(days_valid=7, max_activations=1, notes="Test Trial - 7 days")
print(f"\n✅ 7-Day Trial Key: {trial_key}")

# Create a 30-day key
monthly_key = create_license_key(days_valid=30, max_activations=1, notes="Test Monthly - 30 days")
print(f"✅ 30-Day Key: {monthly_key}")

# Create a lifetime key
lifetime_key = create_license_key(days_valid=0, max_activations=1, notes="Test Lifetime")
print(f"✅ Lifetime Key: {lifetime_key}")

print("\n" + "=" * 70)
print("💡 Use any of these keys to test the activation system!")
print("=" * 70)
