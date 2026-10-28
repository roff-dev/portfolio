// The code library. Without this script every snippet shows, open, and the search is hidden; with it the
// snippets fold to their titles and `$ grep` filters them, with the search kept in the address so a view can be shared.

export interface FilterState {
  q: string;
  lang: string;
  project: string;
}

export interface Doc {
  /** Lower-cased */
  title: string;
  /** Lower-cased: everything else in the snippet, code included */
  text: string;
  lang: string;
  project: string;
}

export const EMPTY: FilterState = { q: '', lang: '', project: '' };
const MAX_QUERY = 100;

/** The view in a URL's query string; values that aren't in the library are ignored */
export function readState(search: string, known: { langs: readonly string[]; projects: readonly string[] }): FilterState {
  const params = new URLSearchParams(search);
  const lang = params.get('lang') ?? '';
  const project = params.get('project') ?? '';
  return {
    q: (params.get('q') ?? '').trim().slice(0, MAX_QUERY),
    lang: known.langs.includes(lang) ? lang : '',
    project: known.projects.includes(project) ? project : '',
  };
}

/** The query string for a view, empty for the full library */
export function writeState({ q, lang, project }: FilterState): string {
  const params = new URLSearchParams();
  if (q.trim()) params.set('q', q.trim());
  if (lang) params.set('lang', lang);
  if (project) params.set('project', project);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const terms = (q: string) => q.toLowerCase().split(/\s+/).filter(Boolean);

/**
 * The matching docs' indexes, best first. Filters combine, and every search term has to appear
 * somewhere; a term in the title counts for more. Ties keep the library's own order.
 */
export function rank(docs: readonly Doc[], { q, lang, project }: FilterState): number[] {
  const words = terms(q);
  const found: { i: number; score: number }[] = [];
  docs.forEach((doc, i) => {
    if ((lang && doc.lang !== lang) || (project && doc.project !== project)) return;
    let score = 0;
    for (const word of words) {
      if (doc.title.includes(word)) score += 3;
      else if (doc.text.includes(word)) score += 1;
      else return;
    }
    found.push({ i, score });
  });
  return found.sort((a, b) => b.score - a.score || a.i - b.i).map(({ i }) => i);
}

export function startSnippetBrowser(root: HTMLElement) {
  const $ = <T extends Element>(selector: string) => root.querySelector<T>(selector)!;
  const query = $<HTMLElement>('[data-query]');
  const input = $<HTMLInputElement>('[data-q]');
  const chips = [...root.querySelectorAll<HTMLButtonElement>('button[data-lang]')];
  const select = $<HTMLSelectElement>('[data-project]');
  const status = $<HTMLElement>('[data-status]');
  const empty = $<HTMLElement>('[data-empty]');
  const emptyQuery = $<HTMLElement>('[data-empty-q]');
  const list = $<HTMLElement>('[data-list]');
  const announcer = $<HTMLElement>('[data-announce]');
  const items = [...list.querySelectorAll<HTMLLIElement>('[data-item]')];
  const entries = items.map((item) => item.querySelector<HTMLDetailsElement>('details')!);
  const treeItems = new Map([...root.querySelectorAll<HTMLElement>('[data-tree-item]')].map((li) => [li.dataset.treeItem!, li]));
  const folders = [...root.querySelectorAll<HTMLElement>('[data-folder]')];
  const docs: Doc[] = entries.map((entry) => ({
    title: entry.querySelector('summary [data-title]')!.textContent!.toLowerCase(),
    text: entry.textContent!.toLowerCase(),
    lang: entry.dataset.lang!,
    project: entry.dataset.project!,
  }));
  const known = { langs: chips.map((chip) => chip.dataset.lang!).filter(Boolean), projects: [...select.options].map((o) => o.value).filter(Boolean) };
  let state = readState(location.search, known);

  const main = $<HTMLElement>('.lib__main');
  const tree = $<HTMLElement>('.tree');

  // Folded to their titles from here on, so the list can be scanned
  query.hidden = false;
  for (const entry of entries) entry.open = false;
  for (const pre of root.querySelectorAll<HTMLPreElement>('.entry pre')) addCopyButton(pre, announcer);

  // Where the list and tree scroll inside the window, they fade out at the bottom until there's nothing more below
  const markEnds = () => {
    for (const box of [main, tree]) box.toggleAttribute('data-end', box.scrollTop + box.clientHeight >= box.scrollHeight - 2);
  };
  for (const box of [main, tree]) box.addEventListener('scroll', markEnds, { passive: true });
  const resized = new ResizeObserver(markEnds);
  for (const el of [main, list, tree, tree.querySelector('ul')!]) resized.observe(el);

  /**
   * Brings a snippet to the top of the list. When the list scrolls inside the window, the page itself is put back
   * at the top, since the browser's own jump to the #link scrolls it too and would push the window's bar off screen.
   */
  function reveal(el: HTMLElement) {
    if (main.scrollHeight <= main.clientHeight) return el.scrollIntoView();
    main.scrollTop += el.getBoundingClientRect().top - main.getBoundingClientRect().top;
    scrollTo({ top: 0 });
  }

  function apply(next: FilterState, { write = true } = {}) {
    state = next;
    const shown = rank(docs, state);
    const visible = new Set(shown);
    // Moved, not just reordered visually, so the reading and tab order match what's on screen. Only when the
    // order changes, since moving an element drops the keyboard focus inside it.
    const order = [...shown, ...items.map((_, i) => i).filter((i) => !visible.has(i))];
    if (order.some((i, at) => list.children[at] !== items[i])) for (const i of order) list.append(items[i]!);
    items.forEach((item, i) => {
      item.hidden = !visible.has(i);
      treeItems.get(entries[i]!.id)!.hidden = item.hidden;
    });
    for (const folder of folders) folder.hidden = !folder.querySelector('[data-tree-item]:not([hidden])');
    chips.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.lang === state.lang)));
    select.value = state.project;
    status.textContent = `${shown.length} of ${items.length} snippets`;
    empty.hidden = shown.length > 0;
    emptyQuery.textContent = state.q || 'these filters';
    if (write) history.replaceState(null, '', location.pathname + writeState(state) + location.hash);
  }

  let timer = 0;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => apply({ ...state, q: input.value.slice(0, MAX_QUERY) }), 300);
  });
  for (const chip of chips) chip.addEventListener('click', () => apply({ ...state, lang: chip.dataset.lang! }));
  select.addEventListener('change', () => apply({ ...state, project: select.value }));
  $<HTMLButtonElement>('[data-clear]').addEventListener('click', () => {
    input.value = '';
    apply(EMPTY);
    input.focus();
  });

  /** Marks the open snippet's file in the tree, opening its folders and keeping it in view there */
  function markCurrent(id: string) {
    for (const [key, li] of treeItems) {
      const link = li.querySelector('a')!;
      if (key !== id) {
        link.removeAttribute('aria-current');
        continue;
      }
      link.setAttribute('aria-current', 'true');
      for (let dir = link.closest('details'); dir; dir = dir.parentElement!.closest('details')) dir.open = true;
      const box = tree.getBoundingClientRect();
      const at = link.getBoundingClientRect();
      if (at.top < box.top || at.bottom > box.bottom) tree.scrollTop += at.top - box.top - box.height / 3;
    }
  }
  for (const entry of entries) entry.addEventListener('toggle', () => entry.open && markCurrent(entry.id));
  // Choosing the file that's already in the address doesn't change it, so open it here
  tree.addEventListener('click', (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (link?.hash !== location.hash) return;
    event.preventDefault();
    openFromHash();
  });

  /** /code/#wikiracer-bfs opens that snippet, clearing the filters if they hide it */
  function openFromHash() {
    const i = entries.findIndex((entry) => entry.id === decodeURIComponent(location.hash.slice(1)));
    if (i < 0) return;
    if (items[i]!.hidden) {
      input.value = '';
      apply(EMPTY);
    }
    entries[i]!.open = true;
    reveal(entries[i]!);
    markCurrent(entries[i]!.id);
  }

  input.value = state.q;
  apply(state, { write: false });
  openFromHash();
  addEventListener('hashchange', openFromHash);
}

/** A copy button on a code block, announcing "Copied" to screen readers as well as on the button */
function addCopyButton(pre: HTMLPreElement, announcer: HTMLElement) {
  const wrap = document.createElement('div');
  wrap.className = 'code';
  pre.before(wrap);
  wrap.append(pre);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'code__copy';
  button.textContent = 'Copy';
  button.setAttribute('aria-label', 'Copy the code');
  wrap.append(button);
  let reset = 0;
  button.addEventListener('click', async () => {
    let message = 'Copied';
    try {
      await navigator.clipboard.writeText(pre.querySelector('code')!.textContent!.replace(/\n$/, ''));
    } catch {
      message = "Couldn't copy";
    }
    button.textContent = message;
    announcer.textContent = message;
    clearTimeout(reset);
    reset = window.setTimeout(() => {
      button.textContent = 'Copy';
      announcer.textContent = '';
    }, 2000);
  });
}
