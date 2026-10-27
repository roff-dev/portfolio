import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One JSON file per project. This is the shared project data: the site renders it and
// publishes it as /projects.json for my other sites to read at their own build time.
const projects = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      /** Position in the projects window; lower comes first */
      order: z.number().int(),
      status: z.enum(['live', 'in-progress', 'coming-soon']),
      /** One line, for cards and lists */
      summary: z.string().max(140),
      /** One paragraph, first person */
      description: z.string(),
      year: z.number().int().min(2020),
      links: z.strictObject({
        live: z.url().optional(),
        repo: z.url().optional(),
        pdf: z.string().startsWith('/').optional(),
        writeup: z.url().optional(),
      }),
      image: z.strictObject({ src: image(), alt: z.string().min(10) }),
      stack: z.array(z.string()).min(1),
      tags: z.array(z.string()).default([]),
      /** A hint of the project's own colour, for sites that want one */
      accent: z.string().regex(/^#[0-9a-f]{6}$/).optional(),
      sites: z.strictObject({ portfolio: z.boolean(), hub: z.boolean().optional() }),
    }),
});

// The about page's journey: one Markdown file per stop. The body, if there is one, is shown
// as a file in a terminal under the stop's big type.
const journey = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/journey' }),
  schema: z.object({
    order: z.number().int(),
    /** The stop's heading for screen readers; the big type carries it visually */
    heading: z.string(),
    /** Its name in the jump map */
    short: z.string().max(8),
    commit: z.string(),
    message: z.string(),
    lines: z
      .array(
        z.strictObject({
          label: z.string(),
          text: z.string(),
          /** Follows the text, e.g. "See my" + "projects" */
          link: z.strictObject({ text: z.string(), href: z.string() }).optional(),
          /** Turns the line into the game picker; text is the game shown without JavaScript */
          games: z.array(z.string()).min(2).optional(),
        }),
      )
      .min(1),
    /** The file name shown in the prompt above the body */
    file: z.string().default('notes.txt'),
  }),
});

export const collections = { projects, journey };
