import React, { useMemo, useState } from 'react';
import { Check, CirclePlay, FilePlus2, Play, Search, Sparkles, Trash2, Volume2 } from 'lucide-react';
import { CharacterVoice, TimelineSegment } from '../../types';
import { CURATED_CHARACTER_VOICES } from '../../constants/characterVoices';

interface DialogueEditorPanelProps {
  segments: TimelineSegment[];
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
  return `${minutes}:${seconds}`;
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
}) => {
  const [query, setQuery] = useState('');
  const [checkedRows, setCheckedRows] = useState<number[]>([]);
  const activeCharacters = characters && characters.length > 0 ? characters : CURATED_CHARACTER_VOICES;

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return segments
      .map((segment, index) => ({ segment, index }))
      .filter(({ segment, index }) => !needle || [
        segment.khmer_translation,
        segment.chinese_text,
        segment.speaker_name,
        segment.voiceLabel,
        String(index + 1),
      ].some((value) => value?.toLocaleLowerCase().includes(needle)));
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
      speaker_name: 'Speaker',
      gender: 'male',
      chinese_text: '',
      khmer_translation: '',
      status: 'draft',
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

  const toggleChecked = (index: number) => {
    setCheckedRows((rows) => rows.includes(index) ? rows.filter((row) => row !== index) : [...rows, index]);
  };

  return (
    <section className="reference-dialogue flex h-full min-h-0 flex-col bg-white text-slate-800">
      <header className="dialogue-heading flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">AI Dubbing · Dialogue</p>
          <h2 className="truncate text-base font-bold text-slate-900">Khmer dub</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-semibold text-sky-700">Khmer</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{segments.length} lines</span>
          <button type="button" onClick={onPreviewAll} disabled={!segments.some((segment) => segment.audioUrl)} className="dialogue-quiet-button inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold" title="Preview generated dialogue audio">
            <Play className="h-3.5 w-3.5" /> Preview all
          </button>
          <button type="button" onClick={onGenerateAll} disabled={isGeneratingAll || !canGenerateAll || segments.length === 0} className="dialogue-tool-button dialogue-primary-button inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold" title="Generate Khmer dubbing for this video">
            <Sparkles className="h-3.5 w-3.5" /> {isGeneratingAll ? 'Generating…' : 'Generate all voices'}
          </button>
          <button type="button" onClick={onShowControls} className="dialogue-quiet-button px-2.5 py-1.5 text-xs font-semibold" title="Open voice and project controls">
            Controls
          </button>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={addDialogue} disabled={!onChangeSegments} className="dialogue-tool-button dialogue-primary-button">
            <FilePlus2 className="h-3.5 w-3.5" /> Add line
          </button>
          <button type="button" onClick={() => setCheckedRows(segments.map((_, index) => index))} className="dialogue-tool-button">
            Select all
          </button>
          <button type="button" onClick={deleteChecked} disabled={!onChangeSegments || checkedRows.length === 0} className="dialogue-tool-button">
            <Trash2 className="h-3.5 w-3.5" /> Delete {checkedRows.length > 0 ? `(${checkedRows.length})` : ''}
          </button>
        </div>
        <label className="dialogue-search flex min-w-[150px] flex-1 items-center gap-2 sm:max-w-[240px]">
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input type="search" name="dialogue-search" autoComplete="off" autoCorrect="off" spellCheck={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find dialogue" aria-label="Find dialogue" />
        </label>
      </div>

      <div className="dialogue-column-head hidden shrink-0 grid-cols-[54px_76px_minmax(180px,1fr)_minmax(125px,170px)_78px] items-center gap-2 border-b border-slate-200 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 xl:grid 2xl:grid-cols-[26px_58px_minmax(170px,1fr)_minmax(118px,145px)_minmax(88px,105px)_72px_72px_62px]">
        <span>Select</span><span>Start</span><span>Khmer text</span><span>Voice</span><span className="hidden 2xl:block">Emotion</span><span className="hidden 2xl:block">Speed</span><span className="hidden 2xl:block">Pitch</span><span>Audio</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {filteredRows.length > 0 ? filteredRows.map(({ segment, index }) => {
          const voice = characters.find((item) => item.id === segment.voiceId || item.filename === segment.voiceFilename || item.filename === segment.voiceId?.replace(/^voxcpm:/, ''));
          const voiceValue = voice?.id || segment.voiceId || '';
          const isSelected = selectedSegmentIndex === index;
          return (
            <article
              key={`${segment.line_index}-${index}`}
              onClick={() => onSelectSegment(index)}
              className={`dialogue-row mb-1.5 grid grid-cols-[22px_52px_minmax(0,1fr)] items-start gap-2 rounded-lg border px-2.5 py-2 transition-colors xl:grid-cols-[22px_68px_minmax(180px,1fr)_minmax(125px,170px)_70px] 2xl:grid-cols-[26px_58px_minmax(170px,1fr)_minmax(118px,145px)_minmax(88px,105px)_72px_72px_62px] ${isSelected ? 'is-selected' : ''}`}
            >
              <label className="flex h-8 items-center justify-center" onClick={(event) => event.stopPropagation()}>
                <input type="checkbox" checked={checkedRows.includes(index)} onChange={() => toggleChecked(index)} aria-label={`Select line ${index + 1}`} />
              </label>
              <button type="button" onClick={(event) => { event.stopPropagation(); onSelectSegment(index); }} className="dialogue-time pt-2 text-left text-[10px] font-mono font-semibold text-slate-500">
                {timeLabel(segment.start_time)}
              </button>
              <div className="min-w-0">
                <div className="mb-1 flex min-w-0 items-center gap-1.5 px-1">
                  <span className={`dialogue-speaker-avatar ${segment.gender === 'female' ? 'is-female' : ''}`}>{(segment.speaker_name || 'S').trim().charAt(0).toUpperCase()}</span>
                  <span className="truncate text-[10px] font-semibold text-slate-500" title={segment.speaker_name || 'Speaker'}>{segment.speaker_name || `Speaker ${index + 1}`}</span>
                  <span className="text-[9px] text-slate-400">{segment.gender === 'female' ? 'Female' : 'Male'}</span>
                </div>
                <textarea
                  value={segment.khmer_translation || ''}
                  onClick={(event) => { event.stopPropagation(); onSelectSegment(index); }}
                  onChange={(event) => updateSegment(index, { khmer_translation: event.target.value })}
                  placeholder="Type Khmer dialogue…"
                  rows={2}
                  aria-label={`Khmer dialogue line ${index + 1}`}
                  className="dialogue-text-input w-full resize-y rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs leading-5 text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
                {segment.chinese_text && <p className="mt-1 truncate px-1 text-[10px] text-slate-400" title={segment.chinese_text}>{segment.chinese_text}</p>}
                <span className="mt-1 inline-flex items-center gap-1 px-1 text-[9px] font-medium text-emerald-600"><Check className="h-3 w-3" /> {segment.status === 'ready' || segment.audioUrl ? 'Audio ready' : 'Ready to generate'}</span>
              </div>
              <label className="col-start-2 flex min-w-0 flex-col gap-1 xl:col-start-auto" onClick={(event) => event.stopPropagation()}>
                <span className="text-[9px] font-semibold text-slate-500 xl:hidden">Voice profile</span>
                <select
                  value={voiceValue}
                  onChange={(event) => {
                    const selected = activeCharacters.find((item) => item.id === event.target.value || item.filename === event.target.value);
                    updateSegment(index, {
                      voiceId: event.target.value,
                      voiceFilename: selected?.filename || event.target.value.replace(/^voxcpm:/, ''),
                      voiceLabel: selected?.label,
                      gender: selected?.gender || segment.gender,
                    });
                  }}
                  aria-label={`Voice profile for line ${index + 1}`}
                  className="dialogue-voice-select min-w-0 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[10px] text-slate-700 outline-none focus:border-sky-400 font-khmer"
                >
                  <option value="">-- Choose voice --</option>
                  <optgroup label="🌸 Female Clones (ស្រី)">
                    {activeCharacters
                      .filter((c) => c.gender === 'female')
                      .map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </optgroup>
                  <optgroup label="👑 Male Clones (ប្រុស)">
                    {activeCharacters
                      .filter((c) => c.gender !== 'female')
                      .map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </optgroup>
                  {voiceValue && !activeCharacters.some((c) => c.id === voiceValue) && (
                    <option value={voiceValue}>{segment.voiceLabel || voiceValue.replace(/^voxcpm:/, '')}</option>
                  )}
                </select>
              </label>
              <label className="dialogue-parameter hidden min-w-0 2xl:flex 2xl:flex-col 2xl:gap-1" onClick={(event) => event.stopPropagation()}>
                <span className="text-[9px] font-semibold text-slate-500">Emotion</span>
                <select value={segment.emotion || 'calm'} onChange={(event) => updateSegment(index, { emotion: event.target.value })} aria-label={`Emotion for line ${index + 1}`} className="dialogue-voice-select min-w-0 rounded-md border px-1.5 py-1.5 text-[10px]">
                  {['calm', 'happy', 'sad', 'angry', 'excited', 'whisper'].map((emotion) => <option key={emotion} value={emotion}>{emotion[0].toUpperCase() + emotion.slice(1)}</option>)}
                </select>
              </label>
              <label className="dialogue-parameter hidden min-w-0 2xl:flex 2xl:flex-col 2xl:gap-1" onClick={(event) => event.stopPropagation()}>
                <span className="text-[9px] font-semibold text-slate-500">Speed <b className="float-right font-mono">{(segment.speed || 1).toFixed(1)}x</b></span>
                <input type="range" min="0.5" max="1.5" step="0.1" value={segment.speed || 1} onChange={(event) => updateSegment(index, { speed: Number(event.target.value) })} aria-label={`Speed for line ${index + 1}`} />
              </label>
              <label className="dialogue-parameter hidden min-w-0 2xl:flex 2xl:flex-col 2xl:gap-1" onClick={(event) => event.stopPropagation()}>
                <span className="text-[9px] font-semibold text-slate-500">Pitch <b className="float-right font-mono">{segment.pitch ?? 0}</b></span>
                <input type="range" min="-6" max="6" step="1" value={segment.pitch ?? 0} onChange={(event) => updateSegment(index, { pitch: Number(event.target.value) })} aria-label={`Pitch for line ${index + 1}`} />
              </label>
              <div className="col-start-3 flex items-center gap-1 xl:col-start-auto xl:justify-end" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => segment.audioUrl ? new Audio(segment.audioUrl).play().catch(() => {}) : onPreviewVoice(segment.voiceFilename || segment.voiceId?.replace(/^voxcpm:/, '') || '')}
                  disabled={!segment.audioUrl && !segment.voiceFilename && !segment.voiceId}
                  className="dialogue-icon-button"
                  title={segment.audioUrl ? 'Play generated line' : 'Preview voice profile'}
                >
                  {segment.audioUrl ? <Play className="h-3.5 w-3.5 fill-current" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>
                <button type="button" onClick={() => onGenerateLineAudio(index)} className="dialogue-icon-button dialogue-generate-button" title="Generate this line">
                  <Sparkles className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          );
        }) : (
          <div className="dialogue-empty-state flex h-full min-h-32 flex-col items-center justify-center gap-3 px-5 text-center">
            <span className="dialogue-empty-icon"><CirclePlay className="h-6 w-6" /></span>
            <div>
              <h3 className="text-sm font-semibold text-slate-700">{segments.length === 0 ? 'Your dialogue will appear here' : 'No dialogue found'}</h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500">{segments.length === 0 ? 'Load a video, then scan it to create editable dialogue lines.' : 'Try a different word or line number.'}</p>
            </div>
            {segments.length === 0 && <button type="button" onClick={onScanVideo} className="dialogue-tool-button dialogue-primary-button">Scan video</button>}
          </div>
        )}
      </div>
    </section>
  );
};
