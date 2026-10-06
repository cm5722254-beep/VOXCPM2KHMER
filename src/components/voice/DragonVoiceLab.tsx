import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Sparkles,
  Heart,
  Search,
  Wand2,
  Download,
  Loader2,
  RefreshCw,
  Music,
  AlertCircle,
  BarChart3,
  FolderOpen,
  X,
  FileAudio,
  CheckCircle2,
  Mic,
  Volume2,
  ChevronRight,
} from 'lucide-react';
import { CharacterVoice } from '../../types';
import { api } from '../../services/api';
import { DragonButton } from '../dragon/DragonButton';
import { DragonLoader } from '../dragon/DragonLoader';
import { DragonEmptyState } from '../dragon/DragonEmptyState';

export type VoiceCategory =
  | 'All'
  | 'Male'
  | 'Female'
  | 'Child'
  | 'Old'
  | 'Hero'
  | 'Villain'
  | 'Monster'
  | 'Dragon'
  | 'Anime'
  | 'Donghua'
  | 'Narrator'
  | 'Custom';

interface DragonVoiceLabProps {
  onSelectVoice?: (voice: CharacterVoice) => void;
  onApplyToTimeline?: (voice: CharacterVoice, sampleUrl?: string) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  characters?: CharacterVoice[];
}

interface ExtendedVoiceItem extends CharacterVoice {
  category: VoiceCategory;
  style: string;
  emotion: string;
  language: string;
  avatarEmoji: string;
  rating: number;
  isCustom?: boolean;
}

interface OutputFile {
  filename: string;
  size: number;
  formattedSize: string;
  type: 'audio' | 'video';
  created: number;
  url: string;
}

/** Detect category for auto-discovered voices */
function detectCategory(v: CharacterVoice): VoiceCategory {
  const lbl = (v.label || '').toLowerCase();
  const fn = (v.filename || '').toLowerCase();
  const combined = lbl + ' ' + fn + ' ' + (v.words || '').toLowerCase();
  if (fn.startsWith('custom_voice') || lbl.includes('clone')) return 'Custom';
  if (combined.includes('narrator') || combined.includes('សម្រាយ')) return 'Narrator';
  if (combined.includes('dragon') || combined.includes('monster') || combined.includes('villain')) return 'Villain';
  if (combined.includes('child') || combined.includes('ក្មេង')) return 'Child';
  if (combined.includes('elder') || combined.includes('old') || combined.includes('ចាស់')) return 'Old';
  if (combined.includes('anime')) return 'Anime';
  if (combined.includes('donghua')) return 'Donghua';
  if (v.gender === 'female') return 'Female';
  return 'Male';
}

function getAvatarEmoji(v: CharacterVoice): string {
  const fn = (v.filename || '').toLowerCase();
  if (fn.startsWith('custom_voice_vid')) return '🎭';
  if (fn.startsWith('custom_voice_')) return '🎙️';
  const g = v.gender;
  const lbl = (v.label || '').toLowerCase();
  if (lbl.includes('elder') || lbl.includes('master')) return g === 'female' ? '👵' : '👴';
  if (lbl.includes('child') || lbl.includes('kid')) return g === 'female' ? '👧' : '👦';
  if (lbl.includes('villain') || lbl.includes('dark')) return '😈';
  if (lbl.includes('dragon')) return '🐉';
  if (lbl.includes('narrator')) return '📖';
  return g === 'female' ? '👸' : '🧙';
}

function enrichVoice(v: CharacterVoice): ExtendedVoiceItem {
  const isCustom = (v.filename || '').startsWith('custom_voice');
  return {
    ...v,
    category: detectCategory(v),
    style: v.words || (isCustom ? 'Custom Clone Voice' : 'Neural Voice'),
    emotion: 'neutral',
    language: 'Khmer 🇰🇭',
    avatarEmoji: getAvatarEmoji(v),
    rating: isCustom ? 5 : 4,
    isCustom,
  };
}

