import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const accent = z.enum(['orange', 'green', 'blue', 'ink']);
const tierVariant = z.enum(['tier0', 'tier1', 'tier2', 'tier3', 'tier4']);

const site = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/site' }),
  schema: z.object({
    tagline: z.string(),
    intro: z.string(),
    manifesto: z.object({ lines: z.array(z.string()) }),
    about: z.object({ heading: z.string(), body: z.array(z.string()) }),
    contact: z.object({
      email: z.string().email(),
      whatsapp: z.string(),
      calendarUrl: z.string().url(),
    }),
  }),
});

const tiers = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/tiers' }),
  schema: z.object({
    order: z.number(),
    n: z.string(),
    variant: tierVariant,
    title: z.string(),
    subtitle: z.string(),
    bullets: z.array(z.string()),
    outcome: z.string(),
    accent: accent,
  }),
});

const verticals = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/verticals' }),
  schema: z.object({
    order: z.number(),
    tag: z.string(),
    title: z.string(),
    pain: z.string(),
  }),
});

const team = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/team' }),
  schema: z.object({
    order: z.number(),
    name: z.string(),
    role: z.string(),
    focus: z.string(),
  }),
});

export const collections = { site, tiers, verticals, team };
