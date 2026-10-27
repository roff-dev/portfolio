---
title: "Proving every round can be won"
project: perfect-balance
language: ts
skill: "Dynamic programming"
file: "src/game/generate.ts"
order: 3
---

```ts
/** Fine enough that 30 rounded weights stay well inside the window's width. */
const RESOLUTION = 4000;

/**
 * The proof a round can be won: the fewest objects for every total, as a bounded DP over all
 * inventory types (any number of each). A total found this way is re-checked with the real weights.
 */
export function solve(inventory: readonly CatalogueEntry[], promptKg: number, { margin, maxItems } = DAILY_RULES): { entry: CatalogueEntry; count: number }[] | undefined {
  const top = Math.floor(margin.max * RESOLUTION);
  const weights = inventory.map((e) => Math.max(1, Math.round((e.weightKg / promptKg) * RESOLUTION)));
  const fewest = new Uint8Array(top + 1).fill(255);
  const via = new Int16Array(top + 1).fill(-1);
  fewest[0] = 0;
  for (let s = 1; s <= top; s++) {
    for (let i = 0; i < weights.length; i++) {
      const w = weights[i]!;
      if (w <= s && fewest[s - w]! + 1 < fewest[s]!) {
        fewest[s] = fewest[s - w]! + 1;
        via[s] = i;
      }
    }
  }
  for (let s = Math.ceil(margin.min * RESOLUTION); s <= top; s++) {
    if (fewest[s]! > maxItems) continue;
    const counts = new Map<number, number>();
    for (let t = s; t > 0; t -= weights[via[t]!]!) counts.set(via[t]!, (counts.get(via[t]!) ?? 0) + 1);
    const kg = [...counts].reduce((sum, [i, c]) => sum + inventory[i]!.weightKg * c, 0);
    if (verdictFor(kg / promptKg, margin) === 'balanced') return [...counts].map(([i, count]) => ({ entry: inventory[i]!, count }));
  }
  return undefined;
}
```

**The problem:** Every daily round is generated from a seed, and a round you can't win would be a broken puzzle for everyone that day. "It's probably winnable" isn't good enough.

**Why this approach:** Weights become whole numbers on a 4000-step scale relative to the target, which turns the question into the classic coin-change problem: for every total, the fewest objects that reach it. It runs on every round as it's generated, and the back-pointers rebuild an actual winning mix.

**What to notice:** Rounding can lie, so each winning total from the grid is re-checked against the real weights before the round counts as proven.
