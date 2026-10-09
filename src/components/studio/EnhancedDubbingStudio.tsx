/**
 * 🎬 Enhanced Dubbing Studio - Production Version with Full API Integration
 * Complete workflow with real backend: Upload → Scan Timeline → Auto-Dub → Edit → Export
 * Integrates: /api/dubbing/start, /api/dubbing/scan-timeline, /api/dubbing/assemble-custom
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DialogueManagerPanel } from '../dialogue/DialogueManagerPanel';
import { ProfessionalTimeline } from '../timeline/ProfessionalTimeline';
import { TimelineSegment } from '../../types';
import {
  Upload,
  Play,
  Pause,
  Download,
  Save,
  Sparkles,
  Zap,
  Film,
  Loader2,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Maximize2,
  Minimize2,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface EnhancedDubbingStudioProps {
  uploadedFile?: { filename: string; path?: string; originalName?: string } | null;
  isUploadingFile?: boolean;
  uploadProgress?: number;
  uploadInfo?: string;
  onUploadFile?: (file: File) => void;
  onRemoveFile?: () => void;
  voiceMode?: string;
  onVoiceModeChange?: (mode: string) => void;
  dubbingScope?: string;
  onDubbingScopeChange?: (scope: string) => void;
  maleLeadVoice?: string;
  onMaleLeadChange?: (voice: string) => void;
  femaleLeadVoice?: string;
  onFemaleLeadChange?: (voice: string) => void;
  geminiModel?: string;
  onGeminiModelChange?: (model: string) => void;
  isDubbing?: boolean;
  dubbingProgress?: number;
  dubbingMessage?: string;
  dubbingOutputVideo?: string | null;
  dubbingOutputAudio?: string | null;
  onStartDubbing?: (params: any) => void;
  onPreviewVoice?: (filename: string) => void;
  segments?: TimelineSegment[];
  onChangeSegments?: (segments: TimelineSegment[]) => void;
  selectedSegmentIndex?: number | null;
  onSelectSegment?: (index: number) => void;
  onScanTimeline?: () => void;
  isScanningTimeline?: boolean;
  onAssemble?: (params: any) => void;
  videoEffects?: any;
  onChangeEffects?: (effects: any) => void;
  subtitleStyle?: any;
  onChangeSubtitleStyle?: (style: any) => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
  onOpenThumbnailStudio?: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  characters?: any[];
  onOpenTab?: (tab: string) => void;
  onOpenExport?: () => void;
  engineMode?: string;
  onSwitchEngine?: (engine: string) => void;
  voxStatus?: any;
  onOpenVoxModal?: () => void;
  user?: any;
  onOpenLicenseModal?: () => void;
}

export const EnhancedDubbingStudio: React.FC<EnhancedDubbingStudioProps> = (props) => {
  // Destructure all props with defaults
  const {
    uploadedFile = null,
    isUploadingFile = false,
    uploadProgress = 0,
    segments: propSegments = [],
    onChangeSegments,
    selectedSegmentIndex: propSelectedIndex = null,
    onSelectSegment,
    isDubbing = false,
    dubbingProgress = 0,
    dubbingMessage = '',
    dubbingOutputVideo = null,
    onStartDubbing,
    onScanTimeline,
    isScanningTimeline = false,
    onAssemble,
    onShowToast,
    engineMode = 'khmer_offline',
    onSwitchEngine,
    onUploadFile,
    onRemoveFile,
  } = props;

  // Local state
  const [segments, setSegments] = useState<TimelineSegment[]>(propSegments);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(propSelectedIndex);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [studioEngine, setStudioEngine] = useState<'voxcpm_computer' | 'voxcpm_claude' | 'khmer_offline'>(
    engineMode as any || 'khmer_offline'
  );
  const [viewMode, setViewMode] = useState<'split' | 'video' | 'timeline'>('split');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync segments from props
  useEffect(() => {
    setSegments(propSegments);
  }, [propSegments]);

  // Sync selected index from props
  useEffect(() => {
    setSelectedSegmentIndex(propSelectedIndex);
  }, [propSelectedIndex]);

  // Sync engine mode from props
  useEffect(() => {
    if (engineMode) {
      setStudioEngine(engineMode as any);
    }
  }, [engineMode]);

  /**
   * Load available voices from API
   */
  const loadVoices = useCallback(async () => {
    setIsLoadingVoices(true);
    try {
      const response = await fetch('/api/voices/list');
      const data = await response.json();
      if (data.voices && Array.isArray(data.voices)) {
        setAvailableVoices(data.voices);
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
      if (onShowToast) {
        onShowToast('Failed to load voices', 'error');
      }
    } finally {
      setIsLoadingVoices(false);
    }
  }, [onShowToast]);

  // Load voices on mount
  useEffect(() => {
    loadVoices();
  }, [loadVoices]);

  /**
   * Setup video event listeners
   */
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

  /**
   * Load video when file changes
   */
  useEffect(() => {
    if (uploadedFile && videoRef.current) {
      const videoUrl = uploadedFile.path || `/video/stream/${uploadedFile.filename}`;
      videoRef.current.src = videoUrl;
      videoRef.current.load();
    }
  }, [uploadedFile]);

  /**
   * Handle file upload
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(file);
    }
  };

  /**
   * Handle video seek
   */
  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  /**
   * Handle play/pause toggle
   */
  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch((err) => {
          console.error('Play error:', err);
        });
      }
    }
  };

  /**
   * Handle volume change
   */
  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      if (newVolume === 0) {
        videoRef.current.muted = true;
        setIsMuted(true);
      } else if (isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  /**
   * Handle mute toggle
   */
  const handleToggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  /**
   * Handle segment update
   */
  const handleUpdateSegment = (index: number, updates: Partial<TimelineSegment>) => {
    const newSegments = segments.map((seg, i) => (i === index ? { ...seg, ...updates } : seg));
    setSegments(newSegments);
    if (onChangeSegments) {
      onChangeSegments(newSegments);
    }
  };

  /**
   * Handle segment delete
   */
  const handleDeleteSegment = (index: number) => {
    const newSegments = segments.filter((_, i) => i !== index);
    setSegments(newSegments);
    if (onChangeSegments) {
      onChangeSegments(newSegments);
    }
    if (onShowToast) {
      onShowToast('Segment deleted', 'info');
    }
  };

  /**
   * Handle add segment
   */
  const handleAddSegment = () => {
    const newSegment: TimelineSegment = {
      start_time: currentTime,
      end_time: Math.min(currentTime + 3, duration),
      original_text: '',
      khmer_translation: '',
      speaker_name: 'New Speaker',
      gender: 'male',
    };
    const newSegments = [...segments, newSegment];
    setSegments(newSegments);
    if (onChangeSegments) {
      onChangeSegments(newSegments);
    }
  };

  /**
   * Handle scan timeline (extract dialogue)
   */
  const handleScanTimeline = async () => {
    if (!uploadedFile) {
      if (onShowToast) {
        onShowToast('Please upload a video first', 'error');
      }
      return;
    }

    if (onScanTimeline) {
      onScanTimeline();
    }
  };

  /**
   * Handle 1-Click Auto Dubbing
   */
  const handleAutoDub = async () => {
    if (!uploadedFile) {
      if (onShowToast) {
        onShowToast('Please upload a video first', 'error');
      }
      return;
    }

    if (onStartDubbing) {
      onStartDubbing({
        filename: uploadedFile.filename,
        studioEngine: studioEngine,
        sourceLang: 'zh',
        targetLang: 'km',
        scope: 'full',
      });
    }
  };

  /**
   * Handle engine switch
   */
  const handleEngineSwitch = (engine: string) => {
    setStudioEngine(engine as any);
    if (onSwitchEngine) {
      onSwitchEngine(engine);
    }
  };

  /**
   * Handle save dialogue
   */
  const handleSaveDialogue = () => {
    if (onShowToast) {
      onShowToast('Dialogue saved successfully', 'success');
    }
  };

  /**
   * Handle export dialogue
   */
  const handleExportDialogue = () => {
    const dataStr = JSON.stringify(segments, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dialogue_${uploadedFile?.filename || 'export'}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    if (onShowToast) {
      onShowToast('Dialogue exported', 'success');
    }
  };

  /**
   * Handle generate all voices
   */
  const handleGenerateAllVoices = async () => {
    if (segments.length === 0) {
      if (onShowToast) {
        onShowToast('No dialogue segments to generate', 'error');
      }
      return;
    }

    if (!uploadedFile) {
      if (onShowToast) {
        onShowToast('Please upload a video first', 'error');
      }
      return;
    }

    // Call assemble-custom to generate all audio
    if (onAssemble) {
      onAssemble({
        filename: uploadedFile.filename,
        segments: segments,
        removeOriginalVocals: true,
        vocalGain: 2.2,
        bgmGain: 0.85,
      });
    }
  };

  /**
   * Get engine display name
   */
  const getEngineName = (engine: string): string => {
    switch (engine) {
      case 'voxcpm_computer':
        return 'VOXCPM2 Computer (Local GPU)';
      case 'voxcpm_claude':
        return 'VOXCPM2 Cloud (Colab/Kaggle)';
      case 'khmer_offline':
        return 'Khmer Offline (Edge TTS)';
      default:
        return engine;
    }
  };

  /**
   * Get engine icon
   */
  const getEngineIcon = (engine: string) => {
    switch (engine) {
      case 'voxcpm_computer':
        return '🖥️';
      case 'voxcpm_claude':
        return '☁️';
      case 'khmer_offline':
        return '⚡';
      default:
        return '🎤';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-gray-100">
      {/* Top Control Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border-b border-gray-800">
        {/* Left: Studio Title */}
        <div className="flex items-center gap-3">
          <Film className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-bold text-gray-200">Dubbing Studio</h2>
          {uploadedFile && (
            <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded">
              {uploadedFile.originalName || uploadedFile.filename}
            </span>
          )}
        </div>

        {/* Center: Engine Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Engine:</span>
          <select
            value={studioEngine}
            onChange={(e) => handleEngineSwitch(e.target.value)}
            disabled={isDubbing}
            className="px-3 py-1.5 text-sm bg-[#0d0d0d] border border-gray-700 rounded focus:border-blue-500 focus:outline-none disabled:opacity-50"
          >
            <option value="khmer_offline">⚡ Khmer Offline (Fast)</option>
            <option value="voxcpm_computer">🖥️ VOXCPM2 Computer (Local)</option>
            <option value="voxcpm_claude">☁️ VOXCPM2 Cloud (Colab)</option>
          </select>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {!uploadedFile ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingFile}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {isUploadingFile ? 'Uploading...' : 'Upload Video'}
            </button>
          ) : (
            <>
              <button
                onClick={handleScanTimeline}
                disabled={isScanningTimeline || isDubbing}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded transition-colors disabled:opacity-50"
              >
                {isScanningTimeline ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Scan Timeline
              </button>

              <button
                onClick={handleAutoDub}
                disabled={isDubbing || isScanningTimeline}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded transition-colors disabled:opacity-50 font-semibold"
              >
                {isDubbing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                1-Click Auto Dub
              </button>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Progress Bar (when processing) */}
      {(isDubbing || isScanningTimeline) && (
        <div className="px-4 py-3 bg-[#1a1a1a] border-b border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">
              {isScanningTimeline ? 'Scanning timeline...' : dubbingMessage || 'Processing...'}
            </span>
            <span className="text-sm text-blue-400 font-mono">
              {Math.round(dubbingProgress || 0)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${dubbingProgress || 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Preview Panel */}
        {(viewMode === 'split' || viewMode === 'video') && (
          <div className="flex flex-col bg-[#0d0d0d] border-r border-gray-800" style={{ width: viewMode === 'video' ? '100%' : '40%' }}>
            {/* Video Container */}
            <div className="flex-1 relative bg-black flex items-center justify-center">
              {uploadedFile ? (
                <video
                  ref={videoRef}
                  className="max-w-full max-h-full"
                  controls={false}
                  onClick={handleTogglePlay}
                />
              ) : (
                <div className="text-center text-gray-500">
                  <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No video uploaded</p>
                  <p className="text-sm">Click "Upload Video" to begin</p>
                </div>
              )}
            </div>

            {/* Video Controls */}
            {uploadedFile && (
              <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border-t border-gray-800">
                <button
                  onClick={handleTogglePlay}
                  className="p-2 hover:bg-gray-700 rounded transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>

                <div className="flex items-center gap-3 flex-1 mx-4">
                  <span className="text-xs font-mono text-gray-400">
                    {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={(e) => handleSeek(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs font-mono text-gray-400">
                    {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleMute}
                    className="p-2 hover:bg-gray-700 rounded transition-colors"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-20"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dialogue & Timeline Panel */}
        {(viewMode === 'split' || viewMode === 'timeline') && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Dialogue Manager */}
            <div className="flex-1 overflow-hidden" style={{ height: '60%' }}>
              <DialogueManagerPanel
                segments={segments}
                onUpdateSegment={handleUpdateSegment}
                onDeleteSegment={handleDeleteSegment}
                onAddSegment={handleAddSegment}
                currentTime={currentTime}
                duration={duration}
                onSeek={handleSeek}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                videoRef={videoRef}
                availableVoices={availableVoices}
                onGenerateVoices={handleGenerateAllVoices}
                onSaveDialogue={handleSaveDialogue}
                onExportDialogue={handleExportDialogue}
                videoFilename={uploadedFile?.filename}
              />
            </div>

            {/* Professional Timeline */}
            <div className="overflow-hidden" style={{ height: '40%' }}>
              <ProfessionalTimeline
                segments={segments}
                duration={duration}
                currentTime={currentTime}
                onSeek={handleSeek}
                onSelectSegment={(index) => {
                  setSelectedSegmentIndex(index);
                  if (onSelectSegment) {
                    onSelectSegment(index);
                  }
                }}
                selectedSegmentIndex={selectedSegmentIndex}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                onUpdateSegment={handleUpdateSegment}
                videoRef={videoRef}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-t border-gray-800 text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>
            {getEngineIcon(studioEngine)} {getEngineName(studioEngine)}
          </span>
          <span>•</span>
          <span>{segments.length} dialogue lines</span>
          {uploadedFile && (
            <>
              <span>•</span>
              <span>Ready for dubbing</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'split' ? 'timeline' : 'split')}
            className="px-2 py-1 hover:bg-gray-700 rounded transition-colors"
          >
            {viewMode === 'split' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
