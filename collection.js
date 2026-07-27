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

function setupCarousels() {
  document.querySelectorAll('.photo-carousel').forEach((carousel) => {
    const track = carousel.querySelector('.photo-carousel__track');
    const dots = carousel.querySelectorAll('.photo-carousel__dot');
    const count = dots.length;
    if (count <= 1) return;

    track.addEventListener('scroll', () => {
      const idx = Math.round(track.scrollLeft / track.clientWidth);
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === idx));
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

setupCarousels();
setupStyleTabs();
