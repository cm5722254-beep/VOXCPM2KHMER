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

const DEFAULT_PRESET_WALLPAPERS: WallpaperItem[] = [];

const PRESET_BACKGROUND_COLORS: ColorPresetItem[] = [
  {
    id: 'pearl_snow',
    name: 'Pearl Snow Light (Eye Friendly)',
    khName: 'ðŸ¥› áž–ážŽáŸŒážŸáž‚áž»áž‡ážáŸ’áž™áž„ (ážŽáŸ‚áž“áž¶áŸ†áž–áž·ážŸáŸážŸ - ážŸáŸ’ážšáž‘áž“áŸ‹áž—áŸ’áž“áŸ‚áž€)',
    color: '#f8fafc',
    description: 'ážŸáŸ’ážšáž‘áž“áŸ‹áž—áŸ’áž“áŸ‚áž€ áž˜áž·áž“áž…áž¶áŸ†áž„áž—áŸ’áž“áŸ‚áž€ áž˜áž·áž“ážŸážšážáŸ’áž›áž¶áŸ†áž„áž–áŸáž€ áž˜áž¾áž›áž¢áž€áŸ’ážŸážš áž“áž·áž„áž”áŸŠáž¼ážáž»áž„áž…áŸ’áž”áž¶ážŸáŸ‹áž›áŸ’áž¢áž”áŸ†áž•áž»áž',
    textColor: '#0f172a',
  },
  {
    id: 'clean_white',
    name: 'Pure Clean White',
    khName: 'âšª áž–ážŽáŸŒážŸážŸáž»áž‘áŸ’áž’ (áž—áŸ’áž›ážºáž…áŸ’áž”áž¶ážŸáŸ‹)',
    color: '#ffffff',
    description: 'áž–ážŽáŸŒážŸážŸáž»áž‘áŸ’áž’ áž—áŸ’áž›ážºáž…áŸ’áž”áž¶ážŸáŸ‹áž›áŸ’áž¢áž”áŸ‚áž” Studio Canvas',
    textColor: '#0f172a',
  },
  {
    id: 'ice_crystal',
    name: 'Ice Crystal White',
    khName: 'ðŸ’Ž áž–ážŽáŸŒážŸáž‘áž¹áž€áž€áž€',
    color: '#f0f7ff',
    description: 'áž–ážŽáŸŒážŸáž›áž¶áž™ážáŸ€ážœážŸáŸ’ážšáž¶áž› ážŸáŸ’ážšážŸáŸ‹ážáŸ’áž›áž¶ áž”áŸ‚áž” Luxury Studio',
    textColor: '#0f172a',
  },
  {
    id: 'warm_ivory',
    name: 'Warm Ivory Linen',
    khName: 'ðŸŒ¾ áž–ážŽáŸŒážŸáž€áŸ’ážšáŸ‚áž˜',
    color: '#fafaf9',
    description: 'áž–ážŽáŸŒáž”áŸ‚áž”áž€áž€áŸ‹áž€áŸ’ážáŸ… áž‘áž“áŸ‹áž—áŸ’áž›áž“áŸ‹ áž“áž·áž„áž”áŸ’ážšážŽáž·áž',
    textColor: '#0f172a',
  },
  {
    id: 'slate_light',
    name: 'Studio Slate Light',
    khName: 'ðŸŒ«ï¸ áž–ážŽáŸŒ Slate ážŸáŸ’ážšáž¶áž›',
    color: '#f1f5f9',
    description: 'áž–ážŽáŸŒáž”áŸ’ážšáž•áŸáŸ‡ážŸáŸ’ážšáž¶áž›áž”áŸ‚áž” Executive Studio áž¢áž¶áž‡áž¸áž–',
    textColor: '#0f172a',
  },
  {
    id: 'sakura_light',
    name: 'Soft Sakura Pink',
    khName: 'ðŸŒ¸ áž–ážŽáŸŒáž•áŸ’áž€áž¶ážˆáž¼áž€ážŸáŸ’ážšáž¶áž›',
    color: '#fdf2f8',
    description: 'áž–ážŽáŸŒážŸáŸ’ážšáž¶áž›áž”áŸ‚áž” anime ážŸáŸ’ážšáž‘áž“áŸ‹ áž“áž·áž„áž‘áž¶áž€áŸ‹áž‘áž¶áž‰',
    textColor: '#0f172a',
  },
  {
    id: 'mint_light',
    name: 'Fresh Mint Green',
    khName: 'ðŸŒ¿ áž–ážŽáŸŒáž”áŸƒážáž„ážŸáŸ’ážšáž¶áž›',
    color: '#f0fdf4',
    description: 'áž–ážŽáŸŒážŸáŸ’ážšážŸáŸ‹ážáŸ’áž›áž¶ áž”áž“áŸ’áž’áž¼ážšáž¢áž¶ážšáž˜áŸ’áž˜ážŽáŸ áž“áž·áž„áž—áŸ’áž“áŸ‚áž€áž–áŸáž›áž’áŸ’ážœáž¾áž€áž¶ážšáž™áž¼ážš',
    textColor: '#0f172a',
  },
  {
    id: 'aurora_light',
    name: 'Aurora Pastel Gradient',
    khName: 'ðŸŒˆ áž–ážŽáŸŒáž¥áž“áŸ’áž’áž“áž¼ážŸáŸ’ážšáž¶áž›',
    color: 'linear-gradient(135deg, #f0f9ff 0%, #fdf4ff 50%, #f0fdf4 100%)',
    description: 'áž–ážŽáŸŒáž¥áž“áŸ’áž’áž“áž¼ážŸáŸ’ážšáž¶áž›áž”áŸ‚áž” Pastel ážŸáŸ’ážšážŸáŸ‹ážŸáŸ’áž¢áž¶ážáž‘áŸ†áž“áž¾áž”',
    textColor: '#0f172a',
  },
  {
    id: 'default_dark',
    name: 'Stealth Dark Pro',
    khName: 'ðŸ–¤ áž–ážŽáŸŒáž„áž„áž¹áž Pro',
    color: '#0f172a',
    description: 'ážŸáž˜áŸ’ážšáž¶áž”áŸ‹áž¢áŸ’áž“áž€ážŠáŸ‚áž›áž…áž¼áž›áž…áž·ážáŸ’ážážšáž”áŸ€áž” Dark Mode áž„áž„áž¹áž',
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
    name: 'â„ï¸ Glacier Ice (ážŽáŸ‚áž“áž¶áŸ†ážŸáž˜áŸ’ážšáž¶áž”áŸ‹áž–ážŽáŸŒážŸ)',
    badge: 'FROST BLUE',
    tintRgba: 'rgba(240, 249, 255, 0.85)',
    borderRgba: 'rgba(56, 189, 248, 0.35)',
    glowShadow: '0 0 20px rgba(56, 189, 248, 0.15)',
    accentHex: '#0284c7',
  },
  {
    id: 'cyan',
    name: 'ðŸ’Ž Cyan Crystal Glass',
    badge: 'CYAN CRYSTAL',
    tintRgba: 'rgba(236, 254, 255, 0.85)',
    borderRgba: 'rgba(6, 182, 212, 0.35)',
    glowShadow: '0 0 20px rgba(6, 182, 212, 0.15)',
    accentHex: '#0891b2',
  },
  {
    id: 'purple',
    name: 'ðŸŒ¸ Sakura Purple Glass',
    badge: 'ANIME VIOLET',
    tintRgba: 'rgba(250, 245, 255, 0.85)',
    borderRgba: 'rgba(168, 85, 247, 0.35)',
    glowShadow: '0 0 20px rgba(168, 85, 247, 0.15)',
    accentHex: '#9333ea',
  },
  {
    id: 'amber',
    name: 'ðŸ¯ Amber Gold Glass',
    badge: 'WARM GOLD',
    tintRgba: 'rgba(254, 252, 232, 0.85)',
    borderRgba: 'rgba(245, 158, 11, 0.35)',
    glowShadow: '0 0 20px rgba(245, 158, 11, 0.15)',
    accentHex: '#d97706',
  },
  {
    id: 'emerald',
    name: 'ðŸƒ Frosted Emerald Glass',
    badge: 'BIO MATRIX',
    tintRgba: 'rgba(236, 253, 245, 0.85)',
    borderRgba: 'rgba(16, 185, 129, 0.35)',
    glowShadow: '0 0 20px rgba(16, 185, 129, 0.15)',
    accentHex: '#059669',
  },
  {
    id: 'crimson',
    name: 'ðŸ©¸ Crimson Rose Glass',
    badge: 'ROSE RED',
    tintRgba: 'rgba(255, 241, 242, 0.85)',
    borderRgba: 'rgba(244, 63, 94, 0.35)',
    glowShadow: '0 0 20px rgba(244, 63, 94, 0.15)',
    accentHex: '#e11d48',
  },
  {
    id: 'obsidian',
    name: 'ðŸ–¤ Dark Obsidian Smoke',
    badge: 'STEALTH PRO',
    tintRgba: 'rgba(15, 23, 42, 0.85)',
    borderRgba: 'rgba(255, 255, 255, 0.15)',
    glowShadow: '0 0 25px rgba(0, 0, 0, 0.5)',
    accentHex: '#64748b',
  },
];

