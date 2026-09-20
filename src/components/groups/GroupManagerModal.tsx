import React, { useState, useEffect } from 'react';
import {
  X,
  FolderKanban,
  Plus,
  Trash2,
  Edit2,
  Check,
  Tag,
  Film,
  Sparkles,
  Loader2,
  Layers
} from 'lucide-react';
import { ProjectGroup } from '../../types';
import { api } from '../../services/api';

interface GroupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupsUpdated?: (groups: ProjectGroup[]) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const AVAILABLE_COLORS = [
  { id: 'cyan', label: 'ខៀវភ្លឺ (Cyan)', bg: 'bg-cyan-500', ring: 'ring-cyan-400' },
  { id: 'purple', label: 'ស្វាយ (Purple)', bg: 'bg-purple-500', ring: 'ring-purple-400' },
  { id: 'emerald', label: 'បៃតង (Emerald)', bg: 'bg-emerald-500', ring: 'ring-emerald-400' },
  { id: 'amber', label: 'ទឹកក្រូចមាស (Amber)', bg: 'bg-amber-500', ring: 'ring-amber-400' },
  { id: 'rose', label: 'ផ្កាឈូក (Rose)', bg: 'bg-rose-500', ring: 'ring-rose-400' },
  { id: 'sky', label: 'ផ្ទៃមេឃ (Sky)', bg: 'bg-sky-500', ring: 'ring-sky-400' },
];

