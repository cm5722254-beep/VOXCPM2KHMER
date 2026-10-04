import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { L, LabelKey } from '../i18n';
import { useStudio } from '../store/studioStore';

/** Bilingual label: renders English + Khmer according to the language preference. */
export const BL: React.FC<{ k: LabelKey; className?: string; stacked?: boolean }> = ({ k, className, stacked }) => {
  const lang = useStudio((s) => s.lang);
  const v = L[k];
  if (lang === 'en') return <span className={className}>{v.en}</span>;
  if (lang === 'km') return <span className={`km ${className || ''}`}>{v.km}</span>;
  return stacked ? (
    <span className={`flex flex-col leading-tight ${className || ''}`}>
      <span>{v.en}</span>
      <span className="km text-[10px] opacity-60" style={{ lineHeight: 1.4 }}>{v.km}</span>
    </span>
  ) : (
    <span className={className}>{v.en}</span>
  );
};

export const Tip: React.FC<{ label: React.ReactNode; kbd?: string; side?: 'top' | 'bottom' | 'left' | 'right'; children: React.ReactElement }> = ({
  label, kbd, side = 'bottom', children,
}) => (
  <Tooltip.Root delayDuration={350}>
    <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content side={side} sideOffset={6} className="kdp-tooltip flex items-center gap-2">
        <span>{label}</span>
        {kbd && <span className="kdp-kbd">{kbd}</span>}
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
);

type IconBtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ElementType; label: React.ReactNode; kbd?: string; size?: 'xs' | 'sm' | 'md'; active?: boolean;
  variant?: 'ghost' | 'default' | 'danger'; side?: 'top' | 'bottom' | 'left' | 'right';
};
export const IconBtn = React.forwardRef<HTMLButtonElement, IconBtnProps>(
  ({ icon: Icon, label, kbd, size = 'sm', active, variant = 'ghost', side, className = '', ...rest }, ref) => {
    const sz = size === 'xs' ? 'kdp-btn-xs' : size === 'sm' ? 'kdp-btn-sm' : '';
    const ic = size === 'xs' ? 12 : size === 'sm' ? 14 : 16;
    return (
      <Tip label={label} kbd={kbd} side={side}>
        <button
          ref={ref}
          aria-label={typeof label === 'string' ? label : undefined}
          className={`kdp-btn kdp-btn-icon ${sz} ${variant === 'ghost' ? 'kdp-btn-ghost' : ''} ${variant === 'danger' ? 'kdp-btn-ghost kdp-btn-danger' : ''} ${active ? 'is-active' : ''} ${className}`}
          {...rest}
        >
          <Icon size={ic} />
        </button>
      </Tip>
    );
  }
);
IconBtn.displayName = 'IconBtn';

/** Compact range slider with value readout. */
export const Slider: React.FC<{
  value: number; min: number; max: number; step?: number; onChange: (v: number) => void;
  format?: (v: number) => string; className?: string; width?: number | string; disabled?: boolean; id?: string;
  onCommit?: (v: number) => void;
}> = ({ value, min, max, step = 0.01, onChange, format, className = '', width, disabled, id, onCommit }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={`flex items-center gap-2 ${className}`} style={{ width }}>
      <input
        id={id}
        type="range"
        className="kdp-range flex-1"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        style={{ ['--pct' as any]: `${pct}%` }}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onMouseUp={(e) => onCommit?.(parseFloat((e.target as HTMLInputElement).value))}
        onDoubleClick={() => onChange(min < 0 && max > 0 ? 0 : min === 0 && max >= 1.5 && max <= 2.5 ? 1 : value)}
      />
      {format && <span className="mono text-[10.5px] text-[var(--kdp-text-2)] w-10 text-right shrink-0">{format(value)}</span>}
    </div>
  );
};

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label?: React.ReactNode; id?: string }> = ({
  checked, onChange, label, id,
}) => (
  <label htmlFor={id} className="inline-flex items-center gap-2 cursor-pointer select-none text-[12px] text-[var(--kdp-text-2)]">
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative w-8 h-[18px] rounded-full transition-colors border"
      style={{
        background: checked ? 'linear-gradient(90deg,#22d3ee,#3b82f6)' : 'rgba(100,180,255,.12)',
        borderColor: checked ? 'rgba(125,211,252,.6)' : 'var(--kdp-border)',
      }}
    >
      <span
        className="absolute top-[2px] w-3 h-3 rounded-full bg-white transition-all shadow"
        style={{ left: checked ? 16 : 2 }}
      />
    </button>
    {label}
  </label>
);

export const Modal: React.FC<{
  open: boolean; onOpenChange: (o: boolean) => void; title: React.ReactNode; subtitle?: React.ReactNode;
  width?: number; children: React.ReactNode; footer?: React.ReactNode; icon?: React.ElementType;
}> = ({ open, onOpenChange, title, subtitle, width = 560, children, footer, icon: Icon }) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="kdp-overlay" />
      <Dialog.Content className="kdp-dialog kdp" style={{ width: `min(${width}px, 94vw)`, background: undefined }} aria-describedby={undefined}>
        <div className="flex items-start gap-3 px-5 pt-4 pb-3 border-b border-[var(--kdp-border)]">
          {Icon && (
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,rgba(34,211,238,.2),rgba(139,92,246,.2))', border: '1px solid var(--kdp-border-strong)' }}>
              <Icon size={17} className="text-[var(--kdp-cyan)]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Dialog.Title className="text-[15px] font-semibold tracking-wide">{title}</Dialog.Title>
            {subtitle && <div className="text-[11.5px] text-[var(--kdp-text-3)] mt-0.5">{subtitle}</div>}
          </div>
          <Dialog.Close className="kdp-btn kdp-btn-ghost kdp-btn-icon kdp-btn-sm" aria-label="Close">
            <X size={15} />
          </Dialog.Close>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-[var(--kdp-border)] flex justify-end gap-2">{footer}</div>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);

export const Field: React.FC<{ label: React.ReactNode; children: React.ReactNode; className?: string; hint?: React.ReactNode }> = ({
  label, children, className = '', hint,
}) => (
  <div className={className}>
    <span className="kdp-label">{label}</span>
    {children}
    {hint && <div className="text-[10.5px] text-[var(--kdp-text-3)] mt-1">{hint}</div>}
  </div>
);

export const Avatar: React.FC<{ name: string; gender?: string; size?: number }> = ({ name, gender, size = 30 }) => {
  const initials = (name || '?').replace(/\(.*?\)/g, '').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  const g = gender === 'female'
    ? `linear-gradient(135deg, hsl(${(h % 60) + 300} 70% 60%), hsl(${(h % 40) + 260} 65% 45%))`
    : `linear-gradient(135deg, hsl(${(h % 50) + 190} 75% 52%), hsl(${(h % 40) + 220} 70% 40%))`;
  return (
    <div className="rounded-[9px] flex items-center justify-center font-semibold text-white shrink-0 border border-white/15"
      style={{ width: size, height: size, background: g, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
};

export const EmptyState: React.FC<{ icon: React.ElementType; title: string; km?: string; action?: React.ReactNode }> = ({
  icon: Icon, title, km, action,
}) => (
  <div className="flex flex-col items-center justify-center text-center gap-2 py-10 px-6 text-[var(--kdp-text-3)]">
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-[var(--kdp-border)]" style={{ background: 'rgba(100,180,255,.05)' }}>
      <Icon size={22} />
    </div>
    <div className="text-[13px] text-[var(--kdp-text-2)] font-medium">{title}</div>
    {km && <div className="km text-[11.5px]">{km}</div>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);
