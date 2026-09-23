import React, { useState } from 'react';
import {
  PlusCircle,
  Search,
  Volume2,
  Edit3,
  Sparkles,
  Trash2,
  CheckCircle2,
  Shield,
  Star,
  Play,
  Pause,
  AlertTriangle,
} from 'lucide-react';
import { CharacterVoice, User } from '../../types';

interface CharacterLibraryProps {
  characters: CharacterVoice[];
  onOpenAddModal: () => void;
  onOpenEditModal: (char: CharacterVoice) => void;
  onOpenAuditionModal: (char: CharacterVoice) => void;
  user?: User | null;
  onDeleteVoice?: (char: CharacterVoice) => void;
  onSelectVoice?: (char: CharacterVoice) => void;
  selectedVoiceId?: string;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const CharacterLibrary: React.FC<CharacterLibraryProps> = ({
  characters = [],
  onOpenAddModal,
  onOpenEditModal,
  onOpenAuditionModal,
  user,
  onDeleteVoice,
  onSelectVoice,
  selectedVoiceId,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [charToDelete, setCharToDelete] = useState<CharacterVoice | null>(null);

  const isLicensed = Boolean(user && (user.role === 'admin' || user.has_voxcpm_license));
  const isAdmin = user?.role === 'admin';

  const filtered = characters.filter((c) => {
    // If not licensed, hide VoxCPM AI cloning samples!
    if (!isLicensed && c.id.startsWith('voxcpm:')) {
      return false;
    }
    const matchSearch =
      (c.label || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.words || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.filename || '').toLowerCase().includes(search.toLowerCase());
    const matchGender = genderFilter === 'all' || c.gender === genderFilter;
    return matchSearch && matchGender;
  });

  const handleDeleteConfirm = () => {
    if (!charToDelete) return;
    if (onDeleteVoice) {
      onDeleteVoice(charToDelete);
    }
    onShowToast?.(`🗑️ បានលុបសំឡេង "${charToDelete.label}" ជោគជ័យ!`, 'success');
    setCharToDelete(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6 select-none font-khmer">
      {/* ── Top Action Toolbar ── */}
      <div className="bg-[#0b0f19] border border-white/[0.08] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-bold text-white tracking-wide">
              គ្រប់គ្រងសំឡេងតួអង្គខ្មែរ (VOICE ACTOR LIBRARY)
            </h3>
            {isAdmin && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Shield className="w-3 h-3 text-amber-400" />
                <span>ADMIN RIGHTS</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            សំឡេងតួឯកប្រុស តួឯកស្រី មេទ័ព ព្រឹទ្ធាចារ្យ តួកាច និងសំឡេង AI Clone ផ្ទាល់ខ្លួន
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs transition-all shadow-lg shadow-cyan-500/25 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ បន្ថែមសំឡេងថ្មី</span>
          </button>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ស្វែងរកឈ្មោះតួអង្គ ឬឃ្លានិយាយ..."
            className="w-full bg-[#080c14] border border-white/[0.08] focus:border-cyan-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#080c14] p-1 rounded-xl border border-white/[0.08]">
          <button
            onClick={() => setGenderFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              genderFilter === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ទាំងអស់ ({characters.length})
          </button>
          <button
            onClick={() => setGenderFilter('male')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              genderFilter === 'male'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            តួប្រុស
          </button>
          <button
            onClick={() => setGenderFilter('female')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              genderFilter === 'female'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            តួស្រី
          </button>
        </div>
      </div>

      {/* ── Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((char) => {
          const isSelected = selectedVoiceId === char.id || selectedVoiceId === char.filename;

          return (
            <div
              key={char.id}
              className={`bg-[#0b0f19] border rounded-2xl p-4.5 flex flex-col justify-between gap-3.5 transition-all duration-300 hover:shadow-xl ${
                isSelected
                  ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] bg-cyan-950/20'
                  : 'border-white/[0.08] hover:border-white/[0.2] hover:bg-[#0e1422]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white truncate">
                        {char.label || char.filename}
                      </h4>
                      {isSelected && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 shrink-0">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-lg mt-1 ${
                        char.gender === 'female'
                          ? 'bg-pink-500/15 text-pink-300 border border-pink-500/25'
                          : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25'
                      }`}
                    >
                      {char.role_key || 'តួអង្គ'} • {char.gender === 'female' ? 'ស្រី' : 'ប្រុស'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Audition Button */}
                    <button
                      onClick={() => onOpenAuditionModal(char)}
                      className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-colors"
                      title="សាកល្បងឱ្យតួអង្គនិយាយ (Audition)"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>

                    {/* Admin Delete Button */}
                    {isAdmin && (
                      <button
                        onClick={() => setCharToDelete(char)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        title="[Admin] លុបសំឡេងនេះ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sample phrase quote */}
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/[0.04]">
                  "{char.words || 'សំឡេងគំរូក្នុងស្ទូឌីយោ'}"
                </p>
              </div>

              {/* Bottom Card Controls: Preview Audio & Select Voice */}
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] mt-auto gap-2">
                {char.previewUrl ? (
                  <audio src={char.previewUrl} controls className="h-7 w-36 accent-cyan-400" />
                ) : (
                  <span className="text-[10px] text-slate-500">Offline Sample</span>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenEditModal(char)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/[0.06] transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>កែប្រែ</span>
                  </button>

                  {/* Select Voice Button */}
                  {onSelectVoice && (
                    <button
                      onClick={() => onSelectVoice(char)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        isSelected
                          ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                          : 'bg-white/[0.05] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300'
                      }`}
                    >
                      {isSelected ? 'កំពុងជ្រើស' : 'ជ្រើសរើស'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Admin Delete Confirmation Modal ── */}
      {charToDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-red-500/40 rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 shadow-[0_0_35px_rgba(239,68,68,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">បញ្ជាក់ការលុបសំឡេង (Admin)</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  តើអ្នកពិតជាចង់លុបសំឡេង "{charToDelete.label}" នេះមែនទេ?
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-xs text-red-300 leading-relaxed">
              ⚠️ ការលុបនេះនឹងដកហូតឯកសារសំឡេងគំរូចេញពី Voice Library ជារៀងរហូត។
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCharToDelete(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs text-slate-300"
              >
                បោះបង់
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold shadow-lg shadow-red-500/30"
              >
                លុបសំឡេងភ្លាម
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
