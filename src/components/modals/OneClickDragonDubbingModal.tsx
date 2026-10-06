import React, { useState, useEffect, useRef } from 'react';
import {
  X, Zap, Play, CheckCircle2, Film, Sparkles, Layers, Volume2,
  Languages, Users, AlertCircle, Loader2, RotateCcw, Download,
  ChevronDown, ChevronUp, Copy,
} from 'lucide-react';
import { DragonButton } from '../dragon/DragonButton';
import { ProjectFile } from '../../types';
import { api } from '../../services/api';
import { DragonAIModeSelector, DragonAIMode } from '../ai/DragonAIModeSelector';

interface OneClickDragonDubbingModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoFile: ProjectFile | null;
  onDubbingComplete?: (videoUrl: string) => void;
  onComplete?: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

interface StepState {
  status: 'pending' | 'running' | 'done' | 'error' | 'skipped';
  message?: string;
}

const PIPELINE_STEPS = [
  { id: 'preflight',   label: 'Preflight Check',              khmer: 'ពិនិត្យ Hardware & AI Mode' },
  { id: 'validate',    label: 'Validate Video',               khmer: 'ពិនិត្យ File វីដេអូ' },
  { id: 'disk',        label: 'Check Disk Space',             khmer: 'ពិនិត្យ Disk ទំហំ' },
  { id: 'extract',     label: 'Extract Audio',                khmer: 'ទាញ Audio ពីវីដេអូ' },
  { id: 'asr',         label: 'Speech Recognition',           khmer: 'ស្គាល់ការនិយាយ & Timestamp' },
  { id: 'speakers',    label: 'Detect Speakers',              khmer: 'បែងចែកអ្នកនិយាយ / តួអង្គ' },
  { id: 'translate',   label: 'Translate → Khmer',            khmer: 'បកប្រែជាខ្មែរធម្មជាតិ' },
  { id: 'voices',      label: 'Generate Khmer Voices',        khmer: 'បង្កើតសំឡេង AI ខ្មែរ' },
  { id: 'separation',  label: 'BGM / SFX Separation',         khmer: 'ញែក BGM + SFX ចេញ' },
  { id: 'mix',         label: 'Mix Master Audio',             khmer: 'លាយ Audio Master Final' },
  { id: 'subtitles',   label: 'Generate Subtitles',           khmer: 'បង្កើត Subtitle ខ្មែរ' },
  { id: 'render',      label: 'Render Final Video',           khmer: 'Render វីដេអូ 1080p' },
];

const STEP_ICONS: Record<string, React.ComponentType<any>> = {
  preflight: Sparkles, validate: Film, disk: Layers, extract: Volume2,
  asr: Languages, speakers: Users, translate: Sparkles, voices: Zap,
  separation: Volume2, mix: Volume2, subtitles: Languages, render: Film,
};

// Map backend status → step index
function mapStatusToStep(status: string): number {
  const map: Record<string, number> = {
    extracting: 3, dubbing_khmer: 4, translating: 6,
    generating: 7, mixing: 9, rendering: 11, completed: 12,
  };
  return map[status] ?? -1;
}

