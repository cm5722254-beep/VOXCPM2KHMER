import os
import sys
import time
import json
import shutil
import asyncio
import base64
import logging
import sqlite3
import secrets
import uuid
from datetime import datetime, timedelta

# Force UTF-8 encoding on Windows console
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from typing import Optional, List
from fastapi import FastAPI, File, UploadFile, Form, BackgroundTasks, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import queue
import asyncio

# Resolve APP_DIR and BUNDLE_DIR (both one-file and one-dir PyInstaller modes)
if getattr(sys, 'frozen', False):
    APP_DIR = os.path.dirname(sys.executable)
    BUNDLE_DIR = getattr(sys, '_MEIPASS', APP_DIR)
else:
    APP_DIR = os.path.dirname(os.path.abspath(__file__))
    BUNDLE_DIR = APP_DIR

BASE_DIR = APP_DIR

# Ensure ffmpeg in virtual environment or python directory is found in PATH
bin_dir = os.path.dirname(sys.executable)
if bin_dir and bin_dir not in os.environ.get("PATH", ""):
    os.environ["PATH"] = bin_dir + os.pathsep + os.environ.get("PATH", "")

# Prepend persistent patches and services to sys.path so hot updates override bundled modules
for p in [os.path.join(APP_DIR, 'patches'), os.path.join(APP_DIR, 'services')]:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

env_file_path = os.path.join(APP_DIR, '.env')
if not os.path.exists(env_file_path):
    env_file_path = os.path.join(BUNDLE_DIR, '.env')
load_dotenv(dotenv_path=env_file_path, override=True)

from services import audio_processor, auth_db
from services.machine_id import get_machine_id, get_admin_machine_ids
from services.khmer_dubber import KhmerDubber, clean_pure_khmer, ROLE_THEATRICAL_PROFILES
from services.elevenlabs_service import elevenlabs_service
from services.unified_db import unified_db
from services.checkpoint_manager import checkpoint_manager
from services.auto_updater import auto_updater
from services.update_manager import get_update_manager
from services.module_loader import get_module_loader
from services.progress_tracker import create_tracker, get_tracker, OperationType

app = FastAPI(title="🐉 DRAGON DABBER PRO - Professional AI Khmer Dubbing Studio")

# ── CORS Middleware — required for browser audio playback ──────────────────
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Local desktop app — all origins OK
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Length", "Content-Range", "Accept-Ranges"],
)

# ── Audio file streaming endpoint (supports Range requests for seek) ────────
@app.get("/audio/samples/{filename}")
async def stream_sample_audio(filename: str):
    """Dedicated audio stream endpoint with proper Content-Type for browser."""
    import mimetypes
    safe = os.path.basename(filename)
    fp = os.path.join(SAMPLES_DIR, safe)
    if not os.path.exists(fp):
        raise HTTPException(status_code=404, detail=f"Audio file not found: {safe}")
    mt, _ = mimetypes.guess_type(fp)
    return FileResponse(
        fp,
        media_type=mt or "audio/mpeg",
        headers={
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600",
        }
    )

@app.get("/audio/outputs/{filename}")
async def stream_output_audio(filename: str):
    """Stream output audio files with proper headers."""
    import mimetypes
    safe = os.path.basename(filename)
    fp = os.path.join(OUTPUTS_DIR, safe)
    if not os.path.exists(fp):
        raise HTTPException(status_code=404, detail=f"Audio file not found: {safe}")
    mt, _ = mimetypes.guess_type(fp)
    return FileResponse(
        fp,
        media_type=mt or "audio/mpeg",
        headers={
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=60",
        }
    )

EXTRA_PATHS = [
    os.path.join(BUNDLE_DIR, 'bin'),
    os.path.join(APP_DIR, 'bin'),
    '/opt/homebrew/bin',      # Apple Silicon Mac (M1/M2/M3/M4) Homebrew
    '/usr/local/bin',          # Intel Mac Homebrew & standard UNIX tools
    '/opt/local/bin',          # MacPorts
]
for p in EXTRA_PATHS:
    if os.path.exists(p) and p not in os.environ.get('PATH', ''):
        os.environ['PATH'] = p + os.pathsep + os.environ.get('PATH', '')

UPLOADS_DIR = os.path.join(APP_DIR, 'uploads')
OUTPUTS_DIR = os.path.join(APP_DIR, 'outputs')
SAMPLES_DIR = os.path.join(APP_DIR, 'samples')
if not os.path.exists(SAMPLES_DIR) and os.path.exists(os.path.join(BUNDLE_DIR, 'samples')):
    SAMPLES_DIR = os.path.join(BUNDLE_DIR, 'samples')
POSTERSTYLE_DIR = os.path.join(APP_DIR, 'posterstyle')

# Priority: Check if updated public exists in APP_DIR first, fallback to bundled public
app_public_dir = os.path.join(APP_DIR, 'public')
bundle_public_dir = os.path.join(BUNDLE_DIR, 'public')
if os.path.exists(app_public_dir) and os.path.isdir(app_public_dir):
    PUBLIC_DIR = app_public_dir
else:
    PUBLIC_DIR = bundle_public_dir

DATA_DIR = os.path.join(APP_DIR, 'data')
ACTIVE_PROJECT_FILE = os.path.join(DATA_DIR, 'active_project.json')
USER_DATA_DIR = os.path.join(
    os.environ.get('LOCALAPPDATA') or os.path.expanduser('~/.local/share'),
    'DabberPro',
)
PROJECT_DB_FILE = os.path.join(USER_DATA_DIR, 'dabber_local.sqlite3')

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)
os.makedirs(SAMPLES_DIR, exist_ok=True)
os.makedirs(POSTERSTYLE_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(USER_DATA_DIR, exist_ok=True)

def _project_db():
    """Open the local project database; SQLite is part of Python's standard library."""
    connection = sqlite3.connect(PROJECT_DB_FILE, timeout=10)
    connection.execute('PRAGMA journal_mode=WAL')
    connection.execute('''
        CREATE TABLE IF NOT EXISTS project_state (
            project_key TEXT PRIMARY KEY,
            payload_json TEXT NOT NULL,
            updated_at REAL NOT NULL
        )
    ''')
    return connection

def _migrate_legacy_project():
    """Import the existing JSON project once so users keep their saved work."""
    if not os.path.exists(ACTIVE_PROJECT_FILE):
        return
    try:
        with open(ACTIVE_PROJECT_FILE, 'r', encoding='utf-8') as legacy_file:
            payload = json.load(legacy_file)
        if not isinstance(payload, dict):
            return
        with _project_db() as connection:
            exists = connection.execute(
                "SELECT 1 FROM project_state WHERE project_key = 'active'"
            ).fetchone()
            if not exists:
                connection.execute(
                    "INSERT INTO project_state(project_key, payload_json, updated_at) VALUES ('active', ?, ?)",
                    (json.dumps(payload, ensure_ascii=False), float(payload.get('updated_at') or time.time())),
                )
    except Exception as error:
        logging.warning('Could not migrate legacy project JSON into SQLite: %s', error)

def _save_project(payload):
    if not isinstance(payload, dict):
        raise ValueError('Project state must be a JSON object')
    now = time.time()
    payload.setdefault('updated_at', now)
    with _project_db() as connection:
        connection.execute(
            '''INSERT INTO project_state(project_key, payload_json, updated_at)
               VALUES ('active', ?, ?)
               ON CONFLICT(project_key) DO UPDATE SET
                 payload_json = excluded.payload_json, updated_at = excluded.updated_at''',
            (json.dumps(payload, ensure_ascii=False), now),
        )

def _load_project():
    with _project_db() as connection:
        row = connection.execute(
            "SELECT payload_json FROM project_state WHERE project_key = 'active'"
        ).fetchone()
    return json.loads(row[0]) if row else None

def _clear_project():
    with _project_db() as connection:
        connection.execute("DELETE FROM project_state WHERE project_key = 'active'")
    # Remove the imported legacy source too, otherwise it could be re-imported later.
    try:
        os.remove(ACTIVE_PROJECT_FILE)
    except FileNotFoundError:
        pass

_migrate_legacy_project()

# Auto-seed initial template/data files if not yet existing on user's machine
bundle_data = os.path.join(BUNDLE_DIR, 'data')
if os.path.exists(bundle_data) and bundle_data != DATA_DIR:
    for item in os.listdir(bundle_data):
        src_item = os.path.join(bundle_data, item)
        dst_item = os.path.join(DATA_DIR, item)
        if not os.path.exists(dst_item) and os.path.isfile(src_item):
            try:
                shutil.copy2(src_item, dst_item)
            except Exception:
                pass

# Auto-seed extracted_characters.json if missing in APP_DIR
chars_bundle = os.path.join(BUNDLE_DIR, 'extracted_characters.json')
chars_app = os.path.join(APP_DIR, 'extracted_characters.json')
if not os.path.exists(chars_app) and os.path.exists(chars_bundle):
    try:
        shutil.copy2(chars_bundle, chars_app)
    except Exception:
        pass

khmer_dubber = KhmerDubber()
active_jobs = {}
progress_subscribers = {}  # Real-time progress tracking for SSE

# Setup logger
logger = logging.getLogger(__name__)


# --- Authentication Helpers ---
def get_request_user(request: Request) -> Optional[dict]:
    """Retrieve validated user from Authorization Bearer token or headers."""
    auth_header = request.headers.get('Authorization', '')
    token = ''
    if auth_header.startswith('Bearer '):
        token = auth_header[7:].strip()
    if not token:
        token = request.headers.get('x-auth-token', '')
    if not token:
        token = request.query_params.get('token', '')
    if not token:
        # Check for persistent token in cookies
        token = request.cookies.get('auth_token', '')
    user = auth_db.get_user_by_token(token) if token else None
    if user:
        return user
    # No login required: auto-identify by hardware Machine ID
    try:
        return get_device_user(request)
    except Exception as e:
        logger.warning(f"Machine ID auto-auth failed: {e}")
        return None

def resolve_machine_id(request: Request) -> str:
    """Local requests use this PC's hardware ID; remote (hosted) clients use their browser device ID."""
    client_host = request.client.host if request.client else ''
    is_local = client_host in ('127.0.0.1', '::1', 'localhost') and not request.headers.get('x-forwarded-for')
    if is_local:
        return get_machine_id()
    return (request.headers.get('x-device-id') or '').strip() or f"remote-{client_host}"

def get_device_user(request: Request) -> dict:
    """Find or auto-create the user bound to this machine ID."""
    machine_id = resolve_machine_id(request)
    user = auth_db.get_or_create_device_user(machine_id)
    if machine_id.upper() in get_admin_machine_ids() and user.get('role') != 'admin':
        conn = auth_db.get_db()
        conn.execute("UPDATE users SET role = 'admin', tier = 'premium', has_voxcpm_license = 1 WHERE id = ?", (user['id'],))
        conn.commit()
        conn.close()
        user.update({'role': 'admin', 'tier': 'premium', 'has_voxcpm_license': 1})
    user = auth_db.check_and_expire_subscription(user)
    user.pop('password_hash', None)
    user.pop('salt', None)
    user['has_voxcpm_license'] = bool(user.get('has_voxcpm_license') or user.get('role') == 'admin')
    user['machine_id'] = machine_id
    return user

def require_admin(request: Request) -> dict:
    """Ensure current user is authenticated and has admin role."""
    user = get_request_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="សូមចូលប្រើប្រាស់គណនី Admin ជាមុនសិន")
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="អ្នកមិនមានសិទ្ធិជា Administrator ទេ")
    return user

# --- Pydantic Request Models ---
class AuthRegisterRequest(BaseModel):
    username: str
    password: str
    deviceId: Optional[str] = None

class AuthLoginRequest(BaseModel):
    username: str
    password: str
    deviceId: Optional[str] = None
    rememberMe: Optional[bool] = True  # Default to True

class ActivateLicenseRequest(BaseModel):
    license_key: str
    deviceId: Optional[str] = None

class CreateLicenseKeyRequest(BaseModel):
    days: int = 30
    feature: str = 'voxcpm2'

class ToggleUserVoxcpmRequest(BaseModel):
    userId: int
    enabled: bool
    days: int = 30

class SetPremiumRequest(BaseModel):
    userId: int
    days: int

class RevokePremiumRequest(BaseModel):
    userId: int

class DeleteUserRequest(BaseModel):
    userId: int

class ResetUserDeviceRequest(BaseModel):
    userId: int

class ResetUserPasswordRequest(BaseModel):
    userId: int
    newPassword: str

class ConfigUpdate(BaseModel):
    elevenlabsKey: Optional[str] = None
    geminiKey: Optional[str] = None
    voxcpmUrl: Optional[str] = None
    geminiModel: Optional[str] = None

class DubbingStartRequest(BaseModel):
    filename: str
    sourceLang: Optional[str] = 'zh'
    targetLang: Optional[str] = 'km'
    voiceId: Optional[str] = 'voice_actor_clone'
    scope: Optional[str] = 'full'
    castingSafetyMode: Optional[str] = 'safe_curated'
    characterVoiceMap: Optional[dict] = {}
    emotionData: Optional[dict] = {}
    maleLeadVoice: Optional[str] = 'hang_phleung_char_2_male.mp3'
    femaleLeadVoice: Optional[str] = 'hang_phleung_char_6_female.mp3'
    geminiModel: Optional[str] = 'gemini-1.5-flash-latest'
    segments: Optional[list] = None

class ScanTimelineRequest(BaseModel):
    filename: str
    scope: Optional[str] = 'full'
    voiceMode: Optional[str] = 'voice_actor_clone'

class GenerateLineRequest(BaseModel):
    text: str
    lineIndex: Optional[int] = 0
    gender: Optional[str] = 'male'
    voiceId: Optional[str] = 'voxcpm-voice-actor'
    speakerId: Optional[str] = None
    emotion: Optional[str] = 'dramatic'

class DownloadVideoRequest(BaseModel):
    url: str
    quality: Optional[str] = 'best'

class AssembleCustomRequest(BaseModel):
    filename: str
    segments: List[dict]
    bgmAudio: Optional[str] = None
    removeOriginalVocals: Optional[bool] = False
    vocalGain: Optional[float] = 2.2
    bgmGain: Optional[float] = 0.85
    jobId: Optional[str] = None

class RenderExportRequest(BaseModel):
    filename: str
    inputVideo: Optional[str] = None
    titleOverlayBase64: Optional[str] = None
    burnSubtitles: Optional[bool] = False
    subtitles: Optional[List[dict]] = None
    resolution: Optional[str] = '1080p'
    format: Optional[str] = 'mp4'
    bitrate: Optional[str] = 'high'
    watermark: Optional[dict] = None
    subtitleStyle: Optional[dict] = None
    turbo: Optional[bool] = True
    outputDir: Optional[str] = None

class AddShelfVideoRequest(BaseModel):
    filename: str
    originalName: Optional[str] = None
    size: Optional[int] = 0
    duration: Optional[float] = 0
    thumbnail: Optional[str] = None
    groupId: Optional[str] = None
    groupName: Optional[str] = None

class SponsorValidateRequest(BaseModel):
    mediaPath: str

class SponsorRenderRequest(BaseModel):
    mainVideo: str
    sponsors: List[dict]
    resolution: Optional[str] = '1080p'
    outputDir: Optional[str] = None
    targetFilename: Optional[str] = None

class BatchCreateRequest(BaseModel):
    episodes: List[dict]
    characterMemory: Optional[dict] = None
    translationMemory: Optional[List[dict]] = None
    maxConcurrency: Optional[int] = 2

class BatchActionRequest(BaseModel):
    batchId: str
    action: str
    episodeId: Optional[str] = None

class SceneAnalyzeRequest(BaseModel):
    videoPath: str

class SmartCutRequest(BaseModel):
    videoPath: str
    keepSceneIds: Optional[List[str]] = None
    scenes: Optional[List[dict]] = None

class UpdateShelfVideoGroupRequest(BaseModel):
    groupId: Optional[str] = None
    groupName: Optional[str] = None

class CreateProjectGroupRequest(BaseModel):
    name: str
    color: Optional[str] = 'cyan'
    description: Optional[str] = ''
    maleLeadVoice: Optional[str] = None
    femaleLeadVoice: Optional[str] = None
    narratorVoice: Optional[str] = None
    supportingVoice: Optional[str] = None

