// PosterForge AI — Professional Theatrical AI Poster Generation Studio
import React, { useState, useEffect } from 'react';
import {
  PosterProject,
  PosterVariation,
  PosterTypeId,
  PosterStyleId,
  PosterCompositionId,
  PosterLightingId,
  PosterColorGradeId,
  PosterMoodId,
  PosterAspectRatio,
  PosterResolution,
  Typography3DEffect,
  AIProviderSettings,
} from './PosterForgeTypes';
import {
  POSTER_TYPES,
  VISUAL_STYLES,
  COMPOSITIONS,
  LIGHTING_PRESETS,
  COLOR_GRADES,
  MOODS,
  ASPECT_RATIOS,
  TYPOGRAPHY_EFFECTS,
  POSTER_TEMPLATES,
  DEFAULT_OVERLAYS,
} from './PosterForgeConstants';
import { buildCinematicPosterPrompt } from './PosterForgePromptBuilder';
import { generatePosterVariations, DEFAULT_AI_SETTINGS } from './PosterForgeAIService';
import { PosterPreviewCanvas } from './PosterPreviewCanvas';
import { PosterForgeAdminModal } from './PosterForgeAdminModal';
import './posterforge.css';
import {
  Sparkles,
  Wand2,
  Download,
  Settings,
  Image as ImageIcon,
  Type,
  Layers,
  Palette,
  Sun,
  Layout,
  Bookmark,
  Share2,
  RefreshCw,
  Sliders,
  Check,
  Plus,
  Trash2,
  Copy,
  FolderOpen,
  Scissors,
  Shield,
  Zap,
  Globe,
  Upload,
} from 'lucide-react';

interface PosterForgeStudioProps {
  onShowToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  isAdmin?: boolean;
}

