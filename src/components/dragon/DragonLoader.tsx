import React from 'react';

interface DragonLoaderProps {
  message?: string;
  subMessage?: string;
  progress?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'energy_circle' | 'dragon_egg' | 'magic_rune' | 'waveform';
  className?: string;
}

export const DragonLoader: React.FC<DragonLoaderProps> = ({
  message = 'Dragon AI កំពុងវិភាគ...',
  subMessage,
  progress,
  size = 'md',
  variant = 'energy_circle',
  className = '',
}) => {
  const sizeMap = {
    sm: { container: 'p-3', ring: 36, stroke: 2, text: 'text-xs', sub: 'text-[10px]' },
    md: { container: 'p-6', ring: 64, stroke: 3, text: 'text-sm', sub: 'text-xs' },
    lg: { container: 'p-10', ring: 96, stroke: 4, text: 'text-base', sub: 'text-xs' },
  };

  const { container, ring, stroke, text, sub } = sizeMap[size];

  return (
    <div className={`flex flex-col items-center justify-center text-center select-none ${container} ${className}`}>
      {/* ── Dragon Magic Circle Animation ── */}
      <div className="relative flex items-center justify-center">
        {/* Ambient Dragon Aura */}
        <div
          className="absolute rounded-full bg-gradient-to-tr from-[#16D9FF] via-[#2563EB] to-[#8B5CF6] opacity-35 blur-xl animate-pulse"
          style={{ width: ring * 1.3, height: ring * 1.3 }}
        />

        {/* Outer Magic Rune Ring (Slow Clockwise Rotation) */}
        <svg
          width={ring}
          height={ring}
          viewBox="0 0 100 100"
          className="animate-spin"
          style={{ animationDuration: '8s' }}
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="#203244"
            strokeWidth={stroke}
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="url(#loader_cyan_purple)"
            strokeWidth={stroke + 1}
            strokeDasharray="24 16 38 12"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="loader_cyan_purple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#16D9FF" />
              <stop offset="50%" stopColor="#00FFA8" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Inner Counter-Rotating Dragon Rune Ring */}
        <svg
          width={ring * 0.72}
          height={ring * 0.72}
          viewBox="0 0 100 100"
          className="absolute animate-spin"
          style={{ animationDuration: '4s', animationDirection: 'reverse' }}
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeDasharray="18 18 10 10"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>

        {/* Center Dragon Core / Flame / Waveform */}
        <div className="absolute flex items-center justify-center">
          {variant === 'waveform' ? (
            <div className="flex items-center gap-1 h-6">
              {[0.4, 0.9, 0.6, 1, 0.5, 0.8, 0.3].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-[#16D9FF] rounded-full animate-pulse"
                  style={{
                    height: `${h * 100}%`,
                    animationDelay: `${i * 120}ms`,
                    animationDuration: '600ms',
                  }}
                />
              ))}
            </div>
          ) : variant === 'dragon_egg' ? (
            <span className="text-2xl drop-shadow-[0_0_12px_rgba(255,122,24,0.7)] animate-bounce">
              🥚
            </span>
          ) : (
            <span className="text-xl sm:text-2xl drop-shadow-[0_0_12px_rgba(22,217,255,0.8)] animate-pulse"><img src="/dragon_logo.png" alt="Dragon" className="w-1em h-1em inline-block rounded-sm object-cover shadow-sm" style={{ width: "1em", height: "1em" }} /></span>
          )}
        </div>
      </div>

      {/* ── Status Message & Progress ── */}
      <div className="mt-4 flex flex-col items-center gap-1.5 max-w-sm">
        <h4 className={`${text} font-bold text-slate-800 dark:text-white font-khmer tracking-wide drop-shadow-sm flex items-center gap-2`}>
          <span>{message}</span>
          {typeof progress === 'number' && (
            <span className="font-mono text-[#16D9FF] text-xs px-2 py-0.5 rounded-full bg-[#16D9FF]/15 border border-slate-200 dark:border-[#16D9FF]/40">
              {Math.round(progress)}%
            </span>
          )}
        </h4>

        {subMessage && (
          <p className={`${sub} text-[#94A3B8] font-khmer leading-relaxed`}>
            {subMessage}
          </p>
        )}

        {/* Progress Bar (if provided) */}
        {typeof progress === 'number' && (
          <div className="w-48 h-1.5 bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] rounded-full overflow-hidden mt-2 relative">
            <div
              className="h-full bg-gradient-to-r from-[#16D9FF] via-[#00FFA8] to-[#8B5CF6] transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
