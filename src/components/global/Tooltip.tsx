import React, { useState } from 'react';

export interface GlobalTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<GlobalTooltipProps> = ({
  content,
  children,
  position = 'top',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 pointer-events-none whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-[#070A12] border border-slate-200 dark:border-[#203244] text-[11px] font-khmer text-slate-800 dark:text-white shadow-xl animate-in fade-in zoom-in-95 duration-100 ${positionClasses[position]}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};
