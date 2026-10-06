import React, { useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'ai'
  | 'vip'
  | 'dragon'
  | 'fire'
  | 'ghost-red'
  | 'glass';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface GlobalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  glow?: boolean;
  ripple?: boolean;
}

// ─── Ripple helper ────────────────────────────────────────────────────────────
function spawnRipple(
  e: React.MouseEvent<HTMLButtonElement>,
  container: HTMLButtonElement,
  color: string
) {
  const rect = container.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  const rippleEl = document.createElement('span');
  rippleEl.style.cssText = `
    position:absolute;
    border-radius:50%;
    pointer-events:none;
    width:${size}px;
    height:${size}px;
    left:${x}px;
    top:${y}px;
    background:${color};
    transform:scale(0);
    animation:ripple-expand 550ms cubic-bezier(0.4,0,0.2,1) forwards;
    z-index:0;
  `;
  container.appendChild(rippleEl);
  rippleEl.addEventListener('animationend', () => rippleEl.remove(), { once: true });
}

// Inject ripple keyframes once
if (typeof document !== 'undefined') {
  const RIPPLE_ID = '__btn-ripple-kf__';
  if (!document.getElementById(RIPPLE_ID)) {
    const style = document.createElement('style');
    style.id = RIPPLE_ID;
    style.textContent = `
      @keyframes ripple-expand {
        to { transform: scale(1); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

// ─── Variant definitions ──────────────────────────────────────────────────────
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-[#16D9FF] to-[#2563EB] text-[#070A12] font-black ' +
    'hover:brightness-110 border border-slate-200 dark:border-[#16D9FF]/40 ' +
    'shadow-[0_0_15px_rgba(22,217,255,0.25)]',

  secondary:
    'bg-white dark:bg-[#101925] text-slate-800 dark:text-[#F8FAFC] ' +
    'border border-slate-200 dark:border-[#203244] ' +
    'hover:bg-slate-100 dark:hover:bg-[#152235] hover:border-slate-300 dark:hover:border-[#16D9FF]/40',

  ghost:
    'bg-transparent text-[#94A3B8] hover:text-white hover:bg-white/[0.06]',

  danger:
    'bg-gradient-to-r from-[#EF4444] to-[#B91C1C] text-white font-bold ' +
    'hover:brightness-110 border border-[#EF4444]/40 ' +
    'shadow-[0_0_15px_rgba(239,68,68,0.25)]',

  success:
    'bg-gradient-to-r from-[#00FFA8] to-[#10B981] text-[#070A12] font-black ' +
    'hover:brightness-110 border border-[#00FFA8]/40 ' +
    'shadow-[0_0_15px_rgba(0,255,168,0.25)]',

  ai:
    'bg-gradient-to-r from-[#16D9FF] via-[#00FFA8] to-[#8B5CF6] text-[#070A12] font-black ' +
    'hover:brightness-115 border border-white/20 ' +
    'shadow-[0_0_20px_rgba(22,217,255,0.35)]',

  vip:
    'bg-gradient-to-r from-[#FF7A18] via-[#F59E0B] to-[#EF4444] text-white font-black ' +
    'hover:brightness-110 border border-[#FF7A18]/40 ' +
    'shadow-[0_0_20px_rgba(255,122,24,0.3)]',

  // ── New variants ────────────────────────────────────────────────────────────
  dragon:
    'bg-gradient-to-r from-[#7f1d1d] via-[#DC2626] to-[#991b1b] text-white font-black ' +
    'hover:from-[#991b1b] hover:via-[#EF4444] hover:to-[#DC2626] ' +
    'border border-red-700/50 ' +
    'shadow-[0_0_18px_rgba(220,38,38,0.45)] hover:shadow-[0_0_28px_rgba(220,38,38,0.70)]',

  fire:
    'bg-gradient-to-r from-[#F97316] via-[#EF4444] to-[#DC2626] text-white font-black ' +
    'hover:from-[#FB923C] hover:via-[#F87171] hover:to-[#EF4444] ' +
    'border border-orange-600/50 ' +
    'shadow-[0_0_18px_rgba(249,115,22,0.45)] hover:shadow-[0_0_28px_rgba(249,115,22,0.70)]',

  'ghost-red':
    'bg-transparent text-red-400 border border-red-500/40 ' +
    'hover:bg-red-500/10 hover:border-red-400/70 hover:text-red-300',

  glass:
    'bg-white/[0.06] backdrop-blur-md text-white/80 ' +
    'border border-white/[0.12] ' +
    'hover:bg-white/[0.10] hover:border-white/[0.20] hover:text-white',
};

// Ripple tint per variant
const RIPPLE_COLOR: Record<ButtonVariant, string> = {
  primary: 'rgba(22,217,255,0.25)',
  secondary: 'rgba(148,163,184,0.20)',
  ghost: 'rgba(255,255,255,0.12)',
  danger: 'rgba(239,68,68,0.28)',
  success: 'rgba(0,255,168,0.25)',
  ai: 'rgba(22,217,255,0.22)',
  vip: 'rgba(255,122,24,0.28)',
  dragon: 'rgba(220,38,38,0.30)',
  fire: 'rgba(249,115,22,0.30)',
  'ghost-red': 'rgba(239,68,68,0.20)',
  glass: 'rgba(255,255,255,0.15)',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-[11px] rounded-lg gap-1.5',
  sm: 'px-3 py-1.5 text-xs rounded-xl gap-2',
  md: 'px-4 py-2 text-xs font-bold rounded-xl gap-2',
  lg: 'px-5 py-3 text-sm font-black rounded-2xl gap-2.5',
};

// ─── Component ────────────────────────────────────────────────────────────────
export const Button: React.FC<GlobalButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  glow = false,
  ripple = true,
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && btnRef.current) {
        spawnRipple(e, btnRef.current, RIPPLE_COLOR[variant]);
      }
      onClick?.(e);
    },
    [ripple, variant, onClick]
  );

  const glowCls = glow ? 'animate-pulse ring-2 ring-[#16D9FF]/30' : '';

  return (
    <button
      ref={btnRef}
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={[
        'relative overflow-hidden inline-flex items-center justify-center font-khmer select-none',
        'active:scale-95 transition-all duration-200',
        'outline-none focus-visible:ring-2 focus-visible:ring-[#16D9FF] focus-visible:ring-offset-1 focus-visible:ring-offset-[#070A12]',
        'disabled:opacity-45 disabled:pointer-events-none disabled:grayscale',
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        glowCls,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{loadingText ?? 'កំពុងដំណើរការ...'}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="relative z-10 shrink-0">{leftIcon}</span>}
          <span className="relative z-10">{children}</span>
          {rightIcon && <span className="relative z-10 shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
