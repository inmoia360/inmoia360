import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCampaign } from '@/lib/campaign';
import { generateCouponCode } from '@/lib/coupon';
import { sendCouponWhatsApp, sendBarStaffNotification, normalizeSpanishPhone } from '@/lib/whatsapp';

export const runtime = 'nodejs';

function isValidPhone(phone: string): boolean {
  return /^[+\d\s\-()]{7,20}$/.test(phone.trim());
}

// Texto/emoji de canje por campaña (para el WhatsApp y el aviso al local)
function campaignWa(slug: string) {
  if (slug === 'dailybread') {
    return {
      emoji: '🥖',
      redeemText: 'Muéstralo en la panadería o quesería y disfruta 🧀🥖',
    };
  }
  return { emoji: '☕', redeemText: 'Muéstraselo al camarero en el bar y disfruta ☕' };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const campaign = await getCampaign(slug);
  if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const { lead_name, lead_phone, source_url, bar_name } = body;

  if (!lead_name?.trim()) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
  if (!lead_phone?.trim() || !isValidPhone(lead_phone)) return NextResponse.json({ error: 'WhatsApp inválido' }, { status: 400 });

  const phone = normalizeSpanishPhone(lead_phone.trim());
  const derived_email = `${phone}@wa.${campaign.client_slug}`;

  const sql = getDb();

  // Un solo cupón válido por número cada N días, dentro de ESTA campaña
  const existing = await sql`
    SELECT id, coupon_code, created_at FROM marketing_pilot.coffee_coupons
    WHERE lead_phone = ${phone}
      AND campaign_id = ${campaign.id}
      AND created_at >= NOW() - (${campaign.expires_days} || ' days')::interval
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (existing.length > 0) {
    const nextAvailable = new Date(existing[0].created_at);
    nextAvailable.setDate(nextAvailable.getDate() + campaign.expires_days);
    return NextResponse.json({
      coupon_id: existing[0].id,
      coupon_code: existing[0].coupon_code,
      already_claimed: true,
      next_available: nextAvailable.toISOString(),
    });
  }

  // Resolver local — preferir bar_name del formulario, si no el primero activo de la campaña
  type BarRow = { id: number; name: string; staff_whatsapp: string | null; coupon_limit: number };
  let resolvedBar: BarRow | null = null;
  if (bar_name?.trim()) {
    const byName = await sql`
      SELECT id, name, staff_whatsapp, coupon_limit
      FROM marketing_pilot.bars
      WHERE name = ${bar_name.trim()} AND is_active = true AND campaign_id = ${campaign.id}
      LIMIT 1
    `;
    resolvedBar = (byName[0] as BarRow) ?? null;
  }
  if (!resolvedBar) {
    const def = await sql`
      SELECT id, name, staff_whatsapp, coupon_limit
      FROM marketing_pilot.bars
      WHERE is_active = true AND campaign_id = ${campaign.id} ORDER BY id LIMIT 1
    `;
    resolvedBar = (def[0] as BarRow) ?? null;
  }
  const resolvedBarId: number | null = resolvedBar?.id ?? null;

  // Límite mensual del local
  if (resolvedBar) {
    const [{ count: usedCount }] = await sql`
      SELECT COUNT(*)::int AS count
      FROM marketing_pilot.coffee_coupons
      WHERE bar_id = ${resolvedBar.id}
        AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
    `;
    if (usedCount >= resolvedBar.coupon_limit) {
      return NextResponse.json(
        { error: `Lo sentimos, ${resolvedBar.name} ha alcanzado el límite de ${campaign.product_label} de este mes (${resolvedBar.coupon_limit}). ¡Hasta el mes que viene!` },
        { status: 409 }
      );
    }
  }

  const coupon_code = generateCouponCode();
  const expires_at = new Date(Date.now() + campaign.expires_days * 86_400_000).toISOString();

  const [coupon] = await sql`
    INSERT INTO marketing_pilot.coffee_coupons
      (coupon_code, lead_name, lead_email, lead_phone, source_url, bar_id, campaign_id, status, claimed_at, expires_at)
    VALUES
      (${coupon_code}, ${lead_name.trim()}, ${derived_email},
       ${phone}, ${source_url ?? null}, ${resolvedBarId}, ${campaign.id}, 'generated',
       NOW(), ${expires_at})
    RETURNING id, coupon_code, expires_at
  `;

  await sql`
    INSERT INTO marketing_pilot.coffee_coupon_events (coupon_id, campaign_id, event_type, metadata)
    VALUES (${coupon.id}, ${campaign.id}, 'coupon_generated', ${JSON.stringify({ source_url: source_url ?? null })}::jsonb)
  `;

  const wa = campaignWa(slug);
  // plantilla WhatsApp por campaña: WHATSAPP_TEMPLATE_NAME_<SLUG>; el café usa su env clásica
  const tplEnv = process.env[`WHATSAPP_TEMPLATE_NAME_${slug.toUpperCase()}`]?.trim();
  const templateName = tplEnv ?? (slug === 'dailycoffee' ? undefined : 'hello_world');

  await sendCouponWhatsApp(phone, lead_name.trim(), coupon_code, {
    templateName,
    productLabel: campaign.product_label,
    redeemText: wa.redeemText,
  }).catch(e => console.error('[WA] send error', e));

  if (resolvedBar?.staff_whatsapp) {
    try {
      const [{ count: newCount }] = await sql`
        SELECT COUNT(*)::int AS count
        FROM marketing_pilot.coffee_coupons
        WHERE bar_id = ${resolvedBar.id}
          AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
      `;
      await sendBarStaffNotification(
        resolvedBar.staff_whatsapp, resolvedBar.name, lead_name.trim(),
        coupon_code, newCount, resolvedBar.coupon_limit,
        { productLabel: campaign.product_label, emoji: wa.emoji },
      );
    } catch (e) {
      console.error('[WA staff] error', e);
    }
  }

  return NextResponse.json({ coupon_id: coupon.id, coupon_code: coupon.coupon_code, expires_at: coupon.expires_at }, { status: 201 });
}
