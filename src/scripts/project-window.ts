// The projects window. Without this script every project shows, stacked; with it the window becomes
// WAI-ARIA tabs (automatic activation) with deep links, and on phones previous and next buttons at its foot.

export function startProjectWindow(section: HTMLElement) {
  const $ = <T extends Element>(selector: string) => section.querySelector<T>(selector)!;
  const win = $<HTMLElement>('[data-window]');
  const tablist = $<HTMLElement>('[data-tabs]');
  const panelsBox = $<HTMLElement>('.panels');
  const title = $<HTMLElement>('[data-title]');
  const tabs = [...tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')!)!);
  const ids = panels.map((panel) => panel.id);
  const pager = $<HTMLElement>('[data-pager]');
  const steps = [...pager.querySelectorAll<HTMLButtonElement>('[data-step]')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  // Upgrade the static markup into the tabbed window
  tablist.hidden = false;
  pager.hidden = false;
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

  /**
   * The window keeps the height of its tallest project, so it stays the same size whichever tab is open. All the
   * panels are shown for a moment to measure them, within one frame so nothing flickers. The cap in the CSS still
   * applies: on a short screen the window stops at the screen and the project scrolls inside it.
   */
  function fitTallest() {
    win.style.removeProperty('--fit');
    const chrome = win.offsetHeight - panelsBox.offsetHeight;
    const shown = panels.map((panel) => panel.hidden);
    panels.forEach((panel) => { panel.hidden = false; });
    const tallest = Math.max(...panels.map((panel) => panel.offsetHeight));
    panels.forEach((panel, i) => { panel.hidden = shown[i]!; });
    win.style.setProperty('--fit', `${Math.ceil(tallest + chrome)}px`);
  }
  // Text wraps differently at each width, and the fonts change it once they arrive
  let width = 0;
  new ResizeObserver(([entry]) => {
    if (Math.round(entry!.contentRect.width) === width) return;
    width = Math.round(entry!.contentRect.width);
    fitTallest();
  }).observe(win);
  document.fonts.ready.then(fitTallest);

  function select(i: number, { focus = false, updateHash = false } = {}) {
    tabs.forEach((tab, j) => {
      const on = i === j;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
    });
    title.textContent = `kieron@portfolio:~/projects/${ids[i]}`;
    // The taskbar's dock marks the open project, as a dock marks an open app
    for (const app of document.querySelectorAll<HTMLElement>('[data-dock-app]')) {
      if (app.dataset.dockApp === ids[i]) app.setAttribute('aria-current', 'true');
      else app.removeAttribute('aria-current');
    }
    panelsBox.scrollTop = 0;
    // Bring the tab into view along the strip only, never scrolling the page
    const tab = tabs[i];
    if (tab.offsetLeft < tablist.scrollLeft || tab.offsetLeft + tab.offsetWidth > tablist.scrollLeft + tablist.clientWidth) {
      tablist.scrollLeft = tab.offsetLeft - 8;
    }
    if (focus) tab.focus();
    if (updateHash) history.replaceState(null, '', `#${ids[i]}`);
    // The pager names the projects either side, going round at the ends as the arrow keys do
    for (const button of steps) {
      const step = Number(button.dataset.step);
      const id = ids[(i + step + ids.length) % ids.length]!;
      button.querySelector('[data-pager-name]')!.textContent = id;
      button.setAttribute('aria-label', `${step < 0 ? 'Previous' : 'Next'} project: ${id}`);
    }
    pager.querySelector('[data-pager-count]')!.textContent = `${i + 1} of ${ids.length}`;
  }

  // From the pager, the new project opens at the top of the window, with focus on its tab
  pager.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-step]');
    if (!button) return;
    const n = tabs.length;
    const current = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
    const next = (current + Number(button.dataset.step) + n) % n;
    select(next, { updateHash: true });
    tabs[next]!.focus({ preventScroll: true });
    section.scrollIntoView({ block: 'start', behavior: reduce.matches ? 'instant' : 'smooth' });
  });

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
    select(i);
    section.scrollIntoView();
    return true;
  }

  if (!openFromHash()) select(0);
  addEventListener('hashchange', openFromHash);
}
