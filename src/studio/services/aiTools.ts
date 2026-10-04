import {
  Languages, Captions, Users, UserSearch, Wand2, Sparkles, Smile, Scissors, Eraser, VolumeX, Music2, Film, HeartPulse,
} from 'lucide-react';
import type { StudioBridge } from '../StudioContext';
import { useStudio } from '../store/studioStore';
import { getProvider, NotConnectedError } from './ai/providers';
import { runPool, generateLineAudio, notConnected } from './dubbing';
import { api } from '../../services/api';
import type { TimelineSegment } from '../../types';

export interface AITool {
  id: string; icon: React.ElementType; en: string; km: string; desc: string; connected: boolean;
  run: (b: StudioBridge) => Promise<void>;
}

const job = (label: string) => {
  const st = useStudio.getState();
  const id = st.startJob(label);
  return {
    progress: (p: number, detail?: string) => useStudio.getState().updateJob(id, { progress: p, detail }),
    done: (detail?: string) => useStudio.getState().updateJob(id, { progress: 1, status: 'done', detail }),
    fail: (detail?: string) => useStudio.getState().updateJob(id, { status: 'error', detail }),
  };
};

const needVideo = (b: StudioBridge) => {
  if (!b.uploadedFile) { b.showToast('Import a video first · សូមនាំចូលវីដេអូជាមុន', 'warning'); return false; }
  return true;
};

/** Text-based emotion heuristic (Khmer + Chinese punctuation & keywords). */
export function guessEmotion(s: TimelineSegment): string {
  const t = `${s.khmer_translation || ''} ${s.chinese_text || ''}`;
  if (/[!！]{2,}|ស្លាប់|殺|杀|滚|混蛋/.test(t)) return 'angry';
  if (/[?？].*[!！]|អី?!|什么|怎么可能/.test(t)) return 'surprised';
  if (/[!！]/.test(t)) return 'excited';
  if (/យំ|សោក|ឈឺចាប់|对不起|哭|伤心|再见/.test(t)) return 'sad';
  if (/សើច|សប្បាយ|哈哈|太好了|开心/.test(t)) return 'happy';
  if (/ខ្លាច|怕|救命/.test(t)) return 'fear';
  if (/\.\.\.|…/.test(t)) return 'whisper';
  return 'neutral';
}

