"""
👑 CHEAT DABBER TOOL - License Key Management System
Supports: Machine-specific activation, Admin control, Persistent storage
"""
import os
import sys
import json
import hashlib
import sqlite3
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict

logger = logging.getLogger(__name__)

if getattr(sys, 'frozen', False):
    APP_DIR = os.path.dirname(sys.executable)
else:
    APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATA_DIR = os.path.join(APP_DIR, 'data')
os.makedirs(DATA_DIR, exist_ok=True)

LICENSE_DB = os.path.join(DATA_DIR, 'license.db')
ACTIVATION_FILE = os.path.join(DATA_DIR, 'activation.json')


def get_machine_id() -> str:
    """Get unique machine identifier based on hardware"""
    try:
        from services.machine_id import get_machine_id as gmi
        return gmi()
    except (ImportError, AttributeError, OSError) as e:
        logger.warning(f"Failed to import machine_id service: {e}, using fallback")
        
        import uuid
        # Fallback: use MAC address or system UUID
        try:
            mac = ':'.join(['{:02x}'.format((uuid.getnode() >> elements) & 0xff)
                           for elements in range(0, 2*6, 2)][::-1])
            return hashlib.sha256(mac.encode()).hexdigest()[:16].upper()
        except Exception as e:
            logger.error(f"Failed to generate machine ID from MAC: {e}")
            return "UNKNOWN-MACHINE"


def init_license_db():
    """Initialize license database"""
    conn = sqlite3.connect(LICENSE_DB)
    c = conn.cursor()
    
    # License keys table
    c.execute('''
        CREATE TABLE IF NOT EXISTS license_keys (
            key_code TEXT PRIMARY KEY,
            machine_id TEXT,
            activated_at TEXT,
            expires_at TEXT,
            days_valid INTEGER DEFAULT 365,
            max_activations INTEGER DEFAULT 1,
            current_activations INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_by TEXT DEFAULT 'admin',
            created_at TEXT,
            notes TEXT
        )
    ''')
    
    # Activations table (track each machine activation)
    c.execute('''
        CREATE TABLE IF NOT EXISTS activations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key_code TEXT NOT NULL,
            machine_id TEXT NOT NULL,
            activated_at TEXT NOT NULL,
            last_seen TEXT,
            computer_name TEXT,
            UNIQUE(key_code, machine_id)
        )
    ''')
    
    conn.commit()
    conn.close()


def generate_license_key(prefix: str = "CDT", days_valid: int = 365) -> str:
    """Generate a new license key
    Format: CDT-XXXX-XXXX-XXXX-XXXX
    """
    import random
    import string
    
    def random_segment():
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    
    key = f"{prefix}-{random_segment()}-{random_segment()}-{random_segment()}-{random_segment()}"
    return key


def create_license_key(days_valid: int = 365, max_activations: int = 1, notes: str = "") -> str:
    """Create a new license key (Admin only)"""
    init_license_db()
    
    key_code = generate_license_key(days_valid=days_valid)
    
    conn = sqlite3.connect(LICENSE_DB)
    c = conn.cursor()
    
    created_at = datetime.now().isoformat()
    
    c.execute('''
        INSERT INTO license_keys 
        (key_code, days_valid, max_activations, created_at, notes, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
    ''', (key_code, days_valid, max_activations, created_at, notes))
    
    conn.commit()
    conn.close()
    
    return key_code


