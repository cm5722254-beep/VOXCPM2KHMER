import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Film,
  Mic2,
  Bot,
  Sparkles,
  Box,
  Sliders,
  Subtitles,
  Share2,
  Settings,
  Crown,
  ChevronRight,
  HardDrive,
  Activity,
  Layers,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  Heart,
  Zap,
  TrendingUp,
  Plus,
  X,
  Mic,
  Scissors,
  Wand2,
} from 'lucide-react';
import { TabId, User } from '../../types';
import { tw } from '../../hooks/useDesignTokens';

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
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  isCollapsed: boolean;
  badge?: string;
  badgeColor?: 'cyan' | 'purple' | 'emerald' | 'amber';
  title?: string;
  accentColor?: 'green' | 'blue' | 'purple' | 'amber' | 'rose';
}

// ── Tooltip component for collapsed state ──
const Tooltip: React.FC<{ label: string; visible: boolean }> = ({ label, visible }) => (
  <div
    style={{
      position: 'absolute',
      left: 'calc(100% + 12px)',
      top: '50%',
      transform: visible ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(0.85)',
      opacity: visible ? 1 : 0,
      pointerEvents: 'none',
      transition: 'opacity 0.18s ease, transform 0.18s ease',
      zIndex: 9999,
      whiteSpace: 'nowrap',
      background: 'linear-gradient(135deg, rgba(30,32,40,0.98) 0%, rgba(20,22,30,0.98) 100%)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '10px',
      padding: '6px 12px',
      fontSize: '12px',
      fontWeight: 600,
      color: '#e2e8f0',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
      backdropFilter: 'blur(12px)',
    }}
  >
    {label}
    {/* Arrow */}
    <span
      style={{
        position: 'absolute',
        left: '-5px',
        top: '50%',
        transform: 'translateY(-50%) rotate(45deg)',
        width: '8px',
        height: '8px',
        background: 'rgba(30,32,40,0.98)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRight: 'none',
        borderTop: 'none',
      }}
    />
  </div>
);

