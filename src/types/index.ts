export interface User {
  id: number;
  username: string;
  name?: string;
  email?: string;
  role: 'admin' | 'user';
  tier: 'premium' | 'free';
  premium_expires_at?: string | null;
  has_voxcpm_license?: boolean | number;
  voxcpm_license_expires_at?: string | null;
  voxcpm_license_key?: string | null;
  current_device_id?: string | null;
  machine_id?: string | null;
  created_at?: string;
}

export interface LicenseKey {
  id: number;
  key_code: string;
  feature: string;
  days_valid: number;
  is_used: number | boolean;
  used_by_user_id?: number | null;
  used_by_username?: string | null;
  used_at?: string | null;
  created_at?: string;
}

export interface CharacterVoice {
  id: string;
  filename: string;
  label: string;
  role_key?: string;
  gender: 'male' | 'female';
  words?: string;
  is_curated?: boolean;
  exists?: boolean;
  previewUrl?: string | null;
  sizeBytes?: number;
}

export interface TimelineSegment {
  line_index: number;
  start_time: number;
  end_time: number;
  speaker_id?: string;
  speaker_name?: string;
  speaker_role?: string;
  gender?: 'male' | 'female';
  voiceId?: string;
  voiceFilename?: string;
  voiceLabel?: string;
  chinese_text?: string;
  khmer_translation?: string;
  audioUrl?: string | null;
  movieVoiceSample?: string | null;
  status?: string;
  // Emotional voice parameters
  emotion?: string;
  emotionIntensity?: number;
  emotionParams?: any;
  intensity?: number;
  volume?: number;
  speed?: number;
  pitch?: number;
  breathiness?: number;
  raspiness?: number;
  vibrato?: number;
  audio_tag?: string; // e.g. 'action', 'whisper', 'shout', 'cry', 'laugh'
  is_thought?: boolean; // Inner monologue / thought bubble
  text?: string; // Alias for display text (khmer_translation fallback)
}

export interface ProjectFile {
  id?: string;
  filename: string;
  originalName?: string;
  size: number;
  type?: 'video' | 'audio' | string;
  created?: number;
  url: string;
  duration?: number;
  uploadedAt?: string;
}

export interface StudioConfig {
  hasElevenlabs: boolean;
  hasGemini: boolean;
  geminiModel: string;
  hasVoxcpmUrl: boolean;
  voxcpmUrl: string;
  cloudUrl: string;
  mode: string;
  port: number;
}

export interface VoxcpmStatus {
  online: boolean;
  configured: boolean;
  mode?: string;
  isLocal?: boolean;
  url?: string;
  device?: string;
  gpuName?: string;
  message?: string;
}

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  type?: 'text' | 'logo';
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center' | 'free';
  posX?: number; // 0 to 100 percentage (free drag & drop)
  posY?: number; // 0 to 100 percentage (free drag & drop)
  opacity: number; // 10 to 100
  fontSize: number; // 10 to 72
  fontFamily: string; // 'Outfit' | 'Kantumruy Pro' | 'Koulen' | 'Moul'
  textColor: string;
  showBadge: boolean;
  logoUrl?: string;
  scale?: number;
  rotationAngle?: number;
  stylePreset?: string; // 'theatrical_gold' | 'cyber_neon' | 'glass_pill' | 'minimal_clean' | 'fire_ember' | 'hologram' | 'anime_channel' | 'silver_chrome' | 'dark_stealth' | 'gradient_rainbow'
  icon?: 'shield' | 'star' | 'flame' | 'sparkle' | 'camera' | 'tv' | 'crown' | 'none';
  glowEffect?: boolean;
}

