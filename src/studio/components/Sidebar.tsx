import React, { useEffect, useState } from 'react';
import {
  Home, FolderKanban, Film, Mic2, Bot, AudioLines, Sparkles, Box, SlidersHorizontal, Captions, Upload, Settings,
  Crown, ChevronsLeft, ChevronsRight, Workflow, Clapperboard, Zap, Languages, Wand2, Image as ImageIcon, ListOrdered,
  Scissors, Megaphone, ChevronDown, ChevronRight, Radio,
} from 'lucide-react';
import { useBridge } from '../StudioContext';
import { useStudio, FeatureId, BottomTab } from '../store/studioStore';
import { request } from '../../services/api';
import { Tip } from '../ui/primitives';
import type { TabId } from '../../types';

interface NavDef {
  id: string; icon: React.ElementType; en: string; km: string; badge?: { text: string; tone: string };
  tab?: TabId; feature?: FeatureId; bottom?: BottomTab; action?: 'export' | 'settings' | 'trimmer' | 'overlay';
}

export const NAV_MAIN: NavDef[] = [
  { id: 'dashboard', icon: Home, en: 'Dashboard', km: 'ផ្ទាំងដើម', tab: 'tab-dashboard' },
  { id: 'projects', icon: FolderKanban, en: 'Projects', km: 'គម្រោង', tab: 'tab-projects' },
  { id: 'media', icon: Film, en: 'Media Library', km: 'បណ្ណាល័យមេឌៀ', tab: 'tab-shelf' },
  { id: 'dubbing', icon: Mic2, en: 'Dubbing Studio', km: 'ស្ទូឌីយោបញ្ចូលសំឡេង', badge: { text: 'PRO', tone: 'violet' }, tab: 'tab-dubbing', feature: 'dubbing' },
  { id: 'tts', icon: Bot, en: 'AI TTS', km: 'អត្ថបទទៅសំឡេង', badge: { text: 'AUTO', tone: 'cyan' }, tab: 'tab-dubbing', feature: 'tts' },
  { id: 'clone', icon: AudioLines, en: 'Voice Cloning', km: 'ចម្លងសំឡេង', tab: 'tab-dubbing', feature: 'clone' },
  { id: 'effects', icon: Sparkles, en: 'Effects', km: 'បែបផែន', badge: { text: 'NEW', tone: 'green' }, tab: 'tab-dubbing', feature: 'effects' },
  { id: 'effects3d', icon: Box, en: '3D Effects', km: 'បែបផែន 3D', tab: 'tab-dubbing', feature: 'effects3d' },
  { id: 'mixer', icon: SlidersHorizontal, en: 'Audio Mixer', km: 'លាយសំឡេង', tab: 'tab-dubbing', bottom: 'mixer' },
  { id: 'subtitle', icon: Captions, en: 'Subtitle', km: 'អក្សររត់', tab: 'tab-dubbing', feature: 'subtitle', bottom: 'subtitle' },
  { id: 'export', icon: Upload, en: 'Export', km: 'នាំចេញ', action: 'export' },
  { id: 'settings', icon: Settings, en: 'Settings', km: 'ការកំណត់', action: 'settings' },
];

