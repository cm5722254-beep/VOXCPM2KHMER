import React, { useState } from 'react';
import { User as UserIcon, Lock, LogIn, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { User } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (user: User) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onSuccess,
  onShowToast,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const fn = mode === 'login' ? api.login : api.register;
      const res = await fn({ username: username.trim(), password: password.trim() });
      if (res.token) {
        localStorage.setItem('studio_auth_token', res.token);
        onSuccess(res.user);
        const welcomeText =
          res.user.role === 'admin'
            ? `👑 សូមស្វាគមន៍មកកាន់ប្រព័ន្ធ Admin: ${res.user.username}!`
            : `🎉 ចូលគណនីជោគជ័យ: ${res.user.username}!`;
        onShowToast(welcomeText, 'success');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none font-khmer">
      <div className="bg-[#0b0f19] border border-cyan-500/30 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.2)] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 text-center flex flex-col items-center gap-2 border-b border-white/[0.08] bg-[#070a12]">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-cyan-500/30 border border-cyan-400/40 mb-1 ring-2 ring-cyan-500/20">
            <img
              src="/app_logo.png"
              alt="Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-black text-white tracking-wide">
              ATITEBDABBER PRO
            </h2>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
              v10
            </span>
          </div>
          <p className="text-xs text-slate-400">
            ចូលប្រើប្រាស់កម្មវិធីបញ្ចូលសំឡេងគំនូរជីវចល AI
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/[0.08] bg-[#06080e]">
          <button
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold transition-all ${
              mode === 'login'
                ? 'border-b-2 border-cyan-400 text-white bg-cyan-500/[0.05]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Login / ចូលគណនី
          </button>
          <button
            onClick={() => {
              setMode('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold transition-all ${
              mode === 'register'
                ? 'border-b-2 border-cyan-400 text-white bg-cyan-500/[0.05]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register / បង្កើតគណនី
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3.5">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gmail / គណនី (Email / Username)</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="cm5722254@gmail.com"
              className="bg-[#04060a] border border-white/[0.12] focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>ពាក្យសម្ងាត់ (Password)</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-[#04060a] border border-white/[0.12] focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
            />
          </div>

          {/* Admin Note Pill */}
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-[11px] text-amber-200/90">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              គណនី ADMIN ផ្លូវការតែមួយគត់: <strong className="text-amber-300">cm5722254@gmail.com</strong>
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-1 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 hover:brightness-110 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>
              {isLoading
                ? 'កំពុងភ្ជាប់...'
                : mode === 'login'
                ? 'ចូលប្រព័ន្ធ (Sign In)'
                : 'ចុះឈ្មោះបង្កើតគណនី (Register)'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
