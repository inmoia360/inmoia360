import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateCouponCode, COUPON_EXPIRES_DAYS } from '@/lib/coupon';
import type { ClaimPayload } from '@/lib/types';

export const runtime = 'nodejs';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  return /^[+\d\s\-()]{7,20}$/.test(phone.trim());
}

export async function POST(request: NextRequest) {
  const body: ClaimPayload = await request.json().catch(() => ({}));
  const { lead_name, lead_email, lead_phone, bar_id, source_url } = body;

  // Validate
  if (!lead_name?.trim()) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
  if (!lead_email?.trim() || !isValidEmail(lead_email)) return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  if (!lead_phone?.trim() || !isValidPhone(lead_phone)) return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400 });

  const sql = getDb();

  // Prevent duplicate — one coupon per email
  const existing = await sql`
    SELECT coupon_code FROM marketing_pilot.coffee_coupons
    WHERE lead_email = ${lead_email.toLowerCase().trim()}
    LIMIT 1
  `;
  if (existing.length > 0) {
    return NextResponse.json({ coupon_code: existing[0].coupon_code, already_claimed: true });
  }

  // Resolve bar
  let resolvedBarId: number | null = bar_id ?? null;
  if (!resolvedBarId) {
    const defaultBar = await sql`
      SELECT id FROM marketing_pilot.bars WHERE is_active = true ORDER BY id LIMIT 1
    `;
    resolvedBarId = defaultBar[0]?.id ?? null;
  }

  const coupon_code = generateCouponCode();
  const expires_at = new Date(Date.now() + COUPON_EXPIRES_DAYS * 86_400_000).toISOString();

  const [coupon] = await sql`
    INSERT INTO marketing_pilot.coffee_coupons
      (coupon_code, lead_name, lead_email, lead_phone, source_url, bar_id, status, claimed_at, expires_at)
    VALUES
      (${coupon_code}, ${lead_name.trim()}, ${lead_email.toLowerCase().trim()},
       ${lead_phone.trim()}, ${source_url ?? null}, ${resolvedBarId}, 'generated',
       NOW(), ${expires_at})
    RETURNING id, coupon_code, expires_at
  `;

  // Log event
  await sql`
    INSERT INTO marketing_pilot.coffee_coupon_events (coupon_id, event_type, metadata)
    VALUES (${coupon.id}, 'coupon_generated', ${JSON.stringify({ source_url: source_url ?? null })}::jsonb)
  `;

  return NextResponse.json({ coupon_code: coupon.coupon_code, expires_at: coupon.expires_at }, { status: 201 });
}
