import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';

// Endpoint TEMPORAL: crea el esquema separado "pan" (tablas propias, sin mezclar
// con el cafe) y siembra el local Zapore. Protegido por OPS_SECRET. Se elimina tras usar.
const STATEMENTS: string[] = [
  `CREATE SCHEMA IF NOT EXISTS pan`,
  `CREATE TABLE IF NOT EXISTS pan.locations (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    staff_whatsapp TEXT,
    coupon_limit INTEGER NOT NULL DEFAULT 50,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS pan.coupons (
    id SERIAL PRIMARY KEY,
    coupon_code TEXT UNIQUE NOT NULL,
    lead_name TEXT NOT NULL,
    lead_email TEXT,
    lead_phone TEXT NOT NULL,
    source_url TEXT,
    location_id INTEGER REFERENCES pan.locations(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'generated',
    claimed_at TIMESTAMPTZ,
    redeemed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS pan.coupon_events (
    id SERIAL PRIMARY KEY,
    coupon_id INTEGER REFERENCES pan.coupons(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_pan_coupons_phone ON pan.coupons(lead_phone)`,
  `INSERT INTO pan.locations (slug, name, city, coupon_limit)
   VALUES ('zapore', 'Zapore', 'Getxo', 50)
   ON CONFLICT (slug) DO NOTHING`,
  // Limpieza: quitar los datos viejos del pan que estaban en las tablas del cafe
  `DELETE FROM marketing_pilot.coffee_coupon_events WHERE campaign_id = (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailybread')`,
  `DELETE FROM marketing_pilot.coffee_coupons WHERE campaign_id = (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailybread')`,
  `DELETE FROM marketing_pilot.bars WHERE campaign_id = (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailybread')`,
  `DELETE FROM marketing_pilot.campaigns WHERE slug = 'dailybread'`,
];

export async function GET(req: Request) {
  const secret = (new URL(req.url).searchParams.get('secret') ?? '').trim();
  const expected = (process.env.OPS_SECRET ?? '').trim();
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'DATABASE_URL no disponible' }, { status: 500 });
  }
  const sql = neon(process.env.DATABASE_URL);
  try {
    for (const stmt of STATEMENTS) await sql.query(stmt);
    const locs = await sql.query('SELECT id, name, city FROM pan.locations ORDER BY id');
    return NextResponse.json({ ok: true, locations: locs });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
