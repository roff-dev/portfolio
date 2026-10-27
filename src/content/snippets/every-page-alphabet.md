---
title: "Showing how the library will read what you type"
project: every-page
language: ts
skill: "Input UX"
file: "src/engine/alphabet.ts"
order: 4
---

```ts
export function normalise(input: string): Normalised {
  let text = '';
  const changes: Change[] = [];
  const removed: string[] = [];
  let truncated = false;
  for (const ch of input) {
    let out: string;
    const lower = ch.toLowerCase();
    if (INDEX.has(lower) && lower !== ' ') out = lower;
    else if (TO_SPACE.test(ch)) out = ' ';
    else if (TO_STOP.test(ch)) out = '.';
    else if (DROPPED_QUIETLY.test(ch)) out = '';
    else if (FOLDS[ch] !== undefined) out = FOLDS[ch];
    else {
      const stripped = ch.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
      out = [...stripped].every((c) => INDEX.has(c)) ? stripped : '';
      if (out === '') {
        if (!removed.includes(ch)) removed.push(ch);
        changes.push({ kind: 'removed', char: ch });
        continue;
      }
    }
    // runs of spaces (often left behind by removed characters) collapse to one, and none lead
    if (out === ' ' && (text === '' || text.endsWith(' '))) continue;
    if (text.length + out.length > PAGE_LENGTH) { truncated = true; break; }
    // Lowercasing and dropping quote marks are expected, so they aren't reported
    if (out !== '' && out !== lower) changes.push({ kind: 'altered', from: ch, to: out, at: text.length });
    text += out;
  }
  if (text.endsWith(' ')) text = text.slice(0, -1);
  return { text, changes, removed, truncated };
}
```

**The problem:** The library only has 29 symbols, but people type capitals, accents, digits, emoji and smart quotes, and silently changing their words feels broken.

**Why this approach:** Rather than reject input, every character is mapped the gentlest way it can be (é to e, ß to ss, ! to a full stop) and every change is recorded. The search card shows a live "will read as" line with the altered letters underlined and the removed ones listed, so you see exactly what the library will look for before you search.

**What to notice:** It separates expected changes (lowercasing, quotes) from surprising ones, so the feedback only speaks up when it matters.
