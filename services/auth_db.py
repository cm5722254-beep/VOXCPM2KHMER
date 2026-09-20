import os
import sqlite3
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, 'studio_auth.db')

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize SQLite tables for users, single-device sessions, and license keys."""
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL COLLATE NOCASE,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            tier TEXT NOT NULL DEFAULT 'free',
            premium_expires_at TEXT,
            has_voxcpm_license INTEGER DEFAULT 0,
            voxcpm_license_expires_at TEXT,
            voxcpm_license_key TEXT,
            current_device_id TEXT,
            created_at TEXT NOT NULL,
            is_active INTEGER DEFAULT 1
        )
    ''')
    
    cur.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            device_id TEXT,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS license_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key_code TEXT UNIQUE NOT NULL COLLATE NOCASE,
            feature TEXT NOT NULL DEFAULT 'voxcpm2',
            days_valid INTEGER NOT NULL DEFAULT 30,
            is_used INTEGER DEFAULT 0,
            used_by_user_id INTEGER,
            used_by_username TEXT,
            used_at TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(used_by_user_id) REFERENCES users(id)
        )
    ''')
    conn.commit()

    # Safely ensure all columns exist if upgrading an existing SQLite database
    for col, col_def in [
        ('has_voxcpm_license', 'INTEGER DEFAULT 0'),
        ('voxcpm_license_expires_at', 'TEXT'),
        ('voxcpm_license_key', 'TEXT'),
        ('current_device_id', 'TEXT')
    ]:
        try:
            cur.execute(f"ALTER TABLE users ADD COLUMN {col} {col_def}")
        except Exception:
            pass

    try:
        cur.execute("ALTER TABLE sessions ADD COLUMN device_id TEXT")
    except Exception:
        pass
    conn.commit()

    # Pre-seed the exclusive Master Admin: cm5722254@gmail.com
    admin_email = "cm5722254@gmail.com"
    admin_pwd = "@Iam_Cheatm2"
    
    # Remove old placeholder admin account
    cur.execute("DELETE FROM users WHERE username = 'admin'")
    
    # Demote any other account to 'user' so only cm5722254@gmail.com is admin
    cur.execute("UPDATE users SET role = 'user' WHERE username != ? AND role = 'admin'", (admin_email,))

    cur.execute("SELECT id FROM users WHERE username = ?", (admin_email,))
    admin_row = cur.fetchone()
    salt = secrets.token_hex(16)
    pwd_hash = hash_password(admin_pwd, salt)
    now_iso = datetime.now().isoformat()

    if not admin_row:
        cur.execute('''
            INSERT INTO users (username, password_hash, salt, role, tier, has_voxcpm_license, created_at, is_active)
            VALUES (?, ?, ?, 'admin', 'premium', 1, ?, 1)
        ''', (admin_email, pwd_hash, salt, now_iso))
    else:
        cur.execute('''
            UPDATE users 
            SET password_hash = ?, salt = ?, role = 'admin', tier = 'premium', has_voxcpm_license = 1, is_active = 1
            WHERE username = ?
        ''', (pwd_hash, salt, admin_email))
    conn.commit()
    conn.close()

def hash_password(password: str, salt: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with 100,000 iterations."""
    return hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()

def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    """Verify password against salt and hash."""
    return secrets.compare_digest(hash_password(password, salt), expected_hash)

def check_and_expire_subscription(user: Dict[str, Any]) -> Dict[str, Any]:
    """Auto-check if user's premium or VoxCPM2 license has expired."""
    if user.get('role') == 'admin':
        # Admin is always premium and has lifetime VoxCPM2
        user['tier'] = 'premium'
        user['has_voxcpm_license'] = 1
        return user

    conn = None

    # Check Premium expiration
    if user.get('tier') == 'premium':
        expires_at_str = user.get('premium_expires_at')
        if expires_at_str:
            try:
                expires_at = datetime.fromisoformat(expires_at_str)
                if datetime.now() >= expires_at:
                    if not conn:
                        conn = get_db()
                    cur = conn.cursor()
                    cur.execute('UPDATE users SET tier = "free", premium_expires_at = NULL WHERE id = ?', (user['id'],))
                    conn.commit()
                    user['tier'] = 'free'
                    user['premium_expires_at'] = None
            except Exception as e:
                print(f"Error checking subscription expiration: {e}")

    # Check VoxCPM2 License expiration
    if user.get('has_voxcpm_license'):
        vox_exp_str = user.get('voxcpm_license_expires_at')
        if vox_exp_str:
            try:
                vox_exp = datetime.fromisoformat(vox_exp_str)
                if datetime.now() >= vox_exp:
                    if not conn:
                        conn = get_db()
                    cur = conn.cursor()
                    cur.execute('UPDATE users SET has_voxcpm_license = 0, voxcpm_license_expires_at = NULL WHERE id = ?', (user['id'],))
                    conn.commit()
                    user['has_voxcpm_license'] = 0
                    user['voxcpm_license_expires_at'] = None
            except Exception as e:
                print(f"Error checking VoxCPM2 license expiration: {e}")

    if conn:
        conn.close()

    return user

