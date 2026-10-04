// PosterForge AI — Professional Prompt Engineering Engine
import {
  PosterTypeId,
  PosterStyleId,
  PosterCompositionId,
  PosterLightingId,
  PosterColorGradeId,
  PosterMoodId,
  PosterAspectRatio,
} from './PosterForgeTypes';
import { POSTER_TYPES, VISUAL_STYLES, COMPOSITIONS, LIGHTING_PRESETS, COLOR_GRADES, MOODS } from './PosterForgeConstants';

export interface PromptBuilderInput {
  userPrompt: string;
  posterType: PosterTypeId;
  style: PosterStyleId;
  customStylePrompt?: string;
  composition: PosterCompositionId;
  lighting: PosterLightingId[];
  colorGrade: PosterColorGradeId;
  mood: PosterMoodId;
  aspectRatio: PosterAspectRatio;
  hasReferenceCharacter?: boolean;
}

export interface PromptBuilderOutput {
  positivePrompt: string;
  negativePrompt: string;
  cameraSettings: string;
  lightingTags: string[];
}

export function buildCinematicPosterPrompt(input: PromptBuilderInput): PromptBuilderOutput {
  const typeObj = POSTER_TYPES.find((t) => t.id === input.posterType);
  const styleObj = VISUAL_STYLES.find((s) => s.id === input.style);
  const compObj = COMPOSITIONS.find((c) => c.id === input.composition);
  const colorObj = COLOR_GRADES.find((c) => c.id === input.colorGrade);
  const moodObj = MOODS.find((m) => m.id === input.mood);

  // 1. Core Subject & User prompt expansion
  const cleanUserPrompt = input.userPrompt.trim() || 'Heroic immortal cultivator in majestic robes standing among celestial peaks';

  // 2. Poster Type foundation
  const typeTag = typeObj?.promptKeyword || 'theatrical movie key art, cinematic commercial poster';

  // 3. Style prompt
  const styleTag =
    input.style === 'custom' && input.customStylePrompt
      ? input.customStylePrompt
      : styleObj?.promptExpansion || 'high-end cinematic fantasy concept art';

  // 4. Composition & Framing
  const compTag = compObj?.promptTag || 'masterful theatrical composition, hero in center';

  // 5. Lighting Layers
  const lightingTags = (input.lighting.length > 0 ? input.lighting : ['golden_light', 'rim_light']).map((lId) => {
    const lObj = LIGHTING_PRESETS.find((l) => l.id === lId);
    return lObj?.promptTag || 'dramatic cinematic lighting';
  });

  // 6. Color Grade & Mood
  const colorTag = colorObj ? `predominant color harmony of rich ${colorObj.id}` : 'rich cinematic color palette';
  const moodTag = moodObj?.tag || 'cinematic contrast, high dynamic range';

  // 7. Master Camera & Rendering Qualities
  const cameraSettings =
    'shot on ARRI Alexa 65, 85mm anamorphic prime lens, T1.5 shallow depth of field, cinematic framing and detailed professional poster art direction';

  // 8. Negative Space Instruction: Keep clear area for overlay typography without covering the face
  const negativeSpaceInstruction =
    'clean balanced composition with deliberate cinematic negative space at the bottom third for theatrical typography layout, subject face cleanly framed in upper center without obstruction';

  // 9. Synthesize Positive Prompt
  const positivePrompt = [
    `Theatrical commercial movie poster: ${cleanUserPrompt}.`,
    typeTag,
    styleTag,
    compTag,
    `Lighting: ${lightingTags.join(', ')}.`,
    `${colorTag}, ${moodTag}.`,
    negativeSpaceInstruction,
    'hyper-detailed facial features, realistic skin texture and subsurface scattering, flowing silk fabric with micro-embroidery, volumetric atmospheric fog, golden floating embers, intricate fantasy environmental depth, masterpiece art direction, award-winning key visual.',
    cameraSettings,
  ]
    .filter(Boolean)
    .join(' ');

  // 10. Robust Negative Prompt
  const negativePrompt =
    'text, typography, watermark, logo, signature, distorted face, extra fingers, mutated hands, bad anatomy, deformed limbs, blurry, low resolution, pixelated, flat lighting, cropped face, double heads, oversaturated plastic skin, poorly drawn eyes, noisy background.';

  return {
    positivePrompt,
    negativePrompt,
    cameraSettings,
    lightingTags,
  };
}
