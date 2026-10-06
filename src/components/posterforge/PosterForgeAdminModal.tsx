// PosterForge AI — Admin AI Settings Modal
import React, { useState } from 'react';
import { AIProviderSettings, AIImageProviderType } from './PosterForgeTypes';
import { X, Settings, ShieldCheck, Cpu, Key, Sparkles, Check, Server, RefreshCw } from 'lucide-react';

interface PosterForgeAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AIProviderSettings;
  onSaveSettings: (settings: AIProviderSettings) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const PosterForgeAdminModal: React.FC<PosterForgeAdminModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onShowToast,
}) => {
  const [formData, setFormData] = useState<AIProviderSettings>({ ...settings });

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(formData);
    onShowToast('✅ បានរក្សាទុកការកំណត់ AI Provider ដោយជោគជ័យ!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div
        className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#0f1118] border border-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white dark:bg-[#141722]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <Cpu className="w-5 h-5 text-slate-800 dark:text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span>AI Provider & Model Settings</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  ADMIN
                </span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-zinc-400">គ្រប់គ្រងម៉ាស៊ីន AI Image Generation & Upscaling</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Provider Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              <span>ជ្រើសរើស AI Image Provider</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: 'pollinations_flux' as AIImageProviderType,
                  title: 'Pollinations AI (Flux)',
                  desc: 'Connected provider. Sends a real image request and verifies the returned image.',
                  badge: 'CONNECTED',
                  color: 'emerald',
                },
                {
                  id: 'gemini_imagen' as AIImageProviderType,
                  title: 'Google Gemini Imagen 3',
                  desc: 'Not connected in this build. Image generation is unavailable through this provider.',
                  badge: 'NOT CONNECTED',
                  color: 'indigo',
                },
                {
                  id: 'stable_diffusion' as AIImageProviderType,
                  title: 'Stable Diffusion / ComfyUI',
                  desc: 'Not connected in this build. Image generation is unavailable through this provider.',
                  badge: 'NOT CONNECTED',
                  color: 'cyan',
                },
                {
                  id: 'custom_api' as AIImageProviderType,
                  title: 'Custom Endpoint API',
                  desc: 'Not connected in this build. Image generation is unavailable through this provider.',
                  badge: 'NOT CONNECTED',
                  color: 'amber',
                },
              ].map((prov) => {
                const isSupported = prov.id === 'pollinations_flux';
                const isSelected = formData.activeProvider === prov.id;
                return (
                  <div
                    key={prov.id}
                    onClick={() => isSupported && setFormData({ ...formData, activeProvider: prov.id })}
                    aria-disabled={!isSupported}
                    className={`p-3.5 rounded-2xl border transition-all ${isSupported ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                        : 'bg-white dark:bg-[#151722] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{prov.title}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        prov.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' :
                        prov.color === 'indigo' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                        prov.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                        'bg-amber-500/20 text-sky-600 dark:text-amber-400 border border-amber-500/30'
                      }`}>
                        {prov.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">{prov.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gemini Key Config if selected */}
          {formData.activeProvider === 'gemini_imagen' && (
            <div className="space-y-2 p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30">
              <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                <span>Google Gemini API Key</span>
              </label>
              <input
                type="password"
                value={formData.geminiApiKey || ''}
                onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-indigo-500/40 text-xs text-slate-800 dark:text-white outline-none focus:border-indigo-400"
              />
              <p className="text-[10px] text-slate-600 dark:text-zinc-400">ប្រើសម្រាប់ Imagen 3 / Gemini Pro Vision Generation</p>
            </div>
          )}

          {/* SD URL if selected */}
          {formData.activeProvider === 'stable_diffusion' && (
            <div className="space-y-2 p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30">
              <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" />
                <span>SD WebUI / ComfyUI URL</span>
              </label>
              <input
                type="text"
                value={formData.sdApiUrl || 'http://127.0.0.1:7860'}
                onChange={(e) => setFormData({ ...formData, sdApiUrl: e.target.value })}
                placeholder="http://127.0.0.1:7860"
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-cyan-500/40 text-xs text-slate-800 dark:text-white outline-none focus:border-cyan-400"
              />
            </div>
          )}

          {/* Resolution & Generations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">ទំហំ Resolution ដំបូង</label>
              <select
                value={formData.defaultResolution}
                onChange={(e) => setFormData({ ...formData, defaultResolution: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#151722] border border-white/10 text-xs text-slate-800 dark:text-white outline-none"
              >
                <option value="512">512px (Fast Draft)</option>
                <option value="1024">1024px (Standard HD)</option>
                <option value="1536">1536px (High Quality)</option>
                <option value="2048">2048px (2K QHD)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">ចំនួន Variations ក្នុងមួយដង</label>
              <select
                value={formData.generationCount}
                onChange={(e) => setFormData({ ...formData, generationCount: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#151722] border border-white/10 text-xs text-slate-800 dark:text-white outline-none"
              >
                <option value="1">1 រូបភាព</option>
                <option value="2">2 រូបភាព</option>
                <option value="4">4 រូបភាព (Standard Variations)</option>
              </select>
            </div>
          </div>

          {/* 4K Upscale Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#151722] border border-white/5">
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">AI Upscaling · Not Connected</h4>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400">មិនទាន់មាន AI Upscaling ទេ។ អាចទាញយករូបជា 2K ឬ 4K បាន។</p>
            </div>
            <input
              type="checkbox"
              checked={false}
              disabled
              className="w-4 h-4 accent-emerald-500 rounded cursor-not-allowed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white dark:bg-[#141722]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:text-white hover:bg-white/5 transition-all"
          >
            បោះបង់
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 active:scale-95 shadow-md transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>រក្សាទុកការកំណត់</span>
          </button>
        </div>
      </div>
    </div>
  );
};
