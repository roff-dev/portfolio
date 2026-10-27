---
title: "Reading 11 GB of Wikipedia dumps without allocating per row"
project: wikiracer
language: js
skill: "Streaming big-data parsing"
file: "pipeline/lib/sql.mjs"
order: 5
---

```js
// Every line of a MediaWiki dump starting with "(" is a row. Fields are read in order
// with a cursor, so nothing is allocated per row.
// P is the cursor into the current buffer; S/E are the last string's raw (still escaped) bounds.
export let P = 0, S = 0, E = 0;

export async function forEachRow(file, onRow) {
  const gz = createReadStream(file, { highWaterMark: 1 << 23 }).pipe(createGunzip({ chunkSize: 1 << 23 }));
  let carry = null;
  for await (const chunk of gz) {
    const buf = carry ? Buffer.concat([carry, chunk]) : chunk;
    let start = 0;
    let nl;
    while ((nl = buf.indexOf(10, start)) !== -1) {
      if (buf[start] === 40) { P = start + 1; onRow(buf, nl); }
      start = nl + 1;
    }
    carry = start < buf.length ? Buffer.from(buf.subarray(start)) : null;
  }
  if (carry && carry[0] === 40) { P = 1; onRow(carry, carry.length); }
  // … returns the byte count
}

export function int(b) {
  let neg = false;
  if (b[P] === 45) { neg = true; P++; }
  let v = 0, c;
  while ((c = b[P]) >= 48 && c <= 57) { v = v * 10 + (c - 48); P++; }
  P++;
  return neg ? -v : v;
}

// Reads a quoted string into S/E. Returns false for NULL.
export function str(b) {
  if (b[P] !== 39) { while (b[P] !== 44 && b[P] !== 41) P++; P++; S = E = 0; return false; }
  P++; S = P;
  for (;;) { const c = b[P]; if (c === 92) { P += 2; continue; } if (c === 39) break; P++; }
  E = P; P += 2;
  return true;
}
```

**The problem:** The map is rebuilt from 11 GB of compressed SQL dumps holding hundreds of millions of rows. Parsing each row into strings and objects would spend most of the time in the garbage collector.

**Why this approach:** I never parse SQL at all. Each row is one line starting with `(`, so the reader walks the decompressed bytes in 8 MB chunks with a shared cursor, reading numbers digit by digit and strings as start/end positions into the buffer. A string only becomes a JavaScript string if the caller actually needs one.

**What to notice:** A line that straddles two chunks is carried over and joined to the next one, so no row is ever split.
