import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic2, AudioLines, Sparkles, Loader2, Play, Pause, Square,
  Plus, Trash2, ChevronDown, ChevronRight, Check, RefreshCw,
  ArrowDownToLine, Layers, Zap, FileText, Music2, Volume2,
  VolumeX, Headphones, BookOpen, AlignLeft, Clock, SkipBack,
  SkipForward, Settings2, Wand2, Radio, CircleDot, Download,
  ChevronLeft, Mic, StopCircle, PlayCircle, PauseCircle, X,
  GripVertical, Hash, Timer, Maximize2, Eye, EyeOff,
} from 'lucide-react';
import { CharacterVoice } from '../../types';
import { request } from '../../services/api';

/* ─────────────────────────── types ─────────────────────────── */
interface Chapter {
  id: string;
  title: string;
  collapsed: boolean;
  segments: Segment[];
}

interface Segment {
  id: string;
  text: string;
  audioUrl: string | null;
  status: 'idle' | 'queued' | 'generating' | 'done' | 'error';
  durationSec?: number;
  charCount?: number;
}

interface VoiceOverProProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface VoiceParams {
  speed: number;
  pitch: number;
  stability: number;
  clarity: number;
  style: number;
  pauseMs: number;
  bgmVolume: number;
  voiceVolume: number;
}

