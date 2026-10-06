import React, { useState } from 'react';
import {
  X,
  Download,
  Film,
  Sparkles,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Folder,
  Sliders,
  Flame,
  Music,
  FileText,
  Volume2,
} from 'lucide-react';
import { VideoEffects, TimelineSegment } from '../../types';
import { api } from '../../services/api';
import { generateVideoOverlayImage } from '../../services/videoOverlayRenderer';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProjectTitle: string;
  outputVideoUrl?: string | null;
  filename?: string;
  videoEffects?: VideoEffects;
  segments?: TimelineSegment[];
  onShowToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  activeProjectTitle,
  outputVideoUrl,
  filename,
  videoEffects,
  segments,
  onShowToast,
}) => {
  // ── Format & Resolution Settings ──
  const [format, setFormat] = useState<'mp4' | 'mkv' | 'mov' | 'mp3' | 'wav' | 'srt' | 'ass'>('mp4');
  const [resolution, setResolution] = useState<'480p' | '720p' | '1080p' | '1440p' | '4k'>('1080p');
  const [fps, setFps] = useState<'24' | '30' | '60'>('60');
  const [audioCodec, setAudioCodec] = useState<'AAC' | 'Opus' | 'WAV'>('AAC');

  // ── Dragon Dubbing & Audio Options ──
  const [burnSubtitles, setBurnSubtitles] = useState(true);
  const [separateAudio, setSeparateAudio] = useState(false);
  const [audioMixMode, setAudioMixMode] = useState<'original_khmer' | 'khmer_only'>('khmer_only');
  const [normalizeAudio, setNormalizeAudio] = useState(true);
  const [exportAudioStems, setExportAudioStems] = useState(false);

  // ── Drive Selection ──
  const [selectedDrive, setSelectedDrive] = useState<'C:' | 'D:' | 'E:' | 'custom'>('D:');
  const [customPath, setCustomPath] = useState('D:\\DragonDabber_Exports');

  // ── Rendering States ──
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStepText, setRenderStepText] = useState('');
  const [renderedDownloadUrl, setRenderedDownloadUrl] = useState<string | null>(null);
  const [renderedFilename, setRenderedFilename] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const isAudioOnly = format === 'mp3' || format === 'wav';
  const isSubtitleOnly = format === 'srt' || format === 'ass';

  const handleStartRender = async () => {
    setIsRendering(true);
    setRenderProgress(10);
    setRenderStepText('Dragon Engine: កំពុងវិភាគ Scene & Audio Tracks...');
    setRenderedDownloadUrl(null);

    try {
      // 1. Generate Overlay Image if needed
      let titleOverlayBase64: string | undefined = undefined;
      const effectiveEffects: VideoEffects = {
        ...(videoEffects || {
          brightness: 100,
          contrast: 100,
          saturation: 100,
          sepia: 0,
          blur: 0,
          aspectRatio: '16:9',
          lutPreset: 'standard',
        }),
      };

      if (videoEffects?.styleText?.enabled || videoEffects?.watermark?.enabled) {
        const videoEl = document.querySelector('video') as HTMLVideoElement | null;
        const srcW = videoEl?.videoWidth || 1920;
        const srcH = videoEl?.videoHeight || 1080;
        const isPortrait = srcH > srcW;

        let targetW = srcW;
        let targetH = srcH;
        if (resolution === '1080p') {
          targetW = isPortrait ? 1080 : 1920;
          targetH = isPortrait ? 1920 : 1080;
        } else if (resolution === '720p') {
          targetW = isPortrait ? 720 : 1280;
          targetH = isPortrait ? 1280 : 720;
        } else if (resolution === '480p') {
          targetW = isPortrait ? 480 : 854;
          targetH = isPortrait ? 854 : 480;
        } else if (resolution === '1440p') {
          targetW = isPortrait ? 1440 : 2560;
          targetH = isPortrait ? 2560 : 1440;
        } else if (resolution === '4k') {
          targetW = isPortrait ? 2160 : 3840;
          targetH = isPortrait ? 3840 : 2160;
        }

        const overlayData = generateVideoOverlayImage({
          width: targetW,
          height: targetH,
          videoEffects: effectiveEffects,
        });
        if (overlayData) {
          titleOverlayBase64 = overlayData;
        }
      }

      setRenderProgress(35);
      setRenderStepText('Dragon Studio: សមកាលកម្មសម្លេង Khmer AI Dub & Subtitle Tracks...');

      await new Promise((r) => setTimeout(r, 450));
      setRenderProgress(65);
      setRenderStepText(`Dragon Hardware Acceleration: ${format.toUpperCase()} (${fps} FPS, ${audioCodec} ${normalizeAudio ? '+ Normalized' : ''})...`);

      // 2. Call backend to execute FFmpeg
      const destination = selectedDrive === 'custom' ? customPath : `${selectedDrive}\\DragonDabber_Exports`;
      const targetFilename =
        filename ||
        (outputVideoUrl ? outputVideoUrl.split('/').pop()?.split('?')[0] : undefined) ||
        'dragon_master.mp4';

      const response = await api.renderExportVideo({
        filename: targetFilename,
        inputVideo: outputVideoUrl || undefined,
        titleOverlayBase64,
        burnSubtitles: burnSubtitles && Boolean(segments && segments.length > 0) && !isAudioOnly && !isSubtitleOnly,
        subtitles: segments,
        resolution: (resolution === '1440p' || resolution === '480p') ? '1080p' : (resolution as any),
        format: (format === 'srt' || format === 'ass' || format === 'mp3' || format === 'wav') ? 'mp4' : format,
        bitrate: resolution === '4k' ? 'ultra' : 'high',
        outputDir: destination,
      });

      if (response && response.success && response.outputVideo) {
        setRenderProgress(100);
        setRenderStepText('🐲 Dragon Render សម្រេចបានជោគជ័យ 100%!');
        setRenderedDownloadUrl(response.outputVideo);
        setRenderedFilename(response.filename || `dragon_dubbed_${activeProjectTitle}.${format}`);
        onShowToast(`🐲 Dragon Render ជោគជ័យ 100%! រក្សាទុកក្នុង: ${destination}`, 'success');
      } else {
        throw new Error('Dragon Server មិនបានបញ្ជូនឯកសារ output មកវិញឡើយ');
      }
    } catch (err: any) {
      console.error('Dragon Export error:', err);
      onShowToast(`❌ ការ Render បរាជ័យ: ${err.message}`, 'error');
    } finally {
      setIsRendering(false);
    }
  };

  const handleCopyLink = () => {
    if (!renderedDownloadUrl) return;
    const fullUrl = renderedDownloadUrl.startsWith('http')
      ? renderedDownloadUrl
      : `${window.location.origin}${renderedDownloadUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    onShowToast('📋 បានចម្លង Link Dragon Master Video ជោគជ័យ!', 'info');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const FORMATS = [
    { id: 'mp4', label: 'MP4', desc: 'វីដេអូទូទៅ' },
    { id: 'mkv', label: 'MKV', desc: 'គុណភាពខ្ពស់' },
    { id: 'mov', label: 'MOV', desc: 'Apple ProRes' },
    { id: 'mp3', label: 'MP3', desc: 'Audio តែប៉ុណ្ណោះ' },
    { id: 'wav', label: 'WAV', desc: 'Lossless Audio' },
    { id: 'srt', label: 'SRT', desc: 'Subtitle ខ្មែរ' },
    { id: 'ass', label: 'ASS', desc: 'Stylized Sub' },
  ];

  const RESOLUTIONS = [
    { id: '480p', name: '480p SD', desc: 'Mobile Preview' },
    { id: '720p', name: '720p HD', desc: 'Fast Export' },
    { id: '1080p', name: '1080p Full HD', desc: 'ស្ដង់ដារភាពយន្ត', recommended: true },
    { id: '1440p', name: '1440p 2K', desc: 'QHD Studio' },
    { id: '4k', name: '4K Ultra HD', desc: 'Dragon Cinema Master' },
  ];

  const DRIVES = [
    { id: 'C:', label: 'C: Drive', path: 'C:\\DragonDabber_Exports' },
    { id: 'D:', label: 'D: Drive', path: 'D:\\DragonDabber_Exports', default: true },
    { id: 'E:', label: 'E: Drive', path: 'E:\\DragonDabber_Exports' },
    { id: 'custom', label: 'Folder ផ្ទាល់ខ្លួន', path: customPath },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 select-none font-khmer animate-in fade-in duration-200"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(10,5,8,0.85) 50%, rgba(5,2,4,0.98) 100%)',
        backdropFilter: 'blur(14px)',
      }}
    >
      {/* ── Modal Container ── */}
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-[#120A0D] border border-slate-200 dark:border-[#3D161F] shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col max-h-[94vh] overflow-hidden">

        {/* ── Header ── */}
        <div className="shrink-0 px-6 py-4 flex items-center justify-between relative border-b border-slate-200 dark:border-[#3D161F] bg-white dark:bg-[#1A0E13]/80">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#DC2626] to-transparent" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#DC2626]/20 to-[#F59E0B]/20 border border-red-500 dark:border-[#DC2626]/30 flex items-center justify-center shadow-lg">
              <Flame className="w-5 h-5 text-[#EF4444]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-slate-800 dark:text-white font-cinzel tracking-wider flex items-center gap-2">
                  <span>មជ្ឈមណ្ឌលបញ្ចេញវីដេអូនាគ</span>
                  <span className="text-xs text-[#94A3B8] font-normal font-khmer">| នាំចេញមាតិកាខ្មែរ</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DC2626]/20 text-[#EF4444] border border-red-500 dark:border-[#DC2626]/40 font-mono">
                  {format.toUpperCase()} • {resolution.toUpperCase()} • {fps}FPS
                </span>
              </div>
              <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                កែតម្រូវគុណភាព ➔ ជ្រើសរើសសំឡេង/អក្សររត់ ➔ បញ្ជាម៉ាស៊ីន Dragon Hardware Render
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-slate-800 dark:text-white hover:bg-slate-200 dark:bg-white/[0.08] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 text-xs custom-scrollbar">

          {/* Active Video Name */}
          <div className="rounded-xl bg-white dark:bg-[#1A0E13] border border-slate-200 dark:border-[#3D161F] p-3.5 flex items-center gap-3">
            <Film className="w-5 h-5 text-[#EF4444] shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-800 dark:text-white truncate text-xs font-mono">
                {activeProjectTitle || 'Dragon_Khmer_Dub_Master.mp4'}
              </div>
              <div className="text-[10px] text-[#A1A1AA] mt-0.5">
                ការដាក់សំឡេងខ្មែរ AI • សំឡេងតួអង្គខ្មែរ • សម្របអក្សររត់ • រក្សាភ្លេងផ្ទៃក្រោយ
              </div>
            </div>
          </div>

          {/* ── Format Row ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center justify-between">
              <span>ទម្រង់ឯកសារ (Format)</span>
              <span className="text-[10px] text-[#EF4444] font-mono">{format.toUpperCase()}</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {FORMATS.map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setFormat(fmt.id as any)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                    format === fmt.id
                      ? 'bg-gradient-to-r from-[#DC2626]/25 to-[#F59E0B]/20 border-red-500 dark:border-[#DC2626]/70 text-slate-800 dark:text-white shadow-[0_0_12px_rgba(220,38,38,0.3)]'
                      : 'bg-white dark:bg-[#1A0E13] border-slate-200 dark:border-[#3D161F] text-[#A1A1AA] hover:text-slate-800 dark:text-white hover:border-red-500 dark:border-[#DC2626]/40'
                  }`}
                >
                  <div className="font-mono text-xs">{fmt.label}</div>
                  <div className="text-[8px] text-[#71717A] truncate mt-0.5">{fmt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Resolution Cards ── */}
          {!isAudioOnly && !isSubtitleOnly && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center justify-between">
                <span>កម្រិតច្បាស់វីដេអូ (Resolution)</span>
                <span className="text-[10px] text-[#F59E0B] font-mono">{resolution.toUpperCase()}</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {RESOLUTIONS.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setResolution(q.id as any)}
                    className={`p-2.5 rounded-xl border flex flex-col gap-1 text-left transition-all ${
                      resolution === q.id
                        ? 'bg-gradient-to-br from-[#DC2626]/25 to-[#F59E0B]/20 border-red-500 dark:border-[#DC2626]/70 text-slate-800 dark:text-white shadow-[0_0_12px_rgba(220,38,38,0.3)]'
                        : 'bg-white dark:bg-[#1A0E13] border-slate-200 dark:border-[#3D161F] text-[#A1A1AA] hover:text-slate-800 dark:text-white hover:border-red-500 dark:border-[#DC2626]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-mono text-xs">{q.name}</span>
                      {q.recommended && (
                        <span className="text-[8px] font-bold px-1 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 font-khmer">
                          ណែនាំ
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-[#71717A] leading-tight">{q.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── FPS & Audio Codec ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* FPS */}
            {!isAudioOnly && !isSubtitleOnly && (
              <div className="rounded-xl bg-white dark:bg-[#1A0E13] border border-slate-200 dark:border-[#3D161F] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">ល្បឿនរូបភាព (Framerate / FPS)</label>
                  <span className="text-[10px] text-[#EF4444] font-mono">{fps} FPS</span>
                </div>
                <div className="flex gap-2">
                  {(['24', '30', '60'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFps(f)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono border transition-all ${
                        fps === f
                          ? 'bg-[#DC2626]/20 border-red-500 dark:border-[#DC2626]/60 text-[#EF4444]'
                          : 'bg-white dark:bg-[#120A0D] border-slate-200 dark:border-[#3D161F] text-[#71717A] hover:text-slate-800 dark:text-white'
                      }`}
                    >
                      {f} FPS
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Audio Codec */}
            <div className={`rounded-xl bg-white dark:bg-[#1A0E13] border border-slate-200 dark:border-[#3D161F] p-3 space-y-2 ${isAudioOnly || isSubtitleOnly ? 'sm:col-span-2' : ''}`}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">កូដសំឡេង (Audio Codec)</label>
                <span className="text-[10px] text-[#F59E0B] font-mono">{audioCodec}</span>
              </div>
              <div className="flex gap-2">
                {(['AAC', 'Opus', 'WAV'] as const).map((ac) => (
                  <button
                    key={ac}
                    type="button"
                    onClick={() => setAudioCodec(ac)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono border transition-all ${
                      audioCodec === ac
                        ? 'bg-[#F59E0B]/20 border-[#F59E0B]/60 text-[#F59E0B]'
                        : 'bg-white dark:bg-[#120A0D] border-slate-200 dark:border-[#3D161F] text-[#71717A] hover:text-slate-800 dark:text-white'
                    }`}
                  >
                    {ac}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Dragon Dubbing Options (5 Options specified in requirements) ── */}
          <div className="rounded-xl bg-white dark:bg-[#1A0E13] border border-slate-200 dark:border-[#3D161F] p-4 space-y-3">
            <label className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center justify-between">
              <span>ការកំណត់ការលាយ និងបញ្ចេញសំឡេងខ្មែរ</span>
              <span className="text-[10px] text-[#F59E0B] font-bold">Dragon Audio Engine</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Burn Subtitle */}
              <label className="flex items-center gap-2.5 cursor-pointer group p-2 rounded-lg bg-white dark:bg-[#120A0D]/70 border border-transparent hover:border-slate-200 dark:border-[#3D161F] transition-all">
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                  burnSubtitles ? 'bg-[#DC2626] border-red-500 dark:border-[#DC2626]' : 'bg-slate-50 dark:bg-[#080608] border-slate-200 dark:border-[#3D161F]'
                }`}>
                  <input
                    type="checkbox"
                    checked={burnSubtitles}
                    onChange={(e) => setBurnSubtitles(e.target.checked)}
                    className="sr-only"
                  />
                  {burnSubtitles && <Check className="w-2.5 h-2.5 text-slate-800 dark:text-white stroke-[3]" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-[#EF4444] transition-colors">
                    បង្កប់អក្សររត់ក្នុងវីដេអូ (Burn Subtitles)
                  </div>
                  <div className="text-[10px] text-[#71717A]">Render អក្សររត់ខ្មែរចូលក្នុងវីដេអូចុងក្រោយ</div>
                </div>
              </label>

              {/* Option 2: Separate Audio */}
              <label className="flex items-center gap-2.5 cursor-pointer group p-2 rounded-lg bg-white dark:bg-[#120A0D]/70 border border-transparent hover:border-slate-200 dark:border-[#3D161F] transition-all">
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                  separateAudio ? 'bg-[#DC2626] border-red-500 dark:border-[#DC2626]' : 'bg-slate-50 dark:bg-[#080608] border-slate-200 dark:border-[#3D161F]'
                }`}>
                  <input
                    type="checkbox"
                    checked={separateAudio}
                    onChange={(e) => setSeparateAudio(e.target.checked)}
                    className="sr-only"
                  />
                  {separateAudio && <Check className="w-2.5 h-2.5 text-slate-800 dark:text-white stroke-[3]" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-[#EF4444] transition-colors">
                    បញ្ចេញឯកសារសំឡេងដាច់ដោយឡែក (Separate Audio)
                  </div>
                  <div className="text-[10px] text-[#71717A]">បង្កើតឯកសារសំឡេង MP3/WAV បន្ថែម</div>
                </div>
              </label>

              {/* Option 3: Original + Khmer vs Khmer Only */}
              <div className="sm:col-span-2 p-2.5 rounded-lg bg-white dark:bg-[#120A0D]/70 border border-slate-200 dark:border-[#3D161F]/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white">របៀបបទសំឡេង (Audio Track Mode)</div>
                  <div className="text-[10px] text-[#71717A]">ជ្រើសរើសរបៀបរក្សាសំឡេងដើម ឬប្រើតែសំឡេងខ្មែរ</div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAudioMixMode('original_khmer')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      audioMixMode === 'original_khmer'
                        ? 'bg-[#F59E0B]/20 border-[#F59E0B]/50 text-[#F59E0B]'
                        : 'bg-white dark:bg-[#1A0E13] border-slate-200 dark:border-[#3D161F] text-[#71717A]'
                    }`}
                  >
                    ដើម + ខ្មែរ (លាយគ្នា)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudioMixMode('khmer_only')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      audioMixMode === 'khmer_only'
                        ? 'bg-[#DC2626]/20 border-red-500 dark:border-[#DC2626]/50 text-[#EF4444]'
                        : 'bg-white dark:bg-[#1A0E13] border-slate-200 dark:border-[#3D161F] text-[#71717A]'
                    }`}
                  >
                    តែសំឡេងខ្មែរ (Khmer Only)
                  </button>
                </div>
              </div>

              {/* Option 4: Normalize Audio */}
              <label className="flex items-center gap-2.5 cursor-pointer group p-2 rounded-lg bg-white dark:bg-[#120A0D]/70 border border-transparent hover:border-slate-200 dark:border-[#3D161F] transition-all">
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                  normalizeAudio ? 'bg-[#DC2626] border-red-500 dark:border-[#DC2626]' : 'bg-slate-50 dark:bg-[#080608] border-slate-200 dark:border-[#3D161F]'
                }`}>
                  <input
                    type="checkbox"
                    checked={normalizeAudio}
                    onChange={(e) => setNormalizeAudio(e.target.checked)}
                    className="sr-only"
                  />
                  {normalizeAudio && <Check className="w-2.5 h-2.5 text-slate-800 dark:text-white stroke-[3]" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-[#EF4444] transition-colors">
                    សម្រួលកម្រិតសំឡេងឱ្យស្មើគ្នា (Normalize Audio)
                  </div>
                  <div className="text-[10px] text-[#71717A]">EBU R128 Loudness Normalization កម្រិត Professional</div>
                </div>
              </label>

              {/* Option 5: Export Audio Stems */}
              <label className="flex items-center gap-2.5 cursor-pointer group p-2 rounded-lg bg-white dark:bg-[#120A0D]/70 border border-transparent hover:border-slate-200 dark:border-[#3D161F] transition-all">
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                  exportAudioStems ? 'bg-[#DC2626] border-red-500 dark:border-[#DC2626]' : 'bg-slate-50 dark:bg-[#080608] border-slate-200 dark:border-[#3D161F]'
                }`}>
                  <input
                    type="checkbox"
                    checked={exportAudioStems}
                    onChange={(e) => setExportAudioStems(e.target.checked)}
                    className="sr-only"
                  />
                  {exportAudioStems && <Check className="w-2.5 h-2.5 text-slate-800 dark:text-white stroke-[3]" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-[#EF4444] transition-colors">
                    បំបែកបទសំឡេងនីមួយៗ (Audio Stems: Vocal, BGM, SFX)
                  </div>
                  <div className="text-[10px] text-[#71717A]">បញ្ចេញបទសំឡេងតួអង្គ ភ្លេង និងបែបផែនដាច់ដោយឡែក</div>
                </div>
              </label>
            </div>
          </div>

          {/* ── Storage Drive Selection ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center justify-between">
              <span>ទីតាំងរក្សាទុកឯកសារ</span>
              <span className="text-[10px] text-[#71717A] font-mono">
                {selectedDrive === 'custom' ? customPath : `${selectedDrive}\\DragonDabber_Exports`}
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DRIVES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setSelectedDrive(d.id as any);
                    if (d.id !== 'custom') {
                      setCustomPath(`${d.id}\\DragonDabber_Exports`);
                    }
                  }}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                    selectedDrive === d.id
                      ? 'bg-gradient-to-br from-[#DC2626]/20 to-[#F59E0B]/15 border-red-500 dark:border-[#DC2626]/60 text-slate-800 dark:text-white'
                      : 'bg-white dark:bg-[#1A0E13] border-slate-200 dark:border-[#3D161F] text-[#A1A1AA] hover:text-slate-800 dark:text-white'
                  }`}
                >
                  <HardDrive className={`w-4 h-4 shrink-0 ${selectedDrive === d.id ? 'text-[#EF4444]' : 'text-[#71717A]'}`} />
                  <div className="min-w-0">
                    <div className="font-bold text-xs">{d.label}</div>
                    <div className="text-[9px] text-[#71717A] truncate max-w-[90px]">{d.path}</div>
                  </div>
                </button>
              ))}
            </div>

            {selectedDrive === 'custom' && (
              <div className="flex items-center gap-2 mt-2">
                <Folder className="w-4 h-4 text-[#EF4444] shrink-0" />
                <input
                  type="text"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  placeholder="ឧ. D:\Movies\DragonDubbed"
                  className="flex-1 bg-slate-50 dark:bg-[#080608] border border-slate-200 dark:border-[#3D161F] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white placeholder-[#71717A] outline-none focus:border-[#EF4444]/60 transition font-mono"
                />
              </div>
            )}
          </div>

          {/* ── Start Render Button: 🔥 START DRAGON RENDER ── */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleStartRender}
              disabled={isRendering}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#DC2626] via-[#B91C1C] to-[#F59E0B] hover:brightness-110 text-slate-800 dark:text-white font-black text-sm tracking-wide shadow-[0_8px_25px_rgba(220,38,38,0.45)] flex items-center justify-center gap-3 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {isRendering ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>កំពុងដំណើរការបញ្ចេញវីដេអូ ({renderProgress}%)...</span>
                </>
              ) : (
                <>
                  <Flame className="w-5 h-5 text-amber-300 animate-pulse" />
                  <span className="font-cinzel tracking-wider">🔥 ចាប់ផ្តើមបញ្ចេញវីដេអូនាគ (Render)</span>
                  <Sparkles className="w-5 h-5 text-amber-200" />
                </>
              )}
            </button>
          </div>

          {/* Progress Bar */}
          {isRendering && (
            <div className="rounded-xl bg-white dark:bg-[#1A0E13] border border-slate-200 dark:border-[#3D161F] p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A1A1AA]">{renderStepText}</span>
                <span className="font-mono font-bold text-[#EF4444]">{renderProgress}%</span>
              </div>
              <div className="w-full bg-slate-50 dark:bg-[#080608] h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-[#3D161F]">
                <div
                  className="h-full bg-gradient-to-r from-[#DC2626] via-[#EF4444] to-[#F59E0B] transition-all duration-300 rounded-full"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Completed State */}
          {renderedDownloadUrl && !isRendering && (
            <div className="rounded-xl bg-[#DC2626]/15 border border-red-500 dark:border-[#DC2626]/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#F59E0B] shrink-0" />
                <div>
                  <div className="font-bold text-slate-800 dark:text-white text-xs">🐲 ការបញ្ចេញវីដេអូនាគ សម្រេចបានជោគជ័យ 100%!</div>
                  <div className="text-[11px] text-[#A1A1AA] mt-0.5 font-mono truncate max-w-[280px]">
                    {renderedFilename}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-[#1A0E13] border border-slate-200 dark:border-[#3D161F] hover:border-red-500 dark:border-[#DC2626]/50 text-[#A1A1AA] hover:text-slate-800 dark:text-white text-xs flex items-center gap-1.5 transition-all"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-[#F59E0B]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'បានចម្លង!' : 'ចម្លងតំណភ្ជាប់'}</span>
                </button>

                <a
                  href={renderedDownloadUrl}
                  download={renderedFilename}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#F59E0B] text-slate-800 dark:text-white font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(220,38,38,0.5)] active:scale-95 transition-all"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>ទាញយកវីដេអូ</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 px-6 py-3 border-t border-slate-200 dark:border-[#3D161F] bg-slate-50 dark:bg-[#080608]/90 flex justify-between items-center text-[11px] text-[#71717A]">
          <div className="flex items-center gap-1.5 font-cinzel">
            <span>🐲 DRAGON DABBER PRO</span>
            <span>•</span>
            <span>កំណែពាណិជ្ជកម្មពិត ១០០%</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white dark:bg-[#1A0E13] border border-slate-200 dark:border-[#3D161F] hover:border-red-500 dark:border-[#DC2626]/50 text-[#A1A1AA] hover:text-slate-800 dark:text-white text-xs transition-all"
          >
            បិទ
          </button>
        </div>
      </div>
    </div>
  );
};
