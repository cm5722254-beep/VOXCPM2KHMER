import React, { useState, useRef, useEffect } from 'react';
import {
  Scissors,
  Layers,
  Upload,
  Film,
  Sparkles,
  Download,
  Play,
  Pause,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Check,
  Clock,
  HardDrive,
  Tv,
  Loader2,
  Zap,
  Info,
  Maximize2,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { api } from '../../services/api';
import { ProjectFile } from '../../types';

interface VideoCutterPageProps {
  onShowToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  recentFiles?: ProjectFile[];
  onOpenStudio?: () => void;
}

interface SplitResultPart {
  part_index: number;
  filename: string;
  url: string;
  file_path: string;
  start_time: number;
  end_time: number;
  duration: number;
  size_bytes: number;
  formatted_time: string;
}

interface MergeClipItem {
  id: string;
  file?: File;
  filename: string;
  filePath?: string;
  url: string;
  duration: number;
  size: number;
}

export const VideoCutterPage: React.FC<VideoCutterPageProps> = ({
  onShowToast,
  recentFiles = [],
  onOpenStudio,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'split' | 'merge'>('split');

  // ── Splitter State ──
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitVideoUrl, setSplitVideoUrl] = useState<string>('');
  const [splitFilename, setSplitFilename] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoMetadata, setVideoMetadata] = useState<any>(null);
  const [isUploadingSplit, setIsUploadingSplit] = useState(false);

  // Settings
  const [splitMode, setSplitMode] = useState<'duration' | 'parts'>('duration');
  const [minutesPerPart, setMinutesPerPart] = useState<number>(10);
  const [numParts, setNumParts] = useState<number>(5);
  const [namingPrefix, setNamingPrefix] = useState<string>('ភាគ');
  const [isLossless, setIsLossless] = useState<boolean>(true);

  // Execution
  const [isSplitting, setIsSplitting] = useState<boolean>(false);
  const [splitProgress, setSplitProgress] = useState<number>(0);
  const [splitProgressMsg, setSplitProgressMsg] = useState<string>('');
  const [splitResults, setSplitResults] = useState<SplitResultPart[]>([]);
  const [previewingPartUrl, setPreviewingPartUrl] = useState<string | null>(null);

  // ── Merger State ──
  const [mergeClips, setMergeClips] = useState<MergeClipItem[]>([]);
  const [isUploadingMerge, setIsUploadingMerge] = useState(false);
  const [mergedOutputName, setMergedOutputName] = useState<string>('merged_cinema_movie');
  const [mergeLossless, setMergeLossless] = useState<boolean>(true);
  const [mergeResolution, setMergeResolution] = useState<string>('auto');
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [mergeProgress, setMergeProgress] = useState<number>(0);
  const [mergeProgressMsg, setMergeProgressMsg] = useState<string>('');
  const [mergedResult, setMergedResult] = useState<any>(null);

  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergeFileInputRef = useRef<HTMLInputElement>(null);

  // Preset minutes
  const MINUTE_PRESETS = [
    { label: '3 នាទី (Shorts/Reels)', value: 3 },
    { label: '5 នាទី', value: 5 },
    { label: '10 នាទី (ស្តង់ដារ YouTube)', value: 10 },
    { label: '15 នាទី (ភាគរឿង)', value: 15 },
    { label: '20 នាទី', value: 20 },
    { label: '30 នាទី (ភាគរឿងវែង)', value: 30 },
    { label: '45 នាទី', value: 45 },
    { label: '60 នាទី (1 ម៉ោង)', value: 60 },
  ];

  // Format seconds to human time string
  const formatSec = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h} ម៉ោង ${m} នាទី ${s} វិនាទី`;
    }
    return `${m} នាទី ${s} វិនាទី`;
  };

  const formatShortTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  // Handle uploading splitter video
  const handleSelectSplitFile = async (file: File) => {
    try {
      setIsUploadingSplit(true);
      setSplitFile(file);
      const localUrl = URL.createObjectURL(file);
      setSplitVideoUrl(localUrl);
      setSplitFilename(file.name);
      setSplitResults([]);

      // Upload to server
      const formData = new FormData();
      formData.append('mediaFile', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.file) {
        setSplitFilename(data.file.filename);
        setSplitVideoUrl(data.file.url);
        onShowToast(`✅ បាន Upload វីដេអូ "${file.name}" ជោគជ័យ!`, 'success');

        // Fetch deep video metadata
        try {
          const infoRes = await api.getVideoToolsInfo({ filename: data.file.filename });
          if (infoRes.success && infoRes.metadata) {
            setVideoMetadata(infoRes.metadata);
            setVideoDuration(infoRes.metadata.duration);
          }
        } catch (_) {}
      }
    } catch (err: any) {
      onShowToast(`កំហុស Upload: ${err.message}`, 'error');
    } finally {
      setIsUploadingSplit(false);
    }
  };

  // Select video from recent files
  const handleSelectRecentFile = async (rf: ProjectFile) => {
    setSplitFilename(rf.filename);
    setSplitVideoUrl(rf.url);
    setSplitResults([]);
    try {
      const infoRes = await api.getVideoToolsInfo({ filename: rf.filename });
      if (infoRes.success && infoRes.metadata) {
        setVideoMetadata(infoRes.metadata);
        setVideoDuration(infoRes.metadata.duration);
        onShowToast(`📂 បានជ្រើសរើស "${rf.originalName || rf.filename}"`, 'info');
      }
    } catch (err: any) {
      onShowToast(`កំហុសអានទិន្នន័យ: ${err.message}`, 'error');
    }
  };

  // Calculate calculated parts
  const calculatedPartsCount = () => {
    if (!videoDuration || videoDuration <= 0) return 0;
    if (splitMode === 'parts') return numParts;
    const durSec = minutesPerPart * 60;
    return Math.ceil(videoDuration / durSec);
  };

  // Start splitting video
  const handleStartSplit = async () => {
    if (!splitFilename) {
      onShowToast('⚠️ សូមបញ្ចូល ឬ Upload វីដេអូជាមុនសិន!', 'warning');
      return;
    }

    try {
      setIsSplitting(true);
      setSplitProgress(10);
      setSplitProgressMsg('កំពុងចាប់ផ្ដើមដំណើរការកាត់វីដេអូ...');

      const res = await api.splitVideo({
        filename: splitFilename,
        mode: splitMode,
        durationPerPartMinutes: minutesPerPart,
        numParts: numParts,
        lossless: isLossless,
        namingPrefix: namingPrefix,
      });

      if (res.success && res.parts) {
        setSplitResults(res.parts);
        setSplitProgress(100);
        onShowToast(`🎉 បានកាត់វីដេអូជា ${res.parts.length} ភាគជោគជ័យ!`, 'success');
      }
    } catch (err: any) {
      onShowToast(`កំហុសកាត់វីដេអូ: ${err.message}`, 'error');
    } finally {
      setIsSplitting(false);
    }
  };

  // ── Merger Functions ──
  const handleAddMergeFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingMerge(true);
    const newItems: MergeClipItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      try {
        const formData = new FormData();
        formData.append('mediaFile', f);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success && data.file) {
          // get duration
          let dur = 0;
          try {
            const info = await api.getVideoToolsInfo({ filename: data.file.filename });
            if (info.success && info.metadata) {
              dur = info.metadata.duration;
            }
          } catch (_) {}

          newItems.push({
            id: `clip_${Date.now()}_${i}`,
            file: f,
            filename: data.file.filename,
            url: data.file.url,
            duration: dur,
            size: data.file.size,
          });
        }
      } catch (err: any) {
        onShowToast(`កំហុស Upload Clip: ${err.message}`, 'error');
      }
    }

    setMergeClips((prev) => [...prev, ...newItems]);
    setIsUploadingMerge(false);
    onShowToast(`✅ បានបន្ថែម ${newItems.length} វីដេអូក្នុងបញ្ជី!`, 'success');
  };

  const handleMoveClip = (index: number, direction: 'up' | 'down') => {
    const next = [...mergeClips];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= next.length) return;
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setMergeClips(next);
  };

  const handleRemoveClip = (index: number) => {
    setMergeClips((prev) => prev.filter((_, i) => i !== index));
  };

  const totalMergeDuration = mergeClips.reduce((acc, c) => acc + (c.duration || 0), 0);
  const totalMergeSize = mergeClips.reduce((acc, c) => acc + (c.size || 0), 0);

  // Start merging clips
  const handleStartMerge = async () => {
    if (mergeClips.length < 2) {
      onShowToast('⚠️ សូមបញ្ចូលវីដេអូយ៉ាងហោចណាស់ ២ ឃ្លីបដើម្បីបញ្ចូលគ្នា!', 'warning');
      return;
    }

    try {
      setIsMerging(true);
      setMergeProgress(15);
      setMergeProgressMsg(`កំពុងត្រៀមបញ្ចូលវីដេអូចំនួន ${mergeClips.length} ឃ្លីប...`);

      const filenames = mergeClips.map((c) => c.filename);
      const res = await api.mergeVideos({
        filenames: filenames,
        outputName: mergedOutputName,
        lossless: mergeLossless,
        targetResolution: mergeResolution,
      });

      if (res.success && res.result) {
        setMergedResult(res.result);
        setMergeProgress(100);
        onShowToast(`🎉 បានបញ្ចូលវីដេអូទាំង ${mergeClips.length} ឃ្លីបជោគជ័យ!`, 'success');
      }
    } catch (err: any) {
      onShowToast(`កំហុសបញ្ចូលវីដេអូ: ${err.message}`, 'error');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0D0D11] text-slate-100 overflow-y-auto select-none font-khmer p-3 sm:p-5 lg:p-6 space-y-5">
      {/* ── Top Header Banner ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#16161D] via-[#1A1A24] to-[#16161D] border border-white/[0.08] shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-indigo-600/30 border border-emerald-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,173,0.3)] shrink-0">
            <Scissors className="w-6 h-6 text-emerald-400 drop-shadow-[0_0_10px_rgba(0,242,173,0.8)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-wide">
                កាត់ត & បញ្ចូលវីដេអូភាគ PRO
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black tracking-wider uppercase">
                1H - 5H Engine
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Auto Split វីដេអូវែង 1H - 5H ជាច្រើនភាគស្មើគ្នា & Merge វីដេអូខ្លីៗបញ្ចូលគ្នាជាវីដេអូវែង លឿន និងគុណភាពខ្ពស់
            </p>
          </div>
        </div>

        {/* Tab Switcher: Splitter vs Merger */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('split')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'split'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>កាត់វីដេអូជាភាគ (Auto Split)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('merge')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'merge'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>បញ្ចូលវីដេអូគ្នា (Video Merger)</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TAB 1: AUTO EPISODE SPLITTER (1H - 5H)
          ═══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Upload & Video Preview (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Upload Box or Video Player */}
            <div className="rounded-2xl bg-[#141418] border border-white/[0.08] overflow-hidden shadow-xl p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-emerald-400" />
                  វីដេអូដើម (ប្រវែង 1H - 5H)
                </span>
                {videoDuration > 0 && (
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    ⏱️ {formatSec(videoDuration)}
                  </span>
                )}
              </div>

              {splitVideoUrl ? (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-white/10 group">
                  <video
                    ref={videoPlayerRef}
                    src={splitVideoUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/15 hover:border-emerald-400/50 rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center gap-3 cursor-pointer bg-black/20 hover:bg-black/30 transition-all text-center group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    {isUploadingSplit ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      ចុច ឬទម្លាក់វីដេអូវែង (1 ម៉ោង ដល់ 5 ម៉ោង) ចូលទីនេះ
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      ទ្រទ្រង់ MP4, MKV, MOV, AVI, WEBM គ្មានកំណត់ទំហំ (High Speed 10GB+)
                    </p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleSelectSplitFile(f);
                }}
              />

              {/* Action buttons under player */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{splitVideoUrl ? 'ប្ដូរវីដេអូផ្សេង' : 'ជ្រើសរើសវីដេអូ'}</span>
                </button>

                {/* Quick Select from Recent Project Videos */}
                {recentFiles.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
                    <span className="text-[10px] text-zinc-500 font-bold shrink-0">ពីគម្រោង៖</span>
                    {recentFiles.slice(0, 3).map((rf, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectRecentFile(rf)}
                        className="px-2 py-1 rounded-lg bg-black/40 hover:bg-white/10 border border-white/5 text-[11px] text-zinc-300 truncate max-w-[130px]"
                        title={rf.originalName || rf.filename}
                      >
                        {rf.originalName || rf.filename}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Video Specs Card */}
            {videoMetadata && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#141418] border border-white/[0.06] flex flex-col">
                  <span className="text-[10px] text-zinc-400">ប្រវែងសរុប</span>
                  <span className="text-xs font-mono font-bold text-white mt-1">
                    {formatSec(videoMetadata.duration)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#141418] border border-white/[0.06] flex flex-col">
                  <span className="text-[10px] text-zinc-400">កម្រិតរូបភាព</span>
                  <span className="text-xs font-mono font-bold text-white mt-1">
                    {videoMetadata.width} × {videoMetadata.height} ({videoMetadata.fps} fps)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#141418] border border-white/[0.06] flex flex-col">
                  <span className="text-[10px] text-zinc-400">ទំហំឯកសារ</span>
                  <span className="text-xs font-mono font-bold text-white mt-1">
                    {formatBytes(videoMetadata.size_bytes)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#141418] border border-white/[0.06] flex flex-col">
                  <span className="text-[10px] text-zinc-400">កូដិកវីដេអូ</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 mt-1 uppercase">
                    {videoMetadata.video_codec} / {videoMetadata.audio_codec}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Split Settings & Execute (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-[#141418] border border-white/[0.08] shadow-xl space-y-4">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                ការកំណត់កាត់ភាគ (Split Settings)
              </h2>

              {/* Mode Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/40 border border-white/10">
                <button
                  type="button"
                  onClick={() => setSplitMode('duration')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    splitMode === 'duration'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ⏱️ តាមចំនួននាទី/ភាគ
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('parts')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    splitMode === 'parts'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  🔢 តាមចំនួនភាគស្មើគ្នា
                </button>
              </div>

              {/* Setting details based on mode */}
              {splitMode === 'duration' ? (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-300">
                    ជ្រើសរើសចំនួននាទីក្នុង ១ ភាគ៖
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {MINUTE_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setMinutesPerPart(p.value)}
                        className={`py-2 px-2.5 rounded-xl text-[11px] font-bold text-left transition-all border ${
                          minutesPerPart === p.value
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                            : 'bg-black/30 border-white/10 text-zinc-300 hover:bg-white/5'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom minutes input */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-zinc-400">ឬកំណត់នាទីផ្ទាល់ខ្លួន៖</span>
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={minutesPerPart}
                      onChange={(e) => setMinutesPerPart(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-20 px-2.5 py-1 rounded-lg bg-black/60 border border-white/15 text-center font-mono font-bold text-white text-xs outline-none focus:border-emerald-400"
                    />
                    <span className="text-xs text-zinc-300 font-semibold">នាទី/ភាគ</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300">
                      ចំនួនភាគដែលចង់ចែកស្មើគ្នា៖
                    </label>
                    <span className="text-sm font-mono font-bold text-emerald-400">
                      {numParts} ភាគ
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={50}
                    step={1}
                    value={numParts}
                    onChange={(e) => setNumParts(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>2 ភាគ</span>
                    <span>10 ភាគ</span>
                    <span>25 ភាគ</span>
                    <span>50 ភាគ</span>
                  </div>
                </div>
              )}

              {/* Naming Prefix & Engine Settings */}
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300 font-semibold">បុព្វបទឈ្មោះភាគ៖</span>
                  <input
                    type="text"
                    value={namingPrefix}
                    onChange={(e) => setNamingPrefix(e.target.value)}
                    placeholder="ភាគ"
                    className="w-28 px-2.5 py-1 rounded-lg bg-black/60 border border-white/15 text-xs text-white font-khmer outline-none focus:border-emerald-400 text-center"
                  />
                </div>

                {/* Ultra-Fast Stream Copy (Lossless) toggle */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between cursor-pointer"
                  onClick={() => setIsLossless(!isLossless)}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-yellow-400" />
                      Ultra-Fast Stream Copy (គ្មានការធ្លាក់ចុះគុណភាព)
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      កាត់ត្រឹម 2-5 វិនាទីក្នុង 1 ភាគ ដោយរក្សាគុណភាពដើម 100%
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isLossless}
                    onChange={(e) => setIsLossless(e.target.checked)}
                    className="w-4 h-4 accent-emerald-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Live Parts Calculation Banner */}
              {videoDuration > 0 && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-emerald-300">
                      ការគណនាស្វ័យប្រវត្តិ៖
                    </span>
                    <span className="text-[11px] text-zinc-300">
                      វីដេអូនេះនឹងត្រូវកាត់ចេញជា <strong className="text-emerald-400">{calculatedPartsCount()} ភាគ</strong>
                    </span>
                  </div>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    {calculatedPartsCount()} ភាគ
                  </span>
                </div>
              )}

              {/* Progress bar if active */}
              {isSplitting && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      {splitProgressMsg || 'កំពុងដំណើរការកាត់...'}
                    </span>
                    <span className="font-mono">{splitProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                      style={{ width: `${splitProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Execute Button */}
              <button
                type="button"
                onClick={handleStartSplit}
                disabled={isSplitting || !splitFilename}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-extrabold text-sm shadow-[0_0_25px_rgba(0,242,173,0.4)] transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSplitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>កំពុងកាត់វីដេអូ...</span>
                  </>
                ) : (
                  <>
                    <Scissors className="w-4 h-4" />
                    <span>
                      {videoDuration > 0
                        ? `🎬 ចាប់ផ្ដើមកាត់ជា ${calculatedPartsCount()} ភាគភ្លាមៗ`
                        : '🎬 ចាប់ផ្ដើមកាត់ជាច្រើនភាគ'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bottom Results: Generated Episode Parts Cards */}
          {splitResults.length > 0 && (
            <div className="lg:col-span-12 p-5 rounded-2xl bg-[#141418] border border-white/[0.08] shadow-2xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      លទ្ធផលកាត់វីដេអូបានសម្រេច ({splitResults.length} ភាគ)
                    </h3>
                    <p className="text-xs text-zinc-400">
                      អ្នកអាចទាញយកភាគនីមួយៗ ឬចាក់ទស្សនាសាកល្បងបានភ្លាមៗ
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenStudio && (
                    <button
                      type="button"
                      onClick={onOpenStudio}
                      className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-xs font-bold text-zinc-200 border border-white/10 transition-all flex items-center gap-1.5"
                    >
                      <span>បើកក្នុង Dubbing Studio</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Grid of Part Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {splitResults.map((part) => (
                  <div
                    key={part.part_index}
                    className="p-3.5 rounded-xl bg-[#1C1C24] border border-white/10 hover:border-emerald-400/40 transition-all flex flex-col justify-between gap-3 group shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-bold">
                          ភាគ {part.part_index}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400">
                          {formatBytes(part.size_bytes)}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white truncate" title={part.filename}>
                        {part.filename}
                      </p>
                      <p className="text-[11px] font-mono text-zinc-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        {part.formatted_time} ({formatSec(part.duration)})
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setPreviewingPartUrl(part.url)}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-black/40 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-200 hover:text-white flex items-center justify-center gap-1 transition-all"
                      >
                        <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                        <span>មើល</span>
                      </button>
                      <a
                        href={part.url}
                        download={part.filename}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-xs font-bold text-emerald-300 flex items-center justify-center gap-1 transition-all"
                      >
                        <Download className="w-3 h-3" />
                        <span>ទាញយក</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 2: MULTI-VIDEO MERGER (បញ្ចូលវីដេអូខ្លីៗជាវីដេអូវែង)
          ═══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'merge' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Clips List to Merge (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-[#141418] border border-white/[0.08] shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    បញ្ជីឃ្លីបវីដេអូដែលត្រូវបញ្ចូលគ្នា ({mergeClips.length})
                  </h2>
                  <p className="text-xs text-zinc-400">
                    ទម្លាក់វីដេអូខ្លីៗជាច្រើនចូលគ្នា—ប្រព័ន្ធនឹងតម្រៀប និងបញ្ចូលជា ១ វីដេអូវែង
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => mergeFileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ បន្ថែមវីដេអូ</span>
                </button>
              </div>

              <input
                ref={mergeFileInputRef}
                type="file"
                multiple
                accept="video/*"
                className="hidden"
                onChange={(e) => handleAddMergeFiles(e.target.files)}
              />

              {/* Upload Drop Zone if empty */}
              {mergeClips.length === 0 ? (
                <div
                  onClick={() => mergeFileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/15 hover:border-cyan-400/50 rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center gap-3 cursor-pointer bg-black/20 hover:bg-black/30 transition-all text-center group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                    {isUploadingMerge ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      <Plus className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      ចុច ឬទម្លាក់វីដេអូច្រើនឃ្លីបចូលទីនេះ
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      អាចជ្រើសរើសវីដេអូខ្លីៗរាប់សិបឃ្លីបក្នុងពេលតែមួយ (Batch Import)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {mergeClips.map((clip, idx) => (
                    <div
                      key={clip.id}
                      className="p-3 rounded-xl bg-[#1B1B22] border border-white/10 hover:border-cyan-400/30 flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-black/40 border border-white/10 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                            {clip.file?.name || clip.filename}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                            ⏱️ {formatSec(clip.duration)} | {formatBytes(clip.size)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveClip(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-30"
                          title="រំកិលឡើងលើ"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveClip(idx, 'down')}
                          disabled={idx === mergeClips.length - 1}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-30"
                          title="រំកិលចុះក្រោម"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveClip(idx)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 hover:text-rose-300"
                          title="លុបចេញពីបញ្ជី"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Merger Settings & Action (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-[#141418] border border-white/[0.08] shadow-xl space-y-4">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                ការកំណត់បញ្ចូលវីដេអូ (Merger Options)
              </h2>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[10px] text-zinc-400">ចំនួនឃ្លីប</span>
                  <p className="text-sm font-mono font-bold text-cyan-400 mt-1">
                    {mergeClips.length} វីដេអូ
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[10px] text-zinc-400">ប្រវែងវីដេអូសម្រេចសរុប</span>
                  <p className="text-sm font-mono font-bold text-emerald-400 mt-1">
                    {formatSec(totalMergeDuration)}
                  </p>
                </div>
              </div>

              {/* Output Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">
                  ឈ្មោះឯកសារសម្រេច (Output Name)៖
                </label>
                <input
                  type="text"
                  value={mergedOutputName}
                  onChange={(e) => setMergedOutputName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white outline-none focus:border-cyan-400 font-khmer"
                />
              </div>

              {/* Resolution options */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">
                  កម្រិតរូបភាពសម្រេច (Output Resolution)៖
                </label>
                <select
                  value={mergeResolution}
                  onChange={(e) => setMergeResolution(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white outline-none focus:border-cyan-400 font-sans"
                >
                  <option value="auto">ស្វ័យប្រវត្តិ Auto (តាមទំហំដើម)</option>
                  <option value="1080p">1080p Full HD (1920 × 1080)</option>
                  <option value="720p">720p HD (1280 × 720)</option>
                </select>
              </div>

              {/* Lossless Concat Toggle */}
              <div
                className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between cursor-pointer"
                onClick={() => setMergeLossless(!mergeLossless)}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    Ultra-Fast Lossless Stream Concat
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    បញ្ចូលភ្លាមៗក្នុងរយៈពេលប៉ុន្មានវិនាទី (បើកូដិកដូចគ្នា)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={mergeLossless}
                  onChange={(e) => setMergeLossless(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Progress Bar */}
              {isMerging && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      {mergeProgressMsg || 'កំពុងដំណើរការបញ្ចូលគ្នា...'}
                    </span>
                    <span className="font-mono">{mergeProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                      style={{ width: `${mergeProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Execute Button */}
              <button
                type="button"
                onClick={handleStartMerge}
                disabled={isMerging || mergeClips.length < 2}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-[0_0_25px_rgba(0,194,255,0.4)] transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isMerging ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>កំពុងបញ្ចូលវីដេអូ...</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>
                      🔗 បញ្ចូលវីដេអូ {mergeClips.length} ឃ្លីបចូលគ្នាជា ១ វីដេអូ
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Merged Result Card */}
            {mergedResult && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-400/30 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    វីដេអូសម្រេចបានរួចរាល់!
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {formatSec(mergedResult.duration)}
                  </span>
                </div>

                <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-white/10">
                  <video src={mergedResult.url} controls className="w-full h-full object-contain" />
                </div>

                <a
                  href={mergedResult.url}
                  download={mergedResult.filename}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>ទាញយកវីដេអូសម្រេច ({formatBytes(mergedResult.size_bytes)})</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Part Video Preview Modal */}
      {previewingPartUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-[#16161D] border border-white/15 overflow-hidden shadow-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-sm font-bold text-white font-khmer">
                ទស្សនាសាកល្បងភាគវីដេអូ
              </span>
              <button
                type="button"
                onClick={() => setPreviewingPartUrl(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
              <video src={previewingPartUrl} controls autoPlay className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
