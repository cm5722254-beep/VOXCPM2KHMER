import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface GlobalTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const Tabs: React.FC<GlobalTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  size = 'md',
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-[#0B111C] border border-slate-200 dark:border-[#203244] select-none font-khmer ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 rounded-lg font-bold transition-all duration-150 outline-none ${
              size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-xs'
            } ${
              isActive
                ? 'bg-gradient-to-r from-[#16D9FF]/20 to-[#8B5CF6]/20 border border-slate-200 dark:border-[#16D9FF]/50 text-slate-800 dark:text-white shadow-[0_0_12px_rgba(22,217,255,0.2)]'
                : 'text-[#64748B] hover:text-[#94A3B8] border border-transparent'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isActive ? 'bg-[#16D9FF]/30 text-[#16D9FF]' : 'bg-white dark:bg-[#101925] text-[#64748B]'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
