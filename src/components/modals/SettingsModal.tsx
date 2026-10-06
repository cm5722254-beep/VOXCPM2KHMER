import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  ExternalLink,
  Save,
  Copy,
  Check,
  HardDrive,
  Trash2,
  LogOut,
  User as UserIcon,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Clock,
  Crown,
  Zap,
  Eye,
  EyeOff,
  Wifi,
  Cpu,
  Bot,
  Key,
  Layers,
  ArrowRight,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';
import { User } from '../../types';
import { getLicenseInfo } from '../../utils/subscription';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onRefreshConfig: () => void;
  user?: User | null;
  onLogout?: () => void;
  onOpenLicenseModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onRefreshConfig,
  user,
  onLogout,
  onOpenLicenseModal,
}) => {
  const [elevenKey, setElevenKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-3.5-flash');
  const [voxcpmUrl, setVoxcpmUrl] = useState('');
  const [lanUrl, setLanUrl] = useState('');
  const [diskStats, setDiskStats] = useState<{ formattedSize: string; count: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [showElevenKey, setShowElevenKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [copiedLan, setCopiedLan] = useState(false);
  const [copiedMachineId, setCopiedMachineId] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getConfig().then((cfg) => {
        if (cfg.geminiModel) setGeminiModel(cfg.geminiModel);
        if (cfg.voxcpmUrl) setVoxcpmUrl(cfg.voxcpmUrl);
      }).catch(() => {});
      api.getNetworkInfo().then((net) => {
        if (net.primaryLanUrl) setLanUrl(net.primaryLanUrl);
      }).catch(() => {});
      api.getOutputStats().then((stats) => {
        setDiskStats(stats);
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const lic = getLicenseInfo(user || null);
  const machineId = user?.machine_id || user?.current_device_id || 'UNKNOWN';

  const handleCopyLan = () => {
    if (lanUrl) {
      navigator.clipboard.writeText(lanUrl);
      setCopiedLan(true);
      onShowToast('📋 បានចម្លង Link Wi-Fi / LAN!', 'info');
      setTimeout(() => setCopiedLan(false), 2000);
    }
  };

  const handleCopyMachineId = () => {
    if (machineId) {
      navigator.clipboard.writeText(machineId);
      setCopiedMachineId(true);
      onShowToast('📋 បានចម្លង Machine ID ទៅ Clipboard!', 'info');
      setTimeout(() => setCopiedMachineId(false), 2000);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateConfig({
        elevenlabsKey: elevenKey || undefined,
        geminiKey: geminiKey || undefined,
        geminiModel,
        voxcpmUrl: voxcpmUrl || undefined,
      });
      onShowToast('💾 បានរក្សាទុកការកំណត់ប្រព័ន្ធជោគជ័យ!', 'success');
      onRefreshConfig();
      onClose();
    } catch (e: any) {
      onShowToast(`⚠️ កំហុស: ${e.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearOutputs = async () => {
    if (!window.confirm('តើអ្នកពិតជាចង់សម្អាតឯកសារ Output ទាំងអស់ដើម្បីសន្សំទំហំថាសមែនទេ?')) return;
    setIsCleaning(true);
    try {
      const res = await api.clearOutputs();
      if (res.success) {
        onShowToast(`🧹 បានសម្អាត ${res.count} ឯកសារ (សន្សំបាន ${res.formattedFreed || '0 MB'})!`, 'success');
        api.getOutputStats().then(setDiskStats).catch(() => {});
      }
    } catch (e: any) {
      onShowToast(`កំហុសក្នុងការសម្អាត: ${e.message}`, 'error');
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    /* ── Backdrop: bg-black/70 backdrop-blur-md with vignette ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none font-khmer animate-in fade-in duration-200"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.70) 60%, rgba(0,0,0,0.92) 100%)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* ── Modal Container ── */}
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-100 dark:bg-[#141417] border border-white/[0.10] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* ── Header ── */}
        <div className="shrink-0 px-5 py-4 flex items-center justify-between relative">
          {/* Gradient border-bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 flex items-center justify-center shadow-sm">
              <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                ការកំណត់ API & ប្រព័ន្ធ
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                System & AI Config • API Keys • License • LAN
              </p>
            </div>
          </div>

          {/* Close button with hover ring */}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:text-white hover:bg-slate-200 dark:bg-white/[0.08] ring-0 hover:ring-1 hover:ring-white/20 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Modal Body (Scrollable) ── */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 text-xs custom-scrollbar">

          {/* ── 1. User Account & License Card ── */}
          <div className="rounded-xl bg-white dark:bg-[#1a1d23] border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] p-4 flex flex-col gap-3 hover:border-white/[0.14] transition-colors">
            {/* Identity Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 flex items-center justify-center text-slate-800 dark:text-white font-black text-sm shadow-lg border border-white/20">
                    {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ring-2 ring-[#141417] ${
                    lic.isLicensed ? 'bg-emerald-500' : 'bg-rose-500'
                  }`} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[160px] sm:max-w-[220px]">
                      {user?.username || 'អ្នកប្រើប្រាស់ស្ទូឌីយោ'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      lic.isLicensed
                        ? lic.isLifetime
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}>
                      {lic.badgeLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1 text-amber-300/90 font-medium">
                      <Crown className="w-3 h-3 text-sky-600 dark:text-amber-400" />
                      <span>{user?.role === 'admin' ? 'Master Admin' : lic.planLabel}</span>
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400/80">
                      ID: {machineId.slice(0, 9)}...
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {onOpenLicenseModal && (
                  <button
                    type="button"
                    onClick={onOpenLicenseModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-800 dark:text-white text-xs font-bold shadow-lg active:scale-95 transition-all"
                    title="គ្រប់គ្រង ឬបន្តសុពលភាព Key License"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">បន្ត Key</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    type="button"
                    onClick={() => { onClose(); onLogout(); }}
                    className="p-2 rounded-xl bg-red-500/10 text-blue-600 dark:text-red-400 border border-red-500/30 hover:bg-blue-50 dark:bg-red-500/20 transition-all active:scale-95"
                    title="ចាកចេញ (Logout)"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* License Status Grid */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-white dark:bg-[#0f1013] border border-white/[0.07] text-center">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">ប្រភេទ</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-full">{lic.planLabel}</span>
              </div>
              <div className="flex flex-col items-center gap-1 border-x border-slate-200 dark:border-slate-200 dark:border-white/[0.08]">
                <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> ផុតកំណត់
                </span>
                <span className="text-xs font-bold text-amber-300 font-mono truncate max-w-full">{lic.formattedDate}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> នៅសល់
                </span>
                <span className={`text-xs font-bold font-mono ${lic.isLicensed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-400'}`}>
                  {lic.isLicensed
                    ? lic.isLifetime
                      ? 'ជារៀងរហូត'
                      : lic.daysLeft !== null && lic.daysLeft > 0
                        ? `${lic.daysLeft} ថ្ងៃ`
                        : `${lic.hoursLeft || 0} ម៉ោង`
                    : 'ផុតកំណត់'}
                </span>
              </div>
            </div>

            {/* Machine ID Bar */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#0f1013] border border-white/[0.07]">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400 min-w-0 truncate">
                <span className="font-semibold text-slate-700 dark:text-zinc-300 shrink-0">Hardware ID:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400/90 font-bold truncate">{machineId}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyMachineId}
                className="shrink-0 flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg bg-white dark:bg-[#1e2127] border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] hover:border-white/20 text-zinc-200 transition-all"
              >
                {copiedMachineId ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedMachineId ? 'បានចម្លង' : 'ចម្លង'}</span>
              </button>
            </div>
          </div>

          {/* ── 2. ElevenLabs API Key ── */}
          <div className="rounded-xl bg-white dark:bg-[#1a1d23] border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] p-4 space-y-2 hover:border-white/[0.14] transition-colors">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                ElevenLabs API Key (Voice Cloning)
              </label>
              <a
                href="https://elevenlabs.io"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px] font-semibold transition-colors"
              >
                <span>យក Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showElevenKey ? 'text' : 'password'}
                value={elevenKey}
                onChange={(e) => setElevenKey(e.target.value)}
                placeholder="sk_... (ទុកទំនេរប្រសិនបើបានកំណត់រួច)"
                className="w-full bg-white dark:bg-[#0f1013] border border-white/[0.10] rounded-xl px-3 py-2 pr-10 text-zinc-100 placeholder-zinc-600 font-mono text-xs outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition"
              />
              <button
                type="button"
                onClick={() => setShowElevenKey(!showElevenKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-slate-800 dark:text-white transition-colors"
              >
                {showElevenKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-zinc-600 leading-relaxed">
              ប្រើសម្រាប់ម៉ូដបញ្ចូលសំឡេងស្វ័យប្រវត្តិតាមរយៈ ElevenLabs Voice Actor
            </p>
          </div>

          {/* ── 3. Google Gemini API Key & Model ── */}
          <div className="rounded-xl bg-white dark:bg-[#1a1d23] border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] p-4 space-y-3 hover:border-white/[0.14] transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Google Gemini API Key
                </label>
                <a
                  href="https://aistudio.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px] font-semibold transition-colors"
                >
                  <span>យក Key ឥតគិតថ្លៃ</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AQ.Ab... (ទុកទំនេរប្រសិនបើបានកំណត់រួច)"
                  className="w-full bg-white dark:bg-[#0f1013] border border-white/[0.10] rounded-xl px-3 py-2 pr-10 text-zinc-100 placeholder-zinc-600 font-mono text-xs outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-slate-800 dark:text-white transition-colors"
                >
                  {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Gemini Model Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ម៉ូឌែល AI Gemini
              </label>
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="w-full bg-white dark:bg-[#0f1013] border border-white/[0.10] rounded-xl px-3 py-2 text-emerald-300 font-semibold text-xs outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition cursor-pointer"
              >
                <option value="gemini-3.5-flash">⚡ Gemini 3.5 Flash (លឿន & ឆ្លាតវៃ - Recommended)</option>
                <option value="gemini-3.1-flash-lite">🚀 Gemini 3.1 Flash-Lite (លឿនបំផុត Ultra-Fast)</option>
                <option value="gemini-3.7-flash">🧠 Gemini 3.7 Flash (Advanced Reasoning & Theatrical Nuance)</option>
                <option value="gemini-flash-latest">🔄 Gemini Flash Latest (Google Default)</option>
              </select>
            </div>
          </div>

          {/* ── 4. VoxCPM2 Local / Cloud URL ── */}
          <div className="rounded-xl bg-white dark:bg-[#1a1d23] border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] p-4 space-y-2 hover:border-white/[0.14] transition-colors">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-teal-400" />
                VoxCPM2 Kaggle / Colab URL
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">
                {voxcpmUrl && voxcpmUrl.includes('trycloudflare') ? '☁️ Cloud GPU' : '💻 Local'}
              </span>
            </div>
            <input
              type="text"
              value={voxcpmUrl}
              onChange={(e) => setVoxcpmUrl(e.target.value)}
              placeholder="http://127.0.0.1:8000 ឬ https://xxxx.trycloudflare.com"
              className="w-full bg-white dark:bg-[#0f1013] border border-white/[0.10] rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-600 font-mono text-xs outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition"
            />
          </div>

          {/* ── 5. Wi-Fi / LAN Sharing ── */}
          <div className="rounded-xl bg-white dark:bg-[#1a1d23] border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] p-4 space-y-2.5 hover:border-white/[0.14] transition-colors">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Wi-Fi / LAN Network Share
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Live
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 leading-relaxed">
              បើក Link នៅលើទូរស័ព្ទ ឬកុំព្យូទ័រក្នុង Network ដើម្បីគ្រប់គ្រងពីចំងាយ
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={lanUrl || 'កំពុងស្វែងរក...'}
                className="flex-1 bg-white dark:bg-[#0f1013] border border-white/[0.10] rounded-xl px-3 py-2 text-emerald-300 font-mono text-xs outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLan}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1e2127] border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] hover:border-white/20 text-slate-800 dark:text-white flex items-center gap-1.5 font-bold text-xs transition-all active:scale-95 shrink-0"
              >
                {copiedLan ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLan ? 'បានចម្លង' : 'ចម្លង'}</span>
              </button>
            </div>
          </div>

          {/* ── 6. Storage & Disk Cleanup ── */}
          <div className="rounded-xl bg-white dark:bg-[#1a1d23] border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] p-4 space-y-2.5 hover:border-white/[0.14] transition-colors">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-600 dark:text-red-400" />
                Output Storage & Cleanup
              </label>
              <span className="font-mono text-red-300 font-bold text-xs bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/30">
                {diskStats?.formattedSize || '0 B'}
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 leading-relaxed">
              លុបឯកសារ Render ចាស់ក្នុងថត{' '}
              <code className="text-red-300 font-mono bg-black/40 px-1 rounded">outputs/</code>{' '}
              ដើម្បីបង្កើនទំហំទំនេរ
            </p>

            <button
              type="button"
              onClick={handleClearOutputs}
              disabled={isCleaning}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-blue-600 dark:text-red-400 border border-red-500/30 hover:bg-blue-50 dark:bg-red-500/20 font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isCleaning ? 'កំពុងសម្អាត...' : 'សម្អាតឯកសារ Output ទាំងអស់'}</span>
            </button>
          </div>

        </div>

        {/* ── Modal Footer ── */}
        <div className="shrink-0 px-5 py-3.5 border-t border-slate-200 dark:border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1013]/80 flex items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-600">
            Khmer Dubbing Pro • System Config
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white dark:bg-[#1e2127] border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] hover:border-white/20 text-slate-700 dark:text-zinc-300 text-xs transition-all"
            >
              បោះបង់
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-800 dark:text-white font-bold text-xs shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
