import { defineCollection, reference } from 'astro:content';
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

// The about page's journey: one Markdown file per stop, each a step of the installer. The body, if
// there is one, is shown as a file under the step's lines.
const journey = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/journey' }),
  schema: z.object({
    order: z.number().int(),
    /** Its name in the installer's step list */
    step: z.string().max(14),
    /** The step's heading */
    heading: z.string(),
    /** A line under the heading, as an installer explains each step */
    intro: z.string().optional(),
    /** The commit's short hash; kept in the content, but only the message is shown */
    commit: z.string(),
    message: z.string(),
    lines: z
      .array(
        z.strictObject({
          label: z.string(),
          text: z.string(),
          /**
           * Follows the text, e.g. "See my" + "projects". An href of social:linkedin or social:github is my profile
           * from site.ts, shown with its mark and address
           */
          link: z
            .strictObject({ text: z.string(), href: z.string().regex(/^(\/|https:\/\/|social:(linkedin|github)$)/) })
            .optional(),
        }),
      )
      .min(1),
    /** A project from this step, shown with its summary and links */
    project: reference('projects').optional(),
    /** The file name shown in the prompt above the body */
    file: z.string().default('notes.txt'),
  }),
});

// The code library: one Markdown file per snippet. The body is the code fence, then three
// paragraphs: the problem, why this approach, what to notice.
const snippets = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/snippets' }),
  schema: z
    .object({
      title: z.string(),
      /** The project it comes from, if that project is in the projects collection */
      project: reference('projects').optional(),
      /** Otherwise the older work it comes from, by name */
      from: z.string().optional(),
      language: z.enum(['ts', 'js', 'glsl', 'scss']),
      skill: z.string(),
      /** Where it lives in the project's repo */
      file: z.string().optional(),
      /** Position within its project; lower comes first */
      order: z.number().int(),
    })
    .refine((data) => Boolean(data.project) !== Boolean(data.from), { message: 'Give exactly one of project or from' }),
});

export const collections = { projects, journey, snippets };
