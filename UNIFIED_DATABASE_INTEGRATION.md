# 🗄️ Unified Database Integration

## Overview

ទាំង 3 dubbing options ទាំងអស់ (VoxCPM2, ElevenLabs, EdgeTTS) ឥឡូវប្រើ **unified database តែមួយ** សម្រាប់:
- Job tracking
- Progress monitoring
- History logging
- Statistics

---

## Database Tables

### 1. `processing_jobs`
រក្សាទុក job ទាំងអស់ពីទាំង 3 modes:

```sql
CREATE TABLE processing_jobs (
    id TEXT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    video_id BIGINT,
    job_type TEXT NOT NULL,              -- 'dubbing', 'voice_generation', 'video_processing'
    processing_mode TEXT NOT NULL,       -- 'voxcpm2', 'elevenlabs', 'edge_tts', 'pure_khmer'
    status TEXT NOT NULL DEFAULT 'pending',
    progress INT DEFAULT 0,
    message TEXT,
    params JSONB,                        -- Job parameters
    result JSONB,                        -- Job results
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
```

### 2. `processing_history`
រក្សាទុក history នៃ jobs ដែលបានបញ្ចប់:

```sql
CREATE TABLE processing_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    job_id TEXT NOT NULL,
    processing_mode TEXT NOT NULL,       -- 'voxcpm2', 'elevenlabs', 'edge_tts'
    video_filename TEXT,
    success INT DEFAULT 1,               -- 1 = success, 0 = failed
    duration_seconds FLOAT,
    output_files JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. `mode_statistics`
សង្ខេបស្ថិតិ usage របស់ user តាម mode:

```sql
CREATE TABLE mode_statistics (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    mode TEXT NOT NULL,                  -- 'voxcpm2', 'elevenlabs', 'edge_tts'
    total_jobs INT DEFAULT 0,
    successful_jobs INT DEFAULT 0,
    failed_jobs INT DEFAULT 0,
    total_duration_seconds FLOAT DEFAULT 0,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, mode)
);
```

---

## Processing Modes

### 1. VoxCPM2 Mode
- **Mode ID:** `voxcpm2`
- **Voice ID Pattern:** `voxcpm:*`
- **Requirements:** License key required (premium)
- **Features:** High-quality Khmer voice cloning

### 2. ElevenLabs Mode
- **Mode ID:** `elevenlabs`
- **Voice ID Pattern:** `eleven:*` or ElevenLabs voice IDs
- **Requirements:** ElevenLabs API key
- **Features:** Professional English/multilingual voices

### 3. EdgeTTS Mode (Free)
- **Mode ID:** `edge_tts`
- **Voice ID Pattern:** Microsoft TTS voices
- **Requirements:** None (free)
- **Features:** Basic TTS, no license required

### 4. Pure Khmer Mode (Default Free)
- **Mode ID:** `pure_khmer`
- **Voice ID:** Default voices
- **Requirements:** None (free)
- **Features:** Basic Khmer TTS

---

## API Integration

### Dubbing Endpoint

```python
@app.post('/api/dubbing/start')
async def start_dubbing(body: DubbingStartRequest, background_tasks: BackgroundTasks, request: Request):
    # Determine processing mode
    processing_mode = 'pure_khmer'  # Default
    if body.voiceId and body.voiceId.startswith('voxcpm:'):
        processing_mode = 'voxcpm2'
    elif voxcpm_mode == 'elevenlabs':
        processing_mode = 'elevenlabs'
    elif voxcpm_mode in ['cloud', 'local']:
        processing_mode = 'voxcpm2'
    
    # Save to unified database
    unified_db.create_job({
        'id': job_id,
        'user_id': user.get('id') if user else None,
        'video_filename': body.filename,
        'job_type': 'dubbing',
        'processing_mode': processing_mode,
        'status': 'extracting',
        'progress': 10,
        'message': 'Starting...',
        'params': {
            'sourceLang': body.sourceLang,
            'targetLang': body.targetLang,
            'voiceId': body.voiceId,
            'scope': body.scope
        }
    })
    
    # On completion
    unified_db.update_job(job_id, {
        'status': 'completed',
        'progress': 100,
        'result': json.dumps({
            'outputVideo': output_video_url,
            'outputAudio': output_audio_url
        })
    })
    
    # Add to history
    unified_db.add_history({
        'user_id': user.get('id'),
        'job_id': job_id,
        'processing_mode': processing_mode,
        'video_filename': body.filename,
        'success': 1,
        'duration_seconds': elapsed_time,
        'output_files': [output_video, output_audio]
    })
