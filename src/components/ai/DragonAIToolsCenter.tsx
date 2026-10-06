import React, { useState } from 'react';
import {
  Sparkles,
  Flame,
  Zap,
  Target,
  Music,
  Trash2,
  Smile,
  FileText,
  Film,
  Brain,
  MessageSquare,
  Play,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  ChevronRight,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { DragonButton } from '../dragon/DragonButton';

interface AITool {
  id: string;
  icon: React.ReactNode;
  titleKhmer: string;
  titleEnglish: string;
  description: string;
  category: 'audio' | 'video' | 'translation' | 'voice';
  status: 'Ready' | 'Active' | 'GPU Turbo';
  usageCount: number;
  badge?: string;
  accent: 'cyan' | 'jade' | 'fire' | 'purple';
}

interface DragonAIToolsCenterProps {
  onShowToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onOpenVoiceCloner?: () => void;
  onOpenOneClickDubbing?: () => void;
  onNavigateTab?: (tabId: string) => void;
}

export const DragonAIToolsCenter: React.FC<DragonAIToolsCenterProps> = ({
  onShowToast,
  onOpenVoiceCloner,
  onOpenOneClickDubbing,
  onNavigateTab,
}) => {
  const [runningToolId, setRunningToolId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'voice' | 'audio' | 'translation' | 'video'>('all');

  const tools: AITool[] = [
    {
      id: 'ai-translate',
      icon: <Sparkles className="w-5 h-5 text-[#16D9FF]" />,
      titleKhmer: '✨ AI Translate (បកប្រែវៃឆ្លាត)',
      titleEnglish: 'AI Neural Translation',
      description: 'បកប្រែពាក្យពេចន៍ពី ចិន, អង់គ្លេស, ជប៉ុន ទៅជាខ្មែរបែបភាពយន្ត ដោយផ្អែកលើបរិបទតួអង្គ។',
      category: 'translation',
      status: 'Ready',
      usageCount: 1420,
      badge: 'Gemini 3.5 Turbo',
      accent: 'cyan',
    },
    {
      id: 'voice-clone',
      icon: <Flame className="w-5 h-5 text-[#FF7A18]" />,
      titleKhmer: '🐲 Voice Clone (ក្លូនសំឡេងនាគ)',
      titleEnglish: 'Zero-Shot Voice Cloning',
      description: 'ក្លូនសំឡេងខ្មែរពីគំរូសម្លេង 3-5 វិនាទី បង្កើត Character Voice ថ្មីក្នុងកម្រិត 48kHz Studio Master។',
      category: 'voice',
      status: 'GPU Turbo',
      usageCount: 890,
      badge: 'Zero-Shot AI',
      accent: 'fire',
    },
    {
      id: 'auto-dub',
      icon: <Zap className="w-5 h-5 text-[#00FFA8]" />,
      titleKhmer: '⚡ Auto Dub (ឌាប់ស្វ័យប្រវត្ត)',
      titleEnglish: '1-Click Full Automation',
      description: 'ដំណើរការពេញលេញ 1-Click: បំបែកសម្លេង, រក Speaker, បកប្រែ, Synth សំឡេងខ្មែរ និង Sync Timing។',
      category: 'video',
      status: 'GPU Turbo',
      usageCount: 2310,
      badge: 'Full Auto Engine',
      accent: 'jade',
    },
    {
      id: 'speaker-detection',
      icon: <Target className="w-5 h-5 text-[#8B5CF6]" />,
      titleKhmer: '🎯 Speaker Detection (បែងចែកតួអង្គ)',
      titleEnglish: 'Diarization & Timestamps',
      description: 'វិភាគ Timeline ស្វែងរក Speaker A, B, C ដោយស្វ័យប្រវត្ត និងកំណត់ Timestamp ជាក់លាក់។',
      category: 'audio',
      status: 'Ready',
      usageCount: 654,
      badge: 'PyAnnote 3.1',
      accent: 'purple',
    },
    {
      id: 'audio-enhance',
      icon: <Music className="w-5 h-5 text-[#16D9FF]" />,
      titleKhmer: '🎵 Audio Enhance (បង្កើនគុណភាពសម្លេង)',
      titleEnglish: 'Studio Master Equalizer',
      description: 'ស្តារហ្វ្រេកង់សំឡេងឡើងវិញ បន្ថែមភាពកក់ក្តៅ និងលម្អិតបែប Cinema ដល់សម្លេងតួអង្គ។',
      category: 'audio',
      status: 'Ready',
      usageCount: 780,
      badge: 'Mastering AI',
      accent: 'cyan',
    },
    {
      id: 'noise-removal',
      icon: <Trash2 className="w-5 h-5 text-[#00FFA8]" />,
      titleKhmer: '🧹 Noise Removal (សម្អាតសំឡេងរំខាន)',
      titleEnglish: 'AI Vocal Demucs Isolation',
      description: 'កាត់បន្ថយ Background Noise, Hiss, Reverb និងបំបែក Vocal ចេញពីភ្លេង BGM ស្អាត 100%។',
      category: 'audio',
      status: 'GPU Turbo',
      usageCount: 1120,
      badge: 'Demucs v4 High-Res',
      accent: 'jade',
    },
    {
      id: 'lip-sync',
      icon: <Smile className="w-5 h-5 text-[#FF7A18]" />,
      titleKhmer: '🗣️ Lip Sync (សមកាលកម្មបបូរមាត់)',
      titleEnglish: 'Neural Lip Synchronization',
      description: 'តម្រឹមចលនាបបូរមាត់តួអង្គក្នុងវីដេអូឱ្យត្រូវគ្នានឹងការបញ្ចេញសំឡេងខ្មែរ AI។',
      category: 'video',
      status: 'Active',
      usageCount: 420,
      badge: 'Wav2Lip Dragon',
      accent: 'fire',
    },
    {
      id: 'subtitle-ai',
      icon: <FileText className="w-5 h-5 text-[#8B5CF6]" />,
      titleKhmer: '📝 Subtitle AI (បង្កើត Subtitle ស្វ័យប្រវត្ត)',
      titleEnglish: 'Whisper Large v3 Subtitle Generator',
      description: 'បង្កើត Subtitle ខ្មែរ SRT/ASS ពីសំឡេងដើម ជាមួយនឹងការកំណត់ពេលវេលាកម្រិត Millisecond។',
      category: 'translation',
      status: 'Ready',
      usageCount: 1890,
      badge: 'Whisper Large-v3',
      accent: 'purple',
    },
    {
      id: 'scene-detection',
      icon: <Film className="w-5 h-5 text-[#16D9FF]" />,
      titleKhmer: '🎬 Scene Detection (ស្វែងរកប្លង់វីដេអូ)',
      titleEnglish: 'Shot Boundary Detector',
      description: 'កាត់ប្លង់វីដេអូដោយស្វ័យប្រវត្តិដើម្បីកំណត់ចន្លោះពេលនិយាយ និងឈុតឆាកសកម្មភាព។',
      category: 'video',
      status: 'Ready',
      usageCount: 530,
      badge: 'PySceneDetect',
      accent: 'cyan',
    },
    {
      id: 'script-rewrite',
      icon: <Brain className="w-5 h-5 text-[#00FFA8]" />,
      titleKhmer: '🧠 Script Rewrite (កែលម្អសាច់រឿង)',
      titleEnglish: 'Khmer Literary Adaptation',
      description: 'បំប្លែងពាក្យបច្ចេកទេស ឬពាក្យបុរាណឱ្យសមស្របតាមចរិតបែប Anime, យុទ្ធសិល្ប៍ ឬ Donghua។',
      category: 'translation',
      status: 'Ready',
      usageCount: 670,
      badge: 'Context Adaptive',
      accent: 'jade',
    },
    {
      id: 'emotion-ai',
      icon: <Flame className="w-5 h-5 text-[#FF7A18]" />,
      titleKhmer: '🔥 Emotion AI (កំណត់អារម្មណ៍សម្លេង)',
      titleEnglish: 'Prosody & Affect Tuning',
      description: 'កំណត់ និងបន្ថែមអារម្មណ៍កំហឹង, កំសត់, រីករាយ, ស្រែកខ្លាំង ឬខ្សឹប ទៅលើសំឡេងតួអង្គ។',
      category: 'voice',
      status: 'Ready',
      usageCount: 940,
      badge: 'Emotional Prosody',
      accent: 'fire',
    },
  ];

  const handleRunTool = (tool: AITool) => {
    setRunningToolId(tool.id);
    onShowToast(`🚀 Dragon AI: កំពុងចាប់ផ្តើម ${tool.titleEnglish}...`, 'info');

    setTimeout(() => {
      setRunningToolId(null);
      if (tool.id === 'voice-clone' && onOpenVoiceCloner) {
        onOpenVoiceCloner();
      } else if (tool.id === 'auto-dub' && onOpenOneClickDubbing) {
        onOpenOneClickDubbing();
      } else if (tool.id === 'ai-translate' && onNavigateTab) {
        onNavigateTab('tab-translator');
      } else if (tool.id === 'subtitle-ai' && onNavigateTab) {
        onNavigateTab('tab-subtitles');
      } else if (tool.id === 'speaker-detection') {
        fetch('/api/voice-split/open-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              onShowToast('🎯 បានបើកផ្ទាំងពិនិត្យតួអង្គ (Voice Split Review 100%) ដោយជោគជ័យ!', 'success');
            } else {
              onShowToast('🚀 កំពុងដំណើរការបែងចែកតួអង្គ ១០០% (Voice Split Offline)...', 'info');
              fetch('/api/voice-split/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
                .then((r) => r.json())
                .then((runData) => {
                  if (runData.success) {
                    onShowToast(`🎉 ${runData.message}`, 'success');
                    window.open(runData.reviewUrl, '_blank');
                  }
                })
                .catch(() => {});
            }
          })
          .catch(() => {});
        if (onNavigateTab) onNavigateTab('tab-character');
      } else {
        onShowToast(`🐲 ${tool.titleKhmer} បានដំណើរការ និងត្រៀមជាស្រេច!`, 'success');
      }
    }, 1200);
  };

  const filteredTools = filterCategory === 'all'
    ? tools
    : tools.filter((t) => t.category === filterCategory);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#070A12] overflow-hidden select-none font-khmer">
      {/* Top Banner */}
      <div className="shrink-0 px-6 py-5 border-b border-slate-200 dark:border-[#203244] bg-white dark:bg-[#0B111C]/80 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#16D9FF]/20 to-[#8B5CF6]/20 border border-slate-200 dark:border-[#16D9FF]/30 flex items-center justify-center">
              <Brain className="w-4 h-4 text-[#16D9FF]" />
            </div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white font-cinzel tracking-wider flex items-center gap-2">
              <span>DRAGON AI COMMAND CENTER</span>
              <span className="text-xs text-[#00FFA8] font-mono px-2 py-0.5 rounded-full bg-[#00FFA8]/10 border border-slate-200 dark:border-[#00FFA8]/30 font-normal">
                11 NEURAL ENGINES
              </span>
            </h1>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            បណ្តុំឧបករណ៍បញ្ញាសិប្បនិម្មិតកម្រិតខ្ពស់សម្រាប់ផលិតកម្មភាពយន្ត Khmer AI Dubbing Studio
          </p>
        </div>

        {/* Categories Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244]">
          {[
            { id: 'all', label: 'ទាំងអស់ (All)' },
            { id: 'voice', label: 'សំឡេង (Voice)' },
            { id: 'audio', label: 'សម្លេង Master' },
            { id: 'translation', label: 'បកប្រែ (Translate)' },
            { id: 'video', label: 'វីដេអូ (Video)' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterCategory === cat.id
                  ? 'bg-gradient-to-r from-[#16D9FF]/20 to-[#8B5CF6]/20 border border-slate-200 dark:border-[#16D9FF]/50 text-slate-800 dark:text-white shadow-[0_0_10px_rgba(22,217,255,0.2)]'
                  : 'text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of AI Tool Cards */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => {
            const isRunning = runningToolId === tool.id;
            return (
              <div
                key={tool.id}
                className="group rounded-2xl bg-white dark:bg-[#0B111C] border border-slate-200 dark:border-[#203244] hover:border-slate-200 dark:border-[#16D9FF]/50 p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] relative overflow-hidden"
              >
                {/* Accent top glowing border */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] transition-all opacity-40 group-hover:opacity-100 ${
                  tool.accent === 'cyan'
                    ? 'bg-gradient-to-r from-transparent via-[#16D9FF] to-transparent'
                    : tool.accent === 'jade'
                    ? 'bg-gradient-to-r from-transparent via-[#00FFA8] to-transparent'
                    : tool.accent === 'fire'
                    ? 'bg-gradient-to-r from-transparent via-[#FF7A18] to-transparent'
                    : 'bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent'
                }`} />

                <div>
                  {/* Card Header: Icon + Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] flex items-center justify-center group-hover:scale-105 transition-transform">
                      {tool.icon}
                    </div>
                    <div className="flex items-center gap-2">
                      {tool.badge && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] text-[#94A3B8]">
                          {tool.badge}
                        </span>
                      )}
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        tool.status === 'GPU Turbo'
                          ? 'bg-[#FF7A18]/15 border-[#FF7A18]/30 text-[#FF7A18]'
                          : 'bg-[#00FFA8]/15 border-slate-200 dark:border-[#00FFA8]/30 text-[#00FFA8]'
                      }`}>
                        {tool.status}
                      </span>
                    </div>
                  </div>

                  {/* Titles */}
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-[#16D9FF] transition-colors leading-snug">
                    {tool.titleKhmer}
                  </h3>
                  <div className="text-[11px] font-mono text-[#64748B] mt-0.5">
                    {tool.titleEnglish}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#94A3B8] leading-relaxed mt-2.5">
                    {tool.description}
                  </p>
                </div>

                {/* Footer: Usage + Run Button */}
                <div className="mt-5 pt-3.5 border-t border-slate-200 dark:border-[#203244]/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] font-mono">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>{tool.usageCount.toLocaleString()} Runs</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRunTool(tool)}
                    disabled={isRunning}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 ${
                      tool.accent === 'fire'
                        ? 'bg-gradient-to-r from-[#FF7A18] to-[#EF4444] text-slate-800 dark:text-white hover:brightness-110'
                        : tool.accent === 'jade'
                        ? 'bg-gradient-to-r from-[#00FFA8] to-[#10B981] text-[#070A12] font-black hover:brightness-110'
                        : tool.accent === 'purple'
                        ? 'bg-gradient-to-r from-[#8B5CF6] to-[#2563EB] text-slate-800 dark:text-white hover:brightness-110'
                        : 'bg-gradient-to-r from-[#16D9FF] to-[#2563EB] text-[#070A12] font-black hover:brightness-110'
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>កំពុងរត់...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Run Engine</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
