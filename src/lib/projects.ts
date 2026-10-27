import { getCollection } from 'astro:content';

/** Projects shown on this site, in window order */
export async function portfolioProjects() {
  const all = await getCollection('projects', ({ data }) => data.sites.portfolio);
  return all.sort((a, b) => a.data.order - b.data.order);
}
