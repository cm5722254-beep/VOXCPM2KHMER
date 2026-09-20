import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Download,
  Film,
  Sparkles,
  Subtitles,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Play,
  Pause,
  Copy,
  ExternalLink,
  RefreshCw,
  Check,
  Clock,
  Cpu,
  Layers,
  CheckCircle2,
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

interface RenderStage {
  id: number;
  label: string;
  desc: string;
  icon: string;
}

const RENDER_STAGES: RenderStage[] = [
  { id: 1, label: 'រៀបចំអក្សរ 3D', desc: 'រៀបចំចំណងជើង និងបែបផែនរូបភាព', icon: '🎨' },
  { id: 2, label: 'សមកាលកម្មអក្សររត់', desc: 'តម្រង់អក្សររត់ខ្មែរតាមឈុតវីដេអូ', icon: '📝' },
  { id: 3, label: 'ដំណើរការ Encode', desc: 'ដំណើរការ Hardware H.264 / AAC', icon: '⚡' },
  { id: 4, label: 'វីដេអូសម្រេច Master', desc: 'បង្កើតវីដេអូសម្រេចកម្រិតច្បាស់', icon: '🎬' },
];

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
  const [resolution, setResolution] = useState<'1080p' | '4k' | '720p' | 'original'>('1080p');
  const [format, setFormat] = useState('mp4');
  const [bitrate, setBitrate] = useState('high');

  // Overlays to burn permanently into video
  const hasStyleText = Boolean(videoEffects?.styleText?.title && videoEffects.styleText.title.trim().length > 0);
  const [burnTitleOverlay, setBurnTitleOverlay] = useState<boolean>(true);
  const [burnSubtitles, setBurnSubtitles] = useState<boolean>(Boolean(segments && segments.length > 0));
  const [burnWatermark, setBurnWatermark] = useState<boolean>(Boolean(videoEffects?.watermark?.enabled));

  // Rendering States
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStepText, setRenderStepText] = useState('');
  const [currentStageId, setCurrentStageId] = useState(1);
  const [renderedDownloadUrl, setRenderedDownloadUrl] = useState<string | null>(null);
  const [renderedFilename, setRenderedFilename] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<any>(null);

  // Track elapsed time during rendering
  useEffect(() => {
    if (isRendering) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRendering]);

  if (!isOpen) return null;

  const handleStartRender = async () => {
    setIsRendering(true);
    setRenderProgress(10);
    setCurrentStageId(1);
    setRenderStepText('កំពុងរៀបចំ Overlay អក្សរ 3D & Assets...');
    setRenderedDownloadUrl(null);

    try {
      // 1. Generate Transparent Overlay PNG if title or watermark or borders are requested
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
        styleText: burnTitleOverlay && videoEffects?.styleText ? { ...videoEffects.styleText, enabled: true } : undefined,
        watermark: burnWatermark && videoEffects?.watermark ? { ...videoEffects.watermark, enabled: true } : undefined,
      };

      if (burnTitleOverlay || burnWatermark || effectiveEffects.letterbox || effectiveEffects.vignette) {
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
      setCurrentStageId(2);
      setRenderStepText('កំពុងរៀបចំ Subtitle និងសមកាលកម្មសំឡេង...');

      // Small delay for smooth stage transition
      await new Promise((r) => setTimeout(r, 400));

      setRenderProgress(55);
      setCurrentStageId(3);
      setRenderStepText('FFmpeg កំពុង Encode និងបង្កប់អក្សរចូលវីដេអូ...');

      // 2. Call backend server to execute FFmpeg permanently
      const targetFilename = filename || (outputVideoUrl ? outputVideoUrl.split('/').pop() || '' : 'project.mp4');
      const response = await api.renderExportVideo({
        filename: targetFilename,
        inputVideo: outputVideoUrl || undefined,
        titleOverlayBase64,
        burnSubtitles: burnSubtitles && Boolean(segments && segments.length > 0),
        subtitles: burnSubtitles ? segments : undefined,
        resolution,
        format,
        bitrate,
      });

      if (response && response.success && response.outputVideo) {
        setRenderProgress(100);
        setCurrentStageId(4);
        setRenderStepText('Render វីដេអូបានជោគជ័យ 100%!');
        setRenderedDownloadUrl(response.outputVideo);
        setRenderedFilename(response.filename || `dubbed_${activeProjectTitle}.${format}`);

        onShowToast('🎉 Render វីដេអូបានជោគជ័យ 100%! អក្សរ 3D បានបង្កប់ជាប់សាច់វីដេអូរហូត', 'success');
      } else {
        throw new Error('Server មិនបានបញ្ជូនឯកសារវីដេអូមកវិញឡើយ');
      }
    } catch (err: any) {
      console.error('Export error:', err);
      onShowToast(`បរាជ័យក្នុងការ Render: ${err.message}`, 'error');
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
    onShowToast('📋 បានចម្លង Link វីដេអូ Master ជោគជ័យ!', 'info');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-[#0b0e17] border border-white/[0.14] rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-slate-100">
        {/* ── Modal Header ── */}
        <div className="p-4 px-6 border-b border-white/[0.08] flex items-center justify-between bg-[#070911]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/25">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-ui tracking-wide">
                <span>EXPORT STUDIO MASTER</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  PRO v3
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">នាំចេញវីដេអូកាត់ត បង្កប់អក្សរ 3D និង Subtitle ខ្មែរភ្ជាប់ជាអចិន្ត្រៃយ៍</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Modal Body Grid: Left Controls | Right Progress & Preview ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* Left Column: Configuration & Burn-in Controls (7 cols) */}
          <div className="lg:col-span-7 p-5 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-white/[0.08] text-xs">
            {/* Active Project Card */}
            <div className="bg-sky-500/[0.06] border border-sky-500/20 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <Film className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {activeProjectTitle || 'project_master.mp4'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                  <span className="text-emerald-400 font-medium">● Audio Diarization Master</span>
                  <span>•</span>
                  <span>Stereo BGM 48kHz</span>
                </div>
              </div>
            </div>

            {/* PERMANENT BURN-IN OPTIONS */}
            <div className="bg-[#070b14] border border-amber-500/30 rounded-xl p-3.5 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white text-xs">ការបង្កប់អក្សរ & Overlays (Permanent Burn-in)</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ជាប់រហូត 100%
                </span>
              </div>

              {/* 3D Title Option */}
              <label className="flex items-start gap-3 p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={burnTitleOverlay}
                  onChange={(e) => setBurnTitleOverlay(e.target.checked)}
                  className="accent-amber-500 w-4 h-4 rounded cursor-pointer mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="text-amber-400">🔥 បង្កប់អក្សរ 3D / ចំណងជើងរឿង (3D Title)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {hasStyleText ? (
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <span className="font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                          {videoEffects?.styleText?.title}
                        </span>
                        {videoEffects?.styleText?.badge && (
                          <span className="text-rose-300 bg-rose-500/15 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border border-rose-500/30">
                            {videoEffects.styleText.badge}
                          </span>
                        )}
                        <span className="text-[10.5px] text-slate-500">({videoEffects?.styleText?.stylePreset || 'gold3d'})</span>
                      </div>
                    ) : (
                      <span>យកចំណងជើងរឿង និងអក្សរមាស 3D ពីផ្ទាំង Thumbnail ឬ Effects</span>
                    )}
                  </div>
                </div>
              </label>

              {/* Subtitles Option */}
              <label className="flex items-start gap-3 p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={burnSubtitles}
                  onChange={(e) => setBurnSubtitles(e.target.checked)}
                  className="accent-purple-500 w-4 h-4 rounded cursor-pointer mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Subtitles className="w-3.5 h-3.5 text-purple-400" />
                    <span>បង្កប់អក្សររត់ក្រោមរឿងខ្មែរ (Burn Khmer Subtitles)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {segments && segments.length > 0 ? (
                      <span className="text-purple-300">មាន {segments.length} ឃ្លាសន្ទនាត្រៀមរួចរាល់សម្រាប់ Render</span>
                    ) : (
                      <span>ស្កេន និងបង្កប់អក្សរខ្មែររត់តាមឈុតរឿង</span>
                    )}
                  </div>
                </div>
              </label>

              {/* Watermark Option */}
              {videoEffects?.watermark?.text && (
                <label className="flex items-start gap-3 p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={burnWatermark}
                    onChange={(e) => setBurnWatermark(e.target.checked)}
                    className="accent-sky-500 w-4 h-4 rounded cursor-pointer mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-sky-400" />
                      <span>បង្កប់ Watermark / ឈ្មោះឆានែល ({videoEffects.watermark.text})</span>
                    </div>
                  </div>
                </label>
              )}
            </div>

            {/* Resolution Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-300 flex items-center justify-between">
                <span>កម្រិតគុណភាពវីដេអូ (Resolution)</span>
                <span className="text-[11px] text-slate-500 font-normal">ជ្រើសរើសទំហំដែលចង់បាន</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: '1080p', label: '1080p FHD', badge: 'ពេញនិយម' },
                  { id: '4k', label: '4K Cinema', badge: 'ច្បាស់បំផុត' },
                  { id: '720p', label: '720p HD', badge: 'ទំហំតូច' },
                  { id: 'original', label: 'Original', badge: 'លឿនរហ័ស' },
                ].map((res) => (
                  <button
                    key={res.id}
                    onClick={() => setResolution(res.id as any)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all ${
                      resolution === res.id
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-md shadow-sky-500/20 font-bold'
                        : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]'
                    }`}
                  >
                    <span>{res.label}</span>
                    <span className="text-[9px] opacity-70 font-normal">{res.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Format & Bitrate */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-300">ទម្រង់ឯកសារ (Format)</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="bg-[#07090e] border border-white/[0.1] text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-sky-400 cursor-pointer text-xs"
                >
                  <option value="mp4">MP4 (H.264 / AAC — គាំទ្រគ្រប់ឧបករណ៍)</option>
                  <option value="mkv">MKV (Cinema Master)</option>
                  <option value="mov">MOV (Apple QuickTime)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-300">Bitrate គុណភាពរូប</label>
                <select
                  value={bitrate}
                  onChange={(e) => setBitrate(e.target.value)}
                  className="bg-[#07090e] border border-white/[0.1] text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-sky-400 cursor-pointer text-xs"
                >
                  <option value="high">Cinema Master (CRF 19 - ខ្ពស់បំផុត)</option>
                  <option value="standard">Standard Web (CRF 22 - មធ្យម)</option>
                  <option value="fast">Fast Export (CRF 26 - រហ័ស)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Real-time Pipeline Tracker & Master Output Player (5 cols) */}
          <div className="lg:col-span-5 p-5 bg-[#080b13] flex flex-col justify-between gap-4 text-xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <span className="font-bold text-slate-200 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-sky-400" />
                  <span>RENDER PIPELINE</span>
                </span>
                {isRendering && (
                  <span className="text-[11px] font-mono text-sky-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTimer(elapsedSeconds)}</span>
                  </span>
                )}
              </div>

              {/* 4-Stage Visual Pipeline Steps */}
              <div className="space-y-2.5 mt-3">
                {RENDER_STAGES.map((stg) => {
                  const isDone = currentStageId > stg.id || (renderProgress === 100 && stg.id === 4);
                  const isCurrent = isRendering && currentStageId === stg.id;
                  return (
                    <div
                      key={stg.id}
                      className={`p-2.5 rounded-xl border transition-all flex items-center gap-3 ${
                        isCurrent
                          ? 'bg-sky-500/15 border-sky-400/50 shadow-md shadow-sky-500/15'
                          : isDone
                          ? 'bg-emerald-500/[0.08] border-emerald-500/30 text-slate-300'
                          : 'bg-white/[0.02] border-white/[0.05] text-slate-500 opacity-60'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isCurrent
                            ? 'bg-sky-500 text-black animate-pulse'
                            : isDone
                            ? 'bg-emerald-500 text-black'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : isCurrent ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : stg.id}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold text-xs ${isCurrent ? 'text-sky-300 font-bold' : isDone ? 'text-emerald-300' : 'text-slate-400'}`}>
                            {stg.icon} {stg.label}
                          </span>
                          {isCurrent && <span className="text-[10px] font-mono text-sky-400 font-bold">{renderProgress}%</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{stg.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Status / Video Preview Area */}
            <div className="flex-1 flex flex-col justify-end">
              {/* If Rendering: Glowing Progress Card */}
              {isRendering && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-sky-500/15 via-indigo-600/10 to-transparent border border-sky-400/30 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-sky-300 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                      <span className="truncate">{renderStepText}</span>
                    </span>
                    <span className="font-mono text-white text-sm font-bold">{renderProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300 shadow-sm"
                      style={{ width: `${renderProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10.5px] text-slate-400">
                    <span>⚡ GPU/CPU Multi-Thread Active</span>
                    <span className="font-mono">CRF {bitrate === 'high' ? '19' : bitrate === 'standard' ? '22' : '26'}</span>
                  </div>
                </div>
              )}

              {/* If Render Complete: In-Modal Video Player & Master Actions */}
              {renderedDownloadUrl && !isRendering && (
                <div className="p-3.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/30 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>MASTER OUTPUT READY!</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      100% COMPLETE
                    </span>
                  </div>

                  {/* Built-in Video Player Preview */}
                  <div className="w-full aspect-video rounded-lg overflow-hidden bg-black border border-white/10 relative shadow-lg">
                    <video
                      ref={previewVideoRef}
                      src={renderedDownloadUrl}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Master Actions Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={renderedDownloadUrl}
                      download={renderedFilename || 'dubbed_khmer_master.mp4'}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                    >
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>ទាញយក MP4</span>
                    </a>
                    <button
                      onClick={handleCopyLink}
                      className="py-2.5 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedLink ? 'បានចម្លង!' : 'ចម្លង Link'}</span>
                    </button>
                  </div>

                  {/* Browser Extension Safety Hint */}
                  <div className="p-2 rounded-lg bg-black/40 border border-white/[0.06] text-[10px] text-slate-400 leading-relaxed">
                    💡 <strong>គន្លឹះ៖</strong> ប្រសិនបើកុំព្យូទ័រប្រើកម្មវិធី Download Manager (ដូចជា NeatDM ឬ IDM) ហើយចង់ទាញយកផ្ទាល់តាម Browser សូមចុចគ្រាប់ចុច <kbd className="px-1 py-0.2 bg-white/10 rounded font-mono text-slate-300">Delete</kbd> លើក្តារចុចឱ្យជាប់ពេលចុចប៊ូតុង Download។
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Modal Footer Controls ── */}
        <div className="p-4 px-6 border-t border-white/[0.08] bg-[#070911] flex items-center justify-between flex-shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>ស្ថានភាព៖</span>
            {burnTitleOverlay ? (
              <span className="text-amber-400 font-medium">🔥 3D Title Enabled</span>
            ) : (
              <span className="text-slate-500">Normal Render</span>
            )}
            {burnSubtitles && <span className="text-purple-400 font-medium">• Subtitles Enabled</span>}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isRendering}
              className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
            >
              បិទផ្ទាំង
            </button>
            <button
              onClick={handleStartRender}
              disabled={isRendering}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs transition-all shadow-lg shadow-rose-600/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRendering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>កំពុង Render បង្កប់អក្សរ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>ចាប់ផ្តើម Render បង្កប់អក្សរ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
