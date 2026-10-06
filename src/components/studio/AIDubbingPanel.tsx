import React, { useState } from 'react';
import {
  Mic,
  Play,
  Square,
  Sparkles,
  UserCheck,
  Trash2,
  Plus,
  Volume2,
  ChevronDown,
  Activity,
  Smile,
  Copy,
  Sliders,
  Globe,
  Loader2,
  Film,
  Rocket,
} from 'lucide-react';
import { CharacterVoice, TimelineSegment } from '../../types';
import { CURATED_CHARACTER_VOICES } from '../../constants/characterVoices';

interface AIDubbingPanelProps {
  segments: TimelineSegment[];
  onChangeSegments?: (segments: TimelineSegment[]) => void;
  selectedSegmentIndex: number;
  onSelectSegment: (index: number) => void;
  characters: CharacterVoice[];
  onGenerateLineAudio: (index: number) => void;
  onPreviewVoice: (filename: string) => void;
  onGenerateAll: () => void;
  onPreviewAll: () => void;
  isGeneratingAll: boolean;
  canGenerateAll: boolean;
  onOpenCharacterInspector?: (character?: CharacterVoice, segment?: TimelineSegment) => void;
  onOpenGenerateVoiceModal?: (segment?: TimelineSegment) => void;
  onTranslateAll?: () => void;
  isTranslatingAll?: boolean;
  onAssemble?: () => void;
  onOneClickDubbing?: () => void;
  onOpenRoadmap?: () => void;
}

const DEFAULT_AVATARS: Record<number, string> = {
  0: '/dragon_logo.png',
  1: '/dragon_logo.png',
  2: '/dragon_logo.png',
  3: '/dragon_logo.png',
};

const EMOTIONS = [
  { id: 'normal', label: 'ធម្មតា', icon: '💧', pill: 'bg-blue-950/40 text-blue-400 border-blue-500/40 hover:bg-blue-900/50' },
  { id: 'happy', label: 'សប្បាយ', icon: '🌿', pill: 'bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-900/50' },
  { id: 'sad', label: 'សោកសៅ', icon: '💧', pill: 'bg-purple-950/40 text-purple-400 border-purple-500/40 hover:bg-purple-900/50' },
  { id: 'angry', label: 'ខឹង', icon: '🔥', pill: 'bg-rose-950/40 text-rose-400 border-rose-500/40 hover:bg-rose-900/50' },
  { id: 'fear', label: 'ភ័យ', icon: '⚡', pill: 'bg-amber-950/40 text-sky-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-900/50' },
  { id: 'surprised', label: 'ភ្ញាក់ផ្អើល', icon: '✨', pill: 'bg-yellow-950/40 text-cyan-600 dark:text-yellow-400 border-yellow-500/40 hover:bg-yellow-900/50' },
  { id: 'excited', label: 'រំភើប', icon: '⚡', pill: 'bg-amber-950/40 text-sky-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-900/50' },
  { id: 'calm', label: 'ស្ងប់', icon: '🍃', pill: 'bg-teal-950/40 text-teal-400 border-teal-500/40 hover:bg-teal-900/50' },
  { id: 'romantic', label: 'រ៉ូមែនទិក', icon: '💖', pill: 'bg-pink-950/40 text-pink-400 border-pink-500/40 hover:bg-pink-900/50' },
  { id: 'tense', label: 'តានតឹង', icon: '⚔️', pill: 'bg-orange-950/40 text-orange-400 border-orange-500/40 hover:bg-orange-900/50' },
  { id: 'comedy', label: 'កំប្លែង', icon: '🎭', pill: 'bg-cyan-950/40 text-cyan-400 border-cyan-500/40 hover:bg-cyan-900/50' },
  { id: 'power', label: 'អំណាច', icon: '👑', pill: 'bg-indigo-950/40 text-indigo-400 border-indigo-500/40 hover:bg-indigo-900/50' },
];

