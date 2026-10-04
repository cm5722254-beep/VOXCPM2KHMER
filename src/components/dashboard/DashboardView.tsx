import React from 'react';
import {
  PlusCircle, Film, Video, Users, Zap, HardDrive, RefreshCw, Trash2,
  Sparkles, ArrowRight, TrendingUp, Activity, Subtitles, Wand2,
  CheckCircle2, Star, Cpu, FolderOpen, Play, Clock, Database,
  Layers, Mic2, Volume2, Flame, Crown, BarChart3,
} from 'lucide-react';
import { ProjectFile, VoxcpmStatus } from '../../types';
import { tw } from '../../hooks/useDesignTokens';

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

// ─── Modern Metric Card with Glassmorphism ───────────────────────────────────
const MetricCard: React.FC<{
  icon: React.ReactNode;
  value: string;
  label: string;
  sub?: string;
  trend?: string;
  color: string;
  glow: string;
  delay?: string;
}> = ({ icon, value, label, sub, trend, color, glow, delay = '0ms' }) => (
  <div
    className="relative flex flex-col gap-3 p-4 rounded-2xl bg-[#1a1d23] border border-white/[0.08] shadow-lg overflow-hidden group hover:border-white/[0.15] transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    style={{ animationDelay: delay }}
  >
    {/* Animated gradient background */}
    <div 
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      style={{
        background: `radial-gradient(circle at 100% 0%, ${glow} 0%, transparent 70%)`
      }}
    />
    
    {/* Top: Icon and Trend */}
    <div className="relative z-10 flex items-start justify-between">
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
        style={{
          background: `linear-gradient(135deg, ${color}15, ${color}08)`,
          border: `1px solid ${color}35`,
          boxShadow: `0 4px 12px ${glow}`
        }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400">{trend}</span>
        </div>
      )}
    </div>

    {/* Value */}
    <div className="relative z-10">
      <div className="text-3xl font-black text-white leading-none font-mono tracking-tight mb-1.5 bg-gradient-to-br from-white to-slate-300 bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-xs text-slate-400 font-medium">{label}</div>
      {sub && (
        <div className="text-[10px] font-bold mt-1.5 flex items-center gap-1" style={{ color }}>
          <CheckCircle2 className="w-3 h-3" />
          <span>{sub}</span>
        </div>
      )}
    </div>

    {/* Bottom glow line */}
    <div 
      className="absolute bottom-0 left-0 right-0 h-[2px] opacity-50 group-hover:opacity-100 transition-opacity"
      style={{ 
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        boxShadow: `0 0 8px ${glow}`
      }}
    />
  </div>
);

// ─── Modern Workflow Step Card ────────────────────────────────────────────────
const StepCard: React.FC<{
  step: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  color: string;
  onClick: () => void;
  delay?: string;
}> = ({ step, icon, title, desc, cta, color, onClick, delay = '0ms' }) => (
  <div
    onClick={onClick}
    className="relative flex flex-col gap-4 p-5 rounded-2xl bg-[#1a1d23] border border-white/[0.08] shadow-lg cursor-pointer group hover:border-white/[0.15] hover:shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 overflow-hidden"
    style={{ animationDelay: delay }}
  >
    {/* Animated gradient overlay */}
    <div 
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      style={{
        background: `linear-gradient(135deg, ${color}10 0%, transparent 60%)`
      }}
    />

    {/* Header: Step number and Icon */}
    <div className="relative z-10 flex items-center justify-between">
      <div 
        className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
        style={{
          background: `linear-gradient(135deg, ${color}20, ${color}10)`,
          border: `1.5px solid ${color}40`,
          boxShadow: `0 4px 12px ${color}30`
        }}
      >
        <div style={{ color }} className="transition-transform group-hover:scale-110">
          {icon}
        </div>
      </div>
      <div 
        className="px-3 py-1 rounded-full text-[10px] font-black font-mono tracking-wider"
        style={{
          background: `${color}15`,
          color,
          border: `1px solid ${color}35`
        }}
      >
        {step}
      </div>
    </div>

    {/* Content */}
    <div className="relative z-10 flex-1">
      <h4 className="text-sm font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
        {title}
      </h4>
      <p className="text-xs text-slate-400 leading-relaxed">
        {desc}
      </p>
    </div>

    {/* CTA Footer */}
    <div 
      className="relative z-10 flex items-center justify-between pt-3 border-t border-white/[0.05] group-hover:border-white/[0.1] transition-colors"
    >
      <div className="flex items-center gap-1.5 text-xs font-bold group-hover:gap-2 transition-all" style={{ color }}>
        <span>{cta}</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
      <Play className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
    </div>

    {/* Shine effect on hover */}
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
      <div 
        className="absolute top-0 left-[-100%] w-full h-full group-hover:left-[100%] transition-all duration-1000"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)'
        }}
      />
    </div>
  </div>
);

