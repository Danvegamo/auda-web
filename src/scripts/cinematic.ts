// cinematic.ts — capa "tipo video" sobre el scroll.
// Velocity blur global, parallax layers, morfeo de heading entre secciones,
// y cross-fade de mood (warm/cool/dark) por sección activa.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

const MOOD: Record<string, { bg: string; ink: string }> = {
  warm: { bg: 'var(--color-paper)', ink: 'var(--color-ink)' },
  cool: { bg: 'var(--color-paper-soft)', ink: 'var(--color-ink)' },
  dark: { bg: 'var(--color-ink-deep)', ink: 'var(--color-paper)' },
};

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function initVelocityBlur() {
  let v = 0;
  let target = 0;
  let lastY = window.scrollY;
  let lastT = performance.now();

  const tick = () => {
    v += (target - v) * 0.12;
    target *= 0.85;
    const px = clamp(Math.abs(v) * 0.06, 0, 4);
    document.documentElement.style.setProperty('--scroll-blur', `${px}px`);
    requestAnimationFrame(tick);
  };

  const onScroll = () => {
    const y = window.scrollY;
    const t = performance.now();
    const dt = Math.max(8, t - lastT);
    target = ((y - lastY) / dt) * 16;
    lastY = y;
    lastT = t;
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  // Si lenis emite velocity, también aprovecharlo
  if (window.__lenis) {
    window.__lenis.on('scroll', (e: { velocity?: number }) => {
      if (typeof e.velocity === 'number') target = e.velocity * 0.5;
    });
  }
  requestAnimationFrame(tick);
}

function initParallax() {
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
    if (el.dataset.parallaxBound) return;
    el.dataset.parallaxBound = '1';
    const speed = parseFloat(el.dataset.parallax || '0.2');
    gsap.to(el, {
      yPercent: -100 * speed,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

// Morfeo de heading entre secciones — cross-fade + clip-path wipe
function initMorph() {
  const targets = gsap.utils.toArray<HTMLElement>('[data-morph-target]');
  if (!targets.length) return;
  targets.forEach((el) => {
    if (el.dataset.morphBound) return;
    el.dataset.morphBound = '1';
    gsap.set(el, { '--morph-clip': 'inset(0 0 100% 0)' } as gsap.TweenVars);
    gsap.fromTo(
      el,
      { clipPath: 'inset(0 0 100% 0)', opacity: 0.0, y: 24 },
      {
        clipPath: 'inset(0 0 0% 0)',
        opacity: 1,
        y: 0,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          end: 'top 30%',
          scrub: 1,
        },
      },
    );
    gsap.to(el, {
      clipPath: 'inset(100% 0 0 0)',
      opacity: 0,
      y: -24,
      ease: 'power3.in',
      scrollTrigger: {
        trigger: el,
        start: 'bottom 30%',
        end: 'bottom -10%',
        scrub: 1,
      },
    });
  });
}

function applyMood(mood: string) {
  const m = MOOD[mood] || MOOD.warm;
  document.documentElement.style.setProperty('--mood-bg', m.bg);
  document.documentElement.style.setProperty('--mood-ink', m.ink);
  document.documentElement.dataset.mood = mood;
}

function initMood() {
  const sections = gsap.utils.toArray<HTMLElement>('[data-mood]');
  sections.forEach((sec) => {
    if (sec.dataset.moodBound) return;
    sec.dataset.moodBound = '1';
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 40%',
      end: 'bottom 40%',
      onEnter: () => applyMood(sec.dataset.mood || 'warm'),
      onEnterBack: () => applyMood(sec.dataset.mood || 'warm'),
    });
  });
}

let booted = false;
export function bootCinematic() {
  if (booted) return;
  booted = true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    initMood();
    return;
  }
  initVelocityBlur();
  initParallax();
  initMorph();
  initMood();
}
