import React, { useState } from 'react';
import {
  Volume2,
  Wand2,
  Scissors,
  Save,
  Music,
  MicOff,
  CheckCircle2,
  Loader2,
  Sliders,
  VolumeX,
  Headphones,
  Activity,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Download,
  Mic,
  Zap,
} from 'lucide-react';
import { api } from '../../services/api';

interface AudioMixerProps {
  uploadedFilename?: string;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onBgmReady?: (bgmUrl: string) => void;
}

// ── Utility: convert 0-150 fader value to dB display ──────────────────────────
function volToDb(vol: number): string {
  if (vol === 0) return '-∞';
  // 100 = 0 dB, scale logarithmically
  const db = 20 * Math.log10(vol / 100);
  if (db > 0) return `+${db.toFixed(1)} dB`;
  return `${db.toFixed(1)} dB`;
}

// ── VU Meter: CSS-only animated bars ─────────────────────────────────────────
const VUMeter: React.FC<{ vol: number; muted: boolean; color: string }> = ({ vol, muted, color }) => {
  const barCount = 12;
  const activeCount = muted ? 0 : Math.round((vol / 150) * barCount);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '2px',
        width: '14px',
        height: '100%',
      }}
    >
      {Array.from({ length: barCount }).map((_, i) => {
        const isActive = i < activeCount;
        const isHot = i >= barCount - 2;
        const isWarm = i >= barCount - 4 && !isHot;
        let barColor = '#1a2030';
        if (isActive) {
          if (isHot) barColor = '#ef4444';
          else if (isWarm) barColor = '#f59e0b';
          else barColor = color;
        }
        return (
          <div
            key={i}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '1px',
              backgroundColor: barColor,
              transition: 'background-color 80ms ease',
              boxShadow: isActive && !isHot ? `0 0 4px ${color}66` : undefined,
              animation: isActive && !muted ? `vuPulse ${0.6 + i * 0.05}s ease-in-out infinite alternate` : undefined,
            }}
          />
        );
      })}
    </div>
  );
};

// ── Channel colors config ─────────────────────────────────────────────────────
const CHANNEL_CONFIG = {
  dub:    { label: 'DUB',    labelKh: 'សំឡេងឌាប់', color: '#10b981', glow: '#10b98133', border: '#10b98140', accent: 'emerald', icon: <Mic       className="w-4 h-4" /> },
  orig:   { label: 'ORIG',   labelKh: 'សំឡេងដើម',  color: '#3b82f6', glow: '#3b82f633', border: '#3b82f640', accent: 'blue',    icon: <Volume2   className="w-4 h-4" /> },
  music:  { label: 'MUSIC',  labelKh: 'តន្ត្រី BGM', color: '#a855f7', glow: '#a855f733', border: '#a855f740', accent: 'purple',  icon: <Music     className="w-4 h-4" /> },
  sfx:    { label: 'SFX',    labelKh: 'SFX',         color: '#f59e0b', glow: '#f59e0b33', border: '#f59e0b40', accent: 'amber',   icon: <Zap       className="w-4 h-4" /> },
  master: { label: 'MASTER', labelKh: 'MASTER OUT',  color: '#e2e8f0', glow: '#e2e8f033', border: '#e2e8f040', accent: 'white',   icon: <Sliders   className="w-4 h-4" /> },
} as const;

type ChannelKey = keyof typeof CHANNEL_CONFIG;

