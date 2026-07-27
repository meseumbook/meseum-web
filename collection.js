/* ---------- Swap groups: when a group's top reaches the header line,
   further scroll (wheel/touch) is blocked via preventDefault until the
   group finishes cycling through its photos, then released so the page
   continues from exactly where it already was.

   All 5 listeners (scroll/wheel/touchstart/touchmove/touchend) are
   registered ONCE, permanently, at setup — never added or removed while
   the page is live. An earlier version added/removed them per-engagement
   and that caused iOS Safari's touch pipeline to lock up (the page would
   stop responding to touch for several seconds). Each handler just checks
   `if (!activeGroup) return` to no-op when nothing is engaged, which is
   the safe way to do this. ---------- */
const HEADER_OFFSET = 76; // must match the fixed header's own height
const STEP_DURATION = 450; // ms — must match .swap-group__img transition

let groups = [];
let activeGroup = null;
let activeDir = 0;
let stepLocked = false;
let touchStartY = 0;
let lastScrollY = 0;

function setupSwapGroups() {
  lastScrollY = window.scrollY;
  groups = Array.from(document.querySelectorAll('.swap-group')).map((el) => {
    const imgs = Array.from(el.querySelectorAll('.swap-group__img'));
    if (imgs[0]) imgs[0].classList.add('is-active');
    return { el, imgs, index: 0 };
  });

  if (groups.length === 0) return;

  window.addEventListener('scroll', checkEngage, { passive: true });
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
}

function checkEngage() {
  if (activeGroup) return;

  const scrollY = window.scrollY;
  const dir = scrollY > lastScrollY ? 1 : scrollY < lastScrollY ? -1 : 0;
  lastScrollY = scrollY;
  if (dir === 0) return;

  for (const g of groups) {
    if (g.imgs.length <= 1) continue;
    const rect = g.el.getBoundingClientRect();
    const inZone = rect.top <= HEADER_OFFSET && rect.bottom > HEADER_OFFSET;
    if (!inZone) continue;
    if (dir > 0 && g.index < g.imgs.length - 1) { activeGroup = g; activeDir = 1; return; }
    if (dir < 0 && g.index > 0) { activeGroup = g; activeDir = -1; return; }
  }
}

function release() {
  activeGroup = null;
  lastScrollY = window.scrollY;
}

function step(dir) {
  const g = activeGroup;
  if (!g || stepLocked || dir !== activeDir) return;

  const nextIndex = g.index + dir;
  if (nextIndex < 0 || nextIndex >= g.imgs.length) {
    release();
    return;
  }

  stepLocked = true;
  g.index = nextIndex;
  g.imgs.forEach((img, i) => {
    img.classList.remove('is-active', 'is-before');
    if (i < g.index) img.classList.add('is-before');
    else if (i === g.index) img.classList.add('is-active');
  });
  setTimeout(() => { stepLocked = false; }, STEP_DURATION);
}

function onWheel(e) {
  if (!activeGroup) return;
  e.preventDefault();
  step(e.deltaY > 0 ? 1 : -1);
}

function onTouchStart(e) {
  touchStartY = e.touches[0].clientY;
}

function onTouchMove(e) {
  if (!activeGroup) return;
  e.preventDefault();
}

function onTouchEnd(e) {
  if (!activeGroup) return;
  const dy = touchStartY - e.changedTouches[0].clientY;
  if (Math.abs(dy) < 15) return;
  step(dy > 0 ? 1 : -1);
}

/* ---------- Style tabs: click a style name to swap hero photo, photo
   row, and the feature list without leaving the section. ---------- */
function setupStyleTabs() {
  const tabs = document.querySelectorAll('.cs-style__tab');
  const heroImgs = document.querySelectorAll('.cs-style__hero-img');
  const panels = document.querySelectorAll('.cs-style__panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const style = tab.dataset.style;

      tabs.forEach((t) => t.classList.toggle('is-active', t === tab));
      heroImgs.forEach((img) => {
        img.hidden = img.dataset.style !== style;
      });
      panels.forEach((panel) => {
        const active = panel.dataset.style === style;
        panel.hidden = !active;
        panel.classList.toggle('is-active', active);
      });
    });
  });
}

setupSwapGroups();
setupStyleTabs();
