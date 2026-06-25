import { getDb } from './db';

// Asegura las columnas de marketing en las tablas de cupones (pan y café):
//  - consent_marketing: el lead aceptó recibir info inmobiliaria (🟢) o solo promo (🟡)
//  - unsubscribed: el lead se dio de BAJA (no recibe más envíos)
// Se ejecuta al vuelo: en producción Vercel ya tiene DATABASE_URL, así que las
// columnas se crean solas la primera vez y no hace falta correr migraciones a mano.
// Idempotente y cacheado por instancia. Mismo patrón que ensureInbox().
let ensured = false;

export async function ensureConsentColumns() {
  if (ensured) return;
  const sql = getDb();
  await sql`ALTER TABLE pan.coupons ADD COLUMN IF NOT EXISTS consent_marketing BOOLEAN NOT NULL DEFAULT false`;
  await sql`ALTER TABLE marketing_pilot.coffee_coupons ADD COLUMN IF NOT EXISTS consent_marketing BOOLEAN NOT NULL DEFAULT false`;
  await sql`ALTER TABLE pan.coupons ADD COLUMN IF NOT EXISTS unsubscribed BOOLEAN NOT NULL DEFAULT false`;
  await sql`ALTER TABLE marketing_pilot.coffee_coupons ADD COLUMN IF NOT EXISTS unsubscribed BOOLEAN NOT NULL DEFAULT false`;
  ensured = true;
}

// Da de baja (o de alta de nuevo) TODOS los registros de un teléfono, en pan y café.
// Una baja es de la persona, no de una sola campaña → afecta a las dos bases.
// Casa por los últimos 9 dígitos para tolerar variantes con/sin prefijo +34.
// Devuelve cuántas filas se actualizaron.
export async function setUnsubscribed(phone: string, value: boolean): Promise<number> {
  await ensureConsentColumns();
  const sql = getDb();
  const last9 = phone.replace(/[^0-9]/g, '').slice(-9);
  if (last9.length < 9) return 0;
  const like = `%${last9}`;
  const r1 = await sql`
    UPDATE pan.coupons SET unsubscribed = ${value}
    WHERE regexp_replace(lead_phone, '[^0-9]', '', 'g') LIKE ${like} RETURNING id`;
  const r2 = await sql`
    UPDATE marketing_pilot.coffee_coupons SET unsubscribed = ${value}
    WHERE regexp_replace(lead_phone, '[^0-9]', '', 'g') LIKE ${like} RETURNING id`;
  return r1.length + r2.length;
}