const PRESET_STICKERS = [
  { name: 'ðŸ”¥ Fire Flame', url: 'ðŸ”¥' },
  { name: 'ðŸ‘‘ Royal Crown', url: 'ðŸ‘‘' },
  { name: 'âš”ï¸ Katana Blade', url: 'âš”ï¸' },
  { name: 'ðŸŒ¸ Cherry Blossom', url: 'ðŸŒ¸' },
  { name: 'âš¡ Lightning Zap', url: 'âš¡' },
  { name: 'âœ¨ Anime Sparkle', url: 'âœ¨' },
  { name: 'ðŸ‰ Dragon Spirit', url: 'ðŸ‰' },
  { name: 'ðŸ¤– Cyber AI', url: 'ðŸ¤–' },
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

  const [activeTab, setActiveTab] = useState<'color' | 'wallpaper'>('color');

  // Custom and preset wallpapers list in state
  const [customWallpapers, setCustomWallpapers] = useState<WallpaperItem[]>(() => {
    try {
      const saved = localStorage.getItem('dragon_dabber_custom_wallpapers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [presets, setPresets] = useState<WallpaperItem[]>(() => {
    try {
      const saved = localStorage.getItem('dragon_dabber_preset_wallpapers');
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
      localStorage.setItem('dragon_dabber_custom_theme', JSON.stringify(updated));
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
    onShowToast?.('ðŸ¥› áž”áž¶áž“ážŠáž¶áž€áŸ‹áž–ážŽáŸŒážŸáž‚áž»áž‡ážáŸ’áž™áž„ ážŸáŸ’ážšáž‘áž“áŸ‹áž—áŸ’áž“áŸ‚áž€ (Pearl Snow Soft White) áž‡áŸ„áž‚áž‡áŸáž™!', 'success');
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
    onShowToast?.('âšª áž”áž¶áž“ážŠáž¶áž€áŸ‹áž–ážŽáŸŒážŸážŸáŸ’áž¢áž¶ážážŸáž»áž‘áŸ’áž’ (Clean Pure White Studio) áž‡áŸ„áž‚áž‡áŸáž™!', 'success');
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
    onShowToast?.(`âœ¨ áž”áž¶áž“áž€áŸ†ážŽážáŸ‹áž–ážŽáŸŒáž•áŸ’áž‘áŸƒážáž¶áž„áž€áŸ’ážšáŸ„áž™ "${preset.khName}"!`, 'success');
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
        preview: 'ðŸ–¼ï¸',
        url: base64,
        isCustom: true,
      };

      const updatedList = [newItem, ...customWallpapers];
      setCustomWallpapers(updatedList);
      localStorage.setItem('dragon_dabber_custom_wallpapers', JSON.stringify(updatedList));

      const updatedTheme: StudioCustomUITheme = {
        ...localTheme,
        wallpaperUrl: base64,
        bgMode: 'wallpaper',
        backgroundPreset: 'custom',
        wallpaperOpacity: localTheme.wallpaperOpacity ? Math.max(localTheme.wallpaperOpacity, 80) : 85,
        wallpaperBlur: 0,
      };
      updateTheme(updatedTheme);
      onShowToast?.(`ðŸŽ‰ áž”áž¶áž“ážŠáž¶áž€áŸ‹ážšáž¼áž” Wallpaper áž•áŸ’áž‘áž¶áž›áŸ‹ážáŸ’áž›áž½áž“áž‡áŸ„áž‚áž‡áŸáž™!`, 'success');
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
      onShowToast?.('âœ¨ áž”áž¶áž“ážŠáŸ„áŸ‡ Wallpaper áž…áŸáž‰ (áž”áŸ’ážŠáž¼ážšáž‘áŸ…áž–ážŽáŸŒážŸážŸáŸ’ážšáž‘áž“áŸ‹ Pearl Snow)!', 'info');
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
    onShowToast?.('ðŸ–¼ï¸ áž”áž¶áž“áž”áŸ’ážŠáž¼ážšážšáž¼áž” Wallpaper ážáŸ’áž˜áž¸áž…áŸ’áž”áž¶ážŸáŸ‹ážáŸ’ážšáž‡áž¶áž€áŸ‹áž—áŸ’áž“áŸ‚áž€!', 'success');
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

    if (!window.confirm(`ážáž¾áž¢áŸ’áž“áž€áž–áž·ážáž‡áž¶áž…áž„áŸ‹áž›áž»áž” Wallpaper áž…áŸ†áž“áž½áž“ ${selectedWallpaperIds.length} ážŠáŸ‚áž›áž”áž¶áž“ Select áž˜áŸ‚áž“áž‘áŸ?`)) {
      return;
    }

    const selectedUrls = allWallpapers
      .filter((w) => selectedWallpaperIds.includes(w.id))
      .map((w) => w.url);

    const newCustomList = customWallpapers.filter((w) => !selectedWallpaperIds.includes(w.id));
    setCustomWallpapers(newCustomList);
    localStorage.setItem('dragon_dabber_custom_wallpapers', JSON.stringify(newCustomList));

    const newPresetsList = presets.filter((w) => !selectedWallpaperIds.includes(w.id));
    setPresets(newPresetsList);
    localStorage.setItem('dragon_dabber_preset_wallpapers', JSON.stringify(newPresetsList));

    if (localTheme.wallpaperUrl && selectedUrls.includes(localTheme.wallpaperUrl)) {
      handleSelectWallpaper(null);
    }

    setSelectedWallpaperIds([]);
    onShowToast?.(`ðŸ—‘ï¸ áž”áž¶áž“áž›áž»áž” Background áž…áŸ†áž“áž½áž“ ${selectedWallpaperIds.length} ážšáž½áž…ážšáž¶áž›áŸ‹!`, 'info');
  };

  const handleDeleteAllWallpapers = () => {
    if (!window.confirm('ážáž¾áž¢áŸ’áž“áž€áž…áž„áŸ‹áž›áž»áž” Wallpaper áž‘áž¶áŸ†áž„áž¢ážŸáŸ‹ áž“áž·áž„áž€áŸ†ážŽážáŸ‹áž‘áŸ…áž–ážŽáŸŒážŸážŸáŸ’áž¢áž¶áž (Clean White Studio) áž˜áŸ‚áž“áž‘áŸ?')) {
      return;
    }

    setCustomWallpapers([]);
    localStorage.removeItem('dragon_dabber_custom_wallpapers');
    handleSelectWallpaper(null);
    setSelectedWallpaperIds([]);
    onShowToast?.('âœ¨ áž”áž¶áž“áž›áž»áž” Wallpaper áž…áŸáž‰áž‘áž¶áŸ†áž„áž¢ážŸáŸ‹ (Clean White Studio)!', 'warning');
  };

  const handleDeleteSingle = (id: string, url: string, isCustom: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCustom) {
      const updated = customWallpapers.filter((w) => w.id !== id);
      setCustomWallpapers(updated);
      localStorage.setItem('dragon_dabber_custom_wallpapers', JSON.stringify(updated));
    } else {
      const updated = presets.filter((w) => w.id !== id);
      setPresets(updated);
      localStorage.setItem('dragon_dabber_preset_wallpapers', JSON.stringify(updated));
    }

    setSelectedWallpaperIds((prev) => prev.filter((item) => item !== id));

    if (localTheme.wallpaperUrl === url) {
      handleSelectWallpaper(null);
    }
    onShowToast?.('áž”áž¶áž“áž›áž»áž” Wallpaper áž˜áž½áž™áž“áŸáŸ‡ážšáž½áž…ážšáž¶áž›áŸ‹', 'info');
  };

  const handleResetDefaultPresets = () => {
    setPresets(DEFAULT_PRESET_WALLPAPERS);
    localStorage.removeItem('dragon_dabber_preset_wallpapers');
    onShowToast?.('áž”áž¶áž“ážŠáž¶áž€áŸ‹áž‚áŸ†ážšáž¼ Wallpaper ážŠáž¾áž˜áž¡áž¾áž„ážœáž·áž‰!', 'success');
  };

  const handleSelectGlassColor = (glassId: GlassColorPreset) => {
    const updated: StudioCustomUITheme = {
      ...localTheme,
      glassColor: glassId,
    };
    updateTheme(updated);
    onShowToast?.(`âœ¨ áž”áž¶áž“áž”áŸ’ážŠáž¼ážš Color Glass áž‘áŸ… ${glassId.toUpperCase()}!`, 'success');
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
    onShowToast?.(`áž”áž¶áž“áž”áž“áŸ’ážáŸ‚áž˜ Sticker ${emoji}!`, 'success');
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
    localStorage.removeItem('dragon_dabber_custom_theme');
    onShowToast?.('áž”áž¶áž“áž€áŸ†ážŽážáŸ‹ážšáž…áž“áž¶áž”ážážŸáŸ’áž‘áž¼ážŒáž¸áž™áŸ„áž‘áŸ…áž–ážŽáŸŒážŸážŸáŸ’áž¢áž¶ážážŸáž»áž‘áŸ’áž’ (Clean White Default)!', 'info');
  };

  const isColorModeActive = localTheme.bgMode === 'color' || !localTheme.wallpaperUrl;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none font-khmer animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* â”€â”€ Modal Header â”€â”€ */}
        <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center text-slate-800 dark:text-white shadow-md shadow-sky-500/25">
              <Palette className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 tracking-wide">
                  ðŸŽ¨ áž”áŸ’ážŠáž¼ážšáž–ážŽáŸŒáž•áŸ’áž‘áŸƒážáž¶áž„áž€áŸ’ážšáŸ„áž™ & WALLPAPER
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
                  STUDIO THEME
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                áž€áŸ†ážŽážáŸ‹áž•áŸ’áž‘áŸƒážáž¶áž„áž€áŸ’ážšáŸ„áž™áž–ážŽáŸŒážŸážŸáŸ’áž¢áž¶áž (Clean White) áž„áž¶áž™ážŸáŸ’ážšáž½áž›áž™áž›áŸ‹ áž“áž·áž„áž”áŸ’ážšáž¾áž”áŸ’ážšáž¶ážŸáŸ‹ áž¬áž”áŸ’ážŠáž¼ážš Wallpaper 4K
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-200 text-slate-500 flex items-center justify-center transition-all active:scale-95"
            title="áž”áž·áž‘áž•áŸ’áž‘áž¶áŸ†áž„ (Close)"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* â”€â”€ Quick Mode Toggle: Wallpaper vs Soft Color â”€â”€ */}
        <div className="px-6 py-2.5 bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">ážšáž”áŸ€áž”áž•áŸ’áž‘áŸƒážáž¶áž„áž€áŸ’ážšáŸ„áž™áž€áŸ†áž–áž»áž„áž”áŸ’ážšáž¾:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black shadow-2xs ${
              localTheme.bgMode === 'wallpaper'
                ? 'bg-indigo-600 text-slate-800 dark:text-white'
                : 'bg-emerald-600 text-slate-800 dark:text-white'
            }`}>
              {localTheme.bgMode === 'wallpaper' ? 'ðŸ–¼ï¸ áž•áŸ’áž‘áž¶áŸ†áž„ážšáž¼áž”áž—áž¶áž– Wallpaper 4K' : 'ðŸŽ¨ áž–ážŽáŸŒážŸáŸ’ážšáž‘áž“áŸ‹ Soft Color'}
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
                onShowToast?.('ðŸ–¼ï¸ áž”áž¶áž“áž”áŸ’ážŠáž¼ážšáž‘áŸ…áž”áŸ’ážšáž¾ Wallpaper 4K!', 'success');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5 ${
                localTheme.bgMode === 'wallpaper'
                  ? 'bg-indigo-600 text-slate-800 dark:text-white shadow-sm ring-2 ring-indigo-300'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>áž”áž¾áž€áž”áŸ’ážšáž¾ Wallpaper</span>
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
                onShowToast?.('ðŸ¥› áž”áž¶áž“áž”áŸ’ážŠáž¼ážšáž˜áž€áž”áŸ’ážšáž¾áž–ážŽáŸŒážŸáž‚áž»áž‡ážáŸ’áž™áž„ ážŸáŸ’ážšáž‘áž“áŸ‹áž—áŸ’áž“áŸ‚áž€!', 'success');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5 ${
                localTheme.bgMode === 'color'
                  ? 'bg-emerald-600 text-slate-800 dark:text-white shadow-sm ring-2 ring-emerald-300'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>áž”áŸ’ážŠáž¼ážšáž˜áž€áž–ážŽáŸŒážŸáŸ’ážšáž‘áž“áŸ‹ (Pearl Snow)</span>
            </button>
          </div>
        </div>

        {/* â”€â”€ Modal Tabs Bar â”€â”€ */}
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
            <span>ðŸŽ¨ áž–ážŽáŸŒáž•áŸ’áž‘áŸƒážáž¶áž„áž€áŸ’ážšáŸ„áž™ (COLOR - ážŸáŸ’ážšáž‘áž“áŸ‹áž—áŸ’áž“áŸ‚áž€)</span>
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
            <span>ðŸ–¼ï¸ WALLPAPER 4K & UPLOAD ({allWallpapers.length})</span>
          </button>


        </div>

        {/* â”€â”€ Modal Body Content â”€â”€ */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-5 text-xs bg-slate-50/50">
          {/* â•â•â•â•â•â•â•â•â•â•â• TAB 1: BACKGROUND COLOR (CLEAN WHITE) â•â•â•â•â•â•â•â•â•â•â• */}
          {activeTab === 'color' && (
            <div className="flex flex-col gap-4">
              {/* Highlight Hero Card: One-Click Light vs Night Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* â˜€ï¸ Light Mode Studio (Soft Pearl Snow) */}
                <div
                  onClick={() => {
                    handleSetSoftPearlWhite();
                    localStorage.setItem('animestudio_theme_mode', 'light');
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                    onShowToast?.('ðŸ¥› áž”áž¶áž“áž€áŸ†ážŽážáŸ‹ážŸáŸ’áž‘áž¼ážŒáž¸áž™áŸ„áž‘áŸ… Light Mode (áž–ážŽáŸŒážŸáž‚áž»áž‡ážáŸ’áž™áž„ ážŸáŸ’ážšáž‘áž“áŸ‹áž—áŸ’áž“áŸ‚áž€)!', 'success');
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 shadow-xs hover:shadow-md ${
                    localTheme.themeMode === 'light' || (!localTheme.themeMode && (localTheme.backgroundColor === '#f8fafc' || localTheme.backgroundPreset === 'pearl_snow'))
                      ? 'bg-gradient-to-r from-amber-50/80 via-white to-sky-50 border-amber-400 ring-2 ring-amber-400/40'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl shadow-xs shrink-0">
                      ðŸ¥›
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 text-sm">Light Mode (ážŸáŸ’ážšáž‘áž“áŸ‹áž—áŸ’áž“áŸ‚áž€)</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ážŽáŸ‚áž“áž¶áŸ†áž–áž·ážŸáŸážŸ
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        áž–ážŽáŸŒážŸáž‚áž»áž‡ážáŸ’áž™áž„ ážŸáŸ’ážšáž‘áž“áŸ‹áž—áŸ’áž“áŸ‚áž€ áž˜áž·áž“áž…áž¶áŸ†áž„áž—áŸ’áž“áŸ‚áž€ áž˜áž¾áž›áž¢áž€áŸ’ážŸážšáž…áŸ’áž”áž¶ážŸáŸ‹áž”áŸ†áž•áž»áž
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xs shrink-0"
                  >
                    áž‡áŸ’ážšáž¾ážŸážšáž¾ážŸ
                  </button>
                </div>

                {/* ðŸŒ™ Night Mode Studio */}
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
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 shadow-xs hover:shadow-md ${
                    localTheme.themeMode === 'dark' || localTheme.backgroundColor === '#0b0f19'
                      ? 'bg-gradient-to-r from-slate-900 via-[#0b0f19] to-indigo-950 border-indigo-500 ring-2 ring-indigo-500/40 text-slate-800 dark:text-white'
                      : 'bg-slate-900 text-slate-800 dark:text-white hover:bg-slate-800 border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-700 flex items-center justify-center text-2xl shadow-xs shrink-0">
                      ðŸŒ™
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-800 dark:text-white text-sm">Night Mode (áž„áž„áž¹áž)</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700">
                          ážáŸ’ážšáž‡áž¶áž€áŸ‹áž—áŸ’áž“áŸ‚áž€
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        áž•áŸ’áž‘áŸƒážáž¶áž„áž€áŸ’ážšáŸ„áž™áž„áž„áž¹áž áž¢áž€áŸ’ážŸážšáž—áŸ’áž›ážºáž…áŸ’áž”áž¶ážŸáŸ‹ áž˜áž·áž“áž…áž¶áŸ†áž„áž—áŸ’áž“áŸ‚áž€áž–áŸáž›áž™áž”áŸ‹
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-800 dark:text-white font-black text-xs shadow-xs shrink-0"
                  >
                    áž‡áŸ’ážšáž¾ážŸážšáž¾ážŸ
                  </button>
                </div>
              </div>

              {/* Mode Indicator & Active Background Status */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">ážšáž”áŸ€áž”áž”áž…áŸ’áž…áž»áž”áŸ’áž”áž“áŸ’áž“:</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                    isColorModeActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-purple-50 text-purple-800 border border-purple-200'
                  }`}>
                    {isColorModeActive ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>ðŸŽ¨ ážšáž”áŸ€áž”áž–ážŽáŸŒážŸáž»áž‘áŸ’áž’ (Solid Color Mode)</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        <span>ðŸ–¼ï¸ ážšáž”áŸ€áž” Wallpaper Image</span>
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
                      onShowToast?.('áž”áž¶áž“áž”áž¾áž€ážšáž”áŸ€áž”áž–ážŽáŸŒážŸáž»áž‘áŸ’áž’ (Solid Color Mode)', 'info');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isColorModeActive
                        ? 'bg-sky-600 text-slate-800 dark:text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    ðŸŽ¨ áž”áŸ’ážšáž¾áž–ážŽáŸŒážŸáž»áž‘áŸ’áž’
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
                        ? 'bg-indigo-600 text-slate-800 dark:text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    ðŸ–¼ï¸ áž”áŸ’ážšáž¾ Wallpaper
                  </button>
                </div>
              </div>

              {/* Color Preset Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2.5">
                  áž‡áŸ’ážšáž¾ážŸážšáž¾ážŸáž–ážŽáŸŒáž‚áŸ†ážšáž¼ážŸáŸ’áž¢áž¶ážáŸ— (Clean Studio Color Presets):
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
                              <span>áž€áŸ†áž–áž»áž„áž”áŸ’ážšáž¾</span>
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
                      áž‡áŸ’ážšáž¾ážŸážšáž¾ážŸáž–ážŽáŸŒáž•áŸ’áž‘áž¶áž›áŸ‹ážáŸ’áž›áž½áž“ážáž¶áž˜áž…áž·ážáŸ’áž (Custom Color Wheel)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      áž¢áŸ’áž“áž€áž¢áž¶áž…ážšáž¾ážŸáž–ážŽáŸŒážŽáž¶áž˜áž½áž™ážŠáŸ‚áž›áž¢áŸ’áž“áž€áž–áŸáž‰áž…áž·ážáŸ’áž áž¬ážœáž¶áž™áž”áž‰áŸ’áž…áž¼áž›áž€áž¼ážŠ Hex
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
                      title="áž…áž»áž…ážŠáž¾áž˜áŸ’áž”áž¸ážšáž¾ážŸáž–ážŽáŸŒ"
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
                    className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-slate-800 dark:text-white font-bold text-xs transition-colors shadow-2xs"
                  >
                    áž¢áž“áž»ážœážáŸ’áž
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* â•â•â•â•â•â•â•â•â•â•â• TAB 2: WALLPAPERS (UPLOAD & PRESETS) â•â•â•â•â•â•â•â•â•â•â• */}
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
                      ážŠáž¶áž€áŸ‹ážšáž¼áž”áž—áž¶áž– Wallpaper áž•áŸ’áž‘áž¶áž›áŸ‹ážáŸ’áž›áž½áž“áž–áž¸ Computer (Upload from PC)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      áž‚áž¶áŸ†áž‘áŸ’ážš JPG, PNG, WEBP áž€áž˜áŸ’ážšáž·ážáž…áŸ’áž”áž¶ážŸáŸ‹ Full HD áž¬ 4K
                    </div>
                  </div>
                </div>

                <label className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-800 dark:text-white font-bold cursor-pointer transition-all shadow-sm active:scale-95">
                  <span>+ áž‡áŸ’ážšáž¾ážŸážšáž¾ážŸážšáž¼áž”áž—áž¶áž–áž–áž¸ PC</span>
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
                    áž”ážŽáŸ’ážŠáž»áŸ†ážšáž¼áž”áž—áž¶áž– ({allWallpapers.length}):
                  </span>
                  {selectedWallpaperIds.length > 0 && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      áž”áž¶áž“ Select: {selectedWallpaperIds.length}
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
                      title="áž‡áŸ’ážšáž¾ážŸážšáž¾ážŸáž‘áž¶áŸ†áž„áž¢ážŸáŸ‹"
                    >
                      âœ“ Select áž‘áž¶áŸ†áž„áž¢ážŸáŸ‹
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition-all"
                      title="ážŠáŸ„áŸ‡áž€áž¶ážšáž‡áŸ’ážšáž¾ážŸážšáž¾ážŸ"
                    >
                      ážŠáŸ„áŸ‡ Select
                    </button>
                  )}

                  {/* Delete Selected */}
                  {selectedWallpaperIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-bold transition-all flex items-center gap-1 active:scale-95 shadow-2xs"
                      title="áž›áž»áž”ážšáž¼áž”ážŠáŸ‚áž›áž”áž¶áž“ Select áž…áŸ„áž›"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      <span>áž›áž»áž”ážŠáŸ‚áž›áž”áž¶áž“ Select ({selectedWallpaperIds.length})</span>
                    </button>
                  )}

                  {/* Turn off background directly */}
                  {localTheme.wallpaperUrl && (
                    <button
                      type="button"
                      onClick={() => handleSelectWallpaper(null)}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold transition-all flex items-center gap-1"
                      title="ážŠáŸ„áŸ‡ Wallpaper áž…áŸáž‰ (áž”áŸ’ážŠáž¼ážšáž‘áŸ…áž–ážŽáŸŒážŸážŸáž»áž‘áŸ’áž’)"
                    >
                      <span>ðŸš« ážŠáŸ„áŸ‡ Wallpaper áž…áŸáž‰</span>
                    </button>
                  )}

                  {/* Delete All Wallpapers */}
                  <button
                    type="button"
                    onClick={handleDeleteAllWallpapers}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 text-[11px] font-medium transition-all flex items-center gap-1"
                    title="áž›áž»áž” Wallpaper áž…áŸ„áž›áž‘áž¶áŸ†áž„áž¢ážŸáŸ‹"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                    <span>áž›áž»áž”áž‘áž¶áŸ†áž„áž¢ážŸáŸ‹</span>
                  </button>
                </div>
              </div>

              {/* â”€â”€ Custom Wallpapers Section (if any) â”€â”€ */}
              {customWallpapers.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <span>ðŸ“ ážšáž¼áž”áž—áž¶áž– Wallpaper áž•áŸ’áž‘áž¶áž›áŸ‹ážáŸ’áž›áž½áž“ážšáž”ážŸáŸ‹áž¢áŸ’áž“áž€ ({customWallpapers.length}):</span>
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
                                  ? 'bg-sky-500 text-slate-800 dark:text-white shadow-md'
                                  : 'bg-black/60 text-slate-800 dark:text-white/80 hover:text-slate-800 dark:text-white border border-white/20'
                              }`}
                              title={isSelected ? 'ážŠáŸ„áŸ‡ Select' : 'Select'}
                            >
                              {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteSingle(wp.id, wp.url, true, e)}
                              className="w-6 h-6 rounded-lg bg-black/60 hover:bg-red-500 text-slate-800 dark:text-white/80 hover:text-slate-800 dark:text-white flex items-center justify-center transition-all border border-white/20 hover:border-red-400"
                              title="áž›áž»áž”ážšáž¼áž”áž“áŸáŸ‡áž…áŸ„áž›"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2.5">
                            <span className="text-[11px] font-bold text-slate-800 dark:text-white truncate flex items-center gap-1">
                              <span>{wp.preview}</span>
                              <span>{wp.name}</span>
                            </span>
                          </div>

                          {isActive && (
                            <div className="absolute bottom-2 right-2 bg-sky-500 text-slate-800 dark:text-white font-black text-[9.5px] px-2 py-0.5 rounded-full shadow-md">
                              âœ“ áž€áŸ†áž–áž»áž„áž”áŸ’ážšáž¾
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* â”€â”€ Preset Wallpapers Section â”€â”€ */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">
                    Wallpaper 4K áž‚áŸ†ážšáž¼ážŸáŸ’áž¢áž¶ážáŸ— ({presets.length}):
                  </label>
                  {presets.length < DEFAULT_PRESET_WALLPAPERS.length && (
                    <button
                      type="button"
                      onClick={handleResetDefaultPresets}
                      className="text-[11px] text-sky-600 hover:underline flex items-center gap-1 font-bold"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>ážŠáž¶áž€áŸ‹áž‚áŸ†ážšáž¼ážŠáž¾áž˜áž¡áž¾áž„ážœáž·áž‰</span>
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
                                ? 'bg-sky-500 text-slate-800 dark:text-white shadow-md'
                                : 'bg-black/60 text-slate-800 dark:text-white/80 hover:text-slate-800 dark:text-white border border-white/20'
                            }`}
                            title={isSelected ? 'ážŠáŸ„áŸ‡ Select' : 'Select'}
                          >
                            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteSingle(wp.id, wp.url, false, e)}
                            className="w-6 h-6 rounded-lg bg-black/60 hover:bg-red-500 text-slate-800 dark:text-white/80 hover:text-slate-800 dark:text-white flex items-center justify-center transition-all border border-white/20 hover:border-red-400"
                            title="áž›áž»áž” Wallpaper áž“áŸáŸ‡áž…áŸáž‰"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2.5">
                          <span className="text-[11px] font-bold text-slate-800 dark:text-white truncate flex items-center gap-1">
                            <span>{wp.preview}</span>
                            <span>{wp.name}</span>
                          </span>
                        </div>

                        {isActive && (
                          <div className="absolute bottom-2 right-2 bg-sky-500 text-slate-800 dark:text-white font-black text-[9.5px] px-2 py-0.5 rounded-full shadow-md">
                            âœ“ áž€áŸ†áž–áž»áž„áž”áŸ’ážšáž¾
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
                      <span>áž—áž¶áž–áž…áŸ’áž”áž¶ážŸáŸ‹áž“áŸƒ Wallpaper (Opacity):</span>
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
                      <span>áž—áž¶áž–áž–áŸ’ážšáž·áž›ážŸáŸ’ážšážœáž¶áŸ†áž„ (Blur):</span>
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
        </div>

        {/* â”€â”€ Modal Footer â”€â”€ */}
        <div className="p-3.5 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleResetTheme}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>áž€áŸ†ážŽážáŸ‹áž–ážŽáŸŒážŸážŠáž¾áž˜ (Reset Pure White)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700 transition-colors shadow-2xs"
            >
              áž”áž·áž‘ (Close)
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-800 dark:text-white font-black text-xs shadow-md shadow-sky-500/25 transition-all active:scale-95"
            >
              âœ“ ážšáž½áž…ážšáž¶áž›áŸ‹ (ážšáž€áŸ’ážŸáž¶áž‘áž»áž€)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
