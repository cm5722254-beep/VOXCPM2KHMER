import React, { useRef, useState, useEffect } from 'react';
import {
  Mic,
  Bot,
  Users,
  Subtitles,
  Sparkles,
  Music,
  Volume2,
  VolumeX,
  Palette,
  Share2,
  ChevronLeft,
  ChevronRight,
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const tools: { id: FeatureTab; label: string; emoji: string; icon: React.ReactNode }[] = [
    { id: 'dubbing',     label: 'ឌាប់សំឡេង AI',   emoji: '✨', icon: <Mic       className="w-3.5 h-3.5" /> },
    { id: 'tts',         label: 'សំឡេង AI',        emoji: '🤖', icon: <Bot       className="w-3.5 h-3.5" /> },
    { id: 'voice_clone', label: 'ចម្លងសំឡេង',      emoji: '🎤', icon: <Users     className="w-3.5 h-3.5" /> },
    { id: 'subtitle',    label: 'ចំណងជើងរង',       emoji: '📝', icon: <Subtitles className="w-3.5 h-3.5" /> },
    { id: 'effects',     label: 'VIDEO STYLE',      emoji: '🎬', icon: <Sparkles  className="w-3.5 h-3.5" /> },
    { id: 'bgm',         label: 'តន្ត្រី',           emoji: '🎵', icon: <Music     className="w-3.5 h-3.5" /> },
    { id: 'sfx',         label: 'សំឡេងបែបផែន',     emoji: '🔊', icon: <Volume2   className="w-3.5 h-3.5" /> },
    { id: 'color',       label: 'ពណ៌',              emoji: '🎨', icon: <Palette   className="w-3.5 h-3.5" /> },
    { id: 'export',      label: 'នាំចេញ',            emoji: '📤', icon: <Share2    className="w-3.5 h-3.5" /> },
  ];

  /* ── scroll state ── */
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const scrollBy = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 180 : -180, behavior: 'smooth' });
  };

  /* ── auto-scroll active tab into view ── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeBtn = el.querySelector('[data-active="true"]') as HTMLElement | null;
    if (activeBtn) {
      const btnLeft  = activeBtn.offsetLeft;
      const btnRight = btnLeft + activeBtn.offsetWidth;
      const viewLeft  = el.scrollLeft;
      const viewRight = viewLeft + el.clientWidth;
      if (btnLeft < viewLeft)        el.scrollTo({ left: btnLeft - 12, behavior: 'smooth' });
      else if (btnRight > viewRight) el.scrollTo({ left: btnRight - el.clientWidth + 12, behavior: 'smooth' });
    }
  }, [activeFeature]);

  /* ── volume helpers ── */
  const isOverdrive  = masterVolume > 100;
  const volColor     = isOverdrive ? 'text-orange-400' : 'text-emerald-400';
  const VolumeIcon   = masterVolume === 0 ? VolumeX : Volume2;

  return (
    <>
      {/* keyframe injection – only runs once in DOM */}
      <style>{`
        @keyframes ft-slide-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes ft-vol-pulse {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(251,146,60,0.7)); }
          50%       { filter: drop-shadow(0 0 10px rgba(251,146,60,1));  }
        }
        .ft-tab-enter {
          opacity: 0;
          animation: ft-slide-in 220ms ease-out forwards;
        }
        .ft-vol-overdrive {
          animation: ft-vol-pulse 1.4s ease-in-out infinite;
        }
        /* hide native scrollbar */
        .ft-scroll::-webkit-scrollbar { display: none; }
        .ft-scroll { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

      <div
        className="feature-toolbar h-[46px] bg-[#141417] border-b border-white/[0.06] flex items-center z-30 select-none font-khmer shrink-0 relative shadow-[0_1px_0_0_rgba(220,38,38,0.15)]"
      >

        {/* ── Left scroll fade + arrow ── */}
        <div
          className={`absolute left-0 top-0 bottom-0 z-20 flex items-center pointer-events-none transition-opacity duration-200 ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* gradient fade */}
          <div className="w-10 h-full bg-gradient-to-r from-[#141417] via-[#141417]/80 to-transparent" />
        </div>
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollBy('left')}
            className="absolute left-0 z-30 h-full px-1.5 flex items-center text-zinc-500 hover:text-white hover:scale-110 transition-all duration-150"
            aria-label="scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* ── Horizontal tools row ── */}
        <div
          ref={scrollRef}
          className="ft-scroll flex items-center gap-0.5 overflow-x-auto py-1 px-3 flex-1 h-full"
        >
          {tools.map((tool, index) => {
            const isActive = activeFeature === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                data-active={isActive}
                onClick={() => onSelectFeature(tool.id)}
                title={`${tool.emoji} ${tool.label}`}
                className={`
                  ft-tab-enter
                  relative flex items-center gap-1.5 px-2.5 h-[34px] rounded-lg text-xs font-bold
                  transition-all duration-[250ms] ease-out shrink-0 whitespace-nowrap overflow-hidden
                  ${isActive
                    ? 'bg-gradient-to-r from-red-600/20 to-orange-500/10 text-red-300 border-l-2 border-l-red-500 border-t-0 border-r-0 border-b-0'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05] border border-transparent'
                  }
                `}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                {/* active glowing underline */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-400 rounded-full" />
                )}

                {/* icon with conditional glow */}
                <span
                  className={`shrink-0 transition-all duration-[250ms] ${
                    isActive
                      ? 'text-red-400 drop-shadow-[0_0_8px_rgba(220,38,38,0.9)]'
                      : 'text-zinc-500'
                  }`}
                >
                  {tool.icon}
                </span>

                {/* emoji (hidden on small) + label */}
                <span className="hidden xs:inline-flex items-center gap-1">
                  <span className="hidden sm:inline leading-none">{tool.emoji}</span>
                  <span>{tool.label}</span>
                </span>
                {/* fallback emoji-only on tiny viewports */}
                <span className="xs:hidden text-sm leading-none">{tool.emoji}</span>
              </button>
            );
          })}
        </div>

        {/* ── Right scroll fade + arrow ── */}
        <div
          className={`absolute z-20 top-0 bottom-0 flex items-center pointer-events-none transition-opacity duration-200 right-[176px] sm:right-[216px] ${canScrollRight ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="w-10 h-full bg-gradient-to-l from-[#141417] via-[#141417]/80 to-transparent" />
        </div>
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollBy('right')}
            className="absolute right-[176px] sm:right-[216px] z-30 h-full px-1.5 flex items-center text-zinc-500 hover:text-white hover:scale-110 transition-all duration-150"
            aria-label="scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* ── Master Volume ── */}
        <div className="hidden sm:flex items-center gap-2 px-3 shrink-0 border-l border-white/[0.06] h-full">
          {/* Full controls on lg+ */}
          <div className="hidden lg:flex items-center gap-2">
            <VolumeIcon
              className={`w-4 h-4 shrink-0 transition-colors duration-300 ${volColor} ${isOverdrive ? 'ft-vol-overdrive' : ''}`}
            />
            <input
              type="range"
              min={0}
              max={150}
              step={5}
              value={masterVolume}
              onChange={(e) => onChangeMasterVolume(parseInt(e.target.value, 10))}
              className="w-20 h-1.5 accent-red-500 bg-[#1C1C22] rounded-lg cursor-pointer"
              title={`កម្រិតសំឡេងមេ: ${masterVolume}%`}
            />
            <span
              className={`font-mono text-xs font-bold w-9 text-right transition-colors duration-300 ${volColor}`}
            >
              {masterVolume}%
            </span>
          </div>

          {/* Compact on md screens */}
          <div className="lg:hidden flex items-center gap-1.5">
            <VolumeIcon
              className={`w-3.5 h-3.5 transition-colors duration-300 ${volColor} ${isOverdrive ? 'ft-vol-overdrive' : ''}`}
            />
            <span className={`font-mono text-[11px] font-bold transition-colors duration-300 ${volColor}`}>
              {masterVolume}%
            </span>
          </div>
        </div>

      </div>
    </>
  );
};
