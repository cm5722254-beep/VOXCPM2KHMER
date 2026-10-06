import React, { useState, useEffect } from 'react';
import { Cpu, Cloud, Brain, CheckCircle2, AlertTriangle, Loader2, Wifi, WifiOff } from 'lucide-react';
import { api } from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
export type DragonAIMode = 'voxcpm2_local' | 'claude_cloud' | 'khmer_neural_offline';

export interface DragonAIModeConfig {
  mode: DragonAIMode;
  label: string;
  labelKhmer: string;
  descKhmer: string;
  icon: React.ReactNode;
  accentColor: string;
  requiresNet: boolean;
  requiresGpu: boolean;
  badge: string;
}

interface HardwareStatus {
  canRunLocal: boolean;
  canRunCloud: boolean;
  canRunOffline: boolean;
  tier: string;
  ramGb: number;
  vramGb: number;
  gpuName: string;
  cloudApiConfigured: boolean;
  offlineModelInstalled: boolean;
  reason?: string;
}

interface DragonAIModeSelectorProps {
  selectedMode: DragonAIMode;
  onModeChange: (mode: DragonAIMode) => void;
  compact?: boolean;
  disabled?: boolean;
}

const MODES: DragonAIModeConfig[] = [
  {
    mode: 'voxcpm2_local',
    label: 'VoxCPM2 Local',
    labelKhmer: 'VoxCPM2 នៅលើកុំព្យូទ័រ',
    descKhmer: 'ដំណើរការ AI នៅក្នុងកុំព្យូទ័ររបស់អ្នក (GPU/CPU)',
    icon: <Cpu className="w-5 h-5" />,
    accentColor: '#00C2FF',
    requiresNet: false,
    requiresGpu: true,
    badge: 'LOCAL',
  },
  {
    mode: 'claude_cloud',
    label: 'Claude Cloud',
    labelKhmer: 'Claude Cloud',
    descKhmer: 'ប្រើ AI Cloud — ល្អសម្រាប់កុំព្យូទ័រខ្សោយ',
    icon: <Cloud className="w-5 h-5" />,
    accentColor: '#a855f7',
    requiresNet: true,
    requiresGpu: false,
    badge: 'CLOUD',
  },
  {
    mode: 'khmer_neural_offline',
    label: 'Khmer Neural Offline',
    labelKhmer: 'Khmer Neural Offline',
    descKhmer: 'បង្កើតសំឡេងខ្មែរដោយមិនចាំបាច់ Online',
    icon: <Brain className="w-5 h-5" />,
    accentColor: '#10b981',
    requiresNet: false,
    requiresGpu: false,
    badge: 'OFFLINE',
  },
];

