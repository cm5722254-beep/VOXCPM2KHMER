import React, { useState, useEffect } from 'react';
import { Sparkles, X, Wand2, Volume2, Sliders, CheckCircle2, Play, Square, Loader2 } from 'lucide-react';
import { CharacterVoice } from '../../types';
import { CURATED_CHARACTER_VOICES } from '../../constants/characterVoices';
import { api } from '../../services/api';

interface GenerateVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterName?: string;
  defaultText?: string;
  voiceName?: string;
  characters?: CharacterVoice[];
  onGenerate: (data: {
    character: string;
    text: string;
    voice: string;
    emotion: string;
    speed: number;
    pitch: number;
    style: string;
    quality: string;
    audioUrl?: string;
  }) => Promise<void> | void;
}

export const GenerateVoiceModal: React.FC<GenerateVoiceModalProps> = ({
  isOpen,
  onClose,
  characterName = '',
  defaultText = '',
  voiceName = '',
  characters = [],
  onGenerate,
}) => {
  const [character, setCharacter] = useState(characterName || '');
  const [text, setText] = useState(defaultText || '');
  const [voice, setVoice] = useState(voiceName || '');
  const [emotion, setEmotion] = useState('Happy');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [style, setStyle] = useState('Natural');
  const [quality, setQuality] = useState('Ultra');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const activeCharacters = characters && characters.length > 0 ? characters : CURATED_CHARACTER_VOICES;

  useEffect(() => {
    if (isOpen) {
      setCharacter(characterName || '');
      setText(defaultText || '');
      setVoice(voiceName || (activeCharacters[0]?.filename || 'vp_character_2_male.mp3'));
    }
  }, [isOpen, characterName, defaultText, voiceName, characters]);

  if (!isOpen) return null;

  const steps = [
    { title: 'Analyzing text...', khmer: 'វិភាគអត្ថបទ...' },
    { title: 'Generating voice...', khmer: 'កំពុងបង្កើតសំឡេង...' },
    { title: 'Synchronizing timing...', khmer: 'កំពុងផ្គូផ្គងពេលវេលា...' },
    { title: 'Finalizing audio...', khmer: 'កំពុងបញ្ចប់សំឡេង...' },
  ];

  const getMatchedChar = () => {
    return activeCharacters.find(
      (c) => c.filename === voice || c.id === voice || c.label === voice
    );
  };

  const getMappedVoiceId = () => {
    const matched = getMatchedChar();
    if (matched) {
      return matched.id;
    }
    if (voice.startsWith('vp_character_') || voice.startsWith('voxcpm:')) {
      return voice.startsWith('voxcpm:') ? voice : `voxcpm:${voice}`;
    }
    const v = voice.toLowerCase();
    if (v.includes('female') || v.includes('sreymom') || v.includes('sokha') || v.includes('ស្រី')) {
      return 'km-KH-SreymomNeural';
    }
    return 'km-KH-PisethNeural';
  };

  const handleStartGenerate = async () => {
    setIsGenerating(true);
    setCurrentStep(1);

    try {
      const matched = getMatchedChar();
      const isFemale = matched
        ? matched.gender === 'female'
        : (voice.toLowerCase().includes('female') || voice.toLowerCase().includes('sreymom') || voice.toLowerCase().includes('ស្រី'));
      const r = await api.generateLine({
        text,
        gender: isFemale ? 'female' : 'male',
        voiceId: getMappedVoiceId(),
        emotion: emotion.toLowerCase(),
        speed,
        pitch,
      });

      setCurrentStep(3);

      if (r.success && r.audioUrl) {
        const audio = new Audio(r.audioUrl);
        audio.play().catch(() => {});

        await onGenerate({
          character,
          text,
          voice,
          emotion,
          speed,
          pitch,
          style,
          quality,
          audioUrl: r.audioUrl,
        });
      }
    } catch (err) {
      console.error('Failed to generate line voice:', err);
    } finally {
      setIsGenerating(false);
      onClose();
    }
  };

  const handlePreviewAudio = async () => {
    setIsPlayingPreview(true);
    try {
      const isFemale = voice.toLowerCase().includes('female') || voice.toLowerCase().includes('sreymom') || voice.toLowerCase().includes('ស្រី');
      const r = await api.generateLine({
        text,
        gender: isFemale ? 'female' : 'male',
        voiceId: getMappedVoiceId(),
        emotion: emotion.toLowerCase(),
        speed,
        pitch,
      });

      if (r.success && r.audioUrl) {
        const audio = new Audio(r.audioUrl);
        audio.onended = () => setIsPlayingPreview(false);
        audio.onerror = () => setIsPlayingPreview(false);
        await audio.play();
      } else {
        setIsPlayingPreview(false);
      }
    } catch (err) {
      console.error('Preview error:', err);
      setIsPlayingPreview(false);
    }
  };

  return (
    /* ── Backdrop: bg-black/70 backdrop-blur-md with vignette ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 font-khmer"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.70) 60%, rgba(0,0,0,0.92) 100%)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* ── Modal Container ── */}
      <div
        className="w-full max-w-xl rounded-2xl bg-[#141417] border border-white/[0.10] shadow-2xl overflow-hidden flex flex-col text-zinc-200 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 relative">
          {/* Gradient border-bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide leading-tight">
                GENERATE AI VOICE{' '}
                <span className="text-emerald-400 text-xs font-normal">| បង្កើតសំឡេង AI</span>
              </h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">High-fidelity Khmer neural synthesis engine</p>
            </div>
          </div>

          {/* Close button with hover ring */}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] ring-0 hover:ring-1 hover:ring-white/20 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">

          {/* Character & Voice */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">
                Character <span className="text-emerald-400 normal-case font-normal">(តួអង្គ)</span>
              </label>
              <input
                type="text"
                value={character}
                onChange={(e) => setCharacter(e.target.value)}
                placeholder="បញ្ចូលឈ្មោះតួអង្គ..."
                className="w-full bg-[#0f1013] border border-white/[0.10] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition placeholder-zinc-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Voice Model
                </label>
                {voice && (
                  <button
                    type="button"
                    onClick={() => {
                      const matched = getMatchedChar();
                      const filename = matched?.filename || voice.replace(/^voxcpm:/, '');
                      const audio = new Audio(`/media/samples/${filename}`);
                      audio.play().catch(() => {});
                    }}
                    className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>សាកស្តាប់</span>
                  </button>
                )}
              </div>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full bg-[#0f1013] border border-white/[0.10] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition cursor-pointer font-khmer"
              >
                <optgroup label="🌸 សំឡេង Clone តួស្រី (Female Clones)">
                  {activeCharacters
                    .filter((c) => c.gender === 'female')
                    .map((c) => (
                      <option key={c.id} value={c.filename}>{c.label}</option>
                    ))}
                </optgroup>
                <optgroup label="👑 សំឡេង Clone តួប្រុស (Male Clones)">
                  {activeCharacters
                    .filter((c) => c.gender !== 'female')
                    .map((c) => (
                      <option key={c.id} value={c.filename}>{c.label}</option>
                    ))}
                </optgroup>
                <optgroup label="🎙️ សំឡេងស្តង់ដារ Neural">
                  <option value="km-KH-PisethNeural">Piseth Neural (Standard Male)</option>
                  <option value="km-KH-SreymomNeural">Sreymom Neural (Standard Female)</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Dialogue Text */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">
              Khmer Text <span className="text-emerald-400 normal-case font-normal">(អត្ថបទនិយាយ)</span>
            </label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="បញ្ចូលអត្ថបទសន្ទនាជាភាសាខ្មែរនៅទីនេះ..."
              className="w-full bg-[#0f1013] border border-white/[0.10] rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition placeholder-zinc-600 leading-relaxed resize-none"
            />
          </div>

          {/* Emotion & Speaking Style */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">
                Emotion <span className="text-emerald-400 normal-case font-normal">(អារម្មណ៍)</span>
              </label>
              <select
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
                className="w-full bg-[#0f1013] border border-white/[0.10] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition cursor-pointer"
              >
                <option value="Normal">Normal (ធម្មតា)</option>
                <option value="Happy">Happy (សប្បាយរីករាយ)</option>
                <option value="Sad">Sad (ក្រៀមក្រំ)</option>
                <option value="Excited">Excited (រំភើប)</option>
                <option value="Angry">Angry (ខឹងសម្បារ)</option>
                <option value="Whisper">Whisper (ខ្សឹប)</option>
                <option value="Dramatic">Dramatic (រំជួលចិត្ត)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">
                Speaking Style <span className="text-emerald-400 normal-case font-normal">(ស្ទីលនិយាយ)</span>
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-[#0f1013] border border-white/[0.10] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition cursor-pointer"
              >
                <option value="Natural">Natural (ធម្មជាតិ)</option>
                <option value="Cinematic">Cinematic (ភាពយន្ត)</option>
                <option value="Expressive">Expressive (រស់រវើក)</option>
                <option value="Storyteller">Storyteller (អ្នកនិទាន)</option>
                <option value="FastPaced">Fast Paced (រហ័សទាន់ចិត្ត)</option>
              </select>
            </div>
          </div>

          {/* Speed & Pitch Controls */}
          <div className="rounded-xl bg-[#1a1d23] border border-white/[0.08] p-4 grid grid-cols-2 gap-4 hover:border-white/[0.14] transition-colors">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-zinc-400 font-semibold">Speed (ល្បឿន)</span>
                <span className="font-mono text-emerald-400 font-bold">{speed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-zinc-400 font-semibold">Pitch (កម្ពស់)</span>
                <span className="font-mono text-emerald-400 font-bold">{pitch > 0 ? `+${pitch}` : pitch}</span>
              </div>
              <input
                type="range"
                min="-5"
                max="5"
                step="1"
                value={pitch}
                onChange={(e) => setPitch(parseInt(e.target.value))}
                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          {/* Quality Mode — pill tabs */}
          <div className="rounded-xl bg-[#1a1d23] border border-white/[0.08] p-4 hover:border-white/[0.14] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Quality Profile (គុណភាព)
              </span>
              {/* Pill Tab Navigation */}
              <div className="relative flex gap-1 p-1 rounded-xl bg-[#0f1013] border border-white/[0.08]">
                {['Standard', 'High', 'Ultra'].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuality(q)}
                    className={`relative px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      quality === q
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {quality === q && (
                      <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-600/30 to-teal-600/30 border border-emerald-500/30" />
                    )}
                    <span className="relative">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generation Progress */}
          {isGenerating && (
            <div className="rounded-xl bg-[#1a1d23] border border-white/[0.08] p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-bold flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {steps[currentStep]?.title ?? steps[0].title}
                </span>
                <span className="text-zinc-500 font-mono">
                  Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-300 rounded-full"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
              <div className="text-[11px] text-zinc-500 text-center italic">
                {steps[currentStep]?.khmer ?? steps[0].khmer}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer Actions ── */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-t border-white/[0.08] bg-[#0f1013]/80">
          <button
            type="button"
            onClick={handlePreviewAudio}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1e2127] border border-white/[0.08] hover:border-white/20 text-zinc-200 text-xs font-bold transition-all disabled:opacity-50"
          >
            {isPlayingPreview
              ? <Square className="w-3.5 h-3.5 text-emerald-400" />
              : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>Preview</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2.5 rounded-xl bg-[#1e2127] border border-white/[0.08] hover:border-white/20 text-zinc-300 text-xs font-bold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartGenerate}
              disabled={isGenerating || !text.trim()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" />
              <span>{isGenerating ? 'Generating...' : 'Generate (បង្កើត)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
