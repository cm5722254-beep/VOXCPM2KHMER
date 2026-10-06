import React, { useState } from 'react';
import { AlertCircle, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './Button';

export interface GlobalErrorStateProps {
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<GlobalErrorStateProps> = ({
  title = 'មានបញ្ហាបច្ចេកទេសកើតឡើង',
  message,
  details,
  onRetry,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      className={`rounded-2xl bg-white dark:bg-[#0B111C] border border-[#EF4444]/40 p-8 flex flex-col items-center justify-center text-center font-khmer select-none ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/40 flex items-center justify-center mb-4 text-[#EF4444] shadow-[0_0_20px_rgba(239,68,68,0.25)]">
        <AlertCircle className="w-7 h-7" />
      </div>

      <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1.5">{title}</h3>
      <p className="text-xs text-[#94A3B8] max-w-md leading-relaxed mb-5">
        {message}
      </p>

      <div className="flex items-center gap-3">
        {onRetry && (
          <Button variant="danger" size="md" leftIcon={<RotateCcw className="w-4 h-4" />} onClick={onRetry}>
            ព្យាយាមម្តងទៀត (Retry)
          </Button>
        )}

        {details && (
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-2 text-xs font-bold text-[#64748B] hover:text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-[#203244] hover:bg-white/[0.05] transition flex items-center gap-1.5"
          >
            <span>ព័ត៌មានលម្អិត</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {showDetails && details && (
        <div className="mt-5 w-full max-w-lg p-3 rounded-xl bg-slate-50 dark:bg-[#070A12] border border-slate-200 dark:border-[#203244] text-[11px] font-mono text-left text-[#EF4444] overflow-x-auto">
          <pre className="whitespace-pre-wrap">{details}</pre>
        </div>
      )}
    </div>
  );
};
