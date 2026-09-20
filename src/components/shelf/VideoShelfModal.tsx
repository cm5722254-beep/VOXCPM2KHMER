import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Film,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  FolderKanban,
  HardDrive,
  UploadCloud,
  Loader2,
  Sparkles,
  Tag,
  Clock,
  FileVideo,
  ChevronDown
} from 'lucide-react';
import { VideoShelfItem, ProjectGroup, ProjectFile } from '../../types';
import { api } from '../../services/api';

interface VideoShelfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVideoForDubbing: (videoFile: ProjectFile) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onOpenGroupManager?: () => void;
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  purple: { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  amber: { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30' },
  rose: { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30' },
  sky: { bg: 'bg-sky-500/15', text: 'text-sky-300', border: 'border-sky-500/30' },
};

export const VideoShelfModal: React.FC<VideoShelfModalProps> = ({
  isOpen,
  onClose,
  onSelectVideoForDubbing,
  onShowToast,
  onOpenGroupManager,
}) => {
  const [shelf, setShelf] = useState<VideoShelfItem[]>([]);
  const [groups, setGroups] = useState<ProjectGroup[]>([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedUploadGroup, setSelectedUploadGroup] = useState<string>('grp_all');
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadShelfData();
    }
  }, [isOpen]);

  const loadShelfData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getVideoShelf();
      if (res.success) {
        setShelf(res.shelf || []);
        setGroups(res.groups || []);
      }
    } catch (e: any) {
      onShowToast(`កំហុសទាញយកទិន្នន័យឃ្លាំង: ${e.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const usedSlots = shelf.length;
  const maxSlots = 10;
  const isFull = usedSlots >= maxSlots;
  const capacityPercent = Math.min(100, Math.round((usedSlots / maxSlots) * 100));

  const filteredShelf = selectedGroupFilter === 'all'
    ? shelf
    : shelf.filter((item) => item.groupId === selectedGroupFilter);

  const handleUploadToShelf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isFull) {
      onShowToast('⚠️ ឃ្លាំងផ្ទុកវីដេអូបានពេញកំណត់ ១០/១០ ហើយ! សូមលុបវីដេអូចាស់ខ្លះចេញសិន', 'warning');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload media to server uploads folder
      const uploadRes = await api.uploadFile(file, (percent) => {
        setUploadProgress(percent);
      });

      if (!uploadRes.success) {
        throw new Error('Upload file failed');
      }

      // 2. Find group info
      const matchedGroup = groups.find((g) => g.id === selectedUploadGroup);
      const groupName = matchedGroup ? matchedGroup.name : 'ទូទៅ (General)';

      // 3. Register into shelf
      const shelfRes = await api.addToShelf({
        filename: uploadRes.filename,
        originalName: file.name,
        size: file.size,
        duration: 0,
        groupId: selectedUploadGroup,
        groupName: groupName,
      });

      if (shelfRes.success) {
        setShelf(shelfRes.shelf);
        onShowToast(`✨ បានបន្ថែម "${file.name}" ចូលឃ្លាំងវីដេអូជោគជ័យ!`, 'success');
      }
    } catch (err: any) {
      onShowToast(`កំហុសបញ្ចូលវីដេអូ: ${err.message}`, 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteItem = async (itemId: string, name: string) => {
    if (!window.confirm(`តើអ្នកពិតជាចង់លុប "${name}" ចេញពីឃ្លាំងវីដេអូមែនទេ?`)) return;

    try {
      const res = await api.removeFromShelf(itemId);
      if (res.success) {
        setShelf(res.shelf);
        onShowToast('បានលុបវីដេអូចេញពីឃ្លាំងរួចរាល់', 'info');
      }
    } catch (e: any) {
      onShowToast(`កំហុសលុបវីដេអូ: ${e.message}`, 'error');
    }
  };

  const handleGroupChange = async (itemId: string, newGroupId: string) => {
    const matched = groups.find((g) => g.id === newGroupId);
    const groupName = matched ? matched.name : 'ទូទៅ';
    try {
      const res = await api.updateShelfGroup(itemId, newGroupId, groupName);
      if (res.success) {
        setShelf(res.shelf);
        onShowToast('បានផ្លាស់ប្តូរ Group រឿងជោគជ័យ', 'success');
      }
    } catch (e: any) {
      onShowToast(`កំហុសផ្លាស់ប្តូរ Group: ${e.message}`, 'error');
    }
  };

  const handleLoadToDubbingStudio = (item: VideoShelfItem) => {
    const projectFile: ProjectFile = {
      filename: item.filename,
      originalName: item.originalName,
      size: item.size,
      type: 'video',
      url: `/media/uploads/${item.filename}`,
    };
    onSelectVideoForDubbing(projectFile);
    onShowToast(`🎬 បានយក "${item.originalName}" មកបញ្ចូលសំឡេងក្នុង Studio រួចរាល់!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b0f19] border border-cyan-500/30 rounded-2xl w-full max-w-5xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.18)] flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="p-4 px-6 border-b border-white/[0.08] flex items-center justify-between bg-[#070a12]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-khmer">
                  ឃ្លាំងផ្ទុកវីដេអូត្រៀមបញ្ចូលសំឡេង (10-Video Shelf)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                  {usedSlots} / {maxSlots} វីដេអូ
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-khmer">
                ផ្ទុកទុកវីដេអូដែលចង់ធ្វើជាក្រុមៗ (Group) មិនឱ្យច្រឡំគ្នា និងចុចយកមកបញ្ចូលសំឡេងបានភ្លាមៗ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenGroupManager && (
              <button
                onClick={onOpenGroupManager}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.1] text-xs font-khmer transition-colors"
              >
                <FolderKanban className="w-3.5 h-3.5 text-cyan-400" />
                <span>គ្រប់គ្រង Group រឿង</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Capacity Meter Banner */}
        <div className="px-6 py-2.5 bg-[#0d1322] border-b border-white/[0.06] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-1 max-w-md">
            <span className="text-[11px] font-bold text-slate-300 font-khmer flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>ទំហំផ្ទុកឃ្លាំង:</span>
            </span>
            <div className="flex-1 h-2 rounded-full bg-black/60 overflow-hidden border border-white/10 relative">
              <div
                className={`h-full transition-all duration-300 ${
                  isFull
                    ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                    : 'bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500'
                }`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
            <span className={`text-[11px] font-mono font-bold ${isFull ? 'text-rose-400' : 'text-cyan-300'}`}>
              {usedSlots}/10
            </span>
          </div>

          {/* Group Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-xl">
            <button
              onClick={() => setSelectedGroupFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold font-khmer transition-all ${
                selectedGroupFilter === 'all'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white'
              }`}
            >
              ទាំងអស់ ({shelf.length})
            </button>
            {groups.map((grp) => {
              const count = shelf.filter((s) => s.groupId === grp.id).length;
              const colorInfo = COLOR_MAP[grp.color] || COLOR_MAP.cyan;
              const isActive = selectedGroupFilter === grp.id;
              return (
                <button
                  key={grp.id}
                  onClick={() => setSelectedGroupFilter(grp.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium font-khmer transition-all flex items-center gap-1.5 ${
                    isActive
                      ? `${colorInfo.bg} ${colorInfo.text} ${colorInfo.border} border font-bold shadow-sm`
                      : 'bg-white/[0.04] text-slate-400 hover:text-white'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${colorInfo.text.replace('text-', 'bg-')}`} />
                  <span className="truncate max-w-[120px]">{grp.name}</span>
                  <span className="text-[10px] opacity-70 font-mono">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Shelf Content & Cards */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {/* Upload Box to add new video into shelf */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/[0.12] hover:border-cyan-500/40 transition-colors flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-khmer">
                  បញ្ចូលវីដេអូថ្មីចូលឃ្លាំង (នៅសល់ {10 - usedSlots} កន្លែង)
                </div>
                <div className="text-[11px] text-slate-400 font-khmer flex items-center gap-2">
                  <span>ជ្រើសរើស Group រឿង:</span>
                  <select
                    value={selectedUploadGroup}
                    onChange={(e) => setSelectedUploadGroup(e.target.value)}
                    className="bg-[#07090e] border border-white/[0.1] rounded px-2 py-0.5 text-xs text-cyan-300 font-khmer outline-none cursor-pointer"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                disabled={isFull || isUploading}
                onChange={handleUploadToShelf}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isFull || isUploading}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-khmer transition-all shadow-md ${
                  isFull
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                    : 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:brightness-110 text-slate-950 shadow-cyan-500/20'
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>កំពុង Upload ({uploadProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{isFull ? 'ឃ្លាំងពេញហើយ (១០/១០)' : 'បញ្ចូលវីដេអូថ្មី'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Video Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <span className="text-xs font-khmer">កំពុងទាញយកទិន្នន័យឃ្លាំងវីដេអូ...</span>
            </div>
          ) : filteredShelf.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-white/[0.06] rounded-2xl bg-white/[0.01] text-slate-400 gap-2 font-khmer">
              <Film className="w-10 h-10 text-slate-600 mb-1" />
              <div className="text-sm font-bold text-slate-300">មិនទាន់មានវីដេអូក្នុង Group នេះទេ</div>
              <p className="text-xs text-slate-500 max-w-sm text-center">
                ចុចប៊ូតុង "បញ្ចូលវីដេអូថ្មី" ខាងលើដើម្បីរក្សាទុកវីដេអូទុកបញ្ជូលសំឡេង។
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredShelf.map((item, idx) => {
                const groupObj = groups.find((g) => g.id === item.groupId);
                const colorInfo = COLOR_MAP[groupObj?.color || 'cyan'] || COLOR_MAP.cyan;
                const sizeMb = (item.size / (1024 * 1024)).toFixed(1);

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-white/[0.025] hover:bg-white/[0.045] border border-white/[0.08] hover:border-cyan-500/40 transition-all flex flex-col gap-3 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Video Thumbnail Placeholder / Video Icon */}
                      <div className="relative w-28 h-18 bg-[#05070d] rounded-lg border border-white/[0.08] flex items-center justify-center overflow-hidden shrink-0">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-600 group-hover:text-cyan-400 transition-colors">
                            <FileVideo className="w-6 h-6" />
                            <span className="text-[9px] font-mono mt-0.5 text-slate-500">#{idx + 1}</span>
                          </div>
                        )}
                        <button
                          onClick={() => setPreviewVideoUrl(`/media/uploads/${item.filename}`)}
                          className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="ទស្សនាវីដេអូ"
                        >
                          <Play className="w-5 h-5 text-white fill-white" />
                        </button>
                      </div>

                      {/* Video Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="text-xs font-bold text-white truncate font-khmer" title={item.originalName}>
                          {item.originalName}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>{sizeMb} MB</span>
                          <span>•</span>
                          <span>{item.addedAt ? item.addedAt.slice(0, 10) : 'ថ្ងៃនេះ'}</span>
                        </div>

                        {/* Group Tag Selector */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <Tag className="w-3 h-3 text-slate-500" />
                          <select
                            value={item.groupId || 'grp_all'}
                            onChange={(e) => handleGroupChange(item.id, e.target.value)}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border outline-none cursor-pointer ${colorInfo.bg} ${colorInfo.text} ${colorInfo.border}`}
                          >
                            {groups.map((g) => (
                              <option key={g.id} value={g.id} className="bg-[#0b0f19] text-white">
                                {g.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.04]">
                      <button
                        onClick={() => handleDeleteItem(item.id, item.originalName)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="លុបចេញពីឃ្លាំង"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleLoadToDubbingStudio(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold font-khmer transition-all active:scale-98"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>យកមកបញ្ចូលសំឡេង (Load to Studio)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Video Preview Modal if clicked */}
        {previewVideoUrl && (
          <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4">
            <div className="bg-[#07090e] border border-white/20 rounded-2xl max-w-3xl w-full p-4 flex flex-col gap-3 relative shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-khmer">ទស្សនាវីដេអូ</span>
                <button
                  onClick={() => setPreviewVideoUrl(null)}
                  className="text-slate-400 hover:text-white p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="w-full aspect-video bg-black rounded-xl overflow-hidden">
                <video src={previewVideoUrl} controls autoPlay className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
