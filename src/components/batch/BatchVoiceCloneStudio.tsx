import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, Plus, X, Play, RotateCcw, CheckCircle2, AlertCircle,
  Loader2, FileVideo, Download, ChevronDown, ChevronUp,
  Users, Clock, Zap, Shield,
} from 'lucide-react';
import { api } from '../../services/api';
import { DragonAIModeSelector, DragonAIMode } from '../ai/DragonAIModeSelector';

// ─── Types ────────────────────────────────────────────────────────────────────
interface EpisodeEntry {
  localId: string;
  label: string;
  filename: string;    // server filename from upload
  displayName: string; // user-visible name
  file?: File;
  uploadProgress: number;
  uploadDone: boolean;
  uploadError?: string;
}

interface EpisodeStatus {
  episode_index: number;
  episode_label: string;
  status: 'queued' | 'extracting' | 'detecting' | 'cloning' | 'done' | 'failed';
  progress: number;
  message: string;
  voice_profiles: Array<{ speaker_id: string; profile_url: string; quality_score: number }>;
  speakers_found: number;
  error?: string;
  logs: string[];
}

interface BatchStatus {
  batch_id: string;
  status: string;
  total_episodes: number;
  completed_episodes: number;
  failed_episodes: number;
  safe_concurrency: number;
  episodes: EpisodeStatus[];
}

const STATUS_COLORS: Record<string, string> = {
  queued:     'text-slate-400',
  extracting: 'text-blue-400',
  detecting:  'text-yellow-400',
  cloning:    'text-purple-400',
  done:       'text-emerald-400',
  failed:     'text-red-400',
};

const STATUS_LABELS_KH: Record<string, string> = {
  queued:     'រង់ចាំ',
  extracting: 'កំពុងទាញ Audio',
  detecting:  'ស្ វែង Speaker',
  cloning:    'Clone Voice',
  done:       'ជោគជ័យ ✓',
  failed:     'បរាជ័យ ✗',
};

