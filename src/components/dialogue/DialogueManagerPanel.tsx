/**
 * 🎬 Dialogue Manager Panel - Production Version with Real API Integration
 * Connects to: /api/dubbing/scan-timeline, /api/dubbing/generate-line, /api/voices/list
 * Features: Real-time segment editing, voice assignment, audio preview, bulk operations
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  Clock,
  User,
  Mic,
  RefreshCw,
  Download,
  Upload,
  Save,
  Trash2,
  Edit3,
  Check,
  X,
  ChevronDown,
  Search,
  Filter,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { TimelineSegment } from '../../types';

interface DialogueManagerPanelProps {
  segments: TimelineSegment[];
  onUpdateSegment: (index: number, updates: Partial<TimelineSegment>) => void;
  onDeleteSegment: (index: number) => void;
  onAddSegment?: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
  availableVoices?: Array<{ id: string; name: string; gender: string; sample?: string; filename?: string }>;
  onPreviewVoice?: (voiceId: string, text: string) => void;
  onGenerateVoices?: () => void;
  onSaveDialogue?: () => void;
  onExportDialogue?: () => void;
  onImportDialogue?: () => void;
  videoFilename?: string;
}

export const DialogueManagerPanel: React.FC<DialogueManagerPanelProps> = ({
  segments: propSegments = [],
  onUpdateSegment,
  onDeleteSegment,
  currentTime,
  duration,
  onSeek,
  isPlaying,
  onTogglePlay,
  availableVoices: propVoices = [],
  onPreviewVoice,
  onGenerateVoices,
  onSaveDialogue,
  onExportDialogue,
  videoFilename,
}) => {
  const [segments, setSegments] = useState<TimelineSegment[]>(propSegments);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female' | 'child'>('all');
  const [availableVoices, setAvailableVoices] = useState<any[]>(propVoices);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);

  // Sync segments from props
  useEffect(() => {
    setSegments(propSegments);
  }, [propSegments]);

  // Load voices from API on mount
  useEffect(() => {
    loadAvailableVoices();
  }, []);

  // Sync available voices from props
  useEffect(() => {
    if (propVoices.length > 0) {
      setAvailableVoices(propVoices);
    }
  }, [propVoices]);

  /**
   * Load available voices from API
   */
  const loadAvailableVoices = async () => {
    if (propVoices.length > 0) return; // Use prop voices if provided
    
    setIsLoadingVoices(true);
    try {
      const response = await fetch('/api/voices/list');
      const data = await response.json();
      if (data.voices && Array.isArray(data.voices)) {
        setAvailableVoices(data.voices);
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
    } finally {
      setIsLoadingVoices(false);
    }
  };

  /**
   * Generate single line audio using backend API
   */
  const handleGenerateLine = async (index: number, segment: TimelineSegment) => {
    const text = segment.khmer_translation || segment.original_text || '';
    if (!text.trim()) {
      alert('No text to generate');
      return;
    }

    setGeneratingIndex(index);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/dubbing/generate-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          lineIndex: index,
          gender: segment.gender || 'male',
          voiceId: segment.voice_id || 'voxcpm-voice-actor',
          speakerId: segment.canonical_id || segment.speaker_id,
          emotion: segment.emotion || 'dramatic',
        }),
      });

      const result = await response.json();
      
      if (result.success && result.audioUrl) {
        // Update segment with generated audio
        onUpdateSegment(index, {
          audioUrl: result.audioUrl,
          audio_path: result.audioPath,
        });
        
        // Auto-play generated audio
        if (onPreviewVoice) {
          const audio = new Audio(result.audioUrl);
          audio.play().catch(() => {});
        }
      } else {
        alert('Failed to generate audio: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Generate line error:', error);
      alert('Failed to generate audio');
    } finally {
      setIsGenerating(false);
      setGeneratingIndex(null);
    }
  };

  /**
   * Update segment text (Khmer translation)
   */
  const handleSaveEdit = (index: number) => {
    if (editText.trim()) {
      onUpdateSegment(index, { khmer_translation: editText });
    }
    setEditingIndex(null);
    setEditText('');
  };

  /**
   * Start editing segment
   */
  const handleStartEdit = (index: number, currentText: string) => {
    setEditingIndex(index);
    setEditText(currentText || '');
  };

  /**
   * Cancel editing
   */
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditText('');
  };

  /**
   * Update voice assignment
   */
  const handleVoiceChange = (index: number, voiceFilename: string) => {
    const voice = availableVoices.find(v => v.filename === voiceFilename || v.id === voiceFilename);
    onUpdateSegment(index, {
      voice_id: voice?.id || voiceFilename,
      voice_name: voice?.name || voiceFilename,
      gender: voice?.gender || segments[index].gender,
    });
  };

  /**
   * Preview voice audio sample
   */
  const handlePreviewVoice = (voiceFilename: string) => {
    const audio = new Audio(`/audio/samples/${voiceFilename}`);
    audio.play().catch((err) => console.error('Audio preview error:', err));
  };

  /**
   * Preview segment audio
   */
  const handlePreviewSegment = (segment: TimelineSegment) => {
    if (segment.audioUrl) {
      const audio = new Audio(segment.audioUrl);
      audio.play().catch((err) => console.error('Audio preview error:', err));
    } else {
      // Seek video to segment time
      onSeek(segment.start_time || 0);
    }
  };

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
   * Get color by gender
   */
  const getGenderColor = (gender?: string): string => {
    switch (gender?.toLowerCase()) {
      case 'male':
        return '#3b82f6'; // Blue
      case 'female':
        return '#ec4899'; // Pink
      case 'child':
        return '#10b981'; // Green
      case 'elder':
        return '#f59e0b'; // Orange
      case 'narrator':
        return '#8b5cf6'; // Purple
      default:
        return '#6b7280'; // Gray
    }
  };

  /**
   * Filter segments by search and gender
   */
  const filteredSegments = useMemo(() => {
    return segments.filter((seg) => {
      const matchesSearch =
        !searchTerm ||
        seg.khmer_translation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seg.speaker_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seg.original_text?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGender =
        filterGender === 'all' ||
        seg.gender === filterGender;

      return matchesSearch && matchesGender;
    });
  }, [segments, searchTerm, filterGender]);

  /**
   * Group voices by gender for dropdown
   */
  const voicesByGender = useMemo(() => {
    const grouped: Record<string, any[]> = {
      male: [],
      female: [],
      child: [],
      elder: [],
      narrator: [],
    };

    availableVoices.forEach((voice) => {
      const gender = voice.gender?.toLowerCase() || 'male';
      if (grouped[gender]) {
        grouped[gender].push(voice);
      } else {
        grouped.male.push(voice);
      }
    });

    return grouped;
  }, [availableVoices]);

  /**
   * Export dialogue as JSON
   */
  const handleExport = () => {
    const dataStr = JSON.stringify(segments, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dialogue_${videoFilename || 'export'}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] text-gray-100">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Dialogue Manager</h3>
          <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded">
            {filteredSegments.length} Lines
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search dialogue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-[#0a0a0a] border border-gray-700 rounded focus:border-blue-500 focus:outline-none w-48"
            />
          </div>

          {/* Gender Filter */}
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-[#0a0a0a] border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="child">Child</option>
          </select>

          {/* Action Buttons */}
          <button
            onClick={onGenerateVoices}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 rounded transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Generate All
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>

          <button
            onClick={onSaveDialogue}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 rounded transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[60px_80px_80px_1fr_180px_120px_80px] gap-2 px-4 py-2 bg-[#1a1a1a] border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wide">
        <div>#</div>
        <div>Start</div>
        <div>End</div>
        <div>Text (Khmer)</div>
        <div>Voice</div>
        <div>Speaker</div>
        <div className="text-center">Audio</div>
      </div>

      {/* Dialogue Lines List */}
      <div className="flex-1 overflow-y-auto">
        {filteredSegments.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No dialogue segments yet</p>
              <p className="text-xs mt-1">Click "Scan Timeline" to extract dialogue</p>
            </div>
          </div>
        ) : (
          filteredSegments.map((segment, index) => {
            const originalIndex = segments.indexOf(segment);
            const isEditing = editingIndex === originalIndex;
            const isGeneratingThis = generatingIndex === originalIndex;
            const genderColor = getGenderColor(segment.gender);

            return (
              <div
                key={originalIndex}
                className={`
                  grid grid-cols-[60px_80px_80px_1fr_180px_120px_80px] gap-2 px-4 py-2.5 
                  border-b border-gray-800/50 hover:bg-[#1a1a1a]/50 transition-colors
                  ${selectedSegmentIndex === originalIndex ? 'bg-blue-500/10' : ''}
                `}
                onClick={() => setSelectedSegmentIndex(originalIndex)}
              >
                {/* Index */}
                <div className="flex items-center">
                  <span
                    className="w-8 h-8 flex items-center justify-center rounded text-xs font-medium"
                    style={{ backgroundColor: `${genderColor}20`, color: genderColor }}
                  >
                    {index + 1}
                  </span>
                </div>

                {/* Start Time */}
                <div className="flex items-center text-xs text-gray-400 font-mono">
                  {formatTime(segment.start_time || 0)}
                </div>

                {/* End Time */}
                <div className="flex items-center text-xs text-gray-400 font-mono">
                  {formatTime(segment.end_time || 0)}
                </div>

                {/* Text (Editable) */}
                <div className="flex items-center">
                  {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm bg-[#0a0a0a] border border-blue-500 rounded focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(originalIndex);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                      <button
                        onClick={() => handleSaveEdit(originalIndex)}
                        className="p-1 hover:bg-green-500/20 rounded transition-colors"
                      >
                        <Check className="w-4 h-4 text-green-500" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 w-full group">
                      <p className="flex-1 text-sm text-gray-200 line-clamp-2">
                        {segment.khmer_translation || segment.original_text || '(No text)'}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(originalIndex, segment.khmer_translation || segment.original_text || '');
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Voice Selector */}
                <div className="flex items-center">
                  <div className="relative w-full">
                    <select
                      value={segment.voice_id || segment.voice_name || ''}
                      onChange={(e) => handleVoiceChange(originalIndex, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-2 py-1.5 text-xs bg-[#0a0a0a] border border-gray-700 rounded focus:border-blue-500 focus:outline-none appearance-none pr-8"
                      style={{ color: genderColor }}
                    >
                      <option value="">Select Voice</option>
                      {Object.entries(voicesByGender).map(([gender, voices]) =>
                        voices.length > 0 ? (
                          <optgroup key={gender} label={gender.toUpperCase()}>
                            {voices.map((voice) => (
                              <option key={voice.id || voice.filename} value={voice.filename || voice.id}>
                                {voice.name}
                              </option>
                            ))}
                          </optgroup>
                        ) : null
                      )}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* Speaker Name */}
                <div className="flex items-center">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs text-gray-400 truncate">
                      {segment.speaker_name || 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Audio Actions */}
                <div className="flex items-center justify-center gap-1">
                  {segment.audioUrl ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewSegment(segment);
                      }}
                      className="p-1.5 hover:bg-green-500/20 rounded transition-colors"
                      title="Preview Audio"
                    >
                      <Volume2 className="w-4 h-4 text-green-500" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateLine(originalIndex, segment);
                      }}
                      disabled={isGeneratingThis || !segment.khmer_translation}
                      className="p-1.5 hover:bg-purple-500/20 rounded transition-colors disabled:opacity-30"
                      title="Generate Audio"
                    >
                      {isGeneratingThis ? (
                        <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-purple-500" />
                      )}
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this dialogue line?')) {
                        onDeleteSegment(originalIndex);
                      }
                    }}
                    className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                    title="Delete Line"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-t border-gray-800 text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>Total: {segments.length} lines</span>
          <span>•</span>
          <span>Duration: {formatTime(duration)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Voices loaded:</span>
          <span className="text-blue-400">{availableVoices.length}</span>
          <button
            onClick={loadAvailableVoices}
            disabled={isLoadingVoices}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingVoices ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
