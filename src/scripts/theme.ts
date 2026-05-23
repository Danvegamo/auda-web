type Theme = 'light' | 'dark';

const STORAGE_KEY = 'auda:theme';

function current(): Theme {
  const attr = document.documentElement.getAttribute('data-theme');
  return attr === 'dark' ? 'dark' : 'light';
}

function apply(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  document.dispatchEvent(new CustomEvent('auda:themechange', { detail: { theme } }));
}

function toggle() {
  apply(current() === 'dark' ? 'light' : 'dark');
}

function bind() {
  const btns = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');
  btns.forEach((btn) => {
    if (btn.dataset.themeBound === '1') return;
    btn.dataset.themeBound = '1';
    btn.addEventListener('click', toggle);
  });
}

bind();
document.addEventListener('astro:page-load', bind);
