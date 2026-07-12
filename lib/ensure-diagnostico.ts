import { getDb } from './db';

// Asegura el esquema y la tabla de leads del diagnóstico "¿Está tu piso
// listo para vender?" (captación de propietarios, división Homes).
// BASE PROPIA Y SEPARADA: esquema `captacion`. Sin relación con café
// (marketing_pilot), pan (pan) ni hipotecas (hipotecas). No mezclar.
// Idempotente y cacheado por instancia, mismo patrón que ensure-mortgage.
let ensured = false;

export async function ensureDiagnosticoLeads() {
  if (ensured) return;
  const sql = getDb();
  await sql`CREATE SCHEMA IF NOT EXISTS captacion`;
  await sql`
    CREATE TABLE IF NOT EXISTS captacion.diagnostico_leads (
      id                 SERIAL PRIMARY KEY,
      lead_name          TEXT NOT NULL,
      lead_contact       TEXT NOT NULL,          -- teléfono o email (campo único del form)
      answers            JSONB,                  -- respuestas de las 7 preguntas
      score              INTEGER,                -- puntuación 0-100
      urgency            TEXT,                   -- CALIENTE / TEMPLADO / FRIO
      source_url         TEXT,
      consent_privacy    BOOLEAN NOT NULL DEFAULT false,
      forwarded_to_os    BOOLEAN NOT NULL DEFAULT false, -- ¿llegó al DELAgala OS?
      status             TEXT NOT NULL DEFAULT 'new'
                           CHECK (status IN ('new','contacted','qualified','won','lost')),
      created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_diag_leads_urgency ON captacion.diagnostico_leads(urgency)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_diag_leads_created ON captacion.diagnostico_leads(created_at DESC)`;
  ensured = true;
}
