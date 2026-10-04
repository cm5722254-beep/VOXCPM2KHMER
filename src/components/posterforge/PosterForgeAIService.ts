// PosterForge AI — AI Generation & Provider Abstraction Service
import {
  PosterProject,
  PosterVariation,
  PosterCompositionId,
  PosterLightingId,
  AIProviderSettings,
} from './PosterForgeTypes';
import { ASPECT_RATIOS } from './PosterForgeConstants';

export const DEFAULT_AI_SETTINGS: AIProviderSettings = {
  activeProvider: 'pollinations_flux',
  defaultResolution: '1024',
  generationCount: 4,
  maxGenerationsPerDay: 50,
  enable4KUpscale: true,
};

// Generate image using Pollinations AI (Flux engine - zero authentication, high quality, free GPU)
export async function generatePollinationsImage(
  prompt: string,
  width: number,
  height: number,
  seed: number
): Promise<string> {
  const encodedPrompt = encodeURIComponent(prompt.slice(0, 1000));
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux&enhance=false`;
  // Validate that the provider returned a usable image before exposing it as a result.
  await new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    const timeout = window.setTimeout(() => reject(new Error('Image generation timed out. Please try again.')), 120_000);
    image.onload = () => { window.clearTimeout(timeout); resolve(); };
    image.onerror = () => { window.clearTimeout(timeout); reject(new Error('The image provider did not return an image. Check your connection or choose another provider.')); };
    image.src = url;
  });
  return url;
}

// Generate 4 distinct variations per request
export async function generatePosterVariations(
  project: PosterProject,
  settings: AIProviderSettings = DEFAULT_AI_SETTINGS
): Promise<PosterVariation[]> {
  if (settings.activeProvider !== 'pollinations_flux') {
    throw new Error('This provider is not connected yet. Select Pollinations AI (Flux) in AI settings to generate real images.');
  }
  const aspectObj = ASPECT_RATIOS.find((a) => a.id === project.aspectRatio) || ASPECT_RATIOS[0];
  
  // Honor the selected generation resolution while keeping the selected aspect ratio.
  const requestedSize = Number(settings.defaultResolution);
  const longSide = Number.isFinite(requestedSize) ? Math.min(2048, Math.max(512, requestedSize)) : 1024;
  let baseWidth = aspectObj.ratio >= 1 ? longSide : Math.round(longSide * aspectObj.ratio);
  let baseHeight = aspectObj.ratio < 1 ? longSide : Math.round(longSide / aspectObj.ratio);

  // Ensure dimensions are multiples of 16
  baseWidth = Math.floor(baseWidth / 16) * 16;
  baseHeight = Math.floor(baseHeight / 16) * 16;

  const baseSeed = Math.floor(Math.random() * 1000000);

  // 4 distinct compositional and angle perspectives
  const variationVariances: {
    cameraAngle: string;
    comp: PosterCompositionId;
    light: PosterLightingId;
    promptMod: string;
  }[] = [
    {
      cameraAngle: 'Low-angle Heroic 85mm',
      comp: project.composition || 'char_center',
      light: project.lighting[0] || 'golden_light',
      promptMod: 'dramatic low-angle hero perspective, triumphant framing, celestial horizon line',
    },
    {
      cameraAngle: 'Eye-level 50mm Anamorphic',
      comp: project.composition === 'char_center' ? 'char_left' : 'char_center',
      light: project.lighting[1] || 'heavenly_light',
      promptMod: 'eye-level cinematic anamorphic perspective, dynamic rule-of-thirds composition, expansive clouds',
    },
    {
      cameraAngle: 'Wide Cinematic 35mm',
      comp: 'wide_cinematic',
      light: 'god_ray',
      promptMod: 'wide epic cinematic shot, colossal world-building scale, soaring mythical architecture',
    },
    {
      cameraAngle: 'Intense 105mm Portrait Focus',
      comp: 'closeup_portrait',
      light: 'rim_light',
      promptMod: 'intense atmospheric portrait framing, breathtaking facial detail, piercing gaze, mystical aura corona',
    },
  ];

  const variations: PosterVariation[] = [];
  const count = Math.max(1, Math.min(4, settings.generationCount || 1));

  for (let i = 0; i < count; i++) {
    const vVar = variationVariances[i];
    const seed = baseSeed + i * 777;
    const modifiedPrompt = `${project.finalExpandedPrompt}, ${vVar.promptMod}`;

    // By default, generate via Flux
    const imageUrl = await generatePollinationsImage(modifiedPrompt, baseWidth, baseHeight, seed);

    variations.push({
      id: `var_${Date.now()}_${i}`,
      seed,
      imageUrl,
      thumbnailUrl: imageUrl,
      prompt: modifiedPrompt,
      negativePrompt: project.negativePrompt,
      composition: vVar.comp,
      lighting: vVar.light,
      cameraAngle: vVar.cameraAngle,
      createdAt: new Date().toISOString(),
    });
  }

  return variations;
}
