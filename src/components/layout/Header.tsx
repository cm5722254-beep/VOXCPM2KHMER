import React, { useState } from 'react';
import {
  Film,
  Menu,
  Save,
  RotateCcw,
  RotateCw,
  Play,
  Share2,
  Settings,
  User as UserIcon,
  Loader2,
  LogOut,
  ChevronDown,
  Sparkles,
  Keyboard,
  Key,
  FolderKanban,
  HardDrive,
  Zap,
  Plus,
  BookOpen,
  Palette,
  Volume2,
  VolumeX,
  Bell,
  Crown,
  Sun,
  Moon,
  Mic,
  Activity,
  Video,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Heart,
} from 'lucide-react';
import { User, VoxcpmStatus, ProjectGroup, ProjectFile } from '../../types';
import { isSoundMuted, toggleSoundMute, playOptionSound } from '../../utils/soundEffects';
import { getLicenseInfo } from '../../utils/subscription';
import { ThemeToggle } from '../ui/ThemeToggle';

interface HeaderProps {
  activeProjectTitle: string;
  isSaving: boolean;
  user: User | null;
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onSaveProject?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onPreview?: () => void;
  onOpenAuthModal?: () => void;
  onOpenLicenseModal?: () => void;
  engineMode?: string;
  onSwitchEngine?: (mode: string) => void;
  voxStatus?: VoxcpmStatus | null;
  onOpenVoxModal?: () => void;
  onOpenAdmin?: () => void;
  onOpenDownloader?: () => void;
  onOpenThumbnailStudio?: () => void;
  activeTab?: string;
  onSelectTab?: (tab: any) => void;
  videoCount?: number;
  isDubbing?: boolean;
  dubbingProgress?: number;
  onOpenShortcuts?: () => void;
  projectGroups?: ProjectGroup[];
  activeGroupId?: string | null;
  onSelectGroup?: (groupId: string | null) => void;
  onOpenGroupManager?: () => void;
  shelfCount?: number;
  onOpenShelf?: () => void;
  onOpenHardwareTurbo?: () => void;
  onOpenGuide?: () => void;
  onOpenCustomizer?: () => void;
  onOpenUpdateModal?: () => void;
  onToggleMobileMenu?: () => void;
  hasUpdateAvailable?: boolean;
  latestVersion?: string;
  currentVersion?: string;
  isDarkMode?: boolean;
  onToggleDarkMode?: (target?: boolean) => void;
  bgMode?: 'color' | 'wallpaper';
  onToggleWallpaperMode?: () => void;
  recentVideos?: ProjectFile[];
  onSelectVideoFile?: (file: ProjectFile) => void;
  onOneClickDubbing?: () => void;
  onOpenSponsor?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeProjectTitle,
  isSaving,
  user,
  onLogout,
  onOpenSettings,
  onOpenExport,
  onSaveProject,
  onUndo,
  onRedo,
  onPreview,
  onOpenAuthModal,
  onOpenLicenseModal,
  onOpenAdmin,
  engineMode = 'local',
  onSwitchEngine,
  voxStatus,
  onOpenVoxModal,
  isDubbing = false,
  dubbingProgress = 0,
  onOpenShortcuts,
  projectGroups = [],
  activeGroupId = null,
  onSelectGroup,
  onOpenGroupManager,
  shelfCount = 0,
  onOpenShelf,
  onOpenHardwareTurbo,
  onOpenGuide,
  onOpenCustomizer,
  onOpenUpdateModal,
  onToggleMobileMenu,
  hasUpdateAvailable = false,
  latestVersion = 'V2.5 PRO',
  currentVersion = 'V2.5 PRO',
  isDarkMode = true,
  onToggleDarkMode,
  bgMode = 'color',
  onToggleWallpaperMode,
  recentVideos = [],
  onSelectVideoFile,
  onOneClickDubbing,
  onOpenSponsor,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [soundMuted, setSoundMutedState] = useState(() => isSoundMuted());

  const handleToggleSound = () => {
    const next = toggleSoundMute();
    setSoundMutedState(next);
    if (!next) {
      playOptionSound();
    }
  };

