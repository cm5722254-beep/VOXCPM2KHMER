import React from 'react';
import { Mic2, Bot, AudioLines, Captions, Sparkles, Box, Music2, Waves, Palette, Upload, Volume2, VolumeX, Wand2 } from 'lucide-react';
import { useStudio, FeatureId } from '../store/studioStore';
import { useBridge } from '../StudioContext';
import { BL, Tip, Slider } from '../ui/primitives';
import type { LabelKey } from '../i18n';

const ITEMS: { id: FeatureId | 'export'; icon: React.ElementType; k: LabelKey }[] = [
  { id: 'dubbing', icon: Mic2, k: 'aiDubbing' },
  { id: 'tts', icon: Bot, k: 'aiTts' },
  { id: 'clone', icon: AudioLines, k: 'voiceClone' },
  { id: 'subtitle', icon: Captions, k: 'subtitle' },
  { id: 'effects', icon: Sparkles, k: 'effects' },
  { id: 'effects3d', icon: Box, k: 'effects3d' },
  { id: 'bgm', icon: Music2, k: 'bgm' },
  { id: 'sfx', icon: Waves, k: 'sfx' },
  { id: 'color', icon: Palette, k: 'color' },
  { id: 'export', icon: Upload, k: 'export' },
];

export const FeatureToolbar: React.FC = () => {
  const { feature, set, channels, setChannel } = useStudio();
  const b = useBridge();
  const master = channels.master;

  return (
    <div className="h-[46px] shrink-0 flex items-center gap-1.5 px-3 border-b border-[var(--kdp-border)]" style={{ background: 'rgba(7,17,31,.55)' }}>
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {ITEMS.map((it) => {
          const active = it.id === feature && b.activeTab === 'tab-dubbing';
          return (
            <button
              key={it.id}
              id={`tool-${it.id}`}
              className={`kdp-btn kdp-btn-sm ${active ? 'is-active' : 'kdp-btn-ghost'}`}
              onClick={() => {
                if (it.id === 'export') return set({ exportOpen: true });
                set({ feature: it.id as FeatureId });
                if (it.id === 'subtitle') set({ bottomTab: 'subtitle' });
                if (b.activeTab !== 'tab-dubbing') b.setActiveTab('tab-dubbing');
              }}
            >
              <it.icon size={14} className={active ? 'text-[var(--kdp-cyan)]' : ''} />
              <BL k={it.k} />
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      <Tip label="Run the full 10-step automatic dubbing pipeline">
        <button className="kdp-btn kdp-btn-sm kdp-btn-ai" onClick={() => set({ autoDubOpen: true })} id="btn-auto-dub">
          <Wand2 size={14} /> <BL k="autoDub" />
        </button>
      </Tip>

      <div className="flex items-center gap-2 pl-3 ml-1 border-l border-[var(--kdp-border)] w-[180px]">
        <button className="text-[var(--kdp-text-2)] hover:text-[var(--kdp-cyan)]" onClick={() => setChannel('master', { mute: !master.mute })} aria-label="Mute master">
          {master.mute ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
        <Slider value={master.volume} min={0} max={1.5} step={0.01} onChange={(v) => setChannel('master', { volume: v })}
          format={(v) => `${Math.round(v * 100)}%`} className="flex-1" />
      </div>
    </div>
  );
};
