import React, { useState, useEffect } from 'react';
import {
  X,
  Rocket,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  HardDrive,
  Activity,
  AlertTriangle,
  Lock,
  ChevronRight,
  Info,
  Server,
  Music,
  Sliders,
  Tv,
} from 'lucide-react';
import { api } from '../../services/api';
import { NextVersionRoadmap, HardwareDiagnostic } from '../../types';
import { DragonButton } from '../dragon/DragonButton';

interface NextVersionRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const NextVersionRoadmapModal: React.FC<NextVersionRoadmapModalProps> = ({
  isOpen,
  onClose,
  isAdmin = false,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'hardware' | 'architecture' | 'early_access'>('pipeline');
  const [roadmap, setRoadmap] = useState<NextVersionRoadmap | null>(null);
  const [hardware, setHardware] = useState<HardwareDiagnostic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [earlyAccessActive, setEarlyAccessActive] = useState(false);
  const [isTogglingFlag, setIsTogglingFlag] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getNextVersionRoadmap();
      setRoadmap(data);
      if (data?.next_version?.hardware_evaluation) {
        setHardware(data.next_version.hardware_evaluation);
      }
      setEarlyAccessActive(Boolean(data?.next_version?.early_access_enabled));
    } catch (err: any) {
      console.warn('Roadmap load fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEarlyAccess = async () => {
    if (!isAdmin) {
      onShowToast('🔒 មានតែ Administrator ឬ VIP Studio ប៉ុណ្ណោះដែលអាចបើកសិទ្ធិ Early Access បាន', 'warning');
      return;
    }
    setIsTogglingFlag(true);
    try {
      const nextState = !earlyAccessActive;
      await api.toggleFeatureFlag('advanced_dubbing_v2', nextState);
      setEarlyAccessActive(nextState);
      onShowToast(
        nextState
          ? '🚀 បានបើកសិទ្ធិ Early Access សម្រាប់ Next Version Advanced Engine!'
          : '🔒 បានបិទសិទ្ធិ Early Access រួចរាល់',
        'success'
      );
    } catch (err: any) {
      onShowToast(`កំហុសក្នុងការកែប្រែ: ${err.message}`, 'error');
    } finally {
      setIsTogglingFlag(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5 select-none font-khmer">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity" />

      {/* Main Dialog */}
      <div className="relative w-full max-w-5xl bg-slate-50 dark:bg-[#080608] border border-slate-200 dark:border-[#3D161F] rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-[#3D161F] bg-gradient-to-r from-[#1A0E13] via-[#140A0F] to-[#080608] flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-[#DC2626]/10 to-transparent pointer-events-none" />

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#DC2626]/20 to-[#F59E0B]/20 border border-red-500 dark:border-[#DC2626]/40 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.3)]">
              <Rocket className="w-6 h-6 text-[#EF4444] animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#DC2626]/20 border border-red-500 dark:border-[#DC2626]/40 text-[#EF4444] text-[10px] font-black uppercase tracking-wider font-khmer">
                  ផែនទីកំណែពាណិជ្ជកម្ម
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold font-khmer">
                  កំណែ STABLE ផ្លូវការ
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white font-ui tracking-wide mt-0.5">
                DRAGON DABBER PRO — កំណែបន្ទាប់
              </h2>
              <p className="text-xs text-[#A1A1AA]">
                Advanced AI Dubbing Engine • ស្ថាបត្យកម្មដាក់សំឡេង AI កម្រិតខ្ពស់
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-white hover:bg-slate-200 dark:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stable Version Commitment Banner */}
        <div className="px-6 py-2.5 bg-gradient-to-r from-red-950/40 via-[#120A0D] to-amber-950/40 border-b border-slate-200 dark:border-[#3D161F] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Info className="w-4 h-4 text-[#EF4444] shrink-0" />
            <span>
              <strong>សេចក្តីបញ្ជាក់ផលិតផល៖</strong> កំណែបច្ចុប្បន្ននៅតែជាកំណែ Stable សម្រាប់ការងារផលិតប្រចាំថ្ងៃ។ មុខងារខាងក្រោមត្រូវបានរៀបចំសម្រាប់កំណែបន្ទាប់។
            </span>
          </div>
          <span className="text-[11px] text-amber-300 font-mono shrink-0 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30 font-khmer">
            នឹងមានក្នុងកំណែបន្ទាប់
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 dark:border-[#3D161F] flex items-center gap-2 bg-white dark:bg-[#120A0D]/70 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'pipeline'
                ? 'border-red-500 dark:border-[#DC2626] text-[#EF4444] bg-[#DC2626]/[0.08]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>ដំណើរការទាំង ១០ ដំណាក់កាល</span>
          </button>

          <button
            onClick={() => setActiveTab('hardware')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'hardware'
                ? 'border-red-500 dark:border-[#DC2626] text-[#EF4444] bg-[#DC2626]/[0.08]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>ការវាយតម្លៃ Hardware & ការពារម៉ាស៊ីន</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'architecture'
                ? 'border-red-500 dark:border-[#DC2626] text-[#EF4444] bg-[#DC2626]/[0.08]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>ស្ថាបត្យកម្ម Pluggable Providers</span>
          </button>

          <button
            onClick={() => setActiveTab('early_access')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'early_access'
                ? 'border-red-500 dark:border-[#DC2626] text-[#EF4444] bg-[#DC2626]/[0.08]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>សិទ្ធិបើកសាកល្បងជាមុន</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: 10-STAGE PIPELINE */}
          {activeTab === 'pipeline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">ដំណើរការផលិតផលជាក់ស្តែង (100% Real Pipeline)</h3>
                  <p className="text-xs text-[#94A3B8]">
                    គ្រប់ដំណាក់កាលទាំងអស់ត្រូវបានតភ្ជាប់តាមរយៈ Provider Adapters ពិតប្រាកដ ដោយគ្មានការក្លែងបន្លំ ឬ Progress ក្លែងក្លាយឡើយ។
                  </p>
                </div>
                <span className="text-xs text-[#16D9FF] font-mono bg-[#16D9FF]/10 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#16D9FF]/20">
                  Total Stages: 10
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roadmap?.next_version?.pipeline_stages?.map((stage) => (
                  <div
                    key={stage.step}
                    className="p-3.5 rounded-2xl bg-white dark:bg-[#0B111C] border border-slate-200 dark:border-[#203244] hover:border-slate-200 dark:border-[#16D9FF]/40 transition-all flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#16D9FF]/10 border border-slate-200 dark:border-[#16D9FF]/30 flex items-center justify-center text-[#16D9FF] font-mono font-bold text-xs shrink-0 mt-0.5">
                      {String(stage.step).padStart(2, '0')}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white font-ui truncate">{stage.title}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            stage.status === 'Ready'
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                          }`}
                        >
                          {stage.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{stage.khmer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: HARDWARE DIAGNOSTIC & SAFETY */}
          {activeTab === 'hardware' && (
            <div className="space-y-6">
              {/* Hardware Status Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#101925] via-[#0B111C] to-[#152235] border border-slate-200 dark:border-[#203244] flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                    <Activity className="w-3.5 h-3.5" />
                    <span>លទ្ធផលវិភាគ Hardware ម៉ាស៊ីននេះ</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">
                    ចំណាត់ថ្នាក់កុំព្យូទ័រ៖{' '}
                    <span className="text-[#16D9FF] font-mono">{hardware?.tier || 'STANDARD'}</span>
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    ការណែនាំ៖ <span className="text-emerald-600 dark:text-emerald-400 font-bold">{hardware?.recommendation}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-center">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">CPU Cores</div>
                    <div className="text-sm font-black text-slate-800 dark:text-white font-mono">{hardware?.cpu?.cores || 4} Cores</div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-center">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Total RAM</div>
                    <div className="text-sm font-black text-slate-800 dark:text-white font-mono">{hardware?.ram?.total_gb || 8} GB</div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-center">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">GPU VRAM</div>
                    <div className="text-sm font-black text-[#16D9FF] font-mono">
                      {hardware?.gpu?.has_cuda ? `${hardware?.gpu?.vram_gb} GB` : 'DirectX/DSP'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Safe Modes Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  របៀប Safe Mode ទាំង ៤ ដើម្បីការពារកុំឱ្យគាំងម៉ាស៊ីន (Hardware Governor)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {roadmap?.next_version?.safe_modes &&
                    Object.entries(roadmap.next_version.safe_modes).map(([key, mode]) => (
                      <div
                        key={key}
                        className={`p-4 rounded-xl border flex flex-col justify-between ${
                          key === hardware?.recommended_safe_mode
                            ? 'bg-slate-100 dark:bg-[#152235] border-slate-200 dark:border-[#16D9FF] shadow-[0_0_20px_rgba(22,217,255,0.2)]'
                            : 'bg-white dark:bg-[#0B111C] border-slate-200 dark:border-[#203244]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-black text-[#16D9FF] font-mono">{key}</span>
                            {key === hardware?.recommended_safe_mode && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                                RECOMMENDED
                              </span>
                            )}
                          </div>
                          <h5 className="text-xs font-bold text-slate-800 dark:text-white mb-2">{mode.title}</h5>
                          <p className="text-[11px] text-[#94A3B8] leading-relaxed">{mode.description}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-200 dark:border-white/[0.08] text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          Threads: {mode.threads === 0 ? 'Auto Max' : mode.threads} • Preset: {mode.preset}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PLUGGABLE ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">ស្ថាបត្យកម្មឯករាជ្យ Pluggable Provider Layers</h3>
                <p className="text-xs text-[#94A3B8]">
                  UI មិនត្រូវបានភ្ជាប់រឹងស្តូកទៅនឹង Model ណាមួយឡើយ ដែលអនុញ្ញាតឱ្យបន្ថែម Provider ថ្មីៗដោយមិនបាច់សរសេរកម្មវិធីឡើងវិញ។
                </p>
              </div>

              {/* Architecture Diagram */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#0B111C] border border-slate-200 dark:border-[#203244] space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 font-bold flex items-center justify-between">
                  <span>1. User Interface (React 19 + TypeScript + Tailwind)</span>
                  <span className="text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded">Client Shell</span>
                </div>
                <div className="text-center text-slate-500 font-bold">↓ (REST API & Server-Sent Events)</div>
                <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-500/30 text-blue-300 font-bold flex items-center justify-between">
                  <span>2. State Management & Dubbing Service Orchestrator</span>
                  <span className="text-[10px] bg-blue-500/20 px-2 py-0.5 rounded">Core Logic</span>
                </div>
                <div className="text-center text-slate-500 font-bold">↓ (Provider Adapters Abstraction)</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="p-2 rounded bg-black/40 border border-white/10 text-center">
                    <span className="text-[#16D9FF] font-bold block">ASRProvider</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Faster-Whisper / Cloud</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-white/10 text-center">
                    <span className="text-[#00FFA8] font-bold block">TranslationProvider</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Gemini / NLLB / Ollama</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-white/10 text-center">
                    <span className="text-purple-400 font-bold block">TTSProvider</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Edge-TTS / VoxCPM2</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-white/10 text-center">
                    <span className="text-sky-600 dark:text-amber-400 font-bold block">SeparationProvider</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Meta Demucs / UVR</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-white/10 text-center">
                    <span className="text-rose-400 font-bold block">LipSyncProvider</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Wav2Lip Hardware-aware</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-white/10 text-center">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold block">RenderProvider</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">FFmpeg Multi-Track</span>
                  </div>
                </div>
                <div className="text-center text-slate-500 font-bold">↓ (Media Engine)</div>
                <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 font-bold flex items-center justify-between">
                  <span>3. High-Fidelity FFmpeg 7.0 Master Pipeline + SQLite Database</span>
                  <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">Master Output</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EARLY ACCESS & PERMISSIONS */}
          {activeTab === 'early_access' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">សិទ្ធិប្រើប្រាស់សាកល្បងមុនគេ (Early Access Permissions)</h3>
                <p className="text-xs text-[#94A3B8]">
                  គ្រប់គ្រង Feature Flag ដើម្បីអនុញ្ញាតឱ្យអ្នកប្រើប្រាស់ VIP / Admin សាកល្បង Engine ថ្មីមុនពេលបញ្ចេញជាសាធារណៈ។
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#0B111C] border border-slate-200 dark:border-[#203244] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-800 dark:text-white">Feature Flag: advanced_dubbing_v2</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          earlyAccessActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {earlyAccessActive ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <p className="text-xs text-[#94A3B8]">
                      បើកដំណើរការម៉ូឌុលពិសោធន៍ Advanced Dubbing V2 សម្រាប់គណនីបច្ចុប្បន្ន
                    </p>
                  </div>

                  <DragonButton
                    variant={earlyAccessActive ? 'energy' : 'outline'}
                    size="sm"
                    onClick={handleToggleEarlyAccess}
                    disabled={isTogglingFlag}
                  >
                    {isTogglingFlag
                      ? 'កំពុងកែប្រែ...'
                      : earlyAccessActive
                      ? '✓ Early Access សកម្ម'
                      : 'បើក Early Access'}
                  </DragonButton>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-sky-600 dark:text-amber-400 shrink-0" />
                  <span>
                    ការបើក Early Access នឹងមិនប៉ះពាល់ដល់ទិន្នន័យចាស់ ឬគម្រោងកំពុងកែប្រែរបស់អ្នកឡើយ។
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white dark:bg-[#0B111C] border-t border-slate-200 dark:border-[#203244] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>DRAGON DABBER PRO — ផលិតផល Commercial ពិតប្រាកដ មានការធានាសុវត្ថិភាព 100%</span>
          </div>

          <DragonButton variant="jade" size="sm" onClick={onClose}>
            យល់ព្រម & ត្រឡប់ទៅកាន់ស្ទូឌីយោ
          </DragonButton>
        </div>
      </div>
    </div>
  );
};
