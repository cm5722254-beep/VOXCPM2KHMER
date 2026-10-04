import { getProvider, NotConnectedError } from './ai/providers';
import { api } from '../../services/api';
import type { TimelineSegment } from '../../types';
import { useStudio } from '../store/studioStore';

export const AUTO_DUB_STEPS = [
  { id: 'analyze', en: 'Analyze Video', km: 'វិភាគវីដេអូ' },
  { id: 'speech', en: 'Detect Speech', km: 'រកឃើញការនិយាយ' },
  { id: 'speakers', en: 'Detect Speakers', km: 'រកអ្នកនិយាយ' },
  { id: 'characters', en: 'Identify Characters', km: 'កំណត់តួអង្គ' },
  { id: 'translate', en: 'Translate to Khmer', km: 'បកប្រែជាខ្មែរ' },
  { id: 'voice', en: 'Generate Khmer Voice', km: 'បង្កើតសំឡេងខ្មែរ' },
  { id: 'sync', en: 'Sync Voice Timing', km: 'តម្រឹមពេលវេលា' },
  { id: 'preserve', en: 'Preserve Background Audio', km: 'រក្សាសំឡេងផ្ទៃខាងក្រោយ' },
  { id: 'mix', en: 'Mix Audio', km: 'លាយសំឡេង' },
  { id: 'final', en: 'Create Final Dub', km: 'បង្កើតវីដេអូចុងក្រោយ' },
] as const;
export type AutoDubStepId = (typeof AUTO_DUB_STEPS)[number]['id'];
export type StepStatus = 'pending' | 'running' | 'done' | 'error' | 'skipped';

export function segmentTTSRequest(seg: TimelineSegment, idx: number) {
  return {
    text: seg.khmer_translation || seg.chinese_text || '',
    lineIndex: idx,
    gender: seg.gender || 'male',
    voiceId: seg.voiceId || 'voxcpm-voice-actor',
    speakerId: seg.speaker_role,
    emotion: seg.emotion || 'neutral',
    speed: seg.speed ?? 1,
    pitch: seg.pitch ?? 0,
    volume: seg.volume ?? 1,
    breathiness: seg.breathiness,
    intensity: seg.emotionIntensity ?? seg.intensity,
  };
}

/** Generate a single line through the active TTS provider. */
export async function generateLineAudio(seg: TimelineSegment, idx: number): Promise<string> {
  const providerId = useStudio.getState().providers.tts;
  const p = getProvider(providerId);
  if (!p.connected || !p.tts) throw new NotConnectedError(p.name, 'tts');
  const req = segmentTTSRequest(seg, idx);
  if (!req.text.trim()) throw new Error(`Line #${idx + 1} has no text`);
  const r = await p.tts(req);
  return r.audioUrl;
}

/** Run tasks with limited concurrency so the UI never freezes. */
export async function runPool<T>(items: T[], limit: number, worker: (item: T, i: number) => Promise<void>) {
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      await worker(items[i], i);
    }
  });
  await Promise.all(runners);
}

export interface AutoDubContext {
  filename: string;
  segments: TimelineSegment[];
  setSegments: (s: TimelineSegment[]) => void;
  cleanBgmUrl: string | null;
  setCleanBgmUrl: (u: string | null) => void;
  onStep: (id: AutoDubStepId, status: StepStatus, detail?: string, progress?: number) => void;
  signal: { cancelled: boolean };
  reuseExisting: boolean;
  vocalGain: number;
  bgmGain: number;
}

