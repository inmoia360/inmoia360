import { getDb } from './db';

// Base de datos APARTE de las bajas (personas que se dieron de baja del Delagala Daily).
// Vive en su propia tabla wa.unsubscribes, independiente de las bases de café y pan,
// para tener un registro permanente de bajas aunque un lead se borre de una campaña.
// Se registra AQUÍ toda baja: automática (el lead escribe BAJA por WhatsApp) o manual
// (el botón del panel). Mismo patrón "ensure en runtime" que ensureInbox().

export async function ensureBajasTable() {
  const sql = getDb();
  await sql`CREATE SCHEMA IF NOT EXISTS wa`;
  await sql`
    CREATE TABLE IF NOT EXISTS wa.unsubscribes (
      id          SERIAL PRIMARY KEY,
      phone_last9 TEXT UNIQUE NOT NULL,
      phone       TEXT,
      name        TEXT,
      source      TEXT,        -- 'cafe' | 'pan' | 'ambas' | 'webhook'
      reason      TEXT,        -- lo que escribió el lead, p. ej. 'BAJA'
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_unsub_last9 ON wa.unsubscribes(phone_last9)`;
}

// Registra (o actualiza) una baja en la base de datos aparte. Idempotente por teléfono.
export async function logBaja(
  phone: string,
  name: string | null,
  source: string,
  reason: string | null,
): Promise<void> {
  const last9 = (phone || '').replace(/[^0-9]/g, '').slice(-9);
  if (last9.length < 9) return;
  await ensureBajasTable();
  const sql = getDb();
  await sql`
    INSERT INTO wa.unsubscribes (phone_last9, phone, name, source, reason)
    VALUES (${last9}, ${phone}, ${name}, ${source}, ${reason})
    ON CONFLICT (phone_last9) DO UPDATE SET
      name       = COALESCE(EXCLUDED.name, wa.unsubscribes.name),
      source     = EXCLUDED.source,
      reason     = COALESCE(EXCLUDED.reason, wa.unsubscribes.reason),
      updated_at = NOW()`;
}

// Quita a alguien de la lista de bajas (cuando se da de ALTA de nuevo).
export async function removeBaja(phone: string): Promise<void> {
  const last9 = (phone || '').replace(/[^0-9]/g, '').slice(-9);
  if (last9.length < 9) return;
  await ensureBajasTable();
  const sql = getDb();
  await sql`DELETE FROM wa.unsubscribes WHERE phone_last9 = ${last9}`;
}
