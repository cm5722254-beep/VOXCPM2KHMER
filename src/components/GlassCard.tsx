import React, { ReactNode } from 'react';
import { cn } from '../utils/cn';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'sky' | 'emerald' | 'violet' | 'gold' | 'none';
  onClick?: () => void;
}

export default function GlassCard({ 
  children, 
  className, 
  hover = false, 
  glow = 'none',
  onClick 
}: GlassCardProps) {
  const glowStyles = {
    sky: 'hover:shadow-[0_0_24px_rgba(56,189,248,0.3)] hover:border-sky-400/30',
    emerald: 'hover:shadow-[0_0_24px_rgba(52,211,153,0.3)] hover:border-emerald-400/30',
    violet: 'hover:shadow-[0_0_24px_rgba(139,92,246,0.3)] hover:border-violet-400/30',
    gold: 'hover:shadow-[0_0_24px_rgba(251,191,36,0.3)] hover:border-amber-400/30',
    none: ''
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'glass-card transition-all duration-300',
        hover && 'hover:scale-[1.02] hover:-translate-y-0.5',
        glow !== 'none' && glowStyles[glow],
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

// Glass Panel (stronger blur)
export function GlassPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('glass-strong rounded-2xl', className)}>
      {children}
    </div>
  );
}

// Glass Button
interface GlassButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  loading?: boolean;
}

export function GlassButton({ 
  children, 
  variant = 'primary',
  size = 'md',
  icon,
  onClick,
  disabled,
  className,
  loading
}: GlassButtonProps) {
  const variantStyles = {
    primary: 'btn-primary',
    secondary: 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 border border-slate-600/50',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    success: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'rounded-lg font-semibold transition-all duration-200',
        'flex items-center justify-center gap-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!loading && icon}
      {children}
    </button>
  );
}

// Glass Input
interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  error?: string;
}

export function GlassInput({ icon, error, className, ...props }: GlassInputProps) {
  return (
    <div className="space-y-1">
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={cn(
            'input-field w-full',
            icon && 'pl-10',
            error && 'border-red-500/50 focus:ring-red-500/20',
            className
          )}
        />
      </div>
      {error && (
        <p className="text-xs text-red-400 pl-1">{error}</p>
      )}
    </div>
  );
}

// Glass Badge
interface GlassBadgeProps {
  children: ReactNode;
  variant?: 'sky' | 'emerald' | 'amber' | 'red' | 'violet' | 'indigo';
  pulse?: boolean;
  className?: string;
}

export function GlassBadge({ children, variant = 'sky', pulse, className }: GlassBadgeProps) {
  const variants = {
    sky: 'badge-sky',
    emerald: 'badge-success',
    amber: 'badge-warning',
    red: 'badge-danger',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    indigo: 'badge-indigo'
  };

  return (
    <span className={cn(
      'badge',
      variants[variant],
      pulse && 'animate-pulse',
      className
    )}>
      {children}
    </span>
  );
}

// Glass Progress Bar
interface GlassProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function GlassProgress({ 
  value, 
  max = 100, 
  showLabel, 
  className,
  variant = 'default' 
}: GlassProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variantColors = {
    default: 'from-sky-400 via-violet-400 to-fuchsia-400',
    success: 'from-emerald-400 to-emerald-500',
    warning: 'from-amber-400 to-orange-500',
    danger: 'from-red-400 to-red-600'
  };

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Progress</span>
          <span className="font-bold text-sky-400">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="progress-bar h-2">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            'bg-gradient-to-r',
            variantColors[variant],
            'shadow-[0_0_12px_rgba(56,189,248,0.5)]'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Glass Modal
interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function GlassModal({ isOpen, onClose, children, title, size = 'md' }: GlassModalProps) {
  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 modal-backdrop">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      
      <div className={cn(
        'modal-content relative w-full',
        sizeStyles[size]
      )}>
        {title && (
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5">
            <h2 className="text-xl font-bold gradient-text">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