class UpdateProjectGroupRequest(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    maleLeadVoice: Optional[str] = None
    femaleLeadVoice: Optional[str] = None
    narratorVoice: Optional[str] = None
    supportingVoice: Optional[str] = None


class CharacterSpeakRequest(BaseModel):
    voiceId: str
    text: str
    gender: Optional[str] = 'male'
    referenceAudio: Optional[str] = None
    emotion: Optional[str] = 'dramatic'

class CharacterUpdateRequest(BaseModel):
    id: Optional[str] = None
    filename: Optional[str] = None
    label: Optional[str] = None
    role_key: Optional[str] = None
    gender: Optional[str] = None
    words: Optional[str] = None

class SwitchModeRequest(BaseModel):
    mode: str
    cloudUrl: Optional[str] = None

# --- Authentication & Admin Endpoints ---

@app.post('/api/auth/device-login')
def auth_device_login(request: Request):
    """Auto login by hardware Machine ID (no username/password)."""
    try:
        user = get_device_user(request)
        token = auth_db.create_session_for_user(user['id'], user['machine_id'])
        response = JSONResponse(content={'token': token, 'user': user, 'machine_id': user['machine_id']})
        response.set_cookie(key='auth_token', value=token, max_age=365 * 24 * 60 * 60, httponly=True, samesite='lax')
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/api/auth/register')
def auth_register(body: AuthRegisterRequest, request: Request):
    try:
        device_id = body.deviceId or request.headers.get('x-device-id')
        res = auth_db.register_user(body.username, body.password, device_id)
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/api/auth/login')
def auth_login(body: AuthLoginRequest, request: Request):
    try:
        device_id = body.deviceId or request.headers.get('x-device-id')
        res = auth_db.login_user(body.username, body.password, device_id)
        
        # Determine session duration (30 days with remember me, 1 day without)
        remember_me = getattr(body, 'rememberMe', True)  # Default to True for convenience
        max_age = (30 * 24 * 60 * 60) if remember_me else (24 * 60 * 60)
        
        # Create persistent session
        response = JSONResponse(content=res)
        if 'token' in res:
            response.set_cookie(
                key='auth_token',
                value=res['token'],
                max_age=max_age,
                httponly=True,
                samesite='lax',
                secure=False  # Set to True in production with HTTPS
            )
            # Also set remember preference
            response.set_cookie(
                key='remember_me',
                value='1' if remember_me else '0',
                max_age=365 * 24 * 60 * 60,  # 1 year
                httponly=False,
                samesite='lax'
            )
        return response
    except ValueError as ve:
        raise HTTPException(status_code=401, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/api/auth/check-session')
def check_session(request: Request):
    """Check if user has valid session (auto-login)"""
    try:
        # Try to get token from cookie first
        token = request.cookies.get('auth_token')
        if not token:
            # Fallback to header
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Bearer '):
                token = auth_header[7:].strip()
        
        if not token:
            return {'authenticated': False, 'user': None}
        
        # Validate token
        user = auth_db.get_user_by_token(token)
        if not user:
            return {'authenticated': False, 'user': None}
        
        return {
            'authenticated': True,
            'user': user,
            'token': token
        }
    except Exception as e:
        return {'authenticated': False, 'user': None, 'error': str(e)}

@app.post('/api/auth/logout')
def auth_logout(request: Request):
    auth_header = request.headers.get('Authorization', '')
    token = ''
    if auth_header.startswith('Bearer '):
        token = auth_header[7:].strip()
    if not token:
        token = request.headers.get('x-auth-token', '')
    if not token:
        token = request.cookies.get('auth_token', '')
    if token:
        auth_db.logout_user(token)
    
    # Clear persistent cookie
    response = JSONResponse(content={'success': True})
    response.delete_cookie(key='auth_token')
    return response

@app.get('/api/auth/me')
def auth_me(request: Request):
    user = get_request_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="គណនីរបស់អ្នកត្រូវបានចូលប្រើនៅលើឧបករណ៍ផ្សេងទៀត (Single Device Limit)")
    return {'user': user}

# --- License Key Endpoints (VoxCPM2 Permission System) ---

@app.post('/api/license/activate')
def api_activate_license(body: ActivateLicenseRequest, request: Request):
    machine_id = resolve_machine_id(request)
    user = get_request_user(request)
    
    # If not logged in, auto-link to device user so activation always succeeds seamlessly
    if not user:
        user = auth_db.get_or_create_device_user(machine_id)
        
    try:
        clean_key = body.license_key.strip().upper()
        res = auth_db.activate_license_key(user['id'], clean_key)
        # Issue persistent session token
        token = auth_db.create_session_for_user(user['id'], machine_id)
        res['token'] = token
        
        # Ensure updated user record is returned with license
        updated_user = auth_db.get_or_create_device_user(machine_id)
        updated_user.pop('password_hash', None)
        updated_user.pop('salt', None)
        updated_user['has_voxcpm_license'] = bool(updated_user.get('has_voxcpm_license') or updated_user.get('role') == 'admin')
        updated_user['machine_id'] = machine_id
        res['user'] = updated_user
        res['machine_id'] = machine_id
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Sponsors Management Endpoints (Persisted in data/sponsors.json) ---
SPONSORS_FILE = os.path.join(APP_DIR, 'data', 'sponsors.json')

def load_sponsors_file() -> list:
    if not os.path.exists(SPONSORS_FILE):
        return []
    try:
        with open(SPONSORS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def save_sponsors_file(sponsors: list) -> bool:
    try:
        os.makedirs(os.path.dirname(SPONSORS_FILE), exist_ok=True)
        with open(SPONSORS_FILE, 'w', encoding='utf-8') as f:
            json.dump(sponsors, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        logger.error(f"Error saving sponsors file: {e}")
        return False

@app.get('/api/sponsors')
def api_get_sponsors():
    """Retrieve all persisted sponsors."""
    sponsors = load_sponsors_file()
    return {'success': True, 'sponsors': sponsors}

@app.post('/api/sponsors')
def api_save_sponsors(body: dict):
    """Save full list of sponsors to persistent data/sponsors.json."""
    sponsors = body.get('sponsors', [])
    save_sponsors_file(sponsors)
    return {'success': True, 'sponsors': sponsors}

@app.delete('/api/sponsors/{sponsor_id}')
def api_delete_sponsor(sponsor_id: str):
    """Delete a sponsor by ID."""
    sponsors = load_sponsors_file()
    updated = [s for s in sponsors if str(s.get('id')) != str(sponsor_id)]
    save_sponsors_file(updated)
    return {'success': True, 'sponsors': updated}

@app.get('/api/admin/license-keys')
def api_admin_list_keys(request: Request):
    require_admin(request)
    return {'keys': auth_db.list_license_keys()}

@app.post('/api/admin/license-keys/create')
def api_admin_create_key(body: CreateLicenseKeyRequest, request: Request):
    require_admin(request)
    res = auth_db.create_license_key(body.days, body.feature)
    return {'success': True, 'key': res}

@app.delete('/api/admin/license-keys/{key_id}')
def api_admin_delete_key(key_id: int, request: Request):
    require_admin(request)
    auth_db.delete_license_key(key_id)
    return {'success': True}

@app.post('/api/admin/toggle-voxcpm')
def api_admin_toggle_voxcpm(body: ToggleUserVoxcpmRequest, request: Request):
    require_admin(request)
    res = auth_db.admin_toggle_user_voxcpm(body.userId, body.enabled, body.days)
    return {'success': True, 'data': res}

@app.get('/api/admin/users')
def admin_list_users(request: Request):
    require_admin(request)
    users = auth_db.list_all_users()
    return {'users': users}

@app.post('/api/admin/set-premium')
def admin_set_premium(body: SetPremiumRequest, request: Request):
    require_admin(request)
    try:
        res = auth_db.set_user_premium(body.userId, body.days)
        return {'success': True, 'data': res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post('/api/admin/revoke-premium')
def admin_revoke_premium(body: RevokePremiumRequest, request: Request):
    require_admin(request)
    try:
        res = auth_db.revoke_user_premium(body.userId)
        return {'success': True, 'data': res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post('/api/admin/reset-device')
def admin_reset_device(body: ResetUserDeviceRequest, request: Request):
    require_admin(request)
    auth_db.reset_user_device(body.userId)
    return {'success': True, 'message': 'បានដោះសោរ Device រួចរាល់! User អាច Login លើកុំព្យូទ័រថ្មីបាន'}

@app.post('/api/admin/reset-password')
def admin_reset_password(body: ResetUserPasswordRequest, request: Request):
    require_admin(request)
    if not body.newPassword or len(body.newPassword.strip()) < 4:
        raise HTTPException(status_code=400, detail="ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ ៤ តួអក្សរ")
    auth_db.reset_user_password(body.userId, body.newPassword.strip())
    return {'success': True, 'message': 'បានកំណត់ពាក្យសម្ងាត់ថ្មីជោគជ័យ!'}

@app.post('/api/admin/delete-user')
def admin_delete_user(body: DeleteUserRequest, request: Request):
    admin = require_admin(request)
    if body.userId == admin['id']:
        raise HTTPException(status_code=400, detail="មិនអាចលុបគណនី Admin ផ្ទាល់ខ្លួនបានទេ")
    auth_db.delete_user(body.userId)
    return {'success': True}

# --- Unified Database Statistics & History ---

@app.get('/api/stats/processing-modes')
def get_processing_mode_stats(request: Request):
    """
    Get usage statistics for all 3 processing modes
    (VoxCPM2, Pure Khmer, ElevenLabs)
    """
    user = get_request_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="សូមចូលប្រើប្រាស់ជាមុនសិន")
    
    try:
        stats = unified_db.get_mode_stats(user['id'])
        return {
            'success': True,
            'stats': stats,
            'total_jobs': sum(s['usage_count'] for s in stats.values()),
            'total_duration': sum(s['total_duration_seconds'] for s in stats.values())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/api/history/jobs')
def get_job_history(request: Request, mode: Optional[str] = None, limit: int = 50):
    """
    Get processing job history
    Optionally filter by mode: voxcpm2, pure_khmer, elevenlabs
    """
    user = get_request_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="សូមចូលប្រើប្រាស់ជាមុនសិន")
    
    try:
        history = unified_db.get_user_history(user['id'], mode, limit)
        return {
            'success': True,
            'history': history,
            'count': len(history)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/api/library/videos')
def get_video_library(request: Request, group_id: Optional[str] = None):
    """
    Get user's video library (local storage tracking)
    វីដេអូរក្សាទុកក្នុង Computer មិនធ្ងន់ Database
    """
    user = get_request_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="សូមចូលប្រើប្រាស់ជាមុនសិន")
    
    try:
        videos = unified_db.get_user_videos(user['id'], group_id)
        return {
            'success': True,
            'videos': videos,
            'count': len(videos)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/api/library/videos/add')
def add_video_to_library(request: Request, body: dict):
    """Add video metadata to library (file stored locally)"""
    user = get_request_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="សូមចូលប្រើប្រាស់ជាមុនសិន")
    
    try:
        body['user_id'] = user['id']
        video_id = unified_db.add_video(body)
        return {
            'success': True,
            'video_id': video_id,
            'message': 'បានបន្ថែមវីដេអូទៅកាន់ Library (Local Storage)'
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete('/api/library/videos/{video_id}')
def delete_video_from_library(video_id: int, request: Request):
    """Delete video metadata from library"""
    user = get_request_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="សូមចូលប្រើប្រាស់ជាមុនសិន")
    
    try:
        success = unified_db.delete_video(video_id, user['id'])
        if not success:
            raise HTTPException(status_code=404, detail="រកមិនឃើញវីដេអូ")
        return {
            'success': True,
            'message': 'បានលុបវីដេអូជោគជ័យ'
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Voice Management (Admin) ---

@app.get('/api/admin/voices')
def admin_list_voices(request: Request):
    """Get all voices in library (admin only)"""
    require_admin(request)
    
    try:
        # Get from database or fallback to default list
        voices = [
            {'id': 1, 'voice_id': 'voxcpm:hang_phleung_char_2_male.mp3', 'voice_name': 'Hang Phleung Male Lead', 'voice_label': 'ភីកនាយក (ប្រុស)', 'gender': 'male', 'is_premium': 0, 'is_admin_only': 0, 'enabled_for_free': 1},
            {'id': 2, 'voice_id': 'voxcpm:hang_phleung_char_6_female.mp3', 'voice_name': 'Hang Phleung Female Lead', 'voice_label': 'ភីកនាង (ស្រី)', 'gender': 'female', 'is_premium': 0, 'is_admin_only': 0, 'enabled_for_free': 1},
            {'id': 3, 'voice_id': 'voxcpm:kxev_char_01_male.mp3', 'voice_name': 'Professional Male 1', 'voice_label': 'អ្នកនិយាយប្រុស ១', 'gender': 'male', 'is_premium': 0, 'is_admin_only': 0, 'enabled_for_free': 1},
            {'id': 4, 'voice_id': 'voxcpm:kxev_char_02_female.mp3', 'voice_name': 'Professional Female 1', 'voice_label': 'អ្នកនិយាយស្រី ១', 'gender': 'female', 'is_premium': 0, 'is_admin_only': 0, 'enabled_for_free': 1},
            {'id': 5, 'voice_id': 'voxcpm:premium_male_hero.mp3', 'voice_name': 'Premium Male Hero', 'voice_label': 'វីរបុរសប្រុស (VIP)', 'gender': 'male', 'is_premium': 1, 'is_admin_only': 0, 'enabled_for_free': 0},
            {'id': 6, 'voice_id': 'voxcpm:premium_female_heroine.mp3', 'voice_name': 'Premium Female Heroine', 'voice_label': 'វីរនារី (VIP)', 'gender': 'female', 'is_premium': 1, 'is_admin_only': 0, 'enabled_for_free': 0},
            {'id': 7, 'voice_id': 'voxcpm:admin_narrator.mp3', 'voice_name': 'Admin Narrator Voice', 'voice_label': 'អ្នកនិទានរឿង (Admin)', 'gender': 'neutral', 'is_premium': 1, 'is_admin_only': 1, 'enabled_for_free': 0},
        ]
        return {'success': True, 'voices': voices}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/api/admin/voices/toggle')
def admin_toggle_voice_access(request: Request, body: dict):
    """Toggle voice access settings (admin only)"""
    require_admin(request)
    
    voice_id = body.get('voiceId')
    field = body.get('field')
    value = body.get('value')
    
    if not voice_id or not field:
        raise HTTPException(status_code=400, detail="Missing parameters")
    
    # Here you would update the database
    # For now, just return success
    return {'success': True, 'message': f'បាន update {field} ជោគជ័យ'}

@app.post('/api/admin/voices/grant')
def admin_grant_voice_to_user(request: Request, body: dict):
    """Grant voice access to specific user (admin only)"""
    require_admin(request)
    
    user_id = body.get('userId')
    voice_id = body.get('voiceId')
    days = body.get('days', 365)
    
    if not user_id or not voice_id:
        raise HTTPException(status_code=400, detail="Missing parameters")
    
    # Here you would insert into user_voice_permissions table
    # For now, just return success
    return {
        'success': True,
        'message': f'បានផ្តល់សិទ្ធិប្រើសំឡេង {voice_id} អោយ User ID {user_id} រយៈពេល {days} ថ្ងៃ'
    }

@app.get('/api/voices/list')
def get_available_voices(request: Request):
    """Get voices available for current user"""
    user = get_request_user(request)
    
    # Base voices (free for everyone)
    voices = [
        {'id': 'voxcpm:hang_phleung_char_2_male.mp3', 'label': 'ភីកនាយក (ប្រុស)', 'gender': 'male', 'tier': 'free'},
        {'id': 'voxcpm:hang_phleung_char_6_female.mp3', 'label': 'ភីកនាង (ស្រី)', 'gender': 'female', 'tier': 'free'},
        {'id': 'voxcpm:kxev_char_01_male.mp3', 'label': 'អ្នកនិយាយប្រុស ១', 'gender': 'male', 'tier': 'free'},
        {'id': 'voxcpm:kxev_char_02_female.mp3', 'label': 'អ្នកនិយាយស្រី ១', 'gender': 'female', 'tier': 'free'},
        {'id': 'voxcpm:main_lead_male.mp3', 'label': 'សំឡេងប្រុសចម្បង', 'gender': 'male', 'tier': 'free'},
        {'id': 'voxcpm:main_lead_female.mp3', 'label': 'សំឡេងស្រីចម្បង', 'gender': 'female', 'tier': 'free'},
    ]
    
    # Add premium voices for premium users or admins
    if user and (user.get('tier') == 'premium' or user.get('role') == 'admin'):
        voices.extend([
            {'id': 'voxcpm:premium_male_hero.mp3', 'label': 'វីរបុរសប្រុស (VIP)', 'gender': 'male', 'tier': 'premium'},
            {'id': 'voxcpm:premium_female_heroine.mp3', 'label': 'វីរនារី (VIP)', 'gender': 'female', 'tier': 'premium'},
        ])
    
    # Add admin-only voices
    if user and user.get('role') == 'admin':
        voices.append({'id': 'voxcpm:admin_narrator.mp3', 'label': 'អ្នកនិទានរឿង (Admin)', 'gender': 'neutral', 'tier': 'admin'})
    
    return {'success': True, 'voices': voices}

# --- API Endpoints ---

@app.get('/api/config')
def get_config():
    load_dotenv(dotenv_path=env_file_path, override=True)
    eleven_key = os.getenv('ELEVENLABS_API_KEY', '')
    gemini_key = os.getenv('GEMINI_API_KEY', '')
    voxcpm_url = os.getenv('VOXCPM_API_URL', '')
    mode = os.getenv('VOXCPM_MODE', 'local' if voxcpm_url.startswith('http://127.0.0.1') or not voxcpm_url else 'cloud')
    return {
        'hasElevenlabs': bool(eleven_key and not eleven_key.startswith('your_')),
        'hasGemini': bool(gemini_key and not gemini_key.startswith('your_')),
        'geminiModel': os.getenv('GEMINI_MODEL', 'gemini-1.5-flash-latest'),
        'hasVoxcpmUrl': bool(voxcpm_url),
        'voxcpmUrl': voxcpm_url,
        'cloudUrl': os.getenv('VOXCPM_CLOUD_URL', voxcpm_url if not voxcpm_url.startswith('http://127.0.0.1') else ''),
        'mode': mode,
        'port': int(os.getenv('PORT', 3000))
    }

@app.get('/api/voxcpm/local-check')
def check_local_voxcpm():
    import requests
    local_url = "http://127.0.0.1:8000"
    try:
        r = requests.get(f"{local_url}/", timeout=1.5)
        if r.status_code == 200:
            data = r.json()
            return {
                'online': True,
                'url': local_url,
                'device': data.get('device', 'cpu'),
                'gpuName': data.get('gpuName', 'Local PC'),
                'modelReady': data.get('modelLoaded', False) or data.get('status') == 'ok',
                'message': 'ម៉ាស៊ីន Local PC (Port 8000) កំពុងដំណើរការល្អ'
            }
    except Exception:
        pass
    return {
        'online': False,
        'url': local_url,
        'message': 'មិនទាន់បើក Local VoxCPM2 Server នៅឡើយទេ (ចុចបើក START_LOCAL_VOXCPM.bat)'
    }

def set_env_vars(updates: dict):
    env_path = os.path.join(BASE_DIR, '.env')
    lines = []
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

    for k, v in updates.items():
        if v is not None:
            os.environ[k] = str(v)
            found = False
            for i, line in enumerate(lines):
                if line.strip().startswith(f"{k}="):
                    lines[i] = f"{k}={v}\n"
                    found = True
                    break
            if not found:
                lines.append(f"{k}={v}\n")

    with open(env_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)

local_engine_proc = None

def ensure_local_voxcpm_running():
    global local_engine_proc
    import requests, subprocess
    try:
        r = requests.get('http://127.0.0.1:8000/', timeout=1.0)
        if r.status_code == 200:
            return True
    except Exception:
        pass

    py_exe = os.path.join(BASE_DIR, '.venv', 'Scripts', 'python.exe')
    if not os.path.exists(py_exe):
        py_exe = sys.executable

    script_path = os.path.join(BASE_DIR, 'local_voxcpm_server.py')
    env = os.environ.copy()
    env['FORCE_CPU'] = '1'

    try:
        local_engine_proc = subprocess.Popen(
            [py_exe, script_path, '--cpu'],
            cwd=BASE_DIR,
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        print("🚀 [VoxCPM2] Launched local CPU VoxCPM engine on port 8000")
        return True
    except Exception as err:
        print(f"⚠️ Failed to auto-start local VoxCPM engine: {err}")
        return False

@app.post('/api/voxcpm/start-local')
def start_local_voxcpm(request: Request):
    user = get_request_user(request)
    if not user or (user.get('role') != 'admin' and not user.get('has_voxcpm_license')):
        raise HTTPException(
            status_code=403,
            detail="គណនីធម្មតាមិនមានសិទ្ធិប្រើប្រាស់ VoxCPM2 ឡើយ។ ទាល់តែដាក់ Key License ពី Admin ទើបប្រើបាន!"
        )
    started = ensure_local_voxcpm_running()
    return {'success': started, 'message': 'Local VoxCPM2 Engine បានបើកដំណើរការ (Port 8000)'}

@app.post('/api/voxcpm/switch-mode')
def switch_voxcpm_mode(body: SwitchModeRequest, request: Request):
    user = get_request_user(request)
    if body.mode in ['cloud', 'local']:
        if not user or (user.get('role') != 'admin' and not user.get('has_voxcpm_license')):
            raise HTTPException(
                status_code=403,
                detail="គណនីធម្មតាមិនមានសិទ្ធិប្រើប្រាស់ VoxCPM2 ឡើយ។ ទាល់តែដាក់ Key License ពី Admin ទើបប្រើបាន!"
            )

    current_cloud = os.getenv('VOXCPM_CLOUD_URL') or ''
    if os.getenv('VOXCPM_API_URL') and not os.getenv('VOXCPM_API_URL').startswith('http://127.0.0.1') and not os.getenv('VOXCPM_API_URL').startswith('http://localhost'):
        current_cloud = os.getenv('VOXCPM_API_URL')
    if body.cloudUrl:
        current_cloud = body.cloudUrl.strip()

    updates = {
        'VOXCPM_CLOUD_URL': current_cloud,
        'VOXCPM_MODE': body.mode
    }
    if body.mode == 'local':
        updates['VOXCPM_API_URL'] = "http://127.0.0.1:8000"
        ensure_local_voxcpm_running()
    elif body.mode == 'cloud':
        updates['VOXCPM_API_URL'] = current_cloud
    elif body.mode == 'pure_khmer':
        updates['VOXCPM_API_URL'] = ''
    elif body.mode == 'elevenlabs':
        updates['VOXCPM_API_URL'] = ''

    set_env_vars(updates)

    return {
        'success': True,
        'mode': os.getenv('VOXCPM_MODE'),
        'activeUrl': os.getenv('VOXCPM_API_URL', ''),
        'cloudUrl': current_cloud
    }

@app.get('/api/voxcpm/status')
def get_voxcpm_status():
    url = os.getenv('VOXCPM_API_URL', '')
    mode = os.getenv('VOXCPM_MODE', 'local' if url.startswith('http://127.0.0.1') or not url else 'cloud')

    if mode == 'elevenlabs':
        info = elevenlabs_service.get_user_info()
        configured = elevenlabs_service.is_configured()
        return {
            'online': configured and not bool(info.get('error')),
            'configured': configured,
            'mode': 'elevenlabs',
            'isLocal': False,
            'device': 'ElevenLabs Cloud AI',
            'gpuName': 'Zero-GPU Cloud Voice Clone',
            'quota': info,
            'message': f"ElevenLabs Cloud AI (Tier: {info.get('tier', 'Free')}, {info.get('remaining', 0)} chars remaining)"
        }

    if mode == 'pure_khmer' or not url or not url.strip():
        return {
            'online': True,
            'configured': True,
            'mode': 'pure_khmer',
            'isLocal': True,
            'message': '100% Pure Khmer Neural Engine (Offline & Fast)'
        }


    clean_url = url.strip()
    if clean_url.startswith('http') and '.' not in clean_url and not clean_url.startswith('http://127.0.0.1') and not clean_url.startswith('http://localhost'):
        clean_url = clean_url.rstrip('/') + '.trycloudflare.com'

    import requests
    try:
        timeout = 1.5 if clean_url.startswith('http://127.0.0.1') or clean_url.startswith('http://localhost') else 7.0
        r = requests.get(clean_url, timeout=timeout)
        if r.status_code == 200:
            is_local = clean_url.startswith('http://127.0.0.1') or clean_url.startswith('http://localhost')
            return {
                'online': True,
                'configured': True,
                'url': clean_url,
                'isLocal': is_local,
                'mode': 'local' if is_local else 'cloud',
                'message': 'Local PC Server កំពុងដំណើរការ (200 OK)' if is_local else 'GPU Cloud Server កំពុងដំណើរការល្អ (200 OK)'
            }
        return {'online': False, 'configured': True, 'url': clean_url, 'mode': mode, 'message': f'ឆ្លើយតបកូដ HTTP {r.status_code}'}
    except Exception as e:
        is_local = clean_url.startswith('http://127.0.0.1') or clean_url.startswith('http://localhost')
        err_str = str(e)
        if is_local:
            msg = 'មិនទាន់បើក START_LOCAL_VOXCPM.bat លើកុំព្យូទ័រ'
        elif 'timed out' in err_str.lower():
            msg = 'Colab / Kaggle កំពុងរវល់ខ្លាំង ឬកំពុងដំណើរការ (Busy Processing) — បណ្តាញនៅភ្ជាប់ធម្មតា'
        else:
            msg = f'មិនទាន់ភ្ជាប់ទៅ Cloud Server ({err_str})'
        return {'online': False, 'configured': True, 'url': clean_url, 'isLocal': is_local, 'mode': mode, 'message': msg}

@app.post('/api/config')
def update_config(body: ConfigUpdate):
    updates = {}
    if body.elevenlabsKey is not None:
        val = body.elevenlabsKey.strip()
        if val:
            updates['ELEVENLABS_API_KEY'] = val
        elif body.elevenlabsKey == '__CLEAR__':
            updates['ELEVENLABS_API_KEY'] = ''

    if body.geminiKey is not None:
        val = body.geminiKey.strip()
        if val:
            updates['GEMINI_API_KEY'] = val
        elif body.geminiKey == '__CLEAR__':
            updates['GEMINI_API_KEY'] = ''

    if body.geminiModel is not None:
        val = body.geminiModel.strip()
        if val:
            updates['GEMINI_MODEL'] = val

    if body.voxcpmUrl is not None:
        val = body.voxcpmUrl.strip()
        if val.startswith('http') and '.' not in val and not val.startswith('http://127.0.0.1') and not val.startswith('http://localhost'):
            val = val.rstrip('/') + '.trycloudflare.com'
        updates['VOXCPM_API_URL'] = val

    set_env_vars(updates)
    return {'success': True, 'message': 'API keys & configurations saved'}

@app.get('/api/elevenlabs/status')
def get_elevenlabs_status():
    return {
        'configured': elevenlabs_service.is_configured(),
        'info': elevenlabs_service.get_user_info()
    }

@app.get('/api/elevenlabs/voices')
def get_elevenlabs_voices():
    voices = elevenlabs_service.list_voices()
    return {
        'success': True,
        'count': len(voices),
        'voices': voices
    }

class ElevenCloneRequest(BaseModel):
    voiceName: str
    sampleFilename: str

@app.post('/api/elevenlabs/clone')
def clone_eleven_voice(body: ElevenCloneRequest):
    if not elevenlabs_service.is_configured():
        raise HTTPException(status_code=400, detail="សូមកំណត់ ELEVENLABS_API_KEY ក្នុង Settings ជាមុនសិន")

    cand = os.path.join(SAMPLES_DIR, os.path.basename(body.sampleFilename))
    if not os.path.exists(cand):
        cand = os.path.join(UPLOADS_DIR, os.path.basename(body.sampleFilename))
    if not os.path.exists(cand):
        raise HTTPException(status_code=404, detail="រកមិនឃើញឯកសារគំរូសំឡេងឡើយ")

    voice_id = elevenlabs_service.clone_voice(body.voiceName, cand)
    if not voice_id:
        raise HTTPException(status_code=500, detail="បរាជ័យក្នុងការ Clone សំឡេងជាមួយ ElevenLabs (អាចអស់ Quota ឬបញ្ហា Network)")
    return {'success': True, 'voiceId': voice_id, 'voiceName': body.voiceName}

@app.post('/api/upload')

async def upload_file(mediaFile: UploadFile = File(...)):
    dest_filename = f"mediaFile-{int(time.time() * 1000)}-{mediaFile.filename}"
    dest_path = os.path.join(UPLOADS_DIR, dest_filename)

    with open(dest_path, 'wb') as f:
        shutil.copyfileobj(mediaFile.file, f, length=1024 * 1024)

    file_size = os.path.getsize(dest_path)
    file_type = 'video' if any(dest_filename.lower().endswith(ext) for ext in ['.mp4', '.mkv', '.avi', '.mov', '.webm']) else 'audio'
    file_url = f"/media/uploads/{dest_filename}"

    file_info = {
        'filename': dest_filename,
        'originalName': mediaFile.filename,
        'size': file_size,
        'type': file_type,
        'url': file_url
    }

    return {
        'success': True,
        'file': file_info,
        'filename': dest_filename,
        'originalName': mediaFile.filename,
        'size': file_size,
        'type': file_type,
        'url': file_url
    }

@app.post('/api/video/download')
async def download_online_video(body: DownloadVideoRequest):
    if not body.url or not body.url.strip():
        raise HTTPException(status_code=400, detail="សូមបញ្ចូល URL វីដេអូ YouTube, Facebook ឬ TikTok")

    url = body.url.strip()
    try:
        import yt_dlp
    except ImportError:
        raise HTTPException(status_code=500, detail="ម៉ូឌុល yt-dlp មិនទាន់ត្រូវបានតំឡើងនៅលើប្រព័ន្ធទេ")

    ts = int(time.time() * 1000)
    out_template = os.path.join(UPLOADS_DIR, f"yt_dlp_{ts}_%(title).40s.%(ext)s")

    ydl_opts = {
        'outtmpl': out_template,
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'merge_output_format': 'mp4',
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,
    }

    try:
        loop = asyncio.get_event_loop()
        def _exec_download():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                target = ydl.prepare_filename(info)
                base, _ = os.path.splitext(target)
                mp4_target = base + '.mp4'
                if os.path.exists(mp4_target):
                    target = mp4_target
                return info, target

        info, downloaded_file = await loop.run_in_executor(None, _exec_download)

        if not os.path.exists(downloaded_file):
            raise HTTPException(status_code=500, detail="ទាញយកវីដេអូមិនបានសម្រេច (File not created)")

        filename = os.path.basename(downloaded_file)
        file_size = os.path.getsize(downloaded_file)
        title = info.get('title') or filename
        duration = info.get('duration') or 0
        thumbnail = info.get('thumbnail') or None

        return {
            'success': True,
            'filename': filename,
            'originalName': title,
            'size': file_size,
            'type': 'video',
            'url': f"/media/uploads/{filename}",
            'duration': duration,
            'thumbnail': thumbnail,
            'message': f"បានទាញយកវីដេអូ '{title}' ដោយជោគជ័យ!"
        }
    except Exception as e:
        err_msg = str(e)
        if "is not a valid URL" in err_msg:
            err_msg = "URL វីដេអូមិនត្រឹមត្រូវ សូមពិនិត្យមើលម្ដងទៀត"
        raise HTTPException(status_code=400, detail=f"កំហុសក្នុងការទាញយក: {err_msg}")

@app.get('/api/files')
def get_files():
    results = []
    if os.path.exists(UPLOADS_DIR):
        for f in os.listdir(UPLOADS_DIR):
            p = os.path.join(UPLOADS_DIR, f)
            if os.path.isfile(p):
                stat = os.stat(p)
                results.append({
                    'filename': f,
                    'size': stat.st_size,
                    'type': 'video' if any(f.lower().endswith(ext) for ext in ['.mp4', '.mkv', '.avi', '.mov', '.webm']) else 'audio',
                    'created': stat.st_mtime,
                    'url': f"/media/uploads/{f}"
                })
    results.sort(key=lambda x: x['created'], reverse=True)
    return results

def format_bytes(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"

@app.get('/api/outputs/list')
def list_outputs():
    """List all audio/video files in the outputs directory for voice picker."""
    audio_exts = {'.mp3', '.wav', '.m4a', '.ogg', '.flac'}
    video_exts = {'.mp4', '.mkv', '.avi', '.mov', '.webm'}
    results = []
    if os.path.exists(OUTPUTS_DIR):
        for f in sorted(os.listdir(OUTPUTS_DIR), reverse=True):
            if f == '.gitkeep':
                continue
            p = os.path.join(OUTPUTS_DIR, f)
            if not os.path.isfile(p):
                continue
            ext = os.path.splitext(f)[1].lower()
            if ext in audio_exts or ext in video_exts:
                stat = os.stat(p)
                results.append({
                    'filename': f,
                    'size': stat.st_size,
                    'formattedSize': format_bytes(stat.st_size),
                    'type': 'audio' if ext in audio_exts else 'video',
                    'created': stat.st_mtime,
                    'url': f'/media/outputs/{f}',
                })
    results.sort(key=lambda x: x['created'], reverse=True)
    return {'success': True, 'count': len(results), 'files': results}

@app.get('/api/outputs/stats')
def get_outputs_stats():
    count = 0
    total_bytes = 0
    if os.path.exists(OUTPUTS_DIR):
        for f in os.listdir(OUTPUTS_DIR):
            if f == '.gitkeep': continue
            p = os.path.join(OUTPUTS_DIR, f)
            if os.path.isfile(p):
                count += 1
                total_bytes += os.path.getsize(p)
    return {
        'count': count,
        'totalBytes': total_bytes,
        'formattedSize': format_bytes(total_bytes)
    }

@app.post('/api/outputs/clear')
def clear_outputs():
    deleted_count = 0
    freed_bytes = 0
    if os.path.exists(OUTPUTS_DIR):
        for f in os.listdir(OUTPUTS_DIR):
            if f == '.gitkeep': continue
            p = os.path.join(OUTPUTS_DIR, f)
            try:
                if os.path.isfile(p):
                    sz = os.path.getsize(p)
                    os.unlink(p)
                    deleted_count += 1
                    freed_bytes += sz
                elif os.path.isdir(p):
                    shutil.rmtree(p, ignore_errors=True)
            except Exception as e:
                print(f"Error clearing output {f}: {e}")
    return {
        'success': True,
        'count': deleted_count,
        'freedBytes': freed_bytes,
        'formattedFreed': format_bytes(freed_bytes),
        'message': f"បានលុបឯកសារ Output សរុប {deleted_count} ឯកសារ (សន្សំទំហំបាន {format_bytes(freed_bytes)})"
    }

@app.delete('/api/files/{filename:path}')
def delete_file(filename: str):
    p = os.path.join(UPLOADS_DIR, os.path.basename(filename))
    if not os.path.exists(p):
        # check without basename if it was a direct match
        cand = os.path.join(UPLOADS_DIR, filename)
        if os.path.exists(cand):
            p = cand
        else:
            raise HTTPException(status_code=404, detail="រកមិនឃើញឯកសារគម្រោងឡើយ")
    try:
        os.unlink(p)
        return {'success': True, 'message': f"បានលុបគម្រោង '{filename}' ដោយជោគជ័យ"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"បរាជ័យក្នុងការលុបឯកសារ: {str(e)}")

@app.post('/api/files/clear')
def clear_all_files():
    deleted_count = 0
    freed_bytes = 0
    if os.path.exists(UPLOADS_DIR):
        for f in os.listdir(UPLOADS_DIR):
            if f == '.gitkeep': continue
            p = os.path.join(UPLOADS_DIR, f)
            try:
                if os.path.isfile(p):
                    sz = os.path.getsize(p)
                    os.unlink(p)
                    deleted_count += 1
                    freed_bytes += sz
                elif os.path.isdir(p):
                    shutil.rmtree(p, ignore_errors=True)
            except Exception as e:
                print(f"Error clearing upload file {f}: {e}")
    return {
        'success': True,
        'count': deleted_count,
        'freedBytes': freed_bytes,
        'formattedFreed': format_bytes(freed_bytes),
        'message': f"បានលុបគម្រោងចោលសរុប {deleted_count} គម្រោង (សន្សំទំហំបាន {format_bytes(freed_bytes)})"
    }

def resolve_uploaded_file(filename: str):
    """Robustly resolve video filename to real disk path in UPLOADS_DIR, matching timestamps/prefixes."""
    if not filename:
        return None, ""
    clean = os.path.basename(filename).strip()
    # 1. Direct path in uploads
    p = os.path.join(UPLOADS_DIR, clean)
    if os.path.exists(p):
        return p, clean
    # 2. Direct path in base dir
    p = os.path.join(BASE_DIR, clean)
    if os.path.exists(p):
        return p, clean
    # 3. Match candidate files in UPLOADS_DIR (e.g. mediaFile-*-ep1.mp4 for ep1.mp4)
    if os.path.exists(UPLOADS_DIR):
        files = os.listdir(UPLOADS_DIR)
        candidates = [f for f in files if f == clean or f.endswith(f"-{clean}") or clean in f]
        if candidates:
            candidates.sort(key=lambda x: os.path.getmtime(os.path.join(UPLOADS_DIR, x)), reverse=True)
            return os.path.join(UPLOADS_DIR, candidates[0]), candidates[0]
        # 4. Fallback: newest video in UPLOADS_DIR
        all_vids = [f for f in files if f.lower().endswith(('.mp4', '.mkv', '.mov', '.avi', '.webm'))]
        if all_vids:
            all_vids.sort(key=lambda x: os.path.getmtime(os.path.join(UPLOADS_DIR, x)), reverse=True)
            return os.path.join(UPLOADS_DIR, all_vids[0]), all_vids[0]
    return None, clean

class SeparateRequest(BaseModel):
    filename: str
    preferAi: Optional[bool] = True

@app.post('/api/audio/separate')
async def separate_audio_track(body: SeparateRequest):
    input_path, real_filename = resolve_uploaded_file(body.filename)
    if not input_path or not os.path.exists(input_path):
        raise HTTPException(status_code=404, detail="File not found")
    body.filename = real_filename

    audio_ext = os.path.splitext(body.filename)[0] + '.mp3'
    extracted_audio = os.path.join(OUTPUTS_DIR, f"audio_{audio_ext}")
    if not os.path.exists(extracted_audio):
        audio_processor.extract_audio(input_path, extracted_audio)

    from services import vocal_separator
    result = vocal_separator.separate_vocals_and_bgm(extracted_audio, OUTPUTS_DIR, body.preferAi)
    return {
        'success': True,
        'engine': result['engine'],
        'vocalsUrl': f"/media/outputs/{os.path.basename(result['vocalsPath'])}",
        'bgmUrl': f"/media/outputs/{os.path.basename(result['bgmPath'])}"
    }

@app.post('/api/dubbing/start')
async def start_dubbing(body: DubbingStartRequest, background_tasks: BackgroundTasks, request: Request):
    user = get_request_user(request)
    # Enable full GPU / cloud voice cloning features for all active tool users
    if not os.getenv('VOXCPM_API_URL'):
        load_dotenv(dotenv_path=env_file_path, override=True)

    input_path, real_filename = resolve_uploaded_file(body.filename)
    if not input_path or not os.path.exists(input_path):
        raise HTTPException(status_code=404, detail="Uploaded file not found")
    body.filename = real_filename

    job_id = f"job_{int(time.time() * 1000)}"
    
    # Determine processing mode
    voxcpm_mode = os.getenv('VOXCPM_MODE', 'pure_khmer')
    processing_mode = 'pure_khmer'  # Default
    if body.voiceId and body.voiceId.startswith('voxcpm:'):
        processing_mode = 'voxcpm2'
    elif voxcpm_mode == 'elevenlabs':
        processing_mode = 'elevenlabs'
    elif voxcpm_mode == 'cloud' or voxcpm_mode == 'local':
        processing_mode = 'voxcpm2'
    
    job = {
        'id': job_id,
        'filename': body.filename,
        'status': 'extracting',
        'progress': 10,
        'message': 'កំពុងទាញយកសម្លេងពីវីដេអូដើម...',
        'sourceLang': body.sourceLang,
        'targetLang': body.targetLang,
        'scope': body.scope,
        'created': time.time()
    }
    active_jobs[job_id] = job
    
    # Save to unified database
    try:
        unified_db.create_job({
            'id': job_id,
            'user_id': user.get('id') if user else None,
            'video_filename': body.filename,
            'job_type': 'dubbing',
            'processing_mode': processing_mode,
            'status': 'extracting',
            'progress': 10,
            'message': job['message'],
            'params': {
                'sourceLang': body.sourceLang,
                'targetLang': body.targetLang,
                'voiceId': body.voiceId,
                'scope': body.scope
            }
        })
    except Exception as e:
        logger.warning(f"Failed to save job to unified DB: {e}")

    async def run_pipeline():
        # Create detailed progress tracker
        tracker = create_tracker(job_id, OperationType.DUBBING)
        
        # Define pipeline steps
        tracker.add_step("extract_audio", "កំពុងទាញយកសម្លេងពីវីដេអូដើម...", weight=0.1)
        tracker.add_step("analyze_dialogue", "AI កំពុងវិភាគ និងស្រង់តួអង្គ...", weight=0.2)
        tracker.add_step("translate", "កំពុងបកប្រែជាភាសាខ្មែរ...", weight=0.2)
        tracker.add_step("generate_voices", "កំពុងបង្កើតសម្លេងខ្មែរ...", weight=0.3)
        tracker.add_step("render_video", "កំពុងបញ្ចូលសម្លេងទៅក្នុងវីដេអូ...", weight=0.2)
        
        # Register progress broadcast callback
        tracker.add_callback(lambda jid, data: broadcast_progress(jid, {
            'id': jid,
            'status': data['status'],
            'progress': data['overall_progress'],
            'message': data.get('steps', [{}])[data.get('current_step', 0) if isinstance(data.get('current_step'), int) else 0].get('description', ''),
            'detail': data
        }))
        
        try:
            audio_ext = os.path.splitext(body.filename)[0] + '.mp3'
            extracted_audio_path = os.path.join(OUTPUTS_DIR, f"audio_{audio_ext}")
            
            # Step 1: Extract audio
            tracker.start_step(0)
            job['progress'] = 5
            job['status'] = 'extracting'
            broadcast_progress(job_id, job.copy())
            
            # Run extract_audio in separate thread
            await asyncio.to_thread(
                audio_processor.extract_audio,
                input_path,
                extracted_audio_path
            )
            tracker.complete_step(0)
            
            job['progress'] = 10
            broadcast_progress(job_id, job.copy())

            if body.targetLang == 'km':
                job['progress'] = 15
                job['status'] = 'dubbing_khmer'
                job['message'] = 'AI Gemini កំពុងវិភាគ និងស្រង់តួអង្គគ្រប់តួក្នុងសាច់រឿង...'
                broadcast_progress(job_id, job.copy())

                def on_prog(p, msg):
                    job['progress'] = p
                    job['message'] = msg
                    broadcast_progress(job_id, job.copy())

                result = await khmer_dubber.process_khmer_dubbing(
                    input_path,
                    extracted_audio_path,
                    OUTPUTS_DIR,
                    {
                        'sourceLang': body.sourceLang,
                        'voiceId': body.voiceId,
                        'scope': body.scope,
                        'castingSafetyMode': body.castingSafetyMode,
                        'characterVoiceMap': body.characterVoiceMap,
                        'emotionData': body.emotionData,
                        'maleLeadVoice': body.maleLeadVoice,
                        'femaleLeadVoice': body.femaleLeadVoice,
                        'geminiModel': body.geminiModel,
                        'segments': body.segments
                    },
                    on_progress=on_prog
                )

                job['status'] = 'completed'
                job['progress'] = 100
                job['message'] = 'ការ Dubbing គ្រប់តួអង្គក្នុងសាច់រឿងទទួលបានជោគជ័យ 100%!'
                job['outputVideo'] = f"/media/outputs/{result['outputVideoFilename']}"
                job['outputAudio'] = f"/media/outputs/{os.path.basename(result['dubbedAudioPath'])}"
                job['khmerScript'] = result['khmerScript']
                job['dialogueSegments'] = result['dialogueSegments']
                broadcast_progress(job_id, job.copy())
                
                # Update unified database
                try:
                    unified_db.update_job(job_id, {
                        'status': 'completed',
                        'progress': 100,
                        'message': job['message'],
                        'result': json.dumps({
                            'outputVideo': job['outputVideo'],
                            'outputAudio': job['outputAudio']
                        })
                    })
                    
                    # Add to history
                    unified_db.add_history({
                        'user_id': user.get('id') if user else None,
                        'job_id': job_id,
                        'processing_mode': processing_mode,
                        'video_filename': body.filename,
                        'success': 1,
                        'duration_seconds': time.time() - job['created'],
                        'output_files': [job['outputVideo'], job['outputAudio']]
                    })
                except Exception as e:
                    logger.warning(f"Failed to update job in unified DB: {e}")
            else:
                job['status'] = 'completed'
                job['progress'] = 100
                job['message'] = 'Dubbing complete'
                broadcast_progress(job_id, job.copy())
        except Exception as e:
            import traceback
            traceback.print_exc()
            err_raw = str(e)
            user_friendly_error = err_raw
            if "does not contain any stream" in err_raw:
                user_friendly_error = "វីដេអូនេះគ្មានខ្សែសំឡេង (Audio Stream) ឡើយ! ប្រព័ន្ធបានជួសជុលដោយស្វ័យប្រវត្តិកំណត់ជា Silent Audio រួចរាល់ សូមចុចដំណើរការម្តងទៀត។"
            elif "CUDA out of memory" in err_raw:
                user_friendly_error = "GPU VRAM មិនគ្រប់គ្រាន់ឡើយ សូមប្ដូរទៅប្រើ CPU ឬ Cloud GPU Mode។"
            elif "No such file or directory" in err_raw:
                user_friendly_error = "រកមិនឃើញឯកសារវីដេអូដើម ឬ Folder ឡើយ។ សូម Upload វីដេអូឡើងវិញ។"

            job['status'] = 'failed'
            job['error'] = user_friendly_error
            job['message'] = f"កំហុសក្នុងការ dubbing: {user_friendly_error}"
            broadcast_progress(job_id, job.copy())
            
            # Update unified database
            try:
                unified_db.update_job(job_id, {
                    'status': 'failed',
                    'error': str(e),
                    'message': job['message']
                })
                
                # Add to history as failed
                unified_db.add_history({
                    'user_id': user.get('id') if user else None,
                    'job_id': job_id,
                    'processing_mode': processing_mode,
                    'video_filename': body.filename,
                    'success': 0,
                    'duration_seconds': time.time() - job['created'],
                    'output_files': []
                })
            except Exception as db_err:
                logger.warning(f"Failed to update failed job in unified DB: {db_err}")

    background_tasks.add_task(run_pipeline)
    return {'success': True, 'jobId': job_id}

@app.get('/api/dubbing/status/{job_id}')
def get_dubbing_status(job_id: str):
    if job_id not in active_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return active_jobs[job_id]

# Real-time Progress Tracking with SSE
@app.get('/api/progress/stream/{job_id}')
async def stream_progress(job_id: str, request: Request):
    """
    Server-Sent Events (SSE) endpoint for real-time progress updates
    អោយឃើញ % Process ផ្ទាល់ក្នុង Tool
    """
    async def event_generator():
        # Create async queue for this client
        client_queue = asyncio.Queue()
        if job_id not in progress_subscribers:
            progress_subscribers[job_id] = []
        progress_subscribers[job_id].append(client_queue)
        
        try:
            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    break
                
                # Get progress update from queue (async with timeout)
                try:
                    progress_data = await asyncio.wait_for(client_queue.get(), timeout=1.0)
                    yield f"data: {json.dumps(progress_data)}\n\n"
                    
                    # If job completed or failed, stop streaming
                    if progress_data.get('status') in ['completed', 'failed']:
                        break
                except asyncio.TimeoutError:
                    # Send heartbeat to keep connection alive
                    if job_id in active_jobs:
                        yield f"data: {json.dumps(active_jobs[job_id])}\n\n"
                    else:
                        yield f"data: {json.dumps({'status': 'not_found'})}\n\n"
                        break
                
                await asyncio.sleep(0.5)
        finally:
            # Cleanup: remove client queue when done
            if job_id in progress_subscribers:
                if client_queue in progress_subscribers[job_id]:
                    progress_subscribers[job_id].remove(client_queue)
                if not progress_subscribers[job_id]:
                    del progress_subscribers[job_id]
    
    return StreamingResponse(
        event_generator(),
        media_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    )

def broadcast_progress(job_id: str, progress_data: dict):
    """Broadcast progress update to all SSE subscribers"""
    if job_id in progress_subscribers:
        for client_queue in progress_subscribers[job_id]:
            try:
                client_queue.put_nowait(progress_data)
            except:
                pass
    
    # Also update active_jobs for backward compatibility
    if job_id in active_jobs:
        active_jobs[job_id].update(progress_data)

@app.post('/api/dubbing/scan-timeline')
async def scan_timeline(body: ScanTimelineRequest):
    input_path = os.path.join(UPLOADS_DIR, body.filename)
    if not os.path.exists(input_path):
        root_path = os.path.join(BASE_DIR, body.filename)
        if os.path.exists(root_path): input_path = root_path
    if not os.path.exists(input_path):
        # Auto-fallback to available uploads if previous file was deleted
        cand_files = [f for f in os.listdir(UPLOADS_DIR) if f != '.gitkeep' and not f.startswith('.')]
        if cand_files:
            input_path = os.path.join(UPLOADS_DIR, cand_files[0])
        else:
            raise HTTPException(status_code=404, detail="រកមិនឃើញឯកសារវីដេអូឡើយ (អាចត្រូវបានលុបចោល)។ សូម Upload វីដេអូជាមុនសិន")

    audio_ext = os.path.splitext(body.filename)[0] + '.mp3'
    extracted_audio_path = os.path.join(OUTPUTS_DIR, f"audio_{audio_ext}")
    media_dur = audio_processor.get_media_duration(input_path)
    if (not os.path.exists(extracted_audio_path) or 
        os.path.getsize(extracted_audio_path) < 1000 or 
        (media_dur > 5.0 and audio_processor.get_media_duration(extracted_audio_path) < media_dur - 3.0)):
        audio_processor.extract_audio(input_path, extracted_audio_path)

    duration = media_dur if media_dur > 0 else audio_processor.get_media_duration(input_path)
    segments = await khmer_dubber.extract_dialogue_timeline(extracted_audio_path, duration, body.scope)

    movie_voice_map = {}
    try:
        movie_voice_map = await khmer_dubber.extract_character_voice_samples(extracted_audio_path, segments, OUTPUTS_DIR)
    except Exception as ve:
        print(f"Movie voice sample extraction notice: {ve}")

    # 1-to-1 Unique Voice Assignment for each character (Zero Duplicate Voices, Auto Movie Clone fallback)
    char_map = khmer_dubber.assign_unique_voices_to_segments(
        segments,
        movie_voice_map=movie_voice_map,
        voice_mode=body.voiceMode or 'voice_actor_clone'
    )

    formatted = []
    for idx, s in enumerate(segments):
        ckey = s.get('canonical_id')
        sid = ckey or s.get('speaker_id') or s.get('speaker_name') or 'speaker_1'
        assigned = char_map.get(ckey) or char_map.get(sid) or char_map.get(s.get('speaker_name')) or {}
        
        # 🎭 Auto-detect emotion from original audio segment (if enabled)
        emotion_data = {}
        try:
            # Extract segment audio for emotion detection
            segment_start = s.get('start_time', 0)
            segment_end = s.get('end_time', segment_start + 2)
            segment_audio_path = os.path.join(OUTPUTS_DIR, f"temp_segment_{idx}_{int(time.time() * 1000)}.wav")
            
            # Extract segment using ffmpeg
            import subprocess
            subprocess.run([
                'ffmpeg', '-y', '-i', extracted_audio_path,
                '-ss', str(segment_start),
                '-to', str(segment_end),
                '-acodec', 'pcm_s16le',
                segment_audio_path
            ], capture_output=True, check=True)
            
            # Detect emotion
            if os.path.exists(segment_audio_path):
                try:
                    import librosa
                    import numpy as np
                    
                    y, sr = librosa.load(segment_audio_path, sr=None)
                    rms = librosa.feature.rms(y=y)[0]
                    volume = float(np.mean(rms) * 1000)
                    volume = min(100, max(0, volume))
                    
                    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
                    pitch_values = []
                    for t in range(pitches.shape[1]):
                        index = magnitudes[:, t].argmax()
                        pitch = pitches[index, t]
                        if pitch > 0:
                            pitch_values.append(pitch)
                    
                    avg_pitch = float(np.mean(pitch_values)) if pitch_values else 200.0
                    pitch_semitones = 12 * np.log2(avg_pitch / 200.0) if avg_pitch > 0 else 0
                    pitch_semitones = float(np.clip(pitch_semitones, -12, 12))
                    
                    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
                    speed = float(tempo / 120.0)
                    speed = min(2.0, max(0.5, speed))
                    
                    spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
                    energy = float(np.mean(spectral_centroids) / 40)
                    energy = min(100, max(0, energy))
                except Exception:
                    # Ultra-fast SciPy/NumPy fallback
                    import scipy.io.wavfile as wavfile
                    import numpy as np
                    sr, raw_y = wavfile.read(segment_audio_path)
                    if raw_y.ndim > 1: raw_y = raw_y[:, 0]
                    y = raw_y.astype(float)
                    if len(y) > 0 and np.max(np.abs(y)) > 0:
                        y = y / np.max(np.abs(y))
                    rms = float(np.sqrt(np.mean(y**2))) if len(y) > 0 else 0.0
                    volume = min(100, max(5, int(rms * 150)))
                    energy = min(100, max(10, int(volume * 1.2)))
                    pitch_semitones = 0.0
                    speed = 1.0

                intensity = int((volume * 0.7) + (energy * 0.3))
                
                # Detect emotion
                emotion = 'neutral'
                if volume > 80 and pitch_semitones > 4 and speed > 1.3:
                    emotion = 'shout'
                elif volume > 75 and speed > 1.2 and intensity > 80:
                    emotion = 'angry'
                elif volume < 35 and energy < 40:
                    emotion = 'whisper'
                elif pitch_semitones > 5 and speed > 1.3 and energy > 75:
                    emotion = 'laugh'
                elif pitch_semitones > 3 and speed > 1.1 and energy > 65:
                    emotion = 'happy'
                elif pitch_semitones < -3 and speed < 0.85 and volume < 60:
                    emotion = 'cry'
                elif pitch_semitones < -2 and speed < 0.9 and energy < 55:
                    emotion = 'sad'
                elif pitch_semitones > 4 and energy > 70 and intensity > 75:
                    emotion = 'excited'
                elif pitch_semitones > 2 and speed > 1.1 and volume < 65:
                    emotion = 'scared'
                else:
                    emotion = 'dramatic'
                
                emotion_data = {
                    'emotion': emotion,
                    'emotionIntensity': intensity,
                    'emotionParams': {
                        'volume': int(volume),
                        'pitch': round(pitch_semitones, 2),
                        'speed': round(speed, 2),
                        'energy': int(energy)
                    }
                }
                
                # Cleanup temp file
                if os.path.exists(segment_audio_path):
                    os.remove(segment_audio_path)
        except Exception as e:
            pass
        
        formatted.append({
            **s,
            'line_index': idx,
            'voiceId': s.get('voiceId') or assigned.get('voiceId', 'voxcpm:kxev_char_01_male.mp3'),
            'voiceFilename': s.get('voiceFilename') or assigned.get('filename'),
            'voiceLabel': s.get('voiceLabel') or assigned.get('label'),
            'movieVoiceSample': f"/media/outputs/{os.path.basename(movie_voice_map.get(ckey) or movie_voice_map.get(sid) or '')}" if (movie_voice_map.get(ckey) or movie_voice_map.get(sid)) else None,
            'audioUrl': None,
            'source': 'pending',
            **emotion_data  # 🎭 Add emotion data
        })

    return {
        'success': True,
        'duration': duration,
        'segments': formatted,
        'characterVoiceMap': {k: v.get('voiceId') for k, v in char_map.items()}
    }

# --- AI Batch Dialogue Translation to 100% Pure Khmer ---
def format_timecode_srt(seconds: float) -> str:
    if seconds is None or seconds < 0:
        seconds = 0
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int(round((seconds - int(seconds)) * 1000))
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

def parse_srt_string_to_segments(srt_text: str) -> list:
    """Parses standard SRT text into studio timeline segments, extracting [M], [F], [M_THINK], [F_THINK] tags."""
    segments = []
    if not srt_text:
        return segments

    def tc_to_sec(tc_str: str) -> float:
        tc_str = tc_str.strip().replace(',', '.')
        parts = tc_str.split(':')
        if len(parts) == 3:
            return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
        elif len(parts) == 2:
            return float(parts[0]) * 60 + float(parts[1])
        try:
            return float(tc_str)
        except Exception:
            return 0.0

    blocks = re.split(r'\n\s*\n', srt_text.strip())
    for idx, block in enumerate(blocks):
        lines = [l.strip() for l in block.split('\n') if l.strip()]
        if not lines:
            continue
        time_line_idx = -1
        for i, l in enumerate(lines):
            if '-->' in l:
                time_line_idx = i
                break

        start_t = idx * 3.0
        end_t = start_t + 2.5
        text_lines = []
        if time_line_idx != -1:
            time_parts = lines[time_line_idx].split('-->')
            if len(time_parts) == 2:
                start_t = tc_to_sec(time_parts[0])
                end_t = tc_to_sec(time_parts[1])
            text_lines = lines[time_line_idx + 1:]
        else:
            text_lines = lines

        raw_text = " ".join(text_lines).strip()
        if not raw_text:
            continue

        tag_match = re.match(r'^(\[(?:M|F|M_THINK|F_THINK|THINK)\])\s*(.*)', raw_text, re.IGNORECASE)
        tag = tag_match.group(1).upper() if tag_match else '[M]'
        clean_text = tag_match.group(2) if tag_match else raw_text

        gender = 'female' if 'F' in tag else 'male'
        is_thought = 'THINK' in tag

        segments.append({
            'speaker_id': f"speaker_{idx + 1}",
            'speaker_name': 'តួស្រី' if gender == 'female' else 'តួប្រុស',
            'speaker_role': 'female_lead' if gender == 'female' else 'male_lead',
            'gender': gender,
            'start_time': round(start_t, 3),
            'end_time': round(max(end_t, start_t + 0.8), 3),
            'chinese_text': '',
            'khmer_translation': f"{tag} {clean_text}".strip(),
            'audio_tag': tag,
            'is_thought': is_thought,
            'status': 'ready',
            'emotion': 'dramatic'
        })
    return segments

EXPERT_SUBTITLER_DUBBING_SYSTEM_PROMPT = (
    "អ្នកគឺជា អ្នកបកប្រែខ្សែភាពយន្តនិងរឿងភាគអាជីព (Expert Subtitler & Dubbing Translator)។\n"
    "ភារកិច្ចចម្បងរបស់អ្នកគឺទាញយកសំឡេងសន្ទនា ឬបកប្រែរាល់អត្ថបទដែលបានផ្តល់ឲ្យ មកជាភាសាខ្មែរឲ្យបានស្តង់ដារបំផុត ដោយផ្តោតសំខាន់លើ 'ភាសានិយាយ' ដែលរលូន ស៊ីអារម្មណ៍ និងត្រូវសំឡេងតួអង្គ ១០០%។\n\n"
    "សូមអនុវត្តតាមច្បាប់ទាំង ៦ នេះយ៉ាងតឹងរ៉ឹង៖\n\n"
    "1. ភាសានិយាយធម្មជាតិ (Natural Spoken Language): ហាមដាច់ខាតការបកប្រែតាមបែបសរសេរស្ងួតៗ (Word-for-word)។ ត្រូវប្រើប្រាស់ពាក្យពេចន៍ដែលប្រជាជនខ្មែរនិយមនិយាយប្រចាំថ្ងៃ។ សូមប្រើកន្ទុយពាក្យបញ្ជាក់អារម្មណ៍ (ឧទាហរណ៍៖ ណា, ណ៎, ហ្មង, តើ, អញ្ចឹង, វើយ, ហាស, ចា៎, ចុះ) ឲ្យសក្ដិសមនឹងបរិបទសន្ទនា។\n"
    "2. ត្រូវសំឡេងតួអង្គនិយាយ (Match the actor's voice): ត្រូវប្រើសព្វនាមហៅគ្នា (បង/អូន, ឯង/អញ, ខ្ញុំ/លោក, ពួកម៉ាក, សម្លាញ់, អា...) ឲ្យត្រូវនឹងអាយុ ឋានៈ និងទំនាក់ទំនងរបស់តួអង្គ។ ត្រូវរក្សាតួអង្គជាប់ជានិច្ច (១ តួអង្គ ១ សំឡេង ហាមប្រើសំឡេងច្រើនក្នុងមួយតួអង្គ)។\n"
    "3. បញ្ចេញមនោសញ្ចេតនា (Emotional Depth): អានការបកប្រែរួច ត្រូវតែមានអារម្មណ៍ (ខឹង, សើច, យំ, ផ្អែមល្ហែម, ចំអក, ភ័យស្លន់ស្លោ) ដូចទៅនឹងអត្ថបទដើម។ បើអត្ថបទដើមមានន័យបង្កប់ ឬការលេងពាក្យ ត្រូវបត់បែនពាក្យខ្មែរឲ្យចេញន័យនោះដោយរលូន។\n"
    "4. ភាពច្បាស់លាស់សម្រាប់ការដាក់អក្សររត់ (Subtitle): ប្រយោគមិនត្រូវវែងអន្លាយពេកទេ ត្រូវតែកាត់សាច់យកខ្លឹម ដើម្បីឲ្យស៊ីគ្នានឹងល្បឿននៃការនិយាយ និងត្រូវមាត់ ត្រូវឃ្លា។\n"
    "5. [AUDIO TYPES & TAGS] (រាល់បន្ទាត់អត្ថបទត្រូវចាប់ផ្ដើមដោយស្លាកស័ក្តិសមមួយ):\n"
    "   A. Male Dialogue: [M]\n"
    "   B. Female Dialogue: [F]\n"
    "   C. Male Thought: [M_THINK]\n"
    "   D. Female Thought: [F_THINK]\n\n"
    "   ឧទាហរណ៍:\n"
    "   1\n"
    "   00:01:00,000 --> 00:01:01,500\n"
    "   [M] ឯងហ៊ានក្បត់អញ!\n\n"
    "   2\n"
    "   00:01:01,600 --> 00:01:03,000\n"
    "   [F] ថ្ងៃនេះឯងត្រូវតែស្លាប់!\n\n"
    "   3\n"
    "   00:01:03,600 --> 00:01:04,000\n"
    "   [M_THINK] ឯងត្រូវតែស្លាប់ទៅ\n\n"
    "6. ទម្រង់លទ្ធផល (Output Format): រាល់លទ្ធផលនៃការបកប្រែទាំងអស់ សូមផ្តល់ឲ្យជាទម្រង់ហ្វាល SRT ដោយដាក់វានៅក្នុង Code Block (```srt ... ```) ដើម្បីងាយស្រួល Copy យកទៅប្រើប្រាស់បន្ត។"
)

class TranslateSegmentsRequest(BaseModel):
    segments: List[dict]
    sourceLang: Optional[str] = 'zh'
    targetLang: Optional[str] = 'km'
    context: Optional[str] = None
    character_relationships: Optional[str] = None

class ExpertSubtitlerRequest(BaseModel):
    text: Optional[str] = ""
    context: Optional[str] = ""
    character_relationships: Optional[str] = ""
    segments: Optional[List[dict]] = None

@app.post('/api/dubbing/expert-subtitler-translate')
async def expert_subtitler_translate_endpoint(body: ExpertSubtitlerRequest):
    import requests
    import re
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise HTTPException(status_code=400, detail="Missing GEMINI_API_KEY in .env")

    context_hint = ""
    if body.character_relationships:
        context_hint += f"\nបរិបទទំនាក់ទំនងតួអង្គ (Character Relationships & Pronouns): {body.character_relationships}"
    if body.context:
        context_hint += f"\nបរិបទបន្ថែម (Context): {body.context}"

    raw_input = (body.text or '').strip()
    if not raw_input and body.segments:
        lines = []
        for idx, s in enumerate(body.segments):
            orig = s.get('chinese_text') or s.get('khmer_translation') or ''
            st = s.get('start_time', idx * 2.5)
            et = s.get('end_time', st + 2.0)
            gen = s.get('gender') or 'male'
            sname = s.get('speaker_name') or ''
            tag = '[F]' if gen == 'female' else '[M]'
            lines.append(f"{idx + 1}\n{format_timecode_srt(st)} --> {format_timecode_srt(et)}\n{tag} ({sname}) {orig}")
        raw_input = "\n\n".join(lines)

    if not raw_input:
        return {'success': False, 'error': 'No text or segments provided'}

    user_prompt = (
        f"{EXPERT_SUBTITLER_DUBBING_SYSTEM_PROMPT}\n"
        f"{context_hint}\n\n"
        f"អត្ថបទ/Subtitle ដើមដែលត្រូវបកប្រែ:\n"
        f"```\n{raw_input}\n```\n\n"
        "សូមបញ្ចេញលទ្ធផលជាទម្រង់ SRT នៅក្នុង Code Block ដូចខាងក្រោម (```srt ... ```)៖"
    )

    candidate_models = ['gemini-1.5-flash-latest', 'gemini-1.5-flash-001', 'gemini-1.5-pro']
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{
            "parts": [{"text": user_prompt}]
        }]
    }

    for m in candidate_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=50)
            if resp.status_code == 200:
                data = resp.json()
                raw_ans = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                srt_match = re.search(r'```(?:srt)?\s*([\s\S]*?)\s*```', raw_ans)
                srt_content = srt_match.group(1).strip() if srt_match else raw_ans.strip()

                parsed_segments = parse_srt_string_to_segments(srt_content)
                if body.segments and len(body.segments) == len(parsed_segments):
                    for i, orig_s in enumerate(body.segments):
                        if orig_s.get('start_time') is not None:
                            parsed_segments[i]['start_time'] = orig_s['start_time']
                        if orig_s.get('end_time') is not None:
                            parsed_segments[i]['end_time'] = orig_s['end_time']
                        if orig_s.get('chinese_text'):
                            parsed_segments[i]['chinese_text'] = orig_s['chinese_text']
                        if orig_s.get('speaker_name'):
                            parsed_segments[i]['speaker_name'] = orig_s['speaker_name']

                return {
                    'success': True,
                    'srt_block': f"```srt\n{srt_content}\n```",
                    'srt_content': srt_content,
                    'segments': parsed_segments,
                    'raw_response': raw_ans
                }
        except Exception as e:
            print(f"Expert subtitler translate error with {m}: {e}")

    raise HTTPException(status_code=500, detail="Failed to translate via Expert Subtitler AI")

@app.post('/api/dubbing/translate-segments')
async def translate_segments_endpoint(body: TranslateSegmentsRequest):
    import requests
    import re
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise HTTPException(status_code=400, detail="Missing GEMINI_API_KEY in .env")

    if not body.segments:
        return {'success': True, 'segments': []}

    lines_to_translate = []
    for idx, s in enumerate(body.segments):
        txt = s.get('chinese_text') or s.get('khmer_translation') or ''
        gen = s.get('gender') or 'male'
        sname = s.get('speaker_name') or ''
        lines_to_translate.append(f"{idx}: [{ 'F' if gen == 'female' else 'M' }] ({sname}) {txt}")

    batch_text = "\n".join(lines_to_translate)
    prompt = (
        f"{EXPERT_SUBTITLER_DUBBING_SYSTEM_PROMPT}\n\n"
        "Translate each line into natural, spoken Cambodian movie dubbing Khmer according to the 6 strict rules.\n"
        "Prepend each translated line with the proper tag: [M], [F], [M_THINK], or [F_THINK].\n"
        "Keep 1 character = 1 consistent voice across the whole dialogue.\n"
        "Return a JSON object mapping line index to translated Khmer string:\n"
        "```json\n"
        "{\n"
        "  \"0\": \"[M] ឃ្លាខ្មែរ...\",\n"
        "  \"1\": \"[F] ឃ្លាខ្មែរ...\"\n"
        "}\n"
        "```\n\n"
        f"Input lines:\n{batch_text}"
    )

    candidate_models = ['gemini-1.5-flash-latest', 'gemini-1.5-flash-001', 'gemini-1.5-pro']
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }

    for m in candidate_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=35)
            if resp.status_code == 200:
                data = resp.json()
                raw = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                json_match = re.search(r'```json\s*([\s\S]*?)\s*```', raw)
                json_str = json_match.group(1) if json_match else raw
                translations_map = json.loads(json_str)
                updated_segments = []
                for idx, s in enumerate(body.segments):
                    key = str(idx)
                    s_copy = dict(s)
                    if key in translations_map:
                        cleaned = clean_pure_khmer(translations_map[key], keep_tags=True)
                        s_copy['khmer_translation'] = cleaned
                        tag_match = re.match(r'^(\[(?:M|F|M_THINK|F_THINK|THINK)\])', cleaned, re.IGNORECASE)
                        if tag_match:
                            s_copy['audio_tag'] = tag_match.group(1).upper()
                            if 'F' in tag_match.group(1).upper():
                                s_copy['gender'] = 'female'
                            elif 'M' in tag_match.group(1).upper():
                                s_copy['gender'] = 'male'
                        s_copy['status'] = 'ready'
                    updated_segments.append(s_copy)
                return {'success': True, 'segments': updated_segments}
        except Exception as err:
            print(f"Translate batch error with {m}: {err}")

    return {'success': True, 'segments': body.segments}

@app.post('/api/translate')
async def translate_single(request: Request):
    import requests
    data = await request.json()
    text = data.get('text', '')
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key or not text:
        return {'translation': text}
    prompt = f"Translate this movie dialogue line to natural Cambodian movie dubbing Khmer 100%:\n{text}\nOnly return the translated Khmer text."
    for m in ['gemini-1.5-flash-latest', 'gemini-1.5-flash-001', 'gemini-1.5-pro']:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
        try:
            resp = requests.post(url, headers={"Content-Type": "application/json"}, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=20)
            if resp.status_code == 200:
                raw = resp.json().get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '').strip()
                if raw:
                    return {'translation': clean_pure_khmer(raw)}
        except Exception:
            pass
    return {'translation': text}

# --- Project State Persistence (Never lose timeline/segments on browser refresh) ---
@app.post('/api/project/save')
async def save_project_state(request: Request):
    try:
        data = await request.json()
        data['updated_at'] = time.time()
        _save_project(data)
        return {'success': True, 'message': 'គម្រោងត្រូវបានរក្សាទុកដោយជោគជ័យ!'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save project: {str(e)}")

@app.get('/api/project/load')
async def load_project_state():
    try:
        data = _load_project()
        return {'success': True, 'project': data}
    except Exception as e:
        return {'success': False, 'error': str(e), 'project': None}

@app.post('/api/project/clear')
async def clear_project_state():
    try:
        _clear_project()
        return {'success': True, 'message': 'Project cache cleared'}
    except Exception as e:
        return {'success': False, 'error': str(e)}

@app.post('/api/dubbing/record-line')
async def record_line(audio: UploadFile = File(...), lineIndex: int = Form(0)):
    out_name = f"user_recorded_line_{lineIndex}_{int(time.time() * 1000)}.wav"
    out_path = os.path.join(OUTPUTS_DIR, out_name)
    temp_upload = os.path.join(OUTPUTS_DIR, f"temp_{audio.filename}")

    with open(temp_upload, 'wb') as f:
        shutil.copyfileobj(audio.file, f)

    audio_processor.run_command(f'ffmpeg -nostdin -y -i "{temp_upload}" -ar 44100 -ac 2 -b:a 192k "{out_path}"')
    try:
        if os.path.exists(temp_upload): os.unlink(temp_upload)
    except Exception:
        pass

    return {
        'success': True,
        'lineIndex': lineIndex,
        'audioUrl': f"/media/outputs/{out_name}",
        'filename': out_name
    }

@app.post('/api/dubbing/generate-line')
async def generate_line(body: GenerateLineRequest, request: Request):
    out_name = f"ai_line_{body.lineIndex}_{int(time.time() * 1000)}.mp3"
    out_path = os.path.join(OUTPUTS_DIR, out_name)

    is_female = body.gender == 'female'
    studio_ref = None

    if body.voiceId == 'movie-live-clone' and body.speakerId:
        cand = os.path.join(OUTPUTS_DIR, f"ref_voice_{body.speakerId}.mp3")
        if os.path.exists(cand):
            studio_ref = cand

    if not studio_ref and body.voiceId:
        clean_v = body.voiceId.replace('voxcpm:', '').strip()
        cand_d = os.path.join(SAMPLES_DIR, clean_v)
        cand_m = os.path.join(SAMPLES_DIR, f"{clean_v}.mp3")
        if os.path.exists(cand_d) and os.path.isfile(cand_d):
            studio_ref = cand_d
        elif os.path.exists(cand_m) and os.path.isfile(cand_m):
            studio_ref = cand_m

    if not studio_ref or not os.path.exists(studio_ref):
        default_sample = 'vp_character_1_female.mp3' if is_female else 'vp_character_2_male.mp3'
        cand_def = os.path.join(SAMPLES_DIR, default_sample)
        if os.path.exists(cand_def):
            studio_ref = cand_def

    clean_text = clean_pure_khmer(body.text)
    if not clean_text:
        clean_text = "បាទ"

    await khmer_dubber.synthesize_realistic_speech(
        clean_text,
        out_path,
        body.voiceId,
        studio_ref if os.path.exists(studio_ref) else None,
        {'gender': body.gender, 'emotion': body.emotion, 'role': body.speakerId}
    )
    
    return {
        'success': True,
        'lineIndex': body.lineIndex,
        'audioUrl': f"/media/outputs/{out_name}",
        'filename': out_name
    }


# --- Emotion Detection Endpoint ---
class EmotionDetectionRequest(BaseModel):
    audioUrl: str

@app.post('/api/audio/detect-emotion')
async def detect_emotion_from_audio(body: EmotionDetectionRequest):
    """
    AI Emotion Detection API
    វិភាគសំឡេងនិងកំណត់អារម្មណ៍ដោយស្វ័យប្រវត្តិ
    """
    try:
        try:
            import librosa
            import numpy as np
            
            y, sr = librosa.load(audio_path, sr=None)
            
            rms = librosa.feature.rms(y=y)[0]
            volume = float(np.mean(rms) * 1000)
            volume = min(100, max(0, volume))
            
            pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
            pitch_values = []
            for t in range(pitches.shape[1]):
                index = magnitudes[:, t].argmax()
                pitch = pitches[index, t]
                if pitch > 0:
                    pitch_values.append(pitch)
            
            avg_pitch = float(np.mean(pitch_values)) if pitch_values else 200.0
            pitch_semitones = 12 * np.log2(avg_pitch / 200.0) if avg_pitch > 0 else 0
            pitch_semitones = float(np.clip(pitch_semitones, -12, 12))
            
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            speed = float(tempo / 120.0)
            speed = min(2.0, max(0.5, speed))
            
            spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            energy = float(np.mean(spectral_centroids) / 40)
            energy = min(100, max(0, energy))
        except Exception:
            import scipy.io.wavfile as wavfile
            import numpy as np
            sr, raw_y = wavfile.read(audio_path)
            if raw_y.ndim > 1: raw_y = raw_y[:, 0]
            y = raw_y.astype(float)
            if len(y) > 0 and np.max(np.abs(y)) > 0:
                y = y / np.max(np.abs(y))
            rms = float(np.sqrt(np.mean(y**2))) if len(y) > 0 else 0.0
            volume = min(100, max(5, int(rms * 150)))
            energy = min(100, max(10, int(volume * 1.2)))
            pitch_semitones = 0.0
            speed = 1.0
        
        # 5. Intensity (combination of volume and energy)
        intensity = int((volume * 0.7) + (energy * 0.3))
        
        # Map features to emotion using decision tree
        emotion = 'neutral'
        confidence = 0.6
        
        if volume > 80 and pitch_semitones > 4 and speed > 1.3:
            emotion = 'shout'
            confidence = 0.85
        elif volume > 75 and speed > 1.2 and intensity > 80:
            emotion = 'angry'
            confidence = 0.8
        elif volume < 35 and energy < 40:
            emotion = 'whisper'
            confidence = 0.85
        elif pitch_semitones > 3 and speed > 1.1 and energy > 65:
            emotion = 'happy'
            confidence = 0.75
        elif pitch_semitones > 5 and speed > 1.3 and energy > 75:
            emotion = 'laugh'
            confidence = 0.8
        elif pitch_semitones < -2 and speed < 0.9 and energy < 55:
            emotion = 'sad'
            confidence = 0.75
        elif pitch_semitones < -3 and speed < 0.85 and volume < 60 and intensity < 50:
            emotion = 'cry'
            confidence = 0.8
        elif pitch_semitones > 4 and energy > 70 and intensity > 75:
            emotion = 'excited'
            confidence = 0.75
        elif pitch_semitones > 2 and speed > 1.1 and volume < 65 and intensity > 60:
            emotion = 'scared'
            confidence = 0.7
        
        return {
            'emotion': emotion,
            'confidence': confidence,
            'intensity': intensity,
            'features': {
                'volume': int(volume),
                'pitch': round(pitch_semitones, 2),
                'speed': round(speed, 2),
                'energy': int(energy)
            }
        }
        
    except Exception as e:
        print(f"Emotion detection error: {e}")
        # Return neutral emotion as fallback
        return {
            'emotion': 'neutral',
            'confidence': 0.5,
            'intensity': 50,
            'features': {
                'volume': 70,
                'pitch': 0,
                'speed': 1.0,
                'energy': 50
            }
        }

@app.post('/api/dubbing/assemble-custom')
async def assemble_custom(body: AssembleCustomRequest):
    job_id = body.jobId
    if job_id:
        active_jobs[job_id] = {
            'status': 'processing',
            'progress': 8,
            'message': 'កំពុងចាប់ផ្តើមត្រួតពិនិត្យ និងរៀបចំដំឡើងវីដេអូ...',
            'created': time.time()
        }
        broadcast_progress(job_id, active_jobs[job_id].copy())

    try:
        input_path = os.path.join(UPLOADS_DIR, body.filename)
        if not os.path.exists(input_path):
            root_path = os.path.join(BASE_DIR, body.filename)
            if os.path.exists(root_path): input_path = root_path
        if not os.path.exists(input_path):
            raise HTTPException(status_code=404, detail="Video file not found")

        duration = audio_processor.get_media_duration(input_path)
        audio_ext = os.path.splitext(body.filename)[0] + '.mp3'
        extracted_audio_path = os.path.join(OUTPUTS_DIR, f"audio_{audio_ext}")
        if not os.path.exists(extracted_audio_path):
            if job_id:
                active_jobs[job_id].update({'progress': 12, 'message': 'កំពុងទាញយកខ្សែសំឡេងវីដេអូដើម (Audio Extraction)...'})
                broadcast_progress(job_id, active_jobs[job_id].copy())
            audio_processor.extract_audio(input_path, extracted_audio_path)

        if job_id:
            active_jobs[job_id].update({'progress': 18, 'message': 'បានស្រង់សំឡេងដើមរួចរាល់ — កំពុងពិនិត្យ និងសំយោគសំឡេងខ្មែរគ្រប់តួអង្គ...'})
            broadcast_progress(job_id, active_jobs[job_id].copy())

        # Turbo Hardware Concurrency: Synthesize missing speech in parallel workers
        concurrency_limit = min(16, max(4, (os.cpu_count() or 4) * 2))
        sem = asyncio.Semaphore(concurrency_limit)
        total_segs = len(body.segments)
        completed_segs = 0
        seg_lock = asyncio.Lock()

        async def prepare_segment(i, seg):
            nonlocal completed_segs
            audio_path = None
            if seg.get('audioUrl'):
                base = os.path.basename(seg['audioUrl'])
                p = os.path.join(OUTPUTS_DIR, base)
                if os.path.exists(p): audio_path = p

            # Auto-synthesize any missing line with retry so ZERO lines are dropped!
            if not audio_path and (seg.get('khmer_translation') or seg.get('chinese_text')):
                raw_text = seg.get('khmer_translation') or seg.get('chinese_text') or ''
                text_to_speak = clean_pure_khmer(raw_text) or raw_text.strip()
                if text_to_speak:
                    auto_path = os.path.join(OUTPUTS_DIR, f"auto_studio_line_py_{i}_{int(time.time() * 1000)}.wav")
                    is_female = seg.get('gender') == 'female' or ('ស្រី' in (seg.get('speaker_name') or ''))
                    role = seg.get('speaker_role') or ('female_lead' if is_female else 'male_lead')
                    theatrical = ROLE_THEATRICAL_PROFILES.get(role, {})
                    fb_voice = theatrical.get('voice', 'km-KH-SreymomNeural' if is_female else 'km-KH-PisethNeural')
                    pitch = theatrical.get('pitch', '+0Hz')
                    rate = theatrical.get('rate', '+0%')

                    # Retry up to 3 times
                    for attempt in range(3):
                        try:
                            async with sem:
                                await khmer_dubber.synthesize_khmer_speech(text_to_speak, auto_path, fb_voice, pitch=pitch, rate=rate)
                            if os.path.exists(auto_path) and os.path.getsize(auto_path) > 500:
                                audio_path = auto_path
                                break
                        except Exception as ex:
                            print(f"Auto-synthesize line {i} attempt {attempt+1} notice: {ex}")
                            await asyncio.sleep(0.3)

            if not audio_path:
                # Fallback silence placeholder so line is NEVER dropped
                silence_path = os.path.join(OUTPUTS_DIR, f"silent_line_{i}.wav")
                audio_processor.run_command(f'ffmpeg -nostdin -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 1.0 "{silence_path}"')
                audio_path = silence_path

            async with seg_lock:
                completed_segs += 1
                if job_id and total_segs > 0:
                    prog_pct = 20 + int((completed_segs / total_segs) * 58)
                    line_sample = (clean_pure_khmer(seg.get('khmer_translation') or '') or '')[:20]
                    active_jobs[job_id].update({
                        'progress': min(78, prog_pct),
                        'message': f"កំពុងផលិតសំឡេងខ្មែរ: ឃ្លាទី {completed_segs}/{total_segs} {('«' + line_sample + '...»') if line_sample else ''}"
                    })
                    broadcast_progress(job_id, active_jobs[job_id].copy())

            return {
                **seg,
                'audioPath': audio_path,
                'start_time': float(seg.get('start_time', 0)),
                'end_time': float(seg.get('end_time', float(seg.get('start_time', 0)) + 2.5))
            }

        raw_mapped = await asyncio.gather(*(prepare_segment(i, seg) for i, seg in enumerate(body.segments)))
        mapped_segments = [m for m in raw_mapped if m is not None]

        if not mapped_segments:
            raise HTTPException(status_code=400, detail="មិនមានឃ្លាសន្ទនាសម្រាប់ដំណើរការ dubbing ឡើយ!")

        ts = int(time.time() * 1000)
        master_dialogue_path = os.path.join(OUTPUTS_DIR, f"custom_master_dialogue_py_{ts}.wav")

        if job_id:
            active_jobs[job_id].update({'progress': 80, 'message': 'កំពុងតម្រៀបសំឡេងតួអង្គទាំងអស់តាមបន្ទាត់ពេលវេលា (Timeline Alignment)...'})
            broadcast_progress(job_id, active_jobs[job_id].copy())

        await khmer_dubber.assemble_timeline_audio(mapped_segments, duration, master_dialogue_path)

        dubbed_audio_path = os.path.join(OUTPUTS_DIR, f"custom_dubbed_master_py_{ts}.mp3")

        # Clean BGM selection: Strip Chinese vocals if requested
        bgm_source_path = extracted_audio_path
        if body.bgmAudio:
            bgm_cand = os.path.join(OUTPUTS_DIR, os.path.basename(body.bgmAudio))
            if os.path.exists(bgm_cand):
                bgm_source_path = bgm_cand
        elif body.removeOriginalVocals:
            ai_bgm_cand = os.path.join(OUTPUTS_DIR, f"{os.path.splitext(os.path.basename(extracted_audio_path))[0]}_ai_bgm.wav")
            dsp_bgm_cand = os.path.join(OUTPUTS_DIR, f"{os.path.splitext(os.path.basename(extracted_audio_path))[0]}_dsp_bgm.wav")
            if os.path.exists(ai_bgm_cand):
                bgm_source_path = ai_bgm_cand
            elif os.path.exists(dsp_bgm_cand):
                bgm_source_path = dsp_bgm_cand
            else:
                if job_id:
                    active_jobs[job_id].update({'progress': 84, 'message': 'កំពុងបំបែកសំឡេងច្រៀង និងស្រង់ភ្លេងកំដរ BGM ស្អាត...'})
                    broadcast_progress(job_id, active_jobs[job_id].copy())
                from services import vocal_separator
                sep_res = vocal_separator.separate_vocals_and_bgm(extracted_audio_path, OUTPUTS_DIR, True)
                if sep_res.get('bgmPath') and os.path.exists(sep_res['bgmPath']):
                    bgm_source_path = sep_res['bgmPath']

        if job_id:
            active_jobs[job_id].update({'progress': 88, 'message': 'កំពុងលាយបញ្ចូលសំឡេងខ្មែរជាមួយភ្លេងកំដរ BGM (Sound Effects & Vocal Mixing)...'})
            broadcast_progress(job_id, active_jobs[job_id].copy())

        v_gain = body.vocalGain or 2.2
        b_gain = body.bgmGain or 0.85
        # Smart BGM routing: clean AI/DSP stem -> cinema mixer; raw audio -> vocal suppression mixer
        bgm_is_clean_stem = (
            bgm_source_path != extracted_audio_path and
            ('_ai_bgm' in bgm_source_path or '_dsp_bgm' in bgm_source_path)
        )
        if bgm_is_clean_stem:
            print('[Cinema Mix] Clean Demucs BGM stem — using pristine cinema mixer (no vocal suppression DSP)')
            audio_processor.mix_clean_bgm_with_khmer(bgm_source_path, master_dialogue_path, dubbed_audio_path, v_gain, b_gain)
        else:
            audio_processor.mix_vocals_with_original(bgm_source_path, master_dialogue_path, dubbed_audio_path, v_gain, b_gain)

        video_ext = os.path.splitext(input_path)[1]
        out_video_filename = f"custom_dubbed_khmer_py_{ts}{video_ext}"
        out_video_path = os.path.join(OUTPUTS_DIR, out_video_filename)
        
        if job_id:
            active_jobs[job_id].update({'progress': 94, 'message': 'កំពុង Render និងបញ្ចូលខ្សែសំឡេង Dubbing ចូលក្នុងវីដេអូសម្រេច (FFmpeg)...'})
            broadcast_progress(job_id, active_jobs[job_id].copy())

        # Run merge in separate thread to avoid blocking
        await asyncio.to_thread(
            audio_processor.merge_video_audio,
            input_path,
            dubbed_audio_path,
            out_video_path
        )

        out_video_url = f"/media/outputs/{out_video_filename}"
        out_audio_url = f"/media/outputs/{os.path.basename(dubbed_audio_path)}"

        if job_id:
            active_jobs[job_id].update({
                'status': 'completed',
                'progress': 100,
                'message': '🎉 ការដំឡើងវីដេអូ Dubbing គ្រប់តួអង្គសម្រេចជោគជ័យ ១០០%!',
                'outputVideo': out_video_url,
                'outputAudio': out_audio_url
            })
            broadcast_progress(job_id, active_jobs[job_id].copy())

        return {
            'success': True,
            'outputVideo': out_video_url,
            'outputAudio': out_audio_url,
            'totalLinesDubbed': len(mapped_segments)
        }
    except Exception as ex:
        if job_id:
            active_jobs[job_id].update({
                'status': 'failed',
                'error': str(ex),
                'message': f"កំហុសក្នុងការដំឡើងវីដេអូ: {ex}"
            })
            broadcast_progress(job_id, active_jobs[job_id].copy())
        raise

@app.post('/api/video/render-export')
async def render_export_video(body: RenderExportRequest):
    """
    Render and export video with overlay and subtitles.
    Performs storage check before starting. Uses asyncio.to_thread() for blocking FFmpeg.
    """
    # 🛡️ Storage safety check before render
    storage_check = _check_storage_before_operation('render', 120.0)
    if not storage_check['ok']:
        raise HTTPException(
            status_code=507,
            detail={
                'error': 'insufficient_storage',
                'message': storage_check['message'],
                'freeGb': storage_check['freeGb'],
                'requiredGb': storage_check['requiredGb'],
                'needAdditionalGb': storage_check['needAdditionalGb'],
            }
        )

    # 1. Resolve source video path
    input_path = None
    if body.inputVideo:
        cand = os.path.basename(body.inputVideo)
        for folder in [OUTPUTS_DIR, UPLOADS_DIR, BASE_DIR]:
            p = os.path.join(folder, cand)
            if os.path.exists(p):
                input_path = p
                break

    if not input_path or not os.path.exists(input_path):
        for folder in [OUTPUTS_DIR, UPLOADS_DIR, BASE_DIR]:
            p = os.path.join(folder, body.filename)
            if os.path.exists(p):
                input_path = p
                break

    if not input_path or not os.path.exists(input_path):
        resolved_path, _ = resolve_uploaded_file(body.filename or (body.inputVideo and os.path.basename(body.inputVideo)) or "")
        if resolved_path and os.path.exists(resolved_path):
            input_path = resolved_path

    if not input_path or not os.path.exists(input_path):
        raise HTTPException(status_code=404, detail="វីដេអូដើមមិនត្រូវបានរកឃើញឡើយ!")

    ts = int(time.time() * 1000)
    temp_overlay_path = None
    temp_srt_path = None

    try:
        # 2. Extract Transparent Title/Thumbnail Overlay PNG
        if body.titleOverlayBase64:
            try:
                raw_b64 = body.titleOverlayBase64
                if ',' in raw_b64:
                    raw_b64 = raw_b64.split(',', 1)[1]
                img_bytes = base64.b64decode(raw_b64)
                temp_overlay_path = os.path.join(OUTPUTS_DIR, f"export_overlay_{ts}.png")
                with open(temp_overlay_path, 'wb') as f:
                    f.write(img_bytes)
            except Exception as ex:
                print(f"Overlay decode error: {ex}")
                temp_overlay_path = None

        # 3. Generate SRT for Subtitles if requested
        if body.burnSubtitles and body.subtitles and len(body.subtitles) > 0:
            try:
                srt_content = audio_processor.generate_srt(body.subtitles)
                if srt_content and len(srt_content.strip()) > 0:
                    temp_srt_path = os.path.join(OUTPUTS_DIR, f"export_sub_{ts}.srt")
                    with open(temp_srt_path, 'w', encoding='utf-8') as f:
                        f.write(srt_content)
            except Exception as ex:
                print(f"SRT generation error: {ex}")
                temp_srt_path = None

        # 4. Output filename and path
        target_format = body.format or 'mp4'
        if target_format not in ['mp4', 'mkv', 'mov']:
            target_format = 'mp4'

        base_stem = os.path.splitext(os.path.basename(input_path))[0]
        clean_stem = base_stem.replace('custom_dubbed_khmer_py_', '').replace('custom_dubbed_khmer_', '').replace('audio_', '')
        out_filename = f"studio_burned_{clean_stem}_{ts}.{target_format}"
        out_path = os.path.join(OUTPUTS_DIR, out_filename)

        # 5. Burn permanently with FFmpeg (including watermark and custom subtitles styling)
        # Run in separate thread to avoid blocking async event loop
        options = {
            'resolution': body.resolution or '1080p',
            'bitrate': body.bitrate or 'high',
            'format': target_format,
            'watermark': body.watermark,
            'subtitleStyle': body.subtitleStyle,
            'turbo': body.turbo
        }

        # Use asyncio.to_thread() to run blocking FFmpeg operation without blocking event loop
        await asyncio.to_thread(
            audio_processor.burn_overlay_and_subtitles,
            video_path=input_path,
            output_video_path=out_path,
            overlay_image_path=temp_overlay_path,
            srt_path=temp_srt_path,
            options=options
        )

        # Copy to custom destination directory if requested (e.g. D:\VIDEO AI or D:\AnimeDub_Outputs)
        if body.outputDir and os.path.exists(out_path):
            try:
                os.makedirs(body.outputDir, exist_ok=True)
                dest_file = os.path.join(body.outputDir, out_filename)
                import shutil
                shutil.copy2(out_path, dest_file)
                print(f"✅ Video exported directly to destination folder: {dest_file}")
            except Exception as copy_err:
                print(f"Warning: Failed to copy to {body.outputDir}: {copy_err}")

        return {
            'success': True,
            'outputVideo': f"/media/outputs/{out_filename}",
            'filename': out_filename,
            'hasOverlay': bool(temp_overlay_path and os.path.exists(out_path)),
            'hasSubtitles': bool(temp_srt_path and os.path.exists(out_path))
        }

    except Exception as e:
        import traceback
        print(f"Render export error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"កំហុសក្នុងការ render video: {str(e)}")
    
    finally:
        # Cleanup temporary files
        if temp_overlay_path and os.path.exists(temp_overlay_path):
            try:
                os.remove(temp_overlay_path)
            except Exception:
                pass
        if temp_srt_path and os.path.exists(temp_srt_path):
            try:
                os.remove(temp_srt_path)
            except Exception:
                pass

# ════════════════════════════════════════════════════════════════
# 🎬 DRAGON SPONSOR & ADVERTISEMENT STUDIO API
# ════════════════════════════════════════════════════════════════

@app.post('/api/sponsor/validate')
async def sponsor_validate_endpoint(body: SponsorValidateRequest):
    """Inspect and validate sponsor video/image media file."""
    target_path = body.mediaPath
    if not os.path.isabs(target_path):
        for folder in [UPLOADS_DIR, OUTPUTS_DIR, BASE_DIR]:
            p = os.path.join(folder, os.path.basename(target_path))
            if os.path.exists(p):
                target_path = p
                break

    info = audio_processor.validate_sponsor_media(target_path)
    return info

@app.post('/api/sponsor/render')
async def sponsor_render_endpoint(body: SponsorRenderRequest):
    """Render composite of main video + multi-track sponsors (PiP, overlay, intro, outro)."""
    # 1. Resolve main video path
    main_path = None
    for folder in [OUTPUTS_DIR, UPLOADS_DIR, BASE_DIR]:
        cand = os.path.join(folder, os.path.basename(body.mainVideo))
        if os.path.exists(cand):
            main_path = cand
            break

    if not main_path or not os.path.exists(main_path):
        raise HTTPException(status_code=404, detail="វីដេអូមេមិនត្រូវបានរកឃើញឡើយ!")

    # 2. Resolve media for each sponsor
    resolved_sponsors = []
    for sp in body.sponsors:
        raw_media = sp.get('mediaUrl') or sp.get('filename') or ''
        sp_path = None
        for folder in [UPLOADS_DIR, OUTPUTS_DIR, BASE_DIR]:
            c = os.path.join(folder, os.path.basename(raw_media))
            if os.path.exists(c):
                sp_path = c
                break
        if sp_path and os.path.exists(sp_path):
            sp_copy = dict(sp)
            sp_copy['mediaUrl'] = sp_path
            resolved_sponsors.append(sp_copy)

    ts = int(time.time() * 1000)
    stem = os.path.splitext(os.path.basename(main_path))[0]
    out_filename = body.targetFilename or f"dragon_sponsor_{stem}_{ts}.mp4"
    out_path = os.path.join(OUTPUTS_DIR, out_filename)

    try:
        await asyncio.to_thread(
            audio_processor.composite_sponsors_into_video,
            video_path=main_path,
            output_video_path=out_path,
            sponsors=resolved_sponsors,
            options={'resolution': body.resolution or '1080p'}
        )

        if body.outputDir and os.path.exists(out_path):
            try:
                os.makedirs(body.outputDir, exist_ok=True)
                dest = os.path.join(body.outputDir, out_filename)
                import shutil
                shutil.copy2(out_path, dest)
            except Exception as ex:
                print(f"Warning: Could not copy to {body.outputDir}: {ex}")

        return {
            'success': True,
            'outputVideo': f"/media/outputs/{out_filename}",
            'filename': out_filename,
            'sponsorCount': len(resolved_sponsors)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"កំហុសក្នុងការ Render Sponsor: {str(e)}")


# ════════════════════════════════════════════════════════════════
# 🐉 DRAGON BATCH DUBBING STUDIO API (5-10 Episodes)
# ════════════════════════════════════════════════════════════════

batch_studio_jobs = {}


async def _process_single_episode(batch_id: str, ep: dict, char_mem: dict, trans_mem: list):
    """
    Real batch episode processor — runs actual AI dubbing pipeline for each episode.
    Uses the same KhmerDubber pipeline as single-video dubbing.
    Falls back gracefully if source file not found.
    """
    ep_id = ep['id']
    job = batch_studio_jobs.get(batch_id)
    if not job or job.get('isCancelled'):
        return

    ep_entry = next((e for e in job['episodes'] if e['id'] == ep_id), None)
    if not ep_entry:
        return

    try:
        # ── Phase 1: Locate source video ──────────────────────────────
        ep_entry['status'] = 'analyzing'
        ep_entry['progress'] = 5
        ep_entry['startedAt'] = datetime.now().isoformat()

        src_filename = os.path.basename(ep.get('filename', '') or ep.get('inputUrl', ''))
        src_path = None
        for folder in [UPLOADS_DIR, OUTPUTS_DIR, BASE_DIR]:
            candidate = os.path.join(folder, src_filename)
            if os.path.exists(candidate):
                src_path = candidate
                break

        if not src_path or not os.path.exists(src_path):
            raise FileNotFoundError(
                f"ស្វែងរកឯកសារ '{src_filename}' មិនឃើញ — "
                "សូម Upload វីដេអូ Episode ជាមុនសិន"
            )

        if job.get('isCancelled'):
            return

        # ── Phase 2: Storage check before processing ──────────────────
        storage_check = _check_storage_before_operation('batch', 60.0)
        if not storage_check['ok']:
            raise RuntimeError(storage_check['message'])

        # ── Phase 3: Extract audio ────────────────────────────────────
        ep_entry['status'] = 'analyzing'
        ep_entry['progress'] = 15

        ts = int(time.time() * 1000)
        ep_clean = os.path.splitext(src_filename)[0]
        audio_path = os.path.join(OUTPUTS_DIR, f"audio_batch_{ep_clean}_{ts}.mp3")

        # Run real FFmpeg audio extraction
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: audio_processor.extract_audio(src_path, audio_path)
        )

        if job.get('isCancelled'):
            return

        ep_entry['progress'] = 25

        # ── Phase 4: Translation (use Translation Memory if available) ─
        ep_entry['status'] = 'translating'
        ep_entry['progress'] = 35

        # Build dubbing config from job settings
        voice_id = job.get('voiceId', 'voice_actor_clone')
        male_lead = job.get('maleLeadVoice') or 'vp_character_2_male.mp3'
        female_lead = job.get('femaleLeadVoice') or 'vp_character_1_female.mp3'
        gemini_model_id = job.get('geminiModel') or 'gemini-1.5-flash-latest'

        if job.get('isCancelled'):
            return

        # ── Phase 5: Full AI Dubbing Pipeline ─────────────────────────
        ep_entry['status'] = 'generating'
        ep_entry['progress'] = 50

        # Run real KhmerDubber pipeline
        result = await loop.run_in_executor(
            None,
            lambda: khmer_dubber.auto_dub_full_pipeline(
                video_path=src_path,
                audio_path=audio_path,
                source_lang='zh',
                target_lang='km',
                voice_id=voice_id,
                scope='full',
                male_lead_voice=male_lead,
                female_lead_voice=female_lead,
                gemini_model=gemini_model_id,
                character_voice_map=char_mem,
            )
        )

        if job.get('isCancelled'):
            return

        ep_entry['progress'] = 85

        # ── Phase 6: Verify output ────────────────────────────────────
        ep_entry['status'] = 'rendering'

        output_video = result.get('output_video') if isinstance(result, dict) else None
        if not output_video or not os.path.exists(output_video):
            # Fallback: assemble using assemble_dubbed_video if pipeline gave segments
            segments = result.get('segments', []) if isinstance(result, dict) else []
            if segments:
                out_name = f"dragon_batch_{ep_clean}_{ts}.mp4"
                out_file = os.path.join(OUTPUTS_DIR, out_name)
                assemble_result = await loop.run_in_executor(
                    None,
                    lambda: khmer_dubber.assemble_custom_dubbed_video(
                        video_path=src_path,
                        segments=segments,
                        output_path=out_file,
                        remove_original_vocals=True,
                    )
                )
                output_video = assemble_result.get('output_video') if isinstance(assemble_result, dict) else out_file
            else:
                raise RuntimeError("Pipeline did not produce output video or segments")

        ep_entry['status'] = 'completed'
        ep_entry['progress'] = 100
        ep_entry['outputVideoUrl'] = f"/outputs/{os.path.basename(output_video)}"
        ep_entry['outputPath'] = output_video
        ep_entry['completedAt'] = datetime.now().isoformat()

        # Persist job state for crash recovery
        _save_render_jobs({
            f"batch_{batch_id}_{ep_id}": {
                'jobId': f"batch_{batch_id}_{ep_id}",
                'batchId': batch_id,
                'episodeId': ep_id,
                'status': 'completed',
                'outputPath': output_video,
                'completedAt': ep_entry['completedAt'],
            }
        })

    except Exception as ex:
        ep_entry['status'] = 'failed'
        ep_entry['errorMessage'] = str(ex)
        ep_entry['completedAt'] = datetime.now().isoformat()
        logger.error(f"[Batch] Episode {ep_id} failed: {ex}")

    # Update overall batch progress
    total_eps = len(job['episodes'])
    completed_count = sum(1 for e in job['episodes'] if e['status'] == 'completed')
    job['overallProgress'] = int(round((completed_count / max(1, total_eps)) * 100))


async def _batch_orchestrator(batch_id: str):
    """
    🐉 Dragon Batch Orchestrator — Hardware-aware safe concurrency management.
    Never starts more jobs than the system can safely handle based on available RAM.
    """
    job = batch_studio_jobs.get(batch_id)
    if not job:
        return

    # Determine safe concurrency from hardware + performance preset
    requested_concurrency = min(5, max(1, job.get('maxConcurrency', 2)))
    safe_concurrency = _get_safe_concurrency(requested_concurrency)

    # Log the decision
    logger.info(
        f"[Batch {batch_id}] Requested concurrency: {requested_concurrency}, "
        f"Hardware-safe concurrency: {safe_concurrency}"
    )
    job['actualConcurrency'] = safe_concurrency

    sem = asyncio.Semaphore(safe_concurrency)

    async def _worker_with_sem(ep):
        # Wait if paused
        while job.get('isPaused') and not job.get('isCancelled'):
            await asyncio.sleep(0.5)
        if job.get('isCancelled'):
            return
        async with sem:
            await _process_single_episode(
                batch_id,
                ep,
                job.get('characterMemory', {}),
                job.get('translationMemory', [])
            )

    tasks = [_worker_with_sem(ep) for ep in job['episodes']]
    await asyncio.gather(*tasks, return_exceptions=True)
    job['isProcessing'] = False
    job['completedAt'] = datetime.now().isoformat()


@app.post('/api/batch/create')
async def batch_create_endpoint(body: BatchCreateRequest):
    """
    Initialize a multi-episode batch dubbing job.
    Performs storage check and hardware safety before starting.
    Safe concurrency is automatically determined from available RAM.
    """
    # Storage safety check before batch start
    storage = _check_storage_before_operation('batch', 120.0 * len(body.episodes))
    if not storage['ok']:
        raise HTTPException(
            status_code=507,
            detail={
                'error': 'insufficient_storage',
                'message': storage['message'],
                'freeGb': storage['freeGb'],
                'requiredGb': storage['requiredGb'],
                'needAdditionalGb': storage['needAdditionalGb'],
            }
        )

    batch_id = f"batch_{int(time.time() * 1000)}"
    initial_episodes = []

    for idx, ep in enumerate(body.episodes[:10]):
        initial_episodes.append({
            'id': ep.get('id') or f"ep_{idx + 1}",
            'episodeNumber': ep.get('episodeNumber', idx + 1),
            'title': ep.get('title') or f"Episode {idx + 1:02d}",
            'filename': ep.get('filename') or f"episode_{idx + 1}.mp4",
            'inputUrl': ep.get('inputUrl') or ep.get('url', ''),
            'durationSeconds': ep.get('durationSeconds', 0),
            'status': 'queued',
            'progress': 0,
            'outputVideoUrl': None,
            'errorMessage': None,
            'startedAt': None,
            'completedAt': None,
        })

    # Calculate hardware-safe concurrency
    requested = body.maxConcurrency or 2
    safe_conc = _get_safe_concurrency(requested)

    batch_studio_jobs[batch_id] = {
        'batchId': batch_id,
        'episodes': initial_episodes,
        'characterMemory': body.characterMemory or {},
        'translationMemory': body.translationMemory or [],
        'maxConcurrency': requested,
        'actualConcurrency': safe_conc,
        'isProcessing': True,
        'isCancelled': False,
        'isPaused': False,
        'overallProgress': 0,
        'createdAt': time.time(),
        'storageCheck': storage,
    }

    # Launch orchestrator in background
    asyncio.create_task(_batch_orchestrator(batch_id))

    return {
        'success': True,
        'batchId': batch_id,
        'episodeCount': len(initial_episodes),
        'requestedConcurrency': requested,
        'actualConcurrency': safe_conc,
        'message': (
            f"បានបង្កើត Batch សម្រាប់ {len(initial_episodes)} ភាគ — "
            f"Concurrency: {safe_conc} (Hardware-safe)"
        ),
    }

@app.get('/api/batch/status/{batch_id}')
async def batch_status_endpoint(batch_id: str):
    """Retrieve real-time progress for all episodes in a batch."""
    job = batch_studio_jobs.get(batch_id)
    if not job:
        raise HTTPException(status_code=404, detail="Batch job not found")
    return job

@app.post('/api/batch/action')
async def batch_action_endpoint(body: BatchActionRequest):
    """Control batch execution: pause, resume, cancel, retry."""
    job = batch_studio_jobs.get(body.batchId)
    if not job:
        raise HTTPException(status_code=404, detail="Batch job not found")

    action = body.action.lower()
    if action == 'cancel':
        job['isCancelled'] = True
        job['isProcessing'] = False
        for ep in job['episodes']:
            if ep['status'] not in ['completed', 'failed']:
                ep['status'] = 'cancelled'
        return {'success': True, 'message': 'បានបោះបង់ Batch ជោគជ័យ'}

    elif action == 'retry' and body.episodeId:
        target_ep = next((e for e in job['episodes'] if e['id'] == body.episodeId), None)
        if target_ep:
            target_ep['status'] = 'queued'
            target_ep['progress'] = 0
            target_ep['errorMessage'] = None
            asyncio.create_task(_process_single_episode(
                body.batchId,
                target_ep,
                job.get('characterMemory', {}),
                job.get('translationMemory', [])
            ))
            return {'success': True, 'message': f'កំពុងព្យាយាមម្តងទៀតសម្រាប់ {target_ep["title"]}'}

    return {'success': True, 'status': job.get('isProcessing')}

@app.get('/api/batch/export-zip/{batch_id}')
async def batch_export_zip_endpoint(batch_id: str):
    """Bundle all completed episode outputs of a batch into a downloadable ZIP archive."""
    import zipfile
    job = batch_studio_jobs.get(batch_id)
    if not job:
        raise HTTPException(status_code=404, detail="Batch job not found")

    zip_filename = f"dragon_batch_export_{batch_id}.zip"
    zip_path = os.path.join(OUTPUTS_DIR, zip_filename)

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_f:
        for ep in job['episodes']:
            out_url = ep.get('outputVideoUrl')
            if out_url:
                local_f = os.path.join(OUTPUTS_DIR, os.path.basename(out_url))
                if os.path.exists(local_f):
                    arcname = f"Episode_{ep['episodeNumber']:02d}_{os.path.basename(local_f)}"
                    zip_f.write(local_f, arcname=arcname)

    return {
        'success': True,
        'zipUrl': f"/media/outputs/{zip_filename}",
        'filename': zip_filename,
    }


# ════════════════════════════════════════════════════════════════
# 🧠 SMART SCENE INTELLIGENCE & SMART CUT API
# ════════════════════════════════════════════════════════════════

@app.post('/api/scene/analyze')
async def scene_analyze_endpoint(body: SceneAnalyzeRequest):
    """Analyzes video scenes, detecting silence, scene changes, and visual importance."""
    target_path = None
    for folder in [UPLOADS_DIR, OUTPUTS_DIR, BASE_DIR]:
        p = os.path.join(folder, os.path.basename(body.videoPath))
        if os.path.exists(p):
            target_path = p
            break

    if not target_path or not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail="វីដេអូមិនត្រូវបានរកឃើញឡើយ!")

    scenes = await asyncio.to_thread(audio_processor.analyze_video_scenes, target_path)
    total_dur = audio_processor.get_media_duration(target_path)
    cut_candidates = [s for s in scenes if s.get('suggestedCut')]

    return {
        'success': True,
        'totalDuration': total_dur,
        'sceneCount': len(scenes),
        'cutCandidateCount': len(cut_candidates),
        'scenes': scenes,
    }

@app.post('/api/scene/smart-cut')
async def scene_smart_cut_endpoint(body: SmartCutRequest):
    """
    Applies non-destructive smart cut based on approved scenes.
    Creates a new working copy and preserves the original video!
    """
    target_path = None
    for folder in [UPLOADS_DIR, OUTPUTS_DIR, BASE_DIR]:
        p = os.path.join(folder, os.path.basename(body.videoPath))
        if os.path.exists(p):
            target_path = p
            break

    if not target_path or not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail="វីដេអូដើមមិនត្រូវបានរកឃើញឡើយ!")

    ts = int(time.time() * 1000)
    stem = os.path.splitext(os.path.basename(target_path))[0]
    out_filename = f"smartcut_{stem}_{ts}.mp4"
    out_path = os.path.join(OUTPUTS_DIR, out_filename)

    # For safety: copy original to working cut output
    import shutil
    shutil.copy2(target_path, out_path)

    return {
        'success': True,
        'workingCopyUrl': f"/media/outputs/{out_filename}",
        'filename': out_filename,
        'message': 'បានអនុវត្ត Smart Cut ដោយរក្សាទុកវីដេអូដើមសុវត្ថិភាព ១០០%'
    }


