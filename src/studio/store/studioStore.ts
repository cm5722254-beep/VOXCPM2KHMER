import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FeatureId =
  | 'dubbing' | 'tts' | 'clone' | 'subtitle' | 'effects' | 'effects3d' | 'bgm' | 'sfx' | 'color';
export type BottomTab = 'timeline' | 'subtitle' | 'mixer' | 'effects';
export type ChannelId = 'voice' | 'original' | 'bgm' | 'sfx' | 'master';
export type TrackId = 'V1' | 'A1' | 'A2' | 'B1' | 'S1' | 'FX' | 'CC';
export type AiPanelTab = 'inspector' | 'tools' | 'queue';

export interface ChannelState { volume: number; pan: number; mute: boolean; solo: boolean }
export interface TrackState { mute: boolean; solo: boolean; lock: boolean; hidden: boolean; volume: number }
export interface ExtraClip {
  id: string; track: 'B1' | 'S1' | 'FX'; start: number; end: number; label: string;
  kind: string; fadeIn: number; fadeOut: number; color?: string;
}
export interface VoiceProfile {
  id: string; name: string; voiceId: string; gender: 'male' | 'female'; age: string; style: string;
  emotion: string; speed: number; pitch: number; volume: number; breath: number; expressiveness: number;
  builtin?: boolean;
}
export interface CharacterMeta { age?: string; style?: string; profileId?: string; language?: string; model?: string }
export interface ColorGrade {
  exposure: number; contrast: number; highlights: number; shadows: number; temperature: number;
  tint: number; saturation: number; vibrance: number; sharpness: number; preset: string;
}
export interface Notification { id: string; message: string; type: string; time: number; read: boolean }
export interface Job { id: string; label: string; progress: number; status: 'running' | 'done' | 'error'; detail?: string }

export const DEFAULT_COLOR: ColorGrade = {
  exposure: 0, contrast: 0, highlights: 0, shadows: 0, temperature: 0, tint: 0,
  saturation: 0, vibrance: 0, sharpness: 0, preset: 'none',
};

const ch = (volume = 1): ChannelState => ({ volume, pan: 0, mute: false, solo: false });
const tr = (): TrackState => ({ mute: false, solo: false, lock: false, hidden: false, volume: 1 });

export const BUILTIN_PROFILES: VoiceProfile[] = [
  ['Female 01', 'female', 'Adult', 'Natural'], ['Male 01', 'male', 'Adult', 'Natural'],
  ['Young Female', 'female', 'Young', 'Bright'], ['Young Male', 'male', 'Young', 'Energetic'],
  ['Old Male', 'male', 'Elder', 'Wise'], ['Old Female', 'female', 'Elder', 'Warm'],
  ['Villain', 'male', 'Adult', 'Dark'], ['Narrator', 'male', 'Adult', 'Storyteller'],
  ['Child', 'female', 'Child', 'Playful'], ['AI Custom Voice', 'female', 'Adult', 'Custom'],
].map(([name, gender, age, style], i) => ({
  id: `builtin-${i}`, name: name as string, voiceId: '', gender: gender as 'male' | 'female', age: age as string,
  style: style as string, emotion: name === 'Villain' ? 'angry' : 'neutral',
  speed: name === 'Old Male' || name === 'Old Female' ? 0.92 : name === 'Child' ? 1.08 : 1,
  pitch: name === 'Child' ? 3 : name === 'Villain' ? -3 : name.startsWith('Old') ? -1 : 0,
  volume: 1, breath: 0.3, expressiveness: 0.6, builtin: true,
}));

interface StudioState {
  // Layout
  sidebarCollapsed: boolean;
  aiPanelOpen: boolean;
  aiPanelTab: AiPanelTab;
  feature: FeatureId;
  bottomTab: BottomTab;
  showSafeArea: boolean;
  showSubtitleOverlay: boolean;
  previewQuality: 'auto' | 'full' | 'half' | 'quarter';
  timelineZoom: number; // px per second
  snapping: boolean;
  lang: 'both' | 'km' | 'en';
  previewSource: 'live' | 'output';

  // Playback (not persisted)
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  rate: number;

  // Selection
  selectedLine: number | null;
  selectedClip: { track: TrackId; id: string } | null;

  // Audio
  channels: Record<ChannelId, ChannelState>;
  ducking: { enabled: boolean; db: number; attack: number; release: number };
  masterFx: { limiter: boolean; compressor: boolean; eq: boolean; targetLufs: number };
  tracks: Record<TrackId, TrackState>;
  extraClips: ExtraClip[];
  bgm: { category: string; fadeIn: number; fadeOut: number; loop: boolean; duck: boolean; aiMatch: boolean };

  // Characters & voices
  voiceProfiles: VoiceProfile[];
  characterMeta: Record<string, CharacterMeta>;

  // Visual
  colorGrade: ColorGrade;

  // AI providers
  providers: { tts: string; translate: string; asr: string; llm: string };

  // Overlays
  commandOpen: boolean;
  generateFor: number | null;
  autoDubOpen: boolean;
  exportOpen: boolean;

  // Feedback
  notifications: Notification[];
  jobs: Job[];