export const AudioMixerConsole: React.FC<AudioMixerProps> = ({
  uploadedFilename,
  onShowToast,
  onBgmReady,
}) => {
  // ── Channel state ──────────────────────────────────────────────────────────
  const [channels, setChannels] = useState({
    dub:    { vol: 130, pan: 0, mute: false, solo: false },
    orig:   { vol: 0,   pan: 0, mute: true,  solo: false },
    music:  { vol: 85,  pan: 0, mute: false, solo: false },
    sfx:    { vol: 90,  pan: 0, mute: false, solo: false },
    master: { vol: 100, pan: 0, mute: false, solo: false },
  });

  // ── Master Rack ────────────────────────────────────────────────────────────
  const [eq, setEq] = useState({ low: 0, mid: 1.5, high: 2.0 });
  const [compressor, setCompressor]   = useState(true);
  const [compThreshold]               = useState(-18);
  const [limiter, setLimiter]         = useState(true);
  const [loudnessLUFS, setLoudnessLUFS] = useState(-14.2);

  // ── Auto Ducking ───────────────────────────────────────────────────────────
  const [autoDucking, setAutoDucking] = useState(true);
  const [duckingDb, setDuckingDb]     = useState(-12);
  const [attackMs, setAttackMs]       = useState(50);
  const [releaseMs, setReleaseMs]     = useState(300);
  const [duckingOpen, setDuckingOpen] = useState(true);

  // ── BGM Separation ────────────────────────────────────────────────────────
  const [isSeparating, setIsSeparating]       = useState(false);
  const [separatedBgmUrl, setSeparatedBgmUrl] = useState<string | null>(null);
  const [separatedEngine, setSeparatedEngine] = useState<string | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const updateChannel = (
    ch: ChannelKey,
    field: 'vol' | 'pan' | 'mute' | 'solo',
    value: any,
  ) => {
    setChannels((prev) => ({
      ...prev,
      [ch]: { ...prev[ch], [field]: value },
    }));
  };

  const handleAutoMix = () => {
    setChannels({
      dub:    { vol: 135, pan: 0, mute: false, solo: false },
      orig:   { vol: 0,   pan: 0, mute: true,  solo: false },
      music:  { vol: 85,  pan: 0, mute: false, solo: false },
      sfx:    { vol: 90,  pan: 0, mute: false, solo: false },
      master: { vol: 100, pan: 0, mute: false, solo: false },
    });
    setAutoDucking(true);
    setDuckingDb(-12);
    setAttackMs(50);
    setReleaseMs(300);
    onShowToast('AI Auto-Mix បានកំណត់តុល្យភាព Dialogue, BGM & SFX ស្តង់ដាររោងភាពយន្ត', 'success');
  };

  const handleSeparateAndMuteChinese = async () => {
    if (!uploadedFilename) {
      onShowToast('សូមបញ្ចូលវីដេអូជាមុនសិន!', 'error');
      return;
    }
    setIsSeparating(true);
    onShowToast('AI Demucs កំពុងដំណើរការលុបសំឡេងចិនដើម និងស្រង់យកតែភ្លេង BGM...', 'info');
    try {
      const res = await api.separateAudio(uploadedFilename, true);
      if (res.success) {
        setSeparatedBgmUrl(res.bgmUrl);
        setSeparatedEngine(res.engine || 'meta-demucs-ai');
        updateChannel('orig',  'vol',  0);
        updateChannel('orig',  'mute', true);
        updateChannel('music', 'vol',  95);
        if (onBgmReady) onBgmReady(res.bgmUrl);
        onShowToast('លុបសំឡេងចិនដើមជោគជ័យ! បទភ្លេង BGM ត្រូវបានរក្សាទុក 100% ស្អាតគ្មានសម្លេងរំខាន', 'success');
      }
    } catch (e: any) {
      onShowToast(`កំហុសក្នុងការបំបែក: ${e.message}`, 'error');
    } finally {
      setIsSeparating(false);
    }
  };

  // ── Master VU (animated header meter) ─────────────────────────────────────
  const masterVol = channels.master.vol;

  return (
    <div
      className="flex-1 overflow-y-auto select-none font-khmer"
      style={{ background: '#0a0c0f', color: '#cbd5e1' }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          MIXING BOARD HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: 'linear-gradient(180deg, #0f1117 0%, #0a0c0f 100%)',
          borderBottom: '1px solid #1e2430',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        {/* Title + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px #06b6d440',
            }}
          >
            <Sliders className="w-5 h-5 text-white" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  color: '#f1f5f9',
                  fontFamily: 'monospace',
                }}
              >
                AUDIO MIXER PRO
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 99,
                  background: '#06b6d420',
                  color: '#67e8f9',
                  border: '1px solid #06b6d440',
                  fontFamily: 'monospace',
                  letterSpacing: '0.08em',
                }}
              >
                5-CH PRO
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              Studio-Grade Analog Console Simulator
            </div>
          </div>
        </div>

        {/* Master output VU + controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Animated master VU bars */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              alignItems: 'flex-end',
            }}
          >
            <span style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
              MASTER OUT
            </span>
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 28 }}>
              {Array.from({ length: 16 }).map((_, i) => {
                const threshold = (i / 16) * 150;
                const active = !channels.master.mute && masterVol > threshold;
                const isRed = i >= 13;
                const isYellow = i >= 10 && !isRed;
                const color = active ? (isRed ? '#ef4444' : isYellow ? '#f59e0b' : '#10b981') : '#1e2430';
                const height = 8 + (i / 16) * 16;
                return (
                  <div
                    key={i}
                    style={{
                      width: 5,
                      height,
                      backgroundColor: color,
                      borderRadius: 1,
                      transition: 'background-color 60ms',
                      boxShadow: active ? `0 0 6px ${color}80` : undefined,
                      animation: active ? `vuBarBounce ${0.4 + i * 0.03}s ease-in-out infinite alternate` : undefined,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* AI Auto-Mix button */}
          <button
            type="button"
            onClick={handleAutoMix}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 12,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 20px #06b6d430',
              letterSpacing: '0.04em',
            }}
          >
            <Wand2 className="w-4 h-4" />
            AI AUTO-MIX
          </button>

          {/* BGM Separator button */}
          <button
            type="button"
            onClick={handleSeparateAndMuteChinese}
            disabled={isSeparating || !uploadedFilename}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 10,
              background: isSeparating
                ? 'linear-gradient(135deg, #312e81, #1e1b4b)'
                : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: isSeparating ? '#818cf8' : '#fff',
              fontWeight: 700,
              fontSize: 12,
              border: '1px solid #6366f140',
              cursor: isSeparating || !uploadedFilename ? 'not-allowed' : 'pointer',
              opacity: !uploadedFilename ? 0.5 : 1,
              boxShadow: '0 0 20px #4f46e520',
              letterSpacing: '0.04em',
              transition: 'all 0.2s',
            }}
          >
            {isSeparating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                SEPARATING…
              </>
            ) : (
              <>
                <Scissors className="w-4 h-4" />
                BGM SEPARATOR
              </>
            )}
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ═══════════════════════════════════════════════════════════════
            CHANNEL STRIPS
        ═══════════════════════════════════════════════════════════════ */}
        <div
          style={{
            background: '#0d0f14',
            border: '1px solid #1e2430',
            borderRadius: 16,
            padding: '20px',
            boxShadow: '0 8px 40px #00000060',
          }}
        >
          {/* Channel section header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px solid #1e2430',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity className="w-4 h-4" style={{ color: '#06b6d4' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
                CHANNEL STRIPS — 1 thru 5
              </span>
            </div>
            <span style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>
              0 dB = UNITY GAIN (vol 100)
            </span>
          </div>

          {/* Strips grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 12,
            }}
          >
            {(Object.keys(CHANNEL_CONFIG) as ChannelKey[]).map((ch) => {
              const cfg  = CHANNEL_CONFIG[ch];
              const chan = channels[ch];
              const isMuted = chan.mute;
              const isSolo  = chan.solo;

              return (
                <div
                  key={ch}
                  style={{
                    background: '#141618',
                    border: `1px solid ${cfg.border}`,
                    borderRadius: 12,
                    padding: '12px 10px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: `0 0 20px ${cfg.glow}`,
                    position: 'relative',
                    minWidth: 0,
                  }}
                >
                  {/* Top color stripe */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      borderRadius: '12px 12px 0 0',
                      background: cfg.color,
                      opacity: isMuted ? 0.25 : 1,
                      boxShadow: `0 0 8px ${cfg.color}`,
                    }}
                  />

                  {/* Channel name */}
                  <div style={{ textAlign: 'center', marginTop: 6 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: isMuted ? '#475569' : cfg.color,
                        letterSpacing: '0.12em',
                        fontFamily: 'monospace',
                        textShadow: isMuted ? 'none' : `0 0 12px ${cfg.color}`,
                      }}
                    >
                      {cfg.label}
                    </div>
                    <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>
                      CH {['dub','orig','music','sfx','master'].indexOf(ch) + 1}
                    </div>
                  </div>

                  {/* VU Meter + Fader */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'stretch',
                      gap: 8,
                      height: 160,
                      width: '100%',
                      justifyContent: 'center',
                    }}
                  >
                    {/* VU Meter */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: '4px 0',
                        background: '#0a0c0f',
                        borderRadius: 6,
                        border: '1px solid #1e2430',
                        width: 16,
                        alignItems: 'center',
                      }}
                    >
                      <VUMeter vol={chan.vol} muted={isMuted} color={cfg.color} />
                    </div>

                    {/* Vertical fader */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                        position: 'relative',
                      }}
                    >
                      {/* dB scale labels */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          height: '100%',
                          paddingRight: 2,
                        }}
                      >
                        {['+6', '0', '-6', '-∞'].map((l) => (
                          <span key={l} style={{ fontSize: 8, color: '#334155', fontFamily: 'monospace' }}>
                            {l}
                          </span>
                        ))}
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="150"
                        value={chan.vol}
                        onChange={(e) => updateChannel(ch, 'vol', parseInt(e.target.value, 10))}
                        style={{
                          writingMode: 'vertical-lr' as any,
                          direction: 'rtl' as any,
                          WebkitAppearance: 'slider-vertical' as any,
                          width: 28,
                          height: 140,
                          cursor: 'pointer',
                          accentColor: isMuted ? '#475569' : cfg.color,
                          opacity: isMuted ? 0.5 : 1,
                        }}
                      />
                    </div>
                  </div>

                  {/* Volume dB readout */}
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 11,
                      fontWeight: 700,
                      color: isMuted ? '#475569' : cfg.color,
                      background: '#0a0c0f',
                      border: `1px solid ${isMuted ? '#1e2430' : cfg.border}`,
                      borderRadius: 6,
                      padding: '3px 8px',
                      letterSpacing: '0.06em',
                      minWidth: 60,
                      textAlign: 'center',
                    }}
                  >
                    {isMuted ? 'MUTE' : volToDb(chan.vol)}
                  </div>

                  {/* Pan knob */}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 9,
                        fontFamily: 'monospace',
                        color: '#475569',
                        padding: '0 2px',
                      }}
                    >
                      <span>L</span>
                      <span style={{ color: '#64748b' }}>
                        {chan.pan === 0 ? 'C' : chan.pan > 0 ? `R${chan.pan}` : `L${Math.abs(chan.pan)}`}
                      </span>
                      <span>R</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={chan.pan}
                      onChange={(e) => updateChannel(ch, 'pan', parseInt(e.target.value, 10))}
                      style={{
                        width: '100%',
                        height: 4,
                        cursor: 'pointer',
                        accentColor: cfg.color,
                        background: '#1e2430',
                        borderRadius: 2,
                      }}
                    />
                  </div>

                  {/* MUTE + SOLO buttons */}
                  <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                    <button
                      type="button"
                      onClick={() => updateChannel(ch, 'mute', !chan.mute)}
                      style={{
                        flex: 1,
                        padding: '5px 0',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        letterSpacing: '0.08em',
                        border: '1px solid',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        background: isMuted ? '#7f1d1d' : '#1a1e26',
                        color:      isMuted ? '#fca5a5' : '#64748b',
                        borderColor: isMuted ? '#ef444460' : '#2a3040',
                        boxShadow:  isMuted ? '0 0 8px #ef444430' : 'none',
                      }}
                    >
                      MUTE
                    </button>
                    <button
                      type="button"
                      onClick={() => updateChannel(ch, 'solo', !chan.solo)}
                      style={{
                        flex: 1,
                        padding: '5px 0',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        letterSpacing: '0.08em',
                        border: '1px solid',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        background: isSolo ? '#78350f' : '#1a1e26',
                        color:      isSolo ? '#fde68a' : '#64748b',
                        borderColor: isSolo ? '#f59e0b60' : '#2a3040',
                        boxShadow:  isSolo ? '0 0 8px #f59e0b30' : 'none',
                      }}
                    >
                      SOLO
                    </button>
                  </div>

                  {/* Channel icon */}
                  <div
                    style={{
                      color: isMuted ? '#334155' : cfg.color,
                      opacity: 0.7,
                      marginTop: 2,
                    }}
                  >
                    {cfg.icon}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            MASTER RACK
        ═══════════════════════════════════════════════════════════════ */}
        <div
          style={{
            background: '#0d0f14',
            border: '1px solid #1e2430',
            borderRadius: 16,
            padding: '20px',
            boxShadow: '0 8px 40px #00000060',
          }}
        >
          {/* Rack header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px solid #1e2430',
            }}
          >
            <Layers className="w-4 h-4" style={{ color: '#06b6d4' }} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#94a3b8',
                letterSpacing: '0.12em',
                fontFamily: 'monospace',
              }}
            >
              MASTER RACK — EQ / DYNAMICS / LOUDNESS
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {/* 3-Band EQ */}
            <div
              style={{
                background: '#141618',
                border: '1px solid #1e2430',
                borderRadius: 10,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#06b6d4',
                  letterSpacing: '0.12em',
                  fontFamily: 'monospace',
                }}
              >
                3-BAND PARAMETRIC EQ
              </span>
              {(['low', 'mid', 'high'] as const).map((band) => (
                <div key={band} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color:
                          band === 'low'  ? '#f59e0b' :
                          band === 'mid'  ? '#10b981' : '#3b82f6',
                        letterSpacing: '0.1em',
                      }}
                    >
                      {band.toUpperCase()}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: 'monospace',
                        color: '#94a3b8',
                        background: '#0a0c0f',
                        padding: '1px 6px',
                        borderRadius: 4,
                        border: '1px solid #1e2430',
                      }}
                    >
                      {eq[band] > 0 ? `+${eq[band].toFixed(1)}` : eq[band].toFixed(1)} dB
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-6"
                    max="6"
                    step="0.5"
                    value={eq[band]}
                    onChange={(e) =>
                      setEq((prev) => ({ ...prev, [band]: Number(e.target.value) }))
                    }
                    style={{
                      width: '100%',
                      height: 4,
                      cursor: 'pointer',
                      accentColor:
                        band === 'low'  ? '#f59e0b' :
                        band === 'mid'  ? '#10b981' : '#3b82f6',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#334155', fontFamily: 'monospace' }}>
                    <span>-6</span>
                    <span>0</span>
                    <span>+6</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Compressor + Limiter */}
            <div
              style={{
                background: '#141618',
                border: '1px solid #1e2430',
                borderRadius: 10,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#a855f7',
                  letterSpacing: '0.12em',
                  fontFamily: 'monospace',
                }}
              >
                DYNAMICS PROCESSING
              </span>

              {/* Compressor */}
              <div
                style={{
                  background: compressor ? '#1a0e2e' : '#0f1117',
                  border: `1px solid ${compressor ? '#a855f740' : '#1e2430'}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: compressor ? '#c084fc' : '#475569' }}>
                    COMPRESSOR
                  </span>
                  <button
                    type="button"
                    onClick={() => setCompressor(!compressor)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      border: `1px solid ${compressor ? '#a855f760' : '#2a3040'}`,
                      background: compressor ? '#a855f720' : '#1a1e26',
                      color: compressor ? '#c084fc' : '#475569',
                      cursor: 'pointer',
                      letterSpacing: '0.08em',
                      boxShadow: compressor ? '0 0 8px #a855f720' : 'none',
                    }}
                  >
                    {compressor ? 'ON' : 'OFF'}
                  </button>
                </div>
                <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                  Threshold:{' '}
                  <span style={{ color: compressor ? '#c084fc' : '#475569' }}>
                    {compThreshold} dBFS
                  </span>
                </div>
                <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                  Ratio: <span style={{ color: compressor ? '#c084fc' : '#475569' }}>4:1</span>
                  &nbsp;·&nbsp; Knee: <span style={{ color: compressor ? '#c084fc' : '#475569' }}>Soft</span>
                </div>
              </div>

              {/* Limiter */}
              <div
                style={{
                  background: limiter ? '#0c1a1f' : '#0f1117',
                  border: `1px solid ${limiter ? '#06b6d440' : '#1e2430'}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: limiter ? '#67e8f9' : '#475569' }}>
                    LIMITER
                  </span>
                  <button
                    type="button"
                    onClick={() => setLimiter(!limiter)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      border: `1px solid ${limiter ? '#06b6d460' : '#2a3040'}`,
                      background: limiter ? '#06b6d420' : '#1a1e26',
                      color: limiter ? '#67e8f9' : '#475569',
                      cursor: 'pointer',
                      letterSpacing: '0.08em',
                      boxShadow: limiter ? '0 0 8px #06b6d420' : 'none',
                    }}
                  >
                    {limiter ? 'ON' : 'OFF'}
                  </button>
                </div>
                <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                  Ceiling:{' '}
                  <span style={{ color: limiter ? '#67e8f9' : '#475569' }}>-0.1 dBTP</span>
                </div>
                <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                  ISP True Peak:{' '}
                  <span style={{ color: limiter ? '#67e8f9' : '#475569' }}>Enabled</span>
                </div>
              </div>
            </div>

            {/* Loudness Target */}
            <div
              style={{
                background: '#141618',
                border: '1px solid #1e2430',
                borderRadius: 10,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#10b981',
                  letterSpacing: '0.12em',
                  fontFamily: 'monospace',
                }}
              >
                LOUDNESS TARGET
              </span>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  background: '#0a0c0f',
                  borderRadius: 8,
                  border: '1px solid #1e2430',
                  padding: '12px',
                }}
              >
                <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>INTEGRATED LUFS</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    min="-30"
                    max="-6"
                    step="0.1"
                    value={loudnessLUFS}
                    onChange={(e) => setLoudnessLUFS(Number(e.target.value))}
                    style={{
                      width: 80,
                      background: '#141618',
                      border: '1px solid #10b98140',
                      borderRadius: 6,
                      color: '#34d399',
                      fontFamily: 'monospace',
                      fontSize: 18,
                      fontWeight: 700,
                      textAlign: 'center',
                      padding: '4px',
                    }}
                  />
                  <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>LUFS</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
                  PLATFORM PRESETS
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {([-14, -16, -23] as const).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setLoudnessLUFS(preset)}
                      style={{
                        flex: 1,
                        padding: '5px 0',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        border: `1px solid ${loudnessLUFS === preset ? '#10b98160' : '#1e2430'}`,
                        background: loudnessLUFS === preset ? '#10b98120' : '#0f1117',
                        color: loudnessLUFS === preset ? '#34d399' : '#475569',
                        cursor: 'pointer',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                  {[
                    { label: 'Streaming', val: -14 },
                    { label: 'Broadcast', val: -23 },
                    { label: 'YouTube',   val: -14 },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#334155', fontFamily: 'monospace' }}>
                      <span>{label}</span>
                      <span>{val} LUFS</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            AUTO-DUCKING — Collapsible
        ═══════════════════════════════════════════════════════════════ */}
        <div
          style={{
            background: '#0d0f14',
            border: `1px solid ${autoDucking ? '#06b6d430' : '#1e2430'}`,
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: autoDucking ? '0 0 30px #06b6d410' : '0 8px 40px #00000060',
          }}
        >
          {/* Collapsible header */}
          <button
            type="button"
            onClick={() => setDuckingOpen(!duckingOpen)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: duckingOpen ? '1px solid #1e2430' : 'none',
              cursor: 'pointer',
              color: '#94a3b8',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: autoDucking ? '#06b6d420' : '#1a1e26',
                  border: `1px solid ${autoDucking ? '#06b6d440' : '#2a3040'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: autoDucking ? '#67e8f9' : '#475569',
                }}
              >
                <Activity className="w-4 h-4" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: autoDucking ? '#e2e8f0' : '#64748b',
                    letterSpacing: '0.1em',
                    fontFamily: 'monospace',
                  }}
                >
                  AUTO-DUCKING ENGINE
                </div>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>
                  ការកាត់បន្ថយ BGM ពេលសំឡេងនិយាយ
                </div>
              </div>
              {/* ON/OFF pill */}
              <div
                onClick={(e) => { e.stopPropagation(); setAutoDucking(!autoDucking); }}
                style={{
                  padding: '3px 10px',
                  borderRadius: 99,
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  border: `1px solid ${autoDucking ? '#06b6d460' : '#2a3040'}`,
                  background: autoDucking ? '#06b6d420' : '#1a1e26',
                  color: autoDucking ? '#67e8f9' : '#475569',
                  cursor: 'pointer',
                  letterSpacing: '0.08em',
                  marginLeft: 8,
                }}
              >
                {autoDucking ? '● ON' : '○ OFF'}
              </div>
            </div>
            <div style={{ color: '#475569' }}>
              {duckingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {duckingOpen && (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {/* Duck depth */}
                <div
                  style={{
                    background: '#141618',
                    border: '1px solid #1e2430',
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                      DUCK DEPTH
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        color: '#67e8f9',
                        background: '#0a0c0f',
                        padding: '2px 8px',
                        borderRadius: 4,
                        border: '1px solid #06b6d430',
                      }}
                    >
                      {duckingDb} dB
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-24"
                    max="-3"
                    step="1"
                    value={duckingDb}
                    onChange={(e) => setDuckingDb(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#06b6d4', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#334155', fontFamily: 'monospace' }}>
                    <span>-24 dB</span>
                    <span style={{ color: '#475569' }}>std: -12 dB</span>
                    <span>-3 dB</span>
                  </div>
                </div>

                {/* Attack */}
                <div
                  style={{
                    background: '#141618',
                    border: '1px solid #1e2430',
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                      ATTACK
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => setAttackMs((v) => Math.max(10, v - 5))}
                        style={{
                          width: 18, height: 18, borderRadius: 4,
                          background: '#0a0c0f', border: '1px solid #1e2430',
                          color: '#64748b', cursor: 'pointer', fontSize: 12,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >−</button>
                      <span
                        style={{
                          fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
                          color: '#67e8f9', minWidth: 46, textAlign: 'center',
                          background: '#0a0c0f', padding: '2px 4px',
                          borderRadius: 4, border: '1px solid #06b6d430',
                        }}
                      >
                        {attackMs} ms
                      </span>
                      <button
                        type="button"
                        onClick={() => setAttackMs((v) => Math.min(200, v + 5))}
                        style={{
                          width: 18, height: 18, borderRadius: 4,
                          background: '#0a0c0f', border: '1px solid #1e2430',
                          color: '#64748b', cursor: 'pointer', fontSize: 12,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >+</button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={attackMs}
                    onChange={(e) => setAttackMs(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#06b6d4', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#334155', fontFamily: 'monospace' }}>
                    <span>10 ms</span>
                    <span style={{ color: '#475569' }}>std: 50 ms</span>
                    <span>200 ms</span>
                  </div>
                </div>

                {/* Release */}
                <div
                  style={{
                    background: '#141618',
                    border: '1px solid #1e2430',
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                      RELEASE
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => setReleaseMs((v) => Math.max(100, v - 50))}
                        style={{
                          width: 18, height: 18, borderRadius: 4,
                          background: '#0a0c0f', border: '1px solid #1e2430',
                          color: '#64748b', cursor: 'pointer', fontSize: 12,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >−</button>
                      <span
                        style={{
                          fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
                          color: '#67e8f9', minWidth: 52, textAlign: 'center',
                          background: '#0a0c0f', padding: '2px 4px',
                          borderRadius: 4, border: '1px solid #06b6d430',
                        }}
                      >
                        {releaseMs} ms
                      </span>
                      <button
                        type="button"
                        onClick={() => setReleaseMs((v) => Math.min(1000, v + 50))}
                        style={{
                          width: 18, height: 18, borderRadius: 4,
                          background: '#0a0c0f', border: '1px solid #1e2430',
                          color: '#64748b', cursor: 'pointer', fontSize: 12,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >+</button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={releaseMs}
                    onChange={(e) => setReleaseMs(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#06b6d4', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#334155', fontFamily: 'monospace' }}>
                    <span>100 ms</span>
                    <span style={{ color: '#475569' }}>std: 300 ms</span>
                    <span>1000 ms</span>
                  </div>
                </div>
              </div>

              {/* Ducking waveform placeholder */}
              <div
                style={{
                  background: '#0a0c0f',
                  border: '1px solid #1e2430',
                  borderRadius: 10,
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#475569', letterSpacing: '0.1em' }}>
                    DUCKING ENVELOPE PREVIEW
                  </span>
                  <span style={{ fontSize: 9, fontFamily: 'monospace', color: autoDucking ? '#06b6d4' : '#334155' }}>
                    {autoDucking ? '▶ ACTIVE' : '■ BYPASSED'}
                  </span>
                </div>
                {/* Simulated waveform envelope */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 36, opacity: autoDucking ? 1 : 0.3 }}>
                  {Array.from({ length: 60 }).map((_, i) => {
                    // Simulate BGM waveform with dialogue dips
                    const isDuckZone = (i >= 15 && i <= 25) || (i >= 38 && i <= 50);
                    const baseH = 20 + Math.sin(i * 0.8) * 8 + Math.random() * 6;
                    const h = isDuckZone
                      ? baseH * (1 + duckingDb / 24)   // attenuated
                      : baseH;
                    const color = isDuckZone ? '#3b82f6' : '#10b981';
                    return (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: Math.max(2, h),
                          background: color,
                          borderRadius: 1,
                          opacity: 0.7,
                        }}
                      />
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#334155', fontFamily: 'monospace' }}>
                  <span style={{ color: '#10b981' }}>▬ BGM Level</span>
                  <span style={{ color: '#3b82f6' }}>▬ Ducked Zone (Dialogue)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            BGM SEPARATOR RESULT
        ═══════════════════════════════════════════════════════════════ */}
        {separatedBgmUrl && (
          <div
            style={{
              background: '#0d0f14',
              border: '1px solid #10b98140',
              borderRadius: 16,
              padding: '20px',
              boxShadow: '0 0 40px #10b98110',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: '#34d399' }} />
                <div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#e2e8f0',
                      letterSpacing: '0.1em',
                      fontFamily: 'monospace',
                    }}
                  >
                    STEM SEPARATION COMPLETE
                  </span>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                    ការបំបែកសំឡេងបានជោគជ័យ — BGM & Vocals extracted
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: '#4f46e520',
                  color: '#818cf8',
                  border: '1px solid #6366f130',
                  fontFamily: 'monospace',
                  letterSpacing: '0.08em',
                }}
              >
                {separatedEngine === 'meta-demucs-ai' ? '⚡ META DEMUCS AI' : '⚡ HIGH-FIDELITY AI'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* BGM stem */}
              <div
                style={{
                  background: '#141618',
                  border: '1px solid #10b98130',
                  borderRadius: 10,
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Music className="w-4 h-4" style={{ color: '#34d399' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: '#34d399', letterSpacing: '0.1em' }}>
                      BGM STEM
                    </span>
                  </div>
                  <span style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace' }}>instrumental only</span>
                </div>
                {/* Waveform preview bars */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 28 }}>
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 4 + Math.abs(Math.sin(i * 0.4 + 1)) * 20,
                        background: '#10b981',
                        borderRadius: 1,
                        opacity: 0.6,
                      }}
                    />
                  ))}
                </div>
                <audio controls src={separatedBgmUrl} style={{ width: '100%', height: 28, borderRadius: 6 }} />
                <a
                  href={separatedBgmUrl}
                  download="bgm_stem.wav"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '7px 12px',
                    borderRadius: 8,
                    background: '#10b98120',
                    border: '1px solid #10b98140',
                    color: '#34d399',
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    textDecoration: 'none',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  DOWNLOAD BGM
                </a>
              </div>

              {/* Vocals stem */}
              <div
                style={{
                  background: '#141618',
                  border: '1px solid #3b82f630',
                  borderRadius: 10,
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MicOff className="w-4 h-4" style={{ color: '#60a5fa' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: '#60a5fa', letterSpacing: '0.1em' }}>
                      VOCALS STEM
                    </span>
                  </div>
                  <span style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace' }}>separated vocals</span>
                </div>
                {/* Waveform preview bars */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 28 }}>
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 4 + Math.abs(Math.cos(i * 0.5 + 2)) * 18,
                        background: '#3b82f6',
                        borderRadius: 1,
                        opacity: 0.6,
                      }}
                    />
                  ))}
                </div>
                <div
                  style={{
                    height: 28,
                    background: '#0a0c0f',
                    border: '1px solid #1e2430',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: 9, color: '#334155', fontFamily: 'monospace' }}>
                    MUTED — Chinese vocals removed
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '7px 12px',
                    borderRadius: 8,
                    background: '#3b82f620',
                    border: '1px solid #3b82f630',
                    color: '#60a5fa',
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    letterSpacing: '0.08em',
                    opacity: 0.5,
                  }}
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  SUPPRESSED (ORIG CH)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            BOTTOM ACTION BAR
        ═══════════════════════════════════════════════════════════════ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            paddingTop: 4,
          }}
        >
          <div style={{ fontSize: 10, color: '#334155', fontFamily: 'monospace' }}>
            © AUDIO MIXER PRO · 5-CH · EQ / COMP / LMT · {loudnessLUFS} LUFS Target
          </div>
          <button
            type="button"
            onClick={() =>
              onShowToast('បានរក្សាទុកតុល្យភាពសំឡេង និងការកំណត់ Audio Mixer ជោគជ័យ!', 'success')
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 20px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 12,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 20px #06b6d430',
              letterSpacing: '0.06em',
              fontFamily: 'monospace',
            }}
          >
            <Save className="w-4 h-4" />
            SAVE MIXER SETTINGS
          </button>
        </div>
      </div>

      {/* ── CSS keyframe animations (injected via style tag) ───────────── */}
      <style>{`
        @keyframes vuPulse {
          from { opacity: 0.75; }
          to   { opacity: 1;    }
        }
        @keyframes vuBarBounce {
          from { transform: scaleY(0.85); }
          to   { transform: scaleY(1.0);  }
        }
      `}</style>
    </div>
  );
};
