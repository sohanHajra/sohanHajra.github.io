// Hash-routed sections. Flat, back-button friendly, quiet fade-up on change.
(() => {
  const sections = Array.from(document.querySelectorAll('.page-section'));
  if (!sections.length) return;
  const ids = sections.map(s => s.id);
  const links = Array.from(document.querySelectorAll('.primary-nav a[href^="#"]'));
  const main = document.getElementById('main');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Older anchors from the previous one-page site, and deep links into a section.
  const aliases = { work: 'research', approach: 'research', publication: 'research', experience: 'cv', 'additional-work': 'workbench', play: 'workbench', kelly: 'workbench' };
  const titles = { about: 'Sohan Hajra', research: 'Research · Sohan Hajra', writing: 'Writing · Sohan Hajra', cv: 'CV · Sohan Hajra', workbench: 'Workbench · Sohan Hajra' };
  let current = null;
  let fade;

  function resolve() {
    const raw = decodeURIComponent(window.location.hash.slice(1));
    if (ids.includes(raw)) return { page: raw, anchor: null };
    if (aliases[raw]) {
      // Old names (#play, #work, …) become the canonical hash; #kelly stays a deep link into Workbench.
      if (raw !== 'kelly') history.replaceState(history.state, '', '#' + aliases[raw]);
      return { page: aliases[raw], anchor: raw === 'kelly' ? 'kelly' : null };
    }
    return { page: 'about', anchor: null };
  }

  function show(animate) {
    const { page, anchor } = resolve();
    const changed = page !== current;
    if (changed) {
      sections.forEach(s => { s.hidden = s.id !== page; });
      links.forEach(a => {
        if (a.hash === '#' + page) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
      document.title = titles[page] || titles.about;
      document.body.setAttribute('data-page', page === 'about' ? 'about' : 'other');
      const prev = current;
      current = page;
      document.dispatchEvent(new CustomEvent('sectionchange', { detail: { page, prev } }));
    }
    if (animate) {
      const target = anchor && document.getElementById(anchor);
      if (target) target.scrollIntoView({ block: 'start' });
      else window.scrollTo(0, 0);
      main.focus({ preventScroll: true });
      if (changed && !reduced.matches) {
        fade?.cancel();
        fade = document.getElementById(page).animate(
          [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
          { duration: 240, easing: 'cubic-bezier(.22, .8, .24, 1)' }
        );
      }
    }
  }

  window.addEventListener('hashchange', () => show(true));
  // Same-hash click (e.g. "About" while on About) still returns to the top.
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.hash === window.location.hash || (a.hash === '#about' && !window.location.hash)) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' });
    }
  });
  const skip = document.querySelector('.skip-link');
  skip?.addEventListener('click', e => { e.preventDefault(); main.focus(); });

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  show(false);
  // The browser jumps to the element whose id matches the hash; sections should open at the top.
  const first = resolve();
  let userMoved = false;
  ['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach(t => window.addEventListener(t, () => { userMoved = true; }, { once: true, passive: true }));
  const settle = () => {
    if (userMoved) return;
    if (first.anchor) document.getElementById(first.anchor)?.scrollIntoView({ block: 'start' });
    else window.scrollTo(0, 0);
  };
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  settle();
  requestAnimationFrame(settle);
  window.addEventListener('load', () => requestAnimationFrame(() => requestAnimationFrame(settle)), { once: true });
})();