def validate_license_key(key_code: str) -> Dict:
    """Validate if license key exists and is valid"""
    init_license_db()
    
    key_code = key_code.strip().upper().replace(" ", "")
    
    conn = sqlite3.connect(LICENSE_DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute('SELECT * FROM license_keys WHERE key_code = ?', (key_code,))
    row = c.fetchone()
    
    if not row:
        conn.close()
        return {'valid': False, 'error': 'License key not found'}
    
    license_data = dict(row)
    
    # Check if key is active
    if not license_data['is_active']:
        conn.close()
        return {'valid': False, 'error': 'License key has been deactivated'}
    
    # Check expiration
    if license_data['expires_at']:
        expires = datetime.fromisoformat(license_data['expires_at'])
        if datetime.now() > expires:
            conn.close()
            return {'valid': False, 'error': 'License key has expired'}
    
    # Check activation limit
    if license_data['current_activations'] >= license_data['max_activations']:
        conn.close()
        return {'valid': False, 'error': 'Maximum activations reached for this key'}
    
    conn.close()
    return {
        'valid': True,
        'key_code': key_code,
        'days_valid': license_data['days_valid'],
        'max_activations': license_data['max_activations'],
        'current_activations': license_data['current_activations']
    }


def activate_license(key_code: str, machine_id: Optional[str] = None, computer_name: Optional[str] = None) -> Dict:
    """Activate license key for this machine"""
    init_license_db()
    
    key_code = key_code.strip().upper().replace(" ", "")
    machine_id = machine_id or get_machine_id()
    
    if not computer_name:
        import socket
        try:
            computer_name = socket.gethostname()
        except (OSError, socket.error) as e:
            logger.warning(f"Failed to get hostname: {e}")
            computer_name = "Unknown PC"
    
    # Validate key first
    validation = validate_license_key(key_code)
    if not validation['valid']:
        return validation
    
    conn = sqlite3.connect(LICENSE_DB)
    c = conn.cursor()
    
    # Check if this machine is already activated
    c.execute('SELECT * FROM activations WHERE key_code = ? AND machine_id = ?', 
              (key_code, machine_id))
    existing = c.fetchone()
    
    if existing:
        # Already activated - just update last seen
        c.execute('UPDATE activations SET last_seen = ? WHERE key_code = ? AND machine_id = ?',
                  (datetime.now().isoformat(), key_code, machine_id))
        conn.commit()
        
        # Get expiry info
        c.execute('SELECT expires_at, days_valid FROM license_keys WHERE key_code = ?', (key_code,))
        row = c.fetchone()
        expires_at = row[0]
        days_valid = row[1]
        
        conn.close()
        
        # Save to activation file
        save_activation_file(key_code, machine_id, expires_at, days_valid)
        
        return {
            'success': True,
            'message': 'License already activated on this machine',
            'key_code': key_code,
            'machine_id': machine_id,
            'expires_at': expires_at
        }
    
    # New activation
    activated_at = datetime.now().isoformat()
    
    # Calculate expiration
    days_valid = validation['days_valid']
    if days_valid > 0:
        expires_at = (datetime.now() + timedelta(days=days_valid)).isoformat()
    else:
        expires_at = None  # Lifetime
    
    # Insert activation
    c.execute('''
        INSERT INTO activations (key_code, machine_id, activated_at, last_seen, computer_name)
        VALUES (?, ?, ?, ?, ?)
    ''', (key_code, machine_id, activated_at, activated_at, computer_name))
    
    # Update license key
    c.execute('''
        UPDATE license_keys 
        SET current_activations = current_activations + 1,
            activated_at = COALESCE(activated_at, ?),
            expires_at = COALESCE(expires_at, ?)
        WHERE key_code = ?
    ''', (activated_at, expires_at, key_code))
    
    conn.commit()
    conn.close()
    
    # Save to activation file (persistent)
    save_activation_file(key_code, machine_id, expires_at, days_valid)
    
    return {
        'success': True,
        'message': 'License activated successfully',
        'key_code': key_code,
        'machine_id': machine_id,
        'expires_at': expires_at,
        'days_valid': days_valid
    }


def save_activation_file(key_code: str, machine_id: str, expires_at: Optional[str], days_valid: int):
    """Save activation to persistent file (survives app restart)"""
    data = {
        'key_code': key_code,
        'machine_id': machine_id,
        'activated_at': datetime.now().isoformat(),
        'expires_at': expires_at,
        'days_valid': days_valid,
        'is_lifetime': (days_valid <= 0 or expires_at is None)
    }
    
    try:
        with open(ACTIVATION_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving activation file: {e}")


def load_activation_file() -> Optional[Dict]:
    """Load activation from persistent file"""
    if not os.path.exists(ACTIVATION_FILE):
        return None
    
    try:
        with open(ACTIVATION_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Verify machine ID matches
        current_machine_id = get_machine_id()
        if data.get('machine_id') != current_machine_id:
            return None  # Wrong machine
        
        # Check expiration
        expires_at = data.get('expires_at')
        if expires_at:
            expires = datetime.fromisoformat(expires_at)
            if datetime.now() > expires:
                return None  # Expired
        
        return data
    except Exception as e:
        print(f"Error loading activation file: {e}")
        return None


def check_activation() -> Dict:
    """Check if current machine is activated"""
    # Check activation file first (fast)
    activation = load_activation_file()
    if activation:
        return {
            'activated': True,
            'key_code': activation['key_code'],
            'machine_id': activation['machine_id'],
            'expires_at': activation.get('expires_at'),
            'is_lifetime': activation.get('is_lifetime', False)
        }
    
    # Check database
    init_license_db()
    machine_id = get_machine_id()
    
    conn = sqlite3.connect(LICENSE_DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute('''
        SELECT a.*, l.expires_at, l.days_valid
        FROM activations a
        JOIN license_keys l ON a.key_code = l.key_code
        WHERE a.machine_id = ? AND l.is_active = 1
    ''', (machine_id,))
    
    row = c.fetchone()
    
    if not row:
        conn.close()
        return {'activated': False}
    
    data = dict(row)
    
    # Check expiration
    expires_at = data.get('expires_at')
    if expires_at:
        expires = datetime.fromisoformat(expires_at)
        if datetime.now() > expires:
            conn.close()
            return {'activated': False, 'error': 'License expired'}
    
    # Update last seen
    c.execute('UPDATE activations SET last_seen = ? WHERE machine_id = ?',
              (datetime.now().isoformat(), machine_id))
    conn.commit()
    conn.close()
    
    # Save to activation file
    save_activation_file(data['key_code'], machine_id, expires_at, data['days_valid'])
    
    return {
        'activated': True,
        'key_code': data['key_code'],
        'machine_id': machine_id,
        'expires_at': expires_at,
        'is_lifetime': (data['days_valid'] <= 0 or expires_at is None)
    }


def deactivate_machine(machine_id: str) -> Dict:
    """Deactivate a specific machine (Admin only)"""
    init_license_db()
    
    conn = sqlite3.connect(LICENSE_DB)
    c = conn.cursor()
    
    # Get key_code for this machine
    c.execute('SELECT key_code FROM activations WHERE machine_id = ?', (machine_id,))
    row = c.fetchone()
    
    if not row:
        conn.close()
        return {'success': False, 'error': 'Machine not found'}
    
    key_code = row[0]
    
    # Delete activation
    c.execute('DELETE FROM activations WHERE machine_id = ?', (machine_id,))
    
    # Decrease activation count
    c.execute('UPDATE license_keys SET current_activations = current_activations - 1 WHERE key_code = ?',
              (key_code,))
    
    conn.commit()
    conn.close()
    
    return {'success': True, 'message': 'Machine deactivated successfully'}


def list_all_activations() -> list:
    """List all activated machines (Admin only)"""
    init_license_db()
    
    conn = sqlite3.connect(LICENSE_DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute('''
        SELECT a.*, l.expires_at, l.days_valid, l.notes
        FROM activations a
        JOIN license_keys l ON a.key_code = l.key_code
        ORDER BY a.activated_at DESC
    ''')
    
    rows = c.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def list_all_license_keys() -> list:
    """List all license keys (Admin only)"""
    init_license_db()
    
    conn = sqlite3.connect(LICENSE_DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute('SELECT * FROM license_keys ORDER BY created_at DESC')
    rows = c.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


# Initialize on import
init_license_db()
