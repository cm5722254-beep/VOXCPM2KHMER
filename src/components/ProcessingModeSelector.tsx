import React, { useState, useEffect } from 'react';
import { Cpu, Cloud, Zap, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import axios from 'axios';
import { GlassCard, GlassBadge } from './GlassCard';

type ProcessingMode = 'local_voxcpm' | 'cloud_gpu' | 'pure_khmer';

interface ProcessingModeSelectorProps {
  selectedMode: ProcessingMode;
  onModeChange: (mode: ProcessingMode) => void;
  className?: string;
}

export default function ProcessingModeSelector({
  selectedMode,
  onModeChange,
  className = ''
}: ProcessingModeSelectorProps) {
  const [cpuSupported, setCpuSupported] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<any>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    checkSystemCapabilities();
  }, []);

  const checkSystemCapabilities = async () => {
    try {
      // Check CPU support for VoxCPM2
      const localCheck = await axios.get('/api/voxcpm/local-check');
      setCpuSupported(localCheck.data.online);

      // Check Cloud GPU status
      const cloudCheck = await axios.get('/api/voxcpm/status');
      setCloudStatus(cloudCheck.data);
    } catch (err) {
      console.error('System check failed:', err);
    }
  };

  const handleModeSelect = (mode: ProcessingMode) => {
    // Validate selection
    if (mode === 'local_voxcpm' && !cpuSupported) {
      setAlertMessage(
        '⚠️ Computer របស់អ្នកមិនអាចដំណើរការ VoxCPM2 តាម CPU បានទេ។\n\n' +
        '💡 សូមប្រើ Cloud GPU ជំនួសវិញ សម្រាប់ Voice Clone ដោយប្រើ GPU ល្បឿនលឿន!'
      );
      setShowAlert(true);
      return;
    }

    if (mode === 'cloud_gpu' && cloudStatus && !cloudStatus.online) {
      setAlertMessage(
        '⚠️ Cloud GPU Server មិនទាន់ភ្ជាប់នៅឡើយទេ។\n\n' +
        '💡 សូមភ្ជាប់ Colab/Kaggle GPU ជាមុនសិន ឬប្រើ Pure Khmer Neural ជំនួសវិញ។'
      );
      setShowAlert(true);
      return;
    }

    onModeChange(mode);
    setShowAlert(false);
  };

  const modes = [
    {
      id: 'local_voxcpm' as ProcessingMode,
      name: 'VoxCPM2 Local (CPU)',
      icon: Cpu,
      description: 'Voice Clone ដោយប្រើ Computer ផ្ទាល់',
      color: 'from-sky-500 to-blue-600',
      badge: 'CPU',
      badgeColor: 'sky',
      features: ['Voice Cloning', 'Offline Mode', 'Computer CPU'],
      supported: cpuSupported,
      speed: 'យឺត',
      quality: 'ល្អ'
    },
    {
      id: 'cloud_gpu' as ProcessingMode,
      name: 'VoxCPM2 Cloud (GPU)',
      icon: Cloud,
      description: 'Voice Clone ដោយប្រើ GPU ល្បឿនលឿន',
      color: 'from-violet-500 to-purple-600',
      badge: 'GPU',
      badgeColor: 'violet',
      features: ['Voice Cloning', 'GPU Accelerated', 'Ultra Fast'],
      supported: cloudStatus?.online || false,
      speed: 'លឿនខ្លាំង',
      quality: 'ល្អបំផុត'
    },
    {
      id: 'pure_khmer' as ProcessingMode,
      name: 'Khmer Neural TTS',
      icon: Zap,
      description: '100% Pure Khmer Neural Engine',
      color: 'from-emerald-500 to-green-600',
      badge: 'OFFLINE',
      badgeColor: 'emerald',
      features: ['100% Offline', 'Natural Khmer', 'Fast & Reliable'],
      supported: true,
      speed: 'លឿន',
      quality: 'ល្អ'
    }
  ];

  return (
    <div className={className}>
      {/* Title */}
      <div className="mb-4">
        <h3 className="text-lg font-bold gradient-text mb-1">ជ្រើសរើសរបៀបដំណើរការ</h3>
        <p className="text-sm text-slate-400">ជ្រើសរើសវិធីសាស្រ្តដែលអ្នកចង់ប្រើសម្រាប់ Voice Clone</p>
      </div>

      {/* Alert Modal */}
      {showAlert && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 modal-backdrop">
          <GlassCard className="max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-200 mb-2">ការជូនដំណឹង</h3>
                <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                  {alertMessage}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAlert(false)}
              className="w-full btn-primary py-2 rounded-lg"
            >
              យល់ហើយ
            </button>
          </GlassCard>
        </div>
      )}

      {/* Mode Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          const isDisabled = !mode.supported;

          return (
            <button
              key={mode.id}
              onClick={() => handleModeSelect(mode.id)}
              disabled={isDisabled}
              className={`
                relative text-left transition-all duration-300 group
                ${isSelected
                  ? 'ring-2 ring-sky-400/50 ring-offset-2 ring-offset-[var(--bg-primary)] scale-105'
                  : 'hover:scale-102 ring-transparent'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <GlassCard className={`
                p-4 md:p-5 h-full
                ${isSelected ? 'bg-gradient-to-br from-sky-500/10 to-violet-500/10 border-sky-400/30' : ''}
                ${!isDisabled && !isSelected ? 'hover:border-sky-400/20' : ''}
              `}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`
                    w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center
                    bg-gradient-to-br ${mode.color}
                    ${isSelected ? 'shadow-[0_0_20px_rgba(56,189,248,0.4)]' : ''}
                  `}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <GlassBadge
                      variant={mode.badgeColor as any}
                      className="text-[9px] md:text-[10px]"
                    >
                      {mode.badge}
                    </GlassBadge>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                    )}
                  </div>
                </div>

                {/* Title */}
                <h4 className={`
                  text-sm md:text-base font-bold mb-1
                  ${isSelected ? 'gradient-text' : 'text-slate-200'}
                `}>
                  {mode.name}
                </h4>

                {/* Description */}
                <p className="text-xs md:text-sm text-slate-400 mb-3 line-clamp-2">
                  {mode.description}
                </p>

                {/* Features */}
                <div className="space-y-1.5 mb-3">
                  {mode.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-1 h-1 rounded-full bg-sky-400" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                  <div>
                    <div className="text-[10px] text-slate-500 mb-0.5">ល្បឿន</div>
                    <div className="text-xs font-bold text-sky-400">{mode.speed}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 mb-0.5">គុណភាព</div>
                    <div className="text-xs font-bold text-emerald-400">{mode.quality}</div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className={`
                  absolute top-2 right-2 w-2 h-2 rounded-full
                  ${mode.supported ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-red-400'}
                  ${mode.supported ? 'animate-pulse' : ''}
                `} />
              </GlassCard>
            </button>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-xs md:text-sm text-slate-400">
          <span className="text-blue-400 font-semibold">ជំនួយ:</span>{' '}
          {selectedMode === 'local_voxcpm' && 'កំពុងប្រើ Computer CPU - អាចយឺតបន្តិច'}
          {selectedMode === 'cloud_gpu' && 'កំពុងប្រើ Cloud GPU - ល្បឿនលឿនបំផុត'}
          {selectedMode === 'pure_khmer' && 'កំពុងប្រើ Khmer Neural - 100% Offline'}
        </div>
      </div>
    </div>
  );
}
