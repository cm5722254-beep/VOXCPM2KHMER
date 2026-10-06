import React, { useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

export type DragonButtonVariant =
  | 'energy'
  | 'jade'
  | 'fire'
  | 'purple'
  | 'panel'
  | 'outline'
  | 'danger';

export type DragonButtonSize = 'xs' | 'sm' | 'md' | 'lg';
export type DragonButtonGlow = 'sm' | 'md' | 'lg';

interface DragonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: DragonButtonVariant;
  size?: DragonButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  /** @deprecated Use glow="md" — kept for backwards compat */
  glow?: boolean | DragonButtonGlow;
  active?: boolean;
  className?: string;
  children?: React.ReactNode;
  /** Ripple click effect */
  ripple?: boolean;
}

// ─── Glow shadow map ──────────────────────────────────────────────────────────
type GlowLevel = 'none' | 'sm' | 'md' | 'lg';

const GLOW_SHADOWS: Record<DragonButtonVariant, Record<GlowLevel, string>> = {
  energy: {
    none: '',
    sm: 'shadow-[0_0_10px_rgba(220,38,38,0.35)]',
    md: 'shadow-[0_0_22px_rgba(220,38,38,0.55)] hover:shadow-[0_0_30px_rgba(220,38,38,0.75)]',
    lg: 'shadow-[0_0_34px_rgba(220,38,38,0.75)] hover:shadow-[0_0_48px_rgba(220,38,38,0.90)]',
  },
  jade: {
    none: '',
    sm: 'shadow-[0_0_10px_rgba(245,158,11,0.30)]',
    md: 'shadow-[0_0_22px_rgba(245,158,11,0.50)] hover:shadow-[0_0_30px_rgba(245,158,11,0.70)]',
    lg: 'shadow-[0_0_34px_rgba(245,158,11,0.70)] hover:shadow-[0_0_48px_rgba(245,158,11,0.85)]',
  },
  fire: {
    none: '',
    sm: 'shadow-[0_0_10px_rgba(239,68,68,0.35)]',
    md: 'shadow-[0_0_24px_rgba(239,68,68,0.60)] hover:shadow-[0_0_32px_rgba(239,68,68,0.80)]',
    lg: 'shadow-[0_0_36px_rgba(239,68,68,0.78)] hover:shadow-[0_0_52px_rgba(239,68,68,0.95)]',
  },
  purple: {
    none: '',
    sm: 'shadow-[0_0_10px_rgba(185,28,28,0.30)]',
    md: 'shadow-[0_0_20px_rgba(185,28,28,0.50)]',
    lg: 'shadow-[0_0_32px_rgba(185,28,28,0.65)] hover:shadow-[0_0_44px_rgba(185,28,28,0.80)]',
  },
  panel: { none: '', sm: '', md: '', lg: '' },
  outline: { none: '', sm: '', md: '', lg: '' },
  danger: {
    none: '',
    sm: 'shadow-[0_0_8px_rgba(239,68,68,0.25)]',
    md: 'shadow-[0_0_18px_rgba(239,68,68,0.45)]',
    lg: 'shadow-[0_0_30px_rgba(239,68,68,0.65)]',
  },
};

// ─── Ripple helpers ───────────────────────────────────────────────────────────
const RIPPLE_COLORS: Record<DragonButtonVariant, string> = {
  energy: 'rgba(220,38,38,0.32)',
  jade: 'rgba(245,158,11,0.30)',
  fire: 'rgba(239,68,68,0.32)',
  purple: 'rgba(185,28,28,0.28)',
  panel: 'rgba(255,255,255,0.10)',
  outline: 'rgba(220,38,38,0.20)',
  danger: 'rgba(239,68,68,0.25)',
};

if (typeof document !== 'undefined') {
  const KF_ID = '__dragon-ripple-kf__';
  if (!document.getElementById(KF_ID)) {
    const s = document.createElement('style');
    s.id = KF_ID;
    s.textContent = `
      @keyframes dragon-ripple {
        to { transform: scale(1); opacity: 0; }
      }
      @keyframes dragon-shimmer-sweep {
        0%   { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
        30%  { opacity: 1; }
        100% { transform: translateX(200%) skewX(-15deg); opacity: 0; }
      }
    `;
    document.head.appendChild(s);
  }
}

function spawnRipple(
  e: React.MouseEvent<HTMLButtonElement>,
  el: HTMLButtonElement,
  color: string
) {
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  const span = document.createElement('span');
  span.style.cssText = `
    position:absolute;
    border-radius:50%;
    pointer-events:none;
    width:${size}px;
    height:${size}px;
    left:${x}px;
    top:${y}px;
    background:${color};
    transform:scale(0);
    animation:dragon-ripple 550ms cubic-bezier(0.4,0,0.2,1) forwards;
    z-index:0;
  `;
  el.appendChild(span);
  span.addEventListener('animationend', () => span.remove(), { once: true });
}

