---
title: "Share links fifty characters long for pages thousands of digits deep"
project: every-page
language: ts
skill: "Architecture decision"
file: "src/engine/links.ts"
order: 5
---

```ts
export function formatLink({ anchor, offset, move }: Link): string {
  let hash: string;
  if (anchor.kind === 'query') {
    hash = 'q=' + anchor.text.replaceAll(' ', SPACE);
    if (anchor.variant) hash += `&k=${anchor.variant}`;
  } else if (anchor.kind === 'random') {
    hash = 'r=' + anchor.seed.toString(36);
  } else {
    const { hexagon, wall, shelf, volume, page } = anchor.location;
    hash = `a=${hexagon.toString(36)}.${wall + 1}.${shelf + 1}.${volume + 1}.${page + 1}`;
  }
  if (move) {
    hash += `&m=${move.east}.${move.up}`;
    if (move.book) hash += `.${move.book.wall + 1}.${move.book.shelf + 1}.${move.book.volume + 1}.${move.book.page + 1}`;
  }
  if (offset) hash += `&d=${offset}`;
  return '#' + hash;
}
```

**The problem:** A page's address is a number about 3,000 characters long in base 36, far too long to paste into a chat.

**Why this approach:** A link stores how you got somewhere instead of where it is: the words you searched for, or the seed of a random volume, plus small relative moves (galleries east, floors up, pages on). Opening it re-runs the search on your device and replays the moves, so the link is typically about 50 characters, and it lives after the `#` so it never reaches a server.

**What to notice:** Moves are relative to the anchor, never a raw page difference. One floor up is a few characters in a link, but as a page difference it would be thousands of digits long.
