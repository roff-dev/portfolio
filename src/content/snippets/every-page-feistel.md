---
title: "Shuffling 29^3200 pages so every one has exactly one shelf"
project: every-page
language: ts
skill: "Algorithm design"
file: "src/engine/feistel.ts"
order: 1
---

```ts
/** Location digits to page digits. Each round: (L, R) → (R, L ⊞ F(R)), ⊞ = digit-wise addition mod 29. */
export function scramble(digits: Uint8Array): Uint8Array {
  let left = digits.slice(0, HALF);
  let right = digits.slice(HALF, PAGE_LENGTH);
  for (let r = 0; r < ROUNDS; r++) {
    round(right, ROUND_KEYS[r]!, scratch);
    for (let i = 0; i < HALF; i++) {
      const s = left[i]! + scratch[i]!;
      left[i] = s >= RADIX ? s - RADIX : s;
    }
    [left, right] = [right, left];
  }
  // …join the halves
}

/** Page digits back to location digits: the same rounds, run backwards with subtraction. */
export function unscramble(digits: Uint8Array): Uint8Array {
  let left = digits.slice(0, HALF);
  let right = digits.slice(HALF, PAGE_LENGTH);
  for (let r = ROUNDS - 1; r >= 0; r--) {
    round(left, ROUND_KEYS[r]!, scratch);
    for (let i = 0; i < HALF; i++) {
      const s = right[i]! - scratch[i]!;
      right[i] = s < 0 ? s + RADIX : s;
    }
    [left, right] = [right, left];
  }
  // …join the halves
}
```

**The problem:** The library has 29^3200 pages, a number 4,680 digits long, and I need a shuffle between shelf positions and pages that runs both ways, so searching for text is just running it backwards.

**Why this approach:** The obvious choice, multiply by a big number and add another, is reversible but leaves a pattern: neighbouring pages repeated the same difference 66.7% of the time in my tests. A Feistel network over the digits themselves gets that down to 3.46%, which is what pure randomness gives (3.45%), and it works directly in base 29, with no cycle-walking and no BigInt inside the rounds.

**What to notice:** `round()` is never inverted. A Feistel network is a bijection whatever the round function returns, so it can be a fast, messy hash. Undoing it only means subtracting the same noise in reverse order.