  const rawTitle = activeProjectTitle || 'វីដេអូ_ភាគ១_2026';
  const cleanTitle = (raw: string) => {
    let s = raw.split(/[/\\]/).pop() || raw;
    s = s.replace(/.*mediaFile[-_]*/i, '');
    s = s.replace(/[-_]?\d{4,}@[^.\s]*/g, '');
    s = s.replace(/[-_]?(1080P|720P|4K|4000K|300406853|raw|HD)\b/gi, '');
    s = s.replace(/\.(mp4|mkv|mov|avi|webm)$/i, '');
    s = s.replace(/[-_]{2,}/g, ' ').replace(/\s+/g, ' ').trim();
    return s || 'វីដេអូ_ភាគ១';
  };

  const displayTitle = cleanTitle(rawTitle);
  const activeGroup = projectGroups.find((g) => g.id === activeGroupId);

  return (
    <header className="app-header h-14 border-b border-white/[0.08] bg-[#141417]/95 backdrop-blur-2xl text-slate-100 px-3 sm:px-4 flex items-center justify-between z-40 select-none font-khmer shadow-lg transition-colors duration-200 shrink-0">
      {/* ── Left: Studio Branding & Selectors ── */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        {/* Mobile Hamburger Menu Button */}
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 rounded-xl bg-[#18181C] hover:bg-[#222228] border border-white/[0.08] text-emerald-400 active:scale-95 transition-all"
            title="បើកមឺនុយ (Menu)"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Studio Logo: Modern Microphone + AI Waveform Icon */}
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={onOpenUpdateModal}
          title="ស្ទូឌីយោឌាប់សំឡេងខ្មែរ PRO — AI Dubbing Studio"
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 via-teal-600/30 to-indigo-600/20 border border-emerald-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,173,0.25)] group-hover:scale-105 group-hover:border-emerald-300 transition-all">
              <div className="relative flex items-center justify-center">
                <Mic className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(0,242,173,0.8)]" />
                <Activity className="w-3 h-3 text-teal-300 absolute -bottom-1 -right-1 drop-shadow-[0_0_6px_rgba(0,242,173,0.8)]" />
              </div>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#141417] animate-pulse" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-wide text-white font-khmer">
                ស្ទូឌីយោឌាប់សំឡេងខ្មែរ PRO
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium tracking-wide">
              CapCut Studio Edition
            </span>
          </div>
        </div>

        <div className="h-6 w-px bg-white/[0.08] hidden sm:block" />

        {/* Project Selector (គម្រោង [ គម្រោងរឿងរបស់ខ្ញុំ ▼ ]) */}
        <div 
          onClick={onOpenGroupManager}
          className="btn-glass hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl hover:border-emerald-400/50 transition-all text-xs cursor-pointer shadow-sm"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <FolderKanban className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] text-zinc-400 font-bold tracking-wider leading-none font-khmer">
              គម្រោង
            </span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-200">
              <span className="max-w-[120px] md:max-w-[150px] truncate font-khmer">
                {activeProjectTitle ? displayTitle : 'គម្រោងរឿងរបស់ខ្ញុំ'}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
            </div>
          </div>
        </div>

        {/* Video Selector (វីដេអូ [ video name or គ្មានវីដេអូ ]) */}
        <div 
          onClick={onOpenShelf}
          className="btn-glass hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl hover:border-emerald-400/50 transition-all text-xs cursor-pointer shadow-sm"
        >
          <div className="w-6 h-6 rounded-md overflow-hidden shrink-0 border border-white/10 bg-black/40 flex items-center justify-center">
            {rawTitle && rawTitle !== 'demo_video_2026' ? (
              <Video className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Video className="w-3.5 h-3.5 text-zinc-500" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] text-zinc-400 font-bold tracking-wider leading-none font-khmer">
              វីដេអូ
            </span>
            <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-200">
              <span className="max-w-[130px] lg:max-w-[160px] truncate">
                {rawTitle && rawTitle !== 'demo_video_2026' ? (rawTitle.endsWith('.mp4') || rawTitle.endsWith('.mkv') ? displayTitle + '.mp4' : displayTitle) : 'គ្មានវីដេអូ (សូម Upload)'}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
            </div>
          </div>
        </div>

        {/* Group Selector (ក្រុម [ ទូទៅ ▼ ]) */}
        <div 
          onClick={onOpenGroupManager}
          className="btn-glass hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl hover:border-[#00C2FF]/50 transition-all text-xs cursor-pointer shadow-sm"
        >
          <div className="w-6 h-6 rounded-lg bg-[#00C2FF]/10 border border-[#00C2FF]/30 flex items-center justify-center shrink-0">
            <FolderKanban className="w-3.5 h-3.5 text-[#00C2FF]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] text-zinc-400 font-bold tracking-wider leading-none font-khmer">
              ក្រុម
            </span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-200">
              <span className="font-khmer">{activeGroup ? activeGroup.name : 'ទូទៅ'}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Center/Right: Actions & Profile ── */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* 🎬 1-CLICK AI CINEMA DUBBING (ស្វ័យប្រវត្តិ ១០០%) */}
        {onOneClickDubbing && (
          <button
            type="button"
            onClick={onOneClickDubbing}
            disabled={isDubbing}
            className="relative group overflow-hidden flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:via-rose-400 hover:to-indigo-500 text-white font-black text-xs shadow-[0_0_22px_rgba(244,63,94,0.45)] hover:shadow-[0_0_30px_rgba(244,63,94,0.7)] border border-amber-300/40 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            title="ចុចតែ 1-Click: ស្ដាប់ & បកប្រែ, លុបសំឡេងដើមទុកតែភ្លេង, បែងចែកតួអង្គ (ប្រុស ស្រី ក្មេង ចាស់ បន្ទាប់បន្សំ), សំឡេង 1:1 និង Clone ពីរឿង, បញ្ចូលសំឡេងខ្មែរ 1% ដល់ 100%"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400" />
            </span>
            <Sparkles className="w-3.5 h-3.5 text-yellow-200 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="hidden sm:inline tracking-wide font-khmer drop-shadow-md">
              {isDubbing ? `កំពុងដំណើការ ${dubbingProgress}%` : '🎬 1-Click AI ឌាប់រឿង (១០០%)'}
            </span>
            <span className="sm:hidden tracking-wide font-khmer drop-shadow-md">
              {isDubbing ? `${dubbingProgress}%` : '🎬 1-Click'}
            </span>
          </button>
        )}

        {/* Live Dubbing Progress Pill if active */}
        {isDubbing && (
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#00C2FF]/15 border border-[#00C2FF]/50 text-[#00C2FF] animate-pulse text-xs font-bold shrink-0">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00C2FF]" />
            <span className="hidden sm:inline">កំពុងបញ្ចូលសំឡេង... {dubbingProgress}%</span>
            <span className="sm:hidden">{dubbingProgress}%</span>
          </div>
        )}

        {/* ⚡ TURBO Button */}
        {onOpenHardwareTurbo && (
          <button
            type="button"
            onClick={onOpenHardwareTurbo}
            className="btn-glass hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-[#00C2FF] hover:text-white font-black text-xs border border-[#00C2FF]/40 hover:border-[#00C2FF]/70 transition-all active:scale-95 shadow-sm shrink-0"
            title="បង្កើនល្បឿន AI Voice & Rendering តាម GPU / CPU Turbo"
          >
            <Zap className="w-3.5 h-3.5 fill-[#00C2FF] text-[#00C2FF]" />
            <span className="tracking-wide hidden md:inline">TURBO</span>
          </button>
        )}

        {/* ❤️ Add Sponsor Button */}
        {onOpenSponsor && (
          <button
            type="button"
            onClick={onOpenSponsor}
            className="btn-glass-purple hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs active:scale-95 shadow-sm shrink-0"
            title="គ្រប់គ្រង & បន្ថែម Sponsor (Add Sponsor)"
          >
            <Heart className="w-3.5 h-3.5 text-purple-300 fill-purple-400/40" />
            <span className="tracking-wide font-khmer hidden md:inline">Sponsor</span>
          </button>
        )}

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="btn-glass p-2 rounded-xl text-zinc-300 hover:text-white hover:border-emerald-400/50 transition-all shadow-sm active:scale-95"
          title="ការកំណត់ស្ទូឌីយោ (Settings)"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Theme Toggle Component with Dropdown */}
        {onToggleDarkMode && (
          <ThemeToggle
            currentTheme={isDarkMode ? 'dark' : 'light'}
            onThemeChange={(theme) => onToggleDarkMode(theme === 'dark')}
          />
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="btn-glass p-2 rounded-xl text-zinc-300 hover:text-white hover:border-emerald-400/50 transition-all shadow-sm active:scale-95"
            title="ដំណឹងស្ទូឌីយោ (Notifications)"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#141417] animate-pulse" />
          </button>

          {showNotificationMenu && (
            <div
              className="glass-panel-pro absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-2xl p-3 z-50 text-xs animate-in fade-in"
              onMouseLeave={() => setShowNotificationMenu(false)}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                <span className="font-bold text-white font-khmer">ដំណឹងថ្មីៗ (Notifications)</span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  1 ថ្មី
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-[#00C2FF] font-bold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="font-khmer">ស្វាគមន៍មកកាន់ Khmer Dubbing Pro!</span>
                </div>
                <p className="text-[10px] text-zinc-300 leading-relaxed font-khmer">
                  ប្រព័ន្ធបញ្ចូលសំឡេង AI ជំនាន់ថ្មីបានត្រៀមរួចជាស្រេច ជាមួយសំឡេងខ្មែរធម្មជាតិ 100% និង Multitrack Timeline។
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic License Status Badge */}
        {(() => {
          const lic = getLicenseInfo(user);
          return (
            <button
              type="button"
              onClick={onOpenLicenseModal}
              className={`btn-glass flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-sm font-khmer ${
                lic.isLicensed
                  ? lic.isLifetime
                    ? 'btn-glass-amber'
                    : lic.color === 'amber'
                    ? 'border-amber-500/50 text-amber-300 animate-pulse'
                    : 'border-cyan-500/50 text-cyan-300'
                  : 'btn-glass-danger animate-pulse'
              }`}
              title={`កម្រិតអាជ្ញាប័ណ្ណ: ${lic.planLabel} | ផុតកំណត់: ${lic.formattedDate}`}
            >
              {lic.isLicensed ? (
                lic.isLifetime ? (
                  <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                )
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              )}
              <span className="tracking-wide">{lic.badgeLabel}</span>
            </button>
          );
        })()}

        {/* User Profile Avatar & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="btn-glass flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl hover:border-[#00C2FF]/50 transition-all text-xs active:scale-95 shadow-sm"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-400 text-black font-bold text-xs flex items-center justify-center shadow-md">
              {user?.username ? user.username.slice(0, 1).toUpperCase() : 'A'}
            </div>
            <div className="flex flex-col text-left leading-tight hidden xl:flex">
              <span className="font-bold text-white text-[11px] truncate max-w-[110px] font-khmer">
                {user?.username || 'អ្នកប្រើប្រាស់'}
              </span>
              <span className="text-[9px] text-[#00C2FF] font-semibold font-khmer">
                {getLicenseInfo(user).badgeLabel}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {showUserMenu && (
            <div
              className="glass-panel-pro absolute right-0 top-full mt-2 w-64 rounded-2xl shadow-2xl p-2.5 z-50 text-xs animate-in fade-in font-khmer"
              onMouseLeave={() => setShowUserMenu(false)}
            >
              {/* User & License Info Header */}
              {(() => {
                const lic = getLicenseInfo(user);
                return (
                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] mb-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs truncate">
                        {user?.username || 'អ្នកប្រើប្រាស់'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        lic.isLicensed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {lic.isLicensed ? 'Active' : 'Unlicensed'}
                      </span>
                    </div>

                    <div className="text-[11px] text-cyan-300 font-medium">
                      {lic.planLabel}
                    </div>

                    <div className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-300">
                      <span>ផុតកំណត់:</span>
                      <span className="font-bold text-amber-300 font-mono">
                        {lic.formattedDate}
                      </span>
                    </div>

                    {lic.daysLeft !== null && (
                      <div className="flex items-center justify-between text-[10px] text-slate-300">
                        <span>រយៈពេលនៅសល់:</span>
                        <span className="font-bold text-cyan-300">
                          {lic.daysLeft > 0 ? `${lic.daysLeft} ថ្ងៃ` : `${lic.hoursLeft} ម៉ោង`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {onOpenAdmin && (!user || user?.role === 'admin') && (
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenAdmin();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/[0.06] text-amber-300 font-semibold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>ផ្ទាំងគ្រប់គ្រង Admin (License & Users)</span>
                </button>
              )}

              {onOpenSponsor && (
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenSponsor();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/[0.06] text-purple-300 font-semibold transition-colors"
                >
                  <Heart className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>គ្រប់គ្រង Sponsor (Add Sponsor)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenLicenseModal?.();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/[0.06] text-cyan-300 font-semibold transition-colors"
              >
                <Key className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>គ្រប់គ្រង / បន្តសុពលភាព License</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/[0.06] text-slate-200 font-semibold transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>ការកំណត់ (Settings)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