export interface VideoStyleTextConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  badge: string;
  stylePreset: string; // supports 35+ 3D title presets
  position: 'top' | 'center' | 'bottom-left' | 'bottom-right' | 'bottom-center' | 'free';
  posX?: number; // 0 to 100 percentage (free positioning like Thumbnail)
  posY?: number; // 0 to 100 percentage (free positioning like Thumbnail)
  textAlign?: 'left' | 'center' | 'right';
  rotationAngle?: number; // -30 to 30 deg
  fontSize: number;
  subtitleFontSize?: number;
  fontFamily: string;
  showBanner: boolean;
  depth3D?: number; // 0 to 16px 3D extrusion
  glowIntensity?: number; // 0 to 30px glow/bloom
  strokeWidth?: number; // 0 to 14px outer stroke
}

export interface Effect3DPreset {
  id: string;
  label: string;
  category: '3D Spatial & Transforms' | '3D Particles & Atmosphere' | '3D Titles & Typography' | '3D Dynamic Motion & Camera';
  description: string;
  icon?: string;
  transform3d?: string;
  filter3d?: string;
  perspective?: number; // default e.g. 900
  overlayType?: 'none' | 'cyber_grid' | 'starfield' | 'embers' | 'god_rays' | 'matrix_cube' | 'anaglyph' | 'lens_flare' | 'sakura_depth' | 'snow_depth' | 'portal_ring' | 'hologram_rings';
  motionClass?: string;
  titleStylePreset?: string;
}

export interface InVideoSponsorConfig {
  enabled: boolean;
  sponsorName: string;
  tagline?: string;
  contactInfo?: string; // Phone, Telegram, ABA
  logoUrl?: string;
  position: 'bottom_banner' | 'top_banner' | 'top_right' | 'top_left' | 'floating_pill' | 'lower_third';
  stylePreset: 'theatrical_gold' | 'neon_cyan' | 'glass_blur' | 'red_breaking' | 'royal_purple' | 'amber_blaze';
  animation: 'pulse' | 'shimmer' | 'static';
  opacity?: number;
}

export interface SocialCanvasStyle {
  enabled: boolean;
  canvasRatio: '9:16' | '4:5' | '1:1' | '16:9';
  backgroundType: 'blur_video' | 'cinema_gradient' | 'neon_glow' | 'cyber_mesh' | 'dark_matte';
  blurAmount: number; // 5 to 40
  topTitle: string; // e.g. "👉 រឿងភាគថ្មីកក្រើក ភាគ០១ | CapCut Studio"
  bottomSubtitle: string; // e.g. "❤️ សូមជួយ Like & Follow ផេកផងបាទ"
  headerFontFamily?: string;
  headerTextColor?: string;
  headerBgColor?: string;
  frameBorderColor?: string;
  frameBorderWidth?: number;
}

export interface RunningTickerTextConfig {
  enabled: boolean;
  text: string; // Marquee text
  speed: 'slow' | 'medium' | 'fast';
  direction: 'left' | 'right';
  fontSize: number; // 14 to 32
  textColor: string;
  backgroundColor: string;
  position: 'bottom' | 'top' | 'above_subtitles';
  glowEffect: boolean;
  newsBadgeText?: string; // e.g. "📢 ដំណឹង", "BREAKING", "HOT"
}

export interface VideoEffects {
  brightness: number; // 50 to 150 (default 100)
  contrast: number;   // 50 to 150 (default 100)
  saturation: number; // 0 to 200 (default 100)
  sepia: number;      // 0 to 100 (default 0)
  blur: number;       // 0 to 10 (default 0)
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
  lutPreset: string;
  // Cinematic Overlays & Effects
  letterbox?: boolean; // Cinema Scope black bars 2.35:1
  vignette?: boolean;  // Darkened edges
  filmGrain?: boolean; // Authentic 35mm grain
  vhsGlitch?: boolean; // CRT scanlines
  glowBloom?: boolean; // Anime dream bloom
  colorTint?: 'none' | 'cyberpunk' | 'golden' | 'horror' | 'emerald';
  // Watermark & Copyright
  watermark?: WatermarkConfig;
  // Styled Video Title / Lower-Third
  styleText?: VideoStyleTextConfig;
  // 3D Effects Engine (100+ Presets)
  effect3dEnabled?: boolean;
  effect3dPreset?: string;
  effect3dIntensity?: number; // 0 to 100
  effect3dDepth?: number;     // 0 to 100
  // Video Zoom & Fit Scaling (Fit vs Fill)
  zoomScale?: number;         // 0.5 to 4.0 (default 1.0)
  zoomFitMode?: 'contain' | 'cover'; // 'contain' (Fit) or 'cover' (Fill/Crop black bars)
  panX?: number;
  panY?: number;
  // ── New Professional Enhancements ──
  sponsorInVideo?: InVideoSponsorConfig;
  socialCanvasStyle?: SocialCanvasStyle;
  runningTickerText?: RunningTickerTextConfig;
  // ── Poster Style Template Overlay ──
  posterTemplate?: string; // URL of selected poster template image (from posterstyle/ folder)
  posterTemplateOpacity?: number; // 10 to 100 (default 85)
  posterTemplateBlendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light'; // CSS blend mode
}

