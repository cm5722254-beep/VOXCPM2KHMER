import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Plus,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Users,
  BookOpen,
  Cpu,
  HardDrive,
  RefreshCw,
  FolderArchive,
  ChevronRight,
  ShieldCheck,
  FileVideo,
  XCircle,
  Sparkles
} from 'lucide-react';
import {
  BatchEpisode,
  BatchCharacterMemory,
  BatchTranslationMemory,
  BatchEpisodeStatus
} from '../../types';
import { api } from '../../services/api';

export const BatchDubbingStudio: React.FC = () => {
  const [episodes, setEpisodes] = useState<BatchEpisode[]>([]);

  // Batch Character Memory (Ep 01 voice automatically carries into Ep 02-10)
  const [characterMemory, setCharacterMemory] = useState<Record<string, BatchCharacterMemory>>({
    'char_1': {
      characterId: 'char_1',
      name: 'តួឯកប្រុស (Male Lead)',
      voiceId: 'ai-piseth',
      voiceLabel: 'AI ពិសិទ្ធ (Piseth)',
      emotion: 'Neutral',
      pitch: 1.0,
      speed: 1.0,
      assignedInEpisode: 'Ep 01'
    } as any,
    'char_2': {
      characterId: 'char_2',
      name: 'តួឯកស្រី (Female Lead)',
      voiceId: 'ai-sreymom',
      voiceLabel: 'AI ស្រីមុំ (Sreymom)',
      emotion: 'Neutral',
      pitch: 1.0,
      speed: 1.0,
      assignedInEpisode: 'Ep 01'
    } as any
  });
  // Batch Translation Memory (Glossary reused consistently across 10 episodes)
  const [translationMemory, setTranslationMemory] = useState<BatchTranslationMemory[]>([]);

  const [activeTab, setActiveTab] = useState<'queue' | 'characters' | 'translation' | 'hardware'>('queue');
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [maxConcurrency, setMaxConcurrency] = useState<number>(2);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusPollingRef = useRef<any>(null);

  // Poll batch progress when active
  useEffect(() => {
    if (activeBatchId && isProcessing && !isPaused) {
      statusPollingRef.current = setInterval(async () => {
        try {
          const res = await api.getBatchStatus(activeBatchId);
          if (res.success && res.batch) {
            setEpisodes(res.batch.episodes);
            setOverallProgress(res.batch.overall_progress || 0);
            setIsPaused(res.batch.is_paused || false);

            if (res.batch.status === 'completed' || res.batch.status === 'finished_with_errors') {
              setIsProcessing(false);
              clearInterval(statusPollingRef.current);
            }
          }
        } catch (_) {}
      }, 2000);
    } else {
      if (statusPollingRef.current) clearInterval(statusPollingRef.current);
    }

    return () => {
      if (statusPollingRef.current) clearInterval(statusPollingRef.current);
    };
  }, [activeBatchId, isProcessing, isPaused]);

  // Handle adding new video episodes (5 to 10 episodes)
  const handleAddEpisodeFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newEps: BatchEpisode[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const epNum = episodes.length + i + 1;
      if (epNum > 10) break; // Maximum 10 episodes limit

      newEps.push({
        id: `ep_${epNum.toString().padStart(2, '0')}`,
        episodeNumber: epNum,
        title: `Episode ${epNum.toString().padStart(2, '0')}: ${f.name.replace(/\.[^/.]+$/, '')}`,
        filename: f.name,
        inputUrl: URL.createObjectURL(f),
        durationSeconds: 1200,
        status: 'queued',
        progress: 0,
        characterCount: 3,
        sentenceCount: 150,
      });
    }

    setEpisodes(prev => [...prev, ...newEps]);
    setNotification({
      type: 'success',
      message: `បានបញ្ចូលភាគថ្មីចំនួន ${newEps.length} ភាគ (សរុប ${episodes.length + newEps.length} ភាគ)`
    });
  };

  // Launch the Batch dubbing process
  const startBatchProcessing = async () => {
    try {
      setIsProcessing(true);
      setIsPaused(false);
      setNotification(null);

      const res = await api.createBatchJob({
        title: `គម្រោងបញ្ចូលសំឡេងរឿងភាគ ${episodes.length} ភាគ`,
        episodes: episodes,
        characterMemory: characterMemory,
        translationMemory: translationMemory,
        maxConcurrency: maxConcurrency,
      });

      if (res.success) {
        setActiveBatchId(res.batch_id);
        setNotification({
          type: 'success',
          message: `បានចាប់ផ្តើមដំណើរការ Batch Dubbing ចំនួន ${res.total_episodes} ភាគដោយជោគជ័យ!`
        });
      }
    } catch (err: any) {
      setIsProcessing(false);
      setNotification({
        type: 'error',
        message: `បរាជ័យក្នុងការចាប់ផ្តើម Batch: ${err.message || 'សូមព្យាយាមម្តងទៀត'}`
      });
    }
  };

  // Handle Pause / Resume / Cancel / Retry
  const handleBatchAction = async (action: 'pause' | 'resume' | 'cancel' | 'retry_failed') => {
    if (!activeBatchId) return;

    try {
      const res = await api.executeBatchAction({
        batchId: activeBatchId,
        action: action,
      });

      if (res.success) {
        if (action === 'pause') setIsPaused(true);
        if (action === 'resume') setIsPaused(false);
        if (action === 'cancel') {
          setIsProcessing(false);
          setIsPaused(false);
        }
        setNotification({ type: 'success', message: res.message });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  // Download all completed episodes as a ZIP archive
  const handleExportZip = async () => {
    if (!activeBatchId) {
      setNotification({ type: 'error', message: 'មិនទាន់មានគម្រោង Batch ដែលបានដំណើរការនៅឡើយ' });
      return;
    }

    try {
      const res = await api.exportBatchZip(activeBatchId);
      if (res.success) {
        window.open(res.zip_url, '_blank');
        setNotification({ type: 'success', message: `បានទាញយកកញ្ចប់ ZIP: ${res.filename}` });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: `ការទាញយក ZIP បរាជ័យ: ${err.message}` });
    }
  };

  const getStatusBadge = (status: BatchEpisodeStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>រួចរាល់ (Complete)</span>
          </span>
        );
      case 'translating':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>កំពុងបកប្រែ (Translating)</span>
          </span>
        );
      case 'generating':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>បង្កើតសំឡេង (AI Voice)</span>
          </span>
        );
      case 'rendering':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-sky-600 dark:text-amber-400 border border-amber-500/30">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>កំពុង Render MP4</span>
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>បរាជ័យ (Failed)</span>
          </span>
        );
      case 'queued':
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-700">
            <Clock className="w-3.5 h-3.5" />
            <span>រង់ចាំ (Waiting)</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0f1d] text-slate-800 dark:text-slate-100 overflow-hidden select-none">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-blue-200 dark:border-blue-200 dark:border-blue-200 dark:border-red-500/20 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-600/20 to-amber-600/20 border border-blue-300 dark:border-blue-300 dark:border-blue-300 dark:border-red-500/40 text-blue-600 dark:text-red-400 shadow-[0_0_15px_rgba(220,38,38,0.25)]">
            <Layers className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-600 dark:from-blue-600 dark:from-blue-600 dark:from-red-400 via-sky-500 dark:via-sky-500 dark:via-sky-500 dark:via-amber-300 to-red-500 font-moul">
              🐲 BATCH DUBBING STUDIO
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ដំណើរការពី 5 ដល់ 10 ភាគក្នុងពេលតែមួយ ជាមួយនឹង Voice Memory និង Translation Glossary ឆ្លងភាគ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleAddEpisodeFiles}
            accept="video/mp4,video/mkv,video/webm"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-700 font-medium text-xs transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4 text-blue-600 dark:text-red-400" />
            <span>+ បញ្ចូលភាគ (5–10 Videos)</span>
          </button>

          {!isProcessing ? (
            <button
              onClick={startBatchProcessing}
              disabled={episodes.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-slate-800 dark:text-white font-bold text-xs shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>ចាប់ផ្តើម Process ទាំងអស់ ({episodes.length} ភាគ)</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBatchAction(isPaused ? 'resume' : 'pause')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold"
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{isPaused ? 'បន្តដំណើរការ' : 'ផ្អាកជាបណ្តោះអាសន្ន'}</span>
              </button>
              <button
                onClick={() => handleBatchAction('cancel')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>បោះបង់</span>
              </button>
            </div>
          )}

          <button
            onClick={handleExportZip}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold text-xs transition-all hover:scale-105"
          >
            <FolderArchive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>ទាញយក ZIP ទាំងអស់</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`mx-6 mt-3 px-4 py-2.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1 ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ── Sub Navigation Tabs ── */}
      <div className="flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/40">
        <div className="flex gap-2">
          {[
            { id: 'queue', label: `ជួររង់ចាំភាគ (${episodes.length} ភាគ)`, icon: Layers },
            { id: 'characters', label: 'ការចងចាំសំឡេងតួអង្គ (Character Memory)', icon: Users },
            { id: 'translation', label: 'វចនានុក្រមរួម (Translation Memory)', icon: BookOpen },
            { id: 'hardware', label: 'សុវត្ថិភាពម៉ាស៊ីន (Hardware Concurrency)', icon: Cpu },
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                  isActive
                    ? 'border-red-500 text-blue-600 dark:text-red-400 bg-red-500/10'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-red-400' : 'text-slate-500'}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Progress Bar */}
        <div className="flex items-center gap-3 w-72">
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-500 dark:text-slate-400">វឌ្ឍនភាពរួម:</span>
              <span className="font-bold text-blue-600 dark:text-red-400">{overallProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${overallProgress}%` }}
                className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {/* Tab 1: Queue View */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span>បញ្ជីភាគដែលត្រូវដំណើរការ (កញ្ចប់អតិបរមា 10 ភាគ):</span>
              <div className="flex items-center gap-4">
                <span className="text-emerald-600 dark:text-emerald-400">✓ បានបញ្ចប់: {episodes.filter(e => e.status === 'completed').length}</span>
                <span className="text-blue-600 dark:text-red-400">⚡ កំពុងដំណើរការ: {episodes.filter(e => ['analyzing', 'translating', 'generating', 'mixing', 'rendering'].includes(e.status)).length}</span>
                <span className="text-slate-500">⏳ រង់ចាំ: {episodes.filter(e => e.status === 'queued').length}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {episodes.map(ep => (
                <div
                  key={ep.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-red-500/30 transition-all shadow-lg backdrop-blur-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-center text-blue-600 dark:text-red-400 font-mono font-bold text-sm">
                      {ep.episodeNumber.toString().padStart(2, '0')}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <span>{ep.title}</span>
                        {ep.status === 'completed' && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                            ({Math.floor(ep.durationSeconds / 60)}:{(ep.durationSeconds % 60).toString().padStart(2, '0')})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>តួអង្គ: {ep.characterCount} នាក់</span>
                        <span>•</span>
                        <span>ប្រយោគសន្ទនា: {ep.sentenceCount} ឃ្លា</span>
                        {ep.errorMessage && (
                          <span className="text-rose-400 font-medium">{ep.errorMessage}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Status & Progress */}
                    <div className="flex flex-col items-end gap-1.5 w-44">
                      {getStatusBadge(ep.status)}
                      <div className="w-full flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${ep.progress}%` }}
                            className={`h-full rounded-full transition-all duration-300 ${
                              ep.status === 'completed'
                                ? 'bg-emerald-500'
                                : ep.status === 'failed'
                                ? 'bg-rose-500'
                                : 'bg-red-500'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 w-8 text-right">
                          {ep.progress}%
                        </span>
                      </div>
                    </div>

                    {/* Output & Action Buttons */}
                    <div className="flex items-center gap-2">
                      {ep.outputVideoUrl ? (
                        <a
                          href={ep.outputVideoUrl}
                          download={`Episode_${ep.episodeNumber.toString().padStart(2, '0')}_KH.mp4`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all hover:scale-105"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>ទាញយក MP4</span>
                        </a>
                      ) : (
                        <button
                          disabled
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-500 text-xs font-medium cursor-not-allowed"
                        >
                          រង់ចាំ Output
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Batch Character Memory View */}
        {activeTab === 'characters' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-indigo-300 text-sm mb-1">
                  🐲 ប្រព័ន្ធចងចាំសំឡេងឆ្លងភាគ (Batch Character Memory)
                </div>
                <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  នៅពេលអ្នកកំណត់សំឡេងតួអង្គក្នុង <strong className="text-slate-800 dark:text-white">Episode 01</strong> រួចរាល់ ប្រព័ន្ធនឹងរក្សាទុក ID, Voice Profile, អារម្មណ៍, ល្បឿន និងកម្ពស់សំឡេង ហើយយកទៅអនុវត្តដោយស្វ័យប្រវត្តិចំពោះ <strong className="text-slate-800 dark:text-white">Episode 02 ដល់ 10</strong> ដោយមិនចាំបាច់កំណត់ម្តងទៀតឡើយ។
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(characterMemory).map(char => (
                <div
                  key={char.characterId}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-300 dark:border-blue-300 dark:border-blue-300 dark:border-red-500/40 transition-all shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-bold text-sm text-red-300">{char.name}</div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-red-500/20 text-blue-600 dark:text-red-400 border border-red-500/30">
                        Memory Active
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>សំឡេង AI:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{char.voiceLabel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>អារម្មណ៍ (Emotion):</span>
                        <span className="font-semibold text-cyan-300 capitalize">{char.emotion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ល្បឿននិយាយ:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-200">{char.speed}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pitch:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-200">{char.pitch > 0 ? `+${char.pitch}` : char.pitch}</span>
                      </div>
                      {char.pronunciationNote && (
                        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 italic">
                          ចំណាំ: "{char.pronunciationNote}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>ចងចាំពេញលេញ 10 ភាគ</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Batch Translation Memory View */}
        {activeTab === 'translation' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-teal-950/20 border border-teal-500/30 flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-teal-300 text-sm mb-1">
                  📚 វចនានុក្រមបកប្រែគម្រោង (Translation Glossary Consistency)
                </div>
                <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  ធានាឱ្យឈ្មោះតួអង្គ ឈ្មោះទីកន្លែង ក្បាច់គុណ និងអាវុធត្រូវបានបកប្រែដូចគ្នា 100% គ្រប់ទាំង 10 ភាគ។
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-white dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">ពាក្យដើម (Original Term)</th>
                    <th className="py-3 px-4 font-semibold">ពាក្យបកប្រែជាភាសាខ្មែរ (Khmer Term)</th>
                    <th className="py-3 px-4 font-semibold">ប្រភេទ (Category)</th>
                    <th className="py-3 px-4 font-semibold text-right">ស្ថានភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {translationMemory.map(tm => (
                    <tr key={tm.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-200">{tm.sourceTerm}</td>
                      <td className="py-3 px-4 font-bold text-teal-300 font-moul text-[11px]">{tm.khmerTerm}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-700">
                          {tm.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">✓ បានអនុម័ត (Locked)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-center text-slate-500 py-10 text-xs">
              មិនទាន់មានវចនានុក្រមបកប្រែនៅឡើយទេ។
            </div>
          </div>
        )}

        {/* Tab 4: Hardware Concurrency Management */}
        {activeTab === 'hardware' && (
          <div className="space-y-4 max-w-2xl">
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
              <Cpu className="w-5 h-5 text-sky-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-amber-300 text-sm mb-1">
                  ⚡ ការគ្រប់គ្រងធនធានកុំព្យូទ័រ (Safe Concurrency Protection)
                </div>
                <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  ប្រព័ន្ធការពារការគាំងម៉ាស៊ីន ដោយកំណត់ចំនួនភាគដំណើរការក្នុងពេលតែមួយ (Concurrency) ឱ្យសមស្របតាម CPU/RAM/GPU ដើម្បីធានាស្ថិរភាពខ្ពស់បំផុត។
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-2">
                  ចំនួន Job ដំណើរការស្របគ្នា (Concurrent Rendering Threads):
                </label>
                <div className="flex gap-3">
                  {[
                    { val: 1, label: '1 ភាគក្នុងពេលតែមួយ (កុំព្យូទ័រធម្មតា)' },
                    { val: 2, label: '2 ភាគក្នុងពេលតែមួយ (កម្រិតណែនាំ)' },
                    { val: 3, label: '3 ភាគក្នុងពេលតែមួយ (កុំព្យូទ័រខ្លាំង)' },
                    { val: 5, label: '5 ភាគស្របគ្នា (Workstation / RTX 4090)' },
                  ].map(c => (
                    <button
                      key={c.val}
                      onClick={() => setMaxConcurrency(c.val)}
                      className={`flex-1 py-3 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        maxConcurrency === c.val
                          ? 'bg-red-600/30 border-red-400 text-red-200 shadow-md'
                          : 'bg-white dark:bg-slate-950 border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <div className="flex justify-between">
                  <span>Hardware Video Acceleration:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">NVIDIA NVENC / Apple VT / QSV Auto-detected</span>
                </div>
                <div className="flex justify-between">
                  <span>អង្គចងចាំ RAM សុវត្ថិភាព:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">16 GB+ ត្រូវបានការពារពី Memory Leak</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
