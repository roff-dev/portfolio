---
title: "Camera flights that never corner or brake too hard"
project: every-page
language: ts
skill: "Motion planning"
file: "src/scene/journey.ts"
order: 2
---

```ts
export function planPath(points: Vector3[], { vMax, aLat, aLong, vEnd }: Limits): Plan {
  const curve = new CatmullRomCurve3(points, false, 'centripetal');
  const length = curve.getLength();
  const ds = length / SAMPLES;
  const pts = Array.from({ length: SAMPLES + 1 }, (_, i) => curve.getPointAt(i / SAMPLES));
  const v = new Float64Array(SAMPLES + 1);
  // …two scratch vectors
  for (let i = 0; i <= SAMPLES; i++) {
    a.subVectors(pts[i]!, pts[Math.max(0, i - 1)]!);
    b.subVectors(pts[Math.min(SAMPLES, i + 1)]!, pts[i]!);
    const turn = a.lengthSq() > 0 && b.lengthSq() > 0 ? a.angleTo(b) : 0;
    const curvature = turn / Math.max(ds, 1e-6);
    v[i] = curvature > 1e-6 ? Math.min(vMax, Math.sqrt(aLat / curvature)) : vMax;
  }
  v[0] = Math.min(v[0]!, vEnd);
  v[SAMPLES] = Math.min(v[SAMPLES]!, vEnd);
  for (let i = 1; i <= SAMPLES; i++) v[i] = Math.min(v[i]!, Math.sqrt(v[i - 1]! ** 2 + 2 * aLong * ds));
  for (let i = SAMPLES - 1; i >= 0; i--) v[i] = Math.min(v[i]!, Math.sqrt(v[i + 1]! ** 2 + 2 * aLong * ds));
  const t = new Float64Array(SAMPLES + 1);
  for (let i = 1; i <= SAMPLES; i++) t[i] = t[i - 1]! + (2 * ds) / (v[i]! + v[i - 1]!);
  // …returns at(time), a binary search over t
}
```

**The problem:** Searching flies you through the library to your page, and a camera that whips round corners or slams to a stop makes people feel sick.

**Why this approach:** Easing curves only shape time, not physics. Here every point on the path gets the top speed its curvature allows (v = √(a/κ)), then a forward pass and a backward pass cap acceleration and braking, the same way racing games plan a lap. A binary search over the top speed then makes every flight last eight seconds without ever breaking those limits.

**What to notice:** The two one-line loops. Going forwards limits how fast you can speed up, going backwards limits how late you can brake, and together they give a smooth speed profile with no tuning.
