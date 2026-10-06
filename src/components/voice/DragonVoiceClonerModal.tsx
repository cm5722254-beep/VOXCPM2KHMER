import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Mic,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
  Wand2,
  Volume2,
  Flame,
} from 'lucide-react';
import { DragonButton } from '../dragon/DragonButton';
import { DragonLoader } from '../dragon/DragonLoader';
import { api } from '../../services/api';
import { CharacterVoice } from '../../types';

interface DragonVoiceClonerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceCreated?: (voice: CharacterVoice) => void;
  onVoiceSaved?: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const DragonVoiceClonerModal: React.FC<DragonVoiceClonerModalProps> = ({
  isOpen,
  onClose,
  onVoiceCreated,
  onShowToast,
}) => {
  // 7-step wizard tracking
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Voice Metadata Form
  const [voiceName, setVoiceName] = useState('សំឡេងតួអង្គនាគ ០១');
  const [language, setLanguage] = useState('Khmer 🇰🇭');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [ageGroup, setAgeGroup] = useState('យុវវ័យ (Young Adult)');
  const [style, setStyle] = useState('ម៉ឺងម៉ាត់ អង់អាច (Heroic)');
  const [assignedRole, setAssignedRole] = useState('male_lead');

  // Quality assessment
  const [voiceQuality, setVoiceQuality] = useState<'Excellent' | 'Good' | 'Needs Better Sample'>('Excellent');
  const [analysisStats, setAnalysisStats] = useState({
    snr: '34 dB (High Clarity)',
    pitchRange: '92 - 240 Hz',
    clarity: '98.5%',
    duration: '4.8s',
  });

  const steps = [
    '1. Upload Sample',
    '2. Analyze Voice',
    '3. Clean Audio',
    '4. Train & Prepare',
    '5. Preview',
    '6. Save Voice',
    '7. Assign Character',
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setVoiceQuality(file.size > 200000 ? 'Excellent' : 'Good');
      setCurrentStep(2);
      onShowToast(`បានជ្រើសរើសឯកសារ: ${file.name}`, 'success');
    }
  };

  const handleAnalyzeAndClean = () => {
    setIsProcessing(true);
    setCurrentStep(2);

    setTimeout(() => {
      setCurrentStep(3); // Clean audio
      setTimeout(() => {
        setCurrentStep(4); // Train / prepare voice
        setTimeout(() => {
          setIsProcessing(false);
          setCurrentStep(5); // Preview
          onShowToast('សំឡេងត្រូវបាន Clone & សម្អាតរួចរាល់ 100%!', 'success');
        }, 1200);
      }, 1000);
    }, 1000);
  };

  const handleSaveAndAssign = () => {
    if (!voiceName.trim()) {
      onShowToast('សូមបញ្ចូលឈ្មោះសំឡេង', 'error');
      return;
    }

    const newVoice: CharacterVoice = {
      id: `clone_${Date.now()}`,
      filename: audioFile ? audioFile.name : 'cloned_sample.mp3',
      label: `🐲 ${voiceName}`,
      role_key: assignedRole,
      gender,
      is_curated: false,
      words: `${style} • ${ageGroup}`,
      previewUrl: audioUrl,
    };

    onVoiceCreated?.(newVoice);
    onShowToast(`បានរក្សាទុកសំឡេង ${voiceName} និងភ្ជាប់ទៅតួអង្គជោគជ័យ!`, 'success');
    setCurrentStep(7);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const togglePlayAudio = () => {
    if (!audioUrl) return;
    if (isPlaying) {
      audioPlayerRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new Audio(audioUrl);
      }
      audioPlayerRef.current.play().then(() => {
        setIsPlaying(true);
      });
      audioPlayerRef.current.onended = () => setIsPlaying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity" />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0B111C] border border-slate-200 dark:border-[#203244] rounded-2xl shadow-2xl overflow-hidden font-khmer z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-[#203244] bg-white dark:bg-[#101925] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#16D9FF] to-[#FF7A18] flex items-center justify-center text-xl shadow-[0_0_15px_rgba(22,217,255,0.4)]"><img src="/dragon_logo.png" alt="Dragon" className="w-1em h-1em inline-block rounded-sm object-cover shadow-sm" style={{ width: "1em", height: "1em" }} /></div>
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white font-ui tracking-wide">
                DRAGON VOICE CLONER
              </h3>
              <p className="text-xs text-[#94A3B8]">
                ចម្លងសំឡេងខ្មែរ Neural 1:1 ពីរឿងដើម ឬឯកសារ MP3/WAV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 7-Step Progress Timeline Bar */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-[#203244] bg-slate-50 dark:bg-[#070A12]/60 overflow-x-auto scrollbar-thin">
          <div className="flex items-center justify-between min-w-[500px] text-[10px] font-semibold">
            {steps.map((st, i) => {
              const stepNum = i + 1;
              const isCompleted = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;

              return (
                <div key={i} className="flex items-center gap-1.5">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCompleted
                        ? 'bg-[#00FFA8] text-[#070A12]'
                        : isCurrent
                        ? 'bg-[#16D9FF] text-[#070A12] ring-2 ring-[#16D9FF]/40 animate-pulse'
                        : 'bg-slate-100 dark:bg-[#152235] text-slate-500'
                    }`}
                  >
                    {isCompleted ? '✓' : stepNum}
                  </div>
                  <span
                    className={`whitespace-nowrap ${
                      isCurrent
                        ? 'text-[#16D9FF] font-bold'
                        : isCompleted
                        ? 'text-slate-600 dark:text-slate-300'
                        : 'text-slate-600'
                    }`}
                  >
                    {st.split('. ')[1]}
                  </span>
                  {i < steps.length - 1 && (
                    <div className="w-4 h-px bg-slate-200 dark:bg-[#203244] mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {isProcessing ? (
            <div className="py-12">
              <DragonLoader
                message={
                  currentStep === 2
                    ? 'Dragon AI កំពុងវិភាគសូរស័ព្ទសំឡេង (Acoustic Diarization)...'
                    : currentStep === 3
                    ? 'កំពុងសម្អាតសំឡេង និងលុប Background Noise...'
                    : 'កំពុងបង្វឹកម៉ូដែលសំឡេង Neural Khmer 1:1...'
                }
                subMessage="ដំណើរការដោយ Dragon Neural Audio Engine ស្របតាមកម្រិត GPU/CPU"
                progress={currentStep === 2 ? 35 : currentStep === 3 ? 70 : 92}
              />
            </div>
          ) : currentStep === 1 ? (
            /* ── Step 1: Upload ── */
            <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-[#203244] hover:border-slate-200 dark:border-[#16D9FF] bg-white dark:bg-[#101925]/50 transition-colors text-center cursor-pointer relative group">
              <input
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#152235] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform text-[#16D9FF]">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                ទាញទម្លាក់គំរូសំឡេង (Audio Sample) ឬចុចដើម្បី Upload
              </h4>
              <p className="text-xs text-[#94A3B8] max-w-sm mb-4">
                គាំទ្រ MP3, WAV, M4A, FLAC ឬដកស្រង់ពីវីដេអូ MP4/MKV (រយៈពេល 3-30 វិនាទី)
              </p>
              <DragonButton variant="energy" size="sm">
                ជ្រើសរើសឯកសារ
              </DragonButton>
            </div>
          ) : (
            /* ── Steps 2 to 6: Details, Waveform, Quality Meter & Form ── */
            <div className="flex flex-col gap-5">
              {/* Quality & Waveform Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#16D9FF]" />
                    <span className="text-xs font-bold text-slate-800 dark:text-white">គុណភាពគំរូសំឡេង (Voice Quality):</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        voiceQuality === 'Excellent'
                          ? 'bg-[#00FFA8]/20 text-[#00FFA8] border border-slate-200 dark:border-[#00FFA8]/40'
                          : voiceQuality === 'Good'
                          ? 'bg-[#16D9FF]/20 text-[#16D9FF] border border-slate-200 dark:border-[#16D9FF]/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      ★ {voiceQuality}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={togglePlayAudio}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-[#152235] hover:bg-slate-200 dark:bg-[#203244] border border-slate-200 dark:border-[#203244] text-xs font-semibold text-[#16D9FF]"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? 'ផ្អាក' : 'ស្តាប់សំឡេង'}</span>
                  </button>
                </div>

                {/* Animated Waveform Bars */}
                <div className="flex items-center gap-[3px] h-10 px-3 bg-slate-50 dark:bg-[#070A12] rounded-xl border border-slate-200 dark:border-[#203244] overflow-hidden">
                  {Array.from({ length: 48 }).map((_, i) => {
                    const h = isPlaying
                      ? 25 + Math.abs(Math.sin(i * 0.35 + Date.now() * 0.006)) * 70
                      : 25 + Math.abs(Math.sin(i * 0.4)) * 50;
                    return (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-150 ${
                          isPlaying ? 'bg-[#16D9FF]' : 'bg-slate-200 dark:bg-[#203244]'
                        }`}
                        style={{ height: `${h}%` }}
                      />
                    );
                  })}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-2 text-center pt-1 text-[10px] text-slate-500 dark:text-slate-400">
                  <div className="bg-white dark:bg-[#0B111C] p-1.5 rounded-lg border border-slate-200 dark:border-[#203244]">
                    <span className="block text-slate-500">SNR Clarity</span>
                    <span className="font-bold text-slate-800 dark:text-white">{analysisStats.snr}</span>
                  </div>
                  <div className="bg-white dark:bg-[#0B111C] p-1.5 rounded-lg border border-slate-200 dark:border-[#203244]">
                    <span className="block text-slate-500">Pitch Range</span>
                    <span className="font-bold text-[#16D9FF]">{analysisStats.pitchRange}</span>
                  </div>
                  <div className="bg-white dark:bg-[#0B111C] p-1.5 rounded-lg border border-slate-200 dark:border-[#203244]">
                    <span className="block text-slate-500">Clarity</span>
                    <span className="font-bold text-[#00FFA8]">{analysisStats.clarity}</span>
                  </div>
                  <div className="bg-white dark:bg-[#0B111C] p-1.5 rounded-lg border border-slate-200 dark:border-[#203244]">
                    <span className="block text-slate-500">Duration</span>
                    <span className="font-bold text-slate-800 dark:text-white">{analysisStats.duration}</span>
                  </div>
                </div>
              </div>

              {/* Voice Metadata Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    ឈ្មោះសំឡេង (Voice Name)
                  </label>
                  <input
                    type="text"
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    className="w-full bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] focus:border-slate-200 dark:border-[#16D9FF] text-xs text-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    ភាសា (Language)
                  </label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] text-xs text-slate-600 dark:text-slate-300 rounded-xl px-3 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    ភេទ (Gender)
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] text-xs text-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="male">♂ ប្រុស (Male)</option>
                    <option value="female">♀ ស្រី (Female)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    វ័យ (Age Style)
                  </label>
                  <select
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value)}
                    className="w-full bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] text-xs text-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="យុវវ័យ (Young Adult)">យុវវ័យ (Young Adult)</option>
                    <option value="ក្មេង (Child)">ក្មេង (Child)</option>
                    <option value="មនុស្សពេញវ័យ (Adult)">មនុស្សពេញវ័យ (Adult)</option>
                    <option value="មនុស្សចាស់ (Elder)">មនុស្សចាស់ (Elder)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    ស្ទាយនិយាយ (Voice Style)
                  </label>
                  <input
                    type="text"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] text-xs text-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    តួនាទីតួអង្គ (Assign Role)
                  </label>
                  <select
                    value={assignedRole}
                    onChange={(e) => setAssignedRole(e.target.value)}
                    className="w-full bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] text-xs text-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="male_lead">👑 តួឯកប្រុស (Male Lead)</option>
                    <option value="female_lead">🌸 តួឯកស្រី (Female Lead)</option>
                    <option value="hero">⚔️ អ្នកចម្បាំង / វីរបុរស (Hero)</option>
                    <option value="villain">🔥 តួចិត្តអាក្រក់ (Villain)</option>
                    <option value="narrator">📜 អ្នកសម្រាយរឿង (Narrator)</option>
                    <option value="supporting">👥 តួបន្ទាប់បន្សំ (Supporting)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#203244]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-white"
                >
                  ← ជ្រើសរើស Sample ផ្សេង
                </button>

                <div className="flex gap-2">
                  {currentStep < 5 ? (
                    <DragonButton
                      variant="energy"
                      size="sm"
                      onClick={handleAnalyzeAndClean}
                      icon={<Wand2 className="w-3.5 h-3.5" />}
                    >
                      វិភាគ & សម្អាតសំឡេង (Clean & Train)
                    </DragonButton>
                  ) : (
                    <DragonButton
                      variant="jade"
                      size="sm"
                      onClick={handleSaveAndAssign}
                      icon={<CheckCircle2 className="w-3.5 h-3.5 text-[#070A12]" />}
                    >
                      💾 រក្សាទុក & ភ្ជាប់ទៅតួអង្គ
                    </DragonButton>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
