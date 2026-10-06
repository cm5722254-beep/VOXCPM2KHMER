import React from 'react';

export type BadgeVariant = 'cyan' | 'jade' | 'fire' | 'purple' | 'danger' | 'muted';

export interface GlobalBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'xs' | 'sm';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<GlobalBadgeProps> = ({
  children,
  variant = 'cyan',
  size = 'sm',
  icon,
  className = '',
}) => {
  const variantClasses: Record<BadgeVariant, string> = {
    cyan: 'bg-[#16D9FF]/15 text-[#16D9FF] border-slate-200 dark:border-[#16D9FF]/30',
    jade: 'bg-[#00FFA8]/15 text-[#00FFA8] border-slate-200 dark:border-[#00FFA8]/30',
    fire: 'bg-[#FF7A18]/15 text-[#FF7A18] border-[#FF7A18]/30',
    purple: 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30',
    danger: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30',
    muted: 'bg-white dark:bg-[#101925] text-[#94A3B8] border-slate-200 dark:border-[#203244]',
  };

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[9px]',
    sm: 'px-2 py-0.5 text-[10px]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-bold rounded-full border ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
