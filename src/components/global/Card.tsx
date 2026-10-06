import React from 'react';

export interface GlobalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'cyan' | 'jade' | 'fire' | 'purple' | 'none';
  variant?: 'panel' | 'subtle' | 'borderless';
}

export const Card: React.FC<GlobalCardProps> = ({
  children,
  glow = 'none',
  variant = 'panel',
  className = '',
  ...props
}) => {
  const glowClasses = {
    none: '',
    cyan: 'hover:shadow-[0_0_24px_rgba(22,217,255,0.2)] hover:border-slate-200 dark:border-[#16D9FF]/50',
    jade: 'hover:shadow-[0_0_24px_rgba(0,255,168,0.2)] hover:border-slate-200 dark:border-[#00FFA8]/50',
    fire: 'hover:shadow-[0_0_24px_rgba(255,122,24,0.25)] hover:border-[#FF7A18]/50',
    purple: 'hover:shadow-[0_0_24px_rgba(139,92,246,0.25)] hover:border-[#8B5CF6]/50',
  };

  const variantClasses = {
    panel: 'bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244]',
    subtle: 'bg-white dark:bg-[#0B111C] border border-slate-200 dark:border-[#203244]/60',
    borderless: 'bg-white dark:bg-[#101925]/80 border-0',
  };

  return (
    <div
      className={`rounded-2xl p-4 transition-all duration-200 ${variantClasses[variant]} ${glowClasses[glow]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const Panel = Card;
