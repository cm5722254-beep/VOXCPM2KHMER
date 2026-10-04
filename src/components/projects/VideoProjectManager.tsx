import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FolderOpen, Plus, Search, Film, Trash2, Edit3, CheckCircle2, Clock,
  AlertCircle, Play, MoreVertical, X, Save, FolderKanban, TrendingUp,
  Star, StarOff, RefreshCw, SortAsc, SortDesc, Grid3X3, List, Tag,
  FileVideo, ChevronDown, ChevronUp, Minus, PlusCircle,
  UploadCloud, Check, Loader2, LayoutGrid, AlignJustify,
  Zap, Filter, BarChart3, Clock3, Video, Sparkles,
} from "lucide-react";
import { api } from "../../services/api";
import { ProjectFile } from "../../types";

// ─── Types ─────────────────────────────────────────────────────────────────
type DubStatus = "pending" | "processing" | "done" | "failed" | "draft";
type ProjectPriority = "high" | "normal" | "low";
type SortField = "name" | "createdAt" | "updatedAt" | "status" | "progress";
type ViewMode = "grid" | "list";

export interface ProjectVideo {
  id: string; filename: string; originalName: string; url: string;
  size: number; duration?: number; addedAt: string;
  dubStatus: DubStatus; dubProgress: number;
}

export interface VideoProject {
  id: string; name: string; description?: string;
  color: "cyan"|"purple"|"emerald"|"amber"|"rose"|"sky"|"indigo";
  priority: ProjectPriority; status: DubStatus; progress: number;
  totalDurationMin: number; tags: string[];
  createdAt: string; updatedAt: string; isFavorite?: boolean;
  series?: string; episode?: number; videos: ProjectVideo[];
}

interface VideoProjectManagerProps {
  onShowToast: (msg: string, type: "success"|"error"|"info") => void;
  onLoadProject?: (project: VideoProject, video?: ProjectVideo) => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────
const COLOR_OPTIONS: VideoProject["color"][] = ["cyan","purple","emerald","amber","rose","sky","indigo"];

const CC: Record<VideoProject["color"], {
  bg: string; border: string; text: string; dot: string;
  gradFrom: string; gradTo: string; glow: string; light: string; ring: string;
}> = {
  cyan:    { bg:"bg-cyan-50",    border:"border-cyan-200",    text:"text-cyan-700",    dot:"bg-cyan-500",    gradFrom:"#06b6d4", gradTo:"#0e7490", glow:"rgba(6,182,212,0.35)",   light:"bg-cyan-50",    ring:"ring-cyan-400"    },
  purple:  { bg:"bg-purple-50",  border:"border-purple-200",  text:"text-purple-700",  dot:"bg-purple-500",  gradFrom:"#a855f7", gradTo:"#7c3aed", glow:"rgba(168,85,247,0.35)",  light:"bg-purple-50",  ring:"ring-purple-400"  },
  emerald: { bg:"bg-emerald-50", border:"border-emerald-200", text:"text-emerald-700", dot:"bg-emerald-500", gradFrom:"#10b981", gradTo:"#059669", glow:"rgba(16,185,129,0.35)",  light:"bg-emerald-50", ring:"ring-emerald-400" },
  amber:   { bg:"bg-amber-50",   border:"border-amber-200",   text:"text-amber-700",   dot:"bg-amber-500",   gradFrom:"#f59e0b", gradTo:"#d97706", glow:"rgba(245,158,11,0.35)",  light:"bg-amber-50",   ring:"ring-amber-400"   },
  rose:    { bg:"bg-rose-50",    border:"border-rose-200",    text:"text-rose-700",    dot:"bg-rose-500",    gradFrom:"#f43f5e", gradTo:"#e11d48", glow:"rgba(244,63,94,0.35)",   light:"bg-rose-50",    ring:"ring-rose-400"    },
  sky:     { bg:"bg-sky-50",     border:"border-sky-200",     text:"text-sky-700",     dot:"bg-sky-500",     gradFrom:"#0ea5e9", gradTo:"#0284c7", glow:"rgba(14,165,233,0.35)",  light:"bg-sky-50",     ring:"ring-sky-400"     },
  indigo:  { bg:"bg-indigo-50",  border:"border-indigo-200",  text:"text-indigo-700",  dot:"bg-indigo-500",  gradFrom:"#6366f1", gradTo:"#4f46e5", glow:"rgba(99,102,241,0.35)", light:"bg-indigo-50",  ring:"ring-indigo-400"  },
};

const SC: Record<DubStatus, {kh:string;cls:string;dot:string;icon:string}> = {
  pending:    { kh:"រង់ចាំ",         cls:"bg-slate-100 text-slate-700 border-slate-300",            dot:"bg-slate-400",   icon:"⏳" },
  processing: { kh:"កំពុងដំណើរការ", cls:"bg-sky-50 text-sky-700 border-sky-200",                  dot:"bg-sky-500",     icon:"🔄" },
  done:       { kh:"រួចរាល់",         cls:"bg-emerald-50 text-emerald-700 border-emerald-200",      dot:"bg-emerald-500", icon:"✅" },
  failed:     { kh:"បរាជ័យ",          cls:"bg-rose-50 text-rose-700 border-rose-200",               dot:"bg-rose-500",    icon:"❌" },
  draft:      { kh:"ព្រាង",            cls:"bg-amber-50 text-amber-800 border-amber-200",            dot:"bg-amber-400",   icon:"📝" },
};

const PRIORITY_CFG: Record<ProjectPriority, {label:string;color:string;dot:string;bg:string}> = {
  high:   { label:"ខ្ពស់",  color:"text-rose-600",   dot:"bg-rose-500",   bg:"bg-rose-50 border-rose-200 text-rose-700"   },
  normal: { label:"មធ្យម", color:"text-amber-600",  dot:"bg-amber-400",  bg:"bg-amber-50 border-amber-200 text-amber-700" },
  low:    { label:"ទាប",   color:"text-slate-500",  dot:"bg-slate-400",  bg:"bg-slate-100 border-slate-200 text-slate-600" },
};

const LS = "voxcpm_video_projects_v2";

function fmt(b: number) {
  if (!b) return "0 B";
  const k = 1024, s = ["B","KB","MB","GB"], i = Math.floor(Math.log(b)/Math.log(k));
  return `${(b/Math.pow(k,i)).toFixed(1)} ${s[i]}`;
}
function fmtDur(sec?: number) {
  if (!sec) return null;
  const m = Math.floor(sec/60), s2 = Math.floor(sec%60);
  return `${m}m ${s2}s`;
}
function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff/60000);
    if (mins < 1) return "ឥឡូវ";
    if (mins < 60) return `${mins}m មុន`;
    const hrs = Math.floor(mins/60);
    if (hrs < 24) return `${hrs}h មុន`;
    const days = Math.floor(hrs/24);
    if (days < 7) return `${days}d មុន`;
    return d.toLocaleDateString("km-KH", { month:"short", day:"numeric" });
  } catch { return "—"; }
}
function load(): VideoProject[] {
  try { const r = localStorage.getItem(LS); if (r) return JSON.parse(r); } catch {}
  return [];
}
function save(p: VideoProject[]) { localStorage.setItem(LS, JSON.stringify(p)); }
function prog(vs: ProjectVideo[]) {
  if (!vs.length) return 0;
  return Math.round(vs.filter(v => v.dubStatus === "done").length / vs.length * 100);
}

