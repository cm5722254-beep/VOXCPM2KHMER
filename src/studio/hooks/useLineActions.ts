import { create } from 'zustand';
import { useBridge } from '../StudioContext';
import { useStudio } from '../store/studioStore';
import { generateLineAudio, runPool } from '../services/dubbing';
import { NotConnectedError } from '../services/ai/providers';
import type { TimelineSegment } from '../../types';

interface GenState { busy: Record<number, boolean>; playing: number | null; setBusy: (i: number, v: boolean) => void }
export const useGenState = create<GenState>((set) => ({
  busy: {},
  playing: null,
  setBusy: (i, v) => set((s) => {
    const busy = { ...s.busy };
    if (v) busy[i] = true; else delete busy[i];
    return { busy };
  }),
}));

let previewAudio: HTMLAudioElement | null = null;
export function stopPreview() {
  previewAudio?.pause();
  previewAudio = null;
  useGenState.setState({ playing: null });
}

export function useLineActions() {
  const b = useBridge();
  const { setBusy } = useGenState();

  const update = (idx: number, patch: Partial<TimelineSegment>, skipHistory = false) =>
    b.setSegments((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)), { skipHistory });

  const play = (url: string, idx: number) => {
    stopPreview();
    const a = new Audio(url);
    previewAudio = a;
    useGenState.setState({ playing: idx });
    a.onended = () => useGenState.setState({ playing: null });
    a.play().catch(() => useGenState.setState({ playing: null }));
  };

  const generate = async (idx: number, opts: { autoplay?: boolean; quiet?: boolean } = {}) => {
    const seg = b.segments[idx];
    if (!seg) return null;
    setBusy(idx, true);
    update(idx, { status: 'generating' }, true);
    try {
      const url = await generateLineAudio(seg, idx);
      update(idx, { audioUrl: url, status: 'ready' }, true);
      if (opts.autoplay) play(url, idx);
      if (!opts.quiet) b.showToast(`🎙 Line #${idx + 1} voiced · សំឡេងរួចរាល់`, 'success');
      return url;
    } catch (e: any) {
      update(idx, { status: 'error' }, true);
      if (!opts.quiet) b.showToast(e instanceof NotConnectedError ? e.message : `Line #${idx + 1}: ${e.message}`, e instanceof NotConnectedError ? 'info' : 'error');
      return null;
    } finally {
      setBusy(idx, false);
    }
  };

  const playOrGenerate = async (idx: number) => {
    const s = b.segments[idx];
    if (useGenState.getState().playing === idx) return stopPreview();
    if (s?.audioUrl) play(s.audioUrl, idx);
    else await generate(idx, { autoplay: true });
  };

  const generateMany = async (indices: number[], label = 'Generate voices') => {
    if (indices.length === 0) return b.showToast('Nothing to generate', 'info');
    const st = useStudio.getState();
    const job = st.startJob(`${label} (${indices.length})`);
    let done = 0;
    let failed = 0;
    await runPool(indices, 3, async (idx) => {
      const ok = await generate(idx, { quiet: true });
      if (!ok) failed++;
      done++;
      useStudio.getState().updateJob(job, { progress: done / indices.length, detail: `${done}/${indices.length}` });
    });
    useStudio.getState().updateJob(job, { status: failed === indices.length ? 'error' : 'done', progress: 1, detail: `${done - failed} ok · ${failed} failed` });
    b.showToast(`✨ ${done - failed}/${indices.length} voices generated${failed ? ` · ${failed} failed` : ''}`, failed ? 'warning' : 'success');
  };

  const remove = (idx: number) => {
    b.setSegments((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, line_index: i })));
    const sel = useStudio.getState().selectedLine;
    if (sel !== null && sel >= idx) useStudio.getState().set({ selectedLine: sel === idx ? null : sel - 1 });
  };

  const insertAt = (time: number) => {
    const seg: TimelineSegment = {
      line_index: 0, start_time: Math.max(0, +time.toFixed(2)), end_time: +(time + 2.5).toFixed(2),
      speaker_name: 'New Character', gender: 'female', khmer_translation: '', chinese_text: '', status: 'draft',
      emotion: 'neutral', speed: 1, pitch: 0,
    };
    let newIdx = 0;
    b.setSegments((prev) => {
      const arr = [...prev, seg].sort((a, c) => a.start_time - c.start_time).map((s, i) => ({ ...s, line_index: i }));
      newIdx = arr.findIndex((s) => s.start_time === seg.start_time && s.status === 'draft' && !s.khmer_translation);
      return arr;
    });
    setTimeout(() => useStudio.getState().set({ selectedLine: newIdx, aiPanelOpen: true, aiPanelTab: 'inspector' }), 0);
  };

  return { update, play, generate, playOrGenerate, generateMany, remove, insertAt };
}
