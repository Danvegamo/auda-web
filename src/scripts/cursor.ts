import { Renderer, Triangle, Program, Mesh } from 'ogl';
import { gsap } from 'gsap';

function shouldEnable(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(pointer: coarse)').matches) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (window.innerWidth < 720) return false;
  return true;
}

function readColor(): [number, number, number] {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--cursor-color').trim();
  if (!raw) return [0.91, 0.51, 0.35];
  const parts = raw.split(',').map((s) => parseFloat(s) / 255);
  return [parts[0] || 0.91, parts[1] || 0.51, parts[2] || 0.35];
}

const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform vec3 uColor;
  uniform float uScale;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv;
    vec2 m = uMouse;
    vec2 d = p - m;
    d.x *= uResolution.x / uResolution.y;
    float dist = length(d);
    float r = 0.055 * uScale;

    // Núcleo + halo radial con falloff suave
    float core = smoothstep(r, r * 0.05, dist);
    float halo = smoothstep(r * 4.2, r * 0.9, dist) * 0.22;
    float alpha = core * 0.55 + halo;

    // Degradé interno: tono más cálido al centro, base hacia el borde
    vec3 hot = uColor * 1.15;
    vec3 base = uColor * 0.75;
    vec3 col = mix(base, hot, smoothstep(r, 0.0, dist));

    // Sutil oscilación de brillo
    alpha *= 0.92 + 0.08 * sin(uTime * 1.6);

    gl_FragColor = vec4(col, alpha);
  }
`;

function boot() {
  if (!shouldEnable()) return;

  const host = document.querySelector<HTMLElement>('.cursor-host');
  const canvas = document.getElementById('auda-cursor') as HTMLCanvasElement | null;
  if (!host || !canvas) return;

  const renderer = new Renderer({ canvas, alpha: true, dpr: Math.min(window.devicePixelRatio, 2) });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);

  const geometry = new Triangle(gl);
  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: [0.5, 0.5] },
      uResolution: { value: [window.innerWidth, window.innerHeight] },
      uColor: { value: readColor() },
      uScale: { value: 1.0 },
    },
    transparent: true,
  });
  const mesh = new Mesh(gl, { geometry, program });

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    program.uniforms.uResolution.value = [window.innerWidth, window.innerHeight];
  }
  resize();
  window.addEventListener('resize', resize);

  const mouse = { x: 0.5, y: 0.5 };
  const toX = gsap.quickTo(mouse, 'x', { duration: 0.35, ease: 'power3' });
  const toY = gsap.quickTo(mouse, 'y', { duration: 0.35, ease: 'power3' });

  window.addEventListener(
    'mousemove',
    (e) => {
      toX(e.clientX / window.innerWidth);
      toY(1 - e.clientY / window.innerHeight);
    },
    { passive: true },
  );

  const state = { scale: 1.0 };
  const toScale = gsap.quickTo(state, 'scale', { duration: 0.3, ease: 'power2' });

  document.addEventListener('mouseover', (e) => {
    const t = e.target as HTMLElement | null;
    if (!t || !t.closest) return;
    const hit = t.closest('a, button, [data-cursor-grow]');
    toScale(hit ? 2.2 : 1.0);
  });

  document.addEventListener('auda:themechange', () => {
    program.uniforms.uColor.value = readColor();
  });

  const start = performance.now();
  gsap.ticker.add(() => {
    program.uniforms.uTime.value = (performance.now() - start) / 1000;
    const m = program.uniforms.uMouse.value as number[];
    m[0] = mouse.x;
    m[1] = mouse.y;
    program.uniforms.uScale.value = state.scale;
    renderer.render({ scene: mesh });
  });

  function reveal() {
    canvas.style.display = 'block';
  }
  if (document.documentElement.dataset.entered === 'true') {
    reveal();
  } else {
    const obs = new MutationObserver(() => {
      if (document.documentElement.dataset.entered === 'true') {
        obs.disconnect();
        reveal();
      }
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-entered'] });
  }
}

if (document.readyState !== 'loading') boot();
else document.addEventListener('DOMContentLoaded', boot);
