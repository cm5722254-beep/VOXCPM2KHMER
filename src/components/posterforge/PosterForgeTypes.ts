// PosterForge AI — Professional Cinematic Poster Generation Types

export type PosterTypeId =
  | 'anime'
  | 'donghua'
  | 'xianxia'
  | 'wuxia'
  | 'fantasy'
  | 'action'
  | 'movie'
  | 'tv_series'
  | 'game'
  | 'character'
  | 'romance'
  | 'horror'
  | 'dark_fantasy'
  | 'cultivation'
  | 'martial_arts'
  | 'music'
  | 'event'
  | 'product_ad'
  | 'website_promo'
  | 'facebook_promo'
  | 'tiktok_cover'
  | 'youtube_thumbnail'
  | 'instagram_post'
  | 'banner'
  | 'vip_poster';

export interface PosterTypeItem {
  id: PosterTypeId;
  labelKhmer: string;
  labelEn: string;
  icon: string;
  defaultAspectRatio: PosterAspectRatio;
  promptKeyword: string;
  category: 'fiction' | 'cinema' | 'social' | 'commercial';
}

export type PosterStyleId =
  | 'cinematic'
  | 'epic_fantasy'
  | 'xianxia_heaven'
  | 'ancient_china'
  | 'chinese_ink'
  | 'golden_immortal'
  | 'dark_cultivation'
  | 'heavenly_realm'
  | 'demon_realm'
  | 'celestial_palace'
  | 'dragon_fantasy'
  | 'lightning_god'
  | 'ice_fantasy'
  | 'fire_god'
  | 'space_fantasy'
  | 'cyberpunk'
  | 'neon'
  | 'dark_horror'
  | 'royal_luxury'
  | 'minimal_luxury'
  | '3d_typography'
  | 'realistic_movie'
  | 'anime'
  | 'donghua'
  | 'manga'
  | 'manhua'
  | 'comic'
  | 'traditional_chinese'
  | 'modern_chinese'
  | 'fantasy_illustration'
  | 'ultra_realistic'
  | 'custom';

export interface PosterStyleItem {
  id: PosterStyleId;
  labelKhmer: string;
  labelEn: string;
  gradient: string;
  promptExpansion: string;
  lightingSuggestion: PosterLightingId;
}

export type PosterCompositionId =
  | 'char_center'
  | 'char_left'
  | 'char_right'
  | 'multi_char'
  | 'closeup_portrait'
  | 'full_body'
  | 'wide_cinematic'
  | 'battle_scene'
  | 'flying_char'
  | 'walking_char'
  | 'sitting_char'
  | 'hero_pose'
  | 'villain_pose'
  | 'group_poster';

export interface PosterCompositionItem {
  id: PosterCompositionId;
  labelKhmer: string;
  labelEn: string;
  promptTag: string;
}

export type PosterLightingId =
  | 'golden_light'
  | 'moon_light'
  | 'sunrise'
  | 'sunset'
  | 'heavenly_light'
  | 'blue_lightning'
  | 'red_fire'
  | 'purple_energy'
  | 'white_divine'
  | 'dark_shadow'
  | 'neon_light'
  | 'volumetric'
  | 'rim_light'
  | 'back_light'
  | 'god_ray';

export interface PosterLightingItem {
  id: PosterLightingId;
  labelKhmer: string;
  labelEn: string;
  colorHex: string;
  promptTag: string;
}

export type PosterColorGradeId =
  | 'gold'
  | 'blue'
  | 'red'
  | 'purple'
  | 'white'
  | 'black'
  | 'cyan'
  | 'orange'
  | 'silver'
  | 'emerald';

export type PosterMoodId =
  | 'cinematic'
  | 'high_contrast'
  | 'soft'
  | 'dark'
  | 'vibrant'
  | 'luxury'
  | 'fantasy'
  | 'ancient'
  | 'cold'
  | 'warm';

export type PosterAspectRatio =
  | '1:1'
  | '4:5'
  | '3:4'
  | '2:3'
  | '9:16'
  | '16:9'
  | '21:9';

export interface AspectRatioPreset {
  id: PosterAspectRatio;
  label: string;
  platform: string;
  ratio: number; // width / height
  width: number;
  height: number;
}

export type PosterResolution = '512' | '1024' | '1536' | '2048' | '4k';

