// Mobile nav toggle
const menuToggle = document.getElementById('menuToggle');
const mobileNav = document.getElementById('mobileNav');

menuToggle.addEventListener('click', () => {
  const isOpen = mobileNav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

mobileNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

// Scroll reveal
// `.hero__poem, .quote p, .quote__links, .photo-banner` get the simple
// fade-in-on-scroll treatment on mobile/tablet, but on desktop they're
// inside `.split-hero` where their opacity is driven by the scroll-linked
// crossfade below instead — applying both would fight each other.
const isDesktopSplitHero = () => window.matchMedia('(min-width: 1024px)').matches && document.querySelector('.split-hero');
const revealSelectors = isDesktopSplitHero()
  ? '.collection-text, .collection-photos, .photo-carousel, .cs-style'
  : '.hero__poem, .quote p, .quote__links, .photo-banner, .collection-text, .collection-photos, .photo-carousel, .cs-style';
const revealEls = document.querySelectorAll(revealSelectors);
revealEls.forEach((el) => el.classList.add('reveal'));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0, rootMargin: '0px 0px 100px 0px' }
);

revealEls.forEach((el) => observer.observe(el));

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Footer accordion (STORY/SUPPORT/CONTACT/FAQ)
document.querySelectorAll('.footer-links__item').forEach((item) => {
  const row = item.querySelector('.footer-links__row');
  row.addEventListener('click', () => {
    const isOpen = item.classList.contains('is-open');
    document.querySelectorAll('.footer-links__item.is-open').forEach((other) => {
      if (other !== item) other.classList.remove('is-open');
    });
    item.classList.toggle('is-open', !isOpen);
  });
});

// Desktop split-hero: crossfades the hero poem/sea photo into the quote/
// product photo as the pinned section scrolls by, then releases into the
// footer links. Purely visual (opacity only) — it only ever reads scroll
// position, never blocks or intercepts it, so it carries none of the risk
// that came from trying to lock/intercept scroll on the collection page.
// No-ops entirely below the 1024px breakpoint.
(function setupSplitHero() {
  const wrap = document.querySelector('.split-hero');
  if (!wrap) return;

  const heroPanel = wrap.querySelector('.hero');
  const quotePanel = wrap.querySelector('.quote');
  const photoPanel = wrap.querySelector('.photo-banner');
  const footerPanel = wrap.querySelector('.footer-visual');
  const panels = [heroPanel, quotePanel, photoPanel, footerPanel];

  function update() {
    if (!window.matchMedia('(min-width: 1024px)').matches) {
      panels.forEach((el) => { if (el) { el.style.opacity = ''; el.style.pointerEvents = ''; } });
      return;
    }
    const rect = wrap.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
    // hero and quote share the same grid cell for the crossfade (so do
    // photo-banner and footer-visual) — without this, the invisible panel's
    // links still sit on top and silently swallow clicks meant for the
    // visible one underneath.
    const showSecond = progress > 0.5;
    if (heroPanel) {
      heroPanel.style.opacity = String(1 - progress);
      heroPanel.style.pointerEvents = showSecond ? 'none' : '';
    }
    if (quotePanel) {
      quotePanel.style.opacity = String(progress);
      quotePanel.style.pointerEvents = showSecond ? '' : 'none';
    }
    if (photoPanel) photoPanel.style.opacity = String(1 - progress);
    if (footerPanel) footerPanel.style.opacity = String(progress);
  }

  window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  window.addEventListener('resize', () => requestAnimationFrame(update));
  update();
})();
