// Catálogo de la biblioteca de Dailys (periódicos publicados que se pueden activar).
// Cada periódico se sirve desde public/dailies/<slug>.pdf. Para añadir uno nuevo:
// publica su PDF en public/dailies/ y añade aquí su entrada.

export type DailyEntry = {
  slug: string;      // nombre del PDF en public/dailies/ (sin extensión)
  titulo: string;    // nombre legible en el panel
  fecha: string;     // mes/año de referencia
};

export const DAILIES: DailyEntry[] = [
  { slug: 'euribor',         titulo: 'Especial Hipotecas · Euríbor', fecha: 'Octubre 2026' },
  { slug: 'hogar-saludable', titulo: 'Especial Hogar Saludable',     fecha: 'Noviembre 2026' },
  { slug: 'pgou',            titulo: 'Especial PGOU de Getxo',        fecha: 'Septiembre 2026' },
  { slug: 'herencias',       titulo: 'Especial Herencias',           fecha: 'Septiembre 2026' },
];

// Carriles de entrega. Cada carril corresponde a la URL fija de una o varias campañas.
export type Lane = 'cafe_pan' | 'herbolisteria';

export const LANES: { id: Lane; titulo: string; url: string; campañas: string }[] = [
  { id: 'cafe_pan',      titulo: 'Café y Pan',   url: '/delagala-daily.pdf',           campañas: 'Daily Coffee + Daily Bread' },
  { id: 'herbolisteria', titulo: 'Herbolistería', url: '/delagala-daily-bienestar.pdf', campañas: 'Herbolario Las Arenas' },
];

// Periódico por defecto de cada carril (fallback si no hay activo válido — RF-6).
export const DEFAULT_ACTIVE: Record<Lane, string> = {
  cafe_pan: 'euribor',
  herbolisteria: 'hogar-saludable',
};

export function dailyBySlug(slug: string): DailyEntry | undefined {
  return DAILIES.find(d => d.slug === slug);
}

export function isLane(x: string): x is Lane {
  return x === 'cafe_pan' || x === 'herbolisteria';
}
