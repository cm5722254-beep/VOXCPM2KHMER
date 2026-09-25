import React from 'react';
import {
  PlusCircle, Film, Video, Users, Zap, HardDrive, RefreshCw, Trash2,
  Sparkles, ArrowRight, TrendingUp, Activity, Subtitles, Wand2,
  CheckCircle2, Star, Cpu, FolderOpen,
} from 'lucide-react';
import { ProjectFile, VoxcpmStatus } from '../../types';

interface DashboardProps {
  files?: ProjectFile[];
  totalVoices?: number;
  voxStatus: VoxcpmStatus | null;
  diskStats: { formattedSize: string; count: number } | null;
  onNewProject: () => void;
  onOpenStudio: () => void;
  onSelectProject: (file: ProjectFile) => void;
  onRefresh: () => void;
  onDeleteProject?: (file: ProjectFile) => void;
  onClearAllProjects?: () => void;
}

// ─── Metric Card ─────────────────────────────────────────────────────────────
const MetricCard: React.FC<{
  icon: React.ReactNode;
  value: string;
  label: string;
  sub?: string;
  color: string;
  glow: string;
  delay?: string;
}> = ({ icon, value, label, sub, color, glow, delay = '0ms' }) => (
  <div
    className="relative flex items-center gap-3 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#0f172a]/95 shadow-xs overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-300 animate-fade-up"
    style={{ animationDelay: delay }}
  >
    {/* BG glow corner */}
    <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-10 transition-opacity group-hover:opacity-25"
      style={{ background: `radial-gradient(circle at 100% 0%, ${glow} 0%, transparent 70%)` }} />
    {/* Icon */}
    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 duration-300"
      style={{ background: `${color}15`, border: `1px solid ${color}35` }}>
      <div style={{ color }}>{icon}</div>
    </div>
    {/* Text */}
    <div className="flex-1 min-w-0">
      <div className="text-xl font-black text-slate-900 dark:text-white leading-tight font-mono tracking-tight">{value}</div>
      <div className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{label}</div>
      {sub && <div className="text-[10px] font-bold mt-0.5" style={{ color }}>{sub}</div>}
    </div>
  </div>
);

// ─── Workflow Step Card ───────────────────────────────────────────────────────
const StepCard: React.FC<{
  step: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  color: string;
  borderHover: string;
  shadowHover: string;
  onClick: () => void;
  delay?: string;
}> = ({ step, icon, title, desc, cta, color, borderHover, shadowHover, onClick, delay = '0ms' }) => (
  <div
    onClick={onClick}
    className="relative flex flex-col justify-between gap-3 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-xs cursor-pointer group transition-all duration-300 animate-fade-up overflow-hidden hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-md"
    style={{ animationDelay: delay }}
  >
    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
      style={{ background: `radial-gradient(ellipse at 50% 0%, ${color}08 0%, transparent 70%)` }} />
    <div className="flex items-start justify-between relative z-10">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
        style={{ background: `${color}15`, border: `1px solid ${color}35`, color }}>
        {icon}
      </div>
      <span className="text-[9.5px] font-black font-mono px-2 py-0.5 rounded-full font-sans"
        style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
        {step}
      </span>
    </div>
    <div className="relative z-10">
      <h4 className="text-sm font-bold text-slate-900 dark:text-white transition-colors duration-200">
        {title}
      </h4>
      <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{desc}</p>
    </div>
    <div className="flex items-center text-xs font-bold gap-1 relative z-10" style={{ color }}>
      <span>{cta}</span>
      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
    </div>
  </div>
);

