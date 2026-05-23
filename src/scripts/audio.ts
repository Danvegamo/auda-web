// Diseño sonoro híbrido:
//   1) Si existe /audio/ambient.mp3 (público), usar HTMLAudioElement con loop.
//   2) Si no, sintetizar ruido rosa-ish filtrado (autoplay-safe).
// Toda inicialización ocurre bajo gesto del usuario (botón loader o sound-toggle).

const AMBIENT_URL = '/audio/ambient.mp3';
const AMBIENT_LEVEL = 0.018;
const FILE_LEVEL = 0.35;

let ctx: AudioContext | null = null;
let synthGain: GainNode | null = null;
let fileEl: HTMLAudioElement | null = null;
let fileNode: MediaElementAudioSourceNode | null = null;
let fileGain: GainNode | null = null;
let mode: 'file' | 'synth' | null = null;
let started = false;
let muted = false;

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

async function hasAmbientFile(): Promise<boolean> {
  if (typeof fetch === 'undefined') return false;
  try {
    const res = await fetch(AMBIENT_URL, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

function startSynth(ac: AudioContext) {
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

  synthGain = ac.createGain();
  synthGain.gain.value = 0;

  noise.connect(lp).connect(synthGain).connect(ac.destination);
  noise.start();
  synthGain.gain.linearRampToValueAtTime(AMBIENT_LEVEL, ac.currentTime + 2.5);
  mode = 'synth';
}

function startFile(ac: AudioContext) {
  fileEl = new Audio(AMBIENT_URL);
  fileEl.loop = true;
  fileEl.preload = 'auto';
  fileEl.crossOrigin = 'anonymous';
  fileEl.volume = 1.0;

  fileNode = ac.createMediaElementSource(fileEl);
  fileGain = ac.createGain();
  fileGain.gain.value = 0;
  fileNode.connect(fileGain).connect(ac.destination);

  fileEl.play().catch(() => {
    // Si el play falla por restricciones, caemos a synth
    fileEl = null;
    fileNode = null;
    fileGain = null;
    startSynth(ac);
    return;
  });

  fileGain.gain.linearRampToValueAtTime(FILE_LEVEL, ac.currentTime + 1.8);
  mode = 'file';
}

export async function startAmbient(): Promise<void> {
  const ac = ensureCtx();
  if (!ac || started) return;
  started = true;
  const hasFile = await hasAmbientFile();
  if (hasFile) startFile(ac);
  else startSynth(ac);
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

// Toggle desde la interfaz. Devuelve true si el sonido queda activo.
export function toggleAmbient(): boolean {
  if (!started) {
    // fire-and-forget; el async no bloquea el toggle visual
    void startAmbient();
    muted = false;
    return true;
  }
  muted = !muted;
  const ac = ensureCtx();
  const t = ac?.currentTime ?? 0;
  if (mode === 'synth' && synthGain) {
    synthGain.gain.linearRampToValueAtTime(muted ? 0 : AMBIENT_LEVEL, t + 0.4);
  } else if (mode === 'file' && fileGain) {
    fileGain.gain.linearRampToValueAtTime(muted ? 0 : FILE_LEVEL, t + 0.4);
  }
  return !muted;
}

export function isAudioOn() {
  return started && !muted;
}
