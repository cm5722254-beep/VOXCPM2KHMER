import { useEffect, useRef } from 'react';
import { useStudio, effectiveGain } from '../store/studioStore';
import { audioEngine } from '../services/audioEngine';
import type { TimelineSegment } from '../../types';

/**
 * Drives preview playback: syncs <video> time into the store, plays AI voice clips (A1)
 * at their timeline positions, keeps the clean BGM (B1) in sync, fires SFX clips (S1)
 * and applies mixer gains + automatic ducking through the Web Audio engine.
 */
export function usePlaybackEngine(
  videoRef: React.RefObject<HTMLVideoElement>,
  segments: TimelineSegment[],
  bgmUrl: string | null,
  liveDub: boolean,
) {
  const voiceCache = useRef(new Map<string, HTMLAudioElement>());
  const activeVoice = useRef<{ key: string; el: HTMLAudioElement } | null>(null);
  const bgmEl = useRef<HTMLAudioElement | null>(null);
  const attached = useRef(false);
  const lastT = useRef(0);
  const segsRef = useRef(segments);
  segsRef.current = segments;
  const liveRef = useRef(liveDub);
  liveRef.current = liveDub;

  // Attach video element to the "original" strip (re-attach when element is remounted)
  const attachedEl = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const v = videoRef.current;
    if (!v || attachedEl.current === v) return;
    attachedEl.current = v;
    attached.current = audioEngine.attach(v, 'original');
  });

  // BGM element
  useEffect(() => {
    if (!bgmUrl) { bgmEl.current?.pause(); bgmEl.current = null; return; }
    const el = new Audio(bgmUrl);
    el.crossOrigin = 'anonymous';
    el.preload = 'auto';
    audioEngine.attach(el, 'bgm');
    bgmEl.current = el;
    return () => { el.pause(); };
  }, [bgmUrl]);

  // Main sync loop
  useEffect(() => {
    let raf = 0;
    let lastStore = 0;
    const stopVoice = () => { activeVoice.current?.el.pause(); activeVoice.current = null; };

    const getVoice = (url: string) => {
      let el = voiceCache.current.get(url);
      if (!el) {
        el = new Audio(url);
        el.preload = 'auto';
        el.crossOrigin = 'anonymous';
        audioEngine.attach(el, 'voice');
        voiceCache.current.set(url, el);
        if (voiceCache.current.size > 80) {
          const first = voiceCache.current.keys().next().value as string;
          voiceCache.current.get(first)?.pause();
          voiceCache.current.delete(first);
        }
      }
      return el;
    };

    const tick = (now: number) => {
      const v = videoRef.current;
      const st = useStudio.getState();
      if (v) {
        const t = v.currentTime;
        const playing = !v.paused && !v.ended;
        const jumped = Math.abs(t - lastT.current) > 0.5;

        // Mixer gains (track mute/hidden folds into channel gain)
        const { channels, tracks } = st;
        const g = (c: 'voice' | 'original' | 'bgm' | 'sfx', track: keyof typeof tracks) =>
          tracks[track].mute ? 0 : effectiveGain(channels, c) / Math.max(0.0001, channels.master.volume) * tracks[track].volume;
        audioEngine.setChannel('original', g('original', 'A2'), channels.original.pan);
        audioEngine.setChannel('voice', liveRef.current ? g('voice', 'A1') : 0, channels.voice.pan);
        audioEngine.setChannel('bgm', liveRef.current ? g('bgm', 'B1') : 0, channels.bgm.pan);
        audioEngine.setChannel('sfx', g('sfx', 'S1'), channels.sfx.pan);
        audioEngine.setMaster(channels.master.mute ? 0 : channels.master.volume, st.masterFx);
        if (!attached.current) v.volume = Math.min(1, g('original', 'A2') * channels.master.volume);

        // AI voice clips
        let voiceOn = false;
        if (liveRef.current && playing) {
          const seg = segsRef.current.find((s) => s.audioUrl && t >= s.start_time && t < s.end_time + 0.6);
          if (seg && seg.audioUrl) {
            const key = `${seg.line_index}:${seg.audioUrl}`;
            if (!activeVoice.current || activeVoice.current.key !== key || jumped) {
              stopVoice();
              const el = getVoice(seg.audioUrl);
              const off = Math.max(0, t - seg.start_time);
              try { el.currentTime = off; } catch { /* not loaded yet */ }
              el.playbackRate = v.playbackRate;
              el.play().catch(() => {});
              activeVoice.current = { key, el };
            }
            voiceOn = !activeVoice.current.el.paused && !activeVoice.current.el.ended;
          } else if (activeVoice.current && activeVoice.current.el.ended) stopVoice();
        } else if (activeVoice.current) stopVoice();

        audioEngine.duck(voiceOn && st.ducking.enabled, st.ducking.db, st.ducking.attack, st.ducking.release);

        // BGM sync
        const bg = bgmEl.current;
        if (bg) {
          if (liveRef.current && playing) {
            if (Math.abs(bg.currentTime - t) > 0.35) { try { bg.currentTime = t; } catch { /* ignore */ } }
            bg.playbackRate = v.playbackRate;
            if (bg.paused) bg.play().catch(() => {});
          } else if (!bg.paused) bg.pause();
        }

        // SFX clips crossing the playhead
        if (playing && !jumped) {
          for (const c of st.extraClips) {
            if (c.track === 'S1' && c.start > lastT.current && c.start <= t) audioEngine.playSfx(c.kind, Math.max(0.3, c.end - c.start));
          }
        }

        lastT.current = t;
        if (now - lastStore > 33 || jumped) {
          lastStore = now;
          if (st.currentTime !== t || st.isPlaying !== playing) st.set({ currentTime: t, isPlaying: playing });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); stopVoice(); bgmEl.current?.pause(); };
  }, [videoRef]);
}

/** Imperative transport helpers used by shortcuts, timeline and preview controls. */
export const transport = {
  video: null as HTMLVideoElement | null,
  toggle() {
    const v = this.video; if (!v) return;
    audioEngine.resume();
    if (v.paused) v.play().catch(() => {}); else v.pause();
  },
  seek(t: number) {
    const v = this.video; if (!v) return;
    const d = isFinite(v.duration) ? v.duration : t;
    v.currentTime = Math.max(0, Math.min(d, t));
    useStudio.getState().set({ currentTime: v.currentTime });
  },
  nudge(dt: number) { if (this.video) this.seek(this.video.currentTime + dt); },
  setRate(r: number) { if (this.video) this.video.playbackRate = r; useStudio.getState().set({ rate: r }); },
};
