---
title: "Kerning from the shape of your own letters"
project: handwriting-font
language: ts
skill: "Algorithm and performance"
file: "src/core/metrics/kerning.ts"
order: 3
---

```ts
/**
 * The visual gap between two glyphs set side by side: band by band, the white space from a's ink to b's,
 * with each side's contribution clamped so deep open counters (the inside of a C) don't count as gap.
 */
export function pairGap(a: KernGlyph, b: KernGlyph, depthCap: number): PairGap | null {
  let minGap = Infinity, sum = 0, n = 0;
  for (let i = 0; i < GRID.bands; i++) {
    const ra = a.profile.right[i]!, lb = b.profile.left[i]!;
    if (!Number.isFinite(ra) || !Number.isFinite(lb)) continue;
    const ga = a.advance - ra, gb = lb;
    minGap = Math.min(minGap, ga + gb);
    sum += Math.min(ga, a.rsb + depthCap) + Math.min(gb, b.lsb + depthCap);
    n++;
  }
  return n >= 2 ? { eff: sum / n, minGap } : null;
}

/**
 * Kern a pair towards the gap the user's own straight-sided letters make (nn, HH, Hn, nH): a pair that
 * looks looser than that comes together, one that looks tighter opens up, and nothing ever touches.
 */
export function kernValue(a: KernGlyph, b: KernGlyph, refs: ReferenceGaps, xHeight: number): number {
  const gap = pairGap(a, b, 0.6 * xHeight);
  if (!gap) return 0;
  const ref = refs[`${side(a.text.at(-1)!)}${side(b.text[0]!)}` as keyof ReferenceGaps];
  const floor = MIN_CLEARANCE - gap.minGap;
  let k = Math.min(MAX_KERN, Math.max(MIN_KERN, STRENGTH * (ref - gap.eff), floor));
  // Round to a multiple of 5 and drop tiny values, but never below the clearance floor.
  k = Math.round(k / 5) * 5;
  if (k < floor && k + 5 <= MAX_KERN) k += 5;
  return Math.abs(k) < 10 && floor <= 0 ? 0 : k;
}
```

**The problem:** "AV" and "To" look wrong at the same spacing as "nn". A type designer kerns thousands of pairs by eye. This has to do it automatically, for letters nobody has seen before, on a phone, in well under a second.

**Why this approach:** Each glyph's left and right edges are scanned once into horizontal bands, and every pair is then compared with a reference: the gap between the user's own "n"s or "H"s. So the kerning matches how tightly that person writes, not a fixed number. Measuring from those stored profiles instead of the outlines took kerning from 1.4 s to 0.16 s, and a 291-glyph font with 6,943 kerned class pairs now assembles in 155 ms on my desktop.

**What to notice:** The depth cap. Without it, the open side of a "C" or "L" reads as a huge gap and drags the next letter inside it. Capping how deep a counter can count is what keeps "LT" from colliding.