export const GroupManagerModal: React.FC<GroupManagerModalProps> = ({
  isOpen,
  onClose,
  onGroupsUpdated,
  onShowToast,
}) => {
  const [groups, setGroups] = useState<ProjectGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // New group form
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('cyan');
  const [newDesc, setNewDesc] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('cyan');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadGroups();
    }
  }, [isOpen]);

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const res = await api.getProjectGroups();
      if (res.success) {
        setGroups(res.groups || []);
        onGroupsUpdated?.(res.groups || []);
      }
    } catch (e: any) {
      onShowToast(`កំហុសទាញយក Group: ${e.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newName.trim();
    if (!clean) {
      onShowToast('សូមបញ្ចូលឈ្មោះ Group រឿង', 'warning');
      return;
    }

    setIsCreating(true);
    try {
      const res = await api.createProjectGroup({
        name: clean,
        color: newColor,
        description: newDesc.trim(),
      });
      if (res.success) {
        setGroups(res.groups);
        onGroupsUpdated?.(res.groups);
        setNewName('');
        setNewDesc('');
        onShowToast(`🎉 បានបង្កើត Group "${clean}" ជោគជ័យ!`, 'success');
      }
    } catch (err: any) {
      onShowToast(`កំហុសបង្កើត Group: ${err.message}`, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartEdit = (g: ProjectGroup) => {
    setEditingId(g.id);
    setEditName(g.name);
    setEditColor(g.color || 'cyan');
    setEditDesc(g.description || '');
  };

  const handleSaveEdit = async (groupId: string) => {
    try {
      const res = await api.updateProjectGroup(groupId, {
        name: editName,
        color: editColor,
        description: editDesc,
      });
      if (res.success) {
        setGroups(res.groups);
        onGroupsUpdated?.(res.groups);
        setEditingId(null);
        onShowToast('បានកែប្រែ Group រួចរាល់!', 'success');
      }
    } catch (e: any) {
      onShowToast(`កំហុសកែប្រែ Group: ${e.message}`, 'error');
    }
  };

  const handleDeleteGroup = async (groupId: string, name: string) => {
    if (groupId === 'grp_all') {
      onShowToast('មិនអាចលុប Group ទូទៅបានទេ', 'warning');
      return;
    }
    if (!window.confirm(`តើអ្នកពិតជាចង់លុប Group "${name}" មែនទេ? វីដេអូទាំងអស់ក្នុង Group នេះនឹងត្រូវប្តូរទៅកាន់ Group ទូទៅ។`)) {
      return;
    }

    try {
      const res = await api.deleteProjectGroup(groupId);
      if (res.success) {
        setGroups(res.groups);
        onGroupsUpdated?.(res.groups);
        onShowToast('បានលុប Group រួចរាល់!', 'info');
      }
    } catch (e: any) {
      onShowToast(`កំហុសលុប Group: ${e.message}`, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-khmer">
      <div className="bg-[#0b0f19] border border-cyan-500/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.2)] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 px-6 border-b border-white/[0.08] flex items-center justify-between bg-[#070a12]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                គ្រប់គ្រង Group / ស៊េរីរឿង (Project Groups)
              </h3>
              <p className="text-[11px] text-slate-400">
                បែងចែករឿងនីមួយៗដាច់ដោយឡែកពីគ្នា មិនឱ្យច្រឡំ ឬលាយឡំគ្នាឡើយ
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
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Create Group Form */}
          <form onSubmit={handleCreateGroup} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <Plus className="w-3.5 h-3.5" />
              <span>បង្កើត Group រឿងថ្មី:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  ឈ្មោះ Group / រឿង *
                </label>
                <input
                  type="text"
                  placeholder="ឧ. រឿង ដាវទេពយុទ្ធសិល្ប៍ ភាគ ១-២០"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#07090e] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 font-khmer"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  ពណ៌ Tag សម្គាល់
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {AVAILABLE_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewColor(c.id)}
                      className={`w-5 h-5 rounded-full ${c.bg} transition-all ${
                        newColor === c.id ? `ring-2 ${c.ring} ring-offset-2 ring-offset-[#0b0f19] scale-110` : 'opacity-70 hover:opacity-100'
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">
                ការពិពណ៌នាខ្លី (Optional)
              </label>
              <input
                type="text"
                placeholder="ឧ. ភាពយន្តភាគ Anime ផ្សាយរៀងរាល់ថ្ងៃសៅរ៍..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-[#07090e] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder-slate-500 outline-none focus:border-cyan-400 font-khmer"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isCreating}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50"
              >
                {isCreating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>បង្កើត Group</span>
              </button>
            </div>
          </form>

          {/* Groups List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>បញ្ជី Group រឿងទាំងអស់ ({groups.length})</span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-slate-500 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span className="text-xs">កំពុងទាញយកបញ្ជី...</span>
              </div>
            ) : groups.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 border border-white/[0.06] rounded-xl">
                មិនទាន់មាន Group នៅឡើយទេ
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden bg-[#07090e]">
                {groups.map((g) => {
                  const isEditing = editingId === g.id;
                  const colorMatch = AVAILABLE_COLORS.find((c) => c.id === (g.color || 'cyan')) || AVAILABLE_COLORS[0];

                  return (
                    <div
                      key={g.id}
                      className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                    >
                      {isEditing ? (
                        <div className="flex-1 w-full space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="flex-1 bg-black/50 border border-cyan-500/50 rounded px-2 py-1 text-xs text-white outline-none"
                            />
                            <div className="flex items-center gap-1.5">
                              {AVAILABLE_COLORS.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => setEditColor(c.id)}
                                  className={`w-4 h-4 rounded-full ${c.bg} ${
                                    editColor === c.id ? 'ring-2 ring-white scale-110' : 'opacity-60'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="ការពិពណ៌នា..."
                            className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-slate-300 outline-none"
                          />
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={() => handleSaveEdit(g.id)}
                              className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>រក្សាទុក</span>
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 rounded bg-white/10 text-slate-300 text-xs"
                            >
                              បោះបង់
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${colorMatch.bg} ring-2 ring-white/20 shrink-0`} />
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-2">
                                <span>{g.name}</span>
                                {g.id === 'grp_all' && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                    Default
                                  </span>
                                )}
                              </div>
                              {g.description && (
                                <p className="text-[11px] text-slate-400 line-clamp-1">{g.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            <span className="text-[11px] text-slate-400 font-mono px-2 py-0.5 rounded bg-white/[0.04]">
                              {g.videoCount || 0} វីដេអូ
                            </span>
                            <button
                              onClick={() => handleStartEdit(g)}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                              title="កែសម្រួល"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {g.id !== 'grp_all' && (
                              <button
                                onClick={() => handleDeleteGroup(g.id, g.name)}
                                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="លុប Group"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-white/[0.08] flex justify-end bg-[#070a12]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-bold transition-colors"
          >
            បិទផ្ទាំង
          </button>
        </div>
      </div>
    </div>
  );
};
