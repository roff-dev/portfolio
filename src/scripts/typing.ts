// The hero's typed command, written by hand so the old Typed.js timings carry over without its GPL licence.

/** [class, text]: "b" is bold, "" is plain, anything else is a span class */
export type Part = readonly [cls: string, text: string];

export const PARTS: readonly Part[] = [
  ['', 'C:/'], ['b', 'Kieron Oates'], ['', ' '], ['t-key', 'npm'], ['', ' install '], ['b', 'Web Developer'], ['', ' '], ['t-mute', '--skills'],
];

export const TIMINGS = { start: 500, type: 50, hold: 2500, erase: 35, pause: 400 } as const;

export const length = (parts: readonly Part[]) => parts.reduce((n, [, text]) => n + text.length, 0);

/** The markup for the first `count` characters, keeping each part's styling (the parts are static text) */
export function render(parts: readonly Part[], count: number): string {
  let left = count;
  let html = '';
  for (const [cls, text] of parts) {
    if (left <= 0) break;
    const shown = text.slice(0, left);
    left -= text.length;
    html += cls === 'b' ? `<b>${shown}</b>` : cls ? `<span class="${cls}">${shown}</span>` : shown;
  }
  return html;
}

/** Type, hold, erase and repeat; under reduced motion the whole line shows at once */
export function startTyping(el: HTMLElement, parts = PARTS) {
  const total = length(parts);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.innerHTML = render(parts, total);
    return;
  }
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  (async () => {
    await wait(TIMINGS.start);
    for (;;) {
      for (let i = 1; i <= total; i++) { el.innerHTML = render(parts, i); await wait(TIMINGS.type); }
      await wait(TIMINGS.hold);
      for (let i = total - 1; i >= 0; i--) { el.innerHTML = render(parts, i); await wait(TIMINGS.erase); }
      await wait(TIMINGS.pause);
    }
  })();
}
