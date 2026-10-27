---
title: "Tap-to-select by searching the screen, not the GPU"
project: overhead
language: ts
skill: "Hit-testing"
file: "src/data/pick.ts"
order: 2
---

```ts
export function findNearby(
  elements: Float32Array, objects: Pickable[], anchorTime: number,
  { x, y, radius, width, height, viewProjection: m, camera, time }: Omit<PickRequest, 'type' | 'id'>,
  limit = 8,
  kinds = ALL_KINDS,
  // … an optional extra filter
): Candidate[] {
  const [cx, cy, cz] = camera;
  const outside = cx * cx + cy * cy + cz * cz - 1;
  const dt = (time - anchorTime) / 1000;
  const day = time / DAY_MS;
  const found: (Candidate & { score: number; depth: number })[] = [];
  for (let slot = 0; slot < objects.length; slot++) {
    const o = slot * STRIDE;
    const info = objects[slot]!;
    if (!(elements[o]! > 0) || info.launchDay > day || !((kinds >> elements[o + KIND]!) & 1)) continue;
    keplerPosition(elements, o, dt, position);
    const px = position[0]! * KM, py = position[2]! * KM, pz = -position[1]! * KM;
    const w = m[3]! * px + m[7]! * py + m[11]! * pz + m[15]!;
    if (w <= 0) continue;
    const sx = (((m[0]! * px + m[4]! * py + m[8]! * pz + m[12]!) / w + 1) / 2) * width;
    const sy = ((1 - (m[1]! * px + m[5]! * py + m[9]! * pz + m[13]!) / w) / 2) * height;
    const distance = Math.hypot(sx - x, sy - y);
    if (distance > radius) continue;
    // Hidden if the ray from the camera meets the Earth before it reaches the object
    const dx = px - cx, dy = py - cy, dz = pz - cz;
    const length = Math.hypot(dx, dy, dz);
    const b = (cx * dx + cy * dy + cz * dz) / length;
    const disc = b * b - outside;
    if (disc > 0) {
      const hit = -b - Math.sqrt(disc);
      if (hit > 0 && hit < length) continue;
    }
    const station = (info.lists & STATION) !== 0;
    const score = distance - (station ? 6 : 0) - (info.lists & VISUAL ? 4 : 0) - (info.type === 'payload' ? 2 : 0);
    found.push({ slot, norad: info.norad, name: info.name, type: info.type, station, distance, score, depth: length });
  }
  found.sort((a, b) => a.score - b.score || a.depth - b.depth);
  return found.slice(0, limit).map(({ slot, norad, name, type, station, distance }) => ({ slot, norad, name, type, station, distance }));
}
```

**The problem:** At globe scale a fingertip covers a median of 87 satellites, and only 3.5% of taps land on a lone object. Tapping has to pick something sensible every time.

**Why this approach:** I tried the usual GPU picking first: draw every object in a unique colour and read back the pixel. With overlapping points it returns whichever was drawn last, not the nearest. It agreed with the nearest object on only 8 of 40 desktop taps and 1 of 40 phone taps, and its readback peaked at 28 ms. Searching on the CPU, off the main thread, takes 5.4 ms (median) on desktop and lets me rank what's under the finger.

**What to notice:** The ray–sphere test throws out anything behind the Earth, and the small score bonuses mean a tap near the ISS finds the ISS, not the debris next to it.
