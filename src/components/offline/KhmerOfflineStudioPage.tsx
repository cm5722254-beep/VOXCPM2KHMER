import React, { useRef, useState } from 'react';
import {
  Flame,
  Zap,
  Film,
  ArrowLeft,
  CheckCircle2,
  HardDrive,
  Cpu,
  Layers,
  Sparkles,
  Upload,
  Trash2,
  Play,
  Pause,
  CheckSquare,
  Square,
  Plus,
  RefreshCw,
  FileVideo,
  Clock,
  Settings2,
  Tv,
} from 'lucide-react';
import { KhmerOfflineConfig, OfflineEpisodeItem, User } from '../../types';

interface KhmerOfflineStudioPageProps {
  config: KhmerOfflineConfig;
  onChangeConfig: (newConfig: KhmerOfflineConfig) => void;
  onStartOfflineDubbing: () => void;
  isProcessing: boolean;
  progress?: number;
  message?: string;
  onOpenTimelineStudio: (videoUrl?: string, filename?: string) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  user?: User | null;
  onOpenLicenseModal?: () => void;
}

export const KhmerOfflineStudioPage: React.FC<KhmerOfflineStudioPageProps> = ({
  config,
  onChangeConfig,
  onStartOfflineDubbing,
  isProcessing,
  progress = 0,
  message = '',
  onOpenTimelineStudio,
  onShowToast,
  user,
  onOpenLicenseModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [playingEpisodeId, setPlayingEpisodeId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const episodes = config.episodes || [];
  const selectedEpisodes = episodes.filter((ep) => ep.isSelected);
  const selectedCount = selectedEpisodes.length;

  // Multiple File Upload (1 to 20 videos)
  const handleBatchFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newEpisodeItems: OfflineEpisodeItem[] = [...episodes];

    files.forEach((file, idx) => {
      const slotIndex = newEpisodeItems.length + 1;
      if (slotIndex > 20) return; // Cap at 20

      const blobUrl = URL.createObjectURL(file);
      const sizeMb = parseFloat((file.size / (1024 * 1024)).toFixed(1));

      let title = file.name.replace(/\.[^/.]+$/, '');
      if (!title.toLowerCase().includes('ep') && !title.includes('ភាគ')) {
        title = `ភាគ ${slotIndex.toString().padStart(2, '0')} - ${title}`;
      }

      newEpisodeItems.push({
        id: `offline_ep_${Date.now()}_${idx}`,
        episodeIndex: slotIndex,
        title,
        filename: file.name,
        url: blobUrl,
        sizeMb,
        duration: '22:30',
        isSelected: true,
        status: 'ready',
      });
    });

    const updatedCount = Math.min(20, Math.max(config.batchEpisodes, newEpisodeItems.length));
    onChangeConfig({
      ...config,
      batchEpisodes: updatedCount,
      episodes: newEpisodeItems,
    });

    onShowToast?.(`🎉 បានបញ្ចូលវីដេអូចំនួន ${files.length} ភាគចូលក្នុងបញ្ជី!`, 'success');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Toggle Single Episode Selection
  const toggleSelectEpisode = (epId: string) => {
    const updated = episodes.map((ep) =>
      ep.id === epId ? { ...ep, isSelected: !ep.isSelected } : ep
    );
    onChangeConfig({ ...config, episodes: updated });
  };

  // Select / Deselect All
  const handleSelectAll = (select: boolean) => {
    const updated = episodes.map((ep) => ({ ...ep, isSelected: select }));
    onChangeConfig({ ...config, episodes: updated });
    onShowToast?.(select ? 'បានជ្រើសរើសគ្រប់ភាគទាំងអស់!' : 'បានដោះការជ្រើសរើសទាំងអស់!', 'info');
  };

  // Remove Single Episode
  const handleRemoveEpisode = (epId: string) => {
    const filtered = episodes.filter((ep) => ep.id !== epId);
    const reindexed = filtered.map((ep, idx) => ({
      ...ep,
      episodeIndex: idx + 1,
    }));
    onChangeConfig({ ...config, episodes: reindexed });
  };

  // Clear All Episodes
  const handleClearAll = () => {
    if (episodes.length === 0) return;
    if (window.confirm('តើអ្នកពិតជាចង់សម្អាតបញ្ជីភាគវីដេអូទាំងអស់មែនទេ?')) {
      onChangeConfig({ ...config, episodes: [] });
      onShowToast?.('បានសម្អាតបញ្ជីភាគទាំងអស់រួចរាល់', 'info');
    }
  };

  // Load 20 Sample Episodes for Testing
  const handleLoadSample20Episodes = () => {
    const samples: OfflineEpisodeItem[] = [];
    const sampleNames = [
      'កម្រិតកំពូលនៃអាទិទេព',
      'ការប្រយុទ្ធនៅជ្រលងភ្នំភ្លើង',
      'ការដាស់ថាមពលនាគរាជ',
      'ជំនួបកំពូលអ្នកក្លាហាន',
      'ដំណើរឆ្ពោះទៅកាន់ដែនដីវេទមន្ត',
      'អាថ៌កំបាំងគម្ពីរមាស',
      'សង្គ្រាមត្រកូលស៊ាវ',
      'ការទម្លុះព្រំដែនកម្រិត៩',
      'ដាវទេពរន្ទះបាញ់',
      'ព្រឹត្តិការណ៍ប្រឡងកំពូលក្បាច់គុន',
      'សត្រូវលាក់មុខក្នុងស្រមោល',
      'ការរស់ឡើងវិញនៃស្ដេចបិសាច',
      'សម្ព័ន្ធភាពនៃដែនដីទាំងបី',
      'អំណាចនៃផ្កាឈូកភ្លើង',
      'ការបាត់បង់មេដឹកនាំកំពូល',
      'ការសងសឹកនៅកំពូលភ្នំព្រិល',
      'ច្រកទ្វារនៃពិភពអនាគត',
      'ការប្រឈមមុខនឹងគ្រោះមហន្តរាយ',
      'វគ្គផ្ដាច់ព្រ័ត្រនៃមហាសង្គ្រាម',
      'ជ័យជម្នះ និងការស្ថាបនាអាណាចក្រថ្មី',
    ];

    for (let i = 1; i <= 20; i++) {
      samples.push({
        id: `sample_ep_${i}`,
        episodeIndex: i,
        title: `ភាគ ${i.toString().padStart(2, '0')} - ${sampleNames[i - 1]}`,
        filename: `Episode_${i.toString().padStart(2, '0')}_FullHD.mp4`,
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: `22:${((i * 7) % 60).toString().padStart(2, '0')}`,
        sizeMb: 140 + i * 5,
        isSelected: true,
        status: 'ready',
      });
    }

    onChangeConfig({
      ...config,
      batchEpisodes: 20,
      episodes: samples,
    });
    onShowToast?.('🎉 បានបង្កើតបញ្ជីវីដេអូ ២០ ភាគគំរូរួចរាល់!', 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent select-none font-khmer">
      {/* ── Top Header Bar (Clean, Single Line) ── */}
      <div className="h-14 px-5 bg-[#080b13]/90 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Flame className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black text-white tracking-wide">
              KHMER OFFLINE STUDIO
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              ១ ដល់ ២០ ភាគ
            </span>
            <span className="hidden md:inline text-[10px] text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
              ⚡ ដំណើរការលើ CPU/GPU កុំព្យូទ័រផ្ទាល់ខ្លួន (មិនអស់ថ្លៃ Cloud)
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          <a
            href="https://t.me/BongCheatz_IT"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-sky-300 text-xs font-bold transition-all active:scale-95"
          >
            <span>✈️</span>
            <span className="hidden sm:inline">ទាក់ទង ADMIN</span>
          </a>

          <button
            onClick={() => onOpenTimelineStudio()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            <span>ស្ទូឌីយោ Timeline ➔</span>
          </button>
        </div>
      </div>

      {/* ── Main 2-Column Workstation Layout (Neat, Organized, Zero Clutter) ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-3 sm:p-5 gap-4">
        {/* ── Left Column: Video Queue Manager (70% width) ── */}
        <div className="flex-1 flex flex-col bg-[#090d16]/85 backdrop-blur-2xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl min-w-0">
          {/* Queue Header & Actions */}
          <div className="p-3 px-4 bg-[#0c1220]/70 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileVideo className="w-4 h-4 text-emerald-400" />
                <span>បញ្ជីវីដេអូរឿងភាគ (Video Queue)</span>
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {selectedCount} / {episodes.length} បានជ្រើស
              </span>
            </div>

            <div className="flex items-center gap-2">
              {episodes.length > 0 && (
                <>
                  <button
                    onClick={() => handleSelectAll(selectedCount < episodes.length)}
                    className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                  >
                    {selectedCount === episodes.length ? (
                      <>
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                        <span>ដោះជ្រើស</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ជ្រើសទាំងអស់</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleClearAll}
                    className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                    title="សម្អាតបញ្ជី"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>លុបទាំងអស់</span>
                  </button>
                </>
              )}

              {/* Upload Multi-Video Button */}
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer transition-all shadow-md shadow-emerald-500/20 active:scale-95">
                <Upload className="w-3.5 h-3.5" />
                <span>+ បន្ថែមវីដេអូ (១-២០)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="video/*,.mkv,.mp4,.avi,.mov,.ts"
                  onChange={handleBatchFilesUpload}
                  className="hidden"
                />
              </label>

              {episodes.length === 0 && (
                <button
                  onClick={handleLoadSample20Episodes}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 text-xs font-semibold border border-white/[0.1] transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>ដាក់គំរូ ២០ ភាគ</span>
                </button>
              )}
            </div>
          </div>

          {/* Episode List Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
            {episodes.length === 0 ? (
              /* Sleek Empty State Dropzone */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 min-h-[300px] border-2 border-dashed border-white/[0.12] hover:border-emerald-500/50 rounded-2xl flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all bg-white/[0.01] hover:bg-emerald-500/[0.03] group"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 group-hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 transition-transform group-hover:scale-110 shadow-lg shadow-emerald-500/10">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  ចុចទីនេះដើម្បីជ្រើសរើសវីដេអូ (១ ដល់ ២០ ភាគ)
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  គាំទ្រ File វីដេអូ MP4, MKV, MOV, TS កម្រិតច្បាស់ Full HD / 2K / 4K
                </p>
                <div className="flex items-center gap-2">
                  <span className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20">
                    + ជ្រើសរើស File ពីកុំព្យូទ័រ
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadSample20Episodes();
                    }}
                    className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 text-xs font-semibold border border-white/[0.1]"
                  >
                    ✨ ផ្ទុកគំរូ ២០ ភាគសាកល្បង
                  </button>
                </div>
              </div>
            ) : (
              /* Clean, Elegant Episode Cards */
              episodes.map((ep) => (
                <div
                  key={ep.id}
                  className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    ep.isSelected
                      ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                      : 'bg-white/[0.02] border-white/[0.06] opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleSelectEpisode(ep.id)}
                      className="text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                    >
                      {ep.isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    {/* Episode Index Pill */}
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[11px] font-mono font-bold text-emerald-300 shrink-0">
                      {ep.episodeIndex}
                    </div>

                    {/* Title and Info */}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">
                        {ep.title}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span>{ep.filename}</span>
                        <span>•</span>
                        <span>{ep.duration || '22:30'}</span>
                        {ep.sizeMb ? (
                          <>
                            <span>•</span>
                            <span>{ep.sizeMb} MB</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Actions (Preview & Delete) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onOpenTimelineStudio(ep.url, ep.filename)}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-cyan-300 hover:text-cyan-200 text-[11px] font-semibold flex items-center gap-1 transition-all"
                      title="បើកចាក់មើលក្នុងស្ទូឌីយោ Timeline"
                    >
                      <Film className="w-3 h-3 text-cyan-400" />
                      <span className="hidden sm:inline">Timeline</span>
                    </button>

                    <button
                      onClick={() => handleRemoveEpisode(ep.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="លុបភាគនេះចេញ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Right Column: Studio Controls & Turbo Settings (30% width) ── */}
        <div className="w-full lg:w-[340px] flex flex-col gap-3.5 shrink-0">
          {/* Card 1: Mode Selector (Episodes vs Full Movie) */}
          <div className="p-4 rounded-2xl bg-[#090d16]/85 backdrop-blur-2xl border border-white/[0.08] flex flex-col gap-2.5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Tv className="w-4 h-4 text-cyan-400" />
                <span>ទម្រង់បញ្ចេញ (Output Mode)</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 bg-[#060911] p-1 rounded-xl border border-white/[0.06]">
              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, mode: 'episodes' })}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold flex flex-col items-center gap-0.5 transition-all ${
                  config.mode === 'episodes'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>ភាគដាច់ដោយឡែក</span>
                <span className="text-[9px] font-normal opacity-75">1 ដល់ 20 ភាគ</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, mode: 'full_movie' })}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold flex flex-col items-center gap-0.5 transition-all ${
                  config.mode === 'full_movie'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>ភ្ជាប់ជារឿងពេញ</span>
                <span className="text-[9px] font-normal opacity-75">Master Full Movie</span>
              </button>
            </div>
          </div>

          {/* Card 2: Hardware Turbo Threads */}
          <div className="p-4 rounded-2xl bg-[#090d16]/85 backdrop-blur-2xl border border-white/[0.08] flex flex-col gap-2.5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>កម្លាំង Hardware Multi-Threads</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                {config.turboThreads}x Cores
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1 bg-[#060911] p-1 rounded-xl border border-white/[0.06] text-center">
              {[
                { threads: 2, label: '2x', desc: 'PC ទូទៅ' },
                { threads: 4, label: '4x', desc: 'Core i5' },
                { threads: 8, label: '8x', desc: 'Core i7' },
                { threads: 16, label: '16x', desc: 'Max Speed' },
              ].map((t) => (
                <button
                  key={t.threads}
                  type="button"
                  onClick={() => onChangeConfig({ ...config, turboThreads: t.threads })}
                  className={`py-1.5 px-1 rounded-lg text-xs font-bold flex flex-col items-center transition-all ${
                    config.turboThreads === t.threads
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{t.label}</span>
                  <span className="text-[9px] font-normal opacity-80">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Card 3: Batch Summary & Start Action Button */}
          <div className="p-4 rounded-2xl bg-[#090d16]/85 backdrop-blur-2xl border border-white/[0.08] flex flex-col gap-3 shadow-xl mt-auto">
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">ចំនួនភាគជ្រើសរើស:</span>
                <span className="font-bold text-emerald-300 font-mono">
                  {selectedCount} / {episodes.length} ភាគ
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">ទម្រង់ Output:</span>
                <span className="font-bold text-white">
                  {config.mode === 'full_movie' ? '🎬 រឿងពេញ (Full Movie)' : '📺 ភាគរៀងខ្លួន'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">ម៉ាស៊ីន AI Dubbing:</span>
                <span className="font-semibold text-cyan-300">
                  ⚡ Khmer Edge TTS (Offline)
                </span>
              </div>
            </div>

            {/* Live Progress Bar during rendering */}
            {isProcessing && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-300">កំពុងបញ្ចូលសំឡេង...</span>
                  <span className="font-mono font-bold text-emerald-300">{progress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {message && <p className="text-[11px] text-slate-400 truncate">{message}</p>}
              </div>
            )}

            {/* Master Start Dubbing Button */}
            <button
              type="button"
              onClick={onStartOfflineDubbing}
              disabled={isProcessing || selectedCount === 0}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>
                {isProcessing
                  ? 'កំពុងដំណើរការ...'
                  : selectedCount === 0
                  ? 'សូមជ្រើសរើសភាគវីដេអូជាមុន'
                  : `ចាប់ផ្ដើម KHMER OFFLINE (${selectedCount} ភាគ) ➔`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
