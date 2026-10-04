import React, { useEffect, useRef, useState } from 'react';
import * as DM from '@radix-ui/react-dropdown-menu';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Camera, Settings2, Upload, Check, Film, Loader2, Scan, Minus, Plus, RotateCcw,
} from 'lucide-react';
import { useBridge, mediaUrl } from '../StudioContext';
import { useStudio, fmtTime } from '../store/studioStore';
import { usePlaybackEngine, transport } from '../hooks/usePlaybackEngine';
import { audioEngine } from '../services/audioEngine';
import { gradeToFilter } from '../services/color';
import { IconBtn, Tip, EmptyState } from '../ui/primitives';

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

const LevelBars: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const el = ref.current;
      if (el) {
        const lv = audioEngine.level('master');
        Array.from(el.children).forEach((c, i) => {
          const h = Math.max(8, Math.min(100, lv * 140 * (0.55 + Math.abs(Math.sin(Date.now() / 140 + i)) * 0.5)));
          (c as HTMLElement).style.height = `${h}%`;
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div ref={ref} className="flex items-end gap-[2px] h-4 w-7" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => <i key={i} className="flex-1 rounded-sm bg-[var(--kdp-cyan)] opacity-80 transition-[height] duration-75" />)}
    </div>
  );
};

export const VideoPreview: React.FC = () => {
  const b = useBridge();
  const st = useStudio();
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [meta, setMeta] = useState({ w: 0, h: 0 });
  const [scrub, setScrub] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number; moved: boolean } | null>(null);

  const toggleFitMode = () => {
    if (fitMode === 'cover') {
      setFitMode('contain');
      setZoomScale(1.0);
      setPanOffset({ x: 0, y: 0 });
    } else {
      setFitMode('cover');
      setZoomScale(1.0);
      setPanOffset({ x: 0, y: 0 });
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoomScale > 1.05 || fitMode === 'cover') {
      panStartRef.current = { startX: e.clientX, startY: e.clientY, initX: panOffset.x, initY: panOffset.y, moved: false };
      setIsPanning(true);
      try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch (_) {}
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!panStartRef.current) return;
    const dx = e.clientX - panStartRef.current.startX;
    const dy = e.clientY - panStartRef.current.startY;
    if (Math.hypot(dx, dy) > 4) {
      panStartRef.current.moved = true;
      setPanOffset({ x: panStartRef.current.initX + dx, y: panStartRef.current.initY + dy });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const moved = panStartRef.current?.moved;
    panStartRef.current = null;
    setIsPanning(false);
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch (_) {}
    if (!moved) transport.toggle();
  };

  const useOutput = st.previewSource === 'output' && !!b.outputVideo;
  const src = useOutput ? b.outputVideo! : mediaUrl(b);
  usePlaybackEngine(b.videoRef, b.segments, b.cleanBgmUrl, !useOutput);

  useEffect(() => { transport.video = b.videoRef.current; });
  useEffect(() => { if (b.videoRef.current) b.videoRef.current.playbackRate = st.rate; }, [st.rate, src]);

  const t = scrub ?? st.currentTime;
  const dur = st.duration || 0;
  const cur = b.segments.find((s) => t >= s.start_time && t <= s.end_time);
  const ss = b.subtitleStyle;
  const res = meta.h ? (meta.h >= 2100 ? '4K' : meta.h >= 1400 ? '1440P' : meta.h >= 1000 ? '1080P' : meta.h >= 700 ? '720P' : `${meta.h}P`) : '—';
  const aspect = meta.w && meta.h ? (Math.abs(meta.w / meta.h - 16 / 9) < 0.05 ? '16:9' : Math.abs(meta.w / meta.h - 9 / 16) < 0.05 ? '9:16' : `${(meta.w / meta.h).toFixed(2)}`) : b.videoEffects.aspectRatio;
  const quality = st.previewQuality;
  const qScale = quality === 'half' ? 0.5 : quality === 'quarter' ? 0.25 : 1;

  const prevLine = () => {
    const before = [...b.segments].reverse().find((s) => s.start_time < t - 0.3);
    transport.seek(before ? before.start_time : 0);
  };
  const nextLine = () => {
    const after = b.segments.find((s) => s.start_time > t + 0.05);
    if (after) transport.seek(after.start_time);
  };
  const snapshot = () => {
    const v = b.videoRef.current;
    if (!v || !v.videoWidth) return b.showToast('No frame to capture', 'warning');
    const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext('2d')!;
    ctx.filter = gradeToFilter(b.videoEffects, st.colorGrade);
    ctx.drawImage(v, 0, 0);
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = `snapshot_${fmtTime(v.currentTime).replace(/:/g, '-')}.png`;
    a.click();
    b.showToast('📸 Snapshot saved', 'success');
  };
  const fullscreen = () => {
    const el = wrapRef.current;
    if (!document.fullscreenElement) el?.requestFullscreen?.(); else document.exitFullscreen?.();
  };

  const subPos = ss.position === 'top' ? { top: '7%' } : ss.position === 'center' ? { top: '50%', transform: 'translate(-50%,-50%)' } : { bottom: '9%' };

  return (
    <section className="kdp-panel flex flex-col h-full min-h-0 overflow-hidden" aria-label="Video preview">
      <div
        ref={wrapRef}
        className="relative flex-1 min-h-0 bg-black flex items-center justify-center overflow-hidden group"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f && /^(video|audio)\//.test(f.type)) b.uploadFile(f);
        }}
        onDoubleClick={fullscreen}
      >
        {src ? (
          <div
            className={`w-full h-full relative overflow-hidden flex items-center justify-center select-none ${
              zoomScale > 1.05 || fitMode === 'cover'
                ? isPanning
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : 'cursor-pointer'
            }`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onDoubleClick={toggleFitMode}
            onWheel={(e) => {
              if (e.ctrlKey || e.altKey) {
                e.preventDefault();
                setZoomScale((prev) => Math.min(3.5, Math.max(0.5, +(prev + (e.deltaY < 0 ? 0.15 : -0.15)).toFixed(2))));
              }
            }}
            title={zoomScale > 1.05 || fitMode === 'cover' ? "អូសដើម្បីរំកិល (Drag to Pan) • ចុចពីរដងដើម្បី Reset" : "ចុចពីរដងដើម្បីពង្រីក (Double-click to Zoom)"}
          >
            <video
              ref={b.videoRef}
              key={src}
              src={src}
              crossOrigin="anonymous"
              playsInline
              preload="auto"
              className="max-w-full max-h-full pointer-events-none transition-transform duration-75"
              style={{
                filter: gradeToFilter(b.videoEffects, st.colorGrade),
                opacity: st.tracks.V1.hidden ? 0 : 1,
                imageRendering: qScale < 1 ? 'pixelated' : undefined,
                width: qScale < 1 ? `${qScale * 100}%` : undefined,
                transform: `scale(${zoomScale * (qScale < 1 ? 1 / qScale : 1)}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)`,
                objectFit: fitMode === 'cover' ? 'cover' : 'contain',
                transformOrigin: 'center',
              }}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                setMeta({ w: v.videoWidth, h: v.videoHeight });
                st.set({ duration: v.duration || 0 });
                v.playbackRate = st.rate;
              }}
              onDurationChange={(e) => st.set({ duration: e.currentTarget.duration || 0 })}
            />
          </div>
        ) : (
          <EmptyState icon={Film} title="Drop a video here or import one" km="ទម្លាក់វីដេអូនៅទីនេះ ឬនាំចូល"
            action={<button className="kdp-btn kdp-btn-primary" onClick={() => fileRef.current?.click()}><Upload size={14} /> Import Video</button>} />
        )}
        <input ref={fileRef} type="file" accept="video/*,audio/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) b.uploadFile(f); e.target.value = ''; }} />

        {/* Badges & Zoom Controls */}
        {src && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-20">
            <span className="kdp-badge kdp-badge-muted bg-black/50 pointer-events-none">{res}</span>
            <span className="kdp-badge kdp-badge-muted bg-black/50 pointer-events-none">{aspect}</span>
            {useOutput ? <span className="kdp-badge kdp-badge-green bg-black/50 pointer-events-none">Rendered Dub</span> : <span className="kdp-badge kdp-badge-cyan bg-black/50 pointer-events-none">Live Dub</span>}

            {/* Quick Zoom / Fit Pill */}
            <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md rounded-md px-1.5 py-0.5 border border-white/15 shadow-md">
              <button
                type="button"
                onClick={toggleFitMode}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 transition-all ${
                  fitMode === 'cover' ? 'bg-emerald-500/30 text-emerald-300' : 'text-slate-300 hover:text-white'
                }`}
                title={fitMode === 'cover' ? 'សមល្មម (Fit)' : 'លាតពេញអេក្រង់ (Fill / Crop)'}
              >
                <Scan size={11} />
                <span>{fitMode === 'cover' ? 'Fill' : 'Fit'}</span>
              </button>
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.max(0.5, +(prev - 0.25).toFixed(2)))}
                className="text-slate-300 hover:text-white p-0.5"
                title="Zoom Out (-)"
              >
                <Minus size={11} />
              </button>
              <span className="font-mono text-[10px] text-white/90 min-w-[28px] text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.min(3.5, +(prev + 0.25).toFixed(2)))}
                className="text-slate-300 hover:text-white p-0.5"
                title="Zoom In (+)"
              >
                <Plus size={11} />
              </button>
              {(zoomScale !== 1.0 || fitMode === 'cover' || panOffset.x !== 0 || panOffset.y !== 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setZoomScale(1.0);
                    setFitMode('contain');
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className="text-amber-300 hover:text-amber-200 p-0.5"
                  title="Reset Zoom"
                >
                  <RotateCcw size={11} />
                </button>
              )}
            </div>
          </div>
        )}
        {src && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-2 pointer-events-none">
            {st.isPlaying && <LevelBars />}
          </div>
        )}

        {st.showSafeArea && src && <div className="kdp-safe" />}

        {/* Subtitle overlay */}
        {st.showSubtitleOverlay && !st.tracks.CC.hidden && cur?.khmer_translation && !useOutput && (
          <div className="absolute left-1/2 -translate-x-1/2 max-w-[86%] text-center pointer-events-none px-3 py-1 rounded-md km"
            style={{
              ...subPos,
              fontFamily: `'${ss.fontFamily}', 'Kantumruy Pro', sans-serif`,
              fontSize: `clamp(12px, ${ss.fontSize / 10}vw, ${ss.fontSize * 1.6}px)`,
              color: ss.textColor,
              background: ss.boxEnabled === false ? 'transparent' : ss.backgroundColor,
              WebkitTextStroke: ss.strokeWidth ? `${ss.strokeWidth * 0.5}px ${ss.strokeColor}` : undefined,
              textShadow: `0 2px 6px rgba(0,0,0,.85)`,
              lineHeight: 1.6,
              paintOrder: 'stroke fill',
            }}>
            {cur.khmer_translation}
          </div>
        )}

        {(b.isUploadingFile) && (
          <div className="absolute inset-x-0 bottom-0 p-3 bg-black/60 flex items-center gap-3 text-[12px]">
            <Loader2 size={14} className="kdp-spin text-[var(--kdp-cyan)]" />
            <span>Uploading… {b.uploadProgress}%</span>
            <div className="flex-1 h-1 rounded bg-white/10"><div className="h-full rounded bg-[var(--kdp-cyan)]" style={{ width: `${b.uploadProgress}%` }} /></div>
          </div>
        )}
        {dragOver && <div className="absolute inset-3 rounded-xl border-2 border-dashed border-[var(--kdp-cyan)] bg-[rgba(34,211,238,.06)] flex items-center justify-center text-[var(--kdp-cyan)] font-semibold">Drop to import</div>}
      </div>

      {/* Scrubber */}
      <div className="px-3 pt-2">
        <div className="relative h-4 flex items-center group/scrub">
          <div className="absolute inset-x-0 h-[4px] rounded bg-[rgba(100,180,255,.14)] overflow-hidden">
            {dur > 0 && b.segments.map((s, i) => (
              <span key={i} className="absolute top-0 bottom-0" style={{ left: `${(s.start_time / dur) * 100}%`, width: `${Math.max(0.2, ((s.end_time - s.start_time) / dur) * 100)}%`, background: s.audioUrl ? 'rgba(34,197,94,.55)' : 'rgba(139,92,246,.45)' }} />
            ))}
            <div className="absolute top-0 bottom-0 left-0" style={{ width: `${dur ? (t / dur) * 100 : 0}%`, background: 'linear-gradient(90deg,#22d3ee,#3b82f6)' }} />
          </div>
          <input
            type="range" min={0} max={dur || 0} step={0.01} value={t}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            aria-label="Seek"
            onChange={(e) => setScrub(parseFloat(e.target.value))}
            onMouseUp={(e) => { transport.seek(parseFloat((e.target as HTMLInputElement).value)); setScrub(null); }}
            onKeyUp={(e) => { transport.seek(parseFloat((e.target as HTMLInputElement).value)); setScrub(null); }}
          />
          <div className="absolute w-3 h-3 rounded-full bg-white border-2 border-[var(--kdp-cyan)] pointer-events-none shadow-[0_0_8px_rgba(34,211,238,.7)]"
            style={{ left: `calc(${dur ? (t / dur) * 100 : 0}% - 6px)` }} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 px-2 pb-2 pt-1">
        <IconBtn icon={SkipBack} label="Previous line" onClick={prevLine} />
        <button className="kdp-btn kdp-btn-primary kdp-btn-icon w-9 h-9 rounded-full" onClick={() => transport.toggle()} aria-label="Play/Pause" id="btn-play">
          {st.isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
        <IconBtn icon={SkipForward} label="Next line" onClick={nextLine} />
        <span className="mono text-[11.5px] ml-2"><span className="text-[var(--kdp-cyan)]">{fmtTime(t)}</span><span className="text-[var(--kdp-text-3)]"> / {fmtTime(dur)}</span></span>
        <div className="flex-1" />

        <div className="flex items-center gap-1.5 w-[110px] kdp-hide-md">
          <button onClick={() => st.setChannel('original', { mute: !st.channels.original.mute })} className="text-[var(--kdp-text-2)] hover:text-[var(--kdp-cyan)]" aria-label="Mute original">
            {st.channels.original.mute ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <input type="range" className="kdp-range" min={0} max={1.5} step={0.01} value={st.channels.original.volume}
            style={{ ['--pct' as any]: `${(st.channels.original.volume / 1.5) * 100}%` }}
            onChange={(e) => st.setChannel('original', { volume: parseFloat(e.target.value) })} aria-label="Original volume" />
        </div>

        <DM.Root>
          <DM.Trigger asChild><button className="kdp-btn kdp-btn-ghost kdp-btn-sm mono w-12">{st.rate}x</button></DM.Trigger>
          <DM.Portal><DM.Content className="kdp-menu min-w-[110px]" sideOffset={4}>
            {RATES.map((r) => (
              <DM.Item key={r} className="kdp-menu-item" onSelect={() => transport.setRate(r)}>
                <span className="flex-1 mono">{r}x</span>{st.rate === r && <Check size={13} className="text-[var(--kdp-cyan)]" />}
              </DM.Item>
            ))}
          </DM.Content></DM.Portal>
        </DM.Root>

        <DM.Root>
          <DM.Trigger asChild><button className="kdp-btn kdp-btn-ghost kdp-btn-icon kdp-btn-sm" aria-label="Preview settings"><Settings2 size={14} /></button></DM.Trigger>
          <DM.Portal><DM.Content className="kdp-menu w-[230px]" sideOffset={4} align="end">
            <div className="kdp-menu-label">Preview source</div>
            <DM.Item className="kdp-menu-item" onSelect={() => st.set({ previewSource: 'live' })}><span className="flex-1">Live dub (source + AI voices)</span>{!useOutput && <Check size={13} />}</DM.Item>
            <DM.Item className="kdp-menu-item" disabled={!b.outputVideo} onSelect={() => st.set({ previewSource: 'output' })}>
              <span className={`flex-1 ${!b.outputVideo ? 'opacity-40' : ''}`}>Rendered output</span>{useOutput && <Check size={13} />}
            </DM.Item>
            <DM.Separator className="kdp-menu-sep" />
            <div className="kdp-menu-label">Preview quality</div>
            {(['auto', 'full', 'half', 'quarter'] as const).map((q) => (
              <DM.Item key={q} className="kdp-menu-item" onSelect={() => st.set({ previewQuality: q })}>
                <span className="flex-1 capitalize">{q}</span>{quality === q && <Check size={13} />}
              </DM.Item>
            ))}
            <DM.Separator className="kdp-menu-sep" />
            <DM.Item className="kdp-menu-item" onSelect={() => st.set({ showSafeArea: !st.showSafeArea })}><span className="flex-1">Safe area guides</span>{st.showSafeArea && <Check size={13} />}</DM.Item>
            <DM.Item className="kdp-menu-item" onSelect={() => st.set({ showSubtitleOverlay: !st.showSubtitleOverlay })}><span className="flex-1">Subtitle overlay</span>{st.showSubtitleOverlay && <Check size={13} />}</DM.Item>
          </DM.Content></DM.Portal>
        </DM.Root>

        <IconBtn icon={Camera} label="Snapshot (PNG)" onClick={snapshot} />
        <Tip label="Fullscreen" kbd="F"><button className="kdp-btn kdp-btn-ghost kdp-btn-icon kdp-btn-sm" onClick={fullscreen} aria-label="Fullscreen"><Maximize2 size={14} /></button></Tip>
      </div>
    </section>
  );
};
