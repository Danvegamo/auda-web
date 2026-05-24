import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bootCinematic } from './cinematic';
import './scene3d';

gsap.registerPlugin(ScrollTrigger);

declare global {
  interface Window {
    __lenis?: Lenis;
    __audaTierProgress?: Map<number, number>;
  }
}

function initLenis(): Lenis {
  if (window.__lenis) return window.__lenis;

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    window.__lenis?.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis;

  document.addEventListener('astro:before-swap', () => {
    window.__lenis?.stop();
  });
  document.addEventListener('astro:page-load', () => {
    window.__lenis?.start();
    ScrollTrigger.refresh();
  });

  return lenis;
}

function wrapLines(el: Element): HTMLElement[] {
  const text = el.textContent ?? '';
  const words = text.split(' ');
  el.innerHTML = words
    .map(
      (w) =>
        `<span class="word" style="display:inline-block;overflow:hidden"><span class="word-inner" style="display:inline-block">${w}&nbsp;</span></span>`,
    )
    .join('');
  return Array.from(el.querySelectorAll<HTMLElement>('.word-inner'));
}

function initReveal() {
  gsap.utils.toArray<HTMLElement>('[data-reveal="up"]').forEach((el) => {
    if (el.dataset.revealBound) return;
    el.dataset.revealBound = '1';
    el.style.opacity = '1';
    gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
    });
  });

  gsap.utils.toArray<HTMLElement>('[data-reveal="line"]').forEach((el) => {
    if (el.dataset.revealBound) return;
    el.dataset.revealBound = '1';
    el.style.opacity = '1';
    const spans = wrapLines(el);
    gsap.from(spans, {
      y: '100%',
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.06,
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
    });
  });

  gsap.utils.toArray<HTMLElement>('[data-reveal="stagger"]').forEach((el) => {
    if (el.dataset.revealBound) return;
    el.dataset.revealBound = '1';
    el.style.opacity = '1';
    const children = Array.from(el.children) as HTMLElement[];
    gsap.from(children, {
      y: 30,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
    });
  });
}

function initType() {
  gsap.utils.toArray<HTMLElement>('[data-reveal="type"]').forEach((el) => {
    if (el.dataset.revealBound) return;
    el.dataset.revealBound = '1';
    const text = el.textContent ?? '';
    el.innerHTML = text
      .split('')
      .map((ch) => (ch === ' ' ? '<span class="tc">&nbsp;</span>' : `<span class="tc">${ch}</span>`))
      .join('');
    const chars = el.querySelectorAll<HTMLElement>('.tc');
    gsap.set(el, { opacity: 1 });
    gsap.from(chars, {
      opacity: 0,
      duration: 0.01,
      stagger: 0.035,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
    });
  });
}

function initDrawLine() {
  gsap.utils.toArray<SVGPathElement>('[data-draw]').forEach((path) => {
    if (path.dataset.drawBound) return;
    if (path.closest('[data-cinematic]')) return; // las cinematic sections orquestan sus paths
    path.dataset.drawBound = '1';
    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    gsap.to(path, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: { trigger: path, start: 'top 80%', end: 'bottom 60%', scrub: 1 },
    });
  });
}

