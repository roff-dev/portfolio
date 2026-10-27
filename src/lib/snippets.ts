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

/** The code and the three explanation paragraphs, as plain text */
export function parseBody(body: string) {
  const code = body.match(/```\w*\n([\s\S]*?)\n```/)?.[1] ?? '';
  const part = (label: string) => body.match(new RegExp(`\\*\\*${label}:\\*\\* ([^\\n]+)`))?.[1]?.trim() ?? '';
  return { code, problem: part('The problem'), why: part('Why this approach'), notice: part('What to notice') };
}
