import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Volume2,
  Sparkles,
  Save,
  RotateCcw,
  Sliders,
  Check,
  Play,
  Heart,
  Mic,
} from 'lucide-react';
import { CharacterVoice, TimelineSegment } from '../../types';
import { CURATED_CHARACTER_VOICES } from '../../constants/characterVoices';

interface CharacterInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  character?: CharacterVoice | null;
  segment?: TimelineSegment | null;
  characters: CharacterVoice[];
  onSaveProfile?: (profile: any) => void;
  onPreviewVoice: (filename: string) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const VOICE_PROFILES = [
  { id: 'female_01', label: 'Female 01 (រាជវង្ស / តួឯកស្រី)', gender: 'female', age: 'young_adult' },
  { id: 'male_01', label: 'Male 01 (មេទ័ព / តួឯកប្រុស)', gender: 'male', age: 'adult' },
  { id: 'young_female', label: 'Young Female (នារីវ័យក្មេង ស្រទន់)', gender: 'female', age: 'teen' },
  { id: 'young_male', label: 'Young Male (យុវជនក្លាហាន)', gender: 'male', age: 'teen' },
  { id: 'old_male', label: 'Old Male (ព្រឹទ្ធាចារ្យ / ឪពុក)', gender: 'male', age: 'elder' },
  { id: 'old_female', label: 'Old Female (លោកយាយ / ម្តាយ)', gender: 'female', age: 'elder' },
  { id: 'villain', label: 'Villain (តួអង្គកាច / មេបិសាច)', gender: 'male', age: 'adult' },
  { id: 'narrator', label: 'Narrator (អ្នករៀបរាប់ដំណើររឿង)', gender: 'male', age: 'adult' },
  { id: 'child', label: 'Child (កុមារតូច)', gender: 'female', age: 'child' },
  { id: 'ai_custom', label: 'AI Custom Voice (ក្លូនផ្ទាល់ខ្លួន)', gender: 'male', age: 'adult' },
];

