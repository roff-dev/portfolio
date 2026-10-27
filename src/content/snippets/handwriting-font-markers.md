---
title: "Finding a page's corners to a fraction of a pixel"
project: handwriting-font
language: ts
skill: "Computer vision without OpenCV"
file: "src/core/photo/markers.ts"
order: 5
---

```ts
/**
 * Sub-pixel corners. The detector's corners can be 2–4 px out on a blurry photo, and with only three
 * markers that error grows towards the far corner of the page. Each marker is a black square on white
 * paper, so find where the image crosses halfway from dark to light at points along each edge, fit a
 * line through them, and take the corners where neighbouring lines meet.
 */
export function refineCorners(flat: Float32Array, W: number, H: number, corners: Point[]): Point[] {
  const lines: (Line | null)[] = corners.map((a, k) => {
    const b = corners[(k + 1) % 4]!;
    // … unit normal (nx, ny) pointing out of the marker, and how far to search either side of the edge
    const edge: Point[] = [];
    for (let i = 1; i <= 12; i++) {
      const t = 0.12 + (0.76 * i) / 13, px = a[0] + (b[0] - a[0]) * t, py = a[1] + (b[1] - a[1]) * t;
      const profile: number[] = [];
      for (let d = -reach; d <= reach; d += step) profile.push(sample(flat, W, H, px + nx * d, py + ny * d, 1));
      const inside = Math.min(...profile), outside = Math.max(...profile);
      if (outside - inside < 0.2) continue;
      const half = (inside + outside) / 2;
      // … the crossing of `half` nearest the detected edge, interpolated between samples → `found`
      if (found !== null) edge.push([px + nx * found, py + ny * found]);
    }
    return edge.length >= 6 ? fitLine(edge) : null;
  });
  return corners.map((c, k) => {
    const before = lines[(k + 3) % 4], after = lines[k];
    const p = before && after ? intersect(before, after) : null;
    return p && Math.hypot(p[0] - c[0], p[1] - c[1]) < 8 ? p : c;
  });
}
```

**The problem:** If you'd rather write on paper, you print a template, fill it in and photograph it. To cut out each letter, the photo has to be straightened precisely, from four printed markers. On a blurry or shadowed phone photo the marker detector's corners are 2–4 px out, and when only three markers are found that error grew to 13.8 px at the far corner of the page. That's enough to slice the tops off letters.

**Why this approach:** Instead of trusting four noisy points, I use the whole edge. Twelve times along each side of the marker, it samples a brightness profile across the edge (on an image with the shadows already flattened) and finds where it crosses halfway from black to white. A least-squares line through those twelve crossings, intersected with its neighbour, gives a corner 0.5–1.5 px out. Every corner of every marker then goes into one least-squares homography to straighten the page.

**What to notice:** The last line. A refined corner more than 8 px from the original is rejected, so a smudge or a finger near a marker can't make things worse than the detector's own guess.
