import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyRequestSession } from '@/lib/auth';

export const runtime = 'nodejs';

// Datos del admin del PAN (esquema separado "pan"). Protegido por el middleware
// (/api/admin/*) + verificacion de sesion aqui.
export async function GET(req: NextRequest) {
  if (!(await verifyRequestSession(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sql = getDb();

  const [coupons, locations, statsRows] = await Promise.all([
    sql`
      SELECT c.id, c.lead_name, c.lead_phone, c.coupon_code, c.status, c.created_at,
             l.name AS location_name
      FROM pan.coupons c
      LEFT JOIN pan.locations l ON l.id = c.location_id
      ORDER BY c.created_at DESC
      LIMIT 300
    `,
    sql`
      SELECT id, name, slug, city, coupon_limit, is_active,
             (SELECT COUNT(*)::int FROM pan.coupons
              WHERE location_id = locations.id
              AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())) AS used_this_month
      FROM pan.locations ORDER BY id
    `,
    sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW()))::int AS this_month,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS this_week,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day')::int AS today
      FROM pan.coupons
    `,
  ]);

  return NextResponse.json({ coupons, locations, stats: statsRows[0] });
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyRequestSession(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });
  const sql = getDb();
  await sql`DELETE FROM pan.coupon_events WHERE coupon_id = ${id}`;
  const [row] = await sql`DELETE FROM pan.coupons WHERE id = ${id} RETURNING id`;
  return NextResponse.json({ ok: true, deleted: row?.id ?? null });
}

// Dar de alta un establecimiento del pan
export async function POST(req: NextRequest) {
  if (!(await verifyRequestSession(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name, city, staff_whatsapp, coupon_limit } = await req.json().catch(() => ({}));
  if (!name?.trim()) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
  const slug = (name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) || `local-${Date.now()}`;
  const sql = getDb();
  const [loc] = await sql`
    INSERT INTO pan.locations (slug, name, city, staff_whatsapp, coupon_limit, is_active)
    VALUES (${slug}, ${name.trim()}, ${city?.trim() || null}, ${staff_whatsapp?.trim() || null}, ${coupon_limit || 50}, true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, city = EXCLUDED.city, staff_whatsapp = EXCLUDED.staff_whatsapp, coupon_limit = EXCLUDED.coupon_limit
    RETURNING id, name
  `;
  return NextResponse.json({ ok: true, location: loc }, { status: 201 });
}
