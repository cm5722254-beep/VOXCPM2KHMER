import React, { useState, useEffect } from 'react';
import {
  X,
  Palette,
  Image as ImageIcon,
  Smile,
  Upload,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Plus,
  Sparkles,
  Sliders,
  Sun,
  Layers,
  Shield,
  Eye,
  CheckSquare,
  Square,
  AlertTriangle,
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
    id: 'cyan',
    name: '💎 Cyan Crystal Glass',
    badge: 'CYAN NEON',
    tintRgba: 'rgba(6, 182, 212, 0.12)',
    borderRgba: 'rgba(6, 182, 212, 0.35)',
    glowShadow: '0 0 25px rgba(6, 182, 212, 0.25)',
    accentHex: '#06b6d4',
  },
  {
    id: 'purple',
    name: '🌸 Sakura Purple Glass',
    badge: 'ANIME VIOLET',
    tintRgba: 'rgba(168, 85, 247, 0.12)',
    borderRgba: 'rgba(168, 85, 247, 0.35)',
    glowShadow: '0 0 25px rgba(168, 85, 247, 0.25)',
    accentHex: '#a855f7',
  },
  {
    id: 'amber',
    name: '🍯 Amber Gold Glass',
    badge: 'WARM GOLD',
    tintRgba: 'rgba(245, 158, 11, 0.12)',
    borderRgba: 'rgba(245, 158, 11, 0.35)',
    glowShadow: '0 0 25px rgba(245, 158, 11, 0.25)',
    accentHex: '#f59e0b',
  },
  {
    id: 'emerald',
    name: '🍃 Frosted Emerald Glass',
    badge: 'BIO MATRIX',
    tintRgba: 'rgba(16, 185, 129, 0.12)',
    borderRgba: 'rgba(16, 185, 129, 0.35)',
    glowShadow: '0 0 25px rgba(16, 185, 129, 0.25)',
    accentHex: '#10b981',
  },
  {
    id: 'ice',
    name: '❄️ Glacier Ice Glass',
    badge: 'FROST BLUE',
    tintRgba: 'rgba(56, 189, 248, 0.12)',
    borderRgba: 'rgba(56, 189, 248, 0.35)',
    glowShadow: '0 0 25px rgba(56, 189, 248, 0.25)',
    accentHex: '#38bdf8',
  },
  {
    id: 'obsidian',
    name: '🖤 Dark Obsidian Smoke',
    badge: 'STEALTH PRO',
    tintRgba: 'rgba(15, 23, 42, 0.45)',
    borderRgba: 'rgba(255, 255, 255, 0.12)',
    glowShadow: '0 0 25px rgba(0, 0, 0, 0.5)',
    accentHex: '#64748b',
  },
  {
    id: 'crimson',
    name: '🩸 Crimson Blood Glass',
    badge: 'ACTION RED',
    tintRgba: 'rgba(239, 68, 68, 0.12)',
    borderRgba: 'rgba(239, 68, 68, 0.35)',
    glowShadow: '0 0 25px rgba(239, 68, 68, 0.25)',
    accentHex: '#ef4444',
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
    glassColor: theme.glassColor || 'cyan',
    glassOpacity: theme.glassOpacity !== undefined ? theme.glassOpacity : 70,
    glassBlur: theme.glassBlur !== undefined ? theme.glassBlur : 12,
    glassBorderGlow: theme.glassBorderGlow || 'vibrant',
  }));

  const [activeTab, setActiveTab] = useState<'glass' | 'wallpaper' | 'stickers'>('wallpaper');

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

  if (!isOpen) return null;

  const updateTheme = (updated: StudioCustomUITheme) => {
    setLocalTheme(updated);
    onChangeTheme(updated);
    localStorage.setItem('animestudio_custom_theme', JSON.stringify(updated));
  };

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
        backgroundPreset: 'custom',
        wallpaperOpacity: localTheme.wallpaperOpacity ? Math.max(localTheme.wallpaperOpacity, 80) : 85,
        wallpaperBlur: 0,
      };
      updateTheme(updatedTheme);
      onShowToast?.(`🎉 បានដាក់រូប Wallpaper ផ្ទាល់ខ្លួនច្បាស់ត្រជាក់ភ្នែក!`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectWallpaper = (url: string | null, presetId?: BackgroundPreset) => {
    const updated: StudioCustomUITheme = {
      ...localTheme,
      wallpaperUrl: url,
      backgroundPreset: presetId || 'custom',
      wallpaperOpacity: localTheme.wallpaperOpacity ? Math.max(localTheme.wallpaperOpacity, 80) : 85,
      wallpaperBlur: 0,
    };
    updateTheme(updated);
    onShowToast?.(url ? 'បានប្ដូររូប Wallpaper ថ្មីច្បាស់ត្រជាក់ភ្នែក!' : 'បានលុបរូប Wallpaper ចេញ (Clean Dark Studio)!', 'info');
  };

  // ── SELECTION LOGIC ──
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

  // ── DELETION LOGIC ──
  // Delete only selected wallpapers
  const handleDeleteSelected = () => {
    if (selectedWallpaperIds.length === 0) return;

    if (!window.confirm(`តើអ្នកពិតជាចង់លុប Wallpaper ចំនួន ${selectedWallpaperIds.length} ដែលបាន Select មែនទេ?`)) {
      return;
    }

    const selectedUrls = allWallpapers
      .filter((w) => selectedWallpaperIds.includes(w.id))
      .map((w) => w.url);

    // Remove from custom list
    const newCustomList = customWallpapers.filter((w) => !selectedWallpaperIds.includes(w.id));
    setCustomWallpapers(newCustomList);
    localStorage.setItem('animestudio_custom_wallpapers', JSON.stringify(newCustomList));

    // Remove from presets list
    const newPresetsList = presets.filter((w) => !selectedWallpaperIds.includes(w.id));
    setPresets(newPresetsList);
    localStorage.setItem('animestudio_preset_wallpapers', JSON.stringify(newPresetsList));

    // If currently active wallpaper is among deleted ones, clear it
    if (localTheme.wallpaperUrl && selectedUrls.includes(localTheme.wallpaperUrl)) {
      handleSelectWallpaper(null);
    }

    setSelectedWallpaperIds([]);
    onShowToast?.(`🗑️ បានលុប Background ចំនួន ${selectedWallpaperIds.length} រួចរាល់!`, 'info');
  };

  // Delete ALL wallpapers & clear background completely
  const handleDeleteAllWallpapers = () => {
    if (!window.confirm('តើអ្នកចង់លុប Wallpaper ទាំងអស់ និងកំណត់ទៅ Clean Pure Dark Studio (គ្មាន Background) មែនទេ?')) {
      return;
    }

    setCustomWallpapers([]);
    localStorage.removeItem('animestudio_custom_wallpapers');

    // Reset active background to null (Clean Stealth Dark theme)
    handleSelectWallpaper(null);
    setSelectedWallpaperIds([]);
    onShowToast?.('⚠️ បានលុប Wallpaper ទាំងអស់ចេញ (Pure Dark Studio)!', 'warning');
  };

  // Delete single wallpaper directly
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

  // Reset default preset wallpapers
  const handleResetDefaultPresets = () => {
    setPresets(DEFAULT_PRESET_WALLPAPERS);
    localStorage.removeItem('animestudio_preset_wallpapers');
    onShowToast?.('បានដាក់គំរូ Background ដើមទាំង ៥ ឡើងវិញ!', 'success');
  };

  // ── Glass & Sticker Helpers ──
  const handleSelectGlassColor = (glassId: GlassColorPreset) => {
    const accentMap: Record<GlassColorPreset, StudioCustomUITheme['accentColor']> = {
      cyan: 'cyan',
      purple: 'purple',
      amber: 'amber',
      emerald: 'emerald',
      ice: 'sapphire',
      obsidian: 'cyan',
      crimson: 'rose',
      sakura: 'rose',
    };

    const updated: StudioCustomUITheme = {
      ...localTheme,
      glassColor: glassId,
      accentColor: accentMap[glassId] || 'cyan',
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
      wallpaperOpacity: 40,
      wallpaperBlur: 6,
      accentColor: 'cyan',
      stickers: [],
      glassColor: 'cyan',
      glassOpacity: 70,
      glassBlur: 12,
      glassBorderGlow: 'vibrant',
      backgroundPreset: 'default_dark',
    };
    updateTheme(defaultTheme);
    localStorage.removeItem('animestudio_custom_theme');
    onShowToast?.('បានកំណត់រចនាបថ UI ទៅលំនាំដើមវិញ!', 'info');
  };

  const activeGlassObj =
    PRESET_GLASS_COLORS.find((g) => g.id === localTheme.glassColor) || PRESET_GLASS_COLORS[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-5 select-none font-khmer animate-in fade-in duration-200">
      <div className="bg-[#080c14]/95 border border-cyan-500/40 rounded-3xl w-full max-w-4xl overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.25)] flex flex-col max-h-[92vh]">
        {/* ── Modal Header ── */}
        <div className="p-4 px-6 border-b border-white/[0.08] flex items-center justify-between bg-[#05080f] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
              <Palette className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white tracking-wide">
                  CUSTOMIZE STYLE BACKGROUND & COLOR GLASS
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm">
                  LIVE THEME STUDIO
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                កែប្រែ Style Background ផ្ទាំង Tool (Select & Delete បាន) និងប្ដូរ Color Glass
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-red-500/20 hover:text-red-400 border border-white/[0.08] hover:border-red-500/40 text-slate-300 flex items-center justify-center transition-all active:scale-95"
            title="បិទផ្ទាំង (Esc)"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* ── Modal Tabs Bar ── */}
        <div className="px-6 py-2.5 bg-black/40 border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('wallpaper')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'wallpaper'
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>STYLE BACKGROUND TOOL ({allWallpapers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('glass')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'glass'
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>COLOR GLASS (កញ្ចក់ពណ៌ & GLOW)</span>
          </button>

          <button
            onClick={() => setActiveTab('stickers')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'stickers'
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Smile className="w-3.5 h-3.5 text-amber-400" />
            <span>STICKERS ({localTheme.stickers.length})</span>
          </button>
        </div>

        {/* ── Modal Body Content ── */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-5 text-xs custom-scrollbar">
          {/* ═══════════ TAB 1: WALLPAPER BACKGROUND (WITH SELECT & DELETE ALL) ═══════════ */}
          {activeTab === 'wallpaper' && (
            <div className="flex flex-col gap-4">
              {/* Custom Upload Card */}
              <div className="p-4 rounded-2xl bg-cyan-500/[0.06] border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-400/30 shadow-md">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">
                      ដាក់រូបភាពផ្ទាល់ខ្លួនពី Computer (Custom Wallpaper)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      គាំទ្រ JPG, PNG, WEBP កម្រិតច្បាស់ Full HD / 4K
                    </div>
                  </div>
                </div>

                <label className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-black cursor-pointer transition-all shadow-lg shadow-cyan-500/25 shrink-0 active:scale-95">
                  <span>+ ជ្រើសរើសរូបភាពពី PC</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* ── WALLPAPER ACTION TOOLBAR: SELECT, DELETE SELECTED, DELETE ALL ── */}
              <div className="p-3 rounded-2xl bg-black/50 border border-white/[0.08] flex flex-wrap items-center justify-between gap-2.5 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">
                    បណ្ដុំរូបភាព ({allWallpapers.length}):
                  </span>
                  {selectedWallpaperIds.length > 0 && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
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
                      className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-slate-300 text-[11px] font-bold transition-all"
                      title="ជ្រើសរើសទាំងអស់"
                    >
                      ✓ Select ទាំងអស់
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold transition-all"
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
                      className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-[11px] font-black transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                      title="លុបរូបដែលបាន Select ចោល"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>លុបដែលបាន Select ({selectedWallpaperIds.length})</span>
                    </button>
                  )}

                  {/* Delete All Wallpapers */}
                  <button
                    type="button"
                    onClick={handleDeleteAllWallpapers}
                    className="px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-800/40 text-[11px] font-bold transition-all flex items-center gap-1"
                    title="លុប Background ចោលទាំងអស់ (Clean Dark Studio)"
                  >
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <span>លុបចោលទាំងអស់</span>
                  </button>

                  {/* Turn off background directly */}
                  {localTheme.wallpaperUrl && (
                    <button
                      type="button"
                      onClick={() => handleSelectWallpaper(null)}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-all flex items-center gap-1"
                      title="មិនប្រើ Background (Pure Dark Studio)"
                    >
                      <span>🚫 មិនប្រើ Background</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ── Custom Wallpapers Section (if any) ── */}
              {customWallpapers.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-cyan-300 mb-2 flex items-center gap-1.5">
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
                              ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] ring-2 ring-cyan-400/50'
                              : isSelected
                              ? 'border-indigo-400 ring-2 ring-indigo-400/40'
                              : 'border-white/[0.1] hover:border-white/30'
                          }`}
                        >
                          <img
                            src={wp.url}
                            alt={wp.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Top Controls: Checkbox (Select) + Trash (Delete) */}
                          <div className="absolute top-2 inset-x-2 flex items-center justify-between z-10">
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleSelect(wp.id, e)}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-cyan-500 text-slate-950 shadow-md ring-2 ring-white/60'
                                  : 'bg-black/60 text-white/70 hover:text-white border border-white/20'
                              }`}
                              title={isSelected ? 'ដោះ Select' : 'Select'}
                            >
                              {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            </button>

                            {/* Trash Delete */}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSingle(wp.id, wp.url, true, e)}
                              className="w-6 h-6 rounded-lg bg-black/60 hover:bg-red-500 text-white/80 hover:text-white flex items-center justify-center transition-all border border-white/20 hover:border-red-400"
                              title="លុបរូបនេះចោល"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Bottom Label */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end p-2.5">
                            <span className="text-[11px] font-bold text-white truncate flex items-center gap-1">
                              <span>{wp.preview}</span>
                              <span>{wp.name}</span>
                            </span>
                          </div>

                          {isActive && (
                            <div className="absolute bottom-2 right-2 bg-cyan-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full shadow-md">
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
                  <label className="text-xs font-bold text-slate-300">
                    Style Background គំរូ ({presets.length}):
                  </label>
                  {presets.length < DEFAULT_PRESET_WALLPAPERS.length && (
                    <button
                      type="button"
                      onClick={handleResetDefaultPresets}
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
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
                            ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] ring-2 ring-cyan-400/50'
                            : isSelected
                            ? 'border-indigo-400 ring-2 ring-indigo-400/40'
                            : 'border-white/[0.08] hover:border-white/30'
                        }`}
                      >
                        <img
                          src={wp.url}
                          alt={wp.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Top Controls: Checkbox (Select) + Trash (Delete) */}
                        <div className="absolute top-2 inset-x-2 flex items-center justify-between z-10">
                          {/* Checkbox */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleSelect(wp.id, e)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-cyan-500 text-slate-950 shadow-md ring-2 ring-white/60'
                                : 'bg-black/60 text-white/70 hover:text-white border border-white/20'
                            }`}
                            title={isSelected ? 'ដោះ Select' : 'Select'}
                          >
                            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </button>

                          {/* Trash Delete */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSingle(wp.id, wp.url, false, e)}
                            className="w-6 h-6 rounded-lg bg-black/60 hover:bg-red-500 text-white/80 hover:text-white flex items-center justify-center transition-all border border-white/20 hover:border-red-400"
                            title="លុប Wallpaper នេះចេញ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Bottom Title */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end p-2.5">
                          <span className="text-[11px] font-bold text-white truncate flex items-center gap-1">
                            <span>{wp.preview}</span>
                            <span>{wp.name}</span>
                          </span>
                        </div>

                        {isActive && (
                          <div className="absolute bottom-2 right-2 bg-cyan-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full shadow-md">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08]">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>ភាពច្បាស់នៃ Background (Opacity):</span>
                      <span className="font-mono text-cyan-300">
                        {localTheme.wallpaperOpacity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={95}
                      step={5}
                      value={localTheme.wallpaperOpacity}
                      onChange={(e) =>
                        updateTheme({
                          ...localTheme,
                          wallpaperOpacity: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>ភាពព្រិលស្រវាំង (Blur):</span>
                      <span className="font-mono text-cyan-300">
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
                      className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════ TAB 2: COLOR GLASS ═══════════ */}
          {activeTab === 'glass' && (
            <div className="flex flex-col gap-5">
              {/* Glass Color Preset Cards */}
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-2.5">
                  ជ្រើសរើសពណ៌ Color Glass (Glassmorphism Tint & Neon Border):
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PRESET_GLASS_COLORS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => handleSelectGlassColor(g.id)}
                      style={{
                        backgroundColor: g.tintRgba,
                        borderColor:
                          localTheme.glassColor === g.id ? g.accentHex : g.borderRgba,
                        boxShadow:
                          localTheme.glassColor === g.id ? g.glowShadow : 'none',
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                        localTheme.glassColor === g.id
                          ? 'ring-2 ring-white/50 scale-[1.02]'
                          : 'hover:scale-[1.01]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span
                          className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: 'rgba(0,0,0,0.4)',
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

                      <div className="text-xs font-black text-white">{g.name}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        កញ្ចក់រលើបរលោង + ពន្លឺ Glow
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Glass Controls: Blur, Opacity & Border Glow */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08]">
                {/* Glass Opacity */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-cyan-400" />
                      <span>ភាពថ្លា Glass Opacity:</span>
                    </span>
                    <span className="font-mono text-cyan-300">
                      {localTheme.glassOpacity || 70}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={95}
                    step={5}
                    value={localTheme.glassOpacity || 70}
                    onChange={(e) =>
                      updateTheme({
                        ...localTheme,
                        glassOpacity: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                {/* Glass Blur */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>កម្រិតព្រិល Glass Blur:</span>
                    </span>
                    <span className="font-mono text-indigo-300">
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
                    className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                {/* Border Glow Intensity */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>កម្រិតពន្លឺ Border Glow:</span>
                    </span>
                    <span className="font-mono text-amber-300 capitalize">
                      {localTheme.glassBorderGlow || 'vibrant'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['subtle', 'vibrant', 'neon'] as const).map((style) => (
                      <button
                        key={style}
                        onClick={() =>
                          updateTheme({ ...localTheme, glassBorderGlow: style })
                        }
                        className={`py-1 rounded text-[10px] font-bold capitalize transition-all ${
                          (localTheme.glassBorderGlow || 'vibrant') === style
                            ? 'bg-amber-500/30 text-amber-300 border border-amber-400'
                            : 'bg-white/5 text-slate-400 hover:text-white'
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

          {/* ═══════════ TAB 3: STICKERS ═══════════ */}
          {activeTab === 'stickers' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  ចុច Emoji Sticker ដើម្បីបិទអណ្តែតលើ Interface (Floating Stickers):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {PRESET_STICKERS.map((st) => (
                    <button
                      key={st.name}
                      onClick={() => handleAddEmojiSticker(st.url, st.name)}
                      className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-cyan-400/40 flex items-center gap-2.5 transition-all active:scale-95 text-left"
                    >
                      <span className="text-2xl">{st.url}</span>
                      <span className="text-xs font-bold text-slate-200">{st.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {localTheme.stickers.length > 0 && (
                <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Stickers កំពុងបង្ហាញ ({localTheme.stickers.length}):
                    </span>
                    <button
                      onClick={() => updateTheme({ ...localTheme, stickers: [] })}
                      className="text-xs text-red-400 hover:underline"
                    >
                      លុប Sticker ទាំងអស់
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {localTheme.stickers.map((s) => (
                      <div
                        key={s.id}
                        className="px-2.5 py-1 rounded-xl bg-white/[0.06] border border-white/10 flex items-center gap-2 text-xs text-white"
                      >
                        <span className="text-base">{s.url}</span>
                        <span>{s.name}</span>
                        <button
                          onClick={() => handleRemoveSticker(s.id)}
                          className="text-slate-400 hover:text-red-400 ml-1"
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
        <div className="p-3.5 px-6 border-t border-white/[0.08] bg-[#05080f] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleResetTheme}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>កំណត់ឡើងវិញ (Reset Default)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-slate-300 transition-colors"
            >
              បិទ (Close)
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
            >
              ✓ រួចរាល់ (រក្សាទុក)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
