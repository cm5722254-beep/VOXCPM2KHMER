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
  Layers,
  Volume2,
  Play,
  Square,
  Mic2,
  CheckCircle2
} from 'lucide-react';
import { ProjectGroup, CharacterVoice } from '../../types';
import { api } from '../../services/api';

interface GroupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups?: ProjectGroup[];
  onGroupsUpdated?: (groups: ProjectGroup[]) => void;
  onSelectGroup?: (groupId: string) => void;
  activeGroupId?: string | null;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  characters?: CharacterVoice[];
  isLicensed?: boolean;
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
  onSelectGroup,
  activeGroupId,
  onShowToast,
  characters = [],
  isLicensed = false,
}) => {
  const [groups, setGroups] = useState<ProjectGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // New group form
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('cyan');
  const [newDesc, setNewDesc] = useState('');
  const [newMaleVoice, setNewMaleVoice] = useState('km-KH-PisethNeural');
  const [newFemaleVoice, setNewFemaleVoice] = useState('km-KH-SreymomNeural');
  const [newNarratorVoice, setNewNarratorVoice] = useState('khmer_narrator');
  const [newSupportingVoice, setNewSupportingVoice] = useState('khmer_comedy');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('cyan');
  const [editDesc, setEditDesc] = useState('');
  const [editMaleVoice, setEditMaleVoice] = useState('km-KH-PisethNeural');
  const [editFemaleVoice, setEditFemaleVoice] = useState('km-KH-SreymomNeural');
  const [editNarratorVoice, setEditNarratorVoice] = useState('khmer_narrator');
  const [editSupportingVoice, setEditSupportingVoice] = useState('khmer_comedy');

  // Audio Preview State
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [audioElem, setAudioElem] = useState<HTMLAudioElement | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadGroups();
    } else {
      stopAudio();
    }
  }, [isOpen]);

  const stopAudio = () => {
    if (audioElem) {
      audioElem.pause();
      audioElem.currentTime = 0;
      setAudioElem(null);
    }
    setPlayingVoiceId(null);
  };

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

  // Helper voice lists
  const standardMaleVoices = [
    { id: 'km-KH-PisethNeural', label: '🎙️ ពិសិដ្ឋ (ស្តង់ដារ PisethNeural)' },
    { id: 'khmer_male_lead', label: '🎭 តួប្រុសឯក (Khmer Male Hero)' },
    { id: 'khmer_villain', label: '⚡ តួកាច/មេកន្ទ្រាញ (Villain)' },
    { id: 'khmer_elder', label: '👴 ព្រឹទ្ធាចារ្យ/លោកតា (Khmer Elder)' },
  ];

  const standardFemaleVoices = [
    { id: 'km-KH-SreymomNeural', label: '🌸 ស្រីមុំ (ស្តង់ដារ SreymomNeural)' },
    { id: 'khmer_female_lead', label: '🌺 តួស្រីឯក (Khmer Female Heroine)' },
    { id: 'khmer_child', label: '🧒 កុមារ/ក្មេងស្រីតូច (Child)' },
  ];

  const standardNarratorVoices = [
    { id: 'khmer_narrator', label: '📜 អ្នកនិទានរឿង (Theatrical Narrator)' },
    { id: 'km-KH-PisethNeural', label: '🎙️ ពិសិដ្ឋ (ស្តង់ដារ PisethNeural)' },
    { id: 'khmer_elder', label: '👴 ព្រឹទ្ធាចារ្យនិទាន (Elder Narrator)' },
  ];

  const standardSupportingVoices = [
    { id: 'khmer_comedy', label: '😄 តួកំប្លែង (Comic Relief)' },
    { id: 'khmer_elder', label: '👴 មនុស្សចាស់/ព្រឹទ្ធាចារ្យ (Elder)' },
    { id: 'khmer_villain', label: '⚡ តួកាច (Villain)' },
    { id: 'khmer_child', label: '🧒 កុមារ/ក្មេងតូច (Child)' },
  ];

  // Combined voice options
  const getMaleVoiceOptions = () => {
    const list = [...standardMaleVoices];
    if (isLicensed) {
      characters
        .filter((c) => c.gender === 'male')
        .forEach((c) => {
          list.push({ id: c.id, label: `🎙️ ${c.label}` });
        });
    }
    return list;
  };

  const getFemaleVoiceOptions = () => {
    const list = [...standardFemaleVoices];
    if (isLicensed) {
      characters
        .filter((c) => c.gender === 'female')
        .forEach((c) => {
          list.push({ id: c.id, label: `🌸 ${c.label}` });
        });
    }
    return list;
  };

  const getNarratorVoiceOptions = () => {
    const list = [...standardNarratorVoices];
    if (isLicensed) {
      characters.forEach((c) => {
        list.push({ id: c.id, label: `${c.gender === 'female' ? '🌸' : '🎙️'} ${c.label}` });
      });
    }
    return list;
  };

  const getSupportingVoiceOptions = () => {
    const list = [...standardSupportingVoices];
    if (isLicensed) {
      characters.forEach((c) => {
        list.push({ id: c.id, label: `${c.gender === 'female' ? '🌸' : '🎙️'} ${c.label}` });
      });
    }
    return list;
  };

  const getVoiceDisplayLabel = (voiceId?: string) => {
    if (!voiceId) return 'មិនទាន់កំណត់';
    if (voiceId === 'km-KH-PisethNeural') return '🎙️ ពិសិដ្ឋ';
    if (voiceId === 'km-KH-SreymomNeural') return '🌸 ស្រីមុំ';
    if (voiceId === 'khmer_male_lead') return '🎭 តួប្រុសឯក';
    if (voiceId === 'khmer_female_lead') return '🌺 តួស្រីឯក';
    if (voiceId === 'khmer_narrator') return '📜 អ្នកនិទានរឿង';
    if (voiceId === 'khmer_comedy') return '😄 តួកំប្លែង';
    if (voiceId === 'khmer_villain') return '⚡ តួកាច';
    if (voiceId === 'khmer_elder') return '👴 ព្រឹទ្ធាចារ្យ';
    if (voiceId === 'khmer_child') return '🧒 កុមារ';
    const clean = voiceId.replace('voxcpm:', '');
    const matched = characters.find((c) => c.id === voiceId || c.filename === clean);
    return matched ? matched.label : clean;
  };

  // Preview Voice Function
  const handlePlayPreview = async (voiceId: string) => {
    if (!voiceId) return;

    if (playingVoiceId === voiceId) {
      stopAudio();
      return;
    }

    stopAudio();
    setIsSynthesizing(true);

    try {
      const clean = voiceId.replace('voxcpm:', '');
      const matchedChar = characters.find((c) => c.id === voiceId || c.filename === clean);

      // Check if direct audio sample exists
      if (clean.endsWith('.mp3') || clean.endsWith('.wav') || matchedChar?.previewUrl) {
        const url = matchedChar?.previewUrl || `/media/samples/${clean}`;
        const a = new Audio(url);
        a.onended = () => {
          setPlayingVoiceId(null);
          setAudioElem(null);
        };
        a.onerror = () => {
          setPlayingVoiceId(null);
          setAudioElem(null);
          onShowToast('មិនអាចចាក់សំឡេងគំរូបានទេ', 'error');
        };
        await a.play();
        setAudioElem(a);
        setPlayingVoiceId(voiceId);
      } else {
        // Synthesize short test speech
        const testText =
          voiceId.includes('female') || voiceId.includes('Sreymom')
            ? 'សួស្តី! ខ្ញុំជាសំឡេងតួស្រីសម្រាប់ស៊េរីរឿងនេះ។'
            : voiceId.includes('narrator')
            ? 'កាលពីព្រេងនាយ នៅលើទឹកដីអាថ៌កំបាំង...'
            : voiceId.includes('comedy')
            ? 'ហាហា! ខ្ញុំជាតួកំប្លែងប្រចាំស៊េរីរឿងនេះហើយ!'
            : 'នេះជាសំឡេងតួប្រុសសម្រាប់ Group រឿងនេះ!';

        const res = await api.characterSpeak({
          voiceId,
          text: testText,
          emotion: 'dramatic',
          gender: voiceId.includes('female') || voiceId.includes('Sreymom') ? 'female' : 'male',
        });

        if (res.success && res.audioUrl) {
          const a = new Audio(res.audioUrl);
          a.onended = () => {
            setPlayingVoiceId(null);
            setAudioElem(null);
          };
          a.onerror = () => {
            setPlayingVoiceId(null);
            setAudioElem(null);
          };
          await a.play();
          setAudioElem(a);
          setPlayingVoiceId(voiceId);
        } else {
          onShowToast('មិនអាចសំយោគសំឡេងគំរូបានទេ', 'warning');
        }
      }
    } catch (e: any) {
      setPlayingVoiceId(null);
      onShowToast(`កំហុសចាក់សំឡេង: ${e.message}`, 'error');
    } finally {
      setIsSynthesizing(false);
    }
  };

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
        maleLeadVoice: newMaleVoice,
        femaleLeadVoice: newFemaleVoice,
        narratorVoice: newNarratorVoice,
        supportingVoice: newSupportingVoice,
      });
      if (res.success) {
        setGroups(res.groups);
        onGroupsUpdated?.(res.groups);
        setNewName('');
        setNewDesc('');
        onShowToast(`🎉 បានបង្កើត Group "${clean}" ជាមួយសំឡេងកំណត់រួចរាល់!`, 'success');
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
    setEditMaleVoice(g.maleLeadVoice || 'km-KH-PisethNeural');
    setEditFemaleVoice(g.femaleLeadVoice || 'km-KH-SreymomNeural');
    setEditNarratorVoice(g.narratorVoice || 'khmer_narrator');
    setEditSupportingVoice(g.supportingVoice || 'khmer_comedy');
  };

  const handleSaveEdit = async (groupId: string) => {
    try {
      const res = await api.updateProjectGroup(groupId, {
        name: editName,
        color: editColor,
        description: editDesc,
        maleLeadVoice: editMaleVoice,
        femaleLeadVoice: editFemaleVoice,
        narratorVoice: editNarratorVoice,
        supportingVoice: editSupportingVoice,
      });
      if (res.success) {
        setGroups(res.groups);
        onGroupsUpdated?.(res.groups);
        setEditingId(null);
        onShowToast('បានកែប្រែ Group និងសំឡេងប្រចាំរឿងរួចរាល់!', 'success');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-khmer">
      <div className="bg-[#0b0f19] border border-cyan-500/30 rounded-2xl w-full max-w-3xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 px-6 border-b border-white/[0.08] flex items-center justify-between bg-[#070a12]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/30">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>គ្រប់គ្រង Group / ស៊េរីរឿង & កំណត់សំឡេង</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Exclusive Casting
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                ជ្រើសរើសសំឡេងប្រចាំរឿងនីមួយៗឱ្យដាច់ដោយឡែក ធានាថាមិនច្រឡំ ឬលាយឡំជាមួយរឿងផ្សេងឡើយ
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopAudio();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {/* Create Group Form */}
          <form onSubmit={handleCreateGroup} className="p-4 rounded-xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                <Plus className="w-3.5 h-3.5" />
                <span>បង្កើត Group រឿងថ្មី & កំណត់សំឡេងផ្ទាល់ខ្លួន:</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {!isLicensed ? '🛡️ កំណត់សំឡេងខ្មែរ Offline' : '✨ សំឡេងខ្មែរ & AI Cloned Library'}
              </span>
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
                  className="w-full bg-[#07090e] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 font-khmer transition-all"
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
                className="w-full bg-[#07090e] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder-slate-500 outline-none focus:border-cyan-400 font-khmer transition-all"
              />
            </div>

            {/* ── Group Voices Configuration Section ── */}
            <div className="pt-2 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-2.5">
                <Mic2 className="w-3.5 h-3.5" />
                <span>កំណត់សំឡេងតួអង្គប្រចាំ Group (ជ្រើសរើសសំឡេងដាច់ដោយឡែក):</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Male Lead Voice */}
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                    <span className="flex items-center gap-1 text-cyan-400">
                      🎙️ តួប្រុសឯក (Male Lead)
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePlayPreview(newMaleVoice)}
                      disabled={isSynthesizing}
                      className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 transition-all"
                    >
                      {playingVoiceId === newMaleVoice ? <Square className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                      <span>{playingVoiceId === newMaleVoice ? 'បញ្ឈប់' : 'សាកល្បង'}</span>
                    </button>
                  </div>
                  <select
                    value={newMaleVoice}
                    onChange={(e) => setNewMaleVoice(e.target.value)}
                    className="w-full bg-[#07090e] border border-white/[0.1] rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-cyan-400 cursor-pointer truncate"
                  >
                    {getMaleVoiceOptions().map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Female Lead Voice */}
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                    <span className="flex items-center gap-1 text-rose-400">
                      🌸 តួស្រីឯក (Female Lead)
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePlayPreview(newFemaleVoice)}
                      disabled={isSynthesizing}
                      className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 flex items-center gap-1 transition-all"
                    >
                      {playingVoiceId === newFemaleVoice ? <Square className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                      <span>{playingVoiceId === newFemaleVoice ? 'បញ្ឈប់' : 'សាកល្បង'}</span>
                    </button>
                  </div>
                  <select
                    value={newFemaleVoice}
                    onChange={(e) => setNewFemaleVoice(e.target.value)}
                    className="w-full bg-[#07090e] border border-white/[0.1] rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-rose-400 cursor-pointer truncate"
                  >
                    {getFemaleVoiceOptions().map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Narrator Voice */}
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                    <span className="flex items-center gap-1 text-amber-400">
                      📜 អ្នកនិទានរឿង (Narrator)
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePlayPreview(newNarratorVoice)}
                      disabled={isSynthesizing}
                      className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center gap-1 transition-all"
                    >
                      {playingVoiceId === newNarratorVoice ? <Square className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                      <span>{playingVoiceId === newNarratorVoice ? 'បញ្ឈប់' : 'សាកល្បង'}</span>
                    </button>
                  </div>
                  <select
                    value={newNarratorVoice}
                    onChange={(e) => setNewNarratorVoice(e.target.value)}
                    className="w-full bg-[#07090e] border border-white/[0.1] rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-amber-400 cursor-pointer truncate"
                  >
                    {getNarratorVoiceOptions().map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Supporting Voice */}
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                    <span className="flex items-center gap-1 text-purple-400">
                      😄 បន្ទាប់បន្សំ / កំប្លែង (Supporting)
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePlayPreview(newSupportingVoice)}
                      disabled={isSynthesizing}
                      className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 flex items-center gap-1 transition-all"
                    >
                      {playingVoiceId === newSupportingVoice ? <Square className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                      <span>{playingVoiceId === newSupportingVoice ? 'បញ្ឈប់' : 'សាកល្បង'}</span>
                    </button>
                  </div>
                  <select
                    value={newSupportingVoice}
                    onChange={(e) => setNewSupportingVoice(e.target.value)}
                    className="w-full bg-[#07090e] border border-white/[0.1] rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-purple-400 cursor-pointer truncate"
                  >
                    {getSupportingVoiceOptions().map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
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
                <span>បង្កើត Group & រក្សាទុកសំឡេង</span>
              </button>
            </div>
          </form>

          {/* Groups List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>បញ្ជី Group រឿងទាំងអស់ ({groups.length})</span>
              <span className="text-[11px] text-slate-500">ចុចលើប៊ូតុង "ជ្រើសរើស" ដើម្បីអនុវត្តរឿងនេះក្នុង Studio</span>
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
                  const isActive = activeGroupId === g.id;

                  return (
                    <div
                      key={g.id}
                      className={`p-3.5 flex flex-col gap-2.5 hover:bg-white/[0.02] transition-colors ${
                        isActive ? 'bg-cyan-950/20 border-l-2 border-l-cyan-400' : ''
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-3 p-1">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="flex-1 bg-black/60 border border-cyan-500/50 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                              placeholder="ឈ្មោះ Group..."
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
                            placeholder="ការពិពណ៌នាខ្លី..."
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-cyan-400"
                          />

                          {/* Voice Pickers in Edit Mode */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <div className="p-2 rounded bg-black/40 border border-white/[0.06]">
                              <label className="text-[10px] text-cyan-400 font-semibold block mb-1">
                                🎙️ តួប្រុសឯក (Male Lead)
                              </label>
                              <select
                                value={editMaleVoice}
                                onChange={(e) => setEditMaleVoice(e.target.value)}
                                className="w-full bg-[#07090e] border border-white/10 rounded px-2 py-1 text-xs text-slate-200 outline-none"
                              >
                                {getMaleVoiceOptions().map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="p-2 rounded bg-black/40 border border-white/[0.06]">
                              <label className="text-[10px] text-rose-400 font-semibold block mb-1">
                                🌸 តួស្រីឯក (Female Lead)
                              </label>
                              <select
                                value={editFemaleVoice}
                                onChange={(e) => setEditFemaleVoice(e.target.value)}
                                className="w-full bg-[#07090e] border border-white/10 rounded px-2 py-1 text-xs text-slate-200 outline-none"
                              >
                                {getFemaleVoiceOptions().map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="p-2 rounded bg-black/40 border border-white/[0.06]">
                              <label className="text-[10px] text-amber-400 font-semibold block mb-1">
                                📜 អ្នកនិទានរឿង (Narrator)
                              </label>
                              <select
                                value={editNarratorVoice}
                                onChange={(e) => setEditNarratorVoice(e.target.value)}
                                className="w-full bg-[#07090e] border border-white/10 rounded px-2 py-1 text-xs text-slate-200 outline-none"
                              >
                                {getNarratorVoiceOptions().map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="p-2 rounded bg-black/40 border border-white/[0.06]">
                              <label className="text-[10px] text-purple-400 font-semibold block mb-1">
                                😄 បន្ទាប់បន្សំ (Supporting)
                              </label>
                              <select
                                value={editSupportingVoice}
                                onChange={(e) => setEditSupportingVoice(e.target.value)}
                                className="w-full bg-[#07090e] border border-white/10 rounded px-2 py-1 text-xs text-slate-200 outline-none"
                              >
                                {getSupportingVoiceOptions().map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              onClick={() => handleSaveEdit(g.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 hover:bg-emerald-500/30 transition-all"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>រក្សាទុក</span>
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 text-xs hover:bg-white/15 transition-all"
                            >
                              បោះបង់
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start sm:items-center gap-3">
                              <div className={`w-3.5 h-3.5 rounded-full ${colorMatch.bg} ring-2 ring-white/20 shrink-0 mt-0.5 sm:mt-0`} />
                              <div>
                                <div className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
                                  <span>{g.name}</span>
                                  {g.id === 'grp_all' && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                      ទូទៅ
                                    </span>
                                  )}
                                  {isActive && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-bold">
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      កំពុងប្រើ
                                    </span>
                                  )}
                                </div>
                                {g.description && (
                                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{g.description}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <span className="text-[11px] text-slate-400 font-mono px-2 py-0.5 rounded bg-white/[0.04]">
                                {g.videoCount || 0} វីដេអូ
                              </span>

                              {onSelectGroup && (
                                <button
                                  onClick={() => {
                                    onSelectGroup(g.id);
                                    onShowToast(`បានប្តូរទៅកាន់ Group: ${g.name}`, 'success');
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    isActive
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-white/[0.06] hover:bg-cyan-500 hover:text-slate-950 text-slate-200'
                                  }`}
                                >
                                  {isActive ? 'កំពុងជ្រើស' : 'ជ្រើសរើស'}
                                </button>
                              )}

                              <button
                                onClick={() => handleStartEdit(g)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                                title="កែសម្រួល Group & សំឡេង"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {g.id !== 'grp_all' && (
                                <button
                                  onClick={() => handleDeleteGroup(g.id, g.name)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                  title="លុប Group"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Voice Badges assigned to this group */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                            <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                              🎙️ ប្រុស: {getVoiceDisplayLabel(g.maleLeadVoice || 'km-KH-PisethNeural')}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                              🌸 ស្រី: {getVoiceDisplayLabel(g.femaleLeadVoice || 'km-KH-SreymomNeural')}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              📜 និទាន: {getVoiceDisplayLabel(g.narratorVoice || 'khmer_narrator')}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                              😄 បន្ទាប់បន្សំ: {getVoiceDisplayLabel(g.supportingVoice || 'khmer_comedy')}
                            </span>
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
        <div className="p-4 px-6 border-t border-white/[0.08] flex items-center justify-between bg-[#070a12]">
          <span className="text-[11px] text-slate-400">
            💡 គន្លឹះ៖ រឿងនីមួយៗនឹងប្រើសំឡេងដាច់ដោយឡែកពីគ្នា មិនប៉ះពាល់ដល់រឿងផ្សេងឡើយ
          </span>
          <button
            onClick={() => {
              stopAudio();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-bold transition-colors"
          >
            បិទផ្ទាំង
          </button>
        </div>
      </div>
    </div>
  );
};
