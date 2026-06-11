import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

function checkAuth(req: NextRequest) {
  const pwd = req.headers.get('x-admin-password');
  return pwd === process.env.DAILYCOFFEE_ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getDb();

  const [coupons, bars, statsRows] = await Promise.all([
    sql`
      SELECT c.id, c.lead_name, c.lead_phone, c.coupon_code, c.status, c.created_at,
             b.name AS bar_name
      FROM marketing_pilot.coffee_coupons c
      LEFT JOIN marketing_pilot.bars b ON b.id = c.bar_id
      WHERE c.campaign_id = (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailycoffee')
      ORDER BY c.created_at DESC
      LIMIT 200
    `,
    sql`
      SELECT id, name, slug, staff_whatsapp, coupon_limit, is_active,
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

  return NextResponse.json({ coupons, bars, stats: statsRows[0] });
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { bar_id, staff_whatsapp, coupon_limit, is_active, name } = body;
  if (!bar_id) return NextResponse.json({ error: 'bar_id requerido' }, { status: 400 });

  const sql = getDb();
  const [bar] = await sql`
    UPDATE marketing_pilot.bars
    SET
      name           = COALESCE(${name ?? null}, name),
      staff_whatsapp = COALESCE(${staff_whatsapp ?? null}, staff_whatsapp),
      coupon_limit   = COALESCE(${coupon_limit ?? null}, coupon_limit),
      is_active      = COALESCE(${is_active ?? null}, is_active)
    WHERE id = ${bar_id}
    RETURNING id, name, staff_whatsapp, coupon_limit, is_active
  `;
  return NextResponse.json(bar);
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, staff_whatsapp, coupon_limit } = body;
  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const sql = getDb();
  const [bar] = await sql`
    INSERT INTO marketing_pilot.bars (slug, name, staff_whatsapp, coupon_limit, is_active, campaign_id)
    VALUES (${slug}, ${name.trim()}, ${staff_whatsapp ?? null}, ${coupon_limit ?? 50}, true,
            (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailycoffee'))
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, name, staff_whatsapp, coupon_limit, is_active
  `;
  return NextResponse.json(bar, { status: 201 });
}
