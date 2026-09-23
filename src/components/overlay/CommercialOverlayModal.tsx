import React, { useState } from 'react';
import {
  X,
  Tv,
  Upload,
  Sparkles,
  CheckCircle2,
  Volume2,
  Sliders,
  Clock,
  Layers,
  Eye,
} from 'lucide-react';
import { CommercialOverlayConfig } from '../../types';

interface CommercialOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CommercialOverlayConfig;
  onChangeConfig: (config: CommercialOverlayConfig) => void;
  mainVideoSrc?: string;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const CommercialOverlayModal: React.FC<CommercialOverlayModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  mainVideoSrc,
  onShowToast,
}) => {
  const [localConfig, setLocalConfig] = useState<CommercialOverlayConfig>(config);
  const [videoInputUrl, setVideoInputUrl] = useState(config.videoUrl || '');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setVideoInputUrl(url);
    const updated: CommercialOverlayConfig = {
      ...localConfig,
      enabled: true,
      videoUrl: url,
      originalFilename: file.name,
    };
    setLocalConfig(updated);
    onShowToast?.(`បានផ្ទុកឡើងវីដេអូពាណិជ្ជកម្ម: ${file.name}`, 'success');
  };

  const handleSave = () => {
    const finalConfig: CommercialOverlayConfig = {
      ...localConfig,
      videoUrl: videoInputUrl.trim(),
    };
    onChangeConfig(finalConfig);
    onShowToast?.('🎉 បានរក្សាទុកការកំណត់ Video Overlay ពាណិជ្ជកម្មជោគជ័យ!', 'success');
    onClose();
  };

  // Position Classes for Preview
  const getPositionClass = (pos: CommercialOverlayConfig['position']) => {
    switch (pos) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'center':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  // Size Classes for Preview
  const getSizeClass = (size: CommercialOverlayConfig['size']) => {
    switch (size) {
      case 'small':
        return 'w-28';
      case 'medium':
        return 'w-44';
      case 'large':
        return 'w-60';
      case 'half':
        return 'w-80';
      default:
        return 'w-44';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 select-none font-khmer animate-in fade-in duration-200">
      <div className="bg-[#0b0f19] border border-amber-500/30 rounded-2xl w-full max-w-4xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.2)] flex flex-col max-h-[92vh]">
        {/* ── Modal Header ── */}
        <div className="p-4 px-6 border-b border-white/[0.08] flex items-center justify-between bg-[#070a13]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-black shadow-lg shadow-amber-500/30">
              <Tv className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  COMMERCIAL VIDEO OVERLAY (ADS & SPONSOR)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  MONETIZATION
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                ដាក់វីដេអូផ្សាយពាណិជ្ជកម្ម Sponsor ពីលើសាច់រឿង (Picture-in-Picture)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Modal Body: Left Controls | Right Live Preview ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* Left Controls (6 cols) */}
          <div className="lg:col-span-6 p-5 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-white/[0.08] text-xs">
            {/* Enable Toggle Switch */}
            <div className="p-3.5 rounded-xl bg-amber-500/[0.08] border border-amber-500/25 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
                <div>
                  <div className="font-bold text-white">បើកដំណើរការ Video Overlay</div>
                  <div className="text-[10px] text-slate-400">
                    បង្ហាញវីដេអូពាណិជ្ជកម្មលើវីដេអូដើម
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.enabled}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, enabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>

            {/* Video File Upload / URL Input */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-slate-300 flex items-center justify-between">
                <span>ជ្រើសរើសវីដេអូពាណិជ្ជកម្ម (Upload Ad Video):</span>
                {localConfig.originalFilename && (
                  <span className="text-[10px] text-amber-300 truncate max-w-[160px]">
                    {localConfig.originalFilename}
                  </span>
                )}
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="URL ឬផ្លូវវីដេអូ..."
                  value={videoInputUrl}
                  onChange={(e) => setVideoInputUrl(e.target.value)}
                  className="flex-1 bg-[#070a13] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 outline-none"
                />

                <label className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>ផ្ទុកឡើង</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Position Selector */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-slate-300">ទីតាំងបង្ហាញ (Position):</label>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                {[
                  { id: 'top-left', label: 'ជ្រុងលើឆ្វេង' },
                  { id: 'center', label: 'ចំកណ្ដាល' },
                  { id: 'top-right', label: 'ជ្រុងលើស្ដាំ' },
                  { id: 'bottom-left', label: 'ជ្រុងក្រោមឆ្វេង' },
                  { id: 'bottom-right', label: 'ជ្រុងក្រោមស្ដាំ' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() =>
                      setLocalConfig({
                        ...localConfig,
                        position: pos.id as CommercialOverlayConfig['position'],
                      })
                    }
                    className={`py-2 px-1 rounded-lg border font-semibold transition-all ${
                      localConfig.position === pos.id
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                        : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-slate-300">ទំហំវីដេអូពាណិជ្ជកម្ម (Size):</label>
              <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                {[
                  { id: 'small', label: 'តូច (15%)' },
                  { id: 'medium', label: 'មធ្យម (25%)' },
                  { id: 'large', label: 'ធំ (35%)' },
                  { id: 'half', label: 'ពាក់កណ្ដាល (50%)' },
                ].map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() =>
                      setLocalConfig({
                        ...localConfig,
                        size: sz.id as CommercialOverlayConfig['size'],
                      })
                    }
                    className={`py-1.5 px-1 rounded-lg border font-semibold transition-all ${
                      localConfig.size === sz.id
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                        : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders: Start Time & Duration */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>ចាប់ផ្ដើមត្រង់ (Start):</span>
                  <span className="text-amber-300 font-mono font-bold">
                    {localConfig.startTime}s
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={600}
                  step={5}
                  value={localConfig.startTime}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      startTime: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>រយៈពេលបង្ហាញ (Duration):</span>
                  <span className="text-amber-300 font-mono font-bold">
                    {localConfig.duration === 0 ? 'រហូតចប់' : `${localConfig.duration}s`}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={120}
                  step={5}
                  value={localConfig.duration}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      duration: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Opacity & Volume */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>ភាពថ្លា (Opacity):</span>
                  <span className="text-amber-300 font-mono font-bold">
                    {localConfig.opacity}%
                  </span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={100}
                  step={5}
                  value={localConfig.opacity}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      opacity: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>កម្រិតសំឡេង Ad (Volume):</span>
                  <span className="text-amber-300 font-mono font-bold">
                    {localConfig.volume}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={localConfig.volume}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      volume: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Right Live Visual Simulation (6 cols) */}
          <div className="lg:col-span-6 p-5 flex flex-col items-center justify-center bg-black/50 relative min-h-[300px]">
            <div className="text-[11px] text-slate-400 mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>ការបង្ហាញជាក់ស្ដែង (Live Simulation):</span>
            </div>

            <div className="relative w-full aspect-video bg-slate-950 rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
              {/* Main background mockup or video */}
              {mainVideoSrc ? (
                <video
                  src={mainVideoSrc}
                  className="w-full h-full object-cover opacity-60"
                  muted
                  autoPlay
                  loop
                />
              ) : (
                <div className="text-slate-600 text-xs flex flex-col items-center gap-1 font-ui">
                  <span>🎬 វីដេអូរឿងដើម (Main Video Screen)</span>
                  <span className="text-[10px] text-slate-700">16:9 1080p Master</span>
                </div>
              )}

              {/* Picture-in-Picture Ad Video Box */}
              {localConfig.enabled && (
                <div
                  className={`absolute ${getPositionClass(
                    localConfig.position
                  )} ${getSizeClass(
                    localConfig.size
                  )} aspect-video rounded-xl overflow-hidden border-2 border-amber-400/80 shadow-2xl bg-black transition-all`}
                  style={{ opacity: localConfig.opacity / 100 }}
                >
                  {videoInputUrl ? (
                    <video
                      src={videoInputUrl}
                      className="w-full h-full object-cover"
                      muted
                      autoPlay
                      loop
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-amber-600 to-orange-500 flex flex-col items-center justify-center text-black p-1 text-center font-bold">
                      <Tv className="w-4 h-4 mb-0.5" />
                      <span className="text-[9px] uppercase tracking-wider">
                        SPONSOR AD
                      </span>
                    </div>
                  )}

                  {/* Badge */}
                  <div className="absolute top-1 left-1 px-1 py-0.2 rounded bg-black/70 text-[8px] text-amber-300 font-bold uppercase tracking-wider">
                    AD
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div className="p-4 px-6 border-t border-white/[0.08] bg-[#070a13] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs text-slate-300 transition-colors"
          >
            បោះបង់
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-bold shadow-lg shadow-amber-500/25 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>រក្សាទុកការកំណត់</span>
          </button>
        </div>
      </div>
    </div>
  );
};
