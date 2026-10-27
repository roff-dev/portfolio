---
title: "Turning a 3D model into a few simple collision shapes"
project: perfect-balance
language: ts
skill: "Geometry processing"
file: "tools/models/build-models.ts"
order: 2
---

```ts
const MAX_PART_POINTS = 24;
const MAX_PARTS = 4;
const CUTS = 16;

/** Up to four hulls: the model is cut along whichever axis-aligned plane leaves the least empty space, until another cut barely helps. */
function compound(mesh: Mesh): number[][] {
  const triangle = (t: number) => [0, 1, 2].flatMap((k) => [...mesh.positions.subarray(mesh.indices[t + k]! * 3, mesh.indices[t + k]! * 3 + 3)]);
  const centroid = (t: number, axis: number) => (mesh.positions[mesh.indices[t]! * 3 + axis]! + mesh.positions[mesh.indices[t + 1]! * 3 + axis]! + mesh.positions[mesh.indices[t + 2]! * 3 + axis]!) / 3;
  const part = (tris: number[]) => ({ tris, volume: hullOf(tris.flatMap(triangle)).volume });
  const all = Array.from({ length: mesh.indices.length / 3 }, (_, i) => i * 3);
  let parts = [part(all)];
  const whole = parts[0]!.volume;
  while (parts.length < MAX_PARTS) {
    let best = { gain: 0.04 * whole, index: -1, halves: [] as ReturnType<typeof part>[] };
    parts.forEach((p, index) => {
      for (let axis = 0; axis < 3; axis++) {
        const along = p.tris.map((t) => centroid(t, axis));
        const [lo, hi] = [Math.min(...along), Math.max(...along)];
        for (let s = 1; s < CUTS; s++) {
          const at = lo + ((hi - lo) * s) / CUTS;
          const halves = [part(p.tris.filter((_, i) => along[i]! < at)), part(p.tris.filter((_, i) => along[i]! >= at))];
          // a cut that leaves a flat sliver can't stand alone as a hull
          if (halves.some((h) => h.volume < 1e-4)) continue;
          const gain = p.volume - halves[0]!.volume - halves[1]!.volume;
          if (gain > best.gain) best = { gain, index, halves };
        }
      }
    });
    if (best.index < 0) break;
    parts = [...parts.filter((_, k) => k !== best.index), ...best.halves];
  }
  return parts.map((p) => reduce(p.tris.flatMap(triangle), MAX_PART_POINTS));
}
```

**The problem:** Physics engines collide convex shapes quickly, but a chair, a bucket or a banana isn't convex. Wrapping each in a single hull fills in the gaps, so things stack on air.

**Why this approach:** At build time each model is split greedily. Every candidate cut (15 positions on each of the three axes) is scored by how much empty hull volume it removes, the best one is kept, and splitting stops at four parts or when no cut saves at least 4% of the whole. It runs once, offline, and the hulls are saved inside the model file, so the game does none of this work.

**What to notice:** A cut that leaves a flat sliver is skipped, because a hull with almost no volume makes the physics unstable on its own.