// ─── Size classes ─────────────────────────────────────────────────────────────
const SIZE_CLASSES: Record<DragonButtonSize, string> = {
  xs: 'px-2 py-1 text-[11px] rounded-lg gap-1.5 min-h-[26px]',
  sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5 min-h-[30px]',
  md: 'px-4 py-2 text-xs font-bold rounded-xl gap-2 min-h-[34px]',
  lg: 'px-5 py-2.5 text-sm font-extrabold rounded-2xl gap-2.5 min-h-[42px]',
};

// ─── Variant base classes ─────────────────────────────────────────────────────
const VARIANT_BASE: Record<DragonButtonVariant, string> = {
  energy:
    'bg-gradient-to-r from-[#DC2626] via-[#B91C1C] to-[#F59E0B] text-white font-black ' +
    'hover:brightness-110 border border-red-400/50 font-khmer',

  jade:
    'bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#DC2626] text-white font-black ' +
    'hover:brightness-110 border border-amber-300/60 font-khmer',

  fire:
    'bg-gradient-to-r from-[#EF4444] via-[#DC2626] to-[#991B1B] text-white font-black ' +
    'hover:brightness-110 border border-amber-400/50 font-khmer',

  purple:
    'bg-gradient-to-r from-[#991B1B] via-[#B91C1C] to-[#DC2626] text-white font-bold ' +
    'hover:brightness-110 border border-red-500/40 font-khmer',

  panel:
    'bg-white dark:bg-[#160D10] hover:dark:bg-[#221318] text-slate-800 dark:text-white ' +
    'border border-slate-200 dark:border-[#3D161F] hover:border-red-500/50 font-khmer',

  outline:
    'bg-transparent hover:bg-red-500/15 text-white border border-red-500/50 ' +
    'hover:border-red-400 font-khmer',

  danger:
    'bg-[#EF4444]/25 hover:bg-[#EF4444]/35 text-white border border-red-500/60 ' +
    'hover:border-red-400 font-khmer',
};

// ─── Component ────────────────────────────────────────────────────────────────
export const DragonButton: React.FC<DragonButtonProps> = ({
  variant = 'energy',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  glow = true,
  active = false,
  ripple = true,
  className = '',
  children,
  disabled,
  onClick,
  ...props
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  // Resolve glow level
  let glowLevel: GlowLevel = 'none';
  if (glow === true || glow === 'md') glowLevel = 'md';
  else if (glow === 'sm') glowLevel = 'sm';
  else if (glow === 'lg') glowLevel = 'lg';
  else if (glow === false) glowLevel = 'none';

  const glowClass = GLOW_SHADOWS[variant][glowLevel];

  // Active panel override
  const activeClass =
    variant === 'panel' && active
      ? 'dark:bg-[#221318] !border-red-500 shadow-[0_0_18px_rgba(220,38,38,0.40)]'
      : '';

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && btnRef.current) {
        spawnRipple(e, btnRef.current, RIPPLE_COLORS[variant]);
      }
      onClick?.(e);
    },
    [ripple, variant, onClick]
  );

  return (
    <button
      ref={btnRef}
      disabled={disabled || loading}
      onClick={handleClick}
      className={[
        'relative overflow-hidden group inline-flex items-center justify-center font-ui',
        'active:scale-95 transition-all duration-200 select-none outline-none',
        'disabled:opacity-50 disabled:pointer-events-none',
        SIZE_CLASSES[size],
        VARIANT_BASE[variant],
        glowClass,
        activeClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {/* Shimmer sweep on hover — always mounted, plays on group-hover */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none"
      >
        <span
          className="absolute top-0 left-0 h-full w-1/3"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
            transform: 'translateX(-100%) skewX(-15deg)',
            transition: 'none',
          }}
          // Use CSS group-hover via inline style — simpler than Tailwind arbitrary
          onMouseEnter={undefined}
          ref={(el) => {
            if (!el) return;
            const btn = el.closest('button');
            if (!btn) return;
            const run = () => {
              el.style.animation = 'none';
              void el.offsetWidth;
              el.style.animation = 'dragon-shimmer-sweep 650ms ease forwards';
            };
            btn.addEventListener('mouseenter', run);
            // Cleanup handled by React unmount
          }}
        />
      </span>

      {/* Content */}
      {loading ? (
        <Loader2 className="relative z-10 w-3.5 h-3.5 animate-spin shrink-0" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="relative z-10 shrink-0 flex items-center justify-center leading-none">
              {icon}
            </span>
          )}
          {children && (
            <span className="relative z-10 truncate leading-none">{children}</span>
          )}
          {icon && iconPosition === 'right' && (
            <span className="relative z-10 shrink-0 flex items-center justify-center leading-none">
              {icon}
            </span>
          )}
        </>
      )}
    </button>
  );
};
