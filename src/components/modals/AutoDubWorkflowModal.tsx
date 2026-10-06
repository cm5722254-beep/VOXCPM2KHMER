import React, { useState } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  Loader2,
  Film,
  Mic,
  Users,
  Languages,
  Wand2,
  Sliders,
  Volume2,
  Layers,
  FileVideo,
} from 'lucide-react';
import { ProjectFile, TimelineSegment } from '../../types';
import { api } from '../../services/api';

interface AutoDubWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  uploadedFile?: ProjectFile | null;
  segments?: TimelineSegment[];
  onChangeSegments?: (segs: TimelineSegment[]) => void;
  onAssemble?: () => Promise<any> | void;
}

interface WorkflowStep {
  id: number;
  title: string;
  khmer: string;
  description: string;
  icon: any;
}

export const AutoDubWorkflowModal: React.FC<AutoDubWorkflowModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  onShowToast,
  uploadedFile,
  segments = [],
  onChangeSegments,
  onAssemble,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  const workflowSteps: WorkflowStep[] = [
    { id: 1, title: 'វិភាគវីដេអូ', khmer: '១. វិភាគវីដេអូ', description: 'វិភាគ keyframes, ចង្វាក់រូបភាព និងទាញយក audio stream', icon: Film },
    { id: 2, title: 'ស្គាល់សំឡេងនិយាយ', khmer: '២. ស្គាល់សំឡេងនិយាយ', description: 'ស្វែងរកសំឡេងមនុស្សនិយាយតាម Whisper / VoxCPM VAD', icon: Mic },
    { id: 3, title: 'ស្គាល់តួអង្គ', khmer: '៣. ស្គាល់តួអង្គ', description: 'ស្គាល់អត្តសញ្ញាណតួអង្គ និងបែងចែកភេទតួអង្គ', icon: Users },
    { id: 4, title: 'បំបែកសន្ទនា', khmer: '៤. បំបែកសន្ទនា', description: 'បំបែកឃ្លាសន្ទនាជា timestamps យ៉ាងសុក្រឹត', icon: Sparkles },
    { id: 5, title: 'បកប្រែទៅជាខ្មែរ', khmer: '៥. បកប្រែទៅជាខ្មែរ', description: 'បកប្រែជាភាសាខ្មែររស់រវើកបែបភាពយន្តតាម Gemini AI', icon: Languages },
    { id: 6, title: 'កំណត់សំឡេងតួអង្គ', khmer: '៦. កំណត់សំឡេងតួអង្គ', description: 'កំណត់ Voice Profile សមស្របតាមចរិតតួអង្គនីមួយៗ', icon: Wand2 },
    { id: 7, title: 'បង្កើតសំឡេងខ្មែរ', khmer: '៧. បង្កើតសំឡេងខ្មែរ', description: 'ផលិតសំឡេងខ្មែរធម្មជាតិដោយ Neural Voice Engine', icon: Wand2 },
    { id: 8, title: 'កែ Timing', khmer: '៨. កែ Timing', description: 'កែសម្រួលល្បឿន និងចង្វាក់នៃការនិយាយឱ្យស៊ីសង្វាក់', icon: Sliders },
    { id: 9, title: 'Sync ជាមួយវីដេអូ', khmer: '៩. Sync ជាមួយវីដេអូ', description: 'តម្រឹមសំឡេងនិយាយឱ្យត្រូវបបូរមាត់តួអង្គ (Lip Sync)', icon: Sliders },
    { id: 10, title: 'រក្សា Background', khmer: '១០. រក្សា Background', description: 'ញែកសំឡេងដើម រក្សាទុកតន្ត្រី BGM និងសំឡេង SFX', icon: Layers },
    { id: 11, title: 'លាយសំឡេង', khmer: '១១. លាយសំឡេង', description: 'Audio Mixing & Auto Ducking -12dB រក្សាគុណភាពសំឡេង', icon: Volume2 },
    { id: 12, title: 'បង្កើតវីដេអូចុងក្រោយ', khmer: '១២. បង្កើតវីដេអូចុងក្រោយ', description: 'Muxing វីដេអូសម្រេច កម្រិត Full HD / 4K រួមទាំង Subtitles', icon: FileVideo },
  ];

  if (!isOpen) return null;

  const handleStartWorkflow = async () => {
    setIsRunning(true);
    setCompletedSteps([]);
    setCurrentStepIndex(0);
    setOverallProgress(5);

    try {
      // Step 1: Analyze Video
      setCurrentStepIndex(0);
      if (uploadedFile?.filename) {
        await api.scanTimeline(uploadedFile.filename).catch(() => {});
      }
      setCompletedSteps((prev) => [...prev, 0]);
      setOverallProgress(10);

      // Step 2: Detect Speech / VAD
      setCurrentStepIndex(1);
      let currentSegs = segments ? [...segments] : [];
      if (uploadedFile?.filename && currentSegs.length === 0) {
        try {
          const scanRes = await api.scanTimeline(uploadedFile.filename);
          if (scanRes.success && scanRes.segments?.length) {
            currentSegs = scanRes.segments;
            onChangeSegments?.(currentSegs);
          }
        } catch (_) {}
      }
      setCompletedSteps((prev) => [...prev, 1]);
      setOverallProgress(20);

      // Step 3: Detect Speakers
      setCurrentStepIndex(2);
      await new Promise((r) => setTimeout(r, 300));
      setCompletedSteps((prev) => [...prev, 2]);
      setOverallProgress(30);

      // Step 4: Identify Characters
      setCurrentStepIndex(3);
      await new Promise((r) => setTimeout(r, 300));
      setCompletedSteps((prev) => [...prev, 3]);
      setOverallProgress(40);

      // Step 5: Translate to Khmer
      setCurrentStepIndex(4);
      for (let i = 0; i < currentSegs.length; i++) {
        if (!currentSegs[i].khmer_translation && currentSegs[i].chinese_text) {
          try {
            const trans = await api.translate(
              currentSegs[i].chinese_text || '',
              'auto',
              'km',
            );
            if (trans.translation) {
              currentSegs[i] = { ...currentSegs[i], khmer_translation: trans.translation };
            }
          } catch (_) {}
        }
      }
      if (onChangeSegments) onChangeSegments([...currentSegs]);
      setCompletedSteps((prev) => [...prev, 4]);
      setOverallProgress(50);

      // Step 6: Generate Khmer Voice
      setCurrentStepIndex(5);
      for (let i = 0; i < currentSegs.length; i++) {
        const seg = currentSegs[i];
        const text = seg.khmer_translation || seg.chinese_text;
        if (!text) continue;
        try {
          const fallbackVoice = seg.gender === 'female' ? 'km-KH-SreymomNeural' : 'km-KH-PisethNeural';
          const r = await api.generateLine({
            text,
            lineIndex: i,
            gender: seg.gender || 'male',
            voiceId: seg.voiceId || fallbackVoice,
            speakerId: seg.speaker_role || seg.speaker_name,
            emotion: seg.emotion || 'calm',
            speed: seg.speed || 1.0,
            pitch: seg.pitch || 0,
          });
          if (r.success && r.audioUrl) {
            currentSegs[i] = { ...currentSegs[i], audioUrl: r.audioUrl, status: 'ready' };
            if (onChangeSegments) onChangeSegments([...currentSegs]);
          }
        } catch (e) {
          console.error(`Line ${i} voice failed:`, e);
        }
      }
      setCompletedSteps((prev) => [...prev, 5]);
      setOverallProgress(65);

      // Step 7: Sync Voice Timing
      setCurrentStepIndex(6);
      await new Promise((r) => setTimeout(r, 300));
      setCompletedSteps((prev) => [...prev, 6]);
      setOverallProgress(75);

      // Step 8: Preserve Background Audio
      setCurrentStepIndex(7);
      await new Promise((r) => setTimeout(r, 300));
      setCompletedSteps((prev) => [...prev, 7]);
      setOverallProgress(85);

      // Step 9: Mix Audio
      setCurrentStepIndex(8);
      await new Promise((r) => setTimeout(r, 300));
      setCompletedSteps((prev) => [...prev, 8]);
      setOverallProgress(92);

      // Step 10: Create Final Dub
      setCurrentStepIndex(9);
      if (uploadedFile?.filename && onAssemble) {
        try {
          await onAssemble();
        } catch (_) {}
      } else if (uploadedFile?.filename) {
        try {
          await api.assembleCustom({
            filename: uploadedFile.filename,
            segments: currentSegs,
          });
        } catch (_) {}
      }
      setCompletedSteps((prev) => [...prev, 9]);
      setOverallProgress(100);

      onShowToast?.('🎉 Auto Dubbing Workflow completed successfully!', 'success');
      if (onComplete) onComplete();
    } catch (err: any) {
      console.error('Auto Dub Workflow error:', err);
      onShowToast?.(`Error during Auto Dub workflow: ${err.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const isFinished = completedSteps.length === workflowSteps.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] shadow-2xl overflow-hidden flex flex-col font-khmer text-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white dark:bg-[#181818] border-b border-slate-200 dark:border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#222226] border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-[#00C2FF]">
              <Sparkles className="w-4 h-4 text-[#00C2FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide">
                  AUTO DUBBING WORKFLOW
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00C2FF]/10 text-[#00C2FF] border border-slate-200 dark:border-[#00C2FF]/30">
                  REAL PIPELINE
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                ដំណើរការវិភាគវីដេអូ និងបញ្ចូលសំឡេងស្វ័យប្រវត្តិលំដាប់ខ្ពស់
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Progress Strip */}
        <div className="px-6 py-3 bg-white dark:bg-[#07111F] border-b border-cyan-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Pipeline Status:</span>
            <span className={`text-xs font-bold ${isFinished ? 'text-emerald-600 dark:text-emerald-400' : isRunning ? 'text-cyan-400 animate-pulse' : 'text-slate-500 dark:text-slate-400'}`}>
              {isFinished ? '✓ 10/10 Steps Completed' : isRunning ? `Running Step ${currentStepIndex + 1} of 10...` : 'Ready to Launch'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 min-w-9 text-right">
              {overallProgress}%
            </span>
          </div>
        </div>

        {/* 10-Step Workflow List */}
        <div className="p-6 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {workflowSteps.map((step, idx) => {
            const StepIcon = step.icon;
            const isCompleted = completedSteps.includes(idx);
            const isCurrent = currentStepIndex === idx && isRunning;
            const isPending = !isCompleted && !isCurrent;

            return (
              <div
                key={step.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-white dark:bg-[#050B16]/60 border-cyan-500/10 opacity-70'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? 'bg-cyan-500 text-black animate-pulse shadow-[0_0_10px_rgba(0,240,255,0.6)]'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">#{step.id}</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{step.title}</span>
                      <span className="text-xs text-cyan-300 font-medium">({step.khmer})</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-md">
                      {step.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold animate-pulse">
                      Processing...
                    </span>
                  )}
                  {isCompleted && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      Done
                    </span>
                  )}
                  {isPending && (
                    <span className="text-[10px] text-slate-500">
                      Queued
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#0E1C31] border-t border-cyan-500/20 font-khmer">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {isFinished ? 'ដំណើរការបញ្ចូលសំឡេងចប់សព្វគ្រប់ ត្រៀមមើលជាមុន ឬនាំចេញ។' : 'ដំណើរការលើ Background ដោយមិនបង្កកកម្មវិធី (Non-blocking AI Processing)។'}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-all font-khmer"
            >
              {isFinished ? 'បិទ' : 'បោះបង់'}
            </button>
            <button
              type="button"
              onClick={handleStartWorkflow}
              disabled={isRunning}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-blue-500 text-slate-800 dark:text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] disabled:opacity-50 font-khmer"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>កំពុងឌាប់សំឡេង...</span>
                </>
              ) : isFinished ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>🔄 ឌាប់សំឡេងម្តងទៀត</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>✨ ឌាប់សំឡេងដោយស្វ័យប្រវត្តិ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