// ── Accent color maps ──
const accentMap = {
  green: {
    activeBg: 'rgba(16,185,129,0.15)',
    activeBorder: 'rgba(16,185,129,0.5)',
    activeShadow: '0 0 20px rgba(16,185,129,0.3), inset 0 0 12px rgba(16,185,129,0.05)',
    activeText: '#6ee7b7',
    pillColor: 'rgba(16,185,129,0.9)',
    pillShadow: '0 0 12px rgba(16,185,129,0.7)',
    hoverBg: 'rgba(16,185,129,0.07)',
    iconColor: '#34d399',
  },
  blue: {
    activeBg: 'rgba(59,130,246,0.15)',
    activeBorder: 'rgba(59,130,246,0.5)',
    activeShadow: '0 0 20px rgba(59,130,246,0.3), inset 0 0 12px rgba(59,130,246,0.05)',
    activeText: '#93c5fd',
    pillColor: 'rgba(59,130,246,0.9)',
    pillShadow: '0 0 12px rgba(59,130,246,0.7)',
    hoverBg: 'rgba(59,130,246,0.07)',
    iconColor: '#60a5fa',
  },
  purple: {
    activeBg: 'rgba(139,92,246,0.15)',
    activeBorder: 'rgba(139,92,246,0.5)',
    activeShadow: '0 0 20px rgba(139,92,246,0.3), inset 0 0 12px rgba(139,92,246,0.05)',
    activeText: '#c4b5fd',
    pillColor: 'rgba(139,92,246,0.9)',
    pillShadow: '0 0 12px rgba(139,92,246,0.7)',
    hoverBg: 'rgba(139,92,246,0.07)',
    iconColor: '#a78bfa',
  },
  amber: {
    activeBg: 'rgba(245,158,11,0.15)',
    activeBorder: 'rgba(245,158,11,0.5)',
    activeShadow: '0 0 20px rgba(245,158,11,0.3), inset 0 0 12px rgba(245,158,11,0.05)',
    activeText: '#fcd34d',
    pillColor: 'rgba(245,158,11,0.9)',
    pillShadow: '0 0 12px rgba(245,158,11,0.7)',
    hoverBg: 'rgba(245,158,11,0.07)',
    iconColor: '#fbbf24',
  },
  rose: {
    activeBg: 'rgba(244,63,94,0.15)',
    activeBorder: 'rgba(244,63,94,0.5)',
    activeShadow: '0 0 20px rgba(244,63,94,0.3), inset 0 0 12px rgba(244,63,94,0.05)',
    activeText: '#fda4af',
    pillColor: 'rgba(244,63,94,0.9)',
    pillShadow: '0 0 12px rgba(244,63,94,0.7)',
    hoverBg: 'rgba(244,63,94,0.07)',
    iconColor: '#fb7185',
  },
};

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  active,
  onClick,
  isCollapsed,
  badge,
  badgeColor = 'cyan',
  title,
  accentColor = 'green',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const accent = accentMap[accentColor];

  const getBadgeStyle = (): React.CSSProperties => {
    switch (badgeColor) {
      case 'purple':
        return { background: 'rgba(139,92,246,0.2)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.4)' };
      case 'amber':
        return { background: 'rgba(245,158,11,0.2)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.4)' };
      case 'emerald':
      case 'cyan':
      default:
        return { background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.4)' };
    }
  };

  const buttonStyle: React.CSSProperties = active
    ? {
        background: `linear-gradient(135deg, ${accent.activeBg} 0%, rgba(20,22,30,0.6) 100%)`,
        border: `1px solid ${accent.activeBorder}`,
        boxShadow: accent.activeShadow,
        color: accent.activeText,
        position: 'relative',
        overflow: 'visible',
      }
    : isHovered
    ? {
        background: `linear-gradient(135deg, ${accent.hoverBg} 0%, rgba(255,255,255,0.03) 100%)`,
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#f1f5f9',
        position: 'relative',
        overflow: 'visible',
      }
    : {
        background: 'transparent',
        border: '1px solid transparent',
        color: '#94a3b8',
        position: 'relative',
        overflow: 'visible',
      };

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          ...buttonStyle,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: isCollapsed ? 0 : '10px',
          padding: isCollapsed ? '10px 0' : '9px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: active ? 700 : 500,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          userSelect: 'none',
          outline: 'none',
        }}
      >
        {/* Active left-border glow pill */}
        {active && (
          <span
            style={{
              position: 'absolute',
              left: '-1px',
              top: '20%',
              height: '60%',
              width: '3px',
              borderRadius: '0 3px 3px 0',
              background: accent.pillColor,
              boxShadow: accent.pillShadow,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: 'pillIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        )}

        {/* Icon */}
        <span
          style={{
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: active ? accent.iconColor : isHovered ? accent.iconColor : '#64748b',
            transition: 'color 0.2s ease, transform 0.2s ease',
            transform: isHovered && !active ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {icon}
        </span>

        {/* Label + Badge */}
        {!isCollapsed && (
          <>
            <span
              style={{
                flex: 1,
                textAlign: 'left',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                letterSpacing: '0.01em',
                transition: 'opacity 0.2s ease',
              }}
            >
              {label}
            </span>
            {badge && (
              <span
                style={{
                  ...getBadgeStyle(),
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '999px',
                  fontFamily: 'monospace',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                {badge}
              </span>
            )}
          </>
        )}
      </button>

      {/* Tooltip for collapsed state */}
      {isCollapsed && <Tooltip label={title || label} visible={isHovered} />}
    </div>
  );
};

// ── Section divider with label ──
const SectionDivider: React.FC<{ label: string; isCollapsed: boolean }> = ({ label, isCollapsed }) => (
  <div
    style={{
      padding: isCollapsed ? '8px 0 4px' : '10px 4px 4px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      overflow: 'hidden',
    }}
  >
    {isCollapsed ? (
      <div
        style={{
          width: '24px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          margin: '0 auto',
          transition: 'all 0.3s ease',
        }}
      />
    ) : (
      <>
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            color: 'rgba(148,163,184,0.5)',
            letterSpacing: '0.12em',
            whiteSpace: 'nowrap',
            transition: 'opacity 0.2s ease',
            fontFamily: 'monospace',
          }}
        >
          {label}
        </span>
        <div
          style={{
            flex: 1,
            height: '1px',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)',
          }}
        />
      </>
    )}
  </div>
);

// ── User avatar/initials badge ──
const UserAvatar: React.FC<{ user?: User | null; isCollapsed: boolean }> = ({ user, isCollapsed }) => {
  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : 'U';

  const avatarContent = (
    <div
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '13px',
        fontWeight: 800,
        color: '#fff',
        flexShrink: 0,
        boxShadow: '0 0 0 2px rgba(99,102,241,0.4), 0 4px 12px rgba(99,102,241,0.3)',
        letterSpacing: '0.02em',
      }}
    >
      {initials}
    </div>
  );

  if (isCollapsed) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 8px' }}>
        {avatarContent}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 10px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        marginBottom: '6px',
      }}
    >
      {avatarContent}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#e2e8f0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {user?.name || 'User'}
        </div>
        <div
          style={{
            fontSize: '10px',
            color: 'rgba(148,163,184,0.6)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {user?.email || 'PRO VIP'}
        </div>
      </div>
      <Crown style={{ width: '14px', height: '14px', color: '#fbbf24', flexShrink: 0 }} />
    </div>
  );
};

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
}) => {
  const [newProjectHovered, setNewProjectHovered] = useState(false);

  const handleClick = (fn: () => void) => {
    fn();
    onCloseMobile?.();
  };

  return (
    <>
      {/* Keyframe injector */}
      <style>{`
        @keyframes pillIn {
          from { opacity: 0; transform: scaleY(0.4); }
          to   { opacity: 1; transform: scaleY(1); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.7; }
          70%  { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes gradientShift {
          0%   { background-position: 0%   50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
        }
        .sidebar-scrollbar::-webkit-scrollbar { width: 3px; }
        .sidebar-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
        .sidebar-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.16); }
      `}</style>

      {/* Mobile backdrop overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          title="ចុចដើម្បីបិទ Menu"
        />
      )}

      <aside
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #0f1014 0%, #12141a 50%, #0f1014 100%)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          userSelect: 'none',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: isMobileOpen ? 50 : 30,
          flexShrink: 0,
          fontFamily: 'inherit',
          width: isMobileOpen ? '260px' : isCollapsed ? '64px' : '240px',
          position: isMobileOpen ? 'fixed' : 'relative',
          ...(isMobileOpen
            ? { top: 0, bottom: 0, left: 0, boxShadow: '6px 0 40px rgba(0,0,0,0.8)' }
            : {}),
        }}
        className={isMobileOpen ? '' : 'hidden md:flex'}
      >
        {/* Mobile Header with Close Button */}
        {isMobileOpen && (
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.08] bg-[#141418] shrink-0 font-khmer">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">
                មឺនុយស្ទូឌីយោ
              </span>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title="បិទ (Close)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Top bar: Collapse toggle (desktop only) ── */}
        <div
          className="hidden md:flex"
          style={{
            padding: '8px',
            justifyContent: isCollapsed ? 'center' : 'flex-end',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'ពង្រីក Sidebar' : 'បង្រួម Sidebar'}
            style={{
              padding: '6px',
              borderRadius: '8px',
              color: '#64748b',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s, background 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            {isCollapsed
              ? <PanelLeftOpen style={{ width: '16px', height: '16px' }} />
              : <PanelLeftClose style={{ width: '16px', height: '16px' }} />}
          </button>
        </div>

        {/* ── New Project Quick Action ── */}
        <div
          style={{
            padding: isCollapsed ? '8px 8px 0' : '10px 10px 0',
            flexShrink: 0,
          }}
        >
          <div style={{ position: 'relative', display: 'inline-flex', width: '100%' }}>
            {/* Pulsing ring behind button */}
            <span
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '12px',
                background: 'rgba(99,102,241,0.4)',
                animation: 'pulse-ring 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                pointerEvents: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => handleClick(onNewProject)}
              onMouseEnter={() => setNewProjectHovered(true)}
              onMouseLeave={() => setNewProjectHovered(false)}
              title={isCollapsed ? 'គម្រោងថ្មី' : undefined}
              style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: '8px',
                padding: isCollapsed ? '9px 0' : '9px 12px',
                borderRadius: '12px',
                background: newProjectHovered
                  ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #0891b2 100%)'
                  : 'linear-gradient(135deg, #3730a3 0%, #5b21b6 50%, #0e7490 100%)',
                backgroundSize: '200% 200%',
                animation: 'gradientShift 4s ease infinite',
                border: 'none',
                cursor: 'pointer',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                boxShadow: newProjectHovered
                  ? '0 4px 20px rgba(99,102,241,0.5), 0 0 0 1px rgba(99,102,241,0.3)'
                  : '0 2px 12px rgba(99,102,241,0.3)',
                transition: 'all 0.2s ease',
                transform: newProjectHovered ? 'translateY(-1px)' : 'none',
              }}
            >
              <span
                style={{
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
              </span>
              {!isCollapsed && <span>គម្រោងថ្មី</span>}
            </button>
          </div>
        </div>

        {/* ── Navigation ── */}
        <div
          className="sidebar-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '6px 8px',
          }}
        >
          {/* ── SECTION: MAIN ── */}
          <SectionDivider label="MAIN" isCollapsed={isCollapsed} />

          {/* ផ្ទាំងគ្រប់គ្រង */}
          <NavItem
            icon={<LayoutDashboard style={{ width: '16px', height: '16px' }} />}
            label="ផ្ទាំងគ្រប់គ្រង"
            active={activeTab === 'tab-dashboard'}
            onClick={() => handleClick(() => onSelectTab('tab-dashboard'))}
            isCollapsed={isCollapsed}
            title="ផ្ទាំងគ្រប់គ្រង"
            accentColor="green"
          />

          {/* គម្រោង */}
          <NavItem
            icon={<FolderKanban style={{ width: '16px', height: '16px' }} />}
            label="គម្រោង"
            active={activeTab === 'tab-projects' || activeTab === 'tab-groups'}
            onClick={() => handleClick(() => (onOpenGroups ? onOpenGroups() : onSelectTab('tab-projects')))}
            isCollapsed={isCollapsed}
            title="គម្រោង"
            accentColor="green"
          />

          {/* បណ្ណាល័យមេឌៀ */}
          <NavItem
            icon={<Film style={{ width: '16px', height: '16px' }} />}
            label="បណ្ណាល័យមេឌៀ"
            active={activeTab === 'tab-shelf'}
            onClick={() => handleClick(() => (onOpenShelf ? onOpenShelf() : onSelectTab('tab-shelf')))}
            isCollapsed={isCollapsed}
            badge={`${shelfCount || 1}/10`}
            badgeColor="cyan"
            title="បណ្ណាល័យមេឌៀ"
            accentColor="green"
          />

          {/* ── SECTION: STUDIO ── */}
          <SectionDivider label="STUDIO" isCollapsed={isCollapsed} />

          {/* ស្ទូឌីយោឌាប់សំឡេង */}
          <NavItem
            icon={<Mic2 style={{ width: '16px', height: '16px' }} />}
            label="ស្ទូឌីយោឌាប់សំឡេង"
            active={activeTab === 'tab-dubbing' || activeTab === 'tab-workflow'}
            onClick={() => handleClick(() => {
              onOpenDubbingStudio?.();
              onSelectTab('tab-dubbing');
            })}
            isCollapsed={isCollapsed}
            badge="PRO"
            badgeColor="purple"
            title="ស្ទូឌីយោឌាប់សំឡេង"
            accentColor="blue"
          />

          {/* សម្រាយរឿង AI (Movie & Story Recap Studio) */}
          <NavItem
            icon={<Sparkles style={{ width: '16px', height: '16px' }} />}
            label="សម្រាយរឿង AI"
            active={activeTab === 'tab-narrator'}
            onClick={() => handleClick(() => onSelectTab('tab-narrator'))}
            isCollapsed={isCollapsed}
            badge="RECAP"
            badgeColor="cyan"
            title="ស្ទូឌីយោសម្រាយរឿង AI អាជីព (Single Voice Clone Movie Recap Studio)"
            accentColor="purple"
          />

          {/* បង្កើតសំឡេង AI */}
          <NavItem
            icon={<Bot style={{ width: '16px', height: '16px' }} />}
            label="បង្កើតសំឡេង AI"
            active={activeTab === 'tab-offline' || activeTab === 'tab-manual'}
            onClick={() => handleClick(() => {
              onOpenAITTS?.();
              onSelectTab('tab-offline');
            })}
            isCollapsed={isCollapsed}
            badge="AUTO"
            badgeColor="emerald"
            title="បង្កើតសំឡេង AI"
            accentColor="blue"
          />

          {/* ចម្លងសំឡេង */}
          <NavItem
            icon={<Users style={{ width: '16px', height: '16px' }} />}
            label="ចម្លងសំឡេង"
            active={activeTab === 'tab-character' || activeTab === 'tab-tuner'}
            onClick={() => handleClick(() => {
              onOpenVoiceCloning?.();
              onSelectTab('tab-character');
            })}
            isCollapsed={isCollapsed}
            title="ចម្លងសំឡេង"
            accentColor="blue"
          />

          {/* ចំណងជើងរង */}
          <NavItem
            icon={<Subtitles style={{ width: '16px', height: '16px' }} />}
            label="ចំណងជើងរង"
            active={activeTab === 'tab-subtitles'}
            onClick={() => handleClick(() => {
              onOpenSubtitles?.();
              onSelectTab('tab-subtitles');
            })}
            isCollapsed={isCollapsed}
            title="ចំណងជើងរង"
            accentColor="blue"
          />

          {/* សំឡេង និងតន្ត្រី */}
          <NavItem
            icon={<Layers style={{ width: '16px', height: '16px' }} />}
            label="សំឡេង និងតន្ត្រី"
            active={activeTab === 'tab-workflow'}
            onClick={() => handleClick(() => onSelectTab('tab-workflow'))}
            isCollapsed={isCollapsed}
            title="សំឡេង និងតន្ត្រី"
            accentColor="blue"
          />

          {/* ── SECTION: TOOLS ── */}
          <SectionDivider label="TOOLS" isCollapsed={isCollapsed} />

          {/* កាត់ត & បញ្ចូលភាគ (1H-5H Auto Splitter & Merger) */}
          <NavItem
            icon={<Scissors style={{ width: '16px', height: '16px' }} />}
            label="កាត់ត & បញ្ចូលភាគ"
            active={activeTab === 'tab-cutter'}
            onClick={() => handleClick(() => onSelectTab('tab-cutter'))}
            isCollapsed={isCollapsed}
            badge="1H-5H"
            badgeColor="emerald"
            title="Auto Split វីដេអូ 1H-5H ជាច្រើនភាគ & Merge វីដេអូខ្លីៗចូលគ្នា"
            accentColor="green"
          />

          {/* PosterForge AI — បង្កើត Poster AI */}
          <NavItem
            icon={<Wand2 style={{ width: '16px', height: '16px' }} />}
            label="PosterForge AI"
            active={activeTab === 'tab-posterforge'}
            onClick={() => handleClick(() => onSelectTab('tab-posterforge'))}
            isCollapsed={isCollapsed}
            badge="AI 4K"
            badgeColor="amber"
            title="PosterForge AI — បង្កើត Poster ភាពយន្ត 3D, Donghua, Xianxia & Anime"
            accentColor="amber"
          />

          {/* បែបផែន */}
          <NavItem
            icon={<Sparkles style={{ width: '16px', height: '16px' }} />}
            label="បែបផែន"
            active={activeTab === 'tab-thumbnail'}
            onClick={() => handleClick(() => {
              onOpenEffects?.();
              onSelectTab('tab-thumbnail');
            })}
            isCollapsed={isCollapsed}
            badge="VIP"
            badgeColor="purple"
            title="បែបផែន"
            accentColor="purple"
          />

          {/* កែពណ៌ */}
          <NavItem
            icon={<HardDrive style={{ width: '16px', height: '16px' }} />}
            label="កែពណ៌"
            active={false}
            onClick={() => handleClick(() => onOpenEffects?.())}
            isCollapsed={isCollapsed}
            title="កែពណ៌"
            accentColor="purple"
          />

          {/* បែបផែន 3D */}
          <NavItem
            icon={<Box style={{ width: '16px', height: '16px' }} />}
            label="បែបផែន 3D"
            active={false}
            onClick={() => handleClick(() => onOpen3DEffects?.())}
            isCollapsed={isCollapsed}
            title="បែបផែន 3D"
            accentColor="purple"
          />

          {/* ឧបករណ៍លាយសំឡេង */}
          <NavItem
            icon={<Sliders style={{ width: '16px', height: '16px' }} />}
            label="ឧបករណ៍លាយសំឡេង"
            active={activeTab === 'tab-mixer'}
            onClick={() => handleClick(() => {
              onOpenAudioMixer?.();
              onSelectTab('tab-mixer');
            })}
            isCollapsed={isCollapsed}
            title="ឧបករណ៍លាយសំឡេង"
            accentColor="purple"
          />

          {/* ── SECTION: SYSTEM ── */}
          <SectionDivider label="SYSTEM" isCollapsed={isCollapsed} />

          {/* នាំចេញ */}
          <NavItem
            icon={<Share2 style={{ width: '16px', height: '16px' }} />}
            label="នាំចេញ"
            onClick={() => handleClick(onOpenExport)}
            isCollapsed={isCollapsed}
            title="នាំចេញ"
            accentColor="amber"
          />

          {/* ការកំណត់ */}
          <NavItem
            icon={<Settings style={{ width: '16px', height: '16px' }} />}
            label="ការកំណត់"
            onClick={() => handleClick(onOpenSettings)}
            isCollapsed={isCollapsed}
            title="ការកំណត់"
            accentColor="amber"
          />

          {/* Sponsor */}
          {onOpenSponsor && (
            <NavItem
              icon={<Heart style={{ width: '16px', height: '16px' }} />}
              label="Sponsor / ឧបត្ថម្ភ"
              badge="VIP"
              badgeColor="purple"
              onClick={() => handleClick(onOpenSponsor)}
              isCollapsed={isCollapsed}
              title="គ្រប់គ្រង Sponsor & អ្នកឧបត្ថម្ភ"
              accentColor="rose"
            />
          )}
        </div>

        {/* ── Bottom cards ── */}
        <div
          style={{
            padding: '10px',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          {/* User Avatar */}
          <UserAvatar user={user} isCollapsed={isCollapsed} />

          {!isCollapsed ? (
            <>
              {/* MEMBERSHIP Card — glassmorphism */}
              <div
                style={{
                  padding: '12px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(30,32,50,0.8) 0%, rgba(20,22,36,0.9) 100%)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid',
                  borderImageSlice: 1,
                  borderColor: 'transparent',
                  boxShadow: '0 0 0 1px rgba(99,102,241,0.25), inset 0 0 20px rgba(99,102,241,0.04), 0 4px 20px rgba(0,0,0,0.4)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Gradient border overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '14px',
                    padding: '1px',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.5) 0%, rgba(139,92,246,0.3) 50%, rgba(6,182,212,0.3) 100%)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    pointerEvents: 'none',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#f1f5f9',
                      letterSpacing: '0.06em',
                    }}
                  >
                    <Crown style={{ width: '13px', height: '13px', color: '#fbbf24' }} />
                    <span>សមាជិកភាព</span>
                  </div>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: 'linear-gradient(135deg, rgba(6,182,212,0.25) 0%, rgba(99,102,241,0.25) 100%)',
                      color: '#67e8f9',
                      border: '1px solid rgba(6,182,212,0.4)',
                      fontSize: '9.5px',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                    }}
                  >
                    PRO VIP
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(148,163,184,0.8)', marginBottom: '10px' }}>
                  ផែនការបច្ចុប្បន្ន:{' '}
                  <span style={{ color: '#67e8f9', fontWeight: 700 }}>PRO VIP</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  style={{
                    width: '100%',
                    padding: '7px',
                    borderRadius: '9px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f1f5f9',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(6,182,212,0.15)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(6,182,212,0.4)';
                    (e.currentTarget as HTMLButtonElement).style.color = '#67e8f9';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
                    (e.currentTarget as HTMLButtonElement).style.color = '#f1f5f9';
                  }}
                >
                  គ្រប់គ្រងសមាជិកភាព
                </button>
              </div>

              {/* SYSTEM STATUS Card — glassmorphism */}
              <div
                onClick={onOpenSystemStatus}
                style={{
                  padding: '12px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(20,30,24,0.85) 0%, rgba(15,22,20,0.92) 100%)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  boxShadow: '0 0 0 1px rgba(16,185,129,0.2), inset 0 0 20px rgba(16,185,129,0.03), 0 4px 20px rgba(0,0,0,0.4)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    '0 0 0 1px rgba(16,185,129,0.4), inset 0 0 20px rgba(16,185,129,0.06), 0 8px 28px rgba(0,0,0,0.5)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    '0 0 0 1px rgba(16,185,129,0.2), inset 0 0 20px rgba(16,185,129,0.03), 0 4px 20px rgba(0,0,0,0.4)';
                }}
              >
                {/* Gradient border overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '14px',
                    padding: '1px',
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.4) 0%, rgba(6,182,212,0.2) 50%, rgba(16,185,129,0.1) 100%)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    pointerEvents: 'none',
                  }}
                />
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9', marginBottom: '6px', letterSpacing: '0.03em' }}>
                  ស្ថានភាពប្រព័ន្ធ
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#34d399',
                    marginBottom: '10px',
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#34d399',
                      boxShadow: '0 0 6px #34d399',
                      animation: 'pulse-ring 2s ease infinite',
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  <span>ប្រព័ន្ធដំណើរការធម្មតា</span>
                </div>
                {/* CPU / RAM / GPU metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', textAlign: 'center' }}>
                  {[
                    { label: 'CPU', val: '12%', color: '#60a5fa' },
                    { label: 'RAM', val: '48%', color: '#a78bfa' },
                    { label: 'GPU', val: '35%', color: '#34d399' },
                  ].map(({ label, val, color }) => (
                    <div
                      key={label}
                      style={{
                        padding: '7px 4px',
                        borderRadius: '9px',
                        background: 'rgba(0,0,0,0.3)',
                        border: `1px solid ${color}22`,
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <div style={{ fontSize: '8.5px', color: 'rgba(148,163,184,0.6)', letterSpacing: '0.08em', marginBottom: '2px', fontFamily: 'monospace' }}>
                        {label}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color, fontFamily: 'monospace' }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Collapsed bottom icons */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={onOpenSettings}
                title="សមាជិកភាព: PRO"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(30,32,50,0.8), rgba(20,22,36,0.9))',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  color: '#fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(99,102,241,0.4)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.3)';
                }}
              >
                👑
              </button>
              <button
                type="button"
                onClick={onOpenSystemStatus}
                title="ប្រព័ន្ធដំណើរការធម្មតា (CPU 12%, RAM 48%, GPU 35%)"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(14,24,20,0.85), rgba(10,20,16,0.92))',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(16,185,129,0.4)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.3)';
                }}
              >
                <Activity style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