// ─── Modern Project File Card ─────────────────────────────────────────────────
const FileCard: React.FC<{
  file: ProjectFile;
  index: number;
  onSelect: (f: ProjectFile) => void;
  onDelete?: (f: ProjectFile) => void;
}> = ({ file, index, onSelect, onDelete }) => (
  <div
    onClick={() => onSelect(file)}
    className="group relative rounded-2xl bg-[#1a1d23] border border-white/[0.08] shadow-lg overflow-hidden cursor-pointer hover:border-cyan-500/40 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    style={{ animationDelay: `${index * 40}ms` }}
  >
    {/* Delete button */}
    {onDelete && (
      <button
        onClick={e => { e.stopPropagation(); onDelete(file); }}
        className="absolute top-3 right-3 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-20 bg-black/60 backdrop-blur-md border border-white/[0.1] text-slate-300 hover:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40 shadow-lg"
        title="លុបគម្រោង"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )}

    {/* Thumbnail section */}
    <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden border-b border-white/[0.05]">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(124,58,237,0.1) 100%)' }} 
      />
      
      {/* Center icon */}
      <Film className="w-12 h-12 transition-all duration-300 group-hover:scale-125 group-hover:rotate-6 text-slate-600 group-hover:text-cyan-400 relative z-10" />
      
      {/* File size badge */}
      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg font-mono text-[10px] text-slate-300 bg-black/60 backdrop-blur-sm border border-white/[0.1] shadow-lg">
        {(file.size / (1024 * 1024)).toFixed(1)} MB
      </div>
      
      {/* Status badge */}
      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1 shadow-lg">
        <CheckCircle2 className="w-2.5 h-2.5" />
        <span>READY</span>
      </div>

      {/* Play overlay on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="w-12 h-12 rounded-full bg-cyan-500/20 backdrop-blur-sm border border-cyan-400/40 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Play className="w-5 h-5 text-cyan-400 ml-0.5" />
        </div>
      </div>
    </div>

    {/* Info section */}
    <div className="p-3.5 flex flex-col gap-2">
      <p className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors" title={file.originalName || file.filename}>
        {file.originalName || file.filename}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            ចិន → ខ្មែរ
          </div>
        </div>
        <Activity className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
      </div>
    </div>

    {/* Bottom glow on hover */}
    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-lg shadow-cyan-500/50" />
  </div>
);

