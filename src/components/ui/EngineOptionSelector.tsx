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
    onSelectEngine(option);
    if (onShowToast) {
      const labels: Record<StudioEngineOption, string> = {
        voxcpm_computer: '🖥️ បានប្ដូរទៅ Option 1: VOXCPM2 COMPUTER (Local RTX / CPU Turbo Auto-Fallback)',
        voxcpm_claude: '☁️ បានប្ដូរទៅ Option 2: VOXCPM2 CLOUD (Cloud Server GPU ឥតគិតថ្លៃ)',
        khmer_offline: '⚡ បានប្ដូរទៅ Option 3: KHMER OFFLINE (លឿន 1-20 ភាគ / គ្រប់កុំព្យូទ័រទាំងអស់)',
      };
      onShowToast(labels[option], 'success');
    }
  };

  // Full 3 engine options definition - unlocked for all computers
  const ALL_OPTIONS = [
    {
      id: 'voxcpm_computer' as StudioEngineOption,
      number: 'OPTION 1',
      name: 'VOXCPM2 COMPUTER',
      sublabel: 'កុំព្យូទ័រផ្ទាល់ RTX GPU / CPU Auto-Fallback',
      icon: <Cpu className="w-4 h-4 text-sky-600" />,
      requiresLicense: false,
      badgeText: 'LOCAL PRO',
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-300',
      activeGradient:
        'from-sky-500 to-blue-600 text-white shadow-sm',
    },
    {
      id: 'voxcpm_claude' as StudioEngineOption,
      number: 'OPTION 2',
      name: 'VOXCPM2 CLOUD',
      sublabel: 'Cloud GPU RTX 4090 / Colab / Kaggle',
      icon: <Cloud className="w-4 h-4 text-purple-600" />,
      requiresLicense: false,
      badgeText: 'CLOUD TURBO',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
      activeGradient:
        'from-purple-600 to-indigo-600 text-white shadow-sm',
    },
    {
      id: 'khmer_offline' as StudioEngineOption,
      number: 'OPTION 3',
      name: 'KHMER OFFLINE',
      sublabel: '១ ដល់ ២០ ភាគ / គ្រប់កុំព្យូទ័រទាំងអស់',
      icon: <Zap className="w-4 h-4 text-emerald-600" />,
      requiresLicense: false,
      badgeText: 'UNIVERSAL FAST',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      activeGradient:
        'from-emerald-500 to-teal-600 text-white shadow-sm',
    },
  ];

  // All 3 options are 100% active and selectable on every computer
  const visibleOptions = ALL_OPTIONS;

  // ── COMPACT VARIANT (Studio Toolbar Header) ──
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 border border-slate-200/90 rounded-xl font-khmer overflow-x-auto max-w-full shadow-2xs">
        {visibleOptions.map((opt) => {
          const isActive = activeEngine === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => handleOptionClick(opt.id)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r ' + opt.activeGradient + ' text-white font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white shadow-2xs'
              }`}
              title={opt.name + ' - ' + opt.sublabel}
            >
              {opt.icon}
              <span className="text-[10.5px] sm:text-[11px] tracking-wide whitespace-nowrap">{opt.name}</span>
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
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>ជម្រើសម៉ាស៊ីនដំណើរការទាំង ៣ (3 STUDIO ENGINE OPTIONS)</span>
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            ដំណើរការគ្រប់ COMPUTER
          </span>
        </div>
      </div>

      {/* Grid of Visible Options - 3 Engine Options */}
      <div className="grid gap-2.5 grid-cols-1 md:grid-cols-3">
        {visibleOptions.map((opt) => {
          const isActive = activeEngine === opt.id;

          return (
            <div
              key={opt.id}
              onClick={() => handleOptionClick(opt.id)}
              className={`relative cursor-pointer rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all duration-300 ${
                isActive
                  ? `bg-white border-2 border-sky-500 shadow-md shadow-sky-500/10`
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {/* Top Row */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500">
                  {opt.number}
                </span>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9.5px] font-bold font-mono px-2 py-0.5 rounded-full border ${opt.badgeColor}`}
                  >
                    {opt.badgeText}
                  </span>

                  {isActive && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
              </div>

              {/* Middle Row */}
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl border ${
                    isActive
                      ? 'bg-sky-50 border-sky-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {opt.icon}
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black text-slate-900 tracking-wide">
                    {opt.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
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
