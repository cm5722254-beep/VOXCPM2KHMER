import React, { useState } from 'react';
import {
  Plus,
  FolderOpen,
  Video,
  Mic2,
  Film,
  Users,
  Clock,
  Zap,
  HardDrive,
  Sparkles,
  Play,
  Trash2,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  Flame,
  Crown,
} from 'lucide-react';
import { ProjectFile, VoxcpmStatus } from '../../types';
import { DragonButton } from '../dragon/DragonButton';
import { DragonEmptyState } from '../dragon/DragonEmptyState';

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
  onOpenVoiceLab?: () => void;
  onImportVideo?: () => void;
  onOpenProjects?: () => void;
}

export const DashboardView: React.FC<DashboardProps> = ({
  files = [],
  totalVoices = 100,
  voxStatus,
  diskStats,
  onNewProject,
  onOpenStudio,
  onSelectProject,
  onRefresh,
  onDeleteProject,
  onClearAllProjects,
  onOpenVoiceLab,
  onImportVideo,
  onOpenProjects,
}) => {
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<ProjectFile | null>(null);

  // Six Core Stats requested
  const stats = [
    {
      label: 'Projects (គម្រោង)',
      value: String(files.length || 1),
      sub: 'សកម្មលើ Workspace',
      icon: <Film className="w-5 h-5 text-[#16D9FF]" />,
      color: '#16D9FF',
      glow: 'rgba(22, 217, 255, 0.3)',
    },
    {
      label: 'Characters (តួអង្គ)',
      value: '24',
      sub: 'បានចាត់តាំងសំឡេងរួច',
      icon: <Users className="w-5 h-5 text-[#8B5CF6]" />,
      color: '#8B5CF6',
      glow: 'rgba(139, 92, 246, 0.3)',
    },
    {
      label: 'Voice Minutes (នាទីសំឡេង)',
      value: '1,420m',
      sub: 'សំយោគរួចរាល់ 100%',
      icon: <Clock className="w-5 h-5 text-[#00FFA8]" />,
      color: '#00FFA8',
      glow: 'rgba(0, 255, 168, 0.3)',
    },
    {
      label: 'AI Credits (ក្រេឌីត AI)',
      value: '1,000',
      sub: 'កញ្ចប់ DRAGON PRO',
      icon: <Zap className="w-5 h-5 text-sky-600 dark:text-amber-400" />,
      color: '#F59E0B',
      glow: 'rgba(245, 158, 11, 0.3)',
    },
    {
      label: 'Storage (ទំហំផ្ទុក)',
      value: diskStats?.formattedSize || '12.4 GB',
      sub: 'NVMe Ultra Fast SSD',
      icon: <HardDrive className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      color: '#10B981',
      glow: 'rgba(16, 185, 129, 0.3)',
    },
    {
      label: 'Rendered Videos (វីដេអូចប់)',
      value: '18 ភាគ',
      sub: 'កម្រិត 1080p 60FPS',
      icon: <CheckCircle2 className="w-5 h-5 text-rose-400" />,
      color: '#F43F5E',
      glow: 'rgba(244, 63, 94, 0.3)',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#070A12] text-slate-800 dark:text-slate-100 overflow-y-auto font-khmer p-6 sm:p-8 scrollbar-thin">
      {/* ── HERO BANNER CARD ── */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-50 dark:from-[#0B111C] via-slate-100 dark:via-[#101925] to-[#0D1522] border border-slate-200 dark:border-[#203244] overflow-hidden shadow-2xl mb-8 group">
        {/* Dragon Aura Background */}
        <div className="absolute top-0 right-0 w-[450px] h-[300px] bg-gradient-to-bl from-[#16D9FF]/20 via-[#2563EB]/15 to-[#8B5CF6]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#00FFA8]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16D9FF]/10 border border-slate-200 dark:border-[#16D9FF]/30 text-[#16D9FF] text-xs font-bold mb-3 shadow-sm">
              <span className="text-sm"><img src="/dragon_logo.png" alt="Dragon" className="w-1em h-1em inline-block rounded-sm object-cover shadow-sm" style={{ width: "1em", height: "1em" }} /></span>
              <span className="font-ui uppercase tracking-wider">NEXT-GEN AI DUBBING PLATFORM</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-800 dark:text-white font-ui tracking-wide drop-shadow-md">
              🐲 Welcome to Dragon Dabber Pro
            </h1>

            <p className="text-sm sm:text-base text-[#94A3B8] font-khmer mt-2 leading-relaxed">
              "បម្លែងសំឡេង និងវីដេអូរបស់អ្នកទៅជាភាសាខ្មែរ ដោយ AI"
            </p>

            {/* 4 Core Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              {/* + គម្រោងថ្មី */}
              <DragonButton
                variant="energy"
                size="md"
                onClick={onNewProject}
                icon={<Plus className="w-4 h-4" />}
              >
                + គម្រោងថ្មី
              </DragonButton>

              {/* 📁 បើកគម្រោង */}
              <DragonButton
                variant="panel"
                size="md"
                onClick={onOpenProjects || onOpenStudio}
                icon={<FolderOpen className="w-4 h-4 text-[#16D9FF]" />}
              >
                📁 បើកគម្រោង
              </DragonButton>

              {/* 🎬 Import Video */}
              <DragonButton
                variant="panel"
                size="md"
                onClick={onImportVideo || onOpenStudio}
                icon={<Video className="w-4 h-4 text-[#00FFA8]" />}
              >
                🎬 Import Video
              </DragonButton>

              {/* 🎙️ Voice Lab */}
              <DragonButton
                variant="jade"
                size="md"
                onClick={onOpenVoiceLab || onOpenStudio}
                icon={<Mic2 className="w-4 h-4 text-[#070A12]" />}
              >
                🎙️ Voice Lab
              </DragonButton>
            </div>
          </div>

          {/* Dragon Badge Graphic */}
          <div className="hidden lg:flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-50 dark:bg-[#070A12]/80 border border-slate-200 dark:border-[#203244] shadow-inner text-center shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#16D9FF] via-[#2563EB] to-[#8B5CF6] p-[2px] mb-2 shadow-[0_0_24px_rgba(22,217,255,0.4)]">
              <div className="w-full h-full bg-white dark:bg-[#0A0F1D] rounded-[14px] flex items-center justify-center">
                <span className="text-4xl animate-pulse"><img src="/dragon_logo.png" alt="Dragon" className="w-1em h-1em inline-block rounded-sm object-cover shadow-sm" style={{ width: "1em", height: "1em" }} /></span>
              </div>
            </div>
            <span className="text-xs font-black text-slate-800 dark:text-white font-ui uppercase">DRAGON ENGINE</span>
            <span className="text-[10px] text-[#00FFA8] font-mono mt-0.5">V3.0 HYPER-TURBO</span>
          </div>
        </div>
      </div>

      {/* ── 6 CORE STATS GRID ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#16D9FF]" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase font-ui tracking-wider">
              STUDIO METRICS & USAGE
            </h3>
          </div>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {stats.map((st, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-white dark:bg-[#0B111C] border border-slate-200 dark:border-[#203244] hover:border-slate-200 dark:border-[#16D9FF]/40 transition-all duration-200 shadow-md group relative overflow-hidden flex flex-col justify-between"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(circle at 100% 0%, ${st.glow} 0%, transparent 70%)` }}
              />

              <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-xs text-[#94A3B8] font-medium truncate">{st.label}</span>
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#152235] border border-slate-200 dark:border-[#203244]">{st.icon}</div>
              </div>

              <div className="relative z-10 mt-1">
                <span className="text-2xl font-black text-slate-800 dark:text-white font-mono tracking-tight block">
                  {st.value}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-khmer mt-0.5 block truncate">
                  {st.sub}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RECENT PROJECTS (Cinematic Cards) ── */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-[#00FFA8]" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase font-ui tracking-wider">
              RECENT CINEMATIC PROJECTS (គម្រោងថ្មីៗ)
            </h3>
          </div>
          {files.length > 0 && (
            <button
              onClick={onOpenProjects}
              className="text-xs text-[#16D9FF] hover:underline flex items-center gap-1 font-bold"
            >
              <span>មើលទាំងអស់ ({files.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {files.length === 0 ? (
          <DragonEmptyState
            type="project"
            title="មិនទាន់មានគម្រោង"
            description="ចាប់ផ្តើមគម្រោងថ្មីរបស់អ្នកដើម្បីកែសម្រួល និងបញ្ចូលសំឡេងខ្មែរ"
            actionText="+ បង្កើតគម្រោងថ្មី"
            onAction={onNewProject}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {files.map((file, idx) => {
              const displayTitle = file.filename
                .replace(/\.(mp4|mkv|mov|avi|webm)$/i, '')
                .replace(/[-_]/g, ' ');

              return (
                <div
                  key={file.id || idx}
                  onClick={() => onSelectProject(file)}
                  className="rounded-2xl p-4 bg-white dark:bg-[#0B111C] hover:bg-white dark:bg-[#101925] border border-slate-200 dark:border-[#203244] hover:border-slate-200 dark:border-[#16D9FF]/50 transition-all duration-300 shadow-lg cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    {/* Thumbnail / Video Preview Placeholder */}
                    <div className="relative w-full h-36 rounded-xl bg-gradient-to-tr from-[#0F172A] to-[#1E293B] border border-slate-200 dark:border-[#203244] overflow-hidden mb-3.5 flex items-center justify-center">
                      <div className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: "url('/cinematic_preview.jpg')" }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-[#0B111C] via-transparent to-transparent" />

                      {/* Play Button Overlay */}
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#16D9FF] to-[#2563EB] flex items-center justify-center text-slate-800 dark:text-white shadow-[0_0_20px_rgba(22,217,255,0.4)] group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white text-slate-800 dark:text-white ml-0.5" />
                      </div>

                      {/* Badges on Thumbnail */}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono text-[#16D9FF] border border-white/10 font-bold">
                        1080P • 60FPS
                      </span>
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-[#00FFA8] font-bold">
                        KH DUBBED
                      </span>
                    </div>

                    {/* Project Title & Metadata */}
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate group-hover:text-[#16D9FF] transition-colors">
                      {displayTitle}
                    </h4>

                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>ភាសា: ចិន → ខ្មែរ 🇰🇭</span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">រួចរាល់ 100%</span>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#203244] flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'ទើបតែកែសម្រួល'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProject(file);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#152235] hover:bg-[#16D9FF] text-slate-700 dark:text-slate-200 hover:text-[#070A12] text-xs font-bold transition-colors"
                      >
                        បើកកែតម្រូវ
                      </button>

                      {onDeleteProject && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProject(file);
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="លុបគម្រោង"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
