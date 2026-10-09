#!/usr/bin/env python3
"""
👑 CHEAT DABBER TOOL - License Key Generator (Admin Only)

This script allows administrators to generate license keys for customers.
"""
import sys
import os

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.license_manager import (
    create_license_key,
    list_all_license_keys,
    list_all_activations,
    deactivate_machine,
    init_license_db
)


def print_header():
    """Print script header"""
    print("=" * 70)
    print("👑 CHEAT DABBER TOOL - License Key Generator")
    print("=" * 70)
    print()


def print_menu():
    """Print main menu"""
    print("\n📋 Menu:")
    print("  1. Generate New License Key")
    print("  2. List All License Keys")
    print("  3. List All Activations")
    print("  4. Deactivate Machine")
    print("  5. Exit")
    print()


def generate_new_key():
    """Generate a new license key"""
    print("\n🔑 Generate New License Key")
    print("-" * 50)
    
    # Ask for days valid
    print("\nSelect validity period:")
    print("  1. 7 days (Trial)")
    print("  2. 30 days (1 Month)")
    print("  3. 90 days (3 Months)")
    print("  4. 180 days (6 Months)")
    print("  5. 365 days (1 Year)")
    print("  6. Lifetime (0 = Forever)")
    
    try:
        choice = input("\nEnter choice (1-6): ").strip()
        
        days_map = {
            '1': 7,
            '2': 30,
            '3': 90,
            '4': 180,
            '5': 365,
            '6': 0,  # Lifetime
        }
        
        if choice not in days_map:
            print("❌ Invalid choice!")
            return
        
        days_valid = days_map[choice]
        
        # Ask for max activations
        max_activations = input("\nMax activations (default 1): ").strip()
        if not max_activations:
            max_activations = 1
        else:
            max_activations = int(max_activations)
        
        # Ask for notes
        notes = input("\nNotes (customer name, etc.): ").strip()
        
        # Generate key
        key_code = create_license_key(
            days_valid=days_valid,
            max_activations=max_activations,
            notes=notes
        )
        
        print("\n✅ License Key Generated Successfully!")
        print("-" * 50)
        print(f"🔑 Key Code: {key_code}")
        print(f"⏰ Validity: {'Lifetime' if days_valid == 0 else f'{days_valid} days'}")
        print(f"💻 Max Activations: {max_activations}")
        if notes:
            print(f"📝 Notes: {notes}")
        print("-" * 50)
        print("\n💡 Copy this key and send it to the customer!")
        
    except ValueError as e:
        print(f"❌ Error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")


def list_keys():
    """List all license keys"""
    print("\n📋 All License Keys")
    print("-" * 70)
    
    try:
        keys = list_all_license_keys()
        
        if not keys:
            print("No license keys found.")
            return
        
        for i, key in enumerate(keys, 1):
            print(f"\n{i}. {key['key_code']}")
            print(f"   Created: {key.get('created_at', 'N/A')}")
            print(f"   Validity: {'Lifetime' if key['days_valid'] == 0 else f"{key['days_valid']} days"}")
            print(f"   Activations: {key['current_activations']}/{key['max_activations']}")
            print(f"   Active: {'Yes' if key['is_active'] else 'No'}")
            if key.get('notes'):
                print(f"   Notes: {key['notes']}")
        
        print(f"\n📊 Total Keys: {len(keys)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")


def list_activations():
    """List all activations"""
    print("\n💻 All Machine Activations")
    print("-" * 70)
    
    try:
        activations = list_all_activations()
        
        if not activations:
            print("No activations found.")
            return
        
        for i, act in enumerate(activations, 1):
            print(f"\n{i}. Machine ID: {act['machine_id']}")
            print(f"   Key Code: {act['key_code']}")
            print(f"   Computer: {act.get('computer_name', 'Unknown')}")
            print(f"   Activated: {act.get('activated_at', 'N/A')}")
            print(f"   Last Seen: {act.get('last_seen', 'N/A')}")
            
            expires_at = act.get('expires_at')
            if expires_at:
                print(f"   Expires: {expires_at}")
            else:
                print(f"   Expires: Lifetime")
        
        print(f"\n📊 Total Activations: {len(activations)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")


def deactivate():
    """Deactivate a machine"""
    print("\n🔓 Deactivate Machine")
    print("-" * 50)
    
    # First show activations
    try:
        activations = list_all_activations()
        
        if not activations:
            print("No activations found.")
            return
        
        print("\nActive Machines:")
        for i, act in enumerate(activations, 1):
            print(f"{i}. {act.get('computer_name', 'Unknown')} - {act['machine_id'][:16]}...")
            print(f"   Key: {act['key_code']}")
        
        choice = input("\nEnter number to deactivate (or 'cancel'): ").strip()
        
        if choice.lower() == 'cancel':
            print("Cancelled.")
            return
        
        try:
            idx = int(choice) - 1
            if idx < 0 or idx >= len(activations):
                print("❌ Invalid choice!")
                return
            
            machine_id = activations[idx]['machine_id']
            
            # Confirm
            confirm = input(f"\n⚠️  Deactivate {activations[idx].get('computer_name', 'Unknown')}? (yes/no): ").strip().lower()
            
            if confirm != 'yes':
                print("Cancelled.")
                return
            
            result = deactivate_machine(machine_id)
            
            if result.get('success'):
                print(f"✅ {result.get('message', 'Machine deactivated successfully!')}")
            else:
                print(f"❌ {result.get('error', 'Failed to deactivate')}")
                
        except ValueError:
            print("❌ Invalid input!")
            
    except Exception as e:
        print(f"❌ Error: {e}")


def main():
    """Main function"""
    # Initialize database
    init_license_db()
    
    print_header()
    
    while True:
        print_menu()
        
        try:
            choice = input("Enter choice (1-5): ").strip()
            
            if choice == '1':
                generate_new_key()
            elif choice == '2':
                list_keys()
            elif choice == '3':
                list_activations()
            elif choice == '4':
                deactivate()
            elif choice == '5':
                print("\n👋 Goodbye!")
                break
            else:
                print("❌ Invalid choice! Please enter 1-5.")
                
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")


if __name__ == '__main__':
    main()
