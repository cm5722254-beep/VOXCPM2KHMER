import React, { useState } from 'react';
import {
  Palette,
  Image as ImageIcon,
  Sparkles,
  Smile,
  Upload,
  Trash2,
  RotateCcw,
  AlertTriangle,
  CheckSquare,
  Square,
  X,
  CheckCircle2,
  Sun,
  Layers,
  Pipette,
  Sliders,
  Check,
} from 'lucide-react';
import {
  StudioCustomUITheme,
  StudioCustomSticker,
  GlassColorPreset,
  BackgroundPreset,
} from '../../types';

interface StudioCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: StudioCustomUITheme;
  onChangeTheme: (theme: StudioCustomUITheme) => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export interface WallpaperItem {
  id: string;
  name: string;
  preview: string;
  url: string;
  isCustom?: boolean;
}

export interface ColorPresetItem {
  id: BackgroundPreset;
  name: string;
  khName: string;
  color: string;
  description: string;
  textColor: string;
  isDark?: boolean;
}

const DEFAULT_PRESET_WALLPAPERS: WallpaperItem[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon City',
    preview: '🌃',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=2560&q=95&auto=format&fit=crop',
  },
  {
    id: 'anime_sunset',
    name: 'Anime Sunset Tokyo Sky',
    preview: '🌅',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=2560&q=95&auto=format&fit=crop',
  },
  {
    id: 'midnight_purple',
    name: 'Midnight Purple Nebula',
    preview: '🌌',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=2560&q=95&auto=format&fit=crop',
  },
  {
    id: 'emerald_matrix',
    name: 'Emerald Forest Shrine',
    preview: '🌲',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=2560&q=95&auto=format&fit=crop',
  },
  {
    id: 'studio_dark',
    name: 'Carbon Stealth Dark',
    preview: '🖤',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=2560&q=95&auto=format&fit=crop',
  },
];

const PRESET_BACKGROUND_COLORS: ColorPresetItem[] = [
  {
    id: 'pearl_snow',
    name: 'Pearl Snow Light (Eye Friendly)',
    khName: '🥛 ពណ៌សគុជខ្យង (ណែនាំពិសេស - ស្រទន់ភ្នែក)',
    color: '#f8fafc',
    description: 'ស្រទន់ភ្នែក មិនចាំងភ្នែក មិនសរខ្លាំងពេក មើលអក្សរ និងប៊ូតុងច្បាស់ល្អបំផុត',
    textColor: '#0f172a',
  },
  {
    id: 'clean_white',
    name: 'Pure Clean White',
    khName: '⚪ ពណ៌សសុទ្ធ (ភ្លឺច្បាស់)',
    color: '#ffffff',
    description: 'ពណ៌សសុទ្ធ ភ្លឺច្បាស់ល្អបែប Studio Canvas',
    textColor: '#0f172a',
  },
  {
    id: 'ice_crystal',
    name: 'Ice Crystal White',
    khName: '💎 ពណ៌សទឹកកក',
    color: '#f0f7ff',
    description: 'ពណ៌សលាយខៀវស្រាល ស្រស់ថ្លា បែប Luxury Studio',
    textColor: '#0f172a',
  },
  {
    id: 'warm_ivory',
    name: 'Warm Ivory Linen',
    khName: '🌾 ពណ៌សក្រែម',
    color: '#fafaf9',
    description: 'ពណ៌បែបកក់ក្តៅ ទន់ភ្លន់ និងប្រណិត',
    textColor: '#0f172a',
  },
  {
    id: 'slate_light',
    name: 'Studio Slate Light',
    khName: '🌫️ ពណ៌ Slate ស្រាល',
    color: '#f1f5f9',
    description: 'ពណ៌ប្រផេះស្រាលបែប Executive Studio អាជីព',
    textColor: '#0f172a',
  },
  {
    id: 'sakura_light',
    name: 'Soft Sakura Pink',
    khName: '🌸 ពណ៌ផ្កាឈូកស្រាល',
    color: '#fdf2f8',
    description: 'ពណ៌ស្រាលបែប anime ស្រទន់ និងទាក់ទាញ',
    textColor: '#0f172a',
  },
  {
    id: 'mint_light',
    name: 'Fresh Mint Green',
    khName: '🌿 ពណ៌បៃតងស្រាល',
    color: '#f0fdf4',
    description: 'ពណ៌ស្រស់ថ្លា បន្ធូរអារម្មណ៍ និងភ្នែកពេលធ្វើការយូរ',
    textColor: '#0f172a',
  },
  {
    id: 'aurora_light',
    name: 'Aurora Pastel Gradient',
    khName: '🌈 ពណ៌ឥន្ធនូស្រាល',
    color: 'linear-gradient(135deg, #f0f9ff 0%, #fdf4ff 50%, #f0fdf4 100%)',
    description: 'ពណ៌ឥន្ធនូស្រាលបែប Pastel ស្រស់ស្អាតទំនើប',
    textColor: '#0f172a',
  },
  {
    id: 'default_dark',
    name: 'Stealth Dark Pro',
    khName: '🖤 ពណ៌ងងឹត Pro',
    color: '#0f172a',
    description: 'សម្រាប់អ្នកដែលចូលចិត្តរបៀប Dark Mode ងងឹត',
    textColor: '#f8fafc',
    isDark: true,
  },
];

