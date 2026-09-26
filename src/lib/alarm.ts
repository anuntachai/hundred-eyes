export interface SirenSegment {
  at: number;
  freq: number;
}

let audioCtx: AudioContext | null = null;

export function sirenSchedule(cycles = 8, interval = 0.25, high = 800, low = 600): SirenSegment[] {
  const segments: SirenSegment[] = [];
  for (let i = 0; i < cycles; i += 1) {
    segments.push({ at: i * interval, freq: i % 2 === 0 ? high : low });
  }
  return segments;
}

export function unlockAudio(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return false;
    audioCtx ??= new Ctor();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return true;
  } catch {
    return false;
  }
}

export function playFloodAlarm(): void {
  try {
    if (!unlockAudio() || !audioCtx) return;
    const ctx = audioCtx;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.15, t0 + 0.06);
    for (const segment of sirenSchedule()) {
      osc.frequency.setValueAtTime(segment.freq, t0 + segment.at);
    }
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 2);
  } catch {
    /* อุปกรณ์ไม่มีเสียง → ไม่ crash */
  }
  try {
    navigator.vibrate?.([400, 150, 400, 150, 400]);
  } catch {
    /* vibrate ไม่รองรับ */
  }
}
