import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic2, Play, Pause, Square, Download, Upload, Trash2, Plus, ChevronDown,
  ChevronUp, AudioLines, Sparkles, Volume2, Settings2, RotateCcw, Copy,
  AlignLeft, Clock, Check, Loader2, Wand2, ListOrdered, RefreshCw,
  BookOpen, Zap, Music2, FileText, SkipBack, SkipForward, Headphones,
  PlayCircle, PauseCircle, StopCircle, Save, ChevronLeft, ChevronRight,
  ArrowDownToLine, Layers, Mic, MicOff, Film, Video, Scissors, Eye,
  VolumeX, AlertCircle, Radio, Sliders, CheckCircle2, Flame, Heart
} from 'lucide-react';
import { CharacterVoice } from '../../types';
import { request } from '../../services/api';

interface NarratorLine {
  id: string;
  index: number;
  text: string;
  audioUrl: string | null;
  status: 'idle' | 'generating' | 'done' | 'error';
  duration?: number;
  timestamp?: string;
  emotion?: 'standard' | 'suspense' | 'action' | 'emotional' | 'horror' | 'epic';
}

interface NarratorStudioProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const SPEED_OPTIONS = [0.8, 0.9, 1.0, 1.1, 1.25];
const PITCH_OPTIONS = [-4, -2, 0, 2, 4];

const RECAP_EMOTIONS = [
  { id: 'standard', label: 'រៀបរាប់ធម្មតា (Narrative)', icon: '🎙️', desc: 'សម្លេងរលូន ថ្លៃថ្នូរ ស្រួលស្តាប់' },
  { id: 'suspense', label: 'អាថ៌កំបាំង / ភ័យរន្ធត់ (Suspense)', icon: '🕵️', desc: 'សម្លេងទាប ស្ងាត់ ធ្វើឱ្យចង់តាមដាន' },
  { id: 'action', label: 'រំភើប / វាយប្រហារ (Action/Tense)', icon: '⚡', desc: 'សម្លេងលឿន មោះមុត ក្តៅគគុក' },
  { id: 'emotional', label: 'កម្សត់ / រំជួលចិត្ត (Emotional)', icon: '💔', desc: 'សម្លេងទន់ភ្លន់ អួលដើមក' },
  { id: 'epic', label: 'ទេវកថា / អស្ចារ្យ (Epic Myth)', icon: '👑', desc: 'សម្លេងខ្លាំង អធិកអធម ប្រកបដោយអំណាច' },
];

