import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  Cpu,
  Gauge,
  CheckCircle2,
  Sliders,
  Sparkles,
  Server,
  Activity,
  Layers,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { HardwareProfile } from '../../types';
import { api } from '../../services/api';

interface HardwareTurboModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const HardwareTurboModal: React.FC<HardwareTurboModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [profile, setProfile] = useState<HardwareProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'turbo_max' | 'balanced' | 'quality'>('turbo_max');
  const [concurrencyWorkers, setConcurrencyWorkers] = useState<number>(12);

  useEffect(() => {
    if (isOpen) {
      loadHardwareInfo();
      const savedMode = localStorage.getItem('studio_performance_mode') as any;
      if (savedMode) setSelectedMode(savedMode);
      const savedWorkers = localStorage.getItem('studio_concurrency_workers');
      if (savedWorkers) setConcurrencyWorkers(Number(savedWorkers));
    }
  }, [isOpen]);

  const loadHardwareInfo = async () => {
    setIsLoading(true);
    try {
      const data = await api.getHardwareInfo();
      setProfile(data);
      if (!localStorage.getItem('studio_concurrency_workers')) {
        setConcurrencyWorkers(data.turboConcurrency || 12);
      }
    } catch (e) {
      console.warn('Could not fetch hardware info:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSaveSettings = () => {
    localStorage.setItem('studio_performance_mode', selectedMode);
    localStorage.setItem('studio_concurrency_workers', String(concurrencyWorkers));
    onShowToast('⚡ បានកំណត់កម្លាំងម៉ាស៊ីន Turbo Generation ជោគជ័យ!', 'success');
    onClose();
  };

  const cpuCores = profile?.cpuCores || 8;
  const isGpu = profile?.isGpuAccelerated || false;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-khmer">
      <div className="bg-[#0b0f19] border border-amber-500/30 rounded-2xl w-full max-w-xl overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.18)] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 px-6 border-b border-white/[0.08] flex items-center justify-between bg-[#070a12]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                បង្កើនល្បឿន Generate តាមកម្លាំងកុំព្យូទ័រ (Turbo Hardware Speed)
              </h3>
              <p className="text-[11px] text-slate-400">
                ទាញយកកម្លាំង CPU & GPU ម៉ាស៊ីនដើម្បីបង្កើតសំឡេង និង Render វីដេអូលឿនបំផុត
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Hardware Specs Detection Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/25 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>កម្លាំងម៉ាស៊ីនកុំព្យូទ័ររបស់អ្នក (Hardware Detected):</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Turbo Ready</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="p-2 rounded-lg bg-black/40 border border-white/[0.06]">
                <div className="text-[10px] text-slate-400">CPU Processor</div>
                <div className="font-bold text-white font-mono mt-0.5">{cpuCores} Cores / Threads</div>
              </div>

              <div className="p-2 rounded-lg bg-black/40 border border-white/[0.06]">
                <div className="text-[10px] text-slate-400">Video Hardware Encoder</div>
                <div className="font-bold text-cyan-300 font-mono mt-0.5 truncate" title={profile?.encoderLabel}>
                  {profile?.videoEncoder || 'libx264 (Ultrafast)'}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-black/40 border border-white/[0.06] col-span-2 sm:col-span-1">
                <div className="text-[10px] text-slate-400">GPU Acceleration</div>
                <div className={`font-bold mt-0.5 ${isGpu ? 'text-emerald-400' : 'text-amber-300'}`}>
                  {isGpu ? 'Active (GPU Boost)' : 'CPU Multi-Threading'}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              ជ្រើសរើសទម្រង់ដំណើរការ (Performance Mode):
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Turbo Max */}
              <button
                type="button"
                onClick={() => {
                  setSelectedMode('turbo_max');
                  setConcurrencyWorkers(16);
                }}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  selectedMode === 'turbo_max'
                    ? 'bg-amber-500/15 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Turbo Max</span>
                  </span>
                  {selectedMode === 'turbo_max' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </div>
                <p className="text-[10.5px] text-slate-400">
                  ល្បឿនអតិបរមា ១០០% ស្របគ្នាច្រើនបន្ទាត់ (Parallel Speech)
                </p>
              </button>

              {/* Fast Balanced */}
              <button
                type="button"
                onClick={() => {
                  setSelectedMode('balanced');
                  setConcurrencyWorkers(8);
                }}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  selectedMode === 'balanced'
                    ? 'bg-cyan-500/15 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Balanced</span>
                  </span>
                  {selectedMode === 'balanced' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                </div>
                <p className="text-[10.5px] text-slate-400">
                  ដំណើរការរហ័ស សមតុល្យរវាងល្បឿន និងបន្ទុកកុំព្យូទ័រ
                </p>
              </button>

              {/* Studio Quality */}
              <button
                type="button"
                onClick={() => {
                  setSelectedMode('quality');
                  setConcurrencyWorkers(4);
                }}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  selectedMode === 'quality'
                    ? 'bg-purple-500/15 border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Studio Quality</span>
                  </span>
                  {selectedMode === 'quality' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  )}
                </div>
                <p className="text-[10.5px] text-slate-400">
                  ទាញយកកម្លាំងតិច ទុក CPU សម្រាប់កម្មវិធីផ្សេងៗ
                </p>
              </button>
            </div>
          </div>

          {/* Parallel Workers Concurrency Slider */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                <span>ចំនួនខ្សែស្របគ្នា (Concurrent Workers):</span>
              </span>
              <span className="font-mono font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                {concurrencyWorkers}x Concurrent
              </span>
            </div>

            <input
              type="range"
              min="2"
              max="16"
              step="2"
              value={concurrencyWorkers}
              onChange={(e) => setConcurrencyWorkers(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>2x (ស្ងាត់)</span>
              <span>8x (មធ្យម)</span>
              <span>12x (លឿនខ្លាំង)</span>
              <span>16x (Turbo Max)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-white/[0.08] flex items-center justify-between bg-[#070a12]">
          <span className="text-[11px] text-slate-500">
            * កម្មវិធីនឹងប្រើប្រាស់ Thread ទាំងអស់របស់ CPU ដើម្បី Generate ឱ្យបានលឿនបំផុត
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-white/[0.05] text-slate-300 text-xs hover:text-white"
            >
              បោះបង់
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/25"
            >
              រក្សាទុកការកំណត់
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