export const AIDubbingPanel: React.FC<AIDubbingPanelProps> = ({
  segments,
  onChangeSegments,
  selectedSegmentIndex,
  onSelectSegment,
  characters,
  onGenerateLineAudio,
  onPreviewVoice,
  onGenerateAll,
  onPreviewAll,
  isGeneratingAll,
  canGenerateAll,
  onOpenCharacterInspector,
  onOpenGenerateVoiceModal,
  onTranslateAll,
  isTranslatingAll = false,
  onAssemble,
  onOneClickDubbing,
  onOpenRoadmap,
}) => {
  const [currentlyPlayingAudio, setCurrentlyPlayingAudio] = useState<number | null>(null);
  const [openEmotionDropdownIndex, setOpenEmotionDropdownIndex] = useState<number | null>(null);

  const activeCharacters = characters && characters.length > 0 ? characters : CURATED_CHARACTER_VOICES;

  const updateSegment = (index: number, updates: Partial<TimelineSegment>) => {
    if (!onChangeSegments) return;
    const next = [...segments];
    next[index] = { ...next[index], ...updates };
    onChangeSegments(next);
  };

  const handleAddCharacter = () => {
    if (!onChangeSegments) return;
    const newIdx = segments.length;
    const lastSeg = segments[segments.length - 1];
    const startTime = lastSeg ? (lastSeg.end_time || 0) + 1.5 : 0;
    const isFem = newIdx % 2 === 0;
    const pool = activeCharacters.filter((c) => isFem ? c.gender === 'female' : c.gender !== 'female');
    const chosenChar = (pool.length > 0 ? pool[Math.floor(newIdx / 2) % pool.length] : activeCharacters[newIdx % activeCharacters.length]) || activeCharacters[0];

    const newSeg: TimelineSegment = {
      line_index: newIdx,
      start_time: startTime,
      end_time: startTime + 3.5,
      speaker_name: `តួអង្គទី ${newIdx + 1}`,
      gender: isFem ? 'female' : 'male',
      voiceId: chosenChar?.id || (isFem ? 'voxcpm:vp_character_1_female.mp3' : 'voxcpm:vp_character_2_male.mp3'),
      voiceFilename: chosenChar?.filename || (isFem ? 'vp_character_1_female.mp3' : 'vp_character_2_male.mp3'),
      voiceLabel: chosenChar?.label || (isFem ? '🌸 Female Lead' : '👑 Male Lead'),
      chinese_text: '',
      khmer_translation: 'សូមស្វាគមន៍មកកាន់ការសន្ទនាថ្មី...',
      status: 'ready',
      emotion: 'normal',
      speed: 1.0,
      pitch: 0,
    };
    onChangeSegments([...segments, newSeg]);
    onSelectSegment(newIdx);
  };

  const handleDeleteRow = (index: number) => {
    if (!onChangeSegments) return;
    const updated = segments
      .filter((_, i) => i !== index)
      .map((seg, i) => ({ ...seg, line_index: i }));
    onChangeSegments(updated);
    if (selectedSegmentIndex >= updated.length) {
      onSelectSegment(Math.max(0, updated.length - 1));
    }
  };

  const playSegmentAudio = (idx: number, audioUrl?: string | null) => {
    if (audioUrl) {
      if (currentlyPlayingAudio === idx) {
        setCurrentlyPlayingAudio(null);
        return;
      }
      setCurrentlyPlayingAudio(idx);
      const audio = new Audio(audioUrl);
      audio.onended = () => setCurrentlyPlayingAudio(null);
      audio.onerror = () => setCurrentlyPlayingAudio(null);
      audio.play().catch(() => setCurrentlyPlayingAudio(null));
    } else {
      // Trigger real AI speech synthesis on the backend immediately!
      onGenerateLineAudio(idx);
    }
  };

  return (
    <div className="ai-dubbing-panel flex flex-col h-full bg-white dark:bg-[#120A0D] border border-slate-200 dark:border-[#3D161F] rounded-2xl overflow-hidden shadow-2xl select-none font-khmer">
      {/* ── Panel Header: Clean & Powerful Dragon Command Bar ── */}
      <div className="px-4 py-3 bg-white dark:bg-[#180D11] border-b border-slate-200 dark:border-[#3D161F] flex flex-col xl:flex-row xl:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DC2626]/30 via-[#B91C1C]/20 to-[#F59E0B]/30 border border-red-500 dark:border-[#DC2626]/50 flex items-center justify-center shadow-[0_0_18px_rgba(220,38,38,0.35)] shrink-0">
            <Mic className="w-5 h-5 text-blue-600 dark:text-red-400 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800 dark:text-white tracking-wide font-khmer flex items-center gap-2">
              <span>ឌាប់សំឡេង AI ភាសាខ្មែរ</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-red-500/20 border border-blue-300 dark:border-blue-300 dark:border-blue-300 dark:border-red-500/40 text-red-300 font-mono font-bold">
                REAL AI
              </span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium font-khmer">
              ប្រព័ន្ធបញ្ចូលសំឡេងស្វ័យប្រវត្តិ និងរៀបចំតួអង្គភាពយន្ត
            </p>
          </div>
        </div>

        {/* Clean, Organized Primary Actions (No Clutter, Large Touch Targets) */}
        <div className="flex items-center gap-2 flex-wrap xl:flex-nowrap">
          {/* 🎬 1-CLICK DUBBING: The Primary Champion CTA */}
          {onOneClickDubbing && (
            <button
              type="button"
              onClick={onOneClickDubbing}
              disabled={isGeneratingAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#DC2626] via-[#B91C1C] to-[#F59E0B] hover:brightness-110 text-slate-800 dark:text-white font-black text-xs shadow-[0_0_24px_rgba(220,38,38,0.6)] border border-red-400/60 transition-all active:scale-95 disabled:opacity-50 font-khmer shrink-0 animate-pulse"
              title="ចុចតែ 1-Click: AI វិភាគសំឡេង បកប្រែជាខ្មែរ លុបសំឡេងដើមទុកភ្លេង បង្កើតសំឡេងតួអង្គ និងដំឡើងវីដេអូចុងក្រោយ ១០០%"
            >
              <Sparkles className="w-4 h-4 text-yellow-200 animate-spin" style={{ animationDuration: '4s' }} />
              <span>🎬 ចាប់ផ្តើមដាក់សំឡេង (1-Click)</span>
            </button>
          )}

          {/* 🌐 បកប្រែជាខ្មែរ */}
          {onTranslateAll && (
            <button
              type="button"
              onClick={onTranslateAll}
              disabled={isTranslatingAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#201217] hover:bg-white dark:bg-[#2D1820] text-slate-800 dark:text-slate-100 hover:text-slate-800 dark:text-white border border-slate-200 dark:border-[#3D161F] hover:border-red-500/50 font-bold text-xs transition-all active:scale-95 disabled:opacity-50 font-khmer shrink-0 shadow-sm"
              title="បកប្រែឃ្លានិយាយក្នុងរឿងទាំងអស់មកជាភាសាខ្មែរ ១០០%"
            >
              {isTranslatingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-red-400" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-red-400" />
              )}
              <span>{isTranslatingAll ? 'កំពុងបកប្រែ...' : '🌐 បកប្រែជាខ្មែរ'}</span>
            </button>
          )}

          {/* 🔊 បង្កើតសំឡេងទាំងអស់ */}
          <button
            type="button"
            onClick={onGenerateAll}
            disabled={isGeneratingAll || segments.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#201217] hover:bg-white dark:bg-[#2D1820] text-slate-800 dark:text-slate-100 hover:text-slate-800 dark:text-white border border-slate-200 dark:border-[#3D161F] hover:border-red-500/50 font-bold text-xs transition-all active:scale-95 disabled:opacity-50 font-khmer shrink-0 shadow-sm"
            title="បង្កើតសំឡេងតួអង្គខ្មែរទាំងអស់ក្នុងតារាង"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-amber-400" />
            <span>{isGeneratingAll ? 'កំពុងបង្កើត...' : '🔊 បង្កើតសំឡេង'}</span>
          </button>

          {/* 🎬 បង្កើតវីដេអូចុងក្រោយ (Assemble) */}
          {onAssemble && (
            <button
              type="button"
              onClick={onAssemble}
              disabled={isGeneratingAll || segments.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:brightness-110 text-slate-800 dark:text-white font-black text-xs shadow-[0_0_18px_rgba(245,158,11,0.45)] border border-amber-300/40 transition-all active:scale-95 disabled:opacity-50 font-khmer shrink-0"
              title="បង្កើតវីដេអូចុងក្រោយ ដោយបញ្ចូលសំឡេងខ្មែរ និងរក្សាភ្លេងដើម"
            >
              <Film className="w-3.5 h-3.5 text-slate-800 dark:text-white" />
              <span>🎬 បង្កើតវីដេអូ</span>
            </button>
          )}

          {/* ▶ ស្តាប់ទាំងអស់ */}
          <button
            type="button"
            onClick={onPreviewAll}
            disabled={segments.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#160D10] hover:bg-white dark:bg-[#201217] border border-slate-200 dark:border-[#3D161F] text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:text-white font-bold text-xs transition-all active:scale-95 font-khmer shrink-0"
            title="សាកស្តាប់សំឡេងតួអង្គទាំងអស់"
          >
            <Play className="w-3.5 h-3.5 fill-white text-slate-800 dark:text-white" />
            <span className="hidden sm:inline">ស្តាប់</span>
          </button>

          {/* ⚙ ការកំណត់ AI */}
          {onOpenCharacterInspector && (
            <button
              type="button"
              onClick={() => onOpenCharacterInspector()}
              className="p-2 rounded-xl bg-white dark:bg-[#160D10] hover:bg-white dark:bg-[#201217] border border-slate-200 dark:border-[#3D161F] hover:border-red-500/50 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:text-white transition-all active:scale-95 shrink-0"
              title="ការកំណត់កម្រិតខ្ពស់សម្រាប់តួអង្គ"
            >
              <Sliders className="w-4 h-4 text-blue-600 dark:text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* 🚀 Next Version Commercial Roadmap Announcement Banner */}
      {onOpenRoadmap && (
        <div className="mx-3 my-2.5 p-3 rounded-2xl bg-gradient-to-r from-[#240C11] via-[#160D10] to-[#1F120A] border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shrink-0 shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600/30 to-amber-600/30 border border-blue-300 dark:border-blue-300 dark:border-blue-300 dark:border-red-500/40 flex items-center justify-center shrink-0">
              <Rocket className="w-4 h-4 text-blue-600 dark:text-red-400 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-slate-800 dark:text-white text-xs font-khmer">🚀 មុខងារថ្មីកំពុងរៀបចំ៖ Advanced AI Dubbing Engine</span>
                <span className="text-[10px] bg-blue-50 dark:bg-red-500/20 border border-blue-300 dark:border-blue-300 dark:border-blue-300 dark:border-red-500/40 text-red-300 px-2 py-0.5 rounded font-mono font-bold">
                  NEXT VERSION
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-khmer">
                ស្គាល់ការនិយាយកាន់តែច្បាស់ • កំណត់ពេលវេលាប្រយោគ • បកប្រែខ្មែរឆ្លាតវៃ • សំឡេងតួអង្គជាប់លាប់ • រក្សាភ្លេងផ្ទៃក្រោយ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenRoadmap}
            className="shrink-0 px-3.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/30 border border-blue-300 dark:border-blue-300 dark:border-blue-300 dark:border-red-500/40 text-red-200 hover:text-slate-800 dark:text-white text-xs font-bold transition-all active:scale-95 shadow-sm font-khmer"
          >
            មើលមុខងារ Version បន្ទាប់ →
          </button>
        </div>
      )}

      {/* ── Table Horizontal Scroll Wrapper for Responsiveness ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-x-auto custom-scrollbar">
        <div className="min-w-[780px] flex-1 flex flex-col">
          {/* ── Table Column Headers ── */}
          <div className="grid grid-cols-[36px_130px_130px_minmax(180px,1fr)_110px_90px_80px_50px_95px] items-center gap-2 px-4 py-2 bg-white dark:bg-[#180D11]/90 border-b border-slate-200 dark:border-[#3D161F] text-[11px] font-bold text-slate-600 dark:text-slate-300 tracking-wider shrink-0 font-khmer">
            <span className="text-center font-khmer">លេខ</span>
            <span className="font-khmer">តួអង្គ</span>
            <span className="font-khmer">សំឡេង</span>
            <span className="font-khmer">អត្ថបទសន្ទនា</span>
            <span className="font-khmer">អារម្មណ៍</span>
            <span className="text-center font-khmer">ល្បឿន</span>
            <span className="text-center font-mono">Pitch</span>
            <span className="text-center font-khmer">សំឡេង</span>
            <span className="text-right pr-2 font-khmer">សកម្មភាព</span>
          </div>

          {/* ── Main Dialogue Rows Container ── */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 scrollbar-thin flex flex-col">
        {segments.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-5 my-auto select-none font-khmer max-w-xl mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-red-600/30 via-red-950/40 to-amber-600/30 border border-blue-300 dark:border-blue-300 dark:border-blue-300 dark:border-red-500/40 flex items-center justify-center text-blue-600 dark:text-red-400 shadow-[0_0_35px_rgba(220,38,38,0.35)]">
              <img src="/dragon_logo.png" alt="Dragon" className="w-10 h-10 object-cover rounded-md opacity-40" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-wide font-khmer">
                🎬 ចាប់ផ្តើមដាក់សំឡេង AI
              </h3>
              <div className="px-4 py-2 rounded-xl bg-white dark:bg-[#1C0F14] border border-slate-200 dark:border-[#3D161F] text-xs text-amber-300 font-bold leading-relaxed">
                បញ្ចូលវីដេអូ → AI វិភាគសំឡេង → បកប្រែ → បង្កើតសំឡេងខ្មែរ → បញ្ចេញវីដេអូ
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-khmer">
                ចុចប៊ូតុងធំខាងក្រោមដើម្បីដំណើរការដាក់សំឡេងដោយស្វ័យប្រវត្តិតែមួយចុច (1-Click) ឬស្កេនបកប្រែអត្ថបទជាមុន។
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center pt-2">

              {onTranslateAll && (
                <button
                  type="button"
                  onClick={onTranslateAll}
                  disabled={isTranslatingAll}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white dark:bg-[#201217] hover:bg-white dark:bg-[#2D1820] text-slate-800 dark:text-white font-bold text-xs border border-blue-300 dark:border-blue-300 dark:border-blue-300 dark:border-red-500/40 hover:border-red-500 transition-all active:scale-95 disabled:opacity-50 font-khmer shadow-md"
                >
                  {isTranslatingAll ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-red-400" />
                      <span>កំពុងស្កេន និងបកប្រែ...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 text-blue-600 dark:text-red-400" />
                      <span>🌐 ស្កេន & បកប្រែជាខ្មែរ</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          segments.map((seg, idx) => {
          const isSelected = selectedSegmentIndex === idx;
          const currentEmotionKey = (seg.emotion || 'normal').toLowerCase();
          const emoObj = EMOTIONS.find((e) => e.id === currentEmotionKey) || EMOTIONS[1];
          const avatarUrl =
            DEFAULT_AVATARS[idx % 4] ||
            (seg.gender === 'female' ? DEFAULT_AVATARS[0] : DEFAULT_AVATARS[1]);

          return (
            <div
              key={`${seg.line_index}-${idx}`}
              onClick={() => onSelectSegment(idx)}
              className={`dialogue-row grid grid-cols-[36px_130px_130px_minmax(180px,1fr)_110px_90px_80px_50px_95px] items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-white dark:bg-[#221318] border-red-500/70 shadow-[0_0_16px_rgba(220,38,38,0.25)] ring-1 ring-red-500/40'
                  : 'bg-white dark:bg-[#160D10]/80 hover:bg-white dark:bg-[#201217] border-slate-200 dark:border-[#3D161F]'
              }`}
            >
              {/* Column 1: Row Index # */}
              <div className="text-center font-mono text-xs font-bold text-blue-600 dark:text-red-400">
                {idx + 1}
              </div>

              {/* Column 2: Character Avatar & Name */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-red-500/30 shadow-sm bg-black">
                  <img
                    src={avatarUrl}
                    alt={seg.speaker_name || 'Character'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span
                    className="text-xs font-bold text-slate-800 dark:text-white truncate font-khmer"
                    title={seg.speaker_name || `តួអង្គ ${idx + 1}`}
                  >
                    {seg.speaker_name || `តួអង្គ ${idx + 1}`}
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-khmer">
                    ({seg.gender === 'female' ? 'តួស្រី' : 'តួប្រុស'})
                  </span>
                </div>
              </div>

              {/* Column 3: Voice Selector + Audition Button */}
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <select
                  value={seg.voiceFilename || seg.voiceId?.replace(/^voxcpm:/, '') || (activeCharacters[0]?.filename || '')}
                  onChange={(e) => {
                    const chosen = activeCharacters.find((c) => c.filename === e.target.value);
                    updateSegment(idx, {
                      voiceFilename: e.target.value,
                      voiceId: chosen?.id || `voxcpm:${e.target.value}`,
                      voiceLabel: chosen?.label || e.target.value,
                      gender: chosen?.gender || seg.gender,
                    });
                  }}
                  className="flex-1 min-w-0 bg-white dark:bg-[#180D11] border border-slate-200 dark:border-[#3D161F] rounded-lg px-2 py-1.5 text-[11px] font-semibold text-sky-600 dark:text-amber-400 focus:outline-none focus:border-red-500 cursor-pointer truncate font-khmer"
                >
                  <optgroup label="🌸 សំឡេង Clone តួស្រី">
                    {activeCharacters
                      .filter((c) => c.gender === 'female')
                      .map((c) => (
                        <option key={c.id} value={c.filename} className="bg-white dark:bg-[#180D11] text-pink-300 font-khmer">
                          {c.label}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="👑 សំឡេង Clone តួប្រុស">
                    {activeCharacters
                      .filter((c) => c.gender !== 'female')
                      .map((c) => (
                        <option key={c.id} value={c.filename} className="bg-white dark:bg-[#180D11] text-blue-300 font-khmer">
                          {c.label}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="🎙️ សំឡេងស្តង់ដារ Neural">
                    <option value="km-KH-PisethNeural" className="bg-white dark:bg-[#180D11] text-slate-700 dark:text-zinc-300 font-khmer">🎙️ Piseth Neural (ស្តង់ដារប្រុស)</option>
                    <option value="km-KH-SreymomNeural" className="bg-white dark:bg-[#180D11] text-slate-700 dark:text-zinc-300 font-khmer">🎙️ Sreymom Neural (ស្តង់ដារស្រី)</option>
                  </optgroup>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    const fn = seg.voiceFilename || seg.voiceId?.replace(/^voxcpm:/, '') || activeCharacters[0]?.filename;
                    if (fn) onPreviewVoice(fn);
                  }}
                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-blue-50 dark:bg-red-500/20 text-blue-600 dark:text-red-400 border border-red-500/30 transition-colors shrink-0"
                  title="ស្ដាប់សំឡេងគំរូ"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Column 4: Khmer Dialogue Text Input */}
              <div onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={seg.khmer_translation || ''}
                  onChange={(e) => updateSegment(idx, { khmer_translation: e.target.value })}
                  placeholder="វាយបញ្ចូលឃ្លាសន្ទនាជាភាសាខ្មែរ..."
                  className="w-full bg-white dark:bg-[#180D11] border border-slate-200 dark:border-[#3D161F] focus:border-red-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white placeholder-zinc-500 focus:outline-none transition-all shadow-inner font-khmer"
                />
              </div>

              {/* Column 5: Emotion Pill Selector */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenEmotionDropdownIndex(
                      openEmotionDropdownIndex === idx ? null : idx
                    )
                  }
                  className={`w-full flex items-center justify-between px-2.5 py-1 rounded-full border text-[11px] font-bold transition-all shadow-sm ${emoObj.pill}`}
                >
                  <span className="flex items-center gap-1 truncate">
                    <span>{emoObj.icon}</span>
                    <span>{emoObj.label}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">+</span>
                </button>

                {openEmotionDropdownIndex === idx && (
                  <div className="absolute left-0 top-full mt-1 w-32 bg-white dark:bg-[#0B1628] border border-cyan-500/30 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in space-y-0.5">
                    {EMOTIONS.map((emo) => (
                      <button
                        key={emo.id}
                        type="button"
                        onClick={() => {
                          updateSegment(idx, { emotion: emo.id });
                          setOpenEmotionDropdownIndex(null);
                        }}
                        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold text-left transition-all ${
                          currentEmotionKey === emo.id
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:bg-white/[0.08]'
                        }`}
                      >
                        <span>{emo.icon}</span>
                        <span>{emo.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Column 6: Speed Slider with Value Above */}
              <div
                className="flex flex-col items-center justify-center min-w-0"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[10px] font-mono text-sky-600 dark:text-amber-400 font-bold leading-none mb-1">
                  {(seg.speed ?? 1.0).toFixed(1)}x
                </span>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={seg.speed ?? 1.0}
                  onChange={(e) => updateSegment(idx, { speed: parseFloat(e.target.value) })}
                  className="w-16 h-1 accent-amber-500 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* Column 7: Pitch Slider with Value Above */}
              <div
                className="flex flex-col items-center justify-center min-w-0"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[10px] font-mono text-blue-600 dark:text-red-400 font-bold leading-none mb-1">
                  {seg.pitch && seg.pitch > 0 ? `+${seg.pitch}` : seg.pitch ?? 0}
                </span>
                <input
                  type="range"
                  min="-6"
                  max="6"
                  step="1"
                  value={seg.pitch ?? 0}
                  onChange={(e) => updateSegment(idx, { pitch: parseInt(e.target.value, 10) })}
                  className="w-14 h-1 accent-red-500 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* Column 8: Audio Play Button */}
              <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => playSegmentAudio(idx, seg.audioUrl)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-[0_0_12px_rgba(220,38,38,0.45)] ${
                    currentlyPlayingAudio === idx
                      ? 'bg-amber-500 text-slate-800 dark:text-white animate-pulse'
                      : 'bg-gradient-to-br from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-slate-800 dark:text-white'
                  }`}
                  title={seg.audioUrl ? (currentlyPlayingAudio === idx ? 'បញ្ឈប់សំឡេង' : 'សាកស្តាប់សំឡេង') : 'បង្កើត & ស្តាប់សំឡេង'}
                >
                  {currentlyPlayingAudio === idx ? (
                    <Square className="w-3 h-3 fill-white text-slate-800 dark:text-white" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-white text-slate-800 dark:text-white ml-0.5" />
                  )}
                </button>
              </div>

              {/* Column 9: Actions (Regenerate, Character Inspector, Delete) */}
              <div
                className="flex items-center justify-end gap-1.5 pr-1 text-slate-500 dark:text-slate-400"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Regenerate Voice */}
                <button
                  type="button"
                  onClick={() => onGenerateLineAudio(idx)}
                  className="p-1 rounded-lg hover:text-blue-600 dark:text-red-400 hover:bg-blue-50 dark:bg-red-500/20 transition-colors"
                  title="🔄 បង្កើតសំឡេងម្តងទៀត"
                >
                  <Activity className="w-3.5 h-3.5" />
                </button>

                {/* Character Inspector / Clone */}
                <button
                  type="button"
                  onClick={() => onOpenCharacterInspector?.(undefined, seg)}
                  className="p-1 rounded-lg hover:text-sky-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                  title="⚙ កំណត់តួអង្គ & ចម្លងសំឡេង"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDeleteRow(idx)}
                  className="p-1 rounded-lg hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
                  title="🗑 លុបបន្ទាត់សន្ទនា"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        }))}
      </div>

      {/* ── Table Footer: + Add Character Button ── */}
      <div className="p-3 bg-white dark:bg-[#180D11] border-t border-slate-200 dark:border-[#3D161F] flex items-center justify-between shrink-0 font-khmer">
        <button
          type="button"
          onClick={handleAddCharacter}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#221318] hover:bg-white dark:bg-[#2D1820] border border-blue-300 dark:border-blue-300 dark:border-blue-300 dark:border-red-500/40 text-red-300 font-bold text-xs transition-all active:scale-95 shadow-[0_0_10px_rgba(220,38,38,0.2)]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ បន្ថែមសន្ទនា / តួអង្គ</span>
        </button>

        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-khmer">
          {segments.length} តួអង្គសកម្ម
        </span>
      </div>
        </div>
      </div>
    </div>
  );
};
