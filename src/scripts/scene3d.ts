// scene3d.ts — escenas WebGL por tier (lazy-loaded three.js + postprocessing).
// Carga three sólo cuando el primer canvas se acerca al viewport.
// Cada variant tier0..tier4 monta una escena distinta. Mouse local + scroll progress.

import type {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Object3D,
  Vector2,
  Color,
} from 'three';

type TierVariant = 'tier0' | 'tier1' | 'tier2' | 'tier3' | 'tier4';
type Accent = 'orange' | 'green' | 'blue' | 'ink';

declare global {
  interface Window {
    __audaTierProgress?: Map<number, number>;
  }
}

type ThreeNS = typeof import('three');
type PostNS = typeof import('postprocessing');

let threeModP: Promise<ThreeNS> | null = null;
let postModP: Promise<PostNS> | null = null;

function loadThree(): Promise<ThreeNS> {
  if (!threeModP) threeModP = import('three');
  return threeModP;
}
function loadPost(): Promise<PostNS> {
  if (!postModP) postModP = import('postprocessing');
  return postModP;
}

interface SceneCtx {
  THREE: ThreeNS;
  canvas: HTMLCanvasElement;
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  composer: import('postprocessing').EffectComposer | null;
  mouse: Vector2;
  mouseTarget: Vector2;
  color: Color;
  variant: TierVariant;
  accent: Accent;
  index: number;
  visible: boolean;
  raf: number;
  start: number;
  update?: (ctx: SceneCtx, time: number, progress: number) => void;
  cleanup?: () => void;
}

const allCtx: SceneCtx[] = [];

function accentToHex(accent: Accent): number {
  const cs = getComputedStyle(document.documentElement);
  const map: Record<Accent, string> = {
    orange: cs.getPropertyValue('--color-orange').trim() || '#e8825a',
    green: cs.getPropertyValue('--color-green').trim() || '#5c7c5a',
    blue: cs.getPropertyValue('--color-blue').trim() || '#3e5c76',
    ink: cs.getPropertyValue('--color-text').trim() || '#2b2b2b',
  };
  const v = map[accent];
  if (v.startsWith('#')) return parseInt(v.slice(1), 16);
  return 0xe8825a;
}

function getProgress(index: number): number {
  return window.__audaTierProgress?.get(index) ?? 0;
}

// ---------- Builders por variant ----------

function buildTier0(ctx: SceneCtx) {
  const { THREE, scene, color } = ctx;
  // Polvo que se ensambla en nodo. Particles in spherical cloud.
  const count = 1400;
  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const targets = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    // start: dispersed
    positions[i3] = (Math.random() - 0.5) * 6;
    positions[i3 + 1] = (Math.random() - 0.5) * 6;
    positions[i3 + 2] = (Math.random() - 0.5) * 6;
    // target: spherical shell
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    const r = 1.1;
    targets[i3] = r * Math.sin(p) * Math.cos(t);
    targets[i3 + 1] = r * Math.sin(p) * Math.sin(t);
    targets[i3 + 2] = r * Math.cos(p);
  }
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('target', new THREE.BufferAttribute(targets, 3));
  const mat = new THREE.PointsMaterial({
    color,
    size: 0.025,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
  });
  const points = new THREE.Points(geom, mat);
  scene.add(points);

  // node core
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 32, 32),
    new THREE.MeshBasicMaterial({ color }),
  );
  scene.add(core);

  ctx.update = (c, time, progress) => {
    const pos = geom.attributes.position as import('three').BufferAttribute;
    const tgt = geom.attributes.target as import('three').BufferAttribute;
    const arr = pos.array as Float32Array;
    const tar = tgt.array as Float32Array;
    const k = THREE.MathUtils.smoothstep(progress, 0.05, 0.7);
    for (let i = 0; i < arr.length; i++) {
      arr[i] = arr[i] * (1 - k * 0.08) + tar[i] * k * 0.08;
    }
    pos.needsUpdate = true;
    points.rotation.y = time * 0.08 + c.mouse.x * 0.4;
    points.rotation.x = c.mouse.y * 0.25;
    core.scale.setScalar(0.6 + Math.sin(time * 1.6) * 0.08 + progress * 0.4);
  };
}

function buildTier1(ctx: SceneCtx) {
  const { THREE, scene, color } = ctx;
  // Plano ondulando — wave shader.
  const geom = new THREE.PlaneGeometry(3.4, 3.4, 96, 96);
  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: 0.18 },
    uColor: { value: new THREE.Color(color) },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uProgress: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    side: THREE.DoubleSide,
    vertexShader: `
      uniform float uTime;
      uniform float uAmp;
      uniform vec2 uMouse;
      uniform float uProgress;
      varying float vH;
      void main() {
        vec3 p = position;
        float w = sin(p.x * 1.4 + uTime * 1.2) * cos(p.y * 1.6 + uTime * 0.8);
        float m = exp(-length(p.xy - uMouse * 1.5) * 1.4) * 0.4;
        p.z += (w + m) * uAmp * (0.6 + uProgress * 0.9);
        vH = p.z;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vH;
      void main() {
        float a = smoothstep(-0.05, 0.18, vH);
        vec3 col = mix(uColor * 0.4, uColor, a);
        gl_FragColor = vec4(col, 0.65 + a * 0.3);
      }
    `,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = -Math.PI / 3;
  scene.add(mesh);

  ctx.update = (c, time, progress) => {
    uniforms.uTime.value = time;
    uniforms.uProgress.value = progress;
    uniforms.uMouse.value.set(c.mouse.x, c.mouse.y);
    mesh.rotation.z = c.mouse.x * 0.2;
  };
}

