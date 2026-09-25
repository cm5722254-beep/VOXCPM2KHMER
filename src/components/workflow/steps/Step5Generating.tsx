import React, { useEffect, useState } from 'react';
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Wand2,
  Volume2,
  Film,
  AlignLeft,
  UserCircle2,
  Sparkles,
  Cpu,
  Layers,
  Check,
  ArrowRight,
} from 'lucide-react';
import { ProjectFile, TimelineSegment } from '../../../types';

interface Step5GeneratingProps {
  uploadedFile: ProjectFile | null;
  segments: TimelineSegment[];
  isDubbing: boolean;
  dubbingProgress: number;
  dubbingMessage: string;
  hasDubbedOutput: boolean;
  onStartDubbing: () => void;
  onNext: () => void;
}

const GENERATION_STEPS = [
  { id: 1, title: 'Stem Extraction', desc: 'បំបែកសាច់ភ្លេង BGM និងសំឡេងដើម (Demucs)', icon: '🎵' },
  { id: 2, title: 'AI Translation & Diarization', desc: 'Gemini 3.5 កំណត់តួអង្គ និងបកប្រែពាក្យពេចន៍', icon: '🧠' },
  { id: 3, title: 'Character Voice Cloning', desc: 'សំឡេងតួអង្គខ្មែរតាម Timbre 1:1 (VoxCPM / Neural)', icon: '🎙️' },
  { id: 4, title: 'Master Assembly & Lip-Sync', desc: 'សមកាលកម្មពេលវេលា និង Audio Ducking BGM', icon: '🎚️' },
];

