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
}

const DEFAULT_AVATARS: Record<number, string> = {
  0: '/avatars/char_1.jpg',
  1: '/avatars/char_2.jpg',
  2: '/avatars/char_3.jpg',
  3: '/avatars/char_4.jpg',
};

const EMOTIONS = [
  { id: 'normal', label: 'ធម្មតា', icon: '💧', pill: 'bg-blue-950/40 text-blue-400 border-blue-500/40 hover:bg-blue-900/50' },
  { id: 'happy', label: 'សប្បាយ', icon: '🌿', pill: 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900/50' },
  { id: 'sad', label: 'សោកសៅ', icon: '💧', pill: 'bg-purple-950/40 text-purple-400 border-purple-500/40 hover:bg-purple-900/50' },
  { id: 'angry', label: 'ខឹង', icon: '🔥', pill: 'bg-rose-950/40 text-rose-400 border-rose-500/40 hover:bg-rose-900/50' },
  { id: 'fear', label: 'ភ័យ', icon: '⚡', pill: 'bg-amber-950/40 text-amber-400 border-amber-500/40 hover:bg-amber-900/50' },
  { id: 'surprised', label: 'ភ្ញាក់ផ្អើល', icon: '✨', pill: 'bg-yellow-950/40 text-yellow-400 border-yellow-500/40 hover:bg-yellow-900/50' },
  { id: 'excited', label: 'រំភើប', icon: '⚡', pill: 'bg-amber-950/40 text-amber-400 border-amber-500/40 hover:bg-amber-900/50' },
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
    <div className="ai-dubbing-panel flex flex-col h-full bg-[#18181C] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl select-none font-khmer">
      {/* ── Panel Header (Section 11) ── */}
      <div className="px-4 py-3 bg-[#141417] border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 via-teal-600/30 to-indigo-600/20 border border-emerald-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,173,0.25)] shrink-0">
            <Mic className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(0,242,173,0.8)]" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-wide font-khmer">
              ឌាប់សំឡេងដោយ AI
            </h2>
            <p className="text-xs text-zinc-400 font-medium font-khmer">
              បង្កើតសំឡេងខ្មែរធម្មជាតិសម្រាប់តួអង្គនីមួយៗ
            </p>
          </div>
        </div>

        {/* Top-Right CTA Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
          {/* 🎬 1-CLICK AI CINEMA DUBBING (ស្វ័យប្រវត្តិ ១០០%) */}
          {onOneClickDubbing && (
            <button
              type="button"
              onClick={onOneClickDubbing}
              disabled={isGeneratingAll}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:via-rose-400 hover:to-indigo-500 text-white font-black text-xs shadow-[0_0_22px_rgba(244,63,94,0.55)] border border-amber-300/50 transition-all active:scale-95 disabled:opacity-50 font-khmer shrink-0 animate-pulse"
              title="ចុចតែ 1-Click: ស្ដាប់, បកប្រែ, លុបសំឡេងដើមទុកតែភ្លេង, បែងចែកតួ (ប្រុស ស្រី ក្មេង ចាស់ បន្ទាប់បន្សំ), សំឡេង 1:1, Clone ពីរឿង, បញ្ចូលសំឡេងខ្មែរ 1% ដល់ 100%"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-200 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="hidden sm:inline">🎬 1-Click AI ឌាប់រឿង (១០០%)</span>
              <span className="sm:hidden">🎬 1-Click</span>
            </button>
          )}

          {/* 🌐 បកប្រែឃ្លានិយាយទាំងអស់ជាខ្មែរ ១០០% */}
          {onTranslateAll && (
            <button
              type="button"
              onClick={onTranslateAll}
              disabled={isTranslatingAll}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-black text-xs shadow-[0_0_18px_rgba(16,185,129,0.45)] border border-emerald-300/40 transition-all active:scale-95 disabled:opacity-50 font-khmer shrink-0 animate-pulse"
              title="ចុចដើម្បីឱ្យ AI បកប្រែឃ្លានិយាយក្នុងរឿងទាំងអស់មកជាភាសាខ្មែរ ១០០%"
            >
              {isTranslatingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-emerald-200" />
              )}
              <span className="hidden sm:inline">{isTranslatingAll ? 'កំពុងបកប្រែ...' : '🌐 បកប្រែជាខ្មែរ ១០០%'}</span>
              <span className="sm:hidden">{isTranslatingAll ? '...' : 'បកប្រែ'}</span>
            </button>
          )}

          {/* ✨ បង្កើតសំឡេងទាំងអស់ */}
          <button
            type="button"
            onClick={onGenerateAll}
            disabled={isGeneratingAll || segments.length === 0}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_18px_rgba(0,240,255,0.4)] border border-cyan-300/40 transition-all active:scale-95 disabled:opacity-50 font-khmer shrink-0"
            title="បង្កើតសំឡេងតួអង្គទាំងអស់ក្នុងតារាង"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">{isGeneratingAll ? 'កំពុងបង្កើត...' : '✨ បង្កើតសំឡេងទាំងអស់'}</span>
            <span className="sm:hidden">{isGeneratingAll ? '...' : 'សំឡេង'}</span>
          </button>

          {/* ▶ សាកស្តាប់ទាំងអស់ */}
          <button
            type="button"
            onClick={onPreviewAll}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-[#0E1C31] hover:bg-[#13243d] border border-[rgba(100,180,255,0.2)] text-slate-200 hover:text-white font-bold text-xs transition-all active:scale-95 font-khmer shrink-0"
            title="សាកស្តាប់សំឡេងតួអង្គទាំងអស់"
          >
            <Play className="w-3.5 h-3.5 text-white fill-white" />
            <span className="hidden sm:inline">▶ សាកស្តាប់ទាំងអស់</span>
            <span className="sm:hidden">ស្តាប់</span>
          </button>

          {/* ⚙ ការកំណត់ AI */}
          {onOpenCharacterInspector && (
            <button
              type="button"
              onClick={() => onOpenCharacterInspector()}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-xl bg-[#0E1C31] hover:bg-cyan-500/20 border border-[rgba(100,180,255,0.2)] hover:border-cyan-400/40 text-slate-300 hover:text-cyan-300 font-bold text-xs transition-all active:scale-95 font-khmer shrink-0"
              title="ការកំណត់ AI Voice & Model"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">⚙ ការកំណត់ AI</span>
            </button>
          )}

          {/* 🎬 ដំឡើងវីដេអូ (Assemble Custom Video) */}
          {onAssemble && (
            <button
              type="button"
              onClick={onAssemble}
              disabled={isGeneratingAll || segments.length === 0}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-xs shadow-[0_0_20px_rgba(245,158,11,0.45)] border border-amber-300/40 transition-all active:scale-95 disabled:opacity-50 font-khmer shrink-0 animate-pulse"
              title="ដំឡើងវីដេអូសម្រេច និងបញ្ចូលសំឡេង Dubbing ចូលវីដេអូដើម"
            >
              <Film className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">🎬 ដំឡើងវីដេអូ (Assemble)</span>
              <span className="sm:hidden">ដំឡើង</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Table Horizontal Scroll Wrapper for Responsiveness ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-x-auto custom-scrollbar">
        <div className="min-w-[780px] flex-1 flex flex-col">
          {/* ── Table Column Headers (Section 11) ── */}
          <div className="grid grid-cols-[36px_130px_130px_minmax(180px,1fr)_110px_90px_80px_50px_95px] items-center gap-2 px-4 py-2 bg-[#07111F]/70 border-b border-[rgba(100,180,255,0.12)] text-[10.5px] font-bold text-slate-400 tracking-wider shrink-0 font-khmer">
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
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4 my-auto select-none font-khmer">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-emerald-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
              <Mic className="w-8 h-8 drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-sm font-bold text-white tracking-wide">
                មិនទាន់មានឃ្លាសន្ទនាត្រូវបានស្រង់ចេញនៅឡើយទេ
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                សូមចុចប៊ូតុងខាងក្រោម ដើម្បីឱ្យ AI ស្កេនវីដេអូ និងបកប្រែរាល់ឃ្លានិយាយក្នុងរឿងទាំងអស់មកជាភាសាខ្មែរ ១០០% ដោយស្វ័យប្រវត្តិ។
              </p>
            </div>
            {onTranslateAll && (
              <button
                type="button"
                onClick={onTranslateAll}
                disabled={isTranslatingAll}
                className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-black text-xs shadow-xl shadow-emerald-500/30 border border-emerald-400/40 transition-all active:scale-95 disabled:opacity-50"
              >
                {isTranslatingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>កំពុងស្កេន និងបកប្រែជាខ្មែរ ១០០%...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 text-emerald-200" />
                    <span>🌐 បកប្រែឃ្លានិយាយក្នុងរឿងទាំងអស់ជាខ្មែរ ១០០%</span>
                  </>
                )}
              </button>
            )}
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
                  ? 'bg-[#222228] border-emerald-400/50 shadow-[0_0_15px_rgba(0,242,173,0.15)] ring-1 ring-emerald-400/30'
                  : 'bg-[#16161A]/80 hover:bg-[#202026] border-white/[0.06]'
              }`}
            >
              {/* Column 1: Row Index # */}
              <div className="text-center font-mono text-xs font-bold text-zinc-400">
                {idx + 1}
              </div>

              {/* Column 2: Character Avatar & Name */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/10 shadow-sm bg-black">
                  <img
                    src={avatarUrl}
                    alt={seg.speaker_name || 'Character'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span
                    className="text-xs font-bold text-white truncate font-khmer"
                    title={seg.speaker_name || `តួអង្គ ${idx + 1}`}
                  >
                    {seg.speaker_name || `តួអង្គ ${idx + 1}`}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-sans">
                    ({seg.gender === 'female' ? 'Female' : 'Male'})
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
                  className="flex-1 min-w-0 bg-[#121214] border border-white/[0.1] rounded-lg px-2 py-1.5 text-[11px] font-semibold text-emerald-400 focus:outline-none focus:border-emerald-400 cursor-pointer truncate font-khmer"
                >
                  <optgroup label="🌸 សំឡេង Clone តួស្រី (Female Clones)">
                    {activeCharacters
                      .filter((c) => c.gender === 'female')
                      .map((c) => (
                        <option key={c.id} value={c.filename} className="bg-[#18181C] text-pink-300 font-khmer">
                          {c.label}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="👑 សំឡេង Clone តួប្រុស (Male Clones)">
                    {activeCharacters
                      .filter((c) => c.gender !== 'female')
                      .map((c) => (
                        <option key={c.id} value={c.filename} className="bg-[#18181C] text-blue-300 font-khmer">
                          {c.label}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="🎙️ សំឡេងស្តង់ដារ Neural">
                    <option value="km-KH-PisethNeural" className="bg-[#18181C] text-zinc-300 font-khmer">🎙️ Piseth Neural (ស្តង់ដារប្រុស)</option>
                    <option value="km-KH-SreymomNeural" className="bg-[#18181C] text-zinc-300 font-khmer">🎙️ Sreymom Neural (ស្តង់ដារស្រី)</option>
                  </optgroup>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    const fn = seg.voiceFilename || seg.voiceId?.replace(/^voxcpm:/, '') || activeCharacters[0]?.filename;
                    if (fn) onPreviewVoice(fn);
                  }}
                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors shrink-0"
                  title="ស្ដាប់សំឡេងគំរូ (Preview Sample Voice)"
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
                  className="w-full bg-[#121214] border border-white/[0.08] focus:border-emerald-400 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all shadow-inner font-khmer"
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
                  <span className="text-[10px] text-slate-400 font-mono">+</span>
                </button>

                {openEmotionDropdownIndex === idx && (
                  <div className="absolute left-0 top-full mt-1 w-32 bg-[#0B1628] border border-cyan-500/30 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in space-y-0.5">
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
                            : 'text-slate-300 hover:bg-white/[0.08]'
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
                <span className="text-[10px] font-mono text-cyan-400 font-bold leading-none mb-1">
                  {(seg.speed ?? 1.0).toFixed(1)}x
                </span>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={seg.speed ?? 1.0}
                  onChange={(e) => updateSegment(idx, { speed: parseFloat(e.target.value) })}
                  className="w-16 h-1 accent-cyan-400 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* Column 7: Pitch Slider with Value Above */}
              <div
                className="flex flex-col items-center justify-center min-w-0"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[10px] font-mono text-cyan-400 font-bold leading-none mb-1">
                  {seg.pitch && seg.pitch > 0 ? `+${seg.pitch}` : seg.pitch ?? 0}
                </span>
                <input
                  type="range"
                  min="-6"
                  max="6"
                  step="1"
                  value={seg.pitch ?? 0}
                  onChange={(e) => updateSegment(idx, { pitch: parseInt(e.target.value, 10) })}
                  className="w-14 h-1 accent-cyan-400 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* Column 8: Audio Play Button */}
              <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => playSegmentAudio(idx, seg.audioUrl)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-[0_0_10px_rgba(0,240,255,0.4)] ${
                    currentlyPlayingAudio === idx
                      ? 'bg-emerald-500 text-white animate-pulse'
                      : 'bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white'
                  }`}
                  title={seg.audioUrl ? (currentlyPlayingAudio === idx ? 'បញ្ឈប់សំឡេង' : 'សាកស្តាប់សំឡេង') : 'បង្កើត & ស្តាប់សំឡេង'}
                >
                  {currentlyPlayingAudio === idx ? (
                    <Square className="w-3 h-3 fill-white text-white" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                  )}
                </button>
              </div>

              {/* Column 9: Actions (Regenerate, Character Inspector, Delete) */}
              <div
                className="flex items-center justify-end gap-1.5 pr-1 text-slate-400"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Regenerate Voice */}
                <button
                  type="button"
                  onClick={() => onGenerateLineAudio(idx)}
                  className="p-1 rounded-lg hover:text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                  title="🔄 បង្កើតសំឡេងម្តងទៀត (Regenerate)"
                >
                  <Activity className="w-3.5 h-3.5" />
                </button>

                {/* Character Inspector / Clone */}
                <button
                  type="button"
                  onClick={() => onOpenCharacterInspector?.(undefined, seg)}
                  className="p-1 rounded-lg hover:text-purple-300 hover:bg-purple-500/20 transition-colors"
                  title="⚙ កំណត់តួអង្គ & ចម្លងសំឡេង (Character Inspector)"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDeleteRow(idx)}
                  className="p-1 rounded-lg hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
                  title="🗑 លុបបន្ទាត់សន្ទនា (Delete)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        }))}
      </div>

      {/* ── Table Footer: + Add Character Button ── */}
      <div className="p-3 bg-[#07111F]/80 border-t border-[rgba(100,180,255,0.15)] flex items-center justify-between shrink-0 font-khmer">
        <button
          type="button"
          onClick={handleAddCharacter}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E1C31] hover:bg-[#13243d] border border-cyan-500/30 text-cyan-400 font-bold text-xs transition-all active:scale-95 shadow-[0_0_10px_rgba(0,240,255,0.15)]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ បន្ថែមសន្ទនា / តួអង្គ</span>
        </button>

        <span className="text-[11px] text-slate-400 font-khmer">
          {segments.length} តួអង្គសកម្ម
        </span>
      </div>
        </div>
      </div>
    </div>
  );
};