```

### Voice Generation Endpoint

```python
@app.post('/api/dubbing/generate-line')
async def generate_line(body: GenerateLineRequest, request: Request):
    # Determine mode
    processing_mode = 'pure_khmer'
    if body.voiceId:
        if body.voiceId.startswith('voxcpm:'):
            processing_mode = 'voxcpm2'
        elif body.voiceId.startswith('eleven:'):
            processing_mode = 'elevenlabs'
        else:
            processing_mode = 'edge_tts'
    
    # Save to unified database
    unified_db.create_job({
        'id': job_id,
        'user_id': user.get('id'),
        'job_type': 'voice_generation',
        'processing_mode': processing_mode,
        'status': 'processing',
        'progress': 50,
        'params': {
            'text': body.text,
            'voiceId': body.voiceId,
            'lineIndex': body.lineIndex
        }
    })
    
    # After generation
    unified_db.update_job(job_id, {
        'status': 'completed',
        'progress': 100,
        'result': json.dumps({
            'audioUrl': audio_url,
            'filename': filename
        })
    })
```

---

## UnifiedDatabase Service

```python
from services.unified_db import unified_db

# Create job
unified_db.create_job({
    'id': 'job_123',
    'user_id': 1,
    'job_type': 'dubbing',
    'processing_mode': 'voxcpm2',
    'status': 'processing',
    'params': {...}
})

# Update job
unified_db.update_job('job_123', {
    'status': 'completed',
    'progress': 100
})

# Get job
job = unified_db.get_job('job_123')

# Get user jobs (filtered by mode)
jobs = unified_db.get_user_jobs(user_id=1, mode='voxcpm2', limit=50)

# Add to history
unified_db.add_history({
    'user_id': 1,
    'job_id': 'job_123',
    'processing_mode': 'voxcpm2',
    'success': 1,
    'duration_seconds': 120.5
})

# Get statistics
stats = unified_db.get_mode_stats(user_id=1)
# Returns:
# {
#     'voxcpm2': {'total': 10, 'successful': 9, 'failed': 1, ...},
#     'elevenlabs': {'total': 5, 'successful': 5, 'failed': 0, ...},
#     'edge_tts': {'total': 20, 'successful': 20, 'failed': 0, ...}
# }
```

---

## Benefits

✅ **Centralized Management** - គ្រប់គ្រង jobs, history និង statistics នៅកន្លែងតែមួយ  
✅ **Easy Admin Control** - Admin អាចមើល និងគ្រប់គ្រង all processing modes  
✅ **Unified Statistics** - ស្ថិតិទាំងអស់នៅកន្លែងតែមួយ  
✅ **Consistent API** - API endpoints ប្រើ pattern តែមួយ  
✅ **Better Monitoring** - ងាយស្រួលក្នុងការតាមដាន និង debug  

---

## Admin Dashboard Features

Admin អាចមើល:
1. **Total Jobs by Mode:** ចំនួន jobs សរុបតាម mode (VoxCPM2, ElevenLabs, EdgeTTS)
2. **Success Rate:** អត្រាជោគជ័យនៃ jobs តាមនីមួយៗ mode
3. **Usage Duration:** រយៈពេលប្រើប្រាស់ សរុបតាម mode
4. **Recent History:** Jobs ដែលបានធ្វើថ្មីៗនេះទាំងអស់
5. **User Activity:** User activity ថាប្រើ mode អ្វីច្រើនជាងគេ

---

## Future Enhancements

🔮 **Planned:**
- Real-time job queue visualization
- Auto-retry failed jobs
- Cost tracking per mode (for paid APIs)
- Usage limits per user tier
- Scheduled jobs / batch processing
- Export history to CSV/Excel

---

**Created:** 2026-09-22  
**Version:** V2.3PRO  
**Status:** ✅ Fully Implemented