// Start with an honest blank canvas; sample art is available from Templates.
const INITIAL_PROJECT: PosterProject = {
  id: 'prj_new_poster',
  title: 'ពិភពថាមពលវេទមន្ត 3D',
  type: 'xianxia',
  style: 'xianxia_heaven',
  userPrompt: '',
  finalExpandedPrompt: '',
  negativePrompt: '',
  composition: 'char_center',
  lighting: ['golden_light', 'heavenly_light', 'god_ray'],
  colorGrade: 'gold',
  mood: 'luxury',
  aspectRatio: '2:3',
  resolution: '1024',
  activeImageUrl: '',
  variations: [],
  activeVariationIndex: 0,
  typography: {
    mainTitle: 'ពិភពថាមពលវេទមន្ត',
    subtitle: 'MAGIC ENERGY WORLD',
    tagline: 'រឿងភាគគំនូរជីវចលចិន 3D ដ៏អស្ចារ្យបំផុតប្រចាំឆ្នាំ',
    badgeText: '3D',
    effect: 'gold_3d',
    fontFamily: 'Koulen',
    fontSize: 52,
    subtitleFontSize: 13,
    letterSpacing: 1,
    lineHeight: 1.1,
    textAlign: 'center',
    rotation: 0,
    positionMode: 'bottom',
    posX: 50,
    posY: 80,
    showOrnateCrest: true,
    crestType: 'sword_wings',
    showBadge: true,
    glowIntensity: 85,
    depth3D: 8,
  },
  references: {
    characterImage: null,
    costumeImage: null,
    backgroundImage: null,
    poseImage: null,
    logoImage: null,
    faceSimilarity: 85,
    characterSimilarity: 90,
    styleStrength: 80,
    backgroundInfluence: 75,
    poseInfluence: 70,
    colorInfluence: 85,
  },
  branding: {
    logoUrl: null,
    watermarkText: 'POSTERFORGE AI • KHMER DUBBING PRO',
    watermarkPosition: 'bottom_right',
    watermarkOpacity: 65,
    facebookHandle: 'KhmerDubbingPro',
    telegramHandle: 'khmer_dubbing',
    tiktokHandle: '@khmerdubbingpro',
  },
  overlays: DEFAULT_OVERLAYS,
  isUpscaled4k: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

INITIAL_PROJECT.typography.mainTitle = '';
INITIAL_PROJECT.typography.subtitle = '';
INITIAL_PROJECT.typography.tagline = '';
INITIAL_PROJECT.typography.badgeText = '';

export const PosterForgeStudio: React.FC<PosterForgeStudioProps> = ({ onShowToast, isAdmin = true }) => {
  const [project, setProject] = useState<PosterProject>(() => {
    const saved = localStorage.getItem('POSTERFORGE_ACTIVE_PROJECT');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as PosterProject;
        if (parsed.id === 'prj_flagship_xianxia' || parsed.activeImageUrl === '/samples/posterforge_xianxia_flagship.jpg') return INITIAL_PROJECT;
        if (parsed.typography?.subtitle === 'MAGIC ENERGY WORLD') parsed.typography.subtitle = '';
        if (parsed.typography?.badgeText === '3D') parsed.typography.badgeText = '';
        return parsed;
      } catch {}
    }
    return INITIAL_PROJECT;
  });

  const [activeTab, setActiveTab] = useState<'type' | 'prompt' | 'style' | 'typo' | 'smart' | 'branding' | 'library'>('type');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [aiSettings, setAiSettings] = useState<AIProviderSettings>(DEFAULT_AI_SETTINGS);
  const [savedProjects, setSavedProjects] = useState<PosterProject[]>(() => {
    const list = localStorage.getItem('POSTERFORGE_SAVED_PROJECTS');
    if (list) {
      try {
        return JSON.parse(list);
      } catch {}
    }
    return [];
  });

  // Re-synthesize expanded prompt whenever inputs change
  useEffect(() => {
    const { positivePrompt, negativePrompt } = buildCinematicPosterPrompt({
      userPrompt: project.userPrompt,
      posterType: project.type,
      style: project.style,
      customStylePrompt: project.customStylePrompt,
      composition: project.composition,
      lighting: project.lighting,
      colorGrade: project.colorGrade,
      mood: project.mood,
      aspectRatio: project.aspectRatio,
      hasReferenceCharacter: Boolean(project.references.characterImage),
    });

    setProject((prev) => ({
      ...prev,
      finalExpandedPrompt: positivePrompt,
      negativePrompt,
    }));
  }, [
    project.userPrompt,
    project.type,
    project.style,
    project.customStylePrompt,
    project.composition,
    project.lighting,
    project.colorGrade,
    project.mood,
    project.aspectRatio,
  ]);

  // Persist project changes locally
  useEffect(() => {
    try {
      localStorage.setItem('POSTERFORGE_ACTIVE_PROJECT', JSON.stringify(project));
    } catch {
      onShowToast('This image is too large to keep in browser storage. It remains available for this session; use Save As to export your poster.', 'warning');
    }
  }, [project, onShowToast]);

  // Action: Generate 4 រូបជម្រើស
  const handleGenerateVariations = async () => {
    if (!project.userPrompt.trim()) {
      onShowToast('Describe the poster image first, then generate it.', 'warning');
      setActiveTab('prompt');
      return;
    }
    setIsGenerating(true);
    onShowToast(`AI កំពុងបង្កើតរូបជម្រើស ${aiSettings.generationCount} សន្លឹក...`, 'info');

    try {
      const vars = await generatePosterVariations(project, aiSettings);
      setProject((prev) => ({
        ...prev,
        variations: vars,
        activeVariationIndex: 0,
        activeImageUrl: vars[0]?.imageUrl || prev.activeImageUrl,
        updatedAt: new Date().toISOString(),
      }));
      onShowToast(`បានបង្កើតរូបជម្រើស ${vars.length} សន្លឹក ដោយជោគជ័យ។`, 'success');
    } catch (err: any) {
      console.error('Generation error:', err);
      onShowToast(`កំហុសក្នុងការបង្កើត: ${err?.message || 'Error'}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Action: Select Variation
  const handleSelectVariation = (index: number) => {
    const selected = project.variations[index];
    if (selected) {
      setProject((prev) => ({
        ...prev,
        activeVariationIndex: index,
        activeImageUrl: selected.imageUrl,
        composition: selected.composition || prev.composition,
      }));
      onShowToast(`បានជ្រើសរើស Variation ${index + 1}`, 'info');
    }
  };

  // Action: Apply Pre-made Template
  const handleApplyTemplate = (tpl: any) => {
    setProject((prev) => ({
      ...prev,
      title: tpl.nameKhmer,
      type: tpl.posterType,
      style: tpl.style,
      userPrompt: tpl.promptSnippet,
      composition: tpl.composition,
      lighting: tpl.lighting,
      colorGrade: tpl.colorGrade,
      mood: tpl.mood,
      aspectRatio: tpl.aspectRatio,
      activeImageUrl: tpl.imageUrl,
      typography: {
        ...prev.typography,
        ...tpl.typography,
      },
      updatedAt: new Date().toISOString(),
    }));
    onShowToast(`🎉 បានអនុវត្ត Template "${tpl.nameKhmer}"`, 'success');
  };

  // Action: Save to Library
  const handleSaveToLibrary = () => {
    const updated = [project, ...savedProjects.filter((p) => p.id !== project.id)];
    setSavedProjects(updated);
    localStorage.setItem('POSTERFORGE_SAVED_PROJECTS', JSON.stringify(updated));
    onShowToast('💾 បានរក្សាទុក Poster ចូលក្នុងបណ្ណាល័យ "My Posters" រួចរាល់!', 'success');
  };

  return (
    <div className="posterforge-studio flex flex-col h-full w-full bg-white dark:bg-[#0a0c13] text-slate-800 dark:text-slate-100 overflow-hidden font-khmer select-none">
      {/* ── TOP HEADER ── */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-[#0f111a] border-b border-slate-200 dark:border-slate-200 dark:border-white/[0.08] shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Sparkles className="w-4 h-4 text-slate-800 dark:text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wide text-slate-800 dark:text-white font-sans">POSTERFORGE AI</h1>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-rose-500 text-slate-800 dark:text-white shadow-sm">
                KHMER STUDIO
              </span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-zinc-400">បង្កើត Poster ភាពយន្ត 3D, Donghua & Xianxia ជាមួយ 3D Khmer Typography</p>
          </div>
        </div>

        {/* Center Aspect Ratio Switcher */}
        <div className="hidden lg:flex items-center gap-1 bg-white dark:bg-[#141724] p-1 rounded-2xl border border-white/5">
          {ASPECT_RATIOS.slice(0, 5).map((asp) => (
            <button
              key={asp.id}
              onClick={() => setProject({ ...project, aspectRatio: asp.id })}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                project.aspectRatio === asp.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:text-white hover:bg-white/5'
              }`}
            >
              {asp.id}
            </button>
          ))}
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="p-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:text-white bg-white/5 hover:bg-white/10 transition-colors"
            title="ការកំណត់ AI Provider & Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={handleSaveToLibrary}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
          >
            <Bookmark className="w-3.5 h-3.5 text-sky-600 dark:text-amber-400" />
            <span>រក្សាទុក</span>
          </button>

          <button
            onClick={handleGenerateVariations}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:brightness-110 active:scale-95 shadow-lg shadow-indigo-500/25 transition-all border border-white/20"
          >
            <Wand2 className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? "កំពុងបង្កើតរូប..." : "⚡ បង្កើតរូបជម្រើស " + aiSettings.generationCount}</span>
          </button>
        </div>
      </header>

      {/* ── MAIN STUDIO BODY (Left Controls + Right Preview) ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* LEFT CONTROL PANE */}
        <div className="w-full md:w-[420px] lg:w-[460px] flex flex-col border-r border-slate-200 dark:border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0c0e16] shrink-0 overflow-hidden">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 p-2 bg-white dark:bg-[#10131e] border-b border-white/[0.06] overflow-x-auto no-scrollbar shrink-0">
            {[
              { id: 'type', label: 'ប្រភេទ Poster', icon: <Layout className="w-3.5 h-3.5" /> },
              { id: 'prompt', label: 'Prompt & AI', icon: <Wand2 className="w-3.5 h-3.5" /> },
              { id: 'style', label: 'ស្ទីល & ភ្លើង', icon: <Palette className="w-3.5 h-3.5" /> },
              { id: 'typo', label: 'អក្សរ 3D', icon: <Type className="w-3.5 h-3.5" /> },
              { id: 'smart', label: 'Overlays', icon: <Layers className="w-3.5 h-3.5" /> },
              { id: 'branding', label: 'Logo & ស្លាក', icon: <Shield className="w-3.5 h-3.5" /> },
              { id: 'library', label: 'បណ្ណាល័យ', icon: <Bookmark className="w-3.5 h-3.5" /> },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  activeTab === t.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:text-white hover:bg-white/5'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* ── TAB 1: POSTER TYPE & TITLE ── */}
            {activeTab === 'type' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">ចំណងជើងរឿង (Main Title — Khmer / EN)</label>
                  <input
                    type="text"
                    value={project.typography.mainTitle}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        title: e.target.value,
                        typography: { ...project.typography, mainTitle: e.target.value },
                      })
                    }
                    placeholder="បញ្ចូលចំណងជើងរឿងជាភាសាខ្មែរ ឬអង់គ្លេស"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#141724] border border-white/10 text-sm text-slate-800 dark:text-white font-bold outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400">Subtitle (អង់គ្លេស)</label>
                    <input
                      type="text"
                      value={project.typography.subtitle}
                      onChange={(e) =>
                        setProject({
                          ...project,
                          typography: { ...project.typography, subtitle: e.target.value },
                        })
                      }
                      placeholder="បញ្ចូលចំណងជើងរង (ជាជម្រើស)"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#141724] border border-white/10 text-xs text-slate-800 dark:text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400">Badge (ភាគ / 3D / VIP)</label>
                    <input
                      type="text"
                      value={project.typography.badgeText}
                      onChange={(e) =>
                        setProject({
                          ...project,
                          typography: { ...project.typography, badgeText: e.target.value },
                        })
                      }
                      placeholder="3D ឬ ភាគ ១"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#141724] border border-white/10 text-xs text-slate-800 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400">ពាក្យស្លោក / Tagline</label>
                  <input
                    type="text"
                    value={project.typography.tagline}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        typography: { ...project.typography, tagline: e.target.value },
                      })
                    }
                    placeholder="បញ្ចូលពាក្យស្លោក (ជាជម្រើស)"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#141724] border border-white/10 text-xs text-slate-800 dark:text-white outline-none"
                  />
                </div>

                {/* 25 Poster Types Selector */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">ជ្រើសរើសប្រភេទ Poster (25 Types)</label>
                  <div className="grid grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1">
                    {POSTER_TYPES.map((pt) => {
                      const isSelected = project.type === pt.id;
                      return (
                        <div
                          key={pt.id}
                          onClick={() => setProject({ ...project, type: pt.id, aspectRatio: pt.defaultAspectRatio })}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-400 text-slate-800 dark:text-white shadow-md ring-1 ring-emerald-400/40'
                              : 'bg-white dark:bg-[#141724] border-white/5 text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:text-white hover:border-white/15'
                          }`}
                        >
                          <span className="text-base">{pt.icon}</span>
                          <div className="overflow-hidden">
                            <h4 className="text-xs font-bold truncate leading-tight">{pt.labelKhmer}</h4>
                            <span className="text-[9px] text-zinc-500">{pt.defaultAspectRatio}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: PROMPT & REFERENCE SYSTEM ── */}
            {activeTab === 'prompt' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>បរិយាយរូបភាព (User Prompt)</span>
                    <button
                      onClick={() => {
                        setProject((prev) => ({
                          ...prev,
                          userPrompt:
                            'Immortal cultivator in flowing white and gold ancient silk robes, standing above floating celestial mountains, massive golden glowing celestial dragon formed from clouds in the sky behind, heavenly floating Taoist temples, spiritual aura, volumetric god rays',
                        }));
                        onShowToast('បានបំពេញ Prompt គំរូកម្រិតភាពយន្ត!', 'info');
                      }}
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      ប្រើ Prompt គំរូ
                    </button>
                  </label>
                  <textarea
                    rows={4}
                    value={project.userPrompt}
                    onChange={(e) => setProject({ ...project, userPrompt: e.target.value })}
                    placeholder="ពណ៌នាតួអង្គ សម្លៀកបំពាក់ ឥរិយាបថ ទេសភាពខាងក្រោយ..."
                    className="w-full p-3 rounded-xl bg-white dark:bg-[#141724] border border-white/10 text-xs text-slate-800 dark:text-white outline-none focus:border-emerald-400 resize-none leading-relaxed"
                  />
                </div>

                {/* Reference Images Upload System */}
                <div className="space-y-3 p-3.5 rounded-2xl bg-white dark:bg-[#141724] border border-white/5">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-sky-600 dark:text-amber-400" />
                    <span>រូបភាព Poster</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                    បញ្ចូលរូបសម្រេចជាផ្ទៃក្រោយ Poster។ ការបង្កើតរូប AI ពីរូបយោងមិនទាន់ភ្ជាប់ទេ។
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-cyan-400/30 bg-cyan-950/20 hover:bg-cyan-950/40 cursor-pointer transition-colors text-center">
                      <Upload className="w-4 h-4 text-cyan-300" />
                      <span className="text-[11px] font-bold text-cyan-100">Upload real poster artwork</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 10 * 1024 * 1024) {
                            onShowToast('Choose an image smaller than 10 MB.', 'warning');
                            e.currentTarget.value = '';
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setProject((prev) => ({ ...prev, activeImageUrl: reader.result as string, variations: [], updatedAt: new Date().toISOString() }));
                              onShowToast(`Artwork uploaded: ${file.name}`, 'success');
                            }
                          };
                          reader.onerror = () => onShowToast('Could not read that image file.', 'error');
                          reader.readAsDataURL(file);
                          e.currentTarget.value = '';
                        }}
                      />
                    </label>
                    <label className="hidden flex-col items-center justify-center p-3 rounded-xl border border-dashed border-white/15 bg-black/20 hover:bg-white/5 cursor-pointer transition-colors text-center">
                      <ImageIcon className="w-5 h-5 text-slate-600 dark:text-zinc-400 mb-1" />
                      <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">តួអង្គ (Character)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setProject((prev) => ({
                              ...prev,
                              references: { ...prev.references, characterImage: url },
                            }));
                            onShowToast(`បានបញ្ចូលរូបភាពយោង: ${file.name}`, 'success');
                          }
                        }}
                      />
                    </label>

                    <label className="hidden flex-col items-center justify-center p-3 rounded-xl border border-dashed border-white/15 bg-black/20 hover:bg-white/5 cursor-pointer transition-colors text-center">
                      <Palette className="w-5 h-5 text-slate-600 dark:text-zinc-400 mb-1" />
                      <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">ទេសភាព (Background)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setProject((prev) => ({
                              ...prev,
                              references: { ...prev.references, backgroundImage: url },
                            }));
                            onShowToast(`បានបញ្ចូលទេសភាពយោង: ${file.name}`, 'success');
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Similarity Sliders */}
                  <div className="hidden space-y-2 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-zinc-400">ភាពស្រដៀងនៃផ្ទៃមុខ (Face Similarity)</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{project.references.faceSimilarity}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={project.references.faceSimilarity}
                      onChange={(e) =>
                        setProject({
                          ...project,
                          references: { ...project.references, faceSimilarity: Number(e.target.value) },
                        })
                      }
                      className="w-full accent-emerald-500 h-1.5 bg-black/40 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* AI Synthesized Prompt Preview */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400">
                    Prompt សម្រាប់ AI (មើលជាមុន)
                  </label>
                  <p className="text-[10px] text-slate-600 dark:text-zinc-400 bg-black/30 p-2.5 rounded-xl border border-white/5 leading-relaxed font-mono line-clamp-4">
                    {project.finalExpandedPrompt}
                  </p>
                </div>
              </div>
            )}

            {/* ── TAB 3: VISUAL STYLES, COMPOSITION & LIGHTING ── */}
            {activeTab === 'style' && (
              <div className="space-y-4">
                {/* 30+ Visual Style Cards */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">30+ Visual Style Presets</label>
                  <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {VISUAL_STYLES.map((st) => {
                      const isSelected = project.style === st.id;
                      return (
                        <div
                          key={st.id}
                          onClick={() => setProject({ ...project, style: st.id })}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border-indigo-400 text-slate-800 dark:text-white shadow-md ring-1 ring-indigo-400/40'
                              : 'bg-white dark:bg-[#141724] border-white/5 text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:text-white hover:border-white/15'
                          }`}
                        >
                          <div className={`w-full h-8 rounded-lg bg-gradient-to-r ${st.gradient} mb-1.5`} />
                          <h4 className="text-[11px] font-bold truncate">{st.labelKhmer}</h4>
                          <span className="text-[9px] text-zinc-500">{st.labelEn}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 14 Compositions */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">ការរៀបចំរូបភាព (14 Compositions)</label>
                  <select
                    value={project.composition}
                    onChange={(e) => setProject({ ...project, composition: e.target.value as PosterCompositionId })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#141724] border border-white/10 text-xs text-slate-800 dark:text-white outline-none"
                  >
                    {COMPOSITIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.labelKhmer} ({c.labelEn})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 15 Lighting Layers */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">ប្រព័ន្ធពន្លឺភាពយន្ត (15 Lighting Presets)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {LIGHTING_PRESETS.map((lp) => {
                      const isSelected = project.lighting.includes(lp.id);
                      return (
                        <button
                          key={lp.id}
                          onClick={() => {
                            const updated = isSelected
                              ? project.lighting.filter((l) => l !== lp.id)
                              : [...project.lighting, lp.id];
                            setProject({ ...project, lighting: updated });
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                            isSelected
                              ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 shadow-sm'
                              : 'bg-white dark:bg-[#141724] text-slate-600 dark:text-zinc-400 border-white/5 hover:border-white/15'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ background: lp.colorHex }} />
                          <span>{lp.labelKhmer}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Grading & Mood */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400">Color Grading</label>
                    <select
                      value={project.colorGrade}
                      onChange={(e) => setProject({ ...project, colorGrade: e.target.value as PosterColorGradeId })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#141724] border border-white/10 text-xs text-slate-800 dark:text-white outline-none"
                    >
                      {COLOR_GRADES.map((cg) => (
                        <option key={cg.id} value={cg.id}>
                          {cg.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400">អារម្មណ៍ & បរិយាកាស (Mood)</label>
                    <select
                      value={project.mood}
                      onChange={(e) => setProject({ ...project, mood: e.target.value as PosterMoodId })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#141724] border border-white/10 text-xs text-slate-800 dark:text-white outline-none"
                    >
                      {MOODS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 4: 3D TYPOGRAPHY SYSTEM ── */}
            {activeTab === 'typo' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">រចនាបថ 3D Effect Shaders (13 Effects)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TYPOGRAPHY_EFFECTS.map((eff) => {
                      const isSelected = project.typography.effect === eff.id;
                      return (
                        <div
                          key={eff.id}
                          onClick={() =>
                            setProject({
                              ...project,
                              typography: { ...project.typography, effect: eff.id },
                            })
                          }
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400 text-slate-800 dark:text-white shadow-md'
                              : 'bg-white dark:bg-[#141724] border-white/5 text-slate-600 dark:text-zinc-400 hover:border-white/15'
                          }`}
                        >
                          <span className="text-xs font-bold truncate">{eff.labelKhmer}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-sky-600 dark:text-amber-400" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Font Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">ពុម្ពអក្សរ (Font Family)</label>
                  <select
                    value={project.typography.fontFamily}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        typography: { ...project.typography, fontFamily: e.target.value as any },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#141724] border border-white/10 text-xs text-slate-800 dark:text-white outline-none"
                  >
                    <option value="Koulen">Koulen (អក្សរភាពយន្តដិតមហិមា)</option>
                    <option value="Moul">Moul (អក្សរឆ្លាក់បុរាណរាជវង្ស)</option>
                    <option value="Bayon">Bayon (អក្សរអភិជនប្រណីត)</option>
                    <option value="Kantumruy Pro">Kantumruy Pro (ទំនើបទាន់សម័យ)</option>
                    <option value="Cinzel">Cinzel (Hollywood Movie Master)</option>
                  </select>
                </div>

                {/* Size & 3D Extrusion Sliders */}
                <div className="space-y-3 p-3.5 rounded-2xl bg-white dark:bg-[#141724] border border-white/5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-zinc-400">ទំហំអក្សរ (Font Size)</span>
                      <span className="text-slate-800 dark:text-white font-bold">{project.typography.fontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min={24}
                      max={90}
                      value={project.typography.fontSize}
                      onChange={(e) =>
                        setProject({
                          ...project,
                          typography: { ...project.typography, fontSize: Number(e.target.value) },
                        })
                      }
                      className="w-full accent-amber-500 h-1.5 bg-black/40 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-zinc-400">កម្រាស់ឆ្លាក់ 3D Depth</span>
                      <span className="text-sky-600 dark:text-amber-400 font-bold">{project.typography.depth3D}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={project.typography.depth3D}
                      onChange={(e) =>
                        setProject({
                          ...project,
                          typography: { ...project.typography, depth3D: Number(e.target.value) },
                        })
                      }
                      className="w-full accent-amber-500 h-1.5 bg-black/40 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Ornate Wings / Crest Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white">ស្លាបក្បាច់មាស & Aura (Ornate Crest)</h4>
                      <p className="text-[10px] text-slate-600 dark:text-zinc-400">ដូចរូបភាពគំរូ ពិភពថាមពលវេទមន្ត 3D</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={project.typography.showOrnateCrest}
                      onChange={(e) =>
                        setProject({
                          ...project,
                          typography: { ...project.typography, showOrnateCrest: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 5: SMART OVERLAYS ── */}
            {activeTab === 'smart' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  បែបផែនបន្ថែម & Smart Stickers (10 Overlays)
                </label>
                <div className="space-y-2">
                  {project.overlays.map((ov) => (
                    <div
                      key={ov.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#141724] border border-white/5"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={ov.visible}
                          onChange={(e) => {
                            const updated = project.overlays.map((o) =>
                              o.id === ov.id ? { ...o, visible: e.target.checked } : o
                            );
                            setProject({ ...project, overlays: updated });
                          }}
                          className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-800 dark:text-white">{ov.name}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 uppercase">{ov.blendMode}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB 6: BRANDING & WATERMARK ── */}
            {activeTab === 'branding' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Watermark Text</label>
                  <input
                    type="text"
                    value={project.branding.watermarkText}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        branding: { ...project.branding, watermarkText: e.target.value },
                      })
                    }
                    placeholder="POSTERFORGE AI • KHMER DUBBING PRO"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#141724] border border-white/10 text-xs text-slate-800 dark:text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400">ទីតាំង Watermark</label>
                    <select
                      value={project.branding.watermarkPosition}
                      onChange={(e) =>
                        setProject({
                          ...project,
                          branding: { ...project.branding, watermarkPosition: e.target.value as any },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#141724] border border-white/10 text-xs text-slate-800 dark:text-white outline-none"
                    >
                      <option value="bottom_right">Bottom Right (ស្តាំក្រោម)</option>
                      <option value="bottom_left">Bottom Left (ឆ្វេងក្រោម)</option>
                      <option value="top_right">Top Right (ស្តាំលើ)</option>
                      <option value="top_left">Top Left (ឆ្វេងលើ)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-zinc-400">Opacity</span>
                      <span className="text-slate-800 dark:text-white font-bold">{project.branding.watermarkOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={project.branding.watermarkOpacity}
                      onChange={(e) =>
                        setProject({
                          ...project,
                          branding: { ...project.branding, watermarkOpacity: Number(e.target.value) },
                        })
                      }
                      className="w-full accent-emerald-500 h-1.5 bg-black/40 rounded-lg cursor-pointer mt-2"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Social Handles</label>
                  <input
                    type="text"
                    value={project.branding.facebookHandle || ''}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        branding: { ...project.branding, facebookHandle: e.target.value },
                      })
                    }
                    placeholder="Facebook Page URL / Name"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#141724] border border-white/10 text-xs text-slate-800 dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    value={project.branding.tiktokHandle || ''}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        branding: { ...project.branding, tiktokHandle: e.target.value },
                      })
                    }
                    placeholder="TikTok @Handle"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#141724] border border-white/10 text-xs text-slate-800 dark:text-white outline-none"
                  />
                </div>
              </div>
            )}

            {/* ── TAB 7: TEMPLATES & PROJECT LIBRARY ── */}
            {activeTab === 'library' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Ready-made Poster Templates</label>
                  <div className="space-y-2">
                    {POSTER_TEMPLATES.map((tpl) => (
                      <div
                        key={tpl.id}
                        onClick={() => handleApplyTemplate(tpl)}
                        className="p-3 rounded-2xl bg-white dark:bg-[#141724] border border-white/5 hover:border-emerald-400/40 cursor-pointer transition-all flex items-center gap-3 group"
                      >
                        <img
                          src={tpl.imageUrl}
                          alt={tpl.nameKhmer}
                          className="w-14 h-18 object-cover rounded-xl border border-white/10"
                        />
                        <div className="flex-1 overflow-hidden">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-300 transition-colors truncate">
                            {tpl.nameKhmer}
                          </h4>
                          <span className="text-[10px] text-sky-600 dark:text-amber-400 block">{tpl.nameEn}</span>
                          <p className="text-[10px] text-slate-600 dark:text-zinc-400 truncate mt-0.5">{tpl.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PREVIEW & VARIATIONS GALLERY */}
        <div className="posterforge-preview-area flex-1 flex flex-col overflow-hidden relative">
          {/* Main Canvas Component */}
          <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            <PosterPreviewCanvas
              project={project}
              onUpdateTypography={(updated) =>
                setProject((prev) => ({
                  ...prev,
                  typography: { ...prev.typography, ...updated },
                }))
              }
              onUpdateOverlays={(ovs) => setProject((prev) => ({ ...prev, overlays: ovs }))}
              isGenerating={isGenerating}
              onShowToast={onShowToast}
            />
          </div>

          {/* 4 រូបជម្រើស Strip at the Bottom */}
          {project.variations.length > 0 && (
            <div className="h-32 bg-white dark:bg-[#0e1019] border-t border-slate-200 dark:border-slate-200 dark:border-white/[0.08] px-4 py-2 shrink-0 flex items-center gap-3 overflow-x-auto">
              <div className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 shrink-0 uppercase tracking-wider">
                រូបជម្រើស ({project.variations.length})
              </div>
              {project.variations.map((v, idx) => {
                const isActive = project.activeVariationIndex === idx;
                return (
                  <div
                    key={v.id}
                    onClick={() => handleSelectVariation(idx)}
                    className={`relative h-24 w-18 rounded-xl overflow-hidden cursor-pointer border-2 transition-all shrink-0 ${
                      isActive
                        ? 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] scale-105'
                        : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={v.imageUrl} alt={`Variation ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/80 text-slate-800 dark:text-white">
                      #{idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Admin Settings Modal */}
      <PosterForgeAdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        settings={aiSettings}
        onSaveSettings={setAiSettings}
        onShowToast={onShowToast}
      />
    </div>
  );
};
