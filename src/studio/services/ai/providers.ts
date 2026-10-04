/**
 * AI Provider abstraction.
 * Every AI capability goes through this interface so providers can be swapped
 * (VoxCPM local, Gemini, OpenAI, NVIDIA, ElevenLabs, Azure, Local TTS, Custom API).
 */
import { api } from '../../../services/api';
import type { TimelineSegment } from '../../../types';

export type Capability =
  | 'tts' | 'translate' | 'transcribe' | 'separate' | 'emotion' | 'lipsync' | 'music' | 'cleanup' | 'scenes';

export interface TTSRequest {
  text: string; voiceId?: string; gender?: string; emotion?: string; speed?: number; pitch?: number;
  volume?: number; breathiness?: number; intensity?: number; lineIndex?: number; speakerId?: string;
}
export interface TTSResult { audioUrl: string }
export interface TranscribeResult { segments: TimelineSegment[]; duration?: number }
export interface SeparateResult { vocalsUrl: string; bgmUrl: string; engine?: string }

export interface AIProvider {
  id: string;
  name: string;
  kind: 'local' | 'cloud' | 'custom';
  capabilities: Capability[];
  /** true when the provider is wired to a working backend in this build */
  connected: boolean;
  tts?(req: TTSRequest): Promise<TTSResult>;
  translate?(text: string, from?: string, to?: string): Promise<string>;
  transcribe?(filename: string, opts?: { scope?: string; voiceMode?: string }): Promise<TranscribeResult>;
  separate?(filename: string): Promise<SeparateResult>;
}

export class NotConnectedError extends Error {
  constructor(public provider: string, public capability: string) {
    super(`${provider}: "${capability}" is not connected yet (មិនទាន់ភ្ជាប់)`);
    this.name = 'NotConnectedError';
  }
}

/** Built-in backend: VoxCPM2 / Edge Khmer TTS served by the local FastAPI server. */
const voxcpm: AIProvider = {
  id: 'voxcpm',
  name: 'VoxCPM2 (Local Server)',
  kind: 'local',
  connected: true,
  capabilities: ['tts', 'translate', 'transcribe', 'separate'],
  async tts(r) {
    const res = await api.generateLine({
      text: r.text, lineIndex: r.lineIndex, gender: r.gender, voiceId: r.voiceId, speakerId: r.speakerId,
      emotion: r.emotion, speed: r.speed, pitch: r.pitch, volume: r.volume, breathiness: r.breathiness,
      intensity: r.intensity,
    });
    if (!res.success || !res.audioUrl) throw new Error('TTS failed');
    return { audioUrl: res.audioUrl };
  },
  async translate(text, from = 'zh', to = 'km') {
    const r = await api.translate(text, from, to);
    return r.translation;
  },
  async transcribe(filename, opts) {
    const r = await api.scanTimeline(filename, opts?.scope || '180', opts?.voiceMode || 'voice_actor_clone');
    return { segments: r.segments || [], duration: r.duration };
  },
  async separate(filename) {
    const r = await api.separateAudio(filename, true);
    return { vocalsUrl: r.vocalsUrl, bgmUrl: r.bgmUrl, engine: r.engine };
  },
};

/** Gemini runs server-side (key in .env); exposed through the same backend endpoints. */
const gemini: AIProvider = {
  id: 'gemini',
  name: 'Google Gemini',
  kind: 'cloud',
  connected: true,
  capabilities: ['translate', 'transcribe', 'emotion'],
  translate: voxcpm.translate,
  transcribe: voxcpm.transcribe,
};

const placeholder = (id: string, name: string, kind: AIProvider['kind'], caps: Capability[]): AIProvider => ({
  id, name, kind, capabilities: caps, connected: false,
  async tts() { throw new NotConnectedError(name, 'tts'); },
  async translate() { throw new NotConnectedError(name, 'translate'); },
  async transcribe() { throw new NotConnectedError(name, 'transcribe'); },
  async separate() { throw new NotConnectedError(name, 'separate'); },
});

export const PROVIDERS: AIProvider[] = [
  voxcpm,
  gemini,
  placeholder('openai', 'OpenAI', 'cloud', ['tts', 'translate', 'transcribe']),
  placeholder('nvidia', 'NVIDIA Riva / NIM', 'cloud', ['tts', 'transcribe', 'lipsync']),
  placeholder('elevenlabs', 'ElevenLabs', 'cloud', ['tts']),
  placeholder('azure', 'Azure AI Speech', 'cloud', ['tts', 'translate', 'transcribe']),
  placeholder('local-tts', 'Local TTS (Piper / Coqui)', 'local', ['tts']),
  placeholder('custom', 'Custom API', 'custom', ['tts', 'translate', 'transcribe']),
];

export const getProvider = (id: string): AIProvider => PROVIDERS.find((p) => p.id === id) || voxcpm;
export const providersFor = (cap: Capability) => PROVIDERS.filter((p) => p.capabilities.includes(cap));
