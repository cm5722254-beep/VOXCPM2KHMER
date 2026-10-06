import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Film,
  Mic2,
  Users,
  Languages,
  Sliders,
  Sparkles,
  Zap,
  Subtitles,
  Settings,
  Flame,
  ArrowRight,
  FolderOpen,
  Keyboard,
  X,
  Layers,
  Brain,
} from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tabId: string) => void;
  onOpenVoiceCloner?: () => void;
  onOpenOneClickDubbing?: () => void;
  onOpenExport?: () => void;
  onOpenSettings?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenVoiceCloner,
  onOpenOneClickDubbing,
  onOpenExport,
  onOpenSettings,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: 'tab-dubbing',
      title: 'បើក Video Editor & Dubbing Studio',
      category: 'Workspace',
      icon: <Film className="w-4 h-4 text-[#16D9FF]" />,
      action: () => {
        onSelectTab('tab-dubbing');
        onClose();
      },
      shortcut: 'Alt + 1',
    },
    {
      id: 'tab-voicelab',
      title: 'បើក Dragon Voice Lab (សំឡេង AI 48kHz)',
      category: 'Voice',
      icon: <Mic2 className="w-4 h-4 text-[#00FFA8]" />,
      action: () => {
        onSelectTab('tab-voicelab');
        onClose();
      },
      shortcut: 'Alt + 2',
    },
    {
      id: 'voice-clone',
      title: 'ក្លូនសំឡេងថ្មី (Zero-Shot Voice Cloner)',
      category: 'Voice',
      icon: <Flame className="w-4 h-4 text-[#FF7A18]" />,
      action: () => {
        onOpenVoiceCloner?.();
        onClose();
      },
    },
    {
      id: 'tab-character',
      title: 'គ្រប់គ្រងតួអង្គភាពយន្ត (Characters)',
      category: 'Workspace',
      icon: <Users className="w-4 h-4 text-[#8B5CF6]" />,
      action: () => {
        onSelectTab('tab-character');
        onClose();
      },
    },
    {
      id: 'tab-translator',
      title: 'បកប្រែពាក្យសន្ទនា (AI Translation Desk)',
      category: 'Translation',
      icon: <Languages className="w-4 h-4 text-[#16D9FF]" />,
      action: () => {
        onSelectTab('tab-translator');
        onClose();
      },
    },
    {
      id: 'one-click-dub',
      title: 'ចាប់ផ្តើម 1-Click Dragon Dubbing',
      category: 'Automation',
      icon: <Zap className="w-4 h-4 text-[#00FFA8]" />,
      action: () => {
        onOpenOneClickDubbing?.();
        onClose();
      },
    },
    {
      id: 'tab-subtitles',
      title: 'កែសម្រួលចំណងជើងរង (Subtitle Studio)',
      category: 'Subtitles',
      icon: <Subtitles className="w-4 h-4 text-[#16D9FF]" />,
      action: () => {
        onSelectTab('tab-subtitles');
        onClose();
      },
    },
    {
      id: 'tab-mixer',
      title: 'បើក Audio Mixer (Vocal + BGM + SFX)',
      category: 'Audio',
      icon: <Sliders className="w-4 h-4 text-[#8B5CF6]" />,
      action: () => {
        onSelectTab('tab-mixer');
        onClose();
      },
    },
    {
      id: 'tab-sponsor',
      title: '🎬 Sponsor Studio (បញ្ចូលពាណិជ្ជកម្ម PiP, Overlay & Video)',
      category: 'Video',
      icon: <Film className="w-4 h-4 text-[#16D9FF]" />,
      action: () => {
        onSelectTab('tab-sponsor');
        onClose();
      },
    },
    {
      id: 'tab-batch',
      title: '🐲 Batch Studio (ដំណើរការ 5-10 ភាគឆ្លងកាត់ Voice Memory)',
      category: 'Batch',
      icon: <Layers className="w-4 h-4 text-[#8B5CF6]" />,
      action: () => {
        onSelectTab('tab-batch');
        onClose();
      },
    },
    {
      id: 'tab-smartscenes',
      title: '🧠 Smart Scene Intelligence & Smart Cut (កាត់ Silence AI)',
      category: 'Intelligence',
      icon: <Brain className="w-4 h-4 text-[#00FFA8]" />,
      action: () => {
        onSelectTab('tab-smartscenes');
        onClose();
      },
    },
    {
      id: 'tab-projects',
      title: 'បើកបញ្ជីគម្រោងទាំងអស់ (Project Manager)',
      category: 'Workspace',
      icon: <FolderOpen className="w-4 h-4 text-[#16D9FF]" />,
      action: () => {
        onSelectTab('tab-projects');
        onClose();
      },
    },
    {
      id: 'export-video',
      title: 'Export Video / Render Master (4K/1080p)',
      category: 'Export',
      icon: <Flame className="w-4 h-4 text-[#FF7A18]" />,
      action: () => {
        onOpenExport?.();
        onClose();
      },
      shortcut: 'Ctrl + E',
    },
    {
      id: 'settings',
      title: 'ការកំណត់ប្រព័ន្ធ & AI API Providers',
      category: 'System',
      icon: <Settings className="w-4 h-4 text-[#94A3B8]" />,
      action: () => {
        onOpenSettings?.();
        onClose();
      },
    },
  ];

  const filteredCommands = search.trim() === ''
    ? commands
    : commands.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.category.toLowerCase().includes(search.toLowerCase())
      );

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 select-none font-khmer animate-in fade-in duration-150"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(7,10,18,0.85) 50%, rgba(3,5,10,0.98) 100%)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#0B111C] border border-slate-200 dark:border-[#203244] shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-[#203244] flex items-center gap-3 bg-white dark:bg-[#101925]/70">
          <Search className="w-5 h-5 text-[#16D9FF] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="ស្វែងរកបញ្ជា, ឧបករណ៍, គម្រោង, ឬសំឡេង AI... (Ctrl + K)"
            className="w-full bg-transparent text-sm text-slate-800 dark:text-white placeholder-[#64748B] outline-none font-ui"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#64748B] hover:text-slate-800 dark:text-white hover:bg-slate-200 dark:bg-white/[0.08]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 custom-scrollbar flex flex-col gap-1 text-xs">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-[#64748B]">
              មិនមានលទ្ធផលផ្គូផ្គងនឹង "{search}"
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#16D9FF]/20 to-[#8B5CF6]/20 border border-slate-200 dark:border-[#16D9FF]/50 text-slate-800 dark:text-white'
                      : 'text-[#94A3B8] hover:text-slate-800 dark:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] flex items-center justify-center shrink-0">
                      {cmd.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 dark:text-white truncate">{cmd.title}</div>
                      <div className="text-[10px] text-[#64748B] font-mono">{cmd.category}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cmd.shortcut && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] text-[#64748B]">
                        {cmd.shortcut}
                      </span>
                    )}
                    <ArrowRight className={`w-3.5 h-3.5 text-[#16D9FF] opacity-0 transition-opacity ${isSelected ? 'opacity-100' : ''}`} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2.5 border-t border-slate-200 dark:border-[#203244] bg-slate-50 dark:bg-[#070A12]/80 flex items-center justify-between text-[11px] text-[#64748B]">
          <div className="flex items-center gap-3">
            <span>↑↓ ជ្រើសរើស</span>
            <span>↵ ដំណើរការ</span>
            <span>ESC បិទ</span>
          </div>
          <span className="font-cinzel text-[#16D9FF]">DRAGON COMMAND PALETTE</span>
        </div>
      </div>
    </div>
  );
};