// ─── Component ────────────────────────────────────────────────────────────────
export const BatchVoiceCloneStudio: React.FC = () => {
  const [episodes, setEpisodes] = useState<EpisodeEntry[]>([]);
  const [aiMode, setAiMode] = useState<DragonAIMode>('khmer_neural_offline');
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedEp, setExpandedEp] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Upload helpers ──────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - episodes.length);
    if (!files.length) return;
    const newEps: EpisodeEntry[] = files.map((f, i) => ({
      localId: `ep_${Date.now()}_${i}`,
      label: `ភាគទី ${episodes.length + i + 1}`,
      filename: '',
      displayName: f.name,
      file: f,
      uploadProgress: 0,
      uploadDone: false,
    }));
    setEpisodes(prev => [...prev, ...newEps]);
    // Upload each file
    newEps.forEach(ep => uploadEpisodeFile(ep.localId, ep.file!));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadEpisodeFile = async (localId: string, file: File) => {
    try {
      const res = await api.uploadFile(file, (pct) => {
        setEpisodes(prev => prev.map(e => e.localId === localId ? { ...e, uploadProgress: pct } : e));
      });
      setEpisodes(prev => prev.map(e =>
        e.localId === localId
          ? { ...e, filename: res.filename, uploadDone: true, uploadProgress: 100, uploadError: undefined }
          : e
      ));
    } catch (err: any) {
      setEpisodes(prev => prev.map(e =>
        e.localId === localId ? { ...e, uploadError: err.message, uploadProgress: 0 } : e
      ));
      showToast(`Upload failed: ${err.message}`, 'error');
    }
  };

  const removeEpisode = (localId: string) => {
    setEpisodes(prev => prev.filter(e => e.localId !== localId));
  };

  const updateLabel = (localId: string, label: string) => {
    setEpisodes(prev => prev.map(e => e.localId === localId ? { ...e, label } : e));
  };

  // ── Start Batch ─────────────────────────────────────────────────────────────
  const handleStartBatch = async () => {
    const ready = episodes.filter(e => e.uploadDone && e.filename);
    if (ready.length === 0) { showToast('Upload episodes ជាមុនសិន!', 'error'); return; }

    setIsRunning(true);
    setBatchStatus(null);
    showToast('🎙️ Batch Voice Clone ចាប់ផ្ដើម...', 'info');

    try {
      const res = await fetch('/api/batch/voice-clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_title: `Voice Clone — ${new Date().toLocaleString('km-KH')}`,
          ai_mode: aiMode,
          max_concurrency: 2,
          episodes: ready.map((e, i) => ({
            episode_index: i,
            episode_label: e.label,
            filename: e.filename,
            source_language: 'zh',
          })),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.detail ?? data.message ?? 'Server error');

      setBatchId(data.batch_id);
      showToast(`Batch ${data.batch_id} ចាប់ផ្ដើម — ${data.total_episodes} episodes`, 'info');

      // Poll status
      pollRef.current = setInterval(async () => {
        try {
          const sr = await fetch(`/api/batch/voice-clone/${data.batch_id}`);
          const sd = await sr.json();
          if (sd.success && sd.batch) {
            setBatchStatus(sd.batch);
            if (['completed', 'failed', 'finished_with_errors'].includes(sd.batch.status)) {
              clearInterval(pollRef.current!);
              setIsRunning(false);
              if (sd.batch.status === 'completed') showToast('🎉 Voice Clone ទាំងអស់ជោគជ័យ!', 'success');
              else showToast(`Clone ចប់ — ${sd.batch.failed_episodes} ភាគ​បរាជ័យ`, sd.batch.failed_episodes > 0 ? 'error' : 'success');
            }
          }
        } catch { /* poll errors ignored */ }
      }, 2000);

    } catch (err: any) {
      showToast(`❌ ${err.message}`, 'error');
      setIsRunning(false);
    }
  };

  const handleRetry = async (epIndex: number) => {
    if (!batchId) return;
    try {
      const r = await fetch(`/api/batch/voice-clone/${batchId}/retry/${epIndex}`, { method: 'POST' });
      const d = await r.json();
      if (d.success) {
        setIsRunning(true);
        showToast(`Retry episode ${epIndex}...`, 'info');
        if (!pollRef.current) {
          pollRef.current = setInterval(async () => {
            try {
              const sr = await fetch(`/api/batch/voice-clone/${batchId}`);
              const sd = await sr.json();
              if (sd.success && sd.batch) {
                setBatchStatus(sd.batch);
                if (['completed', 'failed', 'finished_with_errors'].includes(sd.batch.status)) {
                  clearInterval(pollRef.current!); pollRef.current = null;
                  setIsRunning(false);
                }
              }
            } catch { /* ignored */ }
          }, 2000);
        }
      }
    } catch (err: any) { showToast(`Retry error: ${err.message}`, 'error'); }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const readyCount = episodes.filter(e => e.uploadDone).length;
  const overallProgress = batchStatus
    ? Math.round(((batchStatus.completed_episodes + batchStatus.failed_episodes) / batchStatus.total_episodes) * 100)
    : 0;

  return (
    <div className="space-y-5 font-khmer text-slate-200">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] px-4 py-3 rounded-xl shadow-xl text-sm font-bold border ${
          toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-200'
          : toast.type === 'error' ? 'bg-red-900/90 border-red-500/50 text-red-200'
          : 'bg-blue-900/90 border-blue-500/50 text-blue-200'
        }`}>{toast.msg}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-400/30 flex items-center justify-center">
            <Mic className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">🎙️ Batch Voice Clone Studio</h2>
            <p className="text-xs text-slate-400">Clone សំឡេង ៥ ភាគ ដោយឯករាជ្យ — មិនដូចគ្នារវាង Episodes</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400 font-bold">Episode Isolated</span>
        </div>
      </div>

      {/* AI Mode */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <DragonAIModeSelector selectedMode={aiMode} onModeChange={setAiMode} disabled={isRunning} compact />
      </div>

      {/* Episode List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-bold text-slate-300">Episodes ({episodes.length}/5)</span>
          {readyCount > 0 && <span className="text-emerald-400">{readyCount} ត្រៀម Upload រួចរាល់</span>}
        </div>

        {episodes.map((ep, idx) => {
          const epStatus = batchStatus?.episodes?.[idx];
          return (
            <div key={ep.localId}
              className={`rounded-xl border bg-white/[0.02] p-3 transition-all ${
                epStatus?.status === 'done' ? 'border-emerald-500/30'
                : epStatus?.status === 'failed' ? 'border-red-500/30'
                : epStatus?.status === 'queued' || epStatus?.status === 'extracting' || epStatus?.status === 'detecting' || epStatus?.status === 'cloning' ? 'border-blue-400/30'
                : 'border-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                  epStatus?.status === 'done' ? 'bg-emerald-500/20 text-emerald-400'
                  : epStatus?.status === 'failed' ? 'bg-red-500/20 text-red-400'
                  : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {epStatus?.status === 'done' ? '✓'
                  : epStatus?.status === 'failed' ? '✗'
                  : isRunning && epStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={ep.label}
                      disabled={isRunning}
                      onChange={e => updateLabel(ep.localId, e.target.value)}
                      className="bg-transparent text-xs font-bold text-white outline-none border-b border-white/10 focus:border-purple-400 w-24 py-0.5"
                    />
                    <span className="text-[10px] text-slate-500 truncate max-w-[160px]">{ep.displayName}</span>
                  </div>

                  {/* Upload progress */}
                  {!ep.uploadDone && !ep.uploadError && ep.file && (
                    <div className="mt-1.5">
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 transition-all duration-300 rounded-full"
                          style={{ width: `${ep.uploadProgress}%` }} />
                      </div>
                      <span className="text-[9px] text-blue-400 mt-0.5">Uploading {ep.uploadProgress}%</span>
                    </div>
                  )}
                  {ep.uploadError && <span className="text-[10px] text-red-400">Upload error: {ep.uploadError}</span>}
                  {ep.uploadDone && <span className="text-[10px] text-emerald-400">✓ Upload រួចរាល់</span>}

                  {/* Backend progress */}
                  {epStatus && (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className={STATUS_COLORS[epStatus.status]}>{STATUS_LABELS_KH[epStatus.status]}</span>
                        <span className="text-slate-500 font-mono">{epStatus.progress}%</span>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${
                          epStatus.status === 'done' ? 'bg-emerald-400'
                          : epStatus.status === 'failed' ? 'bg-red-400'
                          : 'bg-purple-400'
                        }`} style={{ width: `${epStatus.progress}%` }} />
                      </div>
                      {epStatus.speakers_found > 0 && (
                        <span className="text-[9px] text-slate-400">
                          <Users className="w-2.5 h-2.5 inline mr-1" />
                          {epStatus.speakers_found} speaker(s) detected
                        </span>
                      )}
                      {epStatus.status === 'failed' && epStatus.error && (
                        <div className="flex items-start gap-1.5 mt-1">
                          <AlertCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                          <span className="text-[10px] text-red-300">{epStatus.error}</span>
                          <button onClick={() => handleRetry(idx)}
                            className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-500/20 text-red-300 text-[9px] font-bold hover:bg-red-500/30 transition-colors">
                            <RotateCcw className="w-2.5 h-2.5" /> Retry
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Voice profiles done */}
                  {epStatus?.status === 'done' && epStatus.voice_profiles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {epStatus.voice_profiles.map(vp => (
                        <a key={vp.speaker_id} href={vp.profile_url} download
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[9px] hover:bg-emerald-500/25 transition-colors">
                          <Mic className="w-2.5 h-2.5" /> {vp.speaker_id}
                          <span className="opacity-60">({Math.round(vp.quality_score * 100)}%)</span>
                          <Download className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Log toggle */}
                <div className="flex items-center gap-1 shrink-0">
                  {epStatus?.logs?.length > 0 && (
                    <button onClick={() => setExpandedEp(expandedEp === idx ? null : idx)}
                      className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors">
                      {expandedEp === idx ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  {!isRunning && (
                    <button onClick={() => removeEpisode(ep.localId)} className="p-1 rounded text-slate-600 hover:text-red-400 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Log drawer */}
              {expandedEp === idx && epStatus?.logs?.length > 0 && (
                <div className="mt-3 bg-black/30 rounded-lg p-2.5 max-h-28 overflow-y-auto font-mono text-[9px] text-slate-400 space-y-0.5 border border-white/[0.04]">
                  {epStatus.logs.map((l, i) => <div key={i}>{l}</div>)}
                </div>
              )}
            </div>
          );
        })}

        {/* Add episodes button */}
        {episodes.length < 5 && !isRunning && (
          <button onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 rounded-xl border-2 border-dashed border-white/15 text-slate-500 hover:border-purple-400/40 hover:text-purple-300 text-xs font-bold transition-all flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            <span>បន្ថែម Episode ({episodes.length}/5)</span>
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="video/*,audio/*" multiple className="hidden" onChange={handleFileSelect} />
      </div>

      {/* Overall Progress (when running) */}
      {batchStatus && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Progress សរុប</span>
            <div className="flex items-center gap-3 text-slate-400">
              <span className="text-emerald-400">✓ {batchStatus.completed_episodes}</span>
              {batchStatus.failed_episodes > 0 && <span className="text-red-400">✗ {batchStatus.failed_episodes}</span>}
              <span>/ {batchStatus.total_episodes} episodes</span>
            </div>
          </div>
          <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 rounded-full"
              style={{ width: `${overallProgress}%` }} />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> concurrency: {batchStatus.safe_concurrency}</span>
            <span className="font-mono text-purple-300">{overallProgress}%</span>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.07]">
        <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-purple-400" />
          <span>Episode នីមួយៗ — isolated pipeline, មិន mix ទិន្នន័យ</span>
        </div>

        {isRunning ? (
          <div className="flex items-center gap-2 text-xs text-purple-300">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Clone កំពុងដំណើរ...</span>
          </div>
        ) : batchStatus?.status === 'completed' ? (
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" /> Clone ជោគជ័យ!
          </div>
        ) : (
          <button
            onClick={handleStartBatch}
            disabled={readyCount === 0 || isRunning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            style={{ background: readyCount > 0 ? 'linear-gradient(135deg,#a855f7,#ec4899)' : undefined, boxShadow: readyCount > 0 ? '0 4px 16px rgba(168,85,247,0.4)' : undefined }}
          >
            <Mic className="w-4 h-4" />
            <span>🎙️ Clone {readyCount > 0 ? `${readyCount} ` : ''}Episodes</span>
          </button>
        )}
      </div>
    </div>
  );
};
