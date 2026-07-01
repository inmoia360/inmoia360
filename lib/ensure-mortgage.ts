import { getDb } from './db';

// Asegura el esquema y la tabla de leads de intermediación hipotecaria
// (landings /hipotecas y /delagala/hipotecas). BASE PROPIA Y SEPARADA:
// esquema `hipotecas`, sin ninguna relación con café (marketing_pilot) ni
// pan (pan). No mezclar. Se ejecuta al vuelo: en producción Vercel ya tiene
// DATABASE_URL, así que se crea sola la primera vez y no hace falta correr
// la migración 006 a mano. Idempotente y cacheado por instancia.
let ensured = false;

export async function ensureMortgageLeads() {
  if (ensured) return;
  const sql = getDb();
  await sql`CREATE SCHEMA IF NOT EXISTS hipotecas`;
  await sql`
    CREATE TABLE IF NOT EXISTS hipotecas.leads (
      id                 SERIAL PRIMARY KEY,
      brand              TEXT NOT NULL DEFAULT 'delagala',
      service            TEXT,
      lead_name          TEXT NOT NULL,
      lead_phone         TEXT NOT NULL,
      lead_email         TEXT,
      message            TEXT,
      calc               JSONB,
      source_url         TEXT,
      consent_privacy    BOOLEAN NOT NULL DEFAULT false,
      consent_marketing  BOOLEAN NOT NULL DEFAULT false,
      status             TEXT NOT NULL DEFAULT 'new',
      created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_hipotecas_leads_brand ON hipotecas.leads(brand)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_hipotecas_leads_created ON hipotecas.leads(created_at DESC)`;
  ensured = true;
}