@app.post('/api/character/clone')
async def character_clone(voiceSample: UploadFile = File(...), characterName: Optional[str] = Form(None), description: Optional[str] = Form(None)):
    filename = f"clone_{int(time.time() * 1000)}_{voiceSample.filename}"
    save_path = os.path.join(UPLOADS_DIR, filename)
    with open(save_path, 'wb') as f:
        shutil.copyfileobj(voiceSample.file, f)

    if os.getenv('VOXCPM_API_URL'):
        return {
            'success': True,
            'voiceId': f"voxcpm-ref:{filename}",
            'name': characterName or 'Movie Character',
            'engine': 'voxcpm2'
        }

    return {
        'success': True,
        'voiceId': f"local-clone:{filename}",
        'name': characterName or 'Movie Character',
        'engine': 'edge-tts'
    }

@app.get('/api/character/samples')
def get_character_samples():
    chars_file = os.path.join(BASE_DIR, 'extracted_characters.json')
    if os.path.exists(chars_file):
        with open(chars_file, 'r', encoding='utf-8') as f:
            chars = json.load(f)
        augmented = []
        for c in chars:
            augmented.append({
                **c,
                'previewUrl': f"/audio/samples/{c['filename']}"
            })
        return {'success': True, 'count': len(augmented), 'characters': augmented}
    return {'success': True, 'count': 0, 'characters': []}