def register_user(username: str, password: str, device_id: Optional[str] = None) -> Dict[str, Any]:
    """Register a new user (defaults to Role: user, Tier: free, VoxCPM2: LOCKED)."""
    username = username.strip()
    if len(username) < 3:
        raise ValueError("ឈ្មោះគណនីត្រូវតែមានយ៉ាងតិច ៣ តួអក្សរ")
    if len(password) < 4:
        raise ValueError("ពាក្យសម្ងាត់ត្រូវតែមានយ៉ាងតិច ៤ តួអក្សរ")

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE username = ?", (username,))
    if cur.fetchone():
        conn.close()
        raise ValueError("ឈ្មោះគណនីនេះត្រូវបានប្រើរួចហើយ សូមជ្រើសរើសឈ្មោះផ្សេង")

    salt = secrets.token_hex(16)
    pwd_hash = hash_password(password, salt)
    now_iso = datetime.now().isoformat()

    role = 'user'
    tier = 'free'
    has_voxcpm = 0  # Regular users strictly do NOT have VoxCPM2 until licensed

    cur.execute('''
        INSERT INTO users (username, password_hash, salt, role, tier, has_voxcpm_license, current_device_id, created_at, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    ''', (username, pwd_hash, salt, role, tier, has_voxcpm, device_id, now_iso))
    user_id = cur.lastrowid
    conn.commit()

    # Enforce 1 account = 1 device session strictly: clear any existing sessions
    cur.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))

    # Create new session
    token = secrets.token_hex(32)
    session_exp = (datetime.now() + timedelta(days=30)).isoformat()
    cur.execute('''
        INSERT INTO sessions (token, user_id, device_id, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (token, user_id, device_id or 'default', now_iso, session_exp))
    conn.commit()
    conn.close()

    return {
        'token': token,
        'user': {
            'id': user_id,
            'username': username,
            'role': role,
            'tier': tier,
            'has_voxcpm_license': False,
            'voxcpm_license_expires_at': None,
            'premium_expires_at': None,
            'device_id': device_id,
            'created_at': now_iso
        }
    }

def login_user(username: str, password: str, device_id: Optional[str] = None) -> Dict[str, Any]:
    """Authenticate user and enforce 1 ACCOUNT = 1 DEVICE SESSION ONLY."""
    username = username.strip()
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE username = ? AND is_active = 1", (username,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise ValueError("ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ")

    user_dict = dict(row)
    if not verify_password(password, user_dict['salt'], user_dict['password_hash']):
        conn.close()
        raise ValueError("ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ")

    # Auto-expire check
    user_dict = check_and_expire_subscription(user_dict)

    # ─────────────────────────────────────────────────────────────
    # CRITICAL: ENFORCE 1 ACCOUNT = 1 DEVICE ONLY!
    # Invalidate and delete ALL prior sessions for this user_id!
    # Any other device logged into this account is immediately disconnected.
    # ─────────────────────────────────────────────────────────────
    cur.execute("DELETE FROM sessions WHERE user_id = ?", (user_dict['id'],))

    # Generate new session token for the current device
    token = secrets.token_hex(32)
    now_iso = datetime.now().isoformat()
    session_exp = (datetime.now() + timedelta(days=30)).isoformat()

    cur.execute('''
        INSERT INTO sessions (token, user_id, device_id, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (token, user_dict['id'], device_id or 'default', now_iso, session_exp))

    # Update current device on user record
    cur.execute("UPDATE users SET current_device_id = ? WHERE id = ?", (device_id, user_dict['id']))
    conn.commit()
    conn.close()

    has_voxcpm = bool(user_dict.get('has_voxcpm_license') or user_dict.get('role') == 'admin')

    return {
        'token': token,
        'user': {
            'id': user_dict['id'],
            'username': user_dict['username'],
            'role': user_dict['role'],
            'tier': user_dict['tier'],
            'has_voxcpm_license': has_voxcpm,
            'voxcpm_license_expires_at': user_dict.get('voxcpm_license_expires_at'),
            'premium_expires_at': user_dict.get('premium_expires_at'),
            'device_id': device_id,
            'created_at': user_dict['created_at']
        }
    }

def get_user_by_token(token: str) -> Optional[Dict[str, Any]]:
    """Retrieve and validate user from active session token. Returns None if session expired or revoked by another device login."""
    if not token:
        return None

    conn = get_db()
    cur = conn.cursor()
    cur.execute('''
        SELECT u.* FROM users u
        INNER JOIN sessions s ON s.user_id = u.id
        WHERE s.token = ? AND u.is_active = 1
    ''', (token,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return None

    user_dict = dict(row)
    user_dict = check_and_expire_subscription(user_dict)
    
    # Do not expose hash and salt
    user_dict.pop('password_hash', None)
    user_dict.pop('salt', None)
    
    # Format boolean flags cleanly
    user_dict['has_voxcpm_license'] = bool(user_dict.get('has_voxcpm_license') or user_dict.get('role') == 'admin')
    return user_dict

def logout_user(token: str):
    """Delete session token."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()

# ─────────────────────────────────────────────────────────────────────────────
# LICENSE KEY MANAGEMENT (VOXCPM2 ACCESS CONTROL)
# ─────────────────────────────────────────────────────────────────────────────

def get_license_tier_label(days: int) -> str:
    """Return friendly Khmer label for standard license tiers."""
    if days == 7:
        return "សាកល្បង ៧ ថ្ងៃ (7-Day Trial)"
    elif days == 30:
        return "១ ខែ (1 Month)"
    elif days == 365:
        return "១ ឆ្នាំ (1 Year)"
    elif days == -1 or days <= 0:
        return "ជារៀងរហូត (Lifetime VIP)"
    return f"{days} ថ្ងៃ"

def create_license_key(days_valid: int = 30, feature: str = 'voxcpm2') -> Dict[str, Any]:
    """Generate a new secure License Key (Admin Only). Format: VOX-XXXX-XXXX-XXXX"""
    part1 = secrets.token_hex(2).upper()
    part2 = secrets.token_hex(2).upper()
    part3 = secrets.token_hex(2).upper()
    key_code = f"VOX-{part1}-{part2}-{part3}"
    now_iso = datetime.now().isoformat()
    # Normalize lifetime
    normalized_days = -1 if days_valid <= 0 else days_valid

    conn = get_db()
    cur = conn.cursor()
    cur.execute('''
        INSERT INTO license_keys (key_code, feature, days_valid, is_used, created_at)
        VALUES (?, ?, ?, 0, ?)
    ''', (key_code, feature, normalized_days, now_iso))
    key_id = cur.lastrowid
    conn.commit()
    conn.close()

    return {
        'id': key_id,
        'key_code': key_code,
        'feature': feature,
        'days_valid': normalized_days,
        'tier_label': get_license_tier_label(normalized_days),
        'is_used': False,
        'created_at': now_iso
    }

def activate_license_key(user_id: int, key_code: str) -> Dict[str, Any]:
    """Activate a VoxCPM2 license key for a user account."""
    clean_key = key_code.strip().upper()
    if not clean_key:
        raise ValueError("សូមបញ្ចូល Key License")

    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT * FROM license_keys WHERE key_code = ?", (clean_key,))
    key_row = cur.fetchone()
    if not key_row:
        conn.close()
        raise ValueError("Key License មិនត្រឹមត្រូវទេ សូមពិនិត្យឡើងវិញ!")

    key_dict = dict(key_row)
    if key_dict['is_used']:
        conn.close()
        raise ValueError("Key License នេះត្រូវបានប្រើប្រាស់រួចហើយ!")

    cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user_row = cur.fetchone()
    if not user_row:
        conn.close()
        raise ValueError("រកមិនឃើញគណនីអ្នកប្រើប្រាស់ឡើយ")

    username = user_row['username']
    now = datetime.now()
    now_iso = now.isoformat()
    days = key_dict['days_valid']

    if days == -1 or days <= 0:
        expires_at_iso = None  # Lifetime VIP
    else:
        expires_at_iso = (now + timedelta(days=days)).isoformat()

    # Mark key as used
    cur.execute('''
        UPDATE license_keys 
        SET is_used = 1, used_by_user_id = ?, used_by_username = ?, used_at = ?
        WHERE id = ?
    ''', (user_id, username, now_iso, key_dict['id']))

    # Upgrade user to have VoxCPM2
    cur.execute('''
        UPDATE users 
        SET has_voxcpm_license = 1, voxcpm_license_expires_at = ?, voxcpm_license_key = ?
        WHERE id = ?
    ''', (expires_at_iso, clean_key, user_id))
    conn.commit()
    conn.close()

    tier_label = get_license_tier_label(days)

    return {
        'success': True,
        'message': f"បានបើកដំណើរការ VoxCPM2 ({tier_label}) ដោយជោគជ័យ!",
        'has_voxcpm_license': True,
        'voxcpm_license_expires_at': expires_at_iso,
        'tier_label': tier_label,
        'user': {
            'id': user_id,
            'username': username,
            'role': user_row['role'],
            'tier': user_row['tier'],
            'has_voxcpm_license': True,
            'voxcpm_license_expires_at': expires_at_iso
        }
    }

def list_license_keys() -> List[Dict[str, Any]]:
    """List all generated license keys for Admin inspection."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute('''
        SELECT id, key_code, feature, days_valid, is_used, used_by_user_id, used_by_username, used_at, created_at
        FROM license_keys ORDER BY id DESC
    ''')
    rows = cur.fetchall()
    conn.close()
    res = []
    for r in rows:
        d = dict(r)
        d['tier_label'] = get_license_tier_label(d['days_valid'])
        res.append(d)
    return res

def delete_license_key(key_id: int):
    """Delete a license key from the system."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM license_keys WHERE id = ?", (key_id,))
    conn.commit()
    conn.close()

def admin_toggle_user_voxcpm(user_id: int, enable: bool, days: int = 30) -> Dict[str, Any]:
    """Directly toggle VoxCPM2 license for a user in the Admin console."""
    conn = get_db()
    cur = conn.cursor()
    
    if enable:
        now = datetime.now()
        exp_iso = (now + timedelta(days=days)).isoformat() if days != -1 else None
        cur.execute('''
            UPDATE users SET has_voxcpm_license = 1, voxcpm_license_expires_at = ? WHERE id = ?
        ''', (exp_iso, user_id))
    else:
        cur.execute('''
            UPDATE users SET has_voxcpm_license = 0, voxcpm_license_expires_at = NULL WHERE id = ?
        ''', (user_id,))
        
    conn.commit()
    conn.close()
    return {'id': user_id, 'has_voxcpm_license': enable}

# ─────────────────────────────────────────────────────────────────────────────
# USER ADMIN LISTING & MANAGEMENT
# ─────────────────────────────────────────────────────────────────────────────

def list_all_users() -> List[Dict[str, Any]]:
    """List all registered users for Admin panel."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute('''
        SELECT id, username, role, tier, premium_expires_at, has_voxcpm_license, voxcpm_license_expires_at, current_device_id, created_at, is_active 
        FROM users ORDER BY id DESC
    ''')
    rows = cur.fetchall()
    conn.close()

    users = []
    for r in rows:
        u = dict(r)
        u = check_and_expire_subscription(u)
        u['has_voxcpm_license'] = bool(u.get('has_voxcpm_license') or u.get('role') == 'admin')
        users.append(u)
    return users

def set_user_premium(user_id: int, days: int) -> Dict[str, Any]:
    """Grant Premium tier to a user with specific duration in days (or -1 for lifetime)."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise ValueError("រកមិនឃើញគណនីនេះទេ")

    if days == -1:
        expires_at_iso = None
    else:
        current_exp = row['premium_expires_at']
        if current_exp and row['tier'] == 'premium':
            try:
                base_dt = max(datetime.now(), datetime.fromisoformat(current_exp))
            except Exception:
                base_dt = datetime.now()
        else:
            base_dt = datetime.now()
        expires_at_iso = (base_dt + timedelta(days=days)).isoformat()

    cur.execute('''
        UPDATE users 
        SET tier = 'premium', premium_expires_at = ? 
        WHERE id = ?
    ''', (expires_at_iso, user_id))
    conn.commit()
    conn.close()

    return {
        'id': user_id,
        'tier': 'premium',
        'premium_expires_at': expires_at_iso
    }

def revoke_user_premium(user_id: int) -> Dict[str, Any]:
    """Downgrade a user back to Free tier."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute('''
        UPDATE users 
        SET tier = 'free', premium_expires_at = NULL 
        WHERE id = ?
    ''', (user_id,))
    conn.commit()
    conn.close()
    return {'id': user_id, 'tier': 'free', 'premium_expires_at': None}

def delete_user(user_id: int):
    """Delete a user account."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()

# Auto-initialize DB tables on module import
init_db()
