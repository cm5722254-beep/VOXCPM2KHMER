import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Mic,
  Users,
  CheckCircle2,
  Film,
  Layers,
  ShieldCheck,
  Zap,
  Cpu,
  Info,
  ChevronRight,
  ArrowRight,
  Check,
} from 'lucide-react';
import { ProjectFile, VideoShelfItem } from '../../types';

export type DubbingModeChoice = 'movie_clone_all' | 'voice_actor_clone';

interface AutoDubbingChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDubbing: (config: {
    mode: DubbingModeChoice;
    selectedFilenames: string[];
  }) => void;
  currentVideo: ProjectFile | null;
  shelfItems?: VideoShelfItem[];
  recentFiles?: ProjectFile[];
  isDubbing?: boolean;
}

export const AutoDubbingChoiceModal: React.FC<AutoDubbingChoiceModalProps> = ({
  isOpen,
  onClose,
  onConfirmDubbing,
  currentVideo,
  shelfItems = [],
  recentFiles = [],
  isDubbing = false,
}) => {
  const [selectedMode, setSelectedMode] = useState<DubbingModeChoice>('voice_actor_clone');
  const [isMultiEpisode, setIsMultiEpisode] = useState(false);
  const [selectedFilenames, setSelectedFilenames] = useState<string[]>(() => {
    return currentVideo ? [currentVideo.filename] : [];
  });

  if (!isOpen) return null;

  // Build unique available episode list (up to 10)
  const availableEpisodes: { filename: string; title: string; duration?: number }[] = [];
  const seenFiles = new Set<string>();

  if (currentVideo && !seenFiles.has(currentVideo.filename)) {
    seenFiles.add(currentVideo.filename);
    availableEpisodes.push({
      filename: currentVideo.filename,
      title: currentVideo.originalName || currentVideo.filename,
      duration: currentVideo.duration,
    });
  }

  shelfItems.forEach((it) => {
    if (it.filename && !seenFiles.has(it.filename) && availableEpisodes.length < 10) {
      seenFiles.add(it.filename);
      availableEpisodes.push({
        filename: it.filename,
        title: it.title || it.filename,
        duration: it.duration,
      });
    }
  });

  recentFiles.forEach((rf) => {
    if (rf.filename && !seenFiles.has(rf.filename) && availableEpisodes.length < 10) {
      seenFiles.add(rf.filename);
      availableEpisodes.push({
        filename: rf.filename,
        title: rf.originalName || rf.filename,
        duration: rf.duration,
      });
    }
  });

  const toggleEpisode = (fn: string) => {
    setSelectedFilenames((prev) => {
      if (prev.includes(fn)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((f) => f !== fn);
      } else {
        if (prev.length >= 10) return prev; // Limit to 10 episodes maximum
        return [...prev, fn];
      }
    });
  };

  const handleSelectAllEpisodes = () => {
    const all = availableEpisodes.map((e) => e.filename);
    setSelectedFilenames(all);
  };

  const handleSubmit = () => {
    const finalFiles = isMultiEpisode
      ? (selectedFilenames.length > 0 ? selectedFilenames : currentVideo ? [currentVideo.filename] : [])
      : (currentVideo ? [currentVideo.filename] : []);
    
    if (finalFiles.length === 0) return;

    onConfirmDubbing({
      mode: selectedMode,
      selectedFilenames: finalFiles,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 font-khmer animate-in fade-in duration-200">
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      {/* Main Glass Modal Window */}
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden glass-panel-pro border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.8)] z-10 text-slate-800 dark:text-slate-100">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 p-[1px] shadow-lg shadow-rose-500/20">
              <div className="w-full h-full rounded-[15px] bg-slate-900/90 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white tracking-wide">
                🎬 1-Click AI ឌាប់រឿង (AI Auto Dubbing Studio)
              </h2>
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
                ជ្រើសរើសរបៀបចាត់តាំងសំឡេងតួអង្គ និងជម្រើសឌាប់រឿង
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-glass p-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:text-white transition-all active:scale-95"
            title="បិទ (Close)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 no-scrollbar">

          {/* ── SECTION 1: 2 Main Dubbing Choices ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse" />
                សូមជ្រើសរើសជម្រើសសំឡេង (Voice Mode):
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                🔒 ១ តួអង្គ = ១ សំឡេង (គ្មានការជាន់គ្នា)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              
              {/* Option 1: Direct Movie Live Clone */}
              <div
                onClick={() => setSelectedMode('movie_clone_all')}
                className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                  selectedMode === 'movie_clone_all'
                    ? 'bg-gradient-to-b from-cyan-500/15 to-blue-600/10 border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.25)] scale-[1.01]'
                    : 'glass-card-interactive border border-white/10 hover:border-white/20 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    selectedMode === 'movie_clone_all'
                      ? 'bg-cyan-400 text-black'
                      : 'border border-white/20'
                  }`}>
                    {selectedMode === 'movie_clone_all' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-slate-800 dark:text-white">
                      🎙️ Clone ពីសំឡេងរឿងដើម
                    </h3>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Movie Cloned
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
                    AI ស្ដាប់ និងកាត់សំឡេងដើមរបស់តួអង្គក្នុងរឿងផ្ទាល់ ១០០% (Vocal Isolation & Timbre Clone)។
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-1 text-[11px] text-slate-600 dark:text-zinc-400">
                  <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                    ✓ ស្រង់សំឡេងតួប្រុស តួស្រី តួក្មេង តួចាស់ ពីរឿងផ្ទាល់
                  </span>
                  <span className="flex items-center gap-1 text-slate-600 dark:text-zinc-400">
                    ✓ រក្សាទឹកដម & អារម្មណ៍ដើមរបស់តួអង្គ
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    ✓ ១ តួអង្គ = ១ សំឡេង Clone ពីរឿង (មិនជាន់គ្នា)
                  </span>
                </div>
              </div>

              {/* Option 2: Tool Character Voice + Fallback */}
              <div
                onClick={() => setSelectedMode('voice_actor_clone')}
                className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                  selectedMode === 'voice_actor_clone'
                    ? 'bg-gradient-to-b from-amber-500/15 to-purple-600/10 border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)] scale-[1.01]'
                    : 'glass-card-interactive border border-white/10 hover:border-white/20 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    selectedMode === 'voice_actor_clone'
                      ? 'bg-amber-400 text-black'
                      : 'border border-white/20'
                  }`}>
                    {selectedMode === 'voice_actor_clone' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-slate-800 dark:text-white">
                      🎭 Voice Character ក្នុង Tool
                    </h3>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Auto Fallback
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
                    ប្រើសំឡេង Voice Character ខ្មែរដែលមានក្នុង Tool (៣៨+ សំឡេង Voice Actors: តួឯកប្រុស, ស្រី, កំប្លែង, ចាស់, ក្មេង...)។
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-1 text-[11px]">
                  <span className="flex items-center gap-1 text-amber-300 font-semibold">
                    ⭐ បើខ្វះសំឡេងតួ Auto Clone ពីរឿងដើមមកបំពេញបន្ថែម
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    🔒 តួមួយប្រើបានតែមួយសំឡេង ហាមជាន់គ្នាដាច់ខាត!
                  </span>
                  <span className="flex items-center gap-1 text-slate-600 dark:text-zinc-400">
                    ✓ សំឡេងខ្មែរ 48kHz ច្បាស់កម្រិតរោងកុន
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* ── SECTION 2: Single vs Multi-Episode Batch (Up to 10) ── */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                ទំហំនៃការឌាប់រឿង (Single vs Batch Episodes):
              </span>
              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsMultiEpisode(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    !isMultiEpisode
                      ? 'bg-cyan-500 text-black shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:text-white'
                  }`}
                >
                  ១ ភាគបច្ចុប្បន្ន
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMultiEpisode(true);
                    if (selectedFilenames.length <= 1) {
                      handleSelectAllEpisodes();
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    isMultiEpisode
                      ? 'bg-purple-500 text-slate-800 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:text-white'
                  }`}
                >
                  🎬 ដល់ ១០ ភាគ (Batch)
                </button>
              </div>
            </div>

            {/* If Batch Multi-Episode is selected */}
            {isMultiEpisode && (
              <div className="space-y-2 pt-2 border-t border-white/5 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-zinc-400">
                    ជ្រើសរើសភាគដែលត្រូវឌាប់រឿង (ជ្រើសបាន <strong className="text-slate-800 dark:text-white">{selectedFilenames.length}</strong> / {Math.min(10, availableEpisodes.length)} ភាគ):
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAllEpisodes}
                    className="text-cyan-400 hover:underline text-[11px] font-semibold"
                  >
                    ជ្រើសទាំងអស់
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto no-scrollbar pr-1">
                  {availableEpisodes.map((ep, idx) => {
                    const isChecked = selectedFilenames.includes(ep.filename);
                    return (
                      <div
                        key={ep.filename}
                        onClick={() => toggleEpisode(ep.filename)}
                        className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer border text-xs transition-all ${
                          isChecked
                            ? 'bg-cyan-500/10 border-cyan-400/40 text-cyan-200'
                            : 'bg-white/[0.02] border-white/5 text-slate-600 dark:text-zinc-400 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                          isChecked ? 'bg-cyan-400 border-cyan-400 text-black' : 'border-white/20'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <Film className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate font-mono text-[11px]">
                          ភាគ {idx + 1}: {ep.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION 3: Performance & Anti-Freeze Guarantee ── */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/[0.07] border border-emerald-500/20 flex items-start gap-3 text-xs">
            <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <span>🛡️ ប្រព័ន្ធការពារកុំព្យូទ័រមិនឱ្យគាំង (Sequential Safe Mode)</span>
                <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded text-emerald-300 border border-emerald-500/30">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-relaxed">
                ដំណើរការម្តងមួយ Step យ៉ាងលឿន និងរលូន (Extract → Vocal Strip ទុកភ្លេង → Detect តួអង្គ & Lock សំឡេង 1:1 → Synthesis → Audio Remux) ដោយគ្រប់គ្រង RAM/GPU មិនឱ្យកើនកម្តៅ ឬគាំងម៉ាស៊ីនឡើយ។
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3 bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            className="btn-glass px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:text-white transition-all active:scale-95"
          >
            បោះបង់ (Cancel)
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isDubbing || (isMultiEpisode && selectedFilenames.length === 0)}
            className="btn-glass-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs text-black transition-all active:scale-95 shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Sparkles className="w-4 h-4 text-emerald-300 group-hover:rotate-12 transition-transform" />
            <span>
              🚀 ចាប់ផ្តើមឌាប់រឿង ({isMultiEpisode ? selectedFilenames.length : 1} ភាគ)
            </span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
};