export const NAV_TOOLS: NavDef[] = [
  { id: 'workflow', icon: Workflow, en: '6-Step Workflow', km: 'លំហូរការងារ', tab: 'tab-workflow' },
  { id: 'classic', icon: Clapperboard, en: 'Classic Studio', km: 'ស្ទូឌីយោចាស់', tab: 'tab-classic' },
  { id: 'offline', icon: Zap, en: 'Khmer Offline Batch', km: 'ដំណើរការច្រើនភាគ', tab: 'tab-offline' },
  { id: 'narrator', icon: Mic2, en: 'Narrator Studio', km: 'ស្ទូឌីយោអ្នករៀបរាប់', badge: { text: 'NEW', tone: 'violet' }, tab: 'tab-narrator' },
  { id: 'voiceover', icon: Radio, en: 'VoiceOver Pro', km: 'ណារ៉ែតស្ទូឌីយោPro', badge: { text: 'HOT', tone: 'orange' }, tab: 'tab-voiceover' },
  { id: 'voices', icon: AudioLines, en: 'Voice Library', km: 'បណ្ណាល័យសំឡេង', tab: 'tab-character' },
  { id: 'stems', icon: SlidersHorizontal, en: 'Stem Separation', km: 'បំបែកសំឡេង', tab: 'tab-mixer' },
  { id: 'subclassic', icon: Captions, en: 'Subtitle Studio', km: 'ស្ទូឌីយោអក្សររត់', tab: 'tab-subtitles' },
  { id: 'translator', icon: Languages, en: 'Translation Desk', km: 'បកប្រែ', tab: 'tab-translator' },
  { id: 'tuner', icon: Wand2, en: 'Voice Tuner Lab', km: 'កែសំឡេង', tab: 'tab-tuner' },
  { id: 'lines', icon: ListOrdered, en: 'Line Editor', km: 'កែឃ្លា', tab: 'tab-manual' },
  { id: 'thumbnail', icon: ImageIcon, en: 'Thumbnail Studio', km: 'រូបតំណាង', tab: 'tab-thumbnail' },
  { id: 'trimmer', icon: Scissors, en: 'Video Trimmer', km: 'កាត់វីដេអូ', action: 'trimmer' },
  { id: 'overlay', icon: Megaphone, en: 'Commercial Overlay', km: 'ពាណិជ្ជកម្ម', action: 'overlay' },
];

export function useNavigate() {
  const b = useBridge();
  const set = useStudio((s) => s.set);
  return (n: NavDef) => {
    if (n.action === 'export') return set({ exportOpen: true });
    if (n.action === 'settings') return b.openModal('settings');
    if (n.action === 'trimmer') return b.openModal('trimmer');
    if (n.action === 'overlay') return b.openModal('overlay');
    if (n.id === 'thumbnail') return b.openThumbnail();
    if (n.feature) set({ feature: n.feature });
    if (n.bottom) set({ bottomTab: n.bottom });
    if (n.tab) b.setActiveTab(n.tab);
  };
}

const badgeCls: Record<string, string> = {
  violet: 'kdp-badge-violet', cyan: 'kdp-badge-cyan', green: 'kdp-badge-green', orange: 'kdp-badge-orange', muted: 'kdp-badge-muted',
};