// ─── Animated Progress Bar ──────────────────────────────────────────────────
const GradBar: React.FC<{v: number; c: VideoProject["color"]; h?: string; showLabel?: boolean}> = ({
  v, c, h = "h-2", showLabel = false
}) => {
  const col = CC[c];
  return (
    <div className="flex items-center gap-2">
      <div className={`relative flex-1 ${h} bg-slate-100 rounded-full overflow-hidden border border-slate-200/60`}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.min(100, v)}%`,
            background: `linear-gradient(90deg, ${col.gradFrom}, ${col.gradTo})`,
            boxShadow: v > 0 ? `0 0 8px ${col.glow}` : "none",
          }}
        />
        {v > 0 && v < 100 && (
          <div
            className="absolute inset-y-0 rounded-full opacity-60"
            style={{
              width: `${Math.min(100, v)}%`,
              background: "linear-gradient(90deg, transparent 60%, rgba(255,255,255,0.4) 100%)",
              animation: "shimmer 2s infinite",
            }}
          />
        )}
      </div>
      {showLabel && (
        <span className={`text-[10px] font-black flex-shrink-0 ${col.text}`}>{v}%</span>
      )}
    </div>
  );
};

// ─── Status Badge ───────────────────────────────────────────────────────────
const Badge: React.FC<{s: DubStatus; size?: "sm"|"xs"}> = ({s, size = "xs"}) => {
  const cfg = SC[s];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-bold
      ${size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"}
      ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`}/>
      {cfg.kh}
    </span>
  );
};

