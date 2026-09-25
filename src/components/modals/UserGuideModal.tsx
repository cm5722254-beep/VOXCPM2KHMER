import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  Cpu,
  Key,
  Scissors,
  Palette,
  ChevronRight,
  ChevronLeft,
  Zap,
  RotateCw,
  Compass,
  CheckCircle2,
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLicenseModal?: () => void;
  onOpenOfflineStudio?: () => void;
  onOpenTrimmer?: () => void;
  onOpenCustomizer?: () => void;
}

interface GuideSlide3D {
  id: number;
  title: string;
  badge: string;
  category: string;
  icon: React.ReactNode;
  accentHex: string;
  gradient: string;
  glowColor: string;
  summary: string;
  points: string[];
  tips?: string;
  actionText?: string;
  actionType?: 'license' | 'telegram' | 'offline' | 'trimmer' | 'theme';
}

const GUIDE_SLIDES: GuideSlide3D[] = [
  {
    id: 1,
    title: 'ជម្រើសទាំង ៣ (3 ENGINE OPTIONS)',
    badge: 'ជម្រើសស្នូល CORE 3',
    category: 'STUDIO ARCHITECTURE',
    icon: <Cpu className="w-6 h-6 text-cyan-400" />,
    accentHex: '#06b6d4',
    gradient: 'from-cyan-500/25 via-blue-600/20 to-slate-950/95',
    glowColor: 'rgba(6,182,212,0.45)',
    summary: 'ស្ថាបត្យកម្មដំណើរការសំឡេង AI ទាំង ៣ បម្រើគ្រប់តម្រូវការ',
    points: [
      'Option 1 [VOXCPM2 COMPUTER]៖ ម៉ាស៊ីនក្លូនសំឡេង AI ក្នុងម៉ាស៊ីនផ្ទាល់ (ត្រូវការ Key License និងកាត VGA RTX) សម្រាប់គុណភាពកម្រិតស្ទូឌីយោភាពយន្ត។',
      'Option 2 [VOXCPM2 CLAUDE]៖ ម៉ាស៊ីនក្លូនសំឡេង Cloud Server AI (ត្រូវការ Key License) ដំណើរការលឿនតាម Server GPU មិនបាច់ប្រើ Hardware ធ្ងន់។',
      'Option 3 [KHMER OFFLINE]៖ ម៉ាស៊ីនសំឡេងខ្មែរឥតគិតថ្លៃ (Free សម្រាប់គណនីទើបបង្កើត) រត់លឿនបំផុត អាចធ្វើបានម្ដងពី ១ ដល់ ២០ ភាគ ឬរឿងពេញ។',
    ],
    tips: '💡 គណនីទើបបង្កើតអាចប្រើ Option 3 បានភ្លាមៗដោយសេរី។ ដើម្បីបើក Option 1 & 2 សូមទិញ Key License ពី Admin!',
    actionText: '🔑 ដំណើរការ Key License',
    actionType: 'license',
  },
  {
    id: 2,
    title: 'KHMER OFFLINE (១ ដល់ ២០ ភាគ)',
    badge: 'ULTRA FAST BATCH',
    category: 'OFFLINE PRODUCTION',
    icon: <Zap className="w-6 h-6 text-emerald-400" />,
    accentHex: '#10b981',
    gradient: 'from-emerald-500/25 via-teal-600/20 to-slate-950/95',
    glowColor: 'rgba(16,185,129,0.45)',
    summary: 'ផលិតវីដេអូបញ្ចូលសំឡេងរឿងភាគក្នុងល្បឿនផ្លេកបន្ទោរតាមកម្លាំង Hardware',
    points: [
      'រើសចំនួនភាគ៖ អាចរើសពី ១ ភាគ ដល់ ២០ ភាគក្នុងពេលតែមួយ (Batch Queue) ស្របតាមកម្លាំង CPU/RAM នៃកុំព្យូទ័ររបស់អ្នក។',
      'ជម្រើសរឿងពេញ (Full Movie)៖ ចុចបើក "ភ្ជាប់ជារឿងពេញ" ប្រព័ន្ធនឹងបញ្ចូលសំឡេងរឿងវែងៗជាប់គ្នាមិនដាច់។',
      'Hardware Multi-Threads៖ បង្កើនល្បឿន Render ជាមួយ Multi-threading 2x, 4x, 8x ឬ 16x Max Speed ជួយសន្សំសំចៃពេលវេលា។',
    ],
    tips: '💡 សម្រាប់កុំព្យូទ័រធម្មតា សូមជ្រើសរើសចន្លោះ 1 ដល់ 5 ភាគម្ដង។ ចំពោះកុំព្យូទ័រខ្លាំង (Core i7/i9) អាចដាក់ 10 ដល់ 20 ភាគបានយ៉ាងរលូន!',
    actionText: '⚡ បើក KHMER OFFLINE (1-20 ភាគ)',
    actionType: 'offline',
  },
  {
    id: 3,
    title: 'កាត់ត CAPCUT & NOSTALGIC VOICE',
    badge: 'PRO TOOLS',
    category: 'VIDEO EDITING',
    icon: <Scissors className="w-6 h-6 text-pink-400" />,
    accentHex: '#ec4899',
    gradient: 'from-pink-500/25 via-rose-600/20 to-slate-950/95',
    glowColor: 'rgba(236,72,153,0.45)',
    summary: 'ឧបករណ៍កាត់តវីដេអូ និងបែបផែនសំឡេងស្រមើលស្រមៃអតីតកាល',
    points: [
      'CapCut Video Trimmer៖ កាត់តវីដេអូវែងៗដោយកំណត់ In-Point [I] និង Out-Point [O] កាត់យកតែឈុតសំខាន់ៗដែលចង់បញ្ចូលសំឡេង។',
      'សំឡេងស្រមើលស្រមៃ (Nostalgic Voice)៖ បែបផែនសំឡេងនឹកគិត Echo + Deep Dream Reverb ល្អបំផុតសម្រាប់ឈុតតួអង្គនឹកស្រមៃអតីតកាល។',
      'Voice Volume Gain HUD៖ បង្កើនបន្ថយសំឡេងនិយាយពី 0% ដល់ 200% និងទម្លាក់សំឡេងភ្លេង BGM ដោយស្វ័យប្រវត្ត (Audio Ducking)។',
    ],
    tips: '💡 អាចចុច Shortcut [I] និង [O] លើ Keyboard ដើម្បី Mark ឈុតកាត់តវីដេអូបានលឿនដូចកម្មវិធីកាត់តអាជីព!',
    actionText: '✂️ បើក CapCut Video Trimmer',
    actionType: 'trimmer',
  },
  {
    id: 4,
    title: '3D EFFECTS & VIDEO STYLING (105+)',
    badge: 'CINEMATIC FX',
    category: 'VISUAL FX & TEXT',
    icon: <Sparkles className="w-6 h-6 text-amber-400" />,
    accentHex: '#f59e0b',
    gradient: 'from-amber-500/25 via-orange-600/20 to-slate-950/95',
    glowColor: 'rgba(245,158,11,0.45)',
    summary: '១០៥+ បែបផែនភាពយន្ត 3D, អក្សររត់ Subtitles, Watermark និងតម្រងសំឡេង',
    points: [
      '3D Titles & Typography៖ អក្សរចំណងជើង 3D Gold, Flame, Neon, Sapphire, Silver ដិតច្បាស់អណ្តែតលើវីដេអូ។',
      'Cinematic LUTs & Filters៖ កែពណ៌ភាពយន្តបែប Cyberpunk, Retro 35mm Grain, VHS Scanlines, Cinema Letterbox។',
      'Subtitles & Watermark៖ កែពុម្ពអក្សរខ្មែរស្រស់ស្អាត (Kantumruy Pro, Moul, Battambang) ជាមួយ Logo Watermark ការពារកម្មសិទ្ធិ។',
    ],
    tips: '💡 ផ្ទាំង 3D Effects មានប៊ូតុងបិទ [X], ប៊ូតុងរួចរាល់ [Done & Exit] និងអាចចុច Escape ដើម្បីចេញវិញបានគ្រប់ពេល!',
    actionText: '✨ ចូលទៅកាន់ Dubbing Studio',
  },
  {
    id: 5,
    title: 'STYLE BACKGROUND & COLOR GLASS',
    badge: 'LUXURY CUSTOM UI',
    category: 'STUDIO THEMES',
    icon: <Palette className="w-6 h-6 text-purple-400" />,
    accentHex: '#a855f7',
    gradient: 'from-purple-500/25 via-violet-600/20 to-slate-950/95',
    glowColor: 'rgba(168,85,247,0.45)',
    summary: 'ប្ដូរពណ៌ផ្ទៃខាងក្រោយពណ៌សស្អាត (Clean White) និង Wallpaper 4K ត្រជាក់ភ្នែក',
    points: [
      'ពណ៌ផ្ទៃខាងក្រោយពណ៌សស្អាត (Clean White Studio)៖ ជ្រើសរើសពណ៌សសុទ្ធ ពណ៌សគុជខ្យង ឬពណ៌ផ្ទាល់ខ្លួន ភ្លឺច្បាស់ ងាយស្រួលយល់ និងអានអក្សរ។',
      'Background Wallpapers 4K៖ ជ្រើសរើសរូបភាពគំរូ 4K (Cyberpunk City, Anime Tokyo Sky, Midnight Purple) ឬ Upload ពីកុំព្យូទ័រផ្ទាល់ខ្លួន។',
      '៧ កញ្ចក់ពណ៌ Color Glass៖ កញ្ចក់រលើបរលោង Glacier Ice, Cyan Crystal, Sakura Purple, Amber Gold និង Floating Stickers។',
    ],
    tips: '💡 ចុចប៊ូតុង "🎨 ពណ៌ & Wallpaper" នៅលើ Header ខាងលើ ឬក្នុង Sidebar ដើម្បីប្ដូរពណ៌សស្អាតសុទ្ធ ឬ Wallpaper ភ្លាមៗ!',
    actionText: '🎨 ប្ដូរពណ៌ & Wallpaper',
    actionType: 'theme',
  },
  {
    id: 6,
    title: 'KEY LICENSE & ទាក់ទង ADMIN',
    badge: 'OFFICIAL SUPPORT',
    category: 'LICENSING & CONTACT',
    icon: <Key className="w-6 h-6 text-sky-400" />,
    accentHex: '#38bdf8',
    gradient: 'from-sky-500/25 via-blue-600/20 to-slate-950/95',
    glowColor: 'rgba(56,189,248,0.45)',
    summary: 'ទំនាក់ទំនង Admin ផ្លូវការដើម្បីទិញ Key License និងដោះស្រាយបច្ចេកទេស',
    points: [
      '៤ កញ្ចប់ Key License គាំទ្រ៖ Trial ៧ ថ្ងៃ, ១ ខែ (30 ថ្ងៃ), ១ ឆ្នាំ (365 ថ្ងៃ), និងជារៀងរហូត (Lifetime VIP)។',
      'Telegram Admin ផ្ទាល់៖ អាចចុចទាក់ទង Admin តាម Telegram: https://t.me/BongCheatz_IT គ្រប់ពេល។',
      'គណនី Admin ផ្លូវការ៖ Master Admin ផ្តាច់មុខគឺ cm5722254@gmail.com គ្រប់គ្រងប្រព័ន្ធសុវត្ថិភាពទាំងមូល។',
    ],
    tips: '💡 រាល់ចម្ងល់ ឬតម្រូវការទិញ Key License សូមចុចប៊ូតុង Telegram ខាងក្រោមដើម្បីឆាតទៅកាន់ Admin ផ្ទាល់!',
    actionText: '✈️ ឆាតទៅកាន់ Telegram Admin',
    actionType: 'telegram',
  },
];

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenLicenseModal,
  onOpenOfflineStudio,
  onOpenTrimmer,
  onOpenCustomizer,
}) => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'3d-coverflow' | '3d-cylinder' | 'flat'>('3d-coverflow');
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Drag state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const autoRotateTimerRef = useRef<any>(null);

  const totalSlides = GUIDE_SLIDES.length;

  const rotateNext = useCallback(() => {
    setActiveSlideIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const rotatePrev = useCallback(() => {
    setActiveSlideIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Auto rotate timer
  useEffect(() => {
    if (isAutoRotating && isOpen) {
      autoRotateTimerRef.current = setInterval(() => {
        rotateNext();
      }, 3500);
    } else {
      if (autoRotateTimerRef.current) clearInterval(autoRotateTimerRef.current);
    }
    return () => {
      if (autoRotateTimerRef.current) clearInterval(autoRotateTimerRef.current);
    };
  }, [isAutoRotating, isOpen, rotateNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') rotateNext();
      if (e.key === 'ArrowLeft') rotatePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, rotateNext, rotatePrev, onClose]);

  // Mouse Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      const deltaX = e.clientX - startXRef.current;
      if (deltaX < -50) {
        rotateNext();
        startXRef.current = e.clientX;
      } else if (deltaX > 50) {
        rotatePrev();
        startXRef.current = e.clientX;
      }
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
      setTilt({ x, y });
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Touch Drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      startXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDraggingRef.current && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - startXRef.current;
      if (deltaX < -45) {
        rotateNext();
        startXRef.current = e.touches[0].clientX;
      } else if (deltaX > 45) {
        rotatePrev();
        startXRef.current = e.touches[0].clientX;
      }
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // Wheel scroll to rotate
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY > 20 || e.deltaX > 20) {
      rotateNext();
    } else if (e.deltaY < -20 || e.deltaX < -20) {
      rotatePrev();
    }
  };

  if (!isOpen) return null;

  const currentSlide = GUIDE_SLIDES[activeSlideIndex];

  const handleActionClick = (slide: GuideSlide3D) => {
    if (slide.actionType === 'license' && onOpenLicenseModal) {
      onClose();
      onOpenLicenseModal();
    } else if (slide.actionType === 'telegram') {
      window.open('https://t.me/BongCheatz_IT', '_blank');
    } else if (slide.actionType === 'offline' && onOpenOfflineStudio) {
      onClose();
      onOpenOfflineStudio();
    } else if (slide.actionType === 'trimmer' && onOpenTrimmer) {
      onClose();
      onOpenTrimmer();
    } else if (slide.actionType === 'theme' && onOpenCustomizer) {
      onClose();
      onOpenCustomizer();
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 select-none font-khmer animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#070b14]/98 border border-cyan-500/30 rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden relative shadow-[0_0_80px_rgba(6,182,212,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top Header Bar ── */}
        <div className="p-4 px-6 border-b border-white/[0.08] flex items-center justify-between bg-[#080e1a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 border border-cyan-400/40">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white tracking-wide flex items-center gap-2">
                  <span>មគ្គុទ្ទេសក៍របៀបប្រើប្រាស់ ANIMESTUDIO</span>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                    3D SLIDES
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Drag បង្វិល 3D ស្លាយ ឬចុចប៊ូតុងខាងក្រោមដើម្បីស្វែងយល់មុខងារទាំងអស់
              </p>
            </div>
          </div>

          {/* Header Controls: Modes, Auto-Rotate, Close */}
          <div className="flex items-center gap-2">
            {/* Auto Rotate Toggle */}
            <button
              type="button"
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isAutoRotating
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.08]'
              }`}
              title="បង្វិល 3D Carousel ដោយស្វ័យប្រវត្តិ"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isAutoRotating ? 'កំពុងបង្វិល 3D' : 'បង្វិល Auto'}
              </span>
            </button>

            {/* View Mode Switcher */}
            <div className="hidden sm:flex items-center bg-black/40 p-0.5 rounded-xl border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setViewMode('3d-coverflow')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === '3d-coverflow'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="3D Coverflow"
              >
                🗂️ 3D Coverflow
              </button>
              <button
                type="button"
                onClick={() => setViewMode('3d-cylinder')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === '3d-cylinder'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="3D ស៊ីឡាំង"
              >
                🌐 3D ស៊ីឡាំង
              </button>
              <button
                type="button"
                onClick={() => setViewMode('flat')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'flat'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="ទម្រង់រាបស្មើ"
              >
                📐 រាបស្មើ
              </button>
            </div>

            {/* Exit Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-red-500/20 hover:text-red-400 border border-white/[0.08] hover:border-red-500/40 text-slate-300 flex items-center justify-center transition-all active:scale-95 shadow-sm"
              title="បិទផ្ទាំង (Escape)"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* ── Slide Navigation Step Pills (#1 to #6) ── */}
        <div className="px-6 py-2.5 bg-black/50 border-b border-white/[0.06] flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2">
            {GUIDE_SLIDES.map((s, idx) => {
              const isActive = idx === activeSlideIndex;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isActive
                      ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full transition-transform ${
                      isActive ? 'scale-125 ring-2 ring-white/60' : ''
                    }`}
                    style={{ backgroundColor: s.accentHex }}
                  />
                  <span>#{idx + 1} {s.title.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono text-cyan-400 font-bold px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/25">
              ស្លាយ {activeSlideIndex + 1} / {totalSlides}
            </span>
          </div>
        </div>

        {/* ── 3D Viewport / Rotating Stage ── */}
        {viewMode !== 'flat' ? (
          <div
            className="flex-1 overflow-hidden relative flex flex-col items-center justify-center p-3 select-none cursor-grab active:cursor-grabbing min-h-[440px]"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            style={{ perspective: '1400px' }}
          >
            {/* Dynamic Background Ambient Light */}
            <div
              className="absolute inset-0 pointer-events-none transition-all duration-700 opacity-30 blur-3xl"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${currentSlide.accentHex}, transparent 65%)`,
              }}
            />

            {/* 3D Floor Orbit Grid */}
            <div
              className="absolute bottom-6 w-[560px] h-[560px] rounded-full border border-cyan-500/15 pointer-events-none transition-transform duration-500 opacity-60"
              style={{
                transform: `rotateX(75deg) rotateZ(${-activeSlideIndex * 60}deg)`,
                background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
              }}
            >
              <div className="absolute inset-8 rounded-full border border-dashed border-white/10" />
            </div>

            {/* ── 3D COVERFLOW & CYLINDER STAGE (NO REVERSED MIRRORED TEXT) ── */}
            <div
              className="w-full max-w-4xl h-[360px] sm:h-[380px] relative flex items-center justify-center"
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateX(${tilt.y * 0.3}deg)`,
              }}
            >
              {GUIDE_SLIDES.map((slide, idx) => {
                // Shortest modular circular distance (-2, -1, 0, 1, 2)
                let diff = ((idx - activeSlideIndex) % totalSlides + totalSlides) % totalSlides;
                if (diff > totalSlides / 2) diff -= totalSlides;

                const isCurrent = diff === 0;
                const isLeft = diff === -1;
                const isRight = diff === 1;

                // HIDE any card that is not the active, left, or right card!
                // This completely eliminates backward mirrored text and overlaps!
                if (Math.abs(diff) > 1) {
                  return null;
                }

                // Smooth coverflow 3D positions
                let translateX = diff * 290;
                let translateZ = isCurrent ? 50 : -80;
                let rotateY = diff > 0 ? -38 : diff < 0 ? 38 : 0;
                let scale = isCurrent ? 1.02 : 0.88;
                let opacity = isCurrent ? 1 : 0.7;
                let zIndex = isCurrent ? 30 : 15;

                return (
                  <div
                    key={slide.id}
                    onClick={() => setActiveSlideIndex(idx)}
                    className={`absolute w-[330px] sm:w-[470px] h-[340px] sm:h-[365px] rounded-3xl p-5 sm:p-6 border flex flex-col justify-between shadow-2xl transition-all duration-500 ${
                      isCurrent
                        ? 'ring-2 ring-white/50 border-white/40 cursor-default'
                        : 'cursor-pointer border-white/10 hover:border-white/30'
                    }`}
                    style={{
                      // 100% OPAQUE background prevents any see-through reversed text!
                      backgroundColor: '#090e1a',
                      transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                      opacity,
                      zIndex,
                      boxShadow: isCurrent ? `0 0 50px ${slide.glowColor}` : 'none',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                  >
                    {/* Card Top Banner */}
                    <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] pb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center border shadow-lg shrink-0"
                          style={{
                            backgroundColor: 'rgba(0,0,0,0.55)',
                            borderColor: slide.accentHex,
                            boxShadow: `0 0 15px ${slide.glowColor}`,
                          }}
                        >
                          {slide.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full border uppercase tracking-wider"
                              style={{
                                color: slide.accentHex,
                                borderColor: slide.accentHex,
                                backgroundColor: 'rgba(0,0,0,0.4)',
                              }}
                            >
                              {slide.badge}
                            </span>
                          </div>
                          <h4 className="text-sm sm:text-base font-black text-white mt-1 leading-snug">
                            {slide.title}
                          </h4>
                        </div>
                      </div>
                    </div>

                    {/* Card Points */}
                    <div className="space-y-2 py-2.5 flex-1 overflow-y-auto custom-scrollbar text-xs">
                      {slide.points.map((pt, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-2 text-slate-300 leading-relaxed">
                          <span
                            className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                            style={{ backgroundColor: slide.accentHex }}
                          />
                          <span className="text-[11px] sm:text-xs">{pt}</span>
                        </div>
                      ))}
                    </div>

                    {/* Card Bottom Action */}
                    <div className="pt-2.5 border-t border-white/[0.08] flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        #{idx + 1} / {totalSlides}
                      </span>

                      {isCurrent ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionClick(slide);
                          }}
                          className="px-4 py-1.5 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                          style={{
                            backgroundColor: slide.accentHex,
                            color: '#070b14',
                            boxShadow: `0 0 15px ${slide.glowColor}`,
                          }}
                        >
                          <span>{slide.actionText || '✓ មើលមុខងារនេះ'}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-cyan-400">
                          ចុចដើម្បីបង្វិលមកមុខ
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Left / Right 3D Stepper Floating Buttons */}
            <button
              onClick={rotatePrev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-black/70 hover:bg-cyan-500/25 border border-white/15 hover:border-cyan-400/50 text-white flex items-center justify-center shadow-2xl transition-all active:scale-95 z-40 backdrop-blur-md"
              title="បង្វិលថយក្រោយ [Arrow Left]"
            >
              <ChevronLeft className="w-6 h-6 text-cyan-400" />
            </button>

            <button
              onClick={rotateNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-black/70 hover:bg-cyan-500/25 border border-white/15 hover:border-cyan-400/50 text-white flex items-center justify-center shadow-2xl transition-all active:scale-95 z-40 backdrop-blur-md"
              title="បង្វិលទៅមុខ [Arrow Right]"
            >
              <ChevronRight className="w-6 h-6 text-cyan-400" />
            </button>
          </div>
        ) : (
          /* ── Flat List View ── */
          <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4 custom-scrollbar">
            <div
              className={`p-4 rounded-2xl bg-gradient-to-r border flex items-start gap-4 ${currentSlide.gradient}`}
              style={{ borderColor: currentSlide.accentHex }}
            >
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 shrink-0">
                {currentSlide.icon}
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/30 border border-white/10 inline-block mb-1">
                  {currentSlide.badge}
                </div>
                <h4 className="text-base font-bold text-white tracking-wide">
                  {currentSlide.title}
                </h4>
                <p className="text-xs text-slate-300 mt-1">{currentSlide.summary}</p>
              </div>
              <button
                onClick={() => handleActionClick(currentSlide)}
                className="px-4 py-2 rounded-xl font-bold text-xs shadow-md shrink-0 self-center"
                style={{ backgroundColor: currentSlide.accentHex, color: '#070b14' }}
              >
                {currentSlide.actionText || 'ដំណើរការ'}
              </button>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 space-y-3">
              <h5 className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>ចំណុចណែនាំលម្អិត:</span>
              </h5>
              <div className="space-y-2.5">
                {currentSlide.points.map((pt, pIdx) => (
                  <div key={pIdx} className="flex items-start gap-2 text-xs text-slate-300">
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: currentSlide.accentHex }}
                    />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
              {currentSlide.tips && (
                <div className="mt-3 p-3 rounded-xl bg-cyan-500/[0.07] border border-cyan-500/20 text-xs text-cyan-200">
                  {currentSlide.tips}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 360° Interactive Angle Scrubber Bar ── */}
        {viewMode !== 'flat' && (
          <div className="px-6 py-2 bg-black/60 border-t border-white/[0.06] flex items-center justify-between gap-4 text-xs text-slate-400 shrink-0">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
              <span className="font-mono text-[11px] text-cyan-300 font-bold">
                {activeSlideIndex * 60}° / 360°
              </span>
            </div>

            {/* Range Scrubber */}
            <input
              type="range"
              min="0"
              max={totalSlides - 1}
              value={activeSlideIndex}
              onChange={(e) => setActiveSlideIndex(Number(e.target.value))}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              title="បង្វិលមុំ 3D Carousel"
            />

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="hidden md:inline">👆 Drag បង្វិល | 🖱️ Scroll Wheel | ◀️ ▶️ Keys</span>
            </div>
          </div>
        )}

        {/* ── Modal Bottom Action Footer ── */}
        <div className="p-3.5 px-6 border-t border-white/[0.08] bg-[#070b14] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Telegram Admin: <a href="https://t.me/BongCheatz_IT" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline font-bold">@BongCheatz_IT</a>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={rotatePrev}
              className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-300 transition-colors flex items-center gap-1 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>មុន</span>
            </button>

            <button
              type="button"
              onClick={rotateNext}
              className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-300 transition-colors flex items-center gap-1 active:scale-95"
            >
              <span>បន្ទាប់</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-slate-300 font-semibold text-xs transition-all active:scale-95 ml-1"
            >
              ✕ បិទ (Esc)
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
            >
              ✓ ចាប់ផ្ដើមប្រើប្រាស់ TOOL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
