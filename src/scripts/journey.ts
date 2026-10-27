// The about journey. Without this script every stop shows and the branch is drawn in full; with it the
// branch draws itself as you scroll, the stop in the middle of the screen lights up, and the jump map
// and the address follow it. It also runs the favourite-game picker.

/** A random game from the list that isn't the one showing */
export function nextGame(games: readonly string[], current: string, random = Math.random) {
  const options = games.filter((game) => game !== current);
  return options[Math.floor(random() * options.length)];
}

export function startJourney(journey: HTMLElement, map: HTMLElement) {
  const stops = [...journey.querySelectorAll<HTMLElement>('[data-stop]')];
  const links = stops.map((stop) => map.querySelector<HTMLAnchorElement>(`a[href="#${stop.id}"]`));
  const drawn = journey.querySelector<HTMLElement>('[data-drawn]')!;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Progress comes straight from the scroll position, with no animation of its own, so it can't
  // lag behind or fight the input. With reduced motion the branch stays fully drawn.
  if (!reduce) {
    let queued = false;
    const draw = () => {
      queued = false;
      const box = journey.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (innerHeight / 2 - box.top) / box.height));
      drawn.style.setProperty('--p', progress.toFixed(4));
    };
    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(draw);
    };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    document.fonts?.ready.then(queue);
    draw();
  }

  // The address only follows once the page has scrolled, so it never overwrites a deep link
  // that the browser hasn't scrolled to yet
  let follow = false;
  addEventListener('scroll', () => { follow = true; }, { once: true, passive: true });

  function arrive(i: number) {
    stops.forEach((stop, j) => stop.classList.toggle('is-here', i === j));
    links.forEach((link, j) => (i === j ? link?.setAttribute('aria-current', 'step') : link?.removeAttribute('aria-current')));
    // The first stop is the page itself, so it gets no hash
    const hash = i === 0 ? '' : `#${stops[i].id}`;
    if (follow && location.hash !== hash) history.replaceState(null, '', hash || location.pathname + location.search);
  }

  // A stop is "here" while it crosses the middle of the screen
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) arrive(stops.indexOf(entry.target as HTMLElement));
  }, { rootMargin: '-50% 0px -50% 0px' });
  stops.forEach((stop) => observer.observe(stop));

  for (const button of journey.querySelectorAll<HTMLButtonElement>('[data-games]')) startGamePicker(button, reduce);
}

/** Same games and behaviour as the old site: a random one on load, and never the same one twice in a row */
function startGamePicker(button: HTMLButtonElement, reduce: boolean) {
  const games: string[] = JSON.parse(button.dataset.games!);
  const name = button.parentElement!.querySelector<HTMLElement>('[data-game-name]')!;
  const icon = button.querySelector('svg')!;
  name.textContent = nextGame(games, '');
  // Announced from here on, so the pick on load isn't read out
  name.setAttribute('aria-live', 'polite');

  let busy = false;
  button.addEventListener('click', async () => {
    if (busy) return;
    const next = nextGame(games, name.textContent!.trim());
    if (reduce) {
      name.textContent = next;
      return;
    }
    busy = true;
    icon.animate([{ rotate: '0deg' }, { rotate: '360deg' }], { duration: 1000, easing: 'ease' });
    const hidden = { opacity: 0, translate: '0 10px' };
    const shown = { opacity: 1, translate: '0 0' };
    const out = name.animate([shown, hidden], { duration: 300, easing: 'ease', fill: 'forwards' });
    await out.finished;
    name.textContent = next;
    out.cancel();
    await name.animate([hidden, shown], { duration: 300, easing: 'ease' }).finished;
    busy = false;
  });
}
