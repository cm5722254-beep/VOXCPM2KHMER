import React from 'react';
import { X, Keyboard, Command, Sparkles } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'Playback' | 'Editing' | 'Workspace' | 'Project';
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ['Space'], description: 'ចាក់ ឬផ្អាក វីដេអូ (Play / Pause)', category: 'Playback' },
  { keys: ['←', '→'], description: 'រំលងថយក្រោយ / ទៅមុខ ១ វិនាទី (Step 1s)', category: 'Playback' },
  { keys: ['Shift', '← / →'], description: 'រំលងថយក្រោយ / ទៅមុខ ៥ វិនាទី (Jump 5s)', category: 'Playback' },
  { keys: ['M'], description: 'បើក ឬបិទ សំឡេង (Mute / Unmute)', category: 'Playback' },
  { keys: ['F'], description: 'មើលវីដេអូពេញអេក្រង់ (Toggle Fullscreen)', category: 'Playback' },
  { keys: ['I'], description: 'បើក ឬបិទ ផ្ទាំង Inspector ខាងស្តាំ (Toggle Inspector)', category: 'Workspace' },
  { keys: ['E'], description: 'បើកផ្ទាំងនាំចេញវីដេអូ Master (Open Export Studio)', category: 'Workspace' },
  { keys: ['Ctrl', 'S'], description: 'រក្សាទុកគម្រោង (Save Project)', category: 'Project' },
  { keys: ['Ctrl', 'Z'], description: 'ត្រឡប់ក្រោយ (Undo Action)', category: 'Editing' },
  { keys: ['Ctrl', 'Y'], description: 'ធ្វើឡើងវិញ (Redo Action)', category: 'Editing' },
  { keys: ['S'], description: 'ពុះឈុតនៅត្រង់ Playhead (Split Segment)', category: 'Editing' },
  { keys: ['Delete'], description: 'លុបឈុតដែលបានជ្រើសរើស (Delete Clip)', category: 'Editing' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#0c0f18] border border-white/[0.14] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col text-slate-100">
        {/* Header */}
        <div className="p-4 px-6 border-b border-white/[0.08] flex items-center justify-between bg-[#080b12]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-400/30">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-ui tracking-wide">
                <span>KEYBOARD SHORTCUTS</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  SPEED HUD
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">គ្រាប់ចុចកាត់សម្រាប់ធ្វើការយ៉ាងរហ័សលើ Studio Workstation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-3.5 max-h-[72vh] overflow-y-auto text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SHORTCUTS.map((sc, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all flex items-center justify-between gap-2"
              >
                <span className="text-[11.5px] text-slate-300 font-medium truncate">{sc.description}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {sc.keys.map((k, j) => (
                    <kbd
                      key={j}
                      className="px-2 py-1 rounded-md bg-[#141824] border border-white/[0.15] text-[11px] font-mono font-bold text-sky-300 shadow-sm"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/20 flex items-center gap-2.5 text-[11px] text-slate-300">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            <span>ចុចគ្រាប់ចុច <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-white">?</kbd> គ្រប់ពេល ដើម្បីបើកមើលផ្ទាំង Shortcut នេះឡើងវិញ។</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 px-6 border-t border-white/[0.08] bg-[#080b12] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-bold transition-all shadow-md shadow-sky-500/20"
          >
            យល់ព្រម (Got it)
          </button>
        </div>
      </div>
    </div>
  );
};
