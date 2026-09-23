import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Gift,
  CloudDownload,
  Loader2,
  Check,
  Zap,
  Shield,
  Star,
  ArrowRight,
  Rocket,
  RefreshCw,
  Download,
  Upload,
  Plus,
  Trash2,
  Link,
  RotateCcw,
  Package,
  AlertTriangle,
  History,
  FileArchive,
  HardDrive,
  FolderArchive,
  Clock,
  Radio,
  FileCheck,
} from 'lucide-react';
import { api } from '../../services/api';

interface CheckpointItem {
  id: string;
  name: string;
  version: string;
  type: string;
  created_at: string;
  formatted_date: string;
  size_mb: number;
  files_count: number;
  components: string[];
  note?: string;
}

interface SoftwareUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion?: string;
  latestVersion?: string;
  hasUpdate?: boolean;
  downloadUrl?: string;
  patchSizeMb?: number;
  changelog?: Array<{ type: string; text: string }>;
  onUpdateSuccess?: (newVersion: string) => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  isAdmin?: boolean;
}

const BADGE_CFG: Record<string, { icon: React.ReactNode; cls: string }> = {
  NEW:      { icon: <Rocket className="w-2.5 h-2.5" />, cls: 'bg-violet-500/20 text-violet-300 border border-violet-500/30' },
  IMPROVED: { icon: <Zap    className="w-2.5 h-2.5" />, cls: 'bg-cyan-500/20   text-cyan-300   border border-cyan-500/30'   },
  FIXED:    { icon: <Check  className="w-2.5 h-2.5 stroke-[3]" />, cls: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
};

/* ─── Step dots for progress ─── */
const STEPS = [15, 35, 60, 85, 100];

export const SoftwareUpdateModal: React.FC<SoftwareUpdateModalProps> = ({
  isOpen,
  onClose,
  currentVersion: initialCurrent = 'V2.1PRO',
  latestVersion: initialLatest = 'V2.1PRO',
  hasUpdate: initialHasUpdate = false,
  downloadUrl: initialDownloadUrl = '',
  patchSizeMb: initialPatchSize = 0,
  changelog: initialChangelog = [
    { type: 'NEW',      text: 'In-App Auto-Update & Checkpoint / Restore System' },
    { type: 'NEW',      text: 'Hot-Patch UI & Services without EXE reinstallation' },
    { type: 'IMPROVED', text: 'Auto pre-update safety backup & 1-click restore' },
  ],
  onUpdateSuccess,
  onShowToast,
  isAdmin = false,
}) => {
  /* ── Tab: 'update' | 'checkpoints' | 'publish' ── */
  const [tab, setTab] = useState<'update' | 'checkpoints' | 'publish'>('update');

  /* ── Version State (Live) ── */
  const [curVersion, setCurVersion] = useState(initialCurrent);
  const [targetVersion, setTargetVersion] = useState(initialLatest);
  const [hasUpdate, setHasUpdate] = useState(initialHasUpdate);
  const [dlUrl, setDlUrl] = useState(initialDownloadUrl);
  const [patchSize, setPatchSize] = useState(initialPatchSize);
  const [logItems, setLogItems] = useState(initialChangelog);
  const [isCheckingRemote, setIsCheckingRemote] = useState(false);

  /* ── Install State ── */
  const [isUpdating,      setIsUpdating]      = useState(false);
  const [updateProgress,  setUpdateProgress]  = useState(0);
  const [updateStepText,  setUpdateStepText]  = useState('');
  const [isCompleted,     setIsCompleted]     = useState(false);

  /* ── Checkpoint State ── */
  const [checkpoints, setCheckpoints] = useState<CheckpointItem[]>([]);
  const [isLoadingCheckpoints, setIsLoadingCheckpoints] = useState(false);
  const [isCreatingCp, setIsCreatingCp] = useState(false);
  const [newCpName, setNewCpName] = useState('');
  const [restoringCpId, setRestoringCpId] = useState<string | null>(null);
  const [showNewCpInput, setShowNewCpInput] = useState(false);

  /* ── File Upload Ref ── */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPatch, setIsUploadingPatch] = useState(false);

  /* ── Admin Publish Form ── */
  const [pubVersion,   setPubVersion]   = useState('');
  const [pubUrl,       setPubUrl]       = useState('');
  const [pubSizeMb,    setPubSizeMb]    = useState('');
  const [pubChangelog, setPubChangelog] = useState<{ type: string; text: string }[]>([
    { type: 'NEW', text: '' },
  ]);
  const [isPublishing, setIsPublishing] = useState(false);

  // Sync props on modal open
  useEffect(() => {
    if (isOpen) {
      setCurVersion(initialCurrent);
      setTargetVersion(initialLatest);
      setHasUpdate(initialHasUpdate);
      setDlUrl(initialDownloadUrl);
      setPatchSize(initialPatchSize);
      if (initialChangelog && initialChangelog.length > 0) {
        setLogItems(initialChangelog);
      }
      loadCheckpoints();
    }
  }, [isOpen, initialCurrent, initialLatest, initialHasUpdate, initialDownloadUrl, initialPatchSize]);

  const loadCheckpoints = async () => {
    setIsLoadingCheckpoints(true);
    try {
      const res = await api.getCheckpoints();
      if (res && res.checkpoints) {
        setCheckpoints(res.checkpoints);
      }
    } catch (e) {
      console.error('Failed to load checkpoints:', e);
    } finally {
      setIsLoadingCheckpoints(false);
    }
  };

  /* ─────────────────────────────────────────────────────────
     CHECK REMOTE UPDATE (GitHub / Cloud)
  ───────────────────────────────────────────────────────── */
  const handleCheckRemote = async () => {
    setIsCheckingRemote(true);
    try {
      const res = await api.checkUpdate();
      setCurVersion(res.current_version);
      setTargetVersion(res.latest_version);
      setHasUpdate(Boolean(res.has_update && res.current_version !== res.latest_version));
      if (res.download_url) setDlUrl(res.download_url);
      if (res.patch_size_mb) setPatchSize(res.patch_size_mb);
      if (res.changelog && res.changelog.length > 0) setLogItems(res.changelog);

      if (res.has_update && res.current_version !== res.latest_version) {
        onShowToast?.(`🎉 រកឃើញ Version ថ្មី: ${res.latest_version}!`, 'info');
      } else {
        onShowToast?.(`✅ កម្មវិធីរបស់អ្នកជា Version ចុងក្រោយបំផុត (${res.current_version})!`, 'success');
      }
    } catch (err: any) {
      onShowToast?.(`មិនអាចពិនិត្យ Update: ${err.message}`, 'error');
    } finally {
      setIsCheckingRemote(false);
    }
  };

  /* ─────────────────────────────────────────────────────────
     USER: Download & Install update
  ───────────────────────────────────────────────────────── */
  const handleInstallUpdate = async () => {
    setIsUpdating(true);
    setUpdateProgress(STEPS[0]);
    setUpdateStepText('កំពុងបង្កើត Checkpoint Backup សុវត្ថិភាព...');

    try {
      await tick(400);
      setUpdateProgress(STEPS[1]);
      setUpdateStepText('ទាញយក Patch Files ពី Cloud...');

      await tick(700);
      setUpdateProgress(STEPS[2]);
      setUpdateStepText('ដំឡើង UI & Frontend Components...');

      await tick(600);
      setUpdateProgress(STEPS[3]);
      setUpdateStepText('ដំឡើង Python Services & Hot Modules...');

      const res = await api.applyUpdate({
        target_version: targetVersion,
        download_url: dlUrl,
      });

      setUpdateProgress(STEPS[4]);
      setUpdateStepText('✅ ដំឡើងជោគជ័យ! កំពុង Reload...');
      setIsCompleted(true);

      const appliedVer = res.new_version || targetVersion;
      onShowToast?.(`🎉 Update ${appliedVer} ជោគជ័យ (មិនបាច់ដំឡើង EXE ឡើងវិញ)!`, 'success');
      onUpdateSuccess?.(appliedVer);

      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      onShowToast?.(`❌ Update បរាជ័យ: ${err.message}`, 'error');
      setIsUpdating(false);
      setUpdateProgress(0);
      loadCheckpoints();
    }
  };

  /* ─────────────────────────────────────────────────────────
     OFFLINE: Install update from uploaded .zip patch file
  ───────────────────────────────────────────────────────── */
  const handleFilePatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPatch(true);
    try {
      onShowToast?.(`📦 កំពុងដំឡើង Patch ${file.name}...`, 'info');
      const res = await api.uploadPatchFile(file);
      onShowToast?.(`🎉 បានដំឡើង Patch ជោគជ័យ! Version: ${res.new_version}`, 'success');
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      onShowToast?.(`❌ ដំឡើង Patch បរាជ័យ: ${err.message}`, 'error');
    } finally {
      setIsUploadingPatch(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadCheckpoints();
    }
  };

  /* ─────────────────────────────────────────────────────────
     CHECKPOINT: Create manual checkpoint
  ───────────────────────────────────────────────────────── */
  const handleCreateCheckpoint = async () => {
    setIsCreatingCp(true);
    try {
      const label = newCpName.trim() || undefined;
      const res = await api.createCheckpoint(label);
      onShowToast?.(res.message || 'បានបង្កើត Checkpoint ជោគជ័យ!', 'success');
      setNewCpName('');
      setShowNewCpInput(false);
      await loadCheckpoints();
    } catch (err: any) {
      onShowToast?.(`បរាជ័យបង្កើត Checkpoint: ${err.message}`, 'error');
    } finally {
      setIsCreatingCp(false);
    }
  };

  /* ─────────────────────────────────────────────────────────
     CHECKPOINT: Restore specified checkpoint
  ───────────────────────────────────────────────────────── */
  const handleRestoreCheckpoint = async (cp: CheckpointItem) => {
    const ok = window.confirm(
      `⚠️ តើអ្នកប្រាកដជាចង់ Restore ទៅ Checkpoint:\n"${cp.name}" (Version: ${cp.version})?\n\nFiles បច្ចុប្បន្ននឹងត្រូវបានស្តារត្រឡប់ទៅពេលនោះភ្លាមៗ!`
    );
    if (!ok) return;

    setRestoringCpId(cp.id);
    try {
      const res = await api.restoreCheckpoint(cp.id);
      onShowToast?.(`↩️ ${res.message} កំពុង Reload...`, 'success');
      setTimeout(() => window.location.reload(), 1800);
    } catch (err: any) {
      onShowToast?.(`Restore បរាជ័យ: ${err.message}`, 'error');
      setRestoringCpId(null);
    }
  };

  /* ─────────────────────────────────────────────────────────
     CHECKPOINT: Delete checkpoint
  ───────────────────────────────────────────────────────── */
  const handleDeleteCheckpoint = async (cpId: string) => {
    if (!window.confirm('តើអ្នកពិតជាចង់លុប Checkpoint នេះមែនទេ?')) return;
    try {
      await api.deleteCheckpoint(cpId);
      onShowToast?.('បានលុប Checkpoint រួចរាល់', 'info');
      setCheckpoints((prev) => prev.filter((c) => c.id !== cpId));
    } catch (err: any) {
      onShowToast?.(`លុបមិនបាន: ${err.message}`, 'error');
    }
  };

  /* ─────────────────────────────────────────────────────────
     ADMIN: Publish new update
  ───────────────────────────────────────────────────────── */
  const handlePublish = async () => {
    if (!pubVersion.trim()) {
      onShowToast?.('⚠️ សូមបំពេញលេខ Version ថ្មី!', 'warning');
      return;
    }
    setIsPublishing(true);
    try {
      const cleanLog = pubChangelog.filter((c) => c.text.trim());
      await api.publishAdminUpdate({
        latest_version: pubVersion.trim(),
        changelog: cleanLog.length > 0 ? cleanLog : [{ type: 'NEW', text: `${pubVersion} Feature Update` }],
        download_url: pubUrl.trim(),
        patch_size_mb: pubSizeMb ? parseFloat(pubSizeMb) : 0,
      });
      onShowToast?.(`📦 បានទម្លាក់ Update ${pubVersion} ជូន Users ទាំងអស់ជោគជ័យ!`, 'success');
      setTargetVersion(pubVersion.trim());
      setHasUpdate(true);
      setPubVersion('');
      setPubUrl('');
      setPubSizeMb('');
      setPubChangelog([{ type: 'NEW', text: '' }]);
      setTab('update');
    } catch (err: any) {
      onShowToast?.(`Publish failed: ${err.message}`, 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const addChangelogRow    = () => setPubChangelog((p) => [...p, { type: 'NEW', text: '' }]);
  const removeChangelogRow = (i: number) => setPubChangelog((p) => p.filter((_, idx) => idx !== i));
  const updateLogRow       = (i: number, field: 'type' | 'text', val: string) =>
    setPubChangelog((p) => p.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99] flex items-center justify-center p-4 select-none"
      style={{ backdropFilter: 'blur(24px)', background: 'rgba(0,0,0,0.82)' }}
    >
      <div className="absolute inset-0" onClick={!isUpdating ? onClose : undefined} />

      {/* Hidden File Input for Offline Patch Zip Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={handleFilePatchUpload}
      />

      {/* ── Modal Card ── */}
      <div
        className="relative w-full max-w-[560px] flex flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(155deg, #0d121c 0%, #090e1a 50%, #060912 100%)',
          borderRadius: '28px',
          border: '1px solid rgba(139,92,246,0.25)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
          maxHeight: '92vh',
        }}
      >
        {/* Ambient Glows */}
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.16) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)' }} />

        {/* ══════════════════════ HERO HEADER ══════════════════════ */}
        <div className="relative px-6 pt-6 pb-4 overflow-hidden"
          style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.12) 0%,rgba(6,182,212,0.08) 100%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-4">
              {/* Animated Icon Badge */}
              <div className="relative shrink-0">
                <div className="w-13 h-13 rounded-2xl flex items-center justify-center"
                  style={{ width:'52px', height:'52px', background:'linear-gradient(135deg,rgba(139,92,246,0.32),rgba(6,182,212,0.22))', border:'1px solid rgba(139,92,246,0.42)', boxShadow:'0 0 24px rgba(139,92,246,0.3)' }}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : tab === 'checkpoints' ? (
                    <History className="w-6 h-6 text-cyan-300" />
                  ) : tab === 'publish' ? (
                    <Upload className="w-6 h-6 text-violet-300" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-violet-300 fill-violet-300/30" />
                  )}
                </div>
                <div className="absolute inset-0 rounded-2xl animate-ping"
                  style={{ border:'1px solid rgba(139,92,246,0.25)', animationDuration:'2.8s' }} />
              </div>

              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-0.5" style={{ color:'rgba(167,139,250,0.9)' }}>
                  🛸 ATITEBDABBER AUTO-UPDATE & CHECKPOINT
                </div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  {tab === 'checkpoints'
                    ? 'Checkpoint & Restore'
                    : tab === 'publish'
                    ? 'Publish Version ថ្មី'
                    : hasUpdate
                    ? 'Version ថ្មីអាចទាញយកបាន!'
                    : 'System Version & Patch'}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5 font-khmer">
                  {tab === 'checkpoints'
                    ? 'សង្គ្រោះ ឬត្រឡប់ទៅកាន់ Version ចាស់ៗបានគ្រប់ពេលវេលា'
                    : tab === 'publish'
                    ? 'ទម្លាក់ Update ជូន Users ទាំងអស់ដោយមិនចាំបាច់ដំឡើង EXE ឡើងវិញ'
                    : `Version បច្ចុប្បន្ន: ${curVersion} • In-App Hot-Patcher`}
                </p>
              </div>
            </div>

            <button onClick={onClose} disabled={isUpdating}
              className="text-slate-500 hover:text-white p-2 rounded-xl transition-all hover:bg-white/5 disabled:opacity-30 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 3 Main Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 p-1 rounded-xl" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', width:'fit-content' }}>
            <button
              onClick={() => setTab('update')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
              style={tab === 'update'
                ? { background:'linear-gradient(135deg,rgba(139,92,246,0.45),rgba(6,182,212,0.3))', color:'#c4b5fd', border:'1px solid rgba(139,92,246,0.4)' }
                : { color:'rgba(148,163,184,0.9)', background:'transparent' }
              }
            >
              <Download className="w-3.5 h-3.5" />
              <span>Update ថ្មី</span>
              {hasUpdate && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => { setTab('checkpoints'); loadCheckpoints(); }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
              style={tab === 'checkpoints'
                ? { background:'linear-gradient(135deg,rgba(6,182,212,0.45),rgba(59,130,246,0.3))', color:'#67e8f9', border:'1px solid rgba(6,182,212,0.4)' }
                : { color:'rgba(148,163,184,0.9)', background:'transparent' }
              }
            >
              <History className="w-3.5 h-3.5" />
              <span>Checkpoint & Restore</span>
              {checkpoints.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 font-mono">
                  {checkpoints.length}
                </span>
              )}
            </button>

            {isAdmin && (
              <button
                onClick={() => setTab('publish')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                style={tab === 'publish'
                  ? { background:'linear-gradient(135deg,rgba(139,92,246,0.4),rgba(236,72,153,0.3))', color:'#f472b6', border:'1px solid rgba(236,72,153,0.4)' }
                  : { color:'rgba(148,163,184,0.9)', background:'transparent' }
                }
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Publish Update</span>
              </button>
            )}
          </div>
        </div>

        {/* ══════════════════════ TAB 1: UPDATE ══════════════════════ */}
        {tab === 'update' && (
          <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 'calc(92vh - 160px)' }}>
            {/* Version Transition Pills */}
            <div className="px-6 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold"
                  style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(148,163,184,1)' }}>
                  <Package className="w-3 h-3 text-slate-500" />
                  {curVersion}
                </div>
                {hasUpdate && (
                  <>
                    <ArrowRight className="w-3.5 h-3.5 text-violet-400/50" />
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black"
                      style={{ background:'linear-gradient(135deg,rgba(139,92,246,0.3),rgba(6,182,212,0.2))', border:'1px solid rgba(139,92,246,0.45)', color:'#c4b5fd', boxShadow:'0 0 14px rgba(139,92,246,0.22)' }}>
                      <Sparkles className="w-3 h-3 fill-violet-300" />
                      {targetVersion}
                      {patchSize > 0 && <span className="text-violet-400/60 font-normal ml-0.5">· {patchSize}MB</span>}
                    </div>
                  </>
                )}
                {!hasUpdate && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                    style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.25)', color:'#6ee7b7' }}>
                    <Shield className="w-2.5 h-2.5" /> បច្ចុប្បន្នបំផុត
                  </div>
                )}
              </div>

              {/* Check remote update button */}
              <button
                onClick={handleCheckRemote}
                disabled={isCheckingRemote || isUpdating}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-semibold text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all"
                title="ពិនិត្យមើល Version ថ្មីពី GitHub / Cloud"
              >
                <RefreshCw className={`w-3 h-3 ${isCheckingRemote ? 'animate-spin text-cyan-400' : ''}`} />
                <span>ពិនិត្យ Version ថ្មី</span>
              </button>
            </div>

            {/* Feature Callout Banner */}
            <div className="mx-6 mt-3 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-cyan-200 font-khmer">
                    Hot In-App Update Engine
                  </div>
                  <div className="text-[11px] text-cyan-300/70 font-khmer">
                    ដំឡើងមុខងារថ្មីៗដោយផ្ទាល់ ដោយមិនបាច់ទាញយក ឬដំឡើង EXE ឡើងវិញឡើយ!
                  </div>
                </div>
              </div>
            </div>

            {/* Up to Date Reassuring Banner */}
            {!hasUpdate && (
              <div className="mx-6 mt-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 font-khmer">
                    <span>កម្មវិធីរបស់អ្នកជា Version ចុងក្រោយបំផុតរួចរាល់ហើយ</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black">
                      {curVersion}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-300/80 mt-0.5 font-khmer">
                    អ្នកកំពុងប្រើប្រាស់មុខងារថ្មីៗបំផុត។ ចុច "ពិនិត្យ Version ថ្មី" ដើម្បី Check គ្រប់ពេល។
                  </div>
                </div>
              </div>
            )}

            {/* Changelog */}
            <div className="px-6 py-4 flex flex-col gap-2.5">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] flex items-center gap-2" style={{ color:'rgba(100,116,139,1)' }}>
                <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.05)' }} />
                <span>✦ WHAT'S NEW & FEATURES</span>
                <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.05)' }} />
              </div>

              <div className="flex flex-col gap-2">
                {logItems.map((item, idx) => {
                  const cfg = BADGE_CFG[item.type] || BADGE_CFG.NEW;
                  return (
                    <div key={idx} className="flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all"
                      style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.05)' }}>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase shrink-0 mt-0.5 ${cfg.cls}`}>
                        {cfg.icon}{item.type}
                      </span>
                      <span className="text-xs text-slate-300 font-medium leading-relaxed font-khmer">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Progress Bar */}
            {isUpdating && (
              <div className="px-6 pb-4">
                <div className="p-4 rounded-2xl flex flex-col gap-3"
                  style={{ background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.2)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-khmer">{updateStepText}</span>
                    <span className="text-xs font-mono font-black tabular-nums" style={{ color:'#a78bfa' }}>{updateProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width:`${updateProgress}%`, background:'linear-gradient(90deg,#7c3aed,#06b6d4)', boxShadow:'0 0 10px rgba(139,92,246,0.5)' }} />
                  </div>
                  <div className="flex items-center justify-between px-1">
                    {STEPS.map((s) => (
                      <div key={s} className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                        style={{ background: updateProgress >= s ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(255,255,255,0.1)', boxShadow: updateProgress >= s ? '0 0 6px rgba(139,92,246,0.6)' : 'none' }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="px-6 py-4 flex items-center gap-3" style={{ borderTop:'1px solid rgba(255,255,255,0.05)' }}>
              {hasUpdate ? (
                <>
                  <button type="button" onClick={onClose} disabled={isUpdating}
                    className="flex-1 py-2.5 px-4 rounded-2xl text-xs font-bold transition-all disabled:opacity-30"
                    style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(148,163,184,1)' }}>
                    ពេលក្រោយ
                  </button>

                  <button type="button" onClick={handleInstallUpdate} disabled={isUpdating || isCompleted}
                    className="flex-[2] py-2.5 px-4 rounded-2xl text-xs font-black tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-60"
                    style={{
                      background: isCompleted
                        ? 'linear-gradient(135deg,#059669,#10b981)'
                        : 'linear-gradient(135deg,#7c3aed 0%,#4f46e5 50%,#0891b2 100%)',
                      boxShadow: isCompleted ? '0 8px 24px rgba(16,185,129,0.3)' : '0 8px 24px rgba(109,40,217,0.35)',
                      color:'#fff',
                    }}>
                    {isUpdating ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>កំពុងដំឡើង {updateProgress}%...</span></>
                    ) : isCompleted ? (
                      <><CheckCircle2 className="w-3.5 h-3.5" /><span>ជោគជ័យ! កំពុង Reload...</span></>
                    ) : (
                      <><CloudDownload className="w-3.5 h-3.5" /><span>Install Update ឥឡូវនេះ</span></>
                    )}
                  </button>
                </>
              ) : (
                <div className="w-full flex items-center gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploadingPatch}
                    className="flex-1 py-2.5 px-3 rounded-2xl text-xs font-semibold transition-all bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10 flex items-center justify-center gap-2">
                    {isUploadingPatch ? <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" /> : <FileArchive className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>ដំឡើងពី File Zip ដោយផ្ទាល់</span>
                  </button>

                  <button type="button" onClick={onClose}
                    className="flex-1 py-2.5 px-4 rounded-2xl text-xs font-bold transition-all bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-2">
                    <Check className="w-3.5 h-3.5" />
                    <span>យល់ព្រម (បិទ)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════ TAB 2: CHECKPOINTS & RESTORE ══════════════════════ */}
        {tab === 'checkpoints' && (
          <div className="flex flex-col overflow-y-auto px-6 py-4 gap-4" style={{ maxHeight: 'calc(92vh - 160px)' }}>
            {/* Checkpoint Header & Quick Create */}
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5 font-khmer">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>Checkpoint & Safety Snapshots</span>
                </div>
                <div className="text-[11px] text-indigo-300/80 mt-0.5 font-khmer">
                  រាល់ពេល Update ប្រព័ន្ធនឹង Auto-Backup ចំណុចសុវត្ថិភាពទុកជាមុនជានិច្ច។
                </div>
              </div>

              <button
                onClick={() => setShowNewCpInput((prev) => !prev)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Checkpoint ថ្មី</span>
              </button>
            </div>

            {/* Expandable New Checkpoint Input */}
            {showNewCpInput && (
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-cyan-500/30 flex flex-col gap-2 animate-fadeIn">
                <label className="text-[11px] font-bold text-cyan-300 font-khmer">
                  ដាក់ឈ្មោះចំណាំសម្រាប់ Checkpoint ថ្មី៖
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={newCpName}
                    onChange={(e) => setNewCpName(e.target.value)}
                    placeholder={`ឧ. Checkpoint ${curVersion} មុនកែសំឡេង`}
                    className="flex-1 px-3 py-2 rounded-xl text-xs text-white bg-white/5 border border-white/10 outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleCreateCheckpoint}
                    disabled={isCreatingCp}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-900 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isCreatingCp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SaveIcon className="w-3.5 h-3.5" />}
                    <span>រក្សាទុក</span>
                  </button>
                </div>
              </div>
            )}

            {/* Checkpoints List */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 font-khmer">
                <span>បញ្ជី Checkpoints ដែលបានរក្សាទុក ({checkpoints.length})</span>
                <button
                  onClick={loadCheckpoints}
                  disabled={isLoadingCheckpoints}
                  className="hover:text-white flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingCheckpoints ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>Reload</span>
                </button>
              </div>

              {isLoadingCheckpoints ? (
                <div className="py-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>កំពុងទាញយកបញ្ជី Checkpoints...</span>
                </div>
              ) : checkpoints.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center flex flex-col items-center gap-2">
                  <HardDrive className="w-8 h-8 text-slate-600" />
                  <span className="text-xs text-slate-400 font-khmer">មិនទាន់មាន Checkpoint នៅឡើយទេ</span>
                  <button
                    onClick={handleCreateCheckpoint}
                    className="text-xs text-cyan-400 font-bold hover:underline"
                  >
                    ចុចទីនេះដើម្បីបង្កើត Checkpoint ដំបូង
                  </button>
                </div>
              ) : (
                checkpoints.map((cp) => {
                  const isPreUpdate = cp.type === 'pre_update';
                  const isCurrent = cp.version === curVersion;
                  const isRestoringThis = restoringCpId === cp.id;

                  return (
                    <div
                      key={cp.id}
                      className="p-3.5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 transition-all flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isPreUpdate ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}>
                            {isPreUpdate ? <Clock className="w-4 h-4" /> : <FolderArchive className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white font-khmer flex items-center gap-2">
                              <span>{cp.name}</span>
                              <span className="text-[10px] font-mono font-black px-2 py-0.2 rounded-full bg-violet-500/20 text-violet-300">
                                {cp.version}
                              </span>
                              {isPreUpdate && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 uppercase">
                                  Auto Pre-Update
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                              <span>{cp.formatted_date || cp.created_at}</span>
                              <span>•</span>
                              <span>{cp.size_mb} MB</span>
                              <span>•</span>
                              <span>{cp.files_count} ឯកសារ</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleRestoreCheckpoint(cp)}
                            disabled={isRestoringThis}
                            className="px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-sm flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                            title="ស្តារកម្មវិធីត្រឡប់ទៅ Version នៃ Checkpoint នេះ"
                          >
                            {isRestoringThis ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                            <span>Restore</span>
                          </button>

                          <button
                            onClick={() => handleDeleteCheckpoint(cp.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                            title="លុប Checkpoint នេះ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════ TAB 3: PUBLISH (Admin) ══════════════════════ */}
        {tab === 'publish' && isAdmin && (
          <div className="px-6 py-4 flex flex-col gap-3.5 overflow-y-auto" style={{ maxHeight: 'calc(92vh - 160px)' }}>
            {/* Warning Banner */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl"
              style={{ background:'rgba(251,191,36,0.07)', border:'1px solid rgba(251,191,36,0.2)' }}>
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300/80 font-khmer leading-relaxed">
                បំពេញព័ត៌មាន Version ថ្មី រួចចុច Publish។ App EXE ទាំងអស់នៅលើកុំព្យូទ័រ Users នឹងទទួលបាន Notification និងអាច Update បានភ្លាមៗ!
              </p>
            </div>

            {/* Version */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">New Version *</label>
              <input value={pubVersion} onChange={(e) => setPubVersion(e.target.value)}
                placeholder="ឧ. V2.2PRO ឬ V3.0" maxLength={20}
                className="w-full px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-white placeholder:text-slate-600 outline-none bg-white/5 border border-violet-500/30" />
            </div>

            {/* Download URL */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Link className="w-3 h-3" /> Download URL (GitHub Release patch ZIP)
              </label>
              <input value={pubUrl} onChange={(e) => setPubUrl(e.target.value)}
                placeholder="https://github.com/.../update_patch_V2.2PRO.zip"
                className="w-full px-3.5 py-2 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none bg-white/5 border border-white/10" />
            </div>

            {/* Size */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Patch Size (MB)</label>
              <input value={pubSizeMb} onChange={(e) => setPubSizeMb(e.target.value)}
                placeholder="e.g. 19.5" type="number" min="0" step="0.1"
                className="w-full px-3.5 py-2 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none bg-white/5 border border-white/10" />
            </div>

            {/* Changelog Builder */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Changelog</label>
                <button onClick={addChangelogRow}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {pubChangelog.map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select value={row.type} onChange={(e) => updateLogRow(i, 'type', e.target.value)}
                      className="px-2 py-1.5 rounded-lg text-[10px] font-black uppercase outline-none shrink-0 bg-white/5 border border-white/10 text-cyan-300">
                      <option value="NEW">NEW</option>
                      <option value="IMPROVED">IMPROVED</option>
                      <option value="FIXED">FIXED</option>
                    </select>
                    <input value={row.text} onChange={(e) => updateLogRow(i, 'text', e.target.value)}
                      placeholder="ការពណ៌នាពីមុខងារថ្មី..."
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs text-white placeholder:text-slate-600 outline-none bg-white/5 border border-white/10" />
                    {pubChangelog.length > 1 && (
                      <button onClick={() => removeChangelogRow(i)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Publish Button */}
            <button onClick={handlePublish} disabled={isPublishing || !pubVersion.trim()}
              className="w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-40 mt-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-600/30">
              {isPublishing
                ? <><Loader2 className="w-4 h-4 animate-spin" /><span>កំពុង Publish...</span></>
                : <><Upload className="w-4 h-4" /><span>ទម្លាក់ Version ថ្មី → App Users ទាំងអស់</span></>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* helper */
function tick(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
