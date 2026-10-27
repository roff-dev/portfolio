---
title: "A follow camera that doesn't shake"
project: overhead
language: ts
skill: "Numerical precision"
file: "src/globe/satellites.ts"
order: 3
---

```ts
// The followed object. Each new set of orbits is fitted afresh, and its fit can sit a few hundred metres from the
// last one: nothing at globe scale, but the follow camera, metres away, would lurch. The difference becomes an
// offset that fades out, so the path stays continuous, however often new orbits arrive.
const STEADY_MS = 1200;
let steady = -1;
const offset = new Vector3();
let offsetAt = -Infinity;

/** How much of the offset is left: all of it as new orbits arrive, none STEADY_MS later, eased out. */
function fading(now: number) {
  const t = Math.min(Math.max((now - offsetAt) / STEADY_MS, 0), 1);
  return 1 - t * t * (3 - 2 * t);
}

function setElements({ el, time }: ElementsMessage) {
  const attribute = geometry.getAttribute('position') as InterleavedBufferAttribute | undefined;
  const outgoing = attribute?.data.array as Float32Array | undefined;
  if (outgoing && place(outgoing, anchorTime, steady, lastTime, before) && place(el, time, steady, lastTime, after)) {
    const now = performance.now();
    offset.multiplyScalar(fading(now)).add(before).sub(after);
    offsetAt = now;
  }
  // … upload the new orbits
}

/** Where an object is drawn at this sim time, using the shader's own maths, in double precision. */
function positionOf(slot: number, time: number, out: Vector3) {
  const attribute = geometry.getAttribute('position') as InterleavedBufferAttribute | undefined;
  const el = attribute?.data.array as Float32Array | undefined;
  if (!el || slot >= count || !place(el, anchorTime, slot, time, out)) return null;
  return slot === steady ? out.addScaledVector(offset, fading(performance.now())) : out;
}
```

**The problem:** Following a satellite from a few hundred metres away, it shook. The drawn point moved 2.4 px frame to frame (max 9.5), and each orbit refit jumped the camera by up to 394 m.

**Why this approach:** There were two causes, so there are two fixes. Shaders work in 32-bit floats, and near orbit height one step is 0.76 m, so the followed object is hidden from the shader and drawn as its own marker placed from this double-precision code. Each refit's jump becomes an offset that fades out over 1.2 s instead of snapping. Afterwards the marker moves at most 0.2 px, and a test that failed the old code with a 559 m jump now passes.

**What to notice:** `offset.multiplyScalar(fading(now))` keeps whatever is left of the previous offset, so new orbits arriving mid-fade chain smoothly instead of resetting.
