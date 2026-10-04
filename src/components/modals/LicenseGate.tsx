import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Key,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Send,
  ExternalLink,
  RefreshCw,
  HelpCircle,
  Crown,
  Clock,
  Calendar,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';
import { User } from '../../types';

interface LicenseGateProps {
  user: User | null;
  onSuccess: (updatedUser: User) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onRefreshUser?: () => Promise<void>;
}

export const LicenseGate: React.FC<LicenseGateProps> = ({
  user,
  onSuccess,
  onShowToast,
  onRefreshUser,
}) => {
  const [keyCode, setKeyCode] = useState(() => {
    try {
      return localStorage.getItem('voxcpm_license_key') || '';
    } catch {
      return '';
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const machineId = user?.machine_id || user?.current_device_id || 'UNKNOWN-ID';

  // Auto-activate saved key on mount if key was saved
  useEffect(() => {
    const savedKey = localStorage.getItem('voxcpm_license_key');
    if (savedKey && savedKey.trim()) {
      const runAutoActivate = async () => {
        setIsLoading(true);
        try {
          const res = (await api.activateLicense(savedKey.trim())) as any;
          if (res.token) {
            localStorage.setItem('studio_auth_token', res.token);
          }
          if (res.user) {
            localStorage.setItem('voxcpm_license_cached_user', JSON.stringify(res.user));
            onSuccess(res.user);
          } else if (onRefreshUser) {
            await onRefreshUser();
          }
          onShowToast('🎉 បានផ្ទៀងផ្ទាត់ និងចងចាំ Key License ដោយស្វ័យប្រវត្តិ!', 'success');
        } catch (_) {
          // If auto-activate fails (e.g. key expired), let the user manually enter/renew
        } finally {
          setIsLoading(false);
        }
      };
      runAutoActivate();
    }
  }, []);

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
    setErrorMsg(null);
    const cleanKey = keyCode.trim().toUpperCase();
    if (!cleanKey) {
      setErrorMsg('សូមបញ្ចូលលេខកូដ Key License');
      return;
    }

    setIsLoading(true);
    try {
      const res = (await api.activateLicense(cleanKey)) as any;
      if (res.token) {
        localStorage.setItem('studio_auth_token', res.token);
      }
      // Save license key permanently in browser localStorage
      localStorage.setItem('voxcpm_license_key', cleanKey);
      if (res.user) {
        localStorage.setItem('voxcpm_license_cached_user', JSON.stringify(res.user));
      }
      onShowToast(res.message || '🎉 ដំណើរការ Key License ជោគជ័យ!', 'success');
      if (res.user) {
        onSuccess(res.user);
      } else if (onRefreshUser) {
        await onRefreshUser();
      }
    } catch (err: any) {
      const msg = err.message || 'Key License មិនត្រឹមត្រូវ ឬត្រូវបានប្រើប្រាស់រួចហើយ';
      setErrorMsg(msg);
      onShowToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    if (!onRefreshUser) return;
    setIsRefreshing(true);
    setErrorMsg(null);
    try {
      await onRefreshUser();
      onShowToast('🔄 បានត្រួតពិនិត្យអាជ្ញាប័ណ្ណឡើងវិញរួចរាល់', 'info');
    } catch (err: any) {
      onShowToast('មិនអាចផ្ទៀងផ្ទាត់អាជ្ញាប័ណ្ណបានទេ', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07090e]/95 backdrop-blur-2xl p-4 select-none font-khmer overflow-y-auto">
      {/* Dynamic Background Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-cyan-600/20 via-blue-600/15 to-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[250px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Lock Card */}
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0e131f]/90 border border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.2)] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Glow Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Lock Icon & Branding */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.35)] ring-4 ring-cyan-500/10">
                <Lock className="w-8 h-8 text-cyan-300" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border-2 border-[#0e131f] flex items-center justify-center">
                <Key className="w-2.5 h-2.5 text-black" />
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                ចាក់សោសុវត្ថិភាពស្ទូឌីយោ
              </h2>
              <p className="text-xs sm:text-sm text-cyan-300/80 font-medium mt-1">
                Khmer Dubbing Pro — AI Voice Clone Studio
              </p>
            </div>

            <p className="text-xs text-slate-300/80 max-w-md leading-relaxed">
              ឧបករណ៍នេះតម្រូវឱ្យមាន <span className="text-cyan-300 font-bold">Key License សកម្ម</span> ដើម្បីចូលប្រើប្រាស់។ សូមបញ្ចូល Key របស់អ្នកខាងក្រោមដើម្បីដោះសោដំណើរការ។
            </p>
          </div>

          {/* Machine ID Box (Click to copy for admin) */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.08] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 text-slate-400">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Hardware Machine ID ម៉ាស៊ីននេះ
                </div>
                <div className="text-xs text-cyan-300 font-mono font-bold truncate">
                  {machineId}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyMachineId}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
                copiedId
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-slate-200'
              }`}
              title="ចម្លង Machine ID ផ្ញើទៅកាន់ Admin"
            >
              {copiedId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>បានចម្លង</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>ចម្លង ID</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Activation Form */}
          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-2">
                បញ្ចូលលេខកូដអាជ្ញាប័ណ្ណ (Key License)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Key className="w-4 h-4 text-cyan-400" />
                </div>
                <input
                  type="text"
                  placeholder="VOX-XXXX-XXXX-XXXX"
                  value={keyCode}
                  onChange={(e) => setKeyCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black/60 border border-cyan-500/40 focus:border-cyan-400 rounded-2xl text-sm font-mono text-white placeholder-slate-500 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all shadow-inner"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading || !keyCode.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(6,182,212,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>កំពុងផ្ទៀងផ្ទាត់ Key...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                    <span>ដំណើរការ Key ដោះសោរ Tool</span>
                  </>
                )}
              </button>

              {onRefreshUser && (
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="px-3.5 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white transition-all active:scale-95"
                  title="ត្រួតពិនិត្យអាជ្ញាប័ណ្ណម៉ាស៊ីនឡើងវិញ"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
                </button>
              )}
            </div>
          </form>

          {/* Supported Plans Section */}
          <div className="pt-2 border-t border-white/[0.08] space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
              <span>កញ្ចប់ Key License ដែលគាំទ្រ:</span>
              <span className="text-[11px] text-cyan-400 font-normal">សុពលភាពច្បាស់លាស់</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200 text-[11px]">សាកល្បង ៧ ថ្ងៃ</div>
                  <div className="text-[9px] text-slate-400">Trial Period</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200 text-[11px]">១ ខែ (30 ថ្ងៃ)</div>
                  <div className="text-[9px] text-slate-400">Monthly Plan</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200 text-[11px]">១ ឆ្នាំ (365 ថ្ងៃ)</div>
                  <div className="text-[9px] text-slate-400">Yearly Plan</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-amber-300 text-[11px]">ពេញមួយជីវិត</div>
                  <div className="text-[9px] text-amber-300/70 font-bold">VIP Lifetime</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer with Telegram Purchase Link */}
        <div className="p-4 px-6 sm:px-8 bg-black/60 border-t border-white/[0.08] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>មិនទាន់មាន Key?</span>
          </div>

          <a
            href="https://t.me/BongCheatz_IT"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500/20 to-blue-600/20 hover:from-sky-500/30 hover:to-blue-600/30 border border-sky-400/40 text-sky-300 text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>ទិញ KEY: @BongCheatz_IT</span>
            <ExternalLink className="w-3 h-3 text-sky-400/70" />
          </a>
        </div>
      </div>
    </div>
  );
};
