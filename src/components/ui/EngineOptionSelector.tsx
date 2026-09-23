import React from 'react';
import { Cpu, Cloud, Zap, Key, Sparkles, CheckCircle2 } from 'lucide-react';
import { StudioEngineOption, User } from '../../types';

interface EngineOptionSelectorProps {
  activeEngine: StudioEngineOption;
  onSelectEngine: (engine: StudioEngineOption) => void;
  user: User | null;
  onOpenLicenseModal?: () => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  compact?: boolean;
}

export const EngineOptionSelector: React.FC<EngineOptionSelectorProps> = ({
  activeEngine,
  onSelectEngine,
  user,
  onOpenLicenseModal,
  onShowToast,
  compact = false,
}) => {
  const isLicensed = Boolean(
    user && (user.role === 'admin' || user.has_voxcpm_license)
  );

  const handleOptionClick = (option: StudioEngineOption) => {
    if ((option === 'voxcpm_computer' || option === 'voxcpm_claude') && !isLicensed) {
      if (onShowToast) {
        onShowToast(
          '🔒 ជម្រើស VOXCPM2 ត្រូវការ Key License ពី Admin! សូមទិញ Key ដើម្បីដំណើរការ។',
          'warning'
        );
      }
      if (onOpenLicenseModal) {
        onOpenLicenseModal();
      }
      return;
    }

    onSelectEngine(option);
    if (onShowToast) {
      const labels: Record<StudioEngineOption, string> = {
        voxcpm_computer: '🖥️ បានប្ដូរទៅ Option 1: VOXCPM2 COMPUTER (Local RTX Clone)',
        voxcpm_claude: '☁️ បានប្ដូរទៅ Option 2: VOXCPM2 CLAUDE (Cloud Server Clone)',
        khmer_offline: '⚡ បានប្ដូរទៅ Option 3: KHMER OFFLINE (លឿន 1-20 ភាគ / រឿងពេញ)',
      };
      onShowToast(labels[option], 'success');
    }
  };

  // Full 3 engine options definition
  const ALL_OPTIONS = [
    {
      id: 'voxcpm_computer' as StudioEngineOption,
      number: 'OPTION 1',
      name: 'VOXCPM2 COMPUTER',
      sublabel: 'កុំព្យូទ័រផ្ទាល់ RTX GPU',
      icon: <Cpu className="w-4 h-4 text-cyan-400" />,
      requiresLicense: true,
      badgeText: 'PRO HARDWARE',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      activeGradient:
        'from-cyan-500/25 via-blue-500/15 to-transparent border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]',
    },
    {
      id: 'voxcpm_claude' as StudioEngineOption,
      number: 'OPTION 2',
      name: 'VOXCPM2 CLAUDE',
      sublabel: 'Claude Cloud Server GPU',
      icon: <Cloud className="w-4 h-4 text-violet-400" />,
      requiresLicense: true,
      badgeText: 'PRO CLOUD',
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
      activeGradient:
        'from-violet-500/25 via-purple-500/15 to-transparent border-violet-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]',
    },
    {
      id: 'khmer_offline' as StudioEngineOption,
      number: 'OPTION 3',
      name: 'KHMER OFFLINE',
      sublabel: '១ ដល់ ២០ ភាគ / រឿងពេញ',
      icon: <Zap className="w-4 h-4 text-emerald-400" />,
      requiresLicense: false,
      badgeText: 'FREE • ULTRA FAST',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      activeGradient:
        'from-emerald-500/25 via-teal-500/15 to-transparent border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    },
  ];

  // ── STRICT LICENSE GUARD: If user has no Key License, Option 1 & 2 are 100% GONE ──
  const visibleOptions = isLicensed
    ? ALL_OPTIONS
    : ALL_OPTIONS.filter((opt) => !opt.requiresLicense);

  // ── COMPACT VARIANT (Studio Toolbar Header) ──
  if (compact) {
    if (!isLicensed) {
      // ONLY Option 3: KHMER OFFLINE is visible!
      return (
        <div className="flex items-center gap-2 font-khmer">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-slate-900/90 border border-emerald-500/40 text-emerald-300 font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="tracking-wide">OPTION 3: KHMER OFFLINE</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 border border-emerald-500/40 font-mono font-bold">
              FREE
            </span>
          </div>

          {onOpenLicenseModal && (
            <button
              type="button"
              onClick={onOpenLicenseModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all shadow-sm active:scale-95"
              title="ទិញ Key License ពី Admin ដើម្បីដំណើរការ Option 1 & 2"
            >
              <Key className="w-3 h-3 text-amber-400" />
              <span>ទិញ Key License</span>
            </button>
          )}
        </div>
      );
    }

    // When licensed, show all 3 options
    return (
      <div className="flex items-center gap-1.5 p-1 bg-[#090d16] border border-white/[0.08] rounded-xl font-khmer">
        {visibleOptions.map((opt) => {
          const isActive = activeEngine === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => handleOptionClick(opt.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r ' + opt.activeGradient + ' text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
              title={opt.name}
            >
              {opt.icon}
              <span className="text-[11px] tracking-wide">{opt.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // ── FULL / EXPANDED VARIANT ──
  return (
    <div className="w-full flex flex-col gap-2.5 font-khmer select-none">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {isLicensed
                ? 'ជម្រើសម៉ាស៊ីនដំណើរការ (3 STUDIO ENGINE OPTIONS)'
                : 'ម៉ាស៊ីនដំណើរការ (STUDIO ENGINE)'}
            </span>
          </span>
          {!isLicensed && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              KHMER OFFLINE ឥតគិតថ្លៃ
            </span>
          )}
        </div>

        {!isLicensed && onOpenLicenseModal && (
          <button
            onClick={onOpenLicenseModal}
            className="flex items-center gap-1.5 text-[11px] text-amber-400 hover:text-amber-300 font-bold underline decoration-amber-500/40 hover:decoration-amber-400 transition-all"
          >
            <Key className="w-3.5 h-3.5" />
            <span>ទិញ KEY LICENSE ពី ADMIN ដើម្បីបើក OPTION 1 & 2</span>
          </button>
        )}
      </div>

      {/* Grid of Visible Options */}
      <div
        className={`grid gap-2.5 ${
          isLicensed ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'
        }`}
      >
        {visibleOptions.map((opt) => {
          const isActive = activeEngine === opt.id;

          return (
            <div
              key={opt.id}
              onClick={() => handleOptionClick(opt.id)}
              className={`relative cursor-pointer rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all duration-300 ${
                isActive
                  ? `bg-gradient-to-br ${opt.activeGradient} border-2`
                  : 'bg-[#0b0f19]/80 border-white/[0.08] hover:border-white/[0.2] hover:bg-[#0f1422]'
              }`}
            >
              {/* Top Row */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">
                  {opt.number}
                </span>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${opt.badgeColor}`}
                  >
                    {opt.badgeText}
                  </span>

                  {isActive && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  )}
                </div>
              </div>

              {/* Middle Row */}
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl border ${
                    isActive
                      ? 'bg-white/10 border-white/20'
                      : 'bg-white/[0.03] border-white/[0.06]'
                  }`}
                >
                  {opt.icon}
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black text-white tracking-wide">
                    {opt.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {opt.sublabel}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
