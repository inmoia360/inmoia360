import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateCouponCode, COUPON_EXPIRES_DAYS } from '@/lib/coupon';
import { sendCouponWhatsApp, sendBarStaffNotification, normalizeSpanishPhone } from '@/lib/whatsapp';
import { ensureConsentColumns } from '@/lib/ensure-consent';

export const runtime = 'nodejs';

// Registro del PAN sobre su esquema propio "pan" (separado del cafe).
function isValidPhone(phone: string): boolean {
  return /^[+\d\s\-()]{7,20}$/.test(phone.trim());
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { lead_name, lead_phone, source_url, bar_name } = body;
  const consentMarketing = body.consent_marketing === true;

  if (!lead_name?.trim()) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
  if (!lead_phone?.trim() || !isValidPhone(lead_phone)) return NextResponse.json({ error: 'WhatsApp inválido' }, { status: 400 });

  const phone = normalizeSpanishPhone(lead_phone.trim());
  const derived_email = `${phone}@wa.delagala`;
  const sql = getDb();
  await ensureConsentColumns();

  // Un solo cupón por número cada 30 días (solo tabla del pan)
  const existing = await sql`
    SELECT id, coupon_code, created_at FROM pan.coupons
    WHERE lead_phone = ${phone}
      AND created_at >= NOW() - INTERVAL '30 days'
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (existing.length > 0) {
    const nextAvailable = new Date(existing[0].created_at);
    nextAvailable.setDate(nextAvailable.getDate() + 30);
    return NextResponse.json({
      coupon_id: existing[0].id,
      coupon_code: existing[0].coupon_code,
      already_claimed: true,
      next_available: nextAvailable.toISOString(),
    });
  }

  // Resolver local del pan
  type LocRow = { id: number; name: string; staff_whatsapp: string | null; coupon_limit: number };
  let loc: LocRow | null = null;
  if (bar_name?.trim()) {
    const byName = await sql`
      SELECT id, name, staff_whatsapp, coupon_limit FROM pan.locations
      WHERE name = ${bar_name.trim()} AND is_active = true LIMIT 1
    `;
    loc = (byName[0] as LocRow) ?? null;
  }
  if (!loc) {
    const def = await sql`
      SELECT id, name, staff_whatsapp, coupon_limit FROM pan.locations
      WHERE is_active = true ORDER BY id LIMIT 1
    `;
    loc = (def[0] as LocRow) ?? null;
  }
  const locId: number | null = loc?.id ?? null;

  if (loc) {
    const [{ count: used }] = await sql`
      SELECT COUNT(*)::int AS count FROM pan.coupons
      WHERE location_id = ${loc.id}
        AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
    `;
    if (used >= loc.coupon_limit) {
      return NextResponse.json(
        { error: `Lo sentimos, ${loc.name} ha alcanzado el límite de pan de este mes (${loc.coupon_limit}). ¡Hasta el mes que viene!` },
        { status: 409 }
      );
    }
  }

  const coupon_code = generateCouponCode();
  const expires_at = new Date(Date.now() + COUPON_EXPIRES_DAYS * 86_400_000).toISOString();

  const [coupon] = await sql`
    INSERT INTO pan.coupons
      (coupon_code, lead_name, lead_email, lead_phone, source_url, location_id, consent_marketing, status, claimed_at, expires_at)
    VALUES
      (${coupon_code}, ${lead_name.trim()}, ${derived_email}, ${phone}, ${source_url ?? null}, ${locId}, ${consentMarketing}, 'generated', NOW(), ${expires_at})
    RETURNING id, coupon_code, expires_at
  `;

  await sql`
    INSERT INTO pan.coupon_events (coupon_id, event_type, metadata)
    VALUES (${coupon.id}, 'coupon_generated', ${JSON.stringify({ source_url: source_url ?? null })}::jsonb)
  `;

  // FIX urgente: la plantilla del pan (DAILYBREAD) no entrega. Usamos la del
  // café (WHATSAPP_TEMPLATE_NAME), que está aprobada y funciona, como respaldo.
  const templateName =
    (process.env.WHATSAPP_TEMPLATE_NAME ?? '').trim() ||
    (process.env.WHATSAPP_TEMPLATE_NAME_DAILYBREAD ?? '').trim() ||
    'hello_world';
  await sendCouponWhatsApp(phone, lead_name.trim(), coupon_code, {
    templateName,
    productLabel: 'pan',
    redeemText: 'Muéstralo en la panadería y disfruta 🥖',
  }).catch(e => console.error('[WA pan] send error', e));

  if (loc?.staff_whatsapp) {
    try {
      const [{ count: newCount }] = await sql`
        SELECT COUNT(*)::int AS count FROM pan.coupons
        WHERE location_id = ${loc.id}
          AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
      `;
      await sendBarStaffNotification(loc.staff_whatsapp, loc.name, lead_name.trim(), coupon_code, newCount, loc.coupon_limit, { productLabel: 'pan', emoji: '🥖' });
    } catch (e) { console.error('[WA pan staff] error', e); }
  }

  return NextResponse.json({ coupon_id: coupon.id, coupon_code: coupon.coupon_code, expires_at: coupon.expires_at }, { status: 201 });
}
