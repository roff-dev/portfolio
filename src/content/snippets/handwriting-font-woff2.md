---
title: "Writing WOFF2 without the usual encoder"
project: handwriting-font
language: ts
skill: "Binary formats under a security constraint"
file: "src/core/font/woff2.ts"
order: 4
---

```ts
/** WOFF2's variable-length unsigned integer: 7 bits per byte, most significant first, high bit = more follows. */
export function uintBase128(value: number): number[] {
  const out = [value & 0x7f];
  for (let v = value >>> 7; v > 0; v >>>= 7) out.unshift(0x80 | (v & 0x7f));
  return out;
}

/**
 * WOFF2 with the null transform on every table: a 48-byte header, a compact table directory and one
 * Brotli stream of the tables back to back. Skipping the optional glyf/loca transform costs a few
 * percent of size, and avoids the WebAssembly WOFF2 encoders, which all need `eval` (blocked by my CSP).
 */
export function toWoff2(font: ArrayBuffer, brotli: (data: Uint8Array) => Uint8Array): Uint8Array {
  const tables = [...readTables(font)].sort(([a], [b]) => (a < b ? -1 : 1));
  // … moves loca straight after glyf, which decoders expect

  const directory: number[] = [];
  for (const [tag, data] of tables) {
    const known = KNOWN_TAGS.indexOf(tag);
    const transform = tag === 'glyf' || tag === 'loca' ? NULL_TRANSFORM_GLYF_LOCA : 0;
    directory.push((known >= 0 ? known : ARBITRARY_TAG) | transform);
    if (known < 0) for (let i = 0; i < 4; i++) directory.push(tag.charCodeAt(i));
    directory.push(...uintBase128(data.length));
  }

  // … copies the tables back to back into `raw`
  const compressed = brotli(raw);

  const headerSize = 48;
  const length = pad4(headerSize + directory.length + compressed.length);
  const out = new Uint8Array(length), dv = new DataView(out.buffer);
  dv.setUint32(0, 0x774f4632); // 'wOF2'
  dv.setUint32(4, isTrueType(font) ? 0x00010000 : 0x4f54544f);
  // … total length, table count, uncompressed size, compressed size
  out.set(directory, headerSize);
  out.set(compressed, headerSize + directory.length);
  return out;
}
```

**The problem:** WOFF2 is the format websites want, and every browser-ready encoder I tried is an Emscripten build that creates functions with `eval`. My Content Security Policy blocks that, and I wasn't going to weaken it for one download button.

**Why this approach:** I read the WOFF2 spec and noticed the clever part, the glyph-table transform, is optional. Writing the header and directory by hand, and sending the tables through one Brotli stream (brotli-wasm, which doesn't need `eval`), gives a valid WOFF2 only 4.9% larger than Google's encoder: 60,756 bytes against 57,940. OTS, fontTools and all three browser engines load it under the production CSP.

**What to notice:** `uintBase128`. WOFF2 stores table lengths in a variable-length integer format, seven bits per byte, and that one loop is the whole encoder.
