import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Scan,
  Magnet,
  ZoomIn,
  ZoomOut,
  CheckCheck,
  Scissors,
  Trash2,
  Copy,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Maximize2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Sparkles,
  Download,
} from 'lucide-react';
import { TimelineSegment } from '../../types';

interface TimelineProps {
  duration: number;
  currentTime: number;
  segments: TimelineSegment[];
  onChangeSegments?: (segments: TimelineSegment[]) => void;
  selectedSegmentIndex: number;
  onSelectSegment: (index: number) => void;
  onSeek: (time: number) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onScan: () => void;
  isScanning?: boolean;
  onAssemble: () => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  timelineHeight?: 'normal' | 'expanded' | 'compact';
  onToggleTimelineHeight?: () => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  activeTimelineTab?: 'timeline' | 'subtitle' | 'mixer' | 'effects';
  onSelectTimelineTab?: (tab: 'timeline' | 'subtitle' | 'mixer' | 'effects') => void;
}

/** Format seconds → MM:SS.ms (e.g. 01:23.4) */
function formatTimecode(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(m)}:${pad(s)}.${ms}`;
}

/** Per-character colour palette for segment gradient fills */
const CHAR_COLORS: Record<string, [string, string]> = {
  default: ['#10b981', '#0d9488'],
  A: ['#06b6d4', '#0284c7'],
  B: ['#8b5cf6', '#7c3aed'],
  C: ['#f59e0b', '#d97706'],
  D: ['#ec4899', '#db2777'],
  E: ['#84cc16', '#65a30d'],
  F: ['#f97316', '#ea580c'],
  G: ['#14b8a6', '#0f766e'],
};

function getCharColors(seg: TimelineSegment): [string, string] {
  const char = (seg.speaker_name ?? seg.speaker_id ?? '').trim()[0]?.toUpperCase() ?? '';
  return CHAR_COLORS[char] ?? CHAR_COLORS['default'];
}

/** Simplified waveform bars (CSS-only placeholder visualisation) */
const WaveformBars: React.FC<{ color: string; count?: number }> = ({ color, count = 28 }) => (
  <div className="flex items-center gap-[1.5px] h-full px-1 pointer-events-none overflow-hidden opacity-60">
    {Array.from({ length: Number.isFinite(count) ? Math.max(0, Math.min(300, Math.floor(count))) : 28 }).map((_, i) => {
      const h = 30 + Math.abs(Math.sin(i * 0.7 + i * 0.3)) * 60;
      return (
        <div
          key={i}
          style={{ height: `${h}%`, backgroundColor: color, minWidth: '2px', borderRadius: '1px' }}
        />
      );
    })}
  </div>
);

/** Track colour definitions */
const TRACK_CONFIGS = [
  { id: 'V1',  label: 'វីដេអូ',              color: '#00C2FF', accent: 'cyan',    bg: '#141618' },
  { id: 'A1',  label: 'សំឡេងឌាប់ខ្មែរ',     color: '#10b981', accent: 'emerald', bg: '#111315' },
  { id: 'A2',  label: 'សំឡេងដើម',            color: '#a855f7', accent: 'purple',  bg: '#141618' },
  { id: 'B1',  label: 'តន្ត្រីផ្ទៃខាងក្រោយ', color: '#f59e0b', accent: 'amber',   bg: '#111315' },
  { id: 'S1',  label: 'សំឡេងបែបផែន',        color: '#ec4899', accent: 'pink',    bg: '#141618' },
  { id: 'CC1', label: 'ចំណងជើងរង',           color: '#818cf8', accent: 'indigo',  bg: '#111315' },
  { id: 'FX1', label: 'បែបផែន',              color: '#38bdf8', accent: 'sky',     bg: '#141618' },
] as const;

export const MultiTrackTimeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  segments,
  onChangeSegments,
  selectedSegmentIndex,
  onSelectSegment,
  onSeek,
  isPlaying = false,
  onTogglePlay,
  onScan,
  isScanning = false,
  onAssemble,
  zoom,
  onZoomChange,
  timelineHeight = 'normal',
  onToggleTimelineHeight,
  onShowToast,
  activeTimelineTab = 'timeline',
  onSelectTimelineTab,
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [snapEnabled, setSnapEnabled] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  const [dragInfo, setDragInfo] = useState<{
    type: 'move' | 'trim-start' | 'trim-end';
    index: number;
    initialMouseX: number;
    initialStart: number;
    initialEnd: number;
  } | null>(null);

  const [mutedTracks, setMutedTracks] = useState<Record<string, boolean>>({});
  const [lockedTracks, setLockedTracks] = useState<Record<string, boolean>>({});
  const [soloTracks, setSoloTracks] = useState<Record<string, boolean>>({});
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

  const toggleTrackMute  = (id: string) => setMutedTracks((p) => ({ ...p, [id]: !p[id] }));
  const toggleTrackSolo  = (id: string) => setSoloTracks((p) => ({ ...p, [id]: !p[id] }));
  const toggleTrackLock  = (id: string) => setLockedTracks((p) => ({ ...p, [id]: !p[id] }));

  const segmentDuration = segments.reduce((max, seg) =>
    Number.isFinite(seg.end_time) && seg.end_time > max ? seg.end_time : max, 0);
  const totalDur = Number.isFinite(duration) && duration > 0 ? duration : segmentDuration;
  const activeTime = currentTime;
  const playheadPercent = totalDur > 0 ? Math.min(100, Math.max(0, (activeTime / totalDur) * 100)) : 0;

  const getTimeFromEvent = useCallback(
    (clientX: number) => {
      if (!canvasRef.current) return 0;
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      return ratio * totalDur;
    },
    [totalDur]
  );

  const handleRulerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsScrubbing(true);
    onSeek(getTimeFromEvent(e.clientX));
  };

  useEffect(() => {
    if (!isScrubbing) return;
    const onMove = (e: MouseEvent) => onSeek(getTimeFromEvent(e.clientX));
    const onUp   = () => setIsScrubbing(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [isScrubbing, getTimeFromEvent, onSeek]);

  const handleTimelineWheel = (e: React.WheelEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) {
      e.preventDefault();
      onZoomChange(Math.min(300, Math.max(50, zoom + (e.deltaY < 0 ? 15 : -15))));
    } else if (e.shiftKey && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  // Ruler ticks: 1-second minor, 5-second medium, 10-second major
  const rulerTicks = React.useMemo(() => {
    if (totalDur <= 0) return [];
    const ticks: { time: number; type: 'major' | 'medium' | 'minor'; label?: string }[] = [];
    const step = 1;
    const count = Math.ceil(totalDur / step);
    for (let i = 0; i <= Math.min(count, 600); i++) {
      const t = i * step;
      if (i % 10 === 0)       ticks.push({ time: t, type: 'major', label: formatTimecode(t) });
      else if (i % 5 === 0)   ticks.push({ time: t, type: 'medium' });
      else                    ticks.push({ time: t, type: 'minor' });
    }
    return ticks;
  }, [totalDur]);

  const handleSplitClip = () => {
    if (!onChangeSegments || segments.length === 0) return;
    const seg = segments[selectedSegmentIndex];
    if (!seg) return;
    if (activeTime <= seg.start_time || activeTime >= seg.end_time) {
      onShowToast?.('សូមដាក់ Playhead នៅចន្លោះឃ្លាដើម្បីកាត់ (Split)', 'info');
      return;
    }
    const origEnd = seg.end_time;
    const split1 = { ...seg, end_time: activeTime };
    const split2 = { ...seg, line_index: seg.line_index + 1, start_time: activeTime, end_time: origEnd };
    const updated = [
      ...segments.slice(0, selectedSegmentIndex),
      split1,
      split2,
      ...segments.slice(selectedSegmentIndex + 1),
    ].map((s, idx) => ({ ...s, line_index: idx }));
    onChangeSegments(updated);
    onShowToast?.(`បានកាត់ឃ្លា #${selectedSegmentIndex + 1} ជាពីរជោគជ័យ!`, 'success');
  };

  /* ─────────────────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────────────────── */
  return (
    <div
      className="multi-track-timeline h-full text-slate-100 border-t border-white/[0.06] flex flex-col overflow-hidden select-none font-khmer shrink-0"
      style={{ background: '#0d0f12' }}
    >

      {/* ══════════════════════════════════════════════════════
          TOOLBAR — brushed-metal header  (top strip)
      ══════════════════════════════════════════════════════ */}
      <div
        className="h-12 px-3 border-b border-white/[0.08] flex items-center justify-between gap-2 shrink-0"
        style={{
          background: 'linear-gradient(180deg, #1e2128 0%, #16181d 100%)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >

        {/* ── GROUP 1: Playback controls ── */}
        <div className="flex items-center gap-1.5">
          {/* Skip back pill */}
          <button
            type="button"
            onClick={() => onSeek(Math.max(0, activeTime - 10))}
            title="ថយក្រោយ 10 វិ"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-slate-300 hover:text-white transition-all text-[10px] font-bold border border-white/[0.08] hover:border-white/20"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <SkipBack className="w-3 h-3" />
            <span>10s</span>
          </button>

          {/* Play/Pause — 40 px button with glow ring when playing */}
          <button
            type="button"
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: isPlaying
                ? 'radial-gradient(circle, #00d4ff 0%, #0088cc 100%)'
                : 'radial-gradient(circle, #1e2430 0%, #141820 100%)',
              boxShadow: isPlaying
                ? '0 0 0 3px rgba(0,194,255,0.25), 0 0 18px rgba(0,194,255,0.5), 0 0 36px rgba(0,194,255,0.2)'
                : '0 0 0 2px rgba(255,255,255,0.08)',
              border: isPlaying ? '1.5px solid rgba(0,220,255,0.7)' : '1.5px solid rgba(255,255,255,0.12)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
            }}
          >
            {isPlaying
              ? <Pause  className="w-[18px] h-[18px] text-white" />
              : <Play   className="w-[18px] h-[18px] text-cyan-300 fill-current" style={{ marginLeft: 2 }} />
            }
          </button>

          {/* Skip forward pill */}
          <button
            type="button"
            onClick={() => onSeek(Math.min(totalDur, activeTime + 10))}
            title="លោត 10 វិ"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-slate-300 hover:text-white transition-all text-[10px] font-bold border border-white/[0.08] hover:border-white/20"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <span>10s</span>
            <SkipForward className="w-3 h-3" />
          </button>

          {/* Loop toggle pill */}
          <button
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            title="Loop"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
              isLooping
                ? 'text-cyan-300 border-cyan-400/40 bg-cyan-500/15'
                : 'text-slate-400 border-white/[0.08] hover:text-white bg-white/[0.04]'
            }`}
          >
            <Repeat className="w-3 h-3" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-white/[0.08] mx-1" />

          {/* Timecode display */}
          <div
            className="flex items-center px-2.5 py-1 rounded-lg"
            style={{
              background: '#080a0d',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
              minWidth: 80,
            }}
          >
            <span
              className="font-mono text-[13px] font-bold tracking-wider"
              style={{ color: '#00e5ff', textShadow: '0 0 8px rgba(0,229,255,0.6)', fontVariantNumeric: 'tabular-nums' }}
            >
              {formatTimecode(currentTime)}
            </span>
          </div>
        </div>

        {/* ── GROUP 2: Zoom controls ── */}
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-xl border border-white/[0.08]"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <ZoomOut className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="range"
            min={50}
            max={250}
            step={10}
            value={zoom}
            onChange={(e) => onZoomChange(parseInt(e.target.value, 10))}
            className="w-20 h-1 rounded cursor-pointer"
            style={{ accentColor: '#00c2ff' }}
          />
          <ZoomIn className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-mono text-[10px] text-cyan-400 min-w-[28px] text-center">{Math.round(zoom / 100 * 10) / 10}x</span>
          <button
            type="button"
            onClick={() => onZoomChange(100)}
            className="px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-300 hover:text-white border border-white/[0.08] hover:border-white/20 transition-all"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            Fit
          </button>
        </div>

        {/* ── GROUP 3: Editing tools ── */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-white/[0.08]"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <button
            type="button"
            onClick={handleSplitClip}
            title="Split (S)"
            className="p-1.5 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/15 border border-white/[0.06] hover:border-cyan-400/30 transition-all"
          >
            <Scissors className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setSnapEnabled(!snapEnabled)}
            title="Snap"
            className={`p-1.5 rounded-lg border transition-all ${
              snapEnabled
                ? 'text-amber-300 bg-amber-500/15 border-amber-400/30'
                : 'text-slate-400 hover:text-white border-white/[0.06]'
            }`}
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>
          {onToggleTimelineHeight && (
            <button
              type="button"
              onClick={onToggleTimelineHeight}
              title="Toggle height"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white border border-white/[0.06] hover:border-white/20 transition-all"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ── GROUP 4: View options / Assemble CTA ── */}
        <div className="flex items-center gap-2">
          <select
            value={zoom}
            onChange={(e) => onZoomChange(parseInt(e.target.value, 10))}
            className="rounded-lg px-1.5 py-1 text-[10px] font-mono border border-white/[0.08] outline-none cursor-pointer"
            style={{ background: '#101214', color: '#00c2ff', borderColor: 'rgba(0,194,255,0.2)' }}
          >
            <option value="50">0.5x</option>
            <option value="100">1x</option>
            <option value="150">1.5x</option>
            <option value="200">2x</option>
            <option value="250">2.5x</option>
          </select>

          {onAssemble && (
            <button
              type="button"
              onClick={onAssemble}
              disabled={segments.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[11px] text-white transition-all active:scale-95 disabled:opacity-40 shrink-0 font-khmer"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                boxShadow: '0 0 14px rgba(245,158,11,0.35)',
                border: '1px solid rgba(245,158,11,0.3)',
              }}
              title="ដំឡើងវីដេអូ និងបញ្ចូលសំឡេង Dubbing"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>🎬 ដំឡើងវីដេអូ</span>
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MULTI-TRACK STAGE
      ══════════════════════════════════════════════════════ */}
      <div
        ref={scrollContainerRef}
        onWheel={handleTimelineWheel}
        className="flex-1 flex overflow-x-auto overflow-y-hidden relative scrollbar-thin"
        style={{ background: '#0d0f12' }}
      >

        {/* ── Left: Track Headers (sticky) ── */}
        <div
          className="shrink-0 sticky left-0 z-30 flex flex-col shadow-2xl"
          style={{ width: 168, background: '#131519', borderRight: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Ruler label row */}
          <div
            className="h-7 flex items-center px-3 justify-between text-[9.5px] font-bold text-slate-500 border-b border-white/[0.06]"
            style={{ background: '#0d0f12' }}
          >
            <span className="font-khmer">បន្ទាត់</span>
            <span className="font-mono tracking-widest">M·S·L</span>
          </div>

          {TRACK_CONFIGS.map((track, i) => (
            <div
              key={track.id}
              className="border-b border-white/[0.05] flex items-stretch relative group"
              style={{ height: 38, background: track.bg }}
            >
              {/* Coloured left-edge indicator */}
              <div
                className="w-[3px] shrink-0 rounded-r"
                style={{ background: track.color, boxShadow: `0 0 6px ${track.color}88` }}
              />

              {/* Track name + badge */}
              <div className="flex-1 flex items-center gap-1.5 px-2 min-w-0">
                <span
                  className="text-[9px] font-black px-1.5 py-0.5 rounded font-mono border shrink-0"
                  style={{
                    color: track.color,
                    background: `${track.color}20`,
                    borderColor: `${track.color}50`,
                  }}
                >
                  {track.id}
                </span>
                <span
                  className="text-[10.5px] font-semibold truncate font-khmer"
                  style={{ color: track.color + 'cc' }}
                >
                  {track.label}
                </span>
              </div>

              {/* Mute / Solo / Lock icons — vertical stack */}
              <div className="flex flex-col items-center justify-center gap-0.5 pr-2 shrink-0">
                {/* Mute */}
                <button
                  type="button"
                  onClick={() => toggleTrackMute(track.id)}
                  title="Mute"
                  className="p-0.5 rounded transition-colors"
                  style={{ color: mutedTracks[track.id] ? '#f87171' : '#64748b' }}
                >
                  {mutedTracks[track.id] ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
                </button>
                {/* Solo */}
                <button
                  type="button"
                  onClick={() => toggleTrackSolo(track.id)}
                  title="Solo"
                  className="p-0.5 rounded transition-colors text-[8px] font-black leading-none"
                  style={{ color: soloTracks[track.id] ? '#fbbf24' : '#475569' }}
                >
                  S
                </button>
                {/* Lock */}
                <button
                  type="button"
                  onClick={() => toggleTrackLock(track.id)}
                  title="Lock"
                  className="p-0.5 rounded transition-colors"
                  style={{ color: lockedTracks[track.id] ? '#fbbf24' : '#475569' }}
                >
                  {lockedTracks[track.id] ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Right: Ruler + Track Lanes ── */}
        <div
          ref={canvasRef}
          className="flex-1 flex flex-col relative"
          style={{
            minWidth: `${1600 * (zoom / 100)}px`,
            background: '#0d0f12',
          }}
        >

          {/* ── Timeline Ruler ── */}
          <div
            ref={rulerRef}
            onMouseDown={handleRulerMouseDown}
            className="h-7 relative cursor-ew-resize select-none overflow-hidden border-b border-white/[0.06]"
            style={{ background: '#0a0c0e' }}
          >
            {rulerTicks.map((tick, i) => {
              const pct = totalDur > 0 ? (tick.time / totalDur) * 100 : 0;
              const isMajor  = tick.type === 'major';
              const isMedium = tick.type === 'medium';
              return (
                <div
                  key={i}
                  className="absolute top-0 h-full pointer-events-none"
                  style={{ left: `${pct}%` }}
                >
                  {/* Tick line */}
                  <div
                    className="absolute bottom-0"
                    style={{
                      width: isMajor ? 1 : 1,
                      height: isMajor ? '65%' : isMedium ? '40%' : '25%',
                      background: isMajor
                        ? 'rgba(255,255,255,0.4)'
                        : isMedium
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(255,255,255,0.08)',
                    }}
                  />
                  {/* Alternating second bg flash for major ticks */}
                  {isMajor && (
                    <div
                      className="absolute top-0 h-full w-[1px]"
                      style={{ background: 'rgba(0,194,255,0.15)' }}
                    />
                  )}
                  {/* Label */}
                  {isMajor && (
                    <span
                      className="absolute top-1 left-1 font-mono text-[8.5px] font-bold select-none"
                      style={{ color: 'rgba(0,194,255,0.85)', whiteSpace: 'nowrap' }}
                    >
                      {tick.label}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Playhead diamond handle on ruler */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none z-40"
              style={{ left: `${playheadPercent}%` }}
            >
              {/* Diamond */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: -6,
                  width: 12,
                  height: 12,
                  background: '#ff5e2e',
                  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                  boxShadow: '0 0 8px #ff5e2e',
                }}
              />
            </div>
          </div>

          {/* ── Playhead vertical line (spans all lanes) ── */}
          <div
            className="absolute pointer-events-none z-40"
            style={{
              top: 28,                          // below ruler
              bottom: 0,
              left: `${playheadPercent}%`,
              width: 2,
              background: 'linear-gradient(180deg, #ff5e2e 0%, #ff8c00 60%, rgba(255,94,46,0) 100%)',
              boxShadow: '0 0 10px #ff5e2e, 0 0 24px rgba(255,94,46,0.35)',
              transform: 'translateX(-50%)',
            }}
          >
            {/* Timecode badge */}
            <div
              className="absolute font-mono font-black select-none"
              style={{
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#ff5e2e',
                color: '#fff',
                fontSize: 8.5,
                padding: '1px 5px',
                borderRadius: 4,
                whiteSpace: 'nowrap',
                boxShadow: '0 0 8px rgba(255,94,46,0.7)',
              }}
            >
              {formatTimecode(currentTime)}
            </div>
          </div>

          {/* ── Lane 1: V1 Video ── */}
          <div
            className="border-b border-white/[0.04] relative flex items-center overflow-hidden px-2"
            style={{ height: 38, background: '#141618' }}
          >
            {duration > 0 ? (
              <div
                className="h-7 rounded-lg flex items-center px-3 gap-2 overflow-hidden"
                style={{
                  width: `${Math.min(100, Math.max(10, (duration / totalDur) * 100))}%`,
                  background: 'linear-gradient(90deg, rgba(0,194,255,0.18) 0%, rgba(0,194,255,0.06) 100%)',
                  border: '1px solid rgba(0,194,255,0.3)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" style={{ boxShadow: '0 0 6px #00c2ff' }} />
                <span className="text-[10.5px] font-mono font-bold text-cyan-300 truncate">
                  Video Master [{formatTimecode(0)} – {formatTimecode(duration)}]
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-zinc-600 italic pl-2 font-khmer">
                គ្មានវីដេអូ — Upload វីដេអូដើម
              </span>
            )}
          </div>

          {/* ── Lane 2: A1 AI Dubbing (segments) ── */}
          <div
            className="border-b border-white/[0.04] relative flex items-center"
            style={{ height: 38, background: '#111315' }}
          >
            {segments.length === 0 ? (
              <span className="px-3 text-[10px] text-zinc-600 italic font-khmer">
                គ្មានឃ្លា — Upload វីដេអូ ឬបន្ថែមតួអង្គ
              </span>
            ) : (
              segments.map((seg, idx) => {
                const start     = seg.start_time ?? idx * 15;
                const end       = seg.end_time   ?? start + 8;
                const leftPct   = (start / totalDur) * 100;
                const widthPct  = Math.max(2, ((end - start) / totalDur) * 100);
                const isSelected = selectedSegmentIndex === idx;
                const isHovered  = hoveredSegment === idx;
                const [c1, c2]  = getCharColors(seg);

                return (
                  <div
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); onSelectSegment(idx); onSeek(start); }}
                    onMouseEnter={() => setHoveredSegment(idx)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    className="absolute flex flex-col justify-center cursor-grab active:cursor-grabbing overflow-hidden transition-all"
                    style={{
                      top: 3,
                      bottom: 3,
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      borderRadius: 6,
                      background: `linear-gradient(135deg, ${c1}cc 0%, ${c2}99 100%)`,
                      border: isSelected
                        ? `1.5px solid ${c1}`
                        : `1px solid ${c1}55`,
                      boxShadow: isSelected
                        ? `0 0 0 2px ${c1}55, 0 0 14px ${c1}44`
                        : isHovered
                        ? `0 0 8px ${c1}33`
                        : 'none',
                      zIndex: isSelected ? 20 : isHovered ? 15 : 10,
                    }}
                  >
                    {/* Waveform bars placeholder */}
                    <div className="absolute inset-0 flex items-center overflow-hidden">
                      <WaveformBars color={c1} count={Math.max(8, Math.round(widthPct * 0.6))} />
                    </div>

                    {/* Label overlay */}
                    <div
                      className="relative z-10 px-1.5 flex items-center gap-1"
                      style={{ pointerEvents: 'none' }}
                    >
                      <span className="text-[9px]" style={{ color: c1 }}>✦</span>
                      <span
                        className="text-[9.5px] font-bold truncate font-khmer"
                        style={{ color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
                      >
                        {seg.khmer_translation || seg.text || '(រង់ចាំ)'}
                      </span>
                    </div>

                    {/* Hover trim handles */}
                    {isHovered && (
                      <>
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize rounded-l"
                          style={{ background: `${c1}cc` }}
                        />
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize rounded-r"
                          style={{ background: `${c1}cc` }}
                        />
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* ── Lane 3: A2 Original Audio ── */}
          <div
            className="border-b border-white/[0.04] relative flex items-center px-2 overflow-hidden"
            style={{ height: 38, background: '#141618' }}
          >
            {duration > 0 ? (
              <div
                className="flex-1 h-7 rounded-lg flex items-center px-2 gap-2 overflow-hidden"
                style={{
                  background: 'linear-gradient(90deg, rgba(168,85,247,0.15) 0%, rgba(168,85,247,0.05) 100%)',
                  border: '1px solid rgba(168,85,247,0.25)',
                }}
              >
                <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0 animate-pulse" />
                <div className="flex-1 flex items-center overflow-hidden">
                  <WaveformBars color="#a855f7" count={60} />
                </div>
                <span className="text-[9px] text-purple-400 font-mono shrink-0">{formatTimecode(duration)}</span>
              </div>
            ) : (
              <span className="text-[10px] text-zinc-600 italic font-khmer">គ្មានសំឡេងដើម</span>
            )}
          </div>

          {/* ── Lane 4: B1 BGM ── */}
          <div
            className="border-b border-white/[0.04] relative flex items-center px-2"
            style={{ height: 38, background: '#111315' }}
          >
            <span className="text-[10px] text-zinc-600 italic font-khmer">
              គ្មានភ្លេងកំដរ BGM
            </span>
          </div>

          {/* ── Lane 5: S1 SFX ── */}
          <div
            className="border-b border-white/[0.04] relative flex items-center px-2"
            style={{ height: 38, background: '#141618' }}
          >
            <span className="text-[10px] text-zinc-600 italic font-khmer">
              គ្មានបែបផែនសំឡេង SFX
            </span>
          </div>

          {/* ── Lane 6: CC1 Subtitles ── */}
          <div
            className="border-b border-white/[0.04] relative flex items-center px-2"
            style={{ height: 38, background: '#111315' }}
          >
            <span className="text-[10px] text-zinc-600 italic font-khmer">
              គ្មានចំណងជើងរង CC
            </span>
          </div>

          {/* ── Lane 7: FX1 Visual Effects ── */}
          <div
            className="relative flex items-center px-2"
            style={{ height: 38, background: '#141618' }}
          >
            <span className="text-[10px] text-zinc-600 italic font-khmer">
              គ្មានបែបផែនរូបភាព FX
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          BOTTOM TAB BAR — pill-style switcher
      ══════════════════════════════════════════════════════ */}
      <div
        className="h-9 px-3 flex items-center justify-between shrink-0 border-t border-white/[0.06]"
        style={{ background: '#0f1115' }}
      >
        {/* Tab pills */}
        <div
          className="flex items-center gap-1 p-0.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {([
            { id: 'timeline',  label: 'បន្ទាត់ពេលវេលា' },
            { id: 'subtitle',  label: 'ចំណងជើងរង' },
            { id: 'mixer',     label: 'ឧបករណ៍លាយ' },
            { id: 'effects',   label: 'បែបផែន' },
          ] as const).map((tab) => {
            const isActive = activeTimelineTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTimelineTab?.(tab.id)}
                className="relative px-3 py-1 rounded-lg text-[11px] font-bold transition-all font-khmer"
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(0,194,255,0.25) 0%, rgba(0,194,255,0.12) 100%)'
                    : 'transparent',
                  color: isActive ? '#00e5ff' : '#64748b',
                  border: isActive ? '1px solid rgba(0,194,255,0.25)' : '1px solid transparent',
                  textShadow: isActive ? '0 0 10px rgba(0,229,255,0.5)' : 'none',
                }}
              >
                {tab.label}
                {/* Animated underline */}
                {isActive && (
                  <span
                    className="absolute bottom-0.5 left-3 right-3 rounded-full"
                    style={{
                      height: 2,
                      background: 'linear-gradient(90deg, #00c2ff, #00e5ff)',
                      boxShadow: '0 0 8px rgba(0,229,255,0.8)',
                      animation: 'tabSlideIn 0.25s ease',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right status info */}
        <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono">
          <span>{segments.length} ឃ្លា</span>
          <span>{formatTimecode(totalDur)}</span>
          <span className="text-[9px]">{Math.round(zoom)}%</span>
        </div>
      </div>

      {/* Keyframe animation for tab underline */}
      <style>{`
        @keyframes tabSlideIn {
          from { transform: scaleX(0); opacity: 0; }
          to   { transform: scaleX(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
