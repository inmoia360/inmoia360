import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyRequestSession } from '@/lib/auth';

export const runtime = 'nodejs';

// Datos del admin del CAFE (esquema marketing_pilot, campaña dailycoffee).
// Auth por cookie de sesion (igual que el panel del pan) + middleware /api/admin/*.
export async function GET(req: NextRequest) {
  if (!(await verifyRequestSession(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sql = getDb();

  const [coupons, locations, statsRows] = await Promise.all([
    sql`
      SELECT c.id, c.lead_name, c.lead_phone, c.coupon_code, c.status, c.created_at,
             b.name AS location_name
      FROM marketing_pilot.coffee_coupons c
      LEFT JOIN marketing_pilot.bars b ON b.id = c.bar_id
      WHERE c.campaign_id = (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailycoffee')
      ORDER BY c.created_at DESC
      LIMIT 300
    `,
    sql`
      SELECT id, name, slug, city, coupon_limit, is_active,
             (SELECT COUNT(*)::int FROM marketing_pilot.coffee_coupons
              WHERE bar_id = bars.id
              AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())) AS used_this_month
      FROM marketing_pilot.bars
      WHERE campaign_id = (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailycoffee')
      ORDER BY id
    `,
    sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW()))::int AS this_month,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS this_week,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day')::int AS today
      FROM marketing_pilot.coffee_coupons
      WHERE campaign_id = (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailycoffee')
    `,
  ]);

  return NextResponse.json({ coupons, locations, stats: statsRows[0] });
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyRequestSession(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });
  const sql = getDb();
  await sql`DELETE FROM marketing_pilot.coffee_coupon_events WHERE coupon_id = ${id}`;
  const [row] = await sql`
    DELETE FROM marketing_pilot.coffee_coupons
    WHERE id = ${id} AND campaign_id = (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailycoffee')
    RETURNING id
  `;
  return NextResponse.json({ ok: true, deleted: row?.id ?? null });
}