export const AI_TOOLS: AITool[] = [
  {
    id: 'translate', icon: Languages, en: 'AI Translate', km: 'បកប្រែ AI', desc: 'Translate untranslated lines to Khmer', connected: true,
    async run(b) {
      const p = getProvider(useStudio.getState().providers.translate);
      const todo = b.segments.map((s, i) => ({ s, i })).filter(({ s }) => !s.khmer_translation && s.chinese_text);
      if (!todo.length) return b.showToast('All lines already translated · បកប្រែរួចហើយ', 'info');
      const j = job(`AI Translate (${todo.length})`);
      let n = 0;
      try {
        await runPool(todo, 3, async ({ s, i }) => {
          if (!p.translate) throw new NotConnectedError(p.name, 'translate');
          const km = await p.translate(s.chinese_text!, 'zh', 'km');
          b.setSegments((prev) => prev.map((x, k) => (k === i ? { ...x, khmer_translation: km, audioUrl: null } : x)), { skipHistory: true });
          j.progress(++n / todo.length, `${n}/${todo.length}`);
        });
        j.done(`${n} lines`);
        b.showToast(`🌐 Translated ${n} lines`, 'success');
      } catch (e: any) { j.fail(e.message); b.showToast(e.message, 'error'); }
    },
  },
  {
    id: 'subtitle', icon: Captions, en: 'AI Subtitle', km: 'អក្សររត់ AI', desc: 'Transcribe dialogue into timed subtitles', connected: true,
    async run(b) { if (needVideo(b)) await b.scanTimeline(); },
  },
  {
    id: 'speakers', icon: Users, en: 'AI Speaker Detection', km: 'រកអ្នកនិយាយ', desc: 'Detect who speaks each line', connected: true,
    async run(b) {
      if (!needVideo(b)) return;
      if (!b.segments.length) await b.scanTimeline();
      const n = new Set(b.segments.map((s) => s.speaker_name || s.speaker_id)).size;
      b.showToast(`👥 ${n} speakers detected`, 'success');
    },
  },
  {
    id: 'characters', icon: UserSearch, en: 'AI Character Detection', km: 'កំណត់តួអង្គ', desc: 'Group lines by character & gender', connected: true,
    async run(b) {
      if (!needVideo(b)) return;
      if (!b.segments.length) await b.scanTimeline();
      useStudio.getState().set({ aiPanelOpen: true, aiPanelTab: 'inspector', selectedLine: null });
      b.showToast('Characters listed in the Inspector panel', 'info');
    },
  },
  {
    id: 'assign', icon: Wand2, en: 'AI Voice Assignment', km: 'ចាត់សំឡេងស្វ័យប្រវត្តិ', desc: 'Assign a distinct voice to every character', connected: true,
    async run(b) {
      if (!b.segments.length) return b.showToast('No lines to assign', 'warning');
      const fem = b.characters.filter((c) => c.gender === 'female');
      const mal = b.characters.filter((c) => c.gender !== 'female');
      if (!fem.length && !mal.length) return b.showToast('Voice library is empty', 'warning');
      const map = new Map<string, string>();
      let fi = 0, mi = 0;
      b.segments.forEach((s) => {
        const key = s.speaker_name || s.speaker_id || 'Speaker';
        if (map.has(key)) return;
        const pool = s.gender === 'female' ? (fem.length ? fem : mal) : (mal.length ? mal : fem);
        const c = pool[(s.gender === 'female' ? fi++ : mi++) % pool.length];
        map.set(key, c.id);
      });
      b.setSegments((prev) => prev.map((s) => {
        if (s.voiceId) return s;
        const id = map.get(s.speaker_name || s.speaker_id || 'Speaker')!;
        const c = b.characters.find((x) => x.id === id);
        return { ...s, voiceId: id, voiceFilename: c?.filename, voiceLabel: c?.label };
      }));
      b.showToast(`🎭 Assigned voices to ${map.size} characters`, 'success');
    },
  },
  {
    id: 'generate', icon: Sparkles, en: 'AI Voice Generation', km: 'បង្កើតសំឡេង AI', desc: 'Generate every pending line', connected: true,
    async run(b) {
      const todo = b.segments.map((s, i) => (s.audioUrl ? -1 : i)).filter((i) => i >= 0);
      if (!todo.length) return b.showToast('All lines are already voiced', 'info');
      const j = job(`AI Voice Generation (${todo.length})`);
      let n = 0, ok = 0;
      await runPool(todo, 3, async (i) => {
        try {
          const url = await generateLineAudio(b.segments[i], i);
          ok++;
          b.setSegments((prev) => prev.map((x, k) => (k === i ? { ...x, audioUrl: url, status: 'ready' } : x)), { skipHistory: true });
        } catch { /* counted below */ }
        j.progress(++n / todo.length, `${n}/${todo.length}`);
      });
      j.done(`${ok}/${todo.length}`);
      b.showToast(`✨ ${ok}/${todo.length} voices generated`, ok ? 'success' : 'error');
    },
  },
  {
    id: 'emotion', icon: HeartPulse, en: 'AI Emotion Detection', km: 'រកអារម្មណ៍', desc: 'Tag each line with an emotion (text analysis)', connected: true,
    async run(b) {
      if (!b.segments.length) return b.showToast('No lines', 'warning');
      b.setSegments((prev) => prev.map((s) => (s.emotion && s.emotion !== 'neutral' ? s : { ...s, emotion: guessEmotion(s) })));
      b.showToast('🎭 Emotions tagged · បានកំណត់អារម្មណ៍', 'success');
    },
  },
  {
    id: 'separate', icon: Scissors, en: 'AI Background Separation', km: 'បំបែកផ្ទៃខាងក្រោយ', desc: 'Split vocals from music & ambience (Demucs)', connected: true,
    async run(b) {
      if (!needVideo(b)) return;
      const j = job('AI Background Separation');
      j.progress(0.15, 'Demucs running…');
      try {
        const r = await api.separateAudio(b.uploadedFile!.filename, true);
        b.setCleanBgmUrl(r.bgmUrl);
        j.done(r.engine);
        b.showToast('🎼 Clean background ready on track B1', 'success');
      } catch (e: any) { j.fail(e.message); b.showToast(`Separation failed: ${e.message}`, 'error'); }
    },
  },
  {
    id: 'music', icon: Music2, en: 'AI Music Match', km: 'ជ្រើសតន្ត្រី AI', desc: 'Recommend BGM category from scene emotion', connected: true,
    async run(b) {
      const counts: Record<string, number> = {};
      b.segments.forEach((s) => { const e = s.emotion || guessEmotion(s); counts[e] = (counts[e] || 0) + 1; });
      const top = Object.entries(counts).sort((a, c) => c[1] - a[1])[0]?.[0] || 'neutral';
      const cat = ({ angry: 'Action', excited: 'Epic', sad: 'Sad', happy: 'Happy', fear: 'Suspense', surprised: 'Suspense', whisper: 'Ambient', dramatic: 'Drama' } as Record<string, string>)[top] || 'Cinematic';
      useStudio.getState().set({ bgm: { ...useStudio.getState().bgm, category: cat, aiMatch: true }, feature: 'bgm' });
      b.showToast(`🎵 Recommended BGM: ${cat} (dominant emotion: ${top})`, 'success');
    },
  },
  { id: 'lipsync', icon: Smile, en: 'AI Lip Sync', km: 'តម្រឹមបបូរមាត់', desc: 'Re-time mouth movement to Khmer audio', connected: false, async run(b) { notConnected('AI Lip Sync', b.showToast); } },
  { id: 'cleanup', icon: Eraser, en: 'AI Audio Cleanup', km: 'សម្អាតសំឡេង', desc: 'De-reverb & enhance generated voices', connected: false, async run(b) { notConnected('AI Audio Cleanup', b.showToast); } },
  { id: 'denoise', icon: VolumeX, en: 'AI Noise Removal', km: 'លុបសំឡេងរំខាន', desc: 'Remove hiss / hum from original audio', connected: false, async run(b) { notConnected('AI Noise Removal', b.showToast); } },
  { id: 'scenes', icon: Film, en: 'AI Scene Detection', km: 'រកឈុត', desc: 'Detect cuts & scenes for chaptering', connected: false, async run(b) { notConnected('AI Scene Detection', b.showToast); } },
];