const PRESET_GLASS_COLORS: {
  id: GlassColorPreset;
  name: string;
  badge: string;
  tintRgba: string;
  borderRgba: string;
  glowShadow: string;
  accentHex: string;
}[] = [
  {
    id: 'ice',
    name: '❄️ Glacier Ice (ណែនាំសម្រាប់ពណ៌ស)',
    badge: 'FROST BLUE',
    tintRgba: 'rgba(240, 249, 255, 0.85)',
    borderRgba: 'rgba(56, 189, 248, 0.35)',
    glowShadow: '0 0 20px rgba(56, 189, 248, 0.15)',
    accentHex: '#0284c7',
  },
  {
    id: 'cyan',
    name: '💎 Cyan Crystal Glass',
    badge: 'CYAN CRYSTAL',
    tintRgba: 'rgba(236, 254, 255, 0.85)',
    borderRgba: 'rgba(6, 182, 212, 0.35)',
    glowShadow: '0 0 20px rgba(6, 182, 212, 0.15)',
    accentHex: '#0891b2',
  },
  {
    id: 'purple',
    name: '🌸 Sakura Purple Glass',
    badge: 'ANIME VIOLET',
    tintRgba: 'rgba(250, 245, 255, 0.85)',
    borderRgba: 'rgba(168, 85, 247, 0.35)',
    glowShadow: '0 0 20px rgba(168, 85, 247, 0.15)',
    accentHex: '#9333ea',
  },
  {
    id: 'amber',
    name: '🍯 Amber Gold Glass',
    badge: 'WARM GOLD',
    tintRgba: 'rgba(254, 252, 232, 0.85)',
    borderRgba: 'rgba(245, 158, 11, 0.35)',
    glowShadow: '0 0 20px rgba(245, 158, 11, 0.15)',
    accentHex: '#d97706',
  },
  {
    id: 'emerald',
    name: '🍃 Frosted Emerald Glass',
    badge: 'BIO MATRIX',
    tintRgba: 'rgba(236, 253, 245, 0.85)',
    borderRgba: 'rgba(16, 185, 129, 0.35)',
    glowShadow: '0 0 20px rgba(16, 185, 129, 0.15)',
    accentHex: '#059669',
  },
  {
    id: 'crimson',
    name: '🩸 Crimson Rose Glass',
    badge: 'ROSE RED',
    tintRgba: 'rgba(255, 241, 242, 0.85)',
    borderRgba: 'rgba(244, 63, 94, 0.35)',
    glowShadow: '0 0 20px rgba(244, 63, 94, 0.15)',
    accentHex: '#e11d48',
  },
  {
    id: 'obsidian',
    name: '🖤 Dark Obsidian Smoke',
    badge: 'STEALTH PRO',
    tintRgba: 'rgba(15, 23, 42, 0.85)',
    borderRgba: 'rgba(255, 255, 255, 0.15)',
    glowShadow: '0 0 25px rgba(0, 0, 0, 0.5)',
    accentHex: '#64748b',
  },
];

const PRESET_STICKERS = [
  { name: '🔥 Fire Flame', url: '🔥' },
  { name: '👑 Royal Crown', url: '👑' },
  { name: '⚔️ Katana Blade', url: '⚔️' },
  { name: '🌸 Cherry Blossom', url: '🌸' },
  { name: '⚡ Lightning Zap', url: '⚡' },
  { name: '✨ Anime Sparkle', url: '✨' },
  { name: '🐉 Dragon Spirit', url: '🐉' },
  { name: '🤖 Cyber AI', url: '🤖' },
];

