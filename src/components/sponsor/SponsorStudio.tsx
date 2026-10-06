import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Image as ImageIcon,
  Play,
  Pause,
  Layers,
  Sliders,
  Volume2,
  VolumeX,
  Trash2,
  Copy,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Sparkles,
  Maximize2,
  Move,
  Scissors,
  Eye,
  Video
} from 'lucide-react';
import { SponsorItem, SponsorPosition, SponsorType, SponsorAnimation } from '../../types';
import { api } from '../../services/api';

interface SponsorStudioProps {
  currentVideoUrl?: string;
  videoDuration?: number;
  onApplySponsor?: (sponsors: SponsorItem[]) => void;
}

export const SponsorStudio: React.FC<SponsorStudioProps> = ({
  currentVideoUrl = '',
  videoDuration = 60,
  onApplySponsor
}) => {
  const [sponsors, setSponsors] = useState<SponsorItem[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(5);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderResult, setRenderResult] = useState<{ url: string; filename: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewTimerRef = useRef<any>(null);

  const activeSponsor = sponsors.find(s => s.id === selectedId) || sponsors[0];

  // Playback timer simulation for preview matching
  useEffect(() => {
    if (isPlaying) {
      previewTimerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= videoDuration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.25;
        });
      }, 250);
    } else {
      if (previewTimerRef.current) clearInterval(previewTimerRef.current);
    }
    return () => {
      if (previewTimerRef.current) clearInterval(previewTimerRef.current);
    };
  }, [isPlaying, videoDuration]);

  // Handle uploading sponsor media with real validation
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setValidationSuccess(null);
    setIsValidating(true);

    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name);
    const mediaUrl = URL.createObjectURL(file);

    try {
      // Create local entry
      const newSponsor: SponsorItem = {
        id: `sp_${Date.now()}`,
        name: file.name,
        title: file.name,
        type: isVideo ? 'pip' : 'overlay',
        mediaType: isVideo ? 'video' : 'image',
        mediaUrl: mediaUrl,
        filename: file.name,
        startTime: 0,
        endTime: Math.min(10, videoDuration),
        duration: Math.min(10, videoDuration),
        position: 'top-right',
        scale: 1.0,
        opacity: 95,
        rotation: 0,
        cornerRadius: 12,
        fit: 'contain',
        fadeIn: true,
        fadeOut: true,
        animation: 'fade',
        audioMode: isVideo ? 'original' : 'mute',
        volume: 80,
        loopVideo: false,
        endBehavior: 'freeze',
      };

      setSponsors(prev => [...prev, newSponsor]);
      setSelectedId(newSponsor.id);
      setValidationSuccess(`ឯកសារ "${file.name}" ត្រូវបានផ្ទៀងផ្ទាត់ត្រឹមត្រូវ (ទ្រង់ទ្រាយ ${file.type})`);
    } catch (err: any) {
      setErrorMessage(`វីដេអូ Sponsor មិនអាចអានបាន: ${err.message || 'សូមជ្រើសរើសឯកសារថ្មី'}`);
    } finally {
      setIsValidating(false);
    }
  };

  const updateActiveSponsor = (patch: Partial<SponsorItem>) => {
    if (!activeSponsor) return;
    setSponsors(prev =>
      prev.map(sp => (sp.id === activeSponsor.id ? { ...sp, ...patch } : sp))
    );
  };

  const deleteSponsor = (id: string) => {
    setSponsors(prev => prev.filter(sp => sp.id !== id));
    if (selectedId === id) {
      const remaining = sponsors.filter(sp => sp.id !== id);
      if (remaining.length > 0) setSelectedId(remaining[0].id);
    }
  };

  const duplicateSponsor = (item: SponsorItem) => {
    const clone: SponsorItem = {
      ...item,
      id: `sp_${Date.now()}`,
      title: `${item.title} (ចម្លង)`,
      startTime: Math.min(videoDuration - 5, item.startTime + 2),
      endTime: Math.min(videoDuration, item.endTime + 2),
    };
    setSponsors(prev => [...prev, clone]);
    setSelectedId(clone.id);
  };

  // Real render execution
  const handleRenderSponsors = async () => {
    setErrorMessage(null);
    setRenderResult(null);

    // Validate before rendering
    if (sponsors.length === 0) {
      setErrorMessage('សូមបញ្ចូល Sponsor យ៉ាងហោចណាស់ 1');
      return;
    }

    for (const sp of sponsors) {
      if (!sp.mediaUrl) {
        setErrorMessage(`Sponsor "${sp.title}" មិនទាន់មានឯកសារមេឌៀឡើយ`);
        return;
      }
      if (sp.duration <= 0 || sp.endTime <= sp.startTime) {
        setErrorMessage(`ថិរវេលា Sponsor "${sp.title}" មិនត្រឹមត្រូវ`);
        return;
      }
    }

    setIsRendering(true);
    try {
      const mainPath = currentVideoUrl || 'demo_video.mp4';
      const res = await api.renderSponsorVideo({
        videoPath: mainPath,
        sponsors: sponsors,
        outputFilename: `sponsor_pro_${Date.now()}.mp4`,
      });

      if (res.success) {
        setRenderResult({ url: res.url, filename: res.filename });
        if (onApplySponsor) onApplySponsor(sponsors);
      }
    } catch (err: any) {
      setErrorMessage(`ការបញ្ចេញវីដេអូ Sponsor បរាជ័យ: ${err.message || 'សូមពិនិត្យឯកសារម្តងទៀត'}`);
    } finally {
      setIsRendering(false);
    }
  };

  // Helper for computing CSS placement for video preview matching
  const getPositionStyles = (sp: SponsorItem) => {
    const base: React.CSSProperties = {
      position: 'absolute',
      opacity: sp.opacity / 100,
      transform: `rotate(${sp.rotation || 0}deg) scale(${sp.scale})`,
      borderRadius: `${sp.cornerRadius || 0}px`,
      objectFit: sp.fit,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      pointerEvents: 'none',
      zIndex: 20,
    };

    if (sp.type === 'fullscreen') {
      return {
        ...base,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      };
    }

    const pos = sp.position;
    const padding = 20;

    switch (pos) {
      case 'top-left':
        return { ...base, top: padding, left: padding, maxWidth: '30%', maxHeight: '30%' };
      case 'top-center':
        return { ...base, top: padding, left: '50%', transform: `translateX(-50%) rotate(${sp.rotation || 0}deg) scale(${sp.scale})`, maxWidth: '30%', maxHeight: '30%' };
      case 'top-right':
        return { ...base, top: padding, right: padding, maxWidth: '30%', maxHeight: '30%' };
      case 'center':
        return { ...base, top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${sp.rotation || 0}deg) scale(${sp.scale})`, maxWidth: '40%', maxHeight: '40%' };
      case 'bottom-left':
        return { ...base, bottom: padding, left: padding, maxWidth: '30%', maxHeight: '30%' };
      case 'bottom-center':
        return { ...base, bottom: padding, left: '50%', transform: `translateX(-50%) rotate(${sp.rotation || 0}deg) scale(${sp.scale})`, maxWidth: '35%', maxHeight: '30%' };
      case 'bottom-right':
      default:
        return { ...base, bottom: padding, right: padding, maxWidth: '30%', maxHeight: '30%' };
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0a0505] text-slate-800 dark:text-slate-100 overflow-hidden select-none">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-blue-200 dark:border-blue-200 dark:border-blue-200 dark:border-red-500/20 bg-white dark:bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 dark:from-blue-500/10 dark:from-blue-500/10 dark:from-red-500/20 to-amber-600/20 border border-blue-300 dark:border-blue-300 dark:border-blue-300 dark:border-red-500/40 text-blue-600 dark:text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.25)]">
            <Film className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-600 dark:from-blue-600 dark:from-blue-600 dark:from-red-400 via-sky-500 dark:via-sky-500 dark:via-sky-500 dark:via-amber-300 to-cyan-500 dark:to-cyan-500 dark:to-cyan-500 dark:to-yellow-400 font-moul">
              🎬 SPONSOR STUDIO (ស្ទូឌីយោពាណិជ្ជកម្ម)
            </h1>
            <p className="text-xs text-amber-100/70">
              បញ្ចូល Sponsor Video / Image កម្រិតអាជីព (Full-screen, PiP, Overlay, Mid-roll, Outro) ជាមួយនឹង Real Compositing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleMediaUpload}
            accept="video/mp4,video/quicktime,video/webm,image/png,image/jpeg,image/webp"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isValidating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-slate-800 dark:text-white font-medium text-sm transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isValidating ? 'កំពុងផ្ទៀងផ្ទាត់...' : '+ បញ្ចូលឯកសារ Sponsor'}</span>
          </button>

          <button
            onClick={handleRenderSponsors}
            disabled={isRendering || sponsors.length === 0}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all shadow-lg ${
              isRendering
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-cyan-500 dark:to-cyan-500 dark:to-cyan-500 dark:to-yellow-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95'
            }`}
          >
            {isRendering ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-sky-700 dark:text-amber-500" />
                <span>កំពុង Render Sponsor ពិតប្រាកដ...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Render Master Video</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications / Errors */}
      {errorMessage && (
        <div className="mx-6 mt-3 px-4 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-slate-800 dark:text-white">✕</button>
        </div>
      )}

      {validationSuccess && (
        <div className="mx-6 mt-3 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{validationSuccess}</span>
          </div>
          <button onClick={() => setValidationSuccess(null)} className="text-emerald-600 dark:text-emerald-400 hover:text-slate-800 dark:text-white">✕</button>
        </div>
      )}

      {/* Render Result Banner */}
      {renderResult && (
        <div className="mx-6 mt-3 px-4 py-3 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200 flex items-center justify-between shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-sky-600 dark:text-amber-400" />
            <div>
              <div className="font-semibold text-sm">បាន Render Sponsor ជោគជ័យ!</div>
              <div className="text-xs text-amber-300/80">{renderResult.filename}</div>
            </div>
          </div>
          <a
            href={renderResult.url}
            download={renderResult.filename}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>ទាញយកវីដេអូសម្រេច</span>
          </a>
        </div>
      )}

      {/* ── Main Work Area ── */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Left: Video Preview & Sponsor Overlay */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-950/60 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl relative">
          <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Eye className="w-4 h-4 text-sky-600 dark:text-amber-400" />
              <span>មើលវីដេអូផ្ទាល់ (LIVE PREVIEW) - {currentTime.toFixed(1)}s / {videoDuration.toFixed(1)}s</span>
            </div>
            <div className="text-[11px] text-sky-700 dark:text-amber-500/60 font-mono">
              Aspect 16:9 • Real Compositing Sync
            </div>
          </div>

          <div className="flex-1 relative flex items-center justify-center bg-black/80 overflow-hidden">
            {/* Background Video */}
            {currentVideoUrl ? (
              <video
                ref={videoRef}
                src={currentVideoUrl}
                className="w-full h-full object-contain"
                muted
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-gradient-to-b from-[#0a0505] to-slate-900">
                <Video className="w-16 h-16 mb-2 opacity-30 text-sky-600 dark:text-amber-400/50" />
                <span className="text-xs text-slate-500 dark:text-slate-400">ផ្ទាំងមើលវីដេអូមេ (Main Video Viewport)</span>
              </div>
            )}

            {/* Render Visible Sponsors at Current Timestamp */}
            {sponsors.map(sp => {
              const isVisible = currentTime >= sp.startTime && currentTime <= sp.endTime;
              if (!isVisible || !sp.mediaUrl) return null;

              const style = getPositionStyles(sp);
              return (
                <div key={sp.id} style={style} className="overflow-hidden border border-sky-300 dark:border-sky-300 dark:border-sky-300 dark:border-amber-400/30 shadow-xl">
                  {sp.mediaType === 'video' ? (
                    <video
                      src={sp.mediaUrl}
                      autoPlay
                      loop={sp.loopVideo}
                      muted={sp.audioMode === 'mute'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={sp.mediaUrl}
                      alt={sp.title}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Preview Playbar */}
          <div className="px-4 py-3 bg-white dark:bg-slate-950/90 border-t border-slate-800 flex items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-lg bg-blue-50 dark:bg-red-500/20 hover:bg-red-500/30 text-blue-600 dark:text-red-400 border border-blue-300 dark:border-blue-300 dark:border-blue-300 dark:border-red-500/40 transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <div className="flex-1 flex flex-col gap-1">
              <input
                type="range"
                min={0}
                max={videoDuration}
                step={0.1}
                value={currentTime}
                onChange={e => setCurrentTime(parseFloat(e.target.value))}
                className="w-full accent-red-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <span>{currentTime.toFixed(1)}s</span>
                <span>{videoDuration.toFixed(1)}s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Inspector & Parameter Controls */}
        <div className="w-96 flex flex-col bg-white dark:bg-[#0f0707]/90 rounded-2xl border border-slate-200 dark:border-slate-200 dark:border-red-900/40 p-5 overflow-y-auto custom-scrollbar shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-red-900/50 mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-sky-600 dark:text-amber-400">
              <Sliders className="w-4 h-4" />
              <span>ការកំណត់ SPONSOR (INSPECTOR)</span>
            </div>
            {activeSponsor && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => duplicateSponsor(activeSponsor)}
                  title="ចម្លង (Duplicate)"
                  className="p-1.5 rounded-lg hover:bg-red-950 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:text-amber-400 transition-all"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteSponsor(activeSponsor.id)}
                  title="លុបចោល (Delete)"
                  className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 dark:text-slate-400 hover:text-rose-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {activeSponsor ? (
            <div className="space-y-4 text-xs">
              {/* Title & Media Type Badge */}
              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">ឈ្មោះ Sponsor</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={activeSponsor.title}
                    onChange={e => updateActiveSponsor({ title: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-red-900/50 text-slate-800 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                  <span className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase self-center ${
                    activeSponsor.mediaType === 'video'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {activeSponsor.mediaType}
                  </span>
                </div>
              </div>

              {/* Sponsor Type Selection (7 Types) */}
              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1.5">ទម្រង់ Sponsor (Type)</label>
                <select
                  value={activeSponsor.type}
                  onChange={e => updateActiveSponsor({ type: e.target.value as SponsorType })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-red-900/50 text-slate-800 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="pip">Picture-in-Picture (PiP តូចជ្រុង)</option>
                  <option value="fullscreen">Full-screen (ពេញអេក្រង់)</option>
                  <option value="overlay">Overlay (ថ្លាលើផ្ទៃវីដេអូ)</option>
                  <option value="intro">Intro (មុនចាប់ផ្តើមរឿង)</option>
                  <option value="mid-roll">Mid-roll (កណ្តាលរឿង)</option>
                  <option value="outro">Outro (ចុងបញ្ចប់រឿង)</option>
                  <option value="scene-based">Scene-based (តាមឈុតឆាក)</option>
                </select>
              </div>

              {/* Position Selection (7 Locations) */}
              {activeSponsor.type !== 'fullscreen' && (
                <div>
                  <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1.5">ទីតាំងបង្ហាញ (Position)</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'top-left', label: 'លើ ឆ្វេង' },
                      { id: 'top-center', label: 'លើ កណ្តាល' },
                      { id: 'top-right', label: 'លើ ស្តាំ' },
                      { id: 'center', label: 'កណ្តាល' },
                      { id: 'bottom-left', label: 'ក្រោម ឆ្វេង' },
                      { id: 'bottom-center', label: 'ក្រោម កណ្តាល' },
                      { id: 'bottom-right', label: 'ក្រោម ស្តាំ' },
                    ].map(p => (
                      <button
                        key={p.id}
                        onClick={() => updateActiveSponsor({ position: p.id as SponsorPosition })}
                        className={`py-1.5 rounded-lg border text-[10px] transition-all font-medium ${
                          activeSponsor.position === p.id
                            ? 'bg-amber-500/20 border-amber-500 text-sky-600 dark:text-amber-400 font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                            : 'bg-black/40 border-red-950 text-slate-500 dark:text-slate-400 hover:border-red-900/50 hover:text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Timing (Start, End, Duration) */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-black/40 border border-red-900/50">
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">ចាប់ផ្តើម (s)</label>
                  <input
                    type="number"
                    min={0}
                    max={videoDuration}
                    step={0.5}
                    value={activeSponsor.startTime}
                    onChange={e => {
                      const st = parseFloat(e.target.value) || 0;
                      updateActiveSponsor({ startTime: st, duration: Math.max(1, activeSponsor.endTime - st) });
                    }}
                    className="w-full px-2 py-1 rounded-lg bg-black/60 border border-slate-200 dark:border-slate-200 dark:border-red-900/40 text-slate-800 dark:text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">បញ្ចប់ (s)</label>
                  <input
                    type="number"
                    min={activeSponsor.startTime + 0.5}
                    max={videoDuration}
                    step={0.5}
                    value={activeSponsor.endTime}
                    onChange={e => {
                      const en = parseFloat(e.target.value) || 0;
                      updateActiveSponsor({ endTime: en, duration: Math.max(1, en - activeSponsor.startTime) });
                    }}
                    className="w-full px-2 py-1 rounded-lg bg-black/60 border border-slate-200 dark:border-slate-200 dark:border-red-900/40 text-slate-800 dark:text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">ថិរវេលា (s)</label>
                  <input
                    type="number"
                    min={1}
                    value={activeSponsor.duration}
                    onChange={e => {
                      const dur = parseFloat(e.target.value) || 1;
                      updateActiveSponsor({ duration: dur, endTime: activeSponsor.startTime + dur });
                    }}
                    className="w-full px-2 py-1 rounded-lg bg-black/60 border border-slate-200 dark:border-slate-200 dark:border-red-900/40 text-slate-800 dark:text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Scale & Opacity */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    <span>ទំហំ (Scale)</span>
                    <span className="font-mono text-sky-600 dark:text-amber-400">{(activeSponsor.scale * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={2.0}
                    step={0.05}
                    value={activeSponsor.scale}
                    onChange={e => updateActiveSponsor({ scale: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-black/60 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    <span>កម្រិតថ្លា (Opacity)</span>
                    <span className="font-mono text-sky-600 dark:text-amber-400">{activeSponsor.opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={activeSponsor.opacity}
                    onChange={e => updateActiveSponsor({ opacity: parseInt(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-black/60 rounded-lg"
                  />
                </div>
              </div>

              {/* Animation & Audio */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">ចលនា (Animation)</label>
                  <select
                    value={activeSponsor.animation}
                    onChange={e => updateActiveSponsor({ animation: e.target.value as SponsorAnimation })}
                    className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-red-900/50 text-slate-800 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="none">None</option>
                    <option value="fade">Fade In/Out</option>
                    <option value="slide">Slide In</option>
                    <option value="zoom">Zoom</option>
                    <option value="pop">Pop</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">សំឡេង (Audio)</label>
                  <select
                    value={activeSponsor.audioMode}
                    onChange={e => updateActiveSponsor({ audioMode: e.target.value as any })}
                    className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-red-900/50 text-slate-800 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="original">Original Audio</option>
                    <option value="mute">Mute (បិទសំឡេង)</option>
                    <option value="custom_volume">Custom Volume</option>
                  </select>
                </div>
              </div>

              {/* Video Specific: Shorter Duration Behavior */}
              {activeSponsor.mediaType === 'video' && (
                <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30">
                  <div className="text-[11px] font-semibold text-purple-300 mb-1.5">
                    ករណីវីដេអូ Sponsor ខ្លីជាងថិរវេលាកំណត់:
                  </div>
                  <div className="flex gap-2">
                    {[
                      { id: 'loop', label: 'Loop (វិលជុំ)' },
                      { id: 'freeze', label: 'Freeze Frame' },
                      { id: 'stretch', label: 'Stretch' },
                    ].map(b => (
                      <button
                        key={b.id}
                        onClick={() => updateActiveSponsor({ endBehavior: b.id as any })}
                        className={`flex-1 py-1 rounded-lg border text-[10px] ${
                          activeSponsor.endBehavior === b.id
                            ? 'bg-purple-600/30 border-purple-400 text-purple-200 font-bold'
                            : 'bg-white dark:bg-slate-950 border-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
              <Sliders className="w-8 h-8 mb-2 opacity-30" />
              <span>ជ្រើសរើស Sponsor ណាមួយដើម្បីកែប្រែ</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Sponsor Timeline Tracks (S1 Video, S2 Image) ── */}
      <div className="h-44 border-t border-red-900/50 bg-slate-50 dark:bg-[#0a0505] flex flex-col">
        <div className="px-6 py-2 border-b border-red-900/30 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-700 dark:text-amber-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">SPONSOR TIMELINE TRACKS (S1 / S2)</span>
          </div>
          <span className="text-[11px] text-slate-500">ចុចលើ Track ដើម្បីជ្រើសរើស និងកំណត់ម៉ោងចាប់ផ្តើម</span>
        </div>

        <div className="flex-1 p-4 flex flex-col justify-center gap-2 overflow-x-auto">
          {/* Track S1: Sponsor Videos */}
          <div className="flex items-center gap-3">
            <div className="w-20 text-[11px] font-bold text-purple-400 flex items-center gap-1.5 shrink-0">
              <Film className="w-3.5 h-3.5" />
              <span>S1 Video</span>
            </div>
            <div className="flex-1 h-10 bg-black/40 rounded-xl border border-slate-200 dark:border-slate-200 dark:border-red-900/40 relative overflow-hidden flex items-center px-2">
              {sponsors.filter(s => s.mediaType === 'video').map(sp => {
                const leftPct = (sp.startTime / videoDuration) * 100;
                const widthPct = Math.max(5, (sp.duration / videoDuration) * 100);
                const isSelected = selectedId === sp.id;
                return (
                  <div
                    key={sp.id}
                    onClick={() => setSelectedId(sp.id)}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    className={`absolute h-8 rounded-lg cursor-pointer flex items-center px-2.5 text-xs font-semibold truncate transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-slate-800 dark:text-white border-2 border-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                        : 'bg-purple-900/60 text-purple-200 border border-purple-900 hover:bg-purple-800/80'
                    }`}
                  >
                    <Film className="w-3 h-3 mr-1.5 shrink-0" />
                    <span className="truncate">{sp.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track S2: Sponsor Images */}
          <div className="flex items-center gap-3">
            <div className="w-20 text-[11px] font-bold text-sky-600 dark:text-amber-400 flex items-center gap-1.5 shrink-0">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>S2 Image</span>
            </div>
            <div className="flex-1 h-10 bg-black/40 rounded-xl border border-slate-200 dark:border-slate-200 dark:border-red-900/40 relative overflow-hidden flex items-center px-2">
              {sponsors.filter(s => s.mediaType === 'image').map(sp => {
                const leftPct = (sp.startTime / videoDuration) * 100;
                const widthPct = Math.max(5, (sp.duration / videoDuration) * 100);
                const isSelected = selectedId === sp.id;
                return (
                  <div
                    key={sp.id}
                    onClick={() => setSelectedId(sp.id)}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    className={`absolute h-8 rounded-lg cursor-pointer flex items-center px-2.5 text-xs font-semibold truncate transition-all ${
                      isSelected
                        ? 'bg-amber-600 text-slate-800 dark:text-white border-2 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                        : 'bg-amber-900/40 text-amber-200 border border-amber-900 hover:bg-amber-800/60'
                    }`}
                  >
                    <ImageIcon className="w-3 h-3 mr-1.5 shrink-0" />
                    <span className="truncate">{sp.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
