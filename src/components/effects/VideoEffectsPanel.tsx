import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Sliders,
  Type,
  Film,
  RotateCcw,
  Sparkles,
  Volume2,
  Search,
  Check,
  Palette,
  Layers,
  Wand2,
  Zap,
  Shield,
  ShieldCheck,
  Move,
  Eye,
  EyeOff,
  Tv,
  Radio,
  Image as ImageIcon,
  Box,
  Minus,
  Plus,
  Edit3,
  ChevronDown,
  ChevronRight,
  ZoomIn,
  Maximize2,
  Star,
  Flame,
  Crown,
  Smartphone,
  Megaphone,
  Share2,
  Award,
} from 'lucide-react';
import {
  VideoEffects,
  SubtitleStyle,
  WatermarkConfig,
  VideoStyleTextConfig,
  InVideoSponsorConfig,
  SocialCanvasStyle,
  RunningTickerTextConfig,
} from '../../types';
import { LUT_PRESETS, SUBTITLE_PRESETS, AUDIO_EFFECT_PRESETS, WATERMARK_STYLE_PRESETS } from './effectsLibrary';

interface VideoEffectsPanelProps {
  effects: VideoEffects;
  onChangeEffects: (effects: VideoEffects) => void;
  subtitleStyle: SubtitleStyle;
  onChangeSubtitleStyle: (style: SubtitleStyle) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onClose?: () => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Gradient Slider – styled range with animated fill + tooltip on drag
───────────────────────────────────────────────────────────────────────────── */
interface GradientSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  accentFrom?: string;
  accentTo?: string;
  unit?: string;
  step?: number;
}