// ─── Video Picker Modal ─────────────────────────────────────────────────────
const VideoPicker: React.FC<{
  attached: string[];
  onAdd: (f: ProjectFile) => void;
  onClose: () => void;
  toast: (m: string, t: "success"|"error"|"info") => void;
}> = ({attached, onAdd, onClose, toast}) => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [up, setUp] = useState(false);
  const [pct, setPct] = useState(0);
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.getFiles();
      setFiles(Array.isArray(r) ? r.filter((f: any) => f.type === "video" || /\.(mp4|mkv|avi|mov|webm|flv)$/i.test(f.filename || "")) : []);
    } catch { setFiles([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const doUpload = async (file: File) => {
    if (!file.type.startsWith("video/") && !/\.(mp4|mkv|avi|mov|webm|flv)$/i.test(file.name)) {
      toast("⚠️ File វីដេអូតែប៉ុណ្ណោះ!", "error"); return;
    }
    setUp(true); setPct(0);
    try {
      const r = await api.uploadFile(file, p => setPct(p));
      if (r.file) { onAdd(r.file); toast(`✅ Upload "${file.name}" ជោគជ័យ!`, "success"); onClose(); }
    } catch (e: any) { toast(`❌ ${e.message}`, "error"); }
    finally { setUp(false); }
  };

  const filtered = files.filter(f => (f.originalName || f.filename || "").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-sky-200 shadow-sm flex items-center justify-center">
              <FileVideo className="w-4.5 h-4.5 text-sky-600"/>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">ដាក់វីដេអូចូលគម្រោង</h3>
              <p className="text-[10px] text-slate-500 font-medium">Attach Video to Project</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/60 text-slate-500 hover:text-slate-900 transition-colors">
            <X className="w-4 h-4"/>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) doUpload(f); }}
            onClick={() => !up && ref.current?.click()}
            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all
              ${drag ? "border-sky-500 bg-sky-50 scale-[1.01]" : "border-slate-300 hover:border-sky-400 bg-slate-50/60 hover:bg-sky-50/30"}
              ${up ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            <input ref={ref} type="file" accept="video/*,.mp4,.mkv,.avi,.mov,.webm,.flv" hidden
              onChange={e => { const f = e.target.files?.[0]; if (f) doUpload(f); }}/>
            {up ? (
              <div className="flex flex-col items-center gap-2 w-full">
                <Loader2 className="w-8 h-8 text-sky-600 animate-spin"/>
                <p className="text-sm text-slate-700 font-bold">កំពុង Upload... {pct}%</p>
                <div className="w-full max-w-xs bg-slate-200 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{width:`${pct}%`, background:"linear-gradient(90deg,#0ea5e9,#6366f1)"}}/>
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                  <UploadCloud className="w-6 h-6 text-sky-600"/>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-800">🎬 ទាញ &amp; ទម្លាក់វីដេអូ</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">ឬចុចដើម្បីជ្រើសរើស (MP4, MKV, AVI, MOV, WebM...)</p>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200"/>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ឬជ្រើសរើសពី Server</span>
            <div className="flex-1 h-px bg-slate-200"/>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="ស្វែងរក File..."
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-all"/>
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-slate-400 animate-spin"/></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                {q ? "រកមិនឃើញ File" : "មិនទាន់មី File វីដេអូ — Upload ជាមុនសិន"}
              </div>
            ) : filtered.map(file => {
              const has = attached.includes(file.filename);
              return (
                <div key={file.filename}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all
                    ${has ? "bg-emerald-50/50 border-emerald-200 opacity-60"
                          : "bg-white border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 cursor-pointer shadow-sm"}`}
                  onClick={() => {
                    if (!has) { onAdd(file); onClose(); toast(`✅ បានដាក់ "${file.originalName||file.filename}" ចូលគម្រោង!`, "success"); }
                  }}
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center flex-shrink-0">
                    <Film className="w-4 h-4 text-sky-600"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{file.originalName || file.filename}</p>
                    <p className="text-[10px] text-slate-500">{fmt(file.size)}{file.duration ? ` · ${Math.floor(file.duration/60)}m${Math.floor(file.duration%60)}s` : ""}</p>
                  </div>
                  {has
                    ? <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold flex-shrink-0"><Check className="w-3 h-3"/>ដាក់ហើយ</span>
                    : <PlusCircle className="w-4 h-4 text-slate-400 flex-shrink-0"/>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center flex-shrink-0 bg-slate-50">
          <button onClick={loadFiles} className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors font-medium">
            <RefreshCw className="w-3.5 h-3.5"/>ផ្ទុកឡើងវិញ
          </button>
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl border border-slate-300 transition-all font-medium">បិទ</button>
        </div>
      </div>
    </div>
  );
};

// ─── Video Row (Expanded List) ──────────────────────────────────────────────
const VRow: React.FC<{
  v: ProjectVideo; c: VideoProject["color"];
  onDel: (id: string) => void;
  onPlay: (v: ProjectVideo) => void;
  onSt: (id: string, s: DubStatus) => void;
}> = ({v, c, onDel, onPlay, onSt}) => (
  <div className="flex items-center gap-3 px-3 py-2.5 bg-white hover:bg-slate-50/80 border border-slate-200 rounded-xl group transition-all shadow-sm">
    {/* Thumbnail placeholder */}
    <div className="w-12 h-8 rounded-lg flex-shrink-0 overflow-hidden border border-slate-200 relative"
      style={{ background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)" }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <Film className="w-4 h-4 text-slate-400"/>
      </div>
      <div className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[8px] font-bold px-1 rounded-sm leading-tight">
        {v.duration ? `${Math.floor(v.duration/60)}:${String(Math.floor(v.duration%60)).padStart(2,"0")}` : "—"}
      </div>
    </div>

    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-slate-800 truncate">{v.originalName || v.filename}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{fmt(v.size)}{v.duration ? ` · ${fmtDur(v.duration)}` : ""}</p>
      {v.dubProgress > 0 && (
        <div className="mt-1.5">
          <GradBar v={v.dubProgress} c={c} h="h-1" showLabel={false}/>
        </div>
      )}
    </div>

    <Badge s={v.dubStatus}/>

    <select value={v.dubStatus} onClick={e => e.stopPropagation()}
      onChange={e => onSt(v.id, e.target.value as DubStatus)}
      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-700 focus:outline-none hidden sm:block cursor-pointer hover:border-sky-400 transition-colors">
      <option value="draft">📝 ព្រាង</option>
      <option value="pending">⏳ រង់ចាំ</option>
      <option value="processing">🔄 កំពុង</option>
      <option value="done">✅ រួច</option>
      <option value="failed">❌ បរាជ័យ</option>
    </select>

    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={() => onPlay(v)} title="បើក Dubbing Studio"
        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
        <Play className="w-3.5 h-3.5"/>
      </button>
      <button onClick={() => onDel(v.id)} title="ដកចេញពីគម្រោង"
        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
        <Minus className="w-3.5 h-3.5"/>
      </button>
    </div>
  </div>
);

// ─── Project Card (Grid) ────────────────────────────────────────────────────
const PCard: React.FC<{
  p: VideoProject;
  onEdit: (p: VideoProject) => void; onDel: (id: string) => void;
  onFav: (id: string) => void; onAdd: (id: string) => void;
  onDetach: (pid: string, vid: string) => void;
  onLoad: (p: VideoProject, v: ProjectVideo) => void;
  onVSt: (pid: string, vid: string, s: DubStatus) => void;
  viewMode: ViewMode;
}> = ({p, onEdit, onDel, onFav, onAdd, onDetach, onLoad, onVSt, viewMode}) => {
  const col = CC[p.color];
  const [exp, setExp] = useState(false);
  const [hovered, setHovered] = useState(false);

  if (viewMode === "list") {
    return (
      <div
        className="flex items-center gap-0 bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md group"
        style={{ boxShadow: hovered ? `0 4px 20px ${col.glow}` : undefined }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Left color strip */}
        <div className="w-1 self-stretch flex-shrink-0 rounded-l-xl"
          style={{ background: `linear-gradient(180deg, ${col.gradFrom}, ${col.gradTo})` }}/>

        {/* Main content */}
        <div className="flex-1 flex items-center gap-4 px-4 py-3 min-w-0">
          {/* Color dot + name */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-black"
              style={{ background: `linear-gradient(135deg, ${col.gradFrom}, ${col.gradTo})` }}>
              {p.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900 truncate">{p.name}</span>
                {p.isFavorite && <Star className="w-3 h-3 text-amber-500 fill-current flex-shrink-0"/>}
              </div>
              {p.series && (
                <span className="text-[10px] text-slate-500 font-medium">📺 {p.series}{p.episode ? ` · ភាគ ${p.episode}` : ""}</span>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
            {(p.tags||[]).slice(0,2).map(t => (
              <span key={t} className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-[9px] text-slate-600 font-medium">{t}</span>
            ))}
          </div>

          {/* Progress */}
          <div className="w-32 flex-shrink-0 hidden md:block">
            <GradBar v={p.progress} c={p.color} h="h-1.5" showLabel={true}/>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 flex-shrink-0 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><Film className="w-3 h-3"/>{p.videos.length}</span>
            <span className="hidden sm:block text-slate-300">|</span>
            <span className="hidden sm:block">{fmtDate(p.updatedAt)}</span>
          </div>

          {/* Status + Priority */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge s={p.status}/>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_CFG[p.priority].dot}`} title={PRIORITY_CFG[p.priority].label}/>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 px-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onAdd(p.id)} title="ដាក់វីដេអូ"
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-all">
            <PlusCircle className="w-3.5 h-3.5"/>
          </button>
          <button onClick={() => onEdit(p)} title="កែប្រែ"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
            <Edit3 className="w-3.5 h-3.5"/>
          </button>
          <button onClick={() => onFav(p.id)} title="Favorite"
            className={`p-1.5 rounded-lg transition-all ${p.isFavorite ? "text-amber-500 hover:bg-amber-50" : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"}`}>
            {p.isFavorite ? <Star className="w-3.5 h-3.5 fill-current"/> : <Star className="w-3.5 h-3.5"/>}
          </button>
          <button onClick={() => onDel(p.id)} title="លុប"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
            <Trash2 className="w-3.5 h-3.5"/>
          </button>
        </div>
      </div>
    );
  }

  // Grid Card
  return (
    <div
      className="bg-white border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col"
      style={{
        borderColor: hovered ? col.gradFrom : "#e2e8f0",
        boxShadow: hovered ? `0 12px 40px ${col.glow}, 0 4px 12px rgba(0,0,0,0.08)` : "0 1px 3px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Gradient Header Strip */}
      <div className="relative h-14 flex items-end px-4 pb-2 overflow-hidden flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${col.gradFrom}dd, ${col.gradTo}ee)` }}>
        {/* Decorative circles */}
        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-20"
          style={{ background: "rgba(255,255,255,0.4)" }}/>
        <div className="absolute -top-2 -right-10 w-20 h-20 rounded-full opacity-10"
          style={{ background: "rgba(255,255,255,0.6)" }}/>

        <div className="flex items-center justify-between w-full relative z-10">
          {/* Series/Episode badge */}
          {p.series ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black/20 backdrop-blur-sm rounded-full text-[9px] font-bold text-white">
              📺 {p.series}{p.episode ? ` E${p.episode}` : ""}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black/15 backdrop-blur-sm rounded-full text-[9px] font-bold text-white/80">
              <FolderKanban className="w-2.5 h-2.5"/>Project
            </span>
          )}

          {/* Favorite star */}
          <button onClick={() => onFav(p.id)}
            className={`p-1 rounded-full transition-all hover:scale-110 ${p.isFavorite ? "text-amber-300" : "text-white/50 hover:text-amber-300"}`}>
            <Star className={`w-4 h-4 ${p.isFavorite ? "fill-current" : ""}`}/>
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Project name + description */}
        <div>
          <h3 className="text-base font-black text-slate-900 leading-tight mb-1">{p.name}</h3>
          {p.description && (
            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{p.description}</p>
          )}
        </div>

        {/* Tag chips */}
        {(p.tags||[]).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(p.tags||[]).slice(0,3).map(t => (
              <span key={t} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-[9px] text-slate-600 font-medium">
                <Tag className="w-2 h-2 text-slate-400"/>{t}
              </span>
            ))}
            {(p.tags||[]).length > 3 && (
              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-[9px] text-slate-400 font-medium">+{(p.tags||[]).length - 3}</span>
            )}
          </div>
        )}

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-semibold">Dubbing Progress</span>
            <span className={`text-[11px] font-black ${col.text}`}>{p.progress}%</span>
          </div>
          <GradBar v={p.progress} c={p.color} h="h-2"/>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-0.5">
          <span className="flex items-center gap-1">
            <Film className="w-3 h-3 text-slate-400"/>
            <strong className="text-slate-700 font-bold">{p.videos.length}</strong> វីដេអូ
          </span>
          {p.totalDurationMin > 0 && (
            <>
              <span className="text-slate-200">|</span>
              <span className="flex items-center gap-1">
                <Clock3 className="w-3 h-3 text-slate-400"/>
                <strong className="text-slate-700 font-bold">{p.totalDurationMin}m</strong>
              </span>
            </>
          )}
          <span className="text-slate-200">|</span>
          <span className="flex items-center gap-1 ml-auto">
            <Clock className="w-2.5 h-2.5"/>
            {fmtDate(p.updatedAt)}
          </span>
        </div>

        {/* Status + Priority row */}
        <div className="flex items-center justify-between">
          <Badge s={p.status} size="sm"/>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold ${PRIORITY_CFG[p.priority].bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CFG[p.priority].dot}`}/>
            {PRIORITY_CFG[p.priority].label}
          </span>
        </div>
      </div>

      {/* Bottom Action Row */}
      <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
        <div className="flex items-center gap-1">
          <button onClick={() => onAdd(p.id)} title="ដាក់វីដេអូ"
            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-100 transition-all" >
            <PlusCircle className="w-3.5 h-3.5"/>
          </button>
          <button onClick={() => onEdit(p)} title="កែប្រែ"
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-100 transition-all">
            <Edit3 className="w-3.5 h-3.5"/>
          </button>
          <button onClick={() => onDel(p.id)} title="លុប"
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-100 transition-all">
            <Trash2 className="w-3.5 h-3.5"/>
          </button>
        </div>

        {/* Toggle video list */}
        <button onClick={() => setExp(e => !e)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all
            ${exp ? `${col.text} ${col.bg} border ${col.border}` : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
          <FileVideo className="w-3 h-3"/>
          {exp ? "បិទ" : `${p.videos.length} វីដេអូ`}
          {exp ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
        </button>
      </div>

      {/* Video list accordion */}
      {exp && (
        <div className="border-t border-slate-100 bg-slate-50/80 px-3 pb-3 pt-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <button onClick={() => onAdd(p.id)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-sky-300 hover:border-sky-500 text-sky-600 text-xs font-bold bg-white hover:bg-sky-50/50 transition-all">
            <Plus className="w-3.5 h-3.5"/>ដាក់វីដេអូចូល
          </button>
          {p.videos.length === 0 ? (
            <div className="flex flex-col items-center py-4 text-[11px] text-slate-400 gap-1">
              <Film className="w-5 h-5 opacity-40"/>
              <span>មិនទាន់មីវីដេអូ</span>
            </div>
          ) : p.videos.map(v => (
            <VRow key={v.id} v={v} c={p.color}
              onDel={id => onDetach(p.id, id)}
              onPlay={vid => onLoad(p, vid)}
              onSt={(id, s) => onVSt(p.id, id, s)}/>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Create/Edit Slide-in Panel ─────────────────────────────────────────────
const PForm: React.FC<{
  proj: Partial<VideoProject>|null;
  onSave: (p: VideoProject) => void;
  onClose: () => void;
}> = ({proj, onSave, onClose}) => {
  const isNew = !proj?.id;
  const [f, setF] = useState<Partial<VideoProject>>({
    name:"", description:"", color:"cyan", priority:"normal", status:"draft",
    progress:0, totalDurationMin:0, tags:[], isFavorite:false, series:"", videos:[], ...proj,
  });
  const [ti, setTi] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const doClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const doSave = () => {
    if (!f.name?.trim()) return;
    const now = new Date().toISOString();
    const vs = f.videos || [];
    onSave({
      id: f.id || `proj_${Date.now()}`, name: f.name!.trim(),
      description: f.description || "", color: f.color || "cyan",
      priority: f.priority || "normal", status: f.status || "draft",
      progress: prog(vs), totalDurationMin: f.totalDurationMin ?? 0,
      tags: f.tags || [], series: f.series, episode: f.episode,
      isFavorite: f.isFavorite ?? false,
      createdAt: f.createdAt || now, updatedAt: now, videos: vs,
    });
  };

  const addTag = () => {
    const t = ti.trim();
    if (t && !(f.tags||[]).includes(t)) { setF(x => ({...x, tags: [...(x.tags||[]), t]})); }
    setTi("");
  };

  const selectedCol = CC[f.color || "cyan"];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: visible ? "rgba(15,23,42,0.45)" : "transparent", backdropFilter: visible ? "blur(4px)" : "none", transition: "background 0.3s, backdrop-filter 0.3s" }}
      onClick={e => { if (e.target === e.currentTarget) doClose(); }}
    >
      {/* Slide-in Panel */}
      <div
        className="w-full max-w-md bg-white flex flex-col h-full shadow-2xl"
        style={{
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Gradient Header */}
        <div className="flex-shrink-0 px-6 py-5 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${selectedCol.gradFrom}cc, ${selectedCol.gradTo}ee)` }}>
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-15"
            style={{ background: "rgba(255,255,255,0.6)" }}/>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-white"/>
              </div>
              <div>
                <h3 className="text-base font-black text-white">{isNew ? "បង្កើតគម្រោងថ្មី" : "កែប្រែគម្រោង"}</h3>
                <p className="text-[11px] text-white/70 font-medium">{isNew ? "Create New Project" : "Edit Project"}</p>
              </div>
            </div>
            <button onClick={doClose} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all">
              <X className="w-4 h-4"/>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">ឈ្មោះគម្រោង *</label>
            <input value={f.name||""} onChange={e => setF(x => ({...x, name: e.target.value}))}
              placeholder="ឈ្មោះស៊េរីរឿង..."
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all font-medium"/>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">ការពិពណ៌នា</label>
            <textarea value={f.description||""} onChange={e => setF(x => ({...x, description: e.target.value}))}
              placeholder="ពណ៌នាអំពីគម្រោង..." rows={3}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all resize-none"/>
          </div>

          {/* Color Picker — Swatches */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">ពណ៌គម្រោង</label>
            <div className="grid grid-cols-7 gap-2">
              {COLOR_OPTIONS.map(c => {
                const cc = CC[c];
                const sel = f.color === c;
                return (
                  <button key={c} onClick={() => setF(x => ({...x, color: c}))}
                    className="group flex flex-col items-center gap-1"
                    title={c}>
                    <div className={`w-9 h-9 rounded-xl transition-all duration-200 ${sel ? "scale-110 ring-2 ring-offset-2 shadow-lg" : "opacity-70 hover:opacity-100 hover:scale-105"}`}
                      style={{
                        background: `linear-gradient(135deg, ${cc.gradFrom}, ${cc.gradTo})`,
                        boxShadow: sel ? `0 4px 12px ${cc.glow}` : undefined,
                      }}>
                      {sel && <Check className="w-full h-full p-2.5 text-white"/>}
                    </div>
                    <span className={`text-[9px] font-bold capitalize transition-colors ${sel ? "text-slate-800" : "text-slate-400"}`}>{c}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority — Radio */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">អាទិភាព</label>
            <div className="grid grid-cols-3 gap-2">
              {(["high","normal","low"] as ProjectPriority[]).map(pr => {
                const pcfg = PRIORITY_CFG[pr];
                const sel = f.priority === pr;
                return (
                  <button key={pr} onClick={() => setF(x => ({...x, priority: pr}))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${sel ? `${pcfg.bg} border-current font-bold scale-[1.02]` : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pcfg.dot}`}/>
                    <span className="text-xs font-bold">{pcfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status + Series row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">ស្ថានភាព</label>
              <select value={f.status} onChange={e => setF(x => ({...x, status: e.target.value as DubStatus}))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 transition-all cursor-pointer">
                <option value="draft">📝 ព្រាង</option>
                <option value="pending">⏳ រង់ចាំ</option>
                <option value="processing">🔄 កំពុង</option>
                <option value="done">✅ រួចរាល់</option>
                <option value="failed">❌ បរាជ័យ</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">ស៊េរី</label>
              <input value={f.series||""} onChange={e => setF(x => ({...x, series: e.target.value}))}
                placeholder="ឈ្មោះស៊េរី..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-all"/>
            </div>
          </div>

          {/* Episode */}
          {f.series && (
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">ភាគ (Episode)</label>
              <input type="number" min={1} value={f.episode||""} onChange={e => setF(x => ({...x, episode: parseInt(e.target.value)||undefined}))}
                placeholder="1, 2, 3..."
                className="w-32 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-all"/>
            </div>
          )}

          {/* Tags Input */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">ស្លាក (Tags)</label>
            <div className="flex gap-2">
              <input value={ti} onChange={e => setTi(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); }}}
                placeholder="វាយ Enter ដើម្បីបន្ថែម..."
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-all"/>
              <button onClick={addTag}
                className="px-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-700 hover:bg-sky-100 transition-all font-bold">
                <Plus className="w-4 h-4"/>
              </button>
            </div>
            {(f.tags||[]).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(f.tags||[]).map(t => (
                  <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-[10px] text-slate-700 font-bold">
                    <Tag className="w-2.5 h-2.5 text-sky-500"/>{t}
                    <button onClick={() => setF(x => ({...x, tags:(x.tags||[]).filter(s=>s!==t)}))}
                      className="hover:text-rose-600 ml-0.5 transition-colors">
                      <X className="w-2.5 h-2.5"/>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Favorite toggle */}
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 hover:bg-amber-50 transition-colors">
            <div
              onClick={() => setF(x => ({...x, isFavorite: !x.isFavorite}))}
              className={`relative w-10 h-5.5 rounded-full border transition-all cursor-pointer flex-shrink-0
                ${f.isFavorite ? "bg-amber-400 border-amber-500" : "bg-slate-200 border-slate-300"}`}
              style={{ height: "22px", width: "42px" }}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${f.isFavorite ? "translate-x-5" : "translate-x-0.5"}`}/>
            </div>
            <input type="checkbox" hidden checked={f.isFavorite||false}
              onChange={e => setF(x => ({...x, isFavorite: e.target.checked}))}/>
            <div>
              <span className="text-xs text-slate-700 font-bold">⭐ ដាក់ស្រឡាញ់ (Favorite)</span>
              <p className="text-[10px] text-slate-500">គម្រោងពិសេសតែងនឹងនៅខាងដើម</p>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50">
          <button onClick={doClose}
            className="flex-1 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl border border-slate-200 transition-all font-semibold">
            បោះបង់
          </button>
          <button onClick={doSave} disabled={!f.name?.trim()}
            className="flex-1 py-2.5 text-sm font-black text-white rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: !f.name?.trim()
                ? "#94a3b8"
                : `linear-gradient(135deg, ${selectedCol.gradFrom}, ${selectedCol.gradTo})`,
              boxShadow: f.name?.trim() ? `0 4px 16px ${selectedCol.glow}` : undefined,
            }}>
            <Save className="w-4 h-4"/>
            {isNew ? "បង្កើតគម្រោង" : "រក្សាទុក"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Empty State ────────────────────────────────────────────────────────────
const EmptyState: React.FC<{
  hasFilter: boolean;
  onNew: () => void;
}> = ({hasFilter, onNew}) => (
  <div className="flex flex-col items-center justify-center h-full gap-6 py-20 select-none">
    {/* Drag-drop hint zone */}
    <div className="relative flex flex-col items-center justify-center w-64 h-44 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 transition-all hover:border-sky-400 hover:bg-sky-50/30"
      style={{ animation: "pulse 3s ease-in-out infinite" }}>
      {/* Decorative grid */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "radial-gradient(circle, #64748b 1px, transparent 1px)", backgroundSize: "20px 20px", borderRadius: "14px" }}/>
      <div className="relative flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-md flex items-center justify-center"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
          <FolderOpen className="w-8 h-8 text-slate-400"/>
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-slate-700">No Projects Yet</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {hasFilter ? "រកមិនឃើញ — ពិនិត្យ Filter ម្តងទៀត" : "ចាប់ផ្តើមដំបូង!"}
          </p>
        </div>
      </div>
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-medium bg-white px-3 py-0.5 rounded-full border border-slate-200">
        ⬆ ទម្លាក់ File ដើម្បី Upload
      </div>
    </div>

    {!hasFilter && (
      <div className="flex flex-col items-center gap-3">
        <p className="text-slate-500 text-sm text-center max-w-xs leading-relaxed">
          រៀបចំ និងតាមដានគម្រោង Dubbing របស់អ្នក<br/>
          ក្នុងទម្រង់ប្រហែលជាស្រស់ស្អាត!
        </p>
        <button onClick={onNew}
          className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-black text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          style={{
            background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
            boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
            animation: "bounce 2s ease-in-out infinite",
          }}>
          <Sparkles className="w-4 h-4"/>
          បង្កើតគម្រោងដំបូង
        </button>
      </div>
    )}

    <style>{`
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.85; }
      }
    `}</style>
  </div>
);

// ─── Statistics Summary Row ─────────────────────────────────────────────────
const StatsSummary: React.FC<{
  totalProjects: number;
  totalVideos: number;
  completedPct: number;
  totalDurationHrs: number;
}> = ({totalProjects, totalVideos, completedPct, totalDurationHrs}) => {
  const stats = [
    { icon: <FolderKanban className="w-4 h-4"/>, label: "Projects", value: totalProjects, color: "from-sky-500 to-indigo-600", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
    { icon: <Film className="w-4 h-4"/>,        label: "Videos",   value: totalVideos,   color: "from-purple-500 to-pink-600",  bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    { icon: <CheckCircle2 className="w-4 h-4"/>, label: "Completed",value: `${completedPct}%`, color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    { icon: <Clock3 className="w-4 h-4"/>,      label: "Hours",    value: `${totalDurationHrs}h`, color: "from-amber-500 to-orange-600", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map((s, i) => (
        <div key={i}
          className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border ${s.border} ${s.bg} overflow-hidden`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${s.color} shadow-sm flex-shrink-0`}>
            {s.icon}
          </div>
          <div className="min-w-0">
            <p className={`text-lg font-black ${s.text} leading-none`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Filter Chip ─────────────────────────────────────────────────────────────
const FilterChip: React.FC<{
  label: string; count: number; active: boolean; icon?: string;
  onClick: () => void; color?: string;
}> = ({label, count, active, icon, onClick, color}) => (
  <button onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap transition-all flex-shrink-0
      ${active
        ? "border-sky-500 bg-sky-500 text-white shadow-md shadow-sky-500/30 scale-105"
        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}>
    {icon && <span>{icon}</span>}
    {label}
    <span className={`inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[9px] font-black
      ${active ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"}`}>
      {count}
    </span>
  </button>
);

// ─── Main ───────────────────────────────────────────────────────────────────
export const VideoProjectManager: React.FC<VideoProjectManagerProps> = ({onShowToast, onLoadProject}) => {
  const [projects, setProjects] = useState<VideoProject[]>(() => load());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DubStatus|"all">("all");
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority|"all">("all");
  const [sortF, setSortF] = useState<SortField>("updatedAt");
  const [sortD, setSortD] = useState<"asc"|"desc">("desc");
  const [view, setView] = useState<ViewMode>("grid");
  const [editP, setEditP] = useState<Partial<VideoProject>|null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [delId, setDelId] = useState<string|null>(null);
  const [pickId, setPickId] = useState<string|null>(null);

  useEffect(() => { save(projects); }, [projects]);

  const handleSave = (p: VideoProject) => {
    setProjects(prev => {
      const i = prev.findIndex(x => x.id === p.id);
      if (i >= 0) { const n = [...prev]; n[i] = p; return n; }
      return [p, ...prev];
    });
    setFormOpen(false); setEditP(null);
    onShowToast(editP?.id ? `✅ រក្សាទុកគម្រោង "${p.name}"` : `🎉 បង្កើតគម្រោង "${p.name}"!`, "success");
  };

  const handleDel = (id: string) => {
    const p = projects.find(x => x.id === id);
    setProjects(prev => prev.filter(x => x.id !== id));
    setDelId(null);
    onShowToast(`🗑️ លុបគម្រោង "${p?.name}"`, "info");
  };

  const handleFav = (id: string) =>
    setProjects(prev => prev.map(p => p.id===id ? {...p, isFavorite:!p.isFavorite, updatedAt:new Date().toISOString()} : p));

  const handleAttach = (pid: string, file: ProjectFile) => {
    const now = new Date().toISOString();
    const v: ProjectVideo = {
      id: `vid_${Date.now()}`, filename: file.filename,
      originalName: file.originalName || file.filename,
      url: file.url, size: file.size, duration: file.duration,
      addedAt: now, dubStatus: "pending", dubProgress: 0,
    };
    setProjects(prev => prev.map(p => {
      if (p.id !== pid) return p;
      const vs = [...p.videos, v];
      return {...p, videos: vs, progress: prog(vs), updatedAt: now};
    }));
  };

  const handleDetach = (pid: string, vid: string) => {
    const now = new Date().toISOString();
    setProjects(prev => prev.map(p => {
      if (p.id !== pid) return p;
      const vs = p.videos.filter(v => v.id !== vid);
      return {...p, videos: vs, progress: prog(vs), updatedAt: now};
    }));
    onShowToast("🗑️ បានដកវីដេអូចេញពីគម្រោង", "info");
  };

  const handleLoad = (p: VideoProject, v: ProjectVideo) => {
    onLoadProject?.(p, v);
    onShowToast(`▶️ បើក "${v.originalName}" ក្នុង Dubbing Studio`, "success");
  };

  const handleVSt = (pid: string, vid: string, s: DubStatus) => {
    const now = new Date().toISOString();
    setProjects(prev => prev.map(p => {
      if (p.id !== pid) return p;
      const vs = p.videos.map(v => v.id===vid ? {...v, dubStatus:s, dubProgress:s==="done"?100:v.dubProgress} : v);
      return {...p, videos: vs, progress: prog(vs), updatedAt: now};
    }));
  };

  // ── Derived list ──
  const list = useCallback(() => {
    let l = [...projects];
    if (search.trim()) {
      const q = search.toLowerCase();
      l = l.filter(p => p.name.toLowerCase().includes(q) || (p.description||"").toLowerCase().includes(q)
        || (p.series||"").toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q)));
    }
    if (filter !== "all") l = l.filter(p => p.status === filter);
    if (priorityFilter !== "all") l = l.filter(p => p.priority === priorityFilter);
    l.sort((a, b) => {
      let av: any, bv: any;
      if (sortF==="name") { av=a.name; bv=b.name; }
      else if (sortF==="progress") { av=a.progress; bv=b.progress; }
      else if (sortF==="status") { av=a.status; bv=b.status; }
      else if (sortF==="createdAt") { av=a.createdAt; bv=b.createdAt; }
      else { av=a.updatedAt; bv=b.updatedAt; }
      if (av<bv) return sortD==="asc"?-1:1;
      if (av>bv) return sortD==="asc"?1:-1;
      return 0;
    });
    l.sort((a, b) => (b.isFavorite?1:0) - (a.isFavorite?1:0));
    return l;
  }, [projects, search, filter, priorityFilter, sortF, sortD])();

  // ── Stats ──
  const tv = projects.reduce((a,p) => a+p.videos.length, 0);
  const dv = projects.reduce((a,p) => a+p.videos.filter(v=>v.dubStatus==="done").length, 0);
  const opct = tv>0 ? Math.round(dv/tv*100) : 0;
  const totalDurHrs = Math.round(projects.reduce((a,p) => a+(p.totalDurationMin||0), 0) / 60 * 10) / 10;
  const pp = pickId ? projects.find(p => p.id===pickId) : null;

  // ── Filter chip counts ──
  const statusCounts = {
    all:        projects.length,
    pending:    projects.filter(p=>p.status==="pending").length,
    processing: projects.filter(p=>p.status==="processing").length,
    done:       projects.filter(p=>p.status==="done").length,
    failed:     projects.filter(p=>p.status==="failed").length,
    draft:      projects.filter(p=>p.status==="draft").length,
  };
  const priCounts = {
    all:    projects.length,
    high:   projects.filter(p=>p.priority==="high").length,
    normal: projects.filter(p=>p.priority==="normal").length,
    low:    projects.filter(p=>p.priority==="low").length,
  };

  const hasActiveFilter = search.trim().length > 0 || filter !== "all" || priorityFilter !== "all";

  return (
    <div className="flex flex-col h-full font-khmer" style={{ background: "#f1f5f9" }}>

      {/* ── HEADER TOOLBAR ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-4 pb-3 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Title + badge */}
          <div className="flex items-center gap-3 mr-auto">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>
              <FolderKanban className="w-5 h-5 text-white"/>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 tracking-tight">PROJECT MANAGER</h1>
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black text-white"
                  style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", minWidth: "24px" }}>
                  {projects.length}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">រៀបចំ និងតាមដានគម្រោង Dubbing</p>
            </div>
          </div>

          {/* View mode toggle */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-100 p-0.5">
            <button onClick={() => setView("grid")}
              className={`p-1.5 rounded-lg transition-all ${view==="grid" ? "bg-white text-sky-600 shadow-sm font-bold" : "text-slate-500 hover:text-slate-700"}`}>
              <LayoutGrid className="w-4 h-4"/>
            </button>
            <button onClick={() => setView("list")}
              className={`p-1.5 rounded-lg transition-all ${view==="list" ? "bg-white text-sky-600 shadow-sm font-bold" : "text-slate-500 hover:text-slate-700"}`}>
              <AlignJustify className="w-4 h-4"/>
            </button>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-xl bg-white px-1 shadow-sm">
            <select value={sortF} onChange={e => setSortF(e.target.value as SortField)}
              className="bg-transparent border-none px-2 py-1.5 text-xs text-slate-700 focus:outline-none font-semibold cursor-pointer">
              <option value="updatedAt">📅 ថ្ងៃថ្មី</option>
              <option value="name">🔤 ឈ្មោះ</option>
              <option value="progress">📊 វឌ្ឍនភាព</option>
              <option value="status">🔘 ស្ថានភាព</option>
              <option value="createdAt">🗓 បង្កើត</option>
            </select>
            <button onClick={() => setSortD(d => d==="asc"?"desc":"asc")}
              className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors">
              {sortD==="asc" ? <SortAsc className="w-3.5 h-3.5"/> : <SortDesc className="w-3.5 h-3.5"/>}
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ស្វែងរកគម្រោង..."
              className="w-44 pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:bg-white transition-all focus:w-56"/>
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-3 h-3"/>
              </button>
            )}
          </div>

          {/* New Project button */}
          <button onClick={() => { setEditP({}); setFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black text-white transition-all hover:scale-105 hover:shadow-lg flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
              boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
            }}>
            <Plus className="w-4 h-4"/>
            <span className="hidden sm:inline">New Project</span>
          </button>
        </div>
      </div>

      {/* ── STATS SUMMARY ───────────────────────────────────────────────── */}
      {projects.length > 0 && (
        <div className="flex-shrink-0 px-6 pt-4">
          <StatsSummary
            totalProjects={projects.length}
            totalVideos={tv}
            completedPct={opct}
            totalDurationHrs={totalDurHrs}/>
        </div>
      )}

      {/* ── FILTER BAR ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-3 pb-0">
        {/* Status chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: "none" }}>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex-shrink-0">Status:</span>
          <FilterChip label="ទាំងអស់"         count={statusCounts.all}        active={filter==="all"}        onClick={() => setFilter("all")}/>
          <FilterChip label="ព្រាង"            count={statusCounts.draft}      active={filter==="draft"}      icon="📝" onClick={() => setFilter("draft")}/>
          <FilterChip label="រង់ចាំ"           count={statusCounts.pending}    active={filter==="pending"}    icon="⏳" onClick={() => setFilter("pending")}/>
          <FilterChip label="កំពុងដំណើរការ"   count={statusCounts.processing} active={filter==="processing"} icon="🔄" onClick={() => setFilter("processing")}/>
          <FilterChip label="រួចរាល់"          count={statusCounts.done}       active={filter==="done"}       icon="✅" onClick={() => setFilter("done")}/>
          <FilterChip label="បរាជ័យ"           count={statusCounts.failed}     active={filter==="failed"}     icon="❌" onClick={() => setFilter("failed")}/>

          <span className="w-px h-5 bg-slate-200 flex-shrink-0 mx-1"/>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex-shrink-0">Priority:</span>
          <FilterChip label="ទាំងអស់" count={priCounts.all}    active={priorityFilter==="all"}    onClick={() => setPriorityFilter("all")}/>
          <FilterChip label="ខ្ពស់"   count={priCounts.high}   active={priorityFilter==="high"}   icon="🔴" onClick={() => setPriorityFilter("high")}/>
          <FilterChip label="មធ្យម"  count={priCounts.normal} active={priorityFilter==="normal"} icon="🟡" onClick={() => setPriorityFilter("normal")}/>
          <FilterChip label="ទាប"    count={priCounts.low}    active={priorityFilter==="low"}    icon="⚪" onClick={() => setPriorityFilter("low")}/>

          {hasActiveFilter && (
            <button onClick={() => { setSearch(""); setFilter("all"); setPriorityFilter("all"); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all flex-shrink-0 ml-1">
              <X className="w-2.5 h-2.5"/>លុប Filter
            </button>
          )}
        </div>
      </div>

      {/* ── CONTENT AREA ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {list.length === 0 ? (
          <EmptyState hasFilter={hasActiveFilter} onNew={() => { setEditP({}); setFormOpen(true); }}/>
        ) : (
          <>
            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] text-slate-500 font-semibold">
                បង្ហាញ <strong className="text-slate-700">{list.length}</strong> ក្នុង <strong className="text-slate-700">{projects.length}</strong> គម្រោង
                {hasActiveFilter && <span className="text-sky-600"> (Filtered)</span>}
              </p>
              {view === "grid" && (
                <p className="text-[10px] text-slate-400">Grid · 3 col</p>
              )}
            </div>

            <div className={view==="grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-2"}>
              {list.map(p => (
                <PCard key={p.id} p={p} viewMode={view}
                  onEdit={x => { setEditP(x); setFormOpen(true); }}
                  onDel={id => setDelId(id)}
                  onFav={handleFav}
                  onAdd={id => setPickId(id)}
                  onDetach={handleDetach}
                  onLoad={handleLoad}
                  onVSt={handleVSt}/>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── SLIDE-IN FORM PANEL ──────────────────────────────────────────── */}
      {formOpen && (
        <PForm proj={editP} onSave={handleSave} onClose={() => { setFormOpen(false); setEditP(null); }}/>
      )}

      {/* ── VIDEO PICKER MODAL ───────────────────────────────────────────── */}
      {pp && (
        <VideoPicker
          attached={pp.videos.map(v => v.filename)}
          onAdd={f => handleAttach(pp.id, f)}
          onClose={() => setPickId(null)}
          toast={onShowToast}/>
      )}

      {/* ── DELETE CONFIRM ───────────────────────────────────────────────── */}
      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-rose-200 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #fef2f2, #fee2e2)", border: "1px solid #fecaca" }}>
                <Trash2 className="w-5 h-5 text-rose-600"/>
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">លុបគម្រោង?</h3>
                <p className="text-[11px] text-slate-500">វីដេអូក្នុងគម្រោងនឹងត្រូវបានដកផងដែរ!</p>
              </div>
            </div>
            <div className="p-3 rounded-xl mb-5 text-xs text-slate-700 leading-relaxed"
              style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
              ⚠️ <strong className="text-slate-900">"{projects.find(p=>p.id===delId)?.name}"</strong>
              {" "}({projects.find(p=>p.id===delId)?.videos.length||0} វីដេអូ) នឹងត្រូវបានលុប។
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => setDelId(null)}
                className="flex-1 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all font-semibold">
                បោះបង់
              </button>
              <button onClick={() => handleDel(delId)}
                className="flex-1 py-2.5 text-sm font-black text-white rounded-xl transition-all"
                style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)", boxShadow: "0 4px 12px rgba(244,63,94,0.35)" }}>
                លុប
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default VideoProjectManager;
