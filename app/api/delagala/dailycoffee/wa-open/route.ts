import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { coupon_id } = await request.json().catch(() => ({}));
  if (!coupon_id || typeof coupon_id !== 'number') {
    return NextResponse.json({ error: 'coupon_id required' }, { status: 400 });
  }

  const sql = getDb();
  const exists = await sql`
    SELECT id FROM marketing_pilot.coffee_coupons WHERE id = ${coupon_id} LIMIT 1
  `;
  if (!exists.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await sql`
    INSERT INTO marketing_pilot.coffee_coupon_events (coupon_id, event_type, metadata)
    VALUES (${coupon_id}, 'wa_link_opened', '{}'::jsonb)
    ON CONFLICT DO NOTHING
  `;

  return NextResponse.json({ ok: true });
}
