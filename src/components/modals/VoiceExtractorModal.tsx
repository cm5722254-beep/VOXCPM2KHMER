import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Scissors,
  Upload,
  Play,
  Pause,
  Sparkles,
  CheckCircle2,
  Volume2,
  Loader2,
  Mic,
  Users,
  Shield,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../services/api';
import { CharacterVoice } from '../../types';

interface VoiceExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newChar: CharacterVoice) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const VoiceExtractorModal: React.FC<VoiceExtractorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowToast,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [fileType, setFileType] = useState<'video' | 'audio'>('video');
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Trimming parameters
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(10);
  const [isPlayingRange, setIsPlayingRange] = useState<boolean>(false);
  const [isolateVocal, setIsolateVocal] = useState<boolean>(true);

  // Character metadata
  const [label, setLabel] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [role, setRole] = useState<string>('male_lead');
  const [words, setWords] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
      setFile(null);
      setFileUrl('');
      setDuration(0);
      setStartTime(0);
      setEndTime(10);
      setIsPlayingRange(false);
      setLabel('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectFile = (f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setFileUrl(url);
    const isVid = f.type.startsWith('video/') || /\.(mp4|mkv|mov|avi|webm)$/i.test(f.name);
    setFileType(isVid ? 'video' : 'audio');
    const defaultLabel = f.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    setLabel(`តួអង្គ ${defaultLabel.slice(0, 20)}`);
  };

  const handleMediaLoaded = (e: React.SyntheticEvent<HTMLMediaElement>) => {
    const dur = e.currentTarget.duration;
    if (dur && !isNaN(dur)) {
      setDuration(dur);
      setStartTime(0);
      setEndTime(Math.min(dur, 10));
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLMediaElement>) => {
    const ct = e.currentTarget.currentTime;
    setCurrentTime(ct);
    if (isPlayingRange && ct >= endTime) {
      e.currentTarget.currentTime = startTime;
      e.currentTarget.play().catch(() => {});
    }
  };

  const togglePlayRange = () => {
    if (!mediaRef.current) return;
    if (isPlayingRange) {
      mediaRef.current.pause();
      setIsPlayingRange(false);
    } else {
      mediaRef.current.currentTime = startTime;
      mediaRef.current.play().catch(() => {});
      setIsPlayingRange(true);
    }
  };

  const handleExtractAndSave = async () => {
    if (!file) {
      onShowToast('សូមជ្រើសរើសឯកសារវីដេអូ ឬ MP3 ជាមុនសិន!', 'warning');
      return;
    }
    if (!label.trim()) {
      onShowToast('សូមបញ្ចូលឈ្មោះតួអង្គ!', 'warning');
      return;
    }
    if (endTime <= startTime) {
      onShowToast('ពេលវេលាបញ្ចប់ត្រូវតែធំជាងពេលវេលាចាប់ផ្ដើម!', 'warning');
      return;
    }

    try {
      setIsProcessing(true);
      const fd = new FormData();
      fd.append('mediaFile', file);
      fd.append('startTime', startTime.toString());
      fd.append('endTime', endTime.toString());
      fd.append('isolateVocal', isolateVocal ? 'true' : 'false');
      fd.append('label', label.trim());
      fd.append('gender', gender);
      fd.append('role_key', role);
      fd.append('words', words.trim() || 'សំឡេងកាត់ចេញពីរឿង');

      const res = await api.extractVoice(fd);
      if (res.success && res.character) {
        onShowToast(`🎉 បានកាត់ និងរក្សាទុកសំឡេង "${res.character.label}" ជោគជ័យ!`, 'success');
        onSuccess(res.character);
        onClose();
      }
    } catch (err: any) {
      onShowToast(`កំហុសកាត់សំឡេង: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedDuration = Math.max(0, endTime - startTime);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none font-khmer">
      <div className="bg-[#12141A] border border-white/15 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 px-5 border-b border-white/[0.08] flex items-center justify-between bg-[#161822]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">
                កាត់យកសំឡេងតួអង្គពី Video ឬ MP3 (Voice Extractor)
              </h2>
              <p className="text-[11px] text-zinc-400">
                ទម្លាក់វីដេអូ ឬសម្លេងចូល រួចកាត់យកចន្លោះ 3s - 15s ធ្វើជាសំឡេងតួអង្គ Dubbing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* File Upload Zone */}
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/15 hover:border-emerald-400/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-black/30 hover:bg-black/40 transition-all text-center group"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  ចុច ឬទម្លាក់វីដេអូ (MP4, MKV) ឬឯកសារសំឡេង (MP3, WAV) ចូលទីនេះ
                </p>
                <p className="text-[10px] text-zinc-400 mt-1">
                  ទាញយកសំឡេងនិយាយរបស់តួអង្គពីរឿង ឬបទចម្រៀងបានភ្លាមៗ
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Media Preview Player */}
              <div className="rounded-xl overflow-hidden bg-black border border-white/10 relative">
                {fileType === 'video' ? (
                  <video
                    ref={mediaRef as any}
                    src={fileUrl}
                    onLoadedMetadata={handleMediaLoaded}
                    onTimeUpdate={handleTimeUpdate}
                    className="w-full max-h-48 object-contain"
                  />
                ) : (
                  <div className="p-4 flex items-center justify-center bg-gradient-to-r from-emerald-950/30 to-cyan-950/30">
                    <audio
                      ref={mediaRef as any}
                      src={fileUrl}
                      onLoadedMetadata={handleMediaLoaded}
                      onTimeUpdate={handleTimeUpdate}
                    />
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-8 h-8 text-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-white truncate max-w-xs">{file.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Time Trimmer Controls */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ជ្រើសរើសចន្លោះសំឡេងដែលនិយាយច្បាស់៖</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    ប្រវែង៖ {selectedDuration.toFixed(1)} វិនាទី
                  </span>
                </div>

                {/* Range Sliders */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>ចាប់ផ្ដើម (Start)</span>
                      <span className="font-mono text-white font-bold">{startTime.toFixed(1)}s</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={duration || 10}
                      step={0.1}
                      value={startTime}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setStartTime(val);
                        if (val >= endTime) setEndTime(Math.min(duration, val + 5));
                      }}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>បញ្ចប់ (End)</span>
                      <span className="font-mono text-white font-bold">{endTime.toFixed(1)}s</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={duration || 10}
                      step={0.1}
                      value={endTime}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setEndTime(val);
                        if (val <= startTime) setStartTime(Math.max(0, val - 5));
                      }}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Preview Range Button */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={togglePlayRange}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    {isPlayingRange ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-emerald-300" />}
                    <span>{isPlayingRange ? 'ផ្អាកស្តាប់' : '▶ ស្តាប់សាកល្បងចន្លោះនេះ (Loop)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-zinc-400 hover:text-white transition-colors"
                  >
                    ប្ដូរឯកសារផ្សេង
                  </button>
                </div>
              </div>

              {/* Vocal Isolation Toggle */}
              <div
                onClick={() => setIsolateVocal(!isolateVocal)}
                className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                    <span>លុបភ្លេងកំដរ & សំឡេងរំខាន (AI Vocal Clean / Denoise)</span>
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    ចម្រាញ់យកតែសម្លេងនិយាយសុទ្ធ 100% សម្រាប់ប្រើក្នុងការ Clone និង Dubbing
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isolateVocal}
                  onChange={(e) => setIsolateVocal(e.target.checked)}
                  className="w-4 h-4 accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Character Details Form */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">
                    ឈ្មោះសំឡេងតួអង្គ (Character Voice Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="ឧ. 👑 តួឯកប្រុស រ៉ាជានី..."
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">ភេទ (Gender)</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white outline-none focus:border-emerald-400"
                    >
                      <option value="male">👨 ប្រុស (Male)</option>
                      <option value="female">👩 ស្រី (Female)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">តួនាទី (Role)</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white outline-none focus:border-emerald-400"
                    >
                      <option value="male_lead">👑 តួប្រុសឯក (Male Lead)</option>
                      <option value="female_lead">🌸 តួស្រីឯក (Female Lead)</option>
                      <option value="narrator">📖 អ្នកនិទាន (Narrator)</option>
                      <option value="comedy">🎭 តួកំប្លែង (Comedy)</option>
                      <option value="villain">⚔️ តួកាច (Villain)</option>
                      <option value="elder">👴 ព្រឹទ្ធាចារ្យ (Elder)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">
                    ពាក្យគំរូ ឬការពិពណ៌នា (Sample Words / Description)
                  </label>
                  <input
                    type="text"
                    value={words}
                    onChange={(e) => setWords(e.target.value)}
                    placeholder="ឧ. សំឡេងកាច ម៉ឺងម៉ាត់ បែបខ្សែភាពយន្តចិន..."
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleSelectFile(f);
            }}
          />
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-5 border-t border-white/[0.08] bg-[#161822] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            បោះបង់ (Cancel)
          </button>

          <button
            type="button"
            onClick={handleExtractAndSave}
            disabled={isProcessing || !file || !label.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-black text-xs shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>កំពុងកាត់សំឡេង...</span>
              </>
            ) : (
              <>
                <Scissors className="w-3.5 h-3.5" />
                <span>💾 កាត់ & រក្សាទុកក្នុងបណ្ណាល័យតួអង្គ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
