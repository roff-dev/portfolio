import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { getCollection } from 'astro:content';

// The shared project data for my other sites, read at their build time. Every project is
// listed, with `sites` saying where each one appears; image URLs are absolute.
export const GET: APIRoute = async ({ site }) => {
  const projects = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
  const body = await Promise.all(
    projects.map(async ({ id, data }) => {
      const image = await getImage({ src: data.image.src, width: 1200, format: 'webp' });
      return {
        id,
        ...data,
        links: Object.fromEntries(Object.entries(data.links).map(([k, v]) => [k, new URL(v, site).href])),
        image: { src: new URL(image.src, site).href, width: image.attributes.width, height: image.attributes.height, alt: data.image.alt },
      };
    }),
  );
  return new Response(JSON.stringify({ version: 1, projects: body }, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
