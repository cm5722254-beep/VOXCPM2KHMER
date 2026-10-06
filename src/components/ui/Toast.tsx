import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const TOAST_DURATION = 4000;

// ─── Per-type config ──────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  success: {
    leftBorder: 'border-l-4 border-l-emerald-500',
    iconColor: 'text-emerald-400',
    iconGlow: '0 0 12px rgba(52,211,153,0.7)',
    progressColor: '#34d399',
    progressGlow: '0 0 6px rgba(52,211,153,0.8)',
    pulseRing: 'ring-emerald-500/40',
  },
  error: {
    leftBorder: 'border-l-4 border-l-red-500',
    iconColor: 'text-red-400',
    iconGlow: '0 0 12px rgba(248,113,113,0.7)',
    progressColor: '#ef4444',
    progressGlow: '0 0 6px rgba(239,68,68,0.8)',
    pulseRing: 'ring-red-500/40',
  },
  warning: {
    leftBorder: 'border-l-4 border-l-amber-500',
    iconColor: 'text-amber-400',
    iconGlow: '0 0 12px rgba(251,191,36,0.7)',
    progressColor: '#f59e0b',
    progressGlow: '0 0 6px rgba(251,191,36,0.8)',
    pulseRing: 'ring-amber-500/40',
  },
  info: {
    leftBorder: 'border-l-4 border-l-blue-500',
    iconColor: 'text-blue-400',
    iconGlow: '0 0 12px rgba(96,165,250,0.7)',
    progressColor: '#3b82f6',
    progressGlow: '0 0 6px rgba(59,130,246,0.8)',
    pulseRing: 'ring-blue-500/40',
  },
} as const;

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

// ─── Single Toast Item ────────────────────────────────────────────────────────
interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
  index: number;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss, index }) => {
  // Entry state: starts slid-out, then animates in after mount
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  // Trigger entry slide-in on mount
  useEffect(() => {
    const enterTimer = setTimeout(() => setEntered(true), 20);
    return () => clearTimeout(enterTimer);
  }, []);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 320);
  }, [toast.id, onDismiss]);

  // Auto-dismiss + progress drain
  useEffect(() => {
    const dismissTimer = setTimeout(dismiss, TOAST_DURATION);

    // Drain progress bar over TOAST_DURATION
    const step = 50;
    const decrement = (100 / TOAST_DURATION) * step;
    const intervalId = setInterval(() => {
      setProgress(p => {
        const next = p - decrement;
        return next < 0 ? 0 : next;
      });
    }, step);

    return () => {
      clearTimeout(dismissTimer);
      clearInterval(intervalId);
    };
  }, [dismiss]);

  const config = TYPE_CONFIG[toast.type];
  const Icon = ICONS[toast.type];

  // Stagger offset so toasts don't land at exactly the same moment
  const staggerDelay = index * 60;

  return (
    <div
      style={{
        transform: exiting
          ? 'translateX(110%) scale(0.95)'
          : entered
            ? 'translateX(0) scale(1)'
            : 'translateX(110%) scale(0.96)',
        opacity: exiting ? 0 : entered ? 1 : 0,
        transition: `transform 320ms cubic-bezier(0.34,1.56,0.64,1) ${staggerDelay}ms, opacity 280ms ease ${staggerDelay}ms`,
        willChange: 'transform, opacity',
      }}
      className={`
        pointer-events-auto relative flex flex-col rounded-xl overflow-hidden w-full max-w-sm
        bg-[#1C0F14]/95 backdrop-blur-2xl border border-red-950/60
        shadow-[0_12px_40px_rgba(0,0,0,0.7),0_2px_8px_rgba(0,0,0,0.4)]
        ${config.leftBorder}
      `}
    >
      {/* Body */}
      <div className="flex items-start justify-between gap-3 px-3.5 py-3">
        {/* Icon with animated pulse ring */}
        <div className="relative shrink-0 mt-0.5">
          {/* Pulse ring */}
          <span
            className={`absolute inset-0 rounded-full ring-2 ${config.pulseRing} animate-ping`}
            style={{ animationDuration: '1.8s' }}
          />
          <Icon
            className={`relative w-4 h-4 ${config.iconColor}`}
            style={{ filter: `drop-shadow(${config.iconGlow})` }}
          />
        </div>

        {/* Message */}
        <p className="flex-1 text-xs font-medium leading-relaxed text-white/90 break-words">
          {toast.message}
        </p>

        {/* Close button */}
        <button
          onClick={dismiss}
          aria-label="Close notification"
          className="shrink-0 p-1 rounded-md text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors duration-150"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress bar – drains left-to-right */}
      <div className="h-[2px] bg-white/[0.06]">
        <div
          style={{
            width: `${progress}%`,
            background: config.progressColor,
            boxShadow: config.progressGlow,
            transition: 'width 50ms linear',
            height: '100%',
            borderRadius: '0 2px 2px 0',
          }}
        />
      </div>
    </div>
  );
};

// ─── Toast Container ──────────────────────────────────────────────────────────
export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  // Cap at 5 most recent
  const visible = toasts.slice(-5);

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none items-end"
      style={{ width: 'min(360px, calc(100vw - 2.5rem))' }}
    >
      {visible.map((toast, i) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          index={i}
        />
      ))}
    </div>
  );
};
