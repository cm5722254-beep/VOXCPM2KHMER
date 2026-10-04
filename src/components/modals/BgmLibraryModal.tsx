import React, { useState, useRef } from 'react';
import {
  Music,
  Play,
  Square,
  X,
  Volume2,
  Plus,
  Upload,
  Trash2,
  FileAudio
} from 'lucide-react';

export interface BgmTrack {
  id: string;
  name: string;
  category: string;
  duration: string;
  durationSec: number;
  url: string;
  file?: File;
}

interface BgmLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrackToTimeline?: (track: BgmTrack) => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const BgmLibraryModal: React.FC<BgmLibraryModalProps> = ({
  isOpen,
  onClose,
  onAddTrackToTimeline,
  onShowToast,
}) => {
  // Real user-imported BGM tracks (NO fake/mock data)
  const [tracks, setTracks] = useState<BgmTrack[]>([]);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [volume, setVolume] = useState(70);
  const [loop, setLoop] = useState(true);
  const [duckUnderVoice, setDuckUnderVoice] = useState(true);

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
        const sec = Math.round(tempAudio.duration);
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        const durStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

        const newTrack: BgmTrack = {
          id: `bgm-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          category: 'User Import',
          duration: durStr,
          durationSec: sec,
          url: url,
          file: file,
        };

        setTracks((prev) => [...prev, newTrack]);
        onShowToast?.(`បានបញ្ចូលបទភ្លេងពិត: "${newTrack.name}"`, 'success');
      };

      tempAudio.onerror = () => {
        onShowToast?.(`មិនអាចអានឯកសារសំឡេង: ${file.name}`, 'error');
      };
    });

    if (e.target) {
      e.target.value = '';
    }
  };

  const handlePlayToggle = (track: BgmTrack) => {
    if (playingTrackId === track.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingTrackId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(track.url);
      audio.volume = volume / 100;
      audio.loop = loop;
      audio.onended = () => setPlayingTrackId(null);
      audio.play().catch(() => {
        onShowToast?.('មិនអាចចាក់សំឡេងបានទេ', 'error');
        setPlayingTrackId(null);
      });
      audioPlayerRef.current = audio;
      setPlayingTrackId(track.id);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingTrackId === id && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setPlayingTrackId(null);
    }
    setTracks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAdd = (track: BgmTrack) => {
    if (onAddTrackToTimeline) {
      onAddTrackToTimeline(track);
    }
    onShowToast?.(`បានដាក់បញ្ចូល "${track.name}" ទៅក្នុង Track B1!`, 'success');
  };

  const handleClose = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    setPlayingTrackId(null);
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
              <Music className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  បណ្ណាល័យភ្លេងកំដរ (BGM LIBRARY)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30">
                  REAL AUDIO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                បញ្ចូល និងគ្រប់គ្រងឯកសារភ្លេងកំដរពិតប្រាកដសម្រាប់គម្រោងវីដេអូ
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
              <span>នាំចូលភ្លេង (.mp3, .wav)</span>
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

        {/* Global Controls HUD */}
        <div className="px-5 py-2.5 bg-[#161616] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-300 text-[11px]">កម្រិតសំឡេង BGM:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setVolume(val);
                if (audioPlayerRef.current) {
                  audioPlayerRef.current.volume = val / 100;
                }
              }}
              className="w-24 h-1.5 accent-[#00C2FF] bg-[#222226] rounded cursor-pointer"
            />
            <span className="font-mono text-[#00C2FF] font-bold text-xs">{volume}%</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
              <input
                type="checkbox"
                checked={loop}
                onChange={(e) => setLoop(e.target.checked)}
                className="rounded accent-[#00C2FF]"
              />
              <span>Loop (ចាក់សារឡើងវិញ)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
              <input
                type="checkbox"
                checked={duckUnderVoice}
                onChange={(e) => setDuckUnderVoice(e.target.checked)}
                className="rounded accent-[#00C2FF]"
              />
              <span className="text-[#00C2FF]">Auto Ducking (បន្ថយពេលមានសំឡេងនិយាយ)</span>
            </label>
          </div>
        </div>

        {/* Tracks List or Clean Empty State */}
        <div className="p-5 max-h-[50vh] overflow-y-auto">
          {tracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-white/[0.08] rounded-xl bg-[#161616]/50">
              <div className="w-12 h-12 rounded-full bg-[#1F1F24] flex items-center justify-center text-zinc-500 mb-3">
                <FileAudio className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                មិនទាន់មានបទភ្លេង BGM នៅឡើយទេ
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mb-4">
                សូមចុចប៊ូតុងខាងក្រោមដើម្បីបញ្ចូលឯកសារភ្លេងពិតប្រាកដ (.mp3, .wav, .aac, .m4a) ពីកុំព្យូទ័ររបស់អ្នក។ គ្មានទិន្នន័យក្លែងក្លាយឡើយ។
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#202020] hover:bg-[#282828] text-white border border-white/[0.1] text-xs font-semibold transition-all hover:border-[#00C2FF]/50"
              >
                <Upload className="w-4 h-4 text-[#00C2FF]" />
                <span>ជ្រើសរើសឯកសារភ្លេងពីកុំព្យូទ័រ</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {tracks.map((track) => {
                const isPlaying = playingTrackId === track.id;
                return (
                  <div
                    key={track.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      isPlaying
                        ? 'bg-[#1C1C22] border-[#00C2FF]/50 shadow-md'
                        : 'bg-[#181818] border-white/[0.06] hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handlePlayToggle(track)}
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
                        <div className="text-xs font-bold text-white truncate">{track.name}</div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-zinc-300">{track.duration}</span>
                          <span>•</span>
                          <span className="text-[10px] text-emerald-400 font-medium">Real Audio File</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAdd(track)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00C2FF]/15 hover:bg-[#00C2FF]/25 text-[#00C2FF] border border-[#00C2FF]/40 text-xs font-bold transition-all active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ដាក់ចូល Track B1</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(track.id, e)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/[0.04] transition-colors"
                        title="លុបចេញ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
            {tracks.length} បទភ្លេងនៅក្នុងបញ្ជី
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
