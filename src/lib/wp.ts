// Capa de contenido headless.
// Si WP_API_URL está definido (cms.auda.lat), Astro consume WordPress + ACF en build.
// Mientras no esté provisionado, usa el contenido local (fuente: doc estratégico v1.0).

export type Accent = 'orange' | 'green' | 'blue' | 'ink';
export type TierVariant = 'tier0' | 'tier1' | 'tier2' | 'tier3' | 'tier4';

export interface Tier {
  n: string;
  variant: TierVariant;
  title: string;
  subtitle: string;
  bullets: string[];
  outcome: string;
  ticket: string;
  cadence: string;
  accent: Accent;
}

export interface SiteContent {
  tagline: string;
  intro: string;
  manifesto: { lines: string[] };
  about: { heading: string; body: string[] };
  tiers: Tier[];
  verticals: { tag: string; title: string; pain: string }[];
  team: { name: string; role: string; focus: string }[];
  contact: { email: string; whatsapp: string };
}

const LOCAL: SiteContent = {
  tagline: 'Volvemos AI-first a las organizaciones con propósito.',
  intro:
    'AUDA es un estudio B2B que entra a universidades, fundaciones y empresas con propósito a través de auditorías estratégicas y las deja con sistemas de inteligencia artificial operando dentro de sus procesos.',
  manifesto: {
    lines: [
      'No vendemos horas.',
      'No vendemos herramientas.',
      'Entramos, construimos, dejamos la IA operando.',
      'Y volvemos cada mes a que siga viva.',
    ],
  },
  about: {
    heading: 'No vendemos herramientas. Entramos, construimos y dejamos la IA operando.',
    body: [
      'El modelo correcto no es alquilar horas ni vender software: es entrar como ingeniero embebido durante un sprint corto, dejar la IA funcionando dentro del flujo de trabajo y sostenerla con mejora continua.',
      'Es el modelo forward-deployed —el que usan Palantir y Anthropic— adaptado a una agencia pequeña, vertical, en español, con presencia local en Bogotá y Medellín.',
    ],
  },
  tiers: [
    {
      n: '0',
      variant: 'tier0',
      title: 'Identidad visual + sitio web',
      subtitle: 'La puerta de entrada low-friction.',
      bullets: [
        'Logo, paleta y manual de marca',
        'Sitio institucional en Astro',
        'Deploy en hosting AUDA',
      ],
      outcome: 'Tu organización aparece en internet con presencia coherente y editable.',
      ticket: '$1.5M – $8M COP',
      cadence: '3–6 semanas · pago único',
      accent: 'orange',
    },
    {
      n: '1',
      variant: 'tier1',
      title: 'Hosting + mantenimiento + soporte',
      subtitle: 'La relación que sostiene todo lo demás.',
      bullets: [
        'Hosting administrado + SSL + backups',
        'Monitoreo, parches y SLA 24h',
        'Cambios menores incluidos',
      ],
      outcome: 'El sitio sigue arriba, rápido y seguro sin que tú lo pienses.',
      ticket: '$250k – $800k COP/mes',
      cadence: 'contrato anual renovable',
      accent: 'green',
    },
    {
      n: '2',
      variant: 'tier2',
      title: 'Auditoría AI-first',
      subtitle: 'El framework AUDA AI Readiness aplicado a tu organización.',
      bullets: [
        'Diagnóstico de procesos críticos',
        'Mapeo de oportunidades + priorización por ROI',
        'Roadmap a 12 meses + plan de capacitación',
      ],
      outcome: 'Tres entregables en cuatro semanas que valen el ticket aún si paras ahí.',
      ticket: '$5M – $15M COP',
      cadence: '2–4 semanas · entregable cerrado',
      accent: 'blue',
    },
    {
      n: '3',
      variant: 'tier3',
      title: 'Implementación de IA vertical',
      subtitle: 'Construir y dejar operando, modelo forward-deployed.',
      bullets: [
        'RAG sobre documentación interna',
        'Asistentes y automatización de reportes',
        'Integraciones CRM, contabilidad, correo',
      ],
      outcome: 'IA viva dentro de tu flujo de trabajo, equipo entrenado para sostenerla.',
      ticket: '$25M – $80M COP',
      cadence: '6–12 semanas · proyecto',
      accent: 'orange',
    },
    {
      n: '4',
      variant: 'tier4',
      title: 'AI Ops Retainer',
      subtitle: 'Sin esto, la IA se degrada en 6 meses.',
      bullets: [
        'Monitoreo de calidad y ajustes mensuales',
        'Nuevos casos de uso trimestrales',
        'Actualización de modelos y prompts',
      ],
      outcome: 'La IA sigue mejorando en lugar de envejecer.',
      ticket: '$3M – $8M COP/mes',
      cadence: 'contrato mínimo 6 meses',
      accent: 'ink',
    },
  ],
  verticals: [
    { tag: 'Educación superior', title: 'Universidades privadas', pain: 'Procesos manuales, atención a postulantes, sistematización de investigación, reportes a entes.' },
    { tag: 'Punto dulce', title: 'Fundaciones medianas con cooperación', pain: 'Gestión de donantes manual, reportes de impacto, presencia digital frágil, procesos sin documentar.' },
    { tag: 'Propósito', title: 'Empresas B-corp', pain: 'Ven la IA como caja negra; no encuentran consultor que les hable en su idioma sin venderles humo.' },
  ],
  team: [
    { name: 'Dan — David Vega', role: 'Solution architect · forward-deployed builder', focus: 'Ejecución técnica, IA, dev, infraestructura, datos.' },
    { name: 'Aura', role: 'Strategy lead · project manager', focus: 'Gestión empresarial, diseño, estrategia, relación con el cliente.' },
  ],
  contact: { email: 'hola@auda.lat', whatsapp: '+57 311 7047088' },
};

// Stub para integración futura ACF flexible-content blocks.
// function mapAcfToContent(_data: unknown): SiteContent { return LOCAL; }

export async function getContent(): Promise<SiteContent> {
  const base = import.meta.env.WP_API_URL;
  if (!base) return LOCAL;

  try {
    // Timeout 5s — Cloudflare Pages build minutes son facturables.
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 5000);
    // const res = await fetch(`${base}/wp-json/acf/v3/options/options`, { signal: ctl.signal, cache: 'no-store' });
    // const data = await res.json();
    // clearTimeout(t);
    // return mapAcfToContent(data);
    clearTimeout(t);
    return LOCAL;
  } catch {
    return LOCAL;
  }
}
