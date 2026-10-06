import React, { useState, useRef, useCallback } from 'react';
import {
  Languages,
  Sparkles,
  Copy,
  Check,
  Download,
  Film,
  MessageSquare,
  ShieldCheck,
  Send,
  Loader2,
  FileText,
  User,
  Heart,
  ArrowLeftRight,
  ChevronDown,
  Clock,
  Hash,
  BarChart2,
  X,
  Zap,
  Upload,
  Star,
} from 'lucide-react';
import { api } from '../../services/api';
import { TimelineSegment } from '../../types';

interface TranslationProps {
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  segments?: TimelineSegment[];
  onApplySegments?: (segments: TimelineSegment[]) => void;
}

const SPOKEN_PARTICLES = ['ណា', 'ណ៎', 'ហ្មង', 'តើ', 'អញ្ចឹង', 'វើយ', 'ហាស', 'ចា៎', 'ចុះ'];

const LANGUAGE_OPTIONS = [
  { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', label: 'Korean', flag: '🇰🇷' },
  { code: 'th', label: 'Thai', flag: '🇹🇭' },
  { code: 'vi', label: 'Vietnamese', flag: '🇻🇳' },
];

/* ── helpers ── */
function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}
function estimateDubbingTime(segments: TimelineSegment[]) {
  if (!segments.length) return '0:00';
  const total = segments.reduce((acc, s) => {
    const dur = (s.end_time || 0) - (s.start_time || 0);
    return acc + Math.max(0, dur);
  }, 0);
  const mins = Math.floor(total / 60);
  const secs = Math.floor(total % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
function countKhmerWords(text: string) {
  if (!text) return 0;
  const khmer = text.match(/[\u1780-\u17FF]+/g);
  return khmer ? khmer.length : 0;
}

/* ── Shimmer animation style ── */
const shimmerStyle: React.CSSProperties = {
  background:
    'linear-gradient(90deg, rgba(139,92,246,0.85) 0%, rgba(99,102,241,0.9) 40%, rgba(168,85,247,0.95) 60%, rgba(99,102,241,0.9) 80%, rgba(139,92,246,0.85) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.8s ease-in-out infinite',
};

const shimmerKeyframes = `
@keyframes shimmer {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(139,92,246,0.4); }
  50%       { box-shadow: 0 0 40px rgba(139,92,246,0.7); }
}
`;

export const TranslationDesk: React.FC<TranslationProps> = ({
  onShowToast,
  segments = [],
  onApplySegments,
}) => {
  const [activeMode, setActiveMode] = useState<'expert' | 'quick'>('expert');

  /* ── Expert mode state ── */
  const [sourceText, setSourceText] = useState('');
  const [characterRelationships, setCharacterRelationships] = useState('បង/អូន (តួឯកប្រុស និងតួឯកស្រី)');
  const [storyContext, setStoryContext] = useState('រឿងភាគចិនបុរាណ / ស្នេហា / ក្បត់ចិត្ត');
  const [srtResult, setSrtResult] = useState('');
  const [parsedSegments, setParsedSegments] = useState<TimelineSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedKh, setCopiedKh] = useState(false);

  /* ── Quick translate state ── */
  const [quickSource, setQuickSource] = useState('');
  const [quickTarget, setQuickTarget] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickCopied, setQuickCopied] = useState(false);
  const [sourceLang, setSourceLang] = useState('zh');
  const [targetLang] = useState('km');

  const sourceRef = useRef<HTMLTextAreaElement>(null);

  /* ── Load existing segments from Studio Timeline ── */
  const handleLoadFromTimeline = () => {
    if (!segments || segments.length === 0) {
      onShowToast('មិនទាន់មានទិន្នន័យក្នុង Timeline នៅឡើយទេ!', 'info');
      return;
    }
    const formatted = segments
      .map((s, i) => {
        const text = s.chinese_text || s.khmer_translation || '';
        const tag = s.gender === 'female' ? '[F]' : '[M]';
        return `${i + 1}\n00:00:0${i * 3},000 --> 00:00:0${i * 3 + 2},500\n${tag} ${text}`;
      })
      .join('\n\n');
    setSourceText(formatted);
    onShowToast(`បានទាញយក ${segments.length} ឃ្លាពី Timeline Studio រួចរាល់!`, 'success');
  };

  /* ── Expert AI translate ── */
  const handleExpertTranslate = async () => {
    if (!sourceText.trim() && (!segments || segments.length === 0)) {
      onShowToast('សូមបញ្ចូលអត្ថបទ ឬទាញយកពី Timeline ជាមុនសិន!', 'error');
      return;
    }
    setIsLoading(true);
    onShowToast('🎬 AI កំពុងបកប្រែតាមក្បួន Expert Subtitler & Dubbing Translator (៦ ច្បាប់)...', 'info');
    try {
      const res = await api.expertSubtitlerTranslate({
        text: sourceText,
        character_relationships: characterRelationships,
        context: storyContext,
        segments: segments.length > 0 && !sourceText.trim() ? segments : undefined,
      });
      if (res.success) {
        setSrtResult(res.srt_content || '');
        if (res.segments && res.segments.length > 0) setParsedSegments(res.segments);
        onShowToast('✅ បានបកប្រែជាទម្រង់ SRT និងស្លាកសំឡេងតួអង្គជោគជ័យ!', 'success');
      } else {
        onShowToast('មិនអាចបកប្រែបានទេ សូមសាកល្បងម្ដងទៀត!', 'error');
      }
    } catch (e: any) {
      onShowToast(`កំហុសបកប្រែ: ${e.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Quick translate ── */
  const handleQuickTranslate = async () => {
    if (!quickSource.trim()) {
      onShowToast('សូមបញ្ចូលអត្ថបទដើម!', 'error');
      return;
    }
    setQuickLoading(true);
    try {
      const res = await api.translate(quickSource, sourceLang, targetLang);
      if (res.translation) {
        setQuickTarget(res.translation);
        onShowToast('បកប្រែជាភាសាខ្មែរជោគជ័យ!', 'success');
      }
    } catch (e: any) {
      onShowToast(`កំហុសក្នុងការបកប្រែ: ${e.message}`, 'error');
    } finally {
      setQuickLoading(false);
    }
  };

  /* ── Copy / Download ── */
  const handleCopySrt = () => {
    if (!srtResult) return;
    navigator.clipboard.writeText(srtResult);
    setCopied(true);
    onShowToast('📋 បានចម្លងកូដ SRT ទាំងអស់ចូលក្តារឃ្លីប!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyKhOnly = () => {
    if (!srtResult) return;
    const khLines = srtResult
      .split('\n')
      .filter((l) => /[\u1780-\u17FF]/.test(l))
      .join('\n');
    navigator.clipboard.writeText(khLines);
    setCopiedKh(true);
    onShowToast('📋 បានចម្លងអត្ថបទខ្មែរតែប៉ុណ្ណោះ!', 'success');
    setTimeout(() => setCopiedKh(false), 2000);
  };

  const handleDownloadSrt = () => {
    if (!srtResult) return;
    const blob = new Blob([srtResult], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'expert_khmer_dubbing_subtitles.srt';
    a.click();
    onShowToast('💾 បានទាញយកឯកសារ Subtitle (.SRT) ជោគជ័យ!', 'success');
  };

  const handleApplyToStudio = () => {
    if (parsedSegments.length === 0) {
      onShowToast('មិនទាន់មានឃ្លាដែលបានបកប្រែសម្រាប់បញ្ជូនទៅកាន់ Studio ឡើយ!', 'error');
      return;
    }
    if (onApplySegments) {
      onApplySegments(parsedSegments);
      onShowToast(`🚀 បានបញ្ជូន ${parsedSegments.length} ឃ្លាទៅកាន់ Dubbing & Subtitle Studio រួចរាល់!`, 'success');
    } else {
      onShowToast('បានរក្សាទុកទិន្នន័យ Subtitle រួចរាល់!', 'success');
    }
  };

  const handleInsertTag = (tag: string) => {
    setSourceText((prev) => (prev ? `${prev}\n${tag} ` : `${tag} `));
  };

  const handleInsertParticle = useCallback((p: string) => {
    setSourceText((prev) => (prev ? `${prev} ${p}` : p));
  }, []);

  const handleSwapLanguages = () => {
    const tmp = quickSource;
    setQuickSource(quickTarget);
    setQuickTarget(tmp);
  };

  /* ── Stats ── */
  const wordCount = countWords(sourceText);
  const charCount = sourceText.length;
  const khWordCount = countKhmerWords(srtResult);
  const dubbingTime = estimateDubbingTime(parsedSegments);

  /* ── SRT syntax highlight (simple) ── */
  const renderSrtHighlighted = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      let color = '#94a3b8';
      if (/^\d+$/.test(line.trim())) color = '#f59e0b';
      else if (/-->/.test(line)) color = '#38bdf8';
      else if (/\[M\]|\[M_THINK\]/.test(line)) color = '#67e8f9';
      else if (/\[F\]|\[F_THINK\]/.test(line)) color = '#f9a8d4';
      else if (/[\u1780-\u17FF]/.test(line)) color = '#a78bfa';
      return (
        <span key={i} style={{ color, display: 'block', lineHeight: '1.6' }}>
          {line || '\u00A0'}
        </span>
      );
    });
  };

  return (
    <>
      {/* inject keyframe styles */}
      <style>{shimmerKeyframes}</style>

      <div
        className="flex-1 overflow-y-auto flex flex-col select-none"
        style={{ background: '#07090e', minHeight: 0 }}
      >
        {/* ════════════════════════════════════════
            PROFESSIONAL HEADER TOOLBAR
        ════════════════════════════════════════ */}
        <div
          className="sticky top-0 z-20 flex items-center justify-between px-4 py-2.5 gap-3 flex-wrap"
          style={{
            background: 'linear-gradient(180deg, #0b0f1a 0%, #0d1120 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 2px 24px rgba(0,0,0,0.6)',
          }}
        >
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                boxShadow: '0 0 14px rgba(124,58,237,0.5)',
              }}
            >
              <Languages className="w-4 h-4 text-slate-800 dark:text-white" />
            </div>
            <div>
              <p className="text-[11px] font-black tracking-[0.18em] text-slate-800 dark:text-white leading-none">
                TRANSLATION DESK
              </p>
              <p className="text-[9px] tracking-widest text-purple-400/80 font-mono mt-0.5">
                AI SUBTITLER · DUBBING ENGINE
              </p>
            </div>
          </div>

          {/* Mode Pill Switcher */}
          <div
            className="flex items-center p-1 rounded-2xl gap-1"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <button
              onClick={() => setActiveMode('expert')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              style={
                activeMode === 'expert'
                  ? {
                      background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                      color: '#fff',
                      boxShadow: '0 0 18px rgba(124,58,237,0.45)',
                    }
                  : { color: '#94a3b8' }
              }
            >
              <Star className="w-3.5 h-3.5 text-amber-300" />
              <span>Expert AI</span>
            </button>

            <button
              onClick={() => setActiveMode('quick')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              style={
                activeMode === 'quick'
                  ? {
                      background: 'rgba(14,165,233,0.2)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56,189,248,0.35)',
                    }
                  : { color: '#94a3b8' }
              }
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Quick Translate</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {segments.length > 0 && (
              <button
                onClick={handleLoadFromTimeline}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] cursor-pointer"
                style={{
                  background: 'rgba(14,165,233,0.12)',
                  border: '1px solid rgba(56,189,248,0.25)',
                  color: '#38bdf8',
                }}
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Load Timeline ({segments.length})</span>
              </button>
            )}
            {srtResult && (
              <button
                onClick={handleApplyToStudio}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                  boxShadow: '0 0 12px rgba(5,150,105,0.35)',
                  color: '#fff',
                }}
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Apply to Timeline</span>
              </button>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════
            STATISTICS BAR
        ════════════════════════════════════════ */}
        <div
          className="flex items-center gap-4 px-4 py-2 flex-wrap"
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <StatPill icon={<Hash className="w-3 h-3 text-sky-600 dark:text-amber-400" />} label="Lines" value={parsedSegments.length > 0 ? `${parsedSegments.length}` : `${sourceText.split('\n').filter(Boolean).length}`} />
          <StatPill icon={<Clock className="w-3 h-3 text-sky-400" />} label="Dub Time" value={dubbingTime} />
          <StatPill icon={<BarChart2 className="w-3 h-3 text-purple-400" />} label="KH Words" value={`${khWordCount}`} />
          <StatPill icon={<FileText className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />} label="Words" value={`${wordCount}`} />
          <StatPill icon={<Languages className="w-3 h-3 text-rose-400" />} label="Chars" value={`${charCount}`} />
          {parsedSegments.length > 0 && (
            <span
              className="ml-auto text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(52,211,153,0.12)',
                border: '1px solid rgba(52,211,153,0.3)',
                color: '#34d399',
              }}
            >
              ✓ {parsedSegments.length} SEGMENTS READY
            </span>
          )}
        </div>

        {/* ════════════════════════════════════════
            MAIN CONTENT
        ════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-5">
          {activeMode === 'expert' ? (
            <ExpertMode
              sourceText={sourceText}
              setSourceText={setSourceText}
              characterRelationships={characterRelationships}
              setCharacterRelationships={setCharacterRelationships}
              storyContext={storyContext}
              setStoryContext={setStoryContext}
              srtResult={srtResult}
              setSrtResult={setSrtResult}
              parsedSegments={parsedSegments}
              isLoading={isLoading}
              copied={copied}
              copiedKh={copiedKh}
              segments={segments}
              sourceRef={sourceRef}
              wordCount={wordCount}
              charCount={charCount}
              onLoadFromTimeline={handleLoadFromTimeline}
              onExpertTranslate={handleExpertTranslate}
              onCopySrt={handleCopySrt}
              onCopyKhOnly={handleCopyKhOnly}
              onDownloadSrt={handleDownloadSrt}
              onApplyToStudio={handleApplyToStudio}
              onInsertTag={handleInsertTag}
              onInsertParticle={handleInsertParticle}
              renderSrtHighlighted={renderSrtHighlighted}
              onApplySegments={onApplySegments}
            />
          ) : (
            <QuickMode
              quickSource={quickSource}
              setQuickSource={setQuickSource}
              quickTarget={quickTarget}
              setQuickTarget={setQuickTarget}
              quickLoading={quickLoading}
              quickCopied={quickCopied}
              setQuickCopied={setQuickCopied}
              sourceLang={sourceLang}
              setSourceLang={setSourceLang}
              onQuickTranslate={handleQuickTranslate}
              onSwap={handleSwapLanguages}
              onInsertParticle={handleInsertParticle}
              onShowToast={onShowToast}
            />
          )}
        </div>
      </div>
    </>
  );
};

/* ════════════════════════════════════════
    STAT PILL COMPONENT
════════════════════════════════════════ */
const StatPill: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-1.5">
    {icon}
    <span className="text-[10px] text-slate-500">{label}</span>
    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{value}</span>
  </div>
);

/* ════════════════════════════════════════
    EXPERT MODE COMPONENT
════════════════════════════════════════ */
interface ExpertModeProps {
  sourceText: string;
  setSourceText: (v: string) => void;
  characterRelationships: string;
  setCharacterRelationships: (v: string) => void;
  storyContext: string;
  setStoryContext: (v: string) => void;
  srtResult: string;
  setSrtResult: (v: string) => void;
  parsedSegments: TimelineSegment[];
  isLoading: boolean;
  copied: boolean;
  copiedKh: boolean;
  segments: TimelineSegment[];
  sourceRef: React.RefObject<HTMLTextAreaElement>;
  wordCount: number;
  charCount: number;
  onLoadFromTimeline: () => void;
  onExpertTranslate: () => void;
  onCopySrt: () => void;
  onCopyKhOnly: () => void;
  onDownloadSrt: () => void;
  onApplyToStudio: () => void;
  onInsertTag: (tag: string) => void;
  onInsertParticle: (p: string) => void;
  renderSrtHighlighted: (text: string) => React.ReactNode;
  onApplySegments?: (segments: TimelineSegment[]) => void;
}

const ExpertMode: React.FC<ExpertModeProps> = ({
  sourceText, setSourceText,
  characterRelationships, setCharacterRelationships,
  storyContext, setStoryContext,
  srtResult, setSrtResult,
  parsedSegments,
  isLoading, copied, copiedKh,
  segments, sourceRef,
  wordCount, charCount,
  onLoadFromTimeline, onExpertTranslate,
  onCopySrt, onCopyKhOnly, onDownloadSrt, onApplyToStudio,
  onInsertTag, onInsertParticle,
  renderSrtHighlighted, onApplySegments,
}) => {
  const lines = sourceText ? sourceText.split('\n') : [];

  return (
    <>
      {/* ── CONTEXT INPUT CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Character Relationships card */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-2"
          style={{
            background: 'linear-gradient(135deg, rgba(14,165,233,0.06) 0%, rgba(99,102,241,0.06) 100%)',
            border: '1px solid rgba(99,102,241,0.18)',
          }}
        >
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <span className="text-base">👥</span>
            <User className="w-3.5 h-3.5 text-sky-400" />
            <span>Character Relationships</span>
          </label>
          <input
            type="text"
            value={characterRelationships}
            onChange={(e) => setCharacterRelationships(e.target.value)}
            placeholder="e.g.  👑 បង/អូន,  ⚔️ ឯង/អញ,  💼 ខ្ញុំ/លោក …"
            className="w-full rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 outline-none transition-all"
            style={{
              background: 'rgba(7,9,14,0.8)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(56,189,248,0.5)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.07)')}
          />
          <p className="text-[10px] text-slate-500">
            💡 Define speaker pronouns per character for consistent voice identity
          </p>
        </div>

        {/* Story Context card */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-2"
          style={{
            background: 'linear-gradient(135deg, rgba(236,72,153,0.06) 0%, rgba(168,85,247,0.06) 100%)',
            border: '1px solid rgba(168,85,247,0.18)',
          }}
        >
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <span className="text-base">🎭</span>
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>Story Context & Emotion</span>
          </label>
          <input
            type="text"
            value={storyContext}
            onChange={(e) => setStoryContext(e.target.value)}
            placeholder="e.g.  🏯 រឿងចិនបុរាណ,  💔 ស្នេហា / ក្បត់ចិត្ត,  ⚔️ ច្បាំងក្រៅ…"
            className="w-full rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 outline-none transition-all"
            style={{
              background: 'rgba(7,9,14,0.8)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(168,85,247,0.5)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.07)')}
          />
          <p className="text-[10px] text-slate-500">
            💡 Setting, genre and tone help AI choose correct emotional vocabulary
          </p>
        </div>
      </div>

      {/* ── DUAL PANEL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: 520 }}>
        {/* ─── LEFT: Source Text Panel ─── */}
        <div
          className="rounded-2xl flex flex-col overflow-hidden"
          style={{ background: '#0d1120', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* Panel Header */}
          <div
            className="flex items-center justify-between px-4 py-2.5 flex-wrap gap-2"
            style={{
              background: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-sky-400" />
                Source Text
              </span>
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: 'rgba(251,191,36,0.12)',
                  border: '1px solid rgba(251,191,36,0.25)',
                  color: '#fbbf24',
                }}
              >
                🔍 AUTO DETECT
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onLoadFromTimeline}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all hover:scale-[1.02] cursor-pointer"
                style={{
                  background: 'rgba(14,165,233,0.1)',
                  border: '1px solid rgba(56,189,248,0.2)',
                  color: '#38bdf8',
                }}
              >
                <Upload className="w-3 h-3" />
                Load Timeline
              </button>
              <span className="text-[10px] text-slate-500">{wordCount}w · {charCount}c</span>
              {sourceText && (
                <button
                  onClick={() => setSourceText('')}
                  className="p-1 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Clear"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* SPOKEN PARTICLES TOOLBAR */}
          <div
            className="flex items-center gap-1 flex-wrap px-3 py-2"
            style={{
              background: 'rgba(255,255,255,0.015)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <span className="text-[10px] text-sky-600 dark:text-amber-400/80 flex items-center gap-1 mr-1 shrink-0">
              <MessageSquare className="w-3 h-3" />
              Particles:
            </span>
            {SPOKEN_PARTICLES.map((p) => (
              <button
                key={p}
                onClick={() => onInsertParticle(p)}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium transition-all hover:scale-105 cursor-pointer"
                style={{
                  background: 'rgba(251,191,36,0.08)',
                  border: '1px solid rgba(251,191,36,0.15)',
                  color: '#fcd34d',
                }}
              >
                +{p}
              </button>
            ))}
            <div
              className="h-4 mx-1"
              style={{ width: 1, background: 'rgba(255,255,255,0.1)' }}
            />
            {['[M]', '[F]', '[M_THINK]', '[F_THINK]'].map((tag) => {
              const colors: Record<string, string> = {
                '[M]': '#67e8f9',
                '[F]': '#f9a8d4',
                '[M_THINK]': '#a78bfa',
                '[F_THINK]': '#f472b6',
              };
              return (
                <button
                  key={tag}
                  onClick={() => onInsertTag(tag)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold transition-all hover:scale-105 cursor-pointer"
                  style={{
                    background: `${colors[tag]}18`,
                    border: `1px solid ${colors[tag]}30`,
                    color: colors[tag],
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {/* Textarea with line numbers */}
          <div className="flex flex-1 overflow-hidden" style={{ minHeight: 320 }}>
            {/* Line numbers */}
            <div
              className="flex flex-col pt-3.5 pb-3 px-2 text-right select-none shrink-0 overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderRight: '1px solid rgba(255,255,255,0.05)',
                minWidth: 36,
                fontFamily: 'monospace',
                fontSize: 11,
                color: 'rgba(148,163,184,0.4)',
                lineHeight: '1.7',
              }}
              aria-hidden="true"
            >
              {(lines.length > 0 ? lines : ['']).map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>

            <textarea
              ref={sourceRef}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder={`SRT / Dialogue / Script\n\n1\n00:01:00,000 --> 00:01:01,500\n你竟敢背叛我！\n\n2\n00:01:01,600 --> 00:01:03,000\n今天你必须死！`}
              className="flex-1 w-full p-3.5 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-600 outline-none resize-none"
              style={{
                background: 'transparent',
                fontFamily: 'monospace',
                lineHeight: '1.7',
              }}
            />
          </div>
        </div>

        {/* ─── RIGHT: Khmer Translation Panel ─── */}
        <div
          className="rounded-2xl flex flex-col overflow-hidden"
          style={{ background: '#0d1120', border: '1px solid rgba(168,85,247,0.18)' }}
        >
          {/* Panel Header */}
          <div
            className="flex items-center justify-between px-4 py-2.5 flex-wrap gap-2"
            style={{
              background: 'rgba(168,85,247,0.05)',
              borderBottom: '1px solid rgba(168,85,247,0.12)',
            }}
          >
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Khmer Translation
            </span>
            <div className="flex items-center gap-1.5">
              {srtResult && (
                <>
                  <button
                    onClick={onCopySrt}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all hover:scale-[1.02] cursor-pointer"
                    style={{
                      background: 'rgba(251,191,36,0.1)',
                      border: '1px solid rgba(251,191,36,0.2)',
                      color: '#fbbf24',
                    }}
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied!' : 'Copy SRT'}
                  </button>
                  <button
                    onClick={onDownloadSrt}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all hover:scale-[1.02] cursor-pointer"
                    style={{
                      background: 'rgba(14,165,233,0.1)',
                      border: '1px solid rgba(56,189,248,0.2)',
                      color: '#38bdf8',
                    }}
                  >
                    <Download className="w-3 h-3" />
                    .SRT
                  </button>
                </>
              )}
            </div>
          </div>

          {/* SRT Syntax-highlighted Preview */}
          <div
            className="flex-1 overflow-y-auto p-4"
            style={{
              fontFamily: 'monospace',
              fontSize: 12,
              lineHeight: 1.6,
              minHeight: 320,
            }}
          >
            {srtResult ? (
              <div>{renderSrtHighlighted(srtResult)}</div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center" style={{ color: '#475569' }}>
                <Sparkles className="w-10 h-10 opacity-20" />
                <p className="text-sm">Khmer translation will appear here</p>
                <p className="text-xs opacity-70">Syntax-highlighted SRT output</p>
              </div>
            )}
          </div>

          {/* Editable raw SRT */}
          {srtResult && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="px-3 py-1.5 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">RAW SRT EDITOR</span>
                <span className="text-[10px] text-slate-500">{parsedSegments.length} CUES</span>
              </div>
              <textarea
                value={srtResult}
                onChange={(e) => setSrtResult(e.target.value)}
                className="w-full p-3 text-xs text-slate-600 dark:text-slate-300 outline-none resize-none"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  fontFamily: 'monospace',
                  lineHeight: '1.6',
                  maxHeight: 140,
                }}
                rows={6}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── AI TRANSLATE BUTTON ── */}
      <div className="flex justify-center">
        <button
          onClick={onExpertTranslate}
          disabled={isLoading || (!sourceText.trim() && segments.length === 0)}
          className="relative flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-extrabold text-sm text-slate-800 dark:text-white transition-all overflow-hidden cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={
            isLoading
              ? { ...shimmerStyle, animation: 'shimmer 1.8s ease-in-out infinite', minWidth: 320, animationName: 'shimmer pulseGlow' }
              : {
                  background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 60%, #6366f1 100%)',
                  boxShadow: '0 0 24px rgba(124,58,237,0.5)',
                  minWidth: 320,
                }
          }
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>AI Magic Translating… Expert 6-Rules Engine</span>
              <span className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.4s ease-in-out infinite',
              }} />
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>✨ AI Magic Translate</span>
              <span className="text-purple-300 text-xs font-normal ml-1">Expert Dubbing Engine</span>
            </>
          )}
        </button>
      </div>

      {/* ── RESULT SEGMENTS CARD LIST ── */}
      {parsedSegments.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden flex flex-col"
          style={{ border: '1px solid rgba(52,211,153,0.2)' }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{
              background: 'linear-gradient(135deg, rgba(5,150,105,0.12) 0%, rgba(13,148,136,0.08) 100%)',
              borderBottom: '1px solid rgba(52,211,153,0.15)',
            }}
          >
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-2">
              <Film className="w-4 h-4" />
              Translated Segments ({parsedSegments.length})
            </span>
            {onApplySegments && (
              <button
                onClick={onApplyToStudio}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                  boxShadow: '0 0 14px rgba(5,150,105,0.35)',
                  color: '#fff',
                }}
              >
                <Send className="w-3.5 h-3.5" />
                Apply to Timeline
              </button>
            )}
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 360, background: '#070a0f' }}>
            {parsedSegments.map((seg, idx) => (
              <div
                key={idx}
                className="flex gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                <span
                  className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
                >
                  {idx + 1}
                </span>
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <span className="text-[10px] font-mono" style={{ color: '#38bdf8' }}>
                    {seg.start_time !== undefined
                      ? `${String(Math.floor((seg.start_time || 0) / 3600)).padStart(2, '0')}:${String(Math.floor(((seg.start_time || 0) % 3600) / 60)).padStart(2, '0')}:${String(Math.floor((seg.start_time || 0) % 60)).padStart(2, '0')},000 --> ${String(Math.floor((seg.end_time || 0) / 3600)).padStart(2, '0')}:${String(Math.floor(((seg.end_time || 0) % 3600) / 60)).padStart(2, '0')}:${String(Math.floor((seg.end_time || 0) % 60)).padStart(2, '0')},000`
                      : 'timecode'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{seg.chinese_text || '—'}</span>
                    <span className="text-xs font-medium truncate" style={{ color: '#c4b5fd' }}>
                      {seg.khmer_translation || '—'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FLOATING ACTION BAR ── */}
      {srtResult && (
        <div
          className="sticky bottom-4 flex items-center justify-center gap-2 flex-wrap z-10"
        >
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl flex-wrap"
            style={{
              background: 'rgba(13,17,32,0.92)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            <span className="text-[10px] text-slate-500 mr-1">Actions:</span>
            <ActionBtn icon={<Copy className="w-3.5 h-3.5" />} label="Copy SRT" onClick={onCopySrt} color="amber" />
            <ActionBtn icon={<FileText className="w-3.5 h-3.5" />} label="Copy KH only" onClick={onCopyKhOnly} color="purple" />
            <ActionBtn icon={<Send className="w-3.5 h-3.5" />} label="Apply to Timeline" onClick={onApplyToStudio} color="emerald" />
            <ActionBtn icon={<Download className="w-3.5 h-3.5" />} label="Export .SRT" onClick={onDownloadSrt} color="sky" />
          </div>
        </div>
      )}

      {/* ── VOICE CONSISTENCY BADGE ── */}
      <div
        className="flex items-center gap-2 p-3 rounded-xl text-[11px]"
        style={{
          background: 'rgba(88,28,220,0.08)',
          border: '1px solid rgba(168,85,247,0.18)',
          color: '#c4b5fd',
        }}
      >
        <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
        <span>
          <strong className="text-purple-300">ONE CHARACTER · ONE VOICE guarantee:</strong>{' '}
          Every translated line maintains consistent character identity and speaking register.
          No mid-story voice switching.
        </span>
      </div>
    </>
  );
};

/* ── Floating Action Button ── */
const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  amber:   { bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.25)',   text: '#fbbf24' },
  purple:  { bg: 'rgba(168,85,247,0.1)',   border: 'rgba(168,85,247,0.25)',   text: '#c084fc' },
  emerald: { bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.25)',   text: '#34d399' },
  sky:     { bg: 'rgba(56,189,248,0.1)',   border: 'rgba(56,189,248,0.25)',   text: '#38bdf8' },
};

const ActionBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}> = ({ icon, label, onClick, color }) => {
  const c = colorMap[color] || colorMap.sky;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.03] cursor-pointer"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
    >
      {icon}
      {label}
    </button>
  );
};

/* ════════════════════════════════════════
    QUICK TRANSLATE MODE COMPONENT
════════════════════════════════════════ */
interface QuickModeProps {
  quickSource: string;
  setQuickSource: (v: string) => void;
  quickTarget: string;
  setQuickTarget: (v: string) => void;
  quickLoading: boolean;
  quickCopied: boolean;
  setQuickCopied: (v: boolean) => void;
  sourceLang: string;
  setSourceLang: (v: string) => void;
  onQuickTranslate: () => void;
  onSwap: () => void;
  onInsertParticle: (p: string) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const QuickMode: React.FC<QuickModeProps> = ({
  quickSource, setQuickSource,
  quickTarget, setQuickTarget,
  quickLoading, quickCopied, setQuickCopied,
  sourceLang, setSourceLang,
  onQuickTranslate, onSwap, onInsertParticle, onShowToast,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Lang selectors row */}
      <div className="flex items-center justify-center gap-3">
        <LangSelector value={sourceLang} onChange={setSourceLang} />
        <button
          onClick={onSwap}
          className="p-2 rounded-xl transition-all hover:scale-110 cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
          style={{
            background: 'rgba(168,85,247,0.12)',
            border: '1px solid rgba(168,85,247,0.25)',
            color: '#c084fc',
          }}
        >
          🇰🇭 Khmer (KM)
        </div>
      </div>

      {/* Side-by-side textareas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ minHeight: 360 }}>
        {/* Source */}
        <div
          className="rounded-2xl flex flex-col overflow-hidden"
          style={{ background: '#0d1120', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
          >
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-sky-400" />
              {LANGUAGE_OPTIONS.find((l) => l.code === sourceLang)?.flag}{' '}
              {LANGUAGE_OPTIONS.find((l) => l.code === sourceLang)?.label}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{sourceLang.toUpperCase()}</span>
          </div>
          <textarea
            value={quickSource}
            onChange={(e) => setQuickSource(e.target.value)}
            placeholder="Paste or type source text here…"
            className="flex-1 w-full p-4 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-600 outline-none resize-none"
            style={{ background: 'transparent', lineHeight: 1.7, minHeight: 280 }}
          />
        </div>

        {/* Target */}
        <div
          className="rounded-2xl flex flex-col overflow-hidden"
          style={{ background: '#0d1120', border: '1px solid rgba(168,85,247,0.2)' }}
        >
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{
              borderBottom: '1px solid rgba(168,85,247,0.12)',
              background: 'rgba(168,85,247,0.04)',
            }}
          >
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              🇰🇭 Khmer Translation
            </span>
            {quickTarget && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(quickTarget);
                  setQuickCopied(true);
                  onShowToast('បានចម្លងអត្ថបទខ្មែរ!', 'success');
                  setTimeout(() => setQuickCopied(false), 2000);
                }}
                className="flex items-center gap-1 text-xs transition-colors cursor-pointer"
                style={{ color: quickCopied ? '#34d399' : '#38bdf8' }}
              >
                {quickCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {quickCopied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
          <textarea
            value={quickTarget}
            onChange={(e) => setQuickTarget(e.target.value)}
            placeholder="Khmer translation will appear here…"
            className="flex-1 w-full p-4 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-600 outline-none resize-none"
            style={{ background: 'transparent', lineHeight: 1.7, minHeight: 280 }}
          />

          {/* Per-particle quick-insert below output */}
          {quickTarget && (
            <div
              className="px-3 py-2 flex items-center gap-1 flex-wrap"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}
            >
              <span className="text-[10px] text-sky-600 dark:text-amber-400/70 mr-1">Insert:</span>
              {SPOKEN_PARTICLES.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setQuickTarget(quickTarget ? `${quickTarget} ${p}` : p);
                  }}
                  className="px-2 py-0.5 rounded-md text-[11px] transition-all hover:scale-105 cursor-pointer"
                  style={{
                    background: 'rgba(251,191,36,0.08)',
                    border: '1px solid rgba(251,191,36,0.15)',
                    color: '#fcd34d',
                  }}
                >
                  +{p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Translate Button */}
      <div className="flex justify-center">
        <button
          onClick={onQuickTranslate}
          disabled={quickLoading || !quickSource.trim()}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-sm text-slate-800 dark:text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-40"
          style={{
            background: quickLoading
              ? 'linear-gradient(90deg, #0ea5e9, #6366f1, #0ea5e9)'
              : 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
            backgroundSize: quickLoading ? '200% 100%' : '100% 100%',
            animation: quickLoading ? 'shimmer 1.4s ease-in-out infinite' : 'none',
            boxShadow: '0 0 20px rgba(14,165,233,0.35)',
          }}
        >
          {quickLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Translating…
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-amber-300" />
              Translate to Khmer
            </>
          )}
        </button>
      </div>
    </div>
  );
};

/* ── Language Selector ── */
const LangSelector: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const selected = LANGUAGE_OPTIONS.find((l) => l.code === value) || LANGUAGE_OPTIONS[0];
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none flex items-center gap-2 px-4 py-2 pr-7 rounded-xl text-xs font-bold cursor-pointer outline-none"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#e2e8f0',
        }}
      >
        {LANGUAGE_OPTIONS.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
        style={{ color: '#94a3b8' }}
      />
    </div>
  );
};
