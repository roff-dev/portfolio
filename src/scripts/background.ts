// The site background: the old site's moving lines, grown into slow lanes that branch like a git graph.
// Measured at about 1.6 ms a frame with the CPU throttled 4x; it pauses while the tab is hidden or the
// Windows desktop is showing.

interface Lane { x: number; y: number; v: number; len: number; split: number; dx: number }

const COMMITS = [0.15, 0.55, 0.85];

function makeLane(w: number, h: number): Lane {
  const len = 160 + Math.random() * 260;
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    v: 0.15 + Math.random() * 0.35,
    len,
    split: len * (0.3 + Math.random() * 0.4),
    dx: (Math.random() < 0.5 ? -1 : 1) * (24 + Math.random() * 30),
  };
}

/** Starts the lines; the function it returns turns them on or off */
export function startBackground(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let lineColour = '#404040';
  let dotColour = '#4a4a4a';
  /** The colours come from the theme's tokens, so they're read again whenever the lines come back */
  function readColours() {
    const style = getComputedStyle(canvas);
    lineColour = style.getPropertyValue('--lines').trim() || lineColour;
    dotColour = style.getPropertyValue('--lines-dot').trim() || dotColour;
  }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowPower = matchMedia('(max-width: 767px)').matches || (navigator.hardwareConcurrency ?? 8) <= 4;
  const count = lowPower ? 18 : 40;

  let w = 0;
  let h = 0;
  let raf = 0;
  let on = true;
  let lanes: Lane[] = [];

  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const widthChanged = innerWidth !== w;
    w = innerWidth;
    h = innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    // A phone's address bar changes only the height, so the lanes carry on rather than reshuffling
    if (widthChanged) lanes = Array.from({ length: count }, () => makeLane(w, h));
    draw();
  }

  // One path for every line and one for every commit dot keeps it to two draw calls a frame
  function draw() {
    const c = ctx!;
    c.clearRect(0, 0, w, h);
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.strokeStyle = lineColour;
    c.beginPath();
    for (const { x, y, len, split, dx } of lanes) {
      const fork = y + split;
      c.moveTo(x, y + len);
      c.lineTo(x, y);
      c.moveTo(x, fork);
      c.bezierCurveTo(x, fork - 40, x + dx, fork - 40, x + dx, fork - 80);
      c.lineTo(x + dx, y);
    }
    c.stroke();
    c.fillStyle = dotColour;
    c.beginPath();
    for (const { x, y, len } of lanes) {
      for (const k of COMMITS) {
        c.moveTo(x + 3.5, y + len * k);
        c.arc(x, y + len * k, 3.5, 0, Math.PI * 2);
      }
    }
    c.fill();
  }

  function frame() {
    for (const lane of lanes) {
      lane.y -= lane.v;
      if (lane.y < -lane.len) Object.assign(lane, makeLane(w, h), { y: h + 20 });
    }
    draw();
    raf = requestAnimationFrame(frame);
  }

  const start = () => { if (!raf && on && !reduce && !document.hidden) raf = requestAnimationFrame(frame); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  readColours();
  size();
  addEventListener('resize', size);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();
  return (show: boolean) => {
    on = show;
    if (!show) return stop();
    readColours();
    draw();
    start();
  };
}
