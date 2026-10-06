import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Film,
  Mic2,
  Users,
  Languages,
  Clock,
  Sliders,
  Sparkles,
  Subtitles,
  Zap,
  Share2,
  Cloud,
  Wand2,
  Volume2,
  VolumeX,
  Scissors,
  Settings,
  HardDrive,
  Shield,
  Activity,
  HelpCircle,
  Crown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  X,
  Heart,
  Bot,
  Layers,
  Brain,
  Flame,
  Rocket,
} from 'lucide-react';
import { TabId, User } from '../../types';
import { DragonLogo } from '../dragon/DragonLogo';
import { getLicenseInfo } from '../../utils/subscription';

interface SidebarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNewProject: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onOpenCustomizer?: () => void;
  onOpenSystemStatus: () => void;
  isSystemOnline?: boolean;
  user?: User | null;
  shelfCount?: number;
  onOpenShelf?: () => void;
  onOpenGroups?: () => void;
  onOpenHardwareTurbo?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenDubbingStudio?: () => void;
  onOpenAITTS?: () => void;
  onOpenVoiceCloning?: () => void;
  onOpenEffects?: () => void;
  onOpen3DEffects?: () => void;
  onOpenAudioMixer?: () => void;
  onOpenSubtitles?: () => void;
  onOpenSponsor?: () => void;
  onOpenVoiceLab?: () => void;
  onOpenVIPModal?: () => void;
  onOpenAIAssistant?: () => void;
  onOpenGuide?: () => void;
  onOpenRoadmap?: () => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  isCollapsed: boolean;
  badge?: string;
  badgeColor?: 'cyan' | 'purple' | 'emerald' | 'amber' | 'fire';
  accent?: 'cyan' | 'purple' | 'jade' | 'fire';
  title?: string;
  animationIndex?: number;
}

/* ─── Enhanced Glass Tooltip ─── */
const Tooltip: React.FC<{ label: string; visible: boolean }> = ({ label, visible }) => (
  <div
    style={{
      position: 'absolute',
      left: 'calc(100% + 10px)',
      top: '50%',
      transform: visible ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(0.9)',
      opacity: visible ? 1 : 0,
      pointerEvents: 'none',
      transition: 'opacity 0.18s ease, transform 0.18s ease',
      zIndex: 9999,
      whiteSpace: 'nowrap',
      background: 'rgba(12,7,9,0.95)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(220,38,38,0.3)',
      borderRadius: '8px',
      padding: '5px 10px',
      fontSize: '11px',
      fontWeight: 700,
      color: '#F8FAFC',
      boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 16px rgba(220,38,38,0.15)',
      fontFamily: 'inherit',
    }}
  >
    {label}
  </div>
);