export const CharacterInspectorModal: React.FC<CharacterInspectorModalProps> = ({
  isOpen,
  onClose,
  character,
  segment,
  characters,
  onSaveProfile,
  onPreviewVoice,
  onShowToast,
}) => {
  const activeCharacters = characters && characters.length > 0 ? characters : CURATED_CHARACTER_VOICES;
  const [characterName, setCharacterName] = useState(
    segment?.speaker_name || character?.label || ''
  );
  const [gender, setGender] = useState<'male' | 'female'>(
    character?.gender || segment?.gender || 'male'
  );
  const [ageStyle, setAgeStyle] = useState('Adult (25-35)');
  const [selectedVoice, setSelectedVoice] = useState(
    character?.filename || segment?.voiceFilename || segment?.voiceId?.replace(/^voxcpm:/, '') || (activeCharacters[0]?.filename || '')
  );

  useEffect(() => {
    if (segment?.speaker_name) {
      setCharacterName(segment.speaker_name);
    } else if (character?.label) {
      setCharacterName(character.label);
    } else {
      setCharacterName('');
    }
  }, [segment, character]);
  const [voiceModel, setVoiceModel] = useState('VoxCPM2 Neural V2');
  const [language, setLanguage] = useState('Khmer (ភាសាខ្មែរ)');
  const [emotion, setEmotion] = useState(segment?.emotion || 'Normal');
  const [speakingStyle, setSpeakingStyle] = useState('Cinematic Dramatic');
  const [speed, setSpeed] = useState(segment?.speed ?? 1.0);
  const [pitch, setPitch] = useState(segment?.pitch ?? 0);
  const [volume, setVolume] = useState(100);
  const [breath, setBreath] = useState(25);
  const [expressiveness, setExpressiveness] = useState(85);
  const [selectedProfile, setSelectedProfile] = useState('female_01');

  if (!isOpen) return null;

  const handleApplyProfile = (profileId: string) => {
    setSelectedProfile(profileId);
    const p = VOICE_PROFILES.find((x) => x.id === profileId);
    if (p) {
      setGender(p.gender as any);
      onShowToast(`បានជ្រើសរើស Voice Profile: "${p.label}"`, 'info');
    }
  };

  const handleSave = () => {
    onSaveProfile?.({
      characterName,
      gender,
      selectedVoice,
      emotion,
      speed,
      pitch,
      volume,
      breath,
      expressiveness,
      profile: selectedProfile,
    });
    onShowToast(`បានរក្សាទុក Voice Profile សម្រាប់ "${characterName}" ដោយជោគជ័យ!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 font-khmer animate-in fade-in select-none">
      <div className="w-full max-w-2xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-white dark:bg-[#181818] border-b border-slate-200 dark:border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#222226] border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-[#00C2FF]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-wide">
                Character Inspector & Voice Profile
              </h2>
              <p className="text-[10px] text-[#00C2FF] font-medium">
                គ្រប់គ្រងតួអង្គ និងកំណត់លក្ខណៈសំឡេងលម្អិត
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin text-xs text-slate-700 dark:text-slate-200">
          {/* Quick Voice Profile Presets */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Voice Profile Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {VOICE_PROFILES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyProfile(p.id)}
                  className={`p-2 rounded-xl border text-left text-[11px] font-semibold transition-all ${
                    selectedProfile === p.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                      : 'bg-white dark:bg-[#07111F] border-[rgba(100,180,255,0.12)] text-slate-600 dark:text-slate-300 hover:bg-white dark:bg-[#0E1C31]'
                  }`}
                >
                  <div className="truncate">{p.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields: Grid 2 Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Character Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Character Name
              </label>
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                className="w-full bg-white dark:bg-[#202020] border border-slate-200 dark:border-slate-200 dark:border-white/[0.08] focus:border-slate-200 dark:border-[#00C2FF] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white placeholder-zinc-500 outline-none"
                placeholder="បញ្ចូលឈ្មោះតួអង្គ (Character Name)..."
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Gender
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                    gender === 'male'
                      ? 'bg-blue-600/30 border-blue-400 text-blue-300'
                      : 'bg-white dark:bg-[#050B16] border-[rgba(100,180,255,0.15)] text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Male (ប្រុស)
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                    gender === 'female'
                      ? 'bg-pink-600/30 border-pink-400 text-pink-300'
                      : 'bg-white dark:bg-[#050B16] border-[rgba(100,180,255,0.15)] text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Female (ស្រី)
                </button>
              </div>
            </div>

            {/* Voice Sample */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-khmer">
                  Voice Actor (សំឡេងតួអង្គ Clone)
                </label>
                {selectedVoice && (
                  <button
                    type="button"
                    onClick={() => onPreviewVoice(selectedVoice)}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                    title="សាកស្តាប់សំឡេងគំរូ"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>សាកស្តាប់</span>
                  </button>
                )}
              </div>
              <select
                value={selectedVoice}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedVoice(val);
                  const matched = activeCharacters.find((c) => c.filename === val || c.id === val);
                  if (matched?.gender) setGender(matched.gender);
                }}
                className="w-full bg-white dark:bg-[#050B16] border border-[rgba(100,180,255,0.18)] focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-cyan-300 outline-none cursor-pointer font-khmer"
              >
                <optgroup label="🌸 សំឡេង Clone តួស្រី (Female Clones)">
                  {activeCharacters
                    .filter((c) => c.gender === 'female')
                    .map((c) => (
                      <option key={c.id} value={c.filename} className="bg-white dark:bg-[#0B1628] text-pink-300">
                        {c.label}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="👑 សំឡេង Clone តួប្រុស (Male Clones)">
                  {activeCharacters
                    .filter((c) => c.gender !== 'female')
                    .map((c) => (
                      <option key={c.id} value={c.filename} className="bg-white dark:bg-[#0B1628] text-blue-300">
                        {c.label}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="🎙️ សំឡេងស្តង់ដារ Neural">
                  <option value="km-KH-PisethNeural" className="bg-white dark:bg-[#0B1628] text-slate-600 dark:text-slate-300">🎙️ Piseth Neural (ស្តង់ដារប្រុស)</option>
                  <option value="km-KH-SreymomNeural" className="bg-white dark:bg-[#0B1628] text-slate-600 dark:text-slate-300">🎙️ Sreymom Neural (ស្តង់ដារស្រី)</option>
                </optgroup>
              </select>
            </div>

            {/* Voice Model */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Voice Model
              </label>
              <select
                value={voiceModel}
                onChange={(e) => setVoiceModel(e.target.value)}
                className="w-full bg-white dark:bg-[#050B16] border border-[rgba(100,180,255,0.18)] focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="VoxCPM2 Neural V2">VoxCPM2 Neural V2 (Local Turbo)</option>
                <option value="Google Gemini 3.5">Google Gemini 3.5 Pro Studio</option>
                <option value="ElevenLabs Multilingual">ElevenLabs Multilingual v2</option>
                <option value="Azure Cognitive Speech">Azure Neural KM-KH</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Language
              </label>
              <input
                type="text"
                readOnly
                value={language}
                className="w-full bg-white dark:bg-[#050B16] border border-[rgba(100,180,255,0.18)] rounded-xl px-3 py-2 text-xs text-slate-500 dark:text-slate-400"
              />
            </div>

            {/* Emotion */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-1 font-khmer">
                អារម្មណ៍ (Emotion)
              </label>
              <select
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
                className="w-full bg-white dark:bg-[#050B16] border border-[rgba(100,180,255,0.18)] focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 outline-none cursor-pointer font-khmer"
              >
                {[
                  { id: 'normal', label: 'ធម្មតា' },
                  { id: 'happy', label: 'សប្បាយ' },
                  { id: 'sad', label: 'សោកសៅ' },
                  { id: 'angry', label: 'ខឹង' },
                  { id: 'fear', label: 'ភ័យ' },
                  { id: 'surprised', label: 'ភ្ញាក់ផ្អើល' },
                  { id: 'excited', label: 'រំភើប' },
                  { id: 'calm', label: 'ស្ងប់' },
                  { id: 'romantic', label: 'រ៉ូមែនទិក' },
                  { id: 'tense', label: 'តានតឹង' },
                  { id: 'comedy', label: 'កំប្លែង' },
                  { id: 'power', label: 'អំណាច' },
                ].map((emo) => (
                  <option key={emo.id} value={emo.id} className="bg-white dark:bg-[#0B1628] text-slate-700 dark:text-slate-200">
                    {emo.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sliders: Speed, Pitch, Volume, Breath, Expressiveness */}
          <div className="p-3 bg-white dark:bg-[#07111F] border border-[rgba(100,180,255,0.12)] rounded-2xl space-y-3 font-khmer">
            {/* Speed */}
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300 font-medium">ល្បឿន (Speed):</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-28 h-1 accent-cyan-400 bg-slate-700 rounded cursor-pointer"
                />
                <span className="font-mono text-cyan-400 font-bold w-10 text-right">
                  {speed.toFixed(1)}x
                </span>
              </div>
            </div>

            {/* Pitch */}
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300 font-medium">កម្ពស់សំឡេង (Pitch):</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="-6"
                  max="6"
                  step="1"
                  value={pitch}
                  onChange={(e) => setPitch(parseInt(e.target.value, 10))}
                  className="w-28 h-1 accent-cyan-400 bg-slate-700 rounded cursor-pointer"
                />
                <span className="font-mono text-cyan-400 font-bold w-10 text-right">
                  {pitch > 0 ? `+${pitch}` : pitch}
                </span>
              </div>
            </div>

            {/* Volume */}
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300 font-medium">កម្រិតសំឡេង (Volume):</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="150"
                  step="5"
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                  className="w-28 h-1 accent-cyan-400 bg-slate-700 rounded cursor-pointer"
                />
                <span className="font-mono text-cyan-400 font-bold w-10 text-right">
                  {volume}%
                </span>
              </div>
            </div>

            {/* Breath */}
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300 font-medium">សំឡេងដង្ហើម (Breath):</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={breath}
                  onChange={(e) => setBreath(parseInt(e.target.value, 10))}
                  className="w-28 h-1 accent-purple-400 bg-slate-700 rounded cursor-pointer"
                />
                <span className="font-mono text-purple-400 font-bold w-10 text-right">
                  {breath}%
                </span>
              </div>
            </div>

            {/* Expressiveness */}
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300 font-medium">មនោសញ្ចេតនា (Expression):</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={expressiveness}
                  onChange={(e) => setExpressiveness(parseInt(e.target.value, 10))}
                  className="w-28 h-1 accent-emerald-400 bg-slate-700 rounded cursor-pointer"
                />
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold w-10 text-right">
                  {expressiveness}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-white dark:bg-[#07111F] border-t border-[rgba(100,180,255,0.15)] flex items-center justify-between font-khmer">
          <button
            type="button"
            onClick={() => onPreviewVoice(selectedVoice)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0E1C31] hover:bg-white dark:bg-[#13243d] border border-[rgba(100,180,255,0.2)] text-cyan-300 font-bold text-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>▶ សាកស្តាប់</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-transparent hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 text-xs font-semibold"
            >
              បោះបង់
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-800 dark:text-white font-bold text-xs shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>✨ រក្សាទុក Voice Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
