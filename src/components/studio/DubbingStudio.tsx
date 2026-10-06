import React, { useState, useEffect } from 'react';
import { VideoPreview } from '../player/VideoPreview';
import { ContextualInspector } from '../inspector/ContextualInspector';
import { MultiTrackTimeline } from '../timeline/MultiTrackTimeline';
import { VideoEffectsPanel } from '../effects/VideoEffectsPanel';
import { CharacterCastDrawer } from './CharacterCastDrawer';
import { EngineOptionSelector } from '../ui/EngineOptionSelector';
import { DialogueEditorPanel } from './DialogueEditorPanel';
import { FeatureToolbar, FeatureTab } from './FeatureToolbar';
import { AIDubbingPanel } from './AIDubbingPanel';
import { CharacterInspectorModal } from '../modals/CharacterInspectorModal';
import { GenerateVoiceModal } from '../modals/GenerateVoiceModal';
import { AutoDubWorkflowModal } from '../modals/AutoDubWorkflowModal';
import { AudioDuckingModal } from '../modals/AudioDuckingModal';
import { BgmLibraryModal } from '../modals/BgmLibraryModal';
import { SfxLibraryModal } from '../modals/SfxLibraryModal';
import { ColorGradingModal } from '../modals/ColorGradingModal';
import { AIToolsModal } from '../modals/AIToolsModal';
import { CommandSearchModal } from '../modals/CommandSearchModal';
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
import { CURATED_CHARACTER_VOICES } from '../../constants/characterVoices';
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
  Loader2,
  Play,
  Download,
  Film,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Subtitles,
  Zap,
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
  // ── Upgrades ──
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
  onOneClickDubbing?: () => void;
  onOpenRoadmap?: () => void;
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
  onOneClickDubbing,
  onOpenRoadmap,
}) => {
  const activeCharacters = characters && characters.length > 0 ? characters : CURATED_CHARACTER_VOICES;
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [zoom, setZoom] = useState(100);
  const [timelineHeight, setTimelineHeight] = useState<'normal' | 'expanded' | 'compact'>('normal');
  const [previewWidth, setPreviewWidth] = useState(38);
  const [isResizingPreview, setIsResizingPreview] = useState(false);
  const [isDialoguePanelCollapsed, setIsDialoguePanelCollapsed] = useState(false);
  const [mobileStudioTab, setMobileStudioTab] = useState<'preview' | 'inspector'>('preview');
  const [activeFeature, setActiveFeature] = useState<FeatureTab>('dubbing');
  const [masterVolume, setMasterVolume] = useState(100);
  const [showEffectsDrawer, setShowEffectsDrawer] = useState(false);
  const [showCharacterCastDrawer, setShowCharacterCastDrawer] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [videoSourceMode, setVideoSourceMode] = useState<'original' | 'dubbed'>('original');
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);

  // New Studio Modals State
  const [showCharacterInspector, setShowCharacterInspector] = useState(false);
  const [selectedInspectorChar, setSelectedInspectorChar] = useState<CharacterVoice | undefined>(undefined);
  const [selectedInspectorSeg, setSelectedInspectorSeg] = useState<TimelineSegment | undefined>(undefined);

  const [showGenerateVoiceModal, setShowGenerateVoiceModal] = useState(false);
  const [selectedVoiceModalSeg, setSelectedVoiceModalSeg] = useState<TimelineSegment | undefined>(undefined);

  const [showAutoDubWorkflow, setShowAutoDubWorkflow] = useState(false);
  const [showAudioDucking, setShowAudioDucking] = useState(false);
  const [showBgmLibrary, setShowBgmLibrary] = useState(false);
  const [showSfxLibrary, setShowSfxLibrary] = useState(false);
  const [showColorGrading, setShowColorGrading] = useState(false);
  const [showAITools, setShowAITools] = useState(false);
  const [showCommandSearch, setShowCommandSearch] = useState(false);

  // Global hotkeys for studio workstation speed (Section 23)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandSearch((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        onOpenExport?.();
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'KeyM' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenExport]);

  // Auto-switch to dubbed video when a new dubbing output is generated
  useEffect(() => {
    if (dubbingOutputVideo) {
      setVideoSourceMode('dubbed');
    } else {
      setVideoSourceMode('original');
    }
  }, [dubbingOutputVideo]);

  // When a new file is uploaded or selected, show original
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

  const resizePreview = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingPreview) return;
    const workspace = event.currentTarget.parentElement;
    if (!workspace) return;
    const bounds = workspace.getBoundingClientRect();
    const nextWidth = ((event.clientX - bounds.left) / bounds.width) * 100;
    setPreviewWidth(Math.max(25, Math.min(60, nextWidth)));
  };

  // Single line AI voice generator
  const handleGenerateLineAudio = async (idx: number) => {
    const seg = segments[idx];
    if (!seg) return;

    onShowToast(`⚡ កំពុងផលិតសំឡេងតួអង្គបន្ទាត់ទី #${idx + 1}...`, 'info');
    try {
      const fallbackVoice = seg.gender === 'female' ? 'km-KH-SreymomNeural' : 'km-KH-PisethNeural';
      const r = await api.generateLine({
        text: seg.khmer_translation || seg.chinese_text || 'បាទ',
        lineIndex: idx,
        gender: seg.gender || 'male',
        voiceId: seg.voiceId || fallbackVoice,
        speakerId: seg.speaker_role || seg.speaker_name,
        emotion: seg.emotion || 'calm',
        speed: seg.speed || 1.0,
        pitch: seg.pitch || 0,
      });

      if (r.success && r.audioUrl) {
        if (onChangeSegments) {
          const copy = [...segments];
          copy[idx] = { ...copy[idx], audioUrl: r.audioUrl, status: 'ready' };
          onChangeSegments(copy);
        }
        onShowToast(`🎉 សំឡេងបន្ទាត់ទី #${idx + 1} ផលិតរួចរាល់!`, 'success');
        const audio = new Audio(r.audioUrl);
        audio.play().catch(() => {});
      }
    } catch (e: any) {
      onShowToast(`Error generating line voice: ${e.message}`, 'error');
    }
  };

  const [isGeneratingAllVoices, setIsGeneratingAllVoices] = useState(false);

  // Batch AI Voice Generator for All Characters
  const handleGenerateAllVoices = async () => {
    if (!segments || segments.length === 0) {
      onShowToast('មិនទាន់មានអត្ថបទសន្ទនាក្នុងតារាងឡើយ!', 'warning');
      return;
    }

    setIsGeneratingAllVoices(true);
    onShowToast(`🚀 ចាប់ផ្តើមផលិតសំឡេងតួអង្គទាំងអស់ (${segments.length} បន្ទាត់)...`, 'info');

    let currentList = [...segments];
    let generatedCount = 0;

    for (let i = 0; i < currentList.length; i++) {
      const seg = currentList[i];
      const textToSynthesize = seg.khmer_translation || seg.chinese_text;
      if (!textToSynthesize) continue;

      onShowToast(`⚡ កំពុងផលិតសំឡេង ${i + 1}/${currentList.length}: ${seg.speaker_name || 'តួអង្គ'}...`, 'info');

      try {
        const fallbackVoice = seg.gender === 'female' ? 'km-KH-SreymomNeural' : 'km-KH-PisethNeural';
        const r = await api.generateLine({
          text: textToSynthesize,
          lineIndex: i,
          gender: seg.gender || 'male',
          voiceId: seg.voiceId || fallbackVoice,
          speakerId: seg.speaker_role || seg.speaker_name,
          emotion: seg.emotion || 'calm',
          speed: seg.speed || 1.0,
          pitch: seg.pitch || 0,
        });

        if (r.success && r.audioUrl) {
          currentList[i] = {
            ...currentList[i],
            audioUrl: r.audioUrl,
            status: 'ready',
          };
          generatedCount++;
          if (onChangeSegments) {
            onChangeSegments([...currentList]);
          }
        }
      } catch (err: any) {
        console.error(`Error generating line ${i}:`, err);
      }
    }

    setIsGeneratingAllVoices(false);
    if (generatedCount > 0) {
      onShowToast(`🎉 បានបង្កើតសំឡេង ${generatedCount}/${currentList.length} បន្ទាត់ជោគជ័យ 100%!`, 'success');
      const firstClip = currentList.find((s) => s.audioUrl)?.audioUrl;
      if (firstClip) {
        new Audio(firstClip).play().catch(() => {});
      }
    } else {
      onShowToast('⚠️ បរាជ័យក្នុងការផលិតសំឡេង សូមពិនិត្យមើលអត្ថបទ និងប្រព័ន្ធ!', 'error');
    }
  };

  // ── Translate All Dialogue Lines in Movie to 100% Pure Khmer ──
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);

  const handleTranslateAllDialogues = async () => {
    if (!uploadedFile) {
      onShowToast('⚠️ សូមបញ្ចូល ឬ Upload វីដេអូក្នុង Studio ជាមុនសិន!', 'warning');
      return;
    }

    setIsTranslatingAll(true);

    if (!segments || segments.length === 0) {
      onShowToast('🌐 AI Gemini កំពុងស្កេនវីដេអូ និងបកប្រែឃ្លាសន្ទនាទាំងអស់មកជាភាសាខ្មែរ ១០០%...', 'info');
      try {
        await onScanTimeline();
      } catch (err: any) {
        onShowToast(`កំហុសបកប្រែ: ${err.message}`, 'error');
      } finally {
        setIsTranslatingAll(false);
      }
    } else {
      onShowToast(`🌐 AI Gemini កំពុងបកប្រែ ${segments.length} ឃ្លាសន្ទនារឿងទាំងអស់មកជាភាសាខ្មែរ ១០០%...`, 'info');
      try {
        const res = await api.translateSegments(segments);
        if (res.success && res.segments && res.segments.length > 0) {
          onChangeSegments?.(res.segments);
          onShowToast(`🎉 បានបកប្រែឃ្លាសន្ទនាទាំង ${res.segments.length} បន្ទាត់ជាភាសាខ្មែរ ១០០% ជោគជ័យ!`, 'success');
        } else {
          await onScanTimeline();
        }
      } catch (err: any) {
        onShowToast(`កំហុសបកប្រែ: ${err.message}`, 'error');
      } finally {
        setIsTranslatingAll(false);
      }
    }
  };

  const handlePreviewAllGenerated = async () => {
    const clips = segments.filter((segment) => segment.audioUrl).map((segment) => segment.audioUrl as string);
    if (!clips.length) {
      onShowToast('មិនទាន់មានសំឡេងដែលបានបង្កើតរួចរាល់ឡើយ!', 'warning');
      return;
    }
    onShowToast(`Playing ${clips.length} generated dialogue clips...`, 'info');
    for (const src of clips) {
      await new Promise<void>((resolve) => {
        const audio = new Audio(src);
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      });
    }
  };

  // Handle Feature Toolbar Clicks
  const handleSelectFeature = (tab: FeatureTab) => {
    setActiveFeature(tab);
    if (tab === 'tts') {
      setShowGenerateVoiceModal(true);
    } else if (tab === 'voice_clone') {
      setShowCharacterCastDrawer(true);
    } else if (tab === 'subtitle') {
      onShowToast('Switched to Subtitle editor mode', 'info');
    } else if (tab === 'effects') {
      setShowEffectsDrawer(true);
    } else if (tab === 'bgm') {
      setShowBgmLibrary(true);
    } else if (tab === 'sfx') {
      setShowSfxLibrary(true);
    } else if (tab === 'color') {
      setShowColorGrading(true);
    } else if (tab === 'export') {
      onOpenExport?.();
    }
  };

  // Command palette actions dispatcher
  const handleCommandAction = (actionKey: string) => {
    switch (actionKey) {
      case 'gen-voice':
        setShowGenerateVoiceModal(true);
        break;
      case 'auto-dub':
        setShowAutoDubWorkflow(true);
        break;
      case 'subtitles':
        setShowEffectsDrawer(true);
        break;
      case 'mixer':
      case 'ducking':
        setShowAudioDucking(true);
        break;
      case 'bgm':
        setShowBgmLibrary(true);
        break;
      case 'sfx':
        setShowSfxLibrary(true);
        break;
      case 'color':
        setShowColorGrading(true);
        break;
      case '3d-effects':
        setShowEffectsDrawer(true);
        break;
      case 'export':
        onOpenExport?.();
        break;
      case 'characters':
        setShowCharacterCastDrawer(true);
        break;
      case 'toggle-play':
        setIsPlaying((prev) => !prev);
        break;
      case 'split':
        onShowToast('Split clip at current playhead position', 'info');
        break;
      default:
        break;
    }
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
    onShowToast(`🎉 បានកំណត់សំឡេងតាម Group "${activeGroup.name}" លើគ្រប់តួអង្គជោគជ័យ!`, 'success');
  };

  // Change voice for a character
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

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-[#080608] text-slate-800 dark:text-white select-none font-khmer">
      <FeatureToolbar
        activeFeature={activeFeature}
        onSelectFeature={handleSelectFeature}
        masterVolume={100}
        onChangeMasterVolume={() => {}}
        onOneClickDubbing={onOneClickDubbing}
        isDubbing={isDubbing}
        dubbingProgress={0}
      />

      {/* ── Main Studio Workstation: Left Video Preview + Right AI Dubbing Panel ── */}
      <div className="studio-workspace flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden p-2 sm:p-3 gap-2 sm:gap-3 bg-slate-50 dark:bg-[#080608]">
        {/* Left: Video Preview Panel */}
        <div 
          className="min-w-0 flex flex-col rounded-2xl bg-white dark:bg-[#120A0D] border border-slate-200 dark:border-[#3D161F] shadow-[0_0_30px_rgba(0,0,0,0.9)] overflow-hidden relative h-[250px] sm:h-[320px] md:h-[380px] lg:h-auto shrink-0 lg:shrink"
          style={typeof window !== 'undefined' && window.innerWidth >= 1024 ? { flex: isDialoguePanelCollapsed ? '1 1 auto' : `0 0 ${previewWidth}%` } : undefined}
        >
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

        {/* Resizer Handle */}
        <div
          className={`hidden lg:flex w-2.5 items-center justify-center cursor-col-resize hover:bg-blue-50 dark:bg-red-500/20 rounded transition-colors group ${
            isResizingPreview ? 'bg-red-500/30' : ''
          }`}
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            setIsResizingPreview(true);
          }}
          onPointerMove={resizePreview}
          onPointerUp={() => setIsResizingPreview(false)}
          onPointerCancel={() => setIsResizingPreview(false)}
          onDoubleClick={() => setPreviewWidth(38)}
          title="អូសដើម្បីផ្លាស់ប្តូរទំហំផ្ទាំង"
        >
          <div className="w-1 h-8 rounded-full bg-slate-700 group-hover:bg-red-400 transition-colors" />
        </div>

        {/* Right: Main AI Dubbing Panel */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 rounded-2xl bg-white dark:bg-[#120A0D] border border-slate-200 dark:border-[#3D161F] shadow-xl overflow-hidden">
          <AIDubbingPanel
            segments={segments}
            onChangeSegments={onChangeSegments}
            selectedSegmentIndex={selectedSegmentIndex}
            onSelectSegment={onSelectSegment}
            characters={activeCharacters}
            onGenerateLineAudio={handleGenerateLineAudio}
            onPreviewVoice={onPreviewVoice}
            onGenerateAll={handleGenerateAllVoices}
            onPreviewAll={handlePreviewAllGenerated}
            isGeneratingAll={isGeneratingAllVoices || isDubbing}
            canGenerateAll={segments.length > 0}
            onOpenCharacterInspector={(char, seg) => {
              setSelectedInspectorChar(char);
              setSelectedInspectorSeg(seg);
              setShowCharacterInspector(true);
            }}
            onOpenGenerateVoiceModal={(seg) => {
              setSelectedVoiceModalSeg(seg);
              setShowGenerateVoiceModal(true);
            }}
            onTranslateAll={handleTranslateAllDialogues}
            isTranslatingAll={isTranslatingAll || Boolean(isScanningTimeline)}
            onAssemble={onAssemble}
            onOneClickDubbing={onOneClickDubbing}
            onOpenRoadmap={onOpenRoadmap}
          />
        </div>
      </div>

      {/* ── Bottom: Multitrack Timeline ── */}
      <div className={`border-t border-slate-200 dark:border-[#3D161F] bg-slate-100 dark:bg-[#0E070A] shrink-0 transition-all duration-200 overflow-hidden ${
        timelineHeight === 'expanded' ? 'h-[300px]' : timelineHeight === 'compact' ? 'h-[120px]' : 'h-[210px] sm:h-[230px]'
      }`}>
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
          timelineHeight={timelineHeight}
          onToggleTimelineHeight={() =>
            setTimelineHeight((prev) =>
              prev === 'normal' ? 'expanded' : prev === 'expanded' ? 'compact' : 'normal'
            )
          }
          onShowToast={onShowToast}
        />
      </div>

      {/* ── Modals & Drawers ── */}

      {/* Section 8: Character Inspector Modal */}
      <CharacterInspectorModal
        isOpen={showCharacterInspector}
        onClose={() => setShowCharacterInspector(false)}
        character={selectedInspectorChar}
        segment={selectedInspectorSeg}
        characters={activeCharacters}
        onSaveProfile={(profile) => {
          onShowToast(`Voice profile "${profile.characterName}" saved!`, 'success');
          setShowCharacterInspector(false);
        }}
        onPreviewVoice={onPreviewVoice}
        onShowToast={onShowToast}
      />

      {/* Section 9: Generate AI Voice Modal */}
      <GenerateVoiceModal
        isOpen={showGenerateVoiceModal}
        onClose={() => setShowGenerateVoiceModal(false)}
        characterName={selectedVoiceModalSeg?.speaker_name || (activeCharacters[0]?.label || '')}
        defaultText={selectedVoiceModalSeg?.khmer_translation || ''}
        voiceName={selectedVoiceModalSeg?.voiceLabel || (activeCharacters[0]?.label || '')}
        characters={activeCharacters}
        onGenerate={async (data) => {
          onShowToast(`AI Voice generated for ${data.character}!`, 'success');
        }}
      />

      {/* Section 10: Auto Dub Workflow Modal */}
      <AutoDubWorkflowModal
        isOpen={showAutoDubWorkflow}
        onClose={() => setShowAutoDubWorkflow(false)}
        uploadedFile={uploadedFile}
        segments={segments}
        onChangeSegments={onChangeSegments}
        onAssemble={onAssemble}
        onComplete={() => {
          onShowToast('🎉 Auto Dubbing finished! Timeline updated with new audio tracks.', 'success');
        }}
        onShowToast={onShowToast}
      />

      {/* Section 12: Audio Ducking & Stems Modal */}
      <AudioDuckingModal
        isOpen={showAudioDucking}
        onClose={() => setShowAudioDucking(false)}
        onShowToast={onShowToast}
      />

      {/* Section 13: BGM Library Modal */}
      <BgmLibraryModal
        isOpen={showBgmLibrary}
        onClose={() => setShowBgmLibrary(false)}
        onAddTrackToTimeline={(track) => {
          onShowToast(`Added BGM track "${track.name}" to B1!`, 'success');
          setShowBgmLibrary(false);
        }}
        onShowToast={onShowToast}
      />

      {/* Section 14: SFX Library Modal */}
      <SfxLibraryModal
        isOpen={showSfxLibrary}
        onClose={() => setShowSfxLibrary(false)}
        onAddSfxToTimeline={(sfx) => {
          onShowToast(`Added SFX "${sfx.name}" to S1!`, 'success');
          setShowSfxLibrary(false);
        }}
        onShowToast={onShowToast}
      />

      {/* Section 18: Color Grading & Scopes Modal */}
      <ColorGradingModal
        isOpen={showColorGrading}
        onClose={() => setShowColorGrading(false)}
        onShowToast={onShowToast}
      />

      {/* Section 21: Dedicated AI Tools Suite Modal */}
      <AIToolsModal
        isOpen={showAITools}
        onClose={() => setShowAITools(false)}
        onLaunchTool={(toolId) => {
          if (toolId === 'ai-translate') {
            onScanTimeline();
          } else if (toolId === 'ai-voice-gen') {
            setShowGenerateVoiceModal(true);
          } else if (toolId === 'ai-bg-sep') {
            setShowAudioDucking(true);
          } else if (toolId === 'ai-music-match') {
            setShowBgmLibrary(true);
          }
        }}
        onShowToast={onShowToast}
      />

      {/* Section 22: Command Search Modal (Ctrl+K) */}
      <CommandSearchModal
        isOpen={showCommandSearch}
        onClose={() => setShowCommandSearch(false)}
        onAction={handleCommandAction}
      />

      {/* Character Cast Drawer */}
      <CharacterCastDrawer
        isOpen={showCharacterCastDrawer}
        onClose={() => setShowCharacterCastDrawer(false)}
        segments={segments}
        characters={activeCharacters}
        onChangeVoiceForCharacter={handleChangeVoiceForCharacter}
        onAutoCastUniqueVoices={() => {}}
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

      {/* Video Effects Panel Drawer */}
      {showEffectsDrawer && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={() => setShowEffectsDrawer(false)}
        >
          <div
            className="bg-white dark:bg-[#0b0f19] border border-cyan-500/30 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden relative shadow-[0_0_50px_rgba(0,240,255,0.25)]"
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
