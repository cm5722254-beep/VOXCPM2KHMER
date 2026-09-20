import React, { useState } from 'react';
import { X, Key, CheckCircle2, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { User } from '../../types';

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
  const [keyCode, setKeyCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const isLicensed = Boolean(
    user && (user.role === 'admin' || user.has_voxcpm_license)
  );

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = keyCode.trim().toUpperCase();
    if (!cleanKey) {
      onShowToast('សូមបញ្ចូលលេខកូដ Key License', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.activateLicense(cleanKey);
      onShowToast(res.message || 'បានដំណើរការ Key License ជោគជ័យ!', 'success');
      setKeyCode('');
      if (res.user) {
        onSuccess(res.user);
      }
      onClose();
    } catch (err: any) {
      onShowToast(err.message || 'កំហុសក្នុងការដំណើរការ Key', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-cyan-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_35px_rgba(6,182,212,0.15)] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-white/[0.08] flex items-center justify-between bg-[#0b0f19]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-khmer">
                ដំណើរការ Key License VoxCPM2
              </h3>
              <p className="text-[11px] text-slate-400 font-khmer">
                បើកសិទ្ធិប្រើប្រាស់ម៉ាស៊ីនក្លូនសំឡេង AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Current Status Box */}
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-3 ${
              isLicensed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            {isLicensed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
            )}
            <div className="text-xs">
              <div className="font-bold font-khmer">
                {isLicensed ? 'គណនីមានសិទ្ធិប្រើ VoxCPM2' : 'មិនទាន់មាន License នៅឡើយ'}
              </div>
              <div className="text-[11px] opacity-80 font-khmer">
                {isLicensed
                  ? user?.role === 'admin'
                    ? 'Admin (សិទ្ធិពេញលេញ អចិន្ត្រៃយ៍)'
                    : user?.voxcpm_license_expires_at
                    ? `ផុតកំណត់: ${user.voxcpm_license_expires_at.slice(0, 10)}`
                    : 'សុពលភាព: គ្មានកំណត់'
                  : 'សូមទាក់ទង Admin ដើម្បីទទួលបាន Key License'}
              </div>
            </div>
          </div>

          {/* Activation Form */}
          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 font-khmer">
                លេខកូដ Key License
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="VOX-XXXX-XXXX-XXXX"
                  value={keyCode}
                  onChange={(e) => setKeyCode(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-white/[0.12] focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 uppercase font-mono tracking-wider focus:outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !keyCode.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold font-khmer shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>កំពុងផ្ទៀងផ្ទាត់...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>ដំណើរការ Key ឥឡូវនេះ</span>
                </>
              )}
            </button>
          </form>

          {/* 4 License Tiers Information */}
          <div className="pt-2 border-t border-white/[0.06] space-y-2">
            <div className="text-[11px] font-bold text-slate-400 font-khmer">
              ប្រភេទកញ្ចប់ Key License ដែលគាំទ្រ:
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-khmer">
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                <span className="text-slate-300">សាកល្បង ៧ ថ្ងៃ (Trial)</span>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                <span className="text-slate-300">១ ខែ (30 ថ្ងៃ)</span>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                <span className="text-slate-300">១ ឆ្នាំ (365 ថ្ងៃ)</span>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="text-amber-300 font-bold">ជារៀងរហូត (Lifetime)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 px-6 border-t border-white/[0.08] bg-[#0b0f19] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-khmer transition-colors"
          >
            បិទ
          </button>
        </div>
      </div>
    </div>
  );
};
