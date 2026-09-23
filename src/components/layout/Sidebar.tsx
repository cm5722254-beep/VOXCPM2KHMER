import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Film,
  Users,
  Mic2,
  Languages,
  Subtitles,
  SlidersHorizontal,
  Image,
  Share2,
  History,
  Link2,
  Cpu,
  HardDrive,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Sparkles,
  Smartphone,
  Zap,
  Crown,
} from 'lucide-react';
import { TabId, User } from '../../types';
import { getSubscriptionInfo } from '../../utils/subscription';

interface SidebarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNewProject: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onOpenSystemStatus: () => void;
  isSystemOnline?: boolean;
  user?: User | null;
  shelfCount?: number;
  onOpenShelf?: () => void;
  onOpenGroups?: () => void;
  onOpenHardwareTurbo?: () => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  isCollapsed: boolean;
  badge?: string;
  badgeVariant?: 'sky' | 'indigo' | 'emerald' | 'amber';
  title?: string;
}

const SidebarNavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  active,
  onClick,
  isCollapsed,
  badge,
  badgeVariant = 'sky',
  title,
}) => (
  <button
    onClick={onClick}
    title={isCollapsed ? title || label : undefined}
    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group relative ${
      active
        ? 'bg-gradient-to-r from-cyan-500/20 via-sky-500/10 to-transparent text-cyan-300 font-bold border-l-2 border-cyan-400 shadow-[inset_0_0_15px_rgba(0,240,255,0.06)] rounded-l-none'
        : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
    } ${isCollapsed ? 'justify-center px-0' : ''}`}
  >
    <span className={`w-4 h-4 shrink-0 transition-all ${active ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]' : 'text-slate-400 group-hover:text-slate-200'}`}>
      {icon}
    </span>
    {!isCollapsed && (
      <>
        <span className="flex-1 text-left truncate tracking-wide">{label}</span>
        {badge && (
          <span
            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full font-mono ${
              badgeVariant === 'emerald'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(0,245,155,0.2)]'
                : badgeVariant === 'amber'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
            }`}
          >
            {badge}
          </span>
        )}
      </>
    )}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  onNewProject,
  onOpenExport,
  onOpenSettings,
  onOpenSystemStatus,
  isSystemOnline = true,
  user,
  shelfCount = 0,
  onOpenShelf,
  onOpenGroups,
  onOpenHardwareTurbo,
}) => {
  return (
    <aside
      className={`bg-[#080a0f]/85 backdrop-blur-xl border-r border-white/[0.08] flex flex-col justify-between select-none transition-all duration-200 z-20 flex-shrink-0 ${
        isCollapsed ? 'w-[52px]' : 'w-[210px]'
      }`}
    >
      {/* ── Nav Sections ── */}
      <div className="py-2.5 px-2 flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-3 font-khmer">
        {/* WORKSPACE */}
        <div className="flex flex-col gap-0.5">
          {!isCollapsed && (
            <div className="text-[10px] font-bold tracking-wider text-slate-400 px-2.5 py-1">
              កន្លែងធ្វើការ
            </div>
          )}

          <SidebarNavItem
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="ផ្ទាំងគ្រប់គ្រង"
            active={activeTab === 'tab-dashboard'}
            onClick={() => onSelectTab('tab-dashboard')}
            isCollapsed={isCollapsed}
            title="ផ្ទាំងគ្រប់គ្រងគម្រោង"
          />

          <SidebarNavItem
            icon={<Film className="w-4 h-4 text-cyan-400" />}
            label="ស្ទូឌីយោបញ្ចូលសំឡេង"
            active={activeTab === 'tab-dubbing' || activeTab === 'tab-workflow'}
            onClick={() => onSelectTab('tab-dubbing')}
            isCollapsed={isCollapsed}
            badge="PRO"
            badgeVariant="sky"
            title="ស្ទូឌីយោបញ្ចូលសំឡេង AI"
          />

          <SidebarNavItem
            icon={<Zap className="w-4 h-4 text-emerald-400" />}
            label="Khmer Offline (១-២០ ភាគ)"
            active={activeTab === 'tab-offline'}
            onClick={() => onSelectTab('tab-offline')}
            isCollapsed={isCollapsed}
            badge="1-20"
            badgeVariant="emerald"
            title="ស្ទូឌីយោ Khmer Offline ធ្វើម្ដង ១ ដល់ ២០ ភាគ ឬរឿងពេញ"
          />

          <SidebarNavItem
            icon={<HardDrive className="w-4 h-4 text-emerald-400" />}
            label="ឃ្លាំងវីដេអូ"
            active={activeTab === 'tab-shelf'}
            onClick={() => {
              if (onOpenShelf) onOpenShelf();
              else onSelectTab('tab-shelf');
            }}
            isCollapsed={isCollapsed}
            badge={`${shelfCount}/10`}
            badgeVariant={shelfCount >= 10 ? 'amber' : 'emerald'}
            title="ឃ្លាំងផ្ទុកវីដេអូសម្រាប់បញ្ចូលសំឡេង (អតិបរមា ១០ វីដេអូ)"
          />

          <SidebarNavItem
            icon={<FolderKanban className="w-4 h-4 text-indigo-400" />}
            label="ក្រុមរឿង (Series)"
            active={activeTab === 'tab-groups'}
            onClick={() => {
              if (onOpenGroups) onOpenGroups();
              else onSelectTab('tab-groups');
            }}
            isCollapsed={isCollapsed}
            title="បែងចែកក្រុមរឿងកុំឱ្យច្រឡំគ្នា"
          />
        </div>

        {/* PRODUCTION */}
        <div className="flex flex-col gap-0.5">
          {!isCollapsed && (
            <div className="text-[10px] font-bold tracking-wider text-slate-400 px-2.5 py-1">
              ផលិតកម្ម
            </div>
          )}

          <SidebarNavItem
            icon={<Users className="w-4 h-4" />}
            label="សំឡេងតួអង្គ AI"
            active={activeTab === 'tab-character'}
            onClick={() => onSelectTab('tab-character')}
            isCollapsed={isCollapsed}
            title="តារាងសំឡេងតួអង្គ"
          />

          <SidebarNavItem
            icon={<Languages className="w-4 h-4" />}
            label="បកប្រែអត្ថបទ"
            active={activeTab === 'tab-translator'}
            onClick={() => onSelectTab('tab-translator')}
            isCollapsed={isCollapsed}
            title="បកប្រែអត្ថបទ AI"
          />

          <SidebarNavItem
            icon={<Subtitles className="w-4 h-4" />}
            label="អក្សររត់ (Subtitles)"
            active={activeTab === 'tab-subtitles'}
            onClick={() => onSelectTab('tab-subtitles')}
            isCollapsed={isCollapsed}
            title="កែសម្រួលអក្សររត់"
          />

          <SidebarNavItem
            icon={<SlidersHorizontal className="w-4 h-4" />}
            label="កម្រិតសំឡេង Mixer"
            active={activeTab === 'tab-mixer'}
            onClick={() => onSelectTab('tab-mixer')}
            isCollapsed={isCollapsed}
            title="ផ្ទាំងគ្រប់គ្រងសំឡេង"
          />

          <SidebarNavItem
            icon={<Image className="w-4 h-4" />}
            label="រូបភាពតំណាង (Cover)"
            active={activeTab === 'tab-thumbnail'}
            onClick={() => onSelectTab('tab-thumbnail')}
            isCollapsed={isCollapsed}
            title="បង្កើតរូបភាពតំណាង AI"
          />
        </div>

        {/* DELIVERY */}
        <div className="flex flex-col gap-0.5">
          {!isCollapsed && (
            <div className="text-[10px] font-bold tracking-wider text-slate-400 px-2.5 py-1">
              នាំចេញ
            </div>
          )}

          <SidebarNavItem
            icon={<Share2 className="w-4 h-4 text-cyan-400" />}
            label="នាំចេញវីដេអូ"
            onClick={onOpenExport}
            isCollapsed={isCollapsed}
            title="នាំចេញវីដេអូសម្រេច"
          />
        </div>

        {/* SYSTEM */}
        <div className="flex flex-col gap-0.5">
          {!isCollapsed && (
            <div className="text-[10px] font-bold tracking-wider text-slate-400 px-2.5 py-1">
              ប្រព័ន្ធ & ល្បឿន
            </div>
          )}

          <SidebarNavItem
            icon={<Zap className="w-4 h-4 text-amber-400" />}
            label="កម្លាំង Turbo (Hardware)"
            onClick={() => {
              if (onOpenHardwareTurbo) onOpenHardwareTurbo();
              else onOpenSettings();
            }}
            isCollapsed={isCollapsed}
            badge="MAX"
            badgeVariant="amber"
            title="កម្លាំងបង្កើនល្បឿនតាម Hardware កុំព្យូទ័រ (CPU/GPU Turbo)"
          />

          <SidebarNavItem
            icon={<Settings className="w-4 h-4" />}
            label="ការកំណត់ស្ទូឌីយោ"
            onClick={onOpenSettings}
            isCollapsed={isCollapsed}
            title="ការកំណត់ស្ទូឌីយោ AI & API Keys"
          />
        </div>
      </div>

      {/* ── Sidebar Footer ── */}
      <div className="p-2 border-t border-white/[0.08] flex flex-col gap-2">
        {/* User Plan Info (if expanded) */}
        {!isCollapsed && user && (() => {
          const subInfo = getSubscriptionInfo(user);
          const isAdmin = user.role === 'admin';
          return (
            <div
              onClick={onOpenSettings}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all relative overflow-hidden group ${
                isAdmin
                  ? 'bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border-amber-500/30 hover:border-amber-400/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                  : 'bg-white/[0.03] border-white/[0.08] hover:border-sky-500/40 hover:shadow-[0_0_15px_rgba(56,189,248,0.1)]'
              }`}
              title={`${subInfo.title} | ${subInfo.expiryText}`}
            >
              <div className="flex items-center justify-between text-[10px] mb-1">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider">
                  {isAdmin ? <Crown className="w-3 h-3 text-amber-400" /> : <Sparkles className="w-3 h-3 text-sky-400" />}
                  <span>MEMBERSHIP</span>
                </div>
                <span
                  className={`text-[9.5px] px-1.5 py-0.2 rounded font-black font-mono tracking-wider ${
                    isAdmin
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  }`}
                >
                  {subInfo.badge}
                </span>
              </div>
              <div className="text-xs font-black text-white truncate flex items-center justify-between">
                <span>{subInfo.title}</span>
                <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          );
        })()}

        {/* Telegram Admin Contact */}
        {!isCollapsed ? (
          <a
            href="https://t.me/BongCheatz_IT"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full p-2 rounded-xl bg-gradient-to-r from-sky-500/15 via-blue-600/15 to-indigo-600/15 border border-sky-400/30 hover:border-sky-400 text-sky-200 hover:text-white flex items-center justify-between transition-all group shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-sky-500/25 flex items-center justify-center text-xs group-hover:scale-110 transition-transform">
                ✈️
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] font-black text-sky-300">ទាក់ទង ADMIN</span>
                <span className="text-[9px] text-slate-400 font-mono">@BongCheatz_IT</span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
          </a>
        ) : (
          <a
            href="https://t.me/BongCheatz_IT"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-sky-500/15 text-sky-400 transition-colors"
            title="ទាក់ទង ADMIN Telegram: @BongCheatz_IT"
          >
            ✈️
          </a>
        )}

        {/* Compact System Status Button */}
        {!isCollapsed ? (
          <button
            onClick={onOpenSystemStatus}
            className="w-full p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-sky-500/30 flex items-center justify-between text-left transition-all"
            title="Click to view full System Status"
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  isSystemOnline ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                style={{
                  boxShadow: isSystemOnline ? '0 0 8px #34d399' : '0 0 8px #fbbf24',
                }}
              />
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] font-semibold text-slate-200">System Status</span>
                <span className="text-[9px] text-slate-400">
                  {isSystemOnline ? 'All Systems Online' : 'Check Services'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        ) : (
          <button
            onClick={onOpenSystemStatus}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
            title="System Status"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSystemOnline ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              style={{
                boxShadow: isSystemOnline ? '0 0 8px #34d399' : '0 0 8px #fbbf24',
              }}
            />
          </button>
        )}

        {/* Collapse / Expand Toggle */}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center py-1.5 text-slate-400 hover:text-slate-200 rounded-md hover:bg-white/[0.04] transition-all"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
