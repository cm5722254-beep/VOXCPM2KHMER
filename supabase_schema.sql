-- Run this SQL in your Supabase SQL Editor:
-- Go to: https://supabase.com/dashboard/project/bmputjpajzcdrncrtstw/sql/new
-- Paste this script and click "RUN" (or Ctrl + Enter)

CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    tier TEXT NOT NULL DEFAULT 'free',
    premium_expires_at TIMESTAMPTZ,
    has_voxcpm_license INT DEFAULT 0,
    voxcpm_license_expires_at TIMESTAMPTZ,
    voxcpm_license_key TEXT,
    current_device_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active INT DEFAULT 1,
    last_login_at TIMESTAMPTZ,
    app_version TEXT DEFAULT 'V2.1PRO'
);

CREATE TABLE IF NOT EXISTS public.sessions (
    token TEXT PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    device_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    is_persistent INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.license_keys (
    id BIGSERIAL PRIMARY KEY,
    key_code TEXT UNIQUE NOT NULL,
    feature TEXT NOT NULL DEFAULT 'voxcpm2',
    days_valid INT NOT NULL DEFAULT 30,
    is_used INT DEFAULT 0,
    used_by_user_id BIGINT REFERENCES public.users(id),
    used_by_username TEXT,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for storing video metadata locally (not video files, just references)
CREATE TABLE IF NOT EXISTS public.video_library (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_name TEXT,
    local_path TEXT NOT NULL,
    file_size BIGINT,​
    duration FLOAT,
    thumbnail_path TEXT,
    group_id TEXT,
    group_name TEXT,
    processing_status TEXT DEFAULT 'ready',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for processing jobs with real-time progress
CREATE TABLE IF NOT EXISTS public.processing_jobs (
    id TEXT PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    video_id BIGINT REFERENCES public.video_library(id) ON DELETE SET NULL,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    progress INT DEFAULT 0,
    message TEXT,
    params JSONB,
    result JSONB,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Table for app versions and updates
CREATE TABLE IF NOT EXISTS public.app_versions (
    id BIGSERIAL PRIMARY KEY,
    version_code TEXT UNIQUE NOT NULL,
    version_name TEXT NOT NULL,
    release_date TIMESTAMPTZ DEFAULT NOW(),
    download_url TEXT,
    changelog JSONB,
    patch_size_mb FLOAT,
    is_mandatory INT DEFAULT 0,
    min_compatible_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_device_id ON public.sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_video_library_user_id ON public.video_library(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_user_id ON public.processing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON public.processing_jobs(status);

-- Table for voice library (admin can enable/disable for users)
CREATE TABLE IF NOT EXISTS public.voice_library (
    id BIGSERIAL PRIMARY KEY,
    voice_id TEXT UNIQUE NOT NULL,
    voice_name TEXT NOT NULL,
    voice_label TEXT NOT NULL,
    gender TEXT NOT NULL DEFAULT 'neutral',
    language TEXT DEFAULT 'km',
    sample_path TEXT,
    is_premium INT DEFAULT 0,
    is_admin_only INT DEFAULT 0,
    enabled_for_free INT DEFAULT 1,
    created_by_user_id BIGINT REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for user voice permissions (admin grants access)
CREATE TABLE IF NOT EXISTS public.user_voice_permissions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    voice_id TEXT NOT NULL,
    granted_by_admin_id BIGINT REFERENCES public.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(user_id, voice_id)
);

CREATE INDEX IF NOT EXISTS idx_voice_permissions_user ON public.user_voice_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_library_gender ON public.voice_library(gender);

-- Seed Master Admin Account (password: @Iam_Cheatm2)
INSERT INTO public.users (username, password_hash, salt, role, tier, created_at, is_active, app_version)
VALUES (
    'cm5722254@gmail.com',
    '3fc5ee60ff03022522866a85289bbdf3088b0e922c96a80d5f3137ea77a54884',
    '3a980f519491f1a11eecb0c2e2d94d40',
    'admin',
    'premium',
    NOW(),
    1,
    'V2.1PRO'
)
ON CONFLICT (username) DO NOTHING;

-- Seed Sample License Keys
INSERT INTO public.license_keys (key_code, feature, days_valid, is_used, created_at)
VALUES 
    ('VOX-D4F4-6A66-A7B3', 'voxcpm2', 365, 0, NOW()),
    ('VOX-VIP-LIFETIME-PRO', 'voxcpm2', 36500, 0, NOW())
ON CONFLICT (key_code) DO NOTHING;

-- Seed Initial App Version
INSERT INTO public.app_versions (version_code, version_name, release_date, changelog, patch_size_mb, is_mandatory, min_compatible_version)
VALUES (
    'V2.2PRO',
    'V2.2PRO',
    NOW(),
    '[
        {"type": "NEW", "text": "Real-time Progress Tracking - ឃើញ % Process ផ្ទាល់ក្នុង Tool ទាំងអស់"},
        {"type": "NEW", "text": "Persistent Login - Login ម្តងមិនចាំបាច់ Login ម្តងទៀតពេលបិទបើកវិញ"},
        {"type": "NEW", "text": "Local Video Storage - វីដេអូរក្សាទុកក្នុង Computer មិនធ្ងន់ Database"},
        {"type": "NEW", "text": "Auto Update System - ចុច Check Version ហើយ Install ស្វ័យប្រវត្តិ"},
        {"type": "IMPROVED", "text": "Glass UI Design - UI ស្អាតប្រើងាយជាមួយ Glass Morphism"},
        {"type": "IMPROVED", "text": "Unified Database - គ្រប់ Options ទាំង 3 ប្រើ Database តែមួយ"}
    ]'::jsonb,
    25.5,
    0,
    'V2.1PRO'
)
ON CONFLICT (version_code) DO NOTHING;

-- Seed Default Voice Library
INSERT INTO public.voice_library (voice_id, voice_name, voice_label, gender, language, is_premium, is_admin_only, enabled_for_free)
VALUES
    ('voxcpm:hang_phleung_char_2_male.mp3', 'Hang Phleung Male Lead', 'ភីកនាយក (ប្រុស)', 'male', 'km', 0, 0, 1),
    ('voxcpm:hang_phleung_char_6_female.mp3', 'Hang Phleung Female Lead', 'ភីកនាង (ស្រី)', 'female', 'km', 0, 0, 1),
    ('voxcpm:kxev_char_01_male.mp3', 'Professional Male 1', 'អ្នកនិយាយប្រុស ១', 'male', 'km', 0, 0, 1),
    ('voxcpm:kxev_char_02_female.mp3', 'Professional Female 1', 'អ្នកនិយាយស្រី ១', 'female', 'km', 0, 0, 1),
    ('voxcpm:main_lead_male.mp3', 'Main Male Voice', 'សំឡេងប្រុសចម្បង', 'male', 'km', 0, 0, 1),
    ('voxcpm:main_lead_female.mp3', 'Main Female Voice', 'សំឡេងស្រីចម្បង', 'female', 'km', 0, 0, 1),
    ('voxcpm:premium_male_hero.mp3', 'Premium Male Hero', 'វីរបុរសប្រុស (VIP)', 'male', 'km', 1, 0, 0),
    ('voxcpm:premium_female_heroine.mp3', 'Premium Female Heroine', 'វីរនារី (VIP)', 'female', 'km', 1, 0, 0),
    ('voxcpm:admin_narrator.mp3', 'Admin Narrator Voice', 'អ្នកនិទានរឿង (Admin)', 'neutral', 'km', 1, 1, 0)
ON CONFLICT (voice_id) DO NOTHING;