function buildTier2(ctx: SceneCtx) {
  const { THREE, scene, color } = ctx;
  // Torre de nodos conectados por líneas.
  const group = new THREE.Group();
  const nodes: Object3D[] = [];
  const N = 8;
  const linePts: number[] = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const node = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.08, 0),
      new THREE.MeshBasicMaterial({ color }),
    );
    const angle = t * Math.PI * 1.4;
    node.position.set(
      Math.cos(angle) * (0.6 + t * 0.4),
      -1.2 + t * 2.4,
      Math.sin(angle) * (0.6 + t * 0.4),
    );
    group.add(node);
    nodes.push(node);
    if (i > 0) {
      const prev = nodes[i - 1].position;
      linePts.push(prev.x, prev.y, prev.z, node.position.x, node.position.y, node.position.z);
    }
  }
  const lineGeom = new THREE.BufferGeometry();
  lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePts, 3));
  const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 });
  const lines = new THREE.LineSegments(lineGeom, lineMat);
  group.add(lines);
  scene.add(group);

  ctx.update = (c, time, progress) => {
    group.rotation.y = time * 0.15 + c.mouse.x * 0.6;
    group.rotation.x = c.mouse.y * 0.3;
    nodes.forEach((n, i) => {
      const t = i / (N - 1);
      n.scale.setScalar(0.6 + progress * (0.6 + t * 0.8) + Math.sin(time * 2 + i) * 0.08);
    });
    c.camera.position.z = 3.4 - progress * 0.6;
  };
}

function buildTier3(ctx: SceneCtx) {
  const { THREE, scene, color } = ctx;
  // Hub + spokes.
  const group = new THREE.Group();
  const hub = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.32, 1),
    new THREE.MeshBasicMaterial({ color, wireframe: true }),
  );
  group.add(hub);

  const SPOKES = 8;
  const orbitNodes: Object3D[] = [];
  const linePts: number[] = [];
  for (let i = 0; i < SPOKES; i++) {
    const a = (i / SPOKES) * Math.PI * 2;
    const r = 1.2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r * 0.7;
    const z = (i % 2 === 0 ? 1 : -1) * 0.4;
    const node = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.1, 0),
      new THREE.MeshBasicMaterial({ color }),
    );
    node.position.set(x, y, z);
    group.add(node);
    orbitNodes.push(node);
    linePts.push(0, 0, 0, x, y, z);
  }
  const lineGeom = new THREE.BufferGeometry();
  lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePts, 3));
  const lines = new THREE.LineSegments(
    lineGeom,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 }),
  );
  group.add(lines);
  scene.add(group);

  ctx.update = (c, time, _p) => {
    group.rotation.y = time * 0.25 + c.mouse.x * 0.9;
    group.rotation.x = c.mouse.y * 0.5;
    hub.rotation.x = time * 0.6;
    hub.rotation.z = time * 0.4;
    orbitNodes.forEach((n, i) => {
      n.scale.setScalar(0.8 + Math.sin(time * 2 + i * 0.7) * 0.2);
    });
  };
}

