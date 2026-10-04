/**
 * Preview audio engine (Web Audio API).
 * Routes Original (video element), AI Voice clips, BGM and SFX through per-channel
 * gain → pan → analyser nodes into a master bus with optional compressor/limiter.
 * Implements automatic ducking of the original dialogue while AI voice plays.
 */
import { ChannelId } from '../store/studioStore';

type Chan = Exclude<ChannelId, 'master'>;
interface Strip { gain: GainNode; duck: GainNode; pan: StereoPannerNode; analyser: AnalyserNode }

class AudioEngine {
  ctx: AudioContext | null = null;
  strips = {} as Record<Chan, Strip>;
  master!: { gain: GainNode; comp: DynamicsCompressorNode; limiter: DynamicsCompressorNode; analyser: AnalyserNode; eq: BiquadFilterNode };
  private videoSrc = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();
  private buf = new Float32Array(1024);

  ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.ctx = ctx;
      const mg = ctx.createGain();
      const eq = ctx.createBiquadFilter(); eq.type = 'peaking'; eq.frequency.value = 3000; eq.Q.value = 0.8; eq.gain.value = 0;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.2;
      const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -1.5; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.05;
      const ma = ctx.createAnalyser(); ma.fftSize = 2048;
      mg.connect(eq).connect(comp).connect(lim).connect(ma).connect(ctx.destination);
      this.master = { gain: mg, comp, limiter: lim, analyser: ma, eq };
      (['voice', 'original', 'bgm', 'sfx'] as Chan[]).forEach((c) => {
        const gain = ctx.createGain();
        const duck = ctx.createGain();
        const pan = ctx.createStereoPanner();
        const analyser = ctx.createAnalyser(); analyser.fftSize = 1024;
        gain.connect(duck).connect(pan).connect(analyser).connect(mg);
        this.strips[c] = { gain, duck, pan, analyser };
      });
    } catch (e) {
      console.warn('Web Audio unavailable', e);
      this.ctx = null;
    }
    return this.ctx;
  }

  resume() { this.ensure(); this.ctx?.state === 'suspended' && this.ctx.resume().catch(() => {}); }

  /** Route a media element into a channel strip (only once per element). */
  attach(el: HTMLMediaElement, chan: Chan): boolean {
    const ctx = this.ensure();
    if (!ctx) return false;
    try {
      let src = this.videoSrc.get(el);
      if (!src) {
        src = ctx.createMediaElementSource(el);
        this.videoSrc.set(el, src);
      } else src.disconnect();
      src.connect(this.strips[chan].gain);
      return true;
    } catch (e) {
      console.warn('attach failed', e);
      return false;
    }
  }

  setChannel(chan: Chan, gain: number, pan: number) {
    if (!this.ctx) return;
    const s = this.strips[chan];
    s.gain.gain.setTargetAtTime(gain, this.ctx.currentTime, 0.02);
    s.pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime, 0.02);
  }

  setMaster(gain: number, fx: { limiter: boolean; compressor: boolean; eq: boolean }) {
    if (!this.ctx) return;
    this.master.gain.gain.setTargetAtTime(gain, this.ctx.currentTime, 0.02);
    this.master.comp.ratio.value = fx.compressor ? 3 : 1;
    this.master.limiter.ratio.value = fx.limiter ? 20 : 1;
    this.master.eq.gain.value = fx.eq ? 2.5 : 0;
  }

  /** Duck the original channel by `db` with attack/release in ms. */
  duck(active: boolean, db: number, attackMs: number, releaseMs: number) {
    if (!this.ctx) return;
    const target = active ? Math.pow(10, db / 20) : 1;
    const tc = (active ? attackMs : releaseMs) / 1000 / 3;
    this.strips.original.duck.gain.setTargetAtTime(target, this.ctx.currentTime, Math.max(0.005, tc));
  }

  /** Peak level 0..1 for a channel (or master). */
  level(chan: ChannelId): number {
    if (!this.ctx) return 0;
    const a = chan === 'master' ? this.master.analyser : this.strips[chan].analyser;
    const n = Math.min(this.buf.length, a.fftSize);
    const view = this.buf.subarray(0, n);
    a.getFloatTimeDomainData(view);
    let peak = 0;
    for (let i = 0; i < n; i++) { const v = Math.abs(view[i]); if (v > peak) peak = v; }
    return Math.min(1, peak);
  }

  /** Approximate short-term loudness (dBFS RMS) on master. */
  loudness(): number {
    if (!this.ctx) return -70;
    const a = this.master.analyser;
    const view = this.buf.subarray(0, Math.min(this.buf.length, a.fftSize));
    a.getFloatTimeDomainData(view);
    let sum = 0;
    for (let i = 0; i < view.length; i++) sum += view[i] * view[i];
    const rms = Math.sqrt(sum / view.length);
    return rms > 0 ? Math.max(-70, 20 * Math.log10(rms)) : -70;
  }

  /** Procedural SFX so the SFX library is audible without sample packs. */
  playSfx(kind: string, duration = 1) {
    const ctx = this.ensure();
    if (!ctx) return;
    this.resume();
    const out = this.strips.sfx.gain;
    const now = ctx.currentTime;
    const noise = () => {
      const len = Math.floor(ctx.sampleRate * duration);
      const b = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const s = ctx.createBufferSource(); s.buffer = b; return s;
    };
    const env = (g: GainNode, a: number, peak: number, r: number) => {
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(peak, now + a);
      g.gain.exponentialRampToValueAtTime(0.0001, now + a + r);
    };
    const k = kind.toLowerCase();
    if (['impact', 'door', 'footstep', 'thunder'].includes(k)) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(k === 'footstep' ? 140 : 90, now);
      o.frequency.exponentialRampToValueAtTime(35, now + 0.4);
      env(g, 0.005, k === 'thunder' ? 1 : 0.8, k === 'thunder' ? 1.6 : 0.35);
      o.connect(g).connect(out); o.start(now); o.stop(now + 2);
      if (k === 'thunder') { const n = noise(); const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600; const g2 = ctx.createGain(); env(g2, 0.05, 0.6, duration); n.connect(f).connect(g2).connect(out); n.start(now); }
      return;
    }
    if (k === 'magic') {
      [880, 1320, 1760, 2640].forEach((fq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = fq;
        g.gain.setValueAtTime(0.0001, now + i * 0.06); g.gain.exponentialRampToValueAtTime(0.25, now + i * 0.06 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.6);
        o.connect(g).connect(out); o.start(now + i * 0.06); o.stop(now + i * 0.06 + 0.7);
      });
      return;
    }
    const n = noise(); const f = ctx.createBiquadFilter(); const g = ctx.createGain();
    if (k === 'whoosh') { f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(300, now); f.frequency.exponentialRampToValueAtTime(3000, now + duration * 0.6); env(g, duration * 0.4, 0.7, duration * 0.5); }
    else if (k === 'rain' || k === 'ambience' || k === 'nature') { f.type = 'highpass'; f.frequency.value = k === 'rain' ? 2500 : 800; env(g, 0.3, 0.25, duration); }
    else if (k === 'wind') { f.type = 'lowpass'; f.frequency.value = 500; env(g, 0.5, 0.5, duration); }
    else { f.type = 'lowpass'; f.frequency.value = 1200; env(g, 0.1, 0.4, duration * 0.8); }
    n.connect(f).connect(g).connect(out); n.start(now);
  }
}

export const audioEngine = new AudioEngine();
