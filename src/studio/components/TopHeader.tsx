import React, { useRef } from 'react';
import * as DM from '@radix-ui/react-dropdown-menu';
import {
  ChevronDown, Zap, Settings, Sun, Moon, Bell, Crown, Search, Film, FolderOpen, Layers, Upload, Link2,
  Plus, Save, Undo2, Redo2, Check, Shield, Key, Cpu, BookOpen, Palette, Download, Keyboard, Image as ImageIcon,
  Archive, Copy, RefreshCw, Loader2, Activity, Heart,
} from 'lucide-react';
import { useBridge } from '../StudioContext';
import { useStudio } from '../store/studioStore';
import { IconBtn, Tip } from '../ui/primitives';

const Logo: React.FC = () => (
  <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
    <defs>
      <linearGradient id="kdpLg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#22d3ee" />
        <stop offset="0.55" stopColor="#3b82f6" />
        <stop offset="1" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#kdpLg)" opacity="0.16" stroke="url(#kdpLg)" />
    <rect x="12" y="6" width="8" height="13" rx="4" fill="url(#kdpLg)" />
    <path d="M9 15a7 7 0 0 0 14 0" stroke="url(#kdpLg)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <path d="M16 22v4" stroke="url(#kdpLg)" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M4 16h1.5M6.5 13v6M26.5 13v6M28 16h-1.5" stroke="#67e8f9" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const Selector: React.FC<{ label: string; icon: React.ElementType; value: string; children: React.ReactNode; width?: number }> = ({
  label, icon: Icon, value, children, width = 190,
}) => (
  <DM.Root>
    <DM.Trigger asChild>
      <button className="kdp-btn h-[38px] px-2.5 justify-start gap-2 text-left" style={{ width }}>
        <Icon size={15} className="text-[var(--kdp-cyan)] shrink-0" />
        <span className="flex flex-col min-w-0 flex-1 leading-tight">
          <span className="text-[9.5px] uppercase tracking-wider text-[var(--kdp-text-3)]">{label}</span>
          <span className="truncate text-[12px] km" style={{ lineHeight: 1.35 }}>{value}</span>
        </span>
        <ChevronDown size={13} className="text-[var(--kdp-text-3)] shrink-0" />
      </button>
    </DM.Trigger>
    <DM.Portal>
      <DM.Content className="kdp-menu max-h-[60vh] overflow-auto" sideOffset={6} align="start">
        {children}
      </DM.Content>
    </DM.Portal>
  </DM.Root>
);

const Item: React.FC<{ icon?: React.ElementType; onSelect?: () => void; children: React.ReactNode; right?: React.ReactNode; active?: boolean }> = ({
  icon: Icon, onSelect, children, right, active,
}) => (
  <DM.Item className="kdp-menu-item" onSelect={onSelect}>
    {Icon ? <Icon size={14} className={active ? 'text-[var(--kdp-cyan)]' : ''} /> : <span className="w-[14px]" />}
    <span className="flex-1 truncate km" style={{ lineHeight: 1.4 }}>{children}</span>
    {active && <Check size={13} className="text-[var(--kdp-cyan)]" />}
    {right}
  </DM.Item>
);

