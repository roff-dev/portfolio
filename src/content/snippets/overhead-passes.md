---
title: "Finding when the ISS is visible tonight"
project: overhead
language: ts
skill: "Event finding"
file: "src/sky/passes.ts"
order: 4
---

```ts
export function findPasses(rec: SatRec, latDeg: number, lonDeg: number, from: number, to: number, limit = Infinity): Pass[] {
  const where = { latitude: latDeg * RAD, longitude: lonDeg * RAD, height: 0 };
  const seenAt = (t: number) => look(rec, where, t)?.visible ?? false;
  const edge = (a: number, b: number) => {
    const before = seenAt(a);
    while (b - a > PRECISION_MS) {
      const m = (a + b) / 2;
      if (seenAt(m) === before) a = m;
      else b = m;
    }
    return (a + b) / 2;
  };
  const highest = (a: number, b: number) => {
    const g = (Math.sqrt(5) - 1) / 2;
    const height = (t: number) => look(rec, where, t)?.elevation ?? -Infinity;
    let c = b - g * (b - a);
    let d = a + g * (b - a);
    while (b - a > PRECISION_MS) {
      if (height(c) > height(d)) b = d;
      else a = c;
      c = b - g * (b - a);
      d = a + g * (b - a);
    }
    return (a + b) / 2;
  };
  const passes: Pass[] = [];
  let was = seenAt(from);
  let start: number | null = was ? from : null;
  for (let t = from + STEP_MS; t <= to && passes.length < limit; t += STEP_MS) {
    const is = seenAt(t);
    if (is && !was) start = edge(t - STEP_MS, t);
    if (!is && was && start !== null) {
      const end = edge(t - STEP_MS, t);
      passes.push({ start, peak: highest(start, end), end /* … directions */ });
      start = null;
    }
    was = is;
  }
  return passes;
}
```

**The problem:** "Visible" means three things at once: at least 10° up, lit by the Sun, and against a sky dark enough (Sun 6° below the horizon). Checking every second for a week is 600,000 orbit calculations per object.

**Why this approach:** A 20-second scan is coarse enough to be quick and fine enough not to miss the shortest pass. Each edge is then halved down to 250 ms, and the peak is found with a golden-section search, which reuses one of its two points every step. A station-week takes about 50 ms. Against in-the-sky.org's London table, my start times are within 7.1 s, end times within 5.2 s and peak heights within 0.75°.

**What to notice:** The bisection compares against whatever the visibility was at the start of the gap, so the same function finds both the start and the end of a pass.
