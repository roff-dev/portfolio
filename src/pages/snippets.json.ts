import type { APIRoute } from 'astro';
import { allSnippets, parseBody } from '../lib/snippets';

// The code library as data for my other sites, with the code as plain text
export const GET: APIRoute = async ({ site }) => {
  const snippets = (await allSnippets()).map(({ entry, projectKey, projectName }) => ({
    id: entry.id,
    title: entry.data.title,
    project: entry.data.project?.id ?? null,
    projectKey,
    projectName,
    language: entry.data.language,
    skill: entry.data.skill,
    file: entry.data.file ?? null,
    url: new URL(`/code/#${entry.id}`, site).href,
    ...parseBody(entry.body ?? ''),
  }));
  return new Response(JSON.stringify({ version: 1, snippets }, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
