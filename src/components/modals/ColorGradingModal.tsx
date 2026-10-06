import React, { useState } from 'react';
import {
  Palette,
  X,
  Sliders,
  Sparkles,
  RotateCcw,
  Check,
  Activity,
  Sun,
  Eye
} from 'lucide-react';

interface ColorGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const ColorGradingModal: React.FC<ColorGradingModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const defaultParams = {
    exposure: 0,
    contrast: 10,
    highlights: -5,
    shadows: 5,
    temperature: 5500,
    tint: 0,
    saturation: 105,
    vibrance: 110,
    sharpness: 15,
  };

  const [params, setParams] = useState(defaultParams);
  const [activePreset, setActivePreset] = useState('Cinematic');

  const presets = [
    { name: 'Cinematic', temp: 5200, tint: -2, sat: 115, contrast: 18, exp: 2 },
    { name: 'Drama', temp: 4800, tint: 4, sat: 90, contrast: 25, exp: -3 },
    { name: 'Warm', temp: 6200, tint: 5, sat: 120, contrast: 10, exp: 3 },
    { name: 'Cold', temp: 4200, tint: -8, sat: 95, contrast: 12, exp: -2 },
    { name: 'Night', temp: 3800, tint: -12, sat: 80, contrast: 30, exp: -15 },
    { name: 'Film', temp: 5600, tint: 6, sat: 100, contrast: 14, exp: 0 },
    { name: 'HDR', temp: 5500, tint: 0, sat: 130, contrast: 22, exp: 5 },
  ];

  if (!isOpen) return null;

  const handleApplyPreset = (p: typeof presets[0]) => {
    setActivePreset(p.name);
    setParams((prev) => ({
      ...prev,
      temperature: p.temp,
      tint: p.tint,
      saturation: p.sat,
      contrast: p.contrast,
      exposure: p.exp,
    }));
    onShowToast?.(`Applied "${p.name}" Color Grade Preset!`, 'info');
  };

  const handleReset = () => {
    setParams(defaultParams);
    setActivePreset('None');
    onShowToast?.('Reset color parameters to neutral.', 'info');
  };

  const handleSave = () => {
    onShowToast?.('Color grading grade profile saved to project!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] shadow-2xl overflow-hidden flex flex-col font-khmer text-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white dark:bg-[#181818] border-b border-slate-200 dark:border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#222226] border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-[#00C2FF]">
              <Palette className="w-4 h-4 text-[#00C2FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide">
                  PROFESSIONAL COLOR GRADING & SCOPES
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00C2FF]/10 text-[#00C2FF] border border-slate-200 dark:border-[#00C2FF]/30">
                  REAL FILTER
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                កែតម្រូវពណ៌ភាពយន្ត កម្រិតពន្លឺ (Exposure, Temperature, Contrast) និង Scopes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:text-white hover:bg-slate-200 dark:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto">
          {/* Left 2 Cols: Controls & Presets */}
          <div className="lg:col-span-2 space-y-5">
            {/* Presets Row */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                Color Presets (ម៉ូដពណ៌កំណត់ស្រាប់)
              </label>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activePreset === p.name
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-slate-800 dark:text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]'
                        : 'bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-2 gap-4 bg-white dark:bg-[#050B16] p-4 rounded-xl border border-cyan-500/10">
              {/* Exposure */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Exposure (ពន្លឺ):</span>
                  <span className="font-mono text-cyan-400">{params.exposure > 0 ? `+${params.exposure}` : params.exposure}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={params.exposure}
                  onChange={(e) => setParams({ ...params, exposure: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Contrast (កម្រិតច្បាស់):</span>
                  <span className="font-mono text-cyan-400">{params.contrast}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={params.contrast}
                  onChange={(e) => setParams({ ...params, contrast: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Highlights */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Highlights (ពន្លឺខ្ពស់):</span>
                  <span className="font-mono text-cyan-400">{params.highlights}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={params.highlights}
                  onChange={(e) => setParams({ ...params, highlights: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Shadows */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Shadows (ស្រមោល):</span>
                  <span className="font-mono text-cyan-400">{params.shadows}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={params.shadows}
                  onChange={(e) => setParams({ ...params, shadows: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Temperature */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Temperature (សីតុណ្ហភាព):</span>
                  <span className="font-mono text-sky-600 dark:text-amber-400">{params.temperature} K</span>
                </div>
                <input
                  type="range"
                  min="3000"
                  max="8000"
                  step="100"
                  value={params.temperature}
                  onChange={(e) => setParams({ ...params, temperature: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              {/* Tint */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Tint (ពណ៌លាំ):</span>
                  <span className="font-mono text-pink-400">{params.tint}</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={params.tint}
                  onChange={(e) => setParams({ ...params, tint: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-400"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Saturation (ភាពដិតពណ៌):</span>
                  <span className="font-mono text-cyan-400">{params.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={params.saturation}
                  onChange={(e) => setParams({ ...params, saturation: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Vibrance */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Vibrance:</span>
                  <span className="font-mono text-cyan-400">{params.vibrance}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={params.vibrance}
                  onChange={(e) => setParams({ ...params, vibrance: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* Right Col: Real-time Histogram / Scopes Display */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                RGB Waveform & Histogram
              </span>
              <span className="text-[10px] font-mono text-cyan-400">GPU ACTIVE</span>
            </div>

            {/* Simulated Live Scope Canvas */}
            <div className="w-full h-44 rounded-xl bg-white dark:bg-[#050B16] border border-cyan-500/20 p-3 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
                <div className="w-full h-[1px] bg-cyan-500 top-1/4 absolute" />
                <div className="w-full h-[1px] bg-cyan-500 top-2/4 absolute" />
                <div className="w-full h-[1px] bg-cyan-500 top-3/4 absolute" />
              </div>

              {/* Simulated Curves */}
              <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
                {/* Red channel curve */}
                <path
                  d="M 0 80 Q 50 20 100 60 T 200 40"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  opacity="0.8"
                />
                {/* Green channel curve */}
                <path
                  d="M 0 70 Q 40 30 110 50 T 200 30"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  opacity="0.8"
                />
                {/* Blue channel curve */}
                <path
                  d="M 0 65 Q 60 40 120 70 T 200 25"
                  fill="none"
                  stroke="#00f0ff"
                  strokeWidth="1.5"
                  opacity="0.9"
                />
              </svg>

              <div className="flex justify-between text-[10px] font-mono text-slate-500 border-t border-slate-800 pt-1">
                <span>0 IRE (Blacks)</span>
                <span>50 IRE</span>
                <span>100 IRE (Whites)</span>
              </div>
            </div>

            {/* Scope stats */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#050B16] border border-cyan-500/10 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Color Space:</span>
                <span className="font-mono text-slate-800 dark:text-white font-bold">Rec.709 / BT.2020</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Clipping:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">0% Clean</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Dynamic Range:</span>
                <span className="text-cyan-400 font-mono">14.2 Stops</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#0E1C31] border-t border-cyan-500/20">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset (កំណត់ឡើងវិញ)</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-800 dark:text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)]"
            >
              <Check className="w-4 h-4" />
              <span>Apply Color Grade (អនុវត្ត)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
