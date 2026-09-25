import React, { useState } from 'react';
import { Palette, Image as ImageIcon, Sun, Moon, Sparkles, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { StudioCustomUITheme } from '../../types';

interface QuickThemeFloatingWidgetProps {
  theme: StudioCustomUITheme;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onChangeTheme: (theme: StudioCustomUITheme) => void;
  onOpenCustomizer: () => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const QUICK_WALLPAPERS = [
  {
    id: 'anime_sunset',
    name: 'Anime Sunset',
    preview: '🌅',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=2560&q=95&auto=format&fit=crop',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    preview: '🌃',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=2560&q=95&auto=format&fit=crop',
  },
  {
    id: 'midnight_purple',
    name: 'Midnight Nebula',
    preview: '🌌',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=2560&q=95&auto=format&fit=crop',
  },
  {
    id: 'emerald_matrix',
    name: 'Emerald Forest',
    preview: '🌲',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=2560&q=95&auto=format&fit=crop',
  },
];

export const QuickThemeFloatingWidget: React.FC<QuickThemeFloatingWidgetProps> = ({
  theme,
  isDarkMode,
  onToggleDarkMode,
  onChangeTheme,
  onOpenCustomizer,
  onShowToast,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showWallpaperMenu, setShowWallpaperMenu] = useState(false);

  const isWallpaperActive = theme.bgMode === 'wallpaper' && Boolean(theme.wallpaperUrl);

  const handleToggleWallpaper = () => {
    if (isWallpaperActive) {
      // Switch to soft pearl white color mode, keeping wallpaperUrl stored
      const updated: StudioCustomUITheme = {
        ...theme,
        bgMode: 'color',
        backgroundColor: '#f8fafc',
        backgroundPreset: 'pearl_snow',
      };
      onChangeTheme(updated);
      try {
        localStorage.setItem('animestudio_custom_theme', JSON.stringify(updated));
      } catch {}
      onShowToast?.('🥛 បានប្ដូរទៅពណ៌សគុជខ្យង ស្រទន់ភ្នែក (Pearl Snow Soft White)', 'info');
    } else {
      // Switch to wallpaper mode
      const targetUrl = theme.wallpaperUrl || QUICK_WALLPAPERS[0].url;
      const updated: StudioCustomUITheme = {
        ...theme,
        bgMode: 'wallpaper',
        wallpaperUrl: targetUrl,
        wallpaperOpacity: theme.wallpaperOpacity || 85,
        wallpaperBlur: theme.wallpaperBlur || 0,
      };
      onChangeTheme(updated);
      try {
        localStorage.setItem('animestudio_custom_theme', JSON.stringify(updated));
      } catch {}
      onShowToast?.('🖼️ បានបើកផ្ទាំងរូបភាព Wallpaper រួចរាល់!', 'success');
    }
  };

  const handleSelectQuickWallpaper = (url: string, name: string) => {
    const updated: StudioCustomUITheme = {
      ...theme,
      bgMode: 'wallpaper',
      wallpaperUrl: url,
      wallpaperOpacity: theme.wallpaperOpacity || 85,
      wallpaperBlur: theme.wallpaperBlur || 0,
    };
    onChangeTheme(updated);
    try {
      localStorage.setItem('animestudio_custom_theme', JSON.stringify(updated));
    } catch {}
    setShowWallpaperMenu(false);
    onShowToast?.(`🖼️ បានដាក់ Wallpaper "${name}" ជោគជ័យ!`, 'success');
  };

  const handleSetSoftPearlWhite = () => {
    const updated: StudioCustomUITheme = {
      ...theme,
      bgMode: 'color',
      backgroundColor: '#f8fafc',
      backgroundPreset: 'pearl_snow',
      themeMode: 'light',
    };
    onChangeTheme(updated);
    if (isDarkMode) onToggleDarkMode();
    try {
      localStorage.setItem('animestudio_custom_theme', JSON.stringify(updated));
    } catch {}
    onShowToast?.('🥛 ពណ៌សគុជខ្យង (Pearl Snow) — ស្រទន់ភ្នែក មិនចាំង ងាយស្រួលមើល!', 'success');
  };

  const handleSetPureCleanWhite = () => {
    const updated: StudioCustomUITheme = {
      ...theme,
      bgMode: 'color',
      backgroundColor: '#ffffff',
      backgroundPreset: 'clean_white',
      themeMode: 'light',
    };
    onChangeTheme(updated);
    if (isDarkMode) onToggleDarkMode();
    try {
      localStorage.setItem('animestudio_custom_theme', JSON.stringify(updated));
    } catch {}
    onShowToast?.('⚪ ពណ៌សសុទ្ធ (Pure White Studio) — ភ្លឺច្បាស់!', 'success');
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 font-khmer select-none">
      {/* Quick Wallpaper Submenu Popover */}
      {showWallpaperMenu && (
        <div className="absolute bottom-full right-0 mb-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 animate-in fade-in slide-in-from-bottom-2 duration-200 text-slate-800 dark:text-slate-100">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
            <span className="text-xs font-black flex items-center gap-1.5 text-sky-700 dark:text-sky-300">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>ជ្រើសរើស Wallpaper ភ្លាមៗ</span>
            </span>
            <button
              onClick={() => setShowWallpaperMenu(false)}
              className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕ បិទ
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_WALLPAPERS.map((wp) => {
              const isSelected = theme.wallpaperUrl === wp.url && theme.bgMode === 'wallpaper';
              return (
                <button
                  key={wp.id}
                  onClick={() => handleSelectQuickWallpaper(wp.url, wp.name)}
                  className={`relative p-2 rounded-xl border text-left flex flex-col gap-1 transition-all active:scale-95 group ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 ring-1 ring-sky-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-sky-300 bg-slate-50 dark:bg-slate-800/60'
                  }`}
                >
                  <div className="h-14 w-full rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 relative">
                    <img
                      src={wp.url}
                      alt={wp.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px]">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold truncate">
                    {wp.preview} {wp.name}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => {
              setShowWallpaperMenu(false);
              onOpenCustomizer();
            }}
            className="w-full mt-2.5 py-1.5 px-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>បើកផ្ទាំងប្ដូរ Wallpaper ទាំងអស់ & Upload</span>
          </button>
        </div>
      )}

      {/* Main Floating Pill Widget */}
      <div className="flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-300/80 dark:border-slate-700/80 rounded-2xl p-1.5 shadow-xl shadow-slate-900/10 text-xs">
        {/* Toggle Wallpaper Button */}
        <button
          onClick={handleToggleWallpaper}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold transition-all active:scale-95 ${
            isWallpaperActive
              ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm shadow-sky-500/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 hover:text-slate-900'
          }`}
          title={isWallpaperActive ? 'ចុចដើម្បីបិទ Wallpaper (ប្ដូរមកពណ៌សស្រទន់)' : 'ចុចដើម្បីបើក Wallpaper 4K ស្អាត'}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-bold">
            {isWallpaperActive ? '🖼️ Wallpaper បើក' : '🖼️ Wallpaper'}
          </span>
        </button>

        {/* Dropdown for quick wallpaper selection */}
        <button
          onClick={() => setShowWallpaperMenu(!showWallpaperMenu)}
          className="p-1.5 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="ជ្រើសរើស Wallpaper ផ្សេងៗ"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* 🥛 Soft Pearl White (Eye-Friendly Recommended) */}
        <button
          onClick={handleSetSoftPearlWhite}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-xl font-bold transition-all active:scale-95 ${
            !isWallpaperActive && !isDarkMode && (theme.backgroundColor === '#f8fafc' || theme.backgroundPreset === 'pearl_snow')
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="🥛 ពណ៌សគុជខ្យង (Pearl Snow) — ស្រទន់ភ្នែក មិនចាំងភ្នែក ងាយស្រួលមើលបំផុត"
        >
          <span className="text-sm">🥛</span>
          <span className="hidden md:inline text-[11px] font-bold">សស្រទន់</span>
        </button>

        {/* ⚪ Pure Clean White */}
        <button
          onClick={handleSetPureCleanWhite}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-xl font-bold transition-all active:scale-95 ${
            !isWallpaperActive && !isDarkMode && theme.backgroundColor === '#ffffff'
              ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-900 dark:text-sky-300 border border-sky-300 dark:border-sky-700 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="⚪ ពណ៌សសុទ្ធ (Pure Clean White Studio)"
        >
          <span className="text-sm">⚪</span>
          <span className="hidden md:inline text-[11px] font-bold">សសុទ្ធ</span>
        </button>

        {/* 🌙 Night / Light Toggle */}
        <button
          onClick={onToggleDarkMode}
          className={`p-1.5 rounded-xl font-bold transition-all active:scale-95 ${
            isDarkMode
              ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
          }`}
          title={isDarkMode ? 'ប្ដូរទៅ Light Mode ☀️' : 'ប្ដូរទៅ Night Mode 🌙'}
        >
          {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* Full Customizer Button */}
        <button
          onClick={onOpenCustomizer}
          className="flex items-center gap-1 px-2 py-1.5 rounded-xl font-bold bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 dark:from-slate-800 dark:to-slate-800 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-slate-700 transition-all active:scale-95"
          title="បើកផ្ទាំងកែសម្រួលពណ៌ និង Wallpaper ពេញលេញ (Full Customizer)"
        >
          <Palette className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span className="text-[11px] font-bold">🎨 កែពណ៌</span>
        </button>
      </div>
    </div>
  );
};
