// Wheel paging for the pages that move a screen at a time. CSS snapping already handles touch and keys,
// but it pulls small wheel and trackpad scrolls back to where they started, so here one wheel gesture
// moves exactly one screen. Anything that scrolls inside itself, and any section taller than the
// screen, scrolls normally until it reaches its end.

const QUIET_MS = 180;
const THRESHOLD = 24;

function canScroll(el: Element | null, dy: number): boolean {
  for (; el && el !== document.documentElement; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
      if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
    }
  }
  return false;
}

export function startPageSnap() {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let moving = false;
  let lastWheel = 0;
  let pending = 0;
  let move = 0;

  // Snap positions in page coordinates: the top of every section, the bottom edge of any section taller
  // than the screen (so paging up lands at its end and scrolls back through it), and the footer
  function stops() {
    const pad = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    const max = root.scrollHeight - innerHeight;
    const ys = [max];
    for (const s of document.querySelectorAll<HTMLElement>('.snap-page')) {
      const { top, bottom } = s.getBoundingClientRect();
      ys.push(Math.round(top + scrollY - pad));
      if (bottom - top > innerHeight - pad + 1) ys.push(Math.round(bottom + scrollY - innerHeight));
    }
    return { pad, max, tops: [...new Set(ys.map((y) => Math.min(max, y)))].sort((a, b) => a - b) };
  }

  // A section taller than the screen scrolls through first: it only pages once its far edge is in view
  function insideTallSection(dy: number, pad: number) {
    const viewTop = pad;
    const viewBottom = innerHeight;
    return [...document.querySelectorAll<HTMLElement>('.snap-page')].some((s) => {
      const { top, bottom } = s.getBoundingClientRect();
      if (bottom - top <= viewBottom - viewTop + 1 || top > viewTop + 1 || bottom < viewBottom - 1) return false;
      return dy > 0 ? bottom > viewBottom + 1 : top < viewTop - 1;
    });
  }

  function settle() {
    // Trackpads keep sending momentum after the gesture; stay put until it has died down
    if (performance.now() - lastWheel < QUIET_MS) { setTimeout(settle, QUIET_MS); return; }
    moving = false;
    pending = 0;
  }

  addEventListener('wheel', (e) => {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || root.style.overflow === 'hidden') return;
    const dy = e.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? e.deltaY : e.deltaY * 40;
    if (canScroll(e.target as Element, dy)) return;
    const { pad, max, tops } = stops();
    if (!moving && insideTallSection(dy, pad)) return;

    e.preventDefault();
    lastWheel = performance.now();
    if (moving) return;
    pending += dy;
    if (Math.abs(pending) < THRESHOLD) return;

    const y = Math.round(scrollY);
    const target = pending > 0 ? tops.find((t) => t > y + 1) ?? max : [...tops].reverse().find((t) => t < y - 1) ?? 0;
    pending = 0;
    if (target === y) return;
    moving = true;
    scrollTo({ top: target, behavior: reduce.matches ? 'instant' : 'smooth' });
    addEventListener('scrollend', () => settle(), { once: true });
    // Some browsers fire no scrollend for a scroll that ends where it started; never stay locked
    const id = ++move;
    setTimeout(() => { if (moving && id === move) settle(); }, 1200);
  }, { passive: false });
}