export const TopHeader: React.FC = () => {
  const b = useBridge();
  const { set, notifications, markAllRead, jobs } = useStudio();
  const fileRef = useRef<HTMLInputElement>(null);
  const unread = notifications.filter((n) => !n.read).length;
  const running = jobs.filter((j) => j.status === 'running');
  const isAdmin = b.user?.role === 'admin';
  const isPro = Boolean(b.user && (b.user.role === 'admin' || b.user.has_voxcpm_license || b.user.tier === 'premium'));
  const projectName = b.uploadedFile?.originalName || b.uploadedFile?.filename || 'Untitled Project';
  const group = b.projectGroups.find((g) => g.id === b.activeGroupId);
  const machineId = b.user?.machine_id || b.user?.current_device_id || '';

  return (
    <header className="h-[54px] shrink-0 flex items-center gap-3 px-3 kdp-glass border-x-0 border-t-0 relative z-40">
      {/* Brand */}
      <div className="flex items-center gap-2.5 pr-2 min-w-[190px]">
        <Logo />
        <div className="leading-tight">
          <div className="text-[13.5px] font-bold tracking-[0.06em]">
            KHMER DUBBING <span className="text-[var(--kdp-cyan)]">PRO</span>
          </div>
          <div className="text-[10px] text-[var(--kdp-text-3)] tracking-wide">AI Dubbing Studio · <span className="km">ស្ទូឌីយោបញ្ចូលសំឡេង</span></div>
        </div>
      </div>

      <div className="w-px h-7 bg-[var(--kdp-border)]" />

      {/* Selectors */}
      <Selector label="Project · គម្រោង" icon={FolderOpen} value={projectName}>
        <div className="kdp-menu-label">Project</div>
        <Item icon={Plus} onSelect={b.newProject}>New Project · គម្រោងថ្មី</Item>
        <Item icon={Save} onSelect={b.saveProject} right={<span className="kdp-kbd">Ctrl S</span>}>Save Project</Item>
        <Item icon={FolderOpen} onSelect={() => b.setActiveTab('tab-projects')}>Project Manager…</Item>
        <Item icon={Archive} onSelect={() => b.openModal('shelf')}>Video Shelf (10 slots)…</Item>
        <DM.Separator className="kdp-menu-sep" />
        <Item icon={Download} onSelect={() => {
          const blob = new Blob([JSON.stringify({ file: b.uploadedFile, segments: b.segments, effects: b.videoEffects, subtitleStyle: b.subtitleStyle, studio: useStudio.getState() }, null, 2)], { type: 'application/json' });
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${projectName}.kdp.json`; a.click();
        }}>Export Project File (.kdp.json)</Item>
      </Selector>

      <Selector label="Video" icon={Film} value={b.uploadedFile?.filename || 'No video loaded'} width={220}>
        <div className="kdp-menu-label">Import</div>
        <Item icon={Upload} onSelect={() => fileRef.current?.click()}>Import Video / Audio…</Item>
        <Item icon={Link2} onSelect={() => b.openModal('downloader')}>Download from URL (YouTube/TikTok/FB)…</Item>
        <DM.Separator className="kdp-menu-sep" />
        <div className="kdp-menu-label">Recent ({b.recentFiles.length})</div>
        {b.recentFiles.length === 0 && <div className="px-2 py-2 text-[11.5px] text-[var(--kdp-text-3)]">No media yet</div>}
        {b.recentFiles.slice(0, 30).map((f) => (
          <Item key={f.filename} icon={Film} active={f.filename === b.uploadedFile?.filename} onSelect={() => b.selectFile(f)}>
            {f.originalName || f.filename}
          </Item>
        ))}
      </Selector>
      <input ref={fileRef} type="file" accept="video/*,audio/*" hidden onChange={(e) => {
        const f = e.target.files?.[0]; if (f) b.uploadFile(f); e.target.value = '';
      }} />

      <Selector label="Group · ក្រុម" icon={Layers} value={group?.name || 'General · ទូទៅ'} width={170}>
        <Item icon={Layers} active={!b.activeGroupId} onSelect={() => b.setActiveGroupId(null)}>General · ទូទៅ</Item>
        {b.projectGroups.map((g) => (
          <Item key={g.id} icon={Layers} active={g.id === b.activeGroupId} onSelect={() => b.setActiveGroupId(g.id)}>{g.name}</Item>
        ))}
        <DM.Separator className="kdp-menu-sep" />
        <Item icon={Settings} onSelect={() => b.openModal('groups')}>Manage Groups…</Item>
      </Selector>

      <div className="flex-1" />

      {/* Command search */}
      <button className="kdp-btn h-[32px] w-[220px] justify-start text-[var(--kdp-text-3)] kdp-hide-md" onClick={() => set({ commandOpen: true })}>
        <Search size={14} />
        <span className="flex-1 text-left">Search commands…</span>
        <span className="kdp-kbd">Ctrl K</span>
      </button>

      <div className="flex items-center gap-1">
        <IconBtn icon={Undo2} label="Undo" kbd="Ctrl Z" onClick={b.undo} disabled={!b.canUndo} />
        <IconBtn icon={Redo2} label="Redo" kbd="Ctrl Shift Z" onClick={b.redo} disabled={!b.canRedo} />
        <Tip label={b.isSaving ? 'Saving…' : 'Autosave on · Click to save'} kbd="Ctrl S">
          <button className="kdp-btn kdp-btn-ghost kdp-btn-sm gap-1.5 text-[var(--kdp-text-3)]" onClick={b.saveProject}>
            {b.isSaving ? <Loader2 size={13} className="kdp-spin" /> : <Check size={13} className="text-[var(--kdp-green)]" />}
            <span className="kdp-hide-md">{b.isSaving ? 'Saving' : 'Saved'}</span>
          </button>
        </Tip>
      </div>

      <div className="w-px h-7 bg-[var(--kdp-border)]" />

      {running.length > 0 && (
        <Tip label={running.map((j) => `${j.label} ${Math.round(j.progress * 100)}%`).join(' · ')}>
          <button className="kdp-btn kdp-btn-sm gap-1.5" onClick={() => set({ aiPanelOpen: true, aiPanelTab: 'queue' })}>
            <Activity size={13} className="text-[var(--kdp-violet)]" />
            <span className="mono">{running.length} job{running.length > 1 ? 's' : ''}</span>
          </button>
        </Tip>
      )}
      {b.isDubbing && (
        <div className="flex items-center gap-2 px-2 h-[30px] rounded-lg border border-[var(--kdp-border)] text-[11px]">
          <Loader2 size={13} className="kdp-spin text-[var(--kdp-cyan)]" />
          <span className="mono">{Math.round(b.dubbingProgress)}%</span>
        </div>
      )}

      <Tip label="Hardware Turbo (GPU/CPU acceleration)">
        <button className="kdp-btn kdp-btn-sm font-semibold gap-1.5" onClick={() => b.openModal('turbo')}
          style={{ color: '#c4b5fd', borderColor: 'rgba(139,92,246,.45)', background: 'rgba(139,92,246,.12)' }}>
          <Zap size={13} /> TURBO
        </button>
      </Tip>
      <IconBtn icon={Settings} label="Settings · ការកំណត់" onClick={() => b.openModal('settings')} />
      <IconBtn icon={b.isDarkMode ? Moon : Sun} label="Theme · ប្តូរពណ៌" onClick={b.toggleDarkMode} />

      <DM.Root onOpenChange={(o) => { if (!o) markAllRead(); }}>
        <DM.Trigger asChild>
          <button className="kdp-btn kdp-btn-ghost kdp-btn-icon kdp-btn-sm relative" aria-label="Notifications">
            <Bell size={14} />
            {(unread > 0 || b.hasUpdate) && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center bg-[var(--kdp-red)] text-white">
                {unread + (b.hasUpdate ? 1 : 0)}
              </span>
            )}
          </button>
        </DM.Trigger>
        <DM.Portal>
          <DM.Content className="kdp-menu w-[340px] max-h-[60vh] overflow-auto" sideOffset={6} align="end">
            <div className="kdp-menu-label flex justify-between"><span>Notifications</span><span>{notifications.length}</span></div>
            {b.hasUpdate && <Item icon={RefreshCw} onSelect={() => b.openModal('update')}>New version available — update now</Item>}
            {notifications.length === 0 && !b.hasUpdate && <div className="px-3 py-6 text-center text-[var(--kdp-text-3)] text-[12px]">All caught up · គ្មានការជូនដំណឹង</div>}
            {notifications.slice(0, 25).map((n) => (
              <div key={n.id} className="px-2 py-1.5 rounded-md flex gap-2 text-[11.5px]">
                <span className="kdp-dot mt-1.5 shrink-0" style={{ background: n.type === 'error' ? 'var(--kdp-red)' : n.type === 'success' ? 'var(--kdp-green)' : n.type === 'warning' ? 'var(--kdp-orange)' : 'var(--kdp-cyan)' }} />
                <div className="flex-1 min-w-0">
                  <div className="km text-[var(--kdp-text)]" style={{ lineHeight: 1.5 }}>{n.message}</div>
                  <div className="text-[10px] text-[var(--kdp-text-3)] mono">{new Date(n.time).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </DM.Content>
        </DM.Portal>
      </DM.Root>

      <Tip label={isPro ? 'VIP / License active' : 'Activate VoxCPM2 License'}>
        <button className="kdp-btn kdp-btn-sm font-semibold gap-1.5" onClick={() => b.openModal('license')}
          style={{ color: '#fcd34d', borderColor: 'rgba(245,158,11,.45)', background: 'linear-gradient(135deg,rgba(245,158,11,.16),rgba(234,88,12,.1))' }}>
          <Crown size={13} /> VIP
        </button>
      </Tip>

      {/* Avatar */}
      <DM.Root>
        <DM.Trigger asChild>
          <button className="flex items-center gap-2 pl-1 pr-2 h-[38px] rounded-[10px] hover:bg-[rgba(100,180,255,.07)] transition-colors">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#22d3ee,#8b5cf6)' }}>
              {(b.user?.username || 'U').slice(0, 2).toUpperCase()}
            </div>
            <div className="leading-tight text-left kdp-hide-md">
              <div className="text-[12px] font-semibold">{isAdmin ? 'Admin' : 'User'}</div>
              <div className="text-[10px] text-[var(--kdp-text-3)]">{isPro ? 'Pro User' : 'Free'}</div>
            </div>
            <ChevronDown size={13} className="text-[var(--kdp-text-3)]" />
          </button>
        </DM.Trigger>
        <DM.Portal>
          <DM.Content className="kdp-menu w-[260px]" sideOffset={6} align="end">
            <div className="px-2 py-2">
              <div className="text-[12.5px] font-semibold">{b.user?.username || 'Connecting…'}</div>
              <button className="mono text-[10.5px] text-[var(--kdp-text-3)] hover:text-[var(--kdp-cyan)] flex items-center gap-1 mt-0.5"
                onClick={() => { navigator.clipboard?.writeText(machineId); b.showToast('Machine ID copied', 'success'); }}>
                <Cpu size={11} /> {machineId || '—'} <Copy size={10} />
              </button>
            </div>
            <DM.Separator className="kdp-menu-sep" />
            {isAdmin && <Item icon={Shield} onSelect={() => b.openModal('admin')}>Admin Console · ផ្ទាំង Admin</Item>}
            {isAdmin && <Item icon={Heart} onSelect={() => b.openModal('sponsor')}>Sponsor Management · គ្រប់គ្រង Sponsor</Item>}
            <Item icon={Key} onSelect={() => b.openModal('license')}>License Key VoxCPM2</Item>
            <Item icon={Cpu} onSelect={() => b.openModal('vox')}>VoxCPM Engine ({b.engineMode})</Item>
            <Item icon={Activity} onSelect={() => b.openModal('systemStatus')}>System Status</Item>
            <DM.Separator className="kdp-menu-sep" />
            <Item icon={ImageIcon} onSelect={b.openThumbnail}>Thumbnail Studio</Item>
            <Item icon={Palette} onSelect={() => b.openModal('customizer')}>Customize UI / Wallpaper</Item>
            <Item icon={Keyboard} onSelect={() => b.openModal('shortcuts')}>Keyboard Shortcuts</Item>
            <Item icon={BookOpen} onSelect={() => b.openModal('guide')}>User Guide</Item>
            <Item icon={RefreshCw} onSelect={() => b.openModal('update')} right={b.hasUpdate ? <span className="kdp-badge kdp-badge-orange">NEW</span> : <span className="mono text-[10px] text-[var(--kdp-text-3)]">{b.currentVersion}</span>}>Software Update</Item>
            <DM.Separator className="kdp-menu-sep" />
            <div className="kdp-menu-label">Interface language</div>
            {(['both', 'en', 'km'] as const).map((l) => (
              <Item key={l} active={useStudio.getState().lang === l} onSelect={() => set({ lang: l })}>
                {l === 'both' ? 'English + ខ្មែរ' : l === 'en' ? 'English' : 'ខ្មែរ'}
              </Item>
            ))}
          </DM.Content>
        </DM.Portal>
      </DM.Root>
    </header>
  );
};
