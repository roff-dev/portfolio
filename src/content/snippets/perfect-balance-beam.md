---
title: "A balance beam that acts out the result instead of simulating it"
project: perfect-balance
language: ts
skill: "Animation and game feel"
file: "src/physics/beam.ts"
order: 4
---

```ts
/**
 * The beam is kinematic: its angle is scripted from the result, never simulated, so the
 * verdict can't be undone by a jittery stack. Positive angles lower the right-hand pan.
 */
/** About four swings, 3.8° then 2.7°, 1.2° and nothing, over 1.8 s. */
export const TEETER = { amplitude: 4 * DEG, frequency: 1.1, seconds: 1.8 } as const;

/** A clean miss drops fast; a near miss sinks slowly. `ratio` is total / prompt weight. */
export function tipFor(ratio: number): BeamMotion {
  const severity = ratio <= 0 ? 1 : Math.min(1, Math.abs(Math.log(ratio)) / Math.LN2);
  return { kind: 'tip', direction: ratio > 1 ? 1 : -1, duration: 1.1 - 0.65 * severity };
}

export function beamAngle(motion: BeamMotion, t: number): number {
  switch (motion.kind) {
    // … locked, wobble, level
    case 'tip': {
      // accelerates like a falling arm, then stops dead on the rest pad
      const k = Math.min(1, t / motion.duration);
      return motion.direction * RIG.stopAngle * k * k;
    }
    case 'teeter': {
      // the swing dies away smoothly, so the beam is level and still when it ends
      if (t < motion.seconds) return motion.amplitude * 0.5 * (1 + Math.cos((Math.PI * t) / motion.seconds)) * Math.sin(2 * Math.PI * motion.frequency * t);
      if (!motion.tip) return 0;
      const k = Math.min(1, (t - motion.seconds) / motion.tip.duration);
      return motion.tip.direction * RIG.stopAngle * k * k;
    }
  }
}
```

**The problem:** The reveal is the whole game. If the beam were simulated, a pile settling a millimetre could tip a winning answer into a loss, and that would feel like cheating.

**Why this approach:** The beam is moved by script from the verdict, while still being a physics body the piles react to. Every reveal teeters the same way, a win or a miss, so you can't tell the outcome until it stops rocking. Then a miss tips, and how fast it drops depends on how far off you were: 0.45 s for a clean miss, 1.1 s for a near one.

**What to notice:** The teeter fades out with a raised cosine rather than a decaying exponential, so it reaches exactly level and still at 1.8 s instead of trembling forever.