export const Step5Generating: React.FC<Step5GeneratingProps> = ({
  uploadedFile,
  segments,
  isDubbing,
  dubbingProgress,
  dubbingMessage,
  hasDubbedOutput,
  onStartDubbing,
  onNext,
}) => {
  // Automatically start dubbing if we haven't started yet and don't have output
  useEffect(() => {
    if (!isDubbing && !hasDubbedOutput) {
      onStartDubbing();
    }
  }, []);

  // Automatically go to next step if dubbing is complete
  useEffect(() => {
    if (!isDubbing && hasDubbedOutput) {
      const timer = setTimeout(() => {
        onNext();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isDubbing, hasDubbedOutput, onNext]);

  const uniqueCharsCount = new Set(segments.map((s) => s.speaker_name || s.speaker_id)).size;

  // Determine active step index
  const activeStepIdx = hasDubbedOutput
    ? 4
    : dubbingProgress > 75
    ? 3
    : dubbingProgress > 45
    ? 2
    : dubbingProgress > 15
    ? 1
    : 0;

  return (
    <div className="flex flex-col h-full items-center justify-center p-6 md:p-10 relative overflow-hidden bg-slate-100/90 dark:bg-[#05070d]">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-sky-500/10 via-indigo-500/10 to-transparent blur-[140px] rounded-full pointer-events-none" />

      <div className="w-full max-w-3xl flex flex-col gap-6 relative z-10">
        {/* Do Not Close Banner */}
        <div className="flex items-center gap-3.5 p-3.5 px-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/25 backdrop-blur-md shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">ដំណើរការបញ្ចូលសំឡេង AI កំពុងដំណើរការ</h4>
            <p className="text-[11px] text-amber-800 dark:text-amber-400/80 leading-relaxed truncate sm:whitespace-normal">
              សូមកុំបិទទំព័រ ឬបិទកម្មវិធីកំឡុងពេលនេះ ដើម្បីកុំឱ្យរអាក់រអួលដល់ការបង្កើត Voice Stems។
            </p>
          </div>
        </div>

        {/* Main Processing Hub Card */}
        <div className="rounded-3xl border border-slate-200 dark:border-white/[0.12] bg-white/95 dark:bg-[#090c16]/90 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/80 flex flex-col gap-6">
          {/* Header Progress Hero */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative mb-5">
              {hasDubbedOutput ? (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-600/30 flex items-center justify-center border border-emerald-400/50 shadow-[0_0_40px_rgba(16,185,129,0.35)] animate-in zoom-in-90 duration-300">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-300" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-600/20 flex items-center justify-center border border-sky-400/40 shadow-[0_0_35px_rgba(14,165,233,0.25)] relative">
                  <Wand2 className={`w-9 h-9 text-sky-600 dark:text-sky-400 ${isDubbing ? 'animate-pulse' : ''}`} />
                  {isDubbing && (
                    <svg className="absolute inset-0 w-full h-full animate-spin text-sky-600 dark:text-sky-400" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="46"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeDasharray="140 140"
                        strokeLinecap="round"
                        className="opacity-70"
                      />
                    </svg>
                  )}
                </div>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1.5 tracking-wide font-ui">
              {hasDubbedOutput ? 'បង្កើតសំឡេងខ្មែរជោគជ័យ!' : 'កំពុងបង្កើតសំឡេងតួអង្គខ្មែរ AI...'}
            </h2>
            <p className="text-xs font-mono text-slate-600 dark:text-slate-400 max-w-md truncate px-4 py-1 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]">
              {hasDubbedOutput
                ? 'Master Dubbing Complete. Directing to Studio...'
                : dubbingMessage || 'ប្រព័ន្ធកំពុងសំយោគសំឡេងខ្មែរ...'}
            </p>
          </div>

          {/* Glowing Multi-Track Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Overall Studio Progress</span>
              </span>
              <span className="text-sky-800 dark:text-sky-300 font-mono text-sm">{hasDubbedOutput ? 100 : dubbingProgress}%</span>
            </div>

            <div className="h-3 rounded-full bg-slate-200 dark:bg-black/60 overflow-hidden border border-slate-300 dark:border-white/10 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 shadow-md ${
                  hasDubbedOutput
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 shadow-sky-500/30'
                }`}
                style={{ width: `${hasDubbedOutput ? 100 : dubbingProgress}%` }}
              />
            </div>
          </div>

          {/* 4-Stage Micro Pipeline Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {GENERATION_STEPS.map((stg, i) => {
              const isPassed = activeStepIdx > i || hasDubbedOutput;
              const isCurrent = activeStepIdx === i && isDubbing;
              return (
                <div
                  key={stg.id}
                  className={`p-2.5 rounded-xl border transition-all flex items-center gap-2.5 text-xs shadow-2xs ${
                    isCurrent
                      ? 'bg-sky-50 dark:bg-sky-500/15 border-sky-400 text-sky-950 dark:text-white shadow-md shadow-sky-500/15'
                      : isPassed
                      ? 'bg-emerald-50 dark:bg-emerald-500/[0.08] border-emerald-300 dark:border-emerald-500/25 text-emerald-950 dark:text-slate-300'
                      : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.05] text-slate-500 opacity-60'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${
                      isCurrent
                        ? 'bg-sky-500 text-white animate-pulse'
                        : isPassed
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {isPassed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : isCurrent ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : stg.id}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate text-[11.5px]">{stg.icon} {stg.title}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{stg.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Project Summary Telemetry Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-slate-200 dark:border-white/[0.08]">
            <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] shadow-2xs">
              <Film className="w-4 h-4 text-sky-600 dark:text-sky-400 mb-1" />
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Video Source</span>
              <span className="text-xs text-slate-800 dark:text-slate-200 font-semibold truncate w-full px-1" title={uploadedFile?.filename}>
                {uploadedFile?.originalName || uploadedFile?.filename || 'Movie File'}
              </span>
            </div>

            <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] shadow-2xs">
              <UserCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mb-1" />
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Unique Cast</span>
              <span className="text-xs text-slate-800 dark:text-slate-200 font-semibold">{uniqueCharsCount || 1} Characters</span>
            </div>

            <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] shadow-2xs">
              <AlignLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Dialogue Lines</span>
              <span className="text-xs text-slate-800 dark:text-slate-200 font-semibold">{segments.length} Lines</span>
            </div>

            <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] shadow-2xs">
              <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400 mb-1" />
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Master Audio</span>
              <span className="text-xs text-slate-800 dark:text-slate-200 font-semibold">Khmer Stem Mix</span>
            </div>
          </div>

          {/* Completed Next Button */}
          {hasDubbedOutput && (
            <button
              onClick={onNext}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
            >
              <span>ចូលមើលលទ្ធផលក្នុង Studio (View Results)</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
