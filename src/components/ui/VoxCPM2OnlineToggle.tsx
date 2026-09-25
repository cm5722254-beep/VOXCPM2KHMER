import React, { useState } from 'react';
import { CloudLightning, Laptop, Globe, Loader2, Check, Lock, Key } from 'lucide-react';
import { VoxcpmStatus, User } from '../../types';

interface VoxCPM2OnlineToggleProps {
  engineMode: string;                           // 'local' | 'cloud' | 'local_gpu'
  voxStatus?: VoxcpmStatus | null;
  user?: User | null;
  onSwitchEngine: (mode: string) => void;       // called with 'cloud' | 'local'
  onOpenVoxModal?: () => void;                  // opens URL config modal
  onOpenLicenseModal?: () => void;              // opens license activation modal
  compact?: boolean;                            // smaller version for header
  variant?: 'compact' | 'prominent' | 'card';   // layout variant
  title?: string;
  showDetails?: boolean;
}

export const VoxCPM2OnlineToggle: React.FC<VoxCPM2OnlineToggleProps> = ({
  engineMode,
  voxStatus,
  user,
  onSwitchEngine,
  onOpenVoxModal,
  onOpenLicenseModal,
  compact = false,
  variant,
  title = 'ម៉ាស៊ីនក្លូនសំឡេង AI',
  showDetails = true,
}) => {
  const [isSwitching, setIsSwitching] = useState(false);

  // Check license permission
  const isLicensed = Boolean(user && (user.role === 'admin' || user.has_voxcpm_license));

  // If user does not have key license, completely hide VoxCPM2 toggle from UI!
  if (!isLicensed) {
    return null;
  }

  const isOnline = engineMode === 'cloud';
  const isConnected = Boolean(voxStatus && (voxStatus.online || voxStatus.configured));
  const activeVariant = variant || (compact ? 'compact' : 'card');

  const handleToggle = async (targetMode?: 'cloud' | 'local') => {
    // If not licensed, open license activation modal directly
    if (!isLicensed) {
      if (onOpenLicenseModal) onOpenLicenseModal();
      return;
    }

    if (isSwitching) return;
    setIsSwitching(true);

    const newMode = targetMode !== undefined ? targetMode : (isOnline ? 'local' : 'cloud');
    onSwitchEngine(newMode);

    // When switching TO online, if not configured or has modal handler, trigger modal
    if (newMode === 'cloud' && onOpenVoxModal && (!voxStatus || !voxStatus.configured)) {
      setTimeout(() => onOpenVoxModal(), 200);
    }

    setTimeout(() => setIsSwitching(false), 500);
  };

  /* ─────────────────────────────────────────────────────────────
     1. COMPACT VARIANT (for Header navigation bar)
  ───────────────────────────────────────────────────────────── */
  if (activeVariant === 'compact') {
    if (!isLicensed) {
      return (
        <button
          id="voxcpm2-license-lock-compact"
          onClick={() => onOpenLicenseModal && onOpenLicenseModal()}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-[11px] font-bold font-khmer transition-all select-none shadow-sm"
          title="ត្រូវការ Key License ពី Admin ដើម្បីប្រើប្រាស់ VoxCPM2"
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Key VoxCPM2</span>
        </button>
      );
    }

    return (
      <div className="flex items-center gap-1.5 p-1 px-2 rounded-xl bg-black/50 border border-white/[0.1] shadow-inner">
        {/* Status Dot */}
        <div
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            isOnline
              ? isConnected
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                : 'bg-amber-400 animate-pulse'
              : 'bg-cyan-400'
          }`}
          title={isOnline ? (isConnected ? 'Cloud GPU ភ្ជាប់រួចរាល់' : 'កំពុងភ្ជាប់ Cloud…') : 'កុំព្យូទ័រផ្ទាល់ (Local)'}
        />

        {/* ON / OFF Toggle Button */}
        <button
          id="voxcpm2-online-toggle-compact"
          onClick={() => handleToggle()}
          disabled={isSwitching}
          title={isOnline ? 'ប្តូរទៅ ម៉ាស៊ីនផ្ទាល់ (Local)' : 'ប្តូរទៅ Cloud GPU'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all duration-300 disabled:opacity-70 active:scale-95 select-none ${
            isOnline
              ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
              : 'bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700/80'
          }`}
        >
          {isSwitching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          ) : isOnline ? (
            <CloudLightning className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          ) : (
            <Laptop className="w-3.5 h-3.5 text-cyan-400" />
          )}

          {/* Mode Name (Khmer & concise) */}
          <span className="tracking-wide hidden md:inline font-khmer">
            {isOnline ? 'Cloud GPU' : 'ម៉ាស៊ីនផ្ទាល់'}
          </span>

          {/* Pill Switch */}
          <div
            className={`w-6 h-3 rounded-full p-0.5 transition-all duration-300 flex items-center flex-shrink-0 ${
              isOnline ? 'bg-cyan-400 justify-end' : 'bg-slate-600 justify-start'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-black shadow-sm" />
          </div>
        </button>

        {/* Cloud Config Modal Button */}
        {onOpenVoxModal && (
          <button
            id="voxcpm2-config-btn-compact"
            onClick={onOpenVoxModal}
            title="កំណត់ Link Server (Colab / Kaggle)"
            className="p-1 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-white/[0.08] transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     2. CARD VARIANT (Clean, Modern, 100% Khmer, ZERO CLUTTER)
  ───────────────────────────────────────────────────────────── */
  return (
    <div
      id="voxcpm2-online-option-card"
      className="p-3 rounded-2xl bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-white/10 shadow-xs dark:shadow-lg select-none flex flex-col gap-2.5 font-khmer transition-colors duration-200"
    >
      {/* Header: Title + Active Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-slate-900 dark:text-white">ម៉ាស៊ីនក្លូនសំឡេង AI</span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              !isLicensed
                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                : isOnline
                ? 'bg-sky-100 dark:bg-cyan-500/20 text-sky-800 dark:text-cyan-300 border border-sky-300 dark:border-cyan-500/30'
                : 'bg-violet-100 dark:bg-violet-500/20 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-500/30'
            }`}
          >
            {!isLicensed ? 'ត្រូវការ Key License' : isOnline ? 'Cloud GPU' : 'ម៉ាស៊ីនកុំព្យូទ័រ'}
          </span>
        </div>

        {isLicensed && onOpenVoxModal && (
          <button
            onClick={onOpenVoxModal}
            title="កំណត់ Server Link (Colab / Kaggle)"
            className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-cyan-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {!isLicensed ? (
        /* Lock Banner for unlicensed users */
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0" />
            <div className="text-[11px] text-amber-900 dark:text-amber-200">
              User ធម្មតាត្រូវដាក់ Key License ពី Admin ទើបប្រើបាន
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenLicenseModal && onOpenLicenseModal()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold flex-shrink-0 transition-all shadow-sm"
          >
            <Key className="w-3 h-3" />
            <span>ដាក់ Key</span>
          </button>
        </div>
      ) : (
        /* 2 Clean Segmented Buttons: Local vs Cloud */
        <div className="grid grid-cols-2 gap-2">
          {/* Option 1: Local Computer */}
          <button
            type="button"
            onClick={() => handleToggle('local')}
            className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col gap-1 ${
              !isOnline
                ? 'bg-violet-50 dark:bg-violet-500/20 border-violet-300 dark:border-violet-400 text-violet-950 dark:text-white shadow-xs dark:shadow-[0_0_12px_rgba(139,92,246,0.3)] ring-1 ring-violet-300 dark:ring-violet-400/50'
                : 'bg-white dark:bg-black/30 border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Laptop className={`w-3.5 h-3.5 ${!isOnline ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>ម៉ាស៊ីនផ្ទាល់</span>
              </div>
              {!isOnline && <Check className="w-3 h-3 text-violet-600 dark:text-violet-300" />}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Offline 100%</span>
          </button>

          {/* Option 2: Cloud GPU */}
          <button
            type="button"
            onClick={() => handleToggle('cloud')}
            className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col gap-1 ${
              isOnline
                ? 'bg-sky-50 dark:bg-cyan-500/20 border-sky-400 dark:border-cyan-400 text-sky-950 dark:text-white shadow-xs dark:shadow-[0_0_12px_rgba(0,240,255,0.3)] ring-1 ring-sky-300 dark:ring-cyan-400/50'
                : 'bg-white dark:bg-black/30 border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <CloudLightning className={`w-3.5 h-3.5 ${isOnline ? 'text-sky-600 dark:text-cyan-400 animate-pulse' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>Cloud GPU</span>
              </div>
              {isOnline && <Check className="w-3 h-3 text-sky-600 dark:text-cyan-300" />}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Kaggle / Colab</span>
          </button>
        </div>
      )}

      {/* Status Bar */}
      {isLicensed && (
        <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                voxStatus?.online ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : isOnline ? 'bg-amber-400' : 'bg-emerald-500'
              }`}
            />
            <span>
              {isOnline
                ? voxStatus?.online
                  ? 'Cloud ភ្ជាប់រួចរាល់'
                  : 'Cloud មិនទាន់ភ្ជាប់ (ចុចកំណត់ Link)'
                : 'ម៉ាស៊ីនក្នុងស្រុក រួចរាល់ (Port 8000)'}
            </span>
          </div>

          {isOnline && onOpenVoxModal && (
            <button
              onClick={onOpenVoxModal}
              className="text-sky-600 dark:text-cyan-400 hover:underline font-semibold"
            >
              កំណត់ Link
            </button>
          )}
        </div>
      )}
    </div>
  );
};
