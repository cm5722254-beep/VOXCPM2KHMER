import React, { useState } from 'react';
import {
  Menu,
  RotateCcw,
  RotateCw,
  Play,
  Share2,
  Settings,
  Bell,
  Crown,
  Sparkles,
  Zap,
  CheckCircle2,
  Cloud,
  ChevronDown,
  Key,
  ShieldAlert,
  Clock,
  Heart,
  Video,
  Edit2,
  Bot,
  Flame,
  Search,
  Activity,
  Shield,
  Rocket,
} from 'lucide-react';
import { User, VoxcpmStatus, ProjectGroup, ProjectFile } from '../../types';
import { getLicenseInfo } from '../../utils/subscription';
import { ThemeToggle } from '../ui/ThemeToggle';
import { DragonLogo } from '../dragon/DragonLogo';
import { DragonButton } from '../dragon/DragonButton';

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
  onOpenHardwareReport?: () => void;
  onOpenDiagnostics?: () => void;
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
  onOpenAIAssistant?: () => void;
  onOpenVIPModal?: () => void;
  onOpenSearch?: () => void;
  onOpenRoadmap?: () => void;
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
  onOpenHardwareReport,
  onOpenDiagnostics,
  onOpenGuide,
  onOpenCustomizer,
  onOpenUpdateModal,
  onToggleMobileMenu,
  hasUpdateAvailable = false,
  latestVersion = 'V3.0 PRO',
  currentVersion = 'V3.0 PRO',
  isDarkMode = true,
  onToggleDarkMode,
  bgMode = 'color',
  onToggleWallpaperMode,
  recentVideos = [],
  onSelectVideoFile,
  onOneClickDubbing,
  onOpenSponsor,
  onOpenAIAssistant,
  onOpenVIPModal,
  onOpenSearch,
  onOpenRoadmap,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [projectTitle, setProjectTitle] = useState(activeProjectTitle || 'គម្រោងរឿង_ភាគ០១_2026');

  const lic = getLicenseInfo(user);

  const cleanTitle = (raw: string) => {
    let s = raw.split(/[/\\]/).pop() || raw;
    s = s.replace(/.*mediaFile[-_]*/i, '');
    s = s.replace(/[-_]?\d{4,}@[^.\s]*/g, '');
    s = s.replace(/[-_]?(1080P|720P|4K|4000K|300406853|raw|HD)\b/gi, '');
    s = s.replace(/\.(mp4|mkv|mov|avi|webm)$/i, '');
    s = s.replace(/[-_]{2,}/g, ' ').replace(/\s+/g, ' ').trim();
    return s || 'គម្រោងរឿង_ភាគ០១';
  };

  const displayTitle = cleanTitle(projectTitle);

  return (
    <header className="relative h-14 border-b border-red-950/40 bg-[#100A0C]/95 backdrop-blur-2xl px-3 sm:px-4 flex items-center justify-between z-40 select-none font-khmer shrink-0">
      {/* Cinematic gradient top line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

      {/* ── LEFT: Project Name, Save Status, Cloud Sync ── */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Mobile Menu Toggle */}
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-red-400 active:scale-95 transition-all"
            title="មឺនុយ"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Dragon Emblem on compact screens */}
        <div
          onClick={onOpenUpdateModal}
          className="cursor-pointer flex items-center gap-1.5 group"
          title="DRAGON DABBER PRO — AI Khmer Dubbing Studio"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#DC2626] via-[#B91C1C] to-[#F59E0B] flex items-center justify-center p-[1px] shadow-[0_0_14px_rgba(220,38,38,0.5)]">
            <div className="w-full h-full bg-[#0E0608] rounded-[10px] flex items-center justify-center">
              <img src="/dragon_logo.png" alt="Dragon" className="w-full h-full object-cover rounded-md group-hover:scale-110 transition-transform" />
            </div>
          </div>
          {/* Version badge with glow when update available */}
          {hasUpdateAvailable && (
            <span
              className={`hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)] cursor-pointer ${hasUpdateAvailable ? 'animate-glow-pulse' : ''}`}
              onClick={onOpenUpdateModal}
            >
              <Sparkles className="w-2.5 h-2.5" />
              {latestVersion}
            </span>
          )}
        </div>

        {/* Editable Project Title Pill */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-red-500/30 hover:bg-red-500/5 transition-all duration-200 group">
          <Video className="w-3.5 h-3.5 text-red-400 shrink-0" />
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              className="bg-transparent text-xs text-white font-bold outline-none border-b border-red-500 max-w-[140px] sm:max-w-[180px]"
            />
          ) : (
            <span
              onClick={() => setIsEditingTitle(true)}
              className="text-xs font-bold text-slate-200 max-w-[120px] sm:max-w-[170px] truncate cursor-pointer hover:text-white"
              title="ចុចដើម្បីកែឈ្មោះគម្រោង"
            >
              {displayTitle}
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsEditingTitle(!isEditingTitle)}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        </div>

        {/* Save Status Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-semibold font-khmer">
          {isSaving ? (
            <span className="text-red-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="animate-pulse">កំពុងរក្សាទុក...</span>
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1.5 animate-in fade-in duration-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>បានរក្សាទុក</span>
            </span>
          )}
        </div>

        {/* Cloud Sync Status */}
        <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] text-slate-400 font-khmer">
          <Cloud className="w-3 h-3 text-amber-400" />
          <span>ភ្ជាប់ពពក</span>
        </div>
      </div>

      {/* ── CENTER: Undo, Redo, Auto Save, DRAGON AI Assistant ── */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo — Glass pill */}
        <div className="hidden md:flex items-center gap-0 p-0.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <button
            type="button"
            onClick={onUndo}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all duration-150 active:scale-95"
            title="មិនធ្វើវិញ (Undo: Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all duration-150 active:scale-95"
            title="ធ្វើឡើងវិញ (Redo: Ctrl+Shift+Z)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Auto Save Toggle */}
        <button
          type="button"
          onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
          className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors font-khmer ${
            autoSaveEnabled
              ? 'bg-white/[0.04] border-amber-500/40 text-amber-400'
              : 'bg-white/[0.03] border-white/[0.06] text-slate-500'
          }`}
          title="បើក/បិទ ការរក្សាទុកស្វ័យប្រវត្តិ"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${autoSaveEnabled ? 'bg-amber-400' : 'bg-slate-600'}`} />
          <span>រក្សាទុកស្វ័យប្រវត្តិ</span>
        </button>

        {/* 🐲 DRAGON AI Glowing Command Button — Cinematic */}
        <button
          type="button"
          onClick={onOpenAIAssistant}
          className="relative group overflow-hidden flex items-center gap-2 px-4 py-1.5 rounded-xl font-black text-xs text-white border border-red-500/50 active:scale-95 transition-all duration-200 shrink-0 shadow-[0_0_24px_rgba(220,38,38,0.5)] hover:shadow-[0_0_35px_rgba(220,38,38,0.7)] select-none"
          style={{ background: 'linear-gradient(135deg, #DC2626, #B91C1C, #F59E0B)' }}
          title="បើក DRAGON AI — ជំនួយការបញ្ជាស្ទូឌីយោដោយសំឡេង & AI"
        >
          {/* Animated light sweep */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[600ms]" />

          {/* Pulse ring indicator */}
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F59E0B]" />
          </span>

          <img src="/dragon_logo.png" alt="Dragon" className="w-4 h-4 rounded-sm" />
          <span className="font-ui tracking-wider drop-shadow-sm font-black">
            DRAGON AI
          </span>
        </button>

        {/* 🚀 Next Version Commercial Roadmap Button */}
        {onOpenRoadmap && (
          <button
            type="button"
            onClick={onOpenRoadmap}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 text-red-200 hover:text-white text-xs font-bold transition-all active:scale-95 shrink-0 shadow-sm font-khmer"
            title="មើលមុខងារ Advanced AI Dubbing នឹងមកដល់ក្នុង Version បន្ទាប់"
          >
            <Rocket className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>🚀 Version បន្ទាប់</span>
          </button>
        )}
      </div>

      {/* ── RIGHT: Search, Preview, Export, Notifications, VIP ── */}
      <div className="flex items-center gap-2">
        {/* Light / Dark Mode Toggle */}
        <div className="hidden sm:block mr-1">
          <ThemeToggle
            currentTheme={isDarkMode ? 'dark' : 'light'}
            onThemeChange={(theme) => onToggleDarkMode?.(theme === 'dark')}
          />
        </div>

        {/* Global Quick Search button (Ctrl + K) */}
        {onOpenSearch && (
          <button
            type="button"
            onClick={onOpenSearch}
            className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-red-500/30 text-slate-400 hover:text-white text-xs transition-all duration-200 group"
            title="ស្វែងរកបញ្ជា & ឧបករណ៍ (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-red-400 group-hover:text-red-300 transition-colors" />
            <span className="hidden xl:inline text-[11px]">ស្វែងរក...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[9px] font-mono text-slate-500">Ctrl K</kbd>
          </button>
        )}

        {/* Preview Button */}
        {onPreview && (
          <button
            type="button"
            onClick={onPreview}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] hover:border-red-500/30 text-xs font-bold text-slate-300 hover:text-white transition-all duration-200 font-khmer"
            title="មើលវីដេអូសាកល្បង"
          >
            <Play className="w-3.5 h-3.5 text-red-400" />
            <span>មើលសាកល្បង</span>
          </button>
        )}

        {/* Hardware Turbo Status */}
        {onOpenHardwareTurbo && (
          <button
            type="button"
            onClick={onOpenHardwareTurbo}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-amber-500/40 hover:border-amber-400 text-amber-400 text-xs font-bold transition-colors font-khmer"
            title="GPU Turbo Acceleration"
          >
            <Zap className="w-3 h-3 fill-amber-400" />
            <span>⚡ ល្បឿនលឿន</span>
          </button>
        )}

        {/* Hardware Report Button */}
        {onOpenHardwareReport && (
          <button
            type="button"
            onClick={onOpenHardwareReport}
            className="hidden lg:flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white/[0.04] border border-red-500/30 hover:border-red-500/60 text-red-400 text-xs transition-colors"
            title="ស្ថានភាព Hardware"
          >
            <Activity className="w-3 h-3" />
          </button>
        )}

        {/* Diagnostics Button */}
        {onOpenDiagnostics && (
          <button
            type="button"
            onClick={onOpenDiagnostics}
            className="hidden lg:flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white/[0.04] border border-amber-500/30 hover:border-amber-500/60 text-amber-400 text-xs transition-colors"
            title="ពិនិត្យប្រព័ន្ធ System"
          >
            <Shield className="w-3 h-3" />
          </button>
        )}

        {/* 🔥 Export Button — Enhanced glow */}
        <div className="shadow-[0_0_16px_rgba(220,38,38,0.35)] hover:shadow-[0_0_24px_rgba(220,38,38,0.55)] rounded-xl transition-shadow duration-200">
          <DragonButton
            variant="energy"
            size="sm"
            onClick={onOpenExport}
            icon={<Share2 className="w-3.5 h-3.5" />}
          >
            បញ្ចេញវីដេអូ
          </DragonButton>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] text-slate-400 hover:text-white transition-all duration-150 relative"
            title="ដំណឹងថ្មីៗ (Notifications)"
          >
            <Bell className="w-4 h-4" />
            {/* Animated dot — bounces when there are notifications */}
            <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#100A0C] ${true ? 'animate-bounce' : 'animate-pulse'}`} />
          </button>

          {showNotificationMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#180D11] border border-white/[0.08] shadow-2xl p-3 z-50 text-xs font-khmer animate-in fade-in"
              onMouseLeave={() => setShowNotificationMenu(false)}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] mb-2">
                <span className="font-bold text-white">ដំណឹងស្ទូឌីយោ</span>
                <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold">
                  1 ថ្មី
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0E0608] border border-white/[0.06] space-y-1">
                <div className="flex items-center gap-1.5 text-red-400 font-bold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ស្វាគមន៍មកកាន់ Dragon Dabber Pro!</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-khmer">
                  ប្រព័ន្ធបញ្ចូលសំឡេង AI ជំនាន់ថ្មីត្រៀមរួចជាស្រេច ជាមួយសំឡេងខ្មែរ Neural 100+ និង Dragon Command Center។
                </p>
              </div>
            </div>
          )}
        </div>

        {/* VIP Badge / Upgrade Trigger */}
        <button
          type="button"
          onClick={onOpenVIPModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-sm font-khmer ${
            lic.isLifetime
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
              : lic.isLicensed
              ? 'bg-red-500/20 border-red-500/50 text-red-300'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
          title="Dragon VIP Plan"
        >
          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
          <span className="hidden sm:inline">{lic.isLifetime ? 'VIP LIFETIME' : lic.badgeLabel}</span>
        </button>

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] text-slate-400 hover:text-white transition-all duration-150"
          title="ការកំណត់ (Settings)"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Profile Avatar & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] text-xs transition-all duration-150"
          >
            {/* Avatar with animated ring */}
            <div className="w-8 h-8 rounded-xl overflow-hidden ring-2 ring-red-500/30 hover:ring-red-500/60 ring-offset-1 ring-offset-[#100A0C] transition-all cursor-pointer">
              <div className="w-full h-full bg-gradient-to-tr from-[#DC2626] to-[#F59E0B] text-white font-bold text-xs flex items-center justify-center">
                {user?.username ? user.username.slice(0, 1).toUpperCase() : 'D'}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[#180D11] border border-white/[0.08] shadow-2xl p-2.5 z-50 text-xs font-khmer animate-in fade-in"
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <div className="p-3 rounded-xl bg-[#0E0608] border border-white/[0.06] mb-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{user?.username || 'Dragon Creator'}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#16D9FF]/20 text-[#16D9FF]">
                    {lic.planLabel}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  ផុតកំណត់: <span className="font-mono text-[#00FFA8]">{lic.formattedDate}</span>
                </div>
              </div>

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
                  <span>Admin Control Center</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenVIPModal?.();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/[0.06] text-[#16D9FF] font-semibold transition-colors"
              >
                <Crown className="w-3.5 h-3.5 text-[#16D9FF] shrink-0" />
                <span>Dragon VIP Membership</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenLicenseModal?.();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/[0.06] text-slate-200 font-semibold transition-colors"
              >
                <Key className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>គ្រប់គ្រង License Key</span>
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
