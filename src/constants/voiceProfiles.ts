/**
 * Khmer Voice Profiles — Dubber Dang Pro v3.1
 * All available TTS voices for Khmer dubbing
 */

export interface VoiceProfile {
  id: string;
  name: string;
  nameKh: string;
  gender: 'male' | 'female' | 'child';
  age: 'young' | 'adult' | 'elder';
  style: 'natural' | 'dramatic' | 'narrator' | 'news' | 'friendly';
  edgeTtsId: string;    // Edge TTS voice ID
  sampleFile?: string;  // /media/samples/<file>
  premium: boolean;
  description: string;
}

export const KHMER_VOICE_PROFILES: VoiceProfile[] = [
  // ── Male Voices ──────────────────────────────────────────────────────────
  {
    id: 'piseth',
    name: 'Piseth',
    nameKh: 'ពិសិទ្ធ',
    gender: 'male',
    age: 'adult',
    style: 'natural',
    edgeTtsId: 'km-KH-PisethNeural',
    sampleFile: 'piseth_sample.mp3',
    premium: false,
    description: 'Natural adult male voice, clear pronunciation',
  },
  {
    id: 'kosal',
    name: 'Kosal',
    nameKh: 'កុសល',
    gender: 'male',
    age: 'young',
    style: 'friendly',
    edgeTtsId: 'km-KH-PisethNeural',
    sampleFile: 'kosal_sample.mp3',
    premium: false,
    description: 'Young friendly male voice for casual content',
  },
  {
    id: 'dara',
    name: 'Dara',
    nameKh: 'ដារ៉ា',
    gender: 'male',
    age: 'adult',
    style: 'dramatic',
    edgeTtsId: 'km-KH-PisethNeural',
    sampleFile: 'dara_sample.mp3',
    premium: true,
    description: 'Dramatic adult male for action/thriller dubbing',
  },

  // ── Female Voices ────────────────────────────────────────────────────────
  {
    id: 'sreymom',
    name: 'Sreymom',
    nameKh: 'ស្រីម៉ម',
    gender: 'female',
    age: 'adult',
    style: 'natural',
    edgeTtsId: 'km-KH-SreymomNeural',
    sampleFile: 'sreymom_sample.mp3',
    premium: false,
    description: 'Natural adult female voice, warm tone',
  },
  {
    id: 'channary',
    name: 'Channary',
    nameKh: 'ច័ន្ទណារី',
    gender: 'female',
    age: 'young',
    style: 'friendly',
    edgeTtsId: 'km-KH-SreymomNeural',
    sampleFile: 'channary_sample.mp3',
    premium: false,
    description: 'Young cheerful female, great for romance/comedy',
  },
  {
    id: 'bopha',
    name: 'Bopha',
    nameKh: 'បុប្ផា',
    gender: 'female',
    age: 'adult',
    style: 'narrator',
    edgeTtsId: 'km-KH-SreymomNeural',
    sampleFile: 'bopha_sample.mp3',
    premium: true,
    description: 'Professional narrator voice for documentaries',
  },

  // ── Narrator / Special ───────────────────────────────────────────────────
  {
    id: 'narrator_male',
    name: 'Narrator (Male)',
    nameKh: 'អ្នករាយការណ៍ (ប្រុស)',
    gender: 'male',
    age: 'adult',
    style: 'narrator',
    edgeTtsId: 'km-KH-PisethNeural',
    premium: false,
    description: 'Deep authoritative narrator for epic stories',
  },
  {
    id: 'narrator_female',
    name: 'Narrator (Female)',
    nameKh: 'អ្នករាយការណ៍ (ស្រី)',
    gender: 'female',
    age: 'adult',
    style: 'narrator',
    edgeTtsId: 'km-KH-SreymomNeural',
    premium: false,
    description: 'Elegant female narrator for drama/romance',
  },
];

/** Get voices by gender */
export const getVoicesByGender = (gender: 'male' | 'female' | 'child') =>
  KHMER_VOICE_PROFILES.filter(v => v.gender === gender);

/** Get free voices only */
export const getFreeVoices = () =>
  KHMER_VOICE_PROFILES.filter(v => !v.premium);

/** Get voice by ID */
export const getVoiceById = (id: string) =>
  KHMER_VOICE_PROFILES.find(v => v.id === id);

/** Default voice for auto-assignment by gender */
export const getDefaultVoice = (gender: 'male' | 'female') =>
  gender === 'male'
    ? KHMER_VOICE_PROFILES.find(v => v.id === 'piseth')!
    : KHMER_VOICE_PROFILES.find(v => v.id === 'sreymom')!;
