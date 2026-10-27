---
title: "Backup codes: a year of progress in one line you can paste"
project: perfect-balance
language: ts
skill: "Browser storage and compression APIs"
file: "src/game/storage.ts"
order: 5
---

```ts
const toBase64Url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function fromBase64Url(code: string): Uint8Array {
  const binary = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  return new Uint8Array(await new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream)).arrayBuffer());
}

/** All progress as one line of text that can be pasted into another browser. Compressed, as a year of results is long. */
export async function backupCode(progress: Progress): Promise<string> {
  const bytes = await pipe(new TextEncoder().encode(JSON.stringify(progress)), new CompressionStream('deflate-raw'));
  let code = '';
  // in slices, so a long backup doesn't overflow the argument list
  for (let i = 0; i < bytes.length; i += 3 * 4096) code += toBase64Url(bytes.subarray(i, i + 3 * 4096));
  return code;
}

/** The progress in a backup code, or undefined if it isn't one. */
export async function restoreCode(code: string): Promise<Progress | undefined> {
  try {
    const bytes = await pipe(fromBase64Url(code.replace(/\s+/g, '')), new DecompressionStream('deflate-raw'));
    return normalise(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return undefined;
  }
}
```

**The problem:** There are no accounts, so your streak lives in one browser's storage. Switching to a new phone would lose it, and I didn't want to run a server just for accounts.

**Why this approach:** Progress is compressed with the browser's built-in `CompressionStream` and turned into URL-safe base64: one line you can paste anywhere, with no library. Restoring runs it through the same field-by-field check as the saved data, so a mangled code just returns nothing instead of breaking the game.

**What to notice:** The slices are 3 × 4096 bytes. A multiple of 3 encodes to base64 with no padding, so the pieces join into one valid code. Slicing at all is needed because spreading a big array into `String.fromCharCode` overflows the argument limit.
