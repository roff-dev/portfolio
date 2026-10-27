---
title: "Searching from both ends at once, and counting every shortest route"
project: wikiracer
language: js
skill: "Graph search"
file: "pipeline/lib/bfs.mjs"
order: 1
---

```js
// Each step expands one side's whole frontier: the side whose frontier has fewer links to follow.
// If no article had been reached by both sides before the step, every shortest route is longer
// than (forward depth - 1) + backward depth, so the first step that meets gives
// d = forward depth + backward depth. Each shortest route crosses the newly expanded level once,
// so k = sum of cntF * cntB over the meeting articles.
function search(s, t) {
  // … reset, and seed both sides with depth 0 and count 1
  while (front[0].length && front[1].length) {
    let cost0 = 0, cost1 = 0;
    for (const u of front[0]) cost0 += outOff[u + 1] - outOff[u];
    for (const u of front[1]) cost1 += inOff[u + 1] - inOff[u];
    const side = cost0 <= cost1 ? 0 : 1;
    const other = 1 - side;
    const { off, adj } = sides[side];
    const d = dep[side], c = cnt[side], depth = L[side] + 1;
    const next = [];
    for (const u of front[side]) {
      const cu = c[u];
      for (let k = off[u]; k < off[u + 1]; k++) {
        const v = adj[k];
        if (d[v] < 0) { d[v] = depth; c[v] = cu; next.push(v); /* … parent, for drawing the routes */ }
        else if (d[v] === depth) c[v] += cu;
      }
    }
    L[side] = depth;
    front[side] = next;
    const meet = [];
    for (const v of next) if (dep[other][v] >= 0) meet.push(v);
    if (meet.length) {
      let k = 0;
      for (const v of meet) {
        if (dep[other][v] !== L[other]) throw new Error(`BFS invariant: meeting depth ${dep[other][v]} != ${L[other]}`);
        k += cnt[0][v] * cnt[1][v];
      }
      return { d: L[0] + L[1], k, meet };
    }
  }
  return { d: Infinity, k: 0, meet: [] };
}
```

**The problem:** After each race I show the shortest route and how many shortest routes there were, across 7.2 million articles and 713 million links.

**Why this approach:** Searching from one end grows by a factor of the average link count every step. Searching from both ends and meeting in the middle only goes half as deep on each side, which is the difference between millions of articles and thousands. Expanding whichever side has fewer links to follow keeps the two sides balanced.

**What to notice:** Route counts come almost for free. Each article carries how many shortest ways reach it, and multiplying the two sides' counts where they meet gives the total. The comment is the proof, and the `throw` checks it on every search.
