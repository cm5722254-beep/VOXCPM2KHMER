import React, { useState, useEffect } from 'react';
import { VideoPreview } from '../player/VideoPreview';
import { ContextualInspector } from '../inspector/ContextualInspector';
import { MultiTrackTimeline } from '../timeline/MultiTrackTimeline';
import { VideoEffectsPanel } from '../effects/VideoEffectsPanel';
import { CharacterCastDrawer } from './CharacterCastDrawer';
import { EngineOptionSelector } from '../ui/EngineOptionSelector';
import { KhmerOfflineBatchPanel } from '../offline/KhmerOfflineBatchPanel';
import {
  ProjectFile,
  TimelineSegment,
  VideoEffects,
  SubtitleStyle,
  CharacterVoice,
  User,
  StudioEngineOption,
  CommercialOverlayConfig,
  KhmerOfflineConfig,
  ProjectGroup,
} from '../../types';
import { api } from '../../services/api';
import {
  Scissors,
  Tv,
  Volume2,
  Sparkles,
  Layers,
  BookOpen,
  Sliders,
  ChevronDown,
  ChevronUp,
  Flame,
  Palette,
  FolderKanban,
} from 'lucide-react';

interface DubbingStudioProps {
  uploadedFile: ProjectFile | null;
  isUploadingFile?: boolean;
  uploadProgress?: number;
  uploadInfo?: { loadedMb: string; totalMb: string } | null;
  onUploadFile: (file: File) => void;
  onRemoveFile: () => void;
  voiceMode: string;
  onVoiceModeChange: (m: string) => void;
  maleLeadVoice?: string;
  onMaleLeadChange?: (v: string) => void;
  femaleLeadVoice?: string;
  onFemaleLeadChange?: (v: string) => void;
  dubbingScope?: string;
  onDubbingScopeChange?: (scope: string) => void;
  geminiModel: string;
  onGeminiModelChange: (m: string) => void;
  isDubbing: boolean;
  dubbingProgress: number;
  dubbingMessage: string;
  dubbingOutputVideo: string | null;
  dubbingOutputAudio: string | null;
  onStartDubbing: () => void;
  onPreviewVoice: (filename: string) => void;
  segments: TimelineSegment[];
  onChangeSegments?: (segments: TimelineSegment[]) => void;
  selectedSegmentIndex: number;
  onSelectSegment: (index: number) => void;
  onScanTimeline: () => void;
  isScanningTimeline?: boolean;
  onAssemble: () => void;
  videoEffects: VideoEffects;
  onChangeEffects: (effects: VideoEffects) => void;
  subtitleStyle: SubtitleStyle;
  onChangeSubtitleStyle: (style: SubtitleStyle) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  onOpenThumbnailStudio: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  characters?: CharacterVoice[];
  onOpenTab?: (tabId: any) => void;
  onOpenExport?: () => void;
  engineMode?: string;
  onSwitchEngine?: (mode: string) => void;
  voxStatus?: any;
  onOpenVoxModal?: () => void;
  user?: User | null;
  onOpenLicenseModal?: () => void;
  // ── New 2026 Upgrades ──
  studioEngine?: StudioEngineOption;
  onSelectStudioEngine?: (engine: StudioEngineOption) => void;
  commercialOverlay?: CommercialOverlayConfig;
  onOpenCommercialOverlay?: () => void;
  onOpenVideoTrimmer?: () => void;
  voiceVolumeGain?: number;
  onChangeVoiceVolumeGain?: (gain: number) => void;
  khmerOfflineConfig?: KhmerOfflineConfig;
  onChangeKhmerOfflineConfig?: (cfg: KhmerOfflineConfig) => void;
  onStartOfflineDubbing?: () => void;
  onOpenGuide?: () => void;
  onOpenCustomizer?: () => void;
  projectGroups?: ProjectGroup[];
  activeGroupId?: string | null;
  onSelectGroup?: (groupId: string) => void;
  onOpenGroupManager?: () => void;
}

