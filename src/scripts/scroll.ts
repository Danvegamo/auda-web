import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

function initLenis() {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
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
  // data-reveal="up" — elementos suben desde abajo
  gsap.utils.toArray<HTMLElement>('[data-reveal="up"]').forEach((el) => {
    el.style.opacity = '1';
    gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
    });
  });

  // data-reveal="line" — texto se revela línea por línea
  gsap.utils.toArray<HTMLElement>('[data-reveal="line"]').forEach((el) => {
    el.style.opacity = '1';
    const spans = wrapLines(el);
    gsap.from(spans, {
      y: '100%',
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.06,
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
    });
  });

  // data-reveal="stagger" — hijos entran escalonados
  gsap.utils.toArray<HTMLElement>('[data-reveal="stagger"]').forEach((el) => {
    el.style.opacity = '1';
    const children = Array.from(el.children) as HTMLElement[];
    gsap.from(children, {
      y: 30,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.1,
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });
  });
}

function initType() {
  // data-reveal="type" — efecto máquina de escribir: cada carácter aparece de izq→der
  gsap.utils.toArray<HTMLElement>('[data-reveal="type"]').forEach((el) => {
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
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });
  });
}

function initDrawLine() {
  gsap.utils.toArray<SVGPathElement>('[data-draw]').forEach((path) => {
    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    gsap.to(path, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: path,
        start: 'top 80%',
        end: 'bottom 60%',
        scrub: 1,
      },
    });
  });
}

function init() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  initLenis();
  initType();
  initReveal();
  initDrawLine();
}

let booted = false;
document.addEventListener('astro:page-load', () => {
  if (booted) return;
  booted = true;
  init();
});
