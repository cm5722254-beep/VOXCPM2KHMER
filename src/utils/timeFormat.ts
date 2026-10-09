/**
 * Time formatting utilities — Dubber Dang Pro v3.1
 * Used across timeline, dialogue table, and export modules
 */

/**
 * Format seconds to MM:SS.cc (minutes:seconds.centiseconds)
 * Used in dialogue table and timeline ruler
 * @example formatTime(93.5) → "01:33.50"
 */
export function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '00:00.00';
  const m  = Math.floor(sec / 60);
  const s  = Math.floor(sec % 60);
  const cs = Math.floor((sec % 1) * 100);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

/**
 * Format seconds to HH:MM:SS (for export/SRT subtitle format)
 * @example formatSRT(3661.5) → "01:01:01,500"
 */
export function formatSRT(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '00:00:00,000';
  const h   = Math.floor(sec / 3600);
  const m   = Math.floor((sec % 3600) / 60);
  const s   = Math.floor(sec % 60);
  const ms  = Math.floor((sec % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

/**
 * Format seconds to human-readable duration
 * @example formatDuration(93) → "1m 33s"
 * @example formatDuration(45) → "45s"
 */
export function formatDuration(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0s';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Parse "MM:SS.cc" back to seconds
 * @example parseTime("01:33.50") → 93.5
 */
export function parseTime(timeStr: string): number {
  const match = timeStr.match(/^(\d+):(\d+)\.(\d+)$/);
  if (!match) return 0;
  const [, m, s, cs] = match;
  return parseInt(m) * 60 + parseInt(s) + parseInt(cs) / 100;
}

/**
 * Get pixel offset for a time value on the timeline
 * @param sec      — time in seconds
 * @param zoom     — zoom level (1 = 60px/sec)
 * @param pxPerSec — base pixels per second (default 60)
 */
export function timeToPixel(sec: number, zoom = 1, pxPerSec = 60): number {
  return sec * zoom * pxPerSec;
}

/**
 * Convert pixel offset back to time
 */
export function pixelToTime(px: number, zoom = 1, pxPerSec = 60): number {
  return px / (zoom * pxPerSec);
}

/**
 * Clamp a time value between 0 and duration
 */
export function clampTime(time: number, duration: number): number {
  return Math.max(0, Math.min(time, duration));
}
