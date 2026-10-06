import React from 'react';

export interface GlobalProgressProps {
  value: number; // 0 to 100
  label?: string;
  variant?: 'cyan' | 'jade' | 'fire' | 'purple';
  showPercent?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Progress: React.FC<GlobalProgressProps> = ({
  value,
  label,
  variant = 'cyan',
  showPercent = true,
  size = 'md',
  className = '',
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  const gradientClasses = {
    cyan: 'bg-gradient-to-r from-[#16D9FF] via-[#00FFA8] to-[#8B5CF6]',
    jade: 'bg-gradient-to-r from-[#00FFA8] to-[#10B981]',
    fire: 'bg-gradient-to-r from-[#FF7A18] to-[#EF4444]',
    purple: 'bg-gradient-to-r from-[#8B5CF6] to-[#2563EB]',
  };

  return (
    <div className={`w-full font-khmer flex flex-col gap-1.5 ${className}`}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs text-[#94A3B8]">
          {label && <span>{label}</span>}
          {showPercent && <span className="font-mono font-bold text-slate-800 dark:text-white">{clampedValue}%</span>}
        </div>
      )}

      <div className={`w-full bg-slate-50 dark:bg-[#070A12] rounded-full overflow-hidden border border-slate-200 dark:border-[#203244] ${heightClasses[size]}`}>
        <div
          className={`h-full transition-all duration-300 rounded-full ${gradientClasses[variant]}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