export const StudioCustomizerModal: React.FC<StudioCustomizerModalProps> = ({
  isOpen,
  onClose,
  theme,
  onChangeTheme,
  onShowToast,
}) => {
  const [localTheme, setLocalTheme] = useState<StudioCustomUITheme>(() => ({
    ...theme,
    backgroundColor: theme.backgroundColor || '#ffffff',
    bgMode: theme.bgMode || (theme.wallpaperUrl ? 'wallpaper' : 'color'),
    glassColor: theme.glassColor || 'ice',
    glassOpacity: theme.glassOpacity !== undefined ? theme.glassOpacity : 85,
    glassBlur: theme.glassBlur !== undefined ? theme.glassBlur : 12,
    glassBorderGlow: theme.glassBorderGlow || 'subtle',
  }));

  const [activeTab, setActiveTab] = useState<'color' | 'wallpaper' | 'glass' | 'stickers'>('color');

  // Custom and preset wallpapers list in state
  const [customWallpapers, setCustomWallpapers] = useState<WallpaperItem[]>(() => {
    try {
      const saved = localStorage.getItem('animestudio_custom_wallpapers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [presets, setPresets] = useState<WallpaperItem[]>(() => {
    try {
      const saved = localStorage.getItem('animestudio_preset_wallpapers');
      return saved ? JSON.parse(saved) : DEFAULT_PRESET_WALLPAPERS;
    } catch {
      return DEFAULT_PRESET_WALLPAPERS;
    }
  });

  // Selected wallpaper IDs for batch actions (Select & Delete)
  const [selectedWallpaperIds, setSelectedWallpaperIds] = useState<string[]>([]);
  const [customHexInput, setCustomHexInput] = useState<string>('#ffffff');

  if (!isOpen) return null;

  const updateTheme = (updated: StudioCustomUITheme) => {
    setLocalTheme(updated);
    onChangeTheme(updated);
    try {
      localStorage.setItem('animestudio_custom_theme', JSON.stringify(updated));
    } catch {}
  };

  // 1-Click Set Soft Pearl White Studio (Eye-Friendly Recommended)
  const handleSetSoftPearlWhite = () => {
    const updated: StudioCustomUITheme = {
      ...localTheme,
      backgroundColor: '#f8fafc',
      bgMode: 'color',
      backgroundPreset: 'pearl_snow',
      glassColor: 'ice',
      accentColor: 'sky',
    };
    updateTheme(updated);
    onShowToast?.('🥛 បានដាក់ពណ៌សគុជខ្យង ស្រទន់ភ្នែក (Pearl Snow Soft White) ជោគជ័យ!', 'success');
  };

  // 1-Click Set Pure Clean White Studio
  const handleSetPureCleanWhite = () => {
    const updated: StudioCustomUITheme = {
      ...localTheme,
      backgroundColor: '#ffffff',
      bgMode: 'color',
      backgroundPreset: 'clean_white',
      glassColor: 'ice',
      accentColor: 'sky',
    };
    updateTheme(updated);
    onShowToast?.('⚪ បានដាក់ពណ៌សស្អាតសុទ្ធ (Clean Pure White Studio) ជោគជ័យ!', 'success');
  };

  // Select Solid Color Preset
  const handleSelectColorPreset = (preset: ColorPresetItem) => {
    const updated: StudioCustomUITheme = {
      ...localTheme,
      backgroundColor: preset.color,
      bgMode: 'color',
      backgroundPreset: preset.id,
      accentColor: preset.isDark ? 'cyan' : 'sky',
    };
    updateTheme(updated);
    onShowToast?.(`✨ បានកំណត់ពណ៌ផ្ទៃខាងក្រោយ "${preset.khName}"!`, 'success');
  };

  // Apply custom hex color
  const handleApplyCustomHex = (color: string) => {
    setCustomHexInput(color);
    const updated: StudioCustomUITheme = {
      ...localTheme,
      backgroundColor: color,
      bgMode: 'color',
      backgroundPreset: 'custom',
    };
    updateTheme(updated);
  };

  // Upload Custom Wallpaper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const newId = `custom_${Date.now()}`;
      const newItem: WallpaperItem = {
        id: newId,
        name: file.name.replace(/\.[^/.]+$/, '').substring(0, 24) || 'Custom Wallpaper',
        preview: '🖼️',
        url: base64,
        isCustom: true,
      };

      const updatedList = [newItem, ...customWallpapers];
      setCustomWallpapers(updatedList);
      localStorage.setItem('animestudio_custom_wallpapers', JSON.stringify(updatedList));

      const updatedTheme: StudioCustomUITheme = {
        ...localTheme,
        wallpaperUrl: base64,
        bgMode: 'wallpaper',
        backgroundPreset: 'custom',
        wallpaperOpacity: localTheme.wallpaperOpacity ? Math.max(localTheme.wallpaperOpacity, 80) : 85,
        wallpaperBlur: 0,
      };
      updateTheme(updatedTheme);
      onShowToast?.(`🎉 បានដាក់រូប Wallpaper ផ្ទាល់ខ្លួនជោគជ័យ!`, 'success');
    };
    reader.readAsDataURL(file);
  };

  // Select Wallpaper
  const handleSelectWallpaper = (url: string | null, presetId?: BackgroundPreset) => {
    if (!url) {
      // Switch to soft pearl white color mode, keeping wallpaperUrl stored
      const updated: StudioCustomUITheme = {
        ...localTheme,
        bgMode: 'color',
        backgroundColor: localTheme.backgroundColor || '#f8fafc',
        backgroundPreset: 'pearl_snow',
      };
      updateTheme(updated);
      onShowToast?.('✨ បានដោះ Wallpaper ចេញ (ប្ដូរទៅពណ៌សស្រទន់ Pearl Snow)!', 'info');
      return;
    }

    const updated: StudioCustomUITheme = {
      ...localTheme,
      wallpaperUrl: url,
      bgMode: 'wallpaper',
      backgroundPreset: presetId || 'custom',
      wallpaperOpacity: localTheme.wallpaperOpacity ? Math.max(localTheme.wallpaperOpacity, 80) : 85,
      wallpaperBlur: 0,
    };
    updateTheme(updated);
    onShowToast?.('🖼️ បានប្ដូររូប Wallpaper ថ្មីច្បាស់ត្រជាក់ភ្នែក!', 'success');
  };

  const allWallpapers = [...customWallpapers, ...presets];

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedWallpaperIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allIds = allWallpapers.map((w) => w.id);
    setSelectedWallpaperIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedWallpaperIds([]);
  };

  const handleDeleteSelected = () => {
    if (selectedWallpaperIds.length === 0) return;

    if (!window.confirm(`តើអ្នកពិតជាចង់លុប Wallpaper ចំនួន ${selectedWallpaperIds.length} ដែលបាន Select មែនទេ?`)) {
      return;
    }

    const selectedUrls = allWallpapers
      .filter((w) => selectedWallpaperIds.includes(w.id))
      .map((w) => w.url);

    const newCustomList = customWallpapers.filter((w) => !selectedWallpaperIds.includes(w.id));
    setCustomWallpapers(newCustomList);
    localStorage.setItem('animestudio_custom_wallpapers', JSON.stringify(newCustomList));

    const newPresetsList = presets.filter((w) => !selectedWallpaperIds.includes(w.id));
    setPresets(newPresetsList);
    localStorage.setItem('animestudio_preset_wallpapers', JSON.stringify(newPresetsList));

    if (localTheme.wallpaperUrl && selectedUrls.includes(localTheme.wallpaperUrl)) {
      handleSelectWallpaper(null);
    }

    setSelectedWallpaperIds([]);
    onShowToast?.(`🗑️ បានលុប Background ចំនួន ${selectedWallpaperIds.length} រួចរាល់!`, 'info');
  };

  const handleDeleteAllWallpapers = () => {
    if (!window.confirm('តើអ្នកចង់លុប Wallpaper ទាំងអស់ និងកំណត់ទៅពណ៌សស្អាត (Clean White Studio) មែនទេ?')) {
      return;
    }

    setCustomWallpapers([]);
    localStorage.removeItem('animestudio_custom_wallpapers');
    handleSelectWallpaper(null);
    setSelectedWallpaperIds([]);
    onShowToast?.('✨ បានលុប Wallpaper ចេញទាំងអស់ (Clean White Studio)!', 'warning');
  };

  const handleDeleteSingle = (id: string, url: string, isCustom: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCustom) {
      const updated = customWallpapers.filter((w) => w.id !== id);
      setCustomWallpapers(updated);
      localStorage.setItem('animestudio_custom_wallpapers', JSON.stringify(updated));
    } else {
      const updated = presets.filter((w) => w.id !== id);
      setPresets(updated);
      localStorage.setItem('animestudio_preset_wallpapers', JSON.stringify(updated));
    }

    setSelectedWallpaperIds((prev) => prev.filter((item) => item !== id));

    if (localTheme.wallpaperUrl === url) {
      handleSelectWallpaper(null);
    }
    onShowToast?.('បានលុប Wallpaper មួយនេះរួចរាល់', 'info');
  };

  const handleResetDefaultPresets = () => {
    setPresets(DEFAULT_PRESET_WALLPAPERS);
    localStorage.removeItem('animestudio_preset_wallpapers');
    onShowToast?.('បានដាក់គំរូ Wallpaper ដើមឡើងវិញ!', 'success');
  };

  const handleSelectGlassColor = (glassId: GlassColorPreset) => {
    const updated: StudioCustomUITheme = {
      ...localTheme,
      glassColor: glassId,
    };
    updateTheme(updated);
    onShowToast?.(`✨ បានប្ដូរ Color Glass ទៅ ${glassId.toUpperCase()}!`, 'success');
  };

  const handleAddEmojiSticker = (emoji: string, name: string) => {
    const newSticker: StudioCustomSticker = {
      id: `sticker_${Date.now()}`,
      url: emoji,
      name,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      scale: 1.5,
      rotation: (Math.random() - 0.5) * 30,
    };

    const updated: StudioCustomUITheme = {
      ...localTheme,
      stickers: [...localTheme.stickers, newSticker],
    };
    updateTheme(updated);
    onShowToast?.(`បានបន្ថែម Sticker ${emoji}!`, 'success');
  };

  const handleRemoveSticker = (id: string) => {
    const updated: StudioCustomUITheme = {
      ...localTheme,
      stickers: localTheme.stickers.filter((s) => s.id !== id),
    };
    updateTheme(updated);
  };

  const handleResetTheme = () => {
    const defaultTheme: StudioCustomUITheme = {
      wallpaperUrl: null,
      wallpaperOpacity: 90,
      wallpaperBlur: 0,
      backgroundColor: '#ffffff',
      bgMode: 'color',
      accentColor: 'sky',
      stickers: [],
      glassColor: 'ice',
      glassOpacity: 85,
      glassBlur: 12,
      glassBorderGlow: 'subtle',
      backgroundPreset: 'clean_white',
    };
    updateTheme(defaultTheme);
    localStorage.removeItem('animestudio_custom_theme');
    onShowToast?.('បានកំណត់រចនាបថស្ទូឌីយោទៅពណ៌សស្អាតសុទ្ធ (Clean White Default)!', 'info');
  };

  const isColorModeActive = localTheme.bgMode === 'color' || !localTheme.wallpaperUrl;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none font-khmer animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* ── Modal Header ── */}
        <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-sky-500/25">
              <Palette className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 tracking-wide">
                  🎨 ប្ដូរពណ៌ផ្ទៃខាងក្រោយ & WALLPAPER
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
                  STUDIO THEME
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                កំណត់ផ្ទៃខាងក្រោយពណ៌សស្អាត (Clean White) ងាយស្រួលយល់ និងប្រើប្រាស់ ឬប្ដូរ Wallpaper 4K
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-200 text-slate-500 flex items-center justify-center transition-all active:scale-95"
            title="បិទផ្ទាំង (Close)"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* ── Quick Mode Toggle: Wallpaper vs Soft Color ── */}
        <div className="px-6 py-2.5 bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">របៀបផ្ទៃខាងក្រោយកំពុងប្រើ:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black shadow-2xs ${
              localTheme.bgMode === 'wallpaper'
                ? 'bg-indigo-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}>
              {localTheme.bgMode === 'wallpaper' ? '🖼️ ផ្ទាំងរូបភាព Wallpaper 4K' : '🎨 ពណ៌ស្រទន់ Soft Color'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const targetUrl = localTheme.wallpaperUrl || DEFAULT_PRESET_WALLPAPERS[0].url;
                const updated: StudioCustomUITheme = {
                  ...localTheme,
                  bgMode: 'wallpaper',
                  wallpaperUrl: targetUrl,
                };
                updateTheme(updated);
                setActiveTab('wallpaper');
                onShowToast?.('🖼️ បានប្ដូរទៅប្រើ Wallpaper 4K!', 'success');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5 ${
                localTheme.bgMode === 'wallpaper'
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>បើកប្រើ Wallpaper</span>
            </button>
            <button
              onClick={() => {
                const updated: StudioCustomUITheme = {
                  ...localTheme,
                  bgMode: 'color',
                  backgroundColor: localTheme.backgroundColor || '#f8fafc',
                  backgroundPreset: localTheme.backgroundPreset || 'pearl_snow',
                };
                updateTheme(updated);
                setActiveTab('color');
                onShowToast?.('🥛 បានប្ដូរមកប្រើពណ៌សគុជខ្យង ស្រទន់ភ្នែក!', 'success');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5 ${
                localTheme.bgMode === 'color'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>ប្ដូរមកពណ៌ស្រទន់ (Pearl Snow)</span>
            </button>
          </div>
        </div>

        {/* ── Modal Tabs Bar ── */}
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('color')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'color'
                ? 'bg-white text-sky-800 border border-slate-300/80 shadow-xs ring-1 ring-sky-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-sky-600" />
            <span>🎨 ពណ៌ផ្ទៃខាងក្រោយ (COLOR - ស្រទន់ភ្នែក)</span>
          </button>

          <button
            onClick={() => setActiveTab('wallpaper')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'wallpaper'
                ? 'bg-white text-sky-800 border border-slate-300/80 shadow-xs ring-1 ring-sky-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>🖼️ WALLPAPER 4K & UPLOAD ({allWallpapers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('glass')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'glass'
                ? 'bg-white text-sky-800 border border-slate-300/80 shadow-xs ring-1 ring-sky-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>💎 COLOR GLASS (កញ្ចក់ពណ៌)</span>
          </button>

          <button
            onClick={() => setActiveTab('stickers')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'stickers'
                ? 'bg-white text-sky-800 border border-slate-300/80 shadow-xs ring-1 ring-sky-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Smile className="w-3.5 h-3.5 text-pink-500" />
            <span>⭐ STICKERS ({localTheme.stickers.length})</span>
          </button>
        </div>

        {/* ── Modal Body Content ── */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-5 text-xs bg-slate-50/50">
          {/* ═══════════ TAB 1: BACKGROUND COLOR (CLEAN WHITE) ═══════════ */}
          {activeTab === 'color' && (
            <div className="flex flex-col gap-4">
              {/* Highlight Hero Card: One-Click Light vs Night Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ☀️ Light Mode Studio (Soft Pearl Snow) */}
                <div
                  onClick={() => {
                    handleSetSoftPearlWhite();
                    localStorage.setItem('animestudio_theme_mode', 'light');
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                    onShowToast?.('🥛 បានកំណត់ស្ទូឌីយោទៅ Light Mode (ពណ៌សគុជខ្យង ស្រទន់ភ្នែក)!', 'success');
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 shadow-xs hover:shadow-md ${
                    localTheme.themeMode === 'light' || (!localTheme.themeMode && (localTheme.backgroundColor === '#f8fafc' || localTheme.backgroundPreset === 'pearl_snow'))
                      ? 'bg-gradient-to-r from-amber-50/80 via-white to-sky-50 border-amber-400 ring-2 ring-amber-400/40'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl shadow-xs shrink-0">
                      🥛
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 text-sm">Light Mode (ស្រទន់ភ្នែក)</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ណែនាំពិសេស
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        ពណ៌សគុជខ្យង ស្រទន់ភ្នែក មិនចាំងភ្នែក មើលអក្សរច្បាស់បំផុត
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xs shrink-0"
                  >
                    ជ្រើសរើស
                  </button>
                </div>

                {/* 🌙 Night Mode Studio */}
                <div
                  onClick={() => {
                    const darkTheme: StudioCustomUITheme = {
                      ...localTheme,
                      bgMode: 'color',
                      wallpaperUrl: null,
                      backgroundColor: '#0b0f19',
                      backgroundPreset: 'default_dark',
                      themeMode: 'dark',
                    };
                    updateTheme(darkTheme);
                    localStorage.setItem('animestudio_theme_mode', 'dark');
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                    onShowToast?.('🌙 បានកំណត់ស្ទូឌីយោទៅ Night Mode (ពណ៌ងងឹតត្រជាក់ភ្នែក)!', 'info');
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 shadow-xs hover:shadow-md ${
                    localTheme.themeMode === 'dark' || localTheme.backgroundColor === '#0b0f19'
                      ? 'bg-gradient-to-r from-slate-900 via-[#0b0f19] to-indigo-950 border-indigo-500 ring-2 ring-indigo-500/40 text-white'
                      : 'bg-slate-900 text-white hover:bg-slate-800 border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-700 flex items-center justify-center text-2xl shadow-xs shrink-0">
                      🌙
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-white text-sm">Night Mode (ងងឹត)</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700">
                          ត្រជាក់ភ្នែក
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        ផ្ទៃខាងក្រោយងងឹត អក្សរភ្លឺច្បាស់ មិនចាំងភ្នែកពេលយប់
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-xs shrink-0"
                  >
                    ជ្រើសរើស
                  </button>
                </div>
              </div>

              {/* Mode Indicator & Active Background Status */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">របៀបបច្ចុប្បន្ន:</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                    isColorModeActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-purple-50 text-purple-800 border border-purple-200'
                  }`}>
                    {isColorModeActive ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>🎨 របៀបពណ៌សុទ្ធ (Solid Color Mode)</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        <span>🖼️ របៀប Wallpaper Image</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateTheme({
                        ...localTheme,
                        bgMode: 'color',
                        wallpaperUrl: null,
                      });
                      onShowToast?.('បានបើករបៀបពណ៌សុទ្ធ (Solid Color Mode)', 'info');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isColorModeActive
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    🎨 ប្រើពណ៌សុទ្ធ
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!localTheme.wallpaperUrl && presets.length > 0) {
                        handleSelectWallpaper(presets[0].url, presets[0].id as any);
                      } else {
                        updateTheme({ ...localTheme, bgMode: 'wallpaper' });
                      }
                      setActiveTab('wallpaper');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      !isColorModeActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    🖼️ ប្រើ Wallpaper
                  </button>
                </div>
              </div>

              {/* Color Preset Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2.5">
                  ជ្រើសរើសពណ៌គំរូស្អាតៗ (Clean Studio Color Presets):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {PRESET_BACKGROUND_COLORS.map((c) => {
                    const isActive =
                      isColorModeActive &&
                      (localTheme.backgroundPreset === c.id ||
                        localTheme.backgroundColor?.toLowerCase() === c.color.toLowerCase());

                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectColorPreset(c)}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group flex flex-col justify-between min-h-[92px] ${
                          isActive
                            ? 'border-sky-500 ring-2 ring-sky-400/50 shadow-md bg-white'
                            : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {/* Color Swatch */}
                            <div
                              className="w-6 h-6 rounded-lg border border-slate-300 shadow-2xs shrink-0"
                              style={{ background: c.color }}
                            />
                            <span className="font-black text-xs text-slate-900">
                              {c.khName}
                            </span>
                          </div>

                          {isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1 shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>កំពុងប្រើ</span>
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 leading-tight">
                          {c.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Color Wheel & Hex Picker */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
                    <Pipette className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">
                      ជ្រើសរើសពណ៌ផ្ទាល់ខ្លួនតាមចិត្ត (Custom Color Wheel)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      អ្នកអាចរើសពណ៌ណាមួយដែលអ្នកពេញចិត្ត ឬវាយបញ្ចូលកូដ Hex
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="color"
                      value={localTheme.backgroundColor?.startsWith('#') ? localTheme.backgroundColor : '#ffffff'}
                      onChange={(e) => handleApplyCustomHex(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white shadow-2xs"
                      title="ចុចដើម្បីរើសពណ៌"
                    />
                  </div>
                  <input
                    type="text"
                    value={customHexInput}
                    onChange={(e) => {
                      setCustomHexInput(e.target.value);
                      if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                        handleApplyCustomHex(e.target.value);
                      }
                    }}
                    placeholder="#ffffff"
                    className="w-24 px-2.5 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 text-slate-800 uppercase focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCustomHex(customHexInput)}
                    className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors shadow-2xs"
                  >
                    អនុវត្ត
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ TAB 2: WALLPAPERS (UPLOAD & PRESETS) ═══════════ */}
          {activeTab === 'wallpaper' && (
            <div className="flex flex-col gap-4">
              {/* Custom Upload Card */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200 shadow-xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">
                      ដាក់រូបភាព Wallpaper ផ្ទាល់ខ្លួនពី Computer (Upload from PC)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      គាំទ្រ JPG, PNG, WEBP កម្រិតច្បាស់ Full HD ឬ 4K
                    </div>
                  </div>
                </div>

                <label className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer transition-all shadow-sm active:scale-95">
                  <span>+ ជ្រើសរើសរូបភាពពី PC</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Wallpaper Action Toolbar: Select, Delete Selected, Clear */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    បណ្ដុំរូបភាព ({allWallpapers.length}):
                  </span>
                  {selectedWallpaperIds.length > 0 && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      បាន Select: {selectedWallpaperIds.length}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Select All */}
                  {selectedWallpaperIds.length < allWallpapers.length ? (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-bold transition-all"
                      title="ជ្រើសរើសទាំងអស់"
                    >
                      ✓ Select ទាំងអស់
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition-all"
                      title="ដោះការជ្រើសរើស"
                    >
                      ដោះ Select
                    </button>
                  )}

                  {/* Delete Selected */}
                  {selectedWallpaperIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-bold transition-all flex items-center gap-1 active:scale-95 shadow-2xs"
                      title="លុបរូបដែលបាន Select ចោល"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      <span>លុបដែលបាន Select ({selectedWallpaperIds.length})</span>
                    </button>
                  )}

                  {/* Turn off background directly */}
                  {localTheme.wallpaperUrl && (
                    <button
                      type="button"
                      onClick={() => handleSelectWallpaper(null)}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold transition-all flex items-center gap-1"
                      title="ដោះ Wallpaper ចេញ (ប្ដូរទៅពណ៌សសុទ្ធ)"
                    >
                      <span>🚫 ដោះ Wallpaper ចេញ</span>
                    </button>
                  )}

                  {/* Delete All Wallpapers */}
                  <button
                    type="button"
                    onClick={handleDeleteAllWallpapers}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 text-[11px] font-medium transition-all flex items-center gap-1"
                    title="លុប Wallpaper ចោលទាំងអស់"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                    <span>លុបទាំងអស់</span>
                  </button>
                </div>
              </div>

              {/* ── Custom Wallpapers Section (if any) ── */}
              {customWallpapers.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <span>📁 រូបភាព Wallpaper ផ្ទាល់ខ្លួនរបស់អ្នក ({customWallpapers.length}):</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                    {customWallpapers.map((wp) => {
                      const isSelected = selectedWallpaperIds.includes(wp.id);
                      const isActive = localTheme.wallpaperUrl === wp.url;

                      return (
                        <div
                          key={wp.id}
                          onClick={() => handleSelectWallpaper(wp.url, 'custom')}
                          className={`group relative rounded-2xl overflow-hidden border cursor-pointer h-28 transition-all ${
                            isActive
                              ? 'border-sky-500 shadow-md ring-2 ring-sky-400/50'
                              : isSelected
                              ? 'border-indigo-400 ring-2 ring-indigo-400/40'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <img
                            src={wp.url}
                            alt={wp.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Top Controls: Checkbox (Select) + Trash (Delete) */}
                          <div className="absolute top-2 inset-x-2 flex items-center justify-between z-10">
                            <button
                              type="button"
                              onClick={(e) => handleToggleSelect(wp.id, e)}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-sky-500 text-white shadow-md'
                                  : 'bg-black/60 text-white/80 hover:text-white border border-white/20'
                              }`}
                              title={isSelected ? 'ដោះ Select' : 'Select'}
                            >
                              {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteSingle(wp.id, wp.url, true, e)}
                              className="w-6 h-6 rounded-lg bg-black/60 hover:bg-red-500 text-white/80 hover:text-white flex items-center justify-center transition-all border border-white/20 hover:border-red-400"
                              title="លុបរូបនេះចោល"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2.5">
                            <span className="text-[11px] font-bold text-white truncate flex items-center gap-1">
                              <span>{wp.preview}</span>
                              <span>{wp.name}</span>
                            </span>
                          </div>

                          {isActive && (
                            <div className="absolute bottom-2 right-2 bg-sky-500 text-white font-black text-[9.5px] px-2 py-0.5 rounded-full shadow-md">
                              ✓ កំពុងប្រើ
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Preset Wallpapers Section ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">
                    Wallpaper 4K គំរូស្អាតៗ ({presets.length}):
                  </label>
                  {presets.length < DEFAULT_PRESET_WALLPAPERS.length && (
                    <button
                      type="button"
                      onClick={handleResetDefaultPresets}
                      className="text-[11px] text-sky-600 hover:underline flex items-center gap-1 font-bold"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>ដាក់គំរូដើមឡើងវិញ</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {presets.map((wp) => {
                    const isSelected = selectedWallpaperIds.includes(wp.id);
                    const isActive = localTheme.wallpaperUrl === wp.url;

                    return (
                      <div
                        key={wp.id}
                        onClick={() => handleSelectWallpaper(wp.url, wp.id as any)}
                        className={`group relative rounded-2xl overflow-hidden border cursor-pointer h-26 sm:h-28 transition-all ${
                          isActive
                            ? 'border-sky-500 shadow-md ring-2 ring-sky-400/50'
                            : isSelected
                            ? 'border-indigo-400 ring-2 ring-indigo-400/40'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={wp.url}
                          alt={wp.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Top Controls: Checkbox (Select) + Trash (Delete) */}
                        <div className="absolute top-2 inset-x-2 flex items-center justify-between z-10">
                          <button
                            type="button"
                            onClick={(e) => handleToggleSelect(wp.id, e)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-sky-500 text-white shadow-md'
                                : 'bg-black/60 text-white/80 hover:text-white border border-white/20'
                            }`}
                            title={isSelected ? 'ដោះ Select' : 'Select'}
                          >
                            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteSingle(wp.id, wp.url, false, e)}
                            className="w-6 h-6 rounded-lg bg-black/60 hover:bg-red-500 text-white/80 hover:text-white flex items-center justify-center transition-all border border-white/20 hover:border-red-400"
                            title="លុប Wallpaper នេះចេញ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2.5">
                          <span className="text-[11px] font-bold text-white truncate flex items-center gap-1">
                            <span>{wp.preview}</span>
                            <span>{wp.name}</span>
                          </span>
                        </div>

                        {isActive && (
                          <div className="absolute bottom-2 right-2 bg-sky-500 text-white font-black text-[9.5px] px-2 py-0.5 rounded-full shadow-md">
                            ✓ កំពុងប្រើ
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Wallpaper Opacity & Blur Sliders */}
              {localTheme.wallpaperUrl && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>ភាពច្បាស់នៃ Wallpaper (Opacity):</span>
                      <span className="font-mono text-sky-600 font-bold">
                        {localTheme.wallpaperOpacity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={localTheme.wallpaperOpacity}
                      onChange={(e) =>
                        updateTheme({
                          ...localTheme,
                          wallpaperOpacity: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full accent-sky-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>ភាពព្រិលស្រវាំង (Blur):</span>
                      <span className="font-mono text-sky-600 font-bold">
                        {localTheme.wallpaperBlur}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      step={1}
                      value={localTheme.wallpaperBlur}
                      onChange={(e) =>
                        updateTheme({
                          ...localTheme,
                          wallpaperBlur: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full accent-sky-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════ TAB 3: COLOR GLASS ═══════════ */}
          {activeTab === 'glass' && (
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-2.5">
                  ជ្រើសរើសពណ៌ Color Glass (Glassmorphism Light Tint):
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {PRESET_GLASS_COLORS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => handleSelectGlassColor(g.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden bg-white ${
                        localTheme.glassColor === g.id
                          ? 'border-sky-500 ring-2 ring-sky-400/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span
                          className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: g.tintRgba,
                            borderColor: g.accentHex,
                            color: g.accentHex,
                          }}
                        >
                          {g.badge}
                        </span>
                        {localTheme.glassColor === g.id && (
                          <CheckCircle2
                            className="w-4 h-4 stroke-[3]"
                            style={{ color: g.accentHex }}
                          />
                        )}
                      </div>

                      <div className="text-xs font-bold text-slate-900">{g.name}</div>
                      <div className="text-[10.5px] text-slate-500 mt-0.5">
                        កញ្ចក់រលើបរលោង ភ្លឺស្អាត
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Glass Controls: Blur, Opacity & Border Glow */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                {/* Glass Opacity */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-sky-600" />
                      <span>ភាពថ្លា Glass Opacity:</span>
                    </span>
                    <span className="font-mono text-sky-600 font-bold">
                      {localTheme.glassOpacity || 80}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={95}
                    step={5}
                    value={localTheme.glassOpacity || 80}
                    onChange={(e) =>
                      updateTheme({
                        ...localTheme,
                        glassOpacity: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-sky-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  />
                </div>

                {/* Glass Blur */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>កម្រិតព្រិល Glass Blur:</span>
                    </span>
                    <span className="font-mono text-indigo-600 font-bold">
                      {localTheme.glassBlur || 12}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    step={2}
                    value={localTheme.glassBlur || 12}
                    onChange={(e) =>
                      updateTheme({
                        ...localTheme,
                        glassBlur: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  />
                </div>

                {/* Border Glow Intensity */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>កម្រិតពន្លឺ Border Glow:</span>
                    </span>
                    <span className="font-mono text-amber-700 font-bold capitalize">
                      {localTheme.glassBorderGlow || 'subtle'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['subtle', 'vibrant', 'neon'] as const).map((style) => (
                      <button
                        key={style}
                        onClick={() =>
                          updateTheme({ ...localTheme, glassBorderGlow: style })
                        }
                        className={`py-1 rounded-lg text-[10px] font-bold capitalize transition-all ${
                          (localTheme.glassBorderGlow || 'subtle') === style
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ TAB 4: STICKERS ═══════════ */}
          {activeTab === 'stickers' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  ចុច Emoji Sticker ដើម្បីបិទអណ្តែតលើ Interface (Floating Stickers):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {PRESET_STICKERS.map((st) => (
                    <button
                      key={st.name}
                      onClick={() => handleAddEmojiSticker(st.url, st.name)}
                      className="p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-sky-300 flex items-center gap-2.5 transition-all active:scale-95 text-left shadow-2xs"
                    >
                      <span className="text-2xl">{st.url}</span>
                      <span className="text-xs font-bold text-slate-800">{st.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {localTheme.stickers.length > 0 && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Stickers កំពុងបង្ហាញ ({localTheme.stickers.length}):
                    </span>
                    <button
                      onClick={() => updateTheme({ ...localTheme, stickers: [] })}
                      className="text-xs text-red-600 hover:underline font-bold"
                    >
                      លុប Sticker ទាំងអស់
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {localTheme.stickers.map((s) => (
                      <div
                        key={s.id}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-2 text-xs text-slate-800"
                      >
                        <span className="text-base">{s.url}</span>
                        <span>{s.name}</span>
                        <button
                          onClick={() => handleRemoveSticker(s.id)}
                          className="text-slate-400 hover:text-red-500 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="p-3.5 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleResetTheme}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>កំណត់ពណ៌សដើម (Reset Pure White)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700 transition-colors shadow-2xs"
            >
              បិទ (Close)
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs shadow-md shadow-sky-500/25 transition-all active:scale-95"
            >
              ✓ រួចរាល់ (រក្សាទុក)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
