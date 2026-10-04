import React, { memo, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Sparkles, Play, Pause, RefreshCw, Trash2, Plus, Loader2, ScanSearch, Search, Clapperboard, Mic2, UserCog,
  CheckCircle2, AlertCircle, Square,
} from 'lucide-react';
import { useBridge } from '../StudioContext';
import { useStudio, fmtTime } from '../store/studioStore';
import { useLineActions, useGenState, stopPreview } from '../hooks/useLineActions';
import { transport } from '../hooks/usePlaybackEngine';
import { EMOTIONS, emotionMeta } from '../i18n';
import { Avatar, BL, IconBtn, Tip, EmptyState } from '../ui/primitives';
import type { CharacterVoice, TimelineSegment } from '../../types';

const COLS = '34px minmax(150px,1.25fr) minmax(140px,1fr) minmax(200px,2.2fr) 112px 104px 96px 44px 100px';

export const VoiceSelector: React.FC<{ value?: string; characters: CharacterVoice[]; onChange: (c: CharacterVoice | null, id: string) => void; className?: string }> = ({
  value, characters, onChange, className = '',
}) => {
  const known = characters.some((c) => c.id === value);
  return (
    <select
      className={`kdp-select h-[28px] text-[11.5px] km ${className}`}
      value={value || ''}
      onChange={(e) => onChange(characters.find((c) => c.id === e.target.value) || null, e.target.value)}
      onClick={(e) => e.stopPropagation()}
      aria-label="Voice"
    >
      <option value="">Auto voice · ស្វ័យប្រវត្តិ</option>
      {!known && value && <option value={value}>{value.replace(/^voxcpm:/, '')}</option>}
      <optgroup label="Female · ស្រី">
        {characters.filter((c) => c.gender === 'female').map((c) => <option key={c.id} value={c.id}>♀ {c.label}</option>)}
      </optgroup>
      <optgroup label="Male · ប្រុស">
        {characters.filter((c) => c.gender !== 'female').map((c) => <option key={c.id} value={c.id}>♂ {c.label}</option>)}
      </optgroup>
    </select>
  );
};

export const EmotionSelector: React.FC<{ value?: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const m = emotionMeta(value);
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <span className="absolute left-2 top-1/2 -translate-y-1/2 kdp-dot pointer-events-none" style={{ background: m.color, boxShadow: `0 0 6px ${m.color}` }} />
      <select className="kdp-select h-[28px] pl-5 text-[11.5px]" value={m.id} onChange={(e) => onChange(e.target.value)} aria-label="Emotion"
        style={{ borderColor: `${m.color}55`, color: m.color }}>
        {EMOTIONS.map((e) => <option key={e.id} value={e.id}>{e.en} · {e.km}</option>)}
      </select>
    </div>
  );
};

const MiniSlider: React.FC<{ value: number; min: number; max: number; step: number; fmt: (v: number) => string; onChange: (v: number) => void; label: string }> = ({
  value, min, max, step, fmt, onChange, label,
}) => (
  <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
    <span className="mono text-[10.5px] text-[var(--kdp-text-2)]">{fmt(value)}</span>
    <input type="range" className="kdp-range" min={min} max={max} step={step} value={value} aria-label={label}
      style={{ ['--pct' as any]: `${((value - min) / (max - min)) * 100}%` }}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      onDoubleClick={() => onChange(min < 0 ? 0 : 1)} />
  </div>
);

interface RowProps {
  seg: TimelineSegment; idx: number; selected: boolean; busy: boolean; playing: boolean; characters: CharacterVoice[];
  actions: ReturnType<typeof useLineActions>; onSelect: (i: number) => void;
}

