// Diseño sonoro — interruptor de atención (Momento A).
// Estática de baja frecuencia muy tenue + clics secos en interacción.
// Todo se crea bajo gesto del usuario (autoplay-safe).

let ctx: AudioContext | null = null;
let ambientGain: GainNode | null = null;
let started = false;

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function startAmbient() {
  const ac = ensureCtx();
  if (!ac || started) return;
  started = true;

  // ruido rosa-ish filtrado a frecuencias bajas
  const bufferSize = 2 * ac.sampleRate;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }

  const noise = ac.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 220;

  ambientGain = ac.createGain();
  ambientGain.gain.value = 0;

  noise.connect(lp).connect(ambientGain).connect(ac.destination);
  noise.start();

  // fade-in muy suave hasta un nivel apenas perceptible
  ambientGain.gain.linearRampToValueAtTime(0.018, ac.currentTime + 2.5);
}

export function dryClick() {
  const ac = ensureCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'square';
  osc.frequency.value = 160;
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.06, ac.currentTime + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.05);
  osc.connect(g).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.06);
}

let muted = false;
const AMBIENT_LEVEL = 0.018;

// Toggle desde la interfaz. Devuelve true si el sonido queda activo.
export function toggleAmbient(): boolean {
  if (!started) {
    startAmbient();
    muted = false;
    return true;
  }
  muted = !muted;
  if (ambientGain) {
    const ac = ensureCtx();
    ambientGain.gain.linearRampToValueAtTime(
      muted ? 0 : AMBIENT_LEVEL,
      (ac?.currentTime ?? 0) + 0.4,
    );
  }
  return !muted;
}

export function isAudioOn() {
  return started && !muted;
}