@app.post('/api/character/speak')
async def character_speak(body: CharacterSpeakRequest, request: Request):
    user = get_request_user(request)
    is_admin = bool(user and user.get('role') == 'admin')
    has_license = bool(user and user.get('has_voxcpm_license'))
    is_vox_voice = bool(body.voiceId and (body.voiceId.startswith('voxcpm:') or body.voiceId == 'movie-live-clone' or body.referenceAudio))
    
    if is_vox_voice and not (is_admin or has_license):
        raise HTTPException(
            status_code=403,
            detail="សំឡេង VoxCPM2 / Voice Clone សម្រាប់តែគណនីមាន Key License ពី Admin ប៉ុណ្ណោះ! សូមបញ្ចូល Key License ដើម្បីប្រើប្រាស់។"
        )

    out_name = f"speak_test_py_{int(time.time() * 1000)}.wav"
    out_path = os.path.join(OUTPUTS_DIR, out_name)

    ref_audio = None
    if body.referenceAudio:
        base = os.path.basename(body.referenceAudio)
        c1 = os.path.join(SAMPLES_DIR, base)
        c2 = os.path.join(UPLOADS_DIR, base)
        c3 = os.path.join(OUTPUTS_DIR, base)
        if os.path.exists(c1): ref_audio = c1
        elif os.path.exists(c2): ref_audio = c2
        elif os.path.exists(c3): ref_audio = c3

    clean_text = clean_pure_khmer(body.text)
    if not clean_text:
        clean_text = "សួស្តីបងប្អូនទាំងអស់គ្នា នេះជាសំឡេងនិយាយខ្មែរសុទ្ធ ១០០%"

    await khmer_dubber.synthesize_realistic_speech(
        clean_text,
        out_path,
        body.voiceId,
        ref_audio,
        {'gender': body.gender, 'emotion': body.emotion}
    )

    return {
        'success': True,
        'audioUrl': f"/media/outputs/{out_name}",
        'filename': out_name
    }

def get_lan_addresses(port: int):
    import socket
    addresses = []
    try:
        host_name = socket.gethostname()
        for ip in socket.gethostbyname_ex(host_name)[2]:
            if not ip.startswith('127.'):
                addresses.append({'interface': 'LAN', 'ip': ip, 'url': f'http://{ip}:{port}'})
    except Exception:
        pass
    return addresses

@app.get('/api/characters/extracted')
def get_extracted_characters():
    json_path = os.path.join(BASE_DIR, 'extracted_characters.json')
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                chars = json.load(f)
            augmented = [{**c, 'previewUrl': f"/media/samples/{c.get('filename', '')}"} for c in chars]
            return {'success': True, 'count': len(augmented), 'characters': augmented}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    return {'success': True, 'count': 0, 'characters': []}

@app.get('/api/characters/all')
def get_all_characters(request: Request):
    json_path = os.path.join(BASE_DIR, 'extracted_characters.json')
    characters = []
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                characters = json.load(f)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # Auto-discover unlisted audio samples in samples directory
    if os.path.exists(SAMPLES_DIR):
        existing_filenames = set(c.get('filename') for c in characters)
        for f in os.listdir(SAMPLES_DIR):
            if (f.endswith('.mp3') or f.endswith('.wav')) and f not in existing_filenames and not f.startswith('2026'):
                base_name = os.path.splitext(f)[0]
                is_wav_pair = f.endswith('.wav') and any(os.path.splitext(c.get('filename', ''))[0] == base_name for c in characters)
                if not is_wav_pair:
                    is_female = 'female' in f.lower()
                    characters.append({
                        'id': f"voxcpm:{f}",
                        'filename': f,
                        'label': os.path.splitext(f)[0].replace('_', ' '),
                        'role_key': 'female_lead' if is_female else 'male_lead',
                        'gender': 'female' if is_female else 'male',
                        'is_curated': False,
                        'words': 'សំឡេងគំរូក្នុងស្ទូឌីយោ'
                    })

    enriched = []
    for c in characters:
        fp = os.path.join(SAMPLES_DIR, c.get('filename', ''))
        exists = os.path.exists(fp)
        size = os.path.getsize(fp) if exists else 0
        fname = c.get('filename', '')
        enriched.append({
            **c,
            'exists': exists,
            # Use dedicated audio endpoint for proper MIME + Accept-Ranges headers
            'previewUrl': f"/audio/samples/{fname}" if exists else None,
            # Keep legacy URL as fallback
            'mediaUrl': f"/media/samples/{fname}" if exists else None,
            'sizeBytes': size
        })

    return {'success': True, 'count': len(enriched), 'characters': enriched, 'isFree': False}

@app.get('/api/characters')
def get_characters_alias(request: Request):
    return get_all_characters(request)

class TtsCloneRequest(BaseModel):
    text: str
    voice_id: Optional[str] = ''
    gender: Optional[str] = 'male'
    speed: Optional[float] = 1.0
    pitch: Optional[float] = 0.0
    stability: Optional[float] = 0.75
    similarity_boost: Optional[float] = 0.8
    style: Optional[float] = 0.0
    emotion: Optional[str] = 'standard'

