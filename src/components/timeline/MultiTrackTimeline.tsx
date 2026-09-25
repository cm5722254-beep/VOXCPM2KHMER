import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Scan,
  Magnet,
  ZoomIn,
  ZoomOut,
  CheckCheck,
  RefreshCw,
  Scissors,
  Trash2,
  Copy,
  Volume2,
  VolumeX,
  Play,
  Pause,
  MoveHorizontal,
  Plus,
  Radio,
  Eye,
  EyeOff,
  LayoutList,
  Sparkles,
  Lock,
  Unlock,
  Wand2,
  Layers,
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
}

function formatTimecode(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}.${ms}`;
  return `${pad(m)}:${pad(s)}.${ms}`;
}

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
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Editor states
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [dragInfo, setDragInfo] = useState<{
    type: 'move' | 'trim-start' | 'trim-end';
    index: number;
    initialMouseX: number;
    initialStart: number;
    initialEnd: number;
  } | null>(null);

  // Track mute, solo, and lock states (6 Tracks)
  const [mutedTracks, setMutedTracks] = useState<Record<string, boolean>>({
    V1: false,
    A1: false,
    A2: false,
    A3: false,
    S1: false,
    FX1: false,
  });
  const [lockedTracks, setLockedTracks] = useState<Record<string, boolean>>({
    V1: false,
    A1: false,
    A2: false,
    A3: false,
    S1: false,
    FX1: false,
  });
  const [soloTracks, setSoloTracks] = useState<Record<string, boolean>>({
    V1: false,
    A1: false,
    A2: false,
    A3: false,
    S1: false,
    FX1: false,
  });

  const totalDur = duration > 0 ? duration : 60;
  const playheadPercent = Math.min(100, Math.max(0, (currentTime / totalDur) * 100));

  // Compute time from mouse event on timeline canvas
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

  // Ruler & Playhead Scrubbing Handlers
  const handleRulerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsScrubbing(true);
    const t = getTimeFromEvent(e.clientX);
    onSeek(t);
  };

  useEffect(() => {
    if (!isScrubbing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const t = getTimeFromEvent(e.clientX);
      onSeek(t);
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isScrubbing, getTimeFromEvent, onSeek]);

  // Smooth Mouse Wheel Zoom (Alt + Wheel or Ctrl + Wheel) & Horizontal Pan (Shift + Wheel)
  const handleTimelineWheel = (e: React.WheelEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 15 : -15;
      const nextZoom = Math.min(300, Math.max(50, zoom + delta));
      onZoomChange(nextZoom);
    } else if (e.shiftKey) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  const handleFitTimeline = () => {
    onZoomChange(100);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  };

  // Adaptive ruler tick marks adapting to zoom level & video duration
  const tickCount = Math.max(16, Math.min(100, Math.round(20 * (zoom / 100))));
  const rulerTicks = Array.from({ length: tickCount + 1 }).map((_, i) => {
    const time = (i / tickCount) * totalDur;
    const isMajor = i % 2 === 0;
    return {
      percent: (i / tickCount) * 100,
      time,
      isMajor,
    };
  });
  useEffect(() => {
    if (!dragInfo || !canvasRef.current || !onChangeSegments) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragInfo.initialMouseX;
      const deltaTime = (deltaX / rect.width) * totalDur;

      const updated = [...segments];
      const target = { ...updated[dragInfo.index] };
      const clipLen = dragInfo.initialEnd - dragInfo.initialStart;

      if (dragInfo.type === 'move') {
        let newStart = Math.max(0, dragInfo.initialStart + deltaTime);

        // Snap to Playhead or other clips
        if (snapEnabled) {
          const snapThresholdSec = 0.35 * (100 / zoom);
          if (Math.abs(newStart - currentTime) < snapThresholdSec) {
            newStart = currentTime;
          } else {
            // Check snap against other segments
            for (let i = 0; i < updated.length; i++) {
              if (i === dragInfo.index) continue;
              const s = updated[i];
              if (Math.abs(newStart - s.end_time) < snapThresholdSec) {
                newStart = s.end_time;
                break;
              }
              if (Math.abs(newStart + clipLen - s.start_time) < snapThresholdSec) {
                newStart = s.start_time - clipLen;
                break;
              }
            }
          }
        }

        const newEnd = Math.min(totalDur, newStart + clipLen);
        target.start_time = Number(newStart.toFixed(2));
        target.end_time = Number(newEnd.toFixed(2));
      } else if (dragInfo.type === 'trim-start') {
        let newStart = Math.max(0, Math.min(dragInfo.initialEnd - 0.3, dragInfo.initialStart + deltaTime));
        if (snapEnabled && Math.abs(newStart - currentTime) < 0.25) {
          newStart = currentTime;
        }
        target.start_time = Number(newStart.toFixed(2));
      } else if (dragInfo.type === 'trim-end') {
        let newEnd = Math.max(dragInfo.initialStart + 0.3, Math.min(totalDur, dragInfo.initialEnd + deltaTime));
        if (snapEnabled && Math.abs(newEnd - currentTime) < 0.25) {
          newEnd = currentTime;
        }
        target.end_time = Number(newEnd.toFixed(2));
      }

      updated[dragInfo.index] = target;
      onChangeSegments(updated);
    };

    const handleMouseUp = () => {
      setDragInfo(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragInfo, totalDur, segments, snapEnabled, currentTime, onChangeSegments, zoom]);

  // Clip Actions: Split at playhead
  const handleSplitClip = () => {
    if (!onChangeSegments || segments.length === 0) return;
    const activeSegIdx =
      selectedSegmentIndex >= 0 &&
      selectedSegmentIndex < segments.length &&
      currentTime > segments[selectedSegmentIndex].start_time + 0.3 &&
      currentTime < segments[selectedSegmentIndex].end_time - 0.3
        ? selectedSegmentIndex
        : segments.findIndex((s) => currentTime > s.start_time + 0.3 && currentTime < s.end_time - 0.3);

    if (activeSegIdx === -1) {
      onShowToast?.('⚠️ ដាក់ Playhead ចំកណ្ដាលឃ្លាសំឡេងដើម្បីកាត់ (Split)', 'info');
      return;
    }

    const seg = segments[activeSegIdx];
    const cutTime = Number(currentTime.toFixed(2));

    const seg1: TimelineSegment = {
      ...seg,
      end_time: cutTime,
    };

    const seg2: TimelineSegment = {
      ...seg,
      line_index: seg.line_index + 1,
      start_time: cutTime,
      end_time: seg.end_time,
      audioUrl: undefined, // Fresh segment for new voice / cut
    };

    const updated = [
      ...segments.slice(0, activeSegIdx),
      seg1,
      seg2,
      ...segments.slice(activeSegIdx + 1),
    ];

    onChangeSegments(updated);
    onSelectSegment(activeSegIdx + 1);
    onShowToast?.(`✂️ បានកាត់ឃ្លាសំឡេងត្រង់ ${cutTime}s ជាពីរជោគជ័យ!`, 'success');
  };

  // Toggle Select All / Deselect All
  const handleToggleSelectAll = useCallback(() => {
    if (!segments || segments.length === 0) {
      onShowToast?.('មិនទាន់មានឃ្លាសំឡេងនៅលើ Timeline ឡើយ', 'info');
      return;
    }
    const next = !isAllSelected;
    setIsAllSelected(next);
    if (next) {
      onShowToast?.(`✨ បានជ្រើសរើសឃ្លាទាំងអស់ (${segments.length} ឃ្លា)!`, 'success');
    } else {
      onShowToast?.('បានដោះការជ្រើសរើស', 'info');
    }
  }, [segments, isAllSelected, onShowToast]);

  // Global Ctrl+A / Cmd+A keyboard shortcut for Select All on timeline
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.getAttribute('contenteditable') === 'true')) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleToggleSelectAll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleSelectAll]);

  // Clip Actions: Delete clip (supports single clip or all clips if Select All is active)
  const handleDeleteClip = () => {
    if (!onChangeSegments || segments.length === 0) return;

    if (isAllSelected) {
      const count = segments.length;
      onChangeSegments([]);
      setIsAllSelected(false);
      onSelectSegment(0);
      onShowToast?.(`🗑️ បានលុបឃ្លាសំឡេងទាំងអស់ (${count} ឃ្លា) ចេញពី Timeline រួចរាល់!`, 'success');
      return;
    }

    if (selectedSegmentIndex < 0 || selectedSegmentIndex >= segments.length) {
      onShowToast?.('សូមជ្រើសរើសឃ្លាសំឡេងដែលចង់លុប ឬចុច "ជ្រើសទាំងអស់"', 'info');
      return;
    }

    const updated = segments.filter((_, idx) => idx !== selectedSegmentIndex);
    onChangeSegments(updated);
    onSelectSegment(Math.max(0, selectedSegmentIndex - 1));
    onShowToast?.('🗑️ បានលុបឃ្លាសំឡេងចេញពី Timeline រួចរាល់!', 'success');
  };

  // Clip Actions: Duplicate clip
  const handleDuplicateClip = () => {
    if (!onChangeSegments || segments.length === 0) return;
    if (selectedSegmentIndex < 0 || selectedSegmentIndex >= segments.length) return;

    const seg = segments[selectedSegmentIndex];
    const dur = seg.end_time - seg.start_time;
    const newStart = Number((seg.end_time + 0.2).toFixed(2));
    const newEnd = Number((newStart + dur).toFixed(2));

    const newSeg: TimelineSegment = {
      ...seg,
      start_time: Math.min(totalDur - dur, newStart),
      end_time: Math.min(totalDur, newEnd),
    };

    const updated = [
      ...segments.slice(0, selectedSegmentIndex + 1),
      newSeg,
      ...segments.slice(selectedSegmentIndex + 1),
    ];

    onChangeSegments(updated);
    onSelectSegment(selectedSegmentIndex + 1);
    onShowToast?.('📋 បានចម្លង (Duplicate) ឃ្លាសំឡេងជោគជ័យ!', 'success');
  };

  // Auto-organize & de-overlap all dialogue clips seamlessly
  const handleAutoDeoverlap = () => {
    if (!onChangeSegments || segments.length === 0) return;
    
    // 1. Sort segments chronologically
    const sorted = [...segments].sort((a, b) => (a.start_time || 0) - (b.start_time || 0));
    
    // 2. Adjust overlapping segments so each clip starts cleanly with safety gap
    let adjustedCount = 0;
    const cleaned: TimelineSegment[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const current = { ...sorted[i] };
      const curStart = Math.max(0, current.start_time || 0);
      const curDur = Math.max(0.6, (current.end_time || curStart + 2.0) - curStart);

      if (cleaned.length > 0) {
        const prev = cleaned[cleaned.length - 1];
        // If current segment collides or overlaps with previous clip (or gap < 0.25s)
        if (curStart < prev.end_time + 0.2) {
          adjustedCount++;
          // Shift current clip to start cleanly after the previous one with a 0.25s natural pause
          const newStart = Number((prev.end_time + 0.25).toFixed(2));
          current.start_time = newStart;
          current.end_time = Number((newStart + curDur).toFixed(2));
        } else {
          current.start_time = Number(curStart.toFixed(2));
          current.end_time = Number((curStart + curDur).toFixed(2));
        }
      } else {
        current.start_time = Number(curStart.toFixed(2));
        current.end_time = Number((curStart + curDur).toFixed(2));
      }

      cleaned.push(current);
    }

    onChangeSegments(cleaned);
    onShowToast?.(
      adjustedCount > 0
        ? `✨ បានរៀបចំឃ្លាសំឡេង ${cleaned.length} ឃ្លា និងដោះស្រាយឃ្លាជាន់គ្នា ${adjustedCount} ឃ្លាដោយជោគជ័យ!`
        : `✨ ឃ្លាសំឡេងទាំងអស់មានរបៀបរៀបរយត្រឹមត្រូវ គ្មានការជាន់គ្នាឡើយ!`,
      'success'
    );
  };

  const toggleTrackMute = (trackId: string) => {
    setMutedTracks((prev) => ({ ...prev, [trackId]: !prev[trackId] }));
  };
  const toggleTrackSolo = (trackId: string) => {
    setSoloTracks((prev) => ({ ...prev, [trackId]: !prev[trackId] }));
  };
  const toggleTrackLock = (trackId: string) => {
    setLockedTracks((prev) => ({ ...prev, [trackId]: !prev[trackId] }));
  };

  return (
    <div className="h-full bg-white dark:bg-[#0c101c] text-slate-900 dark:text-slate-100 border-t border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden select-none shadow-sm transition-colors duration-200">
      {/* Pro NLE Timeline Toolbar */}
      <div className="h-10 px-2 sm:px-3 bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs overflow-x-auto no-scrollbar gap-2">
        {/* Left Controls: Transport & Pro Editing Tools matching Image 3 */}
        <div className="flex items-center gap-1.5 sm:gap-2 font-khmer shrink-0">
          {/* Split (Cut) Button */}
          <button
            onClick={handleSplitClip}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all shadow-2xs"
            title="កាត់ត្រង់បន្ទាត់ចង្អុល (Split)"
          >
            <Scissors className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>កាត់</span>
          </button>

          {/* Duplicate Button */}
          <button
            onClick={handleDuplicateClip}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all shadow-2xs"
            title="ចម្លងបន្ទាត់ដែលបានជ្រើស (Duplicate)"
          >
            <Copy className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>ចម្លង</span>
          </button>

          {/* Select All (ជ្រើសទាំងអស់) Button */}
          <button
            onClick={handleToggleSelectAll}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all shadow-2xs ${
              isAllSelected
                ? 'bg-sky-100 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-300 font-bold'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="ជ្រើសរើសឃ្លាទាំងអស់ ឬដោះការជ្រើសរើស (Ctrl+A / Select All)"
          >
            <CheckCheck className={`w-3.5 h-3.5 ${isAllSelected ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'}`} />
            <span>{isAllSelected ? 'ដោះជ្រើស' : 'ជ្រើសទាំងអស់'}</span>
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDeleteClip}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all shadow-2xs ${
              isAllSelected
                ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-bold'
                : 'bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 text-slate-700 dark:text-slate-200 hover:text-rose-700 dark:hover:text-rose-300'
            }`}
            title={isAllSelected ? `លុបឃ្លាទាំងអស់ (${segments.length} ឃ្លា)` : 'លុបបន្ទាត់ដែលបានជ្រើស (Delete)'}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isAllSelected ? `លុបទាំងអស់ (${segments.length})` : 'លុប'}</span>
          </button>

          {/* Magnet / Snap Button */}
          <button
            onClick={() => setSnapEnabled(!snapEnabled)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all shadow-2xs ${
              snapEnabled
                ? 'bg-sky-100 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
            }`}
            title="បើក/បិទ ការតោងស្វ័យប្រវត្តិ (Snap)"
          >
            <Magnet className="w-3.5 h-3.5" />
            <span>តោង</span>
          </button>

          {/* Markers / Auto-Arrange */}
          <button
            onClick={handleAutoDeoverlap}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shadow-2xs"
            title="រៀបចំតម្រង់បន្ទាត់សំឡេងស្វ័យប្រវត្តិ"
          >
            <LayoutList className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>តម្រង់ជួរ</span>
          </button>

          {/* Quick Export SRT Button */}
          {segments.length > 0 && (
            <button
              onClick={() => {
                let srt = '';
                const formatTimecode = (sec: number) => {
                  const s = Math.max(0, sec || 0);
                  const h = Math.floor(s / 3600);
                  const m = Math.floor((s % 3600) / 60);
                  const sc = Math.floor(s % 60);
                  const ms = Math.floor((s % 1) * 1000);
                  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
                };
                segments.forEach((seg, i) => {
                  const text = seg.khmer_translation || seg.chinese_text || '';
                  srt += `${i + 1}\n${formatTimecode(seg.start_time)} --> ${formatTimecode(seg.end_time)}\n${text}\n\n`;
                });
                const blob = new Blob([srt.trim() + '\n'], { type: 'text/plain;charset=utf-8' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'movie_khmer_subtitles.srt';
                a.click();
              }}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold transition-all shadow-2xs"
              title="ទាញយកអត្ថបទរត់ជា File Subtitle (.SRT) សម្រាប់ YouTube & Facebook"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              <span>ទាញយក .SRT</span>
            </button>
          )}
        </div>

        {/* Right Controls: Height Toggle, Zoom Slider HUD, and Assemble Video */}
        <div className="flex items-center gap-2 sm:gap-3 font-khmer">
          {/* Timeline Height Toggle Button */}
          {onToggleTimelineHeight && (
            <button
              onClick={onToggleTimelineHeight}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition-all shadow-2xs"
              title={timelineHeight === 'expanded' ? 'បង្រួម Timeline (Compact)' : 'ពង្រីក Timeline អោយធំ (Expand)'}
            >
              <MoveHorizontal className={`w-3.5 h-3.5 text-sky-600 ${timelineHeight === 'expanded' ? 'rotate-90' : ''}`} />
              <span className="hidden sm:inline">
                {timelineHeight === 'expanded' ? 'បង្រួម' : 'ពង្រីក'}
              </span>
            </button>
          )}

          {/* Zoom Controls HUD (Fit, 1x, 2x, -, slider, +, percentage) */}
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl px-2 py-1 text-slate-700 text-xs shadow-2xs">
            {/* Fit button */}
            <button
              onClick={handleFitTimeline}
              className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-200 text-[10px] font-bold text-sky-700 border border-slate-200 transition-colors"
              title="ពង្រីក/ពង្រួមអោយល្មមអេក្រង់ (Fit Timeline - 100%)"
            >
              Fit
            </button>

            {/* 1x / 2x presets */}
            <button
              onClick={() => onZoomChange(100)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                zoom === 100 ? 'bg-sky-600 text-white shadow-xs' : 'hover:bg-slate-200 text-slate-600'
              }`}
              title="កម្រិតធម្មតា 100%"
            >
              1x
            </button>
            <button
              onClick={() => onZoomChange(200)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                zoom === 200 ? 'bg-sky-600 text-white shadow-xs' : 'hover:bg-slate-200 text-slate-600'
              }`}
              title="ពង្រីកធំ 200% (ងាយស្រួលកាត់តលម្អិត)"
            >
              2x
            </button>

            <div className="w-px h-3 bg-slate-300 mx-0.5" />

            {/* Zoom Out (-) */}
            <button
              onClick={() => onZoomChange(Math.max(50, zoom - 20))}
              className="p-0.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
              title="ពង្រួមតូច (Zoom Out)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            {/* Slider */}
            <input
              type="range"
              min="50"
              max="300"
              step="10"
              value={zoom}
              onChange={(e) => onZoomChange(parseInt(e.target.value, 10))}
              className="w-16 sm:w-20 h-1 accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
              title={`កម្រិតពង្រីក: ${zoom}% (អាចចុច Alt + Scroll កណ្តុរដើម្បី Zoom បាន)`}
            />

            {/* Zoom In (+) */}
            <button
              onClick={() => onZoomChange(Math.min(300, zoom + 20))}
              className="p-0.5 rounded hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
              title="ពង្រីកធំ (Zoom In)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            {/* Percentage Display */}
            <span className="font-mono text-[10px] text-cyan-400 font-bold min-w-[34px] text-right">
              {zoom}%
            </span>
          </div>

          {/* Assemble Video Action Button */}
          <button
            onClick={onAssemble}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:brightness-110 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/30 hover:shadow-cyan-500/50 active:scale-95"
            title="បញ្ចូលសំឡេង និងវីដេអូសម្រេច"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>បញ្ចូលវីដេអូ</span>
          </button>
        </div>
      </div>

      {/* Multi-Track Stage */}
      <div
        ref={scrollContainerRef}
        onWheel={handleTimelineWheel}
        className="flex-1 flex overflow-x-auto overflow-y-hidden relative font-khmer"
      >
        {/* Left Track Headers (Sticky) */}
        <div className="w-28 sm:w-44 shrink-0 bg-white dark:bg-[#0b0f19] border-r border-slate-200 dark:border-slate-800 sticky left-0 z-30 flex flex-col shadow-xs">
          <div className="h-7 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-2.5 justify-between">
            <span className="text-[10px] font-bold tracking-wider text-slate-800 dark:text-slate-200">
              បន្ទាត់ (6 TRACKS)
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">M • S • L</span>
          </div>

          {/* Track 1: V1 Video */}
          <div className="h-10 px-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#0b0f19]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-mono border border-sky-300 shrink-0">
                V1
              </span>
              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">វីដេអូដើម</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => toggleTrackMute('V1')}
                className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center transition-all ${
                  mutedTracks['V1'] ? 'bg-amber-100 text-amber-800' : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Mute Track (M)"
              >
                M
              </button>
              <button
                onClick={() => toggleTrackSolo('V1')}
                className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center transition-all ${
                  soloTracks['V1'] ? 'bg-sky-100 text-sky-800' : 'text-slate-400 hover:text-slate-800'
                }`}
                title="Solo Track (S)"
              >
                S
              </button>
              <button
                onClick={() => toggleTrackLock('V1')}
                className={`p-0.5 rounded text-[10px] ${
                  lockedTracks['V1'] ? 'text-rose-600' : 'text-slate-400 hover:text-slate-800'
                }`}
                title="Lock Track"
              >
                {lockedTracks['V1'] ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
              </button>
              <button
                onClick={() => toggleTrackMute('V1')}
                className={`p-0.5 rounded text-[10px] ${
                  mutedTracks['V1'] ? 'text-amber-600' : 'text-slate-400 hover:text-slate-800'
                }`}
                title="Toggle Visibility"
              >
                {mutedTracks['V1'] ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
              </button>
            </div>
          </div>

          {/* Track 2: A1 Original Voice */}
          <div className="h-10 px-2 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono border border-emerald-300 shrink-0">
                A1
              </span>
              <span className="text-[11px] font-semibold text-slate-800 truncate">សំឡេងដើម</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => toggleTrackMute('A1')}
                className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center transition-all ${
                  mutedTracks['A1'] ? 'bg-rose-100 text-rose-800' : 'text-slate-400 hover:text-slate-800'
                }`}
                title="Mute Original Voice (M)"
              >
                M
              </button>
              <button
                onClick={() => toggleTrackSolo('A1')}
                className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center transition-all ${
                  soloTracks['A1'] ? 'bg-emerald-100 text-emerald-800' : 'text-slate-400 hover:text-slate-800'
                }`}
                title="Solo Track (S)"
              >
                S
              </button>
              <button
                onClick={() => toggleTrackLock('A1')}
                className={`p-0.5 rounded text-[10px] ${
                  lockedTracks['A1'] ? 'text-rose-600' : 'text-slate-400 hover:text-slate-800'
                }`}
                title="Lock Track"
              >
                {lockedTracks['A1'] ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
              </button>
              <button
                onClick={() => toggleTrackMute('A1')}
                className={`p-0.5 rounded text-[10px] ${
                  mutedTracks['A1'] ? 'text-rose-600' : 'text-slate-400 hover:text-slate-800'
                }`}
              >
                {mutedTracks['A1'] ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
              </button>
            </div>
          </div>

          {/* Track 3: A2 Khmer Voice */}
          <div className="h-10 px-2 border-b border-slate-200 flex items-center justify-between bg-sky-50/50">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-mono border border-sky-300 shrink-0">
                A2
              </span>
              <span className="text-[11px] font-bold text-sky-900 truncate">សំឡេងខ្មែរ</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => toggleTrackMute('A2')}
                className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center transition-all ${
                  mutedTracks['A2'] ? 'bg-rose-100 text-rose-800' : 'text-slate-400 hover:text-slate-800'
                }`}
                title="Mute Khmer Voice (M)"
              >
                M
              </button>
              <button
                onClick={() => toggleTrackSolo('A2')}
                className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center transition-all ${
                  soloTracks['A2'] ? 'bg-sky-100 text-sky-800' : 'text-slate-400 hover:text-slate-800'
                }`}
                title="Solo Track (S)"
              >
                S
              </button>
              <button
                onClick={() => toggleTrackLock('A2')}
                className={`p-0.5 rounded text-[10px] ${
                  lockedTracks['A2'] ? 'text-rose-600' : 'text-slate-400 hover:text-slate-800'
                }`}
                title="Lock Track"
              >
                {lockedTracks['A2'] ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
              </button>
              <button
                onClick={() => toggleTrackMute('A2')}
                className={`p-0.5 rounded text-[10px] ${
                  mutedTracks['A2'] ? 'text-rose-600' : 'text-slate-400 hover:text-slate-800'
                }`}
              >
                {mutedTracks['A2'] ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
              </button>
            </div>
          </div>

          {/* Track 4: A3 BGM & Music */}
          <div className="h-10 px-2 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-mono border border-amber-300 shrink-0">
                A3
              </span>
              <span className="text-[11px] font-semibold text-slate-800 truncate">ភ្លេង & BGM</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => toggleTrackMute('A3')}
                className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center transition-all ${
                  mutedTracks['A3'] ? 'bg-rose-100 text-rose-800' : 'text-slate-400 hover:text-slate-800'
                }`}
                title="Mute BGM (M)"
              >
                M
              </button>
              <button
                onClick={() => toggleTrackSolo('A3')}
                className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center transition-all ${
                  soloTracks['A3'] ? 'bg-amber-100 text-amber-800' : 'text-slate-400 hover:text-slate-800'
                }`}
                title="Solo Track (S)"
              >
                S
              </button>
              <button
                onClick={() => toggleTrackLock('A3')}
                className={`p-0.5 rounded text-[10px] ${
                  lockedTracks['A3'] ? 'text-rose-600' : 'text-slate-400 hover:text-slate-800'
                }`}
                title="Lock Track"
              >
                {lockedTracks['A3'] ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
              </button>
              <button
                onClick={() => toggleTrackMute('A3')}
                className={`p-0.5 rounded text-[10px] ${
                  mutedTracks['A3'] ? 'text-rose-600' : 'text-slate-400 hover:text-slate-800'
                }`}
              >
                {mutedTracks['A3'] ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
              </button>
            </div>
          </div>

          {/* Track 5: S1 Subtitles */}
          <div className="h-10 px-2 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-mono border border-purple-300 shrink-0">
                S1
              </span>
              <span className="text-[11px] font-semibold text-slate-800 truncate">ចំណងជើងរង</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => toggleTrackMute('S1')}
                className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center transition-all ${
                  mutedTracks['S1'] ? 'bg-amber-100 text-amber-800' : 'text-slate-400 hover:text-slate-800'
                }`}
                title="Hide Subtitles (M)"
              >
                M
              </button>
              <button
                onClick={() => toggleTrackSolo('S1')}
                className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center transition-all ${
                  soloTracks['S1'] ? 'bg-purple-100 text-purple-800' : 'text-slate-400 hover:text-slate-800'
                }`}
                title="Solo Track (S)"
              >
                S
              </button>
              <button
                onClick={() => toggleTrackLock('S1')}
                className={`p-0.5 rounded text-[10px] ${
                  lockedTracks['S1'] ? 'text-rose-600' : 'text-slate-400 hover:text-slate-800'
                }`}
                title="Lock Track"
              >
                {lockedTracks['S1'] ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
              </button>
              <button
                onClick={() => toggleTrackMute('S1')}
                className={`p-0.5 rounded text-[10px] ${
                  mutedTracks['S1'] ? 'text-amber-600' : 'text-slate-400 hover:text-slate-800'
                }`}
              >
                {mutedTracks['S1'] ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
              </button>
            </div>
          </div>

          {/* Track 6: FX1 Effects & Transitions */}
          <div className="h-10 px-2 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-pink-100 text-pink-800 font-mono border border-pink-300 shrink-0">
                FX1
              </span>
              <span className="text-[11px] font-semibold text-slate-800 truncate">បែបផែន & 3D</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => toggleTrackMute('FX1')}
                className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center transition-all ${
                  mutedTracks['FX1'] ? 'bg-amber-100 text-amber-800' : 'text-slate-400 hover:text-slate-800'
                }`}
                title="Mute Effects (M)"
              >
                M
              </button>
              <button
                onClick={() => toggleTrackSolo('FX1')}
                className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center transition-all ${
                  soloTracks['FX1'] ? 'bg-pink-100 text-pink-800' : 'text-slate-400 hover:text-slate-800'
                }`}
                title="Solo Track (S)"
              >
                S
              </button>
              <button
                onClick={() => toggleTrackLock('FX1')}
                className={`p-0.5 rounded text-[10px] ${
                  lockedTracks['FX1'] ? 'text-rose-600' : 'text-slate-400 hover:text-slate-800'
                }`}
                title="Lock Track"
              >
                {lockedTracks['FX1'] ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
              </button>
              <button
                onClick={() => toggleTrackMute('FX1')}
                className={`p-0.5 rounded text-[10px] ${
                  mutedTracks['FX1'] ? 'text-amber-600' : 'text-slate-400 hover:text-slate-800'
                }`}
              >
                {mutedTracks['FX1'] ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Canvas: Scrubbable Ruler & Draggable Tracks */}
        <div
          ref={canvasRef}
          className="flex-1 flex flex-col relative bg-slate-100/90 dark:bg-[#070a12]"
          style={{ minWidth: `${1400 * (zoom / 100)}px` }}
        >
          {/* Draggable & Scrubbable Time Ruler with Adaptive Ticks */}
          <div
            ref={rulerRef}
            onMouseDown={handleRulerMouseDown}
            className="h-7 bg-slate-200/90 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 relative cursor-ew-resize select-none overflow-hidden hover:bg-slate-300/70 dark:hover:bg-slate-800 transition-colors"
            title="ចុច ឬអូសកណ្តុរលើបន្ទាត់ពេលវេលានេះដើម្បីរំកិលវីដេអូភ្លាមៗ (Interactive Ruler Scrubbing)"
          >
            {rulerTicks.map((t, i) => (
              <div
                key={i}
                className={`absolute top-0 h-full pointer-events-none flex flex-col justify-between py-0.5 ${
                  t.isMajor ? 'border-l border-slate-400 dark:border-white/[0.18]' : 'border-l border-slate-300 dark:border-white/[0.06]'
                }`}
                style={{ left: `${t.percent}%` }}
              >
                {t.isMajor ? (
                  <span className="text-[9px] font-mono text-slate-800 dark:text-slate-300 pl-1 select-none font-bold">
                    {formatTimecode(t.time)}
                  </span>
                ) : (
                  <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500 pl-1 select-none opacity-40">
                    {/* minor tick */}
                  </span>
                )}
                <div className={`w-[1px] ${t.isMajor ? 'h-2 bg-sky-600 dark:bg-cyan-400/60' : 'h-1 bg-slate-400 dark:bg-white/20'}`} />
              </div>
            ))}
          </div>

          {/* Interactive Playhead Needle */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-sky-500 dark:bg-[#00f0ff] shadow-[0_0_14px_rgba(2,132,199,0.8)] dark:shadow-[0_0_14px_#00f0ff] pointer-events-none z-40 transition-none"
            style={{ left: `${playheadPercent}%` }}
          >
            {/* Playhead Handle Header */}
            <div className="w-4 h-5 bg-sky-500 dark:bg-[#00f0ff] -translate-x-[7px] [clip-path:polygon(0%_0%,100%_0%,100%_65%,50%_100%,0%_65%)] shadow-[0_0_10px_rgba(2,132,199,0.8)] dark:shadow-[0_0_10px_#00f0ff]" />
          </div>

          {/* ================= TRACK LANES (6 TRACKS) ================= */}

          {/* Lane 1: V1 Movie Video Track (Filmstrip Pattern) */}
          <div className="h-10 border-b border-slate-200 dark:border-white/[0.06] relative bg-sky-50/40 dark:bg-[#0c111e]/60 flex items-center px-1">
            <div className="absolute top-1 bottom-1 left-0 w-[98%] timeline-filmstrip-pattern border border-sky-400/50 rounded-md px-3 flex items-center justify-between text-xs text-sky-900 dark:text-sky-200 font-semibold shadow-xs overflow-hidden">
              <span className="truncate flex items-center gap-1.5 relative z-10 drop-shadow-sm font-bold">
                <span>🎬</span>
                <span>វីដេអូដើម (Master Video Filmstrip • 1080p 60fps)</span>
              </span>
              <span className="text-[10px] font-mono text-sky-700 dark:text-cyan-300 font-bold relative z-10">{formatTimecode(totalDur)}</span>
            </div>
          </div>

          {/* Lane 2: A1 Original Vocal Stem Waveform */}
          <div className="h-10 border-b border-slate-200 dark:border-white/[0.06] relative bg-emerald-50/40 dark:bg-[#080c14]/80 flex items-center px-1 overflow-hidden">
            <div className="absolute top-1 bottom-1 left-0 w-[98%] bg-emerald-500/10 border border-emerald-500/30 rounded-md px-3 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-400 font-semibold relative overflow-hidden shadow-xs">
              {/* Dense Waveform Simulator */}
              <div className="absolute inset-0 flex items-center justify-between px-4 opacity-25 pointer-events-none">
                {Array.from({ length: 54 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[2px] bg-emerald-500 rounded-full"
                    style={{ height: `${15 + ((i * 37) % 70)}%` }}
                  />
                ))}
              </div>
              <span className="truncate relative z-10 flex items-center gap-2">
                <span>🎙️</span>
                <span>រលកសំឡេងដើម (Original Vocal Stem • Chinese Audio)</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-500/80 relative z-10 font-bold">48kHz • Stereo</span>
            </div>
          </div>

          {/* Lane 3: A2 Khmer Voice Dialogue Clips (DRAGGABLE & RESIZABLE) */}
          <div className="h-10 border-b border-slate-200 dark:border-white/[0.06] relative bg-slate-50 dark:bg-[#090e1a]/80">
            {segments.map((seg, idx) => {
              const start = seg.start_time || 0;
              const end = Math.max(start + 0.3, seg.end_time || start + 2.5);
              const leftPct = (start / totalDur) * 100;
              const widthPct = Math.max(1.5, ((end - start) / totalDur) * 100);
              const isFemale = seg.gender === 'female' || (seg.speaker_role && seg.speaker_role.includes('female'));
              const isSelected = selectedSegmentIndex === idx;
              const isHighlighted = isSelected || isAllSelected;

              return (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAllSelected(false);
                    onSelectSegment(idx);
                    onSeek(start);
                  }}
                  onMouseDown={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.dataset.trimHandle) return;
                    e.stopPropagation();
                    onSelectSegment(idx);
                    setDragInfo({
                      type: 'move',
                      index: idx,
                      initialMouseX: e.clientX,
                      initialStart: start,
                      initialEnd: end,
                    });
                  }}
                  className={`group absolute top-1 bottom-1 rounded-lg px-2 flex items-center text-[11px] font-medium text-white shadow-lg cursor-grab active:cursor-grabbing truncate transition-all select-none ${
                    isFemale
                      ? 'bg-gradient-to-r from-pink-600/90 to-rose-500/90 border border-pink-400/40 hover:border-pink-300/60'
                      : 'bg-gradient-to-r from-indigo-600/90 to-sky-500/90 border border-sky-400/40 hover:border-sky-300/60'
                  } ${
                    isHighlighted
                      ? 'ring-2 ring-cyan-400 shadow-[0_0_16px_rgba(0,242,254,0.6)] brightness-125 z-20 scale-[1.02]'
                      : 'hover:brightness-115 hover:scale-[1.01] z-10'
                  }`}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  title={`${seg.speaker_name || 'តួអង្គ'}: "${seg.khmer_translation || seg.chinese_text || ''}" (${start}s - ${end}s)`}
                >
                  {/* Left Trim Handle */}
                  <div
                    data-trim-handle="start"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onSelectSegment(idx);
                      setDragInfo({
                        type: 'trim-start',
                        index: idx,
                        initialMouseX: e.clientX,
                        initialStart: start,
                        initialEnd: end,
                      });
                    }}
                    className="absolute left-0 top-0 bottom-0 w-2.5 bg-black/40 hover:bg-white cursor-w-resize rounded-l-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30"
                    title="ទាញដើម្បីកាត់បន្ថយ ឬបន្ថែមពេលវេលាចាប់ផ្តើម (Trim In)"
                  >
                    <div className="w-[1.5px] h-3 bg-white/70" />
                  </div>

                  {/* Audio Waveform Peaks Inside Segment Clip */}
                  <div className="absolute inset-0 flex items-center justify-around px-2 opacity-25 pointer-events-none overflow-hidden">
                    {[35, 70, 50, 85, 30, 80, 60, 95, 45, 75, 90, 40, 65, 55, 70, 45].map((h, i) => (
                      <div
                        key={i}
                        className="w-[2px] bg-white rounded-full transition-all"
                        style={{ height: `${Math.max(15, (h * ((idx * 11 + i * 17) % 35 + 65)) / 100)}%` }}
                      />
                    ))}
                  </div>

                  {/* Clip Content Label */}
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 z-10">
                    <span className="font-bold text-[10px] px-1.5 py-0.2 rounded-md bg-black/50 text-white shrink-0 border border-white/20">
                      #{idx + 1}
                    </span>
                    <span className="truncate font-medium text-white drop-shadow-sm">
                      {seg.khmer_translation || seg.chinese_text || 'សំឡេង'}
                    </span>
                  </div>

                  {/* Right Trim Handle */}
                  <div
                    data-trim-handle="end"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onSelectSegment(idx);
                      setDragInfo({
                        type: 'trim-end',
                        index: idx,
                        initialMouseX: e.clientX,
                        initialStart: start,
                        initialEnd: end,
                      });
                    }}
                    className="absolute right-0 top-0 bottom-0 w-2.5 bg-black/40 hover:bg-white cursor-e-resize rounded-r-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30"
                    title="ទាញដើម្បីកាត់បន្ថយ ឬបន្ថែមពេលវេលាបញ្ចប់ (Trim Out)"
                  >
                    <div className="w-[1.5px] h-3 bg-white/70" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lane 4: A3 Preserved BGM & Sound Effects */}
          <div className="h-10 border-b border-slate-200 dark:border-white/[0.06] relative bg-amber-50/40 dark:bg-[#090e1a]/80 flex items-center px-1 overflow-hidden">
            <div className="absolute top-1 bottom-1 left-0 w-[98%] bg-amber-500/10 border border-amber-500/30 rounded-md px-3 flex items-center justify-between text-xs text-amber-900 dark:text-amber-400 font-semibold relative overflow-hidden shadow-xs">
              {/* Dense BGM Waveform Simulator */}
              <div className="absolute inset-0 flex items-center justify-between px-4 opacity-25 pointer-events-none">
                {Array.from({ length: 54 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[2px] bg-amber-500 rounded-full"
                    style={{ height: `${20 + ((i * 29) % 75)}%` }}
                  />
                ))}
              </div>
              <span className="truncate relative z-10 flex items-center gap-2">
                <span>🎵</span>
                <span>តន្ត្រីផ្ទៃក្រោយ និងសំឡេង Effects (BGM & Foley Preserved)</span>
              </span>
              <span className="text-[10px] font-mono text-amber-700 dark:text-amber-500/80 relative z-10 font-bold">Demucs v4 AI Stem</span>
            </div>
          </div>

          {/* Lane 5: S1 Subtitles Track */}
          <div className="h-10 border-b border-slate-200 dark:border-white/[0.06] relative bg-purple-50/30 dark:bg-[#0c111e]/60">
            {segments.map((seg, idx) => {
              const start = seg.start_time || 0;
              const end = Math.max(start + 0.3, seg.end_time || start + 2.5);
              const leftPct = (start / totalDur) * 100;
              const widthPct = Math.max(1.5, ((end - start) / totalDur) * 100);
              const isSelected = selectedSegmentIndex === idx;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectSegment(idx);
                    onSeek(start);
                  }}
                  className={`absolute top-1 bottom-1 rounded-md px-2 flex items-center text-[10px] font-bold cursor-pointer truncate transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white border border-purple-400 ring-1 ring-purple-300 z-10 shadow-xs'
                      : 'bg-purple-100 dark:bg-purple-500/20 border border-purple-300 dark:border-purple-400/30 text-purple-900 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-500/30'
                  }`}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  title={`Subtitle #${idx + 1}: ${seg.khmer_translation || seg.chinese_text || ''}`}
                >
                  <span className="truncate">
                    CC #{idx + 1}: {seg.khmer_translation || seg.chinese_text || ''}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Lane 6: FX1 Effects & Transitions Track */}
          <div className="h-10 border-b border-slate-200 dark:border-white/[0.06] relative bg-pink-50/40 dark:bg-[#090e1a]/80 flex items-center px-1 overflow-hidden">
            <div className="absolute top-1 bottom-1 left-0 w-[98%] bg-pink-500/10 border border-pink-500/30 rounded-md px-3 flex items-center justify-between text-xs text-pink-900 dark:text-pink-300 font-semibold relative overflow-hidden shadow-xs">
              <div className="flex items-center gap-3 relative z-10">
                <span className="flex items-center gap-1.5 font-bold text-[11px] text-pink-800 dark:text-pink-300">
                  <Sparkles className="w-3 h-3 text-pink-600 dark:text-pink-400" />
                  <span>បែបផែន & LUT (Video Color Grade & 3D Spatial Presets)</span>
                </span>
                <span className="px-2 py-0.2 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30 text-[9.5px] font-mono font-bold">
                  REC.709
                </span>
                <span className="px-2 py-0.2 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 text-[9.5px] font-mono font-bold">
                  3D Engine
                </span>
              </div>
              <span className="text-[10px] font-mono text-pink-700 dark:text-pink-400/80 relative z-10 font-bold">GPU Accelerated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
