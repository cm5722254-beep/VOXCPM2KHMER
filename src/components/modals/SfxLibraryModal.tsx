import React, { useState, useRef } from 'react';
import {
  Volume2,
  Play,
  Square,
  X,
  Plus,
  Upload,
  Trash2,
  Zap,
  FileAudio
} from 'lucide-react';

export interface SfxItem {
  id: string;
  name: string;
  category: string;
  duration: string;
  durationSec: number;
  url: string;
  file?: File;
}

interface SfxLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSfxToTimeline?: (sfx: SfxItem) => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const SfxLibraryModal: React.FC<SfxLibraryModalProps> = ({
  isOpen,
  onClose,
  onAddSfxToTimeline,
  onShowToast,
}) => {
  // Real user-imported SFX items (NO fake/mock data)
  const [sfxList, setSfxList] = useState<SfxItem[]>([]);
  const [playingSfxId, setPlayingSfxId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const tempAudio = new Audio(url);

      tempAudio.onloadedmetadata = () => {
        const sec = tempAudio.duration;
        const durStr = `${sec.toFixed(1)}s`;

        const newSfx: SfxItem = {
          id: `sfx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          category: 'User SFX',
          duration: durStr,
          durationSec: sec,
          url: url,
          file: file,
        };

        setSfxList((prev) => [...prev, newSfx]);
        onShowToast?.(`បានបញ្ចូលបែបផែន SFX ពិត: "${newSfx.name}"`, 'success');
      };

      tempAudio.onerror = () => {
        onShowToast?.(`មិនអាចអានឯកសារ SFX: ${file.name}`, 'error');
      };
    });

    if (e.target) {
      e.target.value = '';
    }
  };

  const handlePlayToggle = (sfx: SfxItem) => {
    if (playingSfxId === sfx.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingSfxId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(sfx.url);
      audio.onended = () => setPlayingSfxId(null);
      audio.play().catch(() => {
        onShowToast?.('មិនអាចចាក់សំឡេងបែបផែនបានទេ', 'error');
        setPlayingSfxId(null);
      });
      audioPlayerRef.current = audio;
      setPlayingSfxId(sfx.id);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingSfxId === id && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setPlayingSfxId(null);
    }
    setSfxList((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAdd = (sfx: SfxItem) => {
    if (onAddSfxToTimeline) {
      onAddSfxToTimeline(sfx);
    }
    onShowToast?.(`បានដាក់បញ្ចូលបែបផែន "${sfx.name}" ទៅក្នុង Track S1!`, 'success');
  };

  const handleClose = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    setPlayingSfxId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl rounded-xl bg-[#141414] border border-white/[0.08] shadow-2xl overflow-hidden flex flex-col font-khmer text-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - CapCut Dark */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#181818] border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#222226] border border-white/[0.08] flex items-center justify-center text-[#00C2FF]">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  បណ្ណាល័យបែបផែនសំឡេង (SFX LIBRARY)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30">
                  REAL SFX
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                បញ្ចូល និងគ្រប់គ្រងឯកសារបែបផែនសំឡេងពិតប្រាកដ (Foley, Impact, Whoosh, Ambience)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*"
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00C2FF] hover:bg-[#19CCFF] text-black text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>នាំចូល SFX (.wav, .mp3)</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SFX List or Clean Empty State */}
        <div className="p-5 max-h-[55vh] overflow-y-auto">
          {sfxList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-white/[0.08] rounded-xl bg-[#161616]/50">
              <div className="w-12 h-12 rounded-full bg-[#1F1F24] flex items-center justify-center text-zinc-500 mb-3">
                <FileAudio className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                មិនទាន់មានបែបផែនសំឡេង SFX នៅឡើយទេ
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mb-4">
                សូមចុចប៊ូតុងខាងក្រោមដើម្បីបញ្ចូលឯកសារបែបផែនសំឡេងពិតប្រាកដ (.wav, .mp3, .ogg) ពីកុំព្យូទ័ររបស់អ្នក។ គ្មានទិន្នន័យក្លែងក្លាយឡើយ។
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#202020] hover:bg-[#282828] text-white border border-white/[0.1] text-xs font-semibold transition-all hover:border-[#00C2FF]/50"
              >
                <Upload className="w-4 h-4 text-[#00C2FF]" />
                <span>ជ្រើសរើសឯកសារ SFX ពីកុំព្យូទ័រ</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sfxList.map((sfx) => {
                const isPlaying = playingSfxId === sfx.id;
                return (
                  <div
                    key={sfx.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      isPlaying
                        ? 'bg-[#1C1C22] border-[#00C2FF]/50 shadow-md'
                        : 'bg-[#181818] border-white/[0.06] hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handlePlayToggle(sfx)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                          isPlaying
                            ? 'bg-[#00C2FF] text-black'
                            : 'bg-[#222226] text-zinc-300 hover:text-white'
                        }`}
                      >
                        {isPlaying ? (
                          <Square className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{sfx.name}</div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-zinc-300">{sfx.duration}</span>
                          <span>•</span>
                          <span className="text-[10px] text-cyan-400 font-medium">Real SFX</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => handleAdd(sfx)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#00C2FF]/15 hover:bg-[#00C2FF]/25 text-[#00C2FF] border border-[#00C2FF]/40 text-xs font-bold transition-all active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                        <span>ដាក់ចូល</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(sfx.id, e)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/[0.04] transition-colors"
                        title="លុបចេញ"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#181818] border-t border-white/[0.08]">
          <span className="text-xs text-zinc-400">
            {sfxList.length} បែបផែនសំឡេងនៅក្នុងបញ្ជី
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-1.5 rounded-lg bg-[#222226] hover:bg-[#2A2A30] text-zinc-300 text-xs font-semibold transition-all border border-white/[0.06]"
          >
            បិទ (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
