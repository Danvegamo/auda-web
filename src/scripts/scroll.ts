import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

declare global {
  interface Window {
    __lenis?: Lenis;
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

  // Hooks para View Transitions — pausa scroll durante swap.
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
    .map((w) => `<span class="word" style="display:inline-block;overflow:hidden"><span class="word-inner" style="display:inline-block">${w}&nbsp;</span></span>`)
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
    // Skip paths inside TierStorySection — initTierStory las orquesta con pin+scrub
    if (path.closest('[data-tier-story]')) return;
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

function initTierStory() {
  const mobile = window.matchMedia('(max-width: 880px)').matches;

  gsap.utils.toArray<HTMLElement>('[data-tier-story]').forEach((sec) => {
    if (sec.dataset.tierBound) return;
    sec.dataset.tierBound = '1';

    const path = sec.querySelector<SVGPathElement>('[data-draw]');
    const bullets = sec.querySelectorAll<HTMLElement>('.ts-bullets li');
    const outcome = sec.querySelector<HTMLElement>('.ts-outcome');
    const ticket = sec.querySelector<HTMLElement>('.ts-ticket');

    if (path) {
      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    }
    if (bullets.length) gsap.set(bullets, { opacity: 0, y: 18 });
    if (outcome) gsap.set(outcome, { opacity: 0, y: 16 });
    if (ticket) gsap.set(ticket, { opacity: 0 });

    if (mobile) {
      // Fallback móvil: revelado simple sin pin
      const tl = gsap.timeline({
        scrollTrigger: { trigger: sec, start: 'top 80%', toggleActions: 'play none none none' },
      });
      if (path) tl.to(path, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.out' }, 0);
      tl.to(bullets, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, 0.1);
      if (outcome) tl.to(outcome, { opacity: 1, y: 0, duration: 0.6 }, 0.5);
      if (ticket) tl.to(ticket, { opacity: 1, duration: 0.4 }, 0.7);
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sec,
        start: 'top top',
        end: '+=120%',
        scrub: 0.6,
        pin: true,
        anticipatePin: 1,
      },
    });
    if (path) tl.to(path, { strokeDashoffset: 0, ease: 'none' }, 0);
    tl.to(bullets, { opacity: 1, y: 0, stagger: 0.08, ease: 'power2.out' }, 0.1);
    if (outcome) tl.to(outcome, { opacity: 1, y: 0, ease: 'power2.out' }, 0.55);
    if (ticket) tl.to(ticket, { opacity: 1, ease: 'none' }, 0.75);
  });
}

function init() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Sin animaciones: mostrar todos los elementos de reveal
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => (el.style.opacity = '1'));
    return;
  }
  initLenis();
  initType();
  initReveal();
  initDrawLine();
  initTierStory();
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