export const OneClickDragonDubbingModal: React.FC<OneClickDragonDubbingModalProps> = ({
  isOpen, onClose, videoFile, onDubbingComplete, onShowToast,
}) => {
  const [aiMode, setAiMode] = useState<DragonAIMode>('khmer_neural_offline');
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [outputVideo, setOutputVideo] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [stepStates, setStepStates] = useState<Record<string, StepState>>({});
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [showLog, setShowLog] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const addLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogLines(prev => [...prev.slice(-199), `[${ts}] ${msg}`]);
  };

  const markStep = (id: string, status: StepState['status'], message?: string) => {
    setStepStates(prev => ({ ...prev, [id]: { status, message } }));
    if (status === 'running') setCurrentStepId(id);
  };

  const runPreflightChecks = async (): Promise<boolean> => {
    markStep('preflight', 'running');
    addLog('Running preflight checks...');

    // Check file
    markStep('validate', 'running');
    if (!videoFile) {
      setErrorMessage('សូមជ្រើសរើស ឬបញ្ចូលវីដេអូជាមុនសិន!');
      markStep('validate', 'error', 'No video selected');
      markStep('preflight', 'error');
      return false;
    }
    addLog(`✓ Video: ${videoFile.filename}`);
    markStep('validate', 'done');

    // Check disk
    markStep('disk', 'running');
    try {
      const diskRes = await api.checkStorage('render', videoFile.duration || 60);
      if (!diskRes.ok) {
        setErrorMessage(`Disk ទំហំមិនគ្រប់: ${diskRes.message}`);
        markStep('disk', 'error', diskRes.message);
        markStep('preflight', 'error');
        return false;
      }
      addLog(`✓ Disk free: ${diskRes.freeGb.toFixed(1)}GB`);
    } catch {
      addLog('⚠ Disk check skipped (non-fatal)');
    }
    markStep('disk', 'done');

    // Check AI hardware
    try {
      const hwCheck = await api.checkAiHardware(
        aiMode === 'voxcpm2_local' ? 'faster-whisper-medium' :
        aiMode === 'claude_cloud' ? 'cloud-translation' : 'edge-tts-offline'
      );
      if (!hwCheck.canRun && aiMode === 'voxcpm2_local') {
        setErrorMessage(`Hardware មិនអាចដំណើរការ ${hwCheck.modelLabel}: ${hwCheck.reason}`);
        markStep('preflight', 'error');
        return false;
      }
      addLog(`✓ AI mode: ${aiMode} — ${hwCheck.statusLabel ?? 'OK'}`);
    } catch {
      addLog('⚠ AI hardware check skipped');
    }

    markStep('preflight', 'done');
    return true;
  };

  const handleStartDubbing = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setErrorMessage(null);
    setErrorId(null);
    setOutputVideo(null);
    setProgress(0);
    setLogLines([]);
    setStepStates({});
    setCurrentStepId(null);

    addLog(`🐉 Dragon Dubbing started — AI Mode: ${aiMode}`);
    onShowToast('⚡ Dragon Dubbing Pipeline ចាប់ផ្ដើម...', 'info');

    // PHASE 1: Preflight
    const ok = await runPreflightChecks();
    if (!ok) { setIsRunning(false); return; }

    // PHASE 2: Start real backend job
    try {
      markStep('extract', 'running');
      addLog(`POST /api/dubbing/start — file: ${videoFile!.filename}`);

      // Map AI mode to backend voiceMode param
      const voiceModeMap: Record<DragonAIMode, string> = {
        voxcpm2_local: 'voice_actor_clone',
        claude_cloud: 'movie_clone_all',
        khmer_neural_offline: 'pure_khmer',
      };

      const startRes = await api.startDubbing({
        filename: videoFile!.filename,
        sourceLang: 'zh',
        targetLang: 'km',
        scope: 'full',
        voiceMode: voiceModeMap[aiMode],
        aiMode,
      });

      if (!startRes?.jobId) throw new Error('Server មិនបានបង្កើត Job ID');
      const jid = startRes.jobId;
      setJobId(jid);
      addLog(`✓ Job created: ${jid}`);

      // PHASE 3: Poll real backend status
      pollRef.current = setInterval(async () => {
        try {
          const status = await api.getDubbingStatus(jid);
          if (!status) return;

          const pct = Math.min(99, status.progress ?? 0);
          setProgress(pct);
          addLog(`[${jid}] ${status.status} — ${pct}% — ${status.message ?? ''}`);

          // Map backend step to UI steps
          const stepIdx = mapStatusToStep(status.status);
          PIPELINE_STEPS.forEach((s, i) => {
            if (i < stepIdx) markStep(s.id, 'done');
            else if (i === stepIdx) markStep(s.id, 'running', status.message);
          });

          if (status.status === 'completed') {
            clearInterval(pollRef.current!);
            PIPELINE_STEPS.forEach(s => markStep(s.id, 'done'));
            setProgress(100);
            const vidUrl = status.outputVideo ?? '';
            setOutputVideo(vidUrl);
            onDubbingComplete?.(vidUrl);
            onShowToast('🎉 Dragon Dubbing ជោគជ័យ 100%!', 'success');
            addLog(`✓ Output: ${vidUrl}`);
            setIsRunning(false);
          } else if (status.status === 'failed') {
            clearInterval(pollRef.current!);
            const errMsg = status.error ?? 'ការ Dubbing បរាជ័យ';
            const errId = `DRAGON-ERR-${Date.now().toString(36).toUpperCase()}`;
            setErrorMessage(errMsg);
            setErrorId(errId);
            setCurrentStepId(null);
            addLog(`❌ FAILED [${errId}]: ${errMsg}`);
            onShowToast(`❌ ${errMsg}`, 'error');
            setIsRunning(false);
          } else if (status.status === 'cancelled') {
            clearInterval(pollRef.current!);
            setIsRunning(false);
            addLog('⛔ Job cancelled');
          }
        } catch (pollErr: any) {
          addLog(`⚠ Poll error: ${pollErr.message}`);
        }
      }, 2500);

    } catch (err: any) {
      setErrorMessage(err.message || 'ការ Dubbing បរាជ័យ');
      const eid = `DRAGON-ERR-${Date.now().toString(36).toUpperCase()}`;
      setErrorId(eid);
      addLog(`❌ [${eid}] ${err.message}`);
      onShowToast(`❌ ${err.message}`, 'error');
      setIsRunning(false);
    }
  };

  const handleRetry = async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    await handleStartDubbing();
  };

  const handleCancel = async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (jobId) {
      try { await api.executeBatchAction({ batchId: jobId, action: 'cancel' }); } catch { /* no-op */ }
    }
    setIsRunning(false);
    addLog('⛔ Cancelled by user');
    onShowToast('បានបោះបង់ Dragon Dubbing', 'info');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-md" />

      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0B111C] border border-slate-200 dark:border-[#203244] rounded-2xl shadow-2xl overflow-hidden font-khmer z-10">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-[#203244] bg-gradient-to-r from-[#101925] via-[#152235] to-[#101925] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#16D9FF] via-[#00FFA8] to-[#8B5CF6] flex items-center justify-center shadow-[0_0_20px_rgba(0,255,168,0.4)]">
              <Zap className="w-5 h-5 text-[#070A12] fill-[#070A12]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white tracking-wide">⚡ 1-CLICK DRAGON DUBBING</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#00FFA8]/20 border border-[#00FFA8]/40 text-[#00FFA8] text-[9px] font-mono font-bold">REAL PIPELINE</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {videoFile?.filename ?? 'មិនទាន់ជ្រើស Video ទេ'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* AI Mode Selector toggle */}
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] overflow-hidden">
            <button
              type="button"
              disabled={isRunning}
              onClick={() => setShowModeSelector(p => !p)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white/[0.05] transition-colors"
            >
              <span>🤖 AI Engine: <span className="text-[#00C2FF]">{aiMode === 'voxcpm2_local' ? 'VoxCPM2 Local' : aiMode === 'claude_cloud' ? 'Claude Cloud' : 'Khmer Neural Offline'}</span></span>
              {showModeSelector ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showModeSelector && (
              <div className="px-4 pb-4 pt-1 border-t border-white/[0.06]">
                <DragonAIModeSelector selectedMode={aiMode} onModeChange={setAiMode} disabled={isRunning} />
              </div>
            )}
          </div>

          {/* Error banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs space-y-2">
              <div className="flex items-start gap-2 text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              {errorId && (
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span>Error ID: <code className="bg-slate-800/50 px-1 rounded text-red-300">{errorId}</code></span>
                  <button onClick={() => navigator.clipboard?.writeText(errorId ?? '')} className="flex items-center gap-0.5 hover:text-slate-300 transition-colors">
                    <Copy className="w-3 h-3" /> ចម្លង
                  </button>
                </div>
              )}
              <button onClick={handleRetry} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-[11px] font-bold hover:bg-red-500/30 transition-colors">
                <RotateCcw className="w-3 h-3" /> សាកល្បងម្ដងទៀត
              </button>
            </div>
          )}

          {/* Pipeline Steps */}
          <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
            {PIPELINE_STEPS.map((step) => {
              const Icon = STEP_ICONS[step.id] ?? Film;
              const state = stepStates[step.id];
              const isDone = state?.status === 'done';
              const isCurrent = state?.status === 'running';
              const isError = state?.status === 'error';
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-all text-xs ${
                    isDone ? 'border-[#00FFA8]/25 bg-[#00FFA8]/5 text-slate-200'
                    : isCurrent ? 'border-[#16D9FF]/50 bg-[#16D9FF]/10 text-white shadow-[0_0_12px_rgba(22,217,255,0.2)]'
                    : isError ? 'border-red-500/40 bg-red-500/10 text-red-300'
                    : 'border-white/[0.05] bg-white/[0.01] text-slate-600 opacity-60'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold ${
                    isDone ? 'bg-[#00FFA8]/20 text-[#00FFA8]'
                    : isCurrent ? 'bg-[#16D9FF]/20 text-[#16D9FF]'
                    : isError ? 'bg-red-500/20 text-red-400'
                    : 'bg-white/[0.04] text-slate-500'
                  }`}>
                    {isDone ? '✓' : isError ? '✗' : isCurrent ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold leading-tight">{step.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {isCurrent && state?.message ? state.message : step.khmer}
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold ${isDone ? 'text-[#00FFA8]' : isCurrent ? 'text-[#16D9FF] animate-pulse' : isError ? 'text-red-400' : 'text-slate-600'}`}>
                    {isDone ? 'រួចរាល់' : isCurrent ? 'កំពុងដំណើរ...' : isError ? 'បរាជ័យ' : 'រង់ចាំ'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>វឌ្ឍនភាពសរុប</span>
              <span className="font-mono text-[#00FFA8]">{progress}%</span>
            </div>
            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#16D9FF] via-[#00FFA8] to-[#8B5CF6] transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Log drawer */}
          <div>
            <button onClick={() => setShowLog(p => !p)} className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
              {showLog ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <span>មើល Log ({logLines.length} entries)</span>
            </button>
            {showLog && (
              <div className="mt-2 bg-black/40 rounded-xl border border-white/[0.06] p-3 max-h-32 overflow-y-auto font-mono text-[10px] text-slate-400 space-y-0.5">
                {logLines.length === 0 ? <span className="text-slate-600">មិនទាន់មាន log ទេ</span>
                  : logLines.map((l, i) => <div key={i}>{l}</div>)}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            {isRunning ? (
              <button onClick={handleCancel} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold hover:bg-red-500/25 transition-colors">
                <X className="w-3.5 h-3.5" /> បោះបង់
              </button>
            ) : (
              <span className="text-[10px] text-slate-600">💡 Pipeline ទាំងមូលដំណើរការ Backend ពិត</span>
            )}

            {outputVideo ? (
              <div className="flex gap-2">
                <a href={outputVideo} download className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/25 transition-colors">
                  <Download className="w-3.5 h-3.5" /> ទាញ​យក
                </a>
                <DragonButton variant="jade" size="md" icon={<Play className="w-4 h-4" />} onClick={() => { onDubbingComplete?.(outputVideo); onClose(); }}>
                  ចាក់លទ្ធផល
                </DragonButton>
              </div>
            ) : (
              <DragonButton
                variant="energy"
                size="md"
                onClick={handleStartDubbing}
                loading={isRunning}
                icon={<Zap className="w-4 h-4" />}
                disabled={!videoFile || isRunning}
              >
                {isRunning ? `${progress}% កំពុងដំណើរ...` : '⚡ ចាប់ផ្ដើម Dragon Dubbing'}
              </DragonButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
