import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';

// Endpoint TEMPORAL: renombra el local del pan a "Zapore". Protegido por OPS_SECRET. Se elimina tras usarlo.
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
    await sql.query(
      `UPDATE marketing_pilot.bars
       SET name = 'Zapore', slug = 'zapore'
       WHERE campaign_id = (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailybread')`
    );
    const rows = await sql.query(
      `SELECT b.id, b.name, b.city FROM marketing_pilot.bars b
       JOIN marketing_pilot.campaigns c ON c.id = b.campaign_id
       WHERE c.slug = 'dailybread' ORDER BY b.id`
    );
    return NextResponse.json({ ok: true, locations: rows });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
