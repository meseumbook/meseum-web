/* ---------- Photo carousel: dot indicator syncs to whichever photo the
   native horizontal scroll-snap has settled on, and each carousel
   auto-advances every few seconds so customers notice it's swipeable.
   Autoplay only calls the track's own horizontal `scrollTo` — it never
   touches page (vertical) scroll and never calls preventDefault, so it
   can't interfere with anything else on the page. It pauses while the
   carousel is off-screen (IntersectionObserver) and while the user is
   actively touching it, resuming a moment after they let go. ---------- */
const CAROUSEL_INTERVAL = 1800; // ms between auto-advances
const CAROUSEL_FIRST_DELAY = 800; // ms before the first auto-advance after becoming visible
const CAROUSEL_RESUME_DELAY = 2500; // ms after user touch before autoplay resumes

// Shared with the desktop split-collection crossfade below: which photo
// each tracked carousel group is currently showing, used to decide the
// nav color (see updateNavColor).
const carouselSlideIndex = {};

function setupCarousels() {
  document.querySelectorAll('.photo-carousel').forEach((carousel) => {
    const track = carousel.querySelector('.photo-carousel__track');
    const dots = carousel.querySelectorAll('.photo-carousel__dot');
    const count = dots.length;
    if (count <= 1) return;

    track.addEventListener('scroll', () => {
      const idx = Math.round(track.scrollLeft / track.clientWidth);
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === idx));
      if (carousel.dataset.carouselGroup) {
        carouselSlideIndex[carousel.dataset.carouselGroup] = idx;
        updateNavColor();
      }
    }, { passive: true });

    let timer = null;
    let firstTimer = null;
    let resumeTimer = null;
    let visible = false;

    function tick() {
      const idx = Math.round(track.scrollLeft / track.clientWidth);
      const next = (idx + 1) % count;
      track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' });
    }

    function start() {
      stop();
      if (!visible) return;
      firstTimer = setTimeout(() => {
        tick();
        timer = setInterval(tick, CAROUSEL_INTERVAL);
      }, CAROUSEL_FIRST_DELAY);
    }

    function stop() {
      clearTimeout(firstTimer);
      if (timer) clearInterval(timer);
      timer = null;
    }

    track.addEventListener('touchstart', () => {
      stop();
      clearTimeout(resumeTimer);
    }, { passive: true });

    track.addEventListener('touchend', () => {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(start, CAROUSEL_RESUME_DELAY);
    }, { passive: true });

    new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0.5 }
    ).observe(carousel);
  });
}

/* ---------- Style tabs: click a style name to swap hero photo, photo
   row, and the feature list without leaving the section — and, same as
   the photo carousels, auto-advance through the styles every few seconds
   so customers notice the names are clickable. Same safe pattern: only
   ever touches this section's own state, pauses off-screen and while the
   user is interacting, resumes a moment after. ---------- */
function setupStyleTabs() {
  const section = document.getElementById('csStyle');
  if (!section) return;

  const tabs = Array.from(section.querySelectorAll('.cs-style__tab'));
  const heroImgs = section.querySelectorAll('.cs-style__hero-img');
  const panels = section.querySelectorAll('.cs-style__panel');
  if (tabs.length <= 1) return;

  function activate(style) {
    tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.style === style));
    heroImgs.forEach((img) => {
      img.hidden = img.dataset.style !== style;
    });
    panels.forEach((panel) => {
      const active = panel.dataset.style === style;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activate(tab.dataset.style));
  });

  let timer = null;
  let firstTimer = null;
  let resumeTimer = null;
  let visible = false;

  function tick() {
    const idx = tabs.findIndex((t) => t.classList.contains('is-active'));
    const next = tabs[(idx + 1) % tabs.length];
    activate(next.dataset.style);
  }

  function start() {
    stop();
    if (!visible) return;
    firstTimer = setTimeout(() => {
      tick();
      timer = setInterval(tick, CAROUSEL_INTERVAL);
    }, CAROUSEL_FIRST_DELAY);
  }

  function stop() {
    clearTimeout(firstTimer);
    if (timer) clearInterval(timer);
    timer = null;
  }

  function pauseThenResume() {
    stop();
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(start, CAROUSEL_RESUME_DELAY);
  }

  tabs.forEach((tab) => tab.addEventListener('click', pauseThenResume));

  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start();
      else stop();
    },
    { threshold: 0.5 }
  ).observe(section);
}

/* ---------- Desktop split-collection: one group "revealed" per 100vh of
   scroll (native scroll-snap forces a stop at each — same proven,
   compositor-level guarantee used elsewhere, scoped so it never affects
   the rest of the page). Left text / right photo-carousel opacity is
   driven continuously by scroll position, purely visual (never blocks or
   intercepts scroll). No-ops entirely below the 1024px breakpoint. ---------- */
let currentCollectionGroup = 1;