// Animación cinematográfica: cada sección con data-cinematic se pinea,
// el visual interno hace "traveling" (escala + blur), texto aparece como horizonte,
// y un fade-gate de fondo cierra la sección antes de soltar el pin.
function initCinematic() {
  const mobile = window.matchMedia('(max-width: 880px)').matches;

  gsap.utils.toArray<HTMLElement>('[data-cinematic]').forEach((sec) => {
    if (sec.dataset.cinematicBound) return;
    sec.dataset.cinematicBound = '1';

    const visual = sec.querySelector<HTMLElement>('.ts-visual');
    const text = sec.querySelector<HTMLElement>('.ts-text');
    const axis = sec.querySelector<HTMLElement>('.ts-axis');
    const fadeGate = sec.querySelector<HTMLElement>('.ts-fade-gate');
    const title = sec.querySelector<HTMLElement>('.ts-title');
    const sub = sec.querySelector<HTMLElement>('.ts-sub');
    const bullets = sec.querySelectorAll<HTMLElement>('.ts-bullets li');
    const outcome = sec.querySelector<HTMLElement>('.ts-outcome');

    // Estado inicial
    gsap.set([title, sub, outcome], { opacity: 0, y: 24 });
    if (bullets.length) gsap.set(bullets, { opacity: 0, y: 20 });
    if (axis) gsap.set(axis, { opacity: 0, x: -12 });
    if (visual) gsap.set(visual, { scale: 0.55, filter: 'blur(8px)', opacity: 0.4 });
    if (fadeGate) gsap.set(fadeGate, { opacity: 0 });

    if (mobile) {
      const tierIdxMobile = parseInt(sec.dataset.tierIndex || '0', 10);
      ScrollTrigger.create({
        trigger: sec,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          window.__audaTierProgress ??= new Map();
          window.__audaTierProgress.set(tierIdxMobile, self.progress);
        },
      });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: sec, start: 'top 80%', toggleActions: 'play none none none' },
      });
      if (axis) tl.to(axis, { opacity: 1, x: 0, duration: 0.5 }, 0);
      if (visual) tl.to(visual, { scale: 1, filter: 'blur(0px)', opacity: 1, duration: 0.9 }, 0);
      tl.to([title, sub], { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 }, 0.2);
      if (bullets.length) tl.to(bullets, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07 }, 0.4);
      if (outcome) tl.to(outcome, { opacity: 1, y: 0, duration: 0.5 }, 0.7);
      return;
    }

    const tierIdx = parseInt(sec.dataset.tierIndex || '0', 10);
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sec,
        start: 'top top',
        end: '+=150%',
        scrub: 0.8,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          window.__audaTierProgress ??= new Map();
          window.__audaTierProgress.set(tierIdx, self.progress);
        },
      },
    });

    // 0 → 0.25: el axis label entra
    if (axis) tl.to(axis, { opacity: 1, x: 0, duration: 0.25, ease: 'power2.out' }, 0);

    // 0 → 0.35: visual escala desde lejos
    if (visual) {
      tl.to(visual, { scale: 1.0, filter: 'blur(0px)', opacity: 1, duration: 0.35, ease: 'power2.out' }, 0);
    }

    // 0.25 → 0.6: traveling — escala extra + ligero blur
    if (visual) {
      tl.to(
        visual,
        { scale: 1.45, filter: 'blur(2px)', duration: 0.35, ease: 'power1.inOut' },
        0.25,
      );
    }

    // 0.35 → 0.55: título + subtítulo entran
    tl.to([title, sub], { opacity: 1, y: 0, duration: 0.2, stagger: 0.05, ease: 'power2.out' }, 0.35);

    // 0.55 → 0.75: bullets stagger
    if (bullets.length) {
      tl.to(bullets, { opacity: 1, y: 0, duration: 0.2, stagger: 0.04, ease: 'power2.out' }, 0.55);
    }

    // 0.7 → 0.82: outcome entra
    if (outcome) tl.to(outcome, { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out' }, 0.7);

    // 0.82 → 0.95: visual sigue alejándose (scale ↑, blur ↑)
    if (visual) {
      tl.to(visual, { scale: 1.9, filter: 'blur(6px)', opacity: 0.6, duration: 0.13, ease: 'power2.in' }, 0.82);
    }

    // 0.85 → 1.0: fade-gate cubre la sección (fade-to-bg)
    if (fadeGate) tl.to(fadeGate, { opacity: 1, duration: 0.15, ease: 'power2.in' }, 0.85);
  });
}

// FormulaIntro: pinea la sección y publica progress en data-fx-progress
// para que el componente vaya activando fórmulas en orden.
function initFormulaIntro() {
  const mobile = window.matchMedia('(max-width: 880px)').matches;
  if (mobile) return; // En mobile, FormulaIntro usa IntersectionObserver propio.
  document.querySelectorAll<HTMLElement>('[data-formula-intro]').forEach((sec) => {
    if (sec.dataset.fxIntroBound) return;
    sec.dataset.fxIntroBound = '1';
    ScrollTrigger.create({
      trigger: sec,
      start: 'top top',
      end: '+=180%',
      pin: true,
      anticipatePin: 1,
      scrub: 0.6,
      onUpdate: (self) => {
        sec.dataset.fxProgress = self.progress.toFixed(3);
      },
    });
  });
}

// Parallax sutil para los videos de fondo: el frame se desplaza yPercent
// mientras la sección entra y sale, igual que rockstargames.com/VI.
function initVideoParallax() {
  document.querySelectorAll<HTMLElement>('[data-parallax-video]').forEach((sec) => {
    if (sec.dataset.vpParallaxBound) return;
    sec.dataset.vpParallaxBound = '1';
    const media = sec.querySelector<HTMLElement>('.vp-media, .hero-media');
    if (!media) return;
    gsap.fromTo(
      media,
      { yPercent: -8 },
      {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
}

function init() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => (el.style.opacity = '1'));
    bootCinematic();
    return;
  }
  initLenis();
  initType();
  initReveal();
  initDrawLine();
  initCinematic();
  initFormulaIntro();
  initVideoParallax();
  bootCinematic();
}

let booted = false;
function safeInit() {
  if (booted) return;
  booted = true;
  init();
}
document.addEventListener('astro:page-load', safeInit);
if (document.readyState !== 'loading') {
  safeInit();
} else {
  document.addEventListener('DOMContentLoaded', safeInit);
}
