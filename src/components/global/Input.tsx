import React, { forwardRef, useId, useRef, useState, useCallback } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

// Inject shake + float animations once
if (typeof document !== 'undefined') {
  const INPUT_STYLE_ID = '__input-anim-kf__';
  if (!document.getElementById(INPUT_STYLE_ID)) {
    const style = document.createElement('style');
    style.id = INPUT_STYLE_ID;
    style.textContent = `
      @keyframes input-shake {
        0%,100% { transform: translateX(0); }
        20%      { transform: translateX(-5px); }
        40%      { transform: translateX(5px); }
        60%      { transform: translateX(-4px); }
        80%      { transform: translateX(4px); }
      }
      .input-shake { animation: input-shake 350ms ease; }

      /* Floating label */
      .input-label-float {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.75rem;
        color: #64748b;
        pointer-events: none;
        transition: all 200ms cubic-bezier(0.4,0,0.2,1);
        white-space: nowrap;
        line-height: 1;
      }
      .input-label-float.float-active {
        top: -0.55rem;
        transform: translateY(0) scale(0.85);
        transform-origin: left center;
        color: rgba(239,68,68,0.8);
        background: transparent;
        padding: 0 2px;
        font-weight: 600;
        font-size: 0.7rem;
      }
    `;
    document.head.appendChild(style);
  }
}

export interface GlobalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
  showClear?: boolean;
  success?: boolean;
  /** When true, animates the label above the field when focused or has value */
  floatLabel?: boolean;
}

export const Input = forwardRef<HTMLInputElement, GlobalInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      onClear,
      showClear = false,
      success = false,
      floatLabel = false,
      className = '',
      value,
      defaultValue,
      disabled,
      id: idProp,
      onFocus,
      onBlur,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = idProp ?? generatedId;
    const wrapRef = useRef<HTMLDivElement>(null);

    const [focused, setFocused] = useState(false);
    const [internalValue, setInternalValue] = useState<string>(
      (defaultValue as string) ?? ''
    );

    // Determine actual value for float detection (controlled vs uncontrolled)
    const currentValue = value !== undefined ? String(value) : internalValue;
    const hasContent = currentValue.length > 0;
    const isLabelFloated = floatLabel && (focused || hasContent);

    // Trigger shake on new error
    const prevErrorRef = useRef<string | undefined>();
    if (error && error !== prevErrorRef.current && wrapRef.current) {
      wrapRef.current.classList.remove('input-shake');
      // Force reflow so the animation re-fires
      void wrapRef.current.offsetWidth;
      wrapRef.current.classList.add('input-shake');
    }
    prevErrorRef.current = error;

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setFocused(true);
        onFocus?.(e);
      },
      [onFocus]
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setFocused(false);
        onBlur?.(e);
      },
      [onBlur]
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (value === undefined) setInternalValue(e.target.value);
        onChange?.(e);
      },
      [value, onChange]
    );

    // ── Border / ring state ──────────────────────────────────────────────────
    let wrapperBorder: string;
    let wrapperRing: string;
    if (error) {
      wrapperBorder = 'border-red-500/80';
      wrapperRing = 'ring-2 ring-red-500/30';
    } else if (success) {
      wrapperBorder = 'border-emerald-500/70';
      wrapperRing = focused ? 'ring-2 ring-emerald-500/25' : '';
    } else if (focused) {
      wrapperBorder = 'border-red-500/60';
      wrapperRing = 'ring-2 ring-red-500/30';
    } else {
      wrapperBorder = 'border-slate-700/60 dark:border-[#203244]';
      wrapperRing = '';
    }

    return (
      <div className="w-full font-khmer flex flex-col gap-1.5 text-xs">
        {/* Static label (non-floating) */}
        {label && !floatLabel && (
          <label
            htmlFor={inputId}
            className="font-bold text-[#94A3B8] flex items-center justify-between"
          >
            <span>{label}</span>
            {error && (
              <span className="text-red-400 text-[10px] font-normal">{error}</span>
            )}
          </label>
        )}

        {/* Input wrapper */}
        <div
          ref={wrapRef}
          className={[
            'relative flex items-center rounded-xl transition-all duration-200',
            'bg-white dark:bg-white/[0.04]',
            'border',
            wrapperBorder,
            wrapperRing,
            disabled ? 'opacity-50 pointer-events-none' : '',
            // extra top padding when label floats to make room
            floatLabel && label ? 'pt-3' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {/* Floating label */}
          {floatLabel && label && (
            <label
              htmlFor={inputId}
              className={`input-label-float ${isLabelFloated ? 'float-active' : ''}`}
              style={{
                left: leftIcon ? '2.2rem' : '0.75rem',
              }}
            >
              {label}
            </label>
          )}

          {/* Left icon */}
          {leftIcon && (
            <div className="pl-3 pr-2 text-[#64748B] flex items-center justify-center shrink-0">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            value={value}
            defaultValue={defaultValue}
            disabled={disabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            className={[
              'w-full bg-transparent py-2.5 text-xs outline-none font-ui',
              'text-[#F8FAFC] placeholder-[#64748B]',
              'transition-all duration-200',
              leftIcon ? 'pl-0 pr-3' : 'px-3',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />

          {/* Success checkmark */}
          {success && !error && (
            <div className="pr-2.5 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          )}

          {/* Clear button */}
          {showClear && hasContent && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="p-1.5 mr-1 text-[#64748B] hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors duration-150 shrink-0"
              aria-label="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Right icon (when no success/clear overrides) */}
          {rightIcon && !success && (
            <div className="pr-3 pl-2 text-[#64748B] flex items-center justify-center shrink-0">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Footer text */}
        {error ? (
          <span className="text-[10px] text-red-400 leading-tight">{error}</span>
        ) : helperText ? (
          <span className="text-[10px] text-[#64748B] leading-tight">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
