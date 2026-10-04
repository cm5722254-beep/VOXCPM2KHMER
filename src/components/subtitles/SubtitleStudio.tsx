import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Subtitles,
  Download,
  Film,
  Search,
  Mic,
  Play,
  Pause,
  Loader2,
  CheckCircle,
  Copy,
  Sparkles,
  X,
  ChevronDown,
  Zap,
  Volume2,
  AlertCircle,
  Clock,
  Hash,
} from 'lucide-react';
import { TimelineSegment, CharacterVoice } from '../../types';
import { CURATED_CHARACTER_VOICES } from '../../constants/characterVoices';
import { api } from '../../services/api';

interface SubtitleProps {
  segments: TimelineSegment[];
  characters?: CharacterVoice[];
  onUpdateSegment: (index: number, updated: Partial<TimelineSegment>) => void;
  onOpenExportModal: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onGenerateCustomVideo?: () => void;
  isGenerating?: boolean;
}

function formatTimecode(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  const pad = (n: number, len = 2) => n.toString().padStart(len, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

function formatDuration(start: number, end: number): string {
  const dur = Math.max(0, end - start);
  if (dur < 1) return `${Math.round(dur * 1000)}ms`;
  return `${dur.toFixed(1)}s`;
}

// Spoken Khmer emotion ending particles
const KHMER_SPOKEN_PARTICLES = ['ណា', 'ណ៎', 'ហ្មង', 'តើ', 'អញ្ចឹង', 'វើយ', 'ហាស', 'ចា៎', 'ចុះ'];

// Gender avatar emoji
function getCharacterAvatar(char: CharacterVoice): string {
  return char.gender === 'female' ? '🌸' : '👑';
}

// Derive per-segment status
type SegmentStatus = 'empty' | 'translated' | 'synthesized' | 'error';
function getSegmentStatus(seg: TimelineSegment): SegmentStatus {
  if (seg.audioUrl) return 'synthesized';
  if (seg.khmer_translation && seg.khmer_translation.trim().length > 0) return 'translated';
  return 'empty';
}

const STATUS_DOT: Record<SegmentStatus, { bg: string; label: string }> = {
  empty:      { bg: 'bg-slate-600',   label: 'ទទេ' },
  translated: { bg: 'bg-amber-400',   label: 'បានបកប្រែ' },
  synthesized:{ bg: 'bg-emerald-400', label: 'មានសំឡេង' },
  error:      { bg: 'bg-red-500',     label: 'កំហុស' },
};

export const SubtitleStudio: React.FC<SubtitleProps> = ({
  segments,
  characters = [],
  onUpdateSegment,
  onOpenExportModal,
  onShowToast,
  onGenerateCustomVideo,
  isGenerating = false,
}) => {
  const activeCharacters = characters && characters.length > 0 ? characters : CURATED_CHARACTER_VOICES;

  // ── State ──
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<'all' | 'm' | 'f' | 'think' | 'ready'>('all');
  const [synthesizingIdx, setSynthesizingIdx] = useState<number | null>(null);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isTranslatingWithAi, setIsTranslatingWithAi] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);

  // ── Derived stats ──
  const totalLines = segments.length;
  const translatedCount = segments.filter(s => s.khmer_translation && s.khmer_translation.trim().length > 0).length;
  const synthesizedCount = segments.filter(s => !!s.audioUrl).length;
  const translatedPct = totalLines > 0 ? Math.round((translatedCount / totalLines) * 100) : 0;
  const synthesizedPct = totalLines > 0 ? Math.round((synthesizedCount / totalLines) * 100) : 0;

  // ── Helpers ──
  const getTagFromText = (text: string): { tag: string | null; cleanText: string } => {
    const match = text.match(/^(\[(?:M|F|M_THINK|F_THINK|THINK)\])\s*(.*)/i);
    if (match) {
      return { tag: match[1].toUpperCase(), cleanText: match[2] };
    }
    return { tag: null, cleanText: text };
  };

  const handleApplyTag = (idx: number, currentText: string, tag: '[M]' | '[F]' | '[M_THINK]' | '[F_THINK]') => {
    const { cleanText, tag: existingTag } = getTagFromText(currentText);
    const newText = existingTag === tag ? cleanText : `${tag} ${cleanText}`.trim();
    const newGender = tag.includes('F') ? 'female' : 'male';
    onUpdateSegment(idx, { khmer_translation: newText, gender: newGender });
    onShowToast(`បានកំណត់ស្លាក ${tag} សម្រាប់ឃ្លាទី ${idx + 1}`, 'info');
  };

  const handleAppendParticle = (idx: number, currentText: string, particle: string) => {
    const trimmed = (currentText || '').trim();
    const updated = trimmed ? `${trimmed} ${particle}` : particle;
    onUpdateSegment(idx, { khmer_translation: updated });
  };

  const generateSrtContent = (): string => {
    let srt = '';
    segments.forEach((s, i) => {
      let lineText = s.khmer_translation || s.chinese_text || '';
      const { tag } = getTagFromText(lineText);
      if (!tag) {
        const defaultTag = s.gender === 'female' ? '[F]' : '[M]';
        lineText = `${defaultTag} ${lineText}`;
      }
      srt += `${i + 1}\n${formatTimecode(s.start_time)} --> ${formatTimecode(s.end_time)}\n${lineText}\n\n`;
    });
    return srt.trim() + '\n';
  };

  const handleExpertAiTranslate = async () => {
    if (!segments || segments.length === 0) {
      onShowToast('មិនទាន់មានទិន្នន័យអក្សររត់ឡើយ!', 'error');
      return;
    }
    setIsTranslatingWithAi(true);
    onShowToast('🎬 កំពុងបកប្រែតាមក្បួន Expert Subtitler & Dubbing Translator (៦ ច្បាប់)...', 'info');
    try {
      const res = await api.expertSubtitlerTranslate({ segments });
      if (res.success && res.segments && res.segments.length > 0) {
        res.segments.forEach((transSeg: any, i: number) => {
          if (i < segments.length) {
            onUpdateSegment(i, {
              khmer_translation: transSeg.khmer_translation,
              gender: transSeg.gender || segments[i].gender,
              audio_tag: transSeg.audio_tag,
              is_thought: transSeg.is_thought,
              status: 'ready',
            });
          }
        });
        onShowToast('✅ បានបកប្រែតាមក្បួនអាជីព ៦ ច្បាប់ និងបែងចែកស្លាកសំឡេងជោគជ័យ!', 'success');
      } else {
        onShowToast('មិនអាចបកប្រែបានទេ សូមសាកល្បងម្ដងទៀត!', 'error');
      }
    } catch (e: any) {
      onShowToast(`កំហុសបកប្រែ: ${e.message}`, 'error');
    } finally {
      setIsTranslatingWithAi(false);
    }
  };

  const handleExportSrt = () => {
    if (!segments || segments.length === 0) {
      onShowToast('មិនទាន់មានទិន្នន័យអក្សររត់ឡើយ!', 'error');
      return;
    }
    const srt = generateSrtContent();
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'movie_khmer_subtitles.srt';
    a.click();
    onShowToast('✅ បានទាញយកឯកសារ Subtitle (.SRT) ជោគជ័យ!', 'success');
  };

  const handleCopySrt = () => {
    if (!segments || segments.length === 0) {
      onShowToast('មិនទាន់មានទិន្នន័យអក្សររត់ឡើយ!', 'error');
      return;
    }
    const srt = generateSrtContent();
    navigator.clipboard.writeText(srt).then(() => {
      onShowToast('📋 បានចម្លងកូដ SRT ទាំងអស់ចូលក្តារឃ្លីប (Clipboard) រួចរាល់!', 'success');
    }).catch(() => {
      onShowToast('មិនអាចចម្លងបានទេ សូមសាកល្បងម្ដងទៀត!', 'error');
    });
  };

  const handleVoiceChange = (index: number, voiceId: string) => {
    const matchedChar = characters.find((c) => c.id === voiceId || c.filename === voiceId);
    const newName = matchedChar ? matchedChar.label : voiceId;
    const newGender = matchedChar ? matchedChar.gender : 'male';
    const newRole = matchedChar?.role_key || 'male_lead';
    onUpdateSegment(index, { voiceId, speaker_name: newName, gender: newGender, speaker_role: newRole });
    onShowToast(`បានកំណត់សំឡេង "${newName}" សម្រាប់ឃ្លាទី ${index + 1}`, 'info');
  };

  const handleGenerateLineSpeech = async (index: number, seg: TimelineSegment) => {
    const { cleanText } = getTagFromText(seg.khmer_translation || seg.chinese_text || '');
    if (!cleanText.trim()) {
      onShowToast('មិនមានអត្ថបទសម្រាប់បង្កើតសំឡេងឡើយ!', 'error');
      return;
    }
    setSynthesizingIdx(index);
    try {
      const res = await api.generateLine({
        text: cleanText,
        lineIndex: index,
        gender: seg.gender || 'male',
        voiceId: seg.voiceId || (seg.gender === 'female' ? 'voxcpm:vp_character_1_female.mp3' : 'voxcpm:vp_character_2_male.mp3'),
        speakerId: seg.speaker_role || 'male_lead',
        emotion: 'dramatic',
      });
      if (res.audioUrl) {
        onUpdateSegment(index, { audioUrl: res.audioUrl, status: 'ready' });
        onShowToast(`🎉 បានបង្កើតសំឡេងសម្រាប់ឃ្លាទី ${index + 1} ជោគជ័យ!`, 'success');
        playAudio(res.audioUrl);
      }
    } catch (err: any) {
      onShowToast(`បរាជ័យក្នុងការបង្កើតសំឡេង: ${err.message}`, 'error');
    } finally {
      setSynthesizingIdx(null);
    }
  };

  const handleGenerateAll = async () => {
    const pending = segments.filter((s, i) => {
      const { cleanText } = getTagFromText(s.khmer_translation || s.chinese_text || '');
      return cleanText.trim().length > 0 && !s.audioUrl;
    });
    if (pending.length === 0) {
      onShowToast('ឃ្លាទាំងអស់មានសំឡេងរួចហើយ!', 'info');
      return;
    }
    setGeneratingAll(true);
    onShowToast(`🎙 កំពុងបង្កើតសំឡេង ${pending.length} ឃ្លា...`, 'info');
    let successCount = 0;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const { cleanText } = getTagFromText(seg.khmer_translation || seg.chinese_text || '');
      if (!cleanText.trim() || seg.audioUrl) continue;
      setSynthesizingIdx(i);
      try {
        const res = await api.generateLine({
          text: cleanText,
          lineIndex: i,
          gender: seg.gender || 'male',
          voiceId: seg.voiceId || (seg.gender === 'female' ? 'voxcpm:vp_character_1_female.mp3' : 'voxcpm:vp_character_2_male.mp3'),
          speakerId: seg.speaker_role || 'male_lead',
          emotion: 'dramatic',
        });
        if (res.audioUrl) {
          onUpdateSegment(i, { audioUrl: res.audioUrl, status: 'ready' });
          successCount++;
        }
      } catch (_) {}
    }
    setSynthesizingIdx(null);
    setGeneratingAll(false);
    onShowToast(`✅ បានបង្កើតសំឡេង ${successCount}/${pending.length} ឃ្លាជោគជ័យ!`, 'success');
  };

  const playAudio = (url: string) => {
    try {
      if (audioElement) audioElement.pause();
      const audio = new Audio(url);
      setAudioElement(audio);
      setPlayingAudioUrl(url);
      audio.play().catch(() => {});
      audio.onended = () => setPlayingAudioUrl(null);
    } catch (_) {
      setPlayingAudioUrl(null);
    }
  };

  const stopAudio = () => {
    if (audioElement) {
      audioElement.pause();
      setPlayingAudioUrl(null);
    }
  };

  // ── Filter ──
  const filtered = segments
    .map((s, originalIdx) => ({ seg: s, originalIdx }))
    .filter(({ seg }) => {
      const text = (seg.khmer_translation || '').toLowerCase();
      const orig = (seg.chinese_text || '').toLowerCase();
      const speaker = (seg.speaker_name || '').toLowerCase();
      const matchesSearch =
        search.trim() === '' ||
        text.includes(search.toLowerCase()) ||
        orig.includes(search.toLowerCase()) ||
        speaker.includes(search.toLowerCase());
      if (!matchesSearch) return false;
      if (tagFilter === 'm') return text.includes('[m]') || seg.gender === 'male';
      if (tagFilter === 'f') return text.includes('[f]') || seg.gender === 'female';
      if (tagFilter === 'think') return text.includes('_think');
      if (tagFilter === 'ready') return !!seg.audioUrl || seg.status === 'ready';
      return true;
    });

  // ── Render ──
  return (
    <div
      className="flex-1 overflow-hidden flex flex-col gap-0 select-none bg-[#05070c]"
      style={{ paddingBottom: '80px' /* space for floating toolbar */ }}
    >

      {/* ════════════════════════════════════════
          SECTION 1 — Professional Editor Header
          ════════════════════════════════════════ */}
      <div className="bg-[#0b0e1a] border-b border-white/[0.07] px-4 md:px-6 py-3 flex flex-col gap-3 flex-shrink-0">

        {/* Top Row: Brand + Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/25 via-indigo-500/20 to-purple-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.2)] flex-shrink-0">
              <Subtitles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-extrabold text-white font-ui leading-tight">
                  PRO SRT Studio — Subtitle &amp; Dubbing Editor
                </h3>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/25 tracking-wider uppercase">
                  KHMER CINEMA
                </span>
                {/* Subtitle count badge */}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.1]">
                  {totalLines} ឃ្លា
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ស្លាក <span className="text-sky-300 font-semibold">[M]</span>{' '}
                <span className="text-rose-300 font-semibold">[F]</span>{' '}
                <span className="text-purple-300 font-semibold">[M_THINK]</span>{' '}
                <span className="text-fuchsia-300 font-semibold">[F_THINK]</span> · TTS · Export SRT
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {onGenerateCustomVideo && (
              <button
                id="btn-generate-video-from-cast"
                onClick={onGenerateCustomVideo}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:brightness-110 text-white font-extrabold text-xs transition-all shadow-[0_0_18px_rgba(52,211,153,0.3)] hover:scale-[1.02] active:scale-[0.97] disabled:opacity-60 cursor-pointer border border-emerald-300/30"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generate…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>🎬 Generate វីដេអូ</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleCopySrt}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.09] text-slate-200 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-amber-400" />
              <span>ចម្លង SRT</span>
            </button>

            <button
              onClick={handleExportSrt}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs transition-all shadow-[0_0_14px_rgba(56,189,248,0.2)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .SRT</span>
            </button>

            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs transition-all shadow-[0_0_14px_rgba(52,211,153,0.2)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Export វីដេអូ</span>
            </button>
          </div>
        </div>

        {/* ── Statistics Bar ── */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Stat chips */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <Hash className="w-3 h-3 text-slate-500" />
            <span className="text-slate-400">សរុប</span>
            <span className="font-bold text-white">{totalLines}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
            <span className="text-slate-400">បានបកប្រែ</span>
            <span className="font-bold text-amber-300">{translatedCount}</span>
            <span className="text-slate-600 text-[10px]">({translatedPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-slate-400">មានសំឡេង</span>
            <span className="font-bold text-emerald-300">{synthesizedCount}</span>
            <span className="text-slate-600 text-[10px]">({synthesizedPct}%)</span>
          </div>

          {/* Progress Bars */}
          <div className="flex-1 flex flex-col gap-1 min-w-[120px] max-w-[260px]">
            {/* Translated progress */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-700"
                  style={{ width: `${translatedPct}%` }}
                />
              </div>
              <span className="text-[9px] text-amber-400 font-mono w-8 text-right">{translatedPct}%</span>
            </div>
            {/* Synthesized progress */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                  style={{ width: `${synthesizedPct}%` }}
                />
              </div>
              <span className="text-[9px] text-emerald-400 font-mono w-8 text-right">{synthesizedPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          SECTION 2 — Filter & Search Bar
          ════════════════════════════════════════ */}
      <div className="bg-[#0d1020] border-b border-white/[0.06] px-4 md:px-6 py-2.5 flex flex-col sm:flex-row items-center gap-2.5 flex-shrink-0">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ស្វែងរក — អក្សររត់, អត្ថបទដើម, ឬឈ្មោះតួអង្គ…"
            className="w-full bg-[#070a14] border border-white/[0.08] focus:border-sky-500/50 rounded-xl pl-9 pr-8 py-2 text-[12px] text-slate-200 placeholder-slate-600 outline-none transition-all focus:shadow-[0_0_14px_rgba(56,189,248,0.12)] font-medium"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Pill Tabs */}
        <div className="flex items-center gap-1 bg-[#070a14] p-1 rounded-xl border border-white/[0.07] overflow-x-auto flex-shrink-0">
          {[
            { id: 'all',   label: `ទាំងអស់`, count: segments.length },
            { id: 'm',     label: '👑 [M]',   count: segments.filter(s => s.gender === 'male').length },
            { id: 'f',     label: '🌸 [F]',   count: segments.filter(s => s.gender === 'female').length },
            { id: 'think', label: '💭 Think',  count: segments.filter(s => (s.khmer_translation || '').toLowerCase().includes('_think')).length },
            { id: 'ready', label: '✅ Ready',  count: synthesizedCount },
          ].map((tab) => {
            const active = tagFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTagFilter(tab.id as any)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-sm'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                {tab.label}
                <span className={`text-[9px] font-mono ${active ? 'text-sky-400' : 'text-slate-600'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* AI Translate All */}
        <button
          onClick={handleExpertAiTranslate}
          disabled={isTranslatingWithAi || segments.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:brightness-110 text-white font-bold text-[11px] transition-all shadow-[0_0_14px_rgba(168,85,247,0.25)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 flex-shrink-0"
          title="Expert Subtitler AI — ៦ ច្បាប់"
        >
          {isTranslatingWithAi ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>AI កំពុងបកប្រែ…</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>✨ AI បកប្រែទាំងអស់</span>
            </>
          )}
        </button>
      </div>

      {/* ════════════════════════════════════════
          SECTION 3 — Subtitle Card List
          ════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto px-3 md:px-5 py-3 flex flex-col gap-2.5 scroll-smooth">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Subtitles className="w-10 h-10 text-slate-700" />
            <p className="text-sm font-semibold text-slate-400">មិនទាន់មានទិន្នន័យអក្សររត់ឡើយ</p>
            <p className="text-xs text-slate-600">សូមស្កេនវីដេអូ ឬបន្ថែមឃ្លាសន្ទនាជាមុនសិន។</p>
          </div>
        ) : (
          filtered.map(({ seg, originalIdx }) => {
            const isSynthesizing = synthesizingIdx === originalIdx;
            const hasAudio = !!seg.audioUrl;
            const isPlayingThis = playingAudioUrl === seg.audioUrl && !!seg.audioUrl;
            const isFocused = focusedIdx === originalIdx;
            const text = seg.khmer_translation || '';
            const { tag } = getTagFromText(text);
            const status = getSegmentStatus(seg);
            const duration = formatDuration(seg.start_time, seg.end_time);

            // Voice char for avatar
            const voiceChar = activeCharacters.find(
              c => c.id === seg.voiceId || c.filename === seg.voiceId
            );

            return (
              <div
                key={originalIdx}
                onFocus={() => setFocusedIdx(originalIdx)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setFocusedIdx(null);
                  }
                }}
                className={`relative rounded-2xl border transition-all duration-200 group ${
                  isFocused
                    ? 'border-sky-500/60 bg-[#0e1628] shadow-[0_0_24px_rgba(56,189,248,0.12)] scale-[1.002]'
                    : 'border-white/[0.07] bg-[#0b0e1a] hover:border-white/[0.13] hover:bg-[#0d1020]'
                }`}
              >
                {/* ── Card Body ── */}
                <div className="flex flex-col md:flex-row gap-0">

                  {/* ── LEFT COLUMN: Line # + Timecode + Duration ── */}
                  <div className="flex md:flex-col items-start md:items-center justify-between md:justify-start gap-2 px-3 py-3 md:w-[110px] md:border-r border-white/[0.07] flex-shrink-0">
                    {/* Status dot + Line number */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[status].bg}`}
                        title={STATUS_DOT[status].label}
                      />
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        #{String(originalIdx + 1).padStart(3, '0')}
                      </span>
                    </div>

                    {/* Timecode */}
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-mono text-sky-400 font-bold leading-tight">
                        {formatTimecode(seg.start_time).split(',')[0]}
                      </span>
                      <span className="text-[9px] text-slate-600">↓</span>
                      <span className="text-[10px] font-mono text-slate-400 leading-tight">
                        {formatTimecode(seg.end_time).split(',')[0]}
                      </span>
                    </div>

                    {/* Duration pill */}
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08]">
                      <Clock className="w-2.5 h-2.5 text-slate-500" />
                      <span className="text-[9px] font-mono text-slate-400">{duration}</span>
                    </div>
                  </div>

                  {/* ── CENTER COLUMN: Khmer textarea + Original text ── */}
                  <div className="flex-1 px-3 py-3 flex flex-col gap-2 min-w-0">
                    {/* Khmer Text Textarea */}
                    <textarea
                      value={seg.khmer_translation || ''}
                      onChange={(e) => {
                        onUpdateSegment(originalIdx, { khmer_translation: e.target.value });
                        // Auto-resize
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onFocus={(e) => {
                        setFocusedIdx(originalIdx);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      rows={2}
                      placeholder="បញ្ចូលអត្ថបទសន្ទនាភាសាខ្មែរ…"
                      className="w-full bg-[#070a14] border border-white/[0.08] focus:border-sky-500/50 rounded-xl px-3 py-2.5 text-slate-100 placeholder-slate-600 outline-none text-[13px] font-medium leading-relaxed resize-none transition-all focus:shadow-[0_0_12px_rgba(56,189,248,0.1)] overflow-hidden"
                      style={{ minHeight: '52px' }}
                    />

                    {/* Original source text */}
                    {seg.chinese_text && (
                      <p className="text-[11px] text-slate-500 font-mono leading-relaxed pl-1 italic truncate" title={seg.chinese_text}>
                        {seg.chinese_text}
                      </p>
                    )}

                    {/* ── Bottom Toolbar: Tags + Particles + Synthesize ── */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      {/* Tag Buttons */}
                      {(
                        [
                          { t: '[M]',       label: 'M',       cls: tag === '[M]'       ? 'bg-sky-500/30 text-sky-200 border-sky-400/60' : 'bg-sky-500/8 text-sky-500 border-sky-500/20 hover:bg-sky-500/20' },
                          { t: '[F]',       label: 'F',       cls: tag === '[F]'       ? 'bg-rose-500/30 text-rose-200 border-rose-400/60' : 'bg-rose-500/8 text-rose-500 border-rose-500/20 hover:bg-rose-500/20' },
                          { t: '[M_THINK]', label: 'M💭',     cls: tag === '[M_THINK]' ? 'bg-purple-500/30 text-purple-200 border-purple-400/60' : 'bg-purple-500/8 text-purple-400 border-purple-500/20 hover:bg-purple-500/20' },
                          { t: '[F_THINK]', label: 'F💭',     cls: tag === '[F_THINK]' ? 'bg-fuchsia-500/30 text-fuchsia-200 border-fuchsia-400/60' : 'bg-fuchsia-500/8 text-fuchsia-400 border-fuchsia-500/20 hover:bg-fuchsia-500/20' },
                        ] as { t: '[M]' | '[F]' | '[M_THINK]' | '[F_THINK]'; label: string; cls: string }[]
                      ).map(({ t, label, cls }) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleApplyTag(originalIdx, text, t)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${cls}`}
                        >
                          {label}
                        </button>
                      ))}

                      <div className="w-px h-3.5 bg-white/[0.1] mx-0.5" />

                      {/* Spoken particle chips */}
                      {KHMER_SPOKEN_PARTICLES.slice(0, 6).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handleAppendParticle(originalIdx, text, p)}
                          title={`+ ${p}`}
                          className="px-1.5 py-0.5 rounded-md text-[10px] bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-slate-100 hover:bg-white/[0.09] hover:border-white/[0.15] transition-all cursor-pointer"
                        >
                          +{p}
                        </button>
                      ))}

                      <div className="flex-1" />

                      {/* TTS Synthesize button */}
                      <button
                        onClick={() => handleGenerateLineSpeech(originalIdx, seg)}
                        disabled={isSynthesizing}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                          hasAudio
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25 shadow-sm shadow-emerald-500/10'
                            : 'bg-sky-500/10 text-sky-300 border-sky-400/30 hover:bg-sky-500/20'
                        } disabled:opacity-60`}
                        title="TTS — បង្កើតសំឡេងខ្មែរ"
                      >
                        {isSynthesizing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                            <span>Synthesizing…</span>
                          </>
                        ) : hasAudio ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Re-Synth</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5" />
                            <span>Synthesize</span>
                          </>
                        )}
                      </button>

                      {/* Play / Pause */}
                      {hasAudio && (
                        <button
                          onClick={() => {
                            if (isPlayingThis) stopAudio();
                            else if (seg.audioUrl) playAudio(seg.audioUrl);
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                            isPlayingThis
                              ? 'bg-amber-400 text-black border-amber-300 shadow-sm shadow-amber-400/30 animate-pulse'
                              : 'bg-white/[0.05] text-amber-300 border-white/[0.1] hover:bg-white/[0.1]'
                          }`}
                          title={isPlayingThis ? 'ផ្អាកសំឡេង' : 'ស្ដាប់សំឡេង'}
                        >
                          {isPlayingThis ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── RIGHT COLUMN: Character Voice Selector + Synthesized Indicator ── */}
                  <div className="flex flex-row md:flex-col items-center gap-2 px-3 py-3 md:w-[160px] md:border-l border-white/[0.07] flex-shrink-0 justify-between md:justify-start">

                    {/* Avatar + Character Voice Dropdown */}
                    <div className="flex flex-col gap-1.5 w-full">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base leading-none flex-shrink-0">
                          {voiceChar ? getCharacterAvatar(voiceChar) : (seg.gender === 'female' ? '🌸' : '👑')}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate font-medium">
                          {seg.speaker_name || 'Character…'}
                        </span>
                      </div>

                      <div className="relative">
                        <select
                          value={seg.voiceId || (seg.gender === 'female' ? 'voxcpm:vp_character_1_female.mp3' : 'voxcpm:vp_character_2_male.mp3')}
                          onChange={(e) => handleVoiceChange(originalIdx, e.target.value)}
                          className="w-full bg-[#070a14] border border-white/[0.1] hover:border-sky-500/40 rounded-lg pl-2.5 pr-6 py-1.5 text-[11px] text-white focus:outline-none focus:border-sky-400 font-medium appearance-none cursor-pointer transition-all"
                        >
                          <optgroup label="🌸 Female Clones">
                            {activeCharacters.filter(c => c.gender === 'female').map(c => (
                              <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                          </optgroup>
                          <optgroup label="👑 Male Clones">
                            {activeCharacters.filter(c => c.gender !== 'female').map(c => (
                              <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                          </optgroup>
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Synthesized indicator */}
                    {hasAudio && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 mt-auto self-start">
                        <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        <span className="text-[9px] text-emerald-400 font-bold whitespace-nowrap">AUDIO ✓</span>
                      </div>
                    )}

                    {/* Gender tag quick-set (compact) */}
                    <div className="flex gap-1 flex-wrap justify-center mt-1">
                      <button
                        type="button"
                        onClick={() => handleApplyTag(originalIdx, text, '[M]')}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border cursor-pointer transition-all ${
                          tag === '[M]' ? 'bg-sky-500/30 text-sky-200 border-sky-400/50' : 'text-sky-600 border-sky-600/30 hover:bg-sky-500/15'
                        }`}
                      >M</button>
                      <button
                        type="button"
                        onClick={() => handleApplyTag(originalIdx, text, '[F]')}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border cursor-pointer transition-all ${
                          tag === '[F]' ? 'bg-rose-500/30 text-rose-200 border-rose-400/50' : 'text-rose-600 border-rose-600/30 hover:bg-rose-500/15'
                        }`}
                      >F</button>
                      <button
                        type="button"
                        onClick={() => handleApplyTag(originalIdx, text, '[M_THINK]')}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border cursor-pointer transition-all ${
                          tag === '[M_THINK]' ? 'bg-purple-500/30 text-purple-200 border-purple-400/50' : 'text-purple-600 border-purple-600/30 hover:bg-purple-500/15'
                        }`}
                      >M💭</button>
                      <button
                        type="button"
                        onClick={() => handleApplyTag(originalIdx, text, '[F_THINK]')}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border cursor-pointer transition-all ${
                          tag === '[F_THINK]' ? 'bg-fuchsia-500/30 text-fuchsia-200 border-fuchsia-400/50' : 'text-fuchsia-600 border-fuchsia-600/30 hover:bg-fuchsia-500/15'
                        }`}
                      >F💭</button>
                    </div>
                  </div>
                </div>

                {/* Focused border glow accent line */}
                {isFocused && (
                  <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-gradient-to-b from-sky-400 via-indigo-500 to-purple-500 opacity-90" />
                )}
              </div>
            );
          })
        )}

        {/* Bottom spacer so last card isn't hidden behind float bar */}
        <div className="h-4 flex-shrink-0" />
      </div>

      {/* ════════════════════════════════════════
          SECTION 4 — Fixed Floating Bottom Toolbar
          ════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-2.5 px-4 py-3 bg-[#080b16]/90 border-t border-white/[0.08] backdrop-blur-xl shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
        {/* Generate All Audio */}
        <button
          onClick={handleGenerateAll}
          disabled={generatingAll || synthesizingIdx !== null || segments.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs transition-all shadow-[0_0_18px_rgba(56,189,248,0.25)] hover:scale-[1.02] active:scale-[0.97] cursor-pointer disabled:opacity-50 border border-sky-400/20"
        >
          {generatingAll || synthesizingIdx !== null ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              <span>Generating… #{(synthesizingIdx ?? 0) + 1}</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-amber-300" />
              <span>🎙 Generate All Audio</span>
            </>
          )}
        </button>

        <div className="h-6 w-px bg-white/[0.1]" />

        {/* Export SRT */}
        <button
          onClick={handleExportSrt}
          disabled={segments.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0e1424] border border-white/[0.1] hover:bg-white/[0.07] text-slate-200 font-bold text-xs transition-all hover:scale-[1.02] active:scale-[0.97] cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-sky-400" />
          <span>Export SRT</span>
        </button>

        {/* Export Video */}
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs transition-all shadow-[0_0_16px_rgba(52,211,153,0.2)] hover:scale-[1.02] active:scale-[0.97] cursor-pointer border border-emerald-400/20"
        >
          <Film className="w-4 h-4" />
          <span>Export Video</span>
        </button>

        {onGenerateCustomVideo && (
          <>
            <div className="h-6 w-px bg-white/[0.1]" />
            <button
              onClick={onGenerateCustomVideo}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs transition-all shadow-[0_0_16px_rgba(168,85,247,0.2)] hover:scale-[1.02] active:scale-[0.97] cursor-pointer disabled:opacity-50 border border-purple-400/20"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generate…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>🎬 Generate Video</span>
                </>
              )}
            </button>
          </>
        )}

        {/* Stats summary in float bar */}
        <div className="ml-auto hidden md:flex items-center gap-3 text-[10px]">
          <span className="text-slate-500">{filtered.length}/{totalLines} ឃ្លា</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-slate-400">{translatedCount} បកប្រែ</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-400">{synthesizedCount} សំឡេង</span>
          </span>
        </div>
      </div>
    </div>
  );
};
