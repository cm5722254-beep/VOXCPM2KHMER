import React from 'react';
import {
  Mic,
  Bot,
  Users,
  Subtitles,
  Sparkles,
  Music,
  Volume2,
  Palette,
  Share2,
} from 'lucide-react';

export type FeatureTab =
  | 'dubbing'
  | 'tts'
  | 'voice_clone'
  | 'subtitle'
  | 'effects'
  | 'bgm'
  | 'sfx'
  | 'color'
  | 'export';

interface FeatureToolbarProps {
  activeFeature: FeatureTab;
  onSelectFeature: (feature: FeatureTab) => void;
  masterVolume: number;
  onChangeMasterVolume: (vol: number) => void;
  onOneClickDubbing?: () => void;
  isDubbing?: boolean;
  dubbingProgress?: number;
}

export const FeatureToolbar: React.FC<FeatureToolbarProps> = ({
  activeFeature,
  onSelectFeature,
  masterVolume,
  onChangeMasterVolume,
  onOneClickDubbing,
  isDubbing = false,
  dubbingProgress = 0,
}) => {
  const tools = [
    { id: 'dubbing', label: '✨ ឌាប់សំឡេង AI', icon: <Mic className="w-3.5 h-3.5" /> },
    { id: 'tts', label: '🤖 សំឡេង AI', icon: <Bot className="w-3.5 h-3.5" /> },
    { id: 'voice_clone', label: '🎤 ចម្លងសំឡេង', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'subtitle', label: '📝 ចំណងជើងរង', icon: <Subtitles className="w-3.5 h-3.5" /> },
    { id: 'effects', label: '✨ បែបផែន', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'bgm', label: '🎵 តន្ត្រី', icon: <Music className="w-3.5 h-3.5" /> },
    { id: 'sfx', label: '🔊 សំឡេងបែបផែន', icon: <Volume2 className="w-3.5 h-3.5" /> },
    { id: 'color', label: '🎨 ពណ៌', icon: <Palette className="w-3.5 h-3.5" /> },
    { id: 'export', label: '📤 នាំចេញ', icon: <Share2 className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="feature-toolbar h-12 bg-[#141417] border-b border-white/[0.08] px-3 sm:px-4 flex items-center justify-between z-30 select-none font-khmer shrink-0">
      {/* Horizontal Tools Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
        {tools.map((tool) => {
          const isActive = activeFeature === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelectFeature(tool.id as FeatureTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/50 shadow-[0_0_12px_rgba(0,242,173,0.3)] ring-1 ring-emerald-400/40'
                  : 'bg-[#1C1C22] hover:bg-[#25252C] text-zinc-300 hover:text-white border border-white/[0.08]'
              }`}
            >
              <span className={isActive ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(0,242,173,0.8)]' : 'text-zinc-400'}>
                {tool.icon}
              </span>
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Side: 1-Click Auto Dubbing & Master Volume */}
      <div className="hidden sm:flex items-center gap-2.5 pl-3 shrink-0">
        {onOneClickDubbing && (
          <button
            type="button"
            onClick={onOneClickDubbing}
            disabled={isDubbing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-[0_0_16px_rgba(244,63,94,0.4)] border border-amber-300/40 transition-all active:scale-95 disabled:opacity-50 shrink-0 animate-pulse"
            title="ចុចតែ 1-Click: ស្ដាប់ បកប្រែ លុបសំឡេងដើមទុកតែភ្លេង បែងចែកតួ (ប្រុស ស្រី ក្មេង ចាស់ បន្ទាប់បន្សំ) សំឡេង 1:1 និង Clone ពីរឿង បញ្ចូលសំឡេងខ្មែរ 1% ដល់ 100%"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-200 animate-spin" style={{ animationDuration: '4s' }} />
            <span>{isDubbing ? `កំពុងឌាប់ ${dubbingProgress}%` : '🎬 1-Click Auto Dubbing (១០០%)'}</span>
          </button>
        )}

        <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-white/[0.08]">
          <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <input
            type="range"
            min={0}
            max={150}
            step={5}
            value={masterVolume}
            onChange={(e) => onChangeMasterVolume(parseInt(e.target.value, 10))}
            className="w-20 h-1.5 accent-emerald-400 bg-[#1C1C22] border border-white/10 rounded-lg cursor-pointer"
            title={`កម្រិតសំឡេងមេ: ${masterVolume}%`}
          />
          <span className="font-mono text-xs font-bold text-emerald-400 w-9 text-right">
            {masterVolume}%
          </span>
        </div>
      </div>
    </div>
  );
};