export interface SubtitleStyle {
  fontSize: number; // 14 to 48
  fontFamily: string; // 'Kantumruy Pro' | 'Battambang' | 'Moul' | 'Siemreap' | 'Outfit'
  textColor: string; // '#ffffff' | '#fef08a' etc.
  strokeColor: string; // '#000000'
  strokeWidth: number; // 0 to 6
  backgroundColor: string; // 'rgba(0,0,0,0.75)'
  boxEnabled?: boolean;
  position: 'bottom' | 'center' | 'top';
  animation: 'none' | 'pop' | 'karaoke';
  preset?: 'classic' | 'boxed' | 'glow' | 'karaoke' | 'custom';
}

export interface ProjectGroup {
  id: string;
  name: string;
  color: string; // 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose' | 'sky'
  description?: string;
  createdAt: string;
  videoCount?: number;
  maleLeadVoice?: string;
  femaleLeadVoice?: string;
  narratorVoice?: string;
  supportingVoice?: string;
}

export interface VideoShelfItem {
  id: string;
  filename: string;
  originalName: string;
  title?: string;
  size: number;
  duration?: number;
  thumbnail?: string;
  url: string;
  groupId: string;
  groupName: string;
  addedAt: string;
}

export interface HardwareProfile {
  // CPU
  cpuName?: string;
  cpuCores: number;
  cpuThreads: number;
  cpuFreqGhz?: number;
  // RAM
  ramTotalGb?: number;
  ramAvailableGb?: number;
  ramUsedPercent?: number;
  // GPU — NVIDIA + AMD Vega 64 + Intel + Apple
  gpuName?: string;
  /** GPU vendor: "nvidia" | "amd" | "intel" | "apple" | "unknown" */
  gpuVendor?: string;
  vramTotalGb?: number;
  vramFreeGb?: number;
  isNvidiaGpu?: boolean;
  /** True when an AMD Radeon / Vega GPU is detected */
  isAmdGpu?: boolean;
  /** True when torch-directml is installed and usable (AMD on Windows) */
  hasDirectml?: boolean;
  /** True when PyTorch ROCm build is available (AMD on Linux) */
  hasRocm?: boolean;
  /** VRAM in GB for AMD GPU (same as vramTotalGb when isAmdGpu=true) */
  amdVramGb?: number;
  /** Human-readable GPU status line from gpu_detect.py */
  gpuStatusLine?: string;
  // Disk
  diskTotalGb?: number;
  diskFreeGb?: number;
  diskUsedPercent?: number;
  diskType?: string;
  // OS
  os?: string;
  osVersion?: string;
  architecture?: string;
  // Video encoder
  videoEncoder: string;
  encoderLabel: string;
  isGpuAccelerated: boolean;
  // Performance
  turboConcurrency: number;
  safeBatchConcurrency?: number;
  recommendedPreset?: string;
  performanceTier?: string;
  performanceTierLabel?: string;
  hardwareTier: string;
  performanceMode: 'turbo_max' | 'balanced' | 'quality';
  // AI
  aiRecommendation?: 'LOCAL' | 'HYBRID' | 'CLOUD';
  aiRecommendationReason?: string;
}

