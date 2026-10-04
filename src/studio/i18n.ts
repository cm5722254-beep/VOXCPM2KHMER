/** Bilingual (Khmer + English) UI labels for KHMER DUBBING PRO. */
export const L = {
  aiDubbing: { en: 'AI Dubbing', km: 'ការបញ្ចូលសំឡេង AI' },
  aiTts: { en: 'AI TTS', km: 'អត្ថបទទៅសំឡេង' },
  voiceClone: { en: 'Voice Clone', km: 'ចម្លងសំឡេង' },
  subtitle: { en: 'Subtitle', km: 'អក្សររត់' },
  effects: { en: 'Effects', km: 'បែបផែន' },
  effects3d: { en: '3D Effects', km: 'បែបផែន 3D' },
  bgm: { en: 'BGM', km: 'តន្ត្រី' },
  sfx: { en: 'SFX', km: 'សំឡេងបែបផែន' },
  color: { en: 'Color', km: 'ពណ៌' },
  export: { en: 'Export', km: 'នាំចេញ' },
  generateAll: { en: 'Generate All Voices', km: 'បង្កើតសំឡេងទាំងអស់' },
  previewAll: { en: 'Preview All', km: 'ស្ដាប់ទាំងអស់' },
  character: { en: 'Character', km: 'តួអង្គ' },
  voice: { en: 'Voice', km: 'សំឡេង' },
  khmerText: { en: 'Khmer Text', km: 'អត្ថបទខ្មែរ' },
  emotion: { en: 'Emotion', km: 'អារម្មណ៍' },
  speed: { en: 'Speed', km: 'ល្បឿន' },
  pitch: { en: 'Pitch', km: 'កម្ពស់សំឡេង' },
  volume: { en: 'Volume', km: 'កម្រិតសំឡេង' },
  generate: { en: 'Generate', km: 'បង្កើត' },
  preview: { en: 'Preview', km: 'មើលជាមុន' },
  cancel: { en: 'Cancel', km: 'បោះបង់' },
  save: { en: 'Save', km: 'រក្សាទុក' },
  autoDub: { en: 'AUTO DUB', km: 'បញ្ចូលសំឡេងស្វ័យប្រវត្តិ' },
  addCharacter: { en: 'Add Line', km: 'បន្ថែមឃ្លា' },
  timeline: { en: 'Timeline', km: 'បន្ទាត់ពេល' },
  mixer: { en: 'Audio Mixer', km: 'ឧបករណ៍លាយសំឡេង' },
} as const;

export type LabelKey = keyof typeof L;

export const EMOTIONS: { id: string; en: string; km: string; color: string }[] = [
  { id: 'neutral', en: 'Normal', km: 'ធម្មតា', color: '#60a5fa' },
  { id: 'happy', en: 'Happy', km: 'សប្បាយ', color: '#22c55e' },
  { id: 'sad', en: 'Sad', km: 'សោកសៅ', color: '#a78bfa' },
  { id: 'angry', en: 'Angry', km: 'ខឹង', color: '#ef4444' },
  { id: 'excited', en: 'Excited', km: 'រំភើប', color: '#f59e0b' },
  { id: 'fear', en: 'Fear', km: 'ភ័យខ្លាច', color: '#94a3b8' },
  { id: 'surprised', en: 'Surprised', km: 'ភ្ញាក់ផ្អើល', color: '#ec4899' },
  { id: 'whisper', en: 'Whisper', km: 'ខ្សឹប', color: '#67e8f9' },
  { id: 'dramatic', en: 'Dramatic', km: 'រំជួលចិត្ត', color: '#f97316' },
];

export const emotionMeta = (id?: string) => EMOTIONS.find((e) => e.id === id) || EMOTIONS[0];
