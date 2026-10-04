import type { VideoEffects } from '../../types';
import type { ColorGrade } from '../store/studioStore';

/** Convert legacy VideoEffects + pro ColorGrade into a GPU-accelerated CSS filter for preview. */
export function gradeToFilter(fx: VideoEffects | undefined, g: ColorGrade): string {
  const b = ((fx?.brightness ?? 100) / 100) * (1 + g.exposure / 100) * (1 + (g.highlights - g.shadows * 0.5) / 400);
  const c = ((fx?.contrast ?? 100) / 100) * (1 + g.contrast / 100) * (1 + g.sharpness / 600);
  const s = ((fx?.saturation ?? 100) / 100) * (1 + (g.saturation + g.vibrance * 0.6) / 100);
  const warm = Math.max(0, g.temperature) / 100;
  const sepia = Math.min(1, (fx?.sepia ?? 0) / 100 + warm * 0.35);
  const hue = g.tint * 0.4 + Math.min(0, g.temperature) * 0.25;
  const blur = fx?.blur ?? 0;
  return [
    `brightness(${b.toFixed(3)})`, `contrast(${c.toFixed(3)})`, `saturate(${Math.max(0, s).toFixed(3)})`,
    sepia ? `sepia(${sepia.toFixed(3)})` : '', hue ? `hue-rotate(${hue.toFixed(1)}deg)` : '', blur ? `blur(${blur}px)` : '',
  ].filter(Boolean).join(' ');
}

export const COLOR_PRESETS: Record<string, Partial<ColorGrade>> = {
  none: {},
  Cinematic: { contrast: 18, saturation: -10, temperature: -8, shadows: 10, highlights: -6, vibrance: 10 },
  Drama: { contrast: 28, saturation: -22, exposure: -6, shadows: 18 },
  Warm: { temperature: 35, saturation: 8, tint: 4 },
  Cold: { temperature: -40, saturation: -6, tint: -6 },
  Night: { exposure: -22, temperature: -45, saturation: -25, contrast: 12 },
  Film: { contrast: 10, saturation: -18, temperature: 14, highlights: -12, vibrance: -5 },
  HDR: { contrast: 22, saturation: 18, vibrance: 25, highlights: -20, shadows: 22, sharpness: 30 },
};