export type Typography3DEffect =
  | 'gold_3d'
  | 'silver_3d'
  | 'diamond_3d'
  | 'fire'
  | 'ice'
  | 'lightning'
  | 'neon'
  | 'glow'
  | 'metallic'
  | 'stone'
  | 'ancient_gold'
  | 'magic_energy'
  | 'glass';

export type TitlePositionMode =
  | 'bottom'
  | 'top'
  | 'center'
  | 'vertical_left'
  | 'vertical_right'
  | 'circular'
  | 'logo_style'
  | 'free';

export interface PosterTypographyConfig {
  mainTitle: string;
  subtitle: string;
  tagline: string;
  badgeText: string; // e.g. "3D", "ភាគ ១", "VIP", "HD"
  episodeNumber?: string;
  seasonNumber?: string;
  releaseDate?: string;
  websiteUrl?: string;

  // Visual styling
  effect: Typography3DEffect;
  fontFamily: 'Koulen' | 'Moul' | 'Bayon' | 'Kantumruy Pro' | 'Cinzel' | 'Inter';
  fontSize: number; // in px
  subtitleFontSize: number;
  letterSpacing: number;
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right';
  rotation: number;

  // Position
  positionMode: TitlePositionMode;
  posX: number; // 0-100 percentage
  posY: number; // 0-100 percentage

  // Ornate Embellishments
  showOrnateCrest: boolean;
  crestType: 'sword_wings' | 'golden_shield' | 'dragon_seal' | 'celestial_ring' | 'none';
  showBadge: boolean;
  glowIntensity: number; // 0-100
  depth3D: number; // 0-20
}

export interface PosterReferenceConfig {
  characterImage?: string | null;
  costumeImage?: string | null;
  backgroundImage?: string | null;
  poseImage?: string | null;
  logoImage?: string | null;

  // Influences 0-100
  faceSimilarity: number;
  characterSimilarity: number;
  styleStrength: number;
  backgroundInfluence: number;
  poseInfluence: number;
  colorInfluence: number;
}

export interface PosterBrandingConfig {
  logoUrl?: string | null;
  watermarkText: string;
  watermarkPosition: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'center';
  watermarkOpacity: number; // 0-100
  facebookHandle?: string;
  telegramHandle?: string;
  tiktokHandle?: string;
  youtubeHandle?: string;
  website?: string;
}

export interface PosterSmartOverlay {
  id: string;
  type:
    | 'dragon'
    | 'sword'
    | 'magic_energy'
    | 'lightning'
    | 'fire'
    | 'particles'
    | 'clouds'
    | 'palace'
    | 'mountains'
    | 'moon'
    | 'godrays';
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: 'screen' | 'overlay' | 'lighten' | 'normal' | 'color-dodge';
  scale: number;
  posX: number;
  posY: number;
}

export interface PosterVariation {
  id: string;
  seed: number;
  imageUrl: string;
  thumbnailUrl?: string;
  prompt: string;
  negativePrompt: string;
  composition: PosterCompositionId;
  lighting: PosterLightingId;
  cameraAngle: string;
  createdAt: string;
}

export interface PosterProject {
  id: string;
  title: string;
  type: PosterTypeId;
  style: PosterStyleId;
  customStylePrompt?: string;
  userPrompt: string;
  finalExpandedPrompt: string;
  negativePrompt: string;
  composition: PosterCompositionId;
  lighting: PosterLightingId[];
  colorGrade: PosterColorGradeId;
  mood: PosterMoodId;
  aspectRatio: PosterAspectRatio;
  resolution: PosterResolution;
  activeImageUrl: string;
  variations: PosterVariation[];
  activeVariationIndex: number;
  typography: PosterTypographyConfig;
  references: PosterReferenceConfig;
  branding: PosterBrandingConfig;
  overlays: PosterSmartOverlay[];
  isUpscaled4k?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AIImageProviderType = 'pollinations_flux' | 'gemini_imagen' | 'stable_diffusion' | 'custom_api';

export interface AIProviderSettings {
  activeProvider: AIImageProviderType;
  geminiApiKey?: string;
  geminiModel?: string;
  sdApiUrl?: string;
  customApiUrl?: string;
  customApiKey?: string;
  defaultResolution: PosterResolution;
  generationCount: number; // 1 to 4
  maxGenerationsPerDay: number;
  enable4KUpscale: boolean;
}
