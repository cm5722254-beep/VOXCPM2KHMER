import React from 'react';
import {
  LayoutDashboard,
  Mic2,
  Bot,
  Users,
  Menu,
  Sparkles,
} from 'lucide-react';
import { TabId } from '../../types';

interface MobileNavDockProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  onOpenMobileMenu: () => void;
  isDubbing?: boolean;
}

export const MobileNavDock: React.FC<MobileNavDockProps> = ({
  activeTab,
  onSelectTab,
  onOpenMobileMenu,
  isDubbing = false,
}) => {
  const navItems = [
    {
      id: 'tab-dashboard' as TabId,
      label: 'ផ្ទាំងដើម',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'tab-dubbing' as TabId,
      label: 'ស្ទូឌីយោ',
      icon: <Mic2 className="w-5 h-5" />,
      badge: isDubbing ? 'LIVE' : undefined,
    },
    {
      id: 'tab-offline' as TabId,
      label: 'សំឡេង AI',
      icon: <Bot className="w-5 h-5" />,
    },
    {
      id: 'tab-character' as TabId,
      label: 'តួអង្គ',
      icon: <Users className="w-5 h-5" />,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#121216]/95 backdrop-blur-2xl border-t border-slate-200 dark:border-slate-200 dark:border-white/[0.08] px-2 py-1 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] select-none font-khmer"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-zinc-200 font-medium'
              }`}
            >
              {/* Active glow indicator */}
              {isActive && (
                <span className="absolute -top-1 w-6 h-1 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(0,242,173,0.9)] animate-pulse" />
              )}
              <div className="relative">
                <span className={`transition-transform duration-200 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,242,173,0.6)]' : ''}`}>
                  {item.icon}
                </span>
                {item.badge && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-rose-500 text-[8px] font-black text-slate-800 dark:text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-khmer">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Hamburger / All Tools Button */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl text-slate-600 dark:text-zinc-400 hover:text-emerald-300 active:scale-95 transition-all"
        >
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-white/[0.06]">
            <Menu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-[10px] mt-0.5 font-medium tracking-tight font-khmer text-slate-700 dark:text-zinc-300">
            មឺនុយ
          </span>
        </button>
      </div>
    </nav>
  );
};
