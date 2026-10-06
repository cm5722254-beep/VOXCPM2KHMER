import React from 'react';

export interface GlobalSliderProps {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  className?: string;
}

export const Slider: React.FC<GlobalSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  className = '',
}) => {
  return (
    <div className={`w-full font-khmer flex flex-col gap-1.5 text-xs ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-[#94A3B8]">
          <span>{label}</span>
          <span className="font-mono font-bold text-slate-800 dark:text-white">
            {value}
            {unit}
          </span>
        </div>
      )}

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-white dark:bg-[#0B111C] rounded-lg appearance-none cursor-pointer accent-[#16D9FF] border border-slate-200 dark:border-[#203244] outline-none"
      />
    </div>
  );
};
