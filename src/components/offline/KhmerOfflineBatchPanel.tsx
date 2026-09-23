import React, { useRef } from 'react';
import {
  Zap,
  Film,
  Layers,
  Cpu,
  CheckCircle2,
  Sliders,
  Sparkles,
  ArrowRight,
  Flame,
  Upload,
  Play,
  Trash2,
  CheckSquare,
  Square,
  RefreshCw,
  FolderPlus,
  Video,
  Eye,
} from 'lucide-react';
import { KhmerOfflineConfig, OfflineEpisodeItem } from '../../types';

interface KhmerOfflineBatchPanelProps {
  config: KhmerOfflineConfig;
  onChangeConfig: (newConfig: KhmerOfflineConfig) => void;
  onStartOfflineDubbing: () => void;
  isProcessing: boolean;
  progress?: number;
  message?: string;
  totalDurationText?: string;
  onSelectPreviewVideo?: (url: string, filename: string) => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const KhmerOfflineBatchPanel: React.FC<KhmerOfflineBatchPanelProps> = ({
  config,
  onChangeConfig,
  onStartOfflineDubbing,
  isProcessing,
  progress = 0,
  message = '',
  totalDurationText,
  onSelectPreviewVideo,
  onShowToast,
}) => {
  const PRESET_EPISODES = [1, 3, 5, 10, 15, 20];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure episodes array has items
  const episodes = config.episodes || [];
  const currentBatchTarget = config.batchEpisodes || 5;

  // Compute selected count
  const selectedEpisodes = episodes.filter((ep) => ep.isSelected);
  const selectedCount = selectedEpisodes.length;

  // Handle Multiple File Upload (1 to 20 videos)
  const handleBatchFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newEpisodeItems: OfflineEpisodeItem[] = [...episodes];

    files.forEach((file, idx) => {
      const slotIndex = newEpisodeItems.length + 1;
      if (slotIndex > 20) return; // Cap at 20

      const blobUrl = URL.createObjectURL(file);
      const sizeMb = parseFloat((file.size / (1024 * 1024)).toFixed(1));

      // Clean up episode number from filename if present (e.g. EP01, EP_02)
      let title = file.name.replace(/\.[^/.]+$/, '');
      if (!title.toLowerCase().includes('ep') && !title.includes('ភាគ')) {
        title = `ភាគទី ${slotIndex.toString().padStart(2, '0')} - ${title}`;
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

    // Auto-update batch episodes count if uploaded more
    const updatedCount = Math.min(20, Math.max(config.batchEpisodes, newEpisodeItems.length));
    onChangeConfig({
      ...config,
      batchEpisodes: updatedCount,
      episodes: newEpisodeItems,
    });

    onShowToast?.(`🎉 បានបញ្ចូលវីដេអូចំនួន ${files.length} ភាគចូលក្នុងបញ្ជីដោយជោគជ័យ!`, 'success');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Toggle Single Episode Selection
  const toggleSelectEpisode = (epId: string) => {
    const updated = episodes.map((ep) =>
      ep.id === epId ? { ...ep, isSelected: !ep.isSelected } : ep
    );
    onChangeConfig({ ...config, episodes: updated });
  };

  // Select All Episodes
  const handleSelectAll = (select: boolean) => {
    const updated = episodes.map((ep) => ({ ...ep, isSelected: select }));
    onChangeConfig({ ...config, episodes: updated });
    onShowToast?.(select ? 'បានជ្រើសរើសគ្រប់ភាគទាំងអស់!' : 'បានដោះការជ្រើសរើសទាំងអស់!', 'info');
  };

  // Remove Single Episode
  const handleRemoveEpisode = (epId: string) => {
    const filtered = episodes.filter((ep) => ep.id !== epId);
    // Re-index
    const reindexed = filtered.map((ep, idx) => ({
      ...ep,
      episodeIndex: idx + 1,
    }));
    onChangeConfig({ ...config, episodes: reindexed });
  };

  // Clear All Episodes
  const handleClearAll = () => {
    if (window.confirm('តើអ្នកពិតជាចង់សម្អាតបញ្ជីភាគវីដេអូទាំងអស់មែនទេ?')) {
      onChangeConfig({ ...config, episodes: [] });
      onShowToast?.('បានសម្អាតបញ្ជីភាគទាំងអស់រួចរាល់', 'info');
    }
  };

  // Auto Generate 20 Sample Episodes for Quick Testing
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
        title: `ភាគទី ${i.toString().padStart(2, '0')} - ${sampleNames[i - 1]}`,
        filename: `Battle_Through_The_Heavens_EP${i.toString().padStart(2, '0')}.mp4`,
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: `${20 + (i % 5)}:${(10 * i) % 60 < 10 ? '0' : ''}${(10 * i) % 60}`,
        sizeMb: 145 + i * 8,
        isSelected: i <= currentBatchTarget, // Select up to slider target
        status: 'ready',
      });
    }

    onChangeConfig({
      ...config,
      batchEpisodes: 20,
      episodes: samples,
    });
    onShowToast?.('🎉 បានបង្កើតគំរូវីដេអូ ២០ ភាគពេញលេញរួចរាល់! អាច Select តាមចិត្ត', 'success');
  };

