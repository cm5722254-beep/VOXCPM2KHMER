import React, { useState, useRef, useEffect } from 'react';
import {
  PlusCircle,
  Search,
  Edit3,
  Sparkles,
  Trash2,
  CheckCircle2,
  Shield,
  Play,
  Pause,
  AlertTriangle,
  Cpu,
  Cloud,
  ExternalLink,
  X,
  Mic,
  Mic2,
  Users,
  Clock,
  BarChart3,
  ChevronRight,
  Scissors,
} from 'lucide-react';
import { CharacterVoice, User, StudioEngineOption } from '../../types';
import { VoiceExtractorModal } from '../modals/VoiceExtractorModal';

interface CharacterLibraryProps {
  characters: CharacterVoice[];
  isDarkMode?: boolean;
  onOpenAddModal: () => void;
  onOpenEditModal: (char: CharacterVoice) => void;
  onOpenAuditionModal: (char: CharacterVoice) => void;
  user?: User | null;
  onDeleteVoice?: (char: CharacterVoice) => void;
  onSelectVoice?: (char: CharacterVoice) => void;
  onAddCharacter?: (char: CharacterVoice) => void;
  selectedVoiceId?: string;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onOpenQuickVoxModal?: () => void;
  activeEngine?: StudioEngineOption;
  onSelectEngine?: (engine: StudioEngineOption) => void;
}

// ── Avatar colour palette keyed by first letter ──
const AVATAR_COLORS: Record<string, string> = {
  A: '#6366f1', B: '#8b5cf6', C: '#ec4899', D: '#f43f5e',
  E: '#f97316', F: '#eab308', G: '#22c55e', H: '#14b8a6',
  I: '#06b6d4', J: '#3b82f6', K: '#a855f7', L: '#d946ef',
  M: '#10b981', N: '#0ea5e9', O: '#f59e0b', P: '#84cc16',
  Q: '#ef4444', R: '#fb923c', S: '#34d399', T: '#38bdf8',
  U: '#818cf8', V: '#c084fc', W: '#fb7185', X: '#fdba74',
  Y: '#fde047', Z: '#86efac',
};
const getAvatarColor = (label: string) => {
  const letter = (label || 'A')[0].toUpperCase();
  return AVATAR_COLORS[letter] || '#6366f1';
};
const getInitials = (label: string) => {
  const parts = (label || '?').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (label || '?').slice(0, 2).toUpperCase();
};

