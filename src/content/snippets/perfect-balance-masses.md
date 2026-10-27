---
title: "Real weights, squeezed into a range the physics can handle"
project: perfect-balance
language: ts
skill: "Physics-engine stability"
file: "src/physics/world.ts"
order: 1
---

```ts
/** Heaviest body after the lock-in mass switch; only ratios matter because the beam is scripted. */
const LOCK_MAX_MASS = 10;
/** Real weights span 1000:1 and more; contacts stay stable at 50:1. */
const LOCK_MASS_RATIO = 50;

/**
 * Switches every body to its real weight for the reveal. A light pan under a heavy pile
 * pushes objects into its floor, so each pan is also made at least as heavy as its load.
 */
lock(masses: LockMasses): void {
  const known = masses.filter(([id]) => this.bodies.has(id));
  if (known.length > 0) {
    const heaviest = Math.max(...known.map(([, kg]) => kg));
    const floor = heaviest / LOCK_MASS_RATIO;
    for (const [id, kg] of known) {
      const mass = (Math.max(kg, floor) / heaviest) * LOCK_MAX_MASS;
      this.setMass(this.bodies.get(id)!, mass);
    }
  }
  this.locked = true;
  this.updatePanMasses();
}

private updatePanMasses(): void {
  const load: Record<PanSide, number> = { left: 0, right: 0 };
  for (const body of this.bodies.values()) {
    const where = this.locateBody(body);
    if (where === 'left' || where === 'right') load[where] += 1 / body.GetMotionProperties().GetInverseMass();
  }
  for (const side of ['left', 'right'] as const) {
    const pan = this.pans[side];
    const target = Math.max(RIG.panBaseMass, load[side]);
    const current = 1 / pan.GetMotionProperties().GetInverseMass();
    if (Math.abs(current - target) > 1e-3) this.setMass(pan, target);
  }
}
```

**The problem:** A round can put an apple on the same scale as an ambulance. Physics engines handle heavy things resting on light things badly: stacks jitter, and objects sink through the pan.

**Why this approach:** The beam's verdict is worked out from the real weights, not simulated, so the physics only has to look right. At lock-in I scale the heaviest object to 10 and raise anything lighter than a fiftieth of it to that fiftieth. In testing, contacts stayed stable up to 50:1, and real weights in a round can span 1000:1 or more.

**What to notice:** The pans get heavier too. A pan lighter than the pile on it lets objects push through its floor, so each pan is made at least as heavy as its load.