/* ─── Nav Item with Cinematic Entrance ─── */
const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  active,
  onClick,
  isCollapsed,
  badge,
  badgeColor = 'cyan',
  accent = 'cyan',
  title,
  animationIndex = 0,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getBadgeStyle = () => {
    switch (badgeColor) {
      case 'purple':
      case 'amber':
      case 'fire':
      case 'cyan':
      case 'emerald':
      default:
        return 'text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 shadow-[0_0_8px_rgba(220,38,38,0.3)]';
    }
  };

  return (
    <div
      className="relative font-khmer opacity-0 animate-slide-left"
      style={{ animationDelay: `${animationIndex * 35}ms` }}
    >
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`w-full flex items-center transition-all duration-200 select-none outline-none relative rounded-xl font-semibold ${
          isCollapsed ? 'justify-center p-2.5 my-0.5' : 'justify-start py-2 my-0.5 gap-2.5'
        } ${
          isCollapsed
            ? active
              ? 'bg-gradient-to-r from-red-500/15 to-orange-500/5 text-white shadow-[inset_0_0_20px_rgba(220,38,38,0.08)] border border-red-500/40'
              : isHovered
              ? 'bg-white/[0.04] text-white border border-white/[0.06]'
              : 'bg-transparent text-slate-400 hover:text-white border border-transparent'
            : active
            ? 'bg-gradient-to-r from-red-500/15 to-orange-500/5 border-l-2 border-red-500 text-white shadow-[inset_0_0_20px_rgba(220,38,38,0.08)] pl-2.5 pr-3 font-bold'
            : isHovered
            ? 'bg-white/[0.04] text-white border border-white/[0.06] px-3'
            : 'bg-transparent text-slate-400 hover:text-white border border-transparent px-3'
        }`}
      >
        {/* Icon */}
        <span
          className={`shrink-0 transition-transform duration-200 ${
            active
              ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] scale-110'
              : isHovered
              ? 'text-white scale-105'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {icon}
        </span>

        {/* Label & Badge */}
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left truncate tracking-wide font-khmer text-[12.5px] leading-tight">{label}</span>
            {badge && (
              <span className={`shrink-0 ${getBadgeStyle()}`}>
                {badge}
              </span>
            )}
          </>
        )}
      </button>

      {/* Tooltip on collapse */}
      {isCollapsed && <Tooltip label={title || label} visible={isHovered} />}
    </div>
  );
};

/* ─── Section Divider with crimson gradient ─── */
const SectionDivider: React.FC<{ label: string; isCollapsed: boolean }> = ({ label, isCollapsed }) => (
  <div className={`overflow-hidden ${isCollapsed ? 'py-2 px-1 flex justify-center' : ''}`}>
    {isCollapsed ? (
      <div className="w-5 h-px bg-red-950/60" />
    ) : (
      <div className="flex items-center gap-2 px-3 pt-4 pb-1.5">
        <div className="h-px flex-1 bg-gradient-to-r from-red-500/30 to-transparent" />
        <span className="text-[9px] font-black text-red-500/80 tracking-[0.2em] uppercase">{label}</span>
        <div className="h-px w-4 bg-red-500/20" />
      </div>
    )}
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  onNewProject,
  onOpenExport,
  onOpenSettings,
  onOpenCustomizer,
  onOpenSystemStatus,
  isSystemOnline = true,
  user,
  shelfCount = 1,
  onOpenShelf,
  onOpenGroups,
  onOpenHardwareTurbo,
  isMobileOpen = false,
  onCloseMobile,
  onOpenDubbingStudio,
  onOpenAITTS,
  onOpenVoiceCloning,
  onOpenEffects,
  onOpen3DEffects,
  onOpenAudioMixer,
  onOpenSubtitles,
  onOpenSponsor,
  onOpenVoiceLab,
  onOpenVIPModal,
  onOpenAIAssistant,
  onOpenGuide,
  onOpenRoadmap,
}) => {
  const handleClick = (fn: () => void) => {
    fn();
    onCloseMobile?.();
  };

  const lic = getLicenseInfo(user);

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      <aside
        style={{
          width: isMobileOpen ? '280px' : isCollapsed ? '68px' : '260px',
        }}
        className={`h-full flex flex-col bg-[#0C0709] border-r border-red-950/50 shadow-[4px_0_24px_rgba(0,0,0,0.5)] select-none transition-all duration-300 z-30 shrink-0 font-khmer ${
          isMobileOpen ? 'fixed top-0 bottom-0 left-0 shadow-2xl z-50 flex' : 'hidden md:flex relative'
        }`}
      >
        {/* ── Top Header & Dragon Brand ── */}
        <div className="p-3 border-b border-red-950/50 bg-[#100A0C] flex items-center justify-between shrink-0">
          <div
            onClick={() => handleClick(() => onSelectTab('tab-dashboard'))}
            className="cursor-pointer overflow-hidden flex items-center"
          >
            <DragonLogo
              size={isCollapsed ? 'sm' : 'md'}
              withText={!isCollapsed}
              withTagline={!isCollapsed}
              animated={true}
            />
          </div>

          {/* Collapse Toggle Button (Desktop only) */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title={isCollapsed ? 'ពង្រីក Sidebar' : 'បង្រួម Sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          {/* Close button on mobile */}
          {isMobileOpen && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ── "+ គម្រោងថ្មី" Quick Action Button ── */}
        <div className="p-2.5 shrink-0">
          <button
            type="button"
            onClick={() => handleClick(onNewProject)}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black text-xs shadow-[0_4px_20px_rgba(220,38,38,0.4)] hover:shadow-[0_6px_28px_rgba(220,38,38,0.6)] active:scale-95 transition-all duration-200 ${
              isCollapsed ? 'px-0' : 'px-3'
            }`}
            title="គម្រោងថ្មី"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>+ គម្រោងថ្មី</span>}
          </button>
        </div>

        {/* ── Scrollable Navigation Items ── */}
        <div
          className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(220,38,38,0.35) transparent',
          }}
        >
          {/* ── SECTION 1: ម៉ឺនុយចម្បង ── */}
          <SectionDivider label="ម៉ឺនុយចម្បង" isCollapsed={isCollapsed} />

          {/* 🏠 ផ្ទាំងគ្រប់គ្រង */}
          <NavItem
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="ផ្ទាំងគ្រប់គ្រង"
            active={activeTab === 'tab-dashboard'}
            onClick={() => handleClick(() => onSelectTab('tab-dashboard'))}
            isCollapsed={isCollapsed}
            title="ផ្ទាំងគ្រប់គ្រងទូទៅ"
            animationIndex={0}
          />

          {/* 🎬 កែសម្រួល & ដាក់សំឡេង (Dubbing Studio - Core) */}
          <NavItem
            icon={<Film className="w-4 h-4" />}
            label="កែសម្រួល & ដាក់សំឡេង"
            active={activeTab === 'tab-dubbing'}
            onClick={() => handleClick(() => {
              onOpenDubbingStudio?.();
              onSelectTab('tab-dubbing');
            })}
            isCollapsed={isCollapsed}
            badge="PRO"
            badgeColor="fire"
            title="ស្ទូឌីយោកែសម្រួល & ដាក់សំឡេងភាពយន្ត"
            animationIndex={1}
          />

          {/* 📁 គម្រោងទាំងអស់ */}
          <NavItem
            icon={<FolderKanban className="w-4 h-4" />}
            label="គម្រោងភាពយន្ត"
            active={activeTab === 'tab-projects' || activeTab === 'tab-groups'}
            onClick={() => handleClick(() => onSelectTab('tab-projects'))}
            isCollapsed={isCollapsed}
            title="គ្រប់គ្រងគម្រោង & Series ភាគ"
            animationIndex={2}
          />

          {/* 🎙️ បន្ទប់សំឡេង AI */}
          <NavItem
            icon={<Mic2 className="w-4 h-4" />}
            label="បន្ទប់សំឡេង AI"
            active={activeTab === 'tab-voicelab' || activeTab === 'tab-tuner'}
            onClick={() => handleClick(() => {
              onOpenVoiceLab?.();
              onSelectTab('tab-voicelab');
            })}
            isCollapsed={isCollapsed}
            badge="100+"
            badgeColor="purple"
            title="បណ្ណាល័យសំឡេង AI ខ្មែរ"
            animationIndex={3}
          />

          {/* 👥 គ្រប់គ្រងតួអង្គ */}
          <NavItem
            icon={<Users className="w-4 h-4" />}
            label="គ្រប់គ្រងតួអង្គ"
            active={activeTab === 'tab-character'}
            onClick={() => handleClick(() => onSelectTab('tab-character'))}
            isCollapsed={isCollapsed}
            title="កំណត់សំឡេង និងតួអង្គ"
            animationIndex={4}
          />

          {/* ── SECTION 2: ឧបករណ៍ស្ទូឌីយោ ── */}
          <SectionDivider label="ឧបករណ៍ស្ទូឌីយោ" isCollapsed={isCollapsed} />

          {/* 🎧 លាយសំឡេង */}
          <NavItem
            icon={<Sliders className="w-4 h-4" />}
            label="លាយសំឡេង"
            active={activeTab === 'tab-mixer'}
            onClick={() => handleClick(() => {
              onOpenAudioMixer?.();
              onSelectTab('tab-mixer');
            })}
            isCollapsed={isCollapsed}
            title="ឧបករណ៍លាយសំឡេង (Audio Mixer)"
            animationIndex={5}
          />

          {/* 🎨 អក្សររត់ */}
          <NavItem
            icon={<Subtitles className="w-4 h-4" />}
            label="អក្សររត់"
            active={activeTab === 'tab-subtitles'}
            onClick={() => handleClick(() => {
              onOpenSubtitles?.();
              onSelectTab('tab-subtitles');
            })}
            isCollapsed={isCollapsed}
            title="ស្ទូឌីយោអក្សររត់ (Subtitles)"
            animationIndex={6}
          />

          {/* 📂 បញ្ចូលសំឡេងភាគ (Batch Studio) */}
          <NavItem
            icon={<Layers className="w-4 h-4 text-amber-400" />}
            label="ស្ទូឌីយោភាគ (Batch)"
            active={activeTab === 'tab-batchstudio'}
            onClick={() => handleClick(() => onSelectTab('tab-batchstudio'))}
            isCollapsed={isCollapsed}
            title="បញ្ចូលសំឡេងវីដេអូច្រើនភាគ"
            animationIndex={7}
          />

          {/* ✂️ កាត់ត & បំបែកឈុត */}
          <NavItem
            icon={<Scissors className="w-4 h-4 text-amber-400" />}
            label="កាត់ត & បំបែកឈុត"
            active={activeTab === 'tab-cutter'}
            onClick={() => handleClick(() => onSelectTab('tab-cutter'))}
            isCollapsed={isCollapsed}
            title="កាត់ត និងបំបែកភាគភាពយន្ត"
            animationIndex={8}
          />

          {/* 📦 បញ្ចេញវីដេអូ */}
          <NavItem
            icon={<Share2 className="w-4 h-4" />}
            label="បញ្ចេញវីដេអូ"
            active={false}
            onClick={() => handleClick(onOpenExport)}
            isCollapsed={isCollapsed}
            title="បញ្ចេញវីដេអូសម្រេច & សំឡេង"
            animationIndex={9}
          />

          {/* ── SECTION 3: ប្រព័ន្ធ & ជំនួយ ── */}
          <SectionDivider label="ប្រព័ន្ធ & ការកំណត់" isCollapsed={isCollapsed} />

          {/* ⚙️ ការកំណត់ */}
          <NavItem
            icon={<Settings className="w-4 h-4" />}
            label="ការកំណត់"
            onClick={() => handleClick(onOpenSettings)}
            isCollapsed={isCollapsed}
            title="ការកំណត់ទូទៅ"
            animationIndex={10}
          />

          {/* ⚡ ស្ថានភាពម៉ាស៊ីន */}
          <NavItem
            icon={<Activity className="w-4 h-4 text-red-400" />}
            label="ស្ថានភាពម៉ាស៊ីន"
            onClick={() => handleClick(() => onOpenHardwareTurbo?.())}
            isCollapsed={isCollapsed}
            title="ពិនិត្យ CPU, RAM, GPU & ធនធាន"
            animationIndex={11}
          />

          {/* 📖 ជំនួយ & ការណែនាំ */}
          <NavItem
            icon={<HelpCircle className="w-4 h-4 text-slate-400" />}
            label="ជំនួយ & ការណែនាំ"
            onClick={() => handleClick(() => onOpenGuide?.())}
            isCollapsed={isCollapsed}
            title="សៀវភៅណែនាំប្រើប្រាស់កម្មវិធី"
            animationIndex={12}
          />

          {/* 🚀 Next Version Commercial Roadmap */}
          {onOpenRoadmap && (
            <NavItem
              icon={<Rocket className="w-4 h-4 text-amber-400 animate-pulse" />}
              label="Version បន្ទាប់"
              active={false}
              onClick={() => handleClick(onOpenRoadmap)}
              isCollapsed={isCollapsed}
              badge="ថ្មី"
              badgeColor="purple"
              title="មើលគម្រោង Advanced AI Dubbing Engine ក្នុង Version បន្ទាប់"
              animationIndex={13}
            />
          )}
        </div>

        {/* ── Bottom Section: VIP Membership Card ── */}
        <div className="p-3 border-t border-red-950/50 bg-[#100A0C] shrink-0 font-khmer">
          {!isCollapsed ? (
            /* Animated gradient border VIP card */
            <div
              onClick={() => onOpenVIPModal?.()}
              className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-red-600/40 via-orange-500/20 to-red-900/40 hover:from-red-500/60 hover:to-orange-500/30 transition-all duration-300 cursor-pointer group"
            >
              <div className="rounded-2xl bg-[#1C0F14] p-3">
                {/* Ambient glow blob */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 blur-xl group-hover:bg-red-500/20 transition-all pointer-events-none" />

                <div className="flex items-center justify-between mb-1.5 relative z-10">
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-black text-white tracking-wide">
                      DRAGON VIP
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 shadow-[0_0_8px_rgba(220,38,38,0.3)]">
                    {lic.isLifetime ? 'LIFETIME' : lic.isLicensed ? 'PRO' : 'ឥតគិតថ្លៃ'}
                  </span>
                </div>

                <div className="space-y-1 text-[10px] text-slate-400 relative z-10 font-khmer">
                  <div className="flex justify-between">
                    <span>សមត្ថភាព AI:</span>
                    <span className="font-mono text-white font-bold">១០០% ដំណើរការពិត</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ដំណើរការ GPU:</span>
                    <span className="text-amber-400 font-bold">ល្បឿនលឿន TURBO</span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-red-950/60 flex items-center justify-between text-[10px] font-bold text-red-400 group-hover:text-white transition-colors relative z-10">
                  <span>គ្រប់គ្រងកញ្ចប់ VIP</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenVIPModal?.()}
              className="w-full p-2.5 rounded-xl bg-[#1C0F14] hover:bg-[#28151D] border border-red-950/50 hover:border-red-500/40 flex items-center justify-center text-amber-400 transition-all duration-200"
              title="Dragon VIP Membership"
            >
              <Crown className="w-5 h-5 fill-amber-400" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
