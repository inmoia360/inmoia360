// Config del periódico ACTIVO por carril. Vive en la BD (no en fichero, porque el
// filesystem de producción es de solo lectura en runtime). Tabla creada al vuelo,
// patrón "ensure en runtime" como lib/ensure-consent.ts.

import { getDb } from './db';
import { DEFAULT_ACTIVE, dailyBySlug, type Lane } from './dailies';

let ensured = false;

export async function ensureDailyActiveTable(): Promise<void> {
  if (ensured) return;
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS marketing_pilot.daily_active (
      lane TEXT PRIMARY KEY,
      slug TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  ensured = true;
}

// Devuelve el slug activo de un carril, con fallback al defecto si no hay fila
// o si el slug guardado ya no existe en el catálogo (RF-6).
export async function getActiveSlug(lane: Lane): Promise<string> {
  await ensureDailyActiveTable();
  const sql = getDb();
  const rows = await sql`SELECT slug FROM marketing_pilot.daily_active WHERE lane = ${lane} LIMIT 1`;
  const slug = rows[0]?.slug as string | undefined;
  if (slug && dailyBySlug(slug)) return slug;
  return DEFAULT_ACTIVE[lane];
}

// Devuelve el activo de todos los carriles.
export async function getAllActive(): Promise<Record<Lane, string>> {
  await ensureDailyActiveTable();
  const sql = getDb();
  const rows = await sql`SELECT lane, slug FROM marketing_pilot.daily_active`;
  const map: Record<string, string> = {};
  for (const r of rows) map[r.lane as string] = r.slug as string;
  return {
    cafe_pan: (map['cafe_pan'] && dailyBySlug(map['cafe_pan'])) ? map['cafe_pan'] : DEFAULT_ACTIVE.cafe_pan,
    herbolisteria: (map['herbolisteria'] && dailyBySlug(map['herbolisteria'])) ? map['herbolisteria'] : DEFAULT_ACTIVE.herbolisteria,
  };
}

// Fija el activo de un carril. Valida que el slug exista en el catálogo.
export async function setActiveSlug(lane: Lane, slug: string): Promise<void> {
  if (!dailyBySlug(slug)) throw new Error(`Periódico desconocido: ${slug}`);
  await ensureDailyActiveTable();
  const sql = getDb();
  await sql`
    INSERT INTO marketing_pilot.daily_active (lane, slug, updated_at)
    VALUES (${lane}, ${slug}, NOW())
    ON CONFLICT (lane) DO UPDATE SET slug = EXCLUDED.slug, updated_at = NOW()
  `;
}
