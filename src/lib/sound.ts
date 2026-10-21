let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.08) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export const sounds = {
  chime: () => {
    playTone(523.25, 0.3, 'sine', 0.06);
    setTimeout(() => playTone(659.25, 0.3, 'sine', 0.06), 80);
    setTimeout(() => playTone(783.99, 0.4, 'sine', 0.06), 160);
  },
  discover: () => {
    playTone(523.25, 0.15, 'triangle', 0.08);
    setTimeout(() => playTone(659.25, 0.15, 'triangle', 0.08), 100);
    setTimeout(() => playTone(783.99, 0.15, 'triangle', 0.08), 200);
    setTimeout(() => playTone(1046.5, 0.4, 'triangle', 0.08), 300);
  },
  click: () => playTone(440, 0.08, 'sine', 0.04),
  soft: () => playTone(330, 0.4, 'sine', 0.05),
};
