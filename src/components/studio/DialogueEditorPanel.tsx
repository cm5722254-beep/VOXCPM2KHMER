import React, { useMemo, useState } from 'react';
import {
  Check,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
  Volume2,
  Search,
  Plus,
  Edit2,
  MoreVertical,
  Bot,
  Activity,
  User,
  Sliders,
  CheckCircle2,
  ChevronDown,
  Rocket,
} from 'lucide-react';
import { CharacterVoice, TimelineSegment } from '../../types';
import { CURATED_CHARACTER_VOICES } from '../../constants/characterVoices';
import { DragonButton } from '../dragon/DragonButton';

interface DialogueEditorPanelProps {
  segments: TimelineSegment[];
  onOpenRoadmap?: () => void;
  onChangeSegments?: (segments: TimelineSegment[]) => void;
  selectedSegmentIndex: number;
  onSelectSegment: (index: number) => void;
  characters: CharacterVoice[];
  onGenerateLineAudio: (index: number) => void;
  onPreviewVoice: (filename: string) => void;
  onShowControls: () => void;
  onScanVideo: () => void;
  onGenerateAll: () => void;
  onPreviewAll: () => void;
  isGeneratingAll: boolean;
  canGenerateAll: boolean;
}

const timeLabel = (value: number) => {
  const minutes = Math.floor(value / 60).toString().padStart(2, '0');
  const seconds = Math.floor(value % 60).toString().padStart(2, '0');
  const ms = Math.floor((value % 1) * 10);
  return `${minutes}:${seconds}.${ms}`;
};

