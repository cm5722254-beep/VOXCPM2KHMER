/**
 * 🐲 Dragon Hardware Report — Khmer user-facing hardware status panel
 *
 * Shows: CPU / RAM / GPU / VRAM / Storage / Performance Level
 * With Khmer explanation of what features are available/heavy.
 * Includes Dragon Resource Manager status and AI recommendation.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu, MemoryStick, HardDrive, Zap, Activity, Wifi, WifiOff,
  CheckCircle2, AlertTriangle, XCircle, RefreshCw, X, ChevronDown,
  Shield, Rocket, Scale, Clapperboard, MonitorPlay
} from 'lucide-react';
import { api } from '../../services/api';

interface HardwareReportProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

// Tier badge colors
const TIER_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  HIGH_END:    { bg: 'bg-blue-50 dark:bg-red-500/20',    text: 'text-red-300',    border: 'border-blue-300 dark:border-blue-300 dark:border-blue-300 dark:border-red-500/40',    icon: '🔴' },
  PERFORMANCE: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/40', icon: '🟠' },
  STANDARD:    { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/40', icon: '🟡' },
  ENTRY:       { bg: 'bg-green-500/20',  text: 'text-green-300',  border: 'border-green-500/40',  icon: '🟢' },
};

// Resource level colors
const LEVEL_COLORS: Record<string, string> = {
  safe:     'text-green-400',
  moderate: 'text-cyan-600 dark:text-yellow-400',
  high:     'text-orange-400',
  critical: 'text-blue-600 dark:text-red-400',
  unknown:  'text-gray-400',
};

const LEVEL_LABELS_KH: Record<string, string> = {
  safe:     'ល្អ',
  moderate: 'មធ្យម',
  high:     'ខ្ពស់',
  critical: 'គ្រោះថ្នាក់',
  unknown:  'មិនដឹង',
};

const PRESET_ICONS: Record<string, React.ReactNode> = {
  fast:     <Rocket className="w-3.5 h-3.5" />,
  balanced: <Scale className="w-3.5 h-3.5" />,
  safe:     <Shield className="w-3.5 h-3.5" />,
  quality:  <Clapperboard className="w-3.5 h-3.5" />,
};

const PRESET_LABELS_KH: Record<string, string> = {
  fast:     '🚀 Fast',
  balanced: '⚖️ Balanced',
  safe:     '🛡️ Safe',
  quality:  '🎬 Quality',
};

export const DragonHardwareReport: React.FC<HardwareReportProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [hardware, setHardware] = useState<any>(null);
  const [resources, setResources] = useState<any>(null);
  const [aiRec, setAiRec] = useState<any>(null);
  const [preset, setPreset] = useState<string>('balanced');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingPreset, setIsSettingPreset] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [hw, res, rec, presetData] = await Promise.allSettled([
        api.getFullHardwareProfile(),
        api.getResourceStatus(),
        api.getAiRecommendation(),
        api.getPerformancePreset(),
      ]);
      if (hw.status === 'fulfilled') setHardware(hw.value);
      if (res.status === 'fulfilled') setResources(res.value);
      if (rec.status === 'fulfilled') setAiRec(rec.value);
      if (presetData.status === 'fulfilled') setPreset(presetData.value.current);
      setLastRefresh(new Date());
    } catch (e) {
      console.warn('[DragonHardwareReport] Load failed:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh resources every 5 seconds when open
  useEffect(() => {
    if (!isOpen) return;
    loadAll();
    const interval = setInterval(async () => {
      try {
        const res = await api.getResourceStatus();
        setResources(res);
      } catch (_) {}
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen, loadAll]);

  const handleSetPreset = async (p: string) => {
    setIsSettingPreset(true);
    try {
      await api.setPerformancePreset(p as any);
      setPreset(p);
      onShowToast?.(`✅ ${PRESET_LABELS_KH[p]} Mode ត្រូវបានកំណត់!`, 'success');
    } catch (e: any) {
      onShowToast?.(`❌ ${e.message}`, 'error');
    } finally {
      setIsSettingPreset(false);
    }
  };

  if (!isOpen) return null;

  const tier = hardware?.performanceTier || 'STANDARD';
  const tierConfig = TIER_COLORS[tier] || TIER_COLORS.STANDARD;

  const ProgressBar = ({ pct, level }: { pct: number | null; level?: string }) => {
    if (pct === null || pct === undefined) return <span className="text-xs text-gray-500">N/A</span>;
    const color = level === 'critical' ? 'bg-red-500' :
                  level === 'high' ? 'bg-orange-500' :
                  level === 'moderate' ? 'bg-yellow-500' : 'bg-green-500';
    return (
      <div className="flex items-center gap-2 flex-1">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <span className={`text-xs font-mono w-10 text-right ${LEVEL_COLORS[level || 'safe']}`}>
          {pct.toFixed(0)}%
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-khmer">
      <div className="bg-white dark:bg-[#0b0f19] border border-cyan-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col">
        {/* ── Header ── */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-200 dark:border-white/[0.08] flex items-center justify-between bg-white dark:bg-[#070a12] rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">🐲 ស្ថានភាព Hardware កុំព្យូទ័រ</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Dragon Dabber Pro — ការពិនិត្យ Hardware ពិតប្រាកដ
                {lastRefresh && ` · ${lastRefresh.toLocaleTimeString()}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadAll}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {isLoading && !hardware && (
            <div className="flex items-center justify-center py-10 text-slate-500 dark:text-slate-400 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              កំពុងពិនិត្យ Hardware...
            </div>
          )}

          {/* ── Performance Tier Badge ── */}
          {hardware && (
            <div className={`rounded-xl border p-4 ${tierConfig.bg} ${tierConfig.border}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">កម្រិតប្រើប្រាស់ Dragon Dabber Pro</p>
                  <p className={`text-lg font-bold ${tierConfig.text}`}>
                    {hardware.performanceTierLabel}
                  </p>
                </div>
                <div className="text-3xl">{tierConfig.icon}</div>
              </div>
            </div>
          )}

          {/* ── Hardware Specs ── */}
          {hardware && (
            <div className="bg-slate-100 dark:bg-white/[0.04] rounded-xl border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] p-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">
                💻 ហ្វែកហ្ករ (Hardware Specs)
              </h4>

              {/* CPU */}
              <div className="flex items-start gap-3">
                <Cpu className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">CPU</span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">{hardware.cpuCores} cores</span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-white truncate">{hardware.cpuName || `${hardware.cpuCores}-Core CPU`}</p>
                </div>
              </div>

              {/* RAM */}
              <div className="flex items-start gap-3">
                <MemoryStick className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">RAM</span>
                    <span className="text-xs text-slate-800 dark:text-white font-mono">{hardware.ramTotalGb} GB</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Available: {hardware.ramAvailableGb} GB · Used: {hardware.ramUsedPercent?.toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* GPU */}
              <div className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-sky-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">GPU</span>
                    <span className={`text-xs font-mono ${hardware.isGpuAccelerated ? 'text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {hardware.isGpuAccelerated ? '✅ GPU Accelerated' : 'CPU Mode'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-white truncate">{hardware.gpuName}</p>
                  {hardware.vramTotalGb > 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">VRAM: {hardware.vramTotalGb} GB total · {hardware.vramFreeGb} GB free</p>
                  )}

                  {/* ── AMD Vega 64 / Radeon specific section ── */}
                  {hardware.isAmdGpu && (
                    <div className="mt-1.5 p-2.5 rounded-lg bg-red-500/10 border border-red-500/25 space-y-1.5">
                      {/* Vendor badge row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                          <span className="text-[10px] font-bold text-red-300">
                            🔴 AMD Radeon
                          </span>
                          {hardware.gpuName && (
                            <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={hardware.gpuName}>
                              {hardware.gpuName}
                            </span>
                          )}
                        </div>
                        {/* HBM2 VRAM chip */}
                        {(hardware.amdVramGb || hardware.vramTotalGb) > 0 && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/25">
                            {hardware.amdVramGb || hardware.vramTotalGb} GB HBM2
                          </span>
                        )}
                      </div>

                      {/* DirectML / ROCm badges */}
                      <div className="flex flex-wrap gap-1.5">
                        {hardware.hasDirectml ? (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 text-[9px] font-medium">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            DirectML Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/25 text-[9px] font-medium">
                            ⚠ DirectML not installed
                          </span>
                        )}
                        {hardware.hasRocm && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/25 text-[9px] font-medium">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            ROCm Active
                          </span>
                        )}
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 text-[9px] font-medium">
                          <MonitorPlay className="w-2.5 h-2.5" />
                          h264_amf VCE
                        </span>
                      </div>

                      {/* Install hint when DirectML is missing */}
                      {!hardware.hasDirectml && !hardware.hasRocm && (
                        <p className="text-[9px] text-yellow-400/80 leading-relaxed">
                          GPU AI acceleration requires{' '}
                          <span className="font-mono bg-black/20 px-1 rounded">pip install torch-directml</span>
                          {' '}or run{' '}
                          <span className="font-mono bg-black/20 px-1 rounded">START_LOCAL_VOXCPM_AMD.bat</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Storage */}
              <div className="flex items-start gap-3">
                <HardDrive className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Storage ({hardware.diskType})</span>
                    <span className={`text-xs font-mono ${hardware.diskFreeGb < 10 ? 'text-orange-400' : 'text-green-400'}`}>
                      {hardware.diskFreeGb} GB free
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total: {hardware.diskTotalGb} GB · Used: {hardware.diskUsedPercent}%</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Live Resource Monitor ── */}
          {resources && (
            <div className="bg-slate-100 dark:bg-white/[0.04] rounded-xl border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  📊 ការប្រើប្រាស់បច្ចុប្បន្ន (Live Resources)
                </h4>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  resources.overallHealth === 'safe' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                  resources.overallHealth === 'moderate' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                  resources.overallHealth === 'high' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                  'bg-blue-50 dark:bg-red-500/20 text-red-300 border-red-500/30'
                }`}>
                  {LEVEL_LABELS_KH[resources.overallHealth]}
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  { label: 'CPU', value: resources.cpu.percent, level: resources.cpu.level },
                  { label: 'RAM', value: resources.ram.percent, level: resources.ram.level },
                  { label: 'GPU', value: resources.gpu.percent, level: resources.gpu.level },
                  { label: 'VRAM', value: resources.vram.percent, level: resources.vram.level },
                  { label: 'Disk', value: resources.disk.percent, level: resources.disk.level },
                ].map(({ label, value, level }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-10">{label}</span>
                    <ProgressBar pct={value} level={level} />
                    <span className={`text-xs w-16 ${LEVEL_COLORS[level || 'unknown']}`}>
                      {LEVEL_LABELS_KH[level || 'unknown']}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Safe Concurrency</span>
                <span className="text-xs text-cyan-400 font-mono font-bold">
                  {resources.safeConcurrency} job{resources.safeConcurrency !== 1 ? 's' : ''} parallel
                </span>
              </div>
            </div>
          )}

          {/* ── Performance Preset ── */}
          <div className="bg-slate-100 dark:bg-white/[0.04] rounded-xl border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] p-4">
            <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">
              ⚡ ជ្រើស Performance Mode
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {(['fast', 'balanced', 'safe', 'quality'] as const).map((p) => (
                <button
                  key={p}
                  disabled={isSettingPreset}
                  onClick={() => handleSetPreset(p)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs transition-all ${
                    preset === p
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-semibold'
                      : 'bg-white/[0.03] border-white/10 text-slate-500 dark:text-slate-400 hover:border-white/20 hover:text-slate-800 dark:text-white'
                  }`}
                >
                  {PRESET_ICONS[p]}
                  <span>{PRESET_LABELS_KH[p]}</span>
                  {preset === p && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              {preset === 'fast' && 'ល្បឿនបំផុត — ប្រើ RAM/GPU ពេញ'}
              {preset === 'balanced' && 'ល្បឿន + Stability — Mode ល្អ'}
              {preset === 'safe' && 'ការពារ Computer — Job តិច ប្ដូរ Load'}
              {preset === 'quality' && 'គុណភាព Output ខ្ពស់ — ដំណើរការយឺតជាង'}
            </p>
          </div>

          {/* ── AI Recommendation ── */}
          {aiRec && (
            <div className="bg-slate-100 dark:bg-white/[0.04] rounded-xl border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] p-4">
              <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">
                🤖 ការណែនាំ AI Provider
              </h4>
              <div className={`p-3 rounded-lg border mb-3 ${
                aiRec.overallMode === 'LOCAL' ? 'bg-green-500/10 border-green-500/30' :
                aiRec.overallMode === 'HYBRID' ? 'bg-cyan-500/10 border-cyan-500/30' :
                'bg-blue-500/10 border-blue-500/30'
              }`}>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{aiRec.overallMode} MODE</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{aiRec.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-100 dark:bg-white/[0.04] rounded-lg p-2.5 border border-white/[0.06]">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Voice/TTS</p>
                  <p className="text-xs text-slate-800 dark:text-white">{aiRec.voiceRecommendation?.label}</p>
                </div>
                <div className="bg-slate-100 dark:bg-white/[0.04] rounded-lg p-2.5 border border-white/[0.06]">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Translation</p>
                  <p className="text-xs text-slate-800 dark:text-white">{aiRec.translationRecommendation?.label}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Feature Availability ── */}
          {hardware && (
            <div className="bg-slate-100 dark:bg-white/[0.04] rounded-xl border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] p-4">
              <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">
                ✅ អាចធ្វើបាន / ⚠️ ធ្ងន់
              </h4>
              <div className="space-y-2">
                {/* Features always available */}
                {[
                  'Video editing & Preview',
                  'Translation (Cloud AI)',
                  'Subtitle generation',
                  'Audio extraction (FFmpeg)',
                  'Edge TTS voice generation',
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    <span className="text-xs text-slate-600 dark:text-slate-300">{f}</span>
                  </div>
                ))}

                {/* AI Dubbing */}
                <div className="flex items-center gap-2">
                  {hardware.ramTotalGb >= 8
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    : <AlertTriangle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                  }
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    AI Dubbing pipeline {hardware.ramTotalGb >= 8 ? '' : '(⚠️ RAM ទាប)'}
                  </span>
                </div>

                {/* Batch processing */}
                <div className="flex items-center gap-2">
                  {hardware.ramTotalGb >= 16
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    : <AlertTriangle className="w-3.5 h-3.5 text-cyan-600 dark:text-yellow-400 flex-shrink-0" />
                  }
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    Batch processing (ណែនាំ: {hardware.safeBatchConcurrency} episode ក្នុងដំណាលគ្នា)
                  </span>
                </div>

                {/* Voice cloning */}
                <div className="flex items-center gap-2">
                  {hardware.vramTotalGb >= 4
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    : <AlertTriangle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                  }
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    Local Voice Cloning {hardware.vramTotalGb >= 4 ? '' : '(⚠️ VRAM — Cloud recommended)'}
                  </span>
                </div>

                {/* 10-ep batch */}
                <div className="flex items-center gap-2">
                  {hardware.ramTotalGb >= 32
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    : <AlertTriangle className="w-3.5 h-3.5 text-cyan-600 dark:text-yellow-400 flex-shrink-0" />
                  }
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    10 Episode batch rendering {hardware.ramTotalGb >= 32 ? '' : '(⚠️ ចំណេញ RAM ≥ 32GB)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Advanced Details toggle ── */}
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-white transition-colors"
          >
            <span>Advanced Details</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && hardware && (
            <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-500">OS</p>
                  <p className="text-slate-800 dark:text-white">{hardware.os} {hardware.osVersion}</p>
                </div>
                <div>
                  <p className="text-slate-500">Architecture</p>
                  <p className="text-slate-800 dark:text-white">{hardware.architecture}</p>
                </div>
                <div>
                  <p className="text-slate-500">Video Encoder</p>
                  <p className="text-slate-800 dark:text-white">{hardware.encoderLabel}</p>
                </div>
                <div>
                  <p className="text-slate-500">Turbo Concurrency</p>
                  <p className="text-slate-800 dark:text-white">{hardware.turboConcurrency} threads</p>
                </div>
                <div>
                  <p className="text-slate-500">Safe Batch Concurrency</p>
                  <p className="text-cyan-400 font-bold">{hardware.safeBatchConcurrency} episodes</p>
                </div>
                <div>
                  <p className="text-slate-500">Recommended Preset</p>
                  <p className="text-cyan-400">{PRESET_LABELS_KH[hardware.recommendedPreset]}</p>
                </div>
                {/* AMD-specific advanced fields */}
                {hardware.isAmdGpu && (
                  <>
                    <div>
                      <p className="text-slate-500">GPU Vendor</p>
                      <p className="text-red-300 font-semibold">AMD Radeon (VCE)</p>
                    </div>
                    <div>
                      <p className="text-slate-500">DirectML</p>
                      <p className={hardware.hasDirectml ? 'text-emerald-400' : 'text-yellow-400'}>
                        {hardware.hasDirectml ? '✅ Installed' : '⚠ Not Installed'}
                      </p>
                    </div>
                    {hardware.hasRocm && (
                      <div>
                        <p className="text-slate-500">ROCm</p>
                        <p className="text-purple-400">✅ Active</p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-500">Torch Device</p>
                      <p className="text-slate-800 dark:text-white font-mono">{hardware.torchDevice || 'dml'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DragonHardwareReport;
