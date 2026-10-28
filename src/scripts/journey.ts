// The about page's installer. Without this script every step shows, one after another, and the step list
// links down to them; with it the window shows one step at a time, moved through with Back and Continue,
// and the address follows the step, so /about/#education opens on Education.

export function startWizard(wizard: HTMLElement) {
  const $ = <T extends Element>(selector: string) => wizard.querySelector<T>(selector)!;
  const steps = [...wizard.querySelectorAll<HTMLElement>('[data-stop]')];
  const ids = steps.map((step) => step.id);
  const links = [...wizard.querySelectorAll<HTMLAnchorElement>('[data-step-link]')];
  const names = links.map((link) => link.textContent!.trim());
  const pane = $<HTMLElement>('[data-pane]');
  const foot = $<HTMLElement>('[data-foot]');
  const back = $<HTMLButtonElement>('[data-back]');
  const next = $<HTMLButtonElement>('[data-next]');
  const progress = $<HTMLElement>('[data-progress]');
  const status = $<HTMLElement>('[data-status]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  // The hash is handled here from now on: renaming the steps stops the browser scrolling to one itself,
  // which would push the window's title bar off the top of the screen
  steps.forEach((step, i) => { step.id = `step-${ids[i]}`; });
  foot.hidden = false;
  // Every step now sits in the same place, so the window keeps the size of the tallest whichever is showing
  wizard.dataset.ready = '';

  let at = -1;
  let sliding: Animation[] = [];

  function go(i: number, { announce = true, updateHash = true } = {}) {
    if (i === at) return;
    const from = at;
    at = i;
    const last = steps.length - 1;
    steps.forEach((step, j) => { step.inert = j !== i; });
    links.forEach((link, j) => {
      if (j === i) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
      link.toggleAttribute('data-done', j < i);
    });
    pane.scrollTop = 0;

    // The new step slides in from the side it's coming from, and the old one leaves by the other
    sliding.forEach((animation) => animation.cancel());
    sliding = [];
    if (from >= 0 && !reduce.matches) {
      const dir = i > from ? 1 : -1;
      sliding = [
        steps[i]!.animate([{ opacity: 0, translate: `${dir * 48}px 0` }, { opacity: 1, translate: '0 0' }], { duration: 320, easing: 'cubic-bezier(.2, .8, .2, 1)' }),
        steps[from]!.animate(
          [{ visibility: 'visible', opacity: 1, translate: '0 0' }, { visibility: 'visible', opacity: 0, translate: `${dir * -48}px 0` }],
          { duration: 200, easing: 'ease-in' },
        ),
      ];
    }

    // Back has nothing to go back to on the first step, so focus moves on rather than being lost with it
    if (i === 0 && document.activeElement === back) next.focus();
    back.disabled = i === 0;
    next.querySelector<HTMLElement>('[data-go]')!.hidden = i === last;
    next.querySelector<HTMLElement>('[data-end]')!.hidden = i !== last;
    progress.style.setProperty('--p', String((i + 1) / steps.length));
    if (announce) status.textContent = `Step ${i + 1} of ${steps.length}: ${names[i]}`;
    // The first step is the page itself, so it gets no hash
    if (updateHash) history.replaceState(null, '', i === 0 ? location.pathname + location.search : `#${ids[i]}`);
  }

  back.addEventListener('click', () => go(Math.max(0, at - 1)));
  // Continue, or Start Over from the last step
  next.addEventListener('click', () => go(at === steps.length - 1 ? 0 : at + 1));
  links.forEach((link, i) => link.addEventListener('click', (event) => {
    event.preventDefault();
    go(i);
  }));
  // A link to a step from inside a step (the first step's list) moves focus to that step in the step list,
  // since the link itself goes out of reach with the step it's in
  pane.addEventListener('click', (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    const i = link ? ids.indexOf(decodeURIComponent(link.hash.slice(1))) : -1;
    if (i < 0) return;
    event.preventDefault();
    go(i);
    links[i]!.focus();
  });

  const fromHash = () => Math.max(0, ids.indexOf(decodeURIComponent(location.hash.slice(1))));
  go(fromHash(), { announce: false, updateHash: false });
  addEventListener('hashchange', () => go(fromHash(), { updateHash: false }));
}
