import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Loader2,
  Monitor,
  Copy,
  Check,
  Crown,
  AlertCircle,
} from 'lucide-react';

interface MachineActivationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: () => void;
  blockClose?: boolean; // If true, user can't close until activated
}

interface ActivationStatus {
  activated: boolean;
  key_code?: string;
  machine_id?: string;
  expires_at?: string;
  is_lifetime?: boolean;
  error?: string;
}

export const MachineActivationModal: React.FC<MachineActivationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  blockClose = false,
}) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [machineId, setMachineId] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [activationStatus, setActivationStatus] = useState<ActivationStatus | null>(null);

  // Check activation status on mount
  useEffect(() => {
    if (isOpen) {
      checkActivationStatus();
    }
  }, [isOpen]);

  const checkActivationStatus = async () => {
    try {
      const res = await fetch('/api/license/status');
      const data = await res.json();
      setActivationStatus(data);
      
      if (data.machine_id) {
        setMachineId(data.machine_id);
      }

      // If already activated, trigger success
      if (data.activated && !blockClose) {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to check activation:', err);
    }
  };

  const handleCopyMachineId = () => {
    if (machineId) {
      navigator.clipboard.writeText(machineId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = licenseKey.trim().toUpperCase().replace(/\s+/g, '');
    
    if (!cleanKey) {
      setError('សូមបញ្ចូលលេខកូដ License Key');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // First validate the key
      const validateRes = await fetch('/api/license/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: cleanKey }),
      });
      const validateData = await validateRes.json();

      if (!validateData.valid) {
        setError(validateData.error || 'License key មិនត្រឹមត្រូវ');
        setIsLoading(false);
        return;
      }

      // Now activate
      const activateRes = await fetch('/api/license/activate-machine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: cleanKey }),
      });
      const activateData = await activateRes.json();

      if (activateData.success || activateData.message) {
        setSuccess(activateData.message || '🎉 បានដំណើរការ License ជោគជ័យ!');
        setLicenseKey('');
        
        // Wait a bit then trigger success
        setTimeout(() => {
          onSuccess();
          if (onClose && !blockClose) {
            onClose();
          }
        }, 1500);
      } else {
        setError(activateData.error || 'មិនអាចដំណើរការ License បានទេ');
      }
    } catch (err: any) {
      setError(err.message || 'កំហុសក្នុងការតភ្ជាប់ទៅ Server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!blockClose && onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isAlreadyActivated = activationStatus?.activated;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none font-khmer">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-cyan-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.4)] flex flex-col animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  👑 CHEAT DABBER TOOL
                </h3>
                <p className="text-xs text-cyan-300 font-semibold">
                  Professional AI Dubbing License Activation
                </p>
              </div>
            </div>
            {!blockClose && onClose && (
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Activation Status */}
          {isAlreadyActivated ? (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-bold text-white mb-1">
                    ✅ License បានដំណើរការរួចរាល់!
                  </div>
                  <div className="text-xs text-emerald-300 space-y-1">
                    <div className="flex items-center gap-2">
                      <Key className="w-3 h-3" />
                      <span className="font-mono">{activationStatus.key_code}</span>
                    </div>
                    {activationStatus.is_lifetime ? (
                      <div className="flex items-center gap-2">
                        <Crown className="w-3 h-3 text-amber-400" />
                        <span className="font-bold text-amber-300">Lifetime License ជារៀងរហូត</span>
                      </div>
                    ) : activationStatus.expires_at ? (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        <span>ផុតកំណត់: {new Date(activationStatus.expires_at).toLocaleDateString('km-KH')}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-8 h-8 text-amber-400 shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-bold text-white mb-1">
                    ⚠️ ត្រូវការដំណើរការ License
                  </div>
                  <div className="text-xs text-amber-300">
                    កុំព្យូទ័រនេះមិនទាន់បានដំណើរការ License Key។ សូមបញ្ចូល License Key ដើម្បីបន្ត។
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Machine ID */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Monitor className="w-5 h-5 text-cyan-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-slate-400 font-semibold mb-1">
                    Hardware Machine ID:
                  </div>
                  <div className="text-sm font-mono font-bold text-cyan-300 truncate">
                    {machineId || 'Loading...'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyMachineId}
                disabled={!machineId}
                className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
              >
                {copiedId ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">ចម្លងហើយ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>ចម្លង ID</span>
                  </>
                )}
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-500 leading-relaxed">
              💡 Machine ID នេះតែមួយគត់សម្រាប់កុំព្យូទ័រនេះ។ ប្រសិនបើប្តូរកុំព្យូទ័រ អ្នកត្រូវដំណើរការ License ម្តងទៀត។
            </div>
          </div>

          {/* Activation Form */}
          {!isAlreadyActivated && (
            <form onSubmit={handleActivate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  បញ្ចូល License Key
                </label>
                <input
                  type="text"
                  placeholder="CDT-XXXX-XXXX-XXXX-XXXX"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  className="w-full bg-black/40 border border-white/20 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !licenseKey.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-bold shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>កំពុងផ្ទៀងផ្ទាត់...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>ដំណើរការ License ឥឡូវនេះ</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Info Box */}
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <div className="text-xs text-blue-300 space-y-2">
              <div className="font-bold flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                របៀបទទួលបាន License Key:
              </div>
              <ul className="space-y-1 ml-5 list-disc text-slate-300">
                <li>ទាក់ទង Admin តាម Telegram: <span className="font-mono text-cyan-300">@BongCheatz_IT</span></li>
                <li>ផ្ញើ Machine ID របស់អ្នក</li>
                <li>ទទួល License Key និងដំណើរការនៅទីនេះ</li>
              </ul>
              <div className="pt-2 border-t border-white/10 text-amber-300 font-semibold">
                ⚠️ ម៉ាស៊ីនផ្សេងគ្នាត្រូវការ License ផ្សេងគ្នា!
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
          <a
            href="https://t.me/BongCheatz_IT"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-xs font-semibold transition-all"
          >
            <Send className="w-4 h-4" />
            <span>ទិញ License Key</span>
          </a>
          {!blockClose && onClose && !isAlreadyActivated && (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
            >
              បិទ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Import Send icon
import { Send } from 'lucide-react';
