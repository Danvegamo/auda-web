// Capa de contenido headless basada en astro:content.
// Fuente real: src/content/{site,tiers,verticals,team}/*.json
// El esquema vive en src/content/config.ts. Edita los .json para cambiar texto.

import { getCollection, getEntry } from 'astro:content';

export type Accent = 'orange' | 'green' | 'blue' | 'ink';
export type TierVariant = 'tier0' | 'tier1' | 'tier2' | 'tier3' | 'tier4';

export interface Tier {
  n: string;
  variant: TierVariant;
  title: string;
  subtitle: string;
  bullets: string[];
  outcome: string;
  accent: Accent;
}

export interface Vertical {
  tag: string;
  title: string;
  pain: string;
}

export interface TeamMember {
  name: string;
  role: string;
  focus: string;
}

export interface SiteContent {
  tagline: string;
  intro: string;
  manifesto: { lines: string[] };
  about: { heading: string; body: string[] };
  tiers: Tier[];
  verticals: Vertical[];
  team: TeamMember[];
  contact: { email: string; whatsapp: string; calendarUrl: string };
}

function byOrder<T extends { data: { order: number } }>(a: T, b: T): number {
  return a.data.order - b.data.order;
}

export async function getContent(): Promise<SiteContent> {
  const siteEntry = await getEntry('site', 'index');
  if (!siteEntry) throw new Error('Falta src/content/site/index.json');

  const tiersRaw = (await getCollection('tiers')).sort(byOrder);
  const verticalsRaw = (await getCollection('verticals')).sort(byOrder);
  const teamRaw = (await getCollection('team')).sort(byOrder);

  return {
    tagline: siteEntry.data.tagline,
    intro: siteEntry.data.intro,
    manifesto: siteEntry.data.manifesto,
    about: siteEntry.data.about,
    contact: siteEntry.data.contact,
    tiers: tiersRaw.map((t) => ({
      n: t.data.n,
      variant: t.data.variant,
      title: t.data.title,
      subtitle: t.data.subtitle,
      bullets: t.data.bullets,
      outcome: t.data.outcome,
      accent: t.data.accent,
    })),
    verticals: verticalsRaw.map((v) => ({
      tag: v.data.tag,
      title: v.data.title,
      pain: v.data.pain,
    })),
    team: teamRaw.map((m) => ({
      name: m.data.name,
      role: m.data.role,
      focus: m.data.focus,
    })),
  };
}
