import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  Wand2,
  Subtitles,
  Sliders,
  Download,
  Users,
  Film,
  Music,
  Zap,
  Palette,
  Play,
  Scissors,
  Settings,
  X
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  khmer: string;
  shortcut?: string;
  category: string;
  icon: any;
  action: () => void;
}

interface CommandSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (actionKey: string) => void;
}

export const CommandSearchModal: React.FC<CommandSearchModalProps> = ({
  isOpen,
  onClose,
  onAction,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    { id: 'gen-voice', title: 'Generate AI Voice', khmer: 'បង្កើតសំឡេង AI', shortcut: 'Ctrl + G', category: 'Audio', icon: Wand2, action: () => onAction('gen-voice') },
    { id: 'auto-dub', title: 'Launch Auto Dub Workflow', khmer: 'ដំណើរការ Auto Dub 10 ជំហាន', shortcut: 'Ctrl + Alt + D', category: 'Workflow', icon: Sparkles, action: () => onAction('auto-dub') },
    { id: 'add-subtitle', title: 'Add & Edit Subtitles', khmer: 'កែសម្រួលចំណងជើងរង', shortcut: 'Ctrl + T', category: 'Subtitles', icon: Subtitles, action: () => onAction('subtitles') },
    { id: 'open-mixer', title: 'Open Audio Mixer & VU Meters', khmer: 'បើកផ្ទាំង Audio Mixer', shortcut: 'M', category: 'Audio', icon: Sliders, action: () => onAction('mixer') },
    { id: 'audio-ducking', title: 'Audio Ducking & Stem Preservation', khmer: 'បន្ថយសំឡេង & រក្សាសំឡេងដើម', shortcut: 'D', category: 'Audio', icon: Sliders, action: () => onAction('ducking') },
    { id: 'bgm-library', title: 'Open Background Music (BGM) Library', khmer: 'បណ្ណាល័យភ្លេងកំដរ', shortcut: 'B', category: 'Media', icon: Music, action: () => onAction('bgm') },
    { id: 'sfx-library', title: 'Open Sound Effects (SFX) Library', khmer: 'បណ្ណាល័យបែបផែនសំឡេង', shortcut: 'X', category: 'Media', icon: Zap, action: () => onAction('sfx') },
    { id: 'color-grading', title: 'Open Color Grading & Scopes', khmer: 'កែតម្រូវពណ៌ភាពយន្ត & Scopes', shortcut: 'C', category: 'Video', icon: Palette, action: () => onAction('color') },
    { id: '3d-effects', title: 'Open 3D Effects & Text Panel', khmer: 'បែបផែនអក្សរ 3D', shortcut: '3', category: 'Effects', icon: Sparkles, action: () => onAction('3d-effects') },
    { id: 'export-video', title: 'Export Video / Dubbed Audio', khmer: 'នាំចេញវីដេអូ / សំឡេង', shortcut: 'Ctrl + E', category: 'Project', icon: Download, action: () => onAction('export') },
    { id: 'find-character', title: 'Find & Manage Characters', khmer: 'ស្វែងរក និងគ្រប់គ្រងតួអង្គ', shortcut: 'F', category: 'Workflow', icon: Users, action: () => onAction('characters') },
    { id: 'play-pause', title: 'Play / Pause Video Preview', khmer: 'ចាក់ / ផ្អាកវីដេអូ', shortcut: 'Space', category: 'Playback', icon: Play, action: () => onAction('toggle-play') },
    { id: 'split-clip', title: 'Split Timeline Clip at Playhead', khmer: 'កាត់បំបែក Segment', shortcut: 'S', category: 'Editing', icon: Scissors, action: () => onAction('split') },
    { id: 'settings', title: 'Open Project & Studio Settings', khmer: 'ការកំណត់ Studio', shortcut: 'Ctrl + ,', category: 'Settings', icon: Settings, action: () => onAction('settings') },
  ];

  const filtered = query.trim()
    ? commands.filter(
        (c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.khmer.includes(query) ||
          c.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-[#141414] border border-white/[0.08] shadow-2xl overflow-hidden flex flex-col font-khmer text-zinc-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 bg-[#181818] border-b border-white/[0.08]">
          <Search className="w-4 h-4 text-[#00C2FF] shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="វាយបញ្ជា ឬស្វែងរក (ឧទាហរណ៍: 'Generate voice', 'Export', 'Mixer')..."
            className="w-full bg-transparent text-white text-xs placeholder-zinc-500 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <kbd className="px-2 py-0.5 rounded bg-[#222226] text-[10px] font-mono text-zinc-400 border border-white/[0.08]">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results List */}
        <div className="p-2 max-h-[50vh] overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching commands found for "{query}".
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-950/50 border border-cyan-500/40 text-white shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                      : 'text-slate-300 hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{item.title}</span>
                        <span className="text-xs text-cyan-300 font-medium">({item.khmer})</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {item.shortcut && (
                    <kbd
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {item.shortcut}
                    </kbd>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#07111F] border-t border-cyan-500/10 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              Use <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">↓</kbd> to navigate
            </span>
            <span>•</span>
            <span>
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">Enter</kbd> to run
            </span>
          </div>
          <span className="text-cyan-400 font-medium">KHMER DUBBING PRO</span>
        </div>
      </div>
    </div>
  );
};
