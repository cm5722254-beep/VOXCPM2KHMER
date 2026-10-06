import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Minimize2,
  Maximize2,
  X,
  Play,
  Download,
  Music,
  Film,
  Zap,
  Clock,
  Layers,
  Mic,
  Sliders,
} from 'lucide-react';

export interface StudioProgressHUDProps {
  isOpen: boolean;
  progress: number;
  message: string;
  jobId?: string | null;
  outputVideo?: string | null;
  outputAudio?: string | null;
  onClose: () => void;
  onWatchVideo?: () => void;
  title?: string;
}

const STAGES = [
  { id: 'extract', label: 'ស្រង់ខ្សែសំឡេងដើម', threshold: 12, icon: Music },
  { id: 'synthesis', label: 'ផលិតសំឡេងខ្មែរ AI', threshold: 20, icon: Mic },
  { id: 'assembly', label: 'តម្រៀបលើ Timeline', threshold: 80, icon: Layers },
  { id: 'mix', label: 'Mix ភ្លេងកំដរ & Vocal', threshold: 88, icon: Sliders },
  { id: 'render', label: 'Remux វីដេអូសម្រេច', threshold: 94, icon: Film },
];

export const StudioProgressHUD: React.FC<StudioProgressHUDProps> = ({
  isOpen,
  progress,
  message,
  jobId,
  outputVideo,
  outputAudio,
  onClose,
  onWatchVideo,
  title = 'ប្រព័ន្ធដំណើរការ Dubbing ដោយ AI (Real-time Progress)',
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Timer counter when active
  useEffect(() => {
    if (!isOpen) {
      setSecondsElapsed(0);
      return;
    }
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Auto-maximize when reaching 100%
  useEffect(() => {
    if (progress >= 100) {
      setIsMinimized(false);
    }
  }, [progress]);

  if (!isOpen) return null;

  const isCompleted = progress >= 100;
  const isFailed = progress < 0 || (message && message.includes('កំហុស'));

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Minimized Floating Widget (Bottom-Right Dock)
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-300 font-khmer">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-[#12161F]/95 backdrop-blur-xl border border-cyan-500/40 shadow-[0_10px_35px_rgba(0,194,255,0.35)] text-slate-800 dark:text-white">
          <div className="relative flex items-center justify-center">
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black font-mono text-cyan-300">
                {Math.round(Math.max(0, Math.min(100, progress)))}%
              </span>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 truncate max-w-[180px]">
                {isCompleted ? 'ជោគជ័យ ១០០%!' : message || 'កំពុងដំណើរការ...'}
              </span>
            </div>
            <div className="w-36 h-1.5 bg-black/60 rounded-full overflow-hidden mt-1 border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                    : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                }`}
                style={{ width: `${Math.max(3, Math.min(100, progress))}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-700 dark:text-zinc-300 hover:text-slate-800 dark:text-white transition-colors"
            title="ពង្រីកផ្ទាំងដំណើរការ"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Full Expanded Glassmorphism Modal
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none font-khmer">
      <div
        className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#121622]/95 border border-cyan-500/30 shadow-[0_0_60px_rgba(0,194,255,0.25)] flex flex-col overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#182030]/90 border-b border-slate-200 dark:border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-600/30 to-indigo-600/20 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(0,194,255,0.35)] shrink-0">
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : isFailed ? (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              ) : (
                <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
              )}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-white tracking-wide flex items-center gap-2">
                <span>{title}</span>
                {!isCompleted && !isFailed && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                )}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-zinc-400 font-mono mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>{formatTime(secondsElapsed)}</span>
                </span>
                {jobId && (
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-600 dark:text-zinc-400">
                    ID: {jobId}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCompleted && (
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:text-white transition-colors"
                title="បង្រួមតូចទុកនៅជ្រុងក្រោម (Minimize)"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:text-white transition-colors"
              title="បិទផ្ទាំង"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Big Digital Percentage Gauge */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white dark:bg-[#0b0e16]/80 border border-white/[0.06] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.05] via-transparent to-transparent pointer-events-none" />

            <div className="text-center space-y-1 relative z-10">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-6xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-400 drop-shadow-[0_0_25px_rgba(0,194,255,0.4)]">
                  {Math.round(Math.max(0, Math.min(100, progress)))}
                </span>
                <span className="text-3xl font-black text-cyan-400/80 font-mono">%</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
                {isCompleted
                  ? 'ដំណើរការចប់សព្វគ្រប់ ១០០%!'
                  : isFailed
                  ? 'មានបញ្ហាក្នុងដំណើរការ'
                  : 'កម្រិតដំណើរការបច្ចុប្បន្ន'}
              </p>
            </div>

            {/* Glowing High-Definition Progress Bar */}
            <div className="w-full mt-5 space-y-2 relative z-10">
              <div className="w-full h-3.5 bg-black/70 rounded-full p-0.5 overflow-hidden border border-white/10 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-300 relative ${
                    isCompleted
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                      : isFailed
                      ? 'bg-rose-500'
                      : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 shadow-[0_0_20px_rgba(0,194,255,0.6)]'
                  }`}
                  style={{ width: `${Math.max(4, Math.min(100, progress))}%` }}
                >
                  {!isCompleted && !isFailed && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_infinite]" />
                  )}
                </div>
              </div>

              {/* Status Message */}
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold truncate max-w-[420px]">
                  {!isCompleted && !isFailed && (
                    <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                  )}
                  <span className="truncate">{message || 'កំពុងរៀបចំ...'}</span>
                </div>
                <span className="font-mono text-[11px] text-slate-600 dark:text-zinc-400 shrink-0">
                  {Math.round(progress)} / 100
                </span>
              </div>
            </div>
          </div>

          {/* 5-Stage Checklist Roadmap */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider px-1">
              ដំណាក់កាលដំណើរការ (Stages Roadmap)
            </div>

            <div className="grid grid-cols-1 gap-2">
              {STAGES.map((stg) => {
                const Icon = stg.icon;
                const isPassed = progress >= stg.threshold || isCompleted;
                const isCurrent =
                  !isCompleted &&
                  progress >= stg.threshold - 5 &&
                  progress < (STAGES.find((s) => s.threshold > stg.threshold)?.threshold || 101);

                return (
                  <div
                    key={stg.id}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all text-xs ${
                      isCurrent
                        ? 'bg-cyan-500/10 border-cyan-400/50 text-cyan-200 shadow-[0_0_15px_rgba(0,194,255,0.2)]'
                        : isPassed
                        ? 'bg-emerald-500/[0.08] border-emerald-500/30 text-emerald-300'
                        : 'bg-white/[0.02] border-white/[0.05] text-zinc-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          isCurrent
                            ? 'bg-cyan-500 text-black animate-pulse font-bold'
                            : isPassed
                            ? 'bg-emerald-500 text-slate-800 dark:text-white font-bold'
                            : 'bg-white/5 text-zinc-500'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold">{stg.label}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      {isCurrent ? (
                        <span className="text-cyan-400 font-bold flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>ដំណើរការ...</span>
                        </span>
                      ) : isPassed ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>រួចរាល់</span>
                        </span>
                      ) : (
                        <span className="text-zinc-600">រង់ចាំ</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completion Celebration & Action Buttons */}
          {isCompleted && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>🎉 ការ Dubbing វីដេអូគ្រប់តួអង្គសម្រេចជោគជ័យ ១០០%!</span>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap pt-1">
                {outputVideo && onWatchVideo && (
                  <button
                    type="button"
                    onClick={() => {
                      onWatchVideo();
                      onClose();
                    }}
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>ទស្សនាវីដេអូ</span>
                  </button>
                )}

                {outputVideo && (
                  <a
                    href={outputVideo}
                    download
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-800 dark:text-white font-bold text-xs transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Download វីដេអូ MP4</span>
                  </a>
                )}

                {outputAudio && (
                  <a
                    href={outputAudio}
                    download
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-700 dark:text-zinc-300 hover:text-slate-800 dark:text-white font-medium text-xs transition-all"
                    title="Download តែខ្សែសំឡេង Dubbed MP3"
                  >
                    <Music className="w-4 h-4 text-cyan-400" />
                    <span>Audio MP3</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white dark:bg-[#0e121a] border-t border-slate-200 dark:border-slate-200 dark:border-white/[0.08] flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>VOXCPM2 Ultra HD Cinema Dubbing</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-700 dark:text-zinc-300 hover:text-slate-800 dark:text-white font-medium transition-colors"
          >
            {isCompleted ? 'បិទ' : 'លាក់ទុក (Hide)'}
          </button>
        </div>
      </div>
    </div>
  );
};
