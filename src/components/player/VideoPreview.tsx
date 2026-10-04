import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Camera,
  Subtitles,
  Download,
  Check,
  Shield,
  ShieldCheck,
  Sparkles,
  Tv,
  Box,
  Edit3,
  Move,
  Plus,
  Minus,
  RotateCw,
  X,
  Layers,
  Film,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ZoomIn,
  ZoomOut,
  Scan,
  RotateCcw,
  Star,
  Flame,
  Crown,
  Zap,
  Palette,
  Award,
  Megaphone,
  Smartphone,
} from 'lucide-react';
import { VideoEffects, SubtitleStyle, CommercialOverlayConfig } from '../../types';
import { LUT_PRESETS, EFFECT_3D_PRESETS, WATERMARK_STYLE_PRESETS } from '../effects/effectsLibrary';

interface VideoPreviewProps {
  commercialOverlay?: CommercialOverlayConfig;
  videoSrc?: string;
  src?: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isMuted: boolean;
  playbackRate: number;
  currentSubtitle?: string;
  showSubtitles?: boolean;
  onToggleSubtitles?: () => void;
  videoEffects?: VideoEffects;
  onChangeEffects?: (effects: VideoEffects) => void;
  subtitleStyle?: SubtitleStyle;
  videoRef?: React.RefObject<HTMLVideoElement>;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (dur: number) => void;
  onTogglePlay?: () => void;
  onPlayPause?: () => void;
  onToggleMute?: () => void;
  onMuteToggle?: () => void;
  onRateChange?: (rate: number) => void;
  onPlaybackRateChange?: (rate: number) => void;
  onStep?: (delta: number) => void;
  onOpenThumbnailStudio?: () => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  onToggleStyleText?: () => void;
  uploadedFile?: any;
  isUploadingFile?: boolean;
  uploadProgress?: number;
  uploadInfo?: { loadedMb: string; totalMb: string } | null;
  onUploadFile?: (file: File) => void;
  onRemoveFile?: () => void;
  videoSourceMode?: 'original' | 'dubbed';
  onVideoSourceModeChange?: (mode: 'original' | 'dubbed') => void;
  dubbingOutputVideo?: string | null;
}

