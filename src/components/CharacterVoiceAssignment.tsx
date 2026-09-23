import React, { useState, useEffect } from 'react';
import { Users, Play, RefreshCw, AlertCircle, CheckCircle2, User, UserCircle } from 'lucide-react';
import axios from 'axios';
import { GlassCard, GlassButton, GlassBadge } from './GlassCard';

interface Character {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'child' | 'elderly';
  lineCount: number;
  sampleText: string;
  assignedVoice: string;
  voiceLabel: string;
}

interface CharacterVoiceAssignmentProps {
  videoFilename: string;
  onAssignmentComplete?: (mapping: Record<string, string>) => void;
}

export default function CharacterVoiceAssignment({
  videoFilename,
  onAssignmentComplete
}: CharacterVoiceAssignmentProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (videoFilename) {
      loadAvailableVoices();
    }
  }, [videoFilename]);

  const loadAvailableVoices = async () => {
    try {
      // Load voice samples from server
      const response = await axios.get('/api/voices/list');
      setAvailableVoices(response.data.voices || []);
    } catch (err) {
      console.error('Failed to load voices:', err);
    }
  };

  const scanCharacters = async () => {
    setIsScanning(true);
    setError(null);

    try {
      const response = await axios.post('/api/dubbing/scan-timeline', {
        filename: videoFilename,
        scope: 'full',
        voiceMode: 'voice_actor_clone'
      });

      // Parse segments into unique characters
      const segments = response.data.segments || [];
      const characterMap = new Map<string, Character>();

      segments.forEach((seg: any) => {
        const speakerId = seg.speaker_id || seg.speaker_name || 'unknown';
        
        if (!characterMap.has(speakerId)) {
          // Detect gender from voice characteristics
          const gender = detectGender(seg);
          
          characterMap.set(speakerId, {
            id: speakerId,
            name: `តួអង្គ ${characterMap.size + 1}`,
            gender,
            lineCount: 1,
            sampleText: seg.text || '',
            assignedVoice: seg.voiceId || '',
            voiceLabel: seg.voiceLabel || ''
          });
        } else {
          const char = characterMap.get(speakerId)!;
          char.lineCount++;
        }
      });

      const charArray = Array.from(characterMap.values());
      
      // Auto-assign voices based on gender (no duplicates!)
      autoAssignVoices(charArray);
      
      setCharacters(charArray);
      
      // Build mapping for API
      const mapping: Record<string, string> = {};
      charArray.forEach(char => {
        mapping[char.id] = char.assignedVoice;
      });
      
      if (onAssignmentComplete) {
        onAssignmentComplete(mapping);
      }

    } catch (err: any) {
      setError(err.response?.data?.detail || 'មិនអាចស្កេនតួអង្គបានទេ');
    } finally {
      setIsScanning(false);
    }
  };

  const detectGender = (segment: any): 'male' | 'female' | 'child' | 'elderly' => {
    // Simple heuristic based on pitch and energy
    const pitch = segment.emotionParams?.pitch || 0;
    const energy = segment.emotionParams?.energy || 50;
    const volume = segment.emotionParams?.volume || 70;

    if (pitch > 5 && energy > 70) {
      return 'female';
    } else if (pitch < -3 && volume < 50) {
      return 'elderly';
    } else if (energy > 85 && volume > 80) {
      return 'child';
    }
    return 'male';
  };

  const autoAssignVoices = (characters: Character[]) => {
    // Group voices by gender
    const maleVoices = availableVoices.filter(v => v.gender === 'male');
    const femaleVoices = availableVoices.filter(v => v.gender === 'female');
    
    // Track used voices to prevent duplicates
    const usedVoices = new Set<string>();

    // Sort characters by line count (main characters first)
    characters.sort((a, b) => b.lineCount - a.lineCount);

    characters.forEach((char, index) => {
      let voicePool: any[] = [];
      
      if (char.gender === 'female') {
        voicePool = femaleVoices;
      } else {
        voicePool = maleVoices;
      }

      // Find first unused voice
      const availableVoice = voicePool.find(v => !usedVoices.has(v.id));
      
      if (availableVoice) {
        char.assignedVoice = availableVoice.id;
        char.voiceLabel = availableVoice.label;
        usedVoices.add(availableVoice.id);
      } else {
        // Fallback to default
        char.assignedVoice = char.gender === 'female' 
          ? 'voxcpm:hang_phleung_char_6_female.mp3'
          : 'voxcpm:hang_phleung_char_2_male.mp3';
      }
    });
  };

  const changeVoice = (characterId: string, voiceId: string) => {
    setCharacters(prev => 
      prev.map(char => {
        if (char.id === characterId) {
          const voice = availableVoices.find(v => v.id === voiceId);
          return {
            ...char,
            assignedVoice: voiceId,
            voiceLabel: voice?.label || voiceId
          };
        }
        return char;
      })
    );

    // Update mapping
    const mapping: Record<string, string> = {};
    characters.forEach(char => {
      mapping[char.id] = char.id === characterId ? voiceId : char.assignedVoice;
    });
    
    if (onAssignmentComplete) {
      onAssignmentComplete(mapping);
    }
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male': return '👨';
      case 'female': return '👩';
      case 'child': return '🧒';
      case 'elderly': return '👴';
      default: return '👤';
    }
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'male': return 'sky';
      case 'female': return 'violet';
      case 'child': return 'emerald';
      case 'elderly': return 'amber';
      default: return 'sky';
    }
  };

  return (
    <GlassCard className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-slate-200">តួអង្គ & សំឡេង</h3>
            <p className="text-xs text-slate-400">ស្កេននិងរៀបចំសំឡេងតួអង្គ</p>
          </div>
        </div>

        <GlassButton
          variant="primary"
          onClick={scanCharacters}
          disabled={isScanning || !videoFilename}
          loading={isScanning}
          icon={<RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />}
          size="sm"
        >
          ស្កេនតួអង្គ
        </GlassButton>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Character List */}
      {characters.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-300">
              រកឃើញ {characters.length} តួអង្គ
            </span>
            <GlassBadge variant="emerald">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              រៀបចំរួច
            </GlassBadge>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
            {characters.map((char) => (
              <div
                key={char.id}
                className="glass-card p-3 md:p-4 space-y-3 hover:bg-white/[0.03] transition-all"
              >
                {/* Character Info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="text-2xl flex-shrink-0">
                      {getGenderIcon(char.gender)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-200">{char.name}</span>
                        <GlassBadge variant={getGenderColor(char.gender) as any} className="text-[9px]">
                          {char.gender === 'male' ? 'ប្រុស' :
                           char.gender === 'female' ? 'ស្រី' :
                           char.gender === 'child' ? 'ក្មេង' : 'ចាស់'}
                        </GlassBadge>
                      </div>
                      <div className="text-xs text-slate-400 mb-2">
                        {char.lineCount} ឃ្លា
                      </div>
                      {char.sampleText && (
                        <p className="text-xs text-slate-500 line-clamp-2 italic">
                          "{char.sampleText}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Voice Selection */}
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 block">សំឡេងដែលបានជ្រើសរើស:</label>
                  <select
                    value={char.assignedVoice}
                    onChange={(e) => changeVoice(char.id, e.target.value)}
                    className="w-full input-field text-sm py-2"
                  >
                    <option value="">-- ជ្រើសរើសសំឡេង --</option>
                    {availableVoices
                      .filter(v => v.gender === char.gender || v.gender === 'neutral')
                      .map(voice => (
                        <option key={voice.id} value={voice.id}>
                          {voice.label} ({voice.gender === 'male' ? 'ប្រុស' : 'ស្រី'})
                        </option>
                      ))}
                  </select>
                  {char.voiceLabel && (
                    <div className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{char.voiceLabel}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-blue-400" />
              <span>រៀបចំតួអង្គស្វ័យប្រវត្តិតាមភេទ</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-blue-400" />
              <span>តួអង្គមួយ = សំឡេងមួយ (មិនច្រឡំ)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-blue-400" />
              <span>អាចប្តូរសំឡេងតួអង្គបានតាមចិត្ត</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {characters.length === 0 && !isScanning && (
        <div className="text-center py-8 text-slate-500">
          <UserCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">ចុច "ស្កេនតួអង្គ" ដើម្បីចាប់ផ្តើម</p>
        </div>
      )}
    </GlassCard>
  );
}