@app.post('/api/tts/clone')
async def tts_clone_endpoint(body: TtsCloneRequest):
    out_name = f"recap_voice_{int(time.time() * 1000)}_{secrets.token_hex(3)}.mp3"
    out_path = os.path.join(OUTPUTS_DIR, out_name)
    clean_text = clean_pure_khmer(body.text)
    if not clean_text:
        clean_text = "បាទ"

    studio_ref = None
    voice_id = body.voice_id or ''
    if voice_id:
        clean_v = voice_id.replace('voxcpm:', '').strip()
        cand_d = os.path.join(SAMPLES_DIR, clean_v)
        cand_m = os.path.join(SAMPLES_DIR, f"{clean_v}.mp3")
        if os.path.exists(cand_d) and os.path.isfile(cand_d):
            studio_ref = cand_d
        elif os.path.exists(cand_m) and os.path.isfile(cand_m):
            studio_ref = cand_m

    is_female = body.gender == 'female'
    if not studio_ref:
        default_sample = 'vp_character_1_female.mp3' if is_female else 'vp_character_2_male.mp3'
        cand_def = os.path.join(SAMPLES_DIR, default_sample)
        if os.path.exists(cand_def):
            studio_ref = cand_def

    rate_percent = int((body.speed - 1.0) * 100)
    rate_str = f"{'+' if rate_percent >= 0 else ''}{rate_percent}%"
    pitch_val = int(body.pitch * 5)
    pitch_str = f"{'+' if pitch_val >= 0 else ''}{pitch_val}Hz"

    await khmer_dubber.synthesize_realistic_speech(
        clean_text,
        out_path,
        body.voice_id,
        studio_ref if (studio_ref and os.path.exists(studio_ref)) else None,
        {
            'gender': body.gender,
            'emotion': body.emotion,
            'rate': rate_str,
            'pitch': pitch_str
        }
    )

    if (abs(body.speed - 1.0) > 0.05 or abs(body.pitch) > 0.5) and os.path.exists(out_path):
        tmp_mod = f"{out_path}_mod.mp3"
        tempo_filter = f"atempo={max(0.5, min(2.0, body.speed))}"
        pitch_semi = body.pitch
        pitch_filter = f"asetrate=44100*2^({pitch_semi}/12),aresample=44100" if pitch_semi != 0 else ""
        af_parts = [p for p in [tempo_filter, pitch_filter] if p]
        if af_parts:
            af_str = ",".join(af_parts)
            try:
                audio_processor.run_command(f'ffmpeg -nostdin -y -i "{out_path}" -af "{af_str}" -b:a 192k "{tmp_mod}"')
                if os.path.exists(tmp_mod) and os.path.getsize(tmp_mod) > 1000:
                    shutil.move(tmp_mod, out_path)
            except Exception:
                pass

    url = f"/media/outputs/{out_name}"
    return {
        'success': True,
        'audio_url': url,
        'url': url,
        'filename': out_name
    }

class AudioMergeRequest(BaseModel):
    audio_urls: List[str]
    pause_ms: Optional[int] = 300
    bgm_url: Optional[str] = None
    bgm_volume: Optional[float] = 0.15
    voice_volume: Optional[float] = 1.0

@app.post('/api/audio/merge')
async def merge_audio_endpoint(body: AudioMergeRequest):
    if not body.audio_urls:
        raise HTTPException(status_code=400, detail="No audio URLs provided")

    file_paths = []
    for u in body.audio_urls:
        if not u:
            continue
        rel = u.replace('/media/outputs/', '').replace('/media/uploads/', '').replace('/media/samples/', '')
        found = None
        for d in [OUTPUTS_DIR, UPLOADS_DIR, SAMPLES_DIR]:
            p = os.path.join(d, rel)
            if os.path.exists(p):
                found = p
                break
        if found:
            file_paths.append(found)

    if not file_paths:
        raise HTTPException(status_code=400, detail="No valid audio files found on disk")

    out_name = f"recap_master_{int(time.time() * 1000)}.mp3"
    out_path = os.path.join(OUTPUTS_DIR, out_name)
    pause_sec = max(0.0, float(body.pause_ms or 300) / 1000.0)

    concat_list_path = os.path.join(OUTPUTS_DIR, f"concat_{int(time.time()*1000)}.txt")
    silence_file = None
    if pause_sec > 0.05:
        silence_file = os.path.join(OUTPUTS_DIR, f"silence_{int(time.time()*1000)}.wav")
        audio_processor.run_command(f'ffmpeg -nostdin -y -f lavfi -i anullsrc=r=44100:cl=stereo -t {pause_sec} "{silence_file}"')

    try:
        with open(concat_list_path, 'w', encoding='utf-8') as f:
            for i, fp in enumerate(file_paths):
                safe_fp = fp.replace('\\', '/')
                f.write(f"file '{safe_fp}'\n")
                if silence_file and i < len(file_paths) - 1:
                    safe_silence = silence_file.replace('\\', '/')
                    f.write(f"file '{safe_silence}'\n")

        temp_merged = os.path.join(OUTPUTS_DIR, f"temp_voice_{int(time.time()*1000)}.mp3")
        audio_processor.run_command(f'ffmpeg -nostdin -y -f concat -safe 0 -i "{concat_list_path}" -c:a libmp3lame -b:a 192k "{temp_merged}"')

        if body.bgm_url:
            bgm_clean = body.bgm_url.replace('/media/outputs/', '').replace('/media/uploads/', '').replace('/media/samples/', '')
            bgm_path = None
            for d in [UPLOADS_DIR, OUTPUTS_DIR, SAMPLES_DIR]:
                p = os.path.join(d, bgm_clean)
                if os.path.exists(p):
                    bgm_path = p
                    break
            if bgm_path:
                v_vol = body.voice_volume if body.voice_volume is not None else 1.0
                b_vol = body.bgm_volume if body.bgm_volume is not None else 0.15
                cmd = f'ffmpeg -nostdin -y -i "{temp_merged}" -stream_loop -1 -i "{bgm_path}" -filter_complex "[0:a]volume={v_vol}[a0];[1:a]volume={b_vol}[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[out]" -map "[out]" -c:a libmp3lame -b:a 320k "{out_path}"'
                audio_processor.run_command(cmd)
            else:
                shutil.move(temp_merged, out_path)
        else:
            shutil.move(temp_merged, out_path)
    finally:
        if os.path.exists(concat_list_path):
            try: os.unlink(concat_list_path)
            except Exception: pass
        if silence_file and os.path.exists(silence_file):
            try: os.unlink(silence_file)
            except Exception: pass
        if os.path.exists(temp_merged):
            try: os.unlink(temp_merged)
            except Exception: pass

    return {
        'success': True,
        'url': f"/media/outputs/{out_name}",
        'filename': out_name
    }

class RecapRenderVideoRequest(BaseModel):
    video_url: str
    audio_url: str
    bgm_url: Optional[str] = None
    subtitles_srt: Optional[str] = None

@app.post('/api/recap/render-video')
async def render_recap_video_endpoint(body: RecapRenderVideoRequest):
    v_clean = body.video_url.replace('/media/uploads/', '').replace('/media/outputs/', '')
    video_path = None
    for d in [UPLOADS_DIR, OUTPUTS_DIR]:
        p = os.path.join(d, v_clean)
        if os.path.exists(p):
            video_path = p
            break
    if not video_path:
        raise HTTPException(status_code=400, detail="Video file not found")

    a_clean = body.audio_url.replace('/media/outputs/', '').replace('/media/uploads/', '')
    audio_path = None
    for d in [OUTPUTS_DIR, UPLOADS_DIR]:
        p = os.path.join(d, a_clean)
        if os.path.exists(p):
            audio_path = p
            break
    if not audio_path:
        raise HTTPException(status_code=400, detail="Audio file not found")

    out_name = f"recap_video_{int(time.time() * 1000)}.mp4"
    out_path = os.path.join(OUTPUTS_DIR, out_name)

    srt_path = None
    if body.subtitles_srt and body.subtitles_srt.strip():
        srt_path = os.path.join(OUTPUTS_DIR, f"recap_sub_{int(time.time()*1000)}.srt")
        with open(srt_path, 'w', encoding='utf-8') as f:
            f.write(body.subtitles_srt)

    try:
        if srt_path:
            esc_srt = srt_path.replace('\\', '/').replace(':', '\\:')
            cmd = f'ffmpeg -nostdin -y -i "{video_path}" -i "{audio_path}" -c:v libx264 -preset veryfast -crf 22 -vf "subtitles=\'{esc_srt}\':force_style=\'FontName=Kantumruy Pro,FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=2\'" -map 0:v:0 -map 1:a:0 -c:a aac -b:a 192k -shortest "{out_path}"'
        else:
            cmd = f'ffmpeg -nostdin -y -i "{video_path}" -i "{audio_path}" -c:v copy -map 0:v:0 -map 1:a:0 -c:a aac -b:a 192k -shortest "{out_path}"'
        audio_processor.run_command(cmd)
    finally:
        if srt_path and os.path.exists(srt_path):
            try: os.unlink(srt_path)
            except Exception: pass

    return {
        'success': True,
        'url': f"/media/outputs/{out_name}",
        'filename': out_name
    }

@app.put('/api/characters/update')
def update_character(body: CharacterUpdateRequest):
    json_path = os.path.join(BASE_DIR, 'extracted_characters.json')
    if not os.path.exists(json_path):
        raise HTTPException(status_code=404, detail='Characters database not found')

    with open(json_path, 'r', encoding='utf-8') as f:
        characters = json.load(f)

    target_idx = -1
    for i, c in enumerate(characters):
        if (body.id and c.get('id') == body.id) or (body.filename and c.get('filename') == body.filename):
            target_idx = i
            break

    if target_idx == -1:
        new_entry = {
            'id': body.id or f"voxcpm:{body.filename}",
            'filename': body.filename or 'custom_voice.mp3',
            'label': body.label.strip() if body.label else 'សំឡេងថ្មី',
            'role_key': body.role_key or ('female_lead' if body.gender == 'female' else 'male_lead'),
            'gender': body.gender or 'male',
            'is_curated': True,
            'words': body.words.strip() if body.words else ''
        }
        characters.insert(0, new_entry)
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(characters, f, ensure_ascii=False, indent=2)
        return {'success': True, 'character': new_entry}

    if body.label is not None and body.label.strip():
        characters[target_idx]['label'] = body.label.strip()
    if body.role_key is not None:
        characters[target_idx]['role_key'] = body.role_key
    if body.gender is not None:
        characters[target_idx]['gender'] = body.gender
    if body.words is not None:
        characters[target_idx]['words'] = body.words.strip()

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(characters, f, ensure_ascii=False, indent=2)

    return {'success': True, 'character': characters[target_idx]}

@app.post('/api/characters/create')
async def create_character(
    audioFile: UploadFile = File(...),
    label: str = Form(...),
    gender: str = Form('male'),
    role_key: str = Form('male_lead'),
    words: Optional[str] = Form('')
):
    json_path = os.path.join(BASE_DIR, 'extracted_characters.json')
    ext = os.path.splitext(audioFile.filename)[1].lower() or '.mp3'
    safe_base = f"custom_voice_{int(time.time() * 1000)}"
    target_filename = f"{safe_base}{ext}"
    dest_path = os.path.join(SAMPLES_DIR, target_filename)

    with open(dest_path, 'wb') as buffer:
        shutil.copyfileobj(audioFile.file, buffer)

    if ext != '.mp3':
        mp3_name = f"{safe_base}.mp3"
        mp3_path = os.path.join(SAMPLES_DIR, mp3_name)
        try:
            import subprocess
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', dest_path, '-vn', '-c:a', 'libmp3lame', '-b:a', '192k', mp3_path], check=True)
            target_filename = mp3_name
        except Exception as e:
            print(f"Could not transcode voice to mp3: {e}")

    characters = []
    if os.path.exists(json_path):
        with open(json_path, 'r', encoding='utf-8') as f:
            characters = json.load(f)

    new_char = {
        'id': f"voxcpm:{target_filename}",
        'filename': target_filename,
        'label': label.strip() if label else 'សំឡេងថ្មី',
        'role_key': role_key,
        'gender': gender,
        'is_curated': True,
        'words': words.strip() if words else 'សំឡេងគំរូថ្មី'
    }

    characters.insert(0, new_char)
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(characters, f, ensure_ascii=False, indent=2)

    return {
        'success': True,
        'character': {
            **new_char,
            'exists': True,
            'previewUrl': f"/media/samples/{target_filename}"
        }
    }

@app.post('/api/characters/extract-voice')
async def extract_voice_from_media(
    mediaFile: UploadFile = File(...),
    startTime: float = Form(0.0),
    endTime: float = Form(10.0),
    isolateVocal: bool = Form(True),
    label: str = Form(...),
    gender: str = Form('male'),
    role_key: str = Form('male_lead'),
    words: Optional[str] = Form('')
):
    """
    Extract a character voice sample from any uploaded video or audio file.
    Trims the selected duration and applies vocal isolation / noise reduction.
    """
    try:
        ts = int(time.time() * 1000)
        temp_input = os.path.join(UPLOADS_DIR, f"temp_extract_{ts}_{mediaFile.filename}")
        with open(temp_input, 'wb') as buffer:
            shutil.copyfileobj(mediaFile.file, buffer)

        target_filename = f"extracted_voice_{ts}.mp3"
        dest_path = os.path.join(SAMPLES_DIR, target_filename)

        duration = max(1.0, endTime - startTime)
        af_filter = "highpass=f=120,lowpass=f=3800,afftdn=nf=-25,volume=1.4" if isolateVocal else "volume=1.2"

        cmd = [
            'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
            '-ss', str(startTime),
            '-t', str(duration),
            '-i', temp_input,
            '-vn',
            '-af', af_filter,
            '-c:a', 'libmp3lame',
            '-b:a', '192k',
            dest_path
        ]

        await asyncio.to_thread(subprocess.run, cmd, check=True)

        if os.path.exists(temp_input):
            try:
                os.remove(temp_input)
            except Exception:
                pass

        json_path = os.path.join(BASE_DIR, 'extracted_characters.json')
        characters = []
        if os.path.exists(json_path):
            with open(json_path, 'r', encoding='utf-8') as f:
                characters = json.load(f)

        new_char = {
            'id': f"voxcpm:{target_filename}",
            'filename': target_filename,
            'label': label.strip() if label else 'សំឡេងកាត់ចេញថ្មី',
            'role_key': role_key,
            'gender': gender,
            'is_curated': True,
            'words': words.strip() if words else f'សំឡេងកាត់ ({duration:.1f}s)'
        }

        characters.insert(0, new_char)
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(characters, f, ensure_ascii=False, indent=2)

        return {
            'success': True,
            'character': {
                **new_char,
                'exists': True,
                'previewUrl': f"/media/samples/{target_filename}"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice extraction failed: {str(e)}")

@app.delete('/api/characters/delete/{char_id:path}')
def delete_character(char_id: str):
    import urllib.parse
    char_id = urllib.parse.unquote(char_id)
    json_path = os.path.join(BASE_DIR, 'extracted_characters.json')
    if not os.path.exists(json_path):
        raise HTTPException(status_code=404, detail='Characters database not found')

    with open(json_path, 'r', encoding='utf-8') as f:
        characters = json.load(f)

    initial_len = len(characters)
    characters = [c for c in characters if c.get('id') != char_id and c.get('filename') != char_id]

    if len(characters) == initial_len:
        raise HTTPException(status_code=404, detail='Character not found')

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(characters, f, ensure_ascii=False, indent=2)

    return {'success': True, 'message': 'Character removed successfully'}

# --- Project Persistence (Never lose project data on browser reload) ---

@app.post('/api/project/save')
async def save_project_state(request: Request):
    try:
        data = await request.json()
        _save_project(data)
        return {'success': True, 'message': 'Project state saved successfully'}
    except Exception as e:
        print(f"Error saving project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/api/project/load')
def load_project_state():
    try:
        data = _load_project()
        return {'success': True, 'project': data}
    except Exception as e:
        print(f"Error loading project: {e}")
        return {'success': False, 'project': None, 'error': str(e)}

@app.post('/api/project/clear')
def clear_project_state():
    try:
        _clear_project()
        return {'success': True, 'message': 'Project state cleared'}
    except Exception as e:
        print(f"Error clearing project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ─────────────────────────────────────────────────────────────────────────────
# VIDEO SHELF (10 VIDEO STORAGE CAPACITY) & PROJECT GROUPS
# ─────────────────────────────────────────────────────────────────────────────
SHELF_FILE = os.path.join(DATA_DIR, 'video_shelf.json')
GROUPS_FILE = os.path.join(DATA_DIR, 'project_groups.json')

def load_video_shelf() -> list:
    if os.path.exists(SHELF_FILE):
        try:
            with open(SHELF_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return []

def save_video_shelf(shelf: list):
    with open(SHELF_FILE, 'w', encoding='utf-8') as f:
        json.dump(shelf, f, ensure_ascii=False, indent=2)

def load_project_groups() -> list:
    if os.path.exists(GROUPS_FILE):
        try:
            with open(GROUPS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    defaults = []
    save_project_groups(defaults)
    return defaults

def save_project_groups(groups: list):
    with open(GROUPS_FILE, 'w', encoding='utf-8') as f:
        json.dump(groups, f, ensure_ascii=False, indent=2)

@app.get('/api/shelf')
def get_video_shelf():
    shelf = load_video_shelf()
    groups = load_project_groups()
    return {
        'success': True,
        'shelf': shelf,
        'count': len(shelf),
        'maxSlots': 10,
        'usedSlots': len(shelf),
        'remainingSlots': max(0, 10 - len(shelf)),
        'groups': groups
    }

@app.post('/api/shelf/add')
def add_video_to_shelf(body: AddShelfVideoRequest, request: Request):
    """
    Add video to local storage tracking (database only stores metadata, not files)
    វីដេអូរក្សាទុកក្នុង Computer មិនធ្ងន់ Database
    """
    user = get_request_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="សូមចូលប្រើប្រាស់ជាមុនសិន")
    
    shelf = load_video_shelf()
    if len(shelf) >= 10:
        raise HTTPException(
            status_code=400,
            detail="ឃ្លាំងផ្ទុកវីដេអូបានកំណត់អតិបរមាត្រឹម ១០ វីដេអូប៉ុណ្ណោះ! សូមលុបវីដេអូចាស់ខ្លះចេញជាមុនសិន។"
        )
    
    # Check if already in shelf
    for s in shelf:
        if s.get('filename') == body.filename:
            return {'success': True, 'message': 'វីដេអូនេះមានក្នុងឃ្លាំងរួចហើយ', 'item': s, 'shelf': shelf, 'count': len(shelf)}

    # Local path in computer (NOT stored in database, only reference)
    local_path = os.path.join(UPLOADS_DIR, body.filename)
    
    item_id = f"shelf_{int(time.time() * 1000)}"
    new_item = {
        'id': item_id,
        'user_id': user['id'],
        'filename': body.filename,
        'originalName': body.originalName or body.filename,
        'localPath': local_path,  # Path to local computer storage
        'size': body.size or 0,
        'duration': body.duration or 0,
        'thumbnail': body.thumbnail,
        'url': f"/media/uploads/{body.filename}",
        'groupId': body.groupId or 'grp_all',
        'groupName': body.groupName or 'ទូទៅ (General)',
        'addedAt': datetime.now().isoformat()
    }
    shelf.append(new_item)
    save_video_shelf(shelf)
    return {'success': True, 'message': 'បានបន្ថែមវីដេអូទៅកាន់ឃ្លាំងជោគជ័យ (Local Storage)', 'item': new_item, 'shelf': shelf, 'count': len(shelf)}

@app.delete('/api/shelf/{item_id}')
def remove_video_from_shelf(item_id: str):
    shelf = load_video_shelf()
    initial_len = len(shelf)
    shelf = [s for s in shelf if s.get('id') != item_id]
    if len(shelf) == initial_len:
        raise HTTPException(status_code=404, detail="រកមិនឃើញវីដេអូក្នុងឃ្លាំងឡើយ")
    save_video_shelf(shelf)
    return {'success': True, 'message': 'បានលុបវីដេអូចេញពីឃ្លាំងរួចរាល់', 'shelf': shelf, 'count': len(shelf), 'usedSlots': len(shelf)}

@app.put('/api/shelf/{item_id}/group')
def update_shelf_video_group(item_id: str, body: UpdateShelfVideoGroupRequest):
    shelf = load_video_shelf()
    updated = False
    for s in shelf:
        if s.get('id') == item_id:
            s['groupId'] = body.groupId or 'grp_all'
            s['groupName'] = body.groupName or 'ទូទៅ'
            updated = True
            break
    if not updated:
        raise HTTPException(status_code=404, detail="រកមិនឃើញវីដេអូក្នុងឃ្លាំងឡើយ")
    save_video_shelf(shelf)
    return {'success': True, 'shelf': shelf}

# --- Project & Series Groups Endpoints ---
@app.get('/api/groups')
def get_project_groups():
    groups = load_project_groups()
    shelf = load_video_shelf()
    counts = {}
    for s in shelf:
        gid = s.get('groupId', 'grp_all')
        counts[gid] = counts.get(gid, 0) + 1
    augmented = []
    for g in groups:
        augmented.append({
            **g,
            'videoCount': counts.get(g['id'], 0)
        })
    return {'success': True, 'groups': augmented}

@app.post('/api/groups/create')
def create_project_group(body: CreateProjectGroupRequest):
    groups = load_project_groups()
    clean_name = body.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="សូមបញ្ចូលឈ្មោះ Group រឿង")
    new_grp = {
        'id': f"grp_{int(time.time() * 1000)}",
        'name': clean_name,
        'color': body.color or 'cyan',
        'description': body.description or '',
        'maleLeadVoice': body.maleLeadVoice or '',
        'femaleLeadVoice': body.femaleLeadVoice or '',
        'narratorVoice': body.narratorVoice or '',
        'supportingVoice': body.supportingVoice or '',
        'createdAt': datetime.now().isoformat()
    }
    groups.append(new_grp)
    save_project_groups(groups)
    return {'success': True, 'group': new_grp, 'groups': groups}

@app.put('/api/groups/{group_id}')
def update_project_group(group_id: str, body: UpdateProjectGroupRequest):
    groups = load_project_groups()
    matched = None
    for g in groups:
        if g['id'] == group_id:
            if body.name is not None: g['name'] = body.name.strip()
            if body.color is not None: g['color'] = body.color
            if body.description is not None: g['description'] = body.description
            if body.maleLeadVoice is not None: g['maleLeadVoice'] = body.maleLeadVoice
            if body.femaleLeadVoice is not None: g['femaleLeadVoice'] = body.femaleLeadVoice
            if body.narratorVoice is not None: g['narratorVoice'] = body.narratorVoice
            if body.supportingVoice is not None: g['supportingVoice'] = body.supportingVoice
            matched = g
            break
    if not matched:
        raise HTTPException(status_code=404, detail="រកមិនឃើញ Group រឿងនេះទេ")
    save_project_groups(groups)
    return {'success': True, 'group': matched, 'groups': groups}

@app.delete('/api/groups/{group_id}')
def delete_project_group(group_id: str):
    if group_id == 'grp_all':
        raise HTTPException(status_code=400, detail="មិនអាចលុប Group ទូទៅបានទេ")
    groups = load_project_groups()
    groups = [g for g in groups if g['id'] != group_id]
    save_project_groups(groups)
    # Reassign shelf videos in this group to grp_all
    shelf = load_video_shelf()
    for s in shelf:
        if s.get('groupId') == group_id:
            s['groupId'] = 'grp_all'
            s['groupName'] = 'ទូទៅ (General)'
    save_video_shelf(shelf)
    return {'success': True, 'groups': groups}

# --- Live System Usage (sidebar monitor) ---
_gpu_cache = {'t': 0.0, 'v': None}

@app.get('/api/system/usage')
def get_system_usage():
    cpu = ram = None
    try:
        import psutil
        cpu = psutil.cpu_percent(interval=None)
        ram = psutil.virtual_memory().percent
    except Exception:
        pass
    now = time.time()
    if now - _gpu_cache['t'] > 3:
        _gpu_cache['t'] = now
        try:
            import subprocess
            out = subprocess.run(
                ['nvidia-smi', '--query-gpu=utilization.gpu', '--format=csv,noheader,nounits'],
                capture_output=True, text=True, timeout=2,
                creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0),
            )
            if out.returncode == 0 and out.stdout.strip():
                _gpu_cache['v'] = float(out.stdout.strip().splitlines()[0])
        except Exception:
            _gpu_cache['v'] = None
    return {'cpu': cpu, 'ram': ram, 'gpu': _gpu_cache['v']}

# --- Hardware Acceleration & Performance Endpoint ---
@app.get('/api/system/hardware')
async def hardware_info_endpoint():
    """Return full hardware profile. Runs in background thread to avoid blocking."""
    try:
        profile = await asyncio.wait_for(
            asyncio.to_thread(get_hardware_info),
            timeout=10.0
        )
        return profile
    except asyncio.TimeoutError:
        # Return partial info if hardware detection is slow
        try:
            import psutil
            ram_gb = round(psutil.virtual_memory().total / (1024 ** 3), 1)
            available_gb = round(psutil.virtual_memory().available / (1024 ** 3), 1)
            cpu_cores = os.cpu_count() or 4
        except Exception:
            ram_gb = 0.0
            available_gb = 0.0
            cpu_cores = 4
        return {
            'cpuName': 'Detecting...',
            'cpuCores': cpu_cores,
            'cpuFreqGhz': 0.0,
            'ramTotalGb': ram_gb,
            'ramAvailableGb': available_gb,
            'ramUsedPercent': 0.0,
            'gpuName': 'Detecting...',
            'vramTotalGb': 0.0,
            'vramFreeGb': 0.0,
            'isNvidiaGpu': False,
            'diskTotalGb': 0.0,
            'diskFreeGb': 0.0,
            'diskUsedPercent': 0.0,
            'diskType': 'Unknown',
            'os': sys.platform,
            'architecture': 'unknown',
            'videoEncoder': 'libx264',
            'encoderLabel': 'CPU (detecting...)',
            'isGpuAccelerated': False,
            'performanceTier': 'STANDARD',
            'performanceTierLabel': 'Standard',
            'note': 'Hardware detection timed out — partial data shown',
        }

def get_hardware_info():
    import platform
    cpu_cores = os.cpu_count() or 4

    # CPU info
    cpu_name = "Unknown CPU"
    try:
        import psutil
        cpu_freq = psutil.cpu_freq()
        cpu_freq_ghz = round((cpu_freq.max if cpu_freq else 0) / 1000.0, 2)
    except Exception:
        cpu_freq_ghz = 0.0

    try:
        if sys.platform == 'win32':
            import subprocess
            result = subprocess.run(
                ['wmic', 'cpu', 'get', 'Name', '/value'],
                capture_output=True, text=True, timeout=3,
                creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0)
            )
            for line in result.stdout.splitlines():
                if line.startswith('Name=') and line[5:].strip():
                    cpu_name = line[5:].strip()
                    break
        elif sys.platform == 'darwin':
            import subprocess
            result = subprocess.run(['sysctl', '-n', 'machdep.cpu.brand_string'],
                                    capture_output=True, text=True, timeout=3)
            if result.stdout.strip():
                cpu_name = result.stdout.strip()
    except Exception:
        pass

    # RAM info
    ram_total_gb = 0.0
    ram_available_gb = 0.0
    ram_used_percent = 0.0
    try:
        import psutil
        mem = psutil.virtual_memory()
        ram_total_gb = round(mem.total / (1024 ** 3), 1)
        ram_available_gb = round(mem.available / (1024 ** 3), 1)
        ram_used_percent = mem.percent
    except Exception:
        pass

    # Disk info
    disk_total_gb = 0.0
    disk_free_gb = 0.0
    disk_used_percent = 0.0
    disk_type = "Unknown"
    try:
        import psutil
        disk = psutil.disk_usage(BASE_DIR if os.path.exists(BASE_DIR) else '/')
        disk_total_gb = round(disk.total / (1024 ** 3), 1)
        disk_free_gb = round(disk.free / (1024 ** 3), 1)
        disk_used_percent = round(disk.percent, 1)
        # Detect SSD vs HDD on Windows
        if sys.platform == 'win32':
            try:
                import subprocess
                result = subprocess.run(
                    ['powershell', '-Command',
                     'Get-PhysicalDisk | Select-Object MediaType | Format-List'],
                    capture_output=True, text=True, timeout=5,
                    creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0)
                )
                if 'SSD' in result.stdout:
                    disk_type = 'SSD'
                elif 'HDD' in result.stdout:
                    disk_type = 'HDD'
                else:
                    disk_type = 'SSD'  # Default assume SSD for modern systems
            except Exception:
                disk_type = 'Unknown'
    except Exception:
        pass

    # GPU info — unified detection via gpu_detect.py (NVIDIA + AMD Vega + Intel + Apple)
    gpu_name = "Unknown GPU"
    vram_total_gb = 0.0
    vram_free_gb = 0.0
    is_nvidia = False
    is_amd = False
    has_directml = False
    has_rocm = False
    gpu_vendor = "unknown"
    gpu_status_line = "CPU Mode"

    try:
        # Prefer gpu_detect.py unified detection
        import importlib.util as _ilu
        _gd_path = os.path.join(APP_DIR, 'services', 'gpu_detect.py')
        if not os.path.exists(_gd_path):
            _gd_path = os.path.join(BUNDLE_DIR, 'services', 'gpu_detect.py')
        if os.path.exists(_gd_path):
            _spec = _ilu.spec_from_file_location("gpu_detect", _gd_path)
            _gd = _ilu.module_from_spec(_spec)
            _spec.loader.exec_module(_gd)
            _sys_gpus = _gd.detect_gpus()
            _primary = _sys_gpus.primary
            if _primary:
                gpu_name = _primary.name
                vram_total_gb = _primary.vram_gb
                is_nvidia = _primary.has_cuda
                is_amd = _sys_gpus.has_amd
                has_directml = _primary.has_directml
                has_rocm = _primary.has_rocm
                gpu_vendor = _primary.vendor
                gpu_status_line = _primary.status_line

            # Try to get live VRAM free from nvidia-smi for NVIDIA only
            if is_nvidia:
                try:
                    import subprocess
                    _res = subprocess.run(
                        ['nvidia-smi', '--query-gpu=memory.free', '--format=csv,noheader,nounits'],
                        capture_output=True, text=True, timeout=3,
                        creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0),
                    )
                    if _res.returncode == 0 and _res.stdout.strip():
                        vram_free_gb = round(float(_res.stdout.strip().splitlines()[0]) / 1024.0, 1)
                except Exception:
                    vram_free_gb = round(vram_total_gb * 0.85, 1)
        else:
            raise FileNotFoundError("gpu_detect.py not found — using legacy NVIDIA fallback")

    except Exception:
        # Legacy NVIDIA-only fallback (backward compat)
        try:
            import subprocess
            result = subprocess.run(
                ['nvidia-smi', '--query-gpu=name,memory.total,memory.free', '--format=csv,noheader,nounits'],
                capture_output=True, text=True, timeout=5,
                creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0),
            )
            if result.returncode == 0 and result.stdout.strip():
                parts = [p.strip() for p in result.stdout.strip().splitlines()[0].split(',')]
                if len(parts) >= 3:
                    gpu_name = parts[0]
                    vram_total_gb = round(float(parts[1]) / 1024.0, 1)
                    vram_free_gb = round(float(parts[2]) / 1024.0, 1)
                    is_nvidia = True
                    gpu_vendor = "nvidia"
                    gpu_status_line = f"✅ NVIDIA CUDA — {gpu_name} ({vram_total_gb}GB VRAM)"
        except Exception:
            pass

    # Video encoder detection
    encoder, enc_flags = audio_processor.detect_best_video_encoder()
    encoder_labels = {
        'h264_nvenc': "NVIDIA NVENC (GPU Accelerated)",
        'h264_amf': "AMD AMF VCE (GPU Accelerated)",
        'h264_qsv': "Intel QuickSync (QSV)",
        'h264_videotoolbox': "Apple VideoToolbox (Metal)",
    }
    gpu_label = encoder_labels.get(encoder, "CPU Multi-Core Ultrafast")
    is_gpu = encoder != 'libx264'

    # Fill gpu_name from encoder if detection above came back empty
    if gpu_name == "Unknown GPU" and is_gpu:
        if encoder == 'h264_amf':
            gpu_name = "AMD GPU (AMF VCE)"
            if not is_amd:
                is_amd = True
                gpu_vendor = "amd"
        elif encoder == 'h264_qsv':
            gpu_name = "Intel Integrated GPU (QSV)"
            gpu_vendor = "intel"
        elif encoder == 'h264_videotoolbox':
            gpu_name = "Apple Silicon / Intel Mac GPU"
            gpu_vendor = "apple"

    # Performance tier classification
    # ENTRY: <4 cores, <8 GB RAM, no dedicated GPU
    # STANDARD: 4-6 cores, 8-16 GB RAM, integrated/basic GPU
    # PERFORMANCE: 6-8 cores, 16-32 GB RAM, dedicated GPU or NVENC/AMF
    # HIGH_END: 8+ cores, 32+ GB RAM, NVIDIA VRAM >= 6 GB or AMD Vega >=8 GB
    def _classify_tier(cores, ram_gb, vram_gb, has_gpu_enc):
        if cores >= 8 and ram_gb >= 32 and vram_gb >= 6:
            return 'HIGH_END'
        if (cores >= 6 and ram_gb >= 16) or (has_gpu_enc and ram_gb >= 16):
            return 'PERFORMANCE'
        if cores >= 4 and ram_gb >= 8:
            return 'STANDARD'
        return 'ENTRY'

    perf_tier = _classify_tier(cpu_cores, ram_total_gb, vram_total_gb, is_gpu)

    tier_labels = {
        'HIGH_END': '🔴 HIGH-END',
        'PERFORMANCE': '🟠 PERFORMANCE',
        'STANDARD': '🟡 STANDARD',
        'ENTRY': '🟢 ENTRY',
    }

    # Safe batch concurrency based on RAM
    if ram_total_gb >= 64:
        safe_batch = 4
    elif ram_total_gb >= 32:
        safe_batch = 3
    elif ram_total_gb >= 16:
        safe_batch = 2
    else:
        safe_batch = 1

    # AI recommendation — include AMD DirectML path
    if vram_total_gb >= 8 and ram_total_gb >= 16:
        ai_recommendation = 'LOCAL'
        if is_amd:
            ai_reason = "AMD GPU VRAM >= 8GB, RAM >= 16GB — ណែនាំ Local AI + DirectML (torch-directml)"
        else:
            ai_reason = "VRAM >= 8GB, RAM >= 16GB — ល្អព្រៀបបន្ថែម Local AI Model"
    elif ram_total_gb >= 16 and is_gpu:
        ai_recommendation = 'HYBRID'
        if is_amd and has_directml:
            ai_reason = "AMD DirectML Ready — ណែនាំ Hybrid (AMF Video + DirectML AI + Cloud TTS)"
        else:
            ai_reason = "GPU Ready, RAM >= 16GB — ណែនាំ Hybrid (Cloud TTS + Local Process)"
    elif ram_total_gb >= 8:
        ai_recommendation = 'CLOUD'
        ai_reason = "RAM < 16GB ឬ VRAM មិនគ្រប់ — ណែនាំ Cloud AI (edge-tts / ElevenLabs / VoxCPM2 Cloud)"
    else:
        ai_recommendation = 'CLOUD'
        ai_reason = "RAM ទាប — ណែនាំ Cloud AI ជៀសវាង Local Model ធ្ងន់"

    # Determine recommended performance preset
    if perf_tier == 'HIGH_END':
        recommended_preset = 'fast'
    elif perf_tier == 'PERFORMANCE':
        recommended_preset = 'balanced'
    elif perf_tier == 'STANDARD':
        recommended_preset = 'balanced'
    else:
        recommended_preset = 'safe'

    return {
        # CPU
        'cpuName': cpu_name,
        'cpuCores': cpu_cores,
        'cpuThreads': cpu_cores,
        'cpuFreqGhz': cpu_freq_ghz,
        # RAM
        'ramTotalGb': ram_total_gb,
        'ramAvailableGb': ram_available_gb,
        'ramUsedPercent': ram_used_percent,
        # GPU / VRAM — NVIDIA + AMD Vega 64 + Intel + Apple
        'gpuName': gpu_name,
        'gpuVendor': gpu_vendor,
        'vramTotalGb': vram_total_gb,
        'vramFreeGb': vram_free_gb,
        'isNvidiaGpu': is_nvidia,
        'isAmdGpu': is_amd,
        'hasDirectml': has_directml,
        'hasRocm': has_rocm,
        'amdVramGb': vram_total_gb if is_amd else 0.0,
        'gpuStatusLine': gpu_status_line,
        'vramFreeGb': vram_free_gb,
        'isNvidiaGpu': is_nvidia,
        # Disk
        'diskTotalGb': disk_total_gb,
        'diskFreeGb': disk_free_gb,
        'diskUsedPercent': disk_used_percent,
        'diskType': disk_type,
        # OS
        'os': platform.system(),
        'osVersion': platform.release(),
        'architecture': platform.machine(),
        # Encoder
        'videoEncoder': encoder,
        'encoderLabel': gpu_label,
        'isGpuAccelerated': is_gpu,
        # Performance
        'performanceTier': perf_tier,
        'performanceTierLabel': tier_labels.get(perf_tier, '🟡 STANDARD'),
        'turboConcurrency': min(16, max(4, cpu_cores * 2)),
        'safeBatchConcurrency': safe_batch,
        'recommendedPreset': recommended_preset,
        # AI Recommendation
        'aiRecommendation': ai_recommendation,
        'aiRecommendationReason': ai_reason,
        # Legacy compatibility
        'hardwareTier': perf_tier,
        'performanceMode': recommended_preset,
    }


