---
title: "Estimating how bright a satellite is from its radar size"
project: overhead
language: ts
skill: "Statistical modelling"
file: "src/orbit/brightness.ts"
order: 5
---

```ts
/**
 * Standard magnitude (1,000 km away, half lit) from radar cross-section: m = a + b·log10(RCS m²).
 * Fitted per object type against visual magnitude observations; held-out error is a median of
 * 0.56 magnitudes. The slope sits near the −2.5 you'd expect if reflected light scales with area.
 */
const FIT: Record<ObjectType, [a: number, b: number]> = {
  payload: [6.35, -2.27],
  rocket: [6.08, -2.57],
  debris: [5.95, -2.08],
};

/** When there's no measured RCS, the catalogue's size class: the fit at each class's median RCS. */
const SIZE_CLASS: Record<string, number> = { LARGE: 4.5, MEDIUM: 7.5, SMALL: 10.0 };

/** Above this the fit runs about three magnitudes too faint (the ISS and other giants), so no number is given. */
export const GIANT_RCS = 50;

export function estimateBrightness(type: ObjectType, rcs: number | undefined, sizeClass: string | undefined): Brightness {
  if (rcs !== undefined && rcs > GIANT_RCS) return { magnitude: null, giant: true };
  if (rcs !== undefined && rcs > 0) {
    const [a, b] = FIT[type];
    return { magnitude: a + b * Math.log10(rcs), giant: false };
  }
  const fromClass = sizeClass ? SIZE_CLASS[sizeClass] : undefined;
  return { magnitude: fromClass ?? null, giant: false };
}
```

**The problem:** I wanted to show which satellites you could see by eye, but the usual brightness list can't be redistributed.

**Why this approach:** Radar cross-section is published for about 14,500 objects, so I fitted brightness against it, one line per object type, and checked it on objects held back from the fit. The median error is 0.56 magnitudes, and the slope lands near the −2.5 physics predicts, which told me the fit was measuring something real.

**What to notice:** It's honest about where it breaks. Above 50 m² the fit runs about three magnitudes too faint, so the ISS and the other giants get no number at all rather than a wrong one.
