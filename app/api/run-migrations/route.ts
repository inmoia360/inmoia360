import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';

// Endpoint TEMPORAL de migración. Corre dentro de Vercel, donde DATABASE_URL
// está disponible. Protegido por MIGRATE_SECRET. Se elimina tras usarlo.
const STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS marketing_pilot.campaigns (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    client_slug TEXT NOT NULL DEFAULT 'delagala',
    name TEXT NOT NULL,
    product_label TEXT NOT NULL,
    description TEXT,
    coupon_prefix TEXT NOT NULL DEFAULT 'DLG',
    expires_days INTEGER NOT NULL DEFAULT 30,
    location_label TEXT NOT NULL DEFAULT 'bar',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `INSERT INTO marketing_pilot.campaigns (slug, client_slug, name, product_label, description, coupon_prefix, expires_days, location_label)
   VALUES ('dailycoffee', 'delagala', 'Un café de la inmobiliaria', 'café', 'Café gratis + Delagala Daily', 'DLG', 30, 'bar')
   ON CONFLICT (slug) DO NOTHING`,
  `INSERT INTO marketing_pilot.campaigns (slug, client_slug, name, product_label, description, coupon_prefix, expires_days, location_label)
   VALUES ('dailybread', 'delagala', 'Pan y queso de la inmobiliaria', 'pan y queso', 'Pan o queso gratis + Delagala Daily', 'DLG', 30, 'tienda')
   ON CONFLICT (slug) DO NOTHING`,
  `ALTER TABLE marketing_pilot.bars ADD COLUMN IF NOT EXISTS campaign_id INTEGER REFERENCES marketing_pilot.campaigns(id) ON DELETE CASCADE`,
  `ALTER TABLE marketing_pilot.coffee_coupons ADD COLUMN IF NOT EXISTS campaign_id INTEGER REFERENCES marketing_pilot.campaigns(id) ON DELETE SET NULL`,
  `ALTER TABLE marketing_pilot.coffee_coupon_events ADD COLUMN IF NOT EXISTS campaign_id INTEGER REFERENCES marketing_pilot.campaigns(id) ON DELETE SET NULL`,
  `UPDATE marketing_pilot.bars SET campaign_id = (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailycoffee') WHERE campaign_id IS NULL`,
  `UPDATE marketing_pilot.coffee_coupons SET campaign_id = (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailycoffee') WHERE campaign_id IS NULL`,
  `UPDATE marketing_pilot.coffee_coupon_events SET campaign_id = (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailycoffee') WHERE campaign_id IS NULL`,
  `CREATE INDEX IF NOT EXISTS idx_bars_campaign ON marketing_pilot.bars(campaign_id)`,
  `CREATE INDEX IF NOT EXISTS idx_coupons_campaign ON marketing_pilot.coffee_coupons(campaign_id)`,
  `INSERT INTO marketing_pilot.bars (slug, name, address, city, campaign_id, coupon_limit)
   SELECT v.slug, v.name, v.address, v.city, (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailybread'), 50
   FROM (VALUES ('pan-antonio', 'Panadería Antonio', NULL, 'Getxo')) AS v(slug, name, address, city)
   ON CONFLICT (slug) DO NOTHING`,
];

export async function GET(req: Request) {
  const secret = (new URL(req.url).searchParams.get('secret') ?? '').trim();
  const expected = (process.env.MIGRATE_SECRET ?? '').trim();
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'forbidden', hasEnv: Boolean(expected), envLen: expected.length }, { status: 403 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'DATABASE_URL no disponible' }, { status: 500 });
  }
  const sql = neon(process.env.DATABASE_URL);
  try {
    for (const stmt of STATEMENTS) {
      await sql.query(stmt);
    }
    const campaigns = await sql.query('SELECT slug, name, product_label FROM marketing_pilot.campaigns ORDER BY id');
    const locs = await sql.query(
      "SELECT b.name, b.city FROM marketing_pilot.bars b JOIN marketing_pilot.campaigns c ON c.id = b.campaign_id WHERE c.slug = 'dailybread' ORDER BY b.id"
    );
    return NextResponse.json({ ok: true, campaigns, bread_locations: locs });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
