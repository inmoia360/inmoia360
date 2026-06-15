import { getDb } from './db';

// Asegura el esquema/tabla de la bandeja de entrada de WhatsApp (mensajes de leads).
export async function ensureInbox() {
  const sql = getDb();
  await sql`CREATE SCHEMA IF NOT EXISTS wa`;
  await sql`
    CREATE TABLE IF NOT EXISTS wa.messages (
      id          SERIAL PRIMARY KEY,
      wam_id      TEXT UNIQUE,
      wa_from     TEXT,
      wa_name     TEXT,
      direction   TEXT NOT NULL DEFAULT 'in',
      msg_type    TEXT,
      body        TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_wa_from ON wa.messages(wa_from)`;
}
