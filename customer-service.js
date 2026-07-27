const VALID_TABS = ['terms', 'payment', 'overseas'];

function getInitialTab() {
  const requested = new URLSearchParams(location.search).get('tab');
  return VALID_TABS.includes(requested) ? requested : 'terms';
}

function setupTabs() {
  const tabs = document.querySelectorAll('.cs-tabs__item');
  const panels = document.querySelectorAll('.cs-panel');

  function activate(tab) {
    tabs.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.tab === tab));
    panels.forEach((panel) => panel.classList.toggle('is-active', panel.dataset.panel === tab));
  }

  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      activate(btn.dataset.tab);
      history.replaceState(null, '', `?tab=${btn.dataset.tab}`);
    });
  });

  activate(getInitialTab());
}

setupTabs();