export interface ThumbnailConfig {
  title: string;
  subtitle: string;
  badge: string;
  watermark: string;
  gradientStyle: string; // 'gold' | 'crimson' | 'cyberpunk' | 'emerald' | 'sapphire' | 'fire' | 'purple' | 'white3d' | 'rainbow'
  vignette: boolean;
  fontSize: number;
  subtitleFontSize?: number;
  aspectRatio: '16:9' | '9:16';

  // Free positioning & alignment
  posX: number; // 0 to 100 percentage
  posY: number; // 0 to 100 percentage
  textAlign: 'left' | 'center' | 'right';
  badgePosX?: number; // 0 to 100 percentage
  badgePosY?: number; // 0 to 100 percentage

  // Visual Effects
  fontFamily: string; // 'Kantumruy Pro' | 'Koulen' | 'Moul' | 'Bayon' | 'Outfit'
  effectStyle: 'gold3d' | 'neon' | 'fire' | 'sapphire' | 'horror' | 'emerald' | 'royal' | 'white3d' | 'rainbow' | 'glass';
  depth3D: number; // 0 to 20
  glowIntensity: number; // 0 to 30
  glowColor?: string;
  strokeWidth: number; // 0 to 20
  strokeColor: string;
  rotationAngle: number; // -45 to +45 deg
  bgBanner: 'none' | 'glass' | 'ribbon' | 'gradient' | 'box';
}

export interface UserThumbnailTemplate {
  id: string;
  name: string;
  createdAt: number;
  config: ThumbnailConfig;
  previewGradient?: string;
  isBuiltin?: boolean;
}

export interface VideoDownloadResult {
  success: boolean;
  filename: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
  duration?: number;
  thumbnail?: string;
  message?: string;
}

export type TabId =
  | 'tab-dashboard'
  | 'tab-shelf'
  | 'tab-groups'
  | 'tab-workflow'
  | 'tab-dubbing'
  | 'tab-offline'
  | 'tab-manual'
  | 'tab-character'
  | 'tab-translator'
  | 'tab-mixer'
  | 'tab-subtitles'
  | 'tab-voicelab'
  | 'tab-tuner'
  | 'tab-sync'
  | 'tab-aitools'
  | 'tab-sponsor'
  | 'tab-batch'
  | 'tab-smartscenes'
  | 'tab-thumbnail'
  | 'tab-cutter'
  | 'tab-posterforge'
  | 'tab-projects'
  | 'tab-classic'
  | 'tab-narrator'
  | 'tab-voiceover'
  | 'tab-batchstudio';

// ── 3 Studio Engine Options ──
export type StudioEngineOption =
  | 'voxcpm_computer' // Option 1: VOXCPM2 COMPUTER (Local RTX / PyTorch Hardware)
  | 'voxcpm_claude'   // Option 2: VOXCPM2 CLAUDE (Cloud Server / Claude AI)
  | 'khmer_offline';  // Option 3: KHMER OFFLINE (Ultra-fast Edge / Offline TTS 1-20 episodes)

// ── Offline Episode Video Item for Batch 1-20 ──
export interface OfflineEpisodeItem {
  id: string;
  episodeIndex: number; // 1 to 20
  title: string;
  filename: string;
  url?: string;
  duration?: string;
  sizeMb?: number;
  isSelected: boolean; // Ability to select or deselect
  status: 'ready' | 'processing' | 'done' | 'empty';
}

// ── Khmer Offline Batch Configuration ──
export interface KhmerOfflineConfig {
  batchEpisodes: number; // 1 to 20 episodes
  mode: 'episodes' | 'full_movie'; // Individual episodes vs Single merged full movie
  turboThreads: number; // 2, 4, 8, 16 threads
  voiceId: string;
  episodes?: OfflineEpisodeItem[]; // Batch list of 1 to 20 videos with selection
}