const GradientSlider: React.FC<GradientSliderProps> = ({
  min,
  max,
  value,
  onChange,
  accentFrom = '#00C2FF',
  accentTo = '#0070FF',
  unit = '',
  step = 1,
}) => {
  const [dragging, setDragging] = useState(false);
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="relative group">
      {/* Tooltip */}
      {dragging && (
        <div
          className="absolute -top-7 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold text-white shadow-lg pointer-events-none z-10 -translate-x-1/2"
          style={{
            left: `${pct}%`,
            background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`,
          }}
        >
          {value}{unit}
        </div>
      )}

      {/* Track background */}
      <div className="w-full h-2 rounded-full bg-[#1a1d28] relative overflow-hidden">
        {/* Filled portion */}
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-[width] duration-75"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${accentFrom}, ${accentTo})`,
          }}
        />
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onMouseDown={() => setDragging(true)}
        onTouchStart={() => setDragging(true)}
        onMouseUp={() => setDragging(false)}
        onTouchEnd={() => setDragging(false)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
      />

      {/* Thumb visual */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg pointer-events-none transition-transform"
        style={{
          left: `calc(${pct}% - 8px)`,
          background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`,
          transform: `translateY(-50%) scale(${dragging ? 1.2 : 1})`,
        }}
      />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Collapsible Card Section
───────────────────────────────────────────────────────────────────────────── */
interface CollapsibleCardProps {
  title: string;
  icon: React.ReactNode;
  accentColor?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  icon,
  accentColor = '#00C2FF',
  defaultOpen = true,
  children,
  badge,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-white/[0.07] overflow-hidden bg-[#0b0e1a]">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span style={{ color: accentColor }}>{icon}</span>
          <span className="text-xs font-bold text-slate-200">{title}</span>
          {badge && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border"
              style={{
                color: accentColor,
                borderColor: `${accentColor}40`,
                background: `${accentColor}15`,
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        )}
      </button>
      {open && <div className="px-3.5 pb-3.5 pt-0.5">{children}</div>}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Main Panel
───────────────────────────────────────────────────────────────────────────── */
export const VideoEffectsPanel: React.FC<VideoEffectsPanelProps> = ({
  effects,
  onChangeEffects,
  subtitleStyle,
  onChangeSubtitleStyle,
  onShowToast,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'social' | 'sponsor' | 'ticker' | 'watermark' | 'styletext' | 'subtitles' | 'audio'>('video');
  const [filterSearch, setFilterSearch] = useState('');
  const [subSearch, setSubSearch] = useState('');
  const [audioSearch, setAudioSearch] = useState('');
  const [selectedLutCategory, setSelectedLutCategory] = useState<string>('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All');

  // 3D Text style presets
  const text3dPresets = [
    { id: 'gold3d', label: '🏆 Gold 3D Classic', titleStylePreset: 'gold3d' },
    { id: 'neon3d', label: '⚡ Neon 3D Glow', titleStylePreset: 'neon3d' },
    { id: 'chrome3d', label: '🥄 Chrome Mirror', titleStylePreset: 'chrome3d' },
    { id: 'fire3d', label: '🔥 Fire Blaze 3D', titleStylePreset: 'fire3d' },
    { id: 'ice3d', label: '❄️ Ice Crystal 3D', titleStylePreset: 'ice3d' },
    { id: 'shadow3d', label: '🌑 Deep Shadow 3D', titleStylePreset: 'shadow3d' },
    { id: 'rainbow3d', label: '🌈 Rainbow 3D Pop', titleStylePreset: 'rainbow3d' },
    { id: 'platinum3d', label: '🪨 Platinum Luxury', titleStylePreset: 'platinum3d' },
    { id: 'ember3d', label: '🍓 Ember Glow 3D', titleStylePreset: 'ember3d' },
    { id: 'ocean3d', label: '🌊 Ocean Depth 3D', titleStylePreset: 'ocean3d' },
    { id: 'galaxy3d', label: '🌌 Galaxy Star 3D', titleStylePreset: 'galaxy3d' },
    { id: 'copper3d', label: '🪵 Copper Antique', titleStylePreset: 'copper3d' },
    { id: 'jade3d', label: '🟢 Jade Emerald 3D', titleStylePreset: 'jade3d' },
    { id: 'rose3d', label: '🌹 Rose Gold 3D', titleStylePreset: 'rose3d' },
    { id: 'void3d', label: '🖤 Void Obsidian 3D', titleStylePreset: 'void3d' },
    { id: 'lava3d', label: '🌋 Lava Eruption 3D', titleStylePreset: 'lava3d' },
    { id: 'steel3d', label: '🔩 Steel Industrial 3D', titleStylePreset: 'steel3d' },
    { id: 'aurora3d', label: '🌏 Aurora Borealis 3D', titleStylePreset: 'aurora3d' },
    { id: 'toxic3d', label: '💚 Toxic Neon Green', titleStylePreset: 'toxic3d' },
    { id: 'crystal3d', label: '💎 Crystal Prism 3D', titleStylePreset: 'crystal3d' },
    { id: 'blood3d', label: '💢 Blood Moon Red 3D', titleStylePreset: 'blood3d' },
    { id: 'sand3d', label: '🏖️ Desert Sand 3D', titleStylePreset: 'sand3d' },
    { id: 'cloud3d', label: '☁️ Cloud Mist 3D', titleStylePreset: 'cloud3d' },
    { id: 'mahogany3d', label: '🪵 Mahogany Wood 3D', titleStylePreset: 'mahogany3d' },
    { id: 'snow3d', label: '❄️ Snow Frost 3D', titleStylePreset: 'snow3d' },
    { id: 'sunset3d', label: '🌇 Sunset Horizon 3D', titleStylePreset: 'sunset3d' },
    { id: 'marble3d', label: '🪨 White Marble 3D', titleStylePreset: 'marble3d' },
    { id: 'titanium3d', label: '🪨 Titanium Sheen', titleStylePreset: 'titanium3d' },
    { id: 'midnight3d', label: '🌙 Midnight Blue 3D', titleStylePreset: 'midnight3d' },
    { id: 'sakura3d', label: '🌸 Sakura Blossom 3D', titleStylePreset: 'sakura3d' },
  ];

  const getTextCardColors = (id: string): { bg: string; border: string; preview: string } => {
    const palette: Record<string, { bg: string; border: string; preview: string }> = {
      gold3d:     { bg: 'rgba(234,179,8,0.3)',   border: '#eab308', preview: 'linear-gradient(90deg,#92400e,#eab308,#fef08a)' },
      neon3d:     { bg: 'rgba(99,102,241,0.3)',  border: '#818cf8', preview: 'linear-gradient(90deg,#4338ca,#818cf8,#c7d2fe)' },
      chrome3d:   { bg: 'rgba(148,163,184,0.3)', border: '#cbd5e1', preview: 'linear-gradient(90deg,#475569,#cbd5e1,#f8fafc)' },
      fire3d:     { bg: 'rgba(239,68,68,0.3)',   border: '#f87171', preview: 'linear-gradient(90deg,#7f1d1d,#ef4444,#fbbf24)' },
      ice3d:      { bg: 'rgba(125,211,252,0.3)', border: '#7dd3fc', preview: 'linear-gradient(90deg,#0369a1,#7dd3fc,#e0f2fe)' },
      shadow3d:   { bg: 'rgba(30,30,30,0.6)',    border: '#6b7280', preview: 'linear-gradient(90deg,#111827,#374151,#6b7280)' },
      rainbow3d:  { bg: 'rgba(168,85,247,0.3)',  border: '#c084fc', preview: 'linear-gradient(90deg,#ef4444,#eab308,#22c55e,#3b82f6,#a855f7)' },
      platinum3d: { bg: 'rgba(226,232,240,0.3)', border: '#e2e8f0', preview: 'linear-gradient(90deg,#94a3b8,#e2e8f0,#f8fafc)' },
      ember3d:    { bg: 'rgba(251,146,60,0.3)',  border: '#fb923c', preview: 'linear-gradient(90deg,#7c2d12,#ea580c,#fbbf24)' },
      ocean3d:    { bg: 'rgba(6,182,212,0.3)',   border: '#22d3ee', preview: 'linear-gradient(90deg,#164e63,#0891b2,#67e8f9)' },
      galaxy3d:   { bg: 'rgba(139,92,246,0.3)',  border: '#a78bfa', preview: 'linear-gradient(90deg,#1e1b4b,#7c3aed,#c4b5fd)' },
      copper3d:   { bg: 'rgba(180,83,9,0.3)',    border: '#d97706', preview: 'linear-gradient(90deg,#78350f,#b45309,#fcd34d)' },
      jade3d:     { bg: 'rgba(34,197,94,0.3)',   border: '#4ade80', preview: 'linear-gradient(90deg,#14532d,#16a34a,#86efac)' },
      rose3d:     { bg: 'rgba(251,113,133,0.3)', border: '#fb7185', preview: 'linear-gradient(90deg,#881337,#e11d48,#fda4af)' },
      void3d:     { bg: 'rgba(15,15,15,0.7)',    border: '#4b5563', preview: 'linear-gradient(90deg,#030712,#111827,#374151)' },
      lava3d:     { bg: 'rgba(220,38,38,0.3)',   border: '#dc2626', preview: 'linear-gradient(90deg,#450a0a,#b91c1c,#fbbf24)' },
      steel3d:    { bg: 'rgba(100,116,139,0.3)', border: '#94a3b8', preview: 'linear-gradient(90deg,#1e293b,#475569,#94a3b8)' },
      aurora3d:   { bg: 'rgba(52,211,153,0.3)',  border: '#34d399', preview: 'linear-gradient(90deg,#065f46,#10b981,#a7f3d0)' },
      toxic3d:    { bg: 'rgba(132,204,22,0.3)',  border: '#a3e635', preview: 'linear-gradient(90deg,#1a2e05,#65a30d,#d9f99d)' },
      crystal3d:  { bg: 'rgba(56,189,248,0.3)',  border: '#38bdf8', preview: 'linear-gradient(90deg,#0c4a6e,#0284c7,#bae6fd)' },
      blood3d:    { bg: 'rgba(185,28,28,0.3)',   border: '#ef4444', preview: 'linear-gradient(90deg,#3f0000,#991b1b,#fca5a5)' },
      sand3d:     { bg: 'rgba(217,119,6,0.3)',   border: '#fbbf24', preview: 'linear-gradient(90deg,#78350f,#d97706,#fef3c7)' },
      cloud3d:    { bg: 'rgba(226,232,240,0.2)', border: '#94a3b8', preview: 'linear-gradient(90deg,#e2e8f0,#f8fafc,#ffffff)' },
      mahogany3d: { bg: 'rgba(120,53,15,0.3)',   border: '#92400e', preview: 'linear-gradient(90deg,#3b0e02,#78350f,#d97706)' },
      snow3d:     { bg: 'rgba(241,245,249,0.2)', border: '#e2e8f0', preview: 'linear-gradient(90deg,#bfdbfe,#e0f2fe,#ffffff)' },
      sunset3d:   { bg: 'rgba(251,146,60,0.3)',  border: '#f97316', preview: 'linear-gradient(90deg,#7c2d12,#ea580c,#fbbf24,#a855f7)' },
      marble3d:   { bg: 'rgba(248,250,252,0.2)', border: '#cbd5e1', preview: 'linear-gradient(90deg,#94a3b8,#e2e8f0,#f8fafc)' },
      titanium3d: { bg: 'rgba(71,85,105,0.3)',   border: '#64748b', preview: 'linear-gradient(90deg,#1e293b,#334155,#94a3b8)' },
      midnight3d: { bg: 'rgba(30,58,138,0.3)',   border: '#3b82f6', preview: 'linear-gradient(90deg,#1e1b4b,#1d4ed8,#93c5fd)' },
      sakura3d:   { bg: 'rgba(251,207,232,0.3)', border: '#f9a8d4', preview: 'linear-gradient(90deg,#831843,#ec4899,#fbcfe8)' },
    };
    return palette[id] ?? { bg: 'rgba(99,102,241,0.2)', border: '#6366f1', preview: 'linear-gradient(90deg,#4338ca,#6366f1)' };
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const aspectRatios = [
    { id: '16:9', label: '16:9', desc: 'YouTube' },
    { id: '9:16', label: '9:16', desc: 'Shorts' },
    { id: '1:1', label: '1:1', desc: 'IG' },
    { id: '4:3', label: '4:3', desc: 'Classic' },
  ];

  const resetVideoEffects = () => {
    onChangeEffects({
      ...effects,
      brightness: 100, contrast: 100, saturation: 100,
      sepia: 0, blur: 0, aspectRatio: '16:9', lutPreset: 'none',
      letterbox: false, vignette: false, filmGrain: false, vhsGlitch: false, glowBloom: false,
    });
    onShowToast('បានកំណត់ Video Effects ឡើងវិញ', 'info');
  };

  const reset3DEffects = () => {
    onChangeEffects({
      ...effects,
      effect3dEnabled: false, effect3dPreset: 'none', effect3dIntensity: 80, effect3dDepth: 75,
    });
    onShowToast('បានកំណត់ Effect 3D ឡើងវិញ', 'info');
  };

  const resetSubtitleStyle = () => {
    onChangeSubtitleStyle({
      fontSize: 20, fontFamily: 'Kantumruy Pro', textColor: '#fef08a',
      strokeColor: '#000000', strokeWidth: 2,
      backgroundColor: 'rgba(0,0,0,0.75)', position: 'bottom', animation: 'none',
    });
    onShowToast('បានកំណត់ Subtitle Style ឡើងវិញ', 'info');
  };

  const currentWatermark: WatermarkConfig = effects.watermark || {
    enabled: false, text: '', position: 'top-right', opacity: 85,
    fontSize: 13, fontFamily: 'Outfit', textColor: '#ffffff', showBadge: true,
  };
  const updateWatermark = (patch: Partial<WatermarkConfig>) => {
    onChangeEffects({ ...effects, watermark: { ...currentWatermark, ...patch } });
  };

  const currentStyleText: VideoStyleTextConfig = effects.styleText || {
    enabled: false, title: '', subtitle: '', badge: '', stylePreset: 'gold3d',
    position: 'bottom-left', fontSize: 26, fontFamily: 'Koulen', showBanner: true,
  };
  const updateStyleText = (patch: Partial<VideoStyleTextConfig>) => {
    onChangeEffects({ ...effects, styleText: { ...currentStyleText, ...patch } });
  };

  // ── Sponsor In Video ──────────────────────────────────────────────
  const currentSponsor: InVideoSponsorConfig = effects.sponsorInVideo || {
    enabled: false,
    sponsorName: 'DABBER PRO STUDIO',
    tagline: 'ឧបត្ថម្ភធំផ្តាច់មុខ',
    contactInfo: 'Telegram: @dabberpro • Tel: 012 345 678',
    position: 'bottom_banner',
    stylePreset: 'theatrical_gold',
    animation: 'shimmer',
    opacity: 95,
  };
  const updateSponsor = (patch: Partial<InVideoSponsorConfig>) => {
    onChangeEffects({ ...effects, sponsorInVideo: { ...currentSponsor, ...patch } });
  };

  // ── Social Canvas Style (TikTok & FB Page) ────────────────────────
  const currentSocialCanvas: SocialCanvasStyle = effects.socialCanvasStyle || {
    enabled: false,
    canvasRatio: '9:16',
    backgroundType: 'blur_video',
    blurAmount: 20,
    topTitle: '🔥 សម្រាយរឿងថ្មីពិសេស - ភាគ ០១',
    bottomSubtitle: '👉 សូមជួយ Like & Follow ផេកផងបាទ ❤️',
    headerFontFamily: 'Koulen',
    headerTextColor: '#fef08a',
    headerBgColor: 'rgba(0,0,0,0.75)',
    frameBorderColor: '#38bdf8',
    frameBorderWidth: 2,
  };
  const updateSocialCanvas = (patch: Partial<SocialCanvasStyle>) => {
    onChangeEffects({ ...effects, socialCanvasStyle: { ...currentSocialCanvas, ...patch } });
  };

  // ── Running Ticker Text (Marquee) ─────────────────────────────────
  const currentTicker: RunningTickerTextConfig = effects.runningTickerText || {
    enabled: false,
    text: '🔴 ព័ត៌មានទាន់ហេតុការណ៍: សូមស្វាគមន៍មកកាន់ទំព័រផ្លូវការ! ទំនាក់ទំនងផ្សាយពាណិជ្ជកម្ម Telegram: @dabberpro • Tel: 012 345 678',
    speed: 'medium',
    direction: 'left',
    fontSize: 16,
    textColor: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    position: 'bottom',
    glowEffect: true,
    newsBadgeText: 'BREAKING',
  };
  const updateTicker = (patch: Partial<RunningTickerTextConfig>) => {
    onChangeEffects({ ...effects, runningTickerText: { ...currentTicker, ...patch } });
  };

  const lutCategories = ['All', 'Cinematic', 'Anime & Drama', 'Vintage & Film', 'Atmospheric & Sci-Fi'];
  const filteredLuts = LUT_PRESETS.filter((lut) => {
    const matchesCat = selectedLutCategory === 'All' || lut.category === selectedLutCategory;
    const matchesQuery = !filterSearch ||
      lut.label.toLowerCase().includes(filterSearch.toLowerCase()) ||
      lut.description.toLowerCase().includes(filterSearch.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const subCategories = ['All', 'Donghua & Theatrical', 'Modern & Streaming', 'Anime & Neon', 'Creative & Aesthetic'];
  const filteredSubs = SUBTITLE_PRESETS.filter((sub) => {
    const matchesCat = selectedSubCategory === 'All' || sub.category === selectedSubCategory;
    const matchesQuery = !subSearch ||
      sub.label.toLowerCase().includes(subSearch.toLowerCase()) ||
      sub.description.toLowerCase().includes(subSearch.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const filteredAudios = AUDIO_EFFECT_PRESETS.filter((aud) =>
    !audioSearch ||
    aud.label.toLowerCase().includes(audioSearch.toLowerCase()) ||
    aud.description.toLowerCase().includes(audioSearch.toLowerCase())
  );

  /* ── Sidebar tab definitions ── */
  const TABS = [
    {
      id: 'video' as const,
      icon: <Sliders className="w-4 h-4" />,
      label: 'LUTs & វីដេអូ',
      gradient: 'from-[#00C2FF] to-[#0070FF]',
      accent: '#00C2FF',
    },
    {
      id: 'social' as const,
      icon: <Smartphone className="w-4 h-4" />,
      label: 'TikTok & FB',
      gradient: 'from-pink-500 via-rose-500 to-purple-600',
      accent: '#ec4899',
    },
    {
      id: 'sponsor' as const,
      icon: <Award className="w-4 h-4" />,
      label: 'ឧបត្ថម្ភ Sponsor',
      gradient: 'from-amber-400 to-yellow-500',
      accent: '#eab308',
    },
    {
      id: 'ticker' as const,
      icon: <Megaphone className="w-4 h-4" />,
      label: 'អក្សររត់ Marquee',
      gradient: 'from-red-500 to-orange-500',
      accent: '#ef4444',
    },
    {
      id: 'watermark' as const,
      icon: <Shield className="w-4 h-4" />,
      label: 'Watermark',
      gradient: 'from-amber-400 to-orange-500',
      accent: '#f59e0b',
    },
    {
      id: 'styletext' as const,
      icon: <Sparkles className="w-4 h-4" />,
      label: 'អក្សរ Style',
      gradient: 'from-rose-500 to-pink-600',
      accent: '#f43f5e',
    },
    {
      id: 'subtitles' as const,
      icon: <Type className="w-4 h-4" />,
      label: 'Subtitles',
      gradient: 'from-purple-500 to-violet-600',
      accent: '#a855f7',
    },
    {
      id: 'audio' as const,
      icon: <Volume2 className="w-4 h-4" />,
      label: 'Audio FX',
      gradient: 'from-emerald-500 to-teal-500',
      accent: '#10b981',
    },
  ];

  const activeTabData = TABS.find((t) => t.id === activeTab)!;

  return (
    <div
      className="bg-[#10121e] border border-white/[0.08] rounded-2xl flex overflow-hidden select-none font-khmer text-zinc-200 shadow-2xl"
      style={{ maxHeight: '90vh', height: '780px' }}
    >
      {/* ══════════════════════════════════════════════════════════════════
          LEFT SIDEBAR — Vertical Tab Navigation
      ══════════════════════════════════════════════════════════════════ */}
      <div className="w-[72px] flex flex-col items-center py-4 gap-1.5 bg-[#0b0d17] border-r border-white/[0.07] shrink-0">
        {/* Logo mark */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00C2FF]/20 to-blue-600/20 border border-[#00C2FF]/30 flex items-center justify-center mb-2">
          <Wand2 className="w-4 h-4 text-[#00C2FF]" />
        </div>

        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              className={`relative w-12 flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-white/[0.08]'
                  : 'hover:bg-white/[0.04]'
              }`}
            >
              {/* Active left-edge indicator */}
              {isActive && (
                <div
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
                  style={{ background: `linear-gradient(to bottom, ${tab.gradient.replace('from-', '').split(' ')[0]}, ${tab.gradient.replace('to-', '').split(' ').pop()})` }}
                />
              )}

              {/* Icon */}
              <div
                className={`transition-colors ${isActive ? '' : 'text-slate-500 group-hover:text-slate-300'}`}
                style={isActive ? { color: tab.accent } : undefined}
              >
                {tab.icon}
              </div>

              {/* Label (rotated, tiny) */}
              <span
                className={`text-[9px] font-bold text-center leading-tight transition-colors ${
                  isActive ? 'text-white' : 'text-slate-600 group-hover:text-slate-400'
                }`}
              >
                {tab.label.split(' ')[0]}
              </span>
            </button>
          );
        })}

        {/* Spacer + Close Button */}
        <div className="flex-1" />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all border border-white/[0.06]"
            title="បិទ (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          RIGHT CONTENT AREA
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Panel Header */}
        <div className="px-5 py-3.5 border-b border-white/[0.07] flex items-center justify-between shrink-0 bg-[#0d101c]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${activeTabData.accent}30, ${activeTabData.accent}15)`, border: `1px solid ${activeTabData.accent}40` }}
            >
              <span style={{ color: activeTabData.accent }}>{activeTabData.icon}</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-wide leading-tight">
                VIDEO STYLING & COLOR STUDIO
              </h3>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                {activeTabData.label} — បែបផែនពណ៌ភាពយន្ត
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
              style={{ color: activeTabData.accent, borderColor: `${activeTabData.accent}40`, background: `${activeTabData.accent}12` }}
            >
              REAL FILTERS
            </span>
            <button
              onClick={() => {
                if (activeTab === 'video') resetVideoEffects();
                else if (activeTab === 'subtitles') resetSubtitleStyle();
                else if (activeTab === 'styletext') reset3DEffects();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.08] text-xs text-slate-300 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ============================
              TAB 1 — VIDEO & LUTS
          ============================ */}
          {activeTab === 'video' && (
            <div className="space-y-4">
              {/* Cinematic FX */}
              <CollapsibleCard
                title="Effect ភាពយន្តពិសេស (Cinematic FX)"
                icon={<Sparkles className="w-3.5 h-3.5" />}
                accentColor="#f59e0b"
                badge="4 Effects"
              >
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {[
                    { key: 'letterbox', label: 'Cinema Letterbox', icon: <Tv className="w-3.5 h-3.5" />, color: '#38bdf8' },
                    { key: 'vignette',  label: 'Vignette ស្រមោល', icon: <Eye className="w-3.5 h-3.5" />,   color: '#38bdf8' },
                    { key: 'filmGrain', label: '35mm Film Grain',  icon: <Film className="w-3.5 h-3.5" />,  color: '#fbbf24' },
                    { key: 'vhsGlitch', label: 'VHS Scanlines',    icon: <Zap className="w-3.5 h-3.5" />,   color: '#a78bfa' },
                  ].map(({ key, label, icon, color }) => {
                    const active = !!(effects as any)[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onChangeEffects({ ...effects, [key]: !active })}
                        className="relative p-2.5 rounded-xl border text-left transition-all overflow-hidden group"
                        style={{
                          background: active ? `${color}15` : 'rgba(255,255,255,0.02)',
                          borderColor: active ? `${color}60` : 'rgba(255,255,255,0.07)',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span style={{ color: active ? color : '#64748b' }}>{icon}</span>
                          <span
                            className="text-[9px] font-black font-mono px-1 py-0.5 rounded"
                            style={{
                              background: active ? `${color}25` : 'rgba(255,255,255,0.05)',
                              color: active ? color : '#475569',
                            }}
                          >
                            {active ? 'ON' : 'OFF'}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold mt-1.5" style={{ color: active ? '#f8fafc' : '#64748b' }}>
                          {label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CollapsibleCard>

              {/* Aspect Ratio */}
              <CollapsibleCard
                title="Aspect Ratio (ទម្រង់វីដេអូ)"
                icon={<Film className="w-3.5 h-3.5" />}
                accentColor="#38bdf8"
              >
                <div className="grid grid-cols-4 gap-1.5 pt-2">
                  {aspectRatios.map((ar) => {
                    const active = effects.aspectRatio === ar.id;
                    return (
                      <button
                        key={ar.id}
                        onClick={() => onChangeEffects({ ...effects, aspectRatio: ar.id as any })}
                        className="py-2 px-1 rounded-lg border text-center transition-all"
                        style={{
                          background: active ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.02)',
                          borderColor: active ? '#38bdf880' : 'rgba(255,255,255,0.07)',
                        }}
                      >
                        <div className="text-xs font-black" style={{ color: active ? '#38bdf8' : '#94a3b8' }}>{ar.label}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">{ar.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </CollapsibleCard>

              {/* Video Zoom & Fit (ពង្រីក-ពង្រួម & លាតពេញ) */}
              <CollapsibleCard
                title="ពង្រីក-ពង្រួមវីដេអូ (Video Zoom & Fit Mode)"
                icon={<ZoomIn className="w-3.5 h-3.5" />}
                accentColor="#10b981"
                badge={effects.zoomFitMode === 'cover' ? 'Fill (លាតពេញ)' : `${Math.round((effects.zoomScale || 1) * 100)}%`}
              >
                <div className="space-y-3 pt-2">
                  {/* Mode Buttons: Fit vs Fill */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onChangeEffects({ ...effects, zoomFitMode: 'contain', zoomScale: 1, panX: 0, panY: 0 })}
                      className="py-2 px-2 rounded-lg border text-center transition-all flex flex-col items-center gap-0.5"
                      style={{
                        background: effects.zoomFitMode !== 'cover' && (!effects.zoomScale || effects.zoomScale === 1) ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.02)',
                        borderColor: effects.zoomFitMode !== 'cover' && (!effects.zoomScale || effects.zoomScale === 1) ? '#10b98180' : 'rgba(255,255,255,0.07)',
                      }}
                    >
                      <div className="text-xs font-bold text-slate-200">សមល្មម (Fit 100%)</div>
                      <div className="text-[9.5px] text-slate-400">បង្ហាញរូបភាពពេញទំហំដើម</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeEffects({ ...effects, zoomFitMode: 'cover', zoomScale: 1, panX: 0, panY: 0 })}
                      className="py-2 px-2 rounded-lg border text-center transition-all flex flex-col items-center gap-0.5"
                      style={{
                        background: effects.zoomFitMode === 'cover' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.02)',
                        borderColor: effects.zoomFitMode === 'cover' ? '#10b981' : 'rgba(255,255,255,0.07)',
                      }}
                    >
                      <div className="text-xs font-bold text-emerald-300">លាតពេញ (Fill / Crop)</div>
                      <div className="text-[9.5px] text-slate-400">ពង្រីកបំបាត់គែមខ្មៅ (Appflix style)</div>
                    </button>
                  </div>

                  {/* Quick Scale Presets */}
                  <div className="flex items-center gap-1.5 justify-between">
                    {[
                      { label: '100%', val: 1.0 },
                      { label: '125%', val: 1.25 },
                      { label: '150%', val: 1.5 },
                      { label: '175%', val: 1.75 },
                      { label: '200%', val: 2.0 },
                    ].map((p) => {
                      const isActive = (effects.zoomScale || 1.0) === p.val && effects.zoomFitMode !== 'cover';
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => onChangeEffects({ ...effects, zoomScale: p.val, zoomFitMode: 'contain' })}
                          className={`flex-1 py-1 text-[11px] font-mono font-bold rounded-md border transition-all ${
                            isActive
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Zoom Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">ទំហំពង្រីក Zoom Slider:</span>
                      <span className="text-emerald-400 font-mono font-bold">{Math.round((effects.zoomScale || 1) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.8}
                      max={3.0}
                      step={0.05}
                      value={effects.zoomScale || 1.0}
                      onChange={(e) => onChangeEffects({ ...effects, zoomScale: parseFloat(e.target.value), zoomFitMode: 'contain' })}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                  </div>
                </div>
              </CollapsibleCard>

              {/* LUT Library */}
              <CollapsibleCard
                title={`Color Grading LUTs (${LUT_PRESETS.length} ស្ទាយ)`}
                icon={<Palette className="w-3.5 h-3.5" />}
                accentColor="#00C2FF"
                badge={`Active: ${LUT_PRESETS.find((p) => p.id === effects.lutPreset)?.label.split(' ')[0] || 'None'}`}
              >
                <div className="space-y-2 pt-2">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="ស្វែងរក LUT..."
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                      className="w-full bg-[#0b0d17] border border-white/[0.08] text-xs text-slate-200 pl-8 pr-3 py-2 rounded-lg outline-none focus:border-[#00C2FF]/60 transition-colors"
                    />
                  </div>

                  {/* Category pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1">
                    {lutCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedLutCategory(cat)}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border"
                        style={
                          selectedLutCategory === cat
                            ? { background: '#00C2FF20', borderColor: '#00C2FF60', color: '#00C2FF' }
                            : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)', color: '#64748b' }
                        }
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* LUT Cards Grid — color swatch preview */}
                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {filteredLuts.map((lut) => {
                      const isSelected = effects.lutPreset === lut.id;
                      // Build color swatch from label keywords
                      const swatchMap: Record<string, string> = {
                        cinematic: 'linear-gradient(135deg,#1a1a2e,#16213e,#e94560)',
                        anime: 'linear-gradient(135deg,#ff6b9d,#c44dff,#4facfe)',
                        vintage: 'linear-gradient(135deg,#c9a96e,#8b6914,#ede0c4)',
                        retro: 'linear-gradient(135deg,#f8b500,#e85d04,#9d0208)',
                        cyberpunk: 'linear-gradient(135deg,#f72585,#7209b7,#3a0ca3)',
                        teal: 'linear-gradient(135deg,#00b4d8,#0077b6,#023e8a)',
                        warm: 'linear-gradient(135deg,#ff9a3c,#ff6b35,#c1440e)',
                        cool: 'linear-gradient(135deg,#56cfe1,#48cae4,#023e8a)',
                        dark: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
                        film: 'linear-gradient(135deg,#d4a017,#8b6914,#1a1a2e)',
                      };
                      const labelLower = lut.label.toLowerCase();
                      const swatchKey = Object.keys(swatchMap).find((k) => labelLower.includes(k));
                      const swatch = swatchKey ? swatchMap[swatchKey] : `linear-gradient(135deg,#${lut.id.slice(0,6).padEnd(6,'a')},#1e293b)`;

                      return (
                        <button
                          key={lut.id}
                          onClick={() => {
                            onChangeEffects({ ...effects, lutPreset: lut.id });
                            onShowToast(`Effect: ${lut.label}`, 'success');
                          }}
                          className="group rounded-xl overflow-hidden border transition-all duration-200 text-left"
                          style={{
                            borderColor: isSelected ? '#00C2FF80' : 'rgba(255,255,255,0.06)',
                            background: isSelected ? 'rgba(0,194,255,0.08)' : 'rgba(255,255,255,0.02)',
                            transform: isSelected ? 'scale(1.02)' : undefined,
                          }}
                        >
                          {/* Color swatch strip */}
                          <div
                            className="h-10 w-full relative"
                            style={{ background: swatch }}
                          >
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#00C2FF] flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-black font-black" strokeWidth={3} />
                              </div>
                            )}
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          </div>
                          <div className="p-2">
                            <div className="text-[11px] font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                              {lut.label}
                            </div>
                            <div className="text-[9.5px] text-slate-500 truncate mt-0.5">{lut.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CollapsibleCard>

              {/* Fine Tuning Sliders */}
              <CollapsibleCard
                title="Manual Color Tuning (កែសម្រួលលម្អិត)"
                icon={<Sliders className="w-3.5 h-3.5" />}
                accentColor="#38bdf8"
              >
                <div className="space-y-4 pt-3">
                  {[
                    { key: 'brightness', label: 'ពន្លឺ (Brightness)', min: 50, max: 150, unit: '%', from: '#f59e0b', to: '#fef08a' },
                    { key: 'contrast',   label: 'Contrast',           min: 50, max: 150, unit: '%', from: '#6366f1', to: '#a5b4fc' },
                    { key: 'saturation', label: 'ដង់ស៊ីតេពណ៌',         min: 0,  max: 200, unit: '%', from: '#ec4899', to: '#f9a8d4' },
                    { key: 'blur',       label: 'ស្រមោលព្រិល (Blur)',  min: 0,  max: 10,  unit: 'px', from: '#64748b', to: '#94a3b8' },
                  ].map(({ key, label, min, max, unit, from, to }) => (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] text-slate-400">{label}</span>
                        <span
                          className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md"
                          style={{ background: `${from}20`, color: from }}
                        >
                          {(effects as any)[key]}{unit}
                        </span>
                      </div>
                      <GradientSlider
                        min={min} max={max}
                        value={(effects as any)[key]}
                        onChange={(v) => onChangeEffects({ ...effects, [key]: v })}
                        accentFrom={from} accentTo={to} unit={unit}
                      />
                    </div>
                  ))}
                </div>
              </CollapsibleCard>
            </div>
          )}

          {/* ============================
              TAB 2 — WATERMARK
          ============================ */}
          {activeTab === 'watermark' && (
            <div className="space-y-4">
              {/* Enable Toggle Card */}
              <CollapsibleCard
                title="Copyright Protection Watermark"
                icon={<ShieldCheck className="w-3.5 h-3.5" />}
                accentColor="#f59e0b"
              >
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0d17] border border-white/[0.06]">
                    <div>
                      <div className="text-xs font-bold text-white">បើក Watermark ការពារ</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">ការពារការលួចចម្លង</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateWatermark({ enabled: !currentWatermark.enabled })}
                      className="relative w-11 h-6 rounded-full transition-all"
                      style={{ background: currentWatermark.enabled ? '#f59e0b' : 'rgba(255,255,255,0.1)' }}
                    >
                      <span
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
                        style={{ left: currentWatermark.enabled ? '22px' : '2px' }}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">អក្សរ Watermark</label>
                    <input
                      type="text"
                      value={currentWatermark.text}
                      onChange={(e) => updateWatermark({ text: e.target.value })}
                      placeholder="© DabberPro — ឆានែល HD"
                      className="w-full bg-[#0b0d17] border border-white/[0.08] text-xs text-white px-3 py-2 rounded-lg outline-none focus:border-amber-400/60 transition-colors"
                    />
                  </div>
                </div>
              </CollapsibleCard>

              {/* 🎨 Watermark Style & Effect Presets */}
              <CollapsibleCard
                title={`ម៉ូដ Watermark & Effect (${WATERMARK_STYLE_PRESETS.length} ម៉ូដ)`}
                icon={<Palette className="w-3.5 h-3.5" />}
                accentColor="#f59e0b"
                badge={WATERMARK_STYLE_PRESETS.find(p => p.id === (currentWatermark.stylePreset || 'theatrical_gold'))?.label.split(' ')[1] || 'Gold'}
              >
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    {WATERMARK_STYLE_PRESETS.map((preset) => {
                      const isActive = (currentWatermark.stylePreset || 'theatrical_gold') === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            updateWatermark({
                              stylePreset: preset.id,
                              icon: preset.iconType as any,
                              textColor: preset.textColor,
                              fontFamily: preset.fontFamily,
                            });
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-1.5 overflow-hidden group ${
                            isActive
                              ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                              : 'border-white/10 hover:border-white/25 bg-[#0b0d17]'
                          }`}
                          style={{
                            background: isActive ? 'rgba(245, 158, 11, 0.12)' : undefined,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white truncate">{preset.label}</span>
                            {isActive && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          </div>

                          {/* Live mini preview badge */}
                          <div
                            className="px-2 py-1 rounded-full text-[10.5px] font-bold flex items-center gap-1 w-fit max-w-full truncate"
                            style={{
                              background: preset.badgeBg,
                              border: preset.badgeBorder,
                              boxShadow: preset.badgeShadow,
                              color: preset.textColor,
                              fontFamily: preset.fontFamily,
                            }}
                          >
                            <span>{currentWatermark.text || 'Watermark'}</span>
                          </div>

                          <div className="text-[9.5px] text-slate-400 line-clamp-1">{preset.description}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Icon Selector */}
                  <div className="pt-2 border-t border-white/10">
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">រូបតំណាង Icon លើ Watermark</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'shield', label: 'Shield', icon: <ShieldCheck className="w-3 h-3 text-amber-400" /> },
                        { id: 'crown', label: 'Crown', icon: <Crown className="w-3 h-3 text-amber-400" /> },
                        { id: 'star', label: 'Star', icon: <Star className="w-3 h-3 text-amber-400" /> },
                        { id: 'flame', label: 'Flame', icon: <Flame className="w-3 h-3 text-rose-400" /> },
                        { id: 'sparkle', label: 'Sparkle', icon: <Sparkles className="w-3 h-3 text-purple-400" /> },
                        { id: 'zap', label: 'Zap', icon: <Zap className="w-3 h-3 text-cyan-400" /> },
                        { id: 'tv', label: 'TV', icon: <Tv className="w-3 h-3 text-sky-400" /> },
                        { id: 'none', label: 'None', icon: <span className="text-xs">🚫</span> },
                      ].map((item) => {
                        const isIconActive = (currentWatermark.icon || WATERMARK_STYLE_PRESETS.find(p => p.id === (currentWatermark.stylePreset || 'theatrical_gold'))?.iconType || 'shield') === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => updateWatermark({ icon: item.id as any })}
                            className={`py-1.5 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                              isIconActive
                                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Font Family Selector */}
                  <div className="pt-2 border-t border-white/10">
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">ពុម្ពអក្សរ Font Family</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'Outfit', label: 'Outfit (English)' },
                        { id: 'Kantumruy Pro', label: 'Kantumruy Pro' },
                        { id: 'Koulen', label: 'Koulen (ខ្មែរដិត)' },
                        { id: 'Moul', label: 'Moul (អក្សរមូល)' },
                        { id: 'Bayon', label: 'Bayon (បាយ័ន)' },
                      ].map((f) => {
                        const isFontActive = (currentWatermark.fontFamily || 'Outfit') === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => updateWatermark({ fontFamily: f.id })}
                            className={`py-1.5 px-2 rounded-lg border text-xs font-bold text-center transition-all ${
                              isFontActive
                                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                            }`}
                            style={{ fontFamily: f.id }}
                          >
                            {f.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CollapsibleCard>

              {/* Position */}
              <CollapsibleCard
                title="ទីតាំង Watermark (5-Point)"
                icon={<Move className="w-3.5 h-3.5" />}
                accentColor="#f59e0b"
              >
                <div className="grid grid-cols-3 gap-1.5 pt-2 bg-[#0b0d17] p-2 rounded-xl border border-white/[0.06]">
                  {[
                    { id: 'top-left',     label: '↖ លើ ឆ្វេង' },
                    { id: 'center',       label: '⏺ កណ្តាល' },
                    { id: 'top-right',    label: '↗ លើ ស្តាំ' },
                    { id: 'bottom-left',  label: '↙ ក្រោម ឆ្វេង' },
                    { id: '_empty',       label: '' },
                    { id: 'bottom-right', label: '↘ ក្រោម ស្តាំ' },
                  ].map((pos) =>
                    pos.id === '_empty' ? (
                      <div key="empty" />
                    ) : (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => updateWatermark({ position: pos.id as any })}
                        className="py-2 px-1 rounded-lg text-[11px] font-semibold border text-center transition-all"
                        style={
                          currentWatermark.position === pos.id
                            ? { background: '#f59e0b20', borderColor: '#f59e0b60', color: '#f59e0b' }
                            : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)', color: '#64748b' }
                        }
                      >
                        {pos.label}
                      </button>
                    )
                  )}
                </div>
              </CollapsibleCard>

              {/* Opacity / Size */}
              <CollapsibleCard
                title="Opacity & Size"
                icon={<Sliders className="w-3.5 h-3.5" />}
                accentColor="#f59e0b"
              >
                <div className="space-y-4 pt-3">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[11px] text-slate-400">Opacity</span>
                      <span className="text-[11px] font-mono font-bold text-amber-400">{currentWatermark.opacity}%</span>
                    </div>
                    <GradientSlider min={20} max={100} value={currentWatermark.opacity}
                      onChange={(v) => updateWatermark({ opacity: v })}
                      accentFrom="#f59e0b" accentTo="#fbbf24" unit="%" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[11px] text-slate-400">Font Size</span>
                      <span className="text-[11px] font-mono font-bold text-amber-400">{currentWatermark.fontSize}px</span>
                    </div>
                    <GradientSlider min={10} max={30} value={currentWatermark.fontSize}
                      onChange={(v) => updateWatermark({ fontSize: v })}
                      accentFrom="#f59e0b" accentTo="#fbbf24" unit="px" />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-300">Badge Pill</span>
                    <input type="checkbox" checked={currentWatermark.showBadge}
                      onChange={(e) => updateWatermark({ showBadge: e.target.checked })}
                      className="accent-amber-400 w-4 h-4 cursor-pointer" />
                  </div>
                </div>
              </CollapsibleCard>
            </div>
          )}

          {/* ============================
              TAB 3 — STYLE TEXT 3D
          ============================ */}
          {activeTab === 'styletext' && (
            <div className="space-y-4">
              {/* Enable toggle */}
              <CollapsibleCard
                title="3D Theatrical Banner"
                icon={<Sparkles className="w-3.5 h-3.5" />}
                accentColor="#f43f5e"
              >
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0d17] border border-white/[0.06]">
                    <div>
                      <div className="text-xs font-bold text-white">បើក Style Text</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">3D Cinematic Title Overlay</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateStyleText({ enabled: !currentStyleText.enabled })}
                      className="relative w-11 h-6 rounded-full transition-all"
                      style={{ background: currentStyleText.enabled ? '#f43f5e' : 'rgba(255,255,255,0.1)' }}
                    >
                      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
                        style={{ left: currentStyleText.enabled ? '22px' : '2px' }} />
                    </button>
                  </div>

                  {/* 1-Click Sync */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 border border-amber-500/25">
                    <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      1-Click Sync ពី Poster Cover
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        let synced = false;
                        try {
                          const raw = localStorage.getItem('dabber_thumbnail_autosave');
                          if (raw) {
                            const tpl = JSON.parse(raw);
                            updateStyleText({
                              enabled: true,
                              title: tpl.title || 'ពិភពស្ដេចអមតៈ',
                              subtitle: tpl.subtitle || 'AI Dubbing',
                              badge: tpl.badge || 'ភាគ ០១',
                              stylePreset: tpl.effectStyle || 'gold3d',
                              fontFamily: tpl.fontFamily || 'Koulen',
                              fontSize: Math.min(48, Math.max(22, Math.round((tpl.fontSize || 58) * 0.6))),
                              position: 'free', posX: tpl.posX ?? 10, posY: tpl.posY ?? 82,
                              textAlign: tpl.textAlign || 'left',
                              rotationAngle: tpl.rotationAngle || 0,
                              showBanner: tpl.bgBanner !== 'none',
                              depth3D: tpl.depth3D ?? 6,
                              glowIntensity: tpl.glowIntensity ?? 16,
                              strokeWidth: tpl.strokeWidth ?? 5,
                            });
                            synced = true;
                          }
                        } catch (_) {}
                        if (!synced) updateStyleText({ enabled: true, title: 'ពិភពស្ដេចអមតៈ', stylePreset: 'gold3d', fontFamily: 'Koulen', fontSize: 32, position: 'free', posX: 10, posY: 82, textAlign: 'left', showBanner: true });
                        onShowToast('បានចម្លង Style ពី Poster!', 'success');
                      }}
                      className="w-full py-1.5 rounded-lg text-xs font-bold text-white transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg,#f59e0b,#ec4899)' }}
                    >
                      យក Style ដូច Poster
                    </button>
                  </div>
                </div>
              </CollapsibleCard>

              {/* Text Inputs */}
              <CollapsibleCard title="ចំណងជើង & Badge" icon={<Edit3 className="w-3.5 h-3.5" />} accentColor="#f43f5e">
                <div className="space-y-2.5 pt-2">
                  {[
                    { key: 'title',    label: 'Main Title',       ph: 'សង្គ្រាមអាទិទេព',     cls: 'text-white font-semibold' },
                    { key: 'subtitle', label: 'Subtitle Tagline', ph: 'AI Dubbing Studio',  cls: 'text-slate-300' },
                    { key: 'badge',    label: 'Episode Badge',    ph: 'ភាគ ០១ - ចប់',       cls: 'text-rose-300 font-mono' },
                  ].map(({ key, label, ph, cls }) => (
                    <div key={key}>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-1">{label}</label>
                      <input type="text"
                        value={(currentStyleText as any)[key] || ''}
                        onChange={(e) => updateStyleText({ [key]: e.target.value })}
                        placeholder={ph}
                        className={`w-full bg-[#0b0d17] border border-white/[0.08] text-xs px-3 py-2 rounded-lg outline-none focus:border-rose-400/60 transition-colors ${cls}`}
                      />
                    </div>
                  ))}
                </div>
              </CollapsibleCard>

              {/* 3D Style Presets */}
              <CollapsibleCard
                title={`3D Text Presets (${text3dPresets.length} ជម្រើស)`}
                icon={<Layers className="w-3.5 h-3.5" />}
                accentColor="#f43f5e"
              >
                <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pt-2 pr-1">
                  {text3dPresets.map((item) => {
                    const isSelected = currentStyleText.stylePreset === (item.titleStylePreset || '');
                    const colors = getTextCardColors(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          updateStyleText({ stylePreset: (item.titleStylePreset || 'gold3d') as any });
                          onChangeEffects({ ...effects, effect3dEnabled: true, effect3dPreset: item.id });
                        }}
                        className="rounded-xl overflow-hidden border transition-all text-left"
                        style={{
                          background: isSelected ? colors.bg.replace('0.3', '0.45') : 'rgba(11,13,23,0.9)',
                          borderColor: isSelected ? colors.border : 'rgba(255,255,255,0.06)',
                          transform: isSelected ? 'scale(1.02)' : undefined,
                        }}
                      >
                        {/* Color swatch */}
                        <div className="h-2" style={{ background: colors.preview }} />
                        <div className="p-2">
                          <div className="text-[11px] font-bold truncate"
                            style={{ color: isSelected ? colors.border : '#cbd5e1' }}>
                            {item.label}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CollapsibleCard>

              {/* Position sliders */}
              <CollapsibleCard title="ទីតាំង & ទំហំ (Position)" icon={<Move className="w-3.5 h-3.5" />} accentColor="#f43f5e">
                <div className="space-y-4 pt-3">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[11px] text-slate-400">↔️ Horizontal X</span>
                      <span className="text-[11px] font-mono text-amber-400">{currentStyleText.posX ?? 10}%</span>
                    </div>
                    <GradientSlider min={2} max={98} value={currentStyleText.posX ?? 10}
                      onChange={(v) => updateStyleText({ position: 'free', posX: v })}
                      accentFrom="#f59e0b" accentTo="#fbbf24" unit="%" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[11px] text-slate-400">↕️ Vertical Y</span>
                      <span className="text-[11px] font-mono text-amber-400">{currentStyleText.posY ?? 82}%</span>
                    </div>
                    <GradientSlider min={5} max={95} value={currentStyleText.posY ?? 82}
                      onChange={(v) => updateStyleText({ position: 'free', posY: v })}
                      accentFrom="#f59e0b" accentTo="#fbbf24" unit="%" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[11px] text-slate-400">📐 Font Size</span>
                      <span className="text-[11px] font-mono text-rose-400">{currentStyleText.fontSize || 28}px</span>
                    </div>
                    <GradientSlider min={16} max={60} value={currentStyleText.fontSize || 28}
                      onChange={(v) => updateStyleText({ fontSize: v })}
                      accentFrom="#f43f5e" accentTo="#ec4899" unit="px" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[11px] text-slate-400">🔄 Rotation</span>
                      <span className="text-[11px] font-mono text-sky-400">{currentStyleText.rotationAngle || 0}°</span>
                    </div>
                    <GradientSlider min={-25} max={25} value={currentStyleText.rotationAngle || 0}
                      onChange={(v) => updateStyleText({ rotationAngle: v })}
                      accentFrom="#38bdf8" accentTo="#6366f1" unit="°" />
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                    <span className="text-xs text-slate-300">Glass Banner</span>
                    <input type="checkbox" checked={currentStyleText.showBanner}
                      onChange={(e) => updateStyleText({ showBanner: e.target.checked })}
                      className="accent-amber-500 w-4 h-4 cursor-pointer" />
                  </div>
                </div>
              </CollapsibleCard>
            </div>
          )}

          {/* ============================
              TAB 4 — SUBTITLES
          ============================ */}
          {activeTab === 'subtitles' && (
            <div className="space-y-4">
              {/* Preset Picker */}
              <CollapsibleCard
                title={`Subtitle Presets (${SUBTITLE_PRESETS.length} ស្ទាយ)`}
                icon={<Type className="w-3.5 h-3.5" />}
                accentColor="#a855f7"
              >
                <div className="space-y-2 pt-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
                    <input type="text" placeholder="ស្វែងរក Subtitle Style..."
                      value={subSearch} onChange={(e) => setSubSearch(e.target.value)}
                      className="w-full bg-[#0b0d17] border border-white/[0.08] text-xs text-slate-200 pl-8 pr-3 py-2 rounded-lg outline-none focus:border-purple-400/60 transition-colors" />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1">
                    {subCategories.map((cat) => (
                      <button key={cat} onClick={() => setSelectedSubCategory(cat)}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border"
                        style={
                          selectedSubCategory === cat
                            ? { background: '#a855f720', borderColor: '#a855f760', color: '#a855f7' }
                            : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)', color: '#64748b' }
                        }
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Visual Subtitle Cards */}
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {filteredSubs.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          onChangeSubtitleStyle({
                            fontSize: sub.fontSize, fontFamily: sub.fontFamily,
                            textColor: sub.textColor, strokeColor: sub.strokeColor,
                            strokeWidth: sub.strokeWidth, backgroundColor: sub.backgroundColor,
                            position: subtitleStyle.position || 'bottom', animation: sub.animation || 'none',
                          });
                          onShowToast(`Subtitle: ${sub.label}`, 'success');
                        }}
                        className="rounded-xl overflow-hidden border border-white/[0.06] hover:border-purple-400/40 bg-[#0b0d17] hover:bg-purple-500/[0.06] transition-all group text-left"
                      >
                        {/* Font/color preview strip */}
                        <div
                          className="px-3 py-3 flex items-center justify-center"
                          style={{ background: sub.backgroundColor || 'rgba(0,0,0,0.7)' }}
                        >
                          <span
                            className="text-[13px] font-bold"
                            style={{
                              color: sub.textColor,
                              fontFamily: sub.fontFamily,
                              WebkitTextStroke: sub.strokeWidth > 0 ? `${sub.strokeWidth}px ${sub.strokeColor}` : undefined,
                            }}
                          >
                            អក្សរ Sample
                          </span>
                        </div>
                        <div className="px-2 py-1.5">
                          <div className="text-[11px] font-bold text-slate-200 group-hover:text-purple-300 truncate transition-colors">
                            {sub.label}
                          </div>
                          <div className="text-[9px] text-slate-600 truncate mt-0.5">{sub.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </CollapsibleCard>

              {/* Manual adjustments */}
              <CollapsibleCard title="Manual Subtitle Tuning" icon={<Sliders className="w-3.5 h-3.5" />} accentColor="#a855f7">
                <div className="space-y-4 pt-3">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[11px] text-slate-400">Font Size</span>
                      <span className="text-[11px] font-mono text-purple-400">{subtitleStyle.fontSize}px</span>
                    </div>
                    <GradientSlider min={14} max={36} value={subtitleStyle.fontSize}
                      onChange={(v) => onChangeSubtitleStyle({ ...subtitleStyle, fontSize: v })}
                      accentFrom="#a855f7" accentTo="#c084fc" unit="px" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[11px] text-slate-400">Stroke Width</span>
                      <span className="text-[11px] font-mono text-purple-400">{subtitleStyle.strokeWidth}px</span>
                    </div>
                    <GradientSlider min={0} max={8} value={subtitleStyle.strokeWidth}
                      onChange={(v) => onChangeSubtitleStyle({ ...subtitleStyle, strokeWidth: v })}
                      accentFrom="#6366f1" accentTo="#a855f7" unit="px" />
                  </div>
                </div>
              </CollapsibleCard>
            </div>
          )}

          {/* ============================
              TAB — SOCIAL CANVAS (TikTok & FB Page)
          ============================ */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              {/* Header Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#0b0e1a] border border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-pink-500/30 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>ស្ទាយផ្ទៃក្រោយសម្រាប់ TikTok & Facebook Page</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">CANVAS</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ប្តូរទំហំ 9:16 / 4:5 ជាមួយផ្ទៃវីដេអូព្រិល (Blur Background) និងដាក់ចំណងជើងទាក់ទាញ
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !currentSocialCanvas.enabled;
                    updateSocialCanvas({ enabled: next });
                    onShowToast(next ? '📱 បានបើក Social Canvas Mode' : 'បិទ Social Canvas Mode', 'info');
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative ${currentSocialCanvas.enabled ? 'bg-pink-500' : 'bg-white/10'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${currentSocialCanvas.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Canvas Ratio Selector */}
              <CollapsibleCard title="ទំហំ Canvas (Canvas Ratio)" icon={<Smartphone className="w-3.5 h-3.5" />} accentColor="#ec4899">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  {[
                    { id: '9:16', label: '9:16 TikTok / Reels', sub: 'បញ្ឈរពេញអេក្រង់' },
                    { id: '4:5', label: '4:5 Facebook Page', sub: 'បញ្ឈរ Feed ផេក' },
                    { id: '1:1', label: '1:1 Square', sub: 'ការ៉េ Instagram/FB' },
                    { id: '16:9', label: '16:9 Landscape', sub: 'ផ្តេកធម្មតា YouTube' },
                  ].map((r) => {
                    const isSelected = (currentSocialCanvas.canvasRatio || '9:16') === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          updateSocialCanvas({ canvasRatio: r.id as any, enabled: true });
                          onShowToast(`ជ្រើសរើសទំហំ: ${r.label}`, 'info');
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-pink-500/20 border-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                            : 'bg-[#0b0d17] border-white/[0.06] text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center justify-between">
                          <span>{r.label}</span>
                          {isSelected && <Check className="w-3 h-3 text-pink-400" />}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">{r.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </CollapsibleCard>

              {/* Background Style Selector */}
              <CollapsibleCard title="ម៉ូដផ្ទៃខាងក្រោយ (Background Style)" icon={<Sparkles className="w-3.5 h-3.5" />} accentColor="#a855f7">
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'blur_video', label: '🎥 Duplicate Video Blur', sub: 'វីដេអូព្រិលខាងក្រោយ' },
                      { id: 'cinema_gradient', label: '🌌 Cinema Gradient', sub: 'ពណ៌ងងឹតស៊ីជម្រៅ' },
                      { id: 'neon_glow', label: '⚡ Cyber Neon Glow', sub: 'ពន្លឺណេអុងព័ទ្ធជុំវិញ' },
                      { id: 'cyber_mesh', label: '🌐 Cyber Tech Mesh', sub: 'សំណាញ់បច្ចេកវិទ្យា' },
                      { id: 'dark_matte', label: '⬛ Dark Matte Film', sub: 'ខ្មៅប្រណិត Matte' },
                    ].map((bg) => {
                      const isSelected = (currentSocialCanvas.backgroundType || 'blur_video') === bg.id;
                      return (
                        <button
                          key={bg.id}
                          type="button"
                          onClick={() => {
                            updateSocialCanvas({ backgroundType: bg.id as any, enabled: true });
                            onShowToast(`ផ្ទៃខាងក្រោយ: ${bg.label}`, 'info');
                          }}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-purple-500/20 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                              : 'bg-[#0b0d17] border-white/[0.06] text-slate-300 hover:border-white/20'
                          }`}
                        >
                          <div className="font-bold text-xs flex items-center justify-between">
                            <span>{bg.label}</span>
                            {isSelected && <Check className="w-3 h-3 text-purple-400" />}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{bg.sub}</div>
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[11px] text-slate-400">កម្រិតព្រិល (Blur Amount)</span>
                      <span className="text-[11px] font-mono text-pink-400">{currentSocialCanvas.blurAmount || 20}px</span>
                    </div>
                    <GradientSlider
                      min={5}
                      max={45}
                      value={currentSocialCanvas.blurAmount || 20}
                      onChange={(v) => updateSocialCanvas({ blurAmount: v })}
                      accentFrom="#ec4899"
                      accentTo="#a855f7"
                      unit="px"
                    />
                  </div>
                </div>
              </CollapsibleCard>

              {/* Top & Bottom Social Text Banners */}
              <CollapsibleCard title="ចំណងជើងលើ & ក្រោម (Header & Caption)" icon={<Type className="w-3.5 h-3.5" />} accentColor="#38bdf8">
                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5 font-bold">ចំណងជើងធំខាងលើ (Top Headline)</label>
                    <input
                      type="text"
                      value={currentSocialCanvas.topTitle || ''}
                      onChange={(e) => updateSocialCanvas({ topTitle: e.target.value })}
                      placeholder="ឧ. 🔥 សម្រាយរឿងថ្មីពិសេស - ភាគ ០១..."
                      className="w-full bg-[#0b0d17] border border-white/[0.08] text-slate-200 px-3 py-2 rounded-xl outline-none focus:border-pink-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5 font-bold">សារលើកទឹកចិត្តខាងក្រោម (Bottom Caption)</label>
                    <input
                      type="text"
                      value={currentSocialCanvas.bottomSubtitle || ''}
                      onChange={(e) => updateSocialCanvas({ bottomSubtitle: e.target.value })}
                      placeholder="ឧ. 👉 សូមចុច Like & Follow ដើម្បីទស្សនាភាគបន្ត! ❤️"
                      className="w-full bg-[#0b0d17] border border-white/[0.08] text-slate-200 px-3 py-2 rounded-xl outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5">គែមស៊ុមវីដេអូ (Frame Border Color)</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {[
                        { label: 'Cyan Glow', color: '#38bdf8' },
                        { label: 'Gold Luxury', color: '#eab308' },
                        { label: 'Neon Pink', color: '#ec4899' },
                        { label: 'Emerald', color: '#10b981' },
                        { label: 'White Border', color: '#ffffff' },
                        { label: 'None', color: 'transparent' },
                      ].map((b) => (
                        <button
                          key={b.label}
                          type="button"
                          onClick={() => updateSocialCanvas({ frameBorderColor: b.color })}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                            currentSocialCanvas.frameBorderColor === b.color
                              ? 'border-pink-500 bg-pink-500/20 text-white'
                              : 'border-white/10 bg-[#0b0d17] text-slate-300'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: b.color === 'transparent' ? '#475569' : b.color }} />
                          <span>{b.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleCard>
            </div>
          )}

          {/* ============================
              TAB — IN-VIDEO SPONSOR
          ============================ */}
          {activeTab === 'sponsor' && (
            <div className="space-y-4">
              {/* Header Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#0b0e1a] border border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Award className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>បន្ថែមផ្ទាំងឧបត្ថម្ភ (Add Sponsor In Video)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">SPONSOR</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ដាក់ឈ្មោះម៉ាកយីហោ ឡូហ្គោ ពាក្យស្លោក និងលេខទំនាក់ទំនងលើវីដេអូ
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !currentSponsor.enabled;
                    updateSponsor({ enabled: next });
                    onShowToast(next ? '👑 បានបើក Sponsor Overlay' : 'បិទ Sponsor Overlay', 'info');
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative ${currentSponsor.enabled ? 'bg-amber-500' : 'bg-white/10'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${currentSponsor.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Brand Information */}
              <CollapsibleCard title="ព័ត៌មាន Sponsor (Brand Info)" icon={<Edit3 className="w-3.5 h-3.5" />} accentColor="#eab308">
                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-bold">ឈ្មោះ Sponsor / ក្រុមហ៊ុន</label>
                    <input
                      type="text"
                      value={currentSponsor.sponsorName || ''}
                      onChange={(e) => updateSponsor({ sponsorName: e.target.value, enabled: true })}
                      placeholder="ឧ. DABBER PRO STUDIO..."
                      className="w-full bg-[#0b0d17] border border-white/[0.08] text-white px-3 py-2 rounded-xl outline-none focus:border-amber-400 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1 font-bold">ពាក្យស្លោក (Tagline)</label>
                      <input
                        type="text"
                        value={currentSponsor.tagline || ''}
                        onChange={(e) => updateSponsor({ tagline: e.target.value })}
                        placeholder="ឧ. ឧបត្ថម្ភធំផ្តាច់មុខ..."
                        className="w-full bg-[#0b0d17] border border-white/[0.08] text-slate-200 px-3 py-2 rounded-xl outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1 font-bold">ទំនាក់ទំនង (Contact / Telegram)</label>
                      <input
                        type="text"
                        value={currentSponsor.contactInfo || ''}
                        onChange={(e) => updateSponsor({ contactInfo: e.target.value })}
                        placeholder="ឧ. Telegram: @brand • 012 345 678"
                        className="w-full bg-[#0b0d17] border border-white/[0.08] text-slate-200 px-3 py-2 rounded-xl outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleCard>

              {/* Sponsor Position */}
              <CollapsibleCard title="ទីតាំងដាក់លើវីដេអូ (Sponsor Position)" icon={<Move className="w-3.5 h-3.5" />} accentColor="#f59e0b">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                  {[
                    { id: 'bottom_banner', label: 'បន្ទះខាងក្រោមពេញ', desc: 'Bottom Full Banner' },
                    { id: 'lower_third', label: 'Lower-Third ទូរទស្សន៍', desc: 'TV Broadcast Bar' },
                    { id: 'floating_pill', label: 'គ្រាប់ពេជ្រ Pill បណ្តែត', desc: 'Floating Glass Pill' },
                    { id: 'top_right', label: 'ជ្រុងខាងលើស្តាំ', desc: 'Top Right Badge' },
                    { id: 'top_left', label: 'ជ្រុងខាងលើឆ្វេង', desc: 'Top Left Badge' },
                    { id: 'top_banner', label: 'បន្ទះខាងលើពេញ', desc: 'Top Announcement Bar' },
                  ].map((pos) => {
                    const isSelected = (currentSponsor.position || 'bottom_banner') === pos.id;
                    return (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => {
                          updateSponsor({ position: pos.id as any, enabled: true });
                          onShowToast(`ទីតាំង Sponsor: ${pos.label}`, 'info');
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                            : 'bg-[#0b0d17] border-white/[0.06] text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center justify-between">
                          <span>{pos.label}</span>
                          {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{pos.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </CollapsibleCard>

              {/* Style Presets */}
              <CollapsibleCard title="ម៉ូដពណ៌ Sponsor (Style Presets)" icon={<Palette className="w-3.5 h-3.5" />} accentColor="#fbbf24">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                  {[
                    { id: 'theatrical_gold', label: '🏆 Theatrical Gold', bg: 'linear-gradient(90deg,#78350f,#eab308,#fef08a)' },
                    { id: 'neon_cyan', label: '⚡ Cyber Cyan Neon', bg: 'linear-gradient(90deg,#0e7490,#06b6d4,#67e8f9)' },
                    { id: 'glass_blur', label: '🧊 Glassmorphism', bg: 'linear-gradient(90deg,#334155,#64748b,#cbd5e1)' },
                    { id: 'red_breaking', label: '🔴 Breaking News Red', bg: 'linear-gradient(90deg,#7f1d1d,#dc2626,#f87171)' },
                    { id: 'royal_purple', label: '👑 Royal Luxury Purple', bg: 'linear-gradient(90deg,#581c87,#9333ea,#c084fc)' },
                    { id: 'amber_blaze', label: '🔥 Amber Fire Blaze', bg: 'linear-gradient(90deg,#7c2d12,#ea580c,#fbbf24)' },
                  ].map((preset) => {
                    const isSelected = (currentSponsor.stylePreset || 'theatrical_gold') === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          updateSponsor({ stylePreset: preset.id as any, enabled: true });
                          onShowToast(`ម៉ូដ: ${preset.label}`, 'info');
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-white'
                            : 'bg-[#0b0d17] border-white/[0.06] text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <div className="font-bold text-xs truncate">{preset.label}</div>
                        <div className="h-2 rounded-full mt-2" style={{ background: preset.bg }} />
                      </button>
                    );
                  })}
                </div>
              </CollapsibleCard>
            </div>
          )}

          {/* ============================
              TAB — RUNNING TICKER TEXT (Marquee)
          ============================ */}
          {activeTab === 'ticker' && (
            <div className="space-y-4">
              {/* Header Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#0b0e1a] border border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>អក្សររត់លើវីដេអូ (Running Ticker / Marquee)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">NEWS TICKER</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      អក្សររត់ផ្ដេកបន្តបន្ទាប់ (60fps continuous marquee) សម្រាប់ព័ត៌មានទាន់ហេតុការណ៍ ឬផ្សាយពាណិជ្ជកម្ម
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !currentTicker.enabled;
                    updateTicker({ enabled: next });
                    onShowToast(next ? '📢 បានបើកអក្សររត់ Marquee' : 'បិទអក្សររត់ Marquee', 'info');
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative ${currentTicker.enabled ? 'bg-red-500' : 'bg-white/10'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${currentTicker.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Ticker Content */}
              <CollapsibleCard title="ខ្លឹមសារអក្សររត់ (Ticker Content)" icon={<Type className="w-3.5 h-3.5" />} accentColor="#ef4444">
                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-bold">ស្លាកក្បាលអក្សរ (Badge Tag)</label>
                    <input
                      type="text"
                      value={currentTicker.newsBadgeText || ''}
                      onChange={(e) => updateTicker({ newsBadgeText: e.target.value })}
                      placeholder="ឧ. 🔴 BREAKING, 📢 ដំណឹង, 🔥 HOT NEWS..."
                      className="w-full bg-[#0b0d17] border border-white/[0.08] text-white px-3 py-2 rounded-xl outline-none focus:border-red-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-bold">អត្ថបទអក្សររត់ (Marquee Running Text)</label>
                    <textarea
                      rows={3}
                      value={currentTicker.text || ''}
                      onChange={(e) => updateTicker({ text: e.target.value, enabled: true })}
                      placeholder="សរសេរអក្សរដែលត្រូវរត់នៅទីនេះ... ឧ. ទំនាក់ទំនងផ្សាយពាណិជ្ជកម្មតាមរយៈ Telegram: @channel • ទូរស័ព្ទលេខ: 012 345 678..."
                      className="w-full bg-[#0b0d17] border border-white/[0.08] text-white px-3 py-2 rounded-xl outline-none focus:border-red-400 leading-relaxed"
                    />
                  </div>
                </div>
              </CollapsibleCard>

              {/* Position & Speed */}
              <CollapsibleCard title="ទីតាំង & ល្បឿនរត់ (Position & Speed)" icon={<Zap className="w-3.5 h-3.5" />} accentColor="#f97316">
                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5 font-bold">ទីតាំងនៅលើវីដេអូ</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'bottom', label: 'ខាងក្រោម', desc: 'Bottom of Screen' },
                        { id: 'above_subtitles', label: 'លើ Subtitles', desc: 'Above Subtitles' },
                        { id: 'top', label: 'ខាងលើ', desc: 'Top of Screen' },
                      ].map((p) => {
                        const isSelected = (currentTicker.position || 'bottom') === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => updateTicker({ position: p.id as any, enabled: true })}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'bg-red-500/20 border-red-500 text-white'
                                : 'bg-[#0b0d17] border-white/[0.06] text-slate-300'
                            }`}
                          >
                            <div className="font-bold">{p.label}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5 font-bold">ល្បឿនអក្សររត់</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'slow', label: 'យឺតស្រួលអាន', dur: '25s' },
                        { id: 'medium', label: 'ល្បឿនមធ្យម', dur: '16s' },
                        { id: 'fast', label: 'លឿនរហ័ស', dur: '9s' },
                      ].map((s) => {
                        const isSelected = (currentTicker.speed || 'medium') === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => updateTicker({ speed: s.id as any })}
                            className={`p-2 rounded-xl border text-center transition-all ${
                              isSelected
                                ? 'bg-orange-500/20 border-orange-400 text-white font-bold'
                                : 'bg-[#0b0d17] border-white/[0.06] text-slate-300'
                            }`}
                          >
                            <div>{s.label}</div>
                            <div className="text-[10px] text-slate-400">{s.dur}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[11px] text-slate-400">ទំហំអក្សរ (Font Size)</span>
                      <span className="text-[11px] font-mono text-orange-400">{currentTicker.fontSize || 16}px</span>
                    </div>
                    <GradientSlider
                      min={13}
                      max={26}
                      value={currentTicker.fontSize || 16}
                      onChange={(v) => updateTicker({ fontSize: v })}
                      accentFrom="#ef4444"
                      accentTo="#f97316"
                      unit="px"
                    />
                  </div>
                </div>
              </CollapsibleCard>
            </div>
          )}

          {/* ============================
              TAB 5 — AUDIO
          ============================ */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <CollapsibleCard
                title={`Audio FX Presets (${AUDIO_EFFECT_PRESETS.length} Effect)`}
                icon={<Volume2 className="w-3.5 h-3.5" />}
                accentColor="#10b981"
              >
                <div className="space-y-2 pt-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
                    <input type="text" placeholder="ស្វែងរក Audio FX..."
                      value={audioSearch} onChange={(e) => setAudioSearch(e.target.value)}
                      className="w-full bg-[#0b0d17] border border-white/[0.08] text-xs text-slate-200 pl-8 pr-3 py-2 rounded-lg outline-none focus:border-emerald-400/60 transition-colors" />
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 max-h-72 overflow-y-auto pr-1">
                    {filteredAudios.map((aud) => (
                      <button
                        key={aud.id}
                        onClick={() => onShowToast(`Audio FX: ${aud.label}`, 'success')}
                        className="p-2.5 rounded-xl border border-white/[0.06] bg-[#0b0d17] hover:border-emerald-400/40 hover:bg-emerald-500/[0.06] transition-all group text-left flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-slate-200 group-hover:text-emerald-300 transition-colors truncate">
                            {aud.label}
                          </div>
                          <div className="text-[9.5px] text-slate-500 truncate mt-0.5">{aud.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </CollapsibleCard>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            STICKY FOOTER — Apply / Reset always visible
        ══════════════════════════════════════════════════════════════ */}
        <div className="shrink-0 px-5 py-3 border-t border-white/[0.07] bg-[#0d101c] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Auto-Saved</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'video') resetVideoEffects();
                else if (activeTab === 'subtitles') resetSubtitleStyle();
                else if (activeTab === 'styletext') reset3DEffects();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.08] text-xs text-slate-300 hover:text-white transition-all active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-white text-xs font-bold transition-all active:scale-95 shadow-lg"
                style={{ background: 'linear-gradient(135deg,#00C2FF,#0070FF)', boxShadow: '0 4px 16px rgba(0,194,255,0.3)' }}
              >
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>Done & Exit</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