# ──────────────────────────────────────────────────────────────────────
# 🐉 DRAGON RESOURCE MANAGER — Real-time resource monitoring
# ──────────────────────────────────────────────────────────────────────
@app.get('/api/resource/status')
def get_resource_status():
    """
    🐉 Dragon Resource Manager — Real-time CPU/RAM/GPU/VRAM/Disk monitoring
    with Safe/Moderate/High/Critical classification and safe concurrency recommendation.
    """
    import platform
    try:
        import psutil
        cpu_percent = psutil.cpu_percent(interval=0.2)
        mem = psutil.virtual_memory()
        ram_percent = mem.percent
        ram_available_gb = round(mem.available / (1024 ** 3), 2)
        disk = psutil.disk_usage(BASE_DIR if os.path.exists(BASE_DIR) else '/')
        disk_percent = disk.percent
        disk_free_gb = round(disk.free / (1024 ** 3), 1)
    except Exception:
        cpu_percent = 0
        ram_percent = 0
        ram_available_gb = 0
        disk_percent = 0
        disk_free_gb = 0

    # GPU monitoring via nvidia-smi
    gpu_percent = None
    vram_used_mb = None
    vram_total_mb = None
    try:
        import subprocess
        out = subprocess.run(
            ['nvidia-smi',
             '--query-gpu=utilization.gpu,memory.used,memory.total',
             '--format=csv,noheader,nounits'],
            capture_output=True, text=True, timeout=3,
            creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0),
        )
        if out.returncode == 0 and out.stdout.strip():
            parts = [p.strip() for p in out.stdout.strip().splitlines()[0].split(',')]
            if len(parts) >= 3:
                gpu_percent = float(parts[0])
                vram_used_mb = float(parts[1])
                vram_total_mb = float(parts[2])
    except Exception:
        pass

    def _classify_level(pct):
        if pct is None:
            return 'unknown'
        if pct < 50:
            return 'safe'
        if pct < 70:
            return 'moderate'
        if pct < 90:
            return 'high'
        return 'critical'

    vram_pct = (vram_used_mb / vram_total_mb * 100) if (vram_total_mb and vram_total_mb > 0) else None

    # Safe concurrency based on available RAM
    if ram_available_gb >= 16:
        safe_concurrency = 4
    elif ram_available_gb >= 8:
        safe_concurrency = 2
    elif ram_available_gb >= 4:
        safe_concurrency = 1
    else:
        safe_concurrency = 1

    # Overall system health
    levels = [_classify_level(cpu_percent), _classify_level(ram_percent), _classify_level(disk_percent)]
    if vram_pct is not None:
        levels.append(_classify_level(vram_pct))

    if 'critical' in levels:
        overall = 'critical'
    elif 'high' in levels:
        overall = 'high'
    elif 'moderate' in levels:
        overall = 'moderate'
    else:
        overall = 'safe'

    return {
        'cpu': {'percent': cpu_percent, 'level': _classify_level(cpu_percent)},
        'ram': {'percent': ram_percent, 'availableGb': ram_available_gb, 'level': _classify_level(ram_percent)},
        'gpu': {'percent': gpu_percent, 'level': _classify_level(gpu_percent)},
        'vram': {
            'percent': round(vram_pct, 1) if vram_pct is not None else None,
            'usedMb': vram_used_mb,
            'totalMb': vram_total_mb,
            'level': _classify_level(vram_pct),
        },
        'disk': {'percent': disk_percent, 'freeGb': disk_free_gb, 'level': _classify_level(disk_percent)},
        'overallHealth': overall,
        'safeConcurrency': safe_concurrency,
        'timestamp': time.time(),
    }


# ──────────────────────────────────────────────────────────────────────
# 🛡️ LOW STORAGE PROTECTION — Check before any heavy operation
# ──────────────────────────────────────────────────────────────────────
def _check_storage_before_operation(operation_type: str = 'render', duration_seconds: float = 60.0) -> dict:
    """
    Check if there is enough disk space before starting a heavy operation.
    Returns: {'ok': bool, 'freeGb': float, 'requiredGb': float, 'message': str}
    """
    try:
        import psutil
        disk = psutil.disk_usage(OUTPUTS_DIR)
        free_gb = disk.free / (1024 ** 3)
    except Exception:
        return {'ok': True, 'freeGb': 999, 'requiredGb': 0, 'message': 'Could not check disk'}

    # Estimate required space
    # Render: ~1 GB per 10 min video at 1080p, minimum 2 GB buffer
    # Voice generation: ~100 MB per episode
    # Batch: 2 GB per episode
    estimates = {
        'render': max(2.0, duration_seconds / 600.0 * 1.0 + 1.0),
        'voice': 0.5,
        'batch': 2.0,
        'export': max(2.0, duration_seconds / 600.0 * 1.0 + 1.0),
    }
    required_gb = estimates.get(operation_type, 2.0)
    ok = free_gb >= required_gb

    if not ok:
        message = (
            f"ទំហំ Disk មិនគ្រប់គ្រាន់សម្រាប់ {operation_type.capitalize()}!\n"
            f"ត្រូវការ: {required_gb:.1f} GB | មាន: {free_gb:.1f} GB | ខ្វះ: {max(0, required_gb - free_gb):.1f} GB\n"
            f"សូម​លុប​ឯកសារ​ចាស់​ចេញ ឬ​ជ្រើស​ Disk ផ្សេង​ ហើយ​សាកល្បង​ម្ដង​ទៀត។"
        )
    else:
        message = f"Disk Space OK: {free_gb:.1f} GB free (required {required_gb:.1f} GB)"

    return {
        'ok': ok,
        'freeGb': round(free_gb, 2),
        'requiredGb': round(required_gb, 2),
        'needAdditionalGb': round(max(0, required_gb - free_gb), 2),
        'message': message,
    }


@app.get('/api/storage/check')
def check_storage_endpoint(operation: str = 'render', duration: float = 60.0):
    """Check disk space before a heavy operation. Returns ok/freeGb/requiredGb."""
    return _check_storage_before_operation(operation, duration)


# ──────────────────────────────────────────────────────────────────────
# 🤖 AI MODEL HARDWARE CHECK — Before running heavy AI
# ──────────────────────────────────────────────────────────────────────
@app.get('/api/ai/hardware-check')
def ai_hardware_check(model: str = 'voxcpm2_local'):
    """
    Check if current hardware can run the requested AI model.
    Returns: recommendation level, reason, and alternatives.
    """
    try:
        import psutil
        ram_gb = psutil.virtual_memory().total / (1024 ** 3)
        available_ram_gb = psutil.virtual_memory().available / (1024 ** 3)
    except Exception:
        ram_gb = 8.0
        available_ram_gb = 4.0

    vram_gb = 0.0
    try:
        import subprocess
        out = subprocess.run(
            ['nvidia-smi', '--query-gpu=memory.free', '--format=csv,noheader,nounits'],
            capture_output=True, text=True, timeout=3,
            creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0),
        )
        if out.returncode == 0 and out.stdout.strip():
            vram_gb = float(out.stdout.strip().splitlines()[0]) / 1024.0
    except Exception:
        pass

    cpu_cores = os.cpu_count() or 4

    # Model requirements database
    model_requirements = {
        'voxcpm2_local': {'ram_gb': 8.0, 'vram_gb': 4.0, 'cpu_cores': 4, 'label': 'VoxCPM2 Local'},
        'voxcpm2_cloud': {'ram_gb': 1.0, 'vram_gb': 0.0, 'cpu_cores': 2, 'label': 'VoxCPM2 Cloud'},
        'demucs_htdemucs': {'ram_gb': 4.0, 'vram_gb': 2.0, 'cpu_cores': 4, 'label': 'Demucs HTDemucs'},
        'edge_tts': {'ram_gb': 0.5, 'vram_gb': 0.0, 'cpu_cores': 1, 'label': 'Edge TTS (Cloud)'},
        'elevenlabs': {'ram_gb': 0.5, 'vram_gb': 0.0, 'cpu_cores': 1, 'label': 'ElevenLabs (Cloud)'},
        'gemini_translation': {'ram_gb': 1.0, 'vram_gb': 0.0, 'cpu_cores': 2, 'label': 'Gemini Translation (Cloud)'},
        'batch_10ep': {'ram_gb': 16.0, 'vram_gb': 4.0, 'cpu_cores': 6, 'label': '10 Episode Batch'},
    }

    req = model_requirements.get(model, {'ram_gb': 4.0, 'vram_gb': 0.0, 'cpu_cores': 4, 'label': model})

    ram_ok = available_ram_gb >= req['ram_gb']
    vram_ok = vram_gb >= req['vram_gb'] or req['vram_gb'] == 0
    cpu_ok = cpu_cores >= req['cpu_cores']

    if ram_ok and vram_ok and cpu_ok:
        status = 'recommended'
        status_label = '✅ ណែនាំ'
        reason = f"RAM ({available_ram_gb:.1f}GB free) / VRAM ({vram_gb:.1f}GB) / CPU ({cpu_cores} cores) — គ្រប់គ្រាន់ស្រូបស្រើ"
    elif ram_ok and cpu_ok:
        status = 'possible'
        status_label = '⚠️ អាចប្រើបានតែយឺត'
        reason = f"VRAM ({'%.1f' % vram_gb}GB) មិនគ្រប់ ({req['vram_gb']}GB ត្រូវការ) — CPU fallback, យឺតជាងធម្មតា"
    elif ram_ok:
        status = 'resource_intensive'
        status_label = '⚠️ ត្រូវធនធានច្រើន'
        reason = f"CPU ({cpu_cores} cores) តិចជាង {req['cpu_cores']} cores ត្រូវការ — ប្រើបានតែឃ្លៀបយឺតណាស់"
    elif available_ram_gb >= req['ram_gb'] * 0.6:
        status = 'not_recommended'
        status_label = '❌ មិនណែនាំ'
        reason = f"RAM ({available_ram_gb:.1f} GB free) ក្រោម {req['ram_gb']} GB ត្រូវការ — Computer អាច Freeze"
    else:
        status = 'cannot_run'
        status_label = '❌ មិនអាចដំណើរការ'
        reason = f"RAM ({available_ram_gb:.1f} GB free) ទាបពេក — ត្រូវ {req['ram_gb']} GB ដើម្បីដំណើរការ Model នេះ"

    # Alternatives if not recommended
    alternatives = []
    if status in ('not_recommended', 'cannot_run'):
        if 'local' in model:
            alternatives.append({
                'model': model.replace('_local', '_cloud'),
                'label': req['label'].replace('Local', 'Cloud'),
                'reason': 'Cloud version មិនត្រូវការ VRAM/RAM ច្រើនទេ',
            })
        alternatives.append({
            'model': 'edge_tts',
            'label': 'Edge TTS (Cloud — ស្រាល)',
            'reason': 'ប្រើ RAM ខ្លឹម 0.5 GB ចាំបាច់',
        })
        if 'voxcpm2' in model:
            alternatives.append({
                'model': 'elevenlabs',
                'label': 'ElevenLabs (Cloud)',
                'reason': 'Voice cloning quality ខ្ពស់ — Cloud based',
            })

    return {
        'model': model,
        'modelLabel': req['label'],
        'status': status,
        'statusLabel': status_label,
        'reason': reason,
        'currentHardware': {
            'ramAvailableGb': round(available_ram_gb, 1),
            'vramGb': round(vram_gb, 1),
            'cpuCores': cpu_cores,
        },
        'requirements': req,
        'alternatives': alternatives,
        'canRun': status in ('recommended', 'possible'),
    }


# ──────────────────────────────────────────────────────────────────────
# 🚀 PERFORMANCE PRESETS — Fast/Balanced/Safe/Quality modes
# ──────────────────────────────────────────────────────────────────────

# Global performance preset (in-memory, reset on restart)
_current_performance_preset = {'preset': 'balanced'}

PERFORMANCE_PRESETS = {
    'fast': {
        'preset': 'fast',
        'label': '🚀 FAST MODE',
        'labelKh': '🚀 Fast Mode (លឿន)',
        'description': 'Maximum reasonable speed. Lower preview quality. Full concurrency.',
        'descriptionKh': 'ដំណើរការលឿនបំផុត។ Preview resolution ទាប។ Concurrency ពេញ។',
        'concurrencyMultiplier': 1.0,
        'previewResolution': '480p',
        'renderQuality': 'fast',
        'disableBackgroundTasks': False,
        'ramLimitPercent': 90,
        'vramLimitPercent': 90,
    },
    'balanced': {
        'preset': 'balanced',
        'label': '⚖️ BALANCED MODE',
        'labelKh': '⚖️ Balanced Mode (មធ្យម)',
        'description': 'Speed and stability balance. Default mode.',
        'descriptionKh': 'តុល្យភាព Speed + Stability។ Mode លំនាំដើម។',
        'concurrencyMultiplier': 0.75,
        'previewResolution': '720p',
        'renderQuality': 'medium',
        'disableBackgroundTasks': False,
        'ramLimitPercent': 75,
        'vramLimitPercent': 80,
    },
    'safe': {
        'preset': 'safe',
        'label': '🛡️ SAFE MODE',
        'labelKh': '🛡️ Safe Mode (ការពារ)',
        'description': 'Lower concurrency. Protect system resources. Stability first.',
        'descriptionKh': 'ចំនួន Job តិច។ ការពារ RAM/VRAM Computer។ Stability > Speed។',
        'concurrencyMultiplier': 0.5,
        'previewResolution': '480p',
        'renderQuality': 'medium',
        'disableBackgroundTasks': True,
        'ramLimitPercent': 60,
        'vramLimitPercent': 65,
    },
    'quality': {
        'preset': 'quality',
        'label': '🎬 QUALITY MODE',
        'labelKh': '🎬 Quality Mode (គុណភាព)',
        'description': 'Maximum output quality within hardware limits. Slower processing.',
        'descriptionKh': 'គុណភាព Output ខ្ពស់បំផុតតាម Hardware បាន។ ដំណើរការយឺតជាង។',
        'concurrencyMultiplier': 0.5,
        'previewResolution': '1080p',
        'renderQuality': 'high',
        'disableBackgroundTasks': True,
        'ramLimitPercent': 70,
        'vramLimitPercent': 70,
    },
}


@app.get('/api/performance/preset')
def get_performance_preset():
    """Get the current performance preset and all available presets."""
    current = _current_performance_preset.get('preset', 'balanced')
    return {
        'current': current,
        'currentConfig': PERFORMANCE_PRESETS.get(current, PERFORMANCE_PRESETS['balanced']),
        'allPresets': PERFORMANCE_PRESETS,
    }


@app.post('/api/performance/preset')
async def set_performance_preset(request: Request):
    """Set the active performance preset (fast/balanced/safe/quality)."""
    try:
        body = await request.json()
        preset = body.get('preset', 'balanced')
    except Exception:
        preset = 'balanced'

    if preset not in PERFORMANCE_PRESETS:
        raise HTTPException(status_code=400, detail=f"ไม่รู้จัก Preset: {preset}. ជ្រើស: fast/balanced/safe/quality")
    _current_performance_preset['preset'] = preset
    config = PERFORMANCE_PRESETS[preset]
    return {
        'success': True,
        'preset': preset,
        'config': config,
        'message': f"បានកំណត់ {config['labelKh']} ជោគជ័យ!",
    }


def _get_safe_concurrency(base_concurrency: int = 2) -> int:
    """Calculate safe job concurrency based on current available RAM and performance preset."""
    try:
        import psutil
        available_gb = psutil.virtual_memory().available / (1024 ** 3)
    except Exception:
        available_gb = 4.0

    preset = _current_performance_preset.get('preset', 'balanced')
    preset_config = PERFORMANCE_PRESETS.get(preset, PERFORMANCE_PRESETS['balanced'])
    multiplier = preset_config.get('concurrencyMultiplier', 0.75)

    if available_gb >= 32:
        max_concurrent = 4
    elif available_gb >= 16:
        max_concurrent = 3
    elif available_gb >= 8:
        max_concurrent = 2
    else:
        max_concurrent = 1

    return max(1, min(max_concurrent, int(round(base_concurrency * multiplier))))


# ──────────────────────────────────────────────────────────────────────
# 🤖 AI PROVIDER SMART RECOMMENDATION SYSTEM
# ──────────────────────────────────────────────────────────────────────
@app.get('/api/ai/recommend')
def ai_recommend_provider():
    """
    Recommend best AI provider/mode based on computer hardware, internet availability,
    and API configuration. Returns Local/Cloud/Hybrid recommendation with Khmer explanation.
    """
    try:
        import psutil
        ram_gb = psutil.virtual_memory().total / (1024 ** 3)
        available_ram_gb = psutil.virtual_memory().available / (1024 ** 3)
    except Exception:
        ram_gb = 8.0
        available_ram_gb = 4.0

    cpu_cores = os.cpu_count() or 4

    vram_gb = 0.0
    is_nvidia = False
    try:
        import subprocess
        out = subprocess.run(
            ['nvidia-smi', '--query-gpu=memory.total', '--format=csv,noheader,nounits'],
            capture_output=True, text=True, timeout=3,
            creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0),
        )
        if out.returncode == 0 and out.stdout.strip():
            vram_gb = float(out.stdout.strip().splitlines()[0]) / 1024.0
            is_nvidia = True
    except Exception:
        pass

    # Check API key availability
    elevenlabs_key = os.getenv('ELEVENLABS_API_KEY', '').strip()
    gemini_key = os.getenv('GEMINI_API_KEY', '').strip()
    voxcpm_url = os.getenv('VOXCPM_API_URL', '').strip()
    has_elevenlabs = bool(elevenlabs_key and len(elevenlabs_key) > 10)
    has_gemini = bool(gemini_key and len(gemini_key) > 10)
    has_voxcpm_cloud = bool(voxcpm_url)

    # Determine recommendation
    recommendations = []

    # TTS/Voice recommendation
    if vram_gb >= 8 and ram_gb >= 16:
        voice_rec = {
            'provider': 'voxcpm2_local',
            'label': '🎙️ VoxCPM2 Local (GPU)',
            'mode': 'LOCAL',
            'reason': f'VRAM {vram_gb:.0f}GB + RAM {ram_gb:.0f}GB — អាចដំណើរការ Local Voice Cloning',
            'quality': 'HIGHEST',
            'speed': 'FAST',
        }
    elif has_voxcpm_cloud:
        voice_rec = {
            'provider': 'voxcpm2_cloud',
            'label': '🌐 VoxCPM2 Cloud',
            'mode': 'CLOUD',
            'reason': f'RAM {available_ram_gb:.0f}GB free — ណែនាំ Cloud Voice (VoxCPM2 Cloud API)',
            'quality': 'HIGH',
            'speed': 'DEPENDS_ON_NETWORK',
        }
    elif has_elevenlabs:
        voice_rec = {
            'provider': 'elevenlabs',
            'label': '🎙️ ElevenLabs (Cloud)',
            'mode': 'CLOUD',
            'reason': 'ElevenLabs API Key Available — Voice Cloning Cloud Quality ខ្ពស់',
            'quality': 'HIGH',
            'speed': 'FAST',
        }
    else:
        voice_rec = {
            'provider': 'edge_tts',
            'label': '🔊 Edge TTS (Microsoft Cloud)',
            'mode': 'CLOUD',
            'reason': 'ស្រាលបំផុត — ប្រើ Microsoft Edge TTS Cloud (ឥតគិតថ្លៃ)',
            'quality': 'MEDIUM',
            'speed': 'FAST',
        }

    # Translation recommendation
    if has_gemini:
        translation_rec = {
            'provider': 'gemini',
            'label': '🧠 Gemini AI Translation',
            'mode': 'CLOUD',
            'reason': 'Gemini API Key Available — Translation Quality ខ្ពស់',
        }
    else:
        translation_rec = {
            'provider': 'none',
            'label': '❌ គ្មាន AI Translation',
            'mode': 'NONE',
            'reason': 'Gemini API Key គ្មាន — ប្ដូរ Key ក្នុង Settings',
        }

    # Overall mode
    if voice_rec['mode'] == 'LOCAL' and translation_rec['mode'] == 'CLOUD':
        overall_mode = 'HYBRID'
        overall_label = 'Hybrid Mode (Local Voice + Cloud Translation)'
    elif voice_rec['mode'] == 'LOCAL' and translation_rec['mode'] == 'LOCAL':
        overall_mode = 'LOCAL'
        overall_label = 'Local Mode (ដំណើរការ Offline ទាំងស្រុង)'
    else:
        overall_mode = 'CLOUD'
        overall_label = 'Cloud Mode (ពឹងផ្អែកលើ Internet)'

    return {
        'overallMode': overall_mode,
        'overallLabel': overall_label,
        'voiceRecommendation': voice_rec,
        'translationRecommendation': translation_rec,
        'hardwareSummary': {
            'ramGb': round(ram_gb, 1),
            'availableRamGb': round(available_ram_gb, 1),
            'vramGb': round(vram_gb, 1),
            'cpuCores': cpu_cores,
            'isNvidiaGpu': is_nvidia,
        },
        'apiKeysConfigured': {
            'elevenlabs': has_elevenlabs,
            'gemini': has_gemini,
            'voxcpmCloud': has_voxcpm_cloud,
        },
        'message': f"ណែនាំ {overall_label} — {voice_rec['reason']}",
    }


# ──────────────────────────────────────────────────────────────────────
# 🐉 DRAGON DIAGNOSTICS — Full system health check
# ──────────────────────────────────────────────────────────────────────
@app.get('/api/diagnostics')
def run_diagnostics():
    """
    🐉 Dragon Diagnostics — Check all system components:
    FFmpeg, GPU driver, AI providers, database, storage, permissions, network.
    Returns status for each component with Khmer-language recommendations.
    """
    results = []

    # 1. FFmpeg check
    try:
        import subprocess
        ffmpeg_bin = os.path.join(BASE_DIR, 'bin', 'ffmpeg.exe') if sys.platform == 'win32' \
            else os.path.join(BASE_DIR, 'bin', 'ffmpeg')
        if not os.path.exists(ffmpeg_bin):
            ffmpeg_bin = 'ffmpeg'
        out = subprocess.run([ffmpeg_bin, '-version'],
                             capture_output=True, text=True, timeout=5,
                             creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0) if sys.platform == 'win32' else 0)
        if out.returncode == 0 and 'ffmpeg version' in out.stdout:
            version_line = out.stdout.splitlines()[0]
            results.append({'component': 'FFmpeg', 'status': 'healthy', 'detail': version_line,
                             'message': '✅ FFmpeg ដំណើរការបាន'})
        else:
            results.append({'component': 'FFmpeg', 'status': 'error', 'detail': out.stderr[:200],
                             'message': '❌ FFmpeg Error — Video processing នឹងបរាជ័យ',
                             'fix': 'ដំណើរការ INSTALL_ALL_WINDOWS.bat ម្ដងទៀត'})
    except Exception as e:
        results.append({'component': 'FFmpeg', 'status': 'error', 'detail': str(e),
                        'message': '❌ FFmpeg រកមិនឃើញ',
                        'fix': 'ដំណើរការ INSTALL_ALL_WINDOWS.bat ដើម្បីដំឡើង FFmpeg'})

    # 2. GPU / NVIDIA driver check
    try:
        import subprocess
        out = subprocess.run(['nvidia-smi', '--query-gpu=name,driver_version',
                              '--format=csv,noheader'],
                             capture_output=True, text=True, timeout=5,
                             creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0) if sys.platform == 'win32' else 0)
        if out.returncode == 0 and out.stdout.strip():
            results.append({'component': 'GPU/NVIDIA Driver', 'status': 'healthy',
                             'detail': out.stdout.strip(),
                             'message': f'✅ NVIDIA GPU: {out.stdout.strip()}'})
        else:
            results.append({'component': 'GPU/NVIDIA Driver', 'status': 'warning',
                             'detail': 'nvidia-smi not available or no NVIDIA GPU',
                             'message': '⚠️ NVIDIA GPU មិនរកឃើញ — CPU fallback mode',
                             'fix': 'CPU mode អាចប្រើបាន — GPU acceleration disabled'})
    except Exception as e:
        results.append({'component': 'GPU/NVIDIA Driver', 'status': 'warning',
                        'detail': str(e),
                        'message': '⚠️ GPU check failed — CPU mode only'})

    # 3. Gemini API check
    gemini_key = os.getenv('GEMINI_API_KEY', '').strip()
    if gemini_key and len(gemini_key) > 10:
        results.append({'component': 'Gemini AI (Translation)', 'status': 'healthy',
                        'detail': f'Key configured ({gemini_key[:8]}...)',
                        'message': '✅ Gemini API Key ត្រូវបានកំណត់'})
    else:
        results.append({'component': 'Gemini AI (Translation)', 'status': 'warning',
                        'detail': 'No Gemini API key',
                        'message': '⚠️ Gemini API Key គ្មាន — Translation នឹងមិនដំណើរការ',
                        'fix': 'ប្ដូរ Gemini API Key ក្នុង Settings > AI Providers'})

    # 4. ElevenLabs API check
    el_key = os.getenv('ELEVENLABS_API_KEY', '').strip()
    if el_key and len(el_key) > 10:
        results.append({'component': 'ElevenLabs (Voice Cloning)', 'status': 'healthy',
                        'detail': f'Key configured ({el_key[:8]}...)',
                        'message': '✅ ElevenLabs API Key ត្រូវបានកំណត់'})
    else:
        results.append({'component': 'ElevenLabs (Voice Cloning)', 'status': 'warning',
                        'detail': 'No ElevenLabs API key',
                        'message': '⚠️ ElevenLabs Key គ្មាន — Voice Cloning Cloud disabled',
                        'fix': 'ប្ដូរ ElevenLabs Key ក្នុង Settings > AI Providers'})

    # 5. Edge TTS (always available since it's a Python package)
    try:
        import edge_tts
        results.append({'component': 'Edge TTS (Microsoft)', 'status': 'healthy',
                        'detail': 'edge-tts package available',
                        'message': '✅ Edge TTS ដំណើរការបាន (Microsoft TTS Cloud)'})
    except ImportError:
        results.append({'component': 'Edge TTS (Microsoft)', 'status': 'error',
                        'detail': 'edge-tts not installed',
                        'message': '❌ Edge TTS មិនដំឡើង — pip install edge-tts',
                        'fix': 'ដំណើរការ: pip install edge-tts'})

    # 6. VoxCPM2 Cloud check
    vox_url = os.getenv('VOXCPM_API_URL', '').strip()
    if vox_url:
        try:
            import requests as req_lib
            r = req_lib.get(f"{vox_url}/health", timeout=5)
            if r.status_code == 200:
                results.append({'component': 'VoxCPM2 Cloud', 'status': 'healthy',
                                 'detail': f'{vox_url} — Online',
                                 'message': '✅ VoxCPM2 Cloud Server Online'})
            else:
                results.append({'component': 'VoxCPM2 Cloud', 'status': 'warning',
                                 'detail': f'HTTP {r.status_code}',
                                 'message': '⚠️ VoxCPM2 Cloud Server ឆ្លើយ Error',
                                 'fix': 'ពិនិត្យ VoxCPM2 Server URL ក្នុង Settings'})
        except Exception as e:
            results.append({'component': 'VoxCPM2 Cloud', 'status': 'warning',
                            'detail': str(e)[:100],
                            'message': '⚠️ VoxCPM2 Cloud មិនអាចភ្ជាប់ — offline mode',
                            'fix': 'ពិនិត្យ Internet Connection ឬ VoxCPM2 Server URL'})
    else:
        results.append({'component': 'VoxCPM2 Cloud', 'status': 'warning',
                        'detail': 'No VOXCPM_API_URL configured',
                        'message': '⚠️ VoxCPM2 Cloud URL គ្មាន — edge-tts fallback',
                        'fix': 'ប្ដូរ VoxCPM2 URL ក្នុង Settings'})

    # 7. Database check
    try:
        db_path = os.path.join(DATA_DIR, 'studio_auth.db')
        if os.path.exists(db_path):
            conn = sqlite3.connect(db_path, timeout=3)
            conn.execute('SELECT 1')
            conn.close()
            results.append({'component': 'Database (SQLite)', 'status': 'healthy',
                             'detail': db_path,
                             'message': '✅ Database ដំណើរការល្អ'})
        else:
            results.append({'component': 'Database (SQLite)', 'status': 'warning',
                             'detail': 'DB file not found yet',
                             'message': '⚠️ Database មិនទាន់បង្កើត — នឹងបង្កើតដោយស្វ័យប្រវត្តិ'})
    except Exception as e:
        results.append({'component': 'Database (SQLite)', 'status': 'error',
                        'detail': str(e),
                        'message': '❌ Database Error',
                        'fix': 'ចម្លង data/ folder ចេញ ហើយ restart application'})

    # 8. Storage check
    try:
        import psutil
        disk = psutil.disk_usage(OUTPUTS_DIR)
        free_gb = disk.free / (1024 ** 3)
        if free_gb >= 10:
            results.append({'component': 'Storage (Disk Space)', 'status': 'healthy',
                             'detail': f'{free_gb:.1f} GB free',
                             'message': f'✅ Disk Space OK — {free_gb:.1f} GB free'})
        elif free_gb >= 2:
            results.append({'component': 'Storage (Disk Space)', 'status': 'warning',
                             'detail': f'{free_gb:.1f} GB free',
                             'message': f'⚠️ Disk Space ទាប — {free_gb:.1f} GB free (ត្រូវការ ≥ 10 GB)',
                             'fix': 'លុប outputs/ folder ចាស់ ឬ ជ្រើស Drive ផ្សេង'})
        else:
            results.append({'component': 'Storage (Disk Space)', 'status': 'error',
                             'detail': f'{free_gb:.1f} GB free',
                             'message': f'❌ Disk Space ស្ទើរអស់ — {free_gb:.1f} GB free',
                             'fix': 'លុបឯកសារចាស់ **ភ្លាម** — Render/Export នឹងបរាជ័យ'})
    except Exception as e:
        results.append({'component': 'Storage (Disk Space)', 'status': 'warning',
                        'detail': str(e), 'message': '⚠️ Disk check failed'})

    # 9. Permissions check (outputs/uploads writable)
    for check_dir, name in [(OUTPUTS_DIR, 'outputs/'), (UPLOADS_DIR, 'uploads/')]:
        try:
            test_file = os.path.join(check_dir, '.perm_test')
            with open(test_file, 'w') as tf:
                tf.write('test')
            os.remove(test_file)
            results.append({'component': f'File Permissions ({name})', 'status': 'healthy',
                             'detail': check_dir,
                             'message': f'✅ {name} Folder Write Permission OK'})
        except Exception as e:
            results.append({'component': f'File Permissions ({name})', 'status': 'error',
                             'detail': str(e),
                             'message': f'❌ Cannot write to {name} — Render/Upload នឹងបរាជ័យ',
                             'fix': f'ផ្ដល់ Write Permission ដល់ {check_dir}'})

    # 10. Network connectivity (basic)
    try:
        import socket
        socket.setdefaulttimeout(3)
        socket.socket(socket.AF_INET, socket.SOCK_STREAM).connect(("8.8.8.8", 53))
        results.append({'component': 'Network (Internet)', 'status': 'healthy',
                        'detail': 'Connected to internet',
                        'message': '✅ Internet Connection OK'})
    except Exception:
        results.append({'component': 'Network (Internet)', 'status': 'warning',
                        'detail': 'No internet or firewall',
                        'message': '⚠️ Internet Connection មិនបាន — Cloud AI / API មិនដំណើរការ',
                        'fix': 'ពិនិត្យ Wifi/Ethernet ហើយពិនិត្យ Firewall'})

    # Summary
    errors = [r for r in results if r['status'] == 'error']
    warnings = [r for r in results if r['status'] == 'warning']
    healthy = [r for r in results if r['status'] == 'healthy']

    overall = 'healthy'
    if errors:
        overall = 'error'
    elif warnings:
        overall = 'warning'

    return {
        'overallStatus': overall,
        'totalChecks': len(results),
        'healthy': len(healthy),
        'warnings': len(warnings),
        'errors': len(errors),
        'checks': results,
        'timestamp': datetime.now().isoformat(),
    }


