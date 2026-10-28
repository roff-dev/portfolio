import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export interface Snippet {
  entry: CollectionEntry<'snippets'>;
  /** The filter value: the project's id, or a slug of the older work's name */
  projectKey: string;
  projectName: string;
  /** In the projects window, if it's there */
  projectHref?: string;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Every snippet, newest project first, then in each project's own order; older work comes last */
export async function allSnippets(): Promise<Snippet[]> {
  const snippets = await Promise.all(
    (await getCollection('snippets')).map(async (entry) => {
      const project = entry.data.project && (await getEntry(entry.data.project));
      if (entry.data.project && !project) throw new Error(`${entry.id}: no project "${entry.data.project.id}"`);
      return {
        entry,
        project,
        projectKey: project ? project.id : slug(entry.data.from!),
        projectName: project ? project.data.name : entry.data.from!,
        projectHref: project?.data.sites.portfolio ? `/#${project.id}` : undefined,
      };
    }),
  );
  const rank = (s: (typeof snippets)[number]) => (s.project ? [-s.project.data.year, s.project.data.order] : [Infinity, 0]);
  return snippets
    .sort((a, b) => {
      const [ya, oa] = rank(a);
      const [yb, ob] = rank(b);
      return ya! - yb! || oa! - ob! || a.projectKey.localeCompare(b.projectKey) || a.entry.data.order - b.entry.data.order;
    })
    .map(({ project, ...rest }) => rest);
}

export interface TreeFile {
  kind: 'file';
  name: string;
  /** The snippet's id */
  id: string;
  title: string;
  lang: string;
}

export interface TreeDir {
  kind: 'dir';
  /** A folder with only one folder inside shows as both, e.g. src/sky */
  name: string;
  children: (TreeDir | TreeFile)[];
}

/**
 * Each project as a folder of its snippets' files, at their paths in its repo; a snippet without a path is
 * named after its id. Folders come before files, both alphabetical, as in a file explorer.
 */
export function fileTree(snippets: readonly Snippet[]): TreeDir[] {
  const roots = new Map<string, TreeDir>();
  for (const { entry, projectKey } of snippets) {
    if (!roots.has(projectKey)) roots.set(projectKey, { kind: 'dir', name: projectKey, children: [] });
    const path = (entry.data.file ?? `${entry.id.replace(`${projectKey}-`, '')}.${entry.data.language}`).split('/');
    let dir = roots.get(projectKey)!;
    for (const part of path.slice(0, -1)) {
      let next = dir.children.find((node): node is TreeDir => node.kind === 'dir' && node.name === part);
      if (!next) dir.children.push((next = { kind: 'dir', name: part, children: [] }));
      dir = next;
    }
    dir.children.push({ kind: 'file', name: path.at(-1)!, id: entry.id, title: entry.data.title, lang: entry.data.language });
  }
  const tidy = (dir: TreeDir): TreeDir => {
    dir.children = dir.children.map((node) => (node.kind === 'dir' ? compact(tidy(node)) : node));
    dir.children.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'dir' ? -1 : 1));
    return dir;
  };
  const compact = (dir: TreeDir): TreeDir => {
    const [only] = dir.children;
    return dir.children.length === 1 && only!.kind === 'dir' ? { ...only!, name: `${dir.name}/${only!.name}` } : dir;
  };
  return [...roots.values()].map(tidy);
}

/** The code and the three explanation paragraphs, as plain text */
export function parseBody(body: string) {
  const code = body.match(/```\w*\n([\s\S]*?)\n```/)?.[1] ?? '';
  const part = (label: string) => body.match(new RegExp(`\\*\\*${label}:\\*\\* ([^\\n]+)`))?.[1]?.trim() ?? '';
  return { code, problem: part('The problem'), why: part('Why this approach'), notice: part('What to notice') };
}