export const DialogueEditorPanel: React.FC<DialogueEditorPanelProps> = ({
  segments,
  onChangeSegments,
  selectedSegmentIndex,
  onSelectSegment,
  characters,
  onGenerateLineAudio,
  onPreviewVoice,
  onShowControls,
  onScanVideo,
  onGenerateAll,
  onPreviewAll,
  isGeneratingAll,
  canGenerateAll,
  onOpenRoadmap,
}) => {
  const [query, setQuery] = useState('');
  const [checkedRows, setCheckedRows] = useState<number[]>([]);
  const activeCharacters = characters && characters.length > 0 ? characters : CURATED_CHARACTER_VOICES;

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return segments
      .map((segment, index) => ({ segment, index }))
      .filter(({ segment, index }) => !needle || [
        segment.khmer_translation,
        segment.chinese_text,
        segment.speaker_name,
        segment.voiceLabel,
        String(index + 1),
      ].some((value) => value?.toLowerCase().includes(needle)));
  }, [segments, query]);

  const updateSegment = (index: number, patch: Partial<TimelineSegment>) => {
    if (!onChangeSegments) return;
    const next = [...segments];
    next[index] = { ...next[index], ...patch };
    onChangeSegments(next);
  };

  const addDialogue = () => {
    if (!onChangeSegments) return;
    const last = segments[segments.length - 1];
    const start = last?.end_time ?? 0;
    const nextIndex = segments.length;
    onChangeSegments([...segments, {
      line_index: nextIndex,
      start_time: start,
      end_time: start + 3,
      speaker_name: `តួអង្គ ${nextIndex + 1}`,
      gender: 'male',
      chinese_text: '',
      khmer_translation: '',
      status: 'draft',
      speed: 1.0,
      pitch: 0,
      volume: 100,
      emotion: 'normal',
    }]);
    onSelectSegment(nextIndex);
  };

  const deleteChecked = () => {
    if (!onChangeSegments || checkedRows.length === 0) return;
    const removing = new Set(checkedRows);
    const next = segments
      .filter((_, index) => !removing.has(index))
      .map((segment, index) => ({ ...segment, line_index: index }));
    onChangeSegments(next);
    setCheckedRows([]);
    onSelectSegment(Math.max(0, Math.min(selectedSegmentIndex, next.length - 1)));
  };

  const deleteSingle = (index: number) => {
    if (!onChangeSegments) return;
    const next = segments
      .filter((_, i) => i !== index)
      .map((segment, i) => ({ ...segment, line_index: i }));
    onChangeSegments(next);
    onSelectSegment(Math.max(0, Math.min(selectedSegmentIndex, next.length - 1)));
  };

  const toggleChecked = (index: number) => {
    setCheckedRows((rows) => (rows.includes(index) ? rows.filter((row) => row !== index) : [...rows, index]));
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-slate-50 dark:bg-[#080608] text-slate-800 dark:text-slate-100 border-l border-slate-200 dark:border-[#3D161F] font-khmer">
      {/* ── Top Header Toolbar ── */}
      <header className="px-4 py-3 border-b border-slate-200 dark:border-[#3D161F] bg-white dark:bg-[#120A0D] flex shrink-0 items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#DC2626] to-[#F59E0B] flex items-center justify-center shadow-[0_0_12px_rgba(220,38,38,0.4)]">
            <img src="/dragon_logo.png" alt="Dragon" className="w-4 h-4 object-cover rounded-sm" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white font-ui uppercase tracking-wide">
                ផ្ទាំងកែសម្រួលការសន្ទនា
              </h2>
              <span className="px-2 py-0.2 rounded-full bg-[#DC2626]/20 text-[#EF4444] text-[10px] font-mono font-bold border border-red-500 dark:border-[#DC2626]/30">
                {segments.length} ឃ្លា
              </span>
            </div>
            <p className="text-[10px] text-[#94A3B8]">
              កែសម្រួលអត្ថបទ & បញ្ចូលសំឡេងខ្មែរតាមតួអង្គ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onPreviewAll}
            disabled={!segments.some((s) => s.audioUrl)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1A0E13] hover:bg-white dark:bg-[#2A141D] border border-slate-200 dark:border-[#3D161F] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:text-white transition-colors disabled:opacity-40"
            title="ស្តាប់សំឡេងទាំងអស់"
          >
            <Play className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="hidden sm:inline">ស្តាប់ទាំងអស់</span>
          </button>

          <DragonButton
            variant="energy"
            size="xs"
            onClick={onGenerateAll}
            loading={isGeneratingAll}
            disabled={!canGenerateAll || segments.length === 0}
            icon={<Sparkles className="w-3.5 h-3.5" />}
          >
            {isGeneratingAll ? 'កំពុងបង្កើត…' : '✨ បង្កើតសំឡេងទាំងអស់'}
          </DragonButton>
        </div>
      </header>

      {/* ── Action Bar: Add Line, Delete, Search ── */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-[#3D161F] bg-white dark:bg-[#120A0D]/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <DragonButton
            variant="panel"
            size="xs"
            onClick={addDialogue}
            icon={<Plus className="w-3.5 h-3.5 text-[#EF4444]" />}
          >
            + បន្ថែមប្រយោគ
          </DragonButton>

          <button
            type="button"
            onClick={() => setCheckedRows(checkedRows.length === segments.length ? [] : segments.map((_, i) => i))}
            className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#1A0E13] hover:bg-white dark:bg-[#2A141D] border border-slate-200 dark:border-[#3D161F] text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-white"
          >
            {checkedRows.length === segments.length ? 'ដោះចេញទាំងអស់' : 'ជ្រើសទាំងអស់'}
          </button>

          {checkedRows.length > 0 && (
            <button
              type="button"
              onClick={deleteChecked}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[11px] font-bold"
            >
              <Trash2 className="w-3 h-3" />
              <span>លុប ({checkedRows.length})</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-44 sm:w-56">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ស្វែងរកឃ្លាសន្ទនា..."
            className="w-full bg-white dark:bg-[#1A0E13] border border-slate-200 dark:border-[#3D161F] focus:border-[#EF4444] text-xs text-slate-800 dark:text-white rounded-xl pl-8 pr-2.5 py-1 outline-none transition-colors"
          />
        </div>
      </div>

      {/* 🚀 Next Version Roadmap Notice Banner */}
      {onOpenRoadmap && (
        <div className="mx-3 my-2 p-2.5 rounded-2xl bg-gradient-to-r from-red-950/40 via-[#1A0E13] to-amber-950/40 border border-red-500/25 flex items-center justify-between gap-2.5 text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#DC2626]/20 to-[#F59E0B]/20 border border-red-500 dark:border-[#DC2626]/30 flex items-center justify-center shrink-0">
              <Rocket className="w-3.5 h-3.5 text-[#EF4444]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800 dark:text-white text-[11px]">🚀 មុខងារថ្មីក្នុងកំណែបន្ទាប់៖ Advanced AI Dubbing Engine</span>
                <span className="text-[9px] bg-amber-500/15 border border-amber-500/30 text-amber-300 px-1.5 py-0.2 rounded font-mono">កំណែបន្ទាប់</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                ស្គាល់ការនិយាយ AI • កំណត់ពេលវេលាប្រយោគ • ស្គាល់តួអង្គ • រក្សាភ្លេង និងបែបផែន
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenRoadmap}
            className="shrink-0 px-2.5 py-1 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-blue-300 dark:border-blue-300 dark:border-blue-300 dark:border-red-500/40 text-red-200 text-[10px] font-bold transition-all active:scale-95 shadow-sm"
          >
            មើលមុខងារកំណែបន្ទាប់
          </button>
        </div>
      )}

      {/* ── Dialogue Rows List ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
        {filteredRows.length > 0 ? (
          filteredRows.map(({ segment, index }) => {
            const voice = activeCharacters.find(
              (item) => item.id === segment.voiceId || item.filename === segment.voiceFilename || item.filename === segment.voiceId?.replace(/^voxcpm:/, '')
            );
            const voiceValue = voice?.id || segment.voiceId || '';
            const isSelected = selectedSegmentIndex === index;
            const speakerLabel = segment.speaker_name || `តួអង្គ ${index + 1}`;
            const genderLabel = segment.gender === 'female' ? 'ស្រី' : 'ប្រុស';

            return (
              <article
                key={`${segment.line_index}-${index}`}
                onClick={() => onSelectSegment(index)}
                className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-[#1E1117] border-red-500 dark:border-[#DC2626] shadow-[0_0_20px_rgba(220,38,38,0.25)] ring-1 ring-[#DC2626]/50'
                    : 'bg-white dark:bg-[#140C10] hover:bg-white dark:bg-[#1E1117]/60 border-slate-200 dark:border-[#3D161F] hover:border-red-900/50'
                }`}
              >
                {/* ── Row Header: Checkbox, Timecode, Character Avatar & Name, Gender, Voice, Language ── */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-[#3D161F]/80">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checkedRows.includes(index)}
                      onChange={() => toggleChecked(index)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded accent-[#DC2626] cursor-pointer"
                    />

                    {/* Timecode Badge */}
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-50 dark:bg-[#080608] border border-slate-200 dark:border-[#3D161F] text-[#EF4444]">
                      ⏱️ {timeLabel(segment.start_time)} - {timeLabel(segment.end_time)}
                    </span>

                    {/* Character Avatar */}
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#DC2626] to-[#F59E0B] text-slate-800 dark:text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {speakerLabel.slice(0, 1).toUpperCase()}
                    </div>

                    {/* Character Name Editable */}
                    <input
                      type="text"
                      value={speakerLabel}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateSegment(index, { speaker_name: e.target.value })}
                      className="bg-transparent text-xs font-bold text-slate-800 dark:text-white max-w-[120px] truncate outline-none border-b border-transparent focus:border-[#EF4444]"
                    />

                    {/* Gender Pill */}
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                        segment.gender === 'female'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-blue-50 dark:bg-red-500/20 text-red-300 border border-blue-300 dark:border-blue-300 dark:border-blue-300 dark:border-red-500/40'
                      }`}
                    >
                      {genderLabel}
                    </span>
                  </div>

                  {/* Voice Selector & Language */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={voiceValue}
                      onChange={(e) => {
                        const selected = activeCharacters.find(
                          (item) => item.id === e.target.value || item.filename === e.target.value
                        );
                        updateSegment(index, {
                          voiceId: e.target.value,
                          voiceFilename: selected?.filename || e.target.value.replace(/^voxcpm:/, ''),
                          voiceLabel: selected?.label,
                          gender: selected?.gender || segment.gender,
                        });
                      }}
                      className="bg-slate-50 dark:bg-[#080608] border border-slate-200 dark:border-[#3D161F] focus:border-red-500 dark:border-[#DC2626] rounded-lg px-2 py-1 text-[11px] text-slate-700 dark:text-slate-200 outline-none max-w-[150px] truncate"
                    >
                      <option value="">-- ជ្រើសរើសសំឡេង --</option>
                      <optgroup label="🌸 សំឡេងតួអង្គស្រី">
                        {activeCharacters
                          .filter((c) => c.gender === 'female')
                          .map((item) => (
                            <option key={item.id} value={item.id}>{item.label}</option>
                          ))}
                      </optgroup>
                      <optgroup label="👑 សំឡេងតួអង្គប្រុស">
                        {activeCharacters
                          .filter((c) => c.gender !== 'female')
                          .map((item) => (
                            <option key={item.id} value={item.id}>{item.label}</option>
                          ))}
                      </optgroup>
                    </select>

                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold px-1.5 py-0.5 rounded bg-slate-50 dark:bg-[#080608] border border-slate-200 dark:border-[#3D161F]">
                      ខ្មែរ 🇰🇭
                    </span>
                  </div>
                </div>

                {/* ── Row Middle: Dialogue Text (Original + Khmer Translation) ── */}
                <div className="py-2.5 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                  {segment.chinese_text && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#080608]/50 p-2 rounded-xl border border-slate-200 dark:border-[#3D161F]/50 leading-relaxed">
                      <span className="text-[9px] text-[#A1A1AA] block font-mono">ប្រយោគដើម:</span>
                      {segment.chinese_text}
                    </div>
                  )}

                  <textarea
                    rows={2}
                    value={segment.khmer_translation || ''}
                    onChange={(e) => updateSegment(index, { khmer_translation: e.target.value })}
                    placeholder="វាយបញ្ចូលពាក្យពេចន៍សន្ទនាខ្មែរ..."
                    className="w-full bg-slate-50 dark:bg-[#080608] border border-slate-200 dark:border-[#3D161F] focus:border-red-500 dark:border-[#DC2626] rounded-xl p-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-500 outline-none leading-relaxed resize-y transition-colors"
                  />
                </div>

                {/* ── Row Controls: Emotion, Speed, Pitch, Volume, Action Buttons ── */}
                <div className="pt-2 border-t border-slate-200 dark:border-[#3D161F]/80 flex flex-wrap items-center justify-between gap-3 text-xs" onClick={(e) => e.stopPropagation()}>
                  {/* Fine-Tuning Sliders: Emotion, Speed, Pitch */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                    {/* Emotion Selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 dark:text-slate-400 font-bold">អារម្មណ៍:</span>
                      <select
                        value={segment.emotion || 'normal'}
                        onChange={(e) => updateSegment(index, { emotion: e.target.value })}
                        className="bg-slate-50 dark:bg-[#080608] border border-slate-200 dark:border-[#3D161F] rounded-lg px-2 py-0.5 text-[10px] text-slate-700 dark:text-slate-200 outline-none"
                      >
                        <option value="normal">ធម្មតា</option>
                        <option value="heroic">⚔️ អង់អាច</option>
                        <option value="angry">🔥 ខឹង</option>
                        <option value="dramatic">🎭 កម្សត់</option>
                        <option value="whisper">🤫 ខ្សឹប</option>
                        <option value="joyful">😄 រីករាយ</option>
                      </select>
                    </div>

                    {/* Speed Slider */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 dark:text-slate-400 font-bold">ល្បឿន:</span>
                      <span className="font-mono text-[#EF4444] font-bold">{(segment.speed || 1.0).toFixed(1)}x</span>
                      <input
                        type="range"
                        min="0.6"
                        max="1.6"
                        step="0.1"
                        value={segment.speed || 1.0}
                        onChange={(e) => updateSegment(index, { speed: parseFloat(e.target.value) })}
                        className="w-16 accent-[#DC2626] cursor-pointer"
                      />
                    </div>

                    {/* Pitch Slider */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 dark:text-slate-400 font-bold">កម្ពស់សំឡេង:</span>
                      <span className="font-mono text-[#F59E0B] font-bold">{segment.pitch ?? 0}</span>
                      <input
                        type="range"
                        min="-6"
                        max="6"
                        step="1"
                        value={segment.pitch ?? 0}
                        onChange={(e) => updateSegment(index, { pitch: parseInt(e.target.value) })}
                        className="w-14 accent-[#F59E0B] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Right Action Buttons: ▶ Preview, ✨ Generate, 🔄 Regenerate, 🗑️ Delete */}
                  <div className="flex items-center gap-1.5">
                    {/* Preview Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (segment.audioUrl) {
                          new Audio(segment.audioUrl).play().catch(() => {});
                        } else {
                          onPreviewVoice(segment.voiceFilename || segment.voiceId?.replace(/^voxcpm:/, '') || '');
                        }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-[#1E1117] hover:bg-white dark:bg-[#2A141D] border border-slate-200 dark:border-[#3D161F] text-[#EF4444] text-xs font-bold transition-colors"
                      title="ស្តាប់សំឡេង"
                    >
                      <Play className="w-3 h-3 fill-[#EF4444]" />
                      <span>ស្តាប់</span>
                    </button>

                    {/* Generate / Regenerate */}
                    <button
                      type="button"
                      onClick={() => onGenerateLineAudio(index)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-slate-800 dark:text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all"
                      title={segment.audioUrl ? 'បង្កើតសំឡេងឡើងវិញ' : 'បង្កើតសំឡេង'}
                    >
                      {segment.audioUrl ? (
                        <>
                          <RotateCcw className="w-3 h-3" />
                          <span>បង្កើតឡើងវិញ</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>បង្កើតសំឡេង</span>
                        </>
                      )}
                    </button>

                    {/* Delete Line */}
                    <button
                      type="button"
                      onClick={() => deleteSingle(index)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="លុបឃ្លានេះ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="text-center py-16 text-slate-500 flex flex-col items-center gap-3">
            <img src="/dragon_logo.png" alt="Dragon" className="w-10 h-10 object-cover rounded-md opacity-40" />
            <p className="text-xs">មិនទាន់មានឃ្លាសន្ទនានៅឡើយទេ។ សូមចុច "+ បន្ថែមប្រយោគ" ឬស្កេនវីដេអូ</p>
            <DragonButton variant="energy" size="sm" onClick={onScanVideo}>
              🔍 ស្កេនរកសំឡេងពីវីដេអូ
            </DragonButton>
          </div>
        )}
      </div>
    </section>
  );
};
