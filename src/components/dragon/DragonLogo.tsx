import React from 'react';

interface DragonLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
  withTagline?: boolean;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

export const DragonLogo: React.FC<DragonLogoProps> = ({
  size = 'md',
  withText = true,
  withTagline = true,
  animated = true,
  className = '',
  onClick,
}) => {
  const sizeMap = {
    sm: { box: 'w-7 h-7', svg: 22, text: 'text-xs', sub: 'text-[9px]' },
    md: { box: 'w-9 h-9', svg: 28, text: 'text-sm', sub: 'text-[10px]' },
    lg: { box: 'w-12 h-12', svg: 38, text: 'text-lg', sub: 'text-xs' },
    xl: { box: 'w-16 h-16', svg: 52, text: 'text-2xl', sub: 'text-sm' },
  };

  const { box, svg, text, sub } = sizeMap[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      {/* ── Dragon Crest Emblem ── */}
      <div className="relative shrink-0">
        {/* Ambient Dragon Aura */}
        <div
          className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#DC2626] via-[#B91C1C] to-[#F59E0B] opacity-50 blur-md ${
            animated ? 'animate-pulse' : ''
          }`}
        />

        {/* Outer Ring & Container */}
        <div
          className={`${box} relative rounded-xl bg-gradient-to-b from-[#2A1016] to-[#0A0507] p-[1.5px] shadow-lg transition-transform duration-300 ${
            onClick ? 'group-hover:scale-105' : ''
          }`}
        >
          <div className="w-full h-full rounded-[10px] bg-white dark:bg-[#0E0608] flex items-center justify-center relative overflow-hidden border border-red-500 dark:border-[#DC2626]/40">
            {/* Background Magic Circle Lines */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#DC2626_1px,transparent_1px)] [background-size:6px_6px]" />

            {/* Real Dragon Image Logo */}
            <img 
              src="/dragon_logo.png" 
              alt="Dragon Logo" 
              className="w-full h-full object-cover relative z-10"
            />
          </div>
        </div>

        {/* Live Active Energy Pip */}
        <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#EF4444] border-2 border-slate-200 dark:border-[#080608]" />
        </span>
      </div>

      {/* ── Brand Typography ── */}
      {withText && (
        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`${text} font-black tracking-wider text-slate-800 dark:text-white font-ui uppercase drop-shadow-[0_2px_10px_rgba(220,38,38,0.5)] flex items-center gap-1`}
            >
              DRAGON DABBER
              <span className="px-1.5 py-0.2 rounded-md bg-gradient-to-r from-[#DC2626] to-[#F59E0B] text-[9px] font-extrabold text-slate-800 dark:text-white tracking-normal shadow-sm">
                PRO
              </span>
            </span>
          </div>
          {withTagline && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`${sub} text-blue-600 dark:text-red-400 font-semibold tracking-wider font-khmer`}>
                ស្ទូឌីយោ AI ដាក់សំឡេងខ្មែរ
              </span>
              <span className="text-[8px] text-[#64748B]">•</span>
              <span className="text-[9px] text-[#F59E0B] font-mono tracking-tight">STUDIO</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
