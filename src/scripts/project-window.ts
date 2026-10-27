// The projects window. Without this script every project shows, stacked; with it the window becomes
// WAI-ARIA tabs (automatic activation) with deep links, and its traffic lights minimise and expand it.

export function startProjectWindow(section: HTMLElement) {
  const $ = <T extends Element>(selector: string) => section.querySelector<T>(selector)!;
  const win = $<HTMLElement>('[data-window]');
  const tablist = $<HTMLElement>('[data-tabs]');
  const panelsBox = $<HTMLElement>('.panels');
  const title = $<HTMLElement>('[data-title]');
  const btnClose = $<HTMLButtonElement>('[data-close]');
  const btnMin = $<HTMLButtonElement>('[data-min]');
  const btnMax = $<HTMLButtonElement>('[data-max]');
  const dock = $<HTMLElement>('[data-dock]');
  const restore = $<HTMLButtonElement>('[data-restore]');
  const body = $<HTMLElement>('.win__body');
  const tabs = [...tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')!)!);
  const ids = panels.map((panel) => panel.id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  // Upgrade the static markup into the tabbed window
  $<HTMLElement>('[data-static-lights]').hidden = true;
  $<HTMLElement>('[data-lights]').hidden = false;
  tablist.hidden = false;
  // The hash is handled here from now on: renaming the panels stops the browser jumping to and
  // focusing a panel itself, which would scroll the window's title bar off the top of the screen
  panels.forEach((panel, i) => {
    panel.id = `panel-${ids[i]}`;
    tabs[i].setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabs[i].id);
    panel.tabIndex = 0;
  });
  win.dataset.ready = '';

  function select(i: number, { focus = false, updateHash = false } = {}) {
    tabs.forEach((tab, j) => {
      const on = i === j;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
    });
    title.textContent = `kieron@portfolio:~/projects/${ids[i]}`;
    panelsBox.scrollTop = 0;
    // Bring the tab into view along the strip only, never scrolling the page
    const tab = tabs[i];
    if (tab.offsetLeft < tablist.scrollLeft || tab.offsetLeft + tab.offsetWidth > tablist.scrollLeft + tablist.clientWidth) {
      tablist.scrollLeft = tab.offsetLeft - 8;
    }
    if (focus) tab.focus();
    if (updateHash) history.replaceState(null, '', `#${ids[i]}`);
  }

  tablist.addEventListener('click', (event) => {
    const i = tabs.indexOf((event.target as Element).closest('[role="tab"]') as HTMLButtonElement);
    if (i >= 0) select(i, { updateHash: true });
  });
  tablist.addEventListener('keydown', (event) => {
    const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
    const n = tabs.length;
    const next = ({ ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: n - 1 } as Record<string, number>)[event.key];
    if (next === undefined || current < 0) return;
    event.preventDefault();
    select((next + n) % n, { focus: true, updateHash: true });
  });

  /** /#wikiracer opens that tab and brings the window into view */
  function openFromHash() {
    const i = ids.indexOf(decodeURIComponent(location.hash.slice(1)));
    if (i < 0) return false;
    if (win.classList.contains('is-min')) setMin(false);
    select(i);
    section.scrollIntoView();
    return true;
  }

  // Everything the full-screen window covers is taken out of the tab order while it's open
  const covered = () => [...document.querySelectorAll<HTMLElement>('.skip, .nav, .hero, .footer')];

  function change(update: () => void) {
    if (document.startViewTransition && !reduce.matches) document.startViewTransition(update);
    else update();
  }

  function setMax(on: boolean) {
    win.classList.toggle('is-max', on);
    btnMax.setAttribute('aria-pressed', String(on));
    btnMax.setAttribute('aria-label', on ? 'Leave full screen' : 'Expand projects to full screen');
    btnClose.disabled = !on;
    document.documentElement.style.overflow = on ? 'hidden' : '';
    for (const el of covered()) el.inert = on;
  }

  function setMin(on: boolean) {
    if (on && win.classList.contains('is-max')) setMax(false);
    win.classList.toggle('is-min', on);
    body.inert = on;
    dock.hidden = !on;
    btnMin.setAttribute('aria-expanded', String(!on));
  }

  btnMin.addEventListener('click', () => {
    setMin(true);
    restore.focus();
  });
  restore.addEventListener('click', () => {
    setMin(false);
    btnMin.focus();
  });
  btnMax.addEventListener('click', () => {
    const on = !win.classList.contains('is-max');
    change(() => {
      if (on) setMin(false);
      setMax(on);
    });
  });
  btnClose.addEventListener('click', () => {
    change(() => setMax(false));
    btnMax.focus();
  });
  addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !win.classList.contains('is-max')) return;
    change(() => setMax(false));
    btnMax.focus();
  });

  if (!openFromHash()) select(0);
  addEventListener('hashchange', openFromHash);
}