export const DragonAIModeSelector: React.FC<DragonAIModeSelectorProps> = ({
  selectedMode,
  onModeChange,
  compact = false,
  disabled = false,
}) => {
  const [hw, setHw] = useState<HardwareStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const [hwRes, aiRec] = await Promise.all([
          api.getFullHardwareProfile().catch(() => null),
          api.getAiRecommendation().catch(() => null),
        ]);

        if (!mounted) return;

        const ramGb = hwRes?.ramAvailableGb ?? 0;
        const vramGb = hwRes?.vramTotalGb ?? 0;
        const tier = hwRes?.performanceTier ?? 'ENTRY';
        const gpuName = hwRes?.gpuName ?? 'Unknown';
        const cloudApiConfigured = aiRec?.apiKeysConfigured?.gemini || aiRec?.apiKeysConfigured?.claude || false;
        const offlineModelInstalled = aiRec?.voiceRecommendation?.offlineAvailable ?? false;

        // Safe-to-run rules
        const canRunLocal = ramGb >= 4 && (vramGb >= 4 || tier !== 'ENTRY');
        const canRunCloud = cloudApiConfigured;
        const canRunOffline = offlineModelInstalled;

        setHw({ canRunLocal, canRunCloud, canRunOffline, tier, ramGb, vramGb, gpuName, cloudApiConfigured, offlineModelInstalled });
      } catch {
        setHw({ canRunLocal: false, canRunCloud: false, canRunOffline: true, tier: 'ENTRY', ramGb: 0, vramGb: 0, gpuName: 'Unknown', cloudApiConfigured: false, offlineModelInstalled: false });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    check();
    return () => { mounted = false; };
  }, []);

  const getModeStatus = (m: DragonAIModeConfig): { available: boolean; reason: string } => {
    if (!hw) return { available: false, reason: 'កំពុងពិនិត្យ...' };
    if (m.mode === 'voxcpm2_local') {
      if (!hw.canRunLocal) return { available: false, reason: `RAM/VRAM មិនគ្រប់ (${hw.ramGb.toFixed(1)}GB RAM, ${hw.vramGb.toFixed(1)}GB VRAM)` };
      return { available: true, reason: `${hw.gpuName} — tier ${hw.tier}` };
    }
    if (m.mode === 'claude_cloud') {
      if (!hw.canRunCloud) return { available: false, reason: 'API Key មិនទាន់ configure (Settings → AI Keys)' };
      return { available: true, reason: 'Cloud API configured' };
    }
    if (m.mode === 'khmer_neural_offline') {
      if (!hw.canRunOffline) return { available: false, reason: 'ម៉ូដែល Khmer Neural មិនទាន់ install' };
      return { available: true, reason: 'ម៉ូដែលត្រៀមរួចរាល់' };
    }
    return { available: false, reason: '' };
  };

  if (compact) {
    return (
      <div className="flex gap-2 flex-wrap">
        {MODES.map((m) => {
          const { available } = getModeStatus(m);
          const isSelected = selectedMode === m.mode;
          return (
            <button
              key={m.mode}
              type="button"
              disabled={disabled || (!available && !isSelected)}
              onClick={() => available && onModeChange(m.mode)}
              title={m.labelKhmer}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                isSelected
                  ? 'text-white shadow-lg'
                  : available
                  ? 'bg-slate-800/40 border-white/10 text-slate-300 hover:border-white/30'
                  : 'bg-slate-800/20 border-white/5 text-slate-600 cursor-not-allowed opacity-60'
              }`}
              style={isSelected ? { background: `${m.accentColor}25`, borderColor: `${m.accentColor}60`, color: m.accentColor } : {}}
            >
              <span style={isSelected ? { color: m.accentColor } : {}}>{m.icon}</span>
              <span>{m.label}</span>
              {isSelected && <CheckCircle2 className="w-3 h-3" />}
            </button>
          );
        })}
        {loading && <Loader2 className="w-4 h-4 text-slate-500 animate-spin self-center" />}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-sm font-black text-slate-700 dark:text-slate-200">ជ្រើសរើស AI Engine</h4>
        {loading && <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {MODES.map((m) => {
          const { available, reason } = getModeStatus(m);
          const isSelected = selectedMode === m.mode;
          const isDisabled = disabled || (!available && !isSelected);

          return (
            <button
              key={m.mode}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && available && onModeChange(m.mode)}
              className={`relative w-full text-left p-3 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'shadow-lg'
                  : available
                  ? 'bg-slate-50 dark:bg-white/[0.03] border-white/10 hover:border-white/25'
                  : 'bg-slate-50 dark:bg-white/[0.02] border-white/5 opacity-55 cursor-not-allowed'
              }`}
              style={isSelected ? { background: `${m.accentColor}12`, borderColor: `${m.accentColor}50` } : {}}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${m.accentColor}20`, color: m.accentColor }}
                >
                  {m.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{m.labelKhmer}</span>
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded-full border"
                      style={{ color: m.accentColor, borderColor: `${m.accentColor}40`, background: `${m.accentColor}15` }}
                    >
                      {m.badge}
                    </span>
                    {m.requiresNet && (
                      <span className="flex items-center gap-0.5 text-[9px] text-slate-500">
                        <Wifi className="w-2.5 h-2.5" /> Internet
                      </span>
                    )}
                    {!m.requiresNet && (
                      <span className="flex items-center gap-0.5 text-[9px] text-emerald-500">
                        <WifiOff className="w-2.5 h-2.5" /> Offline OK
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{m.descKhmer}</p>

                  {/* Status */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {loading ? (
                      <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
                    ) : available ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                    )}
                    <span className={`text-[10px] font-semibold ${available ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {loading ? 'កំពុងពិនិត្យ...' : available ? 'ត្រៀមរួចរាល់' : reason}
                    </span>
                  </div>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: m.accentColor }}
                  >
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Warning when selected mode unavailable */}
      {hw && !getModeStatus(MODES.find(m => m.mode === selectedMode)!).available && (
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span className="text-amber-300">
            {MODES.find(m => m.mode === selectedMode)?.labelKhmer} មិនអាចប្រើបានឥឡូវ។{' '}
            {selectedMode === 'voxcpm2_local' && 'ប្រើ Claude Cloud ឬ Khmer Neural Offline ជំនួស។'}
            {selectedMode === 'claude_cloud' && 'បន្ថែម API Key ក្នុង Settings → AI Keys ឬប្រើ Khmer Neural Offline ជំនួស។'}
            {selectedMode === 'khmer_neural_offline' && 'ដំឡើង Khmer Neural Model ជាមុន។'}
          </span>
        </div>
      )}
    </div>
  );
};
