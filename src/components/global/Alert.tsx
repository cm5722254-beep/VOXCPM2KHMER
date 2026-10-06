import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, Sparkles } from 'lucide-react';

export type AlertType = 'info' | 'success' | 'warning' | 'error' | 'ai';

export interface GlobalAlertProps {
  type?: AlertType;
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<GlobalAlertProps> = ({
  type = 'info',
  title,
  children,
  action,
  className = '',
}) => {
  const configs: Record<AlertType, { border: string; bg: string; text: string; icon: React.ReactNode }> = {
    info: {
      border: 'border-slate-200 dark:border-[#16D9FF]/40',
      bg: 'bg-[#16D9FF]/10',
      text: 'text-[#16D9FF]',
      icon: <Info className="w-5 h-5 text-[#16D9FF] shrink-0" />,
    },
    success: {
      border: 'border-slate-200 dark:border-[#00FFA8]/40',
      bg: 'bg-[#00FFA8]/10',
      text: 'text-[#00FFA8]',
      icon: <CheckCircle2 className="w-5 h-5 text-[#00FFA8] shrink-0" />,
    },
    warning: {
      border: 'border-[#FF7A18]/40',
      bg: 'bg-[#FF7A18]/10',
      text: 'text-[#FF7A18]',
      icon: <AlertTriangle className="w-5 h-5 text-[#FF7A18] shrink-0" />,
    },
    error: {
      border: 'border-[#EF4444]/40',
      bg: 'bg-[#EF4444]/10',
      text: 'text-[#EF4444]',
      icon: <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0" />,
    },
    ai: {
      border: 'border-[#8B5CF6]/40',
      bg: 'bg-[#8B5CF6]/10',
      text: 'text-[#8B5CF6]',
      icon: <Sparkles className="w-5 h-5 text-[#8B5CF6] shrink-0" />,
    },
  };

  const current = configs[type];

  return (
    <div
      className={`rounded-2xl border p-4 flex items-start gap-3 font-khmer text-xs ${current.border} ${current.bg} ${className}`}
    >
      {current.icon}
      <div className="flex-1 min-w-0">
        {title && <h4 className={`font-bold mb-0.5 ${current.text}`}>{title}</h4>}
        <div className="text-[#94A3B8] leading-relaxed">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
