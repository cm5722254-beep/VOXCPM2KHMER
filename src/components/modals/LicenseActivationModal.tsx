import React, { useState } from 'react';
import {
  X,
  Key,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Loader2,
  Calendar,
  Clock,
  Crown,
  Send,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { User } from '../../types';
import { getLicenseInfo } from '../../utils/subscription';

interface LicenseActivationModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const LicenseActivationModal: React.FC<LicenseActivationModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess,
  onShowToast,
}) => {
  const [keyCode, setKeyCode] = useState(() => {
    try {
      return user?.voxcpm_license_key || localStorage.getItem('voxcpm_license_key') || '';
    } catch {
      return '';
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Sync state if user changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      const existing = user?.voxcpm_license_key || localStorage.getItem('voxcpm_license_key') || '';
      if (existing) setKeyCode(existing);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const licenseInfo = getLicenseInfo(user);
  const machineId = user?.machine_id || user?.current_device_id || 'UNKNOWN';

  const handleCopyMachineId = () => {
    if (machineId) {
      navigator.clipboard.writeText(machineId);
      setCopiedId(true);
      onShowToast('📋 បានចម្លង Machine ID ទៅ Clipboard!', 'info');
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = keyCode.trim().toUpperCase();
    if (!cleanKey) {
      onShowToast('សូមបញ្ចូលលេខកូដ Key License', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = (await api.activateLicense(cleanKey)) as any;
      if (res.token) {
        localStorage.setItem('studio_auth_token', res.token);
      }
      // Save license key permanently in localStorage
      localStorage.setItem('voxcpm_license_key', cleanKey);
      if (res.user) {
        localStorage.setItem('voxcpm_license_cached_user', JSON.stringify(res.user));
      }
      onShowToast(res.message || '🎉 បានដំណើរការ Key License ជោគជ័យ!', 'success');
      if (res.user) {
        onSuccess(res.user);
      }
      onClose();
    } catch (err: any) {
      onShowToast(err.message || 'Key License មិនត្រឹមត្រូវ ឬត្រូវបានប្រើប្រាស់រួចហើយ', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none font-khmer">
      <div className="bg-white dark:bg-[#111827] border border-cyan-500/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.2)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-200 dark:border-white/[0.08] flex items-center justify-between bg-white dark:bg-[#0b0f19]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span>ព័ត៌មានអាជ្ញាប័ណ្ណ & Key License</span>
                {licenseInfo.isLicensed && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    Active
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ពិនិត្យការផុតកំណត់ និងបញ្ចូល Key ដើម្បីបន្តសុពលភាព
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-white p-1.5 rounded-xl hover:bg-slate-200 dark:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Detailed License Expiration & Status Box */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              licenseInfo.isLicensed
                ? licenseInfo.isLifetime
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : licenseInfo.color === 'amber'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {licenseInfo.isLicensed ? (
                  licenseInfo.isLifetime ? (
                    <Crown className="w-6 h-6 text-sky-600 dark:text-amber-400 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )
                ) : (
                  <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span>{licenseInfo.planLabel}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-black/40 border border-white/10 font-medium">
                      {licenseInfo.statusText}
                    </span>
                  </div>
                  <div className="text-xs opacity-90 mt-0.5">
                    {licenseInfo.badgeLabel}
                  </div>
                </div>
              </div>

              {licenseInfo.daysLeft !== null && (
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-slate-800 dark:text-white font-mono leading-none">
                    {licenseInfo.daysLeft}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                    ថ្ងៃនៅសល់
                  </div>
                </div>
              )}
            </div>

            {/* Expiration Details Grid */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">កាលបរិច្ឆេទផុតកំណត់:</span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {licenseInfo.formattedDate}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">ម៉ោង / នាទីលម្អិត:</span>
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-200">
                    {licenseInfo.formattedFullDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Active Key Display if present */}
            {licenseInfo.keyCode && (
              <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Key កំពុងប្រើប្រាស់:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-200 bg-black/30 px-2 py-0.5 rounded border border-white/10">
                  {licenseInfo.keyCode}
                </span>
              </div>
            )}
          </div>

          {/* Machine ID Box */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">Hardware Machine ID:</span>
              <span className="text-cyan-300 font-mono font-bold truncate block">
                {machineId}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyMachineId}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 text-[11px] font-semibold transition-all active:scale-95"
            >
              {copiedId ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedId ? 'បានចម្លង' : 'ចម្លង'}</span>
            </button>
          </div>

          {/* New Key Activation Form */}
          <form onSubmit={handleActivate} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                {licenseInfo.isLicensed ? 'បញ្ចូល Key ថ្មីដើម្បីបន្តសុពលភាព (Renew)' : 'បញ្ចូល Key License ថ្មី'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="VOX-XXXX-XXXX-XXXX"
                  value={keyCode}
                  onChange={(e) => setKeyCode(e.target.value)}
                  className="w-full bg-white dark:bg-[#0b0f19] border border-white/[0.15] focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-500 uppercase font-mono tracking-wider focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !keyCode.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-800 dark:text-white text-xs font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>កំពុងផ្ទៀងផ្ទាត់ Key...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{licenseInfo.isLicensed ? 'បន្តសុពលភាព Key ឥឡូវនេះ' : 'ដំណើរការ Key ឥឡូវនេះ'}</span>
                </>
              )}
            </button>
          </form>

          {/* Supported Plans */}
          <div className="pt-2 border-t border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <span>ប្រភេទកញ្ចប់ Key License:</span>
              <a
                href="https://t.me/BongCheatz_IT"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1 font-semibold"
              >
                ✈️ ទាក់ទង Admin
              </a>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">សាកល្បង ៧ ថ្ងៃ (Trial)</span>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">១ ខែ (30 ថ្ងៃ)</span>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">១ ឆ្នាំ (365 ថ្ងៃ)</span>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="text-amber-300 font-bold">ជារៀងរហូត (Lifetime)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 px-6 border-t border-slate-200 dark:border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0b0f19] flex items-center justify-between">
          <a
            href="https://t.me/BongCheatz_IT"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 px-3 py-1.5 rounded-xl transition-all font-semibold"
          >
            <Send className="w-3.5 h-3.5" />
            <span>ទិញ KEY: @BongCheatz_IT</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 text-xs transition-colors"
          >
            បិទ
          </button>
        </div>
      </div>
    </div>
  );
};
