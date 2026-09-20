import React, { useState } from 'react';
import {
  Film,
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
} from 'lucide-react';
import { User, VoxcpmStatus, ProjectGroup } from '../../types';
import { VoxCPM2OnlineToggle } from '../ui/VoxCPM2OnlineToggle';

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
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Extract clean project and episode names
  const rawTitle = activeProjectTitle || 'Perfect World EP145.mp4';
  const cleanName = rawTitle.replace(/\.(mp4|mkv|mov|avi|webm)$/i, '');
  const epMatch = cleanName.match(/(EP\s*\d+|ភាគ\s*\d+|Episode\s*\d+|\b\d+\b)/i);
  const epLabel = epMatch ? epMatch[0].toUpperCase() : 'EP 145';
  const displayTitle = cleanName.replace(epLabel, '').trim() || cleanName;

  const isCloud = engineMode === 'cloud';

  return (
    <header className="h-14 border-b border-white/[0.08] bg-[#070a13]/95 backdrop-blur-xl px-4 flex items-center justify-between z-40 select-none font-khmer">
      {/* ── Left: Studio Branding & Project Info ── */}
      <div className="flex items-center gap-3">
        {/* Animated Studio Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)] ring-1 ring-white/30 group-hover:scale-105 transition-all animate-pulse-glow">
              <Film className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#070a13] animate-record" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-tight font-ui animate-aurora">
                ANIMESTUDIO
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 border-dance">
                PRO 2026
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">ស្ទូឌីយោបញ្ចូលសំឡេង AI</span>
          </div>
        </div>

        <div className="h-4 w-px bg-white/10 hidden sm:block" />

        {/* Current Project & Episode Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
          <span className="text-xs font-semibold text-slate-200 max-w-[160px] truncate" title={rawTitle}>
            {displayTitle}
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
            {epLabel}
          </span>

          <div className="h-3 w-px bg-white/10" />

          <div className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25">
            <span>ចិន</span>
            <span className="text-amber-400/60">→</span>
            <span>ខ្មែរ</span>
          </div>
        </div>

        {/* Active Group / Series Badge & Selector */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs">
          <FolderKanban className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <select
            value={activeGroupId || ''}
            onChange={(e) => onSelectGroup?.(e.target.value || null)}
            className="bg-transparent border-none text-xs font-medium text-indigo-200 focus:outline-none cursor-pointer pr-1"
            title="ជ្រើសរើសក្រុមរឿង (Project Group)"
          >
            <option value="" className="bg-[#0b0f19] text-slate-300">📁 រឿងទូទៅ (គ្មានក្រុម)</option>
            {projectGroups.map(g => (
              <option key={g.id} value={g.id} className="bg-[#0b0f19] text-white">
                {g.name}
              </option>
            ))}
          </select>
          {onOpenGroupManager && (
            <button
              onClick={onOpenGroupManager}
              className="hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors"
              title="គ្រប់គ្រង ឬបង្កើតក្រុមរឿងថ្មី"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Quick Shelf Button */}
        {onOpenShelf && (
          <button
            onClick={onOpenShelf}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 transition-all text-xs"
            title="ឃ្លាំងផ្ទុកវីដេអូ (អតិបរមា ១០ វីដេអូ)"
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-medium hidden xl:inline">ឃ្លាំងវីដេអូ</span>
            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
              shelfCount >= 10 ? 'bg-amber-500/30 text-amber-300' : 'bg-emerald-500/30 text-emerald-200'
            }`}>
              {shelfCount}/10
            </span>
          </button>
        )}

        {/* Hardware Turbo Button */}
        {onOpenHardwareTurbo && (
          <button
            onClick={onOpenHardwareTurbo}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all text-xs font-bold shadow-[0_0_10px_rgba(245,158,11,0.1)]"
            title="បង្កើនល្បឿន Render & TTS តាមកម្លាំង Hardware (CPU/GPU Turbo)"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-[11px]">TURBO</span>
          </button>
        )}

        {/* ── VoxCPM2 ON/OFF Engine Switch (Guarded with License Check) ── */}
        <VoxCPM2OnlineToggle
          engineMode={engineMode}
          voxStatus={voxStatus}
          user={user}
          onSwitchEngine={(m) => onSwitchEngine?.(m)}
          onOpenVoxModal={onOpenVoxModal}
          onOpenLicenseModal={onOpenLicenseModal}
          compact
        />

        {/* ── Live Dubbing / Pipeline Process Status Badge ── */}
        {isDubbing && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-violet-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.25)] animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span className="text-[11px] font-bold">កំពុងបញ្ចូល</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-400 text-black font-bold">{dubbingProgress}%</span>
          </div>
        )}
      </div>

      {/* ── Right: Standard Workstation Actions ── */}
      <div className="flex items-center gap-1.5">
        {/* Save Status Button */}
        <button
          onClick={onSaveProject}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] hover:border-cyan-400/30 transition-all disabled:opacity-60"
          title="រក្សាទុកគម្រោង (Ctrl+S)"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span className="hidden md:inline text-[11px]">កំពុងរក្សាទុក...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline text-[11px]">រក្សាទុក</span>
            </>
          )}
        </button>

        {/* Undo */}
        <button
          onClick={onUndo}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          title="ត្រឡប់ក្រោយ (Ctrl+Z)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Redo */}
        <button
          onClick={onRedo}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          title="ទៅមុខ (Ctrl+Y)"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        {/* Preview Play/Pause Toggle */}
        <button
          onClick={onPreview}
          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/[0.06] transition-colors"
          title="ចាក់ / ផ្អាក (Space)"
        >
          <Play className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-white/10 mx-0.5" />

        {/* Primary Export Action */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 hover:brightness-110 text-slate-950 shadow-[0_0_18px_rgba(0,240,255,0.35)] transition-all active:scale-95"
          title="នាំចេញវីដេអូសម្រេច (ចុច E)"
        >
          <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>នាំចេញវីដេអូ</span>
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          title="ការកំណត់"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Keyboard Shortcuts HUD */}
        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="p-1.5 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-white/[0.06] transition-colors"
            title="ផ្លូវកាត់ក្តារចុច (? / HUD)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        )}

        {/* User Profile / Auth */}
        <div className="relative ml-0.5">
          {user ? (
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 p-1 rounded-md hover:bg-white/[0.06] transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-[10px] font-bold text-cyan-400">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/30 transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>ចូលគណនី</span>
            </button>
          )}

          {/* User Menu Dropdown */}
          {showUserMenu && user && (
            <div
              className="absolute right-0 top-full mt-1 w-48 rounded-lg bg-[#0e1118] border border-white/10 shadow-2xl p-1 z-50 text-xs"
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <div className="px-2.5 py-2 border-b border-white/[0.06]">
                <div className="font-semibold text-white truncate">{user.username}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                  Role: <span className="text-sky-400">{user.role}</span>
                </div>
              </div>

              {user.role === 'admin' && onOpenAdmin && (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenAdmin();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-white/[0.06] text-amber-300 hover:text-white transition-colors font-khmer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>ផ្ទាំងគ្រប់គ្រង Admin</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenLicenseModal?.();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-cyan-500/10 text-cyan-300 transition-colors font-khmer"
              >
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span>Key License VoxCPM2</span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-white/[0.06] text-slate-300 hover:text-white transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Preferences</span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-red-500/10 text-red-400 transition-colors mt-0.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