function formatDate(ts: number) {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('km-KH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Output File Picker Modal ─────────────────────────────────────────
const OutputPickerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: OutputFile) => void;
  onShowToast: (msg: string, type: any) => void;
}> = ({ isOpen, onClose, onSelect, onShowToast }) => {
  const [files, setFiles] = useState<OutputFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getOutputsList();
      setFiles(res.files || []);
    } catch (e: any) {
      onShowToast(`❌ ទាញ outputs បរាជ័យ: ${e.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    if (isOpen) {
      loadFiles();
      setSearch('');
    }
    return () => {
      audioRef.current?.pause();
    };
  }, [isOpen, loadFiles]);

  const handlePreview = (file: OutputFile, e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; audioRef.current = null; }
    if (playingUrl === file.url) { setPlayingUrl(null); return; }
    const audio = new Audio(file.url);
    audioRef.current = audio;
    audio.addEventListener('ended', () => setPlayingUrl(null));
    audio.addEventListener('error', () => { setPlayingUrl(null); onShowToast('❌ ចាក់ audio មិនបាន', 'error'); });
    audio.play().then(() => setPlayingUrl(file.url)).catch(() => {
      setPlayingUrl(null);
      onShowToast('❌ ចាក់ audio មិនបាន', 'error');
    });
  };

  const filtered = files.filter((f) =>
    !search || f.filename.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-xl bg-white dark:bg-[#0B111C] border border-slate-200 dark:border-[#203244] rounded-2xl shadow-2xl overflow-hidden font-khmer animate-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-[#203244] flex items-center justify-between bg-white dark:bg-[#101925]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#F59E0B] to-[#DC2626] flex items-center justify-center shadow-md">
              <FolderOpen className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white">ជ្រើសរើស Audio ពី Outputs</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                ជ្រើស MP3/WAV ដែល Dub រួចមកប្រើជា Reference Voice
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search + Refresh */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-[#203244] flex gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ស្វែងរក filename..."
              className="w-full bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] text-xs text-slate-800 dark:text-white rounded-xl pl-8 pr-3 py-2 outline-none focus:border-[#F59E0B]"
            />
          </div>
          <button
            onClick={loadFiles}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] text-slate-500 hover:text-[#F59E0B] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* File List */}
        <div className="overflow-y-auto max-h-[400px] p-3 space-y-1.5 scrollbar-thin">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-sm text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin text-[#F59E0B]" />
              <span>កំពុងទាញ outputs...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              <FileAudio className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
              {search ? 'រកមិនឃើញ file ត្រូវ' : 'មិនទាន់មី Audio ក្នុង outputs folder'}
            </div>
          ) : (
            filtered.map((file) => {
              const isPlaying = playingUrl === file.url;
              const isAudio = file.type === 'audio';
              return (
                <div
                  key={file.filename}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] hover:border-[#F59E0B]/60 dark:hover:border-[#F59E0B]/40 hover:bg-amber-50 dark:hover:bg-[#1a1f2e] transition-all cursor-pointer group"
                  onClick={() => { onSelect(file); onClose(); }}
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg ${
                    isAudio ? 'bg-[#F59E0B]/10 border border-[#F59E0B]/30' : 'bg-[#DC2626]/10 border border-[#DC2626]/30'
                  }`}>
                    {isAudio ? '🎵' : '🎬'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{file.filename}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                      <span className={`px-1.5 py-0 rounded font-bold ${isAudio ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-[#DC2626]/10 text-[#DC2626]'}`}>
                        {file.type.toUpperCase()}
                      </span>
                      <span>{file.formattedSize}</span>
                      <span>·</span>
                      <span>{formatDate(file.created)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Preview (audio only) */}
                    {isAudio && (
                      <button
                        type="button"
                        onClick={(e) => handlePreview(file, e)}
                        className={`p-1.5 rounded-lg border text-xs transition-all ${
                          isPlaying
                            ? 'bg-[#F59E0B] border-[#F59E0B] text-slate-900'
                            : 'bg-white dark:bg-[#152235] border-slate-200 dark:border-[#203244] text-slate-600 dark:text-slate-300 hover:text-[#F59E0B]'
                        }`}
                        title="Preview"
                      >
                        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </button>
                    )}

                    {/* Select */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onSelect(file); onClose(); }}
                      className="p-1.5 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/40 text-[#F59E0B] hover:bg-[#F59E0B] hover:text-slate-900 transition-all text-xs font-bold"
                      title="ជ្រើសរើស"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-[#203244] flex items-center justify-between text-[10px] text-slate-500">
          <span>{filtered.length} files</span>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#152235] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#203244] transition-colors text-xs">
            បិទ
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// Main DragonVoiceLab Component
// ─────────────────────────────────────────────────────────────────────
export const DragonVoiceLab: React.FC<DragonVoiceLabProps> = ({
  onSelectVoice,
  onApplyToTimeline,
  onShowToast,
  characters = [],
}) => {
  const [selectedCategory, setSelectedCategory] = useState<VoiceCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Voice catalog state
  const [voiceCatalog, setVoiceCatalog] = useState<ExtendedVoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [voiceStats, setVoiceStats] = useState({ total: 0, male: 0, female: 0, custom: 0 });

  // Synthesis state
  const [selectedVoice, setSelectedVoice] = useState<ExtendedVoiceItem | null>(null);
  const [synthesisText, setSynthesisText] = useState('ទោះបីជាមេឃដួលរលំ ក៏បងមិនព្រមចាកចេញពីអូនដែរ!');
  const [selectedEmotion, setSelectedEmotion] = useState('heroic');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);

  // Output picker — "ជ្រើសរើសលុច"
  const [isOutputPickerOpen, setIsOutputPickerOpen] = useState(false);
  // Custom reference audio selected from outputs (overrides voice previewUrl for synthesis)
  const [customRefAudio, setCustomRefAudio] = useState<OutputFile | null>(null);

  const categories: VoiceCategory[] = [
    'All', 'Custom', 'Male', 'Female', 'Child', 'Old', 'Hero', 'Villain', 'Narrator', 'Anime', 'Donghua',
  ];

  // ── Load voices ──────────────────────────────────────────────────
  const loadVoices = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setLoadError(null);
    try {
      const res = await api.getCharacters();
      const raw: CharacterVoice[] = res?.characters || [];
      const enriched = raw.map(enrichVoice);
      enriched.sort((a, b) => {
        if (a.isCustom && !b.isCustom) return -1;
        if (!a.isCustom && b.isCustom) return 1;
        return (a.label || '').localeCompare(b.label || '');
      });
      setVoiceCatalog(enriched);
      setLastRefreshed(new Date());
      const custom = enriched.filter((v) => v.isCustom).length;
      const male = enriched.filter((v) => v.gender === 'male').length;
      const female = enriched.filter((v) => v.gender === 'female').length;
      setVoiceStats({ total: enriched.length, male, female, custom });
      if (!selectedVoice && enriched.length > 0) {
        setSelectedVoice(enriched.find((v) => v.isCustom) || enriched[0]);
      }
    } catch (e: any) {
      setLoadError(e.message || 'Failed to load voices');
      if (!silent) onShowToast(`❌ ទាញ Voices បរាជ័យ: ${e.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [onShowToast, selectedVoice]);

  useEffect(() => { loadVoices(); }, []);
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  // ── Filtering ────────────────────────────────────────────────────
  const filteredVoices = voiceCatalog.filter((v) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      v.category === selectedCategory ||
      (selectedCategory === 'Male' && v.gender === 'male' && !v.isCustom) ||
      (selectedCategory === 'Female' && v.gender === 'female' && !v.isCustom) ||
      (selectedCategory === 'Custom' && v.isCustom);
    const q = searchQuery.toLowerCase();
    return matchesCategory && (
      !q ||
      (v.label || '').toLowerCase().includes(q) ||
      (v.filename || '').toLowerCase().includes(q) ||
      (v.words || '').toLowerCase().includes(q)
    );
  });

  // ── Audio Playback ───────────────────────────────────────────────
  const handlePlayVoice = (voice: ExtendedVoiceItem, e?: React.MouseEvent) => {
    e?.stopPropagation();

    // Stop & cleanup previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.src = '';
      audioRef.current = null;
    }

    // Toggle off if same voice
    if (playingVoiceId === voice.id) {
      setPlayingVoiceId(null);
      return;
    }

    if (!voice.previewUrl) {
      onShowToast(`⚠️ "${voice.label}" មិនមាន audio file`, 'warning');
      return;
    }

    // Build URL — strip origin for same-origin requests (avoid CORS issues)
    let url = voice.previewUrl;
    if (!url.startsWith('http')) {
      // Relative path — use as-is; browser resolves against current origin
      url = voice.isCustom ? `${url}?t=${Date.now()}` : url;
    }

    const audio = new Audio(url);
    // NO crossOrigin — causes CORS preflight failures on local FastAPI
    audioRef.current = audio;

    audio.onended = () => setPlayingVoiceId(null);

    audio.onerror = (ev) => {
      setPlayingVoiceId(null);
      const err = (ev as any)?.target?.error;
      const code = err?.code ?? 0;
      const msgs: Record<number, string> = {
        1: 'បានបោះបង់ (ABORT)',
        2: 'Network error',
        3: 'Decode error — format មិនត្រូវ',
        4: `"${voice.filename}" រកមិនឃើញ`,
      };
      onShowToast(`❌ ${msgs[code] ?? `"${voice.filename}" play មិនបាន`}`, 'error');
    };

    // Direct play — most reliable method
    audio.play().then(() => {
      setPlayingVoiceId(voice.id);
    }).catch((err: Error) => {
      setPlayingVoiceId(null);
      // NotAllowedError = browser autoplay policy (rare on click)
      if (err.name === 'NotAllowedError') {
        onShowToast('⚠️ Browser blocked autoplay — ចុចម្ដងទៀត', 'warning');
      } else if (err.name === 'NotSupportedError') {
        onShowToast(`❌ Format "${voice.filename}" មិនគាំទ្រ`, 'error');
      } else {
        onShowToast(`❌ "${voice.filename}" play error: ${err.message}`, 'error');
      }
    });
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
    onShowToast('បានកែប្រែ Favorites', 'success');
  };

  // ── Synthesize ───────────────────────────────────────────────────
  const handleSynthesize = async () => {
    if (!selectedVoice) return;
    setIsGenerating(true);
    setGeneratedAudioUrl(null);
    onShowToast(`⏳ កំពុងបង្កើតសំឡេង...`, 'info');
    try {
      const body: any = {
        voiceId: selectedVoice.id,
        text: synthesisText,
        emotion: selectedEmotion,
        gender: selectedVoice.gender,
      };
      // If user picked a custom output ref audio, pass it
      if (customRefAudio) {
        body.referenceAudio = customRefAudio.filename;
      }
      const res = await api.characterSpeak(body);
      if (res?.success && res?.audioUrl) {
        setGeneratedAudioUrl(res.audioUrl);
        onShowToast('🎉 បង្កើតសំឡេង AI ជោគជ័យ!', 'success');
        new Audio(res.audioUrl).play().catch(() => {});
      } else {
        throw new Error('Server មិនបានបញ្ជូន audioUrl');
      }
    } catch (e: any) {
      onShowToast(`❌ ${e.message}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const getVoiceBadgeColor = (cat: VoiceCategory) => {
    switch (cat) {
      case 'Custom': return 'bg-[#16D9FF]/15 text-[#16D9FF] border-[#16D9FF]/40';
      case 'Female': return 'bg-pink-500/15 text-pink-400 border-pink-500/40';
      case 'Villain': return 'bg-red-600/15 text-red-400 border-red-600/40';
      case 'Narrator': return 'bg-amber-500/15 text-amber-400 border-amber-500/40';
      default: return 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20';
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#070A12] text-slate-800 dark:text-slate-100 overflow-hidden font-khmer">

        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-[#203244] bg-gradient-to-r from-slate-50 dark:from-[#0B111C] via-slate-100 dark:via-[#101925] to-slate-50 dark:to-[#0B111C] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF3333] via-[#DC2626] to-[#F59E0B] p-[1.5px] shadow-[0_0_24px_rgba(220,38,38,0.4)]">
              <div className="w-full h-full bg-white dark:bg-[#0A0F1D] rounded-[14px] flex items-center justify-center">
                <img src="/dragon_logo.png" alt="Dragon" className="w-full h-full object-cover rounded-xl" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-800 dark:text-white font-ui tracking-wide">DRAGON VOICE LAB</h2>
                <span className="px-2 py-0.5 rounded-full bg-[#DC2626]/15 border border-[#DC2626]/40 text-[#DC2626] text-[10px] font-mono font-bold">
                  {voiceStats.total > 0 ? `${voiceStats.total} VOICES` : 'NEURAL VOICES'}
                </span>
                {voiceStats.custom > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#16D9FF]/15 border border-[#16D9FF]/40 text-[#16D9FF] text-[10px] font-mono font-bold">
                    🎭 {voiceStats.custom} CLONED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                បណ្ណាល័យសំឡេង AI ខ្មែរ · Clone Voices · Anime · Donghua · ភាពយន្ត
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ស្វែងរកសំឡេង..."
                className="w-full bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] focus:border-red-500 text-xs text-slate-800 dark:text-white rounded-xl pl-9 pr-3 py-2 outline-none transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={() => loadVoices()}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] hover:border-red-500 text-slate-500 dark:text-slate-400 hover:text-[#DC2626] transition-all"
              title="Refresh voices"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Stats Bar ── */}
        {voiceStats.total > 0 && (
          <div className="px-6 py-2 border-b border-slate-200 dark:border-[#203244]/50 bg-white dark:bg-[#0B111C]/80 flex items-center gap-5 text-xs shrink-0">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>ទាំងអស់:</span><span className="font-bold text-[#16D9FF]">{voiceStats.total}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <span>♂</span><span className="font-bold text-blue-400">{voiceStats.male}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <span>♀</span><span className="font-bold text-pink-400">{voiceStats.female}</span>
            </div>
            {voiceStats.custom > 0 && (
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <span>🎭</span><span className="font-bold text-[#16D9FF]">{voiceStats.custom}</span>
              </div>
            )}
            {lastRefreshed && (
              <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-600">
                {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
          </div>
        )}

        {/* ── Main Layout ── */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

          {/* Left: Category + Cards */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200 dark:border-[#203244]">

            {/* Category Pills */}
            <div className="px-6 py-3 border-b border-slate-200 dark:border-[#203244] bg-white dark:bg-[#0B111C]/60 flex items-center gap-2 overflow-x-auto scrollbar-thin shrink-0">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                const count = cat === 'All' ? voiceCatalog.length
                  : cat === 'Custom' ? voiceCatalog.filter((v) => v.isCustom).length
                  : cat === 'Male' ? voiceCatalog.filter((v) => v.gender === 'male' && !v.isCustom).length
                  : cat === 'Female' ? voiceCatalog.filter((v) => v.gender === 'female' && !v.isCustom).length
                  : voiceCatalog.filter((v) => v.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 select-none flex items-center gap-1 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#DC2626] to-[#F59E0B] text-white shadow-[0_0_16px_rgba(220,38,38,0.4)]'
                        : 'bg-white dark:bg-[#101925] hover:bg-slate-100 dark:hover:bg-[#152235] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#203244]'
                    }`}
                  >
                    {cat === 'All' ? '🌟 ទាំងអស់' : cat === 'Custom' ? '🎭 Clone' : cat}
                    {count > 0 && (
                      <span className={`px-1 rounded text-[9px] font-mono ${isActive ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Cards Grid */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <DragonLoader message="កំពុងទាញ Voices..." subMessage="Loading from API" progress={60} />
                </div>
              ) : loadError ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                  <p className="text-sm font-bold text-red-500">{loadError}</p>
                  <DragonButton variant="energy" size="sm" onClick={() => loadVoices()} icon={<RefreshCw className="w-3.5 h-3.5" />}>
                    សាកជាថ្មី
                  </DragonButton>
                </div>
              ) : filteredVoices.length === 0 ? (
                <DragonEmptyState type="search" title="រកមិនឃើញ" description="សូមជ្រើស Category ផ្សេង" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredVoices.map((voice) => {
                    const isSelected = selectedVoice?.id === voice.id;
                    const isPlaying = playingVoiceId === voice.id;
                    const isFav = Boolean(favorites[voice.id]);
                    const hasAudio = Boolean(voice.previewUrl && voice.exists !== false);

                    return (
                      <div
                        key={voice.id}
                        onClick={() => setSelectedVoice(voice)}
                        className={`relative rounded-2xl p-4 transition-all duration-200 cursor-pointer border ${
                          isSelected
                            ? 'bg-slate-100 dark:bg-[#152235] border-red-500 dark:border-[#DC2626] shadow-[0_0_20px_rgba(220,38,38,0.2)]'
                            : 'bg-white dark:bg-[#101925] hover:bg-slate-50 dark:hover:bg-[#152235] border-slate-200 dark:border-[#203244] hover:border-slate-400 shadow-sm hover:shadow-md'
                        }`}
                      >
                        {voice.isCustom && (
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-[#16D9FF]/10 border border-[#16D9FF]/30 text-[#16D9FF] text-[9px] font-bold">CLONED</div>
                        )}

                        <div className="flex items-start gap-2.5 pr-10">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-2xl shadow-inner border ${
                            voice.isCustom ? 'bg-gradient-to-br from-[#16D9FF]/20 to-[#0B111C] border-[#16D9FF]/30' : 'bg-gradient-to-b from-[#1C2C42] to-[#0E1724] border-[#203244]'
                          }`}>
                            {voice.avatarEmoji}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate leading-tight">{voice.label}</h4>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className={`px-1.5 py-0 rounded text-[9px] font-bold border ${getVoiceBadgeColor(voice.category)}`}>{voice.category}</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">{voice.gender === 'female' ? '♀ ស្រី' : '♂ ប្រុស'}</span>
                              {!hasAudio && <span className="text-[9px] text-red-400 flex items-center gap-0.5"><AlertCircle className="w-2.5 h-2.5" />No Audio</span>}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(voice.id, e)}
                          className={`absolute top-3 left-3 p-1 rounded-lg transition-colors ${isFav ? 'text-rose-400' : 'text-slate-400 hover:text-slate-500 dark:hover:text-slate-300'}`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-400' : ''}`} />
                        </button>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-1">{voice.filename}</p>

                        <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-[#203244]/60 flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-[1.5px] h-5 px-1.5 bg-white dark:bg-[#0B111C] rounded-lg border border-slate-200 dark:border-[#203244]/50 overflow-hidden">
                            {Array.from({ length: 28 }).map((_, i) => (
                              <div key={i}
                                className={`w-[2px] rounded-full transition-all duration-100 ${isPlaying ? (voice.isCustom ? 'bg-[#16D9FF]' : 'bg-[#DC2626]') : 'bg-slate-200 dark:bg-[#203244]'}`}
                                style={{ height: `${20 + Math.abs(Math.sin(i * 0.5 + voice.id.length * 0.1)) * 55}%` }}
                              />
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handlePlayVoice(voice, e)}
                            disabled={!hasAudio}
                            className={`p-2 rounded-xl border transition-all ${
                              !hasAudio ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500'
                              : isPlaying ? 'bg-[#F59E0B] text-slate-900 border-[#F59E0B] shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                              : 'bg-white dark:bg-[#152235] text-slate-700 dark:text-white hover:text-[#DC2626] border-slate-200 dark:border-[#203244] hover:border-[#DC2626]/50'
                            }`}
                          >
                            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                          <DragonButton
                            variant="energy"
                            size="xs"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              onSelectVoice?.(voice);
                              onApplyToTimeline?.(voice, voice.previewUrl || undefined);
                              onShowToast(`✅ បានជ្រើស: ${voice.label}`, 'success');
                            }}
                          >
                            Use
                          </DragonButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Synthesis Studio */}
          <div className="w-full lg:w-96 p-5 bg-white dark:bg-[#0B111C] flex flex-col gap-4 overflow-y-auto scrollbar-thin shrink-0 border-t lg:border-t-0 border-slate-200 dark:border-[#203244]">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-[#203244]">
              <Sparkles className="w-5 h-5 text-[#DC2626]" />
              <h3 className="text-sm font-black text-slate-800 dark:text-white font-ui uppercase tracking-wide">SYNTHESIS STUDIO</h3>
            </div>

            {selectedVoice ? (
              <div className="flex flex-col gap-4">
                {/* Selected Voice Banner */}
                <div className="p-3 rounded-2xl bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-md shrink-0 ${
                    selectedVoice.isCustom ? 'bg-gradient-to-tr from-[#16D9FF]/30 to-[#0B111C] border border-[#16D9FF]/40' : 'bg-gradient-to-tr from-[#DC2626] to-[#F59E0B]'
                  }`}>
                    {selectedVoice.avatarEmoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800 dark:text-white truncate">{selectedVoice.label}</div>
                    <div className="text-[10px] text-[#F59E0B] mt-0.5 truncate">{selectedVoice.filename}</div>
                  </div>
                  {selectedVoice.previewUrl && (
                    <button
                      type="button"
                      onClick={() => handlePlayVoice(selectedVoice)}
                      className="p-1.5 rounded-lg bg-white dark:bg-[#152235] border border-slate-200 dark:border-[#203244] text-[#DC2626] hover:bg-red-50 dark:hover:bg-[#1e3045] transition-colors shrink-0"
                    >
                      {playingVoiceId === selectedVoice.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* ── ជ្រើសរើសលុច Button ── */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-[#F59E0B]" />
                    Reference Voice (ជ្រើសរើសលុច)
                  </label>

                  {/* Current ref audio display */}
                  {customRefAudio ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/40">
                      <span className="text-base">🎵</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#F59E0B] truncate">{customRefAudio.filename}</p>
                        <p className="text-[10px] text-slate-500">{customRefAudio.formattedSize}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCustomRefAudio(null)}
                        className="p-1 rounded-lg hover:bg-[#F59E0B]/20 text-slate-500 hover:text-red-500 transition-colors shrink-0"
                        title="ដកចេញ"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                      ប្រើ Voice ដែលបានជ្រើសសំរាប់ Reference (default)
                    </p>
                  )}

                  {/* Pick from outputs button */}
                  <button
                    type="button"
                    onClick={() => setIsOutputPickerOpen(true)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-[#101925] border-2 border-dashed border-[#F59E0B]/50 hover:border-[#F59E0B] hover:bg-[#F59E0B]/5 text-[#F59E0B] transition-all text-xs font-bold group"
                  >
                    <FolderOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>ជ្រើសរើសលុចពី Outputs</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-auto group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* Text Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    ឃ្លាសម្រាប់ Synthesize
                  </label>
                  <textarea
                    rows={3}
                    value={synthesisText}
                    onChange={(e) => setSynthesisText(e.target.value)}
                    className="bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] focus:border-[#DC2626] rounded-xl p-3 text-xs text-slate-800 dark:text-white outline-none leading-relaxed transition-colors resize-none"
                    placeholder="វាយបញ្ចូលឃ្លាខ្មែរ..."
                  />
                </div>

                {/* Emotion */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">ទឹកដម (Emotion)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'normal', label: 'ធម្មតា' },
                      { id: 'heroic', label: '⚔️ អង់អាច' },
                      { id: 'dramatic', label: '🎭 កម្សត់' },
                      { id: 'angry', label: '🔥 ខឹង' },
                      { id: 'whisper', label: '🤫 ខ្សឹប' },
                      { id: 'joyful', label: '😄 រីករាយ' },
                    ].map((em) => (
                      <button
                        key={em.id}
                        type="button"
                        onClick={() => setSelectedEmotion(em.id)}
                        className={`px-2 py-1.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                          selectedEmotion === em.id
                            ? 'bg-[#DC2626]/20 border-[#DC2626] text-[#DC2626]'
                            : 'bg-white dark:bg-[#101925] border-slate-200 dark:border-[#203244] text-slate-600 dark:text-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {em.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Speed & Pitch */}
                <div className="space-y-3 p-3 rounded-2xl bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244]">
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span>ល្បឿន (Speed)</span>
                      <span className="font-mono text-[#F59E0B] font-bold">{speed.toFixed(2)}x</span>
                    </div>
                    <input type="range" min="0.6" max="1.8" step="0.05" value={speed}
                      onChange={(e) => setSpeed(parseFloat(e.target.value))}
                      className="w-full accent-[#F59E0B] cursor-pointer" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span>Pitch</span>
                      <span className="font-mono text-[#F59E0B] font-bold">{pitch > 0 ? `+${pitch}` : pitch}</span>
                    </div>
                    <input type="range" min="-12" max="12" step="1" value={pitch}
                      onChange={(e) => setPitch(parseInt(e.target.value))}
                      className="w-full accent-[#F59E0B] cursor-pointer" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <DragonButton
                    variant="energy"
                    size="md"
                    onClick={handleSynthesize}
                    loading={isGenerating}
                    icon={<Wand2 className="w-4 h-4" />}
                  >
                    ✨ បង្កើតសំឡេង AI
                  </DragonButton>

                  {generatedAudioUrl && (
                    <div className="flex gap-2">
                      <DragonButton
                        variant="jade"
                        size="sm"
                        className="flex-1"
                        onClick={() => new Audio(generatedAudioUrl).play()}
                        icon={<Play className="w-3.5 h-3.5" />}
                      >
                        ស្តាប់ឡើងវិញ
                      </DragonButton>
                      <DragonButton
                        variant="panel"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          onApplyToTimeline?.(selectedVoice, generatedAudioUrl);
                          onShowToast('✅ Apply ទៅ Timeline!', 'success');
                        }}
                        icon={<CheckCircle2 className="w-3.5 h-3.5 text-[#F59E0B]" />}
                      >
                        Apply ទៅ Timeline
                      </DragonButton>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center py-10 text-center">
                <div>
                  <Music className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 dark:text-slate-600">ជ្រើស Voice ដើម្បី Synthesize</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Output Picker Modal ── */}
      <OutputPickerModal
        isOpen={isOutputPickerOpen}
        onClose={() => setIsOutputPickerOpen(false)}
        onSelect={(file) => {
          setCustomRefAudio(file);
          onShowToast(`✅ បានជ្រើស Reference: ${file.filename}`, 'success');
        }}
        onShowToast={onShowToast}
      />
    </>
  );
};
