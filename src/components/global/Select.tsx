import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

export interface GlobalSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const Select: React.FC<GlobalSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'ជ្រើសរើស...',
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="w-full font-khmer flex flex-col gap-1.5 text-xs relative select-none">
      {label && <label className="font-bold text-[#94A3B8]">{label}</label>}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white dark:bg-[#0B111C] border border-slate-200 dark:border-[#203244] hover:border-slate-200 dark:border-[#16D9FF]/40 text-[#F8FAFC] transition duration-150 outline-none focus:border-slate-200 dark:border-[#16D9FF]/70 focus:shadow-[0_0_12px_rgba(22,217,255,0.2)] disabled:opacity-50 ${className}`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">{selectedOption?.label || placeholder}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-[#16D9FF]' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 rounded-xl bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] shadow-[0_12px_36px_rgba(0,0,0,0.7)] p-1.5 flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition ${
                  isSelected
                    ? 'bg-[#16D9FF]/15 text-[#16D9FF] font-bold'
                    : 'text-[#94A3B8] hover:text-slate-800 dark:text-white hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <div className="truncate">
                    <div>{opt.label}</div>
                    {opt.sublabel && <div className="text-[10px] text-[#64748B]">{opt.sublabel}</div>}
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#16D9FF] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