// ── Commercial Video / Ads Overlay Configuration ──
export interface CommercialOverlayConfig {
  enabled: boolean;
  videoUrl: string;
  originalFilename?: string;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  size: 'small' | 'medium' | 'large' | 'half';
  opacity: number; // 30 to 100
  startTime: number; // In seconds
  duration: number; // In seconds (0 = full length of ad)
  volume: number; // 0 to 100
  loop: boolean;
}

// ── Custom UI Tool Theme, Background Style & Color Glass ──
export type GlassColorPreset = 'obsidian' | 'cyan' | 'purple' | 'emerald' | 'amber' | 'sakura' | 'ice' | 'crimson';
export type BackgroundPreset =
  | 'clean_white'
  | 'pearl_snow'
  | 'ice_crystal'
  | 'warm_ivory'
  | 'slate_light'
  | 'aurora_light'
  | 'mint_light'
  | 'sakura_light'
  | 'cyberpunk'
  | 'anime_sunset'
  | 'midnight_purple'
  | 'emerald_matrix'
  | 'nebula_space'
  | 'default_dark'
  | 'custom';

export interface StudioCustomSticker {
  id: string;
  url: string;
  name: string;
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
  scale: number; // 0.5 to 2.5
  rotation: number; // -180 to 180 deg
}

export interface StudioCustomUITheme {
  wallpaperUrl?: string | null;
  wallpaperOpacity: number; // 10 to 100
  wallpaperBlur: number; // 0 to 20px
  backgroundColor?: string; // Solid or gradient color, e.g. '#ffffff' or CSS gradient
  bgMode?: 'color' | 'wallpaper'; // 'color' for clean pure solid/gradient background, 'wallpaper' for wallpaper image
  accentColor: 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose' | 'sapphire' | 'sky';
  stickers: StudioCustomSticker[];
  // ── Style Background & Color Glass ──
  glassColor?: GlassColorPreset;
  glassOpacity?: number; // 20 to 95
  glassBlur?: number; // 0 to 30px
  glassBorderGlow?: 'subtle' | 'vibrant' | 'neon';
  backgroundPreset?: BackgroundPreset;
  themeMode?: 'light' | 'dark';
}

// ════════════════════════════════════════════════════════════════
// 🎬 SPONSOR & ADVERTISEMENT STUDIO TYPES
// ════════════════════════════════════════════════════════════════
export type SponsorType =
  | 'fullscreen'
  | 'pip'
  | 'overlay'
  | 'intro'
  | 'midroll'
  | 'mid-roll'
  | 'outro'
  | 'scene';

export type SponsorPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type SponsorAnimation = 'none' | 'fade' | 'slide' | 'zoom' | 'pop' | 'ken_burns';

export interface SponsorItem {
  id: string;
  name: string;
  title?: string;
  type: SponsorType;
  mediaType: 'video' | 'image';
  mediaUrl: string;
  filename?: string;
  startTime: number;
  endTime: number;
  duration: number;
  position: SponsorPosition;
  x?: number; // Percentage or offset
  y?: number; // Percentage or offset
  scale: number; // 0.1 to 2.0 (default 1.0)
  opacity: number; // 0 to 100 (default 95)
  rotation?: number; // -180 to 180 (default 0)
  cornerRadius?: number; // 0 to 40px (default 12)
  fit: 'contain' | 'cover' | 'fill';
  fadeIn: boolean;
  fadeOut: boolean;
  animation: SponsorAnimation;
  // Audio settings
  audioMode: 'original' | 'mute' | 'custom_volume';
  volume: number; // 0 to 100
  loopVideo: boolean;
  endBehavior: 'loop' | 'freeze' | 'stretch';
  sceneIndex?: number;
}

