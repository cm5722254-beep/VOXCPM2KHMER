import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Scissors,
  Eye,
  CheckCircle2,
  Trash2,
  Undo2,
  Play,
  Pause,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Video,
  Clock,
  Volume2,
  VolumeX,
  FileCheck
} from 'lucide-react';
import { SmartScene, SmartCutProposal } from '../../types';
import { api } from '../../services/api';

interface SmartSceneIntelligenceProps {
  videoPath?: string;
  onApplyWorkingCopy?: (newWorkingVideoUrl: string) => void;
}

export const SmartSceneIntelligence: React.FC<SmartSceneIntelligenceProps> = ({
  videoPath = '',
  onApplyWorkingCopy,
}) => {
  const [scenes, setScenes] = useState<SmartScene[]>([
    {
      id: 'sc_01',
      startTime: 0.0,
      endTime: 8.5,
      duration: 8.5,
      speakerName: 'តួឯកប្រុស (Xiao Yan)',
      hasFace: true,
      isSpeaking: true,
      importanceScore: 92,
      suggestedCut: false,
      status: 'keep',
    },
    {
      id: 'sc_02',
      startTime: 8.5,
      endTime: 12.0,
      duration: 3.5,
      speakerName: '',
      hasFace: false,
      isSpeaking: false,
      importanceScore: 25,
      suggestedCut: true,
      cutReason: 'silence',
      status: 'keep',
    },
    {
      id: 'sc_03',
      startTime: 12.0,
      endTime: 24.2,
      duration: 12.2,
      speakerName: 'តួឯកស្រី (Xun Er)',
      hasFace: true,
      isSpeaking: true,
      importanceScore: 88,
      suggestedCut: false,
      status: 'keep',
    },
    {
      id: 'sc_04',
      startTime: 24.2,
      endTime: 27.8,
      duration: 3.6,
      speakerName: '',
      hasFace: false,
      isSpeaking: false,
      importanceScore: 20,
      suggestedCut: true,
      cutReason: 'long_pause',
      status: 'keep',
    },
    {
      id: 'sc_05',
      startTime: 27.8,
      endTime: 40.0,
      duration: 12.2,
      speakerName: 'លោកគ្រូយ៉ាវឡៅ',
      hasFace: true,
      isSpeaking: true,
      importanceScore: 95,
      suggestedCut: false,
      status: 'keep',
    },
  ]);

  const [selectedSceneId, setSelectedSceneId] = useState<string>('sc_02');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isApplyingCut, setIsApplyingCut] = useState<boolean>(false);
  const [previewPlaying, setPreviewPlaying] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [workingCopyUrl, setWorkingCopyUrl] = useState<string | null>(null);
  const [originalPreserved, setOriginalPreserved] = useState<boolean>(true);

  const selectedScene = scenes.find(s => s.id === selectedSceneId) || scenes[0];

  // Run Real Scene Analysis via FFmpeg
  const handleAnalyzeVideo = async () => {
    setIsAnalyzing(true);
    setNotification(null);
    try {
      const res = await api.analyzeScenes({
        videoPath: videoPath || 'sample_input.mp4',
      });
      if (res.success && res.scenes.length > 0) {
        setScenes(res.scenes);
        setSelectedSceneId(res.scenes[0].id);
        setNotification({
          type: 'success',
          message: `ការវិភាគបញ្ញាសិប្បនិម្មិតបានរកឃើញ ${res.scenes.length} ឈុតឆាក និងសម្គាល់កន្លែងស្ងាត់ស្ងៀម (Silence) ត្រឹមត្រូវ!`
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `ការវិភាគឈុតឆាកបរាជ័យ: ${err.message || 'សូមពិនិត្យឯកសារវីដេអូ'}`
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Mark Scene to Remove
  const toggleSceneStatus = (sceneId: string) => {
    setScenes(prev =>
      prev.map(s => (s.id === sceneId ? { ...s, status: s.status === 'keep' ? 'removed' : 'keep' } : s))
    );
  };

  // Non-destructive Smart Cut apply
  const handleApplySmartCut = async () => {
    const scenesToRemove = scenes.filter(s => s.status === 'removed');
    if (scenesToRemove.length === 0) {
      setNotification({
        type: 'error',
        message: 'សូមជ្រើសរើសយ៉ាងហោចណាស់មួយឈុតឆាកដែលត្រូវកាត់ចេញ (Remove)'
      });
      return;
    }

    setIsApplyingCut(true);
    setNotification(null);
    try {
      const res = await api.applySmartCut({
        videoPath: videoPath || 'sample_input.mp4',
        cutScenes: scenesToRemove,
        outputName: `working_copy_smartcut_${Date.now()}.mp4`,
      });

      if (res.success) {
        setWorkingCopyUrl(res.url);
        setOriginalPreserved(true);
        if (onApplyWorkingCopy) onApplyWorkingCopy(res.url);

        setNotification({
          type: 'success',
          message: `បានកាត់បន្ថយ ${res.removed_seconds} វិនាទី! វីដេអូដើមត្រូវបានរក្សាទុកសុវត្ថិភាព 100% (Working Copy Created)`
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `ការអនុវត្ត Smart Cut បរាជ័យ: ${err.message || 'សូមព្យាយាមម្តងទៀត'}`
      });
    } finally {
      setIsApplyingCut(false);
    }
  };

  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);
  const totalToRemoveDuration = scenes
    .filter(s => s.status === 'removed')
    .reduce((acc, s) => acc + s.duration, 0);
  const projectedDuration = Math.max(0, totalDuration - totalToRemoveDuration);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0f1d] text-slate-800 dark:text-slate-100 overflow-hidden select-none">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-teal-500/20 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-600/20 border border-teal-500/40 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.25)]">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-emerald-400 font-moul">
              🧠 SMART SCENE INTELLIGENCE + ⚡ SMART CUT
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              វិភាគភាពសំខាន់នៃរូបភាព ស្គាល់មុខតួអង្គកំពុងនិយាយ និងកាត់ចោល Silence / Blank Frames ដោយមិនបាត់បង់សាច់រឿង
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAnalyzeVideo}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-700 font-semibold text-xs transition-all hover:scale-105 active:scale-95"
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="w-4 h-4 text-teal-400 animate-spin" />
                <span>កំពុងវិភាគ Scene AI...</span>
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 text-teal-400" />
                <span>វិភាគ Scene វីដេអូឡើងវិញ</span>
              </>
            )}
          </button>

          <button
            onClick={handleApplySmartCut}
            disabled={isApplyingCut || totalToRemoveDuration === 0}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs transition-all shadow-lg ${
              totalToRemoveDuration > 0
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-slate-800 dark:text-white shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:scale-105 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>{isApplyingCut ? 'កំពុង Smart Cut...' : `អនុវត្ត Smart Cut (ដក ${totalToRemoveDuration.toFixed(1)}s)`}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`mx-6 mt-3 px-4 py-2.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1 ${
            notification.type === 'success'
              ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Original Media Protection Badge */}
      <div className="mx-6 mt-3 px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>ការការពារវីដេអូដើម (Original Media Protection): រក្សាទុកសុវត្ថិភាព 100% មិនប៉ះពាល់វីដេអូមេឡើយ</span>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          ថិរវេលាដើម: {totalDuration.toFixed(1)}s ➔ ថិរវេលាថ្មី: <span className="text-teal-400 font-bold">{projectedDuration.toFixed(1)}s</span>
        </div>
      </div>

      {/* ── Main Layout: Visual Strip + Inspector ── */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Left: Scenes Overview Strip */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-950/60 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
            <span className="text-xs font-bold text-teal-300 flex items-center gap-2">
              <Eye className="w-4 h-4 text-teal-400" />
              <span>បញ្ជីឈុតឆាកឆ្លាតវៃ (SMART SCENE STRIP) - {scenes.length} ឈុត</span>
            </span>
            <span className="text-[11px] text-slate-500">
              AI Suggestion: ចុច [Remove] ដើម្បីដក ឬ [Keep] ដើម្បីរក្សាទុក
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3">
            {scenes.map((sc, idx) => {
              const isSelected = selectedScene.id === sc.id;
              const isCut = sc.status === 'removed';

              return (
                <div
                  key={sc.id}
                  onClick={() => setSelectedSceneId(sc.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between shadow-md ${
                    isCut
                      ? 'bg-rose-950/20 border-rose-500/40 opacity-70'
                      : isSelected
                      ? 'bg-teal-950/30 border-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.2)]'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-bold text-xs text-teal-400">
                      {(idx + 1).toString().padStart(2, '0')}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <span>{sc.speakerName || 'ឈុតឆាកគ្មានការសន្ទនា (Silence / Background)'}</span>
                        {sc.hasFace && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Face Detected
                          </span>
                        )}
                        {sc.suggestedCut && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                            AI ណែនាំឱ្យដក ({sc.cutReason})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                        <span>{sc.startTime.toFixed(1)}s ➔ {sc.endTime.toFixed(1)}s</span>
                        <span>•</span>
                        <span>ថិរវេលា: {sc.duration.toFixed(1)}s</span>
                        <span>•</span>
                        <span>ពិន្ទុភាពសំខាន់: <strong className={sc.importanceScore > 50 ? 'text-teal-400' : 'text-rose-400'}>{sc.importanceScore}/100</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSceneStatus(sc.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        isCut
                          ? 'bg-rose-600/30 border-rose-500 text-rose-300 hover:bg-rose-600/50'
                          : 'bg-slate-800 border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {isCut ? 'ដកចេញ (Removed)' : 'រក្សាទុក (Keep)'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Scene Inspector */}
        <div className="w-96 flex flex-col bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-2xl">
          <div className="text-sm font-bold text-teal-300 border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
            <span>ព័ត៌មានលម្អិតនៃឈុតឆាក (SCENE DETAIL)</span>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{selectedScene.id}</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Importance Indicator */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-800">
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                <span>កម្រិតសំខាន់នៃរូបភាព (Importance Score)</span>
                <span className="font-bold text-teal-400 font-mono">{selectedScene.importanceScore}%</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  style={{ width: `${selectedScene.importanceScore}%` }}
                  className={`h-full rounded-full ${
                    selectedScene.importanceScore > 60
                      ? 'bg-teal-400'
                      : selectedScene.importanceScore > 30
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-2">
                {selectedScene.importanceScore > 60
                  ? '✓ មានតួអង្គសំខាន់ ឬសាច់រឿងចាំបាច់ ត្រូវរក្សាទុក'
                  : '⚠️ ឈុតឆាកស្ងាត់ស្ងៀម ឬរូបភាពដដែលៗ អាចពិចារណាដកចេញបាន'}
              </div>
            </div>

            {/* Visual Indicators */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">សម្គាល់ឃើញមុខ</span>
                <span className={`font-bold ${selectedScene.hasFace ? 'text-teal-400' : 'text-slate-500'}`}>
                  {selectedScene.hasFace ? '✓ មានវត្តមាន' : '✕ គ្មាន'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">តួអង្គកំពុងនិយាយ</span>
                <span className={`font-bold ${selectedScene.isSpeaking ? 'text-teal-400' : 'text-slate-500'}`}>
                  {selectedScene.isSpeaking ? '✓ កំពុងនិយាយ' : '✕ ស្ងាត់ស្ងៀម'}
                </span>
              </div>
            </div>

            {/* Time Window */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-800 space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>ចាប់ផ្តើម:</span>
                <span className="text-slate-800 dark:text-white">{selectedScene.startTime.toFixed(2)}s</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>បញ្ចប់:</span>
                <span className="text-slate-800 dark:text-white">{selectedScene.endTime.toFixed(2)}s</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>ថិរវេលា:</span>
                <span className="text-teal-400 font-bold">{selectedScene.duration.toFixed(2)}s</span>
              </div>
            </div>

            {/* AI Decision Actions */}
            <div className="pt-2">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">សកម្មភាពឆ្លាតវៃ:</div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleSceneStatus(selectedScene.id)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    selectedScene.status === 'removed'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  }`}
                >
                  {selectedScene.status === 'removed' ? '✕ សម្គាល់ដកចេញ' : '✓ រក្សាទុកក្នុងសាច់រឿង'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
