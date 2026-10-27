---
title: "Downloading only the bytes a search needs"
project: wikiracer
language: ts
skill: "Network efficiency"
file: "src/search/reader.ts"
order: 2
---

```ts
async readGroups(table: SlotTable, groups: Group[], onGroup: (g: Group, bytes: Uint8Array) => void, ctx: ReadContext = {}): Promise<void> {
  const S = this.manifest.slotBytes;
  const waits: Promise<void>[] = [];
  const fresh: Group[] = [];
  for (const g of groups) {
    const key = `${table}:${g.slot}`;
    const hit = this.cacheGet(key);
    if (hit) { onGroup(g, hit); continue; }
    const p = this.pending.get(key);
    // another read is fetching it; if that read is cancelled, fetch it for this one
    if (p) waits.push(p.then((b) => onGroup(g, b), (e) => (isAbort(e) && !ctx.signal?.aborted ? this.readGroups(table, [g], onGroup, ctx) : Promise.reject(e))));
    else fresh.push(g);
  }
  fresh.sort((a, b) => a.slot - b.slot);
  const runs: Group[][] = [];
  for (const g of fresh) {
    const run = runs.at(-1);
    const last = run?.at(-1);
    if (run && last && last.slot + last.slots === g.slot && (g.slot + g.slots - run[0]!.slot) * S <= this.maxRunBytes) run.push(g);
    else runs.push([g]);
  }
  for (const run of runs) {
    const start = run[0]!.slot * S;
    const end = (run.at(-1)!.slot + run.at(-1)!.slots) * S;
    const fetched = this.fetchRange(table, start, end, ctx);
    for (const g of run) {
      const key = `${table}:${g.slot}`;
      const p = fetched.then((bytes) => {
        const own = bytes.slice(g.slot * S - start, (g.slot + g.slots) * S - start);
        this.cachePut(key, own);
        return own;
      });
      this.pending.set(key, p);
      void p.finally(() => this.pending.delete(key)).catch(() => undefined);
      waits.push(p.then((b) => onGroup(g, b)));
    }
  }
  await Promise.all(waits);
}
```

**The problem:** The link map is gigabytes of static files on free hosting, and there's no search server. The browser has to find routes by downloading as little of it as possible.

**Why this approach:** The map is stored in 2 KB slots, and HTTP Range requests fetch just the slots a search step needs. Nearby slots are merged into one request of up to 1 MB, slots already on their way are shared rather than fetched twice, and cached ones are handed over at once. A whole search reads about a megabyte.

**What to notice:** If the read that started a fetch is cancelled, the other reads waiting on it don't fail with it: each one fetches its slot for itself.
