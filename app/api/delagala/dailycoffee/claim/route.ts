import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateCouponCode, COUPON_EXPIRES_DAYS } from '@/lib/coupon';
import { sendCouponWhatsApp, sendBarStaffNotification, normalizeSpanishPhone } from '@/lib/whatsapp';
import { ensureConsentColumns } from '@/lib/ensure-consent';
import { forwardLeadToOs } from '@/lib/os-bridge';

export const runtime = 'nodejs';

function isValidPhone(phone: string): boolean {
  return /^[+\d\s\-()]{7,20}$/.test(phone.trim());
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { lead_name, lead_phone, source_url, bar_name } = body;
  const consentMarketing = body.consent_marketing === true;

  if (!lead_name?.trim()) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
  if (!lead_phone?.trim() || !isValidPhone(lead_phone)) return NextResponse.json({ error: 'WhatsApp inválido' }, { status: 400 });

  // Normalizar teléfono: +34680648795 y 680648795 → mismo número
  const phone = normalizeSpanishPhone(lead_phone.trim());
  const derived_email = `${phone}@wa.delagala`;

  const sql = getDb();
  await ensureConsentColumns();

  // Un solo cupón válido por número cada 30 días
  const existing = await sql`
    SELECT id, coupon_code, created_at FROM marketing_pilot.coffee_coupons
    WHERE lead_phone = ${phone}
      AND campaign_id = (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailycoffee')
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

  // Resolve bar — prefer bar_name sent by the form, fall back to first active bar
  type BarRow = { id: number; name: string; staff_whatsapp: string | null; coupon_limit: number };
  let resolvedBar: BarRow | null = null;
  if (bar_name?.trim()) {
    const barByName = await sql`
      SELECT id, name, staff_whatsapp, coupon_limit
      FROM marketing_pilot.bars
      WHERE name = ${bar_name.trim()} AND is_active = true
        AND campaign_id = (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailycoffee')
      LIMIT 1
    `;
    resolvedBar = (barByName[0] as BarRow) ?? null;
  }
  if (!resolvedBar) {
    const defaultBar = await sql`
      SELECT id, name, staff_whatsapp, coupon_limit
      FROM marketing_pilot.bars
      WHERE is_active = true
        AND campaign_id = (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailycoffee')
      ORDER BY id LIMIT 1
    `;
    resolvedBar = (defaultBar[0] as BarRow) ?? null;
  }
  const resolvedBarId: number | null = resolvedBar?.id ?? null;

  // Comprueba límite mensual del bar
  if (resolvedBar) {
    const [{ count: usedCount }] = await sql`
      SELECT COUNT(*)::int AS count
      FROM marketing_pilot.coffee_coupons
      WHERE bar_id = ${resolvedBar.id}
        AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
    `;
    if (usedCount >= resolvedBar.coupon_limit) {
      return NextResponse.json(
        { error: `Lo sentimos, el bar ${resolvedBar.name} ha alcanzado el límite de cafés de este mes (${resolvedBar.coupon_limit}). ¡Hasta el mes que viene!` },
        { status: 409 }
      );
    }
  }

  const coupon_code = generateCouponCode();
  const expires_at = new Date(Date.now() + COUPON_EXPIRES_DAYS * 86_400_000).toISOString();

  const [coupon] = await sql`
    INSERT INTO marketing_pilot.coffee_coupons
      (coupon_code, lead_name, lead_email, lead_phone, source_url, bar_id, consent_marketing, campaign_id, status, claimed_at, expires_at)
    VALUES
      (${coupon_code}, ${lead_name.trim()}, ${derived_email},
       ${phone}, ${source_url ?? null}, ${resolvedBarId}, ${consentMarketing},
       (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailycoffee'), 'generated',
       NOW(), ${expires_at})
    RETURNING id, coupon_code, expires_at
  `;

  await sql`
    INSERT INTO marketing_pilot.coffee_coupon_events (coupon_id, campaign_id, event_type, metadata)
    VALUES (${coupon.id}, (SELECT id FROM marketing_pilot.campaigns WHERE slug = 'dailycoffee'), 'coupon_generated', ${JSON.stringify({ source_url: source_url ?? null })}::jsonb)
  `;

  // Al DELAgala OS solo si marcó la casilla de info inmobiliaria (segmento B).
  // Best-effort: el cupón ya está guardado; si el OS no responde no pasa nada.
  if (consentMarketing) {
    await forwardLeadToOs({
      ownerIntent: 'INTERES INMOBILIARIO (consintió info en campaña café)',
      address: 'Sin dirección (campaña café)',
      name: lead_name.trim(),
      phone,
      landing_path: '/delagala/dailycoffee',
      utm_source: 'dailycoffee',
      angle: 'cupon-cafe-consent',
      referrer: source_url ?? undefined,
    });
  }

  // Enviar WhatsApp al cliente — awaited para que Vercel no corte la función antes
  await sendCouponWhatsApp(phone, lead_name.trim(), coupon_code).catch(e =>
    console.error('[WA] send error', e)
  );

  // Notificación al camarero — awaited igualmente
  if (resolvedBar?.staff_whatsapp) {
    try {
      const [{ count: newCount }] = await sql`
        SELECT COUNT(*)::int AS count
        FROM marketing_pilot.coffee_coupons
        WHERE bar_id = ${resolvedBar.id}
          AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
      `;
      await sendBarStaffNotification(
        resolvedBar.staff_whatsapp,
        resolvedBar.name,
        lead_name.trim(),
        coupon_code,
        newCount,
        resolvedBar.coupon_limit,
      );
    } catch (e) {
      console.error('[WA staff] error', e);
    }
  }

  return NextResponse.json({ coupon_id: coupon.id, coupon_code: coupon.coupon_code, expires_at: coupon.expires_at }, { status: 201 });
}
