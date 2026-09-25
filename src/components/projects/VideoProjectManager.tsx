import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FolderOpen, Plus, Search, Film, Trash2, Edit3, CheckCircle2, Clock,
  AlertCircle, Play, MoreVertical, X, Save, FolderKanban, TrendingUp,
  Star, StarOff, RefreshCw, SortAsc, SortDesc, Grid3X3, List, Tag,
  FileVideo, ChevronDown, ChevronUp, Minus, PlusCircle,
  UploadCloud, Check, Loader2,
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
const CC: Record<VideoProject["color"], {bg:string;border:string;text:string;dot:string}> = {
  cyan:    {bg:"bg-cyan-50/70",    border:"border-cyan-200",    text:"text-cyan-700",    dot:"bg-cyan-500"},
  purple:  {bg:"bg-purple-50/70",  border:"border-purple-200",  text:"text-purple-700",  dot:"bg-purple-500"},
  emerald: {bg:"bg-emerald-50/70", border:"border-emerald-200", text:"text-emerald-700", dot:"bg-emerald-500"},
  amber:   {bg:"bg-amber-50/70",   border:"border-amber-200",   text:"text-amber-700",   dot:"bg-amber-500"},
  rose:    {bg:"bg-rose-50/70",    border:"border-rose-200",    text:"text-rose-700",    dot:"bg-rose-500"},
  sky:     {bg:"bg-sky-50/70",     border:"border-sky-200",     text:"text-sky-700",     dot:"bg-sky-500"},
  indigo:  {bg:"bg-indigo-50/70",  border:"border-indigo-200",  text:"text-indigo-700",  dot:"bg-indigo-500"},
};
const SC: Record<DubStatus, {kh:string;cls:string}> = {
  pending:    {kh:"រង់ចាំ",         cls:"bg-slate-100 text-slate-700 border-slate-300"},
  processing: {kh:"កំពុងដំណើរការ", cls:"bg-sky-50 text-sky-700 border-sky-300"},
  done:       {kh:"រួចរាល់",         cls:"bg-emerald-50 text-emerald-700 border-emerald-300"},
  failed:     {kh:"បរាជ័យ",          cls:"bg-rose-50 text-rose-700 border-rose-300"},
  draft:      {kh:"ព្រាង",            cls:"bg-amber-50 text-amber-800 border-amber-300"},
};
const LS = "voxcpm_video_projects_v2";