  return (
    <div className="bg-gradient-to-br from-emerald-950/40 via-[#0a1410]/95 to-[#060e0a]/95 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 font-khmer shadow-[0_0_40px_rgba(16,185,129,0.15)] backdrop-blur-xl">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
            <Zap className="w-5 h-5 fill-emerald-400/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-white tracking-wide">
                OPTION 3: KHMER OFFLINE STUDIO
              </h4>
              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                ULTRA FAST • 1-20 ភាគ
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              ដំណើរការល្បឿនលឿនតាមកម្លាំង Hardware Computer អាចដាក់វីដេអូចូលពី ១ ដល់ ២០ ភាគ និង SELECT តាមចិត្ត
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-300 shadow-sm">
            <Flame className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/30" />
            <span>ឥតគិតថ្លៃ (Free Option)</span>
          </div>
        </div>
      </div>

      {/* ── Mode Selection: Episodic vs Full Movie ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onChangeConfig({ ...config, mode: 'episodes' })}
          className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all ${
            config.mode === 'episodes'
              ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400/40'
              : 'bg-black/40 border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
          }`}
        >
          <div
            className={`p-2 rounded-lg ${
              config.mode === 'episodes' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-white/5 text-slate-400'
            }`}
          >
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold font-khmer">បញ្ចូលតាមភាគ (១ ដល់ ២០ ភាគ)</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              នាំចេញឯកសារវីដេអូបំបែកតាមភាគនីមួយៗ (EP01, EP02, EP03...)
            </div>
          </div>
          {config.mode === 'episodes' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
        </button>

        <button
          type="button"
          onClick={() => onChangeConfig({ ...config, mode: 'full_movie' })}
          className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all ${
            config.mode === 'full_movie'
              ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400/40'
              : 'bg-black/40 border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
          }`}
        >
          <div
            className={`p-2 rounded-lg ${
              config.mode === 'full_movie' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-white/5 text-slate-400'
            }`}
          >
            <Film className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold font-khmer">ដាក់បញ្ចូលទាំងរឿងពេញ (Full Movie)</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              បញ្ចូលរឿងវែងៗតភ្ជាប់គ្នាតែមួយវីដេអូ Master ពេញលេញមិនដាច់
            </div>
          </div>
          {config.mode === 'full_movie' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
        </button>
      </div>

      {/* ── Batch Episodes Slider & Preset Selector ── */}
      <div className="p-3.5 rounded-xl bg-black/50 border border-emerald-500/20 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>ចំនួនភាគកំណត់ធ្វើម្ដង (Target Batch Capacity):</span>
          </label>
          <span className="text-xs font-black font-mono px-3 py-0.5 rounded-lg bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            {config.batchEpisodes} ភាគ
          </span>
        </div>

        {/* Range Slider 1 to 20 */}
        <input
          type="range"
          min={1}
          max={20}
          step={1}
          value={config.batchEpisodes}
          onChange={(e) =>
            onChangeConfig({
              ...config,
              batchEpisodes: parseInt(e.target.value, 10),
            })
          }
          className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
        />

        {/* Quick Episode Presets */}
        <div className="flex items-center justify-between gap-1.5 pt-1">
          {PRESET_EPISODES.map((ep) => (
            <button
              key={ep}
              type="button"
              onClick={() => onChangeConfig({ ...config, batchEpisodes: ep })}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold font-mono transition-all ${
                config.batchEpisodes === ep
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30 ring-1 ring-emerald-300'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              {ep} ភាគ
            </button>
          ))}
        </div>
      </div>

      {/* ── 🎬 NEW: BATCH 1-20 EPISODES VIDEO MANAGER (កន្លែងដាក់ VIDEO ចូល 20 & SELECT) ── */}
      <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/30 flex flex-col gap-3.5">
        {/* Hidden File Input for Multiple Video Uploads */}
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="video/*"
          onChange={handleBatchFilesUpload}
          className="hidden"
        />

        {/* Upload & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white">
              បញ្ជីដាក់វីដេអូចូល (Episodes Video Queue):
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              បាន SELECT ({selectedCount}/{episodes.length || config.batchEpisodes})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Multi Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow-md shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ ដាក់វីដេអូចូល (1-20 ភាគ)</span>
            </button>

            {/* Quick 20 Sample Episodes Button */}
            <button
              type="button"
              onClick={handleLoadSample20Episodes}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 text-xs font-semibold transition-all"
              title="បង្កើតបញ្ជីវីដេអូគំរូ ២០ ភាគសម្រាប់តេស្តភ្លាមៗ"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>✨ ដាក់គំរូ 20 ភាគ</span>
            </button>

            {/* Select All Toggle */}
            {episodes.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => handleSelectAll(selectedCount < episodes.length)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs transition-all"
                >
                  {selectedCount === episodes.length ? (
                    <>
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                      <span>ដោះ Select</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Select All</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition-all"
                  title="ជម្រះបញ្ជីទាំងអស់"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── 1-20 Episodes Grid / Cards ── */}
        {episodes.length === 0 ? (
          /* Empty State Dropzone */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-emerald-500/30 hover:border-emerald-400/60 rounded-xl p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer bg-emerald-500/[0.02] hover:bg-emerald-500/[0.06] transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-center">
              <div className="text-xs font-bold text-white">
                ចុចទីនេះដើម្បីជ្រើសរើសវីដេអូពី ១ ដល់ ២០ ភាគ (Select Video Files)
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                គាំទ្ររើសវីដេអូច្រើនក្នុងពេលតែមួយ (MP4, MKV, MOV, TS)
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadSample20Episodes();
                }}
                className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold hover:bg-emerald-500/30 transition-colors"
              >
                + ដាក់គំរូ 20 ភាគតេស្តសាកល្បង
              </button>
            </div>
          </div>
        ) : (
          /* Populated Episodes Grid with Selection Checkboxes */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
            {episodes.map((ep) => (
              <div
                key={ep.id}
                className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between gap-2 select-none ${
                  ep.isSelected
                    ? 'bg-emerald-500/[0.12] border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.15)] ring-1 ring-emerald-400/30'
                    : 'bg-black/40 border-white/[0.06] opacity-60 hover:opacity-100 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Selection Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleSelectEpisode(ep.id)}
                    className="flex items-center gap-1.5 text-left min-w-0 flex-1 group"
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                        ep.isSelected
                          ? 'bg-emerald-500 text-black'
                          : 'bg-white/[0.08] border border-white/20 text-transparent'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        EP {ep.episodeIndex.toString().padStart(2, '0')}
                      </span>
                    </div>
                  </button>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveEpisode(ep.id)}
                    className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-white/5 transition-colors"
                    title="លុបភាគនេះ"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Title & Info */}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate" title={ep.title}>
                    {ep.title}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center justify-between">
                    <span>{ep.duration || '24:00'}</span>
                    <span>{ep.sizeMb ? `${ep.sizeMb} MB` : '150 MB'}</span>
                  </div>
                </div>

                {/* Preview in Studio Action */}
                <div className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (ep.url && onSelectPreviewVideo) {
                        onSelectPreviewVideo(ep.url, ep.filename);
                        onShowToast?.(`កំពុងចាក់មើល: ${ep.title}`, 'info');
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 text-[10px] font-semibold transition-colors flex-1 justify-center"
                    title="ចាក់មើលក្នុង Video Player"
                  >
                    <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                    <span>ចាក់មើល</span>
                  </button>

                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      ep.isSelected
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-white/5 text-slate-500'
                    }`}
                  >
                    {ep.isSelected ? 'SELECT' : 'SKIP'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Hardware Turbo Threads Selector ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-slate-200">
              កម្លាំង Hardware កុំព្យូទ័រ (Turbo Threads):
            </div>
            <div className="text-[10px] text-slate-400">
              ជ្រើសរើសល្បឿន Multi-thread តាម CPU Core របស់ម៉ាស៊ីន
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {[
            { threads: 2, label: '2x (PC ធម្មតា)' },
            { threads: 4, label: '4x (Core i5)' },
            { threads: 8, label: '8x (Core i7)' },
            { threads: 16, label: '16x (Max Speed)' },
          ].map((th) => (
            <button
              key={th.threads}
              type="button"
              onClick={() => onChangeConfig({ ...config, turboThreads: th.threads })}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                config.turboThreads === th.threads
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              {th.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Start Action Button ── */}
      <button
        type="button"
        onClick={onStartOfflineDubbing}
        disabled={isProcessing}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs tracking-wider uppercase shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
      >
        <Zap className="w-4 h-4 fill-black" />
        <span>
          {isProcessing
            ? `កំពុងដំណើរការ KHMER OFFLINE (${progress}%)...`
            : `⚡ ចាប់ផ្ដើមដំណើរការ KHMER OFFLINE (${selectedCount || config.batchEpisodes} ភាគដែលបាន SELECT ${
                config.mode === 'full_movie' ? '• រឿងពេញ' : ''
              })`}
        </span>
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Status Progress Bar if running */}
      {isProcessing && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span>{message || 'កំពុងបង្កើតសំឡេងខ្មែរ...'}</span>
            <span className="font-mono font-bold text-emerald-300">{progress}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