// ─── Dashboard Main ───────────────────────────────────────────────────────────
export const DashboardView: React.FC<DashboardProps> = ({
  files = [], totalVoices = 0, voxStatus, diskStats,
  onNewProject, onOpenStudio, onSelectProject, onRefresh, onDeleteProject, onClearAllProjects,
}) => {
  const isOnline = voxStatus?.online ?? false;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0f1114] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 font-khmer">
      
      {/* ══════════════════════════════════════════════════════════════════════
          MODERN HERO BANNER with Glassmorphism
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden border-b border-white/[0.08]">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/30 via-slate-950 to-purple-950/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(124,58,237,0.1),transparent_50%)]" />

        {/* Content */}
        <div className="relative z-10 px-6 md:px-10 py-8 md:py-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Left: Branding */}
          <div className="flex items-center gap-5">
            {/* Logo with glow effect */}
            <div className="relative shrink-0 group">
              <div 
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border-2 border-cyan-500/30 shadow-2xl transition-all duration-500 group-hover:border-cyan-400/50 group-hover:scale-105 group-hover:rotate-3"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
                  boxShadow: '0 8px 32px rgba(6,182,212,0.4), 0 0 64px rgba(139,92,246,0.2)',
                }}
              >
                <img 
                  src="/logo.png" 
                  alt="VOXCPM2KHMER" 
                  className="w-full h-full object-cover"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                <Sparkles className="w-8 h-8 text-white/80 absolute inset-0 m-auto animate-pulse" />
              </div>
              
              {/* Status indicator */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#0f1114] shadow-lg animate-pulse"
                style={{ 
                  background: isOnline ? '#10b981' : '#f59e0b',
                  boxShadow: isOnline ? '0 0 12px #10b981' : '0 0 12px #f59e0b'
                }} 
              />
            </div>

            {/* Text */}
            <div>
              <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-transparent tracking-tight">
                  VOXCPM2KHMER PRO
                </h1>
                <div className="flex items-center gap-1.5">
                  <span className={tw.badge.warning}>
                    v3.0 CINEMA
                  </span>
                  <span className={tw.badge.secondary}>
                    <Crown className="w-3 h-3 inline mr-1" />
                    VIP
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                🎬 ស្ទូឌីយោបញ្ជូលសំឡេង AI ភាសាខ្មែរវិជ្ជាជីវៈ
                <span className="mx-2 text-cyan-400">•</span>
                48kHz Hi-Fi Quality
                <span className="mx-2 text-cyan-400">•</span>
                VoxCPM2 + ElevenLabs Engine
                <span className="mx-2 text-cyan-400">•</span>
                3D Effects Studio
              </p>
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={onNewProject}
              className={`${tw.button.primary} flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm`}
            >
              <PlusCircle className="w-5 h-5" />
              <span className="font-bold">បង្កើតគម្រោងថ្មី</span>
              <Sparkles className="w-4 h-4 animate-pulse" />
            </button>
            
            <button
              onClick={onOpenStudio}
              className={`${tw.button.ghost} flex items-center gap-2 px-5 py-3 rounded-xl text-sm`}
            >
              <Film className="w-4 h-4 text-cyan-400" />
              <span>ចូលស្ទូឌីយោ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="px-6 md:px-10 py-8 flex flex-col gap-8">
        
        {/* ══════════════════════════════════════════════════════════════════════
            METRIC CARDS GRID
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            icon={<Video className="w-6 h-6"/>} 
            value={`${files.length}`}
            label="វីដេអូសកម្ម"
            sub="Active Projects"
            trend="+12%"
            color="#06b6d4" 
            glow="rgba(6,182,212,0.3)" 
            delay="0ms"
          />
          <MetricCard 
            icon={<Users className="w-6 h-6"/>} 
            value={`${totalVoices}`}
            label="AI Voice Characters"
            sub="Voice Library"
            trend="+8"
            color="#a855f7" 
            glow="rgba(168,85,247,0.3)" 
            delay="100ms"
          />
          <MetricCard 
            icon={<Zap className="w-6 h-6"/>}
            value={isOnline ? 'Online' : 'Offline'}
            label="VoxCPM2 GPU Status"
            sub={isOnline ? '✓ Connected' : '✗ Disconnected'}
            color={isOnline ? '#10b981' : '#f59e0b'}
            glow={isOnline ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'} 
            delay="200ms"
          />
          <MetricCard 
            icon={<Database className="w-6 h-6"/>}
            value={diskStats?.formattedSize || '0 MB'}
            label="Output Storage"
            sub={diskStats ? `${diskStats.count} files` : 'Empty'}
            trend="2.1 GB"
            color="#f97316" 
            glow="rgba(249,115,22,0.3)" 
            delay="300ms"
          />
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            WORKFLOW STEPS
        ══════════════════════════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">ជំហានធ្វើ Auto Dubbing</h2>
              <p className="text-xs text-slate-400">3-Step Professional Workflow</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StepCard 
              step="STEP 01" 
              icon={<Subtitles className="w-5 h-5"/>}
              title="ស្កេនវីដេអូ & បកប្រែ AI"
              desc="ទាញយកសំឡេងសន្ទនា បកប្រែជាភាសាខ្មែរ និងបង្កើត Subtitle ស្វ័យប្រវត្តិ"
              cta="ចាប់ផ្តើមស្កេន"
              color="#06b6d4"
              onClick={onOpenStudio} 
              delay="0ms"
            />
            <StepCard 
              step="STEP 02" 
              icon={<Mic2 className="w-5 h-5"/>}
              title="ចាត់ចែងតួអង្គ & សំឡេង"
              desc="បែងចែកតួអង្គ [M] [F] ដោយស្វ័យប្រវត្តិ និងជ្រើសរើសសំឡេង AI សម្រាប់ទាំងអស់គ្នា"
              cta="រៀបចំ Voice Cast"
              color="#a855f7"
              onClick={onOpenStudio} 
              delay="100ms"
            />
            <StepCard 
              step="STEP 03" 
              icon={<Volume2 className="w-5 h-5"/>}
              title="បញ្ជូលសំឡេង & នាំចេញ"
              desc="48kHz Hi-Fi Dubbing ស្វ័យប្រវត្តិ ▶ Export MP4 + SRT ដោយស្វ័យប្រវត្តិ"
              cta="Dub & Export"
              color="#f59e0b"
              onClick={onOpenStudio} 
              delay="200ms"
            />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            RECENT PROJECTS
        ══════════════════════════════════════════════════════════════════════ */}
        <div>
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Film className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">គម្រោងថ្មីៗ</h2>
                  <span className={tw.badge.info}>
                    {files.length} Projects
                  </span>
                </div>
                <p className="text-xs text-slate-400">Recent Dubbing Projects</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5">
              {files.length > 0 && onClearAllProjects && (
                <button
                  onClick={onClearAllProjects}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 text-rose-400 transition-all active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
              )}
              <button
                onClick={onRefresh}
                className={`${tw.button.ghost} flex items-center gap-2 px-4 py-2 rounded-xl text-xs`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Projects grid or empty state */}
          {files.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {files.map((file, i) => (
                <FileCard 
                  key={file.filename} 
                  file={file} 
                  index={i}
                  onSelect={onSelectProject} 
                  onDelete={onDeleteProject} 
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl p-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/[0.08] bg-[#1a1d23]/50 backdrop-blur-sm animate-in fade-in">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
                <FolderOpen className="w-10 h-10 text-cyan-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">មិនទាន់មានគម្រោង Dubbing</h3>
              <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
                ចាប់ផ្តើមបញ្ចូលវីដេអូ ឬ Donghua ដើម្បីឱ្យ AI វិភាគ បកប្រែ
                និងបញ្ជូលសំឡេងខ្មែរស្វ័យប្រវត្តិ
              </p>
              <button
                onClick={onNewProject}
                className={`${tw.button.primary} flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm`}
              >
                <PlusCircle className="w-5 h-5" />
                <span className="font-bold">បញ្ចូលវីដេអូដំបូង</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