export const DubbingStudio: React.FC<DubbingStudioProps> = ({
  uploadedFile,
  isUploadingFile = false,
  uploadProgress = 0,
  uploadInfo,
  onUploadFile,
  onRemoveFile,
  voiceMode,
  onVoiceModeChange,
  dubbingScope = '120',
  onDubbingScopeChange,
  geminiModel,
  onGeminiModelChange,
  isDubbing,
  dubbingProgress,
  dubbingMessage,
  dubbingOutputVideo,
  dubbingOutputAudio,
  onStartDubbing,
  onPreviewVoice,
  segments,
  onChangeSegments,
  selectedSegmentIndex,
  onSelectSegment,
  onScanTimeline,
  isScanningTimeline = false,
  onAssemble,
  videoEffects,
  onChangeEffects,
  subtitleStyle,
  onChangeSubtitleStyle,
  videoRef,
  onOpenThumbnailStudio,
  onShowToast,
  characters = [],
  onOpenTab,
  onOpenExport,
  engineMode = 'local',
  onSwitchEngine,
  voxStatus,
  onOpenVoxModal,
  user,
  onOpenLicenseModal,
  // ── Upgrades ──
  studioEngine = 'khmer_offline',
  onSelectStudioEngine,
  commercialOverlay,
  onOpenCommercialOverlay,
  onOpenVideoTrimmer,
  voiceVolumeGain = 100,
  onChangeVoiceVolumeGain,
  khmerOfflineConfig,
  onChangeKhmerOfflineConfig,
  onStartOfflineDubbing,
  onOpenGuide,
  onOpenCustomizer,
  projectGroups = [],
  activeGroupId,
  onSelectGroup,
  onOpenGroupManager,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [zoom, setZoom] = useState(100);
  const [showEffectsDrawer, setShowEffectsDrawer] = useState(false);
  const [showCharacterCastDrawer, setShowCharacterCastDrawer] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [videoSourceMode, setVideoSourceMode] = useState<'original' | 'dubbed'>('original');
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);
  const [showOfflineBatchExpand, setShowOfflineBatchExpand] = useState(true);

  // Global hotkeys for studio workstation speed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;

      if (e.code === 'KeyI' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsInspectorCollapsed((prev) => !prev);
      } else if (e.code === 'KeyM' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-switch to dubbed video when a new dubbing output is generated
  useEffect(() => {
    if (dubbingOutputVideo) {
      setVideoSourceMode('dubbed');
    } else {
      setVideoSourceMode('original');
    }
  }, [dubbingOutputVideo]);

  // When a new file is uploaded or selected, show the original uploaded video
  useEffect(() => {
    setVideoSourceMode('original');
  }, [uploadedFile?.filename]);

  // Active video source
  const activeVideoSrc =
    videoSourceMode === 'dubbed' && dubbingOutputVideo
      ? dubbingOutputVideo
      : (uploadedFile?.url || '');

  // Active subtitle
  const activeSegment = segments.find(
    (s) => currentTime >= s.start_time && currentTime <= s.end_time
  );
  const currentSubtitle = activeSegment?.khmer_translation || activeSegment?.chinese_text;

  // Single line AI voice generator
  const handleGenerateLineAudio = async (idx: number) => {
    const seg = segments[idx];
    if (!seg) return;

    onShowToast(`Generating AI voice for line #${idx + 1}...`, 'info');
    try {
      const r = await api.generateLine({
        text: seg.khmer_translation || seg.chinese_text || 'បាទ',
        lineIndex: idx,
        gender: seg.gender || 'male',
        voiceId: seg.voiceId || 'voxcpm-voice-actor',
        speakerId: seg.speaker_role,
        emotion: seg.emotion || 'calm',
        speed: seg.speed || 1.0,
        pitch: seg.pitch || 0,
      });

      if (r.success) {
        if (onChangeSegments) {
          const copy = [...segments];
          copy[idx] = { ...copy[idx], audioUrl: r.audioUrl, status: 'ready' };
          onChangeSegments(copy);
        }
        onShowToast(`Voice for line #${idx + 1} ready!`, 'success');
        new Audio(r.audioUrl).play().catch(() => {});
      }
    } catch (e: any) {
      onShowToast(`Error generating line voice: ${e.message}`, 'error');
    }
  };

  // Change voice across character segments
  const handleChangeVoiceForCharacter = (charKey: string, newVoiceId: string) => {
    if (!onChangeSegments) return;
    const clean = newVoiceId.replace('voxcpm:', '');
    const matched = characters.find((c) => c.id === newVoiceId || c.filename === clean);
    const updated = segments.map((s) => {
      const k = s.speaker_name || s.speaker_id || 'តួអង្គ';
      if (k === charKey || s.speaker_id === charKey || s.speaker_name === charKey) {
        return {
          ...s,
          voiceId: newVoiceId,
          voiceFilename: clean,
          voiceLabel: matched ? matched.label : clean,
          gender: matched ? matched.gender : s.gender,
        };
      }
      return s;
    });
    onChangeSegments(updated);
    onShowToast(`Voice updated for "${charKey}"!`, 'success');
  };

  // Find currently active Project Group
  const activeGroup = projectGroups.find((g) => g.id === activeGroupId) || projectGroups[0];

  const getVoiceDisplayName = (voiceId?: string) => {
    if (!voiceId) return 'មិនទាន់កំណត់';
    if (voiceId === 'km-KH-PisethNeural') return 'Piseth (ស្តង់ដារ)';
    if (voiceId === 'km-KH-SreymomNeural') return 'Sreymom (ស្តង់ដារ)';
    if (voiceId === 'khmer_male_lead') return 'តួប្រុសឯក';
    if (voiceId === 'khmer_female_lead') return 'តួស្រីឯក';
    if (voiceId === 'khmer_narrator') return 'អ្នកនិទានរឿង';
    if (voiceId === 'khmer_comedy') return 'តួកំប្លែង';
    if (voiceId === 'khmer_villain') return 'តួកាច';
    if (voiceId === 'khmer_elder') return 'ព្រឹទ្ធាចារ្យ';
    if (voiceId === 'khmer_child') return 'កុមារ';
    const clean = voiceId.replace('voxcpm:', '');
    const matched = characters.find((c) => c.id === voiceId || c.filename === clean);
    return matched ? matched.label : clean;
  };

  // 1-Click apply group voices across all segments in current video
  const handleApplyGroupVoices = () => {
    if (!onChangeSegments) return;
    if (segments.length === 0) {
      onShowToast('មិនទាន់មានបន្ទាត់សន្ទនាក្នុង Timeline ឡើយ!', 'warning');
      return;
    }
    if (!activeGroup) {
      onShowToast('សូមជ្រើសរើស Group រឿងជាមុនសិន!', 'warning');
      return;
    }

    const gMale = activeGroup.maleLeadVoice || 'km-KH-PisethNeural';
    const gFemale = activeGroup.femaleLeadVoice || 'km-KH-SreymomNeural';
    const gNarrator = activeGroup.narratorVoice || 'khmer_narrator';
    const gSupporting = activeGroup.supportingVoice || 'khmer_comedy';

    const getVoiceMeta = (vId: string) => {
      const clean = vId.replace('voxcpm:', '');
      const match = characters.find((c) => c.id === vId || c.filename === clean);
      return {
        voiceId: vId,
        voiceFilename: match ? match.filename : clean,
        voiceLabel: match ? match.label : getVoiceDisplayName(vId),
      };
    };

    const maleMeta = getVoiceMeta(gMale);
    const femaleMeta = getVoiceMeta(gFemale);
    const narratorMeta = getVoiceMeta(gNarrator);
    const supportingMeta = getVoiceMeta(gSupporting);

    const updated = segments.map((s) => {
      const name = (s.speaker_name || s.speaker_id || '').toLowerCase();
      const role = (s.speaker_role || '').toLowerCase();

      let chosenMeta = maleMeta;
      let gender: 'male' | 'female' = 'male';

      if (name.includes('និទាន') || role.includes('narrator') || role.includes('storyteller')) {
        chosenMeta = narratorMeta;
        gender = 'male';
      } else if (
        s.gender === 'female' ||
        role.includes('female') ||
        name.includes('ស្រី') ||
        name.includes('female')
      ) {
        chosenMeta = femaleMeta;
        gender = 'female';
      } else if (
        role.includes('elder') ||
        role.includes('comedy') ||
        name.includes('ចាស់') ||
        name.includes('ព្រឹទ្ធាចារ្យ') ||
        name.includes('កំប្លែង')
      ) {
        chosenMeta = supportingMeta;
        gender = 'male';
      } else {
        chosenMeta = maleMeta;
        gender = 'male';
      }

      return {
        ...s,
        gender,
        voiceId: chosenMeta.voiceId,
        voiceFilename: chosenMeta.voiceFilename,
        voiceLabel: chosenMeta.voiceLabel,
      };
    });

    onChangeSegments(updated);
    onShowToast(`🎉 បានកំណត់សំឡេងតាម Group "${activeGroup.name}" លើគ្រប់តួអង្គជោគជ័យ! មិនច្រឡំរឿងផ្សេងឡើយ`, 'success');
  };

  // Auto cast unique voices (Group-aware)
  const handleAutoCastUniqueVoices = () => {
    if (!onChangeSegments) return;
    const uniqueKeys = Array.from(new Set(segments.map((s) => s.speaker_name || s.speaker_id || 'តួអង្គ')));
    const malePool = characters.filter((c) => c.gender === 'male');
    const femalePool = characters.filter((c) => c.gender === 'female');
    const used = new Set<string>();

    const mapping: Record<string, { voiceId: string; filename: string; label: string; gender: 'male' | 'female' }> = {};

    uniqueKeys.forEach((k) => {
      const seg = segments.find((s) => (s.speaker_name || s.speaker_id || 'តួអង្គ') === k);
      const isFem =
        seg?.gender === 'female' ||
        seg?.speaker_role?.includes('female') ||
        k.includes('ស្រី') ||
        k.toLowerCase().includes('female');
      const isNarrator = k.includes('និទាន') || seg?.speaker_role?.includes('narrator');
      const gen: 'male' | 'female' = isFem ? 'female' : 'male';

      // If activeGroup has assigned voices, use them primarily for lead characters!
      if (activeGroup) {
        if (isNarrator && activeGroup.narratorVoice && !used.has(activeGroup.narratorVoice)) {
          used.add(activeGroup.narratorVoice);
          const clean = activeGroup.narratorVoice.replace('voxcpm:', '');
          const m = characters.find((c) => c.id === activeGroup.narratorVoice || c.filename === clean);
          mapping[k] = {
            voiceId: activeGroup.narratorVoice,
            filename: m ? m.filename : clean,
            label: m ? m.label : getVoiceDisplayName(activeGroup.narratorVoice),
            gender: 'male',
          };
          return;
        }

        if (isFem && activeGroup.femaleLeadVoice && !used.has(activeGroup.femaleLeadVoice)) {
          used.add(activeGroup.femaleLeadVoice);
          const clean = activeGroup.femaleLeadVoice.replace('voxcpm:', '');
          const m = characters.find((c) => c.id === activeGroup.femaleLeadVoice || c.filename === clean);
          mapping[k] = {
            voiceId: activeGroup.femaleLeadVoice,
            filename: m ? m.filename : clean,
            label: m ? m.label : getVoiceDisplayName(activeGroup.femaleLeadVoice),
            gender: 'female',
          };
          return;
        }

        if (!isFem && !isNarrator && activeGroup.maleLeadVoice && !used.has(activeGroup.maleLeadVoice)) {
          used.add(activeGroup.maleLeadVoice);
          const clean = activeGroup.maleLeadVoice.replace('voxcpm:', '');
          const m = characters.find((c) => c.id === activeGroup.maleLeadVoice || c.filename === clean);
          mapping[k] = {
            voiceId: activeGroup.maleLeadVoice,
            filename: m ? m.filename : clean,
            label: m ? m.label : getVoiceDisplayName(activeGroup.maleLeadVoice),
            gender: 'male',
          };
          return;
        }
      }

      const pool = isFem ? femalePool : malePool;
      let chosen = pool.find((c) => !used.has(c.filename));
      if (!chosen && pool.length > 0) {
        chosen = pool[used.size % pool.length];
      }

      if (chosen) {
        used.add(chosen.filename);
        mapping[k] = {
          voiceId: chosen.id || `voxcpm:${chosen.filename}`,
          filename: chosen.filename,
          label: chosen.label,
          gender: gen,
        };
      }
    });

    const updated = segments.map((s) => {
      const k = s.speaker_name || s.speaker_id || 'តួអង្គ';
      const m = mapping[k];
      if (m) {
        return {
          ...s,
          gender: m.gender,
          voiceId: m.voiceId,
          voiceFilename: m.filename,
          voiceLabel: m.label,
        };
      }
      return s;
    });

    onChangeSegments(updated);
    onShowToast(
      activeGroup
        ? `🎉 Auto-Cast ជោគជ័យតាម Group "${activeGroup.name}" មិនច្រឡំរឿងផ្សេងឡើយ!`
        : `Auto-cast complete: 1 unique voice per character!`,
      'success'
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-transparent select-none font-khmer">
      {/* ── Studio Top Toolbar: 3 Options & Quick Feature Actions ── */}
      <div className="p-2 px-3 bg-[#080b13]/85 backdrop-blur-xl border-b border-white/[0.08] flex flex-col gap-2 z-30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* 3 Engine Option Selector */}
          <div className="flex-1 max-w-2xl">
            <EngineOptionSelector
              activeEngine={studioEngine}
              onSelectEngine={(eng) => onSelectStudioEngine && onSelectStudioEngine(eng)}
              user={user}
              onOpenLicenseModal={onOpenLicenseModal}
              onShowToast={onShowToast}
              compact
            />
          </div>

          {/* Quick Studio Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* CapCut Style Trimmer */}
            <button
              type="button"
              onClick={onOpenVideoTrimmer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-300 text-xs font-bold transition-all active:scale-95 shadow-sm"
              title="កាត់តវីដេអូវែងៗដូច CapCut"
            >
              <Scissors className="w-3.5 h-3.5 text-pink-400" />
              <span>កាត់តវីដេអូ</span>
            </button>

            {/* Commercial Ads Overlay */}
            <button
              type="button"
              onClick={onOpenCommercialOverlay}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-sm ${
                commercialOverlay?.enabled
                  ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300'
              }`}
              title="ដាក់វីដេអូ Overlay ពាណិជ្ជកម្ម Sponsor"
            >
              <Tv className="w-3.5 h-3.5 text-amber-400" />
              <span>Ads Overlay</span>
              {commercialOverlay?.enabled && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            {/* Transcription / Character Cast */}
            <button
              type="button"
              onClick={() => setShowCharacterCastDrawer(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all active:scale-95 shadow-sm"
              title="Transcription រើសតួអង្គតាមឃ្លា"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>រើសតួអង្គតាមឃ្លា</span>
            </button>

            {/* Voice Volume Gain Slider HUD */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-[10px] text-slate-400">សំឡេង:</span>
              <input
                type="range"
                min={0}
                max={200}
                step={5}
                value={voiceVolumeGain}
                onChange={(e) =>
                  onChangeVoiceVolumeGain &&
                  onChangeVoiceVolumeGain(parseInt(e.target.value, 10))
                }
                className="w-16 h-1 accent-cyan-400 bg-slate-800 rounded cursor-pointer"
                title={`កម្រិតសំឡេងនិយាយ: ${voiceVolumeGain}%`}
              />
              <span className="text-[10px] font-mono font-bold text-cyan-300 w-8 text-right">
                {voiceVolumeGain}%
              </span>
            </div>

            {/* Effects & 3D Title Drawer */}
            <button
              type="button"
              onClick={() => setShowEffectsDrawer(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>3D Effects</span>
            </button>

            {/* Telegram Admin Contact Button */}
            <a
              href="https://t.me/BongCheatz_IT"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500/25 via-blue-600/20 to-indigo-600/25 hover:from-sky-500/35 hover:to-blue-600/35 border border-sky-400/40 text-sky-200 text-xs font-black transition-all active:scale-95 shadow-sm"
              title="ទាក់ទង ADMIN តាម Telegram: https://t.me/BongCheatz_IT"
            >
              <span>✈️</span>
              <span>ទាក់ទង ADMIN</span>
            </a>

            {/* User Guide Button */}
            {onOpenGuide && (
              <button
                type="button"
                onClick={onOpenGuide}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 text-xs font-semibold transition-all"
                title="មគ្គុទ្ទេសក៍របៀបប្រើប្រាស់"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">របៀបប្រើប្រាស់</span>
              </button>
            )}
          </div>
        </div>

        {/* Option 3 Khmer Offline Quick Status Pill */}
        {studioEngine === 'khmer_offline' && (
          <div className="pt-1 flex flex-wrap items-center justify-between gap-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-slate-900/60 border border-emerald-500/30 text-xs shadow-inner">
            <div className="flex items-center gap-2 text-emerald-300">
              <Flame className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
              <span className="font-bold">KHMER OFFLINE STUDIO (១ ដល់ ២០ ភាគ / រឿងពេញ)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                {khmerOfflineConfig?.episodes?.length || 0} ភាគក្នុងបញ្ជី ({khmerOfflineConfig?.mode === 'full_movie' ? 'ភ្ជាប់ជារឿងពេញ' : 'ភាគដាច់ដោយឡែក'})
              </span>
            </div>

            <button
              type="button"
              onClick={() => onOpenTab && onOpenTab('tab-offline')}
              className="flex items-center gap-1.5 px-3.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
            >
              <span>🚀 បើកផ្ទាំង Batch 1-20 ភាគពេញលេញ (Full Page)</span>
              <span>➔</span>
            </button>
          </div>
        )}

        {/* Project / Series Group & Assigned Voices Bar */}
        {activeGroup && (
          <div className="pt-1 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#070d18] via-[#091322] to-[#070d18] border border-cyan-500/20 text-xs shadow-inner">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onOpenGroupManager}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-white transition-all shadow-sm"
                title="ចុចដើម្បីគ្រប់គ្រង Group ឬប្តូរស៊េរីរឿង"
              >
                <FolderKanban className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] text-slate-300">Group រឿង:</span>
                <span className="text-[11px] font-bold text-cyan-300">{activeGroup.name}</span>
              </button>

              {/* Quick Assigned Voice Badges for this Story Group */}
              <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20" title="សំឡេងតួប្រុសប្រចាំរឿងនេះ">
                  🎙️ ប្រុស: {getVoiceDisplayName(activeGroup.maleLeadVoice || 'km-KH-PisethNeural')}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20" title="សំឡេងតួស្រីប្រចាំរឿងនេះ">
                  🌸 ស្រី: {getVoiceDisplayName(activeGroup.femaleLeadVoice || 'km-KH-SreymomNeural')}
                </span>
                {activeGroup.narratorVoice && (
                  <span className="hidden md:inline px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20" title="សំឡេងអ្នកនិទានប្រចាំរឿងនេះ">
                    📜 និទាន: {getVoiceDisplayName(activeGroup.narratorVoice)}
                  </span>
                )}
                {activeGroup.supportingVoice && (
                  <span className="hidden lg:inline px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20" title="សំឡេងតួបន្ទាប់បន្សំប្រចាំរឿងនេះ">
                    😄 បន្ទាប់បន្សំ: {getVoiceDisplayName(activeGroup.supportingVoice)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApplyGroupVoices}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/25 transition-all active:scale-95"
                title="អនុវត្តសំឡេងដែលបានកំណត់ក្នុង Group នេះទៅលើតួអង្គទាំងអស់ក្នុងវីដេអូ មិនច្រឡំរឿងផ្សេងឡើយ"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ អនុវត្តសំឡេងតាម Group ({activeGroup.name})</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Workstation: Center Video Workspace + Right Contextual Inspector ── */}
      <div className="flex flex-1 min-w-0 min-h-0 overflow-hidden">
        {/* Center: Video Workspace (16:9 Cinematic Visual Center) */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden bg-black/20 backdrop-blur-md">
          <VideoPreview
            videoRef={videoRef}
            videoSrc={activeVideoSrc}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onTimeUpdate={setCurrentTime}
            onDurationChange={setDuration}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            playbackRate={playbackRate}
            onPlaybackRateChange={setPlaybackRate}
            isMuted={isMuted}
            onMuteToggle={() => setIsMuted(!isMuted)}
            showSubtitles={showSubtitles}
            onToggleSubtitles={() => setShowSubtitles(!showSubtitles)}
            currentSubtitle={currentSubtitle}
            subtitleStyle={subtitleStyle}
            videoEffects={videoEffects}
            uploadedFile={uploadedFile}
            isUploadingFile={isUploadingFile}
            uploadProgress={uploadProgress}
            uploadInfo={uploadInfo}
            onUploadFile={onUploadFile}
            onRemoveFile={onRemoveFile}
            videoSourceMode={videoSourceMode}
            onVideoSourceModeChange={setVideoSourceMode}
            dubbingOutputVideo={dubbingOutputVideo}
            commercialOverlay={commercialOverlay}
          />
        </div>

        {/* Right: Contextual Inspector */}
        <ContextualInspector
          uploadedFile={uploadedFile}
          isUploadingFile={isUploadingFile}
          uploadProgress={uploadProgress}
          uploadInfo={uploadInfo}
          onUploadFile={onUploadFile}
          onRemoveFile={onRemoveFile}
          voiceMode={voiceMode}
          onVoiceModeChange={onVoiceModeChange}
          dubbingScope={dubbingScope}
          onDubbingScopeChange={onDubbingScopeChange}
          geminiModel={geminiModel}
          onGeminiModelChange={onGeminiModelChange}
          isDubbing={isDubbing}
          dubbingProgress={dubbingProgress}
          dubbingMessage={dubbingMessage}
          dubbingOutputVideo={dubbingOutputVideo}
          dubbingOutputAudio={dubbingOutputAudio}
          onStartDubbing={onStartDubbing}
          onPreviewVoice={onPreviewVoice}
          segments={segments}
          onChangeSegments={onChangeSegments}
          selectedSegmentIndex={selectedSegmentIndex}
          onSelectSegment={onSelectSegment}
          characters={characters}
          onOpenCharacterCast={() => setShowCharacterCastDrawer(true)}
          videoEffects={videoEffects}
          onChangeEffects={onChangeEffects}
          subtitleStyle={subtitleStyle}
          onChangeSubtitleStyle={onChangeSubtitleStyle}
          onGenerateLineAudio={handleGenerateLineAudio}
          onShowToast={onShowToast}
          engineMode={engineMode}
          onSwitchEngine={onSwitchEngine}
          voxStatus={voxStatus}
          onOpenVoxModal={onOpenVoxModal}
          user={user}
          onOpenLicenseModal={onOpenLicenseModal}
          isCollapsed={isInspectorCollapsed}
          onToggleCollapse={() => setIsInspectorCollapsed(!isInspectorCollapsed)}
        />
      </div>

      {/* ── Bottom: Professional Multi-Track Timeline ── */}
      <div className="h-60 bg-[#080a10]/80 backdrop-blur-xl border-t border-white/[0.08] flex flex-col overflow-hidden flex-shrink-0 z-20">
        <MultiTrackTimeline
          duration={duration}
          currentTime={currentTime}
          segments={segments}
          onChangeSegments={onChangeSegments}
          selectedSegmentIndex={selectedSegmentIndex}
          onSelectSegment={onSelectSegment}
          onSeek={(t) => {
            setCurrentTime(t);
            if (videoRef.current) {
              videoRef.current.currentTime = t;
            }
          }}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onScan={onScanTimeline}
          isScanning={isScanningTimeline}
          onAssemble={onAssemble}
          zoom={zoom}
          onZoomChange={setZoom}
          onShowToast={onShowToast}
        />
      </div>

      {/* ── Character Voice Casting Drawer ── */}
      <CharacterCastDrawer
        isOpen={showCharacterCastDrawer}
        onClose={() => setShowCharacterCastDrawer(false)}
        segments={segments}
        characters={characters}
        onChangeVoiceForCharacter={handleChangeVoiceForCharacter}
        onAutoCastUniqueVoices={handleAutoCastUniqueVoices}
        onPreviewVoice={onPreviewVoice}
        onShowToast={onShowToast}
        engineMode={engineMode}
        onSwitchEngine={onSwitchEngine}
        voxStatus={voxStatus}
        onOpenVoxModal={onOpenVoxModal}
        onGenerateCustomVideo={onAssemble}
        user={user}
        onOpenLicenseModal={onOpenLicenseModal}
        activeGroup={activeGroup}
        onApplyGroupVoices={handleApplyGroupVoices}
      />

      {/* ── Video Effects Panel Drawer ── */}
      {showEffectsDrawer && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={() => setShowEffectsDrawer(false)}
        >
          <div
            className="bg-[#0b0f19] border border-cyan-500/30 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden relative shadow-[0_0_50px_rgba(6,182,212,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <VideoEffectsPanel
              effects={videoEffects}
              onChangeEffects={onChangeEffects}
              subtitleStyle={subtitleStyle}
              onChangeSubtitleStyle={onChangeSubtitleStyle}
              onShowToast={onShowToast}
              onClose={() => setShowEffectsDrawer(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