const Meter: React.FC<{ label: string; value: number | null }> = ({ label, value }) => {
  const v = value == null ? null : Math.round(value);
  const color = v == null ? 'var(--kdp-text-3)' : v > 85 ? 'var(--kdp-red)' : v > 65 ? 'var(--kdp-orange)' : 'var(--kdp-cyan)';
  return (
    <div className="flex-1 rounded-lg border border-[var(--kdp-border)] px-2 py-1.5" style={{ background: 'rgba(5,11,22,.5)' }}>
      <div className="text-[9.5px] text-[var(--kdp-text-3)] tracking-wider">{label}</div>
      <div className="mono text-[12px] font-semibold" style={{ color }}>{v == null ? '—' : `${v}%`}</div>
      <div className="h-[3px] mt-1 rounded bg-[rgba(100,180,255,.1)] overflow-hidden">
        <div className="h-full rounded transition-all duration-700" style={{ width: `${v ?? 0}%`, background: color }} />
      </div>
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const b = useBridge();
  const { sidebarCollapsed: collapsed, feature, set } = useStudio();
  const go = useNavigate();
  const [usage, setUsage] = useState<{ cpu: number | null; ram: number | null; gpu: number | null }>({ cpu: null, ram: null, gpu: null });
  const [toolsOpen, setToolsOpen] = useState(true);

  useEffect(() => {
    let alive = true;
    const tick = () => request('/api/system/usage').then((u) => alive && setUsage(u)).catch(() => {});
    tick();
    const t = setInterval(tick, 3000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const isActive = (n: NavDef) => {
    if (n.tab !== b.activeTab) return false;
    if (n.tab === 'tab-dubbing') {
      if (n.feature) return n.feature === feature && !(n.id === 'subtitle' && false);
      return false;
    }
    return true;
  };

  const online = Boolean(b.voxStatus && (b.voxStatus.online || b.voxStatus.configured));
  const isPro = Boolean(b.user && (b.user.role === 'admin' || b.user.has_voxcpm_license || b.user.tier === 'premium'));
  const expiry = b.user?.role === 'admin' ? 'Lifetime' : (b.user?.voxcpm_license_expires_at || b.user?.premium_expires_at || '').slice(0, 10) || (isPro ? 'Lifetime' : '—');

  const renderItem = (n: NavDef) => {
    const active = isActive(n);
    const badge = n.id === 'media' ? { text: `${b.recentFiles.length}/10`, tone: 'muted' } : n.badge;
    const el = (
      <div
        key={n.id}
        id={`nav-${n.id}`}
        role="button"
        tabIndex={0}
        onClick={() => go(n)}
        onKeyDown={(e) => e.key === 'Enter' && go(n)}
        className={`kdp-nav-item ${active ? 'is-active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
      >
        <n.icon size={16} className={active ? 'text-[var(--kdp-cyan)]' : ''} />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{n.en}</span>
            {badge && <span className={`kdp-badge ${badgeCls[badge.tone]}`}>{badge.text}</span>}
          </>
        )}
      </div>
    );
    return collapsed ? <Tip key={n.id} side="right" label={<span>{n.en} · <span className="km">{n.km}</span></span>}>{el}</Tip> : el;
  };

  return (
    <aside
      className="shrink-0 flex flex-col kdp-glass border-y-0 border-l-0 transition-[width] duration-200 relative z-30"
      style={{ width: collapsed ? 60 : 224 }}
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-[9px] py-2.5 flex flex-col gap-0.5">
        {NAV_MAIN.map(renderItem)}

        <div className="kdp-divider my-2" />
        {!collapsed && (
          <button className="kdp-section-title flex items-center gap-1 px-1 py-1 hover:text-[var(--kdp-text-2)]" onClick={() => setToolsOpen(!toolsOpen)}>
            {toolsOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />} Pro Tools · ឧបករណ៍
          </button>
        )}
        {(toolsOpen || collapsed) && NAV_TOOLS.map(renderItem)}
      </div>

      {!collapsed && (
        <div className="px-[9px] pb-2 flex flex-col gap-2">
          {/* Membership */}
          <div className="rounded-xl p-2.5 border" style={{ borderColor: 'rgba(245,158,11,.3)', background: 'linear-gradient(135deg, rgba(245,158,11,.10), rgba(139,92,246,.08))' }}>
            <div className="flex items-center justify-between">
              <span className="kdp-section-title">Membership</span>
              <span className={`kdp-badge ${isPro ? 'kdp-badge-orange' : 'kdp-badge-muted'}`}><Crown size={10} /> {isPro ? 'PRO' : 'FREE'}</span>
            </div>
            <div className="text-[10.5px] text-[var(--kdp-text-3)] mt-1">Valid until: <span className="mono text-[var(--kdp-text-2)]">{expiry}</span></div>
            <button className="kdp-btn kdp-btn-xs w-full mt-2 font-semibold" onClick={() => b.openModal('license')}
              style={{ color: '#fcd34d', borderColor: 'rgba(245,158,11,.45)' }}>
              {isPro ? 'Manage License' : 'Upgrade'}
            </button>
          </div>

          {/* System status */}
          <div className="rounded-xl p-2.5 border border-[var(--kdp-border)]" style={{ background: 'rgba(7,17,31,.6)' }}>
            <button className="flex items-center justify-between w-full" onClick={() => b.openModal('systemStatus')}>
              <span className="kdp-section-title">System Status</span>
            </button>
            <div className="flex items-center gap-1.5 mt-1 text-[11px]">
              <span className={`kdp-dot ${online ? 'kdp-dot-live' : ''}`} style={{ background: online ? undefined : 'var(--kdp-orange)' }} />
              <span className={online ? 'text-[#86efac]' : 'text-[#fcd34d]'}>{online ? 'All Systems Online' : 'TTS Engine Offline'}</span>
            </div>
            <div className="flex gap-1.5 mt-2">
              <Meter label="CPU" value={usage.cpu} />
              <Meter label="RAM" value={usage.ram} />
              <Meter label="GPU" value={usage.gpu} />
            </div>
          </div>
        </div>
      )}

      <button
        className="h-8 border-t border-[var(--kdp-border)] flex items-center justify-center text-[var(--kdp-text-3)] hover:text-[var(--kdp-cyan)] transition-colors"
        onClick={() => set({ sidebarCollapsed: !collapsed })}
        aria-label="Toggle sidebar"
      >
        {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
      </button>
    </aside>
  );
};
