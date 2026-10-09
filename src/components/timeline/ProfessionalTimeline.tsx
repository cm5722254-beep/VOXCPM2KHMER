/**
 * 🎬 Professional Timeline - Production Version with Real Video Sync
 * Multi-track character timeline with actual video playback synchronization
 * Features: Color-coded tracks, drag-to-reposition, zoom controls, real-time playhead
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { TimelineSegment } from '../../types';
import { 
  Play, 
  Pause, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  SkipBack,
  SkipForward,
  Lock,
  Unlock,
  Eye,
  EyeOff 
} from 'lucide-react';

interface ProfessionalTimelineProps {
  segments: TimelineSegment[];
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  onSelectSegment: (index: number) => void;
  selectedSegmentIndex: number | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onUpdateSegment?: (index: number, updates: Partial<TimelineSegment>) => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
}

export const ProfessionalTimeline: React.FC<ProfessionalTimelineProps> = ({
  segments,
  duration,
  currentTime,
  onSeek,
  onSelectSegment,
  selectedSegmentIndex,
  isPlaying,
  onTogglePlay,
  onUpdateSegment,
  videoRef,
}) => {
  const [zoom, setZoom] = useState(1); // 1 = 100%, 2 = 200%, etc.
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isDraggingSegment, setIsDraggingSegment] = useState(false);
  const [dragSegmentIndex, setDragSegmentIndex] = useState<number | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [hiddenTracks, setHiddenTracks] = useState<Set<string>>(new Set());
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Gender color mapping
  const genderColors: Record<string, string> = {
    male: '#3b82f6',    // Blue
    female: '#ec4899',  // Pink
    child: '#10b981',   // Green
    elder: '#f59e0b',   // Orange
    narrator: '#8b5cf6', // Purple
  };

  /**
   * Get color for segment based on gender
   */
  const getSegmentColor = (segment: TimelineSegment): string => {
    const gender = segment.gender?.toLowerCase() || 'male';
    return genderColors[gender] || '#6b7280';
  };

  /**
   * Group segments by speaker/character for multi-track view
   */
  const characterTracks = useMemo(() => {
    const trackMap = new Map<string, { character: string; gender: string; segments: (TimelineSegment & { index: number })[] }>();
    
    segments.forEach((segment, index) => {
      const charId = segment.canonical_id || segment.speaker_id || segment.speaker_name || 'Unknown';
      
      if (!trackMap.has(charId)) {
        trackMap.set(charId, {
          character: segment.speaker_name || charId,
          gender: segment.gender || 'male',
          segments: [],
        });
      }
      
      trackMap.get(charId)!.segments.push({ ...segment, index });
    });
    
    return Array.from(trackMap.values());
  }, [segments]);

  /**
   * Format time as MM:SS.ms
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  /**
   * Convert time to pixel position
   */
  const timeToPixel = useCallback((time: number): number => {
    if (!timelineRef.current || duration === 0) return 0;
    const width = timelineRef.current.offsetWidth;
    return (time / duration) * width * zoom;
  }, [duration, zoom]);

  /**
   * Convert pixel to time
   */
  const pixelToTime = useCallback((pixel: number): number => {
    if (!timelineRef.current || duration === 0) return 0;
    const width = timelineRef.current.offsetWidth;
    return (pixel / (width * zoom)) * duration;
  }, [duration, zoom]);

  /**
   * Handle timeline click to seek
   */
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingSegment) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollOffset;
    const time = pixelToTime(x);
    onSeek(Math.max(0, Math.min(duration, time)));
  };

  /**
   * Handle segment drag start
   */
  const handleSegmentDragStart = (e: React.MouseEvent, index: number, segment: TimelineSegment) => {
    e.stopPropagation();
    setIsDraggingSegment(true);
    setDragSegmentIndex(index);
    setDragStartX(e.clientX);
    setDragStartTime(segment.start_time || 0);
  };

  /**
   * Handle segment dragging
   */
  const handleSegmentDrag = useCallback((e: MouseEvent) => {
    if (!isDraggingSegment || dragSegmentIndex === null) return;
    
    const deltaX = e.clientX - dragStartX;
    const deltaTime = pixelToTime(deltaX);
    const newStartTime = Math.max(0, dragStartTime + deltaTime);
    
    const segment = segments[dragSegmentIndex];
    const segmentDuration = (segment.end_time || 0) - (segment.start_time || 0);
    const newEndTime = newStartTime + segmentDuration;
    
    // Don't exceed video duration
    if (newEndTime <= duration && onUpdateSegment) {
      onUpdateSegment(dragSegmentIndex, {
        start_time: newStartTime,
        end_time: newEndTime,
      });
    }
  }, [isDraggingSegment, dragSegmentIndex, dragStartX, dragStartTime, pixelToTime, segments, duration, onUpdateSegment]);

  /**
   * Handle segment drag end
   */
  const handleSegmentDragEnd = useCallback(() => {
    setIsDraggingSegment(false);
    setDragSegmentIndex(null);
  }, []);

  /**
   * Mouse move and up handlers for dragging
   */
  useEffect(() => {
    if (isDraggingSegment) {
      window.addEventListener('mousemove', handleSegmentDrag);
      window.addEventListener('mouseup', handleSegmentDragEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleSegmentDrag);
        window.removeEventListener('mouseup', handleSegmentDragEnd);
      };
    }
  }, [isDraggingSegment, handleSegmentDrag, handleSegmentDragEnd]);

  /**
   * Auto-scroll timeline to keep playhead visible
   */
  useEffect(() => {
    if (!scrollContainerRef.current || !isPlaying) return;
    
    const playheadPosition = timeToPixel(currentTime);
    const containerWidth = scrollContainerRef.current.offsetWidth;
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    
    // Auto-scroll if playhead goes off-screen
    if (playheadPosition > scrollLeft + containerWidth - 100) {
      scrollContainerRef.current.scrollLeft = playheadPosition - containerWidth + 100;
    } else if (playheadPosition < scrollLeft + 100) {
      scrollContainerRef.current.scrollLeft = Math.max(0, playheadPosition - 100);
    }
  }, [currentTime, isPlaying, timeToPixel]);

  /**
   * Handle zoom in
   */
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 10)); // Max 10x zoom
  };

  /**
   * Handle zoom out
   */
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5)); // Min 0.5x zoom
  };

  /**
   * Reset zoom
   */
  const handleZoomReset = () => {
    setZoom(1);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  };

  /**
   * Toggle track visibility
   */
  const toggleTrackVisibility = (trackName: string) => {
    setHiddenTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackName)) {
        newSet.delete(trackName);
      } else {
        newSet.add(trackName);
      }
      return newSet;
    });
  };

  /**
   * Generate time ruler markers
   */
  const timeMarkers = useMemo(() => {
    const markers: { time: number; label: string }[] = [];
    const interval = duration / 20; // 20 markers
    
    for (let i = 0; i <= 20; i++) {
      const time = i * interval;
      markers.push({ time, label: formatTime(time) });
    }
    
    return markers;
  }, [duration]);

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] border-t border-gray-800">
      {/* Timeline Header Controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Timeline</h3>
          <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded">
            {characterTracks.length} Tracks
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Playback Controls */}
          <button
            onClick={() => onSeek(Math.max(0, currentTime - 5))}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Back 5s"
          >
            <SkipBack className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={onTogglePlay}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white" />
            )}
          </button>

          <button
            onClick={() => onSeek(Math.min(duration, currentTime + 5))}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Forward 5s"
          >
            <SkipForward className="w-4 h-4 text-gray-400" />
          </button>

          <div className="w-px h-6 bg-gray-700 mx-2" />

          {/* Zoom Controls */}
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors disabled:opacity-30"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-gray-400" />
          </button>

          <span className="text-xs text-gray-400 font-mono w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 10}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors disabled:opacity-30"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={handleZoomReset}
            className="px-2 py-1 text-xs hover:bg-gray-700 rounded transition-colors"
            title="Reset Zoom"
          >
            Fit
          </button>

          <div className="w-px h-6 bg-gray-700 mx-2" />

          {/* Time Display */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-blue-400">{formatTime(currentTime)}</span>
            <span className="text-gray-600">/</span>
            <span className="text-gray-400">{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Timeline Tracks Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-auto"
        onScroll={(e) => setScrollOffset(e.currentTarget.scrollLeft)}
      >
        <div className="relative min-h-full" style={{ minWidth: '100%' }}>
          {/* Time Ruler */}
          <div className="sticky top-0 z-20 h-8 bg-[#1a1a1a] border-b border-gray-800">
            <div
              ref={timelineRef}
              className="relative h-full"
              style={{ width: `${100 * zoom}%` }}
              onClick={handleTimelineClick}
            >
              {/* Time Markers */}
              {timeMarkers.map(({ time, label }) => (
                <div
                  key={time}
                  className="absolute top-0 h-full"
                  style={{ left: `${(time / duration) * 100}%` }}
                >
                  <div className="w-px h-2 bg-gray-600" />
                  <span className="absolute top-2 left-1 text-[10px] text-gray-500 font-mono whitespace-nowrap">
                    {label}
                  </span>
                </div>
              ))}

              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10 pointer-events-none"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              >
                <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-blue-500 rounded-sm" />
              </div>
            </div>
          </div>

          {/* Character Tracks */}
          <div className="relative">
            {characterTracks.map((track, trackIndex) => {
              const isHidden = hiddenTracks.has(track.character);
              const trackColor = genderColors[track.gender?.toLowerCase() || 'male'] || '#6b7280';

              return (
                <div
                  key={track.character}
                  className={`relative border-b border-gray-800 ${isHidden ? 'h-8' : 'h-16'}`}
                >
                  {/* Track Label */}
                  <div className="absolute left-0 top-0 bottom-0 w-40 bg-[#1a1a1a] border-r border-gray-800 px-3 py-2 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: trackColor }}
                      />
                      <span className="text-xs text-gray-300 truncate">
                        {track.character}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleTrackVisibility(track.character)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                    >
                      {isHidden ? (
                        <EyeOff className="w-3 h-3 text-gray-500" />
                      ) : (
                        <Eye className="w-3 h-3 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* Track Content */}
                  {!isHidden && (
                    <div
                      className="absolute left-40 top-0 bottom-0 right-0"
                      style={{ width: `calc(${100 * zoom}% - 160px)` }}
                    >
                      {track.segments.map((segment) => {
                        const startX = timeToPixel(segment.start_time || 0);
                        const width = timeToPixel((segment.end_time || 0) - (segment.start_time || 0));
                        const isSelected = selectedSegmentIndex === segment.index;
                        const isHovered = hoveredSegment === segment.index;
                        const isDragging = dragSegmentIndex === segment.index;

                        return (
                          <div
                            key={segment.index}
                            className={`
                              absolute top-2 bottom-2 rounded cursor-move transition-all
                              ${isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0d0d0d]' : ''}
                              ${isHovered ? 'brightness-125' : ''}
                              ${isDragging ? 'opacity-50' : ''}
                            `}
                            style={{
                              left: `${startX}px`,
                              width: `${width}px`,
                              backgroundColor: trackColor,
                              minWidth: '20px',
                            }}
                            onMouseDown={(e) => handleSegmentDragStart(e, segment.index, segment)}
                            onMouseEnter={() => setHoveredSegment(segment.index)}
                            onMouseLeave={() => setHoveredSegment(null)}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSegment(segment.index);
                            }}
                            title={`${segment.speaker_name || 'Unknown'}: ${segment.khmer_translation || segment.original_text || ''}`}
                          >
                            {/* Segment Content */}
                            {width > 40 && (
                              <div className="px-2 py-1 h-full flex items-center">
                                <span className="text-[10px] text-white truncate font-medium">
                                  {segment.khmer_translation || segment.original_text}
                                </span>
                              </div>
                            )}

                            {/* Audio indicator */}
                            {segment.audioUrl && (
                              <div className="absolute top-0 right-0 w-2 h-2 bg-green-400 rounded-bl" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-t border-gray-800 text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <span>Segments: {segments.length}</span>
          <span>•</span>
          <span>Tracks: {characterTracks.length}</span>
        </div>
        <div className="text-gray-500">
          {isDraggingSegment ? 'Dragging segment...' : 'Click to seek • Drag segments to reposition'}
        </div>
      </div>
    </div>
  );
};