function fmt(b: number) {
  if (!b) return "0 B";
  const k = 1024, s = ["B","KB","MB","GB"], i = Math.floor(Math.log(b)/Math.log(k));
  return `${(b/Math.pow(k,i)).toFixed(1)} ${s[i]}`;
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

// ─── Small Components ───────────────────────────────────────────────────────
const Badge: React.FC<{s: DubStatus}> = ({s}) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${SC[s].cls}`}>{SC[s].kh}</span>
);
const Bar: React.FC<{v: number; c: VideoProject["color"]; h?: string}> = ({v, c, h="h-1.5"}) => (
  <div className={`relative w-full ${h} bg-slate-100 border border-slate-200/80 rounded-full overflow-hidden`}>
    <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${CC[c].dot}`} style={{width:`${Math.min(100,v)}%`}}/>
  </div>
);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center"><FileVideo className="w-4 h-4 text-sky-600"/></div>
            <div><h3 className="text-sm font-black text-slate-900">ដាក់វីដេអូចូលគម្រោង</h3><p className="text-[10px] text-slate-500">Attach Video to Project</p></div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-500 hover:text-slate-900 transition-colors"><X className="w-4 h-4"/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) doUpload(f); }}
            onClick={() => !up && ref.current?.click()}
            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all
              ${drag ? "border-sky-500 bg-sky-50/60 scale-[1.01]" : "border-slate-300 hover:border-sky-400 bg-slate-50/60 hover:bg-sky-50/30"}
              ${up ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            <input ref={ref} type="file" accept="video/*,.mp4,.mkv,.avi,.mov,.webm,.flv" hidden
              onChange={e => { const f = e.target.files?.[0]; if (f) doUpload(f); }}/>
            {up ? (
              <div className="flex flex-col items-center gap-2 w-full">
                <Loader2 className="w-8 h-8 text-sky-600 animate-spin"/>
                <p className="text-sm text-slate-700 font-bold">កំពុង Upload... {pct}%</p>
                <div className="w-full max-w-xs bg-slate-200 rounded-full h-2">
                  <div className="h-2 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all" style={{width:`${pct}%`}}/>
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center">
                  <UploadCloud className="w-6 h-6 text-sky-600"/>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-800">🎬 ទាញ &amp; ទម្លាក់វីដេអូ</p>
                  <p className="text-[11px] text-slate-500">ឬចុចដើម្បីជ្រើសរើស (MP4, MKV, AVI, MOV, WebM...)</p>
                </div>
              </>
            )}
          </div>

          {/* divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200"/>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ឬជ្រើសរើសពី Server</span>
            <div className="flex-1 h-px bg-slate-200"/>
          </div>

          {/* search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="ស្វែងរក File..."
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-all"/>
          </div>

          {/* list */}
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
                          : "bg-white border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 cursor-pointer shadow-2xs"}`}
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

        {/* footer */}
        <div className="px-5 py-3 border-t border-slate-200 flex justify-between items-center flex-shrink-0 bg-slate-50">
          <button onClick={loadFiles} className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors">
            <RefreshCw className="w-3.5 h-3.5"/>ផ្ទុកឡើងវិញ
          </button>
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl border border-slate-300 transition-all font-medium">បិទ</button>
        </div>
      </div>
    </div>
  );
};

// ─── Video Row ──────────────────────────────────────────────────────────────
const VRow: React.FC<{
  v: ProjectVideo; c: VideoProject["color"];
  onDel: (id: string) => void;
  onPlay: (v: ProjectVideo) => void;
  onSt: (id: string, s: DubStatus) => void;
}> = ({v, c, onDel, onPlay, onSt}) => (
  <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-50/80 hover:bg-white border border-slate-200/90 rounded-xl group transition-all shadow-2xs">
    <div className="w-7 h-7 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center flex-shrink-0">
      <Film className="w-3.5 h-3.5 text-sky-600"/>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-slate-800 truncate">{v.originalName || v.filename}</p>
      <p className="text-[10px] text-slate-500">{fmt(v.size)}{v.duration ? ` · ${Math.floor(v.duration/60)}m${Math.floor(v.duration%60)}s` : ""}</p>
      {v.dubProgress > 0 && (
        <div className="mt-1 flex items-center gap-1.5">
          <Bar v={v.dubProgress} c={c} h="h-1"/>
          <span className={`text-[10px] font-bold ${CC[c].text} flex-shrink-0`}>{v.dubProgress}%</span>
        </div>
      )}
    </div>
    <select value={v.dubStatus} onClick={e => e.stopPropagation()}
      onChange={e => onSt(v.id, e.target.value as DubStatus)}
      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-700 focus:outline-none hidden sm:block">
      <option value="draft">📝 ព្រាង</option>
      <option value="pending">⏳ រង់ចាំ</option>
      <option value="processing">🔄 កំពុង</option>
      <option value="done">✅ រួច</option>
      <option value="failed">❌ បរាជ័យ</option>
    </select>
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={() => onPlay(v)} title="បើក Dubbing Studio"
        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
        <Play className="w-3.5 h-3.5"/>
      </button>
      <button onClick={() => onDel(v.id)} title="ដកចេញពីគម្រោង"
        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all">
        <Minus className="w-3.5 h-3.5"/>
      </button>
    </div>
  </div>
);

// ─── Project Card ───────────────────────────────────────────────────────────
const PCard: React.FC<{
  p: VideoProject;
  onEdit: (p: VideoProject) => void; onDel: (id: string) => void;
  onFav: (id: string) => void; onAdd: (id: string) => void;
  onDetach: (pid: string, vid: string) => void;
  onLoad: (p: VideoProject, v: ProjectVideo) => void;
  onVSt: (pid: string, vid: string, s: DubStatus) => void;
}> = ({p, onEdit, onDel, onFav, onAdd, onDetach, onLoad, onVSt}) => {
  const c = CC[p.color];
  const [exp, setExp] = useState(false);
  const [menu, setMenu] = useState(false);

  return (
    <div className={`rounded-2xl border ${c.border} bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${c.dot}`} />
            <h3 className="text-sm font-black text-slate-900 truncate">{p.name}</h3>
            {p.isFavorite && <Star className="w-3 h-3 text-amber-500 fill-current flex-shrink-0"/>}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onFav(p.id)} className={`p-1 rounded-lg transition-colors ${p.isFavorite ? "text-amber-500" : "text-slate-400 hover:text-amber-500"}`}>
              {p.isFavorite ? <Star className="w-3.5 h-3.5 fill-current"/> : <StarOff className="w-3.5 h-3.5"/>}
            </button>
            <div className="relative">
              <button onClick={() => setMenu(o => !o)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <MoreVertical className="w-3.5 h-3.5"/>
              </button>
              {menu && (
                <div className="absolute right-0 top-6 z-20 w-36 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1">
                  <button onClick={() => { onEdit(p); setMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"><Edit3 className="w-3.5 h-3.5 text-sky-600"/>កែប្រែ</button>
                  <button onClick={() => { onAdd(p.id); setMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"><PlusCircle className="w-3.5 h-3.5 text-sky-600"/>ដាក់វីដេអូ</button>
                  <div className="border-t border-slate-100 my-0.5"/>
                  <button onClick={() => { onDel(p.id); setMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5"/>លុប</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {p.description && <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">{p.description}</p>}
        {p.series && <span className="text-[10px] px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-slate-600 inline-block mb-2 font-medium">📺 {p.series}{p.episode ? ` · ភាគ ${p.episode}` : ""}</span>}

        <div className="space-y-1 mb-3">
          <div className="flex justify-between">
            <span className="text-[10px] text-slate-500 font-medium">Dubbing Progress</span>
            <span className={`text-[10px] font-black ${c.text}`}>{p.progress}%</span>
          </div>
          <Bar v={p.progress} c={p.color}/>
        </div>

        <div className="flex items-center justify-between">
          <Badge s={p.status}/>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <Film className="w-3 h-3 text-slate-400"/>
            <span className="font-bold text-slate-800">{p.videos.length}</span>វីដេអូ
          </div>
        </div>
      </div>

      {/* accordion */}
      <div className="border-t border-slate-100 bg-slate-50/50">
        <button onClick={() => setExp(e => !e)}
          className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-100/60 transition-colors text-xs text-slate-600 hover:text-slate-900 font-medium">
          <span className="flex items-center gap-1.5">
            <FileVideo className="w-3.5 h-3.5 text-sky-600"/>
            {exp ? "បិទបញ្ជីវីដេអូ" : `វីដេអូ (${p.videos.length})`}
          </span>
          {exp ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
        </button>

        {exp && (
          <div className="px-3 pb-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
            {/* add btn */}
            <button onClick={() => onAdd(p.id)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-sky-300 hover:border-sky-500 text-sky-600 text-xs font-bold bg-white hover:bg-sky-50/50 transition-all shadow-2xs">
              <Plus className="w-3.5 h-3.5"/>ដាក់វីដេអូចូល
            </button>

            {p.videos.length === 0
              ? <div className="text-center py-3 text-[11px] text-slate-400"><Film className="w-5 h-5 mx-auto mb-1 opacity-40 text-slate-400"/>មិនទាន់មីវីដេអូ</div>
              : p.videos.map(v => (
                  <VRow key={v.id} v={v} c={p.color}
                    onDel={id => onDetach(p.id, id)}
                    onPlay={vid => onLoad(p, vid)}
                    onSt={(id, s) => onVSt(p.id, id, s)}/>
                ))
            }
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Project Form ───────────────────────────────────────────────────────────
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center"><FolderKanban className="w-4 h-4 text-sky-600"/></div>
            <div>
              <h3 className="text-sm font-black text-slate-900">{isNew ? "បង្កើតគម្រោងថ្មី" : "កែប្រែគម្រោង"}</h3>
              <p className="text-[10px] text-slate-500">{isNew ? "Create New Project" : "Edit Project"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-500 hover:text-slate-900 transition-colors"><X className="w-4 h-4"/></button>
        </div>

        <div className="p-5 space-y-4 max-h-[68vh] overflow-y-auto">
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">ឈ្មោះគម្រោង *</label>
            <input value={f.name||""} onChange={e => setF(x => ({...x, name: e.target.value}))} placeholder="ឈ្មោះស៊េរីរឿង..."
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-all"/>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">ការពិពណ៌នា</label>
            <textarea value={f.description||""} onChange={e => setF(x => ({...x, description: e.target.value}))} placeholder="ពណ៌នាអំពីគម្រោង..." rows={2}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-all resize-none"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">ពណ៌</label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_OPTIONS.map(c => (
                  <button key={c} onClick={() => setF(x => ({...x, color: c}))}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${CC[c].dot} ${f.color===c ? "border-slate-800 scale-110 ring-2 ring-sky-300" : "border-transparent opacity-60 hover:opacity-100"}`}/>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">អាទិភាព</label>
              <select value={f.priority} onChange={e => setF(x => ({...x, priority: e.target.value as ProjectPriority}))}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500">
                <option value="high">🔴 ខ្ពស់</option>
                <option value="normal">🟡 មធ្យម</option>
                <option value="low">⚪ ទាប</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">ស្ថានភាព</label>
              <select value={f.status} onChange={e => setF(x => ({...x, status: e.target.value as DubStatus}))}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500">
                <option value="draft">📝 ព្រាង</option>
                <option value="pending">⏳ រង់ចាំ</option>
                <option value="processing">🔄 កំពុង</option>
                <option value="done">✅ រួចរាល់</option>
                <option value="failed">❌ បរាជ័យ</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">ស៊េរី</label>
              <input value={f.series||""} onChange={e => setF(x => ({...x, series: e.target.value}))} placeholder="ឈ្មោះស៊េរីរឿង..."
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"/>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">ស្លាក (Tags)</label>
            <div className="flex gap-2">
              <input value={ti} onChange={e => setTi(e.target.value)} onKeyDown={e => e.key==="Enter" && addTag()}
                placeholder="Enter ដើម្បីបន្ថែម..."
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"/>
              <button onClick={addTag} className="px-3 bg-sky-50 border border-sky-200 rounded-lg text-sky-700 hover:bg-sky-100 font-bold"><Plus className="w-3.5 h-3.5"/></button>
            </div>
            {(f.tags||[]).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(f.tags||[]).map(t => (
                  <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-[10px] text-slate-700 font-medium">
                    <Tag className="w-2.5 h-2.5 text-sky-600"/>{t}
                    <button onClick={() => setF(x => ({...x, tags:(x.tags||[]).filter(s=>s!==t)}))} className="hover:text-rose-600 ml-0.5"><X className="w-2.5 h-2.5"/></button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div className={`w-9 h-5 rounded-full border transition-all ${f.isFavorite ? "bg-amber-100 border-amber-300" : "bg-slate-100 border-slate-200"}`}>
              <div className={`w-4 h-4 rounded-full mt-0.5 transition-all ${f.isFavorite ? "translate-x-4 bg-amber-500 shadow" : "translate-x-0.5 bg-slate-400"}`}/>
            </div>
            <input type="checkbox" hidden checked={f.isFavorite||false} onChange={e => setF(x => ({...x, isFavorite: e.target.checked}))}/>
            <span className="text-xs text-slate-600 font-semibold">⭐ ដាក់ស្រឡាញ់ (Favorite)</span>
          </label>
        </div>

        <div className="px-5 py-3.5 border-t border-slate-200 flex gap-2.5 justify-end bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl border border-slate-200 transition-all font-medium">បោះបង់</button>
          <button onClick={doSave} disabled={!f.name?.trim()}
            className="px-5 py-2 text-sm font-bold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white flex items-center gap-2 transition-all shadow-md shadow-sky-500/20">
            <Save className="w-3.5 h-3.5"/>{isNew ? "បង្កើត" : "រក្សាទុក"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main ───────────────────────────────────────────────────────────────────
export const VideoProjectManager: React.FC<VideoProjectManagerProps> = ({onShowToast, onLoadProject}) => {
  const [projects, setProjects] = useState<VideoProject[]>(() => load());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DubStatus|"all">("all");
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

  // ── Video attach/detach ──
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
  }, [projects, search, filter, sortF, sortD])();

  const tv = projects.reduce((a,p) => a+p.videos.length, 0);
  const dv = projects.reduce((a,p) => a+p.videos.filter(v=>v.dubStatus==="done").length, 0);
  const opct = tv>0 ? Math.round(dv/tv*100) : 0;
  const pp = pickId ? projects.find(p => p.id===pickId) : null;

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-800 font-khmer">
      {/* header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 border border-sky-200 flex items-center justify-center shadow-2xs">
              <FolderKanban className="w-4 h-4 text-sky-600"/>
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight">គ្រប់គ្រងគម្រោងវីដេអូ</h1>
              <p className="text-[11px] text-slate-500">រៀបចំ និងតាមដានដំណើរការវីដេអូនីមួយៗ</p>
            </div>
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-sky-500 shadow-2xs transition-all">
            <option value="all">🔵 ទាំងអស់</option>
            <option value="draft">📝 ព្រាង</option>
            <option value="pending">⏳ រង់ចាំ</option>
            <option value="processing">🔄 កំពុង</option>
            <option value="done">✅ រួចរាល់</option>
            <option value="failed">❌ បរាជ័យ</option>
          </select>
          <select value={sortF} onChange={e => setSortF(e.target.value as SortField)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-sky-500 shadow-2xs transition-all">
            <option value="updatedAt">📅 ថ្ងៃថ្មី</option>
            <option value="name">🔤 ឈ្មោះ</option>
            <option value="progress">📊 វឌ្ឍនភាព</option>
            <option value="status">🔘 ស្ថានភាព</option>
          </select>
          <button onClick={() => setSortD(d => d==="asc"?"desc":"asc")}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-2xs transition-all">
            {sortD==="asc" ? <SortAsc className="w-4 h-4"/> : <SortDesc className="w-4 h-4"/>}
          </button>
          <div className="flex rounded-xl overflow-hidden border border-slate-200 shadow-2xs bg-white">
            <button onClick={() => setView("grid")} className={`p-2 transition-colors ${view==="grid"?"bg-sky-50 text-sky-700 font-bold":"bg-white text-slate-500 hover:text-slate-900"}`}><Grid3X3 className="w-4 h-4"/></button>
            <button onClick={() => setView("list")} className={`p-2 transition-colors ${view==="list"?"bg-sky-50 text-sky-700 font-bold":"bg-white text-slate-500 hover:text-slate-900"}`}><List className="w-4 h-4"/></button>
          </div>
        </div>
      </div>

      {/* content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
            <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center">
              <FolderOpen className="w-10 h-10 text-slate-400"/>
            </div>
            <div className="text-center">
              <p className="text-slate-800 font-bold mb-1">{search||filter!=="all" ? "រកមិនឃើញ" : "មិនទាន់មានគម្រោង"}</p>
              <p className="text-slate-500 text-sm">{search||filter!=="all" ? "សាកល្បងស្វែងរកឡើងវិញ" : "ចុច «បង្កើតគម្រោង» ដើម្បីចាប់ផ្តើម!"}</p>
            </div>
            {!search && filter==="all" && (
              <button onClick={() => { setEditP({}); setFormOpen(true); }}
                className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-xl text-sky-700 text-sm font-bold hover:bg-sky-100 transition-all shadow-2xs">
                <Plus className="w-4 h-4"/>បង្កើតគម្រោងដំបូង
              </button>
            )}
          </div>
        ) : (
          <div className={view==="grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
            {list.map(p => (
              <PCard key={p.id} p={p}
                onEdit={x => { setEditP(x); setFormOpen(true); }}
                onDel={id => setDelId(id)}
                onFav={handleFav}
                onAdd={id => setPickId(id)}
                onDetach={handleDetach}
                onLoad={handleLoad}
                onVSt={handleVSt}/>
            ))}
          </div>
        )}
      </div>

      {/* modals */}
      {formOpen && <PForm proj={editP} onSave={handleSave} onClose={() => { setFormOpen(false); setEditP(null); }}/>}
      {pp && (
        <VideoPicker
          attached={pp.videos.map(v => v.filename)}
          onAdd={f => handleAttach(pp.id, f)}
          onClose={() => setPickId(null)}
          toast={onShowToast}/>
      )}
      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-rose-200 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center"><Trash2 className="w-5 h-5 text-rose-600"/></div>
              <div><h3 className="text-sm font-black text-slate-900">លុបគម្រោង?</h3><p className="text-[11px] text-slate-500">វីដេអូក្នុងគម្រោងនឹងត្រូវបានដកផងដែរ!</p></div>
            </div>
            <p className="text-xs text-slate-600 mb-5 bg-rose-50/60 border border-rose-200 rounded-xl p-3">
              ⚠️ <strong className="text-slate-900">"{projects.find(p=>p.id===delId)?.name}"</strong> ({projects.find(p=>p.id===delId)?.videos.length||0} វីដេអូ) នឹងត្រូវបានលុប។
            </p>
            <div className="flex gap-2.5">
              <button onClick={() => setDelId(null)} className="flex-1 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all font-medium">បោះបង់</button>
              <button onClick={() => handleDel(delId)} className="flex-1 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 rounded-xl text-white transition-all shadow-md shadow-rose-600/20">លុប</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoProjectManager;
