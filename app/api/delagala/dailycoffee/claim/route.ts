import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateCouponCode, COUPON_EXPIRES_DAYS } from '@/lib/coupon';
import { sendCouponWhatsApp } from '@/lib/whatsapp';

export const runtime = 'nodejs';

function isValidPhone(phone: string): boolean {
  return /^[+\d\s\-()]{7,20}$/.test(phone.trim());
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { lead_name, lead_phone, source_url } = body;

  if (!lead_name?.trim()) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
  if (!lead_phone?.trim() || !isValidPhone(lead_phone)) return NextResponse.json({ error: 'WhatsApp inválido' }, { status: 400 });

  const phone = lead_phone.trim();
  // Use phone as unique key; store a derived placeholder in the email column (NOT NULL in DB)
  const derived_email = `${phone.replace(/[^0-9]/g, '')}@wa.delagala`;

  const sql = getDb();

  // Deduplicate by phone
  const existing = await sql`
    SELECT id, coupon_code FROM marketing_pilot.coffee_coupons
    WHERE lead_phone = ${phone}
    LIMIT 1
  `;
  if (existing.length > 0) {
    return NextResponse.json({ coupon_id: existing[0].id, coupon_code: existing[0].coupon_code, already_claimed: true });
  }

  // Resolve bar
  const defaultBar = await sql`
    SELECT id FROM marketing_pilot.bars WHERE is_active = true ORDER BY id LIMIT 1
  `;
  const resolvedBarId: number | null = defaultBar[0]?.id ?? null;

  const coupon_code = generateCouponCode();
  const expires_at = new Date(Date.now() + COUPON_EXPIRES_DAYS * 86_400_000).toISOString();

  const [coupon] = await sql`
    INSERT INTO marketing_pilot.coffee_coupons
      (coupon_code, lead_name, lead_email, lead_phone, source_url, bar_id, status, claimed_at, expires_at)
    VALUES
      (${coupon_code}, ${lead_name.trim()}, ${derived_email},
       ${phone}, ${source_url ?? null}, ${resolvedBarId}, 'generated',
       NOW(), ${expires_at})
    RETURNING id, coupon_code, expires_at
  `;

  await sql`
    INSERT INTO marketing_pilot.coffee_coupon_events (coupon_id, event_type, metadata)
    VALUES (${coupon.id}, 'coupon_generated', ${JSON.stringify({ source_url: source_url ?? null })}::jsonb)
  `;

  // Send WhatsApp message with the coupon code (fire-and-forget)
  sendCouponWhatsApp(phone, lead_name.trim(), coupon_code).catch(e =>
    console.error('[WA] send error', e)
  );

  return NextResponse.json({ coupon_id: coupon.id, coupon_code: coupon.coupon_code, expires_at: coupon.expires_at }, { status: 201 });
}