/** Full 10-step automatic dubbing pipeline wired to the existing backend. */
export async function runAutoDub(ctx: AutoDubContext): Promise<{ outputVideo: string; outputAudio?: string }> {
  const s = useStudio.getState();
  const asr = getProvider(s.providers.asr);
  const check = () => { if (ctx.signal.cancelled) throw new Error('Cancelled'); };

  let segs = ctx.segments;
  // 1–5: analysis, speech, speakers, characters, translation — done by the scan endpoint
  if (!ctx.reuseExisting || segs.length === 0) {
    ctx.onStep('analyze', 'running', ctx.filename);
    if (!asr.transcribe) throw new NotConnectedError(asr.name, 'transcribe');
    const r = await asr.transcribe(ctx.filename, { scope: 'full' });
    check();
    segs = r.segments;
    ctx.onStep('analyze', 'done', r.duration ? `${Math.round(r.duration)}s` : undefined);
    ctx.onStep('speech', 'done', `${segs.length} lines`);
    const speakers = new Set(segs.map((x) => x.speaker_name || x.speaker_id || 'Speaker'));
    ctx.onStep('speakers', 'done', `${speakers.size} speakers`);
    ctx.onStep('characters', 'done', [...speakers].slice(0, 4).join(', '));
    const translated = segs.filter((x) => x.khmer_translation).length;
    ctx.onStep('translate', 'done', `${translated}/${segs.length}`);
    ctx.setSegments(segs);
  } else {
    (['analyze', 'speech', 'speakers', 'characters', 'translate'] as const).forEach((id) =>
      ctx.onStep(id, 'skipped', 'Using current timeline'));
  }
  if (segs.length === 0) throw new Error('No dialogue detected / រកមិនឃើញឃ្លាសន្ទនា');

  // 6: voices
  ctx.onStep('voice', 'running', `0/${segs.length}`, 0);
  const out = [...segs];
  let done = 0;
  await runPool(out, 3, async (seg, i) => {
    check();
    if (seg.audioUrl && ctx.reuseExisting) { done++; return; }
    try {
      const url = await generateLineAudio(seg, i);
      out[i] = { ...out[i], audioUrl: url, status: 'ready' };
    } catch (e: any) {
      out[i] = { ...out[i], status: 'error' };
    }
    done++;
    ctx.onStep('voice', 'running', `${done}/${segs.length}`, done / segs.length);
  });
  ctx.setSegments(out);
  ctx.onStep('voice', 'done', `${out.filter((x) => x.audioUrl).length}/${segs.length}`);

  // 7: timing — clamp overlaps
  ctx.onStep('sync', 'running');
  const synced = out.map((x) => ({ ...x }));
  synced.sort((a, b) => a.start_time - b.start_time);
  for (let i = 1; i < synced.length; i++) {
    if (synced[i].start_time < synced[i - 1].end_time) synced[i - 1].end_time = Math.max(synced[i - 1].start_time + 0.4, synced[i].start_time - 0.05);
  }
  ctx.setSegments(synced);
  ctx.onStep('sync', 'done');

  // 8: background preservation
  check();
  let bgm = ctx.cleanBgmUrl;
  if (!bgm) {
    ctx.onStep('preserve', 'running', 'AI stem separation (Demucs)…');
    try {
      const sep = await api.separateAudio(ctx.filename, true);
      bgm = sep.bgmUrl;
      ctx.setCleanBgmUrl(bgm);
      ctx.onStep('preserve', 'done', sep.engine);
    } catch (e: any) {
      ctx.onStep('preserve', 'error', `Fallback to vocal removal: ${e.message}`);
    }
  } else ctx.onStep('preserve', 'done', 'Clean BGM ready');

  // 9–10: mix + render
  check();
  ctx.onStep('mix', 'running');
  const res = await api.assembleCustom({
    filename: ctx.filename, segments: synced, bgmAudio: bgm || undefined, removeOriginalVocals: true,
    vocalGain: ctx.vocalGain, bgmGain: ctx.bgmGain,
  });
  ctx.onStep('mix', 'done');
  if (!res.success) throw new Error('Assemble failed');
  ctx.onStep('final', 'done', res.outputVideo);
  return { outputVideo: res.outputVideo, outputAudio: res.outputAudio };
}

/** Standard feedback for features without a backend yet. */
export function notConnected(feature: string, toast: (m: string, t?: any) => void) {
  toast(`🧩 ${feature} — UI ready, engine not connected yet (មិនទាន់ភ្ជាប់ម៉ាស៊ីន)`, 'info');
}