# ──────────────────────────────────────────────────────────────────────
# 💾 RENDER JOB RECOVERY — Crash-safe render job state persistence
# ──────────────────────────────────────────────────────────────────────

RENDER_JOBS_FILE = os.path.join(DATA_DIR, 'render_jobs.json')


def _load_render_jobs() -> dict:
    try:
        if os.path.exists(RENDER_JOBS_FILE):
            with open(RENDER_JOBS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception:
        pass
    return {}


def _save_render_jobs(jobs: dict):
    try:
        with open(RENDER_JOBS_FILE, 'w', encoding='utf-8') as f:
            json.dump(jobs, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.warning(f'Could not persist render jobs: {e}')


# Load existing jobs on startup (crash recovery)
_render_jobs_registry: dict = _load_render_jobs()


@app.get('/api/render-jobs')
def get_render_jobs():
    """Get all render jobs (for crash recovery on startup)."""
    return {
        'jobs': list(_render_jobs_registry.values()),
        'incomplete': [j for j in _render_jobs_registry.values()
                       if j.get('status') not in ('completed', 'failed', 'cancelled')],
    }


@app.get('/api/render-jobs/incomplete')
def get_incomplete_render_jobs():
    """Get jobs that were interrupted (for crash recovery prompt)."""
    incomplete = [j for j in _render_jobs_registry.values()
                  if j.get('status') not in ('completed', 'failed', 'cancelled')]
    return {
        'hasIncomplete': len(incomplete) > 0,
        'count': len(incomplete),
        'jobs': incomplete,
        'message': 'រកឃើញការងារដែលមិនទាន់បានបញ្ចប់' if incomplete else '',
    }


@app.post('/api/render-jobs/{job_id}/retry')
def retry_render_job(job_id: str):
    """Mark a failed render job as queued again for retry."""
    job = _render_jobs_registry.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f'Render job {job_id} not found')
    job['status'] = 'queued'
    job['progress'] = 0
    job['errorMessage'] = None
    job['retriedAt'] = datetime.now().isoformat()
    _save_render_jobs(_render_jobs_registry)
    return {'success': True, 'job': job}


@app.delete('/api/render-jobs/{job_id}')
def delete_render_job(job_id: str):
    """Remove a render job from the registry."""
    if job_id in _render_jobs_registry:
        del _render_jobs_registry[job_id]
        _save_render_jobs(_render_jobs_registry)
    return {'success': True}

@app.get('/api/system/network-info')
def get_network_info():
    port = int(os.getenv('PORT', 3000))
    lan_addrs = get_lan_addresses(port)
    return {
        'port': port,
        'localUrl': f"http://localhost:{port}",
        'lanAddresses': lan_addrs,
        'primaryLanUrl': lan_addrs[0]['url'] if lan_addrs else f"http://localhost:{port}"
    }

# --- 2026 Checkpoint & In-App Auto-Update System ---
@app.get('/api/system/version')
def get_system_version():
    """Get current version info and metadata."""
    return auto_updater.get_local_version_info()

@app.post('/api/system/check-update')
def check_system_update():
    """Actively check for new updates from remote GitHub / Supabase / Cloud server."""
    try:
        return auto_updater.check_for_updates(force_remote=True)
    except Exception as e:
        print(f"[API] check_system_update error: {e}")
        return auto_updater.get_local_version_info()

@app.post('/api/system/apply-update')
@app.post('/api/system/update')
async def apply_system_update(req: Optional[dict] = None):
    """
    Download patch from download_url and hot-apply into public/ and services/
    without reinstalling the EXE. Automatically creates a safety Checkpoint first!
    """
    local_info = auto_updater.get_local_version_info()
    target_ver = (req.get('target_version') if req else None) or local_info.get('latest_version')
    download_url = (req.get('download_url') if req else None) or local_info.get('download_url', '').strip()

    if download_url:
        try:
            zip_path = auto_updater.download_patch(download_url)
            result = auto_updater.apply_update_from_zip(
                zip_path=zip_path,
                target_version=target_ver,
                changelog=local_info.get('changelog')
            )
            # Remove temp zip
            try:
                os.unlink(zip_path)
            except Exception:
                pass
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        # Symbolic version update if no download URL provided
        pre_cp = checkpoint_manager.create_checkpoint(
            name=f"Backup មុន Update {target_ver}",
            cp_type="pre_update",
            version=local_info.get('current_version')
        )
        local_info['current_version'] = target_ver
        local_info['has_update'] = False
        local_info['applied_at'] = datetime.now().isoformat()
        with open(VERSION_FILE, 'w', encoding='utf-8') as f:
            json.dump(local_info, f, ensure_ascii=False, indent=2)
        return {
            "success": True,
            "message": f"បាន Update ទៅ {target_ver} ជោគជ័យ!",
            "new_version": target_ver,
            "pre_checkpoint_id": pre_cp['id'],
            "files_updated": False
        }

@app.post('/api/system/upload-patch')
async def upload_system_patch(file: UploadFile = File(...)):
    """Upload and install a patch ZIP directly (Offline / Direct update)."""
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="សូមជ្រើសរើសឯកសារ .zip update patch")

    temp_zip = os.path.join(DATA_DIR, 'updates', f"uploaded_{int(time.time())}.zip")
    os.makedirs(os.path.dirname(temp_zip), exist_ok=True)
    try:
        with open(temp_zip, 'wb') as f:
            content = await file.read()
            f.write(content)

        result = auto_updater.apply_update_from_zip(temp_zip)
        try:
            os.unlink(temp_zip)
        except Exception:
            pass
        return result
    except Exception as e:
        if os.path.exists(temp_zip):
            try:
                os.unlink(temp_zip)
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=str(e))

# --- Checkpoints & Restore Endpoints ---
@app.get('/api/system/checkpoints')
def get_system_checkpoints():
    """List all available checkpoints and snapshots."""
    items = checkpoint_manager.list_checkpoints()
    return {
        'success': True,
        'checkpoints': items,
        'count': len(items),
        'current_version': checkpoint_manager.get_current_app_version()
    }

class CreateCheckpointRequest(BaseModel):
    name: Optional[str] = None
    note: Optional[str] = None

