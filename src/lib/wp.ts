// Capa de contenido headless.
// Si WP_API_URL está definido (cms.auda.lat), Astro consume WordPress + ACF en build.
// Mientras no esté provisionado, usa el contenido local (fuente: doc estratégico v1.0).

export interface SiteContent {
  tagline: string;
  intro: string;
  about: { heading: string; body: string[] };
  tiers: { n: string; title: string; body: string; accent: 'orange' | 'green' | 'blue' | 'ink' }[];
  verticals: { tag: string; title: string; pain: string }[];
  team: { name: string; role: string; focus: string }[];
  contact: { email: string; whatsapp: string };
}

const LOCAL: SiteContent = {
  tagline: 'Volvemos AI-first a las organizaciones con propósito.',
  intro:
    'AUDA es un estudio B2B que entra a universidades, fundaciones y empresas con propósito a través de auditorías estratégicas y las deja con sistemas de inteligencia artificial operando dentro de sus procesos.',
  about: {
    heading: 'No vendemos herramientas. Entramos, construimos y dejamos la IA operando.',
    body: [
      'El modelo correcto no es alquilar horas ni vender software: es entrar como ingeniero embebido durante un sprint corto, dejar la IA funcionando dentro del flujo de trabajo y sostenerla con mejora continua.',
      'Es el modelo forward-deployed —el que usan Palantir y Anthropic— adaptado a una agencia pequeña, vertical, en español, con presencia local en Bogotá y Medellín.',
    ],
  },
  tiers: [
    { n: '0', title: 'Identidad visual + sitio web', body: 'Logo, paleta, manual de marca y sitio institucional. La puerta de entrada low-friction.', accent: 'orange' },
    { n: '1', title: 'Hosting + mantenimiento + soporte', body: 'Hosting administrado, monitoreo, parches y soporte. Suscripción mensual.', accent: 'green' },
    { n: '2', title: 'Auditoría AI-first', body: 'Diagnóstico, mapeo de oportunidades, priorización por ROI y roadmap a 12 meses. Framework AUDA AI Readiness.', accent: 'blue' },
    { n: '3', title: 'Implementación de IA vertical', body: 'RAG sobre documentación, asistentes, automatización de reportes, integración con CRM/contabilidad. Modelo forward-deployed.', accent: 'orange' },
    { n: '4', title: 'AI Ops Retainer', body: 'Mejora continua del sistema instalado: ajustes, monitoreo de calidad, nuevos casos de uso. Sin esto, la IA se degrada en 6 meses.', accent: 'ink' },
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

export async function getContent(): Promise<SiteContent> {
  const base = import.meta.env.WP_API_URL;
  if (!base) return LOCAL;

  try {
    // Punto de integración futuro: ACF REST en cms.auda.lat.
    // const res = await fetch(`${base}/wp-json/acf/v3/options/options`);
    // const data = await res.json();
    // return mapAcfToContent(data);
    return LOCAL;
  } catch {
    return LOCAL;
  }
}
