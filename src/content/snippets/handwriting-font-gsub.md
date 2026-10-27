---
title: "Letters that take turns"
project: handwriting-font
language: ts
skill: "OpenType format knowledge"
file: "src/core/font/gsub.ts"
order: 2
---

```ts
/** Chaining context format 3: one backtrack glyph from `after`, one input glyph from `input` → `lookup`. */
function chainOne(after: number[], input: number[], lookup: number): Uint8Array {
  // … writes the subtable: one backtrack coverage, one input coverage, one lookup record
}

/**
 * Letters take turns: each letter picks the variant after the one the previous glyph used, cycling
 * default → alt1 → alt2 → default. The chaining lookup reads the glyph before it, which the same pass
 * has already substituted, so the state carries along the line. Joined pairs run first, as their own
 * `liga` feature, so they form from plain letters and then count as a default glyph for the cycle.
 */
export function makeGsub({ variants, pairs, neutral }: GsubInput): Uint8Array | null {
  const lookups: Lookup[] = [];
  const features: Feature[] = [];
  if (pairs.length) {
    features.push({ tag: 'liga', lookups: [lookups.length] });
    lookups.push({ type: LIGATURE, subtables: [ligatureSubst(pairs)] });
  }
  const withAlt = (k: number) => variants.filter((v) => v.alts[k] !== undefined).map((v): [number, number] => [v.base, v.alts[k]!]);
  const alt1 = withAlt(0), alt2 = withAlt(1);
  if (alt1.length) {
    const alt1Lookup = lookups.length;
    lookups.push({ type: SINGLE, subtables: [singleSubst(alt1)] });
    const chains = [chainOne(neutral, alt1.map(([b]) => b), alt1Lookup)];
    if (alt2.length) {
      const alt2Lookup = lookups.length;
      lookups.push({ type: SINGLE, subtables: [singleSubst(alt2)] });
      chains.push(chainOne(alt1.map(([, a]) => a), alt2.map(([b]) => b), alt2Lookup));
    }
    features.push({ tag: 'calt', lookups: [lookups.length] });
    lookups.push({ type: CHAINING, subtables: chains });
  }
  return lookups.length ? writeLayoutTable(features, lookups, EXTENSION) : null;
}
```

**The problem:** A handwriting font gives itself away when every "e" in "letter" is identical. People can draw their busiest letters up to three times, and the font should rotate through them as you type, with no code running in Word or Pages to help.

**Why this approach:** Random alternates aren't possible in OpenType, and a fixed rotation per letter still repeats visibly. This builds a tiny state machine out of contextual substitution. Each letter looks at the glyph before it, which the same pass has already swapped, so "after a default, use version 2; after version 2, use version 3" carries along the whole line. I checked it in HarfBuzz, fontkit, Chromium, Firefox, WebKit and Windows' DirectWrite.

**What to notice:** The order of the features. Joined pairs (`liga`) form first from plain letters, then count as "default" for the cycle, so a word with a joined "th" still rotates the letters around it.
