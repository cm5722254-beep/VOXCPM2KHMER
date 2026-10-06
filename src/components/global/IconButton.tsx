import React from 'react';
import { Loader2 } from 'lucide-react';
import { ButtonVariant, ButtonSize } from './Button';

export interface GlobalIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  tooltip?: string;
  glow?: boolean;
}

export const IconButton: React.FC<GlobalIconButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  tooltip,
  glow = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses: Record<ButtonSize, string> = {
    xs: 'w-7 h-7 text-xs rounded-lg',
    sm: 'w-8 h-8 text-xs rounded-xl',
    md: 'w-9 h-9 text-sm rounded-xl',
    lg: 'w-11 h-11 text-base rounded-2xl',
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-gradient-to-r from-[#16D9FF] to-[#2563EB] text-[#070A12] hover:brightness-110 active:scale-95 border border-slate-200 dark:border-[#16D9FF]/40 shadow-[0_0_12px_rgba(22,217,255,0.25)]',
    secondary:
      'bg-white dark:bg-[#101925] text-[#94A3B8] border border-slate-200 dark:border-[#203244] hover:text-slate-800 dark:text-white hover:bg-slate-100 dark:bg-[#152235] hover:border-slate-200 dark:border-[#16D9FF]/40 active:scale-95',
    ghost:
      'bg-transparent text-[#94A3B8] hover:text-slate-800 dark:text-white hover:bg-slate-200 dark:bg-white/[0.08] active:scale-95',
    danger:
      'bg-gradient-to-r from-[#EF4444] to-[#B91C1C] text-slate-800 dark:text-white hover:brightness-110 active:scale-95 border border-[#EF4444]/40 shadow-[0_0_12px_rgba(239,68,68,0.25)]',
    success:
      'bg-gradient-to-r from-[#00FFA8] to-[#10B981] text-[#070A12] hover:brightness-110 active:scale-95 border border-slate-200 dark:border-[#00FFA8]/40 shadow-[0_0_12px_rgba(0,255,168,0.25)]',
    ai:
      'bg-gradient-to-r from-[#16D9FF] via-[#00FFA8] to-[#8B5CF6] text-[#070A12] hover:brightness-115 active:scale-95 border border-white/20 shadow-[0_0_15px_rgba(22,217,255,0.35)]',
    vip:
      'bg-gradient-to-r from-[#FF7A18] via-[#F59E0B] to-[#EF4444] text-slate-800 dark:text-white hover:brightness-110 active:scale-95 border border-[#FF7A18]/40 shadow-[0_0_15px_rgba(255,122,24,0.3)]',
    dragon:
      'bg-gradient-to-r from-[#DC2626] to-[#F59E0B] text-white hover:brightness-110 active:scale-95 border border-[#DC2626]/40 shadow-[0_0_14px_rgba(220,38,38,0.35)]',
    fire:
      'bg-gradient-to-r from-[#FF4500] via-[#FF6B00] to-[#F59E0B] text-white hover:brightness-110 active:scale-95 border border-orange-500/40 shadow-[0_0_14px_rgba(255,69,0,0.4)]',
    'ghost-red':
      'bg-transparent text-[#EF4444] hover:bg-[#EF4444]/10 border border-[#EF4444]/30 hover:border-[#EF4444]/60 active:scale-95',
    glass:
      'bg-white/10 dark:bg-white/5 backdrop-blur-md text-slate-800 dark:text-white border border-white/20 hover:bg-white/20 dark:hover:bg-white/10 active:scale-95 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
  };

  return (
    <button
      disabled={disabled || isLoading}
      title={tooltip}
      className={`relative inline-flex items-center justify-center select-none transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#16D9FF] disabled:opacity-45 disabled:pointer-events-none ${sizeClasses[size]} ${variantClasses[variant]} ${glow ? 'animate-pulse' : ''} ${className}`}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : children}
    </button>
  );
};
