import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Languages,
  Subtitles,
  Users,
  UserCheck,
  UserPlus,
  Wand2,
  Video,
  Layers,
  Volume2,
  VolumeX,
  Music,
  Film,
  Smile,
  ArrowRight,
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface AIToolItem {
  id: string;
  name: string;
  khmer: string;
  description: string;
  badge?: string;
  icon: any;
  category: 'audio' | 'video' | 'dialogue';
}

interface AIToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchTool?: (toolId: string) => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const AIToolsModal: React.FC<AIToolsModalProps> = ({
  isOpen,
  onClose,
  onLaunchTool,
  onShowToast,
}) => {
  const [runningToolId, setRunningToolId] = useState<string | null>(null);

  const tools: AIToolItem[] = [
    { id: 'ai-translate', name: 'AI Translate', khmer: 'បកប្រែ AI', description: 'Contextual drama translation into natural expressive Khmer idioms', badge: 'PRO', icon: Languages, category: 'dialogue' },
    { id: 'ai-subtitle', name: 'AI Subtitle', khmer: 'ចំណងជើងរង AI', description: 'Sub-second speech-to-text timing with automatic Khmer syllable wrapping', icon: Subtitles, category: 'dialogue' },
    { id: 'ai-speaker-det', name: 'AI Speaker Detection', khmer: 'សម្គាល់អ្នកនិយាយ', description: 'Neural acoustic diarization identifying unique speaker voices', icon: Users, category: 'audio' },
    { id: 'ai-char-det', name: 'AI Character Detection', khmer: 'សម្គាល់តួអង្គ', description: 'Matches onscreen character faces and gender to voice tracks', icon: UserCheck, category: 'video' },
    { id: 'ai-voice-assign', name: 'AI Voice Assignment', khmer: 'ចាត់តាំងសំឡេងស្វ័យប្រវត្តិ', description: 'Auto-casts appropriate lead/supporting Khmer voices per role', badge: 'AUTO', icon: UserPlus, category: 'audio' },
    { id: 'ai-voice-gen', name: 'AI Voice Generation', khmer: 'បង្កើតសំឡេងខ្មែរ AI', description: 'High-definition neural Khmer voice synthesis with emotion control', badge: 'CORE', icon: Wand2, category: 'audio' },
    { id: 'ai-lipsync', name: 'AI Lip Sync', khmer: 'ផ្គូផ្គងចលនាមាត់', description: 'Morphs facial phonemes to naturally match dubbed Khmer audio', badge: 'NEW', icon: Video, category: 'video' },
    { id: 'ai-bg-sep', name: 'AI Background Separation', khmer: 'បំបែកសំឡេងផ្ទៃខាងក្រោយ', description: 'Demucs 4-stem neural extraction isolating vocals, BGM & Foley', icon: Layers, category: 'audio' },
    { id: 'ai-audio-cleanup', name: 'AI Audio Cleanup', khmer: 'សម្អាតសំឡេង', description: 'Removes plosives, room echo, clipping and mic hum', icon: Volume2, category: 'audio' },
    { id: 'ai-noise-rem', name: 'AI Noise Removal', khmer: 'លុបសំឡេងរំខាន', description: 'Deep neural denoiser for wind, traffic and electrical hum', icon: VolumeX, category: 'audio' },
    { id: 'ai-music-match', name: 'AI Music Match', khmer: 'ស្វែងរកតន្ត្រីត្រូវបរិយាកាស', description: 'Selects and cues soundtrack tracks based on scene mood', icon: Music, category: 'audio' },
    { id: 'ai-scene-det', name: 'AI Scene Detection', khmer: 'ស្វែងរកឈុតឆាក', description: 'Automatic shot boundary cut detection across entire timeline', icon: Film, category: 'video' },
    { id: 'ai-emotion-det', name: 'AI Emotion Detection', khmer: 'វិភាគអារម្មណ៍ឈុតឆាក', description: 'Reads dialogue urgency and actor sentiment for dynamic pitch', icon: Smile, category: 'dialogue' },
  ];

  if (!isOpen) return null;

  const handleRunTool = async (t: AIToolItem) => {
    setRunningToolId(t.id);
    onShowToast?.(`Starting ${t.name} (${t.khmer})...`, 'info');
    await new Promise((r) => setTimeout(r, 1400));
    setRunningToolId(null);
    onShowToast?.(`🎉 ${t.name} completed successfully!`, 'success');
    if (onLaunchTool) onLaunchTool(t.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] shadow-2xl overflow-hidden flex flex-col font-khmer text-zinc-200"
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
                  ឧបករណ៍ AI ជំនួយការផលិត (AI TOOLS SUITE)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00C2FF]/10 text-[#00C2FF] border border-slate-200 dark:border-[#00C2FF]/30">
                  13 NEURAL MODELS
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                ឧបករណ៍ឆ្លាតវៃ AI ទាំង ១៣ សម្រាប់ផលិតភាពយន្ត និងបញ្ចូលសំឡេងកម្រិតអាជីព
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:text-white hover:bg-slate-200 dark:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tools Grid */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[65vh] overflow-y-auto">
          {tools.map((t) => {
            const Icon = t.icon;
            const isRunning = runningToolId === t.id;

            return (
              <div
                key={t.id}
                className="flex flex-col justify-between p-3.5 rounded-lg bg-white dark:bg-[#181818] border border-white/[0.06] hover:border-slate-200 dark:border-[#00C2FF]/40 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-[#222226] border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-[#00C2FF] group-hover:scale-105 transition-all">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    {t.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/[0.06] text-slate-700 dark:text-zinc-300 font-mono">
                        {t.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-[#00C2FF] transition-colors">
                    {t.name}
                  </h3>
                  <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                    {t.khmer}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-snug line-clamp-2">
                    {t.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleRunTool(t)}
                    disabled={Boolean(runningToolId)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#00C2FF]/15 hover:bg-[#00C2FF]/25 border border-slate-200 dark:border-[#00C2FF]/30 text-[#00C2FF] text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Running...</span>
                      </>
                    ) : (
                      <>
                        <span>អនុវត្ត (Execute)</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-[#181818] border-t border-slate-200 dark:border-slate-200 dark:border-white/[0.08]">
          <span className="text-xs text-slate-600 dark:text-zinc-400">
            Powered by multi-provider neural pipeline (Gemini, ElevenLabs, OpenAI, NVIDIA).
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white dark:bg-[#222226] hover:bg-white dark:bg-[#2A2A30] text-slate-700 dark:text-zinc-300 text-xs font-semibold transition-all border border-white/[0.06]"
          >
            បិទ (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