// ════════════════════════════════════════════════════════════════
// 🐲 BATCH DUBBING STUDIO TYPES (5-10 Episodes)
// ════════════════════════════════════════════════════════════════
export type BatchEpisodeStatus =
  | 'queued'
  | 'analyzing'
  | 'translating'
  | 'generating'
  | 'syncing'
  | 'mixing'
  | 'rendering'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface BatchEpisode {
  id: string;
  episodeNumber: number; // 1 to 10
  title: string;
  filename: string;
  inputUrl: string;
  durationSeconds: number;
  status: BatchEpisodeStatus;
  progress: number; // 0 to 100
  outputVideoUrl?: string;
  errorMessage?: string;
  characterCount?: number;
  sentenceCount?: number;
  detectedLanguage?: string;
}

export interface BatchCharacterMemory {
  characterId: string;
  name: string;
  voiceId: string;
  voiceLabel: string;
  emotion: string;
  speed: number;
  pitch: number;
  pronunciationNote?: string;
}

export interface BatchTranslationMemory {
  id: string;
  sourceTerm: string;
  khmerTerm: string;
  category: 'character' | 'location' | 'skill' | 'organization' | 'weapon' | 'title';
}

export interface BatchStudioState {
  episodes: BatchEpisode[];
  characterMemory: Record<string, BatchCharacterMemory>;
  translationMemory: BatchTranslationMemory[];
  maxConcurrency: number; // 1 to 5 safe threads
  isProcessing: boolean;
  isPaused: boolean;
  activeEpisodeIndex: number;
  overallProgress: number;
}

// ════════════════════════════════════════════════════════════════
// 🧠 SMART SCENE INTELLIGENCE & SMART CUT TYPES
// ════════════════════════════════════════════════════════════════
export interface SmartScene {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  previewFrameUrl?: string;
  speakerName?: string;
  hasFace: boolean;
  isSpeaking: boolean;
  importanceScore: number; // 0 to 100
  suggestedCut: boolean;
  cutReason?: 'silence' | 'blank_frame' | 'duplicate_frame' | 'long_pause';
  status: 'keep' | 'removed';
}

export interface SmartCutProposal {
  totalOriginalDuration: number;
  projectedDuration: number;
  cutCount: number;
  scenes: SmartScene[];
}

// ════════════════════════════════════════════════════════════════
// 🚀 NEXT VERSION: ADVANCED AI DUBBING ENGINE ROADMAP TYPES
// ════════════════════════════════════════════════════════════════

export interface PipelineStageInfo {
  step: number;
  title: string;
  khmer: string;
  status: 'Ready' | 'In Development' | 'Planned';
}

export interface HardwareDiagnostic {
  tier: 'ENTRY' | 'STANDARD' | 'PERFORMANCE' | 'HIGH-END';
  cpu: {
    cores: number;
    freq_mhz: number;
    usage_percent: number;
  };
  ram: {
    total_gb: number;
    available_gb: number;
    percent_used: number;
  };
  disk: {
    drive: string;
    free_gb: number;
    low_disk_warning: boolean;
  };
  gpu: {
    name: string;
    has_cuda: boolean;
    vram_gb: number;
  };
  recommendation: string;
  recommended_safe_mode: 'FAST' | 'BALANCED' | 'SAFE' | 'QUALITY';
  max_batch_concurrency: number;
}

export interface ProviderCapabilityItem {
  provider_id: string;
  provider_name: string;
  provider_type: string;
  is_available: boolean;
  is_local: boolean;
  supports_emotions?: boolean;
  supports_speed?: boolean;
  supports_pitch?: boolean;
  supported_languages?: string[];
  version: string;
  notice?: string;
}

export interface NextVersionRoadmap {
  current_version: {
    name: string;
    version: string;
    status: string;
    khmer_announcement: string;
    english_announcement: string;
  };
  next_version: {
    name: string;
    version: string;
    status: string;
    khmer_title: string;
    english_title: string;
    khmer_description: string;
    english_description: string;
    early_access_enabled: boolean;
    pipeline_stages: PipelineStageInfo[];
    safe_modes: Record<string, {
      title: string;
      threads: number;
      crf: number;
      preset: string;
      description: string;
    }>;
    hardware_evaluation: HardwareDiagnostic;
  };
}