export const CharacterRow = memo<RowProps>(({ seg, idx, selected, busy, playing, characters, actions, onSelect }) => {
  const name = seg.speaker_name || seg.speaker_id || `Speaker ${idx + 1}`;
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? seg.khmer_translation ?? '';
  const status = busy ? 'busy' : seg.status === 'error' ? 'error' : seg.audioUrl ? 'ready' : 'none';

  return (
    <div
      className={`kdp-row grid items-center gap-2 px-2 h-[52px] cursor-pointer ${selected ? 'is-selected' : ''}`}
      style={{ gridTemplateColumns: COLS }}
      onClick={() => onSelect(idx)}
      onDoubleClick={() => transport.seek(seg.start_time)}
      id={`line-${idx}`}
    >
      <div className="flex flex-col items-center leading-none gap-1">
        <span className="mono text-[11px] text-[var(--kdp-text-2)]">{idx + 1}</span>
        {status === 'ready' && <CheckCircle2 size={11} className="text-[var(--kdp-green)]" />}
        {status === 'error' && <AlertCircle size={11} className="text-[var(--kdp-red)]" />}
      </div>

      <div className="flex items-center gap-2 min-w-0">
        <Avatar name={name} gender={seg.gender} size={30} />
        <div className="min-w-0 leading-tight">
          <div className="text-[12px] font-medium truncate km" style={{ lineHeight: 1.4 }}>{name}</div>
          <div className="text-[10px] text-[var(--kdp-text-3)] flex items-center gap-1.5">
            <span>{seg.gender === 'female' ? 'Female' : 'Male'}</span>
            <span className="mono">{fmtTime(seg.start_time)}</span>
          </div>
        </div>
      </div>

      <VoiceSelector value={seg.voiceId} characters={characters} onChange={(c, id) => actions.update(idx, {
        voiceId: id || undefined, voiceFilename: c?.filename, voiceLabel: c?.label, gender: c?.gender || seg.gender, audioUrl: null, status: 'draft',
      })} />

      <div onClick={(e) => e.stopPropagation()} className="min-w-0">
        <input
          className="kdp-input h-[30px] km text-[12.5px]"
          value={text}
          placeholder={seg.chinese_text ? `↳ ${seg.chinese_text}` : 'Type Khmer dialogue… វាយអត្ថបទខ្មែរ'}
          title={seg.chinese_text || ''}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => onSelect(idx)}
          onBlur={() => {
            if (draft !== null && draft !== (seg.khmer_translation || '')) actions.update(idx, { khmer_translation: draft, audioUrl: null, status: 'draft' });
            setDraft(null);
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') { setDraft(null); (e.target as HTMLInputElement).blur(); } }}
        />
      </div>

      <EmotionSelector value={seg.emotion} onChange={(v) => actions.update(idx, { emotion: v, audioUrl: null, status: 'draft' })} />
      <MiniSlider label="Speed" value={seg.speed ?? 1} min={0.5} max={2} step={0.05} fmt={(v) => `${v.toFixed(2)}x`} onChange={(v) => actions.update(idx, { speed: v }, true)} />
      <MiniSlider label="Pitch" value={seg.pitch ?? 0} min={-12} max={12} step={1} fmt={(v) => (v > 0 ? `+${v}` : `${v}`)} onChange={(v) => actions.update(idx, { pitch: v }, true)} />

      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        <Tip label={seg.audioUrl ? (playing ? 'Stop' : 'Play voice') : 'Generate & play'}>
          <button className="w-8 h-8 rounded-full flex items-center justify-center border transition-all"
            disabled={busy}
            onClick={() => actions.playOrGenerate(idx)}
            style={{
              background: seg.audioUrl ? 'linear-gradient(135deg,#22d3ee,#3b82f6)' : 'rgba(100,180,255,.08)',
              borderColor: seg.audioUrl ? 'rgba(125,211,252,.6)' : 'var(--kdp-border)',
              color: seg.audioUrl ? '#04121f' : 'var(--kdp-text-2)',
            }}>
            {busy ? <Loader2 size={14} className="kdp-spin" /> : playing ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
          </button>
        </Tip>
      </div>

      <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
        <IconBtn icon={RefreshCw} label="Regenerate · បង្កើតឡើងវិញ" size="xs" disabled={busy} onClick={() => actions.generate(idx, { autoplay: true })} />
        <IconBtn icon={UserCog} label="Character inspector / voice" size="xs" onClick={() => { onSelect(idx); useStudio.getState().set({ aiPanelOpen: true, aiPanelTab: 'inspector' }); }} />
        <IconBtn icon={Mic2} label="Advanced generate…" size="xs" onClick={() => useStudio.getState().set({ generateFor: idx })} />
        <IconBtn icon={Trash2} label="Delete line" size="xs" variant="danger" onClick={() => actions.remove(idx)} />
      </div>
    </div>
  );
});
CharacterRow.displayName = 'CharacterRow';

export const DialoguePanel: React.FC = () => {
  const b = useBridge();
  const { selectedLine, set, currentTime } = useStudio();
  const busy = useGenState((s) => s.busy);
  const playing = useGenState((s) => s.playing);
  const actions = useLineActions();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'ready'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [previewAll, setPreviewAll] = useState(false);

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return b.segments
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => (filter === 'all' ? true : filter === 'ready' ? !!s.audioUrl : !s.audioUrl))
      .filter(({ s }) => !ql || `${s.speaker_name} ${s.khmer_translation} ${s.chinese_text} ${s.voiceLabel}`.toLowerCase().includes(ql));
  }, [b.segments, q, filter]);

  const virt = useVirtualizer({ count: rows.length, getScrollElement: () => scrollRef.current, estimateSize: () => 58, overscan: 8 });

  const voiced = b.segments.filter((s) => s.audioUrl).length;
  const speakers = new Set(b.segments.map((s) => s.speaker_name || s.speaker_id)).size;
  const anyBusy = Object.keys(busy).length > 0;

  const select = (i: number) => {
    set({ selectedLine: i });
  };

  const runPreviewAll = () => {
    if (previewAll) { transport.video?.pause(); setPreviewAll(false); return; }
    const first = b.segments.find((s) => s.audioUrl) || b.segments[0];
    if (!first) return;
    stopPreview();
    set({ previewSource: 'live' });
    transport.seek(Math.max(0, first.start_time - 0.3));
    transport.toggle();
    setPreviewAll(true);
  };

  return (
    <section className="kdp-panel flex flex-col h-full min-h-0" aria-label="AI Dubbing">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-3 pb-2.5">
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,rgba(34,211,238,.22),rgba(139,92,246,.22))', border: '1px solid var(--kdp-border-strong)' }}>
          <Clapperboard size={17} className="text-[var(--kdp-cyan)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold flex items-center gap-2">
            AI Dubbing <span className="km text-[12px] font-normal text-[var(--kdp-text-3)]">ការបញ្ចូលសំឡេង AI</span>
          </h1>
          <p className="text-[11.5px] text-[var(--kdp-text-3)]">Create natural Khmer voices for your characters · បង្កើតសំឡេងខ្មែរធម្មជាតិសម្រាប់តួអង្គ</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Tip label="AI scan: detect speech, speakers & translate">
            <button className="kdp-btn kdp-btn-sm" onClick={b.scanTimeline} disabled={b.isScanning || !b.uploadedFile} id="btn-scan">
              {b.isScanning ? <Loader2 size={13} className="kdp-spin" /> : <ScanSearch size={13} />} AI Scan
            </button>
          </Tip>
          <button className="kdp-btn kdp-btn-sm kdp-btn-primary" id="btn-generate-all" disabled={b.segments.length === 0 || anyBusy}
            onClick={() => actions.generateMany(b.segments.map((s, i) => (!s.audioUrl ? i : -1)).filter((i) => i >= 0).concat(
              b.segments.every((s) => s.audioUrl) ? b.segments.map((_, i) => i) : []))}>
            {anyBusy ? <Loader2 size={13} className="kdp-spin" /> : <Sparkles size={13} />} <BL k="generateAll" />
          </button>
          <button className="kdp-btn kdp-btn-sm" onClick={runPreviewAll} disabled={b.segments.length === 0} id="btn-preview-all">
            {previewAll && useStudio.getState().isPlaying ? <Square size={12} /> : <Play size={13} />} <BL k="previewAll" />
          </button>
        </div>
      </div>

      {/* Sub toolbar */}
      <div className="flex items-center gap-2 px-4 pb-2">
        <div className="relative w-[220px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--kdp-text-3)]" />
          <input className="kdp-input h-[28px] pl-8" placeholder="Find line or character…" value={q} onChange={(e) => setQ(e.target.value)} id="dialogue-search" />
        </div>
        <div className="kdp-tabs">
          {(['all', 'pending', 'ready'] as const).map((f) => (
            <button key={f} className={`kdp-tab h-[26px] text-[11.5px] capitalize ${filter === f ? 'is-active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3 text-[11px] text-[var(--kdp-text-3)]">
          <span><b className="text-[var(--kdp-text)] mono">{b.segments.length}</b> lines</span>
          <span><b className="text-[var(--kdp-green)] mono">{voiced}</b> voiced</span>
          <span><b className="text-[var(--kdp-violet)] mono">{speakers}</b> characters</span>
        </div>
      </div>

      {/* Table head */}
      <div className="grid gap-2 px-6 pb-1.5 kdp-table-head" style={{ gridTemplateColumns: COLS }}>
        <span>#</span><span><BL k="character" /></span><span><BL k="voice" /></span><span><BL k="khmerText" /></span>
        <span><BL k="emotion" /></span><span><BL k="speed" /></span><span><BL k="pitch" /></span><span className="text-center">Audio</span><span className="text-right">Action</span>
      </div>

      {/* Rows */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto px-4 pb-2">
        {b.segments.length === 0 ? (
          <EmptyState icon={Mic2} title="No dialogue yet" km="មិនទាន់មានឃ្លាសន្ទនា — ចុច AI Scan ឬ AUTO DUB"
            action={<div className="flex gap-2">
              <button className="kdp-btn kdp-btn-primary" onClick={b.scanTimeline} disabled={!b.uploadedFile}><ScanSearch size={14} /> AI Scan Video</button>
              <button className="kdp-btn" onClick={() => actions.insertAt(currentTime)}><Plus size={14} /> Add line manually</button>
            </div>} />
        ) : (
          <div style={{ height: virt.getTotalSize(), position: 'relative' }}>
            {virt.getVirtualItems().map((vi) => {
              const { s, i } = rows[vi.index];
              return (
                <div key={vi.key} style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${vi.start}px)`, height: 58, paddingBottom: 6 }}>
                  <CharacterRow seg={s} idx={i} selected={selectedLine === i} busy={!!busy[i]} playing={playing === i}
                    characters={b.characters} actions={actions} onSelect={select} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-t border-[var(--kdp-border)]">
        <button className="kdp-btn kdp-btn-sm" onClick={() => actions.insertAt(currentTime)} id="btn-add-line">
          <Plus size={13} /> <BL k="addCharacter" /> <span className="text-[var(--kdp-text-3)] mono text-[10.5px]">@ {fmtTime(currentTime)}</span>
        </button>
        <div className="flex-1" />
        {b.isDubbing && <span className="text-[11px] text-[var(--kdp-text-3)] km truncate max-w-[40%]">{b.dubbingMessage}</span>}
        <Tip label="Mix all voiced lines with preserved background into the final video">
          <button className="kdp-btn kdp-btn-sm kdp-btn-ai" disabled={b.isDubbing || b.segments.length === 0} onClick={b.assemble} id="btn-render">
            {b.isDubbing ? <Loader2 size={13} className="kdp-spin" /> : <Clapperboard size={13} />} Render Dub · បង្កើតវីដេអូ
          </button>
        </Tip>
      </div>
    </section>
  );
};