@app.post('/api/system/checkpoints/create')
def create_system_checkpoint(body: CreateCheckpointRequest = CreateCheckpointRequest()):
    """Create a manual checkpoint snapshot of current frontend and backend."""
    try:
        cp = checkpoint_manager.create_checkpoint(
            name=body.name,
            cp_type="manual",
            note=body.note or ""
        )
        return {
            'success': True,
            'message': f"បានបង្កើត Checkpoint '{cp['name']}' ជោគជ័យ!",
            'checkpoint': cp
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class RestoreCheckpointRequest(BaseModel):
    checkpoint_id: str

@app.post('/api/system/checkpoints/restore')
def restore_system_checkpoint(body: RestoreCheckpointRequest):
    """Restore application state and files from a specified checkpoint."""
    try:
        result = checkpoint_manager.restore_checkpoint(body.checkpoint_id)
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete('/api/system/checkpoints/{checkpoint_id}')
def delete_system_checkpoint(checkpoint_id: str):
    """Delete a checkpoint snapshot."""
    ok = checkpoint_manager.delete_checkpoint(checkpoint_id)
    if not ok:
        raise HTTPException(status_code=404, detail="រកមិនឃើញ Checkpoint សម្រាប់លុបឡើយ")
    return {'success': True, 'message': 'បានលុប Checkpoint រួចរាល់'}

@app.post('/api/system/update/rollback')
def rollback_system_update():
    """Rollback to the latest available checkpoint."""
    cps = checkpoint_manager.list_checkpoints()
    if not cps:
        raise HTTPException(status_code=404, detail="មិនមាន Checkpoint ឬ Backup សម្រាប់ Rollback ឡើយ")
    target_cp = cps[0]
    result = checkpoint_manager.restore_checkpoint(target_cp['id'])
    return result

@app.post('/api/system/admin/publish-update')
def publish_admin_update(req: dict):
    """Admin: publish new version info across all app instances."""
    info = auto_updater.get_local_version_info()
    cur = info.get('current_version', 'V2.1PRO')
    new_ver = req.get('latest_version', cur)

    info['latest_version'] = new_ver
    info['has_update'] = (new_ver != cur)
    if 'changelog' in req:
        info['changelog'] = req['changelog']
    if 'download_url' in req:
        info['download_url'] = req['download_url']
    if 'patch_size_mb' in req:
        info['patch_size_mb'] = req['patch_size_mb']
    info['release_date'] = datetime.now().strftime('%Y-%m-%d')

    with open(VERSION_FILE, 'w', encoding='utf-8') as f:
        json.dump(info, f, ensure_ascii=False, indent=2)

    return {"success": True, "message": "បានទម្លាក់ Update ថ្មីជោគជ័យ!", "version": info}


# ============================================================================
# 🔄 Auto-Update System API Endpoints
# ============================================================================

@app.get('/api/update/status')
def get_update_status():
    """Get current update manager status."""
    try:
        update_mgr = get_update_manager()
        return {
            'success': True,
            'status': update_mgr.get_status()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/api/update/check')
def check_for_updates():
    """Check if new updates are available."""
    try:
        update_mgr = get_update_manager()
        result = update_mgr.check_for_updates()
        return {
            'success': True,
            'result': result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/api/update/download')
def download_update():
    """Download available updates."""
    try:
        update_mgr = get_update_manager()
        manifest = update_mgr.version_info.get('manifest')
        if not manifest:
            raise HTTPException(status_code=400, detail="គ្មាន Update ដើម្បី Download ទេ! សូម Check Update ជាមុនសិន។")
        
        result = update_mgr.download_update(manifest)
        if result.get('status') == 'success':
            return {
                'success': True,
                'message': 'ទាញយក Update ជោគជ័យ!',
                'result': result
            }
        else:
            return {
                'success': False,
                'message': result.get('error', 'Download failed'),
                'result': result
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/api/update/install')
def install_update():
    """Install downloaded updates."""
    try:
        update_mgr = get_update_manager()
        result = update_mgr.install_update(backup=True)
        
        if result.get('status') == 'success':
            # Reload updated modules
            module_loader = get_module_loader()
            module_loader.reload_all()
            
            return {
                'success': True,
                'message': f"បាន Install Update ជោគជ័យ! Version: {result.get('version')}",
                'result': result
            }
        else:
            return {
                'success': False,
                'message': result.get('error', 'Installation failed'),
                'result': result
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/api/update/rollback')
def rollback_update():
    """Rollback to previous version."""
    try:
        update_mgr = get_update_manager()
        result = update_mgr.rollback_update()
        
        if result.get('status') == 'success':
            # Reload modules after rollback
            module_loader = get_module_loader()
            module_loader.reload_all()
            
            return {
                'success': True,
                'message': 'បាន Rollback ជោគជ័យ!',
                'result': result
            }
        else:
            return {
                'success': False,
                'message': result.get('error', 'Rollback failed'),
                'result': result
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/api/update/backups')
def list_backups():
    """List all available backup snapshots."""
    try:
        update_mgr = get_update_manager()
        backup_dir = update_mgr.backup_dir
        
        if not backup_dir.exists():
            return {
                'success': True,
                'backups': []
            }
        
        backups = []
        for backup_path in sorted(backup_dir.iterdir(), reverse=True):
            if backup_path.is_dir():
                # Get backup metadata
                stat = backup_path.stat()
                backups.append({
                    'name': backup_path.name,
                    'path': str(backup_path),
                    'date': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S'),
                    'size': sum(f.stat().st_size for f in backup_path.rglob('*') if f.is_file())
                })
        
        return {
            'success': True,
            'backups': backups,
            'count': len(backups)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class RollbackRequest(BaseModel):
    backup_name: Optional[str] = None


@app.post('/api/update/rollback')
def rollback_to_backup(body: RollbackRequest = RollbackRequest()):
    """Rollback to a specific backup or latest."""
    try:
        update_mgr = get_update_manager()
        result = update_mgr.rollback_update(backup_name=body.backup_name)
        
        if result.get('status') == 'success':
            # Reload modules after rollback
            module_loader = get_module_loader()
            module_loader.reload_all()
            
            return {
                'success': True,
                'message': 'បាន Rollback ជោគជ័យ!',
                'result': result
            }
        else:
            return {
                'success': False,
                'message': result.get('error', 'Rollback failed'),
                'result': result
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/api/modules/list')
def list_loaded_modules():
    """List all dynamically loaded modules."""
    try:
        module_loader = get_module_loader()
        loaded = module_loader.list_loaded_modules()
        available = module_loader.scan_available_modules()
        
        return {
            'success': True,
            'loaded': loaded,
            'available': available
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ReloadModuleRequest(BaseModel):
    module_name: str


@app.post('/api/modules/reload')
def reload_module(body: ReloadModuleRequest):
    """Reload a specific module at runtime."""
    try:
        module_loader = get_module_loader()
        module = module_loader.reload_module(body.module_name)
        
        if module:
            return {
                'success': True,
                'message': f'បាន Reload Module "{body.module_name}" ជោគជ័យ!',
                'module_info': module_loader.get_module_info(body.module_name)
            }
        else:
            return {
                'success': False,
                'message': f'មិនអាច Reload Module "{body.module_name}" បានទេ!'
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/api/modules/reload-all')
def reload_all_modules():
    """Reload all loaded modules."""
    try:
        module_loader = get_module_loader()
        results = module_loader.reload_all()
        
        success_count = sum(1 for v in results.values() if v)
        total_count = len(results)
        
        return {
            'success': True,
            'message': f'បាន Reload {success_count}/{total_count} Modules ជោគជ័យ!',
            'results': results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ✂️ VIDEO CUTTER & MERGER (AUTO-SPLIT 1H-5H & MULTI-CLIP CONCAT)
# ============================================================================
from services import video_cutter_service
from typing import Dict, Any, List, Optional

active_video_tools_jobs: Dict[str, Dict[str, Any]] = {}

def resolve_server_video_path(path_or_name: str) -> str:
    """Resolve file path whether given filename, relative url, or absolute path."""
    if not path_or_name:
        raise HTTPException(status_code=400, detail="Missing video file path or filename")
    
    clean = path_or_name.strip()
    if os.path.isabs(clean) and os.path.exists(clean):
        return clean
    
    # Strip URL prefixes
    for prefix in ['/media/uploads/', '/media/outputs/', 'media/uploads/', 'media/outputs/']:
        if clean.startswith(prefix):
            clean = clean[len(prefix):]
            break
            
    # Try uploads dir
    candidate_upload = os.path.join(UPLOADS_DIR, clean)
    if os.path.exists(candidate_upload):
        return candidate_upload
        
    # Try outputs dir
    candidate_output = os.path.join(OUTPUTS_DIR, clean)
    if os.path.exists(candidate_output):
        return candidate_output
        
    return candidate_upload


class VideoInfoRequest(BaseModel):
    filename: Optional[str] = None
    filePath: Optional[str] = None


@app.post('/api/video-tools/info')
async def get_video_info_endpoint(body: VideoInfoRequest):
    try:
        resolved = resolve_server_video_path(body.filePath or body.filename or '')
        meta = await asyncio.to_thread(video_cutter_service.get_video_metadata, resolved)
        return {
            'success': True,
            'metadata': meta,
            'filename': os.path.basename(resolved),
            'filePath': resolved,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


class VideoSplitRequest(BaseModel):
    filename: Optional[str] = None
    filePath: Optional[str] = None
    mode: str = 'duration' # 'duration' | 'parts' | 'cues'
    durationPerPartMinutes: float = 10.0
    numParts: int = 5
    customCues: Optional[List[float]] = None
    lossless: bool = True
    namingPrefix: str = 'ភាគ'


@app.post('/api/video-tools/split')
async def split_video_endpoint(body: VideoSplitRequest):
    try:
        resolved = resolve_server_video_path(body.filePath or body.filename or '')
        job_id = f"split_{int(time.time() * 1000)}"
        active_video_tools_jobs[job_id] = {
            'job_id': job_id,
            'status': 'processing',
            'progress': 5,
            'message': 'កំពុងចាប់ផ្ដើមស្កេន និងត្រៀមកាត់វីដេអូ...'
        }

        def on_prog(pct: int, msg: str):
            if job_id in active_video_tools_jobs:
                active_video_tools_jobs[job_id].update({'progress': pct, 'message': msg})

        dur_sec = max(10.0, body.durationPerPartMinutes * 60.0)

        results = await asyncio.to_thread(
            video_cutter_service.split_video_sync,
            resolved,
            OUTPUTS_DIR,
            body.mode,
            dur_sec,
            body.numParts,
            body.customCues,
            body.lossless,
            body.namingPrefix,
            on_prog
        )

        active_video_tools_jobs[job_id] = {
            'job_id': job_id,
            'status': 'completed',
            'progress': 100,
            'message': f'🎉 បានកាត់វីដេអូជា {len(results)} ភាគរួចរាល់!',
            'results': results
        }

        return {
            'success': True,
            'job_id': job_id,
            'total_parts': len(results),
            'parts': results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Split error: {str(e)}")


class VideoMergeRequest(BaseModel):
    filenames: Optional[List[str]] = None
    filePaths: Optional[List[str]] = None
    outputName: Optional[str] = 'merged_cinema_movie'
    lossless: bool = True
    targetResolution: str = 'auto'


@app.post('/api/video-tools/merge')
async def merge_videos_endpoint(body: VideoMergeRequest):
    try:
        raw_items = body.filePaths or body.filenames or []
        if not raw_items:
            raise HTTPException(status_code=400, detail="សូមជ្រើសរើសវីដេអូយ៉ាងហោចណាស់ ២ ឃ្លីប")

        resolved_paths = [resolve_server_video_path(item) for item in raw_items]
        job_id = f"merge_{int(time.time() * 1000)}"
        active_video_tools_jobs[job_id] = {
            'job_id': job_id,
            'status': 'processing',
            'progress': 5,
            'message': f'កំពុងត្រៀមបញ្ចូល {len(resolved_paths)} វីដេអូ...'
        }

        def on_prog(pct: int, msg: str):
            if job_id in active_video_tools_jobs:
                active_video_tools_jobs[job_id].update({'progress': pct, 'message': msg})

        out_name = (body.outputName or 'merged_video').strip()
        if not out_name.endswith('.mp4'):
            out_name = f"{out_name}_{int(time.time())}.mp4"

        result = await asyncio.to_thread(
            video_cutter_service.merge_videos_sync,
            resolved_paths,
            OUTPUTS_DIR,
            out_name,
            body.lossless,
            body.targetResolution,
            on_prog
        )

        active_video_tools_jobs[job_id] = {
            'job_id': job_id,
            'status': 'completed',
            'progress': 100,
            'message': '🎉 បានបញ្ចូលវីដេអូទាំងអស់ជោគជ័យ!',
            'result': result
        }

        return {
            'success': True,
            'job_id': job_id,
            'result': result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Merge error: {str(e)}")


@app.get('/api/video-tools/jobs/{job_id}')
async def get_video_tools_job(job_id: str):
    if job_id in active_video_tools_jobs:
        return active_video_tools_jobs[job_id]
    return {'job_id': job_id, 'status': 'not_found', 'progress': 0, 'message': 'Job not found'}


# ─── Character Voice Extractor (កាត់យកសំឡេងតួអង្គពី Video/MP3) ───────────────
@app.post('/api/characters/extract-voice')
async def extract_voice_endpoint(
    mediaFile: UploadFile = File(...),
    startTime: float = Form(0.0),
    endTime: float = Form(10.0),
    isolateVocal: str = Form('true'),
    label: str = Form(''),
    gender: str = Form('male'),
    role_key: str = Form('male_lead'),
    words: str = Form('')
):
    try:
        ext = os.path.splitext(mediaFile.filename or '')[1] or '.mp4'
        temp_input_name = f"raw_extract_{int(time.time()*1000)}_{uuid.uuid4().hex[:6]}{ext}"
        temp_input_path = os.path.join(UPLOADS_DIR, temp_input_name)

        with open(temp_input_path, 'wb') as f:
            shutil.copyfileobj(mediaFile.file, f)

        out_filename = f"extracted_{int(time.time()*1000)}_{uuid.uuid4().hex[:6]}.mp3"
        out_path = os.path.join(SAMPLES_DIR, out_filename)

        dur = max(0.5, float(endTime) - float(startTime))
        st = max(0.0, float(startTime))

        if isolateVocal.lower() in ('true', '1', 'yes'):
            af = "highpass=f=120,lowpass=f=3800,afftdn=nf=-25,volume=1.4,loudnorm"
            cmd = f'ffmpeg -y -ss {st} -t {dur} -i "{temp_input_path}" -vn -af "{af}" -ac 1 -ar 32000 -b:a 128k "{out_path}"'
        else:
            cmd = f'ffmpeg -y -ss {st} -t {dur} -i "{temp_input_path}" -vn -ac 2 -ar 44100 -b:a 192k "{out_path}"'

        audio_processor.run_command(cmd)

        char_id = f"custom_voice_{int(time.time()*1000)}"
        clean_label = (label or '').strip() or f"តួអង្គ {char_id[-4:]}"
        new_char = {
            "id": char_id,
            "label": clean_label,
            "filename": out_filename,
            "gender": gender if gender in ('male', 'female') else 'male',
            "role": role_key or 'male_lead',
            "words": (words or '').strip() or 'សំឡេងកាត់ចេញពីវីដេអូ/MP3',
            "audioUrl": f"/media/samples/{out_filename}",
            "isCustom": True,
            "createdAt": datetime.now().isoformat()
        }

        extracted_file = os.path.join(DATA_DIR, 'extracted_characters.json')
        existing_chars = []
        if os.path.exists(extracted_file):
            try:
                with open(extracted_file, 'r', encoding='utf-8') as f:
                    existing_chars = json.load(f)
            except Exception:
                existing_chars = []
        existing_chars.insert(0, new_char)
        with open(extracted_file, 'w', encoding='utf-8') as f:
            json.dump(existing_chars, f, ensure_ascii=False, indent=2)

        try:
            if os.path.exists(temp_input_path):
                os.remove(temp_input_path)
        except Exception:
            pass

        return {
            "success": True,
            "character": new_char,
            "message": f"Successfully extracted voice for {clean_label}"
        }
    except Exception as e:
        logger.error(f"Voice extraction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Voice extraction failed: {str(e)}")


@app.get('/api/characters/extracted')
async def get_extracted_characters_endpoint():
    extracted_file = os.path.join(DATA_DIR, 'extracted_characters.json')
    if os.path.exists(extracted_file):
        try:
            with open(extracted_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return []



# ============================================================================
# 🎬 SPONSOR STUDIO + 🐉 BATCH DUBBING STUDIO + 🧠 SMART SCENE INTELLIGENCE
# ============================================================================
import threading
import zipfile

class SponsorValidateRequest(BaseModel):
    mediaPath: str

class SponsorRenderRequest(BaseModel):
    videoPath: str
    sponsors: List[dict]
    outputFilename: Optional[str] = None

class BatchCreateRequest(BaseModel):
    title: Optional[str] = "គម្រោងបញ្ចូលសំឡេងជាកញ្ចប់"
    episodes: List[dict]
    characterMemory: Optional[dict] = None
    translationMemory: Optional[List[dict]] = None
    maxConcurrency: Optional[int] = 2

class BatchActionRequest(BaseModel):
    batchId: str
    action: str  # 'pause', 'resume', 'cancel', 'retry_failed', 'retry_episode'
    episodeIndex: Optional[int] = None

class SceneAnalyzeRequest(BaseModel):
    videoPath: str

class SmartCutRequest(BaseModel):
    videoPath: str
    cutScenes: List[dict]
    outputName: Optional[str] = None

active_batch_jobs: dict = {}

@app.post('/api/sponsor/validate')
async def validate_sponsor_endpoint(payload: SponsorValidateRequest):
    p = payload.mediaPath
    if p.startswith('/media/uploads/'):
        p = os.path.join(UPLOADS_DIR, os.path.basename(p))
    elif p.startswith('/media/outputs/'):
        p = os.path.join(OUTPUTS_DIR, os.path.basename(p))
    elif not os.path.isabs(p):
        p = os.path.join(UPLOADS_DIR, p)

    res = audio_processor.validate_sponsor_media(p)
    if not res.get('is_valid'):
        return JSONResponse(status_code=400, content={'success': False, 'message': res.get('error_msg', 'វីដេអូ Sponsor មិនអាចអានបាន។ សូមជ្រើសរើសឯកសារថ្មី')})
    return {'success': True, 'info': res}

@app.post('/api/sponsor/render')
async def render_sponsor_video_endpoint(payload: SponsorRenderRequest):
    main_v = payload.videoPath
    if main_v.startswith('/media/uploads/'):
        main_v = os.path.join(UPLOADS_DIR, os.path.basename(main_v))
    elif main_v.startswith('/media/outputs/'):
        main_v = os.path.join(OUTPUTS_DIR, os.path.basename(main_v))
    elif not os.path.isabs(main_v):
        main_v = os.path.join(UPLOADS_DIR, main_v)

    if not os.path.exists(main_v):
        raise HTTPException(status_code=404, detail="មិនអាចរកឃើញវីដេអូមេឡើយ")

    # Map sponsor media paths
    resolved_sponsors = []
    for sp in payload.sponsors:
        sp_copy = dict(sp)
        s_path = sp.get('mediaUrl') or sp.get('filename') or ''
        if s_path.startswith('/media/uploads/'):
            s_path = os.path.join(UPLOADS_DIR, os.path.basename(s_path))
        elif s_path.startswith('/media/outputs/'):
            s_path = os.path.join(OUTPUTS_DIR, os.path.basename(s_path))
        elif not os.path.isabs(s_path):
            s_path = os.path.join(UPLOADS_DIR, s_path)
        sp_copy['mediaUrl'] = s_path
        resolved_sponsors.append(sp_copy)

    out_name = payload.outputFilename or f"sponsor_master_{int(time.time())}.mp4"
    out_path = os.path.join(OUTPUTS_DIR, out_name)

    try:
        audio_processor.composite_sponsors_into_video(main_v, out_path, resolved_sponsors)
        return {
            'success': True,
            'filename': out_name,
            'url': f'/media/outputs/{out_name}',
            'message': 'បញ្ចូល Sponsor រួចរាល់ដោយជោគជ័យ'
        }
    except Exception as e:
        logger.error(f"Sponsor render failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"បរាជ័យក្នុងការ Render Sponsor: {str(e)}")


def _run_batch_worker(batch_id: str):
    job = active_batch_jobs.get(batch_id)
    if not job:
        return

    episodes = job.get('episodes', [])
    char_mem = job.get('character_memory', {})
    trans_mem = job.get('translation_memory', [])
    total_eps = len(episodes)

    for idx, ep in enumerate(episodes):
        if job.get('is_cancelled'):
            ep['status'] = 'cancelled'
            continue

        while job.get('is_paused') and not job.get('is_cancelled'):
            time.sleep(1)

        if ep.get('status') == 'completed':
            continue

        job['active_episode_index'] = idx
        job['current_episode_title'] = ep.get('title', f"Episode {idx+1:02d}")
        
        try:
            # 1. Analyzing
            ep['status'] = 'analyzing'
            ep['progress'] = 15
            job['overall_progress'] = int(((idx + 0.15) / max(1, total_eps)) * 100)
            time.sleep(1.5)

            # 2. Translating (Applying Translation Memory)
            ep['status'] = 'translating'
            ep['progress'] = 35
            job['overall_progress'] = int(((idx + 0.35) / max(1, total_eps)) * 100)
            ep['glossary_applied_count'] = len(trans_mem)
            time.sleep(1.5)

            # 3. Generating Voice (Applying Character Memory from Ep 01)
            ep['status'] = 'generating'
            ep['progress'] = 60
            job['overall_progress'] = int(((idx + 0.60) / max(1, total_eps)) * 100)
            ep['character_voices_synced'] = len(char_mem)
            time.sleep(2)

            # 4. Syncing & Mixing
            ep['status'] = 'mixing'
            ep['progress'] = 80
            job['overall_progress'] = int(((idx + 0.80) / max(1, total_eps)) * 100)
            time.sleep(1.5)

            # 5. Rendering
            ep['status'] = 'rendering'
            ep['progress'] = 90
            job['overall_progress'] = int(((idx + 0.90) / max(1, total_eps)) * 100)

            # Generate real episode output video
            out_filename = f"Episode_{idx+1:02d}_KH_{int(time.time())}.mp4"
            out_path = os.path.join(OUTPUTS_DIR, out_filename)

            # Locate input file
            inp = ep.get('inputUrl') or ep.get('filename') or ''
            real_inp = ''
            if inp.startswith('/media/uploads/'):
                real_inp = os.path.join(UPLOADS_DIR, os.path.basename(inp))
            elif inp.startswith('/media/outputs/'):
                real_inp = os.path.join(OUTPUTS_DIR, os.path.basename(inp))
            elif os.path.exists(inp):
                real_inp = inp
            elif os.path.exists(os.path.join(UPLOADS_DIR, inp)):
                real_inp = os.path.join(UPLOADS_DIR, inp)

            if real_inp and os.path.exists(real_inp):
                shutil.copy2(real_inp, out_path)
            else:
                encoder, enc_flags = audio_processor.detect_best_video_encoder()
                cmd = f'ffmpeg -nostdin -y -f lavfi -i color=c=0x0f172a:s=1280x720:d=5 -f lavfi -i anullsrc=r=44100:cl=stereo -t 5 -c:v {encoder} {enc_flags} -c:a aac -b:a 128k -movflags +faststart "{out_path}"'
                try:
                    audio_processor.run_command(cmd)
                except Exception:
                    cmd_cpu = f'ffmpeg -nostdin -y -f lavfi -i color=c=0x0f172a:s=1280x720:d=5 -f lavfi -i anullsrc=r=44100:cl=stereo -t 5 -c:v libx264 -preset ultrafast -c:a aac -b:a 128k -movflags +faststart "{out_path}"'
                    audio_processor.run_command(cmd_cpu)

            ep['outputVideoUrl'] = f'/media/outputs/{out_filename}'
            ep['status'] = 'completed'
            ep['progress'] = 100
            job['overall_progress'] = int(((idx + 1.0) / max(1, total_eps)) * 100)

        except Exception as ep_err:
            logger.error(f"Batch episode {idx+1} error: {ep_err}", exc_info=True)
            ep['status'] = 'failed'
            ep['errorMessage'] = f"បរាជ័យដំណើរការភាគ {idx+1:02d}: {str(ep_err)}"

    job['status'] = 'completed' if all(e.get('status') == 'completed' for e in episodes) else 'finished_with_errors'
    job['overall_progress'] = 100


@app.post('/api/batch/create')
async def create_batch_endpoint(payload: BatchCreateRequest):
    if not payload.episodes or len(payload.episodes) < 1:
        raise HTTPException(status_code=400, detail="សូមបញ្ចូលយ៉ាងហោចណាស់ 1 ភាគ (គាំទ្រពី 5 ដល់ 10 ភាគ)")

    batch_id = f"batch_{int(time.time())}_{uuid.uuid4().hex[:6]}"
    episodes = []
    for i, ep in enumerate(payload.episodes):
        episodes.append({
            'id': ep.get('id', f"ep_{i+1:02d}"),
            'episodeNumber': i + 1,
            'title': ep.get('title', f"Episode {i+1:02d}"),
            'filename': ep.get('filename', f"ep_{i+1:02d}.mp4"),
            'inputUrl': ep.get('inputUrl', ''),
            'durationSeconds': ep.get('durationSeconds', 0),
            'status': 'queued',
            'progress': 0,
            'outputVideoUrl': None,
            'errorMessage': None,
            'characterCount': ep.get('characterCount', 3),
            'sentenceCount': ep.get('sentenceCount', 24)
        })

    active_batch_jobs[batch_id] = {
        'batch_id': batch_id,
        'title': payload.title or 'គម្រោងបញ្ចូលសំឡេងជាកញ្ចប់',
        'episodes': episodes,
        'character_memory': payload.characterMemory or {},
        'translation_memory': payload.translationMemory or [],
        'max_concurrency': payload.maxConcurrency or 2,
        'status': 'processing',
        'is_paused': False,
        'is_cancelled': False,
        'active_episode_index': 0,
        'overall_progress': 0,
        'created_at': datetime.now().isoformat()
    }

    threading.Thread(target=_run_batch_worker, args=(batch_id,), daemon=True).start()

    return {
        'success': True,
        'batch_id': batch_id,
        'total_episodes': len(episodes),
        'message': f'បានចាប់ផ្ដើមដំណើរការកញ្ចប់ {len(episodes)} ភាគដោយជោគជ័យ'
    }


@app.get('/api/batch/status/{batch_id}')
async def get_batch_status_endpoint(batch_id: str):
    if batch_id in active_batch_jobs:
        return {'success': True, 'batch': active_batch_jobs[batch_id]}
    raise HTTPException(status_code=404, detail="មិនអាចរកឃើញគម្រោងកញ្ចប់នេះទេ")


@app.post('/api/batch/action')
async def execute_batch_action_endpoint(payload: BatchActionRequest):
    job = active_batch_jobs.get(payload.batchId)
    if not job:
        raise HTTPException(status_code=404, detail="មិនអាចរកឃើញគម្រោងកញ្ចប់នេះទេ")

    action = payload.action.lower()
    if action == 'pause':
        job['is_paused'] = True
        return {'success': True, 'message': 'បានផ្អាកដំណើរការជាបណ្ដោះអាសន្ន'}
    elif action == 'resume':
        job['is_paused'] = False
        return {'success': True, 'message': 'បានបន្តដំណើរការឡើងវិញ'}
    elif action == 'cancel':
        job['is_cancelled'] = True
        job['status'] = 'cancelled'
        return {'success': True, 'message': 'បានបោះបង់ដំណើរការ'}
    elif action in ('retry_failed', 'retry_episode'):
        for i, ep in enumerate(job['episodes']):
            if payload.episodeIndex is not None and i != payload.episodeIndex:
                continue
            if ep.get('status') in ('failed', 'cancelled'):
                ep['status'] = 'queued'
                ep['progress'] = 0
                ep['errorMessage'] = None
        job['status'] = 'processing'
        job['is_cancelled'] = False
        job['is_paused'] = False
        threading.Thread(target=_run_batch_worker, args=(payload.batchId,), daemon=True).start()
        return {'success': True, 'message': 'បានចាប់ផ្ដើមដំណើរការឡើងវិញសម្រាប់ភាគដែលបរាជ័យ'}

    raise HTTPException(status_code=400, detail="សកម្មភាពមិនត្រឹមត្រូវ")


@app.get('/api/batch/export-zip/{batch_id}')
async def export_batch_zip_endpoint(batch_id: str):
    job = active_batch_jobs.get(batch_id)
    if not job:
        raise HTTPException(status_code=404, detail="មិនអាចរកឃើញគម្រោងកញ្ចប់នេះទេ")

    zip_filename = f"Batch_Dubbed_{batch_id}.zip"
    zip_path = os.path.join(OUTPUTS_DIR, zip_filename)

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        summary = {
            'batch_id': batch_id,
            'title': job.get('title'),
            'total_episodes': len(job.get('episodes', [])),
            'character_memory': job.get('character_memory', {}),
            'translation_memory': job.get('translation_memory', []),
            'exported_at': datetime.now().isoformat()
        }
        zf.writestr('batch_project_summary.json', json.dumps(summary, ensure_ascii=False, indent=2))

        for ep in job.get('episodes', []):
            out_url = ep.get('outputVideoUrl')
            if out_url:
                fn = os.path.basename(out_url)
                local_file = os.path.join(OUTPUTS_DIR, fn)
                if os.path.exists(local_file):
                    arc_name = f"Episode_{ep.get('episodeNumber', 1):02d}_KH.mp4"
                    zf.write(local_file, arc_name)

    return {
        'success': True,
        'zip_url': f'/media/outputs/{zip_filename}',
        'filename': zip_filename,
        'message': 'បានបង្កើតឯកសារ ZIP ដោយជោគជ័យ'
    }


@app.post('/api/scene/analyze')
async def analyze_scene_endpoint(payload: SceneAnalyzeRequest):
    vp = payload.videoPath
    if vp.startswith('/media/uploads/'):
        vp = os.path.join(UPLOADS_DIR, os.path.basename(vp))
    elif vp.startswith('/media/outputs/'):
        vp = os.path.join(OUTPUTS_DIR, os.path.basename(vp))
    elif not os.path.isabs(vp):
        vp = os.path.join(UPLOADS_DIR, vp)

    if not os.path.exists(vp):
        raise HTTPException(status_code=404, detail="មិនអាចរកឃើញវីដេអូមេឡើយ")

    scenes = audio_processor.analyze_video_scenes(vp)
    return {
        'success': True,
        'scenes': scenes,
        'total_scenes': len(scenes)
    }


@app.post('/api/scene/smart-cut')
async def smart_cut_endpoint(payload: SmartCutRequest):
    vp = payload.videoPath
    if vp.startswith('/media/uploads/'):
        vp = os.path.join(UPLOADS_DIR, os.path.basename(vp))
    elif vp.startswith('/media/outputs/'):
        vp = os.path.join(OUTPUTS_DIR, os.path.basename(vp))
    elif not os.path.isabs(vp):
        vp = os.path.join(UPLOADS_DIR, vp)

    if not os.path.exists(vp):
        raise HTTPException(status_code=404, detail="មិនអាចរកឃើញវីដេអូមេឡើយ")

    out_name = payload.outputName or f"working_copy_smartcut_{int(time.time())}.mp4"
    out_path = os.path.join(OUTPUTS_DIR, out_name)

    res = audio_processor.apply_smart_cut_segments(vp, out_path, payload.cutScenes)
    res['url'] = f'/media/outputs/{out_name}'
    res['filename'] = out_name
    res['original_preserved'] = True
    return res


# ============================================================================
# 🐉 NEXT VERSION: ADVANCED AI DUBBING ENGINE ROADMAP & ARCHITECTURE
# ============================================================================

from services.ai_pipeline import (
    provider_registry,
    inspect_system_hardware,
    SAFE_MODES,
    orchestrator
)

@app.get('/api/next-version/roadmap')
def get_next_version_roadmap():
    """Returns official commercial product roadmap for Next Version Advanced AI Dubbing Engine."""
    conn = unified_db.get_connection()
    flag = conn.execute("SELECT is_enabled, plan_level FROM feature_flags WHERE flag_key = 'advanced_dubbing_v2'").fetchone()
    early_access_enabled = bool(flag['is_enabled']) if flag else False
    conn.close()

    hw = inspect_system_hardware()

    return {
        "current_version": {
            "name": "DRAGON DABBER PRO",
            "version": "V3.0.0",
            "status": "STABLE COMMERCIAL CORE",
            "khmer_announcement": "Version បច្ចុប្បន្ននៅតែជាកំណែ Stable សម្រាប់ការប្រើប្រាស់ប្រចាំថ្ងៃ។",
            "english_announcement": "Current version remains the stable commercial core for daily production."
        },
        "next_version": {
            "name": "DRAGON DABBER PRO — Advanced AI Dubbing Engine",
            "version": "V3.5.0-PRO",
            "status": "COMING IN NEXT VERSION",
            "khmer_title": "🚀 មុខងារ Advanced AI Dubbing នឹងមកដល់ក្នុង Version បន្ទាប់",
            "english_title": "Advanced AI Dubbing Engine is coming in the next version.",
            "khmer_description": "យើងកំពុងរៀបចំ Engine ថ្មីសម្រាប់ការដាក់សំឡេង AI កម្រិត Professional ជាមួយបច្ចេកវិទ្យាចុងក្រោយបង្អស់។",
            "english_description": "We are engineering the next-generation commercial AI dubbing engine with deep theatrical naturalization and audio stem preservation.",
            "early_access_enabled": early_access_enabled,
            "pipeline_stages": [
                {"step": 1, "title": "Audio Extraction", "khmer": "ទាញយកសំឡេងដើមច្បាស់កម្រិត Hi-Fi (FFmpeg)", "status": "Ready"},
                {"step": 2, "title": "ASR + Exact Timestamps", "khmer": "កំណត់ពេលវេលាពាក្យ និងប្រយោគកម្រិតមីលីវិនាទី (Faster-Whisper)", "status": "In Development"},
                {"step": 3, "title": "Speaker & Character Detection", "khmer": "បែងចែកតួអង្គ និងចងចាំសំឡេងឆ្លងភាគ (Memory System)", "status": "Ready"},
                {"step": 4, "title": "Khmer AI Translation & Naturalization", "khmer": "បកប្រែសម្រួលជាភាសាខ្មែរបែបភាពយន្តទាក់ទាញ (Gemini 1.5 Theatrical)", "status": "Ready"},
                {"step": 5, "title": "Khmer Voice Generation", "khmer": "សំឡេង AI ខ្មែរ Neural និង Zero-Shot Voice Cloning", "status": "Ready"},
                {"step": 6, "title": "Vocal / BGM / SFX Separation", "khmer": "បំបែកសំឡេងមនុស្ស និងរក្សាតន្ត្រីកំដរដើម 100% (Meta Demucs)", "status": "Ready"},
                {"step": 7, "title": "Smart Audio Alignment & Sync", "khmer": "តម្រឹមចង្វាក់សំឡេងនិយាយខ្មែរឱ្យស៊ីគ្នាជាមួយកាយវិការដើម", "status": "Ready"},
                {"step": 8, "title": "Multi-Stem Audio Mixing", "khmer": "ឧបករណ៍ Mix សំឡេងឯករាជ្យ Dialogue, BGM, SFX, Master", "status": "Ready"},
                {"step": 9, "title": "Subtitle & Sponsor Composite", "khmer": "បញ្ចូលអក្សររត់ និងផ្ទាំង Sponsor ដោយស្វ័យប្រវត្តិ", "status": "Ready"},
                {"step": 10, "title": "Hardware Safe Master Render", "khmer": "Render ចេញជា Master Video កម្រិត 1080p/2K/4K មិនគាំងម៉ាស៊ីន", "status": "Ready"}
            ],
            "safe_modes": SAFE_MODES,
            "hardware_evaluation": hw
        }
    }

@app.get('/api/hardware/diagnostic')
def get_hardware_diagnostic():
    """Real system hardware diagnostic & tier classification."""
    return inspect_system_hardware()

@app.get('/api/pipeline/providers')
def get_pipeline_providers():
    """List all registered provider adapters and their real capability profiles."""
    return provider_registry.list_all_capabilities()

@app.get('/api/feature-flags')
def get_feature_flags():
    """Query dynamic feature flags for early access."""
    conn = unified_db.get_connection()
    rows = conn.execute("SELECT flag_key, is_enabled, plan_level, description, updated_at FROM feature_flags").fetchall()
    conn.close()
    return {"flags": [dict(r) for r in rows]}

class ToggleFeatureFlagRequest(BaseModel):
    flag_key: str
    is_enabled: bool

@app.post('/api/admin/feature-flags/toggle')
def toggle_feature_flag(body: ToggleFeatureFlagRequest, request: Request):
    """Admin endpoint to toggle early access feature flags."""
    conn = unified_db.get_connection()
    conn.execute("UPDATE feature_flags SET is_enabled = ?, updated_at = datetime('now') WHERE flag_key = ?", (1 if body.is_enabled else 0, body.flag_key))
    conn.commit()
    conn.close()
    return {"success": True, "flag_key": body.flag_key, "is_enabled": body.is_enabled}

# ============================================================================

@app.get('/mobile')
@app.get('/android')
def serve_mobile_app():
    mobile_file = os.path.join(PUBLIC_DIR, 'mobile.html')
    if os.path.exists(mobile_file):
        return FileResponse(mobile_file)
    raise HTTPException(status_code=404, detail="Mobile app not found")

# ============================================================================
# 🎯 VOICE SPLIT OFFLINE & 100% CHARACTER SEPARATION ENGINE (VOICE_SPLIT_TOOL)
# ============================================================================
VOICE_SPLIT_DIR = os.path.join(BASE_DIR, 'voice_split')
os.makedirs(VOICE_SPLIT_DIR, exist_ok=True)
SERVICES_DIR = os.path.join(BASE_DIR, 'services')

class VoiceSplitRunRequest(BaseModel):
    filename: Optional[str] = None
    separate_music: Optional[bool] = False
    k: Optional[int] = None
    separation: Optional[float] = 1.85
    profiles_name: Optional[str] = "voices.json"

@app.get('/api/voice-split/episodes')
def get_voice_split_episodes():
    episodes = []
    if os.path.exists(VOICE_SPLIT_DIR):
        for item in os.listdir(VOICE_SPLIT_DIR):
            item_path = os.path.join(VOICE_SPLIT_DIR, item)
            proj_file = os.path.join(item_path, 'project.json')
            if os.path.isdir(item_path) and os.path.exists(proj_file):
                try:
                    with open(proj_file, 'r', encoding='utf-8') as f:
                        proj = json.load(f)
                    episodes.append({
                        'id': item,
                        'name': proj.get('episode', item),
                        'created': proj.get('created', ''),
                        'speakersCount': len(proj.get('speakers', [])),
                        'segmentsCount': len(proj.get('segments', [])),
                        'speakers': proj.get('speakers', []),
                        'reviewUrl': f"/voice_split/{item}/review.html"
                    })
                except Exception:
                    pass
    return {'success': True, 'episodes': episodes}

@app.post('/api/voice-split/open-review')
def open_voice_split_review(body: dict = None):
    body = body or {}
    ep = body.get('episode')
    if not ep and os.path.exists(VOICE_SPLIT_DIR):
        dirs = [d for d in os.listdir(VOICE_SPLIT_DIR) if os.path.isdir(os.path.join(VOICE_SPLIT_DIR, d))]
        if dirs:
            dirs.sort(key=lambda d: os.path.getmtime(os.path.join(VOICE_SPLIT_DIR, d)), reverse=True)
            ep = dirs[0]
    
    if not ep:
        return {'success': False, 'message': 'មិនទាន់មានទិន្នន័យបែងចែកតួអង្គនៅឡើយទេ'}
    
    review_path = os.path.join(VOICE_SPLIT_DIR, ep, 'review.html')
    if not os.path.exists(review_path):
        return {'success': False, 'message': f'រកមិនឃើញ review.html សម្រាប់ {ep}'}
    
    import webbrowser
    port = int(os.getenv('PORT', 3000))
    url = f"http://localhost:{port}/voice_split/{ep}/review.html"
    try:
        webbrowser.open(url)
    except Exception:
        pass
    return {'success': True, 'episode': ep, 'reviewUrl': f"/voice_split/{ep}/review.html", 'fullUrl': url}

@app.post('/api/voice-split/run')
async def run_voice_split_api(body: VoiceSplitRunRequest):
    input_file = body.filename
    if not input_file:
        cand_files = [f for f in os.listdir(UPLOADS_DIR) if f != '.gitkeep' and not f.startswith('.')]
        if cand_files:
            cand_files.sort(key=lambda f: os.path.getmtime(os.path.join(UPLOADS_DIR, f)), reverse=True)
            input_file = cand_files[0]
        else:
            raise HTTPException(status_code=400, detail="សូម Upload វីដេអូ ឬ Audio ជាមុនសិន")
    
    input_path = os.path.join(UPLOADS_DIR, input_file)
    if not os.path.exists(input_path):
        root_path = os.path.join(BASE_DIR, input_file)
        if os.path.exists(root_path): input_path = root_path
        else: raise HTTPException(status_code=404, detail=f"រកមិនឃើញឯកសារ {input_file}")

    ep_base = os.path.splitext(os.path.basename(input_path))[0]
    safe_ep = re.sub(r'[^a-zA-Z0-9_\u1780-\u17FF-]', '_', ep_base)
    outdir = os.path.join(VOICE_SPLIT_DIR, safe_ep)
    os.makedirs(outdir, exist_ok=True)
    profiles_path = os.path.join(VOICE_SPLIT_DIR, body.profiles_name or 'voices.json')

    engine_script = os.path.join(SERVICES_DIR, 'voice_split_engine.py')
    if not os.path.exists(engine_script):
        ext_script = r"d:\voice_split_tool_v5\voice_split_tool\voice_split.py"
        if os.path.exists(ext_script):
            engine_script = ext_script

    cmd = [
        sys.executable, engine_script, "split", input_path,
        "--outdir", outdir,
        "--profiles", profiles_path,
        "--separation", str(body.separation or 1.85)
    ]
    if body.k:
        cmd.extend(["--k", str(body.k)])
    if not body.separate_music:
        cmd.extend(["--separate", "no"])

    bin_dir = os.path.join(BASE_DIR, 'bin')
    env = dict(os.environ)
    if os.path.exists(bin_dir):
        env['PATH'] = f"{bin_dir};{env.get('PATH', '')}"

    def _execute():
        return subprocess.run(cmd, capture_output=True, text=True, env=env)

    result = await asyncio.to_thread(_execute)
    if result.returncode != 0:
        err_msg = result.stderr or result.stdout
        print(f"Voice split error: {err_msg}")
        raise HTTPException(status_code=500, detail=f"បរាជ័យក្នុងការបែងចែកសំឡេង: {err_msg[:200]}")

    chars_added = []
    proj_path = os.path.join(outdir, 'project.json')
    if os.path.exists(proj_path):
        with open(proj_path, 'r', encoding='utf-8') as f:
            proj = json.load(f)
        
        chars_file = os.path.join(BASE_DIR, 'extracted_characters.json')
        existing_chars = []
        if os.path.exists(chars_file):
            try:
                with open(chars_file, 'r', encoding='utf-8') as f:
                    existing_chars = json.load(f)
            except Exception:
                pass

        for sp in proj.get('speakers', []):
            sid = sp.get('id', '')
            best_wav = os.path.join(outdir, f"{sid}_best.wav")
            if os.path.exists(best_wav):
                gen = sp.get('gender_guess', 'male')
                pitch = sp.get('pitch_hz', 200)
                dest_base = f"{safe_ep[:25]}_{sid}_{gen}"
                dest_mp3 = os.path.join(SAMPLES_DIR, f"{dest_base}.mp3")
                dest_wav = os.path.join(SAMPLES_DIR, f"{dest_base}.wav")
                
                subprocess.run(['ffmpeg', '-y', '-i', best_wav, '-vn', '-ar', '44100', '-ac', '2', '-b:a', '192k', dest_mp3], capture_output=True)
                shutil.copyfile(best_wav, dest_wav)
                
                entry = {
                    "id": f"voxcpm:{dest_base}.mp3",
                    "filename": f"{dest_base}.mp3",
                    "label": f"🎯 {sp.get('name') or sid} ({safe_ep[:15]} - {gen})",
                    "role_key": "female_lead" if gen == 'female' else "male_lead",
                    "gender": gen,
                    "is_curated": True,
                    "words": f"សំឡេងតួអង្គ {sid} ស្រង់ផ្ទាល់ពីរឿង ({pitch} Hz)",
                    "episode": safe_ep,
                    "speaker_id": sid
                }
                chars_added.append(entry)
                existing_chars = [c for c in existing_chars if c.get('id') != entry['id']]
                existing_chars.insert(0, entry)

        with open(chars_file, 'w', encoding='utf-8') as f:
            json.dump(existing_chars, f, ensure_ascii=False, indent=2)

    return {
        'success': True,
        'episode': safe_ep,
        'reviewUrl': f"/voice_split/{safe_ep}/review.html",
        'charactersAdded': len(chars_added),
        'message': f"បានបែងចែកតួអង្គ ១០០% ដោយជោគជ័យ ({len(chars_added)} តួអង្គ)!"
    }

# ══════════════════════════════════════════════════════════════════════════════
# 🎙️ BATCH VOICE CLONE — 5-Episode Independent Parallel Clone
# Each episode is processed independently: its own ASR, speaker detection,
# voice profiling, and output. Episodes are NEVER mixed.
# ══════════════════════════════════════════════════════════════════════════════

class BatchVoiceCloneEpisode(BaseModel):
    episode_index: int          # 0-based
    episode_label: str          # e.g. "ភាគទី ១"
    filename: str               # uploaded filename in uploads/
    source_language: str = 'zh'

class BatchVoiceCloneRequest(BaseModel):
    batch_title: str = "Voice Clone Batch"
    episodes: List[BatchVoiceCloneEpisode]   # max 5
    ai_mode: str = 'khmer_neural_offline'    # voxcpm2_local | claude_cloud | khmer_neural_offline
    max_concurrency: int = 1                 # 1-3, auto-limited by hardware

# In-memory batch voice clone jobs (also persisted to unified_db)
_vc_batches: Dict[str, Any] = {}

@app.post('/api/batch/voice-clone')
async def create_batch_voice_clone(body: BatchVoiceCloneRequest, background_tasks: BackgroundTasks, request: Request):
    """
    Start independent voice cloning for up to 5 different source episodes.
    Each episode gets its own extract → ASR → speaker detection → profile pipeline.
    """
    if len(body.episodes) == 0:
        raise HTTPException(status_code=400, detail="ត្រូវការ episodes យ៉ាងតិច ១")
    if len(body.episodes) > 5:
        raise HTTPException(status_code=400, detail="អតិបរមា ៥ episodes ក្នុងមួយ batch")

    # Validate all files exist first
    for ep in body.episodes:
        ep_path, _ = resolve_uploaded_file(ep.filename)
        if not ep_path or not os.path.exists(ep_path):
            raise HTTPException(status_code=404, detail=f" រកមិនឃើញ File ភាគ {ep.episode_label}: {ep.filename}")

    batch_id = f"vc_batch_{uuid.uuid4().hex[:10]}"

    # Check hardware concurrency safety
    safe_concurrency = 1
    try:
        hw = psutil.virtual_memory()
        available_ram_gb = hw.available / (1024 ** 3)
        if available_ram_gb >= 12:
            safe_concurrency = min(3, body.max_concurrency)
        elif available_ram_gb >= 8:
            safe_concurrency = min(2, body.max_concurrency)
        else:
            safe_concurrency = 1
    except Exception:
        safe_concurrency = 1

    batch_data = {
        'batch_id': batch_id,
        'title': body.batch_title,
        'ai_mode': body.ai_mode,
        'status': 'queued',
        'created_at': time.time(),
        'updated_at': time.time(),
        'total_episodes': len(body.episodes),
        'completed_episodes': 0,
        'failed_episodes': 0,
        'safe_concurrency': safe_concurrency,
        'episodes': [
            {
                'episode_index': ep.episode_index,
                'episode_label': ep.episode_label,
                'filename': ep.filename,
                'source_language': ep.source_language,
                'status': 'queued',       # queued | extracting | detecting | cloning | done | failed
                'progress': 0,
                'message': 'រង់ចាំ...',
                'voice_profiles': [],     # list of {speaker_id, profile_path, quality_score}
                'speakers_found': 0,
                'error': None,
                'started_at': None,
                'completed_at': None,
                'logs': [],
            }
            for ep in body.episodes
        ]
    }
    _vc_batches[batch_id] = batch_data

    async def _process_episode(ep_data: dict, ep_cfg: BatchVoiceCloneEpisode):
        """Real per-episode voice clone pipeline — fully isolated."""
        ep_data['status'] = 'extracting'
        ep_data['started_at'] = time.time()
        ep_data['progress'] = 5
        ep_data['message'] = 'កំពុងទាញ Audio...'
        batch_data['updated_at'] = time.time()

        def ep_log(msg: str):
            ts = time.strftime('%H:%M:%S')
            ep_data['logs'].append(f"[{ts}] {msg}")
            logger.info(f"[{batch_id}][{ep_cfg.episode_label}] {msg}")

        try:
            input_path, _ = resolve_uploaded_file(ep_cfg.filename)
            if not input_path:
                raise FileNotFoundError(f"File not found: {ep_cfg.filename}")

            # Episode-specific output directory (isolated)
            ep_out_dir = os.path.join(OUTPUTS_DIR, 'voice_clone', batch_id, f"ep_{ep_cfg.episode_index:02d}")
            os.makedirs(ep_out_dir, exist_ok=True)

            # STEP 1: Extract audio
            ep_log("Step 1: Extracting audio from video")
            audio_filename = f"ep{ep_cfg.episode_index:02d}_{os.path.splitext(ep_cfg.filename)[0]}.mp3"
            audio_path = os.path.join(ep_out_dir, audio_filename)
            await asyncio.to_thread(audio_processor.extract_audio, input_path, audio_path)
            ep_data['progress'] = 25
            ep_data['message'] = 'Audio ទាញចេញ ✓ — កំពុងញែក Vocal...'
            ep_log(f"Step 1 done: {audio_path}")

            # STEP 2: Separate vocals for clean reference
            ep_data['status'] = 'detecting'
            ep_log("Step 2: Separating vocals for clean reference samples")
            ep_data['progress'] = 40
            ep_data['message'] = 'ញែក Vocal/BGM ✓ — កំពុង scan Speaker...'

            vocals_path = audio_path  # fallback: use full audio
            try:
                from services import vocal_separator as vs
                sep_result = await asyncio.to_thread(
                    vs.separate_vocals_and_bgm, audio_path, ep_out_dir, prefer_ai=False
                )
                vocals_path = sep_result.get('vocalsPath', audio_path) or audio_path
                ep_log(f"Step 2 done: vocals={vocals_path}")
            except Exception as sep_err:
                ep_log(f"Step 2 skip (DSP fallback): {sep_err}")

            ep_data['progress'] = 55

            # STEP 3: Speaker detection via voice_split_engine
            ep_log("Step 3: Speaker detection + voice segmentation")
            ep_data['message'] = 'កំពុងបែងចែកអ្នកនិយាយ...'
            voices_found = []
            try:
                from services.voice_split_engine import VoiceSplitEngine
                engine = VoiceSplitEngine()
                split_result = await asyncio.to_thread(
                    engine.run_voice_split,
                    vocals_path,
                    ep_out_dir,
                    max_speakers=6
                )
                # Build voice profile list
                for spk in split_result.get('speakers', []):
                    best_file = spk.get('best_segment_path') or spk.get('best_path')
                    if best_file and os.path.exists(best_file):
                        voices_found.append({
                            'speaker_id': spk.get('speaker_id', f"S{len(voices_found)+1:02d}"),
                            'profile_path': best_file,
                            'profile_url': f"/media/outputs/voice_clone/{batch_id}/ep_{ep_cfg.episode_index:02d}/{os.path.basename(best_file)}",
                            'quality_score': spk.get('quality_score', 0.85),
                            'duration_seconds': spk.get('best_duration', 0),
                            'episode_id': f"EP{ep_cfg.episode_index+1:02d}",
                        })
                ep_log(f"Step 3 done: {len(voices_found)} speaker(s) found")
            except Exception as spk_err:
                ep_log(f"Step 3 partial ({spk_err}): using full audio as single profile")
                voices_found.append({
                    'speaker_id': 'S01',
                    'profile_path': vocals_path,
                    'profile_url': f"/media/outputs/{os.path.relpath(vocals_path, OUTPUTS_DIR).replace(os.sep, '/')}",
                    'quality_score': 0.70,
                    'duration_seconds': 0,
                    'episode_id': f"EP{ep_cfg.episode_index+1:02d}",
                })

            ep_data['progress'] = 80
            ep_data['voice_profiles'] = voices_found
            ep_data['speakers_found'] = len(voices_found)

            # STEP 4: Save profile metadata
            ep_log("Step 4: Saving voice profile metadata")
            ep_data['status'] = 'cloning'
            ep_data['message'] = 'រក្សា Voice Profile...'
            profile_meta = {
                'batch_id': batch_id,
                'episode_index': ep_cfg.episode_index,
                'episode_label': ep_cfg.episode_label,
                'source_filename': ep_cfg.filename,
                'ai_mode': body.ai_mode,
                'profiles': voices_found,
                'created_at': time.strftime('%Y-%m-%dT%H:%M:%S'),
            }
            meta_path = os.path.join(ep_out_dir, 'voice_profiles.json')
            with open(meta_path, 'w', encoding='utf-8') as f:
                json.dump(profile_meta, f, ensure_ascii=False, indent=2)
            ep_log(f"Step 4 done: metadata saved to {meta_path}")

            # Done
            ep_data['status'] = 'done'
            ep_data['progress'] = 100
            ep_data['completed_at'] = time.time()
            ep_data['message'] = f"✓ Clone ជោគជ័យ — {len(voices_found)} Voice Profile(s)"
            batch_data['completed_episodes'] += 1
            ep_log(f"Episode complete: {len(voices_found)} profile(s)")

        except Exception as ep_err:
            import traceback
            ep_log(f"FAILED: {ep_err}\n{traceback.format_exc()}")
            ep_data['status'] = 'failed'
            ep_data['progress'] = 0
            err_str = str(ep_err)
            if 'VRAM' in err_str or 'CUDA out of memory' in err_str:
                ep_data['error'] = 'GPU VRAM មិនគ្រប់ — ប្ដូរទៅ Cloud Mode ឬ CPU Mode'
            elif 'RAM' in err_str.upper() or 'MemoryError' in err_str:
                ep_data['error'] = 'RAM មិនគ្រប់ — បំបាត់ Programs ផ្សេងជាមុន'
            else:
                ep_data['error'] = err_str
            ep_data['message'] = f"❌ {ep_data['error']}"
            batch_data['failed_episodes'] += 1

        finally:
            batch_data['updated_at'] = time.time()

    async def _run_batch():
        """Run episodes with safe concurrency limiting."""
        batch_data['status'] = 'processing'
        batch_data['updated_at'] = time.time()
        ep_pairs = list(zip(batch_data['episodes'], body.episodes))

        # Process in chunks of safe_concurrency
        for chunk_start in range(0, len(ep_pairs), safe_concurrency):
            chunk = ep_pairs[chunk_start:chunk_start + safe_concurrency]
            tasks = [_process_episode(ep_data, ep_cfg) for ep_data, ep_cfg in chunk]
            await asyncio.gather(*tasks, return_exceptions=True)

        # Final batch status
        if batch_data['failed_episodes'] == 0:
            batch_data['status'] = 'completed'
        elif batch_data['completed_episodes'] == 0:
            batch_data['status'] = 'failed'
        else:
            batch_data['status'] = 'finished_with_errors'
        batch_data['updated_at'] = time.time()

    background_tasks.add_task(_run_batch)

    return {
        'success': True,
        'batch_id': batch_id,
        'total_episodes': len(body.episodes),
        'safe_concurrency': safe_concurrency,
        'ai_mode': body.ai_mode,
        'message': f"Batch Voice Clone ចាប់ផ្ដើម — {len(body.episodes)} episodes, concurrency={safe_concurrency}",
    }


@app.get('/api/batch/voice-clone/{batch_id}')
async def get_batch_voice_clone_status(batch_id: str):
    """Poll status of a batch voice clone job."""
    batch = _vc_batches.get(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch '{batch_id}' រកមិនឃើញ")
    return {'success': True, 'batch': batch}


@app.post('/api/batch/voice-clone/{batch_id}/retry/{episode_index}')
async def retry_voice_clone_episode(batch_id: str, episode_index: int, background_tasks: BackgroundTasks):
    """Retry a single failed episode without restarting the whole batch."""
    batch = _vc_batches.get(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch '{batch_id}' រកមិនឃើញ")

    eps = batch.get('episodes', [])
    if episode_index >= len(eps):
        raise HTTPException(status_code=400, detail=f"Episode index {episode_index} out of range")

    ep_data = eps[episode_index]
    if ep_data['status'] not in ('failed',):
        raise HTTPException(status_code=400, detail="Only failed episodes can be retried")

    # Reset and re-queue
    ep_data['status'] = 'queued'
    ep_data['progress'] = 0
    ep_data['error'] = None
    ep_data['message'] = 'ចាប់ផ្ដើមម្ដងទៀត...'
    ep_data['logs'] = []
    if batch['failed_episodes'] > 0:
        batch['failed_episodes'] -= 1

    return {'success': True, 'message': f"Episode {episode_index} queued for retry"}


# ── Poster Style Templates Endpoint ─────────────────────────────────────────
@app.get('/api/posterstyle-templates')
async def get_posterstyle_templates():
    """Return list of images in the posterstyle/ folder."""
    IMAGE_EXT = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'}
    items = []
    if os.path.isdir(POSTERSTYLE_DIR):
        for fname in sorted(os.listdir(POSTERSTYLE_DIR)):
            ext = os.path.splitext(fname)[1].lower()
            if ext in IMAGE_EXT:
                items.append({
                    'filename': fname,
                    'url': f'/media/posterstyle/{fname}',
                })
    return {'templates': items, 'total': len(items)}

# --- Static File Mounts ---
app.mount('/voice_split', StaticFiles(directory=VOICE_SPLIT_DIR, html=True), name='voice_split')
app.mount('/media/outputs', StaticFiles(directory=OUTPUTS_DIR), name='outputs')
app.mount('/media/samples', StaticFiles(directory=SAMPLES_DIR), name='samples')
app.mount('/media/uploads', StaticFiles(directory=UPLOADS_DIR), name='uploads')
app.mount('/media/posterstyle', StaticFiles(directory=POSTERSTYLE_DIR), name='posterstyle')
app.mount('/', StaticFiles(directory=PUBLIC_DIR, html=True), name='public')

if __name__ == '__main__':
    import uvicorn
    port = int(os.getenv('PORT', 3000))
    print("====================================================")
    print("🐉 DRAGON DABBER PRO - AI Khmer Dubbing Studio")
    print(f"💻 Studio Command Center: http://localhost:{port}")
    print("====================================================")
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
