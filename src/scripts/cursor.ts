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
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

function readMode(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--cursor-mode').trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
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
  uniform float uSolid;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv;
    vec2 m = uMouse;
    vec2 d = p - m;
    d.x *= uResolution.x / uResolution.y;
    float dist = length(d);

    if (uSolid > 0.5) {
      // Disco sólido — edge crisp, sin halo, sin oscilación, ligeramente más grande
      float r = 0.012 * uScale;
      float alpha = smoothstep(r * 1.05, r * 0.9, dist);
      gl_FragColor = vec4(uColor, alpha);
    } else {
      // Modo halo (oscuro): núcleo cálido + radial falloff + oscilación
      float r = 0.055 * uScale;
      float core = smoothstep(r, r * 0.05, dist);
      float halo = smoothstep(r * 4.2, r * 0.9, dist) * 0.22;
      float alpha = core * 0.55 + halo;
      vec3 hot = uColor * 1.15;
      vec3 base = uColor * 0.75;
      vec3 col = mix(base, hot, smoothstep(r, 0.0, dist));
      alpha *= 0.92 + 0.08 * sin(uTime * 1.6);
      gl_FragColor = vec4(col, alpha);
    }
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
      uSolid: { value: readMode() },
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
  const toX = gsap.quickTo(mouse, 'x', { duration: 0.25, ease: 'power3' });
  const toY = gsap.quickTo(mouse, 'y', { duration: 0.25, ease: 'power3' });

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

  // Fade global del cursor (lo bajamos cuando hover sobre escena 3D)
  const opa = { v: 1 };
  const toOpa = gsap.quickTo(opa, 'v', { duration: 0.3, ease: 'power2' });
  canvas.style.transition = 'opacity 0.3s ease';

  document.addEventListener('mouseover', (e) => {
    const t = e.target as HTMLElement | null;
    if (!t || !t.closest) return;
    const onTierScene = t.closest('[data-tier-scene], .tier-visual-stage');
    if (onTierScene) {
      toScale(0.7);
      toOpa(0.15);
      return;
    }
    const region = t.closest('[data-cursor]') as HTMLElement | null;
    const mode = region?.dataset.cursor;
    if (mode === 'act') toScale(2.6);
    else if (mode === 'view') toScale(1.5);
    else if (mode === 'read') toScale(0.85);
    else {
      const hit = t.closest('a, button, [data-cursor-grow], [data-magnet]');
      toScale(hit ? 2.2 : 1.0);
    }
    toOpa(1);
  });

  // Magnetic targets — quickTo por elemento, reusable
  const magnets = new Map<HTMLElement, { x: ReturnType<typeof gsap.quickTo>; y: ReturnType<typeof gsap.quickTo>; rect: DOMRect | null; active: boolean }>();
  function bindMagnet(el: HTMLElement) {
    if (magnets.has(el)) return;
    const ent = {
      x: gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3' }),
      y: gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3' }),
      rect: null as DOMRect | null,
      active: false,
    };
    magnets.set(el, ent);
    el.addEventListener('pointerenter', () => {
      ent.active = true;
      ent.rect = el.getBoundingClientRect();
    });
    el.addEventListener('pointerleave', () => {
      ent.active = false;
      ent.x(0);
      ent.y(0);
    });
  }
  document.querySelectorAll<HTMLElement>('[data-magnet]').forEach(bindMagnet);
  // Re-bind tras posibles inserciones futuras (no obligatorio en SSR)
  const moMag = new MutationObserver(() => {
    document.querySelectorAll<HTMLElement>('[data-magnet]').forEach(bindMagnet);
  });
  moMag.observe(document.body, { childList: true, subtree: true });

  window.addEventListener(
    'pointermove',
    (e) => {
      magnets.forEach((ent, el) => {
        if (!ent.active || !ent.rect) return;
        const cx = ent.rect.left + ent.rect.width / 2;
        const cy = ent.rect.top + ent.rect.height / 2;
        const dx = (e.clientX - cx) * 0.35;
        const dy = (e.clientY - cy) * 0.35;
        ent.x(Math.max(-12, Math.min(12, dx)));
        ent.y(Math.max(-10, Math.min(10, dy)));
      });
    },
    { passive: true },
  );

  document.addEventListener('auda:themechange', () => {
    program.uniforms.uColor.value = readColor();
    program.uniforms.uSolid.value = readMode();
  });

  const start = performance.now();
  gsap.ticker.add(() => {
    program.uniforms.uTime.value = (performance.now() - start) / 1000;
    const m = program.uniforms.uMouse.value as number[];
    m[0] = mouse.x;
    m[1] = mouse.y;
    program.uniforms.uScale.value = state.scale;
    canvas.style.opacity = String(opa.v);
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
