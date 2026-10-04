import React, { useState } from 'react';
import {
  Volume2,
  Sliders,
  CheckCircle2,
  X,
  VolumeX,
  Radio,
  Sparkles,
  ShieldCheck,
  Disc,
  Music,
  Wind
} from 'lucide-react';

interface AudioDuckingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const AudioDuckingModal: React.FC<AudioDuckingModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [autoDucking, setAutoDucking] = useState(true);
  const [duckingAmount, setDuckingAmount] = useState(-12);
  const [attackMs, setAttackMs] = useState(50);
  const [releaseMs, setReleaseMs] = useState(300);

  // Stems config
  const [stems, setStems] = useState({
    voice: { volume: 100, pan: 0, mute: false, solo: false, ducking: false },
    original: { volume: 75, pan: 0, mute: false, solo: false, ducking: true },
    bgm: { volume: 60, pan: 0, mute: false, solo: false, ducking: true },
    sfx: { volume: 85, pan: 0, mute: false, solo: false, ducking: false },
  });

  const [preservedFeatures, setPreservedFeatures] = useState({
    bgm: true,
    ambience: true,
    sfx: true,
    environment: true,
  });

  if (!isOpen) return null;

  const handleStemChange = (stemKey: keyof typeof stems, field: string, value: any) => {
    setStems((prev) => ({
      ...prev,
      [stemKey]: {
        ...prev[stemKey],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    onShowToast?.('Audio Ducking & Stem Preservation settings saved!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl rounded-xl bg-[#141414] border border-white/[0.08] shadow-2xl overflow-hidden flex flex-col font-khmer text-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#181818] border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#222226] border border-white/[0.08] flex items-center justify-center text-[#00C2FF]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  AUDIO PRESERVATION & AUTO DUCKING
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30">
                  REAL PROCESSING
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                រក្សាសំឡេងដើម ភ្លេង Background និងសម្រួលកម្រិតសំឡេងស្វ័យប្រវត្តិ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Auto Ducking Global Card */}
          <div className="p-4 rounded-xl bg-[#050B16] border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">AUTO DUCKING (បន្ថយសំឡេងស្វ័យប្រវត្តិ)</h3>
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${autoDucking ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'}`}>
                    {autoDucking ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  AI Voice automatically ducks original dialogue while preserving background music & ambience
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => setAutoDucking(!autoDucking)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  autoDucking ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
              </button>
            </div>

            {/* Ducking Parameters */}
            {autoDucking && (
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-cyan-500/10">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Ducking Depth:</span>
                    <span className="font-mono text-cyan-400 font-bold">{duckingAmount} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-24"
                    max="-3"
                    step="1"
                    value={duckingAmount}
                    onChange={(e) => setDuckingAmount(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Attack Time:</span>
                    <span className="font-mono text-cyan-400 font-bold">{attackMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={attackMs}
                    onChange={(e) => setAttackMs(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Release Time:</span>
                    <span className="font-mono text-cyan-400 font-bold">{releaseMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={releaseMs}
                    onChange={(e) => setReleaseMs(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Stem Isolation & Preservation Badges */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Preserved Audio Layers (ស្រទាប់សំឡេងដែលត្រូវរក្សាទុក)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'bgm', label: 'Background Music', icon: Music },
                { key: 'ambience', label: 'Ambience', icon: Disc },
                { key: 'sfx', label: 'Sound Effects', icon: Sparkles },
                { key: 'environment', label: 'Environmental Sound', icon: Wind },
              ].map(({ key, label, icon: Icon }) => {
                const isPreserved = preservedFeatures[key as keyof typeof preservedFeatures];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setPreservedFeatures((prev) => ({
                        ...prev,
                        [key]: !prev[key as keyof typeof preservedFeatures],
                      }))
                    }
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      isPreserved
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                        : 'bg-[#050B16] border-slate-800 text-slate-500'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Independent Stem Controls Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Independent Stem Channel Controls (គ្រប់គ្រងបណ្តាញសំឡេងដាច់ដោយឡែក)
            </h4>

            <div className="space-y-2">
              {[
                { id: 'voice', name: 'AI Voice / Dubbing', color: 'text-emerald-400' },
                { id: 'original', name: 'Original Audio (Dialogue)', color: 'text-purple-400' },
                { id: 'bgm', name: 'Background Music', color: 'text-amber-400' },
                { id: 'sfx', name: 'Sound Effects (SFX)', color: 'text-cyan-400' },
              ].map((stem) => {
                const data = stems[stem.id as keyof typeof stems];
                return (
                  <div
                    key={stem.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[#050B16] border border-cyan-500/10 gap-3"
                  >
                    <div className="w-48">
                      <span className={`text-xs font-bold ${stem.color}`}>{stem.name}</span>
                    </div>

                    {/* Volume */}
                    <div className="flex items-center gap-2 flex-1 max-w-xs">
                      <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="range"
                        min="0"
                        max="150"
                        value={data.volume}
                        onChange={(e) =>
                          handleStemChange(stem.id as any, 'volume', parseInt(e.target.value))
                        }
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                      <span className="text-xs font-mono text-slate-300 w-10 text-right">
                        {data.volume}%
                      </span>
                    </div>

                    {/* Pan */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Pan</span>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={data.pan}
                        onChange={(e) =>
                          handleStemChange(stem.id as any, 'pan', parseInt(e.target.value))
                        }
                        className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                      <span className="text-[10px] font-mono text-slate-400 w-6 text-right">
                        {data.pan === 0 ? 'C' : data.pan > 0 ? `R${data.pan}` : `L${Math.abs(data.pan)}`}
                      </span>
                    </div>

                    {/* Mute & Solo */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStemChange(stem.id as any, 'mute', !data.mute)}
                        className={`px-2 py-1 rounded text-[10px] font-bold ${
                          data.mute ? 'bg-red-500/30 text-red-300 border border-red-500/50' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        MUTE
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStemChange(stem.id as any, 'solo', !data.solo)}
                        className={`px-2 py-1 rounded text-[10px] font-bold ${
                          data.solo ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        SOLO
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0E1C31] border-t border-cyan-500/20">
          <span className="text-xs text-slate-400">
            Real-time DSP ducking pipeline active.
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)]"
            >
              Apply Settings (អនុវត្ត)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
