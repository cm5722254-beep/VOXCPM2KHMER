// PosterForge AI — Interactive Poster Canvas & Theatrical Typography Layer
import React, { useRef, useState, useEffect } from 'react';
import {
  PosterProject,
  PosterAspectRatio,
  Typography3DEffect,
  PosterSmartOverlay,
} from './PosterForgeTypes';
import { ASPECT_RATIOS, TYPOGRAPHY_EFFECTS } from './PosterForgeConstants';
import { Download, Sparkles, Move, Maximize2, RefreshCw, ZoomIn, ZoomOut, Check, Layers, Eye } from 'lucide-react';

interface PosterPreviewCanvasProps {
  project: PosterProject;
  onUpdateTypography: (updated: Partial<PosterProject['typography']>) => void;
  onUpdateOverlays?: (overlays: PosterSmartOverlay[]) => void;
  isGenerating?: boolean;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const PosterPreviewCanvas: React.FC<PosterPreviewCanvasProps> = ({
  project,
  onUpdateTypography,
  onUpdateOverlays,
  isGenerating = false,
  onShowToast,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [isDraggingTitle, setIsDraggingTitle] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const aspectObj = ASPECT_RATIOS.find((a) => a.id === project.aspectRatio) || ASPECT_RATIOS[0];
  const typoEffect = TYPOGRAPHY_EFFECTS.find((e) => e.id === project.typography.effect) || TYPOGRAPHY_EFFECTS[0];

  // Draggable Title positioning
  const handleMouseDownTitle = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingTitle(true);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - (project.typography.posX / 100) * rect.width,
        y: e.clientY - rect.top - (project.typography.posY / 100) * rect.height,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingTitle || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left - dragOffset.x;
      const currentY = e.clientY - rect.top - dragOffset.y;

      const newPercentX = Math.min(95, Math.max(5, Math.round((currentX / rect.width) * 100)));
      const newPercentY = Math.min(95, Math.max(5, Math.round((currentY / rect.height) * 100)));

      onUpdateTypography({
        posX: newPercentX,
        posY: newPercentY,
        positionMode: 'free',
      });
    };

    const handleMouseUp = () => {
      if (isDraggingTitle) {
        setIsDraggingTitle(false);
      }
    };

    if (isDraggingTitle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingTitle, dragOffset, onUpdateTypography]);

