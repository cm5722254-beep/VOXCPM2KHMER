import React from 'react';
import { Button } from './Button';

export interface GlobalEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<GlobalEmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl bg-white dark:bg-[#0B111C] border border-slate-200 dark:border-[#203244] p-10 flex flex-col items-center justify-center text-center font-khmer select-none ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#16D9FF]/20 via-[#00FFA8]/10 to-[#8B5CF6]/20 border border-slate-200 dark:border-[#16D9FF]/30 flex items-center justify-center mb-4 text-3xl shadow-[0_0_20px_rgba(22,217,255,0.2)]">
        {icon || '🐲'}
      </div>

      <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1.5">{title}</h3>
      <p className="text-xs text-[#94A3B8] max-w-md leading-relaxed mb-6">
        {description}
      </p>

      {actionText && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
