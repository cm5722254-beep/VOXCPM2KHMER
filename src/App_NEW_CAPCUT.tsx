import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Scissors, Download,
  Upload, Wand2, Type, Music, Sparkles, Settings,
  Volume2, Mic, Zap, Search, AlignLeft,
  PlusCircle, Trash2, Eye, Unlock,
  Maximize2, ZoomIn, ZoomOut, RotateCcw, FileText,
  Loader2, CheckCircle2, AlertCircle, Folder, Globe,
  User, Users, ChevronDown, Moon,
  LayoutGrid, Film, Image, Layers, Bookmark, List,
  MoreHorizontal, ArrowLeft, ArrowRight, Pencil, Copy,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────

interface DubLine {
  id: string;
  startTime: number;
  endTime: number;
  dubText: string;
  voiceProfile: string;
  status: 'ready' | 'needs_retry' | 'generating' | 'done';
  audioUrl?: string;
}

interface TimelineClip {
  id: string;
  type: 'video' | 'audio';
  name: string;
  startTime: number;
  duration: number;
}

type RecapLength = 'short' | 'medium' | 'long';
type TtsEngine  = 'edge_tts' | 'gemini' | 'save_token';

// ─── Constants ───────────────────────────────────────────────

const VOICES = [
  { id: 'piseth',   name: 'Piseth'   },
  { id: 'kosal',    name: 'Kosal'    },
  { id: 'dara',     name: 'Dara'     },
  { id: 'sreymom',  name: 'Sreymom'  },
  { id: 'channary', name: 'Channary' },
];

// ─── Helpers ─────────────────────────────────────────────────

function fmtTime(sec: number): string {
  const m  = Math.floor(sec / 60);
  const s  = Math.floor(sec % 60);
  const cs = Math.floor((sec % 1) * 100);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
}

// ─── Main ────────────────────────────────────────────────────