/* ─────────────────────────── helpers ─────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 10);
const fmtSec = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const wpm = 130; // avg Khmer narration words per minute
const estimateDuration = (text: string) =>
  Math.ceil((text.trim().split(/\s+/).filter(Boolean).length / wpm) * 60);

const SPEED_OPTS = [0.75, 0.9, 1.0, 1.1, 1.25, 1.4];
const BGM_TRACKS = [
  { id: 'none', label: 'None', url: '' },
  { id: 'calm', label: 'Calm Piano', url: '/media/bgm/calm_piano.mp3' },
  { id: 'epic', label: 'Epic Orchestral', url: '/media/bgm/epic_orchestral.mp3' },
  { id: 'nature', label: 'Nature Ambient', url: '/media/bgm/nature_ambient.mp3' },
  { id: 'cinematic', label: 'Cinematic Drama', url: '/media/bgm/cinematic_drama.mp3' },
];

function makeSegment(text = ''): Segment {
  return { id: uid(), text, audioUrl: null, status: 'idle', charCount: text.length };
}
function makeChapter(title = 'Chapter 1'): Chapter {
  return { id: uid(), title, collapsed: false, segments: [makeSegment()] };
}

/* ═══════════════════════════ component ═══════════════════════════ */
export const VoiceOverPro: React.FC<VoiceOverProProps> = ({ onShowToast }) => {
  /* voices */
  const [voices, setVoices] = useState<CharacterVoice[]>([]);
  const [voiceId, setVoiceId] = useState('');
  const [voicesLoading, setVoicesLoading] = useState(false);

  /* chapters */
  const [chapters, setChapters] = useState<Chapter[]>([makeChapter()]);

  /* voice params */
  const [vp, setVp] = useState<VoiceParams>({
    speed: 1.0, pitch: 0, stability: 78, clarity: 82, style: 10,
    pauseMs: 400, bgmVolume: 20, voiceVolume: 100,
  });

  /* BGM */
  const [bgmTrack, setBgmTrack] = useState('none');
  const bgmRef = useRef<HTMLAudioElement>(new Audio());

  /* playback */
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlayAll, setIsPlayAll] = useState(false);
  const queueRef = useRef<Segment[]>([]);
  const audioRef = useRef<HTMLAudioElement>(new Audio());

  /* generation */
  const [genQueue, setGenQueue] = useState<string[]>([]);
  const [activeGenId, setActiveGenId] = useState<string | null>(null);
  const [isBatchRunning, setIsBatchRunning] = useState(false);

  /* merge */
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  /* UI */
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [showBgmPanel, setShowBgmPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'script' | 'voice' | 'export'>('script');

  /* ── load voices ── */
  useEffect(() => {
    setVoicesLoading(true);
    request<{ characters: CharacterVoice[] }>('/api/characters')
      .then(d => {
        const list = d.characters || [];
        setVoices(list);
        if (list.length) setVoiceId(list[0].id);
      })
      .catch(() => onShowToast('❌ Cannot load voices', 'error'))
      .finally(() => setVoicesLoading(false));
  }, []);

  /* ── audio ended → play next ── */
  useEffect(() => {
    const audio = audioRef.current;
    const onEnded = () => {
      setPlayingId(null);
      if (isPlayAll && queueRef.current.length > 0) {
        const next = queueRef.current.shift()!;
        setTimeout(() => playSegment(next), vp.pauseMs);
      } else {
        setIsPlayAll(false);
      }
    };
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [isPlayAll, vp.pauseMs]);

  /* ── BGM volume sync ── */
  useEffect(() => {
    bgmRef.current.volume = vp.bgmVolume / 100;
  }, [vp.bgmVolume]);

  /* ── voice volume sync ── */
  useEffect(() => {
    audioRef.current.volume = vp.voiceVolume / 100;
  }, [vp.voiceVolume]);

  /* ─── helpers to mutate chapters ─── */
  const updateSegment = useCallback((segId: string, patch: Partial<Segment>) => {
    setChapters(prev => prev.map(ch => ({
      ...ch,
      segments: ch.segments.map(s => s.id === segId ? { ...s, ...patch } : s),
    })));
  }, []);

  const allSegments = (): Segment[] => chapters.flatMap(c => c.segments);

  /* ─── generate one segment ─── */
  const generateSeg = useCallback(async (segId: string) => {
    const seg = allSegments().find(s => s.id === segId);
    if (!seg || !seg.text.trim() || !voiceId) return;

    setActiveGenId(segId);
    updateSegment(segId, { status: 'generating' });
    try {
      const res = await request<{ audio_url?: string; url?: string; error?: string }>(
        '/api/tts/clone',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: seg.text.trim(),
            voice_id: voiceId,
            speed: vp.speed,
            pitch: vp.pitch,
            stability: vp.stability / 100,
            similarity_boost: vp.clarity / 100,
            style: vp.style / 100,
          }),
        }
      );
      const url = res.audio_url || res.url;
      if (!url) throw new Error(res.error || 'No audio returned');
      updateSegment(segId, { status: 'done', audioUrl: url, durationSec: estimateDuration(seg.text) });
    } catch (e: any) {
      updateSegment(segId, { status: 'error' });
      onShowToast(`❌ ${e.message}`, 'error');
    } finally {
      setActiveGenId(null);
    }
  }, [voiceId, vp, updateSegment]);

  /* ─── batch generate all pending ─── */
  const batchGenerate = async () => {
    if (!voiceId) { onShowToast('សូមជ្រើសសំឡេងជាមុន', 'error'); return; }
    const pending = allSegments().filter(s => s.text.trim() && s.status !== 'done');
    if (!pending.length) { onShowToast('មិនមានឃ្លាថ្មី', 'info'); return; }

    setIsBatchRunning(true);
    for (const s of pending) {
      updateSegment(s.id, { status: 'queued' });
    }
    for (const s of pending) {
      await generateSeg(s.id);
    }
    setIsBatchRunning(false);
    onShowToast('✅ Generate ទាំងអស់ជោគជ័យ!', 'success');
  };

  /* ─── playback ─── */
  const playSegment = (seg: Segment) => {
    if (!seg.audioUrl) return;
    audioRef.current.pause();
    audioRef.current.src = seg.audioUrl;
    audioRef.current.volume = vp.voiceVolume / 100;
    audioRef.current.play().catch(() => {});
    setPlayingId(seg.id);
  };

  const stopAll = () => {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setPlayingId(null);
    setIsPlayAll(false);
    queueRef.current = [];
  };

  const playAllFromStart = () => {
    const done = allSegments().filter(s => s.audioUrl);
    if (!done.length) { onShowToast('Generate audio ជាមុនសិន', 'info'); return; }
    queueRef.current = done.slice(1);
    setIsPlayAll(true);
    playSegment(done[0]);
    // start BGM
    if (bgmTrack !== 'none') {
      const track = BGM_TRACKS.find(t => t.id === bgmTrack);
      if (track?.url) {
        bgmRef.current.src = track.url;
        bgmRef.current.loop = true;
        bgmRef.current.volume = vp.bgmVolume / 100;
        bgmRef.current.play().catch(() => {});
      }
    }
  };

  /* ─── merge ─── */
  const mergeAll = async () => {
    const urls = allSegments().filter(s => s.audioUrl).map(s => s.audioUrl!);
    if (urls.length < 2) { onShowToast('ត្រូវការ 2 ឃ្លាឡើង', 'info'); return; }
    setIsMerging(true);
    try {
      const r = await request<{ url: string }>('/api/audio/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_urls: urls, pause_ms: vp.pauseMs }),
      });
      setMergedUrl(r.url);
      onShowToast('✅ Merge ជោគជ័យ!', 'success');
    } catch { onShowToast('❌ Merge ខុស', 'error'); }
    finally { setIsMerging(false); }
  };

  /* ─── import script ─── */
  const importScript = () => {
    if (!importText.trim()) return;
    const rawLines = importText.split(/\n\n+|\n(?=\n)/).map(p => p.replace(/\n/g, ' ').trim()).filter(Boolean);
    // Group every 3 paragraphs as a chapter
    const chunkSize = 4;
    const newChapters: Chapter[] = [];
    for (let i = 0; i < rawLines.length; i += chunkSize) {
      const chunk = rawLines.slice(i, i + chunkSize);
      newChapters.push({
        id: uid(),
        title: `Chapter ${newChapters.length + 1}`,
        collapsed: false,
        segments: chunk.map(t => makeSegment(t)),
      });
    }
    if (rawLines.length > 0 && rawLines.length <= chunkSize) {
      setChapters([{ id: uid(), title: 'Chapter 1', collapsed: false, segments: rawLines.map(makeSegment) }]);
    } else {
      setChapters(newChapters);
    }
    setImportText('');
    setShowImport(false);
    onShowToast(`✅ Import ${rawLines.length} segments into ${newChapters.length} chapters`, 'success');
  };

  /* ─── stats ─── */
  const segs = allSegments();
  const doneCount = segs.filter(s => s.status === 'done').length;
  const totalCount = segs.filter(s => s.text.trim()).length;
  const totalEstSec = segs.reduce((acc, s) => acc + (s.durationSec ?? (s.text ? estimateDuration(s.text) : 0)), 0);
  const progress = totalCount ? (doneCount / totalCount) * 100 : 0;
  const selectedVoice = voices.find(v => v.id === voiceId);

  /* ════════════════════════════ RENDER ════════════════════════════ */
  return (
    <div className="kdp flex flex-col h-full" style={{ background: '#0c0f1a' }}>

      {/* ══ CINEMATIC HEADER ══ */}
      <div className="shrink-0 relative overflow-hidden" style={{ height: 60 }}>
        {/* gradient backdrop */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, #08001a 0%, #0e0b28 40%, #08152b 70%, #050d1a 100%)' }} />
        <div className="absolute inset-0 opacity-20"
          style={{ background: 'radial-gradient(ellipse 600px 60px at 40% 50%, #8b5cf6 0%, transparent 70%)' }} />

        <div className="relative flex items-center gap-4 px-5 h-full">
          {/* logo badge */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 50%, #06b6d4 100%)' }}>
                <Mic2 size={17} className="text-slate-800 dark:text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-200 dark:border-[#0c0f1a]"
                style={{ background: doneCount > 0 ? '#22c55e' : '#f59e0b' }} />
            </div>
            <div>
              <div className="text-[14px] font-bold text-slate-800 dark:text-white tracking-wide">VoiceOver Pro</div>
              <div className="text-[9.5px] km" style={{ color: '#7c9bcc' }}>ស្ទូឌីយោណារ៉ែតតឺរ · Single Voice Clone</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="kdp-badge kdp-badge-violet"><Sparkles size={8} /> PRO</span>
            <span className="kdp-badge" style={{ color: '#a78bfa', borderColor: 'rgba(139,92,246,.35)', background: 'rgba(139,92,246,.1)' }}>
              SINGLE VOICE
            </span>
          </div>

          {/* global stats */}
          <div className="hidden md:flex items-center gap-4 ml-2">
            <StatPill icon={<Hash size={10} />} label="Segments" value={`${doneCount}/${totalCount}`} />
            <StatPill icon={<Timer size={10} />} label="Est. Duration" value={fmtSec(totalEstSec)} />
            <StatPill icon={<BookOpen size={10} />} label="Chapters" value={String(chapters.length)} />
          </div>

          {/* progress bar */}
          {totalCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-32 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(100,180,255,.1)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#7c3aed,#06b6d4)' }} />
              </div>
              <span className="text-[10px] mono" style={{ color: '#7c9bcc' }}>{Math.round(progress)}%</span>
            </div>
          )}

          <div className="flex-1" />

          {/* header actions */}
          <button className="kdp-btn kdp-btn-sm kdp-btn-ghost" onClick={() => setShowImport(v => !v)}>
            <FileText size={13} /> Import
          </button>
          <button
            disabled={isBatchRunning || !voiceId}
            onClick={batchGenerate}
            className={`kdp-btn kdp-btn-sm kdp-btn-ai ${isBatchRunning ? 'opacity-60 pointer-events-none' : ''}`}
          >
            {isBatchRunning ? <Loader2 size={13} className="kdp-spin" /> : <Zap size={13} />}
            {isBatchRunning ? 'Generating...' : 'Generate All'}
          </button>
          <button
            className="kdp-btn kdp-btn-sm kdp-btn-primary"
            disabled={!segs.some(s => s.audioUrl)}
            onClick={isPlayAll ? stopAll : playAllFromStart}
          >
            {isPlayAll ? <StopCircle size={13} /> : <PlayCircle size={13} />}
            {isPlayAll ? 'Stop' : 'Play All'}
          </button>
          {doneCount >= 2 && (
            <button
              className="kdp-btn kdp-btn-sm"
              style={{ color: '#86efac', borderColor: 'rgba(34,197,94,.4)', background: 'rgba(34,197,94,.06)' }}
              onClick={mergeAll} disabled={isMerging}
            >
              {isMerging ? <Loader2 size={13} className="kdp-spin" /> : <Layers size={13} />}
              Merge
            </button>
          )}
        </div>
      </div>

      {/* ══ IMPORT PANEL ══ */}
      {showImport && (
        <div className="shrink-0 border-b border-[var(--kdp-border)] p-4 kdp-fade-in"
          style={{ background: 'rgba(10,15,35,.9)', backdropFilter: 'blur(10px)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12.5px] font-semibold" style={{ color: '#a78bfa' }}>
              <AlignLeft size={13} className="inline mr-1.5" /> Import Script · បញ្ចូល Script
            </span>
            <button className="kdp-btn kdp-btn-xs kdp-btn-ghost" onClick={() => setShowImport(false)}><X size={11} /></button>
          </div>
          <textarea
            className="kdp-textarea km w-full text-[12.5px]"
            rows={7}
            placeholder={"Paste your narration script here...\nប្រើ Enter 2 ដង ដើម្បីបំបែក Segment\nប្រើ Enter 4 ដង ដើម្បីបំបែក Chapter"}
            value={importText}
            onChange={e => setImportText(e.target.value)}
            style={{ background: 'rgba(3,6,18,.7)', lineHeight: 1.9 }}
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px]" style={{ color: '#7c9bcc' }}>
              {importText.split(/\n\n+/).filter(Boolean).length} segments detected
            </span>
            <div className="flex gap-2">
              <button className="kdp-btn kdp-btn-sm kdp-btn-ghost" onClick={() => setImportText('')}>Clear</button>
              <button className="kdp-btn kdp-btn-sm kdp-btn-primary" onClick={importScript}>
                <Plus size={12} /> Import Script
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MAIN LAYOUT ══ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT PANEL: Voice + Settings ── */}
        <div className="shrink-0 flex flex-col border-r border-[var(--kdp-border)] overflow-y-auto"
          style={{ width: showSettings ? 256 : 0, minWidth: showSettings ? 256 : 0, transition: 'all .2s', overflow: showSettings ? 'auto' : 'hidden' }}>
          {showSettings && (
            <div className="flex flex-col gap-0 h-full">
              {/* tab selector */}
              <div className="flex border-b border-[var(--kdp-border)] shrink-0">
                {(['voice', 'export'] as const).map(t => (
                  <button key={t}
                    onClick={() => setActiveTab(t)}
                    className={`flex-1 py-2 text-[11px] font-medium capitalize transition-all border-b-2
                      ${activeTab === t ? 'text-[var(--kdp-cyan)] border-[var(--kdp-cyan)]' : 'text-[var(--kdp-text-3)] border-transparent hover:text-[var(--kdp-text-2)]'}`}
                  >{t === 'voice' ? '🎙 Voice' : '📤 Export'}</button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">

                {activeTab === 'voice' && (
                  <>
                    {/* Voice Picker */}
                    <SectionCard title="Clone Voice · សំឡេង">
                      {voicesLoading ? (
                        <div className="flex items-center gap-2 text-[11px] text-[var(--kdp-text-3)] py-2">
                          <Loader2 size={12} className="kdp-spin" /> Loading voices...
                        </div>
                      ) : voices.length === 0 ? (
                        <p className="text-[10.5px] text-[var(--kdp-text-3)] leading-relaxed">
                          No voices found. Add a Voice Clone in Voice Library first.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-1 max-h-44 overflow-y-auto pr-0.5">
                          {voices.map(v => (
                            <VoiceOption key={v.id} voice={v} selected={voiceId === v.id} onSelect={() => setVoiceId(v.id)} />
                          ))}
                        </div>
                      )}
                      {selectedVoice && (
                        <div className="mt-2 pt-2 border-t border-[var(--kdp-border)] flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                            style={{ background: selectedVoice.gender === 'female' ? 'rgba(236,72,153,.25)' : 'rgba(59,130,246,.25)', color: selectedVoice.gender === 'female' ? '#f9a8d4' : '#93c5fd' }}>
                            {selectedVoice.label[0]}
                          </div>
                          <span className="text-[11px] text-[var(--kdp-text-2)] flex-1 truncate">{selectedVoice.label}</span>
                          <span className="kdp-badge kdp-badge-cyan" style={{ fontSize: 8 }}>Active</span>
                        </div>
                      )}
                    </SectionCard>

                    {/* Speed */}
                    <SectionCard title="Speed · ល្បឿន">
                      <div className="flex gap-1 flex-wrap">
                        {SPEED_OPTS.map(s => (
                          <button key={s} onClick={() => setVp(p => ({ ...p, speed: s }))}
                            className={`h-6 px-2 rounded text-[10px] font-mono border transition-all
                              ${vp.speed === s ? 'bg-[rgba(34,211,238,.18)] border-[rgba(34,211,238,.5)] text-[var(--kdp-cyan)]'
                              : 'border-[var(--kdp-border)] text-[var(--kdp-text-3)] hover:border-[var(--kdp-border-strong)]'}`}
                          >{s}x</button>
                        ))}
                      </div>
                    </SectionCard>

                    {/* Pitch */}
                    <SectionCard title={`Pitch · សំឡេង  ${vp.pitch > 0 ? '+' : ''}${vp.pitch}`}>
                      <input type="range" className="kdp-range" min={-4} max={4} step={1} value={vp.pitch}
                        style={{ '--pct': `${((vp.pitch + 4) / 8) * 100}%` } as any}
                        onChange={e => setVp(p => ({ ...p, pitch: +e.target.value }))} />
                      <div className="flex justify-between text-[9px] text-[var(--kdp-text-3)] mt-0.5"><span>Low</span><span>Normal</span><span>High</span></div>
                    </SectionCard>

                    {/* Stability */}
                    <SectionCard title={`Stability  ${vp.stability}%`}>
                      <input type="range" className="kdp-range" min={0} max={100} value={vp.stability}
                        style={{ '--pct': `${vp.stability}%` } as any}
                        onChange={e => setVp(p => ({ ...p, stability: +e.target.value }))} />
                    </SectionCard>

                    {/* Clarity */}
                    <SectionCard title={`Clarity / Boost  ${vp.clarity}%`}>
                      <input type="range" className="kdp-range" min={0} max={100} value={vp.clarity}
                        style={{ '--pct': `${vp.clarity}%` } as any}
                        onChange={e => setVp(p => ({ ...p, clarity: +e.target.value }))} />
                    </SectionCard>

                    {/* Style */}
                    <SectionCard title={`Style Exaggeration  ${vp.style}%`}>
                      <input type="range" className="kdp-range" min={0} max={100} value={vp.style}
                        style={{ '--pct': `${vp.style}%` } as any}
                        onChange={e => setVp(p => ({ ...p, style: +e.target.value }))} />
                    </SectionCard>

                    {/* Pause + Volume */}
                    <SectionCard title="Timing & Volume">
                      <div className="flex flex-col gap-2">
                        <div>
                          <div className="flex justify-between mb-1"><label className="kdp-label mb-0">Pause Between</label><span className="mono text-[10px] text-[var(--kdp-cyan)]">{vp.pauseMs}ms</span></div>
                          <input type="range" className="kdp-range" min={0} max={2000} step={100} value={vp.pauseMs}
                            style={{ '--pct': `${(vp.pauseMs / 2000) * 100}%` } as any}
                            onChange={e => setVp(p => ({ ...p, pauseMs: +e.target.value }))} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1"><label className="kdp-label mb-0">Voice Volume</label><span className="mono text-[10px] text-[var(--kdp-cyan)]">{vp.voiceVolume}%</span></div>
                          <input type="range" className="kdp-range" min={10} max={100} value={vp.voiceVolume}
                            style={{ '--pct': `${vp.voiceVolume}%` } as any}
                            onChange={e => setVp(p => ({ ...p, voiceVolume: +e.target.value }))} />
                        </div>
                      </div>
                    </SectionCard>

                    {/* BGM */}
                    <SectionCard title="Background Music · ភ្លេងបន្ទប់">
                      <div className="flex flex-col gap-1 mb-2">
                        {BGM_TRACKS.map(t => (
                          <button key={t.id} onClick={() => setBgmTrack(t.id)}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-left text-[11px] transition-all
                              ${bgmTrack === t.id ? 'border-[rgba(139,92,246,.5)] bg-[rgba(139,92,246,.1)] text-[var(--kdp-text)]'
                              : 'border-[var(--kdp-border)] text-[var(--kdp-text-2)] hover:border-[var(--kdp-border-strong)]'}`}
                          >
                            <Music2 size={11} className={bgmTrack === t.id ? 'text-[#a78bfa]' : 'text-[var(--kdp-text-3)]'} />
                            {t.label}
                            {bgmTrack === t.id && <Check size={10} className="ml-auto text-[#a78bfa]" />}
                          </button>
                        ))}
                      </div>
                      {bgmTrack !== 'none' && (
                        <div>
                          <div className="flex justify-between mb-1"><label className="kdp-label mb-0">BGM Volume</label><span className="mono text-[10px]" style={{ color: '#a78bfa' }}>{vp.bgmVolume}%</span></div>
                          <input type="range" className="kdp-range" min={0} max={80} value={vp.bgmVolume}
                            style={{ '--pct': `${(vp.bgmVolume / 80) * 100}%` } as any}
                            onChange={e => setVp(p => ({ ...p, bgmVolume: +e.target.value }))} />
                        </div>
                      )}
                    </SectionCard>
                  </>
                )}

                {activeTab === 'export' && (
                  <>
                    <SectionCard title="Merged Audio Output">
                      {mergedUrl ? (
                        <div className="flex flex-col gap-2">
                          <audio controls src={mergedUrl} className="w-full"
                            style={{ height: 32, filter: 'invert(.85) hue-rotate(180deg)' }} />
                          <a href={mergedUrl} download="voiceover_final.mp3"
                            className="kdp-btn kdp-btn-sm w-full justify-center"
                            style={{ color: '#86efac', borderColor: 'rgba(34,197,94,.4)', background: 'rgba(34,197,94,.06)' }}>
                            <ArrowDownToLine size={12} /> Download Final Audio
                          </a>
                        </div>
                      ) : (
                        <div className="text-center py-6 flex flex-col items-center gap-2">
                          <Layers size={28} className="text-[var(--kdp-text-3)] opacity-40" />
                          <p className="text-[10.5px] text-[var(--kdp-text-3)]">No merged audio yet.<br />Generate segments then click Merge.</p>
                          <button
                            className="kdp-btn kdp-btn-sm kdp-btn-primary mt-1"
                            onClick={mergeAll} disabled={doneCount < 2 || isMerging}
                          >
                            {isMerging ? <Loader2 size={12} className="kdp-spin" /> : <Layers size={12} />}
                            Merge All ({doneCount} segments)
                          </button>
                        </div>
                      )}
                    </SectionCard>

                    <SectionCard title="Individual Downloads">
                      <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                        {segs.filter(s => s.audioUrl).map((s, i) => (
                          <a key={s.id} href={s.audioUrl!} download={`segment_${i + 1}.mp3`}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-[var(--kdp-border)] text-[11px] text-[var(--kdp-text-2)] hover:border-[var(--kdp-border-strong)] hover:text-[var(--kdp-text)] transition-all">
                            <ArrowDownToLine size={10} className="text-[var(--kdp-cyan)]" />
                            <span className="flex-1 truncate km">{s.text.slice(0, 30)}...</span>
                            <span className="mono text-[9px] text-[var(--kdp-text-3)]">#{i + 1}</span>
                          </a>
                        ))}
                        {!segs.some(s => s.audioUrl) && (
                          <p className="text-[10.5px] text-[var(--kdp-text-3)] text-center py-3">No audio generated yet</p>
                        )}
                      </div>
                    </SectionCard>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* collapse toggle */}
        <button onClick={() => setShowSettings(v => !v)}
          className="shrink-0 w-4 flex items-center justify-center border-r border-[var(--kdp-border)] text-[var(--kdp-text-3)] hover:text-[var(--kdp-cyan)] transition-colors"
          style={{ background: 'rgba(8,12,25,.4)' }}>
          {showSettings ? <ChevronLeft size={11} /> : <ChevronRight size={11} />}
        </button>

        {/* ── RIGHT: Chapter + Segments ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* toolbar */}
          <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-[var(--kdp-border)]"
            style={{ background: 'rgba(8,12,25,.5)' }}>
            <BookOpen size={13} style={{ color: '#7c9bcc' }} />
            <span className="text-[11px]" style={{ color: '#7c9bcc' }}>{chapters.length} chapters · {segs.length} segments</span>
            <div className="flex-1" />
            {playingId && (
              <button className="kdp-btn kdp-btn-xs" style={{ color: '#fca5a5', borderColor: 'rgba(239,68,68,.35)' }} onClick={stopAll}>
                <StopCircle size={11} /> Stop
              </button>
            )}
            <button className="kdp-btn kdp-btn-xs kdp-btn-ghost"
              onClick={() => setChapters(p => p.map(c => ({ ...c, segments: c.segments.map(s => ({ ...s, audioUrl: null, status: 'idle' as const })) })))}>
              <RefreshCw size={10} /> Reset Audio
            </button>
            <button className="kdp-btn kdp-btn-xs kdp-btn-primary"
              onClick={() => setChapters(p => [...p, makeChapter(`Chapter ${p.length + 1}`)])}>
              <Plus size={11} /> Chapter
            </button>
          </div>

          {/* chapters list */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
            {chapters.map((ch, ci) => (
              <ChapterBlock
                key={ch.id}
                chapter={ch}
                chapterIndex={ci}
                playingId={playingId}
                activeGenId={activeGenId}
                isBatchRunning={isBatchRunning}
                voiceId={voiceId}
                onCollapseToggle={() => setChapters(p => p.map(c => c.id === ch.id ? { ...c, collapsed: !c.collapsed } : c))}
                onRenameChapter={(title) => setChapters(p => p.map(c => c.id === ch.id ? { ...c, title } : c))}
                onDeleteChapter={() => {
                  if (chapters.length === 1) return;
                  setChapters(p => p.filter(c => c.id !== ch.id));
                }}
                onAddSegment={() => setChapters(p => p.map(c => c.id === ch.id ? { ...c, segments: [...c.segments, makeSegment()] } : c))}
                onUpdateSegment={(segId, patch) => updateSegment(segId, patch)}
                onDeleteSegment={(segId) => {
                  setChapters(p => p.map(c => c.id === ch.id
                    ? { ...c, segments: c.segments.length > 1 ? c.segments.filter(s => s.id !== segId) : c.segments }
                    : c));
                }}
                onGenerate={(segId) => generateSeg(segId)}
                onPlay={(seg) => {
                  if (playingId === seg.id) stopAll();
                  else playSegment(seg);
                }}
              />
            ))}

            {/* add chapter CTA */}
            <button
              onClick={() => setChapters(p => [...p, makeChapter(`Chapter ${p.length + 1}`)])}
              className="w-full rounded-xl border border-dashed py-4 text-[11px] transition-all"
              style={{ borderColor: 'rgba(139,92,246,.25)', color: '#7c9bcc' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,.5)'; (e.currentTarget as HTMLElement).style.color = '#a78bfa'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,.25)'; (e.currentTarget as HTMLElement).style.color = '#7c9bcc'; }}
            >
              <Plus size={13} className="inline mr-1.5" /> Add Chapter · បន្ថែមជំពូក
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════ SUB-COMPONENTS ══════════════════ */

/* StatPill */
const StatPill: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 border border-[var(--kdp-border)]"
    style={{ background: 'rgba(12,20,40,.6)' }}>
    <span style={{ color: '#7c9bcc' }}>{icon}</span>
    <span className="text-[9.5px] text-[var(--kdp-text-3)]">{label}</span>
    <span className="mono text-[11px] font-semibold text-[var(--kdp-text)]">{value}</span>
  </div>
);

/* SectionCard */
const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-xl border border-[var(--kdp-border)] overflow-hidden"
    style={{ background: 'rgba(8,12,28,.7)' }}>
    <div className="px-3 py-2 border-b border-[var(--kdp-border)]"
      style={{ background: 'rgba(12,20,45,.5)' }}>
      <span className="kdp-section-title">{title}</span>
    </div>
    <div className="p-3">{children}</div>
  </div>
);

/* VoiceOption */
const VoiceOption: React.FC<{ voice: CharacterVoice; selected: boolean; onSelect: () => void }> = ({ voice, selected, onSelect }) => (
  <button onClick={onSelect}
    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg border w-full text-left transition-all
      ${selected
        ? 'border-[rgba(139,92,246,.55)] bg-[rgba(139,92,246,.12)] text-[var(--kdp-text)]'
        : 'border-[var(--kdp-border)] text-[var(--kdp-text-2)] hover:border-[var(--kdp-border-strong)] hover:bg-[rgba(100,180,255,.04)]'}`}>
    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-[11px]
      ${voice.gender === 'female' ? 'bg-[rgba(236,72,153,.2)] text-[#f9a8d4]' : 'bg-[rgba(59,130,246,.2)] text-[#93c5fd]'}`}>
      {voice.label.charAt(0).toUpperCase()}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[11.5px] font-medium truncate">{voice.label}</div>
      <div className="text-[9.5px] text-[var(--kdp-text-3)] capitalize">{voice.gender}</div>
    </div>
    {selected && <Check size={12} style={{ color: '#a78bfa' }} className="shrink-0" />}
  </button>
);

/* ChapterBlock */
interface ChapterBlockProps {
  chapter: Chapter;
  chapterIndex: number;
  playingId: string | null;
  activeGenId: string | null;
  isBatchRunning: boolean;
  voiceId: string;
  onCollapseToggle: () => void;
  onRenameChapter: (t: string) => void;
  onDeleteChapter: () => void;
  onAddSegment: () => void;
  onUpdateSegment: (id: string, patch: Partial<Segment>) => void;
  onDeleteSegment: (id: string) => void;
  onGenerate: (id: string) => void;
  onPlay: (seg: Segment) => void;
}

const ChapterBlock: React.FC<ChapterBlockProps> = ({
  chapter, chapterIndex, playingId, activeGenId, isBatchRunning, voiceId,
  onCollapseToggle, onRenameChapter, onDeleteChapter, onAddSegment,
  onUpdateSegment, onDeleteSegment, onGenerate, onPlay,
}) => {
  const [editing, setEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(chapter.title);
  const doneSegs = chapter.segments.filter(s => s.status === 'done').length;
  const totalSegsWithText = chapter.segments.filter(s => s.text.trim()).length;

  return (
    <div className="rounded-2xl border border-[var(--kdp-border)] overflow-hidden kdp-fade-in"
      style={{ background: 'rgba(10,15,30,.6)' }}>
      {/* chapter header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--kdp-border)]"
        style={{ background: 'linear-gradient(90deg, rgba(139,92,246,.08) 0%, rgba(6,182,212,.05) 100%)' }}>
        <button onClick={onCollapseToggle} className="text-[var(--kdp-text-3)] hover:text-[var(--kdp-cyan)] transition-colors">
          {chapter.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
        <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold mono shrink-0"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#0891b2)', color: '#fff' }}>
          {chapterIndex + 1}
        </div>
        {editing ? (
          <input
            autoFocus className="flex-1 bg-transparent border-none outline-none text-[12.5px] font-semibold text-[var(--kdp-text)]"
            value={titleInput}
            onChange={e => setTitleInput(e.target.value)}
            onBlur={() => { onRenameChapter(titleInput); setEditing(false); }}
            onKeyDown={e => { if (e.key === 'Enter') { onRenameChapter(titleInput); setEditing(false); } }}
          />
        ) : (
          <span className="flex-1 text-[12.5px] font-semibold text-[var(--kdp-text)] cursor-pointer select-none"
            onDoubleClick={() => setEditing(true)}>
            {chapter.title}
          </span>
        )}
        <span className="text-[10px] mono" style={{ color: '#7c9bcc' }}>{doneSegs}/{totalSegsWithText}</span>

        {/* chapter progress */}
        {totalSegsWithText > 0 && (
          <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(100,180,255,.1)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(doneSegs / totalSegsWithText) * 100}%`, background: 'linear-gradient(90deg,#7c3aed,#06b6d4)' }} />
          </div>
        )}
        <button className="kdp-btn kdp-btn-xs kdp-btn-ghost" onClick={onAddSegment}>
          <Plus size={10} />
        </button>
        <button className="kdp-btn kdp-btn-xs kdp-btn-ghost" onClick={onDeleteChapter}
          style={{ color: 'var(--kdp-text-3)' }}>
          <Trash2 size={10} />
        </button>
      </div>

      {/* segments */}
      {!chapter.collapsed && (
        <div className="p-3 flex flex-col gap-2">
          {chapter.segments.map((seg, si) => (
            <SegmentCard
              key={seg.id}
              seg={seg}
              index={si}
              isPlaying={playingId === seg.id}
              isGenerating={activeGenId === seg.id}
              disabled={isBatchRunning || !voiceId}
              onTextChange={(text) => onUpdateSegment(seg.id, { text, status: 'idle', audioUrl: null })}
              onGenerate={() => onGenerate(seg.id)}
              onPlay={() => onPlay(seg)}
              onDelete={() => onDeleteSegment(seg.id)}
            />
          ))}

          {/* add segment */}
          <button onClick={onAddSegment}
            className="w-full rounded-lg border border-dashed py-2 text-[10.5px] transition-all"
            style={{ borderColor: 'rgba(100,180,255,.18)', color: '#7c9bcc' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(34,211,238,.35)'; (e.currentTarget as HTMLElement).style.color = 'var(--kdp-cyan)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(100,180,255,.18)'; (e.currentTarget as HTMLElement).style.color = '#7c9bcc'; }}>
            <Plus size={11} className="inline mr-1" /> Add Segment
          </button>
        </div>
      )}
    </div>
  );
};

/* SegmentCard */
interface SegmentCardProps {
  seg: Segment;
  index: number;
  isPlaying: boolean;
  isGenerating: boolean;
  disabled: boolean;
  onTextChange: (text: string) => void;
  onGenerate: () => void;
  onPlay: () => void;
  onDelete: () => void;
}

const SegmentCard: React.FC<SegmentCardProps> = ({
  seg, index, isPlaying, isGenerating, disabled,
  onTextChange, onGenerate, onPlay, onDelete,
}) => {
  const taRef = useRef<HTMLTextAreaElement>(null);

  const borderColor = {
    idle: 'var(--kdp-border)',
    queued: 'rgba(139,92,246,.3)',
    generating: 'rgba(139,92,246,.55)',
    done: isPlaying ? 'rgba(6,182,212,.8)' : 'rgba(6,182,212,.28)',
    error: 'rgba(239,68,68,.45)',
  }[seg.status];

  const bgColor = {
    idle: 'rgba(8,12,26,.5)',
    queued: 'rgba(139,92,246,.06)',
    generating: 'rgba(139,92,246,.1)',
    done: isPlaying ? 'rgba(6,182,212,.1)' : 'rgba(6,182,212,.05)',
    error: 'rgba(239,68,68,.08)',
  }[seg.status];

  return (
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden
      ${isPlaying ? 'shadow-[0_0_20px_rgba(6,182,212,.2)]' : ''}`}
      style={{ borderColor, background: bgColor }}>

      {/* animated generating bar */}
      {seg.status === 'generating' && (
        <div className="h-0.5 kdp-shimmer" style={{ background: 'linear-gradient(90deg, transparent, #7c3aed, #06b6d4, transparent)' }} />
      )}

      <div className="flex items-start gap-2.5 p-3">
        {/* index pill */}
        <div className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[9.5px] mono font-bold mt-0.5 select-none"
          style={{
            background: seg.status === 'done' ? 'rgba(6,182,212,.2)' : 'rgba(100,180,255,.08)',
            color: seg.status === 'done' ? '#67e8f9' : 'var(--kdp-text-3)',
          }}>
          {index + 1}
        </div>

        {/* textarea */}
        <textarea
          ref={taRef}
          className="flex-1 bg-transparent border-none outline-none resize-none text-[12.5px] km leading-loose"
          style={{ minHeight: 48, color: 'var(--kdp-text)', lineHeight: 1.85 }}
          rows={2}
          placeholder={`ឃ្លា / Segment ${index + 1}...`}
          value={seg.text}
          onChange={e => {
            onTextChange(e.target.value);
            const el = e.target as HTMLTextAreaElement;
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
          }}
        />

        {/* status */}
        <div className="shrink-0 flex flex-col items-end gap-1 mt-0.5">
          {seg.status === 'done' && <span className="kdp-badge" style={{ color: '#67e8f9', borderColor: 'rgba(6,182,212,.35)', background: 'rgba(6,182,212,.1)', fontSize: 8 }}><Check size={8} /> Done</span>}
          {(seg.status === 'generating' || isGenerating) && <span className="kdp-badge kdp-badge-violet" style={{ fontSize: 8 }}><Loader2 size={8} className="kdp-spin" /> Gen</span>}
          {seg.status === 'queued' && <span className="kdp-badge kdp-badge-muted" style={{ fontSize: 8 }}>Queued</span>}
          {seg.status === 'error' && <span className="kdp-badge kdp-badge-red" style={{ fontSize: 8 }}>Error</span>}
          {seg.text && <span className="text-[8.5px] mono" style={{ color: '#4a6a8a' }}>{seg.text.length}c</span>}
        </div>
      </div>

      {/* audio bar + actions */}
      <div className="flex items-center gap-2 px-3 pb-3">
        {seg.audioUrl ? (
          <div className="flex-1 flex items-center gap-2 rounded-lg px-2.5 py-1.5 border border-[var(--kdp-border)]"
            style={{ background: 'rgba(4,8,20,.7)' }}>
            {/* waveform bars */}
            <div className="flex items-center gap-[2px] h-5">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i}
                  className={`w-[2px] rounded-full transition-all`}
                  style={{
                    height: isPlaying ? `${8 + Math.sin(i * 0.8 + Date.now() / 200) * 7}px` : `${3 + Math.sin(i * 0.6) * 5}px`,
                    background: isPlaying
                      ? `hsl(${180 + i * 5}, 80%, 60%)`
                      : 'rgba(100,180,255,.3)',
                    transition: isPlaying ? 'height .08s ease' : 'none',
                    animation: isPlaying ? `waveBar${i % 4} .${4 + i % 3}s ease-in-out infinite` : 'none',
                  }}
                />
              ))}
            </div>

            {/* play btn */}
            <button onClick={onPlay}
              className="w-6 h-6 rounded-full flex items-center justify-center ml-1 transition-all shrink-0"
              style={{ background: isPlaying ? 'rgba(239,68,68,.2)' : 'rgba(6,182,212,.18)', color: isPlaying ? '#fca5a5' : '#67e8f9' }}>
              {isPlaying ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
            </button>

            <div className="flex-1" />

            {/* download */}
            <a href={seg.audioUrl} download={`segment_${index + 1}.mp3`}
              className="text-[var(--kdp-text-3)] hover:text-[var(--kdp-cyan)] transition-colors"
              onClick={e => e.stopPropagation()}>
              <ArrowDownToLine size={11} />
            </a>
          </div>
        ) : (
          <div className="flex-1 rounded-lg border border-dashed py-1.5 flex items-center justify-center"
            style={{ borderColor: 'rgba(100,180,255,.12)' }}>
            <span className="text-[9.5px]" style={{ color: '#4a6a8a' }}>No audio · Click Generate</span>
          </div>
        )}

        {/* action buttons */}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onGenerate}
            disabled={disabled || isGenerating || !seg.text.trim()}
            title={seg.status === 'done' ? 'Re-generate' : 'Generate voice'}
            className={`kdp-btn kdp-btn-xs transition-all
              ${seg.status === 'done' ? 'kdp-btn-ghost' : 'kdp-btn-primary'}`}
            style={seg.status === 'done' ? { color: '#67e8f9', borderColor: 'rgba(6,182,212,.3)' } : {}}>
            {isGenerating
              ? <Loader2 size={10} className="kdp-spin" />
              : seg.status === 'done'
                ? <RefreshCw size={10} />
                : <Mic size={10} />
            }
          </button>
          <button onClick={onDelete} className="kdp-btn kdp-btn-xs kdp-btn-ghost"
            style={{ color: 'var(--kdp-text-3)' }} title="Delete">
            <Trash2 size={10} />
          </button>
        </div>
      </div>
    </div>
  );
};
