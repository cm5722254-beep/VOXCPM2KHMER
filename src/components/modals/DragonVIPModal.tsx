import React from 'react';
import {
  X,
  Crown,
  Sparkles,
  Check,
  Zap,
  HardDrive,
  Cpu,
  Clock,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';
import { DragonButton } from '../dragon/DragonButton';
import { User } from '../../types';

interface DragonVIPModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onOpenLicenseActivation?: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const DragonVIPModal: React.FC<DragonVIPModalProps> = ({
  isOpen,
  onClose,
  onOpenLicenseActivation,
}) => {
  if (!isOpen) return null;

  const handleTelegramClick = () => {
    if (typeof window !== 'undefined') {
      window.open('https://t.me/BongCheatz_IT', '_blank');
    }
  };

  const features = [
    { icon: <Zap className="w-4 h-4 text-[#16D9FF]" />, text: 'UNLIMITED Credits សម្រាប់ទាញយកសំឡេង AI' },
    { icon: <Clock className="w-4 h-4 text-[#00FFA8]" />, text: 'គ្មានដែនកំណត់នាទីក្នុងការ Generate និង Render' },
    { icon: <Cpu className="w-4 h-4 text-sky-600 dark:text-amber-400" />, text: 'Turbo GPU Render លឿនទាន់ចិត្ត 4K/8K' },
    { icon: <Sparkles className="w-4 h-4 text-[#16D9FF]" />, text: 'ចម្លងសំឡេង (Voice Cloning) គ្មានដែនកំណត់' },
    { icon: <HardDrive className="w-4 h-4 text-purple-400" />, text: 'Cloud Storage មិនកំណត់ (Auto Sync)' },
    { icon: <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />, text: 'ប្រើប្រាស់ Video Effects & Color Studio ពេញលេញ' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#070A12] border border-slate-200 dark:border-[#203244] rounded-3xl shadow-2xl overflow-hidden font-khmer z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-8 border-b border-slate-200 dark:border-[#203244] bg-slate-50 dark:bg-gradient-to-b dark:from-[#101925] dark:to-[#070A12] text-center relative overflow-hidden">
          {/* Dragon Magic Circle Glow Accent (Dark mode only) */}
          <div className="hidden dark:block absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-gradient-to-b from-[#16D9FF]/20 via-[#8B5CF6]/15 to-transparent blur-3xl pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-[#16D9FF]/10 border border-blue-200 dark:border-[#16D9FF]/30 text-blue-600 dark:text-[#16D9FF] text-xs font-bold mb-3 shadow-sm">
            <Crown className="w-3.5 h-3.5 text-blue-600 dark:text-amber-400" />
            <span>PREMIUM STUDIO LICENSE</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white font-ui tracking-wide">
            UPGRADE TO PRO STUDIO
          </h2>
          <p className="text-sm text-slate-600 dark:text-[#94A3B8] max-w-lg mx-auto mt-2">
            ដោះសោមុខងារគ្មានដែនកំណត់ និងបង្កើនល្បឿនការងាររបស់អ្នកជាមួយ License ផ្លូវការ។
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          
          <div className="bg-slate-50 dark:bg-[#0B111C] border border-slate-200 dark:border-[#203244] rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-700 dark:text-amber-500" />
              មុខងារពិសេសសម្រាប់ Pro Studio
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5">{f.icon}</div>
                  <span className="text-sm text-slate-600 dark:text-slate-300 leading-snug">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-gradient-to-r dark:from-[#152235] dark:to-[#0D1522] border border-blue-200 dark:border-[#16D9FF]/50 rounded-2xl p-6 text-center relative overflow-hidden shadow-sm dark:shadow-[0_0_30px_rgba(22,217,255,0.15)]">
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">
              ទិញ License Key ផ្លូវការ
            </h3>
            <p className="text-sm text-slate-600 dark:text-[#94A3B8] mb-6">
              កម្មវិធីនេះតម្រូវឲ្យទិញ License Key ជាវប្រចាំ ឬទិញផ្តាច់ (Lifetime) ពី Admin ផ្ទាល់តាមរយៈ Telegram ខាងក្រោម។
            </p>

            <button
              onClick={handleTelegramClick}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 w-full sm:w-auto rounded-xl bg-[#229ED9] hover:bg-[#1C88BA] text-slate-800 dark:text-white font-bold transition-all shadow-lg shadow-[#229ED9]/30 active:scale-95"
            >
              <MessageCircle className="w-5 h-5" />
              ទាក់ទង Admin: @BongCheatz_IT
            </button>
          </div>

        </div>

        {/* Footer Activation Banner */}
        <div className="px-8 py-5 bg-slate-100 dark:bg-[#0B111C] border-t border-slate-200 dark:border-[#203244] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-[#00FFA8]" />
            <span>តើអ្នកមាន License Key រួចហើយមែនទេ?</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-sm font-bold transition-colors"
            >
              បិទផ្ទាំង
            </button>
            <DragonButton
              variant="energy"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => {
                onClose();
                onOpenLicenseActivation?.();
              }}
            >
              🔑 បញ្ចូល License Key
            </DragonButton>
          </div>
        </div>
      </div>
    </div>
  );
};