export const CharacterLibrary: React.FC<CharacterLibraryProps> = ({
  characters = [],
  isDarkMode = true,
  onOpenAddModal,
  onOpenEditModal,
  onOpenAuditionModal,
  user,
  onDeleteVoice,
  onSelectVoice,
  onAddCharacter,
  selectedVoiceId,
  onShowToast,
  onOpenQuickVoxModal,
  activeEngine = 'voxcpm_computer',
  onSelectEngine,
}) => {
  const [isExtractorOpen, setIsExtractorOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  // Real-time theme mode observer (Dark / Light Mode)
  const [isLight, setIsLight] = useState<boolean>(() => {
    return typeof document !== 'undefined' && document.documentElement.classList.contains('light');
  });

  useEffect(() => {
    const updateTheme = () => {
      setIsLight(document.documentElement.classList.contains('light'));
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const isAdmin = user?.role === 'admin';

  // Derived stats
  const totalVoices = characters.length;
  const maleCount = characters.filter((c) => c.gender === 'male').length;
  const femaleCount = characters.filter((c) => c.gender === 'female').length;
  const malePct = totalVoices > 0 ? Math.round((maleCount / totalVoices) * 100) : 0;
  const femalePct = totalVoices > 0 ? Math.round((femaleCount / totalVoices) * 100) : 0;

  const recentVoices = recentIds
    .map((id) => characters.find((c) => c.id === id || c.filename === id))
    .filter(Boolean) as CharacterVoice[];

  // All voices accessible with search and gender filter
  const filtered = characters.filter((c) => {
    const matchSearch =
      (c.label || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.words || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.filename || '').toLowerCase().includes(search.toLowerCase());
    const matchGender = genderFilter === 'all' || c.gender === genderFilter;
    return matchSearch && matchGender;
  });

  // ── Handlers ──
  const handleDeleteConfirm = (char: CharacterVoice) => {
    if (onDeleteVoice) onDeleteVoice(char);
    onShowToast?.(`🗑️ បានលុបសំឡេង "${char.label}" ជោគជ័យ!`, 'success');
    setDeleteConfirmId(null);
  };

  const handleSelectVoice = (char: CharacterVoice) => {
    if (onSelectVoice) onSelectVoice(char);
    const id = char.id || char.filename;
    setRecentIds((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 5));
  };

  const handleSwitchOption = (opt: StudioEngineOption) => {
    if (onSelectEngine) onSelectEngine(opt);
    if (opt === 'voxcpm_computer') {
      onShowToast?.('🖥️ បានជ្រើសរើស Option 1: VOXCPM2 COMPUTER (Local PC RTX/CPU)', 'success');
    } else if (opt === 'voxcpm_claude') {
      onShowToast?.('☁️ បានជ្រើសរើស Option 2: VOXCPM2 CLOUD (Colab & Kaggle Free GPU)', 'success');
    }
  };

  // 100% Reliable Playback using DOM-attached audio element
  const handlePlayPreview = (e: React.MouseEvent, char: CharacterVoice) => {
    e.stopPropagation();
    const id = char.id || char.filename;

    if (playingId === id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingId(null);
      return;
    }

    const rawSrc =
      char.previewUrl ||
      (char as any).audioUrl ||
      (char.filename ? `/media/samples/${char.filename}` : '');

    if (!rawSrc) {
      onShowToast?.('⚠️ មិនមានឯកសារសំឡេងគំរូសម្រាប់តួអង្គនេះទេ', 'warning');
      return;
    }

    if (!audioRef.current) return;

    try {
      audioRef.current.pause();
      audioRef.current.src = rawSrc;
      audioRef.current.currentTime = 0;

      const promise = audioRef.current.play();
      if (promise !== undefined) {
        promise
          .then(() => {
            setPlayingId(id);
            onShowToast?.(`▶️ កំពុងចាក់សំឡេង: "${char.label}"`, 'info');
          })
          .catch((err) => {
            console.warn('Primary audio playback error:', err);
            // Fallback retry directly with /media/samples/filename
            if (char.filename && audioRef.current) {
              audioRef.current.src = `/media/samples/${char.filename}`;
              audioRef.current
                .play()
                .then(() => {
                  setPlayingId(id);
                })
                .catch((e2) => {
                  onShowToast?.(`⚠️ កំហុសចាក់សំឡេង: ${e2.message || 'File not found'}`, 'error');
                  setPlayingId(null);
                });
            } else {
              onShowToast?.(`⚠️ កំហុសចាក់សំឡេង: ${err.message}`, 'error');
              setPlayingId(null);
            }
          });
      }
    } catch (err: any) {
      onShowToast?.(`⚠️ កំហុស: ${err.message}`, 'error');
      setPlayingId(null);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  // ── Voice Card Sub-component with High Contrast Light & Dark Mode ──
  const VoiceCard = ({ char, compact = false }: { char: CharacterVoice; compact?: boolean }) => {
    const id = char.id || char.filename;
    const isSelected = selectedVoiceId === char.id || selectedVoiceId === char.filename;
    const isPlaying = playingId === id;
    const isPendingDelete = deleteConfirmId === id;
    const avatarColor = getAvatarColor(char.label || char.filename);
    const initials = getInitials(char.label || char.filename);
    const isMale = char.gender === 'male';

    if (compact) {
      // Compact card for Recently Used strip
      return (
        <div
          onClick={() => handleSelectVoice(char)}
          className={`relative shrink-0 flex flex-col items-center gap-2 cursor-pointer group p-2 rounded-2xl transition-all ${
            isLight
              ? 'hover:bg-slate-100 bg-white border border-slate-200 shadow-sm'
              : 'hover:bg-white/5 bg-transparent'
          }`}
          style={{ width: 84 }}
        >
          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm transition-transform group-hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${avatarColor}ee, ${avatarColor}99)`,
              boxShadow: isSelected ? `0 0 0 2px ${avatarColor}, 0 0 16px ${avatarColor}66` : 'none',
              border: `1.5px solid ${avatarColor}66`,
            }}
          >
            {initials}
            {isSelected && (
              <div
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: '#10b981' }}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
          <span
            className={`text-[11px] font-bold text-center leading-tight truncate w-full px-0.5 ${
              isLight ? 'text-slate-800' : 'text-zinc-200'
            }`}
          >
            {char.label || char.filename}
          </span>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{
              background: isMale ? '#3b82f622' : '#ec489922',
              color: isMale ? (isLight ? '#1d4ed8' : '#93c5fd') : isLight ? '#be185d' : '#f9a8d4',
              border: `1px solid ${isMale ? '#3b82f644' : '#ec489944'}`,
            }}
          >
            {isMale ? 'ប្រុស' : 'ស្រី'}
          </span>
        </div>
      );
    }

    return (
      <div
        key={id}
        onClick={() => handleSelectVoice(char)}
        className={`relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 group cursor-pointer active:scale-[0.99] ${
          isLight
            ? isSelected
              ? 'bg-gradient-to-b from-emerald-50/80 to-white border-2 border-emerald-500 shadow-xl shadow-emerald-500/10'
              : 'bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-400 shadow-sm hover:shadow-md'
            : isSelected
            ? 'bg-gradient-to-b from-[#052e1c] to-[#18181C] border-2 border-emerald-400 shadow-2xl shadow-emerald-500/20'
            : 'bg-[#18181C] hover:bg-[#1e1e24] border border-white/[0.08] hover:border-emerald-500/50 shadow-md'
        }`}
      >
        {/* Selected glow top bar */}
        {isSelected && (
          <div
            className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl z-10"
            style={{ background: 'linear-gradient(90deg, #34d399, #10b981, #059669)' }}
          />
        )}

        {/* Selected checkmark badge */}
        {isSelected && (
          <div
            className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center z-10"
            style={{ background: '#10b981', boxShadow: '0 0 10px #10b98188' }}
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        )}

        {/* DELETE CONFIRMATION OVERLAY */}
        {isPendingDelete && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 p-4 rounded-2xl"
            style={{ background: 'rgba(10,4,4,0.95)', backdropFilter: 'blur(6px)' }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: '#ef444422', border: '1.5px solid #ef444455' }}
            >
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white">លុបសំឡេងនេះ?</p>
              <p className="text-xs text-zinc-400 mt-1 leading-snug">
                "{char.label}" នឹងត្រូវបានលុបចោលជារៀងរហូត
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmId(null);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-300 transition-colors"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConfirm(char);
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all bg-gradient-to-r from-red-600 to-rose-600 shadow-md"
              >
                លុបភ្លាម
              </button>
            </div>
          </div>
        )}

        {/* Card top section: Avatar + Name + Gender */}
        <div className="flex items-start gap-3 p-4 pb-2">
          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md"
            style={{
              background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}99)`,
              border: `1.5px solid ${avatarColor}66`,
            }}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h4
              className={`text-sm font-black truncate leading-tight pr-6 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {char.label || char.filename}
            </h4>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {/* Gender badge */}
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: isMale ? '#3b82f622' : '#ec489922',
                  color: isMale ? (isLight ? '#1d4ed8' : '#93c5fd') : isLight ? '#be185d' : '#f9a8d4',
                  border: `1px solid ${isMale ? '#3b82f644' : '#ec489944'}`,
                }}
              >
                {isMale ? '♂ ប្រុស' : '♀ ស្រី'}
              </span>
              {/* Role key badge */}
              {char.role_key && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isLight
                      ? 'bg-slate-100 text-slate-700 border border-slate-200'
                      : 'bg-white/5 text-zinc-300 border border-white/10'
                  }`}
                >
                  {char.role_key}
                </span>
              )}
              {char.is_curated && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: '#f59e0b22', color: '#d97706', border: '1px solid #f59e0b44' }}
                >
                  ★ Curated
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sample words preview */}
        <div className="mx-4 mb-3">
          <p
            className={`text-xs leading-relaxed line-clamp-2 px-3 py-2 rounded-xl italic font-medium ${
              isLight
                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                : 'bg-black/30 text-slate-300 border border-white/5'
            }`}
          >
            "{char.words || 'សំឡេងគំរូក្នុងស្ទូឌីយោ'}"
          </p>
        </div>

        {/* Action buttons bar — Large, visible, highly clickable */}
        <div
          className={`flex items-center justify-between px-3 py-2.5 mt-auto border-t ${
            isLight ? 'border-slate-100 bg-slate-50/70' : 'border-white/5 bg-black/20'
          }`}
        >
          {/* Left: Play button */}
          <button
            type="button"
            onClick={(e) => handlePlayPreview(e, char)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
              isPlaying
                ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse'
                : isLight
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300'
                : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
            }`}
            title="ចុចដើម្បីស្តាប់សំឡេងគំរូ"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'បញ្ឈប់' : 'ស្តាប់'}</span>
          </button>

          {/* Right: Audition / Edit / Select / Delete */}
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {/* Audition Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenAuditionModal(char);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                isLight
                  ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30'
              }`}
              title="Audition — សាកល្បងឱ្យតួអង្គនិយាយ"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>សាក</span>
            </button>

            {/* Edit Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEditModal(char);
                onShowToast?.(`✏️ បើកផ្ទាំងកែប្រែ: "${char.label}"`, 'info');
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                isLight
                  ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200'
                  : 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30'
              }`}
              title="កែប្រែឈ្មោះ និងព័ត៌មានតួអង្គ"
            >
              <Edit3 className="w-3.5 h-3.5 text-sky-400" />
              <span>កែប្រែ</span>
            </button>

            {/* Admin Delete */}
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmId(id);
                }}
                className={`p-1.5 rounded-xl transition-all ${
                  isLight
                    ? 'hover:bg-red-50 text-red-500 border border-transparent hover:border-red-200'
                    : 'hover:bg-red-500/20 text-red-400 border border-transparent hover:border-red-500/30'
                }`}
                title="[Admin] លុបសំឡេង"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Select Button */}
            {onSelectVoice && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectVoice(char);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/30'
                    : isLight
                    ? 'bg-slate-200 text-slate-800 hover:bg-emerald-500 hover:text-white'
                    : 'bg-white/10 text-white hover:bg-emerald-500/80'
                }`}
              >
                {isSelected ? '✓ Active' : 'ជ្រើស'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`flex-1 overflow-y-auto flex flex-col select-none font-khmer transition-colors duration-200 ${
        isLight ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#0d0d10] text-slate-100'
      }`}
    >
      {/* ── Persistent DOM-attached Audio Element (Guarantees zero-block audio playback) ── */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingId(null)}
        onError={() => {
          onShowToast?.('⚠️ មិនអាចចាក់សំឡេងគំរូនេះបានទេ', 'error');
          setPlayingId(null);
        }}
        className="hidden"
        preload="auto"
      />

      {/* ════════════════════════════════════════
          1. HERO HEADER BANNER
      ════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden px-6 pt-6 pb-5 transition-colors border-b"
        style={{
          background: isLight
            ? 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 60%, #e2e8f0 100%)'
            : 'linear-gradient(135deg, #0f2027 0%, #1a1a2e 40%, #16213e 70%, #0f3460 100%)',
          borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.07)',
        }}
      >
        {/* Decorative orbs */}
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, #34d39918 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, #818cf818 0%, transparent 70%)' }}
        />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Title + stats */}
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #34d399, #059669)', boxShadow: '0 4px 14px #34d39944' }}
              >
                <Mic2 className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
              </div>
              <h1
                className="text-xl font-extrabold tracking-tight font-sans"
                style={{
                  background: isLight
                    ? 'linear-gradient(90deg, #059669, #4f46e5, #db2777)'
                    : 'linear-gradient(90deg, #34d399, #818cf8, #f9a8d4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                VOICE ACTOR LIBRARY
              </h1>
              {isAdmin && (
                <span
                  className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: '#f59e0b22', color: '#d97706', border: '1px solid #f59e0b44' }}
                >
                  <Shield style={{ width: 10, height: 10 }} />
                  ADMIN
                </span>
              )}
            </div>
            <p className={`text-xs mb-3 font-medium ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
              គ្រប់គ្រងសំឡេងតួអង្គខ្មែរ — AI Clone ផ្ទាល់ខ្លួន
            </p>

            {/* Quick stat pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{
                  background: isLight ? '#ecfdf5' : 'rgba(52,211,153,0.12)',
                  color: isLight ? '#059669' : '#34d399',
                  border: '1px solid rgba(52,211,153,0.3)',
                }}
              >
                <Users style={{ width: 12, height: 12 }} />
                {totalVoices} Voices
              </div>
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{
                  background: isLight ? '#eff6ff' : 'rgba(59,130,246,0.12)',
                  color: isLight ? '#1d4ed8' : '#93c5fd',
                  border: '1px solid rgba(59,130,246,0.3)',
                }}
              >
                <Mic style={{ width: 12, height: 12 }} />
                {maleCount} ប្រុស
              </div>
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{
                  background: isLight ? '#fdf2f8' : 'rgba(236,72,153,0.12)',
                  color: isLight ? '#be185d' : '#f9a8d4',
                  border: '1px solid rgba(236,72,153,0.3)',
                }}
              >
                <Mic style={{ width: 12, height: 12 }} />
                {femaleCount} ស្រី
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto shrink-0">
            {/* ✂️ AI Voice Extractor from Video/MP3 */}
            <button
              onClick={() => setIsExtractorOpen(true)}
              className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white transition-all bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 shadow-[0_4px_20px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_28px_rgba(99,102,241,0.55)] hover:-translate-y-0.5 active:translate-y-0 border border-white/20"
              title="កាត់យកសំឡេងតួអង្គពី Video ឬ MP3 ភ្លាមៗ (AI Vocal Extraction)"
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Scissors style={{ width: 12, height: 12 }} />
              </span>
              <span>✂️ កាត់សំឡេងពីវីដេអូ/MP3</span>
            </button>

            {/* Add Voice CTA */}
            <button
              onClick={onOpenAddModal}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white transition-all active:scale-95 shadow-md"
              style={{
                background: 'linear-gradient(135deg, #34d399, #059669)',
                boxShadow: '0 4px 20px rgba(52,211,153,0.35)',
              }}
            >
              <PlusCircle style={{ width: 15, height: 15 }} />
              <span>+ បន្ថែមសំឡេង</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex flex-col gap-5">
        {/* ════════════════════════════════════════
            2. ENGINE SELECTOR
        ════════════════════════════════════════ */}
        <div
          className={`rounded-2xl p-5 flex flex-col gap-4 border transition-colors ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#18181C] border-white/10'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse bg-emerald-500" />
              <h3 className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-slate-900' : 'text-white'}`}>
                ជម្រើសម៉ាស៊ីន Voice Cloning
              </h3>
            </div>
            <span
              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: '#34d39918', color: '#059669', border: '1px solid #34d39940' }}
            >
              2 OPTIONS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Option 1: Computer */}
            <div
              onClick={() => handleSwitchOption('voxcpm_computer')}
              className={`relative cursor-pointer rounded-xl p-4 flex flex-col gap-3 transition-all duration-200 overflow-hidden border ${
                activeEngine === 'voxcpm_computer'
                  ? isLight
                    ? 'bg-emerald-50/70 border-emerald-500 shadow-md ring-1 ring-emerald-500/40'
                    : 'bg-gradient-to-br from-[#052e1c] to-[#1a2e1c] border-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.15)]'
                  : isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  : 'bg-[#141417] border-white/5 hover:border-white/15'
              }`}
            >
              {activeEngine === 'voxcpm_computer' && (
                <div
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ background: 'linear-gradient(90deg, transparent, #34d399, transparent)' }}
                />
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      activeEngine === 'voxcpm_computer'
                        ? 'bg-emerald-500/20 border-emerald-500/40'
                        : isLight
                        ? 'bg-slate-200 border-slate-300'
                        : 'bg-[#1e293b] border-white/10'
                    }`}
                  >
                    <Cpu className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 block">
                      OPTION 1
                    </span>
                    <h4 className={`text-sm font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      VOXCPM2 COMPUTER
                    </h4>
                  </div>
                </div>
                {activeEngine === 'voxcpm_computer' && (
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: '#34d39922', color: '#059669', border: '1px solid #34d39944' }}
                  >
                    ACTIVE
                  </span>
                )}
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                🖥️ កុំព្យូទ័រផ្ទាល់ខ្លួន (RTX / CPU) — Offline 100% មិនបាច់ប្រើ Internet
              </p>
            </div>

            {/* Option 2: Cloud */}
            <div
              onClick={() => handleSwitchOption('voxcpm_claude')}
              className={`relative cursor-pointer rounded-xl p-4 flex flex-col gap-3 transition-all duration-200 overflow-hidden border ${
                activeEngine === 'voxcpm_claude'
                  ? isLight
                    ? 'bg-indigo-50/70 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                    : 'bg-gradient-to-br from-[#0f0c29] to-[#1a1a3e] border-indigo-400 shadow-[0_0_24px_rgba(129,140,248,0.15)]'
                  : isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  : 'bg-[#141417] border-white/5 hover:border-white/15'
              }`}
            >
              {activeEngine === 'voxcpm_claude' && (
                <div
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ background: 'linear-gradient(90deg, transparent, #818cf8, transparent)' }}
                />
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      activeEngine === 'voxcpm_claude'
                        ? 'bg-indigo-500/20 border-indigo-500/40'
                        : isLight
                        ? 'bg-slate-200 border-slate-300'
                        : 'bg-[#1e293b] border-white/10'
                    }`}
                  >
                    <Cloud className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 block">
                      OPTION 2
                    </span>
                    <h4 className={`text-sm font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      VOXCPM2 CLOUD
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {activeEngine === 'voxcpm_claude' && (
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: '#818cf822', color: '#4f46e5', border: '1px solid #818cf844' }}
                    >
                      ACTIVE
                    </span>
                  )}
                  {onOpenQuickVoxModal && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenQuickVoxModal();
                      }}
                      className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all bg-indigo-500/15 text-indigo-600 border border-indigo-500/30 hover:bg-indigo-500/25"
                      title="ភ្ជាប់ Cloud URL"
                    >
                      <ExternalLink style={{ width: 10, height: 10 }} />
                      URL
                    </button>
                  )}
                </div>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                ☁️ Google Colab / Kaggle T4 & A100 — Cloudflare Tunnel — Free GPU
              </p>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            3. RECENTLY USED
        ════════════════════════════════════════ */}
        {recentVoices.length > 0 && (
          <div
            className={`rounded-2xl p-4 flex flex-col gap-3 border transition-colors ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#18181C] border-white/10'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                សំឡេងប្រើថ្មីៗ (Recently Used)
              </h3>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {recentVoices.map((char) => (
                <VoiceCard key={char.id || char.filename} char={char} compact />
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            4. SEARCH & FILTER TOOLBAR
        ════════════════════════════════════════ */}
        <div className="flex flex-col gap-2.5">
          {/* Search input */}
          <div className="relative">
            <Search
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isLight ? 'text-slate-400' : 'text-zinc-500'
              }`}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ស្វែងរកឈ្មោះតួអង្គ ឬឃ្លានិយាយ..."
              className={`w-full outline-none text-sm rounded-full pl-11 pr-11 py-2.5 transition-all font-medium ${
                isLight
                  ? 'bg-white text-slate-900 placeholder-slate-400 border border-slate-300 focus:border-emerald-500 shadow-sm'
                  : 'bg-[#18181C] text-slate-100 placeholder-zinc-500 border border-white/10 focus:border-emerald-400'
              }`}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500"
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>

          {/* Filter pills & Quick Actions row */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              {(
                [
                  { key: 'all', label: `ទាំងអស់ (${totalVoices})`, color: '#10b981' },
                  { key: 'male', label: `♂ ប្រុស (${maleCount})`, color: '#3b82f6' },
                  { key: 'female', label: `♀ ស្រី (${femaleCount})`, color: '#ec4899' },
                ] as { key: 'all' | 'male' | 'female'; label: string; color: string }[]
              ).map(({ key, label, color }) => {
                const isActive = genderFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setGenderFilter(key)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm"
                    style={{
                      background: isActive
                        ? isLight
                          ? `${color}18`
                          : `${color}25`
                        : isLight
                        ? '#ffffff'
                        : 'rgba(255,255,255,0.04)',
                      color: isActive ? color : isLight ? '#475569' : '#94a3b8',
                      border: `1.5px solid ${isActive ? color : isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    {label}
                  </button>
                );
              })}

              {(search || genderFilter !== 'all') && (
                <span className={`text-xs font-medium ml-1 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                  {filtered.length} លទ្ធផល
                </span>
              )}
            </div>

            {/* Quick Action buttons right by search & filter */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsExtractorOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                  isLight
                    ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
                    : 'text-cyan-300 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30'
                }`}
                title="កាត់យកសំឡេងពីវីដេអូ ឬ MP3"
              >
                <Scissors style={{ width: 13, height: 13 }} />
                <span>✂️ កាត់សំឡេងពីវីដេអូ/MP3</span>
              </button>
              {onOpenAddModal && (
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 transition-all shadow-sm active:scale-95"
                >
                  <PlusCircle style={{ width: 13, height: 13 }} />
                  <span>+ បន្ថែមសំឡេង</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            5. VOICE CARDS GRID
        ════════════════════════════════════════ */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((char) => (
              <VoiceCard key={char.id || char.filename} char={char} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div
            className={`flex flex-col items-center justify-center py-16 px-6 rounded-2xl text-center border-2 border-dashed ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#18181C] border-white/10'
            }`}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, #34d39922, #818cf822)',
                border: '1.5px solid rgba(52,211,153,0.3)',
              }}
            >
              <Mic2 style={{ width: 36, height: 36, color: '#10b981' }} />
            </div>
            <h3 className={`text-base font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {search || genderFilter !== 'all' ? 'រកមិនឃើញ' : 'មិនទាន់មានសំឡេង'}
            </h3>
            <p className={`text-xs mb-5 leading-relaxed max-w-xs ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
              {search
                ? `រកមិនឃើញសំឡេងដែលត្រូវនឹង "${search}"`
                : genderFilter !== 'all'
                ? `មិនទាន់មានសំឡេង${genderFilter === 'male' ? 'ប្រុស' : 'ស្រី'}ទេ`
                : 'ចាប់ផ្តើមដោយបន្ថែមសំឡេងតួអង្គដំបូង'}
            </p>
            {search || genderFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearch('');
                  setGenderFilter('all');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-white/10 hover:bg-white/20 text-zinc-300 border-white/10'
                }`}
              >
                សម្អាតការស្វែងរក (Clear Filters)
              </button>
            ) : (
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-md bg-gradient-to-r from-emerald-500 to-teal-600"
              >
                <PlusCircle style={{ width: 16, height: 16 }} />
                + បន្ថែមសំឡេងថ្មី
              </button>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            6. STATISTICS FOOTER
        ════════════════════════════════════════ */}
        {totalVoices > 0 && (
          <div
            className={`rounded-2xl p-4 flex flex-col gap-3 border transition-colors ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#18181C] border-white/10'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 style={{ width: 14, height: 14, color: '#818cf8' }} />
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Voice Statistics
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div
                  className="text-2xl font-black"
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {totalVoices}
                </div>
                <div className={`text-[10px] font-semibold mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  Total Voices
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-blue-500">{maleCount}</div>
                <div className={`text-[10px] font-semibold mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  ប្រុស (Male)
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-pink-500">{femaleCount}</div>
                <div className={`text-[10px] font-semibold mt-0.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  ស្រី (Female)
                </div>
              </div>
            </div>

            {/* Progress bar breakdown */}
            <div>
              <div className={`flex justify-between text-[10px] font-bold mb-1.5 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                <span>♂ ប្រុស {malePct}%</span>
                <span>{femalePct}% ស្រី ♀</span>
              </div>
              <div
                className={`w-full h-2 rounded-full overflow-hidden ${
                  isLight ? 'bg-slate-200' : 'bg-white/10'
                }`}
              >
                <div className="h-full flex">
                  <div
                    className="h-full transition-all duration-700"
                    style={{
                      width: `${malePct}%`,
                      background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
                      borderRadius: femaleCount === 0 ? 9999 : '9999px 0 0 9999px',
                    }}
                  />
                  <div
                    className="h-full transition-all duration-700"
                    style={{
                      width: `${femalePct}%`,
                      background: 'linear-gradient(90deg, #ec4899, #f43f5e)',
                      borderRadius: maleCount === 0 ? 9999 : '0 9999px 9999px 0',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Voice Extractor Modal */}
      <VoiceExtractorModal
        isOpen={isExtractorOpen}
        onClose={() => setIsExtractorOpen(false)}
        onSuccess={(newChar) => {
          onAddCharacter?.(newChar);
          onShowToast?.(`🎉 បានកាត់សំឡេង "${newChar.label}" ដោយជោគជ័យ!`, 'success');
        }}
        onShowToast={onShowToast || (() => {})}
      />
    </div>
  );
};
