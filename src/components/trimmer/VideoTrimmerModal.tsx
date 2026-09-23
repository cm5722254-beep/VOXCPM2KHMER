import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Scissors,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Bookmark,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';

interface VideoTrimmerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc: string;
  videoTitle?: string;
  onApplyTrim: (inTime: number, outTime: number) => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const VideoTrimmerModal: React.FC<VideoTrimmerModalProps> = ({
  isOpen,
  onClose,
  videoSrc,
  videoTitle = 'video.mp4',
  onApplyTrim,
  onShowToast,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // In / Out Trim Markers
  const [inPoint, setInPoint] = useState(0);
  const [outPoint, setOutPoint] = useState(0);

  // Load duration when metadata is ready
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 0;
      setDuration(dur);
      setOutPoint(dur);
    }
  };

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  }, [isOpen]);

  // Keyboard shortcuts (I for In-point, O for Out-point, Space for Play/Pause, S for Split)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.code === 'KeyI') {
        e.preventDefault();
        handleSetInPoint();
      } else if (e.code === 'KeyO') {
        e.preventDefault();
        handleSetOutPoint();
      } else if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentTime, duration]);

  if (!isOpen) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, time));
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSetInPoint = () => {
    const t = Number(currentTime.toFixed(2));
    if (t >= outPoint) {
      onShowToast?.('ចំណុច In-Point ត្រូវតែតូចជាង Out-Point', 'warning');
      return;
    }
    setInPoint(t);
    onShowToast?.(`✂️ បានកំណត់ In-Point [I] ត្រង់ ${formatTime(t)}`, 'info');
  };

  const handleSetOutPoint = () => {
    const t = Number(currentTime.toFixed(2));
    if (t <= inPoint) {
      onShowToast?.('ចំណុច Out-Point ត្រូវតែធំជាង In-Point', 'warning');
      return;
    }
    setOutPoint(t);
    onShowToast?.(`✂️ បានកំណត់ Out-Point [O] ត្រង់ ${formatTime(t)}`, 'info');
  };

  const handleResetMarkers = () => {
    setInPoint(0);
    setOutPoint(duration);
    onShowToast?.('បានកំណត់ In/Out ឡើងវិញ', 'info');
  };

  const handleConfirmTrim = () => {
    if (outPoint <= inPoint) {
      onShowToast?.('ចន្លោះកាត់មិនត្រឹមត្រូវឡើយ', 'error');
      return;
    }
    onApplyTrim(inPoint, outPoint);
    onShowToast?.(
      `🎉 បានកាត់វីដេអូរួចរាល់! ប្រវែងកាត់សរុប: ${formatTime(outPoint - inPoint)}`,
      'success'
    );
    onClose();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m}:${s < 10 ? '0' : ''}${s}.${ms}`;
  };

  const trimmedDuration = Math.max(0, outPoint - inPoint);
  const inPercent = duration > 0 ? (inPoint / duration) * 100 : 0;
  const outPercent = duration > 0 ? (outPoint / duration) * 100 : 100;
  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 select-none font-khmer animate-in fade-in duration-200">
      <div className="bg-[#0b0f19] border border-cyan-500/30 rounded-2xl w-full max-w-4xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.2)] flex flex-col max-h-[92vh]">
        {/* ── Modal Header ── */}
        <div className="p-4 px-6 border-b border-white/[0.08] flex items-center justify-between bg-[#070a13]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/30">
              <Scissors className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  CAPCUT VIDEO CUTTER & TRIMMER
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40">
                  PRO FEATURE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                កាត់តវីដេអូវែងៗយកតែឈុតសំខាន់ដោយកំណត់ In-Point [I] & Out-Point [O]
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Video Player Screen ── */}
        <div className="flex-1 bg-black/90 p-4 flex flex-col items-center justify-center relative min-h-[300px]">
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              className="max-h-[380px] w-auto max-w-full rounded-xl shadow-2xl border border-white/[0.08]"
            />
          ) : (
            <div className="text-slate-500 text-xs">មិនទាន់មានវីដេអូសម្រាប់កាត់តឡើយ</div>
          )}

          {/* HUD Overlay Stats */}
          <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-white">{formatTime(currentTime)}</span>
            <span className="text-slate-500">/</span>
            <span className="font-mono text-slate-400">{formatTime(duration)}</span>
          </div>
        </div>

        {/* ── Timeline Track & Trimming Controls ── */}
        <div className="p-5 bg-[#080c14] border-t border-white/[0.08] flex flex-col gap-4">
          {/* Custom Range Timeline Bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="text-pink-400 font-bold">In [I]:</span>
                <span className="font-mono text-white">{formatTime(inPoint)}</span>
              </span>
              <span className="text-cyan-300 font-bold bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-lg text-[11px]">
                ប្រវែងកាត់សរុប: {formatTime(trimmedDuration)}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-pink-400 font-bold">Out [O]:</span>
                <span className="font-mono text-white">{formatTime(outPoint)}</span>
              </span>
            </div>

            {/* Timeline Track with In/Out Highlights */}
            <div
              className="relative w-full h-10 bg-slate-900 rounded-xl border border-white/10 overflow-hidden cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = clickX / rect.width;
                seekTo(ratio * duration);
              }}
            >
              {/* Highlighted Selection Zone */}
              <div
                className="absolute top-0 bottom-0 bg-pink-500/30 border-l-2 border-r-2 border-pink-500 transition-all shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                style={{
                  left: `${inPercent}%`,
                  width: `${Math.max(0, outPercent - inPercent)}%`,
                }}
              />

              {/* Playhead Marker */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,1)] z-10 transition-all pointer-events-none"
                style={{ left: `${currentPercent}%` }}
              >
                <div className="w-3 h-3 bg-cyan-400 rounded-full -ml-1 -mt-1" />
              </div>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => seekTo(currentTime - 5)}
                className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition-colors"
                title="ថយក្រោយ 5s"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-lg shadow-cyan-500/25 transition-all"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black" />}
              </button>

              <button
                onClick={() => seekTo(currentTime + 5)}
                className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition-colors"
                title="ទៅមុខ 5s"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            {/* Set In/Out Shortcuts */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSetInPoint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-300 hover:bg-pink-500/25 text-xs font-bold transition-all"
              >
                <Bookmark className="w-3.5 h-3.5 text-pink-400" />
                <span>កំណត់ In-Point [I]</span>
              </button>

              <button
                onClick={handleSetOutPoint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-300 hover:bg-pink-500/25 text-xs font-bold transition-all"
              >
                <Bookmark className="w-3.5 h-3.5 text-pink-400 rotate-180" />
                <span>កំណត់ Out-Point [O]</span>
              </button>

              <button
                onClick={handleResetMarkers}
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                title="កំណត់ឡើងវិញ (Reset)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Confirm Apply Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs text-slate-300 transition-colors"
              >
                បោះបង់
              </button>

              <button
                onClick={handleConfirmTrim}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-400 hover:to-rose-400 text-white text-xs font-bold shadow-lg shadow-pink-500/30 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>អនុវត្តការកាត់តវីដេអូ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