// ─── Project File Card ────────────────────────────────────────────────────────
const FileCard: React.FC<{
  file: ProjectFile;
  index: number;
  onSelect: (f: ProjectFile) => void;
  onDelete?: (f: ProjectFile) => void;
}> = ({ file, index, onSelect, onDelete }) => (
  <div
    onClick={() => onSelect(file)}
    className="group relative rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-xs overflow-hidden cursor-pointer hover:border-sky-400 dark:hover:border-sky-600 hover:shadow-md transition-all duration-300 animate-fade-up"
    style={{ animationDelay: `${index * 40}ms` }}
  >
    {onDelete && (
      <button
        onClick={e => { e.stopPropagation(); onDelete(file); }}
        className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20 bg-white/90 dark:bg-slate-800/90 shadow border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200"
        title="លុបគម្រោង"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )}
    {/* Thumbnail */}
    <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-slate-800">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.08) 0%, transparent 100%)' }} />
      <Film className="w-9 h-9 transition-all group-hover:scale-110 duration-300 text-slate-400 group-hover:text-sky-500" />
      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md font-mono text-[10px] text-slate-700 dark:text-slate-300 bg-white/90 dark:bg-slate-800/90 shadow-2xs border border-slate-200 dark:border-slate-700">
        {(file.size / (1024 * 1024)).toFixed(1)} MB
      </span>
      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
        ✓ READY
      </span>
    </div>
    {/* Info */}
    <div className="p-3 flex flex-col gap-1.5">
      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate" title={file.originalName || file.filename}>
        {file.originalName || file.filename}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
          ចិន → ខ្មែរ
        </span>
        <Activity className="w-3 h-3 text-slate-400 group-hover:text-sky-600 transition-colors" />
      </div>
    </div>
  </div>
);

