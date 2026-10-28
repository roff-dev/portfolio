import fs from 'node:fs';
import path from 'node:path';
import { getCollection } from 'astro:content';

/** Projects shown on this site, in window order */
export async function portfolioProjects() {
  const all = await getCollection('projects', ({ data }) => data.sites.portfolio);
  return all.sort((a, b) => a.data.order - b.data.order);
}

/** "4.9 MB" for a file in public/, so a download link says how big it is */
export function fileSize(publicPath: string) {
  const bytes = fs.statSync(path.join(process.cwd(), 'public', publicPath)).size;
  return bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.round(bytes / 1e3)} KB`;
}
