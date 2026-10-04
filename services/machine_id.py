"""
Hardware Machine ID detection (replaces username/password login).

Reads a stable OS-level machine identifier and hashes it so the raw
hardware GUID is never exposed. Result format: XXXX-XXXX-XXXX-XXXX
"""
import os
import sys
import uuid
import hashlib
import subprocess
from functools import lru_cache

_SALT = 'ATITEBDABBER-PRO-MACHINE'


def _read_raw_machine_id() -> str:
    # Windows: HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid
    if sys.platform == 'win32':
        try:
            import winreg
            key = winreg.OpenKey(
                winreg.HKEY_LOCAL_MACHINE,
                r'SOFTWARE\Microsoft\Cryptography',
                0,
                winreg.KEY_READ | winreg.KEY_WOW64_64KEY,
            )
            value, _ = winreg.QueryValueEx(key, 'MachineGuid')
            winreg.CloseKey(key)
            if value:
                return str(value)
        except Exception:
            pass

    # macOS: IOPlatformUUID
    if sys.platform == 'darwin':
        try:
            out = subprocess.check_output(
                ['ioreg', '-rd1', '-c', 'IOPlatformExpertDevice'], text=True, timeout=5
            )
            for line in out.splitlines():
                if 'IOPlatformUUID' in line:
                    return line.split('=')[-1].strip().strip('"')
        except Exception:
            pass

    # Linux: /etc/machine-id
    for path in ('/etc/machine-id', '/var/lib/dbus/machine-id'):
        try:
            with open(path, 'r') as f:
                value = f.read().strip()
                if value:
                    return value
        except Exception:
            pass

    # Fallback: MAC address based node id
    return f'node-{uuid.getnode():012x}'


@lru_cache(maxsize=1)
def get_machine_id() -> str:
    """Return a stable, hashed machine ID for this computer."""
    raw = _read_raw_machine_id()
    digest = hashlib.sha256(f'{_SALT}:{raw}'.encode('utf-8')).hexdigest().upper()
    return '-'.join(digest[i:i + 4] for i in range(0, 16, 4))


def get_admin_machine_ids() -> set:
    """Machine IDs listed in env ADMIN_MACHINE_IDS (comma separated) get admin role."""
    raw = os.environ.get('ADMIN_MACHINE_IDS', '')
    return {m.strip().upper() for m in raw.split(',') if m.strip()}
