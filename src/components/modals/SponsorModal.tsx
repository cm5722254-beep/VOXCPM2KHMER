import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  Link2,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Star,
  Edit2,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';

const STORAGE_KEY = 'voxcpm_sponsor_data';

export interface SponsorInfo {
  id: string;
  name: string;
  logoUrl: string;
  link: string;
  description: string;
  badge: string;
  isVisible: boolean;
  color: string;
  createdAt: string;
}

const DEFAULT_COLORS = [
  '#a855f7', // Purple
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ef4444', // Red
  '#f97316', // Orange
];

function loadLocalSponsors(): SponsorInfo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse local sponsors:', e);
  }
  return [];
}

function saveLocalSponsors(s: SponsorInfo[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (e) {
    console.warn('Failed to save local sponsors:', e);
  }
}

export function useSponsors(): SponsorInfo[] {
  const [sponsors, setSponsors] = useState<SponsorInfo[]>(loadLocalSponsors);

  useEffect(() => {
    // 1. Fetch from server first
    api
      .getSponsors?.()
      .then((res: any) => {
        if (res?.sponsors && Array.isArray(res.sponsors) && res.sponsors.length > 0) {
          setSponsors(res.sponsors);
          saveLocalSponsors(res.sponsors);
        }
      })
      .catch(() => {});

    // 2. Storage event listener for multi-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setSponsors(loadLocalSponsors());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return sponsors.filter((s) => s.isVisible);
}

interface SponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const createEmptyForm = () => ({
  name: '',
  logoUrl: '',
  link: '',
  description: '',
  badge: '✨ Sponsor',
  isVisible: true,
  color: '#a855f7',
});

export const SponsorModal: React.FC<SponsorModalProps> = ({
  isOpen,
  onClose,
  isAdmin = true,
  onShowToast,
}) => {
  const [sponsors, setSponsors] = useState<SponsorInfo[]>(loadLocalSponsors);
  const [form, setForm] = useState(createEmptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load local first for instant display
      const local = loadLocalSponsors();
      setSponsors(local);
      setShowForm(false);
      setEditingId(null);
      setForm(createEmptyForm());

      // Then fetch latest from server
      api
        .getSponsors?.()
        .then((res: any) => {
          if (res?.sponsors && Array.isArray(res.sponsors)) {
            setSponsors(res.sponsors);
            saveLocalSponsors(res.sponsors);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const persistSponsors = async (updated: SponsorInfo[]) => {
    saveLocalSponsors(updated);
    setSponsors(updated);
    // Sync with backend API
    try {
      await api.saveSponsors?.(updated);
    } catch (e) {
      console.warn('Server sync failed, retained in localStorage:', e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      onShowToast('សូមបញ្ចូលឈ្មោះ Sponsor!', 'error');
      return;
    }

    setIsSaving(true);
    try {
      let updated: SponsorInfo[];
      if (editingId) {
        updated = sponsors.map((s) => (s.id === editingId ? { ...s, ...form } : s));
        onShowToast('✅ បានកែប្រែ Sponsor ដោយជោគជ័យ!', 'success');
      } else {
        const newSponsor: SponsorInfo = {
          ...form,
          id: 'sp_' + Date.now(),
          createdAt: new Date().toISOString(),
        };
        updated = [newSponsor, ...sponsors];
        onShowToast('🎉 បានបន្ថែម Sponsor ថ្មីដោយជោគជ័យ!', 'success');
      }

      await persistSponsors(updated);
      setForm(createEmptyForm());
      setEditingId(null);
      setShowForm(false);
    } catch (err: any) {
      onShowToast(`កំហុសរក្សាទុក: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (sp: SponsorInfo) => {
    setForm({
      name: sp.name,
      logoUrl: sp.logoUrl || '',
      link: sp.link || '',
      description: sp.description || '',
      badge: sp.badge || '✨ Sponsor',
      isVisible: sp.isVisible,
      color: sp.color || '#a855f7',
    });
    setEditingId(sp.id);
    setShowForm(true);
  };

  const handleDelete = async (sp: SponsorInfo) => {
    if (!window.confirm(`តើអ្នកពិតជាចង់លុប Sponsor "${sp.name}" មែនទេ?`)) return;
    const updated = sponsors.filter((s) => s.id !== sp.id);
    await persistSponsors(updated);
    onShowToast(`🗑️ បានលុប Sponsor "${sp.name}" រួចរាល់!`, 'info');
  };

  const handleToggleVisible = async (sp: SponsorInfo) => {
    const updated = sponsors.map((s) => (s.id === sp.id ? { ...s, isVisible: !s.isVisible } : s));
    await persistSponsors(updated);
    onShowToast(sp.isVisible ? '👁️ បានលាក់ Sponsor ពីកម្មវិធី' : '👁️ បានបើកបង្ហាញ Sponsor ឡើងវិញ', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none font-khmer animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-purple-500/30 rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_0_60px_rgba(168,85,247,0.25)] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-white/[0.08] flex items-center justify-between bg-[#0b0f19]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-sm">
              <Heart className="w-5 h-5 fill-purple-400/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  គ្រប់គ្រង Sponsor & អ្នកឧបត្ថម្ភ
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-bold">
                  {sponsors.length} Sponsors
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                រក្សាទុក Sponsor អចិន្ត្រៃយ៍ — ចងចាំជានិច្ច ទោះ Refresh ឬ បិទបើក App ក៏ដោយ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Add Sponsor Button */}
          {!showForm && (
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setForm(createEmptyForm());
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-purple-500/40 hover:border-purple-500 text-purple-400 hover:text-purple-300 text-xs font-bold transition-all hover:bg-purple-500/10 active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              <span>បន្ថែម Sponsor ថ្មី (Add Sponsor)</span>
            </button>
          )}

          {/* Form */}
          {showForm && (
            <form
              onSubmit={handleSave}
              className="p-4 rounded-2xl bg-black/40 border border-purple-500/30 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>{editingId ? 'កែប្រែ Sponsor' : 'បន្ថែម Sponsor ថ្មី'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setForm(createEmptyForm());
                  }}
                  className="text-slate-400 hover:text-slate-200 text-xs"
                >
                  បោះបង់
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    ឈ្មោះ Sponsor *
                  </label>
                  <input
                    type="text"
                    placeholder="ឧទាហរណ៍: BongCheatz IT, DabberPro, Brand X..."
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    className="w-full bg-[#0b0f19] border border-white/[0.15] focus:border-purple-500 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Logo URL (រូបភាព)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://example.com/logo.png"
                      value={form.logoUrl}
                      onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                      className="flex-1 bg-[#0b0f19] border border-white/[0.15] focus:border-purple-500 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none transition-all"
                    />
                    {form.logoUrl && (
                      <img
                        src={form.logoUrl}
                        alt="Logo preview"
                        className="w-9 h-9 rounded-xl object-cover border border-purple-500/40 shrink-0 bg-black/40"
                        onError={(e) => ((e.target as HTMLImageElement).hidden = true)}
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Link / URL (តំណភ្ជាប់)
                  </label>
                  <input
                    type="text"
                    placeholder="https://t.me/BongCheatz_IT"
                    value={form.link}
                    onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                    className="w-full bg-[#0b0f19] border border-white/[0.15] focus:border-purple-500 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Badge Label (ស្លាក)
                  </label>
                  <input
                    type="text"
                    placeholder="✨ Sponsor, 👑 VIP, 💎 Gold..."
                    value={form.badge}
                    onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                    className="w-full bg-[#0b0f19] border border-white/[0.15] focus:border-purple-500 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    ការពិពណ៌នា Sponsor
                  </label>
                  <textarea
                    placeholder="ពិពណ៌នាសង្ខេបអំពី Sponsor ឬផលិតផល..."
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full bg-[#0b0f19] border border-white/[0.15] focus:border-purple-500 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                    Brand Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {DEFAULT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, color: c }))}
                        className={`w-5 h-5 rounded-full transition-all ${
                          form.color === c
                            ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0b0f19] scale-110 shadow-sm'
                            : 'opacity-60 hover:opacity-100 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <label className="text-[11px] font-bold text-slate-300">បង្ហាញក្នុង App:</label>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, isVisible: !f.isVisible }))}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      form.isVisible
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-700/50 border border-white/10 text-slate-400'
                    }`}
                  >
                    {form.isVisible ? '✅ បង្ហាញ' : '🙈 លាក់'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-purple-500/25 disabled:opacity-50 transition-all active:scale-[0.99]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>កំពុងរក្សាទុក...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{editingId ? 'រក្សាទុកការកែប្រែ' : 'រក្សាទុក Sponsor'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Sponsors List */}
          {sponsors.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <Heart className="w-10 h-10 mx-auto mb-2 opacity-25 text-purple-400" />
              <p className="font-semibold text-slate-400">មិនទាន់មាន Sponsor នៅឡើយទេ</p>
              <p className="mt-1 text-[11px] opacity-70">ចុច &quot;បន្ថែម Sponsor ថ្មី&quot; ខាងលើដើម្បីបញ្ចូល Sponsor ដំបូង</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>បញ្ជី Sponsor ({sponsors.length})</span>
                <span className="text-[10px] text-emerald-400 font-normal">
                  {sponsors.filter((s) => s.isVisible).length} កំពុងបង្ហាញ
                </span>
              </div>

              {sponsors.map((sp) => (
                <div
                  key={sp.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    sp.isVisible
                      ? 'border-white/[0.1] bg-white/[0.03] hover:border-purple-500/40'
                      : 'border-white/[0.05] bg-black/20 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Logo/Icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border shadow-sm"
                      style={{
                        borderColor: `${sp.color}40`,
                        backgroundColor: `${sp.color}15`,
                      }}
                    >
                      {sp.logoUrl ? (
                        <img
                          src={sp.logoUrl}
                          alt={sp.name}
                          className="w-full h-full object-cover"
                          onError={(e) => ((e.target as HTMLImageElement).hidden = true)}
                        />
                      ) : (
                        <Star className="w-5 h-5" style={{ color: sp.color }} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">{sp.name}</span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0"
                          style={{
                            color: sp.color,
                            backgroundColor: `${sp.color}20`,
                            border: `1px solid ${sp.color}50`,
                          }}
                        >
                          {sp.badge}
                        </span>
                      </div>
                      {sp.description && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {sp.description}
                        </p>
                      )}
                      {sp.link && (
                        <a
                          href={sp.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-0.5 font-medium transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link2 className="w-2.5 h-2.5" />
                          <span className="truncate">{sp.link}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                        </a>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleVisible(sp)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          sp.isVisible
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-white/[0.05] border-white/[0.08] text-slate-400 hover:text-white'
                        }`}
                        title={sp.isVisible ? 'លាក់ Sponsor' : 'បង្ហាញ Sponsor'}
                      >
                        {sp.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleEdit(sp)}
                        className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 hover:text-cyan-300 transition-colors"
                        title="កែប្រែ Sponsor"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(sp)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 transition-colors"
                        title="លុប Sponsor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 px-6 border-t border-white/[0.08] bg-[#0b0f19] flex items-center justify-between">
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>ទិន្នន័យ Sponsor រក្សាទុកដោយស្វ័យប្រវត្តិ (Saved permanently)</span>
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 text-xs font-semibold transition-colors"
          >
            បិទ
          </button>
        </div>

      </div>
    </div>
  );
};