const DubberDangPro: React.FC = () => {

  /* upload */
  const [uploadedFile, setUploadedFile] = useState<{filename:string;url:string;name:string}|null>(null);
  const [isUploading,  setIsUploading]  = useState(false);
  const [uploadPct,    setUploadPct]    = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* playback */
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [vol,         setVol]         = useState(100);

  /* dub lines */
  const [dubLines,        setDubLines]        = useState<DubLine[]>([]);
  const [selectedLine,    setSelectedLine]    = useState<string|null>(null);
  const [isTranscribing,  setIsTranscribing]  = useState(false);
  const [isGenAll,        setIsGenAll]        = useState(false);
  const [genPct,          setGenPct]          = useState(0);
  const [ttsEngine,       setTtsEngine]       = useState<TtsEngine>('edge_tts');
  const [targetLang,      setTargetLang]      = useState('km');
  const [defGender,       setDefGender]       = useState<'male'|'female'>('male');
  const [endSync,         setEndSync]         = useState(false);

  /* recap */
  const [recapLen,       setRecapLen]      = useState<RecapLength>('long');
  const [recapLang,      setRecapLang]     = useState('km');
  const [isGenRecap,     setIsGenRecap]    = useState(false);
  const [recapText,      setRecapText]     = useState('');
  const [autoFootage,    setAutoFootage]   = useState(true);
  const [punchlines,     setPunchlines]    = useState(true);
  const [gapMode,        setGapMode]       = useState<'tight'|'natural'|'breathe'>('natural');

  /* timeline */
  const [clips,    setClips]    = useState<TimelineClip[]>([]);
  const [tlZoom,   setTlZoom]   = useState(1);
  const [snapGrid, setSnapGrid] = useState(true);
  const tlRef = useRef<HTMLDivElement>(null);

  /* toast */
  const [toast, setToast] = useState<{msg:string;t:'ok'|'err'|'info'}|null>(null);
  const showToast = useCallback((msg:string, t:'ok'|'err'|'info'='ok') => {
    setToast({msg,t});
    setTimeout(()=>setToast(null), 3000);
  },[]);

  // ── sync video play/pause ──
  useEffect(()=>{
    const v = videoRef.current; if(!v) return;
    if(isPlaying) v.play().catch(()=>setIsPlaying(false)); else v.pause();
  },[isPlaying]);

  useEffect(()=>{
    const v = videoRef.current; if(!v) return;
    v.volume = vol/100;
  },[vol]);

  // ── upload ──
  const openPicker = () => {
    const i = document.createElement('input');
    i.type='file'; i.accept='video/*';
    i.onchange = (e:any) => {
      const file = e.target.files?.[0]; if(!file) return;
      setIsUploading(true); setUploadPct(0);
      const fd = new FormData(); fd.append('mediaFile',file);
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = ev => {
        if(ev.lengthComputable) setUploadPct(Math.round(ev.loaded/ev.total*100));
      };
      xhr.onload = () => {
        setIsUploading(false);
        if(xhr.status===200){
          const r = JSON.parse(xhr.responseText);
          setUploadedFile({filename:r.filename, url:r.url, name:file.name});
          setClips([{id:`v_${Date.now()}`,type:'video',name:file.name,startTime:0,duration:0}]);
          showToast('✅ Upload ជោគជ័យ!');
        } else showToast('❌ Upload failed','err');
      };
      xhr.onerror=()=>{setIsUploading(false);showToast('❌ Error','err');};
      xhr.open('POST','/api/upload'); xhr.send(fd);
    };
    i.click();
  };

  // ── transcribe ──
  const handleTranscribe = async () => {
    if(!uploadedFile){showToast('Upload video ជាមុន!','err');return;}
    setIsTranscribing(true); setDubLines([]);
    try {
      const r = await fetch('/api/transcribe',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({filename:uploadedFile.filename,targetLang})});
      const d = await r.json();
      if(d.lines?.length){
        setDubLines(d.lines.map((l:any,i:number)=>({
          id:`ln_${i}`, startTime:l.start??i*3, endTime:l.end??i*3+2.5,
          dubText:l.text??l.khmer??'', voiceProfile:'piseth', status:'ready' as const,
        })));
        showToast(`✅ ${d.lines.length} lines`);
      } else {
        // demo
        const demo = Array.from({length:6},(_,i)=>({
          id:`ln_${i}`, startTime:i*4, endTime:i*4+3.2,
          dubText:`ឃ្លាខ្មែរ លេខ ${i+1} — ការបកប្រែពាក្យ`, voiceProfile:'piseth', status:'ready' as const,
        }));
        setDubLines(demo); showToast('Demo lines','info');
      }
    } catch { showToast('❌ Transcribe error','err'); }
    finally { setIsTranscribing(false); }
  };

  // ── generate one line ──
  const genLine = async (id:string) => {
    const line = dubLines.find(l=>l.id===id); if(!line) return;
    setDubLines(p=>p.map(l=>l.id===id?{...l,status:'generating'}:l));
    try {
      const r = await fetch('/api/tts/generate',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({text:line.dubText,voiceId:line.voiceProfile,engine:ttsEngine,
          startTime:line.startTime,endTime:line.endTime})});
      const d = await r.json();
      setDubLines(p=>p.map(l=>l.id===id?{...l,status:'done',audioUrl:d.audioUrl}:l));
    } catch {
      setDubLines(p=>p.map(l=>l.id===id?{...l,status:'needs_retry'}:l));
    }
  };

  // ── generate all ──
  const genAll = async () => {
    if(!dubLines.length){showToast('Transcribe ជាមុន!','err');return;}
    setIsGenAll(true); setGenPct(0);
    for(let i=0;i<dubLines.length;i++){
      await genLine(dubLines[i].id);
      setGenPct(Math.round((i+1)/dubLines.length*100));
    }
    setIsGenAll(false); showToast('✅ Voice ទាំងអស់ជោគជ័យ!');
  };

  // ── recap ──
  const genRecap = async () => {
    if(!uploadedFile){showToast('Upload ជាមុន!','err');return;}
    setIsGenRecap(true); setRecapText('');
    try {
      const r = await fetch('/api/recap/generate',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({filename:uploadedFile.filename,length:recapLen,lang:recapLang,
          autoFootage,punchlines,endSync,gapMode})});
      const d = await r.json();
      setRecapText(d.recap??'Recap generated.');
      showToast('✅ Recap ជោគជ័យ!');
    } catch { showToast('❌ Recap error','err'); }
    finally { setIsGenRecap(false); }
  };

  // ── timeline seek ──
  const tlSeek = (e:React.MouseEvent) => {
    const rect=tlRef.current?.getBoundingClientRect(); if(!rect||!duration) return;
    const t=Math.max(0,Math.min((e.clientX-rect.left)/(tlZoom*60),duration));
    setCurrentTime(t); if(videoRef.current) videoRef.current.currentTime=t;
  };

  const seekToLine = (line:DubLine) => {
    setSelectedLine(line.id);
    if(videoRef.current){videoRef.current.currentTime=line.startTime;setCurrentTime(line.startTime);}
  };

  const updateText = (id:string,text:string) =>
    setDubLines(p=>p.map(l=>l.id===id?{...l,dubText:text,status:'ready'}:l));
  const updateVoice = (id:string,v:string) =>
    setDubLines(p=>p.map(l=>l.id===id?{...l,voiceProfile:v,status:'ready'}:l));


  // ════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className="h-screen w-screen flex flex-col bg-[#1a1a2e] text-white overflow-hidden" style={{fontFamily:'Inter,sans-serif'}}>

      {/* ── TOAST ── */}
      {toast && (
        <div className={`fixed top-3 right-3 z-[300] flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-2xl animate-in slide-in-from-top-2 ${
          toast.t==='ok' ? 'bg-emerald-600' : toast.t==='err' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          {toast.t==='ok' && <CheckCircle2 className="w-4 h-4"/>}
          {toast.t==='err' && <AlertCircle className="w-4 h-4"/>}
          {toast.t==='info' && <Zap className="w-4 h-4"/>}
          {toast.msg}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TOP BAR  — matches Dubber Dang exactly
      ══════════════════════════════════════════════════════ */}
      <div className="h-[52px] flex-shrink-0 flex items-center px-3 gap-3 border-b border-white/[0.08]" style={{background:'#16213e'}}>

        {/* Avatar + logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-xs font-black">D</div>
          <div>
            <div className="text-xs font-black leading-none text-white">Dubber <span className="text-orange-400">Dang</span></div>
            <div className="text-[9px] text-violet-300 leading-none mt-0.5">● Clone អត្ថន័យ Pro</div>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="flex items-center gap-1 text-[11px] ml-2">
          <span className="px-2 py-1 bg-white/10 rounded text-gray-300 cursor-pointer hover:bg-white/15 transition-colors">TIKTOK / REELS / SHORTS</span>
          <span className="px-2 py-1 text-gray-500 cursor-pointer hover:bg-white/5 rounded transition-colors">#16</span>
          <span className="px-2 py-1 text-gray-500 cursor-pointer hover:bg-white/5 rounded transition-colors">Sour</span>
          <div className="w-px h-4 bg-white/10 mx-1"/>
          <span className="px-2 py-1 bg-white/10 rounded text-gray-300 cursor-pointer">100%</span>
          <div className="w-px h-4 bg-white/10 mx-1"/>
          {uploadedFile && <span className="px-2 py-1 text-violet-300 bg-violet-500/10 rounded max-w-[140px] truncate">{uploadedFile.name}</span>}
        </div>

        {/* Robot mascot center */}
        <div className="flex-1 flex justify-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 relative">
            <span className="text-lg">🤖</span>
            <span className="absolute -top-1 -right-1 text-xs">❤️</span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={openPicker} className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-500 rounded-lg text-xs font-semibold transition-all shadow-lg shadow-pink-500/25">
            <Upload className="w-3.5 h-3.5"/>Upload a Folder
          </button>
          <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"><Folder className="w-4 h-4"/></button>
          {/* Token counter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg text-xs text-yellow-300 font-semibold">
            <span>🪙</span>
            <span>996,588</span>
          </div>
          {/* EN flag */}
          <div className="flex items-center gap-1 px-2 py-1.5 bg-white/5 rounded-lg text-xs text-gray-300">
            <span>🇺🇸</span><span>EN</span>
          </div>
          <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"><Layers className="w-4 h-4"/></button>
          <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"><Moon className="w-4 h-4"/></button>
          <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"><Settings className="w-4 h-4"/></button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 rounded-lg text-xs font-bold transition-all shadow-lg shadow-violet-500/20">
            <Download className="w-3.5 h-3.5"/>Export
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MAIN BODY  (4 columns + bottom timeline)
      ══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── FAR-LEFT: Icon rail ── */}
        <div className="w-[48px] flex-shrink-0 flex flex-col items-center pt-2 gap-1 border-r border-white/[0.06]" style={{background:'#0f3460'}}>
          {[
            {icon:LayoutGrid, tip:'Dashboard'},
            {icon:Film,       tip:'Media'},
            {icon:Mic,        tip:'Voice'},
            {icon:Music,      tip:'Audio'},
            {icon:Type,       tip:'Text'},
            {icon:Image,      tip:'Effects'},
            {icon:Layers,     tip:'Layers'},
            {icon:Bookmark,   tip:'Saved'},
            {icon:List,       tip:'Queue'},
          ].map(({icon:Icon,tip}) => (
            <button key={tip} title={tip}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all">
              <Icon className="w-4 h-4"/>
            </button>
          ))}
          <div className="flex-1"/>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all mb-2">
            <Settings className="w-4 h-4"/>
          </button>
        </div>

        {/* ── LEFT: Video panel ── */}
        <div className="w-[270px] flex-shrink-0 flex flex-col border-r border-white/[0.06]" style={{background:'#16213e'}}>

          {/* Mini toolbar */}
          <div className="h-9 flex-shrink-0 flex items-center gap-1 px-2 border-b border-white/[0.06]">
            {[ArrowLeft,ArrowRight,Scissors,RotateCcw,Maximize2,Film,Image,Sparkles,Wand2,Trash2,Layers,MoreHorizontal].map((Icon,i)=>(
              <button key={i} className="w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-white/10 transition-all flex-shrink-0">
                <Icon className="w-3.5 h-3.5"/>
              </button>
            ))}
          </div>

          {/* Video canvas */}
          <div className="relative flex-shrink-0 bg-black" style={{height:'220px'}}>
            {uploadedFile ? (
              <video ref={videoRef} src={uploadedFile.url}
                className="w-full h-full object-contain"
                playsInline
                onLoadedMetadata={e=>{
                  const d=(e.target as HTMLVideoElement).duration;
                  if(isFinite(d)&&d>0){setDuration(d);setClips(p=>p.map((c,i)=>i===0?{...c,duration:d}:c));}
                }}
                onTimeUpdate={e=>setCurrentTime((e.target as HTMLVideoElement).currentTime)}
                onEnded={()=>setIsPlaying(false)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer group" onClick={openPicker}>
                <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-violet-500/20 border border-white/10 flex items-center justify-center transition-all">
                  {isUploading ? <Loader2 className="w-6 h-6 text-violet-400 animate-spin"/> : <Upload className="w-5 h-5 text-gray-500 group-hover:text-violet-400"/>}
                </div>
                <p className="text-xs text-gray-400 group-hover:text-white transition-colors">
                  {isUploading?`${uploadPct}%...`:'Drop a TikTok, Reels or Shorts video'}
                </p>
              </div>
            )}
          </div>

          {/* Seek bar + time */}
          <div className="flex-shrink-0 px-3 pt-1.5 pb-1">
            <div className="relative w-full h-1.5 bg-white/10 rounded-full cursor-pointer" onClick={e=>{
              const rect=e.currentTarget.getBoundingClientRect();
              const t=(e.clientX-rect.left)/rect.width*duration;
              setCurrentTime(t); if(videoRef.current) videoRef.current.currentTime=t;
            }}>
              <div className="absolute left-0 top-0 h-full bg-violet-500 rounded-full" style={{width:`${duration?currentTime/duration*100:0}%`}}/>
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-violet-400 rounded-full shadow border-2 border-white" style={{left:`${duration?currentTime/duration*100:0}%`, transform:'translate(-50%,-50%)'}}/>
            </div>
            <div className="flex items-center justify-between mt-1 text-[10px] text-gray-500">
              <span>{fmtTime(currentTime)}</span>
              <div className="flex items-center gap-2">
                <select className="bg-transparent text-gray-400 outline-none text-[10px] cursor-pointer">
                  <option>1x</option><option>1.25x</option><option>1.5x</option><option>2x</option>
                </select>
                <Volume2 className="w-3 h-3"/>
              </div>
              <span>{fmtTime(duration)}</span>
            </div>
          </div>

          {/* Playback controls row */}
          <div className="flex-shrink-0 flex items-center justify-center gap-3 py-1.5 border-t border-white/[0.05]">
            <button onClick={()=>{if(videoRef.current){videoRef.current.currentTime=0;setCurrentTime(0);}}} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 transition-colors"><SkipBack className="w-4 h-4"/></button>
            <button onClick={()=>setIsPlaying(p=>!p)} className="w-9 h-9 bg-violet-600 hover:bg-violet-500 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/30 transition-all">
              {isPlaying?<Pause className="w-4 h-4"/>:<Play className="w-4 h-4 ml-0.5"/>}
            </button>
            <button className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 transition-colors"><SkipForward className="w-4 h-4"/></button>
          </div>

          {/* Show in folder */}
          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 border-t border-white/[0.05]">
            {uploadedFile ? (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                <CheckCircle2 className="w-3 h-3"/>
                <span className="truncate">{uploadedFile.name}</span>
              </div>
            ) : (
              <span className="text-[10px] text-gray-500">Drop a TikTok, Reels or Shorts video anywhere to ...</span>
            )}
            <div className="flex-1"/>
            <button className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors flex-shrink-0">Show in folder</button>
          </div>
        </div>


        {/* ── CENTER: Dialogue Editor ── */}
        <div className="flex-1 min-w-0 flex flex-col border-r border-white/[0.06]" style={{background:'#0d1117'}}>

          {/* Dialogue header */}
          <div className="flex-shrink-0 px-4 pt-3 border-b border-white/[0.06]">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-bold">Dialogue</div>
                <div className="text-2xl font-black tracking-tight" style={{color:'#a78bfa'}}>Khmer dub</div>
              </div>

              {/* Transcribe controls */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] text-gray-300 transition-colors">
                  <Sparkles className="w-3 h-3 text-violet-400"/>Gemini 3.5-transcribe
                </button>
                <button className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[11px] text-gray-300 transition-colors">Gemini</button>
                <button onClick={()=>setTtsEngine('save_token')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${ttsEngine==='save_token'?'bg-orange-500 text-white shadow-lg shadow-orange-500/25':'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
                  Save Token
                </button>
                <div className="flex items-center gap-1 px-2 py-1.5 bg-white/5 rounded-lg text-[11px]">
                  <Globe className="w-3 h-3 text-gray-400"/>
                  <select value={targetLang} onChange={e=>setTargetLang(e.target.value)} className="bg-transparent text-gray-300 outline-none cursor-pointer text-[11px]">
                    <option value="km">Khmer</option><option value="en">English</option><option value="zh">Chinese</option>
                  </select>
                </div>
                <button onClick={handleTranscribe} disabled={!uploadedFile||isTranscribing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-[11px] font-bold transition-all shadow-lg shadow-violet-500/20">
                  {isTranscribing?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Mic className="w-3.5 h-3.5"/>}
                  {isTranscribing?'...':'Transcribe'}
                </button>
              </div>
            </div>

            {/* Sub-toolbar */}
            <div className="flex items-center gap-2 pb-2 text-[11px] flex-wrap">
              <button className="flex items-center gap-1 px-2 py-1 bg-violet-500/15 text-violet-300 border border-violet-500/25 rounded-lg hover:bg-violet-500/25 transition-colors">
                <PlusCircle className="w-3 h-3"/>Add Text
              </button>
              <button className="p-1 hover:bg-white/5 rounded text-gray-500 transition-colors"><Pencil className="w-3.5 h-3.5"/></button>
              <button className="p-1 hover:bg-white/5 rounded text-gray-500 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
              <div className="w-px h-4 bg-white/10"/>
              <button className="p-1 hover:bg-white/5 rounded text-gray-500 transition-colors"><Search className="w-3.5 h-3.5"/></button>
              <div className="w-px h-4 bg-white/10"/>
              <span className="text-gray-600 cursor-pointer hover:text-gray-400">A-</span>
              <span className="text-gray-300 font-bold px-1">14</span>
              <span className="text-gray-600 cursor-pointer hover:text-gray-400">A+</span>
              <div className="w-px h-4 bg-white/10"/>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-3 h-3 accent-violet-500"/>
                <span className="text-gray-400">Follow playback</span>
              </label>
              <div className="w-px h-4 bg-white/10"/>
              <button onClick={()=>setDefGender('male')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all ${defGender==='male'?'bg-blue-500/20 text-blue-300 border border-blue-500/30':'bg-white/5 text-gray-500 hover:bg-white/10'}`}>
                <User className="w-3 h-3"/>Male
              </button>
              <button onClick={()=>setDefGender('female')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all ${defGender==='female'?'bg-pink-500/20 text-pink-300 border border-pink-500/30':'bg-white/5 text-gray-500 hover:bg-white/10'}`}>
                <User className="w-3 h-3"/>Female
              </button>
              <div className="w-px h-4 bg-white/10"/>
              <button className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 text-gray-500 hover:bg-white/10 transition-colors">
                <Users className="w-3 h-3"/>Detect Speakers
              </button>
              <div className="flex-1"/>
              <span className="text-gray-600 text-[10px]">
                {selectedLine ? `${dubLines.findIndex(l=>l.id===selectedLine)+1} / ${dubLines.length}` : 'no line selected'}
              </span>
            </div>
          </div>

          {/* Speaker warning */}
          {dubLines.length===0&&!isTranscribing && (
            <div className="mx-4 mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 text-[11px] text-yellow-300 flex-shrink-0">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0"/>
              <span>Speakers not separated yet</span>
              <div className="flex-1"/>
              <button className="flex items-center gap-1 text-violet-300 hover:text-violet-200">
                <Mic className="w-3 h-3"/>Clone voices
              </button>
            </div>
          )}

          {/* Table body */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {dubLines.length===0&&!isTranscribing ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <AlignLeft className="w-8 h-8 text-gray-600"/>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400 font-medium">Upload ហើយចុច Transcribe</p>
                  <p className="text-xs text-gray-600 mt-1">AI generate Khmer dub text ស្វ័យប្រវត្តិ</p>
                </div>
                <button onClick={handleTranscribe} disabled={!uploadedFile}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-bold transition-all">
                  <Mic className="w-4 h-4"/>Transcribe
                </button>
              </div>
            ) : isTranscribing ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin"/>
                <p className="text-sm text-gray-300">កំពុង Transcribe...</p>
              </div>
            ) : (
              <>
                {/* Column headers */}
                <div className="sticky top-0 z-10 grid text-[10px] text-gray-600 uppercase tracking-wider font-bold border-b border-white/[0.05]"
                  style={{background:'#0d1117', gridTemplateColumns:'28px 68px 68px 1fr 156px 96px'}}>
                  <div className="px-2 py-2"><input type="checkbox" className="w-3 h-3 accent-violet-500"/></div>
                  <div className="py-2">Start</div>
                  <div className="py-2">End</div>
                  <div className="py-2">Dub Text</div>
                  <div className="py-2">Voice Profile</div>
                  <div className="py-2">Audio</div>
                </div>

                {dubLines.map(line=>(
                  <div key={line.id} onClick={()=>seekToLine(line)}
                    className={`grid items-start border-b border-white/[0.04] hover:bg-white/[0.025] cursor-pointer transition-colors group ${
                      selectedLine===line.id?'bg-violet-500/[0.08] border-l-2 border-l-violet-500':''
                    }`}
                    style={{gridTemplateColumns:'28px 68px 68px 1fr 156px 96px'}}>

                    {/* Checkbox */}
                    <div className="px-2 py-3 flex items-start pt-3.5">
                      <input type="checkbox" className="w-3 h-3 accent-violet-500" onClick={e=>e.stopPropagation()}/>
                    </div>

                    {/* Start */}
                    <div className="py-3 text-[11px] text-gray-400 font-mono">{fmtTime(line.startTime)}</div>

                    {/* End */}
                    <div className="py-3 text-[11px] text-gray-400 font-mono">{fmtTime(line.endTime)}</div>

                    {/* Dub text */}
                    <div className="py-2 pr-3">
                      <textarea value={line.dubText}
                        onChange={e=>updateText(line.id,e.target.value)}
                        onClick={e=>e.stopPropagation()}
                        rows={2}
                        className="w-full bg-transparent text-[11px] text-gray-200 resize-none outline-none focus:bg-white/[0.04] rounded px-1.5 py-1 leading-relaxed"
                        style={{fontFamily:'Noto Sans Khmer, serif'}}
                        placeholder="ដំណើរ dub text..."
                      />
                    </div>

                    {/* Voice profile */}
                    <div className="py-2.5 pr-2">
                      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white/5 border border-white/[0.08] rounded-lg hover:border-violet-500/40 transition-colors">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex-shrink-0"/>
                        <select value={line.voiceProfile} onChange={e=>{e.stopPropagation();updateVoice(line.id,e.target.value);}}
                          onClick={e=>e.stopPropagation()}
                          className="bg-transparent text-[11px] text-gray-300 outline-none cursor-pointer flex-1 min-w-0">
                          {VOICES.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                        <ChevronDown className="w-3 h-3 text-gray-600 flex-shrink-0"/>
                      </div>
                    </div>

                    {/* Audio */}
                    <div className="py-2.5 pr-2 flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        line.status==='done'?'bg-emerald-400':
                        line.status==='generating'?'bg-yellow-400 animate-pulse':
                        line.status==='needs_retry'?'bg-red-400':'bg-gray-600'
                      }`}/>
                      {line.audioUrl ? (
                        <button onClick={e=>{e.stopPropagation();new Audio(line.audioUrl).play();}}
                          className="p-1.5 bg-violet-500/15 hover:bg-violet-500/30 rounded-lg transition-colors">
                          <Play className="w-3 h-3 text-violet-300"/>
                        </button>
                      ) : (
                        <button onClick={e=>{e.stopPropagation();genLine(line.id);}} disabled={line.status==='generating'}
                          className="p-1.5 bg-white/5 hover:bg-violet-500/20 rounded-lg transition-colors disabled:opacity-50">
                          {line.status==='generating'
                            ?<Loader2 className="w-3 h-3 text-yellow-400 animate-spin"/>
                            :<Zap className="w-3 h-3 text-gray-500"/>
                          }
                        </button>
                      )}
                      <button onClick={e=>{e.stopPropagation();genLine(line.id);}}
                        className="p-1 hover:bg-white/5 rounded transition-colors opacity-0 group-hover:opacity-100">
                        <RotateCcw className="w-3 h-3 text-gray-600"/>
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Bottom Generate bar */}
          {dubLines.length>0 && (
            <div className="flex-shrink-0 border-t border-white/[0.06] px-4 py-2 flex items-center gap-3" style={{background:'#111827'}}>
              <div className="flex items-center gap-3 text-[11px] text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"/>Ready</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>Needs a retry</span>
              </div>
              <div className="flex-1"/>
              <span className="text-[11px] text-gray-500">Auto-Fit: <span className="text-violet-300 font-bold">Med</span></span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={endSync} onChange={e=>setEndSync(e.target.checked)} className="w-3 h-3 accent-violet-500"/>
                <span className="text-[11px] text-gray-400 font-bold">END SYNC</span>
              </label>
              <button onClick={genAll} disabled={isGenAll}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-full text-[11px] font-black transition-all shadow-lg shadow-cyan-500/20">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Mic className="w-3 h-3"/>
                </div>
                {isGenAll?`${genPct}%`:'Generate Voice'}
              </button>
              <span className="text-[11px] text-gray-500">{dubLines.filter(l=>l.status==='done').length} / {dubLines.length}</span>
            </div>
          )}
        </div>


        {/* ── RIGHT: RECAP panel ── */}
        <div className="w-[270px] flex-shrink-0 flex flex-col overflow-hidden" style={{background:'#16213e'}}>

          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-400"/>
              <span className="text-sm font-black tracking-wide text-white">RECAP</span>
            </div>
            <button className="p-1 hover:bg-white/5 rounded transition-colors text-gray-500"><Maximize2 className="w-3.5 h-3.5"/></button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">

            {/* Language */}
            <select value={recapLang} onChange={e=>setRecapLang(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] text-gray-300 outline-none focus:border-violet-500 cursor-pointer">
              <option value="km">Khmer</option>
              <option value="en">English</option>
              <option value="zh">Chinese</option>
            </select>

            {/* Recap Length */}
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">Recap Length</div>
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  {id:'short',  label:'Short',  sub:'up to 3 min\nShorts · TikTok\nReels'},
                  {id:'medium', label:'Medium', sub:'up to 8 min\nFacebook'},
                  {id:'long',   label:'Long',   sub:'8-15 min\nYouTube mid-\nrolls'},
                ] as {id:RecapLength;label:string;sub:string}[]).map(o=>(
                  <button key={o.id} onClick={()=>setRecapLen(o.id)}
                    className={`p-2 rounded-lg text-left transition-all border ${
                      recapLen===o.id
                        ?'bg-violet-500/20 border-violet-400/40 text-violet-300'
                        :'bg-white/5 border-white/[0.07] text-gray-500 hover:bg-white/10 hover:text-gray-300'
                    }`}>
                    <div className={`text-[11px] font-bold ${recapLen===o.id?'text-violet-300':'text-gray-300'}`}>{o.label}</div>
                    <div className="text-[9px] text-gray-600 mt-0.5 leading-tight whitespace-pre-line">{o.sub}</div>
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-gray-600 mt-2 leading-relaxed">
                About 0:30 of narration for this video — YouTube mid-rolls.
              </p>
            </div>

            {/* Toggles */}
            <div className="space-y-2.5">
              {[
                {label:'Also recommend which original footage to show', val:autoFootage, set:setAutoFootage},
                {label:'Keep a few original lines as punchlines', val:punchlines, set:setPunchlines},
              ].map(({label,val,set})=>(
                <div key={label} className="flex items-start justify-between gap-3">
                  <span className="text-[11px] text-gray-400 leading-snug flex-1">{label}</span>
                  <button onClick={()=>set((p:boolean)=>!p)}
                    className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${val?'bg-violet-600':'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${val?'translate-x-4':'translate-x-0.5'}`}/>
                  </button>
                </div>
              ))}
            </div>

            {/* Narration Pace */}
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Narration Pace</div>
              <div className="text-[11px] text-gray-400 bg-white/[0.04] rounded-lg px-3 py-2 leading-relaxed">
                <span className="text-violet-300 font-semibold">Auto-Fill Medium</span> speeds a long line up to fit its slot.
              </div>
            </div>

            <div className="text-[11px] text-gray-400 bg-white/[0.04] rounded-lg px-3 py-2 leading-relaxed">
              <span className="text-orange-300 font-semibold">End sync is off:</span> a short line leaves air before the next one.
            </div>

            {/* Cut By */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Cut By</div>
                <div className="flex gap-1">
                  <button className="px-2 py-0.5 text-[10px] bg-violet-500/15 text-violet-300 border border-violet-500/25 rounded font-semibold">Match clips</button>
                  <button className="px-2 py-0.5 text-[10px] bg-white/5 text-gray-500 rounded hover:bg-white/10 transition-colors">Silence</button>
                </div>
              </div>
              <p className="text-[10px] text-gray-600 leading-relaxed">
                Keeps only the footage under the subtitle lines, drops every unspoken section between them, and closes the clips up side by side.
              </p>
            </div>

            {/* Gap Between Clips */}
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">Gap Between Clips</div>
              <div className="flex gap-1">
                {(['tight','natural','breathe'] as const).map(g=>(
                  <button key={g} onClick={()=>setGapMode(g)}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg capitalize transition-all ${
                      gapMode===g?'bg-violet-500/20 text-violet-300 border border-violet-500/30':'bg-white/5 text-gray-500 hover:bg-white/10'
                    }`}>{g}</button>
                ))}
              </div>
            </div>

            {/* Cut video button */}
            <button className="w-full py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-violet-500/30 rounded-lg text-[11px] text-gray-400 hover:text-white transition-all flex items-center justify-center gap-2">
              <Scissors className="w-3.5 h-3.5 text-violet-400"/>Cut the video to match
            </button>

            {/* Clear + Generate */}
            <div className="flex gap-2">
              <button onClick={()=>setRecapText('')}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/[0.08] rounded-lg text-[11px] text-gray-400 transition-all">
                Clear
              </button>
              <button onClick={genRecap} disabled={!uploadedFile||isGenRecap}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg text-[11px] font-black transition-all shadow-lg shadow-violet-500/20">
                {isGenRecap?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Sparkles className="w-3.5 h-3.5"/>}
                Generate Recap
              </button>
            </div>

            {recapText && (
              <textarea value={recapText} onChange={e=>setRecapText(e.target.value)} rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-gray-300 resize-none outline-none focus:border-violet-500 leading-relaxed"
                style={{fontFamily:'Noto Sans Khmer, serif'}}
              />
            )}

            {/* Episodes */}
            <div className="border-t border-white/[0.06] pt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Episodes</span>
              </div>
              <p className="text-[10px] text-gray-600 text-center py-3">No episodes yet</p>
            </div>
          </div>
        </div>

      </div>{/* end main body */}

      {/* ══════════════════════════════════════════════════════
          BOTTOM: Professional Timeline
      ══════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 flex flex-col border-t border-white/[0.08]" style={{height:'160px', background:'#0f172a'}}>

        {/* Timeline toolbar */}
        <div className="h-9 flex-shrink-0 flex items-center gap-3 px-3 border-b border-white/[0.06]" style={{background:'#1e293b'}}>
          {/* Left-side edit tools */}
          <div className="flex items-center gap-1">
            {[
              {icon:Layers,   tip:'Tracks'},
              {icon:Scissors, tip:'Split'},
              {icon:Trash2,   tip:'Delete'},
              {icon:Copy,     tip:'Duplicate'},
              {icon:RotateCcw,tip:'Undo'},
            ].map(({icon:Icon,tip})=>(
              <button key={tip} title={tip} className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                <Icon className="w-3.5 h-3.5"/>
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-white/10"/>

          {/* Playback */}
          <div className="flex items-center gap-1">
            <button onClick={()=>{if(videoRef.current){videoRef.current.currentTime=0;setCurrentTime(0);}}} className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-white/10 transition-all"><SkipBack className="w-3.5 h-3.5"/></button>
            <button onClick={()=>setIsPlaying(p=>!p)}
              className="w-7 h-7 bg-violet-600 hover:bg-violet-500 rounded-full flex items-center justify-center transition-all shadow-md shadow-violet-500/25">
              {isPlaying?<Pause className="w-3.5 h-3.5"/>:<Play className="w-3.5 h-3.5 ml-0.5"/>}
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-white/10 transition-all"><SkipForward className="w-3.5 h-3.5"/></button>
          </div>

          <div className="w-px h-5 bg-white/10"/>

          {/* Pitch / Vol / Speed labels */}
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            <span>PITCH <span className="text-gray-400">0 st</span></span>
            <span>VOL <span className="text-gray-400">100%</span></span>
            <span>SPEED <span className="text-gray-400">1.00×</span></span>
          </div>

          <div className="flex-1"/>

          {/* Zoom */}
          <div className="flex items-center gap-1">
            <button onClick={()=>setTlZoom(z=>Math.max(0.2,parseFloat((z-0.2).toFixed(1))))} className="p-1 text-gray-500 hover:text-white"><ZoomOut className="w-3.5 h-3.5"/></button>
            <input type="range" min={0.2} max={4} step={0.1} value={tlZoom} onChange={e=>setTlZoom(parseFloat(e.target.value))} className="w-16 h-1 accent-violet-500"/>
            <button onClick={()=>setTlZoom(z=>Math.min(4,parseFloat((z+0.2).toFixed(1))))} className="p-1 text-gray-500 hover:text-white"><ZoomIn className="w-3.5 h-3.5"/></button>
          </div>
          <button className="p-1 text-gray-500 hover:text-white transition-colors"><Maximize2 className="w-3.5 h-3.5"/></button>
        </div>

        {/* Tracks area */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Track labels */}
          <div className="w-20 flex-shrink-0 border-r border-white/[0.06]" style={{background:'#1e293b'}}>
            <div className="h-5 border-b border-white/[0.05]"/>
            {[
              {label:'Video', color:'text-emerald-400'},
              {label:'Audio', color:'text-purple-400'},
            ].map(tr=>(
              <div key={tr.label} className="h-[46px] border-b border-white/[0.04] flex items-center justify-between px-2">
                <span className={`text-[10px] font-bold ${tr.color}`}>{tr.label}</span>
                <div className="flex gap-0.5">
                  <button className="w-4 h-4 flex items-center justify-center rounded text-gray-600 hover:text-gray-400"><Eye className="w-3 h-3"/></button>
                  <button className="w-4 h-4 flex items-center justify-center rounded text-gray-600 hover:text-gray-400"><Unlock className="w-3 h-3"/></button>
                </div>
              </div>
            ))}
          </div>

          {/* Scrollable timeline */}
          <div ref={tlRef} className="flex-1 overflow-x-auto overflow-y-hidden relative" onClick={tlSeek} style={{cursor:'crosshair'}}>
            <div style={{width:`${Math.max(800,(duration||60)*tlZoom*60)}px`, position:'relative', minWidth:'100%'}}>

              {/* Time ruler */}
              <div className="h-5 sticky top-0 z-10 border-b border-white/[0.05] relative" style={{background:'#0f172a'}}>
                {Array.from({length:Math.ceil((duration||60)/5)+1}).map((_,i)=>(
                  <div key={i} className="absolute top-0 flex flex-col" style={{left:`${i*5*tlZoom*60}px`}}>
                    <div className="w-px h-2.5 bg-white/20"/>
                    <span className="text-[9px] text-gray-600 pl-0.5">{fmtTime(i*5)}</span>
                  </div>
                ))}
                {Array.from({length:Math.ceil(duration||60)+1}).map((_,i)=>(
                  i%5!==0&&<div key={`t${i}`} className="absolute top-0 w-px h-1.5 bg-white/[0.08]" style={{left:`${i*tlZoom*60}px`}}/>
                ))}
              </div>

              {/* Video track */}
              <div className="h-[46px] border-b border-white/[0.04] relative" style={{background:'rgba(16,24,40,0.8)'}}>
                {clips.filter(c=>c.type==='video').map(clip=>(
                  <div key={clip.id}
                    className="absolute top-1 rounded-md border border-emerald-500/60 overflow-hidden cursor-pointer hover:brightness-110 transition-all"
                    style={{
                      left:`${clip.startTime*tlZoom*60}px`,
                      width:`${Math.max(40,clip.duration*tlZoom*60)}px`,
                      height:'36px',
                      background:'linear-gradient(135deg, #064e3b 0%, #065f46 100%)'
                    }}>
                    <div className="px-2 h-full flex items-center">
                      <span className="text-[10px] text-emerald-200 truncate font-medium">{clip.name}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Audio/Dub track */}
              <div className="h-[46px] relative" style={{background:'rgba(16,24,40,0.8)'}}>
                {dubLines.filter(l=>l.status==='done').map(line=>(
                  <div key={line.id} onClick={e=>{e.stopPropagation();seekToLine(line);}}
                    className={`absolute top-1 rounded-md border overflow-hidden cursor-pointer hover:brightness-110 transition-all ${
                      selectedLine===line.id?'border-purple-300':'border-purple-600/60'
                    }`}
                    style={{
                      left:`${line.startTime*tlZoom*60}px`,
                      width:`${Math.max(20,(line.endTime-line.startTime)*tlZoom*60)}px`,
                      height:'36px',
                      background:'linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)'
                    }}>
                    <div className="px-1.5 h-full flex items-center">
                      <span className="text-[9px] text-purple-200 truncate" style={{fontFamily:'Noto Sans Khmer,serif'}}>{line.dubText.substring(0,16)}</span>
                    </div>
                  </div>
                ))}
                {/* pending audio lines (lighter shade) */}
                {dubLines.filter(l=>l.status!=='done').map(line=>(
                  <div key={`p_${line.id}`}
                    className="absolute top-2 rounded border border-purple-800/40 overflow-hidden opacity-40"
                    style={{
                      left:`${line.startTime*tlZoom*60}px`,
                      width:`${Math.max(16,(line.endTime-line.startTime)*tlZoom*60)}px`,
                      height:'28px',
                      background:'rgba(88,28,135,0.4)'
                    }}>
                  </div>
                ))}
              </div>

              {/* Playhead */}
              {duration>0 && (
                <div className="absolute top-0 bottom-0 pointer-events-none z-20"
                  style={{left:`${currentTime*tlZoom*60}px`}}>
                  <div className="w-0.5 h-full bg-red-500"/>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0"
                    style={{borderLeft:'5px solid transparent',borderRight:'5px solid transparent',borderTop:'8px solid #ef4444'}}/>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DubberDangPro;
