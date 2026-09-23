import React, { useState } from 'react';
import { Volume2, VolumeX, Music, Mic, Sliders } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface AudioMixerControlsProps {
  onSettingsChange?: (settings: AudioSettings) => void;
}

interface AudioSettings {
  originalVoiceEnabled: boolean;
  originalVoiceVolume: number;
  bgmEnabled: boolean;
  bgmVolume: number;
  dubbedVoiceVolume: number;
  removeOriginalVocals: boolean;
}

export default function AudioMixerControls({ onSettingsChange }: AudioMixerControlsProps) {
  const [settings, setSettings] = useState<AudioSettings>({
    originalVoiceEnabled: false,
    originalVoiceVolume: 30,
    bgmEnabled: true,
    bgmVolume: 85,
    dubbedVoiceVolume: 100,
    removeOriginalVocals: true
  });

  const updateSetting = <K extends keyof AudioSettings>(
    key: K,
    value: AudioSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };

  return (
    <GlassCard className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center">
          <Sliders className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-base md:text-lg font-bold text-slate-200">Audio Mixer</h3>
          <p className="text-xs text-slate-400">គ្រប់គ្រងសំឡេងដើម និង BGM</p>
        </div>
      </div>

      {/* Dubbed Voice Control (Always ON) */}
      <div className="space-y-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-slate-200">សំឡេងបកប្រែ (Dubbed)</span>
          </div>
          <span className="text-xs font-bold text-emerald-400">{settings.dubbedVoiceVolume}%</span>
        </div>
        <input
          type="range"
          min="50"
          max="150"
          value={settings.dubbedVoiceVolume}
          onChange={(e) => updateSetting('dubbedVoiceVolume', parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer
            bg-slate-700/50
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-emerald-400
            [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(52,211,153,0.6)]
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-emerald-400
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(52,211,153,0.6)]
            [&::-moz-range-thumb]:cursor-pointer"
        />
        <div className="text-xs text-slate-500">
          កម្រិតសំឡេងបកប្រែ (ណែនាំ: 100%)
        </div>
      </div>

      {/* Original Voice Control */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className={`w-4 h-4 ${settings.originalVoiceEnabled ? 'text-sky-400' : 'text-slate-500'}`} />
            <span className="text-sm font-semibold text-slate-200">សំឡេងដើម (Original)</span>
          </div>
          <button
            onClick={() => updateSetting('originalVoiceEnabled', !settings.originalVoiceEnabled)}
            className={`
              relative w-12 h-6 rounded-full transition-all duration-300
              ${settings.originalVoiceEnabled ? 'bg-sky-500' : 'bg-slate-600'}
            `}
          >
            <div className={`
              absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full
              transition-transform duration-300 shadow-lg
              ${settings.originalVoiceEnabled ? 'translate-x-6' : 'translate-x-0'}
            `} />
          </button>
        </div>

        {settings.originalVoiceEnabled && (
          <div className="space-y-2 animate-fade-down">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">កម្រិតសំឡេង</span>
              <span className="font-bold text-sky-400">{settings.originalVoiceVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.originalVoiceVolume}
              onChange={(e) => updateSetting('originalVoiceVolume', parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer
                bg-slate-700/50
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-sky-400
                [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(56,189,248,0.6)]
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-sky-400
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(56,189,248,0.6)]
                [&::-moz-range-thumb]:cursor-pointer"
            />
          </div>
        )}

        {/* Remove Vocals Option */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30">
          <div className="flex items-center gap-2">
            <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">លុបសំឡេងដើមចេញ</span>
          </div>
          <button
            onClick={() => updateSetting('removeOriginalVocals', !settings.removeOriginalVocals)}
            className={`
              relative w-10 h-5 rounded-full transition-all duration-300
              ${settings.removeOriginalVocals ? 'bg-emerald-500' : 'bg-slate-600'}
            `}
          >
            <div className={`
              absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full
              transition-transform duration-300 shadow-lg
              ${settings.removeOriginalVocals ? 'translate-x-5' : 'translate-x-0'}
            `} />
          </button>
        </div>
      </div>

      {/* BGM Control */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className={`w-4 h-4 ${settings.bgmEnabled ? 'text-violet-400' : 'text-slate-500'}`} />
            <span className="text-sm font-semibold text-slate-200">តន្រ្តីផ្ទៃខាងក្រោយ (BGM)</span>
          </div>
          <button
            onClick={() => updateSetting('bgmEnabled', !settings.bgmEnabled)}
            className={`
              relative w-12 h-6 rounded-full transition-all duration-300
              ${settings.bgmEnabled ? 'bg-violet-500' : 'bg-slate-600'}
            `}
          >
            <div className={`
              absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full
              transition-transform duration-300 shadow-lg
              ${settings.bgmEnabled ? 'translate-x-6' : 'translate-x-0'}
            `} />
          </button>
        </div>

        {settings.bgmEnabled && (
          <div className="space-y-2 animate-fade-down">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">កម្រិតសំឡេង BGM</span>
              <span className="font-bold text-violet-400">{settings.bgmVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.bgmVolume}
              onChange={(e) => updateSetting('bgmVolume', parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer
                bg-slate-700/50
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-violet-400
                [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(139,92,246,0.6)]
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-violet-400
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(139,92,246,0.6)]
                [&::-moz-range-thumb]:cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Presets */}
      <div className="pt-3 border-t border-white/5">
        <div className="text-xs text-slate-500 mb-2">Presets:</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            onClick={() => {
              setSettings({
                originalVoiceEnabled: false,
                originalVoiceVolume: 0,
                bgmEnabled: true,
                bgmVolume: 85,
                dubbedVoiceVolume: 100,
                removeOriginalVocals: true
              });
            }}
            className="px-3 py-2 text-xs rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 transition-all"
          >
            🎬 Standard
          </button>
          <button
            onClick={() => {
              setSettings({
                originalVoiceEnabled: true,
                originalVoiceVolume: 20,
                bgmEnabled: true,
                bgmVolume: 70,
                dubbedVoiceVolume: 110,
                removeOriginalVocals: false
              });
            }}
            className="px-3 py-2 text-xs rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 transition-all"
          >
            🎭 Blend
          </button>
          <button
            onClick={() => {
              setSettings({
                originalVoiceEnabled: false,
                originalVoiceVolume: 0,
                bgmEnabled: false,
                bgmVolume: 0,
                dubbedVoiceVolume: 100,
                removeOriginalVocals: true
              });
            }}
            className="px-3 py-2 text-xs rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 transition-all col-span-2 sm:col-span-1"
          >
            🎤 Voice Only
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-white/5">
        <p>💡 <span className="text-slate-400">Standard:</span> សំឡេងបកប្រែ + BGM (ល្អបំផុត)</p>
        <p>💡 <span className="text-slate-400">Blend:</span> លាយសំឡេងដើម + បកប្រែ</p>
        <p>💡 <span className="text-slate-400">Voice Only:</span> សំឡេងបកប្រែតែម្យ៉ាង</p>
      </div>
    </GlassCard>
  );
}