function setupSplitCollection() {
  const wrap = document.querySelector('.split-collection');
  if (!wrap) return;

  const GROUP_COUNT = 7;
  const texts = Array.from(wrap.querySelectorAll('.split-collection__text'));
  const photos = Array.from(wrap.querySelectorAll('.split-collection__photo'));

  for (let i = 0; i < GROUP_COUNT; i++) {
    const marker = document.createElement('div');
    marker.className = 'split-collection__snap-marker';
    marker.style.top = `${i * 100}vh`;
    wrap.appendChild(marker);
  }

  function update() {
    if (!window.matchMedia('(min-width: 1024px)').matches) {
      texts.forEach((el) => { el.style.opacity = ''; });
      photos.forEach((el) => { el.style.opacity = ''; });
      return;
    }
    const rect = wrap.getBoundingClientRect();
    // 76 = scroll-padding-top (the header's own height, see collection.css) —
    // without it, the resting position after each snap is offset from an
    // exact group index, so neighboring groups never fully reach 0 opacity
    // and bleed through as faint ghost text.
    //
    // Group 1's snap point would need to align 76px below the viewport top,
    // which requires scrolling to -76 — impossible, so at page load the
    // browser just rests at scrollY 0 without ever reaching that "aligned"
    // position, and the formula below would permanently read it as ~8%
    // short of group 1. Near the very top of the page, group 1 is simply
    // fully in view, so treat that directly rather than fighting the
    // unreachable alignment target.
    const pos = window.scrollY <= 4
      ? 0
      : Math.min(GROUP_COUNT - 1, Math.max(0, (76 - rect.top) / window.innerHeight));

    texts.forEach((el) => {
      const g = parseInt(el.dataset.group, 10) - 1;
      el.style.opacity = String(Math.max(0, 1 - Math.abs(pos - g)));
    });
    photos.forEach((el) => {
      const g = parseInt(el.dataset.group, 10) - 1;
      el.style.opacity = String(Math.max(0, 1 - Math.abs(pos - g)));
    });

    currentCollectionGroup = Math.round(pos) + 1;
    updateNavColor();
  }

  window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  window.addEventListener('resize', () => requestAnimationFrame(update));
  window.addEventListener('load', () => requestAnimationFrame(update));
  // Run the first measurement after layout has actually settled, not at
  // script-execution time (before images/fonts finish, rect.top can be
  // measured against a not-yet-final layout and never gets corrected
  // until the next scroll — which looks exactly like a stuck group-1
  // ghost/blend on first load).
  requestAnimationFrame(() => requestAnimationFrame(update));

  const observer = new IntersectionObserver(
    (entries) => {
      document.documentElement.classList.toggle('collection-snap-zone', entries[0].isIntersecting);
    },
    { rootMargin: '50% 0px 50% 0px' }
  );
  observer.observe(wrap);
}

// Which (group, slide-index) combinations need the light nav color —
// index -1 means "any slide in this group".
const NAV_LIGHT_RULES = [
  { group: 2, index: 0 },
  { group: 3, index: 0 },
  { group: 4, index: 1 },
  { group: 4, index: 2 },
  { group: 6, index: -1 },
];

function updateNavColor() {
  const header = document.getElementById('siteHeader');
  if (!header) return;
  const slide = carouselSlideIndex[currentCollectionGroup];
  const isLight = NAV_LIGHT_RULES.some(
    (rule) => rule.group === currentCollectionGroup && (rule.index === -1 || rule.index === slide)
  );
  header.classList.toggle('nav-light', isLight);
}

/* ---------- Desktop group 7: same click-to-switch + auto-advance as the
   mobile style tabs, just against the split-collection markup (tabs and
   hero photos live in two separate panels there instead of one). ---------- */
function setupDesktopStyleGroup() {
  const textPanel = document.querySelector('.split-collection__text[data-group="7"]');
  const photoPanel = document.querySelector('.split-collection__photo[data-group="7"]');
  if (!textPanel || !photoPanel) return;

  const tabs = Array.from(textPanel.querySelectorAll('.cs-style__tab'));
  const panels = textPanel.querySelectorAll('.cs-style__panel');
  const heroImgs = photoPanel.querySelectorAll('.cs-style__hero-img');
  if (tabs.length <= 1) return;

  function activate(style) {
    tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.style === style));
    heroImgs.forEach((img) => { img.hidden = img.dataset.style !== style; });
    panels.forEach((panel) => {
      const active = panel.dataset.style === style;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
  }

  tabs.forEach((tab) => tab.addEventListener('click', () => activate(tab.dataset.style)));

  let timer = null;
  let firstTimer = null;
  let resumeTimer = null;
  let visible = false;

  function tick() {
    const idx = tabs.findIndex((t) => t.classList.contains('is-active'));
    activate(tabs[(idx + 1) % tabs.length].dataset.style);
  }

  function start() {
    stop();
    if (!visible) return;
    firstTimer = setTimeout(() => {
      tick();
      timer = setInterval(tick, CAROUSEL_INTERVAL);
    }, CAROUSEL_FIRST_DELAY);
  }

  function stop() {
    clearTimeout(firstTimer);
    if (timer) clearInterval(timer);
    timer = null;
  }

  const STYLE_LINK_RESUME_DELAY = 4000; // customer clicked a style — give them 4s to read before auto-advance resumes

  tabs.forEach((tab) => tab.addEventListener('click', () => {
    stop();
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(start, STYLE_LINK_RESUME_DELAY);
  }));

  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start();
      else stop();
    },
    { threshold: 0.5 }
  ).observe(textPanel);
}

setupCarousels();
setupStyleTabs();
setupSplitCollection();
setupDesktopStyleGroup();