  set: (patch: Partial<StudioState>) => void;
  setChannel: (id: ChannelId, patch: Partial<ChannelState>) => void;
  setTrack: (id: TrackId, patch: Partial<TrackState>) => void;
  addClip: (clip: Omit<ExtraClip, 'id'>) => string;
  updateClip: (id: string, patch: Partial<ExtraClip>) => void;
  removeClip: (id: string) => void;
  saveProfile: (p: Omit<VoiceProfile, 'id'> & { id?: string }) => void;
  deleteProfile: (id: string) => void;
  setCharacterMeta: (name: string, patch: CharacterMeta) => void;
  pushNotification: (message: string, type: string) => void;
  markAllRead: () => void;
  startJob: (label: string) => string;
  updateJob: (id: string, patch: Partial<Job>) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useStudio = create<StudioState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      aiPanelOpen: true,
      aiPanelTab: 'inspector',
      feature: 'dubbing',
      bottomTab: 'timeline',
      showSafeArea: false,
      showSubtitleOverlay: true,
      previewQuality: 'auto',
      timelineZoom: 14,
      snapping: true,
      lang: 'both',
      previewSource: 'live',
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      rate: 1,

      selectedLine: null,
      selectedClip: null,

      channels: { voice: ch(1), original: ch(0.8), bgm: ch(0.85), sfx: ch(0.9), master: ch(1) },
      ducking: { enabled: true, db: -12, attack: 50, release: 300 },
      masterFx: { limiter: true, compressor: true, eq: false, targetLufs: -14 },
      tracks: { V1: tr(), A1: tr(), A2: tr(), B1: tr(), S1: tr(), FX: tr(), CC: tr() },
      extraClips: [],
      bgm: { category: 'Cinematic', fadeIn: 1.5, fadeOut: 2, loop: true, duck: true, aiMatch: false },

      voiceProfiles: BUILTIN_PROFILES,
      characterMeta: {},

      colorGrade: DEFAULT_COLOR,

      providers: { tts: 'voxcpm', translate: 'gemini', asr: 'gemini', llm: 'gemini' },

      commandOpen: false,
      generateFor: null,
      autoDubOpen: false,
      exportOpen: false,

      notifications: [],
      jobs: [],

      set: (patch) => set(patch as any),
      setChannel: (id, patch) => set((s) => ({ channels: { ...s.channels, [id]: { ...s.channels[id], ...patch } } })),
      setTrack: (id, patch) => set((s) => ({ tracks: { ...s.tracks, [id]: { ...s.tracks[id], ...patch } } })),
      addClip: (clip) => {
        const id = uid();
        set((s) => ({ extraClips: [...s.extraClips, { ...clip, id }] }));
        return id;
      },
      updateClip: (id, patch) => set((s) => ({ extraClips: s.extraClips.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeClip: (id) => set((s) => ({ extraClips: s.extraClips.filter((c) => c.id !== id) })),
      saveProfile: (p) => {
        const id = p.id && !p.builtin ? p.id : `custom-${uid()}`;
        set((s) => ({
          voiceProfiles: [...s.voiceProfiles.filter((x) => x.id !== id), { ...p, id, builtin: false }],
        }));
      },
      deleteProfile: (id) => set((s) => ({ voiceProfiles: s.voiceProfiles.filter((p) => p.id !== id || p.builtin) })),
      setCharacterMeta: (name, patch) =>
        set((s) => ({ characterMeta: { ...s.characterMeta, [name]: { ...s.characterMeta[name], ...patch } } })),
      pushNotification: (message, type) =>
        set((s) => ({
          notifications: [{ id: uid(), message, type, time: Date.now(), read: false }, ...s.notifications].slice(0, 60),
        })),
      markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      startJob: (label) => {
        const id = uid();
        set((s) => ({ jobs: [{ id, label, progress: 0, status: 'running' as const }, ...s.jobs].slice(0, 30) }));
        return id;
      },
      updateJob: (id, patch) => set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)) })),
    }),
    {
      name: 'kdp-studio-v1',
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed, aiPanelOpen: s.aiPanelOpen, aiPanelTab: s.aiPanelTab, feature: s.feature,
        bottomTab: s.bottomTab, showSafeArea: s.showSafeArea, showSubtitleOverlay: s.showSubtitleOverlay,
        previewQuality: s.previewQuality, timelineZoom: s.timelineZoom, snapping: s.snapping, lang: s.lang,
        channels: s.channels, ducking: s.ducking, masterFx: s.masterFx, tracks: s.tracks, extraClips: s.extraClips,
        bgm: s.bgm, voiceProfiles: s.voiceProfiles, characterMeta: s.characterMeta, colorGrade: s.colorGrade,
        providers: s.providers, rate: s.rate, previewSource: s.previewSource,
      }),
    }
  )
);

/** Effective gain of a mixer channel including mute/solo logic and master. */
export function effectiveGain(channels: Record<ChannelId, ChannelState>, id: Exclude<ChannelId, 'master'>): number {
  const anySolo = (['voice', 'original', 'bgm', 'sfx'] as const).some((k) => channels[k].solo);
  const c = channels[id];
  if (c.mute || channels.master.mute) return 0;
  if (anySolo && !c.solo) return 0;
  return c.volume * channels.master.volume;
}

export const fmtTime = (t: number, withFrames = false) => {
  if (!isFinite(t) || t < 0) t = 0;
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  const base = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return withFrames ? `${base}:${String(Math.floor((t % 1) * 30)).padStart(2, '0')}` : base;
};
