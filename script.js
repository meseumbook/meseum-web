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
const revealEls = document.querySelectorAll('.hero__poem, .quote p, .quote__links, .photo-banner');
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