function buildTier4(ctx: SceneCtx) {
  const { THREE, scene, color } = ctx;
  // Torus holográfico loop.
  const geom = new THREE.TorusGeometry(0.9, 0.28, 32, 128);
  const uniforms = {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
    uProgress: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vN;
      void main() {
        vUv = uv;
        vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uProgress;
      varying vec2 vUv;
      varying vec3 vN;
      void main() {
        float stripes = sin(vUv.x * 60.0 + uTime * 2.0) * 0.5 + 0.5;
        float fres = pow(1.0 - abs(vN.z), 1.8);
        vec3 col = mix(uColor * 0.45, uColor, fres * stripes);
        float a = 0.4 + fres * 0.6 + uProgress * 0.2;
        gl_FragColor = vec4(col, a);
      }
    `,
  });
  const torus = new THREE.Mesh(geom, mat);
  scene.add(torus);

  ctx.update = (c, time, progress) => {
    uniforms.uTime.value = time;
    uniforms.uProgress.value = progress;
    torus.rotation.x = time * 0.3 + c.mouse.y * 0.4;
    torus.rotation.y = time * 0.5 + c.mouse.x * 0.7;
    c.camera.position.z = 2.6 + Math.sin(time * 0.4) * 0.2;
  };
}

const builders: Record<TierVariant, (ctx: SceneCtx) => void> = {
  tier0: buildTier0,
  tier1: buildTier1,
  tier2: buildTier2,
  tier3: buildTier3,
  tier4: buildTier4,
};

// ---------- Mount/lifecycle ----------

async function mountScene(
  canvas: HTMLCanvasElement,
  variant: TierVariant,
  accent: Accent,
  index: number,
): Promise<SceneCtx | null> {
  const stage = canvas.closest<HTMLElement>('.tier-visual-stage');
  try {
    const THREE = await loadThree();
    const colorHex = accentToHex(accent);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 3.4);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(160, rect.width);
    const h = Math.max(160, rect.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    const ctx: SceneCtx = {
      THREE,
      canvas,
      scene,
      camera,
      renderer,
      composer: null,
      mouse: new THREE.Vector2(0, 0),
      mouseTarget: new THREE.Vector2(0, 0),
      color: new THREE.Color(colorHex),
      variant,
      accent,
      index,
      visible: false,
      raf: 0,
      start: performance.now(),
    };

    builders[variant](ctx);

    // Postprocessing — desktop only
    const desktop = window.matchMedia('(min-width: 880px) and (pointer: fine)').matches;
    if (desktop) {
      try {
        const POST = await loadPost();
        const composer = new POST.EffectComposer(renderer, { multisampling: 0 });
        composer.addPass(new POST.RenderPass(scene, camera));
        const bloom = new POST.BloomEffect({
          intensity: 0.35,
          luminanceThreshold: 0.4,
          luminanceSmoothing: 0.4,
          mipmapBlur: true,
        });
        composer.addPass(new POST.EffectPass(camera, bloom));
        composer.setSize(w, h);
        ctx.composer = composer;
      } catch {
        // sin postprocessing — sigue funcionando
      }
    }

    // Mouse local
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      ctx.mouseTarget.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ctx.mouseTarget.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    };
    const onLeave = () => ctx.mouseTarget.set(0, 0);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);

    // Resize observer
    const ro = new ResizeObserver(() => {
      const r2 = canvas.getBoundingClientRect();
      const W = Math.max(160, r2.width);
      const H = Math.max(160, r2.height);
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      ctx.composer?.setSize(W, H);
    });
    ro.observe(canvas);

    ctx.cleanup = () => {
      cancelAnimationFrame(ctx.raf);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      ro.disconnect();
      renderer.dispose();
    };

    return ctx;
  } catch (e) {
    console.warn('[scene3d] mount failed', variant, e);
    if (stage) stage.dataset['3dFail'] = 'true';
    return null;
  }
}

function loop(ctx: SceneCtx) {
  if (!ctx.visible) return;
  const t = (performance.now() - ctx.start) / 1000;
  ctx.mouse.x += (ctx.mouseTarget.x - ctx.mouse.x) * 0.08;
  ctx.mouse.y += (ctx.mouseTarget.y - ctx.mouse.y) * 0.08;
  const progress = getProgress(ctx.index);
  ctx.update?.(ctx, t, progress);
  if (ctx.composer) ctx.composer.render();
  else ctx.renderer.render(ctx.scene, ctx.camera);
  ctx.raf = requestAnimationFrame(() => loop(ctx));
}

function renderOnce(ctx: SceneCtx) {
  const t = (performance.now() - ctx.start) / 1000;
  ctx.update?.(ctx, t, getProgress(ctx.index));
  if (ctx.composer) ctx.composer.render();
  else ctx.renderer.render(ctx.scene, ctx.camera);
}

async function boot() {
  if (typeof window === 'undefined') return;
  window.__audaTierProgress ??= new Map<number, number>();
  const canvases = document.querySelectorAll<HTMLCanvasElement>('canvas[data-tier-scene]');
  if (!canvases.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const canvas = entry.target as HTMLCanvasElement;
        const ctx = allCtx.find((c) => c.canvas === canvas);
        if (!ctx) return;
        ctx.visible = entry.isIntersecting;
        if (entry.isIntersecting) {
          if (reduce) renderOnce(ctx);
          else loop(ctx);
        } else {
          cancelAnimationFrame(ctx.raf);
        }
      });
    },
    { rootMargin: '120px' },
  );

  for (const canvas of Array.from(canvases)) {
    const stage = canvas.closest<HTMLElement>('.tier-visual-stage');
    if (!stage) continue;
    const variant = canvas.dataset.tierScene as TierVariant | undefined;
    const accent = (stage.dataset.accent as Accent) || 'orange';
    const index = parseInt(stage.dataset.tierIndex || '0', 10);
    if (!variant) continue;
    if (reduce) stage.dataset.reduce = 'true';
    const ctx = await mountScene(canvas, variant, accent, index);
    if (ctx) {
      allCtx.push(ctx);
      observer.observe(canvas);
    }
  }
}

let booted = false;
function safeBoot() {
  if (booted) return;
  booted = true;
  void boot();
}

document.addEventListener('astro:page-load', safeBoot);
if (document.readyState !== 'loading') safeBoot();
else document.addEventListener('DOMContentLoaded', safeBoot);

document.addEventListener('astro:before-swap', () => {
  for (const ctx of allCtx.splice(0)) ctx.cleanup?.();
  booted = false;
});