// ─── Dashboard Main ───────────────────────────────────────────────────────────
export const DashboardView: React.FC<DashboardProps> = ({
  files = [], totalVoices = 0, voxStatus, diskStats,
  onNewProject, onOpenStudio, onSelectProject, onRefresh, onDeleteProject, onClearAllProjects,
}) => {
  const isOnline = voxStatus?.online ?? false;

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] text-slate-800 scrollbar-thin">
      {/* ══ HERO BANNER ══════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-white border-b border-slate-200/90 shadow-2xs">
        {/* Animated BG */}
        <div className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(14,165,233,0.06) 0%, rgba(99,102,241,0.04) 50%, rgba(248,250,252,0.8) 100%)',
          }} />

        <div className="relative z-10 px-5 md:px-8 py-6 md:py-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: brand */}
          <div className="flex items-center gap-4 md:gap-5">
            <div className="relative shrink-0">
              <div className="w-[62px] h-[62px] md:w-[72px] md:h-[72px] rounded-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 55%, #9333ea 100%)',
                  boxShadow: '0 8px 24px rgba(14,165,233,0.25)',
                  border: '1.5px solid rgba(14,165,233,0.3)',
                }}>
                <img src="/logo.png" alt="DABBER PRO" className="w-full h-full object-cover rounded-2xl"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}/>
                <Sparkles className="w-7 h-7 text-white absolute inset-0 m-auto opacity-70" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                style={{ background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  អាទិទេព DABBER PRO
                </h1>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full text-amber-900 bg-amber-100 border border-amber-300">
                  v3 PRO CINEMA
                </span>
              </div>
              <p className="text-[12px] md:text-[13px] text-slate-600 leading-relaxed">
                ស្ទូឌីយោបញ្ជូលសំឡេង AI ភាសាខ្មែរ 48kHz Hi-Fi
                <span className="mx-1.5 text-sky-500 font-bold">·</span>
                VoxCPM2 + ElevenLabs
                <span className="mx-1.5 text-sky-500 font-bold">·</span>
                3D Text Effects
              </p>
            </div>
          </div>

          {/* Right: CTAs */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={onNewProject}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12.5px] font-bold text-white transition-all shadow-md shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #0284c7, #4f46e5)',
              }}
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ បង្កើតគម្រោងថ្មី</span>
            </button>
            <button
              onClick={onOpenStudio}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-semibold text-slate-700 hover:text-slate-900 transition-all group bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
            >
              <Film className="w-4 h-4 text-sky-600" />
              <span>ចូលស្ទូឌីយោ</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 md:px-8 py-6 flex flex-col gap-6">
        {/* ══ METRIC CARDS ════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard icon={<Video className="w-5 h-5"/>} value={`${files.length}`}
            label="វីដេអូបានផ្ទុក" sub="Active Projects"
            color="#0284c7" glow="rgba(2,132,199,0.3)" delay="0ms"/>
          <MetricCard icon={<Users className="w-5 h-5"/>} value={`${totalVoices}`}
            label="AI Voice Characters" sub="Voice Clones"
            color="#7c3aed" glow="rgba(124,58,237,0.3)" delay="60ms"/>
          <MetricCard icon={<Zap className="w-5 h-5"/>}
            value={isOnline ? 'Online' : 'Offline'}
            label="VoxCPM2 GPU Engine"
            sub={isOnline ? '✓ Connected' : '✗ Offline'}
            color={isOnline ? '#059669' : '#d97706'}
            glow={isOnline ? 'rgba(5,150,105,0.3)' : 'rgba(217,119,6,0.3)'} delay="120ms"/>
          <MetricCard icon={<HardDrive className="w-5 h-5"/>}
            value={diskStats?.formattedSize || '0 MB'}
            label="Output Storage"
            sub={diskStats ? `${diskStats.count} files` : '—'}
            color="#ea580c" glow="rgba(234,88,12,0.3)" delay="180ms"/>
        </div>

        {/* ══ WORKFLOW STEPS ══════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-md bg-sky-100 border border-sky-200 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-sky-600" />
            </div>
            <h2 className="text-sm font-bold text-slate-800">ជំហានធ្វើ Dubbing · Quick Workflow</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StepCard step="ជំហាន ១" icon={<Film className="w-5 h-5"/>}
              title="ស្កេនវីដេអូ & Subtitle AI"
              desc="ទាញយកសំឡេងសន្ទនា និងបកប្រែជាភាសាខ្មែរស្វ័យប្រវត្តិ"
              cta="ចូលស្កេន" color="#0284c7"
              borderHover="rgba(2,132,199,0.5)" shadowHover="0 4px 20px rgba(2,132,199,0.12)"
              onClick={onOpenStudio} delay="0ms"/>
            <StepCard step="ជំហាន ២" icon={<Users className="w-5 h-5"/>}
              title="ចាត់ចែងតួអង្គខ្មែរ"
              desc="បែងចែកតួ [M] [F] ស្វ័យប្រវត្តិ — ១ តួ = ១ សំឡេង"
              cta="រៀបចំតួ" color="#7c3aed"
              borderHover="rgba(124,58,237,0.5)" shadowHover="0 4px 20px rgba(124,58,237,0.12)"
              onClick={onOpenStudio} delay="80ms"/>
            <StepCard step="ជំហាន ៣" icon={<Wand2 className="w-5 h-5"/>}
              title="បញ្ចូលសំឡេង & នាំចេញ"
              desc="48kHz Hi-Fi Dubbing ស្វ័យប្រវត្តិ ▶ Export MP4 ឬ SRT"
              cta="Dubbing Now" color="#d97706"
              borderHover="rgba(217,119,6,0.5)" shadowHover="0 4px 20px rgba(217,119,6,0.12)"
              onClick={onOpenStudio} delay="160ms"/>
          </div>
        </div>

        {/* ══ RECENT PROJECTS ══════════════════════════════════════════════════ */}
        <div>
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-sky-100 border border-sky-200 flex items-center justify-center">
                <Film className="w-3 h-3 text-sky-600" />
              </div>
              <h2 className="text-sm font-bold text-slate-800">គម្រោងកាត់ថ្មីៗ</h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono bg-sky-50 text-sky-700 border border-sky-200">
                {files.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {files.length > 0 && onClearAllProjects && (
                <button
                  onClick={onClearAllProjects}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
              <button
                onClick={onRefresh}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Grid or empty state */}
          {files.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
              {files.map((file, i) => (
                <FileCard key={file.filename} file={file} index={i}
                  onSelect={onSelectProject} onDelete={onDeleteProject} />
              ))}
            </div>
          ) : (
            <div
              className="rounded-2xl p-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 bg-white shadow-2xs animate-fade-up"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-sky-50 border border-sky-200">
                <FolderOpen className="w-8 h-8 text-sky-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">មិនទាន់មានគម្រោង Dubbing</h3>
              <p className="text-[12px] text-slate-500 max-w-xs mb-5 leading-relaxed">
                ចាប់ផ្តើមបញ្ចូលវីដេអូ ឬ Donghua ដើម្បីឱ្យ AI វិភាគ បកប្រែ
                និងបញ្ជូលសំឡេងខ្មែរស្វ័យប្រវត្តិ
              </p>
              <button
                onClick={onNewProject}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12.5px] font-bold text-white transition-all shadow-md shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #4f46e5)',
                }}
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ បញ្ចូលវីដេអូដំបូង</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
