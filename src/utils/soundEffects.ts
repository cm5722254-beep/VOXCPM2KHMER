/**
 * Web Audio API Sound Effects Engine for ATITEBDABBER AI Dubbing Studio
 * Provides tactile, crisp, modern audio feedback when clicking options, buttons, and switches.
 * Zero external audio files required - 100% reliable with zero network latency.
 */

let audioCtx: AudioContext | null = null;
let isMuted = false;
let lastClickTime = 0;

// Initialize sound state from localStorage
try {
  const saved = localStorage.getItem('studio_sound_muted');
  if (saved !== null) {
    isMuted = saved === 'true';
  }
} catch {
  // Ignore storage errors in restricted contexts
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundMuted(): boolean {
  return isMuted;
}

export function setSoundMuted(muted: boolean): void {
  isMuted = muted;
  try {
    localStorage.setItem('studio_sound_muted', muted ? 'true' : 'false');
  } catch {}
}

export function toggleSoundMute(): boolean {
  setSoundMuted(!isMuted);
  return isMuted;
}

/**
 * Play a crisp, pleasant option selection sound (two-tone soft chime)
 */
export function playOptionSound(volume = 0.18): void {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Oscillator 1 (Primary Tone)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(580, now);
  osc1.frequency.exponentialRampToValueAtTime(880, now + 0.045);

  gain1.gain.setValueAtTime(0.001, now);
  gain1.gain.linearRampToValueAtTime(volume, now + 0.008);
  gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);

  osc1.start(now);
  osc1.stop(now + 0.065);

  // Oscillator 2 (Subtle Sparkle Harmonic)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();

  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(1160, now + 0.015);
  osc2.frequency.exponentialRampToValueAtTime(1400, now + 0.06);

  gain2.gain.setValueAtTime(0.001, now + 0.015);
  gain2.gain.linearRampToValueAtTime(volume * 0.4, now + 0.025);
  gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);

  osc2.start(now + 0.015);
  osc2.stop(now + 0.075);
}

/**
 * Play a tactile, modern button click sound (crisp micro-pop)
 */
export function playButtonClickSound(volume = 0.15): void {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  // Rapid pitch drop produces a satisfying, tactile physical click
  osc.frequency.setValueAtTime(950, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.035);

  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.045);
}

/**
 * Play a toggle switch sound
 */
export function playToggleSound(enabled = true, volume = 0.16): void {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  if (enabled) {
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.04);
  } else {
    osc.frequency.setValueAtTime(840, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.04);
  }

  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.05);
}

/**
 * Play harmonic celebratory chime for successful actions
 */
export function playSuccessSound(volume = 0.2): void {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    const noteTime = ctx.currentTime + idx * 0.05;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteTime);

    gain.gain.setValueAtTime(0.001, noteTime);
    gain.gain.linearRampToValueAtTime(volume, noteTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteTime);
    osc.stop(noteTime + 0.2);
  });
}

/**
 * Global click listener that automatically plays sound on options and buttons.
 * Detects options, tabs, toggles, select elements, and buttons.
 */
export function initGlobalClickSound(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Debounce rapid events
    const now = Date.now();
    if (now - lastClickTime < 45) return;

    // Find interactive ancestor
    const interactiveEl = target.closest(
      'button, [role="button"], [role="tab"], [role="option"], [role="menuitem"], [role="switch"], ' +
      'input[type="radio"], input[type="checkbox"], select, option, ' +
      '[data-option], [data-tab], [data-clickable], .cursor-pointer'
    ) as HTMLElement | null;

    if (!interactiveEl) return;

    lastClickTime = now;

    // Identify if it's an option, tab, switch, or button
    const isOption = 
      interactiveEl.tagName === 'SELECT' ||
      interactiveEl.tagName === 'OPTION' ||
      interactiveEl.hasAttribute('data-option') ||
      interactiveEl.hasAttribute('data-tab') ||
      interactiveEl.getAttribute('role') === 'tab' ||
      interactiveEl.getAttribute('role') === 'option' ||
      interactiveEl.getAttribute('role') === 'switch' ||
      interactiveEl.classList.contains('tab') ||
      interactiveEl.classList.contains('option-item') ||
      interactiveEl.getAttribute('type') === 'radio' ||
      interactiveEl.getAttribute('type') === 'checkbox';

    if (isOption) {
      playOptionSound();
    } else {
      playButtonClickSound();
    }
  };

  // Use capture phase so all clicks are intercepted reliably
  document.addEventListener('click', handleClick, true);

  return () => {
    document.removeEventListener('click', handleClick, true);
  };
}