const BGM_PRESETS = [
  { id: 'none', label: 'គ្មាន BGM (No Music)', url: '' },
  { id: 'suspense', label: 'Mystery & Thriller (អាថ៌កំបាំង)', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=cinematic-suspense-112191.mp3' },
  { id: 'epic', label: 'Epic Battle & Heroic (វាយប្រហារ/វីរបុរស)', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=epic-cinematic-trailer-113981.mp3' },
  { id: 'emotional', label: 'Melodrama & Sorrow (កម្សត់/ទឹកភ្នែក)', url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_8f44d93ee1.mp3?filename=sad-piano-ambient-8418.mp3' },
];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const NarratorStudio: React.FC<NarratorStudioProps> = ({ onShowToast }) => {
  // Voice & Characters
  const [voices, setVoices] = useState<CharacterVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);

  // In-studio custom voice cloner
  const [showVoiceCloner, setShowVoiceCloner] = useState(false);
  const [cloneVoiceName, setCloneVoiceName] = useState('');
  const [cloneVoiceGender, setCloneVoiceGender] = useState<'male' | 'female'>('male');
  const [cloneFile, setCloneFile] = useState<File | null>(null);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);

  // Script lines
  const [lines, setLines] = useState<NarratorLine[]>([
    {
      id: generateId(),
      index: 0,
      text: 'នៅក្នុងសម័យបុរាណ យុវជនម្នាក់ដែលគ្មានអ្នកណាស្គាល់ បានរកឃើញដាវទេពដ៏អាថ៌កំបាំងមួយ...',
      audioUrl: null,
      status: 'idle',
      emotion: 'standard',
    },
    {
      id: generateId(),
      index: 1,
      text: 'ប៉ុន្តែគ្មាននរណាម្នាក់ដឹងទេថា ដាវនេះគឺជាប្រភពនៃការបំផ្លិចបំផ្លាញនៃនគរទាំងមូល!',
      audioUrl: null,
      status: 'idle',
      emotion: 'suspense',
    },
    {
      id: generateId(),
      index: 2,
      text: 'តើដំណើរផ្សងព្រេងរបស់គេនឹងទៅជាយ៉ាងណា? សូមតាមដានទស្សនាទាំងអស់គ្នា!',
      audioUrl: null,
      status: 'idle',
      emotion: 'epic',
    },
  ]);

  // Full Script Editor & Bulk Import
  const [bulkText, setBulkText] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [activeTab, setActiveTab] = useState<'lines' | 'full-script'>('lines');
  const [isEnhancingScript, setIsEnhancingScript] = useState(false);

  // Voice parameters
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [selectedEmotion, setSelectedEmotion] = useState('standard');
  const [pauseBetween, setPauseBetween] = useState(400); // ms

  // Playback & Audio
  const [playingLineId, setPlayingLineId] = useState<string | null>(null);
  const [playAll, setPlayAll] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const playQueueRef = useRef<string[]>([]);
  const [isAuditioning, setIsAuditioning] = useState(false);

  // BGM & Mixer
  const [selectedBgm, setSelectedBgm] = useState<string>('none');
  const [customBgmUrl, setCustomBgmUrl] = useState<string>('');
  const [bgmVolume, setBgmVolume] = useState<number>(0.18);
  const [voiceVolume, setVoiceVolume] = useState<number>(1.0);
  const [autoDucking, setAutoDucking] = useState<boolean>(true);
  const bgmAudioRef = useRef<HTMLAudioElement>(new Audio());

  // Video Sync Preview
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Progress & Generation
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingLineId, setGeneratingLineId] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);

  // UI Panels
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Load Voices
  const fetchVoices = useCallback(() => {
    setIsLoadingVoices(true);
    request<{ characters: CharacterVoice[] }>('/api/characters')
      .then(d => {
        const list = d.characters || [];
        setVoices(list);
        if (list.length > 0 && !selectedVoiceId) {
          setSelectedVoiceId(list[0].id || list[0].filename);
        }
      })
      .catch(() => {
        // Fallback to default characters if error
        const defaults: CharacterVoice[] = [
          { id: 'voxcpm:vp_character_2_male.mp3', filename: 'vp_character_2_male.mp3', label: 'សំឡេងអ្នកសម្រាយប្រុស (Piseth Pro)', gender: 'male', is_curated: true },
          { id: 'voxcpm:vp_character_1_female.mp3', filename: 'vp_character_1_female.mp3', label: 'សំឡេងអ្នកសម្រាយស្រី (Sreymom Pro)', gender: 'female', is_curated: true },
        ];
        setVoices(defaults);
        if (!selectedVoiceId) setSelectedVoiceId(defaults[0].id);
      })
      .finally(() => setIsLoadingVoices(false));
  }, [selectedVoiceId]);

  useEffect(() => {
    fetchVoices();
  }, []);

  // Audio queue listener
  useEffect(() => {
    const audio = audioRef.current;
    const onEnded = () => {
      setPlayingLineId(null);
      if (playAll && playQueueRef.current.length > 0) {
        const nextId = playQueueRef.current.shift()!;
        setTimeout(() => playLineById(nextId), pauseBetween);
      } else {
        setPlayAll(false);
        if (bgmAudioRef.current && !bgmAudioRef.current.paused) {
          bgmAudioRef.current.pause();
        }
      }
    };
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [playAll, pauseBetween]);

  const selectedVoice = voices.find(v => v.id === selectedVoiceId || v.filename === selectedVoiceId);

  // Generate Single Line Voice
  const generateLine = useCallback(async (lineId: string) => {
    const line = lines.find(l => l.id === lineId);
    if (!line || !line.text.trim()) return;

    setGeneratingLineId(lineId);
    setLines(prev => prev.map(l => l.id === lineId ? { ...l, status: 'generating' } : l));

    try {
      const body = {
        text: line.text.trim(),
        voice_id: selectedVoiceId,
        gender: selectedVoice?.gender || 'male',
        speed,
        pitch,
        emotion: line.emotion || selectedEmotion,
        stability: 0.75,
        similarity_boost: 0.8,
      };

      const res = await request<{ audio_url?: string; url?: string; error?: string }>(
        '/api/tts/clone',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      const url = res.audio_url || res.url;
      if (!url) throw new Error(res.error || 'No audio URL returned');

      setLines(prev => prev.map(l =>
        l.id === lineId ? { ...l, status: 'done', audioUrl: url } : l
      ));
      onShowToast(`✅ បានបង្កើតសំឡេងឃ្លាទី ${line.index + 1}`, 'success');
    } catch (err: any) {
      setLines(prev => prev.map(l => l.id === lineId ? { ...l, status: 'error' } : l));
      onShowToast(`❌ ${err.message || 'កំហុសក្នុងការបង្កើតសំឡេង'}`, 'error');
    } finally {
      setGeneratingLineId(null);
    }
  }, [lines, selectedVoiceId, selectedVoice, speed, pitch, selectedEmotion, onShowToast]);

  // Generate All Lines Batch
  const generateAll = async () => {
    const toGen = lines.filter(l => l.text.trim());
    if (!toGen.length) {
      onShowToast('មិនមានឃ្លាសម្រាប់បង្កើតសំឡេងទេ', 'info');
      return;
    }
    setIsGeneratingAll(true);
    let count = 0;
    for (const line of toGen) {
      if (line.status !== 'done') {
        await generateLine(line.id);
        count++;
      }
    }
    setIsGeneratingAll(false);
    onShowToast(`🎉 បានបង្កើតសំឡេងសម្រាយរឿងជោគជ័យ ${count} ឃ្លា!`, 'success');
  };

  // Playback Control
  const playLineById = (lineId: string) => {
    const line = lines.find(l => l.id === lineId);
    if (!line?.audioUrl) return;

    audioRef.current.pause();
    audioRef.current.src = line.audioUrl;
    audioRef.current.volume = voiceVolume;
    audioRef.current.play().catch(() => {});
    setPlayingLineId(lineId);

    // Sync BGM
    const bgmSource = customBgmUrl || (selectedBgm !== 'none' ? BGM_PRESETS.find(b => b.id === selectedBgm)?.url : '');
    if (bgmSource) {
      bgmAudioRef.current.src = bgmSource;
      bgmAudioRef.current.volume = autoDucking ? bgmVolume * 0.4 : bgmVolume;
      bgmAudioRef.current.loop = true;
      bgmAudioRef.current.play().catch(() => {});
    }
  };

  const stopLine = () => {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setPlayingLineId(null);
    setPlayAll(false);
    playQueueRef.current = [];
    if (bgmAudioRef.current) {
      bgmAudioRef.current.pause();
    }
    if (videoRef.current) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const playAllLines = () => {
    const doneLines = lines.filter(l => l.audioUrl);
    if (!doneLines.length) {
      onShowToast('សូមបង្កើតសំឡេងឃ្លាជាមុនសិន', 'info');
      return;
    }
    playQueueRef.current = doneLines.slice(1).map(l => l.id);
    setPlayAll(true);
    playLineById(doneLines[0].id);

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setIsVideoPlaying(true);
    }
  };

  // Quick Audition Test
  const testVoiceAudition = async () => {
    if (isAuditioning) return;
    setIsAuditioning(true);
    try {
      const testText = "ជម្រាបសួរពុកម៉ែបងប្អូន នេះជាសំឡេងតេស្តសម្រាប់សម្រាយរឿងភាពយន្ត។";
      const res = await request<{ audio_url?: string; url?: string }>('/api/tts/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          voice_id: selectedVoiceId,
          gender: selectedVoice?.gender || 'male',
          speed,
          pitch,
          emotion: selectedEmotion,
        }),
      });
      const url = res.audio_url || res.url;
      if (url) {
        audioRef.current.pause();
        audioRef.current.src = url;
        audioRef.current.play().catch(() => {});
        onShowToast('🎧 កំពុងចាក់សំឡេងតេស្ត...', 'info');
      }
    } catch {
      onShowToast('❌ មិនអាចចាក់សំឡេងតេស្តបានទេ', 'error');
    } finally {
      setIsAuditioning(false);
    }
  };

  // Upload & Clone Single Voice
  const handleUploadVoiceClone = async () => {
    if (!cloneFile || !cloneVoiceName.trim()) {
      onShowToast('សូមជ្រើសរើសឯកសារសំឡេង និងដាក់ឈ្មោះសំឡេង', 'error');
      return;
    }
    setIsUploadingVoice(true);
    try {
      const formData = new FormData();
      formData.append('audioFile', cloneFile);
      formData.append('label', cloneVoiceName.trim());
      formData.append('gender', cloneVoiceGender);
      formData.append('role_key', cloneVoiceGender === 'female' ? 'female_lead' : 'male_lead');
      formData.append('words', 'សំឡេងសម្រាយរឿង Clone ផ្ទាល់ខ្លួន');

      const res = await fetch('/api/characters/create', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.character) {
        onShowToast(`🎉 បាន Clone សំឡេង "${cloneVoiceName}" ដោយជោគជ័យ!`, 'success');
        setCloneFile(null);
        setCloneVoiceName('');
        setShowVoiceCloner(false);
        fetchVoices();
        setSelectedVoiceId(data.character.id || data.character.filename);
      } else {
        throw new Error(data.message || 'Error cloning voice');
      }
    } catch (err: any) {
      onShowToast(`❌ ${err.message || 'កំហុសក្នុងការ Upload សំឡេង Clone'}`, 'error');
    } finally {
      setIsUploadingVoice(false);
    }
  };

  // Script Line Manipulation
  const addLine = (afterId?: string) => {
    const newLine: NarratorLine = {
      id: generateId(),
      index: lines.length,
      text: '',
      audioUrl: null,
      status: 'idle',
      emotion: 'standard',
    };
    if (afterId) {
      const idx = lines.findIndex(l => l.id === afterId);
      const updated = [...lines.slice(0, idx + 1), newLine, ...lines.slice(idx + 1)];
      setLines(updated.map((l, i) => ({ ...l, index: i })));
    } else {
      setLines(prev => [...prev, { ...newLine, index: prev.length }]);
    }
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines(prev => prev.filter(l => l.id !== id).map((l, i) => ({ ...l, index: i })));
  };

  const updateLineText = (id: string, text: string) => {
    setLines(prev => prev.map(l =>
      l.id === id
        ? { ...l, text, status: l.audioUrl && text !== l.text ? 'idle' : l.status, audioUrl: l.audioUrl && text !== l.text ? null : l.audioUrl }
        : l
    ));
  };

  const updateLineEmotion = (id: string, emotion: any) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, emotion } : l));
  };

  // Bulk Script Import & Splitting by Sentences
  const handleImportBulkScript = () => {
    if (!bulkText.trim()) return;
    // Split by Khmer periods ('។'), question marks, exclamations, or newlines
    const rawParts = bulkText.split(/(?<=[។\n!?])/).map(p => p.trim()).filter(p => p.length > 2);
    if (!rawParts.length) return;

    const newLines: NarratorLine[] = rawParts.map((text, idx) => ({
      id: generateId(),
      index: idx,
      text,
      audioUrl: null,
      status: 'idle',
      emotion: (idx === 0 ? 'standard' : idx === rawParts.length - 1 ? 'epic' : 'standard'),
    }));

    setLines(newLines);
    setBulkText('');
    setShowBulkImport(false);
    setActiveTab('lines');
    onShowToast(`🎉 បានបំបែកអត្ថបទជា ${newLines.length} វគ្គសម្រាយរឿងរួចរាល់!`, 'success');
  };

  // AI Script Polish / Enhancers
  const enhanceScriptAI = async (mode: 'hook' | 'suspense' | 'climax' | 'outro') => {
    setIsEnhancingScript(true);
    try {
      const modePrompt = {
        hook: 'បង្កើតក្បាលរឿងទាក់ទាញ (Catchy Opening Hook) ធ្វើឱ្យអ្នកស្តាប់ជក់ចិត្តភ្លាមៗ',
        suspense: 'បង្កើនពាក្យពេចន៍បែបអាថ៌កំបាំង រន្ធត់ តានតឹង (Suspenseful Flow)',
        climax: 'បង្កើនភាពក្តៅគគុក ឈុតវាយប្រហារ កំពូលតានតឹង (Epic Climax)',
        outro: 'បិទបញ្ចប់រឿង និងសុំ Like, Follow, Subscribe ឱ្យទាក់ទាញ',
      }[mode];

      // Polish the text
      const currentFull = lines.map(l => l.text).join(' ');
      const res = await request<{ translation?: string }>('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `សូមសម្រួលអត្ថបទសម្រាយរឿងនេះជាភាសាខ្មែរឱ្យមានលក្ខណៈ ${modePrompt}:\n${currentFull}`,
        }),
      });

      if (res.translation) {
        setBulkText(res.translation);
        setShowBulkImport(true);
        onShowToast('✨ AI បានសម្រួលអត្ថបទសម្រាយរឿងរួចរាល់!', 'success');
      }
    } catch {
      onShowToast('មិនអាចដំណើរការ AI Script Enhancer បានទេ', 'error');
    } finally {
      setIsEnhancingScript(false);
    }
  };

  // Merge Audio
  const mergeAllAudio = async () => {
    const doneLines = lines.filter(l => l.audioUrl);
    if (doneLines.length < 1) {
      onShowToast('មិនទាន់មានសំឡេងដែលបានបង្កើតទេ', 'error');
      return;
    }
    setIsMerging(true);
    try {
      const bgmSource = customBgmUrl || (selectedBgm !== 'none' ? BGM_PRESETS.find(b => b.id === selectedBgm)?.url : '');
      const res = await request<{ url: string; filename: string }>('/api/audio/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_urls: doneLines.map(l => l.audioUrl),
          pause_ms: pauseBetween,
          bgm_url: bgmSource || null,
          bgm_volume: bgmVolume,
          voice_volume: voiceVolume,
        }),
      });
      if (res.url) {
        setMergedUrl(res.url);
        onShowToast('🎉 បានរួមបញ្ចូលសំឡេង Master សម្រាយរឿងដោយជោគជ័យ!', 'success');
      }
    } catch {
      onShowToast('❌ មិនអាចរួមបញ្ចូលសំឡេងបានទេ', 'error');
    } finally {
      setIsMerging(false);
    }
  };

  // Export SRT Subtitles for Movie Recap
  const exportSRTSubtitles = () => {
    let srtContent = '';
    let currentTime = 0;
    lines.forEach((l, idx) => {
      const estDuration = Math.max(2.5, (l.text.length / 10));
      const startSec = currentTime;
      const endSec = currentTime + estDuration;
      currentTime = endSec + (pauseBetween / 1000);

      const formatSRTTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        const millis = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
        return `${hrs}:${mins}:${secs},${millis}`;
      };

      srtContent += `${idx + 1}\n`;
      srtContent += `${formatSRTTime(startSec)} --> ${formatSRTTime(endSec)}\n`;
      srtContent += `${l.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recap_subtitles_${Date.now()}.srt`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('📥 បានទាញយក File Subtitle (.SRT) ជោគជ័យ!', 'success');
  };

  // Render Full Video with Voiceover
  const renderVideoRecap = async () => {
    if (!videoUrl) {
      onShowToast('សូមជ្រើសរើស Video សម្រាប់ផ្គុំជាមួយសំឡេងជាមុនសិន', 'error');
      return;
    }
    if (!mergedUrl) {
      onShowToast('សូមចុច "Merge Master Audio" ជាមុនសិន', 'info');
      await mergeAllAudio();
    }
    setIsRenderingVideo(true);
    try {
      const res = await request<{ url: string }>('/api/recap/render-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_url: videoUrl,
          audio_url: mergedUrl,
        }),
      });
      if (res.url) {
        setRenderedVideoUrl(res.url);
        onShowToast('🎬 បាន Render វីដេអូសម្រាយរឿងរួចរាល់ 100%!', 'success');
      }
    } catch {
      onShowToast('❌ បរាជ័យក្នុងការ Render វីដេអូ', 'error');
    } finally {
      setIsRenderingVideo(false);
    }
  };

  const doneCount = lines.filter(l => l.status === 'done').length;
  const progressPct = lines.length > 0 ? (doneCount / lines.length) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-[#0c0d12] text-slate-100 overflow-hidden font-khmer select-none">
      {/* ── Top Header Toolbar ── */}
      <div className="shrink-0 h-14 bg-gradient-to-r from-[#12131a] via-[#161822] to-[#12131a] border-b border-white/[0.08] px-4 flex items-center justify-between gap-3 shadow-lg z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Mic2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide">ស្ទូឌីយោសម្រាយរឿង AI អាជីព</h1>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[10px] font-bold">
                1-CHARACTER VOICE CLONE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Movie & Story Recap Studio · បង្កើតសាច់រឿងសម្រាយបែបអាជីព</p>
          </div>
        </div>

        {/* Center Progress HUD */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <span className="text-xs text-zinc-300 font-medium">វឌ្ឍនភាពសំឡេង:</span>
          <div className="w-32 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-cyan-400">{doneCount}/{lines.length}</span>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Bulk Import */}
          <button
            type="button"
            onClick={() => setShowBulkImport(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-bold text-zinc-200 transition-all active:scale-95"
            title="បញ្ចូលអត្ថបទសម្រាយរឿងទាំងអស់ (Import Full Script)"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">បញ្ចូលអត្ថបទ</span>
          </button>

          {/* Generate All Lines */}
          <button
            type="button"
            onClick={generateAll}
            disabled={isGeneratingAll}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-md ${
              isGeneratingAll
                ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 text-white shadow-cyan-500/25'
            }`}
          >
            {isGeneratingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            <span>{isGeneratingAll ? 'កំពុងបង្កើត...' : 'បង្កើតសំឡេងទាំងអស់'}</span>
          </button>

          {/* Play All */}
          <button
            type="button"
            onClick={playingLineId ? stopLine : playAllLines}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-bold text-zinc-200 transition-all active:scale-95"
          >
            {playingLineId ? (
              <>
                <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>បញ្ឈប់</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>ចាក់ស្តាប់</span>
              </>
            )}
          </button>

          {/* Merge Audio Master */}
          <button
            type="button"
            onClick={mergeAllAudio}
            disabled={isMerging || doneCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
            title="រួមបញ្ចូលគ្រប់សំឡេងទាំងអស់ជា File តែមួយ (Master Audio)"
          >
            {isMerging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
            <span>Merge Master</span>
          </button>
        </div>
      </div>

      {/* ── Bulk Script Import Modal / Flyout ── */}
      {showBulkImport && (
        <div className="shrink-0 bg-[#151722] border-b border-cyan-500/20 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-white">បញ្ចូលអត្ថបទសម្រាយរឿង (Bulk Script Import & Auto-Split)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => enhanceScriptAI('hook')}
                  disabled={isEnhancingScript}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-[11px] font-bold text-indigo-300 hover:bg-indigo-500/30 transition-all"
                >
                  ⚡ បង្កើត Hook បើកក្បាល
                </button>
                <button
                  type="button"
                  onClick={() => enhanceScriptAI('suspense')}
                  disabled={isEnhancingScript}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/30 text-[11px] font-bold text-amber-300 hover:bg-amber-500/30 transition-all"
                >
                  🕵️ បង្កើនភាពរន្ធត់
                </button>
                <button
                  type="button"
                  onClick={() => enhanceScriptAI('outro')}
                  disabled={isEnhancingScript}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/30 transition-all"
                >
                  🎬 បិទបញ្ចប់រឿង
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkImport(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="បិទភ្ជាប់អត្ថបទសម្រាយរឿងនៅទីនេះ... ប្រព័ន្ធនឹងបំបែកតាមសញ្ញាខណ្ឌ (។) ឬការចុះបន្ទាត់ដោយស្វ័យប្រវត្តិ"
              rows={5}
              className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-400/60 leading-relaxed resize-y"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                ចំនួនអក្សរ: {bulkText.length} · ប៉ាន់ស្មានចំនួនឃ្លា: {bulkText.split(/(?<=[។\n!?])/).filter(p => p.trim()).length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBulkText('')}
                  className="px-3 py-1.5 rounded-xl hover:bg-white/10 text-xs text-zinc-400 hover:text-white"
                >
                  ជម្រះ
                </button>
                <button
                  type="button"
                  onClick={handleImportBulkScript}
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95"
                >
                  បំបែកចូលស្ទូឌីយោ (Auto-Split to Lines)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Workspace Body (3-Column Layout) ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT COLUMN: Single Narrator Profile & Voice Settings ── */}
        <div
          className={`shrink-0 border-r border-white/[0.08] bg-[#0e1017] flex flex-col transition-all duration-300 ${
            showLeftPanel ? 'w-80' : 'w-0 overflow-hidden'
          }`}
        >
          <div className="p-3 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white tracking-wide">តួអង្គអ្នកសម្រាយ (SINGLE VOICE)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowVoiceCloner(prev => !prev)}
              className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold active:scale-95"
            >
              + Clone សំឡេងថ្មី
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Instant Voice Cloner Box */}
            {showVoiceCloner && (
              <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300">🎙️ Clone សំឡេងអ្នកសម្រាយថ្មី</span>
                  <button type="button" onClick={() => setShowVoiceCloner(false)} className="text-xs text-zinc-400 hover:text-white">✕</button>
                </div>
                <div>
                  <label className="text-[11px] text-zinc-300 block mb-1">ឈ្មោះអ្នកសម្រាយ:</label>
                  <input
                    type="text"
                    value={cloneVoiceName}
                    onChange={(e) => setCloneVoiceName(e.target.value)}
                    placeholder="ឧ. សំឡេងសម្រាយរឿង វិរៈ"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCloneVoiceGender('male')}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      cloneVoiceGender === 'male' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-white/[0.03] border-white/10 text-zinc-400'
                    }`}
                  >
                    ប្រុស (Male)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCloneVoiceGender('female')}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      cloneVoiceGender === 'female' ? 'bg-pink-500/20 border-pink-400 text-pink-300' : 'bg-white/[0.03] border-white/10 text-zinc-400'
                    }`}
                  >
                    ស្រី (Female)
                  </button>
                </div>
                <div>
                  <label className="text-[11px] text-zinc-300 block mb-1">Upload សំឡេងគំរូ (5s-30s clean audio):</label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setCloneFile(e.target.files?.[0] || null)}
                    className="w-full text-[11px] text-zinc-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-cyan-500 file:text-slate-900 cursor-pointer"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUploadVoiceClone}
                  disabled={isUploadingVoice || !cloneFile}
                  className="w-full py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isUploadingVoice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>ចាប់ផ្តើម Clone សំឡេង</span>
                </button>
              </div>
            )}

            {/* Selected Narrator Profile Card */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2.5">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-base shadow-md ${
                  selectedVoice?.gender === 'female'
                    ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white'
                    : 'bg-gradient-to-br from-cyan-500 to-indigo-600 text-white'
                }`}>
                  {selectedVoice?.gender === 'female' ? '👩' : '👨'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">{selectedVoice?.label || 'ជ្រើសរើសសំឡេងអ្នកសម្រាយ'}</div>
                  <div className="text-[10px] text-zinc-400">ភេទ: {selectedVoice?.gender === 'female' ? 'ស្រី (Female)' : 'ប្រុស (Male)'}</div>
                  <div className="text-[10px] text-cyan-400 font-mono">100% Locked Single Voice</div>
                </div>
              </div>

              {/* Audition Test Button */}
              <button
                type="button"
                onClick={testVoiceAudition}
                disabled={isAuditioning}
                className="w-full py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs font-bold text-cyan-300 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                {isAuditioning ? <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" /> : <Headphones className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{isAuditioning ? 'កំពុងតេស្ត...' : 'ស្តាប់តេស្តសំឡេង (Audition)'}</span>
              </button>
            </div>

            {/* Voice List Picker */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 block uppercase tracking-wider">
                ជ្រើសរើសសំឡេងក្នុង Library ({voices.length}):
              </label>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {isLoadingVoices ? (
                  <div className="p-4 text-center text-xs text-zinc-500">កំពុងផ្ទុកសំឡេង...</div>
                ) : (
                  voices.map((v) => {
                    const isSel = selectedVoiceId === v.id || selectedVoiceId === v.filename;
                    return (
                      <button
                        key={v.id || v.filename}
                        type="button"
                        onClick={() => setSelectedVoiceId(v.id || v.filename)}
                        className={`w-full p-2 rounded-xl text-left flex items-center gap-2.5 transition-all ${
                          isSel
                            ? 'bg-cyan-500/20 border border-cyan-400/50 text-white shadow-sm'
                            : 'bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] text-zinc-300'
                        }`}
                      >
                        <span className="text-sm">{v.gender === 'female' ? '👩' : '👨'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold truncate">{v.label}</div>
                          <div className="text-[9px] text-zinc-400 truncate">{v.filename}</div>
                        </div>
                        {isSel && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Voice Tuning Controls */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
              <span className="text-xs font-bold text-zinc-200 block">🎛️ ការកំណត់សំឡេង (Voice Tuning)</span>

              {/* Speed Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">ល្បឿននិយាយ (Speed):</span>
                  <span className="font-mono text-cyan-400 font-bold">{speed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.35"
                  step="0.05"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Pitch Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">កម្រិតសម្លេង (Pitch):</span>
                  <span className="font-mono text-cyan-400 font-bold">{pitch > 0 ? `+${pitch}` : pitch}</span>
                </div>
                <input
                  type="range"
                  min="-6"
                  max="6"
                  step="1"
                  value={pitch}
                  onChange={(e) => setPitch(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Pause Duration Between Lines */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">ចន្លោះដកដង្ហើម (Pause):</span>
                  <span className="font-mono text-cyan-400 font-bold">{pauseBetween}ms</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1200"
                  step="50"
                  value={pauseBetween}
                  onChange={(e) => setPauseBetween(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>

            {/* Master Recap Audio Download Box (If merged) */}
            {mergedUrl && (
              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Master Audio រួចរាល់!</span>
                </div>
                <audio controls src={mergedUrl} className="w-full h-8" />
                <a
                  href={mergedUrl}
                  download="movie_recap_master.mp3"
                  className="w-full py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>ទាញយក Master MP3</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Toggle Left Sidebar */}
        <button
          type="button"
          onClick={() => setShowLeftPanel(prev => !prev)}
          className="w-3 hover:w-4 bg-[#141620] hover:bg-cyan-500/20 border-r border-white/[0.08] flex items-center justify-center text-zinc-500 hover:text-cyan-300 transition-all z-10"
          title={showLeftPanel ? 'បិទ Panel សំឡេង' : 'បើក Panel សំឡេង'}
        >
          {showLeftPanel ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {/* ── CENTER COLUMN: Story Recap Lines Workbench ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0c0d12]">
          {/* Subheader Line Bar */}
          <div className="h-10 px-4 bg-[#11131a] border-b border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-zinc-200">
                អត្ថបទសម្រាយរឿង ({lines.length} វគ្គ / Scene Lines)
              </span>
              <span className="text-zinc-500">|</span>
              <span className="text-emerald-400 font-medium">
                {doneCount} បានបង្កើតសំឡេង
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportSRTSubtitles}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[11px] font-bold text-zinc-300 flex items-center gap-1 active:scale-95"
              >
                <Download className="w-3 h-3 text-cyan-400" />
                <span>Export SRT</span>
              </button>

              <button
                type="button"
                onClick={() => addLine()}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-[11px] font-bold text-cyan-300 flex items-center gap-1 active:scale-95"
              >
                <Plus className="w-3 h-3" />
                <span>បន្ថែមឃ្លាថ្មី</span>
              </button>
            </div>
          </div>

          {/* Script Line Cards List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {lines.map((line, idx) => {
              const isPlaying = playingLineId === line.id;
              const isGenerating = generatingLineId === line.id || (isGeneratingAll && line.status === 'generating');

              return (
                <div
                  key={line.id}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 ${
                    isPlaying
                      ? 'bg-cyan-950/20 border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/30'
                      : line.status === 'done'
                      ? 'bg-[#141622]/90 border-white/[0.08] hover:border-white/20'
                      : 'bg-[#11131c] border-white/[0.05] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Line Index & Emotion Tag */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-bold ${
                        line.status === 'done'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                          : 'bg-white/[0.06] text-zinc-400'
                      }`}>
                        {idx + 1}
                      </div>

                      {/* Emotion Selector Pill */}
                      <select
                        value={line.emotion || 'standard'}
                        onChange={(e) => updateLineEmotion(line.id, e.target.value)}
                        className="text-[10px] px-1.5 py-0.5 rounded-lg bg-black/40 border border-white/10 text-zinc-300 outline-none cursor-pointer"
                        title="ជ្រើសរើសអារម្មណ៍សម្រាប់ឃ្លានេះ"
                      >
                        <option value="standard">🎙️ ធម្មតា</option>
                        <option value="suspense">🕵️ រន្ធត់</option>
                        <option value="action">⚡ ក្តៅគគុក</option>
                        <option value="emotional">💔 កម្សត់</option>
                        <option value="epic">👑 អស្ចារ្យ</option>
                      </select>
                    </div>

                    {/* Textarea for Script Line */}
                    <div className="flex-1 min-w-0">
                      <textarea
                        value={line.text}
                        onChange={(e) => updateLineText(line.id, e.target.value)}
                        placeholder={`វគ្គសម្រាយទី ${idx + 1}...`}
                        rows={2}
                        className="w-full bg-transparent border-0 outline-none text-sm text-zinc-100 placeholder-zinc-600 resize-none leading-relaxed focus:ring-0"
                      />

                      {/* Bottom Line Toolbar */}
                      <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center justify-between">
                        {/* Audio Preview or Status */}
                        <div className="flex items-center gap-2">
                          {line.audioUrl ? (
                            <button
                              type="button"
                              onClick={() => isPlaying ? stopLine() : playLineById(line.id)}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                                isPlaying
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40 animate-pulse'
                                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-400/30'
                              }`}
                            >
                              {isPlaying ? <Pause className="w-3 h-3 fill-rose-300" /> : <Play className="w-3 h-3 fill-emerald-400" />}
                              <span>{isPlaying ? 'ផ្អាក' : 'ចាក់ស្តាប់'}</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-zinc-500 italic">មិនទាន់បង្កើតសំឡេង</span>
                          )}

                          {line.status === 'generating' && (
                            <span className="flex items-center gap-1 text-[11px] text-cyan-400 animate-pulse">
                              <Loader2 className="w-3 h-3 animate-spin" /> កំពុងបង្កើតសំឡេង AI...
                            </span>
                          )}
                          {line.status === 'done' && (
                            <span className="flex items-center gap-1 text-[11px] text-cyan-400/80">
                              <CheckCircle2 className="w-3 h-3" /> រួចរាល់
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                          {/* Re-generate */}
                          <button
                            type="button"
                            onClick={() => generateLine(line.id)}
                            disabled={isGenerating || !line.text.trim()}
                            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-cyan-500/20 text-zinc-400 hover:text-cyan-300 transition-all active:scale-95 disabled:opacity-40"
                            title="បង្កើតសំឡេងសម្រាប់ឃ្លានេះ"
                          >
                            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          </button>

                          {/* Add after */}
                          <button
                            type="button"
                            onClick={() => addLine(line.id)}
                            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-all active:scale-95"
                            title="បន្ថែមឃ្លាថ្មីខាងក្រោម"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => removeLine(line.id)}
                            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-all active:scale-95"
                            title="លុបឃ្លានេះ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Bottom Add Big Button */}
            <button
              type="button"
              onClick={() => addLine()}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-white/10 hover:border-cyan-400/40 bg-white/[0.01] hover:bg-cyan-500/[0.03] text-zinc-400 hover:text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>បន្ថែមវគ្គសម្រាយរឿងថ្មី (Add Recap Line)</span>
            </button>
          </div>
        </div>

        {/* Toggle Right Sidebar */}
        <button
          type="button"
          onClick={() => setShowRightPanel(prev => !prev)}
          className="w-3 hover:w-4 bg-[#141620] hover:bg-indigo-500/20 border-l border-white/[0.08] flex items-center justify-center text-zinc-500 hover:text-indigo-300 transition-all z-10"
          title={showRightPanel ? 'បិទ Video & BGM Panel' : 'បើក Video & BGM Panel'}
        >
          {showRightPanel ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* ── RIGHT COLUMN: Video Sync Preview & BGM Mixer ── */}
        <div
          className={`shrink-0 border-l border-white/[0.08] bg-[#0e1017] flex flex-col transition-all duration-300 ${
            showRightPanel ? 'w-84 lg:w-96' : 'w-0 overflow-hidden'
          }`}
        >
          <div className="p-3 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white tracking-wide">វីដេអូ & តន្ត្រី BGM (VIDEO & BGM)</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Video Player Box */}
            <div className="rounded-2xl bg-black/60 border border-white/10 overflow-hidden shadow-lg space-y-2">
              <div className="aspect-video bg-black flex items-center justify-center relative group">
                {videoUrl ? (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    className="w-full h-full object-contain"
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-500 space-y-2">
                    <Video className="w-10 h-10 text-zinc-600" />
                    <span className="text-xs font-bold text-zinc-400">មិនទាន់មានវីដេអូ</span>
                    <p className="text-[10px] text-zinc-500">ជ្រើសរើស Video សម្រាយរឿង ដើម្បីចាក់ទន្ទឹមនឹងសំឡេង</p>
                  </div>
                )}
              </div>

              {/* Upload Video Selector */}
              <div className="p-3 pt-0 space-y-2">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setVideoFile(f);
                      setVideoUrl(URL.createObjectURL(f));
                      onShowToast(`🎬 បានផ្ទុកវីដេអូ "${f.name}"`, 'success');
                    }
                  }}
                  className="w-full text-[11px] text-zinc-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-indigo-600 file:text-white cursor-pointer"
                />
              </div>
            </div>

            {/* BGM Atmospheric Music Mixer */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                  <Music2 className="w-4 h-4 text-indigo-400" />
                  <span>តន្ត្រីផ្ទៃខាងក្រោយ (BGM & Atmosphere)</span>
                </div>
              </div>

              {/* BGM Presets */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-bold block">ជ្រើសរើស BGM បែបភាពយន្ត:</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {BGM_PRESETS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setSelectedBgm(b.id);
                        setCustomBgmUrl(b.url);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-left text-xs font-medium border transition-all ${
                        selectedBgm === b.id
                          ? 'bg-indigo-500/20 border-indigo-400 text-white shadow-sm'
                          : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 text-zinc-300'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* BGM Volume Slider */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">កម្រិតសម្លេង BGM (Volume):</span>
                  <span className="font-mono text-indigo-400 font-bold">{Math.round(bgmVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.02"
                  value={bgmVolume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setBgmVolume(v);
                    if (bgmAudioRef.current) bgmAudioRef.current.volume = v;
                  }}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                />
              </div>

              {/* Smart Auto-Ducking Checkbox */}
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={autoDucking}
                  onChange={(e) => setAutoDucking(e.target.checked)}
                  className="rounded bg-black/40 border-white/20 text-indigo-500 focus:ring-0 cursor-pointer"
                />
                <span>Smart Auto-Ducking (បន្ថយ BGM ពេលតួនិយាយ)</span>
              </label>
            </div>

            {/* Render Finished Video Direct Button */}
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-black border border-indigo-500/30 space-y-2.5">
              <span className="text-xs font-bold text-white block">🎬 Export វីដេអូសម្រាយរឿងពេញលេញ</span>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                ផ្គុំវីដេអូដើម + សំឡេងអ្នកសម្រាយ Master + តន្ត្រី BGM + Subtitle ចូលគ្នាក្លាយជាវីដេអូសម្រាយរឿងស្រេច។
              </p>
              <button
                type="button"
                onClick={renderVideoRecap}
                disabled={isRenderingVideo || !videoUrl || !doneCount}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40"
              >
                {isRenderingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                <span>{isRenderingVideo ? 'កំពុង Render វីដេអូ...' : 'Render វីដេអូសម្រាយរឿង'}</span>
              </button>

              {renderedVideoUrl && (
                <div className="pt-2">
                  <a
                    href={renderedVideoUrl}
                    download="movie_recap_finished.mp4"
                    className="w-full py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ទាញយក Video Finished</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