function formatTimecode(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  src,
  videoSrc,
  currentTime,
  duration,
  isPlaying,
  isMuted,
  playbackRate,
  currentSubtitle,
  showSubtitles = true,
  onToggleSubtitles,
  videoEffects,
  onChangeEffects,
  subtitleStyle,
  videoRef: externalVideoRef,
  onTimeUpdate,
  onDurationChange,
  onTogglePlay,
  onPlayPause,
  onToggleMute,
  onMuteToggle,
  onRateChange,
  onPlaybackRateChange,
  onStep,
  onOpenThumbnailStudio,
  onShowToast,
  onToggleStyleText,
  uploadedFile,
  isUploadingFile = false,
  uploadProgress = 0,
  uploadInfo,
  onUploadFile,
  onRemoveFile,
  videoSourceMode = 'original',
  onVideoSourceModeChange,
  dubbingOutputVideo,
  commercialOverlay,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef || localVideoRef;
  const frameRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [capturedFeedback, setCapturedFeedback] = useState(false);

  // ─── Cinema UI State ──────────────────────────────────────────────
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferProgress, setBufferProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);
  const [hoverProgressX, setHoverProgressX] = useState(0);
  const volumeHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const actualSrc = videoSrc || src || '';
  const hasVideo = !!actualSrc;

  const handlePlayPause = onPlayPause || onTogglePlay || (() => {});
  const handleMuteToggle = onMuteToggle || onToggleMute || (() => {});
  const handleRateChange = onPlaybackRateChange || onRateChange || (() => {});

  // ─── Video Zoom & Pan State (មុខងារពង្រីក-ពង្រួមវីដេអូ & Fit/Fill) ─────────────
  const [localZoomScale, setLocalZoomScale] = useState<number>(videoEffects?.zoomScale ?? 1.0);
  const [localFitMode, setLocalFitMode] = useState<'contain' | 'cover'>(videoEffects?.zoomFitMode ?? 'contain');
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({
    x: videoEffects?.panX ?? 0,
    y: videoEffects?.panY ?? 0,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const panStartRef = useRef<{ startX: number; startY: number; initPanX: number; initPanY: number; moved: boolean } | null>(null);
  const pinchDistRef = useRef<number | null>(null);
  const zoomToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [zoomToastText, setZoomToastText] = useState<string | null>(null);

  // Sync if videoEffects changes externally
  useEffect(() => {
    if (videoEffects?.zoomScale !== undefined && videoEffects.zoomScale !== localZoomScale) {
      setLocalZoomScale(videoEffects.zoomScale);
    }
    if (videoEffects?.zoomFitMode !== undefined && videoEffects.zoomFitMode !== localFitMode) {
      setLocalFitMode(videoEffects.zoomFitMode);
    }
    if (videoEffects?.panX !== undefined && videoEffects?.panY !== undefined) {
      if (videoEffects.panX !== panOffset.x || videoEffects.panY !== panOffset.y) {
        setPanOffset({ x: videoEffects.panX, y: videoEffects.panY });
      }
    }
  }, [videoEffects?.zoomScale, videoEffects?.zoomFitMode, videoEffects?.panX, videoEffects?.panY]);

  const updateZoom = (scale: number, fit?: 'contain' | 'cover', resetPan = false) => {
    const clampedScale = Math.min(4.0, Math.max(0.5, +scale.toFixed(2)));
    const newFit = fit ?? localFitMode;
    setLocalZoomScale(clampedScale);
    setLocalFitMode(newFit);
    const newPan = resetPan ? { x: 0, y: 0 } : panOffset;
    if (resetPan) {
      setPanOffset(newPan);
    }
    if (onChangeEffects && videoEffects) {
      onChangeEffects({
        ...videoEffects,
        zoomScale: clampedScale,
        zoomFitMode: newFit,
        panX: newPan.x,
        panY: newPan.y,
      });
    }
    const modeLabel = newFit === 'cover' ? 'លាតពេញអេក្រង់ (Fill / Crop)' : `${Math.round(clampedScale * 100)}% (Fit)`;
    setZoomToastText(`🔍 ${modeLabel}`);
    if (zoomToastTimerRef.current) clearTimeout(zoomToastTimerRef.current);
    zoomToastTimerRef.current = setTimeout(() => setZoomToastText(null), 1800);
  };

  const handleToggleFitCover = () => {
    if (localFitMode === 'cover') {
      updateZoom(1.0, 'contain', true);
    } else {
      updateZoom(1.0, 'cover', true);
    }
  };

  const handleResetZoom = () => {
    updateZoom(1.0, 'contain', true);
  };

  // Pointer / Pan Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const isZoomed = localZoomScale > 1.05 || localFitMode === 'cover';
    panStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initPanX: panOffset.x,
      initPanY: panOffset.y,
      moved: false,
    };
    if (isZoomed) {
      setIsPanning(true);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      } catch (_) {}
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panStartRef.current) return;
    const dx = e.clientX - panStartRef.current.startX;
    const dy = e.clientY - panStartRef.current.startY;
    if (Math.hypot(dx, dy) > 4) {
      panStartRef.current.moved = true;
      setPanOffset({
        x: panStartRef.current.initPanX + dx,
        y: panStartRef.current.initPanY + dy,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const wasMoved = panStartRef.current?.moved;
    panStartRef.current = null;
    setIsPanning(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch (_) {}
    if (!wasMoved) {
      handlePlayPause();
    }
  };

  const handleDoubleClickVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (localFitMode === 'cover' || localZoomScale > 1.1) {
      handleResetZoom();
    } else {
      updateZoom(1.0, 'cover', true);
    }
  };

  const handleWheelVideo = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.altKey) {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      updateZoom(localZoomScale + delta, 'contain');
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchDistRef.current !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / pinchDistRef.current;
      if (Math.abs(ratio - 1) > 0.02) {
        updateZoom(localZoomScale * ratio, 'contain');
        pinchDistRef.current = currentDist;
      }
    }
  };

  const handleTouchEnd = () => {
    pinchDistRef.current = null;
  };

  // ─── Controls Auto-Hide ───────────────────────────────────────────
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (isPlaying) setControlsVisible(false);
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      setControlsVisible(true);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    } else {
      idleTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
    }
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isPlaying]);

  // ─── Buffer Progress ──────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const updateBuffer = () => {
      if (v.buffered.length > 0 && v.duration > 0) {
        setBufferProgress((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
      }
    };
    v.addEventListener('progress', updateBuffer);
    v.addEventListener('waiting', () => setIsBuffering(true));
    v.addEventListener('playing', () => setIsBuffering(false));
    v.addEventListener('canplay', () => setIsBuffering(false));
    return () => {
      v.removeEventListener('progress', updateBuffer);
    };
  }, [videoRef]);

  // ─── Sync volume state ────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume;
  }, [volume]);

  // ─── Existing state ───────────────────────────────────────────────
  const [isDraggingTitle, setIsDraggingTitle] = useState(false);
  const [isResizingTitle, setIsResizingTitle] = useState(false);
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineSubtitle, setInlineSubtitle] = useState('');
  const [inlineBadge, setInlineBadge] = useState('');

  const dragStartPos = useRef({ x: 0, y: 0, startPosX: 10, startPosY: 82 });
  const resizeStartPos = useRef({ x: 0, y: 0, startFontSize: 28 });

  const [isDraggingWatermark, setIsDraggingWatermark] = useState(false);
  const [isResizingWatermark, setIsResizingWatermark] = useState(false);
  const [isEditingWatermarkInline, setIsEditingWatermarkInline] = useState(false);
  const [inlineWatermarkText, setInlineWatermarkText] = useState('');

  const dragStartWmPos = useRef({ x: 0, y: 0, startPosX: 85, startPosY: 8 });
  const resizeStartWmPos = useRef({ x: 0, y: 0, startFontSize: 14 });

  useEffect(() => {
    if (videoEffects?.styleText) {
      setInlineTitle(videoEffects.styleText.title || '');
      setInlineSubtitle(videoEffects.styleText.subtitle || '');
      setInlineBadge(videoEffects.styleText.badge || '');
    }
  }, [videoEffects?.styleText?.title, videoEffects?.styleText?.subtitle, videoEffects?.styleText?.badge]);

  useEffect(() => {
    if (videoEffects?.watermark?.text) {
      setInlineWatermarkText(videoEffects.watermark.text);
    }
  }, [videoEffects?.watermark?.text]);

  useEffect(() => {
    if (videoRef.current && src) {
      try { videoRef.current.load(); } catch (_) {}
      onTimeUpdate(0);
    }
  }, [src]);

  useEffect(() => {
    if (!isDraggingTitle && !isResizingTitle && !isDraggingWatermark && !isResizingWatermark) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!frameRef.current || !onChangeEffects || !videoEffects) return;
      const rect = frameRef.current.getBoundingClientRect();
      if (isDraggingWatermark && videoEffects.watermark) {
        const dx = e.clientX - dragStartWmPos.current.x;
        const dy = e.clientY - dragStartWmPos.current.y;
        const newX = Math.max(2, Math.min(98, Math.round(dragStartWmPos.current.startPosX + (dx / rect.width) * 100)));
        const newY = Math.max(2, Math.min(98, Math.round(dragStartWmPos.current.startPosY + (dy / rect.height) * 100)));
        onChangeEffects({ ...videoEffects, watermark: { ...videoEffects.watermark, position: 'free', posX: newX, posY: newY } });
      } else if (isResizingWatermark && videoEffects.watermark) {
        const dx = e.clientX - resizeStartWmPos.current.x;
        const newSize = Math.max(10, Math.min(72, resizeStartWmPos.current.startFontSize + Math.round(dx * 0.2)));
        onChangeEffects({ ...videoEffects, watermark: { ...videoEffects.watermark, fontSize: newSize } });
      } else if (isDraggingTitle && videoEffects.styleText) {
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        const newX = Math.max(2, Math.min(98, Math.round(dragStartPos.current.startPosX + (dx / rect.width) * 100)));
        const newY = Math.max(2, Math.min(98, Math.round(dragStartPos.current.startPosY + (dy / rect.height) * 100)));
        onChangeEffects({ ...videoEffects, styleText: { ...videoEffects.styleText, position: 'free', posX: newX, posY: newY } });
      } else if (isResizingTitle && videoEffects.styleText) {
        const dx = e.clientX - resizeStartPos.current.x;
        const newSize = Math.max(14, Math.min(96, resizeStartPos.current.startFontSize + Math.round(dx * 0.25)));
        onChangeEffects({ ...videoEffects, styleText: { ...videoEffects.styleText, fontSize: newSize } });
      }
    };
    const handleMouseUp = () => {
      setIsDraggingTitle(false); setIsResizingTitle(false);
      setIsDraggingWatermark(false); setIsResizingWatermark(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isDraggingTitle, isResizingTitle, isDraggingWatermark, isResizingWatermark, videoEffects, onChangeEffects]);

  const handleScaleWmDelta = (delta: number) => {
    if (!videoEffects?.watermark || !onChangeEffects) return;
    const wm = videoEffects.watermark;
    const nextSize = Math.max(10, Math.min(72, (wm.fontSize || 14) + delta));
    onChangeEffects({ ...videoEffects, watermark: { ...wm, fontSize: nextSize } });
    onShowToast?.(`ទំហំ Watermark: ${nextSize}px`, 'info');
  };

  const handleToggleWmBadge = () => {
    if (!videoEffects?.watermark || !onChangeEffects) return;
    const wm = videoEffects.watermark;
    onChangeEffects({ ...videoEffects, watermark: { ...wm, showBadge: !wm.showBadge } });
    onShowToast?.(wm.showBadge ? 'ទម្រង់អក្សរសុទ្ធ (Clean Text)' : 'ទម្រង់ Badge ការពារ (Shield Badge)', 'info');
  };

  const handleSaveInlineWmEdit = () => {
    if (!videoEffects?.watermark || !onChangeEffects) return;
    onChangeEffects({ ...videoEffects, watermark: { ...videoEffects.watermark, text: inlineWatermarkText } });
    setIsEditingWatermarkInline(false);
    onShowToast?.('🎉 បានរក្សាទុកអក្សរ Watermark', 'success');
  };

  const handleMouseDownWatermark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const wm = videoEffects?.watermark;
    if (!wm) return;
    setIsDraggingWatermark(true);
    let defaultX = 85, defaultY = 8;
    if (wm.position === 'top-left') { defaultX = 12; defaultY = 8; }
    else if (wm.position === 'bottom-left') { defaultX = 12; defaultY = 90; }
    else if (wm.position === 'bottom-right') { defaultX = 85; defaultY = 90; }
    else if (wm.position === 'center') { defaultX = 50; defaultY = 50; }
    dragStartWmPos.current = { x: e.clientX, y: e.clientY, startPosX: wm.posX ?? defaultX, startPosY: wm.posY ?? defaultY };
  };

  const handleMouseDownWmResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    const wm = videoEffects?.watermark;
    if (!wm) return;
    setIsResizingWatermark(true);
    resizeStartWmPos.current = { x: e.clientX, y: e.clientY, startFontSize: wm.fontSize || 14 };
  };

  const handleScaleDelta = (delta: number) => {
    if (!videoEffects?.styleText || !onChangeEffects) return;
    const st = videoEffects.styleText;
    const nextSize = Math.max(14, Math.min(96, (st.fontSize || 28) + delta));
    onChangeEffects({ ...videoEffects, styleText: { ...st, fontSize: nextSize } });
    onShowToast?.(`ទំហំអក្សរ 3D: ${nextSize}px`, 'info');
  };

  const handleRotateDelta = (delta: number) => {
    if (!videoEffects?.styleText || !onChangeEffects) return;
    const st = videoEffects.styleText;
    const nextAngle = (((st.rotationAngle || 0) + delta + 180) % 360) - 180;
    onChangeEffects({ ...videoEffects, styleText: { ...st, rotationAngle: nextAngle } });
    onShowToast?.(`មុំបង្វិល: ${nextAngle}°`, 'info');
  };

  const handleToggleBanner = () => {
    if (!videoEffects?.styleText || !onChangeEffects) return;
    const st = videoEffects.styleText;
    onChangeEffects({ ...videoEffects, styleText: { ...st, showBanner: !st.showBanner } });
  };

  const handleSaveInlineEdit = () => {
    if (!videoEffects?.styleText || !onChangeEffects) return;
    onChangeEffects({ ...videoEffects, styleText: { ...videoEffects.styleText, title: inlineTitle, subtitle: inlineSubtitle, badge: inlineBadge } });
    setIsEditingInline(false);
    onShowToast?.('🎉 បានរក្សាទុកការកែសម្រួលអក្សរ 3D', 'success');
  };

  const handleMouseDownTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const st = videoEffects?.styleText;
    if (!st) return;
    setIsDraggingTitle(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY, startPosX: st.posX ?? 10, startPosY: st.posY ?? 82 };
  };

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    const st = videoEffects?.styleText;
    if (!st) return;
    setIsResizingTitle(true);
    resizeStartPos.current = { x: e.clientX, y: e.clientY, startFontSize: st.fontSize || 28 };
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying && v.paused) { v.play().catch(() => {}); }
    else if (!isPlaying && !v.paused) { v.pause(); }
  }, [isPlaying]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (Math.abs(v.currentTime - currentTime) > 0.3) v.currentTime = currentTime;
  }, [currentTime]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target instanceof HTMLElement) {
        const tagName = e.target.tagName.toLowerCase();
        if (tagName !== 'input' && tagName !== 'textarea') {
          e.preventDefault();
          handlePlayPause();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) { frameRef.current?.requestFullscreen?.(); }
    else { document.exitFullscreen?.(); }
  };

  // ─── Progress bar interaction ─────────────────────────────────────
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onTimeUpdate(pos * (duration || 60));
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverProgress(pos * (duration || 60));
    setHoverProgressX(e.clientX - rect.left);
    if (isDraggingProgress) onTimeUpdate(pos * (duration || 60));
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingProgress(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onTimeUpdate(pos * (duration || 60));
  };

  useEffect(() => {
    const up = () => setIsDraggingProgress(false);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  // ─── Volume slider hover ──────────────────────────────────────────
  const handleVolumeEnter = () => {
    if (volumeHideTimerRef.current) clearTimeout(volumeHideTimerRef.current);
    setShowVolumeSlider(true);
  };
  const handleVolumeLeave = () => {
    volumeHideTimerRef.current = setTimeout(() => setShowVolumeSlider(false), 500);
  };

  // ─── Instant snapshot ─────────────────────────────────────────────
  const handleInstantSnapshot = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v || v.videoWidth === 0) {
      onShowToast?.('⚠️ មិនអាចថតរូបបានទេ សូមរង់ចាំវីដេអូ Load សិន', 'error');
      return;
    }
    try {
      const c = document.createElement('canvas');
      c.width = v.videoWidth || 1920;
      c.height = v.videoHeight || 1080;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.drawImage(v, 0, 0, c.width, c.height);
        if (videoEffects?.letterbox) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, c.width, c.height * 0.1);
          ctx.fillRect(0, c.height * 0.9, c.width, c.height * 0.1);
        }
        if (videoEffects?.vignette) {
          const vig = ctx.createRadialGradient(c.width / 2, c.height / 2, c.width * 0.25, c.width / 2, c.height / 2, c.width * 0.7);
          vig.addColorStop(0, 'rgba(0,0,0,0)');
          vig.addColorStop(1, 'rgba(0,0,0,0.85)');
          ctx.fillStyle = vig;
          ctx.fillRect(0, 0, c.width, c.height);
        }
        if (videoEffects?.watermark?.enabled && videoEffects.watermark.text) {
          ctx.save();
          const wm = videoEffects.watermark;
          const fontSize = Math.round((wm.fontSize || 14) * (c.width / 1280));
          ctx.font = `bold ${fontSize}px "Outfit", "Kantumruy Pro", sans-serif`;
          ctx.globalAlpha = (wm.opacity || 85) / 100;
          ctx.fillStyle = wm.textColor || '#ffffff';
          ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 6;
          const padding = 32;
          let wmX = c.width - padding, wmY = padding + fontSize;
          ctx.textAlign = 'right';
          if (wm.position === 'top-left') { wmX = padding; ctx.textAlign = 'left'; }
          else if (wm.position === 'bottom-right') { wmY = c.height - padding; }
          else if (wm.position === 'bottom-left') { wmX = padding; wmY = c.height - padding; ctx.textAlign = 'left'; }
          else if (wm.position === 'center') { wmX = c.width / 2; wmY = c.height / 2; ctx.textAlign = 'center'; }
          ctx.fillText(wm.text, wmX, wmY);
          ctx.restore();
        }
        if (videoEffects?.styleText?.enabled && videoEffects.styleText.title) {
          ctx.save();
          const st = videoEffects.styleText;
          const scale = c.width / 1280;
          const titleSize = Math.round((st.fontSize || 28) * scale);
          const subSize = Math.round((st.subtitleFontSize || 14) * scale);
          const isFree = st.position === 'free' || (st.posX !== undefined && st.posY !== undefined);
          const align = st.textAlign || (st.position === 'top' || st.position === 'center' || st.position === 'bottom-center' ? 'center' : st.position === 'bottom-right' ? 'right' : 'left');
          const posX = isFree ? (c.width * (st.posX ?? 10)) / 100 : 48;
          const posY = isFree ? (c.height * (st.posY ?? 82)) / 100 : c.height - 48;
          ctx.translate(posX, posY);
          if (st.rotationAngle) ctx.rotate((st.rotationAngle * Math.PI) / 180);
          ctx.textAlign = align;
          ctx.font = `bold ${titleSize}px "${st.fontFamily || 'Koulen'}", "Kantumruy Pro", sans-serif`;
          const depth = Math.round(5 * scale);
          ctx.fillStyle = '#0a0d14';
          for (let d = depth; d >= 1; d--) { ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 4; ctx.shadowOffsetX = d; ctx.shadowOffsetY = d; ctx.fillText(st.title, d, d); }
          ctx.shadowColor = st.stylePreset === 'fire' ? '#ea580c' : st.stylePreset === 'neon' ? '#06b6d4' : '#eab308';
          ctx.shadowBlur = Math.round(14 * scale);
          ctx.fillStyle = st.stylePreset === 'neon' ? '#67e8f9' : st.stylePreset === 'fire' ? '#fed7aa' : '#fef08a';
          ctx.fillText(st.title, 0, 0);
          if (st.subtitle) {
            ctx.font = `500 ${subSize}px "Kantumruy Pro", sans-serif`;
            ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 6; ctx.fillStyle = '#e2e8f0';
            ctx.fillText(st.subtitle, 0, subSize + 6);
          }
          ctx.restore();
        }
        const dataUrl = c.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.download = `thumbnail_capture_${Math.round(currentTime)}s.jpg`;
        link.href = dataUrl; link.click();
        setCapturedFeedback(true);
        setTimeout(() => setCapturedFeedback(false), 2000);
        onShowToast?.('📸 បានថត និងទាញយករូបភាព Thumbnail Full HD (រួមទាំង Watermark & Style) ភ្លាមៗ!', 'success');
      }
    } catch (err: any) {
      onShowToast?.(`កំហុសថតរូប: ${err.message}`, 'error');
    }
  };

  // ─── Effects / filters ────────────────────────────────────────────
  const matchedLut = LUT_PRESETS.find((p) => p.id === videoEffects?.lutPreset);
  const lutFilter = matchedLut && matchedLut.cssFilter !== 'none' ? matchedLut.cssFilter : '';
  const active3dPreset = videoEffects?.effect3dEnabled ? EFFECT_3D_PRESETS.find((p) => p.id === videoEffects?.effect3dPreset) : null;
  const transform3dStyle = active3dPreset?.transform3d || '';
  const filter3dStyle = active3dPreset?.filter3d || '';
  const perspective3d = active3dPreset?.perspective ? `${active3dPreset.perspective}px` : '900px';
  const motion3dClass = active3dPreset?.motionClass || '';

  const filterString = videoEffects
    ? [`brightness(${videoEffects.brightness}%)`, `contrast(${videoEffects.contrast}%)`, `saturate(${videoEffects.saturation}%)`, `sepia(${videoEffects.sepia}%)`, videoEffects.blur > 0 ? `blur(${videoEffects.blur}px)` : '', lutFilter, filter3dStyle].filter(Boolean).join(' ')
    : 'none';

  const socialCanvas = videoEffects?.socialCanvasStyle;
  const effectiveRatio = socialCanvas?.enabled ? socialCanvas.canvasRatio : videoEffects?.aspectRatio;

  const aspectClass =
    effectiveRatio === '9:16' ? 'aspect-[9/16] h-full max-w-full'
    : effectiveRatio === '4:5' ? 'aspect-[4/5] h-full max-w-full'
    : effectiveRatio === '1:1' ? 'aspect-square h-full max-w-full'
    : effectiveRatio === '4:3' ? 'aspect-[4/3] h-full max-w-full'
    : 'aspect-video h-full max-w-full';

  // ─── FX active check ──────────────────────────────────────────────
  const hasActiveEffects = !!(
    videoEffects?.sponsorInVideo?.enabled ||
    videoEffects?.socialCanvasStyle?.enabled ||
    videoEffects?.runningTickerText?.enabled ||
    videoEffects?.effect3dEnabled ||
    videoEffects?.lutPreset ||
    videoEffects?.vignette ||
    videoEffects?.filmGrain ||
    videoEffects?.vhsGlitch ||
    videoEffects?.glowBloom ||
    videoEffects?.letterbox ||
    (videoEffects?.brightness && videoEffects.brightness !== 100) ||
    (videoEffects?.contrast && videoEffects.contrast !== 100) ||
    (videoEffects?.saturation && videoEffects.saturation !== 100)
  );

  // ─── Filename display ─────────────────────────────────────────────
  const displayFilename = uploadedFile?.name || (actualSrc ? actualSrc.split('/').pop()?.split('\\').pop() || 'Video' : null);

  const playedPct = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div
      ref={playerContainerRef}
      className="w-full h-full flex flex-col items-center justify-between relative overflow-hidden bg-black rounded-xl"
      onMouseMove={showControls}
      onMouseEnter={showControls}
      onClick={showControls}
    >
      {/* ── Ambient Glow ────────────────────────────────────────────── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[420px] bg-gradient-to-tr from-cyan-500/10 via-violet-600/10 to-indigo-500/5 blur-3xl pointer-events-none rounded-full" />

      {/* ── Video Canvas ─────────────────────────────────────────────── */}
      <div className="flex-1 w-full min-h-0 flex items-center justify-center relative p-1">
        <div
          ref={frameRef}
          className={`relative ${aspectClass} max-h-full max-w-full bg-black rounded-2xl shadow-2xl flex items-center justify-center overflow-hidden border border-white/10 transition-all group`}
        >
          {/* ── Social Canvas Background (TikTok/FB Page) ── */}
          {socialCanvas?.enabled && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
              {socialCanvas.backgroundType === 'blur_video' && hasVideo ? (
                <video
                  src={actualSrc}
                  playsInline
                  muted
                  loop
                  autoPlay={isPlaying}
                  className="w-full h-full object-cover scale-150 transition-all duration-300"
                  style={{
                    filter: `blur(${socialCanvas.blurAmount || 20}px) brightness(0.55)`,
                  }}
                  ref={(bgEl) => {
                    if (bgEl && videoRef.current) {
                      if (Math.abs(bgEl.currentTime - videoRef.current.currentTime) > 0.4) {
                        bgEl.currentTime = videoRef.current.currentTime;
                      }
                      if (isPlaying && bgEl.paused) bgEl.play().catch(() => {});
                      else if (!isPlaying && !bgEl.paused) bgEl.pause();
                    }
                  }}
                />
              ) : socialCanvas.backgroundType === 'cinema_gradient' ? (
                <div className="w-full h-full bg-gradient-to-b from-[#0b1329] via-[#0f172a] to-[#020617]" />
              ) : socialCanvas.backgroundType === 'neon_glow' ? (
                <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/40 via-purple-900/30 to-black" />
              ) : socialCanvas.backgroundType === 'cyber_mesh' ? (
                <div className="w-full h-full bg-[#0a0f1d] bg-[linear-gradient(to_right,#1e293b22_1px,transparent_1px),linear-gradient(to_bottom,#1e293b22_1px,transparent_1px)] bg-[size:20px_20px]" />
              ) : (
                <div className="w-full h-full bg-[#07090e]" />
              )}
            </div>
          )}

          {/* 3D Spatial Wrapper */}
          <div
            className={`w-full h-full relative flex items-center justify-center transition-all duration-300 z-10 ${motion3dClass}`}
            style={{
              perspective: videoEffects?.effect3dEnabled ? perspective3d : undefined,
              transform: videoEffects?.effect3dEnabled && transform3dStyle ? transform3dStyle : undefined,
              transformStyle: videoEffects?.effect3dEnabled ? 'preserve-3d' : undefined,
            }}
          >
            {hasVideo ? (
              <div
                className={`w-full h-full relative overflow-hidden flex items-center justify-center select-none ${
                  localZoomScale > 1.05 || localFitMode === 'cover'
                    ? isPanning
                      ? 'cursor-grabbing'
                      : 'cursor-grab'
                    : 'cursor-pointer'
                }`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onDoubleClick={handleDoubleClickVideo}
                onWheel={handleWheelVideo}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                title={localZoomScale > 1.05 || localFitMode === 'cover' ? "ចុចអូសដើម្បីរំកិល (Drag to Pan) • ចុចពីរដងដើម្បី Reset" : "ចុចពីរដងដើម្បីពង្រីក (Double-click to Zoom)"}
              >
                <video
                  key={actualSrc}
                  ref={videoRef}
                  src={actualSrc}
                  playsInline
                  crossOrigin="anonymous"
                  preload="auto"
                  style={{
                    filter: filterString,
                    transform: `scale(${localZoomScale}) translate(${panOffset.x / localZoomScale}px, ${panOffset.y / localZoomScale}px)`,
                    objectFit: localFitMode === 'cover' ? 'cover' : 'contain',
                    transformOrigin: 'center center',
                  }}
                  onTimeUpdate={() => { if (videoRef.current) onTimeUpdate(videoRef.current.currentTime); }}
                  onLoadedMetadata={() => { if (videoRef.current) onDurationChange(videoRef.current.duration); }}
                  onError={() => { console.warn("Video failed to load:", src); }}
                  className="w-full h-full pointer-events-none transition-transform duration-75"
                />
              </div>
            ) : (
              /* ── No-Video Placeholder ─────────────────────────────── */
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#0a0a0c] text-zinc-500 gap-4 select-none">
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-zinc-900/80 border border-white/[0.08] flex items-center justify-center">
                    <Film className="w-9 h-9 text-zinc-500 stroke-[1.5] animate-pulse" style={{ animationDuration: '2.5s' }} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>
                <div className="text-center space-y-1.5">
                  <p className="text-sm font-semibold text-zinc-300 font-khmer">គ្មានវីដេអូត្រូវបានជ្រើសរើស</p>
                  <p className="text-xs text-zinc-500 font-khmer">សូម Upload ឬជ្រើសរើសវីដេអូដើម្បីចាប់ផ្តើម</p>
                </div>
                {onUploadFile && (
                  <label className="cursor-pointer group/upload">
                    <input type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f && onUploadFile) onUploadFile(f); }} />
                    <div className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/30 hover:border-emerald-400/60 text-emerald-300 text-xs font-semibold flex items-center gap-2 transition-all">
                      <Download className="w-3.5 h-3.5" />
                      <span>ជ្រើសរើសឯកសារ</span>
                    </div>
                  </label>
                )}
              </div>
            )}

            {/* ── 3D Overlay Types ─────────────────────────────────── */}
            {videoEffects?.effect3dEnabled && active3dPreset?.overlayType === 'cyber_grid' && <div className="absolute inset-0 pointer-events-none z-10 overlay-cyber-grid" />}
            {videoEffects?.effect3dEnabled && active3dPreset?.overlayType === 'starfield' && <div className="absolute inset-0 pointer-events-none z-10 overlay-starfield" />}
            {videoEffects?.effect3dEnabled && active3dPreset?.overlayType === 'embers' && <div className="absolute inset-0 pointer-events-none z-10 overlay-embers" />}
            {videoEffects?.effect3dEnabled && active3dPreset?.overlayType === 'god_rays' && <div className="absolute inset-0 pointer-events-none z-10 overlay-god-rays" />}
            {videoEffects?.effect3dEnabled && active3dPreset?.overlayType === 'sakura_depth' && <div className="absolute inset-0 pointer-events-none z-10 overlay-sakura-depth" />}
            {videoEffects?.effect3dEnabled && active3dPreset?.overlayType === 'snow_depth' && <div className="absolute inset-0 pointer-events-none z-10 overlay-snow-depth" />}
            {videoEffects?.effect3dEnabled && active3dPreset?.overlayType === 'matrix_cube' && <div className="absolute inset-0 pointer-events-none z-10 overlay-matrix-cube" />}
            {videoEffects?.effect3dEnabled && active3dPreset?.overlayType === 'anaglyph' && <div className="absolute inset-0 pointer-events-none z-10 overlay-anaglyph" />}
            {videoEffects?.effect3dEnabled && active3dPreset?.overlayType === 'hologram_rings' && <div className="absolute inset-0 pointer-events-none z-10 overlay-hologram-rings" />}

            {/* ── Center Play Overlay when paused ──────────────────── */}
            {!isPlaying && hasVideo && (
              <div
                onClick={handlePlayPause}
                className="absolute inset-0 flex items-center justify-center cursor-pointer z-[15] group/playbtn"
              >
                <div
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-[0_0_40px_rgba(52,211,153,0.5)] transform group-hover/playbtn:scale-110 active:scale-95 transition-all"
                  style={{ boxShadow: '0 0 40px rgba(52,211,153,0.5), 0 0 80px rgba(52,211,153,0.2)' }}
                >
                  <Play className="w-7 h-7 fill-white text-white translate-x-0.5" />
                </div>
              </div>
            )}
          </div>

          {/* ── Letterbox Bars ───────────────────────────────────────── */}
          {videoEffects?.letterbox && (
            <>
              <div className="absolute top-0 left-0 right-0 h-[10%] bg-black z-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-black z-10 pointer-events-none" />
            </>
          )}

          {/* ── Vignette ─────────────────────────────────────────────── */}
          {videoEffects?.vignette && (
            <div className="absolute inset-0 pointer-events-none z-10 [background:radial-gradient(circle,transparent_52%,rgba(0,0,0,0.85)_100%)]" />
          )}

          {/* ── Film Grain ───────────────────────────────────────────── */}
          {videoEffects?.filmGrain && (
            <div className="absolute inset-0 pointer-events-none z-10 opacity-30 mix-blend-overlay"
              style={{ backgroundImage: 'radial-gradient(#fff 1px,transparent 1px),radial-gradient(#000 1px,transparent 1px)', backgroundSize: '4px 4px', backgroundPosition: '0 0, 2px 2px' }}
            />
          )}

          {/* ── VHS Scanlines ────────────────────────────────────────── */}
          {videoEffects?.vhsGlitch && (
            <div className="absolute inset-0 pointer-events-none z-10 opacity-30 mix-blend-overlay"
              style={{ backgroundImage: 'repeating-linear-gradient(rgba(0,0,0,0) 0px,rgba(0,0,0,0) 2px,rgba(0,0,0,0.5) 3px)' }}
            />
          )}

          {/* ── Glow Bloom ───────────────────────────────────────────── */}
          {videoEffects?.glowBloom && (
            <div className="absolute inset-0 pointer-events-none z-10 bg-amber-400/10 mix-blend-screen backdrop-blur-[0.5px]" />
          )}

          {/* ── Watermark ────────────────────────────────────────────── */}
          {videoEffects?.watermark?.enabled && videoEffects.watermark.text && (() => {
            const wm = videoEffects.watermark;
            const wmPreset = WATERMARK_STYLE_PRESETS.find(p => p.id === (wm.stylePreset || 'theatrical_gold')) || WATERMARK_STYLE_PRESETS[0];
            const effectiveIcon = wm.icon || wmPreset.iconType;
            const effectiveFont = wm.fontFamily || wmPreset.fontFamily || 'Outfit';
            const isFree = wm.position === 'free' || (wm.posX !== undefined && wm.posY !== undefined);
            let positionStyle: React.CSSProperties = {};
            if (isFree) { positionStyle = { left: `${wm.posX ?? 85}%`, top: `${wm.posY ?? 8}%`, transform: 'translate(-50%,-50%)' }; }
            else if (wm.position === 'top-left') { positionStyle = { top: '1rem', left: '1rem' }; }
            else if (wm.position === 'top-right') { positionStyle = { top: '3.5rem', right: '1rem' }; }
            else if (wm.position === 'bottom-left') { positionStyle = { bottom: '2.5rem', left: '1rem' }; }
            else if (wm.position === 'bottom-right') { positionStyle = { bottom: '2.5rem', right: '1rem' }; }
            else { positionStyle = { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }; }

            const renderWmIcon = () => {
              if (effectiveIcon === 'none') return null;
              const cl = "w-3.5 h-3.5 shrink-0";
              const col = wmPreset.iconColor;
              switch (effectiveIcon) {
                case 'shield': return <ShieldCheck className={cl} style={{ color: col }} />;
                case 'crown': return <Crown className={cl} style={{ color: col }} />;
                case 'star': return <Star className={`${cl} fill-current`} style={{ color: col }} />;
                case 'flame': return <Flame className={cl} style={{ color: col }} />;
                case 'sparkle': return <Sparkles className={cl} style={{ color: col }} />;
                case 'zap': return <Zap className={cl} style={{ color: col }} />;
                case 'tv': return <Tv className={cl} style={{ color: col }} />;
                case 'camera': return <Camera className={cl} style={{ color: col }} />;
                default: return <ShieldCheck className={cl} style={{ color: col }} />;
              }
            };

            const handleCycleWmStyle = (e: React.MouseEvent) => {
              e.stopPropagation();
              const currentIndex = WATERMARK_STYLE_PRESETS.findIndex(p => p.id === (wm.stylePreset || 'theatrical_gold'));
              const nextIndex = (currentIndex + 1) % WATERMARK_STYLE_PRESETS.length;
              const nextPreset = WATERMARK_STYLE_PRESETS[nextIndex];
              if (onChangeEffects && videoEffects) {
                onChangeEffects({
                  ...videoEffects,
                  watermark: {
                    ...wm,
                    stylePreset: nextPreset.id,
                    icon: nextPreset.iconType as any,
                    textColor: nextPreset.textColor,
                    fontFamily: nextPreset.fontFamily,
                  }
                });
              }
              onShowToast?.(`🎨 ម៉ូដ Watermark: ${nextPreset.label}`, 'info');
            };

            return (
              <div className="absolute z-20 select-none group/wm pointer-events-auto" style={positionStyle}>
                <div onMouseDown={handleMouseDownWatermark} onDoubleClick={() => setIsEditingWatermarkInline(true)}
                  className="relative transition-all cursor-grab active:cursor-grabbing p-1 rounded-xl group-hover/wm:ring-2 group-hover/wm:ring-amber-400/80 group-hover/wm:bg-black/40 group-hover/wm:backdrop-blur-sm flex items-center gap-1.5"
                  style={{ opacity: (wm.opacity || 85) / 100 }}
                >
                  <div onMouseDown={(e) => e.stopPropagation()} className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 rounded-xl bg-black/90 backdrop-blur-md border border-white/20 shadow-2xl opacity-0 group-hover/wm:opacity-100 transition-opacity z-30 pointer-events-auto shrink-0 whitespace-nowrap">
                    <button type="button" onClick={() => setIsEditingWatermarkInline(true)} className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1 transition-colors"><Edit3 className="w-3 h-3" /><span>កែអក្សរ</span></button>
                    <div className="h-3 w-[1px] bg-white/20" />
                    <button type="button" onClick={handleCycleWmStyle} className="px-2 py-0.5 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 text-[10px] font-bold flex items-center gap-1 transition-colors" title="ចុចដើម្បីប្តូរម៉ូដ Style បន្ទាប់"><Palette className="w-3 h-3" /><span>{wmPreset.label.split(' ')[1] || 'ម៉ូដ'}</span></button>
                    <div className="h-3 w-[1px] bg-white/20" />
                    <button type="button" onClick={() => handleScaleWmDelta(2)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"><Plus className="w-3 h-3" /></button>
                    <button type="button" onClick={() => handleScaleWmDelta(-2)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"><Minus className="w-3 h-3" /></button>
                    <div className="h-3 w-[1px] bg-white/20" />
                    <button type="button" onClick={handleToggleWmBadge} className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold transition-colors ${wm.showBadge ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40' : 'bg-white/10 text-slate-300'}`}>{wm.showBadge ? 'Badge' : 'Text'}</button>
                  </div>
                  <div onMouseDown={handleMouseDownWmResize} className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg flex items-center justify-center cursor-nwse-resize hover:scale-125 transition-transform z-30 opacity-0 group-hover/wm:opacity-100"><Move className="w-2.5 h-2.5 rotate-45" /></div>
                  {isEditingWatermarkInline ? (
                    <div onMouseDown={(e) => e.stopPropagation()} className="flex items-center gap-1.5 p-1 bg-black/90 rounded-lg border border-amber-400 shadow-2xl z-40">
                      <input type="text" value={inlineWatermarkText} onChange={(e) => setInlineWatermarkText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveInlineWmEdit(); if (e.key === 'Escape') setIsEditingWatermarkInline(false); }} autoFocus className="px-2 py-0.5 text-xs bg-slate-900 border border-white/20 rounded text-white focus:outline-none focus:border-amber-400 w-44" />
                      <button type="button" onClick={handleSaveInlineWmEdit} className="p-1 rounded bg-amber-500 text-black hover:bg-amber-400"><Check className="w-3 h-3" /></button>
                      <button type="button" onClick={() => setIsEditingWatermarkInline(false)} className="p-1 rounded bg-white/10 text-white hover:bg-white/20"><X className="w-3 h-3" /></button>
                    </div>
                  ) : wm.showBadge ? (
                    <div
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md transition-all shadow-lg text-white"
                      style={{
                        background: wmPreset.badgeBg,
                        border: wmPreset.badgeBorder,
                        boxShadow: wmPreset.badgeShadow,
                      }}
                    >
                      {renderWmIcon()}
                      <span
                        className="font-bold tracking-wide"
                        style={{
                          fontSize: `${wm.fontSize || 13}px`,
                          fontFamily: `"${effectiveFont}", sans-serif`,
                          color: wmPreset.textGradient ? undefined : (wm.textColor || wmPreset.textColor),
                          backgroundImage: wmPreset.textGradient,
                          WebkitBackgroundClip: wmPreset.textGradient ? 'text' : undefined,
                          WebkitTextFillColor: wmPreset.textGradient ? 'transparent' : undefined,
                          textShadow: wmPreset.textShadow,
                        }}
                      >
                        {wm.text}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      {renderWmIcon()}
                      <span
                        className="font-bold tracking-wide drop-shadow-md"
                        style={{
                          fontSize: `${wm.fontSize || 13}px`,
                          fontFamily: `"${effectiveFont}", sans-serif`,
                          color: wmPreset.textGradient ? undefined : (wm.textColor || wmPreset.textColor),
                          backgroundImage: wmPreset.textGradient,
                          WebkitBackgroundClip: wmPreset.textGradient ? 'text' : undefined,
                          WebkitTextFillColor: wmPreset.textGradient ? 'transparent' : undefined,
                          textShadow: wmPreset.textShadow || '0 2px 4px rgba(0,0,0,0.9)',
                        }}
                      >
                        {wm.text}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ── Styled 3D Title ──────────────────────────────────────── */}
          {videoEffects?.styleText?.enabled && videoEffects.styleText.title && (() => {
            const st = videoEffects.styleText;
            const isFree = st.position === 'free' || (st.posX !== undefined && st.posY !== undefined);
            const align = st.textAlign || (st.position === 'top' || st.position === 'center' || st.position === 'bottom-center' ? 'center' : st.position === 'bottom-right' ? 'right' : 'left');
            return (
              <div className="absolute z-20 select-none flex flex-col group/styletext pointer-events-auto"
                style={isFree
                  ? { left: `${st.posX ?? 10}%`, top: `${st.posY ?? 82}%`, transform: `translate(${align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0'}, -50%) rotate(${st.rotationAngle || 0}deg)`, alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start', textAlign: align }
                  : st.position === 'top' ? { top: '1.5rem', left: '1.5rem', right: '1.5rem', alignItems: 'center', textAlign: 'center' }
                  : st.position === 'center' ? { top: '50%', left: '50%', transform: 'translate(-50%,-50%)', alignItems: 'center', textAlign: 'center' }
                  : st.position === 'bottom-center' ? { bottom: '4rem', left: '1.5rem', right: '1.5rem', alignItems: 'center', textAlign: 'center' }
                  : st.position === 'bottom-right' ? { bottom: '4rem', right: '1.5rem', alignItems: 'flex-end', textAlign: 'right' }
                  : { bottom: '4rem', left: '1.5rem', alignItems: 'flex-start', textAlign: 'left' }}
              >
                <div onMouseDown={handleMouseDownTitle} onDoubleClick={() => setIsEditingInline(true)}
                  className={`relative max-w-[90%] transition-all cursor-grab active:cursor-grabbing rounded-2xl ${st.showBanner ? 'px-4 py-2.5 bg-black/75 backdrop-blur-md border border-white/20 shadow-2xl group-hover/styletext:border-sky-400/90' : 'p-1 group-hover/styletext:ring-2 group-hover/styletext:ring-sky-400/80 group-hover/styletext:rounded-xl'}`}
                  style={{ alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start', display: 'flex', flexDirection: 'column' }}
                >
                  <div onMouseDown={(e) => e.stopPropagation()} className="absolute -top-11 left-0 flex items-center gap-1.5 p-1 rounded-xl bg-black/90 backdrop-blur-md border border-white/20 shadow-2xl opacity-0 group-hover/styletext:opacity-100 transition-opacity z-30 pointer-events-auto">
                    <button type="button" onClick={() => setIsEditingInline(true)} className="px-2 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[10.5px] font-bold flex items-center gap-1 transition-colors"><Edit3 className="w-3 h-3" /><span>កែអក្សរ</span></button>
                    <div className="h-3 w-[1px] bg-white/20" />
                    <button type="button" onClick={() => handleScaleDelta(3)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => handleScaleDelta(-3)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                    <div className="h-3 w-[1px] bg-white/20" />
                    <button type="button" onClick={() => handleRotateDelta(5)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 transition-colors"><RotateCw className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={handleToggleBanner} className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${st.showBanner ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/10 text-slate-400'}`}>Card</button>
                  </div>
                  <div onMouseDown={handleMouseDownResize} className="absolute -bottom-2.5 -right-2.5 w-6 h-6 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 text-white shadow-lg flex items-center justify-center cursor-nwse-resize hover:scale-125 transition-transform z-30 opacity-0 group-hover/styletext:opacity-100"><Move className="w-3 h-3 rotate-45" /></div>
                  {st.badge && (
                    <span className="inline-block px-2.5 py-0.5 mb-1.5 rounded-md bg-gradient-to-r from-rose-600 to-amber-600 text-white font-mono font-bold text-[10.5px] shadow-md border border-white/20">{st.badge}</span>
                  )}
                  <h2 className={`font-bold tracking-wide leading-tight ${(() => {
                    const p = st.stylePreset;
                    if (p === 'gold3d' || p === '3d_text_gold3d') return 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-300 to-amber-600 drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]';
                    if (p === 'cyberpunk' || p === '3d_text_cyberpunk') return 'text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-pink-400 to-purple-400 drop-shadow-[0_0_14px_#38bdf8]';
                    if (p === 'silver_blade' || p === '3d_text_silver_blade') return 'text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-400 drop-shadow-[0_4px_10px_rgba(148,163,184,0.8)]';
                    if (p === 'fire' || p === '3d_text_lava_dragon') return 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-orange-500 to-red-600 drop-shadow-[0_4px_14px_rgba(234,88,12,0.9)]';
                    if (p === 'neon' || p === '3d_text_plasma_shock') return 'text-cyan-300 drop-shadow-[0_0_16px_#06b6d4]';
                    if (p === 'diamond_prism' || p === '3d_text_diamond_prism') return 'text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-200 to-blue-200 drop-shadow-[0_0_12px_#bae6fd]';
                    if (p === 'jade_celestial' || p === '3d_text_jade_celestial') return 'text-transparent bg-clip-text bg-gradient-to-b from-emerald-100 via-emerald-300 to-emerald-700 drop-shadow-[0_4px_10px_rgba(5,150,105,0.8)]';
                    if (p === 'mecha_chrome' || p === '3d_text_mecha_chrome') return 'text-transparent bg-clip-text bg-gradient-to-b from-slate-100 via-slate-300 to-zinc-600 drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)]';
                    if (p === 'crimson_shadow' || p === '3d_text_crimson_shadow') return 'text-transparent bg-clip-text bg-gradient-to-b from-rose-200 via-red-500 to-red-900 drop-shadow-[0_4px_12px_rgba(185,28,28,0.9)]';
                    if (p === 'glacier_ice' || p === '3d_text_glacier_ice') return 'text-transparent bg-clip-text bg-gradient-to-b from-white via-sky-300 to-blue-600 drop-shadow-[0_0_14px_#0284c7]';
                    if (p === 'synthwave_80s' || p === '3d_text_synthwave_80s') return 'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 drop-shadow-[0_0_12px_#e879f9]';
                    if (p === 'khmer_royal' || p === '3d_text_khmer_royal') return 'text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-yellow-400 to-amber-700 drop-shadow-[0_4px_10px_rgba(180,83,9,0.9)]';
                    if (p === 'sapphire' || p === '3d_text_ocean_wave') return 'text-transparent bg-clip-text bg-gradient-to-b from-blue-100 via-sky-400 to-blue-700 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]';
                    if (p === 'glass' || p === '3d_text_glass_frost') return 'text-white/95 backdrop-blur-md drop-shadow-[0_4px_12px_rgba(255,255,255,0.4)]';
                    if (p === 'anime') return 'text-amber-300 drop-shadow-[0_0_14px_rgba(245,158,11,0.9)]';
                    if (p === 'cinema' || p === '3d_text_hollywood_bold') return 'text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)]';
                    return 'text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]';
                  })()}`}
                    style={{ fontSize: `${st.fontSize || 28}px`, fontFamily: st.fontFamily || 'Koulen', textShadow: st.stylePreset === 'gold3d' ? '0 3px 6px rgba(0,0,0,0.9),0 0 12px rgba(245,158,11,0.6)' : st.stylePreset === 'fire' ? '0 3px 6px rgba(0,0,0,0.9),0 0 16px #ea580c' : st.stylePreset === 'neon' ? '0 0 16px #06b6d4,0 0 30px #0ea5e9' : '0 3px 8px rgba(0,0,0,0.95)' }}
                  >
                    {st.title}
                  </h2>
                  {st.subtitle && <p className="text-slate-100 text-xs mt-1 drop-shadow-md">{st.subtitle}</p>}
                </div>
                {isEditingInline && (
                  <div onMouseDown={(e) => e.stopPropagation()} className="absolute z-50 top-full mt-3 left-0 w-80 bg-[#0e1322]/95 backdrop-blur-xl border border-sky-500/40 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="font-bold text-white flex items-center gap-1.5"><Edit3 className="w-3.5 h-3.5 text-sky-400" /><span>កែប្រែអក្សរ 3D</span></span>
                      <button onClick={() => setIsEditingInline(false)} className="p-1 rounded-lg text-slate-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="flex flex-col gap-1"><label className="text-[11px] font-medium text-slate-300">ចំណងជើងធំ</label><input type="text" value={inlineTitle} onChange={(e) => setInlineTitle(e.target.value)} placeholder="ឧ. សង្គ្រាម អាទិទេព..." className="w-full bg-[#07090e] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-bold outline-none focus:border-sky-400" /></div>
                    <div className="flex flex-col gap-1"><label className="text-[11px] font-medium text-slate-300">ចំណងជើងរង</label><input type="text" value={inlineSubtitle} onChange={(e) => setInlineSubtitle(e.target.value)} placeholder="ឧ. បញ្ចូលសំឡេងខ្មែរ..." className="w-full bg-[#07090e] border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-sky-400" /></div>
                    <div className="flex flex-col gap-1"><label className="text-[11px] font-medium text-slate-300">ស្លាកភាគ</label><input type="text" value={inlineBadge} onChange={(e) => setInlineBadge(e.target.value)} placeholder="ឧ. ភាគ ០១..." className="w-full bg-[#07090e] border border-white/10 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono font-bold outline-none focus:border-sky-400" /></div>
                    <div className="flex items-center gap-2 pt-1">
                      <button onClick={handleSaveInlineEdit} className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold flex items-center justify-center gap-1.5 shadow-md hover:brightness-110 active:scale-95"><Check className="w-3.5 h-3.5" /><span>រក្សាទុក</span></button>
                      <button onClick={() => setIsEditingInline(false)} className="px-3 py-1.5 rounded-xl bg-white/10 text-slate-300 hover:text-white">បោះបង់</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Commercial Overlay ───────────────────────────────────── */}
          {commercialOverlay?.enabled && commercialOverlay.videoUrl && (() => {
            const isVisible = commercialOverlay.duration === 0 || (currentTime >= commercialOverlay.startTime && currentTime <= commercialOverlay.startTime + commercialOverlay.duration);
            if (!isVisible) return null;
            const getPos = () => ({ 'top-left': 'top-4 left-4', 'top-right': 'top-4 right-4', 'bottom-left': 'bottom-12 left-4', 'bottom-right': 'bottom-12 right-4', 'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' }[commercialOverlay.position] || 'top-4 right-4');
            const getSize = () => ({ small: 'w-28', medium: 'w-44', large: 'w-60', half: 'w-80' }[commercialOverlay.size] || 'w-44');
            return (
              <div className={`absolute z-30 ${getPos()} ${getSize()} aspect-video rounded-xl overflow-hidden border-2 border-amber-400 shadow-2xl bg-black pointer-events-none`} style={{ opacity: (commercialOverlay.opacity || 90) / 100 }}>
                <video src={commercialOverlay.videoUrl} className="w-full h-full object-cover" autoPlay muted={commercialOverlay.volume === 0} loop={commercialOverlay.loop} />
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[8px] text-amber-300 font-bold uppercase tracking-wider">SPONSOR AD</div>
              </div>
            );
          })()}

          {/* ── 3D Active Badge ──────────────────────────────────────── */}
          {videoEffects?.effect3dEnabled && active3dPreset && (
            <div className="absolute top-12 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-amber-500/50 text-amber-300 text-[11px] font-bold shadow-xl animate-in fade-in">
              <Box className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>3D: {active3dPreset.label.split(' ')[1] || active3dPreset.label}</span>
            </div>
          )}

          {/* ── Social Canvas Top Headline & Bottom Caption ──────────── */}
          {videoEffects?.socialCanvasStyle?.enabled && (
            <>
              {videoEffects.socialCanvasStyle.topTitle && (
                <div className="absolute top-12 left-4 right-4 z-[26] flex justify-center pointer-events-none select-none animate-in fade-in slide-in-from-top-2">
                  <div
                    className="px-4 py-1.5 rounded-xl border border-white/20 shadow-2xl backdrop-blur-md max-w-[90%] text-center"
                    style={{
                      background: videoEffects.socialCanvasStyle.headerBgColor || 'rgba(0,0,0,0.8)',
                      borderColor: videoEffects.socialCanvasStyle.frameBorderColor && videoEffects.socialCanvasStyle.frameBorderColor !== 'transparent' ? videoEffects.socialCanvasStyle.frameBorderColor : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    <span
                      className="font-bold tracking-wide text-xs sm:text-sm drop-shadow-md"
                      style={{
                        fontFamily: `"${videoEffects.socialCanvasStyle.headerFontFamily || 'Koulen'}", "Kantumruy Pro", sans-serif`,
                        color: videoEffects.socialCanvasStyle.headerTextColor || '#fef08a',
                      }}
                    >
                      {videoEffects.socialCanvasStyle.topTitle}
                    </span>
                  </div>
                </div>
              )}

              {videoEffects.socialCanvasStyle.bottomSubtitle && (
                <div
                  className="absolute left-4 right-4 z-[26] flex justify-center pointer-events-none select-none transition-all duration-300"
                  style={{ bottom: controlsVisible ? '68px' : '22px' }}
                >
                  <div className="px-3.5 py-1 rounded-full bg-black/85 border border-white/20 backdrop-blur-md shadow-xl text-center">
                    <span className="text-[11px] font-bold text-white tracking-wide">
                      {videoEffects.socialCanvasStyle.bottomSubtitle}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Sponsor In Video Overlay ─────────────────────────────── */}
          {videoEffects?.sponsorInVideo?.enabled && (() => {
            const sp = videoEffects.sponsorInVideo;
            if (!sp.sponsorName) return null;

            const getPosClasses = () => {
              switch (sp.position) {
                case 'top_banner':
                  return 'top-10 left-3 right-3 flex justify-center';
                case 'top_right':
                  return 'top-12 right-3 flex justify-end';
                case 'top_left':
                  return 'top-12 left-3 flex justify-start';
                case 'floating_pill':
                  return 'bottom-20 right-4 flex justify-end';
                case 'lower_third':
                  return 'bottom-20 left-4 right-4 flex justify-start';
                case 'bottom_banner':
                default:
                  return 'bottom-16 left-3 right-3 flex justify-center';
              }
            };

            const getTheme = () => {
              switch (sp.stylePreset) {
                case 'neon_cyan':
                  return {
                    bg: 'bg-gradient-to-r from-cyan-950/90 via-slate-900/90 to-blue-950/90',
                    border: 'border-cyan-400/80',
                    shadow: 'shadow-[0_0_20px_rgba(6,182,212,0.4)]',
                    titleColor: 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-sky-300 to-white',
                    tagColor: 'text-cyan-300 bg-cyan-500/20 border-cyan-400/30',
                    badgeIconColor: '#06b6d4',
                  };
                case 'red_breaking':
                  return {
                    bg: 'bg-gradient-to-r from-red-950/95 via-rose-900/90 to-black/90',
                    border: 'border-red-500/80',
                    shadow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]',
                    titleColor: 'text-white',
                    tagColor: 'text-red-200 bg-red-600/30 border-red-500/40',
                    badgeIconColor: '#ef4444',
                  };
                case 'glass_blur':
                  return {
                    bg: 'bg-slate-900/80 backdrop-blur-xl',
                    border: 'border-white/25',
                    shadow: 'shadow-2xl',
                    titleColor: 'text-white',
                    tagColor: 'text-slate-300 bg-white/10 border-white/20',
                    badgeIconColor: '#ffffff',
                  };
                case 'royal_purple':
                  return {
                    bg: 'bg-gradient-to-r from-purple-950/90 via-indigo-950/90 to-black/90',
                    border: 'border-purple-400/80',
                    shadow: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]',
                    titleColor: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-white',
                    tagColor: 'text-purple-300 bg-purple-500/20 border-purple-400/30',
                    badgeIconColor: '#a855f7',
                  };
                case 'amber_blaze':
                  return {
                    bg: 'bg-gradient-to-r from-amber-950/95 via-orange-950/90 to-black/90',
                    border: 'border-amber-500/80',
                    shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]',
                    titleColor: 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-300 to-white',
                    tagColor: 'text-amber-300 bg-amber-500/20 border-amber-400/30',
                    badgeIconColor: '#f59e0b',
                  };
                case 'theatrical_gold':
                default:
                  return {
                    bg: 'bg-gradient-to-r from-yellow-950/90 via-black/90 to-amber-950/90',
                    border: 'border-amber-400/80',
                    shadow: 'shadow-[0_0_25px_rgba(234,179,8,0.4)]',
                    titleColor: 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-amber-300 to-yellow-500',
                    tagColor: 'text-amber-300 bg-amber-500/20 border-amber-400/40',
                    badgeIconColor: '#eab308',
                  };
              }
            };

            const theme = getTheme();
            const isPill = sp.position === 'floating_pill';

            return (
              <div
                className={`absolute z-[26] pointer-events-none select-none transition-all duration-300 ${getPosClasses()}`}
                style={{ opacity: (sp.opacity ?? 95) / 100 }}
              >
                <div
                  className={`relative overflow-hidden border ${theme.bg} ${theme.border} ${theme.shadow} backdrop-blur-md transition-all ${
                    isPill ? 'px-3.5 py-1.5 flex items-center gap-2 rounded-full' : 'px-4 py-2 flex items-center justify-between gap-3 max-w-[94%] rounded-2xl'
                  }`}
                >
                  {sp.animation === 'shimmer' && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shimmer" />
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" style={{ color: theme.badgeIconColor }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-black text-xs sm:text-sm tracking-wider uppercase truncate ${theme.titleColor}`}>
                          {sp.sponsorName}
                        </span>
                        {sp.tagline && (
                          <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border ${theme.tagColor}`}>
                            {sp.tagline}
                          </span>
                        )}
                      </div>
                      {sp.contactInfo && (
                        <p className="text-[10px] text-slate-300 truncate font-mono mt-0.5">
                          {sp.contactInfo}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Running Ticker Marquee Bar ───────────────────────────── */}
          {videoEffects?.runningTickerText?.enabled && videoEffects.runningTickerText.text && (() => {
            const tk = videoEffects.runningTickerText;
            const isTop = tk.position === 'top';
            const isAboveSubs = tk.position === 'above_subtitles';

            const durationSec = tk.speed === 'slow' ? '25s' : tk.speed === 'fast' ? '9s' : '15s';

            const positionStyle: React.CSSProperties = isTop
              ? { top: controlsVisible ? '48px' : '12px' }
              : isAboveSubs
              ? { bottom: controlsVisible ? '135px' : '75px' }
              : { bottom: controlsVisible ? '62px' : '8px' };

            return (
              <div
                className="absolute left-0 right-0 z-[27] pointer-events-none select-none transition-all duration-300 flex items-center shadow-2xl"
                style={{
                  ...positionStyle,
                  backgroundColor: tk.backgroundColor || 'rgba(0, 0, 0, 0.85)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-red-600 to-rose-700 text-white font-extrabold text-[10.5px] shrink-0 z-10 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="tracking-wider uppercase">{tk.newsBadgeText || 'BREAKING'}</span>
                </div>

                <div className="flex-1 overflow-hidden relative py-1">
                  <div
                    className="whitespace-nowrap inline-block animate-marquee"
                    style={{
                      animationDuration: durationSec,
                      animationTimingFunction: 'linear',
                      animationIterationCount: 'infinite',
                      fontSize: `${tk.fontSize || 16}px`,
                      color: tk.textColor || '#ffffff',
                      fontFamily: '"Kantumruy Pro", "Battambang", sans-serif',
                      textShadow: tk.glowEffect ? '0 0 10px rgba(255,255,255,0.7), 0 2px 4px rgba(0,0,0,0.9)' : '0 2px 4px rgba(0,0,0,0.9)',
                    }}
                  >
                    <span className="px-8 font-semibold">{tk.text}</span>
                    <span className="px-8 font-semibold">• • • {tk.text}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ─────────────────────────────────────────────────────────────
              ██  CINEMA OVERLAY SYSTEM  ██
              ───────────────────────────────────────────────────────────── */}

          {/* ── Bottom Gradient Fade ──────────────────────────────────── */}
          <div
            className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-[25] transition-opacity duration-500"
            style={{ opacity: controlsVisible ? 1 : 0 }}
          />
          {/* ── Top Gradient Fade ─────────────────────────────────────── */}
          <div
            className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/70 via-black/10 to-transparent pointer-events-none z-[25] transition-opacity duration-500"
            style={{ opacity: controlsVisible ? 1 : 0 }}
          />

          {/* ── TOP INFO BAR ─────────────────────────────────────────── */}
          <div
            className="absolute top-0 left-0 right-0 z-[30] flex items-center justify-between px-3 py-2.5 transition-all duration-500"
            style={{
              opacity: controlsVisible ? 1 : 0,
              transform: controlsVisible ? 'translateY(0)' : 'translateY(-8px)',
              pointerEvents: controlsVisible ? 'auto' : 'none',
            }}
          >
            {/* Left: filename + episode info */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
                <Film className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-white text-[11px] font-semibold truncate max-w-[180px] sm:max-w-xs" title={displayFilename || ''}>
                  {displayFilename || 'No video'}
                </span>
              </div>
              {videoSourceMode === 'dubbed' && (
                <div className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold">
                  DUBBED
                </div>
              )}
            </div>

            {/* Right: top controls row */}
            <div className="flex items-center gap-1.5">
              {/* FX ON Badge */}
              {hasActiveEffects && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-black tracking-wider shadow-[0_0_10px_rgba(251,191,36,0.3)] animate-pulse" style={{ animationDuration: '2s' }}>
                  <Sparkles className="w-3 h-3" />
                  <span>FX ON</span>
                </div>
              )}
              {/* ── Video Zoom & Fit Controller (ពង្រីក-ពង្រួម & លាតពេញ) ─── */}
              <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md border border-white/15 rounded-lg p-0.5 shadow-lg">
                {/* Fit / Fill toggle (Appflix feature) */}
                <button
                  type="button"
                  onClick={handleToggleFitCover}
                  className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                    localFitMode === 'cover'
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                  title={localFitMode === 'cover' ? 'ប្ដូរមកធម្មតា (Fit)' : 'ពង្រីកពេញអេក្រង់បំបាត់គែមខ្មៅ (Fill Screen)'}
                >
                  <Scan className="w-3 h-3" />
                  <span className="hidden md:inline">{localFitMode === 'cover' ? 'លាតពេញ' : 'សមល្មម'}</span>
                </button>

                <div className="w-[1px] h-3.5 bg-white/15 mx-0.5" />

                {/* Zoom Out (-) */}
                <button
                  type="button"
                  onClick={() => updateZoom(localZoomScale - 0.25, 'contain')}
                  className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                  title="ពង្រួម Zoom Out (-)"
                >
                  <Minus className="w-3 h-3" />
                </button>

                {/* Zoom Scale Display / Menu button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowZoomMenu(!showZoomMenu)}
                    className="px-1.5 py-0.5 font-mono text-[11px] font-bold text-white/90 hover:text-emerald-300 transition-colors"
                    title="ជ្រើសរើសទំហំពង្រីក Zoom"
                  >
                    {localFitMode === 'cover' ? 'Fill' : `${Math.round(localZoomScale * 100)}%`}
                  </button>

                  {showZoomMenu && (
                    <div className="absolute right-0 top-full mt-1.5 py-1 px-1 rounded-xl bg-black/95 backdrop-blur-md border border-white/20 shadow-2xl z-50 min-w-[130px] flex flex-col gap-0.5">
                      <div className="px-2 py-1 text-[9.5px] font-bold text-slate-400 border-b border-white/10">កម្រិតពង្រីក Zoom</div>
                      {[
                        { label: 'សមល្មម (Fit 100%)', scale: 1.0, fit: 'contain' as const },
                        { label: 'លាតពេញ (Fill / Crop)', scale: 1.0, fit: 'cover' as const },
                        { label: '125%', scale: 1.25, fit: 'contain' as const },
                        { label: '150%', scale: 1.5, fit: 'contain' as const },
                        { label: '200%', scale: 2.0, fit: 'contain' as const },
                        { label: '300%', scale: 3.0, fit: 'contain' as const },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            updateZoom(item.scale, item.fit, true);
                            setShowZoomMenu(false);
                          }}
                          className={`px-2 py-1 text-left text-xs rounded-lg transition-colors flex items-center justify-between ${
                            localZoomScale === item.scale && localFitMode === item.fit
                              ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                              : 'text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <span>{item.label}</span>
                          {localZoomScale === item.scale && localFitMode === item.fit && <Check className="w-3 h-3 text-emerald-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Zoom In (+) */}
                <button
                  type="button"
                  onClick={() => updateZoom(localZoomScale + 0.25, 'contain')}
                  className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                  title="ពង្រីក Zoom In (+)"
                >
                  <Plus className="w-3 h-3" />
                </button>

                {/* Reset button (if zoomed or panned) */}
                {(localZoomScale !== 1.0 || localFitMode === 'cover' || panOffset.x !== 0 || panOffset.y !== 0) && (
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="p-1 rounded text-amber-300 hover:text-amber-200 hover:bg-amber-400/10 transition-all"
                    title="កំណត់ឡើងវិញ Reset Zoom"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Subtitle Toggle */}
              {onToggleSubtitles && (
                <button onClick={onToggleSubtitles}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold backdrop-blur-md border transition-all ${showSubtitles ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' : 'bg-black/60 border-white/[0.1] text-slate-400 hover:text-white'}`}
                  title="បើក/បិទ អក្សររត់"
                >
                  {showSubtitles ? 'ស. រ. បើក' : 'ស.រ. បិទ'}
                </button>
              )}
              {/* Camera / Snapshot */}
              <button
                onClick={handleInstantSnapshot}
                className={`p-1.5 rounded-lg backdrop-blur-md border transition-all ${capturedFeedback ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300' : 'bg-black/60 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'}`}
                title="ថតរូបភាព Frame (Snapshot)"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              {/* Upload/Change Video */}
              <label className="cursor-pointer">
                <input type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f && onUploadFile) onUploadFile(f); }} />
                <div className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-mono text-[10.5px] font-bold flex items-center gap-1 transition-all backdrop-blur-md cursor-pointer">
                  <Download className="w-3 h-3" />
                  <span className="hidden sm:inline">ប្តូរ</span>
                </div>
              </label>
            </div>
          </div>

          {/* ── Zoom HUD Notification ─────────────────────────────── */}
          {zoomToastText && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[35] pointer-events-none animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-emerald-400/40 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-1.5">
                <span>{zoomToastText}</span>
                {(localZoomScale > 1.05 || localFitMode === 'cover') && (
                  <span className="text-[10.5px] text-slate-400 font-normal">• អូសដើម្បីរំកិល (Drag to Pan)</span>
                )}
              </div>
            </div>
          )}

          {/* ── SUBTITLE DISPLAY (above controls, always visible) ────── */}
          {showSubtitles && currentSubtitle && (
            <div
              className="absolute left-[5%] right-[5%] text-center pointer-events-none z-[28] animate-in fade-in duration-100 transition-all duration-500"
              style={{ bottom: controlsVisible ? '88px' : '12px' }}
            >
              <div
                className={`inline-flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl shadow-2xl max-w-[85%] mx-auto ${(subtitleStyle as any)?.boxEnabled !== false ? 'border border-[#00C2FF]/20 backdrop-blur-md' : ''}`}
                style={{ backgroundColor: (subtitleStyle as any)?.boxEnabled !== false ? (subtitleStyle?.backgroundColor || 'rgba(0,0,0,0.75)') : 'transparent' }}
              >
                <p className="font-bold leading-relaxed tracking-wide select-none"
                  style={{
                    fontSize: `${subtitleStyle?.fontSize || 22}px`,
                    fontFamily: `"${subtitleStyle?.fontFamily || 'Kantumruy Pro'}", "Battambang", sans-serif`,
                    color: subtitleStyle?.textColor || '#ffffff',
                    WebkitTextStroke: `${subtitleStyle?.strokeWidth || 2}px ${subtitleStyle?.strokeColor || '#000000'}`,
                    textShadow: '0 2px 10px rgba(0,0,0,0.95), 0 0 15px rgba(0,194,255,0.3)',
                  }}
                >
                  {currentSubtitle}
                </p>
              </div>
            </div>
          )}

          {/* ── LOADING / BUFFERING OVERLAY ───────────────────────────── */}
          {(isUploadingFile || isBuffering) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-[40] bg-black/50 backdrop-blur-[1px]">
              {isUploadingFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - uploadProgress / 100)}`}
                        className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-mono font-bold text-sm">{uploadProgress}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-white text-sm font-semibold">កំពុង Upload...</p>
                    {uploadInfo && <p className="text-zinc-400 text-xs mt-1">{uploadInfo.loadedMb} / {uploadInfo.totalMb} MB</p>}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-2.5 h-2.5 rounded-full bg-emerald-400"
                        style={{ animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                  <p className="text-white/70 text-xs font-medium">Buffering...</p>
                </div>
              )}
            </div>
          )}

          {/* ── CINEMA CONTROLS OVERLAY (bottom) ─────────────────────── */}
          <div
            className="absolute bottom-0 left-0 right-0 z-[30] flex flex-col transition-all duration-500"
            style={{
              opacity: controlsVisible ? 1 : 0,
              transform: controlsVisible ? 'translateY(0)' : 'translateY(8px)',
              pointerEvents: controlsVisible ? 'auto' : 'none',
            }}
          >
            {/* ── PROGRESS BAR ───────────────────────────────────────── */}
            <div className="px-3 pb-1 pt-1 group/progress">
              <div
                ref={progressBarRef}
                className="relative h-1 hover:h-2.5 rounded-full cursor-pointer transition-all duration-150 bg-white/20 group/bar"
                onMouseMove={handleProgressMouseMove}
                onMouseLeave={() => setHoverProgress(null)}
                onMouseDown={handleProgressMouseDown}
                onClick={handleProgressClick}
              >
                {/* Buffered */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white/30 transition-all"
                  style={{ width: `${bufferProgress}%` }}
                />
                {/* Played */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all"
                  style={{
                    width: `${playedPct}%`,
                    background: 'linear-gradient(to right, #059669, #10b981, #34d399)',
                    boxShadow: '0 0 8px rgba(52,211,153,0.6)',
                  }}
                />
                {/* Drag Handle */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-emerald-300 bg-white opacity-0 group-hover/bar:opacity-100 transition-all shadow-[0_0_8px_rgba(52,211,153,0.9)] pointer-events-none"
                  style={{ left: `${playedPct}%` }}
                />
                {/* Hover Tooltip */}
                {hoverProgress !== null && (
                  <div
                    className="absolute -top-8 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/90 backdrop-blur-md border border-white/20 text-white text-[11px] font-mono font-bold shadow-lg pointer-events-none z-10"
                    style={{ left: hoverProgressX }}
                  >
                    {formatTimecode(hoverProgress)}
                  </div>
                )}
              </div>
            </div>

            {/* ── TRANSPORT CONTROLS ROW ─────────────────────────────── */}
            <div className="flex items-center justify-between px-3 pb-3 gap-2">
              {/* Left cluster */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Step -10s */}
                <button onClick={() => onStep?.(-10)}
                  className="hidden sm:flex items-center gap-0.5 px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-[10px] font-bold transition-all border border-white/10"
                  title="ថយក្រោយ 10 វិនាទី"
                >
                  <ChevronLeft className="w-3 h-3" />10s
                </button>
                {/* Step -5s */}
                <button onClick={() => onStep?.(-5)}
                  className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-[10px] font-bold transition-all border border-white/10"
                  title="ថយក្រោយ 5 វិនាទី"
                >
                  <ChevronLeft className="w-3 h-3" />5s
                </button>

                {/* Play/Pause — 48px centered glow circle */}
                <button
                  onClick={handlePlayPause}
                  className="relative w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    boxShadow: isPlaying
                      ? '0 0 0 0 rgba(16,185,129,0.4), 0 0 20px rgba(16,185,129,0.6), 0 0 40px rgba(16,185,129,0.2)'
                      : '0 0 15px rgba(16,185,129,0.3)',
                    animation: isPlaying ? 'playPulse 2s ease-in-out infinite' : 'none',
                  }}
                  title="ចាក់ / ផ្អាក (Space)"
                >
                  <style>{`@keyframes playPulse{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.4),0 0 20px rgba(16,185,129,0.6),0 0 40px rgba(16,185,129,0.2)}50%{box-shadow:0 0 0 6px rgba(16,185,129,0.1),0 0 25px rgba(16,185,129,0.8),0 0 50px rgba(16,185,129,0.3)}}`}</style>
                  {isPlaying
                    ? <Pause className="w-5 h-5 fill-white text-white" />
                    : <Play className="w-5 h-5 fill-white text-white translate-x-0.5" />
                  }
                </button>

                {/* Step +5s */}
                <button onClick={() => onStep?.(5)}
                  className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-[10px] font-bold transition-all border border-white/10"
                  title="ទៅមុខ 5 វិនាទី"
                >
                  5s<ChevronRight className="w-3 h-3" />
                </button>
                {/* Step +10s */}
                <button onClick={() => onStep?.(10)}
                  className="hidden sm:flex items-center gap-0.5 px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-[10px] font-bold transition-all border border-white/10"
                  title="ទៅមុខ 10 វិនាទី"
                >
                  10s<ChevronRight className="w-3 h-3" />
                </button>

                {/* Time Display */}
                <div className="font-mono text-xs font-semibold text-white/90 tabular-nums select-none ml-1 hidden sm:block">
                  <span className="text-emerald-400">{formatTimecode(currentTime)}</span>
                  <span className="text-white/40 mx-1">/</span>
                  <span className="text-white/60">{formatTimecode(duration)}</span>
                </div>
              </div>

              {/* Right cluster */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Volume */}
                <div className="relative flex items-center" onMouseEnter={handleVolumeEnter} onMouseLeave={handleVolumeLeave}>
                  <button
                    onClick={handleMuteToggle}
                    className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
                    title="បិទ/បើក សំឡេង"
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  </button>
                  {showVolumeSlider && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex flex-col items-center gap-1 p-2 rounded-xl bg-black/90 backdrop-blur-md border border-white/15 shadow-2xl z-50"
                      onMouseEnter={handleVolumeEnter} onMouseLeave={handleVolumeLeave}
                    >
                      <input
                        type="range" min={0} max={1} step={0.02} value={isMuted ? 0 : volume}
                        onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); if (v > 0 && isMuted) handleMuteToggle(); }}
                        className="h-20 cursor-pointer accent-emerald-400"
                        style={{ writingMode: 'vertical-lr', direction: 'rtl', WebkitAppearance: 'slider-vertical' }}
                      />
                      <span className="text-white/60 text-[10px] font-mono">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
                    </div>
                  )}
                </div>

                {/* Playback Rate */}
                <select
                  value={playbackRate}
                  onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                  className="bg-black/60 border border-white/15 text-white/80 text-[10px] rounded-lg px-1.5 py-1 font-mono cursor-pointer outline-none focus:border-emerald-400 backdrop-blur-md hover:bg-white/10 transition-all"
                  title="ល្បឿនចាក់"
                >
                  <option value="0.5">0.5×</option>
                  <option value="0.75">0.75×</option>
                  <option value="1">1×</option>
                  <option value="1.25">1.25×</option>
                  <option value="1.5">1.5×</option>
                  <option value="2">2×</option>
                </select>

                {/* Subtitles Toggle Icon */}
                {onToggleSubtitles && (
                  <button onClick={onToggleSubtitles}
                    className={`p-1.5 rounded-lg transition-all ${showSubtitles ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-400/30' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                    title="បើក/បិទ អក្សររត់"
                  >
                    <Subtitles className="w-4 h-4" />
                  </button>
                )}

                {/* Screenshot / Thumbnail Studio */}
                <button
                  onClick={() => onOpenThumbnailStudio?.()}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
                  title="Thumbnail Studio"
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Video Zoom / Fit toggle (លាតពេញ/សមល្មម) */}
                <button
                  type="button"
                  onClick={handleToggleFitCover}
                  className={`p-1.5 rounded-lg transition-all ${
                    localFitMode === 'cover' || localZoomScale > 1.0
                      ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  title={localFitMode === 'cover' ? 'លាតពេញ (ចុចដើម្បីមក Fit ធម្មតា)' : 'ពង្រីកពេញអេក្រង់ (Fill / Crop)'}
                >
                  <Scan className="w-4 h-4" />
                </button>

                {/* Fullscreen */}
                <button
                  onClick={handleFullscreen}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
                  title="ពេញអេក្រង់ (F)"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>{/* /frameRef */}
      </div>{/* /flex-1 canvas area */}

    </div>
  );
};
