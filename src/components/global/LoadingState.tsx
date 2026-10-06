import React from 'react';
import { DragonLoader } from '../dragon/DragonLoader';
import { Progress } from './Progress';

export interface GlobalLoadingStateProps {
  message?: string;
  progress?: number;
  subMessage?: string;
  className?: string;
}

export const LoadingState: React.FC<GlobalLoadingStateProps> = ({
  message = 'កំពុងដំណើរការ...',
  progress,
  subMessage,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl bg-white dark:bg-[#0B111C]/80 border border-slate-200 dark:border-[#203244] p-10 flex flex-col items-center justify-center text-center font-khmer select-none ${className}`}
    >
      <DragonLoader size="lg" message={message} />

      {subMessage && (
        <p className="text-xs text-[#94A3B8] max-w-sm mt-3 leading-relaxed">
          {subMessage}
        </p>
      )}

      {progress !== undefined && (
        <div className="w-full max-w-xs mt-5">
          <Progress value={progress} showPercent={true} variant="cyan" />
        </div>
      )}
    </div>
  );
};
