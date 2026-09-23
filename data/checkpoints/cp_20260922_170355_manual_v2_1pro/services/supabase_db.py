import os
import logging
from typing import Optional, Dict, List, Any
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("supabase_db")

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

_tables_verified: Optional[bool] = None

def get_headers() -> Dict[str, str]:
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "User-Agent": "FastAPI-Server/1.0",
        "Prefer": "return=representation"
    }

def is_supabase_enabled() -> bool:
    global _tables_verified
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return False
    if _tables_verified is True:
        return True
    try:
        url = f"{SUPABASE_URL}/rest/v1/users?select=id&limit=1"
        res = httpx.get(url, headers=get_headers(), timeout=4.0)
        if res.status_code == 200:
            _tables_verified = True
            return True
        elif res.status_code == 404:
            # Table not created yet in Supabase
            return False
    except Exception as e:
        logger.debug(f"Supabase ping error: {e}")
        return False
    return False

def sb_get(table: str, params: Optional[Dict[str, Any]] = None) -> Optional[List[Dict[str, Any]]]:
    if not is_supabase_enabled():
        return None
    try:
        url = f"{SUPABASE_URL}/rest/v1/{table}"
        res = httpx.get(url, headers=get_headers(), params=params, timeout=5.0)
        if res.status_code == 200:
            return res.json()
    except Exception as e:
        logger.error(f"Supabase GET {table} failed: {e}")
    return None

def sb_post(table: str, data: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
    if not is_supabase_enabled():
        return None
    try:
        url = f"{SUPABASE_URL}/rest/v1/{table}"
        res = httpx.post(url, headers=get_headers(), json=data, timeout=5.0)
        if res.status_code in (200, 201):
            return res.json()
        logger.error(f"Supabase POST {table} error {res.status_code}: {res.text}")
    except Exception as e:
        logger.error(f"Supabase POST {table} exception: {e}")
    return None

def sb_patch(table: str, filter_params: Dict[str, str], data: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
    if not is_supabase_enabled():
        return None
    try:
        url = f"{SUPABASE_URL}/rest/v1/{table}"
        res = httpx.patch(url, headers=get_headers(), params=filter_params, json=data, timeout=5.0)
        if res.status_code in (200, 204):
            return res.json() if res.content else []
        logger.error(f"Supabase PATCH {table} error {res.status_code}: {res.text}")
    except Exception as e:
        logger.error(f"Supabase PATCH {table} exception: {e}")
    return None

def sb_delete(table: str, filter_params: Dict[str, str]) -> bool:
    if not is_supabase_enabled():
        return False
    try:
        url = f"{SUPABASE_URL}/rest/v1/{table}"
        res = httpx.delete(url, headers=get_headers(), params=filter_params, timeout=5.0)
        return res.status_code in (200, 204)
    except Exception as e:
        logger.error(f"Supabase DELETE {table} exception: {e}")
    return False