  // High-Resolution Composite Canvas Downloader (4K / 2K / 1080P)
  const handleDownloadCompositePoster = async (format: 'png' | 'jpeg' = 'png', resolution: '4k' | '2k' | 'original' = '2k') => {
    setIsExporting(true);
    onShowToast('⏳ កំពុង render និងបញ្ចូល 3D Khmer Typography ទៅក្នុង Poster កម្រិតខ្ពស់...', 'info');

    try {
      const longSide = resolution === '4k' ? 3840 : resolution === '2k' ? 2560 : 1920;
      const targetWidth = Math.round(longSide * Math.min(1, aspectObj.ratio));
      const targetHeight = Math.round(targetWidth / aspectObj.ratio);

      const offscreen = document.createElement('canvas');
      offscreen.width = targetWidth;
      offscreen.height = targetHeight;
      const ctx = offscreen.getContext('2d');

      if (!ctx) throw new Error('Could not initialize 2D canvas context');

      // 1. Draw Background Image
      if (!project.activeImageUrl) throw new Error('Upload artwork or generate an image before exporting.');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('The artwork could not be loaded for export.'));
        img.src = project.activeImageUrl;
      });

      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      } else {
        // Draw deep cinematic gradient fallback
        const grad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
        grad.addColorStop(0, '#0c101a');
        grad.addColorStop(0.5, '#1e2433');
        grad.addColorStop(1, '#05070c');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      // 2. Draw Vignette & Lighting Atmosphere
      const vignette = ctx.createRadialGradient(
        targetWidth / 2,
        targetHeight / 2,
        targetWidth * 0.2,
        targetWidth / 2,
        targetHeight / 2,
        targetWidth * 0.8
      );
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // 3. Draw Bottom Gradient for Typography Readability
      const bottomGrad = ctx.createLinearGradient(0, targetHeight * 0.65, 0, targetHeight);
      bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
      bottomGrad.addColorStop(0.5, 'rgba(2,6,23,0.5)');
      bottomGrad.addColorStop(1, 'rgba(2,6,23,0.92)');
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(0, targetHeight * 0.65, targetWidth, targetHeight * 0.35);

      // 4. Draw Typography: Title, Subtitle, Badge, Crest
      const titlePosX = (project.typography.posX / 100) * targetWidth;
      const titlePosY = (project.typography.posY / 100) * targetHeight;
      const scaleFactor = targetWidth / 600;

      // Draw Ornate Crest Backing if enabled
      if (project.typography.showOrnateCrest) {
        // Draw Blue Magic Energy Halo
        const haloGrad = ctx.createRadialGradient(titlePosX, titlePosY, 10 * scaleFactor, titlePosX, titlePosY, 180 * scaleFactor);
        haloGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        haloGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.2)');
        haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(titlePosX, titlePosY, 180 * scaleFactor, 0, Math.PI * 2);
        ctx.fill();

        // Draw Ornate Golden Wings / Crest Frame
        ctx.save();
        ctx.translate(titlePosX, titlePosY);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3 * scaleFactor;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15 * scaleFactor;

        // Symmetric ornate filigree lines
        ctx.beginPath();
        ctx.arc(0, 20 * scaleFactor, 110 * scaleFactor, 0.2 * Math.PI, 0.8 * Math.PI, false);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-130 * scaleFactor, 25 * scaleFactor);
        ctx.bezierCurveTo(-100 * scaleFactor, -10 * scaleFactor, -60 * scaleFactor, 30 * scaleFactor, 0, 15 * scaleFactor);
        ctx.bezierCurveTo(60 * scaleFactor, 30 * scaleFactor, 100 * scaleFactor, -10 * scaleFactor, 130 * scaleFactor, 25 * scaleFactor);
        ctx.stroke();

        ctx.restore();
      }

      // Draw Subtitle / Tagline
      if (project.typography.subtitle) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = `700 ${Math.round(14 * scaleFactor)}px "Cinzel", "Inter", sans-serif`;
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 8 * scaleFactor;
        ctx.letterSpacing = '4px';
        ctx.fillText(project.typography.subtitle.toUpperCase(), titlePosX, titlePosY - 55 * scaleFactor);
        ctx.restore();
      }

      // Draw 3D Main Title (with 3D extrusion passes)
      const fontSize = Math.round((project.typography.fontSize || 54) * (scaleFactor * 0.75));
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = `900 ${fontSize}px "${project.typography.fontFamily || 'Koulen'}", "Moul", "Bayon", sans-serif`;

      // 3D Depth Extrusions
      const depth = Math.round((project.typography.depth3D || 8) * scaleFactor * 0.4);
      for (let d = depth; d >= 1; d--) {
        ctx.fillStyle = d === depth ? '#1f1304' : d > depth / 2 ? '#452b08' : '#784d10';
        ctx.fillText(project.typography.mainTitle, titlePosX, titlePosY + d);
      }

      // Golden Bevel Stroke
      ctx.lineWidth = 4 * scaleFactor;
      ctx.strokeStyle = '#3d2505';
      ctx.strokeText(project.typography.mainTitle, titlePosX, titlePosY);

      // Gradient Fill (Gold or selected effect)
      const textGrad = ctx.createLinearGradient(0, titlePosY - fontSize, 0, titlePosY + 10);
      if (project.typography.effect === 'gold_3d' || project.typography.effect === 'ancient_gold') {
        textGrad.addColorStop(0, '#fffbeb');
        textGrad.addColorStop(0.25, '#fde047');
        textGrad.addColorStop(0.55, '#d97706');
        textGrad.addColorStop(0.85, '#92400e');
        textGrad.addColorStop(1, '#fde047');
      } else if (project.typography.effect === 'fire') {
        textGrad.addColorStop(0, '#fef08a');
        textGrad.addColorStop(0.5, '#ea580c');
        textGrad.addColorStop(1, '#7f1d1d');
      } else {
        textGrad.addColorStop(0, '#e0f2fe');
        textGrad.addColorStop(0.5, '#38bdf8');
        textGrad.addColorStop(1, '#0369a1');
      }

      ctx.fillStyle = textGrad;
      ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
      ctx.shadowBlur = 12 * scaleFactor;
      ctx.fillText(project.typography.mainTitle, titlePosX, titlePosY);
      ctx.restore();

      // Draw 3D Badge (e.g. "3D", "ភាគ ១")
      if (project.typography.badgeText) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = `900 ${Math.round(18 * scaleFactor)}px "Outfit", "Koulen", sans-serif`;

        // Badge Container Box
        const badgeY = titlePosY + 35 * scaleFactor;
        const badgeGrad = ctx.createLinearGradient(0, badgeY - 14 * scaleFactor, 0, badgeY + 14 * scaleFactor);
        badgeGrad.addColorStop(0, '#2563eb');
        badgeGrad.addColorStop(1, '#1d4ed8');

        ctx.fillStyle = badgeGrad;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2 * scaleFactor;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 15 * scaleFactor;

        // Rounded badge
        const bW = 80 * scaleFactor;
        const bH = 26 * scaleFactor;
        ctx.beginPath();
        ctx.roundRect(titlePosX - bW / 2, badgeY - bH / 2, bW, bH, 6 * scaleFactor);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.fillText(project.typography.badgeText, titlePosX, badgeY + 6 * scaleFactor);
        ctx.restore();
      }

      // Draw Branding & Watermark
      if (project.branding.watermarkText) {
        ctx.save();
        ctx.font = `600 ${Math.round(12 * scaleFactor)}px "Inter", sans-serif`;
        ctx.fillStyle = `rgba(255,255,255,${(project.branding.watermarkOpacity || 60) / 100})`;
        ctx.textAlign = 'right';
        ctx.fillText(project.branding.watermarkText, targetWidth - 24 * scaleFactor, targetHeight - 20 * scaleFactor);
        ctx.restore();
      }

      // 5. Trigger File Download
      const dataUrl = offscreen.toDataURL(`image/${format}`, 0.95);
      const link = document.createElement('a');
      link.download = `PosterForge_${project.title.replace(/\s+/g, '_')}_${resolution}.${format}`;
      link.href = dataUrl;
      link.click();

      onShowToast(`🎉 បានទាញយក Poster កម្រិត ${resolution.toUpperCase()} ដោយជោគជ័យ!`, 'success');
    } catch (err: any) {
      console.error('Export error:', err);
      onShowToast(`កំហុសក្នុងការទាញយក: ${err?.message || 'Error'}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full p-2 sm:p-4 select-none overflow-hidden">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-white dark:bg-[#12131a]/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 shadow-lg text-xs">
          <span className="font-bold text-slate-800 dark:text-white tracking-wide">សមាមាត្រ {aspectObj.id}</span>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide ${!project.activeImageUrl ? 'bg-slate-700/70 text-slate-700 dark:text-slate-200' : project.activeImageUrl.startsWith('data:') ? 'bg-sky-500/20 text-sky-200' : project.activeImageUrl.includes('pollinations.ai') ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-100'}`}>
            {!project.activeImageUrl ? 'ផ្ទាំងទទេ' : project.activeImageUrl.startsWith('data:') ? 'រូបបានបញ្ចូល' : project.activeImageUrl.includes('pollinations.ai') ? 'រូបពី AI' : 'រូបគំរូ'}
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto bg-white dark:bg-[#12131a]/85 backdrop-blur-md px-2 py-1.5 rounded-2xl border border-white/10 shadow-lg">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
            className="p-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-zinc-300 w-10 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.1))}
            className="p-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-4 bg-white/10 mx-0.5" />
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Reset Zoom"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Poster Preview Frame */}
      <div
        ref={containerRef}
        style={{
          aspectRatio: `${aspectObj.ratio}`,
          width: `min(92%, calc(75vh * ${aspectObj.ratio}))`,
          transform: `scale(${zoomLevel})`,
          transition: 'transform 0.15s ease-out',
        }}
        className="relative max-h-[75vh] w-auto max-w-[92%] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.85)] border-2 border-white/10 bg-white dark:bg-[#07090e] group cursor-default"
      >
        {/* 1. Master Artwork Image */}
        {project.activeImageUrl ? (
          <img
            src={project.activeImageUrl}
            alt={project.title || 'Poster artwork'}
            className="w-full h-full object-cover select-none pointer-events-none"
            draggable={false}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(ellipse_at_center,_#132b45_0%,_#07090e_70%)] text-center px-8">
            <Sparkles className="w-9 h-9 text-cyan-300/70" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">ចាប់ផ្ដើមបង្កើត Poster នៅទីនេះ</p>
            <p className="max-w-xs text-xs leading-relaxed text-slate-600 dark:text-slate-300">សរសេរពិពណ៌នារូប រួចបង្កើតដោយ AI បញ្ចូលរូបផ្ទាល់ខ្លួន ឬជ្រើសរើសរូបគំរូ។</p>
          </div>
        )}

        {/* 2. Cinematic Atmospheric Vignette */}
        <div
          className={`absolute inset-0 pointer-events-none ${project.activeImageUrl ? '' : 'hidden'}`}
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)',
          }}
        />

        {/* 3. Bottom Gradient for Legibility */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-[45%] pointer-events-none ${project.activeImageUrl ? '' : 'hidden'}`}
          style={{
            background: 'linear-gradient(to top, rgba(2,6,23,0.92) 0%, rgba(2,6,23,0.4) 60%, rgba(0,0,0,0) 100%)',
          }}
        />

        {/* 4. Smart Overlays (Particles, Clouds, God rays, Magic Energy) */}
        {project.activeImageUrl && project.overlays?.map((ov) => {
          if (!ov.visible) return null;
          return (
            <div
              key={ov.id}
              className="absolute inset-0 pointer-events-none"
              style={{
                opacity: ov.opacity / 100,
                mixBlendMode: ov.blendMode,
              }}
            >
              {ov.type === 'particles' && (
                <div className="w-full h-full bg-[radial-gradient(#ffd700_1px,transparent_1px)] [background-size:24px_24px] opacity-40 animate-pulse" />
              )}
              {ov.type === 'godrays' && (
                <div
                  className="w-full h-full"
                  style={{
                    background: 'conic-gradient(from 180deg at 50% -20%, transparent 40%, rgba(254,240,138,0.2) 50%, transparent 60%)',
                  }}
                />
              )}
              {ov.type === 'magic_energy' && (
                <div
                  className="absolute bottom-10 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(99,102,241,0.15) 50%, transparent 70%)' }}
                />
              )}
            </div>
          );
        })}

        {/* 5. 3D KHMER & MULTILINGUAL TYPOGRAPHY LAYER */}
        <div
          onMouseDown={handleMouseDownTitle}
          style={{
            position: 'absolute',
            left: `${project.typography.posX}%`,
            top: `${project.typography.posY}%`,
            transform: `translate(-50%, -50%) rotate(${project.typography.rotation || 0}deg)`,
            cursor: isDraggingTitle ? 'grabbing' : 'grab',
          }}
          className={`z-20 flex flex-col items-center justify-center p-3 rounded-2xl group/title transition-shadow hover:ring-1 hover:ring-emerald-400/40 ${project.activeImageUrl ? '' : 'hidden'}`}
          title="ចុចអូស (Drag) ដើម្បីផ្លាស់ប្តូរទីតាំងអក្សរ"
        >
          {/* Visual Safe Area & Drag Handle indicator on hover */}
          <div className="absolute -top-3.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-400/30 text-[9px] font-bold opacity-0 group-hover/title:opacity-100 transition-opacity flex items-center gap-1 shadow-md">
            <Move className="w-2.5 h-2.5" />
            <span>អូសទីតាំង</span>
          </div>

          {/* Ornate Wings / Crest Shield (Matching Xianxia Flagship) */}
          {project.typography.showOrnateCrest && (
            <div className="absolute inset-0 -m-6 pointer-events-none flex items-center justify-center">
              {/* Radiant Blue & Golden Aura */}
              <div
                className="w-full h-full rounded-full blur-xl"
                style={{
                  background: 'radial-gradient(circle, rgba(56,189,248,0.35) 0%, rgba(234,179,8,0.2) 60%, transparent 80%)',
                }}
              />
              {/* Ornate SVG Filigree Crest Frame */}
              <svg className="absolute w-[115%] h-[120%] pointer-events-none" viewBox="0 0 400 200" fill="none">
                <path
                  d="M 50 150 C 120 180, 280 180, 350 150 C 310 130, 260 145, 200 135 C 140 145, 90 130, 50 150 Z"
                  fill="url(#goldGrad)"
                  stroke="#fff"
                  strokeWidth="0.5"
                  opacity="0.9"
                />
                <path
                  d="M 80 140 C 130 90, 270 90, 320 140"
                  stroke="url(#goldGrad)"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ffd700" />
                    <stop offset="50%" stopColor="#fff8db" />
                    <stop offset="100%" stopColor="#ffd700" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}

          {/* Subtitle / Tagline */}
          {project.typography.subtitle && (
            <span
              className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] mb-1 z-10"
              style={{ fontFamily: '"Cinzel", "Inter", sans-serif' }}
            >
              {project.typography.subtitle}
            </span>
          )}

          {/* MAIN TITLE (Khmer or Multilingual) */}
          <h1
            className="text-center font-black tracking-normal leading-tight z-10"
            style={{
              fontFamily: `"${project.typography.fontFamily || 'Koulen'}", "Moul", "Bayon", sans-serif`,
              fontSize: `${project.typography.fontSize || 48}px`,
              letterSpacing: `${project.typography.letterSpacing || 0}px`,
              lineHeight: project.typography.lineHeight || 1.1,
              ...typoEffect.cssStyle,
            }}
          >
            {project.typography.mainTitle}
          </h1>

          {/* Badge & Episode Tag (e.g. "3D", "ភាគ ១") */}
          {project.typography.showBadge && project.typography.badgeText && (
            <div
              className="mt-2 px-3.5 py-0.5 rounded-md text-xs font-black tracking-wider uppercase border border-amber-300/80 z-10"
              style={typoEffect.badgeStyle}
            >
              {project.typography.badgeText}
            </div>
          )}

          {/* Tagline */}
          {project.typography.tagline && (
            <p className="mt-1 text-[10px] text-slate-700 dark:text-zinc-300 font-medium tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] max-w-xs text-center z-10">
              {project.typography.tagline}
            </p>
          )}
        </div>

        {/* 6. Branding & Watermark Layer */}
        {project.activeImageUrl && project.branding.watermarkText && (
          <div
            className={`absolute z-20 text-[10px] font-semibold tracking-wider text-slate-800 dark:text-white/80 pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] ${
              project.branding.watermarkPosition === 'top_left'
                ? 'top-4 left-4'
                : project.branding.watermarkPosition === 'top_right'
                ? 'top-4 right-4'
                : project.branding.watermarkPosition === 'bottom_left'
                ? 'bottom-4 left-4'
                : project.branding.watermarkPosition === 'center'
                ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                : 'bottom-4 right-4'
            }`}
            style={{ opacity: (project.branding.watermarkOpacity || 60) / 100 }}
          >
            {project.branding.watermarkText}
          </div>
        )}

        {/* 7. Loading Generation Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center gap-3 animate-in fade-in">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-2 border-emerald-400/20 border-t-emerald-400 animate-spin" />
              <Sparkles className="w-6 h-6 text-sky-600 dark:text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-white tracking-wide">
              កំពុងបង្កើត Poster ភាពយន្តកម្រិតខ្ពស់...
            </span>
            <span className="text-xs text-slate-600 dark:text-zinc-400">
              AI កំពុងរៀបចំ Composition, ភ្លើង និងបរិយាកាស
            </span>
          </div>
        )}
      </div>

      {/* Bottom Floating Export Actions */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 z-20">
        <button
          onClick={() => handleDownloadCompositePoster('png', '2k')}
          disabled={isExporting || !project.activeImageUrl}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 active:scale-95 shadow-lg shadow-emerald-500/20 transition-all border border-emerald-400/30"
          title="ទាញយក Poster រួមទាំង 3D Khmer Typography កម្រិត 2K QHD"
        >
          <Download className="w-3.5 h-3.5" />
          <span>ទាញយក Poster 2K (PNG)</span>
        </button>

        <button
          onClick={() => handleDownloadCompositePoster('png', '4k')}
          disabled={isExporting || !project.activeImageUrl}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-amber-300 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 hover:bg-amber-500/30 active:scale-95 border border-amber-400/40 transition-all shadow-md"
          title="ទាញយក Poster កម្រិត 4K Ultra HD Theatrical Quality"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-amber-400" />
          <span>✨ ទាញយក 4K UHD</span>
        </button>
      </div>
    </div>
  );
};
